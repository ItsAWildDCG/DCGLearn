const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { verifyToken, checkRole } = require('../middlewares/auth.middleware');

// Route lấy thông tin cá nhân (Ai đăng nhập cũng xem được chính mình)
router.get('/profile', verifyToken, userController.getProfile);

// Route lấy tổng số học sinh học 1 giáo viên (Chỉ giáo viên)
router.get('/stats', verifyToken, checkRole(['Teacher']), userController.countStudentsByTeacher);

// Route lấy toàn bộ danh sách người dùng (Chỉ Admin mới xem được)
router.get('/all', verifyToken, checkRole(['Admin']), userController.getAllUsers);

// --- CÁC ROUTE QUẢN TRỊ (CHỈ ADMIN) ---
router.put('/role/:userId', verifyToken, checkRole(['Admin']), userController.updateUserRole);
router.put('/reset-password/:userId', verifyToken, checkRole(['Admin']), userController.resetPassword);
router.delete('/:userId', verifyToken, checkRole(['Admin']), userController.deleteUser);

module.exports = router;
