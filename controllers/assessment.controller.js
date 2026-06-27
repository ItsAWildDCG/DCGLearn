const db = require('../data/database');

const checkTeacherOwnership = async (client, assessmentId, instructorId) => {
    const sql = 'SELECT instructor_id FROM "Assessment" a JOIN "Course" c ON a.course_id = c.course_id WHERE a.assessment_id = $1';
    const res = await client.query(sql, [assessmentId]);
    return res.rows.length > 0 && res.rows[0].instructor_id === instructorId;
};

// 1. Lấy tất cả bài tập (Danh sách tổng quát)
exports.getAllAssessments = async (req, res) => {
    try {
        const sql = 'SELECT * FROM "Assessment" ORDER BY created_at DESC';
        const result = await db.query(sql);
        res.json(result.rows);
    } catch (error) {
        console.error("Lỗi lấy danh sách bài thi:", error);
        res.status(500).json({ message: "Lỗi lấy danh sách bài thi từ Database." });
    }
};

// 2. Lấy CHI TIẾT bài tập kèm CÂU HỎI ĐÃ XÁO TRỘN (Học sinh làm bài)
exports.getAssessmentDetails = async (req, res) => {
    try {
        const { id } = req.params;

        const assessmentResult = await db.query('SELECT * FROM "Assessment" WHERE assessment_id = $1', [id]);
        if (assessmentResult.rows.length === 0) return res.status(404).json({ message: "Không tìm thấy bài thi." });

        const assessment = assessmentResult.rows[0];

        const questionsSql = 'SELECT * FROM "Question" WHERE assessment_id = $1 ORDER BY RANDOM()';
        const questionsResult = await db.query(questionsSql, [id]);
        const questions = questionsResult.rows;

        for (let q of questions) {
            // Cố tình KHÔNG lấy cột is_correct ra để tránh học sinh soi mã nguồn F12 thấy đáp án
            const optionsSql = 'SELECT option_id, option_text FROM "Option" WHERE question_id = $1 ORDER BY RANDOM()';
            const optionsResult = await db.query(optionsSql, [q.question_id]);
            q.options = optionsResult.rows;
        }

        res.json({ ...assessment, questions });
    } catch (error) {
        console.error("Lỗi lấy chi tiết đề thi:", error);
        res.status(500).json({ message: "Lỗi hệ thống khi tải đề thi." });
    }
};

// 3. Giáo viên tạo bài tập mới
exports.createAssessment = async (req, res) => {
    const client = await db.getClient();
    try {
        const { courseId, title, description, timeLimit, questions } = req.body;

        await client.query('BEGIN');

        // A. Lưu thông tin bài tập
        const assessmentSql = `
            INSERT INTO "Assessment" (course_id, title, description, time_limit, created_at)
            VALUES ($1, $2, $3, $4, CURRENT_DATE) RETURNING assessment_id
        `;
        const assessmentRes = await client.query(assessmentSql, [courseId, title, description, timeLimit]);
        const assessmentId = assessmentRes.rows[0].assessment_id;

        // B. Lưu từng câu hỏi và lựa chọn
        for (let q of questions) {
            const questionSql = `
                INSERT INTO "Question" (assessment_id, question_text, question_type)
                VALUES ($1, $2, $3) RETURNING question_id
            `;
            const questionRes = await client.query(questionSql, [assessmentId, q.text, q.type]);
            const questionId = questionRes.rows[0].question_id;

            for (let opt of q.options) {
                const optionSql = `
                    INSERT INTO "Option" (question_id, option_text, is_correct)
                    VALUES ($1, $2, $3)
                `;
                await client.query(optionSql, [questionId, opt.text, opt.isCorrect]);
            }
        }

        await client.query('COMMIT');
        res.status(201).json({ message: "Tạo bài thi thành công!", assessmentId });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error("Lỗi tạo bài thi:", error);
        res.status(500).json({ message: "Lỗi hệ thống khi tạo bài thi." });
    } finally {
        client.release();
    }
};

