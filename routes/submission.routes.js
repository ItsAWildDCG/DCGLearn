const express = require('express');
const router = express.Router();
const submissionController = require('../controllers/submission.controller');
const { verifyToken, checkRole } = require('../middlewares/auth.middleware');

// Học viên nộp bài làm
router.post('/submit', verifyToken, checkRole(['Student']), submissionController.submitAssignment);

// Giảng viên xem toàn bộ bài làm của một bài tập
router.get('/assessment/:assessmentId', verifyToken, checkRole(['Teacher', 'Admin']), submissionController.getSubmissionsByAssessment);

// Giảng viên chấm điểm (Chỉ Teacher/Admin)
router.put('/grade/:submissionId', verifyToken, checkRole(['Teacher', 'Admin']), submissionController.gradeSubmission);

module.exports = router;