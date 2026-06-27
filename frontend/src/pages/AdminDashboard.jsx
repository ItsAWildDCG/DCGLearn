import React, { useState, useEffect } from 'react';
    import { useNavigate, Link } from 'react-router-dom'; // Thêm Link và useNavigate
    import Navbar from '../components/Navbar';
    import StatCard from '../components/StatCard';
    // Có thể bỏ import UserTableRow vì không hiển thị bảng nữa
    
  const AdminDashboard = () => {
    const navigate = useNavigate(); // Khai báo navigate ở đây
  const [users, setUsers] = useState([]);
  const [adminName, setAdminName] = useState('Admin');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, teachers: 0, students: 0, courses: 12 });

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    // 1. Kiểm tra xác thực quyền Admin bảo mật
    if (!token || !userStr) {
      navigate('/');
      return;
    }

    const user = JSON.parse(userStr);
    const userRole = (user.role || '').toLowerCase().trim();
    if (userRole !== 'admin') {
      alert('Tài khoản không có quyền truy cập quản trị viên!');
      navigate('/');
      return;
    }

    setAdminName(user.name || 'Admin');
    loadUsers(token);
  }, []);

  // 2. Fetch danh sách người dùng từ Server
  const loadUsers = async (token) => {
    try {
      setLoading(true);
      const response = await fetch('/api/user/all', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();

      if (response.ok) {
        const userList = data.users || [];
        setUsers(userList);

        // Phân tách tính toán số liệu tự động bằng JS
        const teachers = userList.filter(u => (u.role || '').toLowerCase().trim() === 'teacher').length;
        const students = userList.filter(u => (u.role || '').toLowerCase().trim() === 'student').length;
        
        setStats({
          total: userList.length,
          teachers: teachers,
          students: students,
          courses: 12 // Dữ liệu mẫu tĩnh của hệ thống khóa học
        });
      } else {
        alert('Không thể tải danh sách: ' + data.message);
      }
    } catch (error) {
      console.error('Lỗi kết nối API:', error);
    } finally {
      setLoading(false);
    }
  };

  // 3. Hàm Đăng xuất hệ thống thống nhất
  const handleLogout = () => {
    if (confirm("Bạn có chắc chắn muốn đăng xuất khỏi hệ thống quản trị viên không?")) {
      localStorage.clear();
      window.location.href = 'index.html';
    }
  };

  // 4. Các hàm xử lý hành động (Sửa / Xóa)
  const handleEditUser = (id) => {
    window.location.href = `updatepw.html?id=${id}`;
  };

  const handleDeleteUser = async (id) => {
    if (confirm('Bạn chắc chắn muốn xóa vĩnh viễn người dùng này khỏi hệ thống không?')) {
      const token = localStorage.getItem('token');
      try {
        const response = await fetch(`/api/user/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        alert(data.message);
        if (response.ok) {
          // Tải lại danh sách sau khi xóa thành công mà không cần f5 trang
          loadUsers(token);
        }
      } catch (error) {
        console.error('Lỗi khi thực thi xóa người dùng:', error);
      }
    }
  };

  return (
    <div className="bg-[#FBFCFE] min-h-screen font-sans antialiased">
      {/* Reusable Navbar Component */}
      <Navbar adminName={adminName} onLogout={handleLogout} />

      {/* Main Container */}
      <main className="max-w-[1200px] mx-auto px-5 pt-[115px] pb-10">
        
        {/* Welcome Header */}
         <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">Hệ thống quản trị</h1>
        <p className="text-slate-500 text-sm mt-1">Chúc bạn một ngày làm việc hiệu quả và tràn đầy năng lượng.</p>
      </div>
    </div>

        {/* Dynamic Stats Grid using Reusable StatCard Components */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
          <StatCard title="Tổng thành viên" value={stats.total} icon="fa-users" colorSchema="blue" />
          <StatCard title="Giảng viên" value={stats.teachers} icon="fa-chalkboard-teacher" colorSchema="amber" />
          <StatCard title="Học viên năng động" value={stats.students} icon="fa-user-graduate" colorSchema="green" />
          <StatCard title="Tổng khóa học" value={stats.courses} icon="fa-graduation-cap" colorSchema="purple" />
        </div>

      {/* Khu vực Hành động Điều hướng Nhanh */}
    <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-[0_10px_20px_rgba(0,0,0,0.01)]">
      <h2 className="text-lg font-extrabold text-slate-800 flex items-center gap-2.5 mb-6">
        <i className="fas fa-tools text-blue-600"></i> Tác vụ quản trị nhanh
      </h2>
    
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Nút 1: Quản lý người dùng */}
        <Link 
          to="/admin/manage-users"
          className="flex items-center gap-4 p-6 bg-blue-50/50 rounded-2xl border border-blue-100/50 hover:bg-blue-50 hover:border-blue-200 transition-all group"
        >
          <div className="w-12 h-12 bg-blue-600 text-white rounded-xl flex items-center justify-center text-xl shadow-md shadow-blue-100">
            <i className="fas fa-users-cog"></i>
          </div>
          <div>
            <h3 className="font-extrabold text-slate-800 group-hover:text-blue-600 transition-colors">Quản lý người dùng</h3>
            <p className="text-slate-400 text-xs mt-1 font-medium">Thay đổi vai trò, reset mật khẩu, xóa tài khoản.</p>
          </div>
        </Link>

        {/* Nút 2: Xem thống kê hệ thống */}
        <Link 
          to="/admin/analytics"
          className="flex items-center gap-4 p-6 bg-emerald-50/50 rounded-2xl border border-emerald-100/50 hover:bg-emerald-50 hover:border-emerald-200 transition-all group"
        >
          <div className="w-12 h-12 bg-emerald-500 text-white rounded-xl flex items-center justify-center text-xl shadow-md shadow-emerald-100">
            <i className="fas fa-chart-pie"></i>
          </div>
          <div>
            <h3 className="font-extrabold text-slate-800 group-hover:text-emerald-600 transition-colors">Xem thống kê</h3>
            <p className="text-slate-400 text-xs mt-1 font-medium">Theo dõi số lượt truy cập, tỷ lệ hoàn thành khóa học.</p>
          </div>
        </Link>
      </div>
    </div>

      </main>
    </div>
  );
};

export default AdminDashboard;