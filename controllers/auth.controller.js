const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../data/database'); // Kết nối Postgres mới

exports.register = async (req, res) => {
    try {
        const { name, email, role, password } = req.body;

        if (!name || !email || !role || !password) {
            return res.status(400).json({ message: 'Vui lòng điền đầy đủ tất cả các trường!' });
        }

        // 1. Kiểm tra email trùng trong Postgres
        const existingUser = await db.query('SELECT * FROM "User" WHERE email = $1', [email]);
        if (existingUser.rows.length > 0) {
            return res.status(400).json({ message: 'Email này đã được đăng ký!' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // 2. Lấy role_id từ tên role (VD: 'Teacher' -> 2)
        // Chuyển đổi tên role từ frontend (ví dụ: 'Học viên' -> 'Student') nếu cần
        let roleName = role.trim();
        if (roleName === 'Học viên') roleName = 'Student';
        if (roleName === 'Giảng viên') roleName = 'Teacher';

        const roleResult = await db.query('SELECT role_id FROM "Role" WHERE name = $1', [roleName]);
        if (roleResult.rows.length === 0) {
            return res.status(400).json({ message: 'Quyền người dùng không hợp lệ!' });
        }
        const roleId = roleResult.rows[0].role_id;

        // 3. Thêm user mới vào Postgres
        const sql = 'INSERT INTO "User" (name, email, password_hash, role_id, created_at) VALUES ($1, $2, $3, $4, CURRENT_DATE) RETURNING *';
        await db.query(sql, [name, email, hashedPassword, roleId]);

        res.status(201).json({ message: 'Đăng ký tài khoản thành công!' });
    } catch (error) {
        console.error("Lỗi đăng ký:", error);
        res.status(500).json({ message: 'Lỗi máy chủ khi đăng ký.' });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const sql = `
            SELECT u.*, r.name as role_name 
            FROM "User" u 
            JOIN "Role" r ON u.role_id = r.role_id 
            WHERE u.email = $1
        `;
        const result = await db.query(sql, [email]);
        const user = result.rows[0];

        if (!user) {
            return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng!' });
        }

        // Kiểm tra mật khẩu (Hỗ trợ hash và text thuần)
        let isMatch = false;
        if (user.password_hash.startsWith('$2')) {
            isMatch = await bcrypt.compare(password, user.password_hash);
        } else {
            isMatch = (password === user.password_hash);
        }

        if (!isMatch) {
            return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng!' });
        }

        // CỰC KỲ QUAN TRỌNG: role ở đây phải là 'Teacher', 'Student' hoặc 'Admin'
        const token = jwt.sign(
            { 
                userId: user.user_id, 
                role: user.role_name.trim(), // Loại bỏ khoảng trắng thừa nếu có
                name: user.name 
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            message: 'Đăng nhập thành công!',
            token,
            user: { id: user.user_id, name: user.name, role: user.role_name.trim() }
        });
    } catch (error) {
        console.error("Lỗi đăng nhập:", error);
        res.status(500).json({ message: 'Lỗi máy chủ khi đăng nhập.' });
    }
};