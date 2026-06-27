import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const ManageUsers = () => {
  const [adminUser, setAdminUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  // State phục vụ Modal đổi mật khẩu
  const [selectedUser, setSelectedUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [showPassModal, setShowPassModal] = useState(false);
  const [updatingPass, setUpdatingPass] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    // Kiểm tra đăng nhập và bắt buộc phải là quyền Admin mới cho vào
    if (!token || !userStr) { navigate('/login'); return; }
    
    const loggedInUser = JSON.parse(userStr);
    const role = (loggedInUser.role || '').toLowerCase();
    if (role !== 'admin' && role !== 'quản trị viên') {
      alert('Bạn không có quyền truy cập khu vực quản trị!');
      navigate('/dashboard');
      return;
    }

    setAdminUser(loggedInUser);
    loadAllUsers(token);
  }, [navigate]);

  // Hàm tải toàn bộ danh sách người dùng từ API Backend
  const loadAllUsers = async (token) => {
    try {
      setLoading(true);
      const response = await fetch('/api/user/all', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error("Lỗi tải danh sách người dùng:", error);
    } finally {
      setLoading(false);
    }
  };

  const normalizeRoleForApi = (role) => {
    const normalized = (role || '').toLowerCase();
    if (normalized === 'teacher') return 'Teacher';
    if (normalized === 'student') return 'Student';
    if (normalized === 'admin') return 'Admin';
    return role;
  };

  // CHỨC NĂNG 1: Cập nhật vai trò người dùng (Thỏa mãn các điều kiện chặn)
  const handleRoleChange = async (userId, targetUser, newRole) => {
    const token = localStorage.getItem('token');
    
    // RÀNG BUỘC CHẶN 1: Admin không được đổi vai trò của Admin khác
    if (targetUser.role.toLowerCase() === 'admin') {
      alert('Không thể thay đổi vai trò của một tài khoản Admin khác!');
      return;
    }

    const apiRole = normalizeRoleForApi(newRole);
    if (!apiRole || apiRole === 'Admin') {
      alert('Chỉ được chuyển giữa Học viên và Giảng viên. Không thể nâng lên Admin.');
      return;
    }

    if (!window.confirm(`Bạn có chắc chắn muốn chuyển vai trò của ${targetUser.name} sang thành [${apiRole}] không?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/user/role/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ role: apiRole })
      });

      if (response.ok) {
        alert('Cập nhật vai trò thành công! 🎉');
        // Cập nhật State cục bộ ngay lập tức để UI thay đổi theo
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: apiRole } : u));
      } else {
        alert('Có lỗi xảy ra từ máy chủ, vui lòng thử lại.');
      }
    } catch (error) {
      console.error("Lỗi cập nhật quyền:", error);
    }
  };

  // CHỨC NĂNG 2: Ép buộc cập nhật mật khẩu mới (Reset Password)
  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) { alert('Mật khẩu mới phải từ 6 ký tự trở lên!'); return; }
    
    setUpdatingPass(true);
    const token = localStorage.getItem('token');

    try {
      const response = await fetch(`/api/user/reset-password/${selectedUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ newPassword })
      });

      if (response.ok) {
        alert(`Đã đổi mật khẩu thành công cho người dùng: ${selectedUser.name}!`);
        setShowPassModal(false);
        setNewPassword('');
        setSelectedUser(null);
      } else {
        alert('Cập nhật mật khẩu thất bại.');
      }
    } catch (error) {
      console.error("Lỗi reset mật khẩu:", error);
    } finally {
      setUpdatingPass(false);
    }
  };

  // CHỨC NĂNG 3: Xóa tài khoản có vai trò thấp (Không được xóa Admin khác)
  const handleDeleteUser = async (targetUser) => {
    // RÀNG BUỘC CHẶN 2: Tuyệt đối không xóa được tài khoản Admin khác
    if (targetUser.role.toLowerCase() === 'admin') {
      alert('Hành vi bị nghiêm cấm! Bạn không thể xóa tài khoản của một Admin khác.');
      return;
    }

    if (!window.confirm(`CẢNH BÁO: Bạn có chắc muốn XÓA VĨNH VIỄN tài khoản của ${targetUser.name} (${targetUser.email}) không? Hành động này không thể hoàn tác!`)) {
      return;
    }

    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`/api/user/${targetUser.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        alert('Đã xóa tài khoản thành công!');
        // Loại bỏ user khỏi danh sách hiển thị trên UI
        setUsers(prev => prev.filter(u => u.id !== targetUser.id));
      } else {
        alert('Không thể xóa tài khoản này.');
      }
    } catch (error) {
      console.error("Lỗi xóa người dùng:", error);
    }
  };

  // Logic lọc và tìm kiếm realtime trên Client
  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) || u.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role.toLowerCase() === roleFilter.toLowerCase();
    return matchesSearch && matchesRole;
  });

  if (!adminUser) return null;

  return (
    <div className="min-h-screen bg-[#FBFCFE] flex flex-col font-['Inter']">
      <Navbar user={adminUser} />

      <main className="container mx-auto px-4 py-10 flex-grow max-w-6xl">
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-800 flex items-center gap-2">
              <i className="fas fa-users-cog text-blue-600"></i> Quản Lý Danh Sách Người Dùng
            </h1>
            <p className="text-gray-400 text-sm mt-1">Nâng quyền, đặt lại mật khẩu và kiểm soát thành viên hệ thống DCGLearn.</p>
          </div>
        </div>

        {/* Khối tìm kiếm & Bộ lọc nâng cao */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm mb-6 flex flex-col sm:flex-row gap-4 items-center">
          <div className="relative w-full sm:flex-grow">
            <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
            <input 
              type="text" 
              placeholder="Tìm kiếm theo họ tên hoặc email..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-500 transition-all text-sm font-medium"
            />
          </div>
          <div className="w-full sm:w-48">
            <select 
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-500 transition-all text-sm font-bold text-gray-600 cursor-pointer"
            >
              <option value="all">Tất cả vai trò</option>
              <option value="admin">Quản trị viên (Admin)</option>
              <option value="teacher">Giảng viên</option>
              <option value="student">Học viên</option>
            </select>
          </div>
        </div>

        {/* Bảng hiển thị danh sách người dùng */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <i className="fas fa-user-slash text-4xl mb-3 block"></i>
              Không tìm thấy người dùng nào phù hợp.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-gray-50 text-xs font-bold uppercase tracking-wider text-gray-400">
                    <th className="px-6 py-4">Thành viên</th>
                    <th className="px-6 py-4">ID / Ngày tham gia</th>
                    <th className="px-6 py-4">Vai trò (Thay đổi quyền)</th>
                    <th className="px-6 py-4 text-center">Hành động bảo mật</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-sm font-medium text-gray-700">
                  {filteredUsers.map(u => {
                    const isTargetAdmin = u.role.toLowerCase() === 'admin';
                    return (
                      <tr key={u.id} className="hover:bg-slate-50/40 transition">
                        {/* Cột thông tin cơ bản */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 font-bold flex items-center justify-center uppercase">
                              {u.name.substring(0, 2)}
                            </div>
                            <div>
                              <div className="font-bold text-gray-800">{u.name} {u.id === adminUser.id && <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-md font-normal ml-1">Bạn</span>}</div>
                              <div className="text-xs text-gray-400 font-normal">{u.email}</div>
                            </div>
                          </div>
                        </td>
                        
                        {/* Cột mốc thời gian */}
                        <td className="px-6 py-4">
                          <span className="text-xs font-mono font-bold bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">#DCL{String(u.id).substring(0,6).toUpperCase()}</span>
                          <div className="text-xs text-gray-400 font-normal mt-1">{u.created_at ? new Date(u.created_at).toLocaleDateString('vi-VN') : 'N/A'}</div>
                        </td>

                        {/* Cột quyền hạn + Logic dropdown thay đổi quyền hạn theo yêu cầu */}
                        <td className="px-6 py-4">
                          <select
                            value={u.role.toLowerCase()}
                            disabled={isTargetAdmin}
                            onChange={(e) => handleRoleChange(u.id, u, e.target.value)}
                            className={`px-3 py-1.5 rounded-xl border text-xs font-bold outline-none transition cursor-pointer ${
                              isTargetAdmin 
                                ? 'bg-red-50 border-red-100 text-red-600 disabled:opacity-90 cursor-not-allowed' 
                                : u.role.toLowerCase() === 'teacher' 
                                ? 'bg-emerald-50 border-emerald-100 text-emerald-600' 
                                : 'bg-blue-50 border-blue-100 text-blue-600'
                            }`}
                          >
                            <option value="student">Học viên (Student)</option>
                            <option value="teacher">Giảng viên (Teacher)</option>
                            {isTargetAdmin && <option value="admin">Quản trị viên (Admin)</option>}
                          </select>
                        </td>

                        {/* Cột Hành động: Đổi mật khẩu & Xóa tài khoản cấp thấp */}
                        <td className="px-6 py-4 text-center">
                          <div className="flex justify-center items-center gap-2">
                            {/* Nút ép reset mật khẩu */}
                            <button
                              type="button"
                              onClick={() => { setSelectedUser(u); setShowPassModal(true); }}
                              title="Đặt lại mật khẩu cho tài khoản này"
                              className="p-2 bg-slate-50 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition cursor-pointer"
                            >
                              <i className="fas fa-key text-xs"></i>
                            </button>

                            {/* Nút Xóa: Sẽ mờ đi và bị chặn click nếu đối tượng là Admin khác */}
                            <button
                              type="button"
                              disabled={isTargetAdmin}
                              onClick={() => handleDeleteUser(u)}
                              title={isTargetAdmin ? "Không cho phép xóa tài khoản Admin khác" : "Xóa vĩnh viễn người dùng này"}
                              className={`p-2 rounded-xl transition ${
                                isTargetAdmin 
                                  ? 'bg-gray-50 text-gray-300 cursor-not-allowed' 
                                  : 'bg-slate-50 text-slate-400 hover:text-red-600 hover:bg-red-50 cursor-pointer'
                              }`}
                            >
                              <i className="far fa-trash-alt text-xs"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* MODAL PHỤ PHỤC VỤ CHỨC NĂNG CẬP NHẬT MẬT KHẨU TỪ ADMIN */}
      {showPassModal && selectedUser && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-[2rem] p-8 w-full max-w-sm border border-gray-100 shadow-xl space-y-5">
            <div className="text-center">
              <div className="w-12 h-12 bg-red-50 text-red-600 rounded-xl flex items-center justify-center text-xl mx-auto mb-2"><i className="fas fa-lock text-sm"></i></div>
              <h3 className="font-extrabold text-gray-800 text-lg">Đặt lại mật khẩu</h3>
              <p className="text-gray-400 text-xs mt-0.5">Đặt mật khẩu mới thay thế cho người dùng <br/><b className="text-gray-600 font-bold">{selectedUser.name}</b></p>
            </div>

            <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Mật khẩu ép buộc mới</label>
                <input 
                  type="text" 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  placeholder="Nhập tối thiểu 6 ký tự..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-500 text-sm font-medium"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => { setShowPassModal(false); setNewPassword(''); }} 
                  className="flex-1 py-2.5 bg-gray-100 text-gray-500 text-xs font-bold rounded-xl hover:bg-gray-200 transition cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button 
                  type="submit" 
                  disabled={updatingPass}
                  className="flex-1 py-2.5 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition disabled:opacity-75 cursor-pointer"
                >
                  {updatingPass ? "Đang lưu..." : "Xác nhận đổi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default ManageUsers;