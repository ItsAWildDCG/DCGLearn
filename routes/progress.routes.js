const express = require('express');
const router = express.Router();
const progressController = require('../controllers/progress.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

// Lấy tiến độ của một khóa học (Dựa trên số lượng bài nộp bài tập)
router.get('/course/:courseId', verifyToken, progressController.getCourseProgress);

module.exports = router;