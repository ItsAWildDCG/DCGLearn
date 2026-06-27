const db = require('../data/database');

// 1. Học viên đăng ký khóa học mới
exports.enrollCourse = async (req, res) => {
    try {
        const { courseId } = req.body;
        const studentId = req.user.userId;

        // Kiểm tra xem đã đăng ký chưa
        const checkSql = 'SELECT * FROM "Enrollment" WHERE course_id = $1 AND student_id = $2';
        const checkResult = await db.query(checkSql, [courseId, studentId]);
        
        if (checkResult.rows.length > 0) {
            return res.status(400).json({ message: "Bạn đã đăng ký khóa học này rồi!" });
        }

        const sql = 'INSERT INTO "Enrollment" (student_id, course_id, enrolled_at) VALUES ($1, $2, CURRENT_DATE) RETURNING *';
        const result = await db.query(sql, [studentId, courseId]);

        res.status(201).json({ message: "Đăng ký khóa học thành công!", enrollment: result.rows[0] });
    } catch (error) {
        console.error("Lỗi đăng ký học:", error);
        res.status(500).json({ message: "Lỗi hệ thống khi đăng ký học." });
    }
};

// 2. Lấy danh sách khóa học mà học viên hiện tại đã tham gia
exports.getMyEnrolledCourses = async (req, res) => {
    try {
        const studentId = req.user.userId;
        const sql = `
            SELECT e.*, c.title, c.description 
            FROM "Enrollment" e
            JOIN "Course" c ON e.course_id = c.course_id
            WHERE e.student_id = $1
        `;
        const result = await db.query(sql, [studentId]);
        res.json({ enrollments: result.rows });
    } catch (error) {
        console.error("Lỗi lấy danh sách đăng ký:", error);
        res.status(500).json({ message: "Lỗi khi lấy danh sách đăng ký." });
    }
};