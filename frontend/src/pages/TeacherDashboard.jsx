import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const TeacherDashboard = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (!token || !userStr) {
      navigate('/login');
      return;
    }

    const userData = JSON.parse(userStr);
    
    // Kiểm tra quyền Giảng viên
    if (userData.role !== 'Teacher' && userData.role !== 'Giảng viên') {
      alert("Bạn không có quyền truy cập khu vực giảng dạy!");
      navigate('/');
      return;
    }

    setUser(userData);
  }, [navigate]);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-['Inter']">
      {/* Thanh điều hướng chính */}
      <Navbar user={user} />

      {/* Nội dung chính của Dashboard */}
      <main className="container mx-auto px-4 py-10 flex-grow max-w-[1200px]">
        
        {/* BANNER CHÀO MỪNG GIẢNG VIÊN */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-[2rem] p-8 sm:p-10 text-white shadow-xl shadow-blue-100/50 relative overflow-hidden mb-10">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
          <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-indigo-500/20 rounded-full blur-2xl"></div>
          
          <div className="relative z-10">
            <span className="text-xs font-bold bg-white/20 px-3 py-1 rounded-full uppercase tracking-wider text-blue-50">
              Không gian giảng dạy
            </span>
            <h1 className="text-3xl sm:text-4xl font-black mt-3 tracking-tight">
              Xin chào, {user.name || "Thầy/Cô"}!
            </h1>
            <p className="text-blue-100/90 text-sm sm:text-base mt-2 max-w-xl font-medium leading-relaxed">
              Chào mừng Thầy/Cô trở lại hệ thống quản trị giáo dục DCGLearn. Hãy chọn một tác vụ bên dưới để bắt đầu quản lý công việc giảng dạy.
            </p>
          </div>
        </div>

        {/* KHU VỰC TÁC VỤ CHÍNH - THAY THẾ CHO KHU CARD KHÓA HỌC CŨ */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* TÁC VỤ 1: QUẢN LÝ KHÓA HỌC */}
          <div 
            onClick={() => navigate('/manage-courses')}
            className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm hover:shadow-md hover:border-blue-100 transition-all cursor-pointer group flex flex-col justify-between min-h-[220px]"
          >
            <div className="flex items-start justify-between">
              <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center text-2xl shadow-sm shadow-blue-100 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                <i className="fas fa-layer-group"></i>
              </div>
              <span className="text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity font-bold text-sm flex items-center gap-1">
                Truy cập ngay <i className="fas fa-chevron-right text-xs"></i>
              </span>
            </div>
            
            <div className="mt-6">
              <h3 className="font-extrabold text-slate-800 text-xl group-hover:text-blue-600 transition-colors">
                Quản lý khóa học
              </h3>
              <p className="text-slate-400 text-sm mt-2 font-medium leading-relaxed">
                Xem toàn bộ danh sách lớp học, tùy chỉnh sửa nội dung bài giảng, quản lý chương trình và giao thêm các bài tập đánh giá năng lực cho học viên.
              </p>
            </div>
          </div>

          {/* TÁC VỤ 2: THỐNG KÊ HỌC TẬP */}
          <div 
            onClick={() => navigate('/teacher/learning-stats')}
            className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm hover:shadow-md hover:border-purple-100 transition-all cursor-pointer group flex flex-col justify-between min-h-[220px]"
          >
            <div className="flex items-start justify-between">
              <div className="w-14 h-14 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center text-2xl shadow-sm shadow-purple-100 group-hover:bg-purple-600 group-hover:text-white transition-all duration-300">
                <i className="fas fa-chart-bar"></i>
              </div>
              <span className="text-purple-500 opacity-0 group-hover:opacity-100 transition-opacity font-bold text-sm flex items-center gap-1">
                Truy cập ngay <i className="fas fa-chevron-right text-xs"></i>
              </span>
            </div>
            
            <div className="mt-6">
              <h3 className="font-extrabold text-slate-800 text-xl group-hover:text-purple-600 transition-colors">
                Thống kê học tập
              </h3>
              <p className="text-slate-400 text-sm mt-2 font-medium leading-relaxed">
                Theo dõi tiến độ hoàn thành lộ trình của học viên, tổng hợp điểm số trung bình từ các bài tập đánh giá và phân tích chất lượng dạy học trực quan.
              </p>
            </div>
          </div>

        </section>
      </main>

      <Footer />
    </div>
  );
};

export default TeacherDashboard;