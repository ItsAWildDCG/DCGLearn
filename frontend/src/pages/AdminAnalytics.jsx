import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

// =========================================================================
// 1. COMPONENT DÙNG CHUNG: Thẻ hiển thị số liệu tổng quan (StatCard)
// =========================================================================
const StatCard = ({ title, value, icon, colorClass, trend }) => (
  <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between hover:shadow-md transition-all">
    <div className="space-y-2">
      <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">{title}</span>
      <h3 className="text-3xl font-extrabold text-gray-800">{value.toLocaleString('vi-VN')}</h3>
      {trend && (
        <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
          <i className="fas fa-arrow-trend-up"></i> {trend} so với tháng trước
        </span>
      )}
    </div>
    <div className={`w-14 h-14 rounded-2xl ${colorClass} flex items-center justify-center text-xl shadow-sm`}>
      <i className={icon}></i>
    </div>
  </div>
);

// =========================================================================
// 2. COMPONENT DÙNG CHUNG: Biểu đồ tròn/Donut bằng SVG nguyên bản (PieChartComponent)
// =========================================================================
const ReusableDonutChart = ({ data, title }) => {
  // Biểu đồ hình tròn SVG tính toán thủ công dựa trên strokeDasharray
  return (
    <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col items-center">
      <h4 className="text-sm font-bold text-gray-700 self-start mb-6 flex items-center gap-2">
        <i className="far fa-chart-bar text-blue-600"></i> {title}
      </h4>
      
      <div className="relative w-40 h-40 flex items-center justify-center">
        {/* SVG vẽ vòng tròn tiến độ */}
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
          <path className="text-gray-100" strokeWidth="3.5" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
          <path className="text-blue-600 transition-all duration-1000 ease-out" strokeDasharray={`${data.completed}, 100`} strokeWidth="3.5" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
        </svg>
        <div className="absolute text-center">
          <span className="text-2xl font-extrabold text-gray-800 block">{data.completed}%</span>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Có bài tập</span>
        </div>
      </div>

      {/* Chú thích các thông số bên dưới biểu đồ */}
      <div className="w-full mt-6 grid grid-cols-2 gap-3 pt-4 border-t border-gray-50 text-xs font-bold">
        <div className="flex items-center gap-2 text-gray-600">
          <span className="w-3 h-3 rounded-full bg-blue-600 inline-block"></span>
          <span>Khóa có bài tập: {data.completed}%</span>
        </div>
        <div className="flex items-center gap-2 text-gray-400">
          <span className="w-3 h-3 rounded-full bg-gray-200 inline-block"></span>
          <span>Chưa có bài tập: {100 - data.completed}%</span>
        </div>
      </div>
    </div>
  );
};

