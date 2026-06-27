const db = require('../data/database');
const bcrypt = require('bcryptjs');

// 1. Lấy thông tin cá nhân của người dùng hiện tại
exports.getProfile = async (req, res) => {
    try {
        const userId = req.user.userId;
        const sql = `
            SELECT u.user_id, u.name, u.email, u.created_at, r.name as role_name
            FROM "User" u
            JOIN "Role" r ON u.role_id = r.role_id
            WHERE u.user_id = $1
        `;
        const result = await db.query(sql, [userId]);
        const user = result.rows[0];

        if (!user) return res.status(404).json({ message: "Không tìm thấy người dùng." });

        res.json({
            message: 'Lấy thông tin cá nhân thành công',
            user: {
                id: user.user_id,
                name: user.name,
                email: user.email,
                role: user.role_name
            }
        });
    } catch (error) {
        console.error("Lỗi lấy thông tin cá nhân:", error);
        res.status(500).json({ message: "Lỗi hệ thống khi lấy thông tin." });
    }
};

// 2. Lấy danh sách toàn bộ người dùng (Dành cho Admin)
exports.getAllUsers = async (req, res) => {
    try {
        const sql = `
            SELECT u.user_id, u.name, u.email, r.name as role_name
            FROM "User" u
            JOIN "Role" r ON u.role_id = r.role_id
            ORDER BY u.user_id ASC
        `;
        const result = await db.query(sql);

        res.json({
            message: 'Danh sách người dùng hệ thống',
            users: result.rows.map(u => ({
                id: u.user_id,
                name: u.name,
                email: u.email,
                role: u.role_name
            }))
        });
    } catch (error) {
        console.error("Lỗi lấy danh sách người dùng:", error);
        res.status(500).json({ message: "Lỗi hệ thống." });
    }
};

