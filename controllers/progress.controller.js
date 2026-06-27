const db = require('../data/database');

// Lấy tiến độ học tập của một khóa học (Tính % dựa trên số Bài kiểm tra đã nộp)
exports.getCourseProgress = async (req, res) => {
    try {
        const { courseId } = req.params;
        const studentId = req.user.userId;

        // 1. Lấy tổng số Bài kiểm tra (Assessment) của khóa học này
        const totalAssessmentsRes = await db.query(
            'SELECT COUNT(*) FROM "Assessment" WHERE course_id = $1', 
            [courseId]
        );
        const totalAssessments = parseInt(totalAssessmentsRes.rows[0].count);

        // 2. Lấy số lượng Bài kiểm tra mà học viên này ĐÃ NỘP (Submission)
        const completedRes = await db.query(`
            SELECT DISTINCT assessment_id 
            FROM "Submission" 
            WHERE student_id = $1 AND assessment_id IN (
                SELECT assessment_id FROM "Assessment" WHERE course_id = $2
            )
        `, [studentId, courseId]);
        
        const completedCount = completedRes.rows.length;

        // 3. Tính toán phần trăm hoàn thành
        const percentage = totalAssessments > 0 ? (completedCount / totalAssessments) * 100 : 0;

        res.json({
            courseId,
            totalAssessments,
            completedCount,
            percentage: Math.round(percentage),
            completedAssessmentIds: completedRes.rows.map(s => s.assessment_id)
        });
    } catch (error) {
        console.error("Lỗi tính tiến độ khóa học:", error);
        res.status(500).json({ message: "Lỗi khi tính toán tiến độ dựa trên bài nộp." });
    }
};