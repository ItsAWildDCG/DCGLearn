const bcrypt = require('bcryptjs');

// Dữ liệu người dùng giả lập (In-memory database)
let users = [
    { id: 1, name: 'Quản trị viên', email: 'admin@example.com', password_hash: '$2a$10$7R6JvYvXU8W0.q7M2kG7Oe... (mật khẩu 123456)', role: 'Admin' },
    { id: 2, name: 'Giảng viên A', email: 'teacher@example.com', password_hash: '$2a$10$7R6JvYvXU8W0.q7M2kG7Oe... (mật khẩu 123456)', role: 'Giảng viên' },
    { id: 3, name: 'Sinh viên B', email: 'student@example.com', password_hash: '$2a$10$7R6JvYvXU8W0.q7M2kG7Oe... (mật khẩu 123456)', role: 'Sinh viên' }
];

// Để đơn giản cho việc test, ta lưu lại hash thực tế của '123456'
// bcrypt.hashSync('123456', 10) trả về hash tương ứng
const HASH_123456 = bcrypt.hashSync('123456', 10);
users.forEach(u => u.password_hash = HASH_123456);

module.exports = {
    getAll: () => users,
    findByEmail: (email) => users.find(u => u.email === email),
    findById: (id) => users.find(u => u.id === id),
    add: (user) => {
        const newUser = { id: users.length + 1, ...user };
        users.push(newUser);
        return newUser;
    }
};
