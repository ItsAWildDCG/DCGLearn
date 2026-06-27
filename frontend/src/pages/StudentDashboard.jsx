import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar'; // Sử dụng file Navbar.jsx của bạn
import StatCard from '../components/StatCard'; // Sử dụng StatCard chung
import CourseCard from '../components/CourseCard';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // State quản lý số liệu thống kê cho học viên
  const [stats, setStats] = useState({
    coursesCount: 0,
    completedQuizzes: 0,
    gpa: '0.0'
  });

  useEffect(() => {
    // Kiểm tra quyền truy cập (Auth Guard)
    const userStr = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (!userStr || !token) {
      navigate('/login');
      return;
    }

    try {
      const parsedUser = JSON.parse(userStr);
      const userRole = parsedUser.role ? parsedUser.role.trim() : "";

      if (userRole !== 'Student') {
        alert("Bạn không có quyền truy cập vào khu vực dành cho Học viên.");
        navigate('/');
        return;
      }

      setUser(parsedUser);
      fetchDashboardData(token, parsedUser.id);

    } catch (error) {
      console.error("Lỗi xác thực người dùng:", error);
      localStorage.clear();
      navigate('/login');
    }
  }, [navigate]);

  const fetchDashboardData = async (token, userId) => {
      try {
        setLoading(true);
        // Gọi API thực tế lấy danh sách lớp học của sinh viên
        const response = await fetch('/api/enrollments/my-courses', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
    
        if (response.ok && data.enrollments) {
          setStats({
            coursesCount: data.enrollments.length, // Lấy độ dài thực tế của mảng
            completedQuizzes: 0, // Hiện tại backend chưa hỗ trợ đếm bài kiểm tra, tạm để 0
            gpa: '0.0'           // Hiện tại backend chưa hỗ trợ tính GPA, tạm để 0.0
          });
        }
      } catch (error) {
        console.error("Lỗi tải dữ liệu học tập thực tế:", error);
      } finally {
        setLoading(false);
      }
    };

  return (
    <div className="bg-[#FBFCFE] min-h-screen font-sans antialiased">
      {/* Gắn Navbar của bạn vào đây */}
      <Navbar user={user} />

      <main className="max-w-[1200px] mx-auto px-4 pt-8 pb-12">
        
        {/* Welcome Banner */}
        <section className="mb-8">
          <div className="bg-white p-6 sm:p-8 rounded-[20px] border border-gray-100 shadow-[0_4px_12px_rgba(0,0,0,0.01)] flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-800 tracking-tight">
                Chào mừng trở lại, <span className="text-blue-600">{user?.name || 'Học viên'}</span>! 👋
              </h1>
              <p className="text-gray-500 text-sm mt-1.5">
                Sẵn sàng để tiếp tục lộ trình học tập của bạn hôm nay chưa?
              </p>
            </div>
            <div>
              <span className="inline-block bg-blue-600 text-white px-5 py-2 rounded-full text-sm font-bold shadow-sm shadow-blue-100">
                Học viên
              </span>
            </div>
          </div>
        </section>

        {/* Áp dụng StatCard chung với các định dạng colorSchema linh hoạt */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-10">
          <StatCard 
            title="Khóa học tham gia" 
            value={stats.coursesCount} 
            icon="fa-book-reader" 
            colorSchema="blue" 
          />
          <StatCard 
            title="Bài tập hoàn thành" 
            value={stats.completedQuizzes} 
            icon="fa-tasks" 
            colorSchema="green" 
          />
          <StatCard 
            title="Điểm trung bình" 
            value={stats.gpa} 
            icon="fa-star" 
            colorSchema="amber" 
          />
        </section>

        {/* Khu vực Hành động Điều hướng Học tập */}
    <section className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-[0_10px_20px_rgba(0,0,0,0.01)] mt-4">
      <h2 className="text-lg font-extrabold text-slate-800 flex items-center gap-2.5 mb-6">
        <i className="fas fa-book-open text-blue-600"></i> Tác vụ học tập nhanh
      </h2>
    
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Nút 1: Khóa học đang học (Dẫn tới EnrolledCourses.jsx qua route /enrolled-courses) */}
        <Link 
          to="/enrolled-courses"
          className="flex items-center gap-4 p-6 bg-blue-50/50 rounded-2xl border border-blue-100/50 hover:bg-blue-50 hover:border-blue-200 transition-all group"
        >
          <div className="w-12 h-12 bg-blue-600 text-white rounded-xl flex items-center justify-center text-xl shadow-md shadow-blue-100">
            <i className="fas fa-graduation-cap"></i>
          </div>
          <div>
            <h3 className="font-extrabold text-slate-800 group-hover:text-blue-600 transition-colors">Khóa học đang học</h3>
            <p className="text-slate-400 text-xs mt-1 font-medium">Truy cập các khóa học bạn đã đăng ký để xem bài học và làm bài tập.</p>
          </div>
        </Link>
    
        {/* Nút 2: Đăng ký khóa học mới (Dẫn tới ViewCourseList.jsx qua route /available-courses) */}
        <Link 
          to="/available-courses"
          className="flex items-center gap-4 p-6 bg-purple-50/50 rounded-2xl border border-purple-100/50 hover:bg-purple-50 hover:border-purple-200 transition-all group"
        >
          <div className="w-12 h-12 bg-purple-600 text-white rounded-xl flex items-center justify-center text-xl shadow-md shadow-purple-100">
            <i className="fas fa-plus-circle"></i>
          </div>
          <div>
            <h3 className="font-extrabold text-slate-800 group-hover:text-purple-600 transition-colors">Đăng ký khóa học</h3>
            <p className="text-slate-400 text-xs mt-1 font-medium">Khám phá và đăng ký thêm các khóa học công nghệ có sẵn trên hệ thống.</p>
          </div>
        </Link>
      </div>
    </section>

      </main>
    </div>
  );
};

export default StudentDashboard;