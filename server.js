require('dotenv').config();
const express = require('express');
const cors = require('cors');

// Import các Routes
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const courseRoutes = require('./routes/course.routes');

const app = express();

// Middlewares cơ bản
app.use(cors());
app.use(express.json());

// Gắn các Routes vào ứng dụng
app.use('/api/auth', authRoutes);     // Các API đăng nhập
app.use('/api/users', userRoutes);    // Các API về thông tin người dùng
app.use('/api/courses', courseRoutes); // Các API về khóa học/bài tập

// Route kiểm tra trạng thái Server
app.get('/', (req, res) => {
    res.send('API của Quiz Management System đang chạy...');
});

// Xử lý Route không tồn tại (404)
app.use((req, res) => {
    res.status(404).json({ message: 'Đường dẫn không tồn tại!' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server đang chạy tại http://localhost:${PORT}`);
});
