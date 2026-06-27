import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Alert from '../components/Alert';

const CreateCourse = () => {
  const { id } = useParams(); // Lấy ID nếu là chế độ chỉnh sửa
  const isEditMode = !!id;
  const navigate = useNavigate();
  
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  
  const [formData, setFormData] = useState({
    title: '',
    description: ''
  });

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (!token || !userStr) {
      navigate('/login');
      return;
    }

    const userData = JSON.parse(userStr);
    setUser(userData);

    // Nếu là chế độ Edit, fetch dữ liệu cũ
    if (isEditMode) {
      fetchCourseDetail(id, token);
    }
  }, [id, isEditMode, navigate]);

  const fetchCourseDetail = async (courseId, token) => {
    try {
      const response = await fetch(`/api/courses/${courseId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setFormData({
          title: data.title || '',
          description: data.description || ''
        });
      }
    } catch (error) {
      console.error("Lỗi lấy thông tin khóa học:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: '', type: '' });

    const token = localStorage.getItem('token');

    try {
      const method = isEditMode ? 'PUT' : 'POST';
      const endpoint = isEditMode ? `/api/courses/${id}` : '/api/courses';

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (response.ok) {
        setMessage({ text: isEditMode ? 'Cập nhật thành công!' : 'Tạo khóa học thành công!', type: 'success' });
        setTimeout(() => navigate('/dashboard-teacher'), 1500);
      } else {
        setMessage({ text: result.message || 'Có lỗi xảy ra', type: 'error' });
      }
    } catch (error) {
      setMessage({ text: 'Không thể kết nối đến máy chủ', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-['Inter']">
      <Navbar user={user} />

      <main className="container mx-auto px-4 py-10 flex-grow max-w-4xl">
        <div className="bg-white p-8 md:p-12 rounded-[2rem] shadow-sm border border-slate-100">
          <div className="mb-10">
            <h2 className="text-3xl font-extrabold text-slate-900">
              {isEditMode ? 'Chỉnh sửa khóa học' : 'Tạo khóa học mới'}
            </h2>
            <p className="text-slate-500 mt-2">
              {isEditMode ? 'Cập nhật thông tin bài giảng của bạn.' : 'Điền đầy đủ thông tin bên dưới để xuất bản khóa học.'}
            </p>
          </div>

          <Alert message={message.text} type={message.type} />

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-slate-700">Tên khóa học *</label>
              <input 
                type="text" 
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                placeholder="Ví dụ: Lập trình ReactJS cơ bản" 
                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all"
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-slate-700">Mô tả nội dung *</label>
              <textarea 
                rows="6" 
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Tóm tắt những gì học viên sẽ nhận được..." 
                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all resize-none"
                required
              ></textarea>
              <div className="text-right text-xs text-slate-400 font-medium">
                {formData.description.length}/500 ký tự
              </div>
            </div>

            <div className="pt-6 flex flex-col gap-4">
              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? <i className="fas fa-spinner fa-spin mr-2"></i> : <i className="fas fa-rocket mr-2"></i>}
                {isEditMode ? 'Lưu thay đổi' : 'Hoàn tất & Xuất bản'}
              </button>
              
              <Link 
                to="/dashboard-teacher" 
                className="w-full py-4 bg-white text-slate-500 font-bold rounded-2xl border border-slate-200 hover:bg-slate-50 transition-all text-center"
              >
                Hủy bỏ
              </Link>
            </div>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default CreateCourse;