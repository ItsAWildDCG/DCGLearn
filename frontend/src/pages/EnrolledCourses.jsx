import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import EnrolledCourseCard from '../components/EnrolledCourseCard';

const EnrolledCourses = () => {
  const [courses, setCourses] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    // 1. Kiểm tra đăng nhập cơ bản
    if (!token || !userStr) {
      navigate('/login');
      return;
    }

    const userData = JSON.parse(userStr);
    const currentRole = userData.role?.toLowerCase();

    // 2. PHÂN QUYỀN CHUYÊN BIỆT: Chặn Giảng viên & Admin truy cập
    if (currentRole === 'teacher' || currentRole === 'giảng viên') {
      navigate('/dashboard-teacher');
      return;
    } else if (currentRole === 'admin') {
      navigate('/admin-dashboard'); // Tên trang admin của bạn
      return;
    }

    // 3. Nếu là Học viên hợp lệ, tiến hành set user và load dữ liệu
    setUser(userData);
    loadEnrolledCourses(token);
  }, [navigate]);

  const loadEnrolledCourses = async (token) => {
    try {
      // Giả định API lấy các khóa học mà học viên hiện tại đã đăng ký/tham gia trong PostgreSQL
      const response = await fetch('/api/enrollments/my-courses', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();

        if (response.ok) {
          // Backend trả về thuộc tính tên là "enrollments"
          setCourses(data.enrollments || []);
        }

    } catch (error) {
      console.error("Lỗi tải danh sách khóa học tham gia:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-['Inter']">
      <Navbar user={user} />

      <main className="container mx-auto px-4 py-10 flex-grow">
        <div className="mb-10">
          <h1 className="text-3xl font-extrabold text-gray-900">Khóa học của tôi</h1>
          <p className="text-gray-500 mt-1">Danh sách các lộ trình học tập bạn đang tham gia trên DCGLearn.</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : courses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {courses.map(course => (
              <EnrolledCourseCard 
                key={course.course_id} 
                course={course} 
              />
            ))}
          </div>
        ) : (
          /* Trạng thái trống (Empty State) thiết kế riêng biệt cho học viên */
          <div className="bg-white p-20 rounded-[2rem] border-2 border-dashed border-gray-200 text-center">
            <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <i className="fas fa-graduation-cap text-3xl text-blue-500"></i>
            </div>
            <h2 className="text-xl font-bold text-gray-800">Lớp học trống</h2>
            <p className="text-gray-500 mt-2">Bạn chưa đăng ký tham gia bất kỳ khóa học nào trên hệ thống.</p>
            <Link 
              to="/courses" // Hoặc đường dẫn đến trang Thư viện/Danh sách tất cả khóa học của bạn
              className="mt-8 inline-block px-8 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
            >
              Khám phá khóa học ngay
            </Link>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default EnrolledCourses;