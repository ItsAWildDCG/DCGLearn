const express = require('express');
const router = express.Router();
const courseController = require('../controllers/course.controller');
const { verifyToken, checkRole } = require('../middlewares/auth.middleware');

// Public route: Xem tất cả
router.get('/all', courseController.getAllCourses);

// Private route: Học sinh xem khóa học chưa đăng kí
router.get('/unregistered', verifyToken, courseController.getUnregisteredCourses);

// Private routes: Yêu cầu đăng nhập và đúng quyền Giảng viên hoặc Admin
router.get('/:id', verifyToken, courseController.getCourseById);
router.post('/', verifyToken, checkRole(['Teacher', 'Admin']), courseController.createCourse);
router.put('/:id', verifyToken, checkRole(['Teacher', 'Admin']), courseController.updateCourse);
router.delete('/:id', verifyToken, checkRole(['Teacher', 'Admin']), courseController.deleteCourse);

module.exports = router;