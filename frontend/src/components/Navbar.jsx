import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from './Logo'; // Giữ nguyên component Logo riêng của bạn

const Navbar = ({ user }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();

  // Xử lý đóng dropdown khi click ra vùng ngoài menu
  useEffect(() => {
    const closeDropdown = () => setShowDropdown(false);
    window.addEventListener('click', closeDropdown);
    return () => window.removeEventListener('click', closeDropdown);
  }, []);

  const handleLogout = () => {
    if (window.confirm("Bạn có chắc chắn muốn đăng xuất không?")) {
      localStorage.clear();
      navigate('/login'); // Điều hướng chuẩn Single Page Application của bạn
    }
  };

  const displayName = user?.name || user?.email?.split('@')[0] || 'Quản trị viên';

  return (
    <nav className="bg-white border-b border-slate-100 sticky top-0 z-50 shadow-[0_2px_10px_rgba(0,0,0,0.01)] py-4">
      <div className="container mx-auto px-4 max-w-[1200px] h-16 flex justify-between items-center">
        
        {/* Component Logo tái sử dụng của bạn */}
        <Logo />

        <div className="flex items-center gap-6">
          {/* Các liên kết điều hướng nhanh */}
          <a href="#" className="hidden md:block text-slate-600 font-semibold hover:text-blue-600 transition text-[15px]">
            Thư viện
          </a>
          
          {/* Tích hợp nút Chuông thông báo từ giao diện Admin mới */}
          <button className="text-slate-400 text-lg relative hover:text-slate-600 transition-colors bg-transparent border-none cursor-pointer">
            <i className="far fa-bell"></i>
            <span className="w-2 h-2 bg-red-500 rounded-full absolute -top-0.5 -right-0.5 border-2 border-white"></span>
          </button>
          
          {/* Khu vực User Dropdown kết hợp hiệu ứng mượt mà */}
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button 
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-2.5 border border-slate-100 bg-slate-50 px-3.5 py-1.5 rounded-full hover:bg-slate-100 transition-all duration-200 cursor-pointer"
            >
              <i className="far fa-user-circle text-xl text-blue-600"></i>
              <span className="font-semibold text-slate-700 text-sm">{displayName}</span>
              <i className={`fas fa-chevron-down text-[10px] text-slate-400 transition-transform duration-200 ${showDropdown ? 'rotate-180' : ''}`}></i>
            </button>

            {showDropdown && (
              <div className="absolute right-0 mt-2.5 w-52 bg-white border border-slate-100 rounded-xl shadow-[0_10px_25px_rgba(0,0,0,0.08)] py-1.5 z-50 overflow-hidden animate-fadeIn">
                <div className="px-4 py-2 border-b border-slate-50 mb-1">
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Tài khoản</p>
                  <p className="text-xs font-semibold text-slate-600 truncate">{user?.email || 'Chưa cập nhật email'}</p>
                </div>
                
                <button 
                  onClick={() => navigate('/profile')}
                  className="w-full text-left px-4 py-2.5 text-sm text-slate-600 hover:bg-blue-50 hover:text-blue-600 flex items-center gap-2.5 transition-colors border-none bg-transparent cursor-pointer"
                >
                  <i className="far fa-user opacity-70"></i> Hồ sơ của tôi
                </button>
                
                <button 
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 flex items-center gap-2.5 border-t border-slate-50 mt-1 transition-colors bg-transparent cursor-pointer"
                >
                  <i className="fas fa-sign-out-alt opacity-70"></i> Đăng xuất
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;