// 3. Thay đổi vai trò người dùng (Admin)
exports.updateUserRole = async (req, res) => {
    try {
        const { userId } = req.params;
        const { role } = req.body; // role truyền vào là tên: 'Teacher', 'Student'

        // A. Lấy role_id từ tên role
        const roleResult = await db.query('SELECT role_id FROM "Role" WHERE name = $1', [role]);
        if (roleResult.rows.length === 0) return res.status(400).json({ message: "Vai trò không hợp lệ." });
        const roleId = roleResult.rows[0].role_id;

        // B. Cập nhật vào bảng User
        const sql = 'UPDATE "User" SET role_id = $1 WHERE user_id = $2 RETURNING *';
        const result = await db.query(sql, [roleId, userId]);

        if (result.rows.length === 0) return res.status(404).json({ message: "Không tìm thấy người dùng." });

        res.json({ message: "Cập nhật vai trò thành công!", user: { id: userId, role } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Lỗi hệ thống khi cập nhật vai trò." });
    }
};

// 4. Đặt lại mật khẩu (Admin)
exports.resetPassword = async (req, res) => {
    try {
        const { userId } = req.params;
        const { newPassword } = req.body;

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        const sql = 'UPDATE "User" SET password_hash = $1 WHERE user_id = $2';
        const result = await db.query(sql, [hashedPassword, userId]);

        if (result.rowCount === 0) return res.status(404).json({ message: "Không tìm thấy người dùng." });

        res.json({ message: "Đặt lại mật khẩu thành công!" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Lỗi khi đặt lại mật khẩu." });
    }
};

// 5. Xóa người dùng (Admin)
exports.deleteUser = async (req, res) => {
    const client = await db.getClient();

    try {
        const { userId } = req.params;

        // 1. Kiểm tra user có tồn tại không và lấy Role (Vai trò)
        const userRes = await client.query(`
            SELECT u.user_id, r.name as role_name
            FROM "User" u
            JOIN "Role" r ON u.role_id = r.role_id
            WHERE u.user_id = $1
        `, [userId]);

        if (userRes.rows.length === 0) {
            return res.status(404).json({ message: "Không tìm thấy người dùng." });
        }

        const roleName = userRes.rows[0].role_name;

        // BẮT ĐẦU TRANSACTION
        await client.query('BEGIN');

        if (roleName === 'Student') {
            // A. DỌN DẸP DỮ LIỆU CỦA HỌC SINH

            // Xóa chi tiết các câu trả lời trong bài thi của học sinh
            await client.query(`
                DELETE FROM "SubmissionAnswer"
                WHERE submission_id IN (SELECT submission_id FROM "Submission" WHERE student_id = $1)
            `, [userId]);

            // Xóa lịch sử nộp bài
            await client.query('DELETE FROM "Submission" WHERE student_id = $1', [userId]);

            // Xóa danh sách ghi danh khóa học
            await client.query('DELETE FROM "Enrollment" WHERE student_id = $1', [userId]);

        } else if (roleName === 'Teacher') {
            // B. DỌN DẸP DỮ LIỆU CỦA GIẢNG VIÊN (Cascading Delete thủ công)

            // Khởi tạo các sub-query để tìm ID của các tài nguyên thuộc về giáo viên này
            const courseIds = `(SELECT course_id FROM "Course" WHERE instructor_id = $1)`;
            const assessmentIds = `(SELECT assessment_id FROM "Assessment" WHERE course_id IN ${courseIds})`;
            const questionIds = `(SELECT question_id FROM "Question" WHERE assessment_id IN ${assessmentIds})`;

            // Bước 1: Xóa toàn bộ chi tiết bài làm (SubmissionAnswer) thuộc các bài thi của giáo viên
            await client.query(`
                DELETE FROM "SubmissionAnswer"
                WHERE submission_id IN (SELECT submission_id FROM "Submission" WHERE assessment_id IN ${assessmentIds})
            `, [userId]);

            // Bước 2: Xóa lịch sử nộp bài (Submission)
            await client.query(`DELETE FROM "Submission" WHERE assessment_id IN ${assessmentIds}`, [userId]);

            // Bước 3: Xóa các lựa chọn đáp án (Option)
            await client.query(`DELETE FROM "Option" WHERE question_id IN ${questionIds}`, [userId]);

            // Bước 4: Xóa câu hỏi (Question)
            await client.query(`DELETE FROM "Question" WHERE assessment_id IN ${assessmentIds}`, [userId]);

            // Bước 5: Xóa bài thi (Assessment)
            await client.query(`DELETE FROM "Assessment" WHERE course_id IN ${courseIds}`, [userId]);

            // Bước 6: Xóa bài giảng (Lesson)
            await client.query(`DELETE FROM "Lesson" WHERE course_id IN ${courseIds}`, [userId]);

            // Bước 7: Xóa học sinh khỏi các khóa học này (Enrollment)
            await client.query(`DELETE FROM "Enrollment" WHERE course_id IN ${courseIds}`, [userId]);

            // Bước 8: Cuối cùng, xóa các khóa học (Course)
            await client.query(`DELETE FROM "Course" WHERE instructor_id = $1`, [userId]);
        }

        // C. BƯỚC CUỐI CÙNG: XÓA NGƯỜI DÙNG (Dùng chung cho cả Student, Teacher, Admin)
        await client.query('DELETE FROM "User" WHERE user_id = $1', [userId]);

        // HOÀN TẤT TRANSACTION
        await client.query('COMMIT');

        res.json({ message: `Đã xóa tài khoản ${roleName} và dọn dẹp toàn bộ dữ liệu liên quan thành công.` });

    } catch (error) {
        // NẾU CÓ BẤT KỲ LỖI NÀO, HỦY TOÀN BỘ QUÁ TRÌNH XÓA
        await client.query('ROLLBACK');
        console.error("Lỗi khi xóa người dùng:", error);
        res.status(500).json({ message: "Lỗi hệ thống khi dọn dẹp dữ liệu người dùng." });
    } finally {
        client.release();
    }
};

// 6. Đếm số học sinh 1 giáo viên dạy
exports.countStudentsByTeacher = async (req, res) => {
    try {
        const instructorId = req.user.userId; // Giả sử lấy ID giáo viên từ token

        const sql = `
            SELECT COUNT(DISTINCT e.student_id) as total_students
            FROM "Enrollment" e
            JOIN "Course" c ON e.course_id = c.course_id
            WHERE c.instructor_id = $1
        `;

        const result = await db.query(sql, [instructorId]);
        
        // Trả về số lượng học sinh
        const count = result.rows[0].total_students;
        res.json({ 
            instructorId: instructorId, 
            totalUniqueStudents: parseInt(count) 
        });
    } catch (error) {
        console.error("Lỗi đếm học sinh:", error);
        res.status(500).json({ message: "Lỗi hệ thống khi truy vấn dữ liệu." });
    }
};