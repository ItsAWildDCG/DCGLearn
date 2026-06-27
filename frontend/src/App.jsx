
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import StudentDashboard from './pages/StudentDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import CreateCourse from './pages/CreateCourse';
import ManageCourses from './pages/ManageCourses';
import EnrolledCourses from './pages/EnrolledCourses';
import ViewCourseList from './pages/ViewCourseList';
import UpdatePass from './pages/UpdatePass';
import ManageUsers from './pages/ManageUsers';
import AdminAnalytics from './pages/AdminAnalytics';
import ManageLessons from './pages/ManageLessons';
import ManageAssessments from './pages/ManageAssessments';
import AdminDashboard from './pages/AdminDashboard';
import UserProfile from './pages/UserProfile';
import CourseLearning from './pages/CourseLearning';
import ViewSubmissions from './pages/ViewSubmissions.jsx';
import LearningStats from './pages/LearningStats';
import AttemptAssessment from './pages/AttemptAssessment';
// Import các trang khác khi bạn làm xong (ví dụ bên dưới)
// import Dashboard from './pages/Dashboard';
// import Register từ './pages/Register';

function App() {
  return (
    <Router>
      <Routes>
        {/* 1. Trang mặc định là Login */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* 2. Đường dẫn / trỏ về login nếu chưa làm trang Home */}
        <Route path="/" element={<Navigate to="/login" />} />

        {/* 3. Sau này bạn thêm các trang mới tại đây */}
        <Route path="/dashboard-student" element={<StudentDashboard />} />
        <Route path="/dashboard-teacher" element={<TeacherDashboard />} />
        <Route path="/manage-courses" element={<ManageCourses />} />
        <Route path="/create-course" element={<CreateCourse />} />
        <Route path="/edit-course/:id" element={<CreateCourse />} />
        <Route path="/enrolled-courses" element={<EnrolledCourses />} />
        <Route path="/available-courses" element={<ViewCourseList />} />
        <Route path="/change-password" element={<UpdatePass />} />
        <Route path="/admin/manage-users" element={<ManageUsers />} />
        <Route path="/admin/analytics" element={<AdminAnalytics />} />
        <Route path="/teacher/courses/:courseId/lessons" element={<ManageLessons />} />
        <Route path="/teacher/courses/:courseId/assessments" element={<ManageAssessments />} />
        <Route path="/teacher/learning-stats" element={<LearningStats />} />
        <Route path="/dashboard-admin" element={<AdminDashboard />} />
        <Route path="/profile" element={<UserProfile />} />
        <Route path="/learning/:courseId" element={<CourseLearning />} />
        <Route path="/courses/:courseId/assessments/:assessmentId/submissions" element={<ViewSubmissions />} />
        <Route path="/quiz/:assessmentId" element={<AttemptAssessment />} />
        {/* <Route path="/dashboard" element={<Dashboard />} /> */}
        {/* <Route path="/register" element={<Register />} /> */}
        
        {/* 4. Trang 404 nếu người dùng nhập sai link */}
        <Route path="*" element={<div className="p-10 text-center text-2xl">404 - Không tìm thấy trang</div>} />
      </Routes>
    </Router>
  );
}

export default App