// 4. Học sinh nộp bài và tự động chấm điểm (Tích hợp bảng SubmissionAnswer)
exports.submitAssessment = async (req, res) => {
    const client = await db.getClient();
    try {
        const { assessmentId } = req.params;
        const { studentId, answers } = req.body; 
        // answers có dạng mảng: [{ questionId: 1, optionId: 5 }, { questionId: 2, optionId: 9 }]

        await client.query('BEGIN');

        // Bước 1: Chấm điểm (Lấy các đáp án đúng của bài thi này lên để đối chiếu)
        const correctOptionsRes = await client.query(`
            SELECT o.question_id, o.option_id 
            FROM "Option" o
            JOIN "Question" q ON o.question_id = q.question_id
            WHERE q.assessment_id = $1 AND o.is_correct = true
        `, [assessmentId]);
        
        const correctOptions = correctOptionsRes.rows;
        let correctCount = 0;
        let totalQuestions = correctOptions.length;

        // Đếm số câu đúng
        answers.forEach(studentAns => {
            const isMatch = correctOptions.some(
                correct => correct.question_id === studentAns.questionId && correct.option_id === studentAns.optionId
            );
            if (isMatch) correctCount++;
        });

        // Tính điểm hệ số 10
        const score = totalQuestions > 0 ? (correctCount / totalQuestions) * 10 : 0;

        // Bước 2: Lưu vào bảng Submission
        const submissionSql = `
            INSERT INTO "Submission" (assessment_id, student_id, score, submitted_at)
            VALUES ($1, $2, $3, CURRENT_DATE) RETURNING submission_id
        `;
        const submissionRes = await client.query(submissionSql, [assessmentId, studentId, score]);
        const submissionId = submissionRes.rows[0].submission_id;

        // Bước 3: Lưu chi tiết từng câu trả lời vào bảng SubmissionAnswer
        for (let ans of answers) {
            const ansSql = `
                INSERT INTO "SubmissionAnswer" (submission_id, question_id, option_id)
                VALUES ($1, $2, $3)
            `;
            await client.query(ansSql, [submissionId, ans.questionId, ans.optionId]);
        }

        await client.query('COMMIT');
        res.status(201).json({ message: "Nộp bài thành công!", score: score, correctAnswers: correctCount });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error("Lỗi nộp bài:", error);
        res.status(500).json({ message: "Lỗi hệ thống khi nộp bài." });
    } finally {
        client.release();
    }
};

// 5. Cập nhật thông tin chung của bài thi
exports.updateAssessment = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, timeLimit } = req.body;
        const instructorId = req.user.userId;

        // KIỂM TRA QUYỀN SỞ HỮU: Giáo viên có sở hữu Course chứa Assessment này không?
        const authSql = `
            SELECT c.instructor_id 
            FROM "Assessment" a
            JOIN "Course" c ON a.course_id = c.course_id
            WHERE a.assessment_id = $1
        `;
        const authRes = await db.query(authSql, [id]);

        if (authRes.rows.length === 0) return res.status(404).json({ message: "Không tìm thấy bài thi." });
        if (authRes.rows[0].instructor_id !== instructorId) {
            return res.status(403).json({ message: "Bạn không có quyền chỉnh sửa bài thi này!" });
        }

        const sql = `
            UPDATE "Assessment" 
            SET title = $1, description = $2, time_limit = $3 
            WHERE assessment_id = $4 RETURNING *
        `;
        const result = await db.query(sql, [title, description, timeLimit, id]);

        if (result.rows.length === 0) return res.status(404).json({ message: "Không tìm thấy bài thi." });

        res.json({ message: "Cập nhật bài thi thành công!", assessment: result.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Lỗi khi cập nhật bài thi." });
    }
};

