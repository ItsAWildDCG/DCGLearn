const express = require('express');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Phục vụ file tĩnh từ thư mục 'uploads' (PDF, hình ảnh)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 1. Phục vụ file tĩnh từ thư mục 'frontend'
app.use(express.static(path.join(__dirname, 'frontend')));

// 2. API Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/courses', require('./routes/course.routes'));
app.use('/api/user', require('./routes/user.routes'));
app.use('/api/assessments', require('./routes/assessment.routes'));
app.use('/api/enrollments', require('./routes/enrollment.routes'));
app.use('/api/submissions', require('./routes/submission.routes'));
app.use('/api/lessons', require('./routes/lesson.routes'));
app.use('/api/progress', require('./routes/progress.routes'));

// 3. Định tuyến trả về file HTML (QUAN TRỌNG)
app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'register.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'dashboard.html'));
});

app.get('/dashboard-teacher', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'dashboard-teacher.html'));
});

app.get('/create-course', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'create-course.html'));
});

// Trang chủ
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

// KHỞI TẠO SERVER
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server đang chạy tại: http://localhost:${PORT}`);
});
