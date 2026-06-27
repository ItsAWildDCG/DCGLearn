import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const UpdatePass = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  
  // State quản lý 3 trường nhập liệu mật khẩu bắt buộc
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // State hỗ trợ ẩn/hiện mật khẩu để nâng cao trải nghiệm (UX)
  const [showPass, setShowPass] = useState({ current: false, new: false, confirm: false });

  const navigate = useNavigate();

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    // Kiểm tra đăng nhập bảo mật hệ thống
    if (!token || !userStr) { navigate('/login'); return; }

    setUser(JSON.parse(userStr));
  }, [navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleToggleShow = (field) => {
    setShowPass(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ text: '', type: '' });

    // 1. Kiểm tra độ dài mật khẩu mới
    if (formData.newPassword.length < 6) {
      setMessage({ text: 'Mật khẩu mới phải có độ dài từ 6 ký tự trở lên.', type: 'error' });
      return;
    }

    // 2. Kiểm tra mật khẩu mới và xác nhận mật khẩu có khớp khớp hay không
    if (formData.newPassword !== formData.confirmPassword) {
      setMessage({ text: 'Mật khẩu mới và xác nhận lại mật khẩu không trùng khớp nhau.', type: 'error' });
      return;
    }

    setLoading(true);
    const token = localStorage.getItem('token');

    try {
      // 3. Gửi API cập nhật mật khẩu lên Backend
      const response = await fetch('/api/auth/change-password', {
        method: 'PUT', // Thường dùng PUT hoặc POST cho cập nhật bảo mật
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword
        })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ text: 'Đổi mật khẩu thành công! Hệ thống đang chuyển hướng về trang cá nhân... 🎉', type: 'success' });
        setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        
        // Chờ hiệu ứng thông báo 2 giây rồi tự động quay về trang Profile
        setTimeout(() => {
          navigate('/profile');
        }, 2000);
      } else {
        setMessage({ text: data.message || 'Mật khẩu hiện tại không chính xác.', type: 'error' });
      }
    } catch (error) {
      console.error('Lỗi khi đổi mật khẩu:', error);
      setMessage({ text: 'Đã xảy ra lỗi hệ thống khi gửi yêu cầu đổi mật khẩu.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#FBFCFE] flex flex-col font-['Inter']">
      <Navbar user={user} />

      <main className="container mx-auto px-4 py-12 flex-grow flex items-center justify-center">
        <div className="w-full max-w-md space-y-6">
          
          {/* Nút quay lại trang cá nhân */}
          <Link 
            to="/profile" 
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600 transition font-medium"
          >
            <i className="fas fa-arrow-left text-xs"></i> Quay lại hồ sơ
          </Link>

          {/* Form đổi mật khẩu chính */}
          <div className="bg-white rounded-[2rem] border border-gray-100 p-8 shadow-sm">
            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-3 text-2xl shadow-sm">
                <i className="fas fa-key"></i>
              </div>
              <h1 className="text-2xl font-extrabold text-gray-800">Đổi mật khẩu</h1>
              <p className="text-gray-400 text-sm mt-1">Vui lòng thiết lập mật khẩu mạnh để bảo vệ tài khoản.</p>
            </div>

            {/* Khối hiển thị thông báo trạng thái */}
            {message.text && (
              <div className={`p-4 rounded-xl text-sm mb-5 flex items-start gap-2.5 font-medium border ${
                message.type === 'success' 
                  ? 'bg-green-50 border-green-100 text-green-700' 
                  : 'bg-red-50 border-red-100 text-red-700'
              }`}>
                <i className={`mt-0.5 ${message.type === 'success' ? 'fas fa-check-circle' : 'fas fa-exclamation-circle'}`}></i>
                <span>{message.text}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* Trường 1: Mật khẩu hiện tại */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Mật khẩu hiện tại</label>
                <div className="relative">
                  <input 
                    type={showPass.current ? "text" : "password"}
                    name="currentPassword"
                    value={formData.currentPassword}
                    onChange={handleInputChange}
                    required
                    placeholder="••••••••"
                    className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-blue-50 focus:border-blue-500 outline-none transition-all text-sm text-gray-800 font-medium"
                  />
                  <button 
                    type="button"
                    onClick={() => handleToggleShow('current')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                  >
                    <i className={showPass.current ? "far fa-eye-slash" : "far fa-eye"}></i>
                  </button>
                </div>
              </div>

              {/* Trường 2: Mật khẩu mới */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Mật khẩu mới</label>
                <div className="relative">
                  <input 
                    type={showPass.new ? "text" : "password"}
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleInputChange}
                    required
                    placeholder="Tối thiểu 6 ký tự"
                    className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-blue-50 focus:border-blue-500 outline-none transition-all text-sm text-gray-800 font-medium"
                  />
                  <button 
                    type="button"
                    onClick={() => handleToggleShow('new')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                  >
                    <i className={showPass.new ? "far fa-eye-slash" : "far fa-eye"}></i>
                  </button>
                </div>
              </div>

              {/* Trường 3: Xác nhận mật khẩu mới */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Xác nhận mật khẩu mới</label>
                <div className="relative">
                  <input 
                    type={showPass.confirm ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    required
                    placeholder="Nhập lại mật khẩu mới"
                    className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-blue-50 focus:border-blue-500 outline-none transition-all text-sm text-gray-800 font-medium"
                  />
                  <button 
                    type="button"
                    onClick={() => handleToggleShow('confirm')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                  >
                    <i className={showPass.confirm ? "far fa-eye-slash" : "far fa-eye"}></i>
                  </button>
                </div>
              </div>

              {/* Khối nút Hành động Submit */}
              <div className="pt-2">
                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition shadow-md shadow-blue-100 disabled:opacity-70 flex items-center justify-center gap-2 text-sm cursor-pointer"
                >
                  {loading ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i> Đang xử lý cập nhật...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-shield-alt"></i> Cập nhật mật khẩu mới
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
};

export default UpdatePass;