// 6. Xóa bài thi (Thứ tự Xóa này cam kết 100% không dính lỗi Ràng buộc khóa ngoại)
exports.deleteAssessment = async (req, res) => {
    const client = await db.getClient();
    try {
        const { id } = req.params;
        const instructorId = req.user.userId;

        // KIỂM TRA QUYỀN SỞ HỮU: Giáo viên có sở hữu Course chứa Assessment này không?
        const authSql = `
            SELECT c.instructor_id 
            FROM "Assessment" a
            JOIN "Course" c ON a.course_id = c.course_id
            WHERE a.assessment_id = $1
        `;
        const authRes = await db.query(authSql, [id]);

        if (authRes.rows.length === 0) return res.status(404).json({ message: "Không tìm thấy bài thi." });
        if (authRes.rows[0].instructor_id !== instructorId) {
            return res.status(403).json({ message: "Bạn không có quyền xóa bài thi này!" });
        }

        await client.query('BEGIN');

        // Phải xóa từ các nhánh con nhỏ nhất ngược lên trên:
        
        // A. Xóa SubmissionAnswer (Câu trả lời của học sinh)
        await client.query(`
            DELETE FROM "SubmissionAnswer" 
            WHERE submission_id IN (SELECT submission_id FROM "Submission" WHERE assessment_id = $1)
        `, [id]);

        // B. Xóa Submission (Lịch sử nộp bài)
        await client.query('DELETE FROM "Submission" WHERE assessment_id = $1', [id]);

        // C. Xóa Option (Các lựa chọn A, B, C, D)
        await client.query(`
            DELETE FROM "Option" 
            WHERE question_id IN (SELECT question_id FROM "Question" WHERE assessment_id = $1)
        `, [id]);

        // D. Xóa Question (Các câu hỏi)
        await client.query('DELETE FROM "Question" WHERE assessment_id = $1', [id]);

        // E. Cuối cùng, Xóa Assessment (Gốc của bài thi)
        const result = await client.query('DELETE FROM "Assessment" WHERE assessment_id = $1', [id]);

        if (result.rowCount === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: "Không tìm thấy bài thi để xóa." });
        }

        await client.query('COMMIT');
        res.json({ message: "Đã xóa bài thi và toàn bộ lịch sử làm bài thành công!" });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error("Lỗi xóa bài thi:", error);
        res.status(500).json({ message: "Lỗi hệ thống khi xóa bài thi." });
    } finally {
        client.release();
    }
};

// 7. Giáo viên xem chi tiết toàn bộ đề thi và ĐÁP ÁN ĐÚNG
exports.getAssessmentQuestionsForTeacher = async (req, res) => {
    try {
        const { id } = req.params;

        // Dùng LEFT JOIN để lấy câu hỏi kèm theo tất cả đáp án của nó
        const sql = `
            SELECT 
                q.question_id, q.question_text, q.question_type,
                o.option_id, o.option_text, o.is_correct
            FROM "Question" q
            LEFT JOIN "Option" o ON q.question_id = o.question_id
            WHERE q.assessment_id = $1
            ORDER BY q.question_id ASC, o.option_id ASC
        `;
        
        const result = await db.query(sql, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Không tìm thấy câu hỏi nào cho bài thi này." });
        }

        // Nhóm các options vào từng question một cách gọn gàng
        const questionsMap = {};
        
        result.rows.forEach(row => {
            if (!questionsMap[row.question_id]) {
                questionsMap[row.question_id] = {
                    questionId: row.question_id,
                    text: row.question_text,
                    type: row.question_type,
                    options: []
                };
            }
            
            if (row.option_id) {
                questionsMap[row.question_id].options.push({
                    optionId: row.option_id,
                    text: row.option_text,
                    isCorrect: row.is_correct // Giáo viên ĐƯỢC PHÉP xem cột này
                });
            }
        });

        const questions = Object.values(questionsMap);

        res.json({
            assessmentId: parseInt(id),
            totalQuestions: questions.length,
            questions: questions
        });
        
    } catch (error) {
        console.error("Lỗi lấy danh sách câu hỏi cho giáo viên:", error);
        res.status(500).json({ message: "Lỗi hệ thống khi lấy dữ liệu." });
    }
};


