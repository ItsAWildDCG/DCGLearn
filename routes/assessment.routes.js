const express = require('express');
const router = express.Router();
const assessmentController = require('../controllers/assessment.controller');
const { verifyToken, checkRole } = require('../middlewares/auth.middleware');

// Lấy danh sách tất cả bài tập (Tất cả mọi người đã đăng nhập)
router.get('/all', verifyToken, assessmentController.getAllAssessments);

// Lấy chi tiết đề thi ĐÃ XÁO TRỘN (Dành cho Học sinh làm bài)
router.get('/:id', verifyToken, assessmentController.getAssessmentDetails);

// Lấy chi tiết đề thi chưa được xáo trộn (Dành cho giảng viên/Admin)
router.get('/full/:id', verifyToken, checkRole(['Teacher', 'Admin']), assessmentController.getAssessmentQuestionsForTeacher)

// Tạo bài tập mới (Chỉ Giảng viên/Admin)
router.post('/', verifyToken, checkRole(['Teacher', 'Admin']), assessmentController.createAssessment);

// Cập nhật bài tập (Chỉ Giảng viên/Admin)
router.put('/:id', verifyToken, checkRole(['Teacher', 'Admin']), assessmentController.updateAssessment);

// Xóa bài tập (Chỉ Giảng viên/Admin)
router.delete('/:id', verifyToken, checkRole(['Teacher', 'Admin']), assessmentController.deleteAssessment);


// Các routes liên quan đến chỉnh sửa câu hỏi (gắn liền với assessment)
router.post('/:assessmentId/question', verifyToken, checkRole(['Teacher', 'Admin']), assessmentController.addQuestion);
router.put('/questions/:questionId', verifyToken, checkRole(['Teacher', 'Admin']), assessmentController.updateQuestion);
router.delete('/questions/:questionId', verifyToken, checkRole(['Teacher', 'Admin']), assessmentController.deleteQuestion);

module.exports = router;