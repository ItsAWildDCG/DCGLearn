const db = require('../data/database');

// 1. Học viên nộp bài làm (Tự động chấm điểm từ Database)
exports.submitAssignment = async (req, res) => {
    // Lấy một kết nối riêng từ Pool
    const client = await db.getClient();
    
    try {
        const { assessmentId, answers } = req.body;
        const studentId = req.user.userId;

        // BẮT ĐẦU TRANSACTION TRÊN CLIENT NÀY
        await client.query('BEGIN');

        const correctOptionsSql = `
            SELECT q.question_id, o.option_id, q.question_type
            FROM "Question" q
            JOIN "Option" o ON q.question_id = o.question_id
            WHERE q.assessment_id = $1 AND o.is_correct = true
        `;
        const correctResult = await client.query(correctOptionsSql, [assessmentId]);
        const correctMap = {};
        correctResult.rows.forEach(row => {
            if (!correctMap[row.question_id]) correctMap[row.question_id] = { type: row.question_type, correctIds: [] };
            correctMap[row.question_id].correctIds.push(row.option_id);
        });

        let correctCount = 0;
        const totalQuestions = Object.keys(correctMap).length;

        for (const qId in correctMap) {
            const studentAns = answers.find(a => a.questionId == qId);
            if (!studentAns) continue;

            const studentSelected = (studentAns.optionIds || []).sort().join(',');
            const correctOnes = correctMap[qId].correctIds.sort().join(',');

            if (studentSelected === correctOnes) {
                correctCount++;
            }
        }

        const score = totalQuestions > 0 ? (correctCount / totalQuestions) * 10 : 0;

        const subSql = `
            INSERT INTO "Submission" (assessment_id, student_id, score, submitted_at)
            VALUES ($1, $2, $3, CURRENT_TIMESTAMP) RETURNING submission_id
        `;
        const subRes = await client.query(subSql, [assessmentId, studentId, score]);
        const submissionId = subRes.rows[0].submission_id;

        for (const ans of answers) {
            for (const optId of ans.optionIds) {
                await client.query(
                    'INSERT INTO "SubmissionAnswer" (submission_id, question_id, option_id) VALUES ($1, $2, $3)',
                    [submissionId, ans.questionId, optId]
                );
            }
        }

        // Lấy dữ liệu để hiển thị review bài làm cho học viên
        const reviewSql = `
            SELECT q.question_id, q.question_text, q.question_type, o.option_id, o.option_text, o.is_correct
            FROM "Question" q
            JOIN "Option" o ON q.question_id = o.question_id
            WHERE q.assessment_id = $1
            ORDER BY q.question_id ASC, o.option_id ASC
        `;
        const reviewResult = await client.query(reviewSql, [assessmentId]);
        const reviewMap = {};
        reviewResult.rows.forEach(row => {
            if (!reviewMap[row.question_id]) {
                reviewMap[row.question_id] = {
                    question_id: row.question_id,
                    question_text: row.question_text,
                    question_type: row.question_type,
                    options: []
                };
            }
            reviewMap[row.question_id].options.push({
                option_id: row.option_id,
                option_text: row.option_text,
                is_correct: row.is_correct
            });
        });
        const reviewQuestions = Object.values(reviewMap);

        // HOÀN TẤT TRANSACTION
        await client.query('COMMIT');
        
        res.status(201).json({ 
            message: "Nộp bài thành công!", 
            score: score.toFixed(2),
            correct: correctCount,
            total: totalQuestions,
            reviewQuestions
        });
    } catch (error) {
        // NẾU LỖI THÌ ROLLBACK VÀ HỦY MỌI THAY ĐỔI
        await client.query('ROLLBACK');
        console.error("Lỗi nộp bài:", error);
        res.status(500).json({ message: "Lỗi hệ thống khi nộp bài." });
    } finally {
        // QUAN TRỌNG NHẤT: Trả lại kết nối cho Pool để người khác dùng
        client.release();
    }
};

// 2. Giảng viên lấy danh sách bài nộp của một bài tập
exports.getSubmissionsByAssessment = async (req, res) => {
    try {
        const { assessmentId } = req.params;
        const sql = `
            SELECT s.*, u.name as student_name
            FROM "Submission" s
            JOIN "User" u ON s.student_id = u.user_id
            WHERE s.assessment_id = $1
            ORDER BY s.submitted_at DESC
        `;
        const result = await db.query(sql, [assessmentId]);
        res.json({ submissions: result.rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Lỗi khi lấy danh sách bài nộp." });
    }
};

// 3. Giảng viên chấm điểm/nhận xét thủ công (nếu cần)
exports.gradeSubmission = async (req, res) => {
    try {
        const { submissionId } = req.params;
        const { score } = req.body;
        
        const sql = 'UPDATE "Submission" SET score = $1 WHERE submission_id = $2 RETURNING *';
        const result = await db.query(sql, [score, submissionId]);

        if (result.rows.length === 0) return res.status(404).json({ message: "Không tìm thấy bài làm." });

        res.json({ message: "Cập nhật điểm thành công!", submission: result.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Lỗi khi cập nhật điểm." });
    }
};