// 8. Giảng viên thêm câu hỏi mới
exports.addQuestion = async (req, res) => {
    const client = await db.getClient();
    try {
        const { assessmentId } = req.params;
        const { text, type, options } = req.body;
        const instructorId = req.user.userId;

        if (!(await checkTeacherOwnership(client, assessmentId, instructorId))) {
            return res.status(403).json({ message: "Bạn không có quyền thêm câu hỏi vào bài thi này." });
        }

        await client.query('BEGIN');
        const qRes = await client.query(
            'INSERT INTO "Question" (assessment_id, question_text, question_type) VALUES ($1, $2, $3) RETURNING question_id',
            [assessmentId, text, type]
        );
        const questionId = qRes.rows[0].question_id;

        for (const opt of options) {
            await client.query('INSERT INTO "Option" (question_id, option_text, is_correct) VALUES ($1, $2, $3)',
                [questionId, opt.text, opt.isCorrect]);
        }
        await client.query('COMMIT');
        res.status(201).json({ message: "Thêm câu hỏi thành công!", questionId });
    } catch (error) {
        await client.query('ROLLBACK');
        res.status(500).json({ message: "Lỗi hệ thống khi thêm câu hỏi." });
    } finally {
        client.release();
    }
};

// 9. Giảng viên sửa câu hỏi
exports.updateQuestion = async (req, res) => {
    const client = await db.getClient();
    try {
        const { questionId } = req.params;
        const { text, options } = req.body;
        const instructorId = req.user.userId;

        // Kiểm tra quyền sở hữu qua questionId
        const authSql = `SELECT c.instructor_id, q.assessment_id FROM "Question" q JOIN "Assessment" a ON q.assessment_id = a.assessment_id JOIN "Course" c ON a.course_id = c.course_id WHERE q.question_id = $1`;
        const authRes = await client.query(authSql, [questionId]);
        if (authRes.rows.length === 0 || authRes.rows[0].instructor_id !== instructorId) {
            return res.status(403).json({ message: "Bạn không có quyền sửa câu hỏi này." });
        }

        // Kiểm tra xem đã có học sinh làm bài chưa
        const checkSql = 'SELECT COUNT(*) FROM "SubmissionAnswer" WHERE question_id = $1';
        const checkRes = await client.query(checkSql, [questionId]);
        if (parseInt(checkRes.rows[0].count) > 0) {
            return res.status(403).json({ message: "Không thể sửa! Đã có học sinh nộp bài." });
        }

        await client.query('BEGIN');
        await client.query('UPDATE "Question" SET question_text = $1 WHERE question_id = $2', [text, questionId]);
        await client.query('DELETE FROM "Option" WHERE question_id = $1', [questionId]);
        for (const opt of options) {
            await client.query('INSERT INTO "Option" (question_id, option_text, is_correct) VALUES ($1, $2, $3)', [questionId, opt.text, opt.isCorrect]);
        }
        await client.query('COMMIT');
        res.json({ message: "Cập nhật câu hỏi thành công!" });
    } catch (error) {
        await client.query('ROLLBACK');
        res.status(500).json({ message: "Lỗi hệ thống khi cập nhật." });
    } finally {
        client.release();
    }
};

// 10. Giảng viên xóa câu hỏi
exports.deleteQuestion = async (req, res) => {
    const client = await db.getClient();
    try {
        const { questionId } = req.params;
        const instructorId = req.user.userId;

        const authSql = `SELECT c.instructor_id FROM "Question" q JOIN "Assessment" a ON q.assessment_id = a.assessment_id JOIN "Course" c ON a.course_id = c.course_id WHERE q.question_id = $1`;
        const authRes = await client.query(authSql, [questionId]);
        if (authRes.rows.length === 0 || authRes.rows[0].instructor_id !== instructorId) {
            return res.status(403).json({ message: "Bạn không có quyền xóa câu hỏi này." });
        }

        const checkSql = 'SELECT COUNT(*) FROM "SubmissionAnswer" WHERE question_id = $1';
        const checkRes = await client.query(checkSql, [questionId]);
        if (parseInt(checkRes.rows[0].count) > 0) {
            return res.status(403).json({ message: "Không thể xóa! Đã có học sinh nộp bài." });
        }

        await client.query('BEGIN');
        await client.query('DELETE FROM "Option" WHERE question_id = $1', [questionId]);
        await client.query('DELETE FROM "Question" WHERE question_id = $1', [questionId]);
        await client.query('COMMIT');
        res.json({ message: "Đã xóa câu hỏi thành công!" });
    } catch (error) {
        await client.query('ROLLBACK');
        res.status(500).json({ message: "Lỗi hệ thống khi xóa." });
    } finally {
        client.release();
    }
};