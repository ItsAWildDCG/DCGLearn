# 📘 TÀI LIỆU API DCGLEARN (ĐẦY ĐỦ 26 ENDPOINTS)

**Base URL:** `http://localhost:3000`

---

## 🔐 1. XÁC THỰC (AUTH) -  APIs
- `POST /api/auth/register`: Đăng ký tài khoản mới.
- `POST /api/auth/login`: Đăng nhập & lấy JWT Token.

## 👤 2. NGƯỜI DÙNG (USER) -  APIs
- `GET /api/user/profile`: Xem thông tin cá nhân (Cần Token).
- `GET /api/user/all`: [ADMIN] Liệt kê toàn bộ người dùng.
- `GET /api/user/stats`: [TEACHER] Tổng số học sinh.
- `PUT /api/user/role/:userId`: [ADMIN] Đổi vai trò (Học viên/Giảng viên/Admin).
- `PUT /api/user/reset-password/:userId`: [ADMIN] Đặt lại mật khẩu mới.
- `DELETE /api/user/:userId`: [ADMIN] Xóa tài khoản vĩnh viễn.

## 📚 3. KHÓA HỌC (COURSES) -  APIs
- `GET /api/courses/all`: Xem tất cả khóa học (Public).
- `GET /api/courses/unregistered`: Xem tất cả khóa học chưa đăng kí (Public).
- `GET /api/courses/:id`: Xem chi tiết 1 khóa học.
- `POST /api/courses`: [GV/ADMIN] Tạo khóa học mới.
- `PUT /api/courses/:id`: [GV-CHỦ/ADMIN] Cập nhật thông tin khóa học.
- `DELETE /api/courses/:id`: [GV-CHỦ/ADMIN] Xóa khóa học.

## 📖 4. BÀI HỌC (LESSONS) -  APIs
- `GET /api/lessons/course/:courseId`: Xem danh sách bài học của khóa.
- `POST /api/lessons`: [GV-CHỦ/ADMIN] Thêm bài giảng (Video/Content).
- `POST /api/lessons/upload-pdf`: [GV-CHỦ/ADMIN] Thêm bài giảng (PDF).
- `PUT /api/lessons/:id`: [GV-CHỦ/ADMIN] Sửa nội dung bài giảng.
- `PUT /api/lessons/pdf/:id`: [GV-CHỦ/ADMIN] Sửa nội dung bài giảng (PDF).
- `DELETE /api/lessons/:id`: [GV-CHỦ/ADMIN] Xóa bài giảng.

## 🎓 5. ĐĂNG KÝ HỌC (ENROLLMENTS) -  APIs
- `POST /api/enrollments/enroll`: [HỌC VIÊN] Đăng ký vào một khóa học.
- `GET /api/enrollments/my-courses`: [HỌC VIÊN] Xem các lớp mình đã tham gia.

## ✍️ 6. BÀI TẬP (Assessments) -  APIs
- `GET /api/assessments/all`: Xem danh sách tất cả bài tập.
- `POST /api/assessments`: [GV/ADMIN] Tạo bài tập trắc nghiệm mới.
- `GET /api/assessments/full/:id`: [GV/ADMIN] xem bản bài tập (bao gồm đáp án).
- `GET /api/assessments/:id`: [HOC VIÊN] xem bản bài tập đã được xáo.
- `PUT /api/assessments/:id`: [HOC VIÊN] Chỉnh sửa assessment.
- `DELETE /api/assessments/:id`: [GV-CHỦ/ADMIN] Xáo assessment.
- `POST /api/assessments/:assessmentId/question`: [GV/ADMIN] Thêm câu hỏi.
- `PUT /api/assessments/questions/:questionId`: [GV/ADMIN] Chỉnh sửa câu hỏi trong assessment.
- `DELETE /api/assessments/questions/:questionId`: [GV-CHỦ/ADMIN] Xáo câu hỏi trong assessment.

## 📝 7. NỘP BÀI (SUBMISSIONS) -  APIs
- `POST /api/submissions/submit`: [HỌC VIÊN] Nộp bài & Tự động chấm điểm.
- `GET /api/submissions/assessment/:assessmentId`: [GV-CHỦ/ADMIN] Xem danh sách bài làm của HS.
- `PUT /api/submissions/grade/:submissionId`: [GV-CHỦ/ADMIN] Chấm điểm thủ công.

## 📈 8. TIẾN ĐỘ (PROGRESS) -  APIs
- `GET /api/progress/course/:courseId`: [HỌC VIÊN] Lấy % tiến độ hoàn thành khóa học.

---
*Ghi chú: [GV-CHỦ] là Giảng viên tạo ra tài nguyên đó mới có quyền sửa/xóa.*
