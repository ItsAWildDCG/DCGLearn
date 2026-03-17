const express = require('express');
const router = express.Router();
const { verifyToken, checkRole } = require('../middlewares/auth.middleware');

// Route dành cho Giảng viên (Tạo bài kiểm tra)
router.post('/create', verifyToken, checkRole(['Admin', 'Giảng viên']), (req, res) => {
    res.json({ message: 'Khóa học/Bài kiểm tra mới đã được tạo bởi ' + req.user.role });
});

// Route dành cho Sinh viên (Nộp bài)
router.post('/submit', verifyToken, checkRole(['Sinh viên']), (req, res) => {
    res.json({ message: 'Sinh viên đã nộp bài thành công.' });
});

module.exports = router;
