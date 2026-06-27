import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ManageCourseCard from '../components/ManageCourseCard';

const ManageCourses = () => {
  const [courses, setCourses] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (!token || !userStr) {
      navigate('/login');
      return;
    }

    const userData = JSON.parse(userStr);
    setUser(userData);
    loadCourses(token, userData.id);
  }, [navigate]);

  const loadCourses = async (token, teacherId) => {
    try {
      const response = await fetch('/api/courses/all', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        const allCourses = data.courses || [];

        // 👉 THÊM ĐOẠN LỌC FRONTEND TẠI ĐÂY:
        // Chỉ giữ lại khóa học có mã người tạo khớp với ID tài khoản đang đăng nhập
        const myCourses = allCourses.filter(course => 
          course.instructor_id === teacherId || 
          course.user_id === teacherId || 
          course.created_by === teacherId
        );

        // 👉 SỬA DÒNG NÀY: Thay vì setCourses(data.courses), ta set danh sách đã lọc
        setCourses(myCourses); 
      }
    } catch (error) {
      console.error("Lỗi tải danh sách:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
  if (!window.confirm("Bạn có chắc chắn muốn xóa khóa học này không?")) return;

  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`/api/courses/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (response.ok) {
      // ÉP KIỂU CẢ 2 BÊN VỀ STRING ĐỂ SO SÁNH CHUẨN XÁC
      setCourses(prevCourses => prevCourses.filter(c => String(c.course_id) !== String(id)));
      alert("Đã xóa khóa học thành công! 🎉");
    } else {
      alert("Xóa thất bại từ phía server.");
    }
  } catch (error) {
    console.error("Lỗi:", error);
  }
};

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      <Navbar user={user} />

      <main className="container mx-auto px-4 py-10 flex-grow">
        <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900">Quản lý khóa học</h1>
            <p className="text-gray-500 mt-1">Danh sách tất cả bài giảng bạn đã tạo trên hệ thống.</p>
          </div>
          <Link 
            to="/create-course" 
            className="px-6 py-3 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 flex items-center gap-2"
          >
            <i className="fas fa-plus"></i> Thêm khóa học mới
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : courses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {courses.map(course => (
              <ManageCourseCard 
                key={course.course_id} 
                course={course} 
                onDelete={handleDelete} 
              />
            ))}
          </div>
        ) : (
          <div className="bg-white p-20 rounded-[2rem] border-2 border-dashed border-gray-200 text-center">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <i className="fas fa-layer-group text-3xl text-gray-300"></i>
            </div>
            <h2 className="text-xl font-bold text-gray-800">Chưa có khóa học nào</h2>
            <p className="text-gray-500 mt-2">Hãy tạo bài giảng đầu tiên để bắt đầu hành trình giảng dạy.</p>
            <Link to="/create-course" className="mt-8 inline-block px-8 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-black transition-all">
              Bắt đầu ngay
            </Link>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default ManageCourses;