// =========================================================================
// 3. COMPONENT DÙNG CHUNG: Biểu đồ hình cột bằng Tailwind CSS (BarChartComponent)
// =========================================================================
const ReusableBarChart = ({ data, title }) => (
  <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col">
    <h4 className="text-sm font-bold text-gray-700 mb-8 flex items-center gap-2">
      <i className="fas fa-chart-line text-emerald-600"></i> {title}
    </h4>
    {/* Các cột dữ liệu nằm ngang hoặc dọc */}
    <div className="space-y-4 flex-grow flex flex-col justify-center">
      {data.map((item, idx) => (
        <div key={idx} className="space-y-1.5">
          <div className="flex justify-between text-xs font-bold text-gray-600">
            <span>{item.label}</span>
            <span className="text-gray-800">{item.value}%</span>
          </div>
          <div className="w-full h-3 bg-slate-50 border border-gray-100 rounded-full overflow-hidden">
            <div 
              style={{ width: `${item.value}%` }} 
              className={`h-full rounded-full transition-all duration-1000 ${
                idx === 0 ? 'bg-blue-600' : idx === 1 ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
            ></div>
          </div>
        </div>
      ))}
    </div>
  </div>
);


// =========================================================================
// MÀN HÌNH CHÍNH: QUẢN LÝ THÔNG SỐ HỆ THỐNG (AdminAnalytics)
// =========================================================================
const AdminAnalytics = () => {
  const [adminUser, setAdminUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Khởi tạo state chứa toàn bộ thông số mong muốn
  const [analyticsData, setAnalyticsData] = useState({
    totalUsers: 0,
    teachers: 0,
    students: 0,
    admins: 0,
    courses: 0,
    assessments: 0,
    completionRate: { completed: 0 },
    roleDistribution: []
  });

  const navigate = useNavigate();

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (!token || !userStr) { navigate('/login'); return; }
    
    const loggedInUser = JSON.parse(userStr);
    const role = (loggedInUser.role || '').toLowerCase();
    if (role !== 'admin' && role !== 'quản trị viên') {
      alert('Bạn không có quyền truy cập khu vực này!');
      navigate('/dashboard');
      return;
    }

    setAdminUser(loggedInUser);
    fetchSystemAnalytics(token);
  }, [navigate]);

  const fetchSystemAnalytics = async (token) => {
    try {
      setLoading(true);

      const [usersRes, coursesRes, assessmentsRes] = await Promise.all([
        fetch('/api/user/all', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/courses/all', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/assessments/all', { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      if (!usersRes.ok || !coursesRes.ok || !assessmentsRes.ok) {
        const errMsg = 'Không thể tải dữ liệu thống kê từ backend.';
        console.error(errMsg, { usersRes, coursesRes, assessmentsRes });
        setAnalyticsData(prev => ({
          ...prev,
          totalUsers: 0,
          teachers: 0,
          students: 0,
          admins: 0,
          courses: 0,
          assessments: 0,
          completionRate: { completed: 0 },
          roleDistribution: [
            { label: 'Admin', value: 0 },
            { label: 'Teacher', value: 0 },
            { label: 'Student', value: 0 }
          ]
        }));
        return;
      }

      const usersData = await usersRes.json();
      const coursesData = await coursesRes.json();
      const assessmentsData = await assessmentsRes.json();

      const users = usersData.users || [];
      const teachers = users.filter(u => (u.role || '').toLowerCase() === 'teacher').length;
      const students = users.filter(u => (u.role || '').toLowerCase() === 'student').length;
      const admins = users.filter(u => (u.role || '').toLowerCase() === 'admin').length;
      const courses = coursesData.courses || [];
      const assessments = assessmentsData.assessments || [];

      const coursesWithAssessments = new Set(assessments.map(a => Number(a.course_id))).size;
      const completionRate = courses.length > 0
        ? Math.round((coursesWithAssessments / courses.length) * 100)
        : 0;

      const totalUsers = users.length;
      const roleDistribution = totalUsers > 0 ? [
        { label: 'Admin', value: Math.round((admins / totalUsers) * 100) },
        { label: 'Teacher', value: Math.round((teachers / totalUsers) * 100) },
        { label: 'Student', value: Math.round((students / totalUsers) * 100) }
      ] : [
        { label: 'Admin', value: 0 },
        { label: 'Teacher', value: 0 },
        { label: 'Student', value: 0 }
      ];

      setAnalyticsData({
        totalUsers,
        teachers,
        students,
        admins,
        courses: courses.length,
        assessments: assessments.length,
        completionRate: { completed: completionRate },
        roleDistribution
      });
    } catch (error) {
      console.error("Lỗi lấy thông số hệ thống:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!adminUser) return null;

  return (
    <div className="min-h-screen bg-[#FBFCFE] flex flex-col font-['Inter']">
      <Navbar user={adminUser} />

      <main className="container mx-auto px-4 py-10 flex-grow max-w-6xl">
        {/* Tiêu đề trang */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-800 flex items-center gap-2">
              <i className="fas fa-chart-pie text-blue-600"></i> Bảng Thống Kê Hệ Thống
            </h1>
            <p className="text-gray-400 text-sm mt-1">Theo dõi thời gian thực các chỉ số tăng trưởng của nền tảng DCGLearn.</p>
          </div>
          <Link to="/admin/manage-users" className="px-5 py-3 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-xs transition shadow-sm flex items-center gap-2 w-max cursor-pointer">
            <i className="fas fa-users-cog"></i> Quản lý người dùng
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="space-y-8">
            
            {/* LƯỚI 4 THẺ THÔNG SỐ CƠ BẢN THEO YÊU CẦU */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard 
                title="Tổng thành viên" 
                value={analyticsData.totalUsers} 
                icon="fa-users" 
                colorClass="bg-blue-50 text-blue-600" 
                trend="Dữ liệu thực từ hệ thống" 
              />
              <StatCard 
                title="Giảng viên" 
                value={analyticsData.teachers} 
                icon="fas fa-chalkboard-teacher" 
                colorClass="bg-emerald-50 text-emerald-600" 
                trend="Theo phân loại vai trò" 
              />
              <StatCard 
                title="Học viên" 
                value={analyticsData.students} 
                icon="fas fa-user-graduate" 
                colorClass="bg-purple-50 text-purple-600" 
                trend="Theo phân loại vai trò" 
              />
              <StatCard 
                title="Tổng khóa học" 
                value={analyticsData.courses} 
                icon="fas fa-book" 
                colorClass="bg-amber-50 text-amber-600" 
                trend={`${analyticsData.assessments} bài tập`} 
              />
            </div>

            {/* KHU VỰC CHỨA CÁC COMPONENT BIỂU ĐỒ TÁI SỬ DỤNG */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Cột 1: Biểu đồ Tròn/Donut hiển thị Tỉ lệ hoàn thành khóa học */}
              <div className="md:col-span-1">
                <ReusableDonutChart 
                  data={analyticsData.completionRate} 
                  title="Tỉ lệ hoàn thành khóa học" 
                />
              </div>

              {/* Cột 2: Biểu đồ Cột phân bổ vai trò người dùng */}
              <div className="md:col-span-2">
                <ReusableBarChart 
                  data={analyticsData.roleDistribution} 
                  title="Phân bổ phần trăm theo vai trò người dùng" 
                />
              </div>

            </div>

          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default AdminAnalytics;