const express = require('express');
const router = express.Router();
const lessonController = require('../controllers/lesson.controller');
const { verifyToken, checkRole } = require('../middlewares/auth.middleware');

// Public: Xem danh sách bài học theo khóa học
router.get('/course/:courseId', lessonController.getLessonsByCourse);

// Private: Tải lên file PDF (Giảng viên & Admin)
router.post('/upload-pdf', verifyToken, checkRole(['Teacher', 'Admin']), lessonController.uploadPDF);

// Private: Quản lý bài học (Giảng viên & Admin)
router.post('/', verifyToken, checkRole(['Teacher', 'Admin']), lessonController.createLesson);
router.put('/:id', verifyToken, checkRole(['Teacher', 'Admin']), lessonController.updateLesson);
router.put('/pdf/:id', verifyToken, checkRole(['Teacher', 'Admin']), lessonController.updatePDFLesson);
router.delete('/:id', verifyToken, checkRole(['Teacher', 'Admin']), lessonController.deleteLesson);

module.exports = router;