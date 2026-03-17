const jwt = require('jsonwebtoken');

// Kiểm tra xem người dùng đã đăng nhập (có token) chưa
exports.verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];

    // 1. Kiểm tra xem có Header Authorization và có đúng định dạng Bearer không
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ 
            message: 'Truy cập bị từ chối. Token không được cung cấp hoặc sai định dạng (Bearer token)!' 
        });
    }

    // 2. Tách lấy token thật
    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // Lưu thông tin user (id, role) vào request
        next();
    } catch (err) {
        // 3. Phân loại lỗi để phản hồi chính xác
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token đã hết hạn, vui lòng đăng nhập lại!' });
        }
        return res.status(401).json({ message: 'Token không hợp lệ hoặc đã bị thay đổi!' });
    }
};

// Kiểm tra quyền (Role)
exports.checkRole = (roles) => {
    return (req, res, next) => {
        // req.user.role được lấy ra từ verifyToken ở trên
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Bạn không có quyền thực hiện hành động này!' });
        }
        next();
    };
};