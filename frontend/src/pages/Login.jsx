import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Logo from '../components/Logo';
import Footer from '../components/Footer';


const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const navigate = useNavigate();

  // Kiểm tra nếu đã đăng nhập thì tự động chuyển hướng (Auto-login)
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        redirectByRole(user.role);
      } catch (e) {
        localStorage.clear();
      }
    }
  }, []);

  const redirectByRole = (role) => {
    const userRole = (role || "").trim();
    if (userRole === 'Teacher' || userRole === 'Giảng viên') {
      navigate('/dashboard-teacher');
    } else if (userRole === 'Student'){
      navigate('/dashboard-student');
    }
     else {
      navigate('/dashboard-admin');
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: '', type: '' });

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const result = await response.json();

      if (response.ok) {
        localStorage.setItem('token', result.token);
        localStorage.setItem('user', JSON.stringify(result.user));
        setMessage({ text: 'Đăng nhập thành công!', type: 'success' });
        
        setTimeout(() => {
          redirectByRole(result.user.role);
        }, 800);
      } else {
        setMessage({ text: result.message || 'Sai thông tin đăng nhập', type: 'error' });
      }
    } catch (error) {
      setMessage({ text: 'Không thể kết nối đến máy chủ!', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <main className="flex-grow flex items-center">
        <div className="container mx-auto px-4 py-12">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
            
            {/* Hero Content (Bên trái) */}
            <div className="max-w-xl text-center lg:text-left">
              <Logo className="justify-center lg:justify-start mb-6" />
              <p className="text-gray-600 mb-4 font-medium italic">Hệ thống quản lý học tập trực tuyến</p>
              <h1 className="text-4xl lg:text-5xl font-extrabold text-gray-900 leading-tight mb-8">
                Năng động. Sáng tạo. <br/>
                <span className="text-blue-600">Phát triển bản thân.</span>
              </h1>
              
              <div className="space-y-4">
                {[
                  "Học liệu đa dạng & phong phú",
                  "Tương tác với giảng viên nhanh chóng",
                  "Theo dõi lộ trình học tập cá nhân"
                ].map((text, index) => (
                  <div key={index} className="flex items-center justify-center lg:justify-start gap-3 text-gray-700">
                    <i className="fas fa-check-circle text-green-500"></i>
                    <span className="font-semibold">{text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Login Card (Bên phải) */}
            <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-2xl border border-gray-100">
              <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">Đăng nhập hệ thống</h3>
              
              <form onSubmit={handleLogin} className="space-y-5">
                <div className="relative">
                  <i className="fas fa-envelope absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
                  <input 
                    type="email" 
                    placeholder="Email của bạn"
                    required
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div className="relative">
                  <i className="fas fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
                  <input 
                    type="password" 
                    placeholder="Mật khẩu"
                    required
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-200 transition-all flex justify-center items-center gap-2 disabled:bg-blue-400"
                >
                  {loading ? <i className="fas fa-spinner fa-spin"></i> : 'Truy cập ngay'}
                </button>

                {message.text && (
                  <div className={`mt-4 text-center text-sm font-bold flex items-center justify-center gap-2 ${message.type === 'success' ? 'text-green-600' : 'text-red-500'}`}>
                    <i className={`fas ${message.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}`}></i>
                    {message.text}
                  </div>
                )}
              </form>

              <div className="mt-8 text-center text-gray-600">
                Chưa có tài khoản? 
                <Link to="/register" className="text-blue-600 hover:underline ml-1">
                Đăng ký tại đây
                </Link>
                </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Login;