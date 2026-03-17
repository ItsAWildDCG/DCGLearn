const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { verifyToken, checkRole } = require('../middlewares/auth.middleware');

// Route lấy thông tin cá nhân (Ai đăng nhập cũng xem được chính mình)
router.get('/profile', verifyToken, userController.getProfile);

// Route lấy toàn bộ danh sách người dùng (Chỉ Admin mới xem được)
router.get('/all', verifyToken, checkRole(['Admin']), userController.getAllUsers);

module.exports = router;
