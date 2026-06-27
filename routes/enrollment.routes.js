const express = require('express');
const router = express.Router();
const enrollmentController = require('../controllers/enrollment.controller');
const { verifyToken, checkRole } = require('../middlewares/auth.middleware');

// Chỉ Học viên mới được đăng ký học
router.post('/enroll', verifyToken, checkRole(['Student']), enrollmentController.enrollCourse);

// Xem các khóa học đã đăng ký (Dành cho học viên đang đăng nhập)
router.get('/my-courses', verifyToken, enrollmentController.getMyEnrolledCourses);

module.exports = router;