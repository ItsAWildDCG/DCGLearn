import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthHeader from '../components/AuthHeader';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: '', type: '' });

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (response.ok) {
        setMessage({ 
          text: result.message || 'Đăng ký thành công! Đang chuyển hướng...', 
          type: 'success' 
        });
        setTimeout(() => navigate('/login'), 1500);
      } else {
        setMessage({ 
          text: result.message || 'Email đã được sử dụng!', 
          type: 'error' 
        });
      }
    } catch (error) {
      setMessage({ 
        text: 'Không thể kết nối tới server. Hãy kiểm tra máy chủ!', 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
        <AuthHeader 
          title="Tạo tài khoản mới" 
          subtitle="Khám phá kho tàng kiến thức cùng DCGLearn" 
        />

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Họ và tên */}
          <div className="space-y-1">
            <label className="text-sm font-semibold text-gray-700 ml-1">Họ và tên</label>
            <div className="relative">
              <i className="far fa-user absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
              <input 
                type="text" id="name" required
                placeholder="Ví dụ: Nguyễn Văn A"
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-1">
            <label className="text-sm font-semibold text-gray-700 ml-1">Địa chỉ Email</label>
            <div className="relative">
              <i className="far fa-envelope absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
              <input 
                type="email" id="email" required
                placeholder="name@school.edu.vn"
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Vai trò */}
          <div className="space-y-1">
            <label className="text-sm font-semibold text-gray-700 ml-1">Bạn là?</label>
            <div className="relative">
              <i className="fas fa-user-tag absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
              <select 
                id="role" required
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none appearance-none transition-all"
                onChange={handleChange}
              >
                <option value="" disabled selected>Chọn vai trò</option>
                <option value="Học viên">Học viên (Người học)</option>
                <option value="Giảng viên">Giảng viên (Người dạy)</option>
              </select>
            </div>
          </div>

          {/* Mật khẩu */}
          <div className="space-y-1">
            <label className="text-sm font-semibold text-gray-700 ml-1">Mật khẩu</label>
            <div className="relative">
              <i className="fas fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
              <input 
                type="password" id="password" required
                placeholder="Tối thiểu 6 ký tự"
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                onChange={handleChange}
              />
            </div>
          </div>

          <button 
            type="submit" disabled={loading}
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg transition-all disabled:bg-blue-400 mt-4"
          >
            {loading ? <i className="fas fa-spinner fa-spin"></i> : 'Đăng ký tài khoản'}
          </button>

          {message.text && (
            <div className={`p-3 rounded-lg text-sm font-medium text-center ${
              message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {message.text}
            </div>
          )}

          <p className="text-center text-gray-600 text-sm mt-6">
            Đã có tài khoản? <Link to="/login" className="text-blue-600 font-bold hover:underline">Đăng nhập ngay</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Register;