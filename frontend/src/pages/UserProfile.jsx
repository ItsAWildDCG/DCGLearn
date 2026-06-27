import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import RoleBadge from '../components/RoleBadge';
import EditableField from '../components/EditableField';
import ProfileAvatar from '../components/ProfileAvatar';

const UserProfile = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Quản lý dữ liệu form (Bổ sung thêm trường organization)
  const [formData, setFormData] = useState({ name: '', phone: '', organization: '' });
  
  const navigate = useNavigate();

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (!token || !userStr) { navigate('/login'); return; }

    setUser(JSON.parse(userStr));
    fetchUserProfile(token);
  }, [navigate]);

  // Đồng bộ dữ liệu cũ từ hệ thống nạp vào ô nhập liệu ban đầu
  useEffect(() => {
    if (user) { 
      setFormData({ 
        name: user.name || '', 
        phone: user.phone || '', 
        organization: user.organization || '' 
      }); 
    }
  }, [user]);

  const fetchUserProfile = async (token) => {
    try {
      const response = await fetch('/api/auth/profile', { headers: { 'Authorization': `Bearer ${token}` } });
      if (response.ok) {
        const data = await response.json();
        if (data.user) { setUser(data.user); localStorage.setItem('user', JSON.stringify(data.user)); }
      }
    } catch (error) { console.error('Lỗi khi tải hồ sơ:', error); } finally { setLoading(false); }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsUpdating(true);
    const token = localStorage.getItem('token');

    try {
      // Gửi cả 3 giá trị lên API Backend bao gồm cả trường học/đơn vị mới
      const response = await fetch('/api/auth/profile', { 
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ 
          name: formData.name, 
          phone: formData.phone,
          organization: formData.organization 
        })
      });

      if (response.ok) {
        // Cập nhật lại state cục bộ và localStorage của trình duyệt khi thành công
        const updatedUser = { 
          ...user, 
          name: formData.name, 
          phone: formData.phone,
          organization: formData.organization 
        };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        alert("Cập nhật thông tin cá nhân thành công! 🎉");
        setIsEditing(false);
      } else { alert("Cập nhật thất bại. Vui lòng thử lại."); }
    } catch (error) { console.error("Lỗi khi cập nhật hồ sơ:", error); } finally { setIsUpdating(false); }
  };

  if (!user) return null;
  const currentRole = (user.role || '').toLowerCase();

  // Đổi nhãn động và placeholder phù hợp cho từng vai trò người dùng
  let orgLabel = 'Đơn vị công tác';
  let orgPlaceholder = 'Nhập nơi công tác của bạn';
  
  if (currentRole === 'admin') {
    orgLabel = 'Cấp độ quản trị';
  } else if (currentRole === 'student' || currentRole === 'học viên' || currentRole === 'sinh viên') {
    orgLabel = 'Trường học';
    orgPlaceholder = 'Nhập tên trường bạn đang theo học';
  }

  return (
    <div className="min-h-screen bg-[#FBFCFE] flex flex-col font-['Inter']">
      <Navbar user={user} />

      <main className="container mx-auto px-4 py-10 flex-grow max-w-5xl">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="space-y-6">
            
            <form onSubmit={handleSaveProfile} className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
              
              {/* CỘT TRÁI: Ảnh đại diện & Huy hiệu quyền */}
              <div className="flex flex-col items-center text-center md:border-r border-gray-100 md:pr-8 py-4 w-full justify-center">
                <ProfileAvatar name={user.name} onUploadClick={() => alert('Tính năng upload ảnh sắp ra mắt!')} />
                <h2 className="text-2xl font-extrabold text-gray-800 mb-2 truncate max-w-full">{user.name}</h2>
                <RoleBadge role={user.role} />
              </div>

              {/* CỘT PHẢI: Biểu mẫu nhập liệu */}
              <div className="md:col-span-2 space-y-2 w-full">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-2">
                  <i className="far fa-id-card text-blue-600"></i> Hồ sơ cá nhân
                </h3>
                <div className="h-px bg-gray-100 w-full mb-4"></div>
                
                <EditableField label="Họ và tên" name="name" value={formData.name} isEditing={isEditing} onChange={handleInputChange} />
                <EditableField label="Email" name="email" value={user.email} isEditing={isEditing} disabled={true} />
                <EditableField label="Số điện thoại" name="phone" value={formData.phone} isEditing={isEditing} onChange={handleInputChange} type="tel" placeholder="Chưa cập nhật số điện thoại" />
                
                {/* Trường Học tập / Làm việc linh hoạt */}
                <EditableField 
                  label={orgLabel} 
                  name="organization" 
                  value={isEditing ? formData.organization : (currentRole === 'admin' ? 'Root Admin' : (formData.organization || 'Chưa cập nhật'))} 
                  isEditing={isEditing} 
                  disabled={currentRole === 'admin'} // Khóa cứng với admin, cho phép giảng viên và học viên sửa
                  onChange={handleInputChange}
                  placeholder={orgPlaceholder}
                />

                <EditableField label="Ngày tham gia" name="createdAt" value={user.created_at ? new Date(user.created_at).toLocaleDateString('vi-VN') : '15/05/2026'} isEditing={isEditing} disabled={true} />

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-4 text-sm items-center py-2.5">
                  <span className="text-gray-400 font-medium">ID Người dùng:</span>
                  <span className="sm:col-span-2 text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded w-max">
                    #DCL{user.id ? String(user.id).substring(0, 6).toUpperCase() : '12345'}
                  </span>
                </div>

                {isEditing && (
                  <div className="pt-4 flex justify-end gap-3 border-t border-gray-50">
                    {/* Khi bấm Hủy, khôi phục lại toàn bộ dữ liệu ban đầu từ state user */}
                    <button 
                      type="button" 
                      onClick={() => { 
                        setIsEditing(false); 
                        setFormData({ 
                          name: user.name || '', 
                          phone: user.phone || '', 
                          organization: user.organization || '' 
                        }); 
                      }} 
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold rounded-xl text-xs transition cursor-pointer"
                    >
                      Hủy bỏ
                    </button>
                    <button type="submit" disabled={isUpdating} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition shadow-sm flex items-center gap-1.5 cursor-pointer">{isUpdating ? "Đang lưu..." : "Lưu thay đổi"}</button>
                  </div>
                )}
              </div>

            </form>

            {/* DẢI NÚT ĐIỀU HƯỚNG DƯỚI ĐÁY */}
            {!isEditing && (
              <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm flex flex-col sm:flex-row justify-center items-center gap-4">
                <button type="button" onClick={() => setIsEditing(true)} className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition shadow-md shadow-blue-100 flex items-center justify-center gap-2 text-sm cursor-pointer"><i className="far fa-edit"></i> Chỉnh sửa hồ sơ</button>
                <button type="button" onClick={() => navigate('/change-password')} className="w-full sm:w-auto px-6 py-3 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold rounded-xl border border-slate-200 transition flex items-center justify-center gap-2 text-sm cursor-pointer"><i className="fas fa-lock"></i> Đổi mật khẩu</button>
                <button type="button" onClick={() => navigate(currentRole === 'teacher' || currentRole === 'giảng viên' ? '/dashboard-teacher' : currentRole === 'admin' ? '/dashboard-admin' : '/dashboard-student')} className={`w-full sm:w-auto px-6 py-3 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 text-sm cursor-pointer ${currentRole === 'admin' ? 'bg-red-600 hover:bg-red-700' : 'bg-slate-700 hover:bg-slate-800'}`}><i className={currentRole === 'admin' ? "fas fa-user-shield" : currentRole === 'teacher' || currentRole === 'giảng viên' ? "fas fa-th-large" : "fas fa-graduation-cap"}></i> {currentRole === 'admin' ? 'Trang Quản Trị' : currentRole === 'teacher' || currentRole === 'giảng viên' ? 'Xem khóa học của tôi' : 'Quay lại học tập'}</button>
              </div>
            )}

          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default UserProfile;