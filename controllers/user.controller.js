// Giả lập dữ liệu người dùng (Sau này sẽ lấy từ DB)
const users = [
    { id: 1, name: 'Quản trị viên', email: 'admin@example.com', role: 'Admin' },
    { id: 2, name: 'Giảng viên A', email: 'teacher@example.com', role: 'Giảng viên' },
    { id: 3, name: 'Sinh viên B', email: 'student@example.com', role: 'Sinh viên' }
];

// Lấy thông tin cá nhân của người đang đăng nhập
exports.getProfile = (req, res) => {
    // req.user đã được điền sẵn bởi authMiddleware.verifyToken
    const user = users.find(u => u.id === req.user.userId);
    
    if (!user) {
        return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }

    res.json({
        message: 'Lấy thông tin cá nhân thành công',
        user
    });
};

// Lấy danh sách tất cả người dùng (Chỉ dành cho Admin)
exports.getAllUsers = (req, res) => {
    res.json({
        message: 'Danh sách người dùng hệ thống',
        users
    });
};
