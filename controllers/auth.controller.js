const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Giả lập dữ liệu từ CSDL (Trong thực tế bạn sẽ lấy từ bảng User)
// Mật khẩu gốc là '123456', đã được băm (hash) bằng bcrypt
const mockUser = {
    id: 1,
    email: 'admin@example.com',
    password_hash: '$2a$10$7R6JvYvXU8W0... (mật khẩu 123456)', 
    role: 'Admin'
};

// Hàm đăng nhập
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Kiểm tra email (Giả lập tìm user trong DB)
        if (email !== mockUser.email) {
            return res.status(401).json({ message: 'Email hoặc mật khẩu không chính xác' });
        }

        // 2. So sánh mật khẩu người dùng nhập với mật khẩu đã băm trong DB
        // Dùng bcrypt.compare(mật_khẩu_thô, mật_khẩu_đã_băm)
        // const isMatch = await bcrypt.compare(password, mockUser.password_hash);
        
        // Để bạn dễ test, tôi sẽ giả định mật khẩu đúng là '123456'
        const isMatch = (password === '123456'); 

        if (!isMatch) {
            return res.status(401).json({ message: 'Email hoặc mật khẩu không chính xác' });
        }

        // 3. Tạo JWT Token nếu đăng nhập thành công
        const token = jwt.sign(
            { userId: mockUser.id, role: mockUser.role }, 
            process.env.JWT_SECRET, 
            { expiresIn: '1h' } // Token hết hạn sau 1 giờ
        );

        res.json({ 
            message: 'Đăng nhập thành công', 
            token,
            user: { id: mockUser.id, email: mockUser.email, role: mockUser.role }
        });

    } catch (error) {
        console.error('Lỗi Login:', error);
        res.status(500).json({ message: 'Lỗi hệ thống, vui lòng thử lại sau' });
    }
};