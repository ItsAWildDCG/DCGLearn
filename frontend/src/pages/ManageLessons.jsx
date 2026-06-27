import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const ManageLessons = () => {
  const { courseId } = useParams(); // Lấy course_id từ đường dẫn URL
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [course, setCourse] = useState(null); // Lưu thông tin khóa học hiện tại
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);

  // States phục vụ việc Đóng/Mở và quản lý dữ liệu Form trong Modal (Thêm/Sửa)
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' hoặc 'edit'
  const [editingLessonId, setEditingLessonId] = useState(null);
  const [pdfFile, setPdfFile] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    order_index: '',
    content_type: 'Video', // mặc định là video theo ERD (varchar 5)
    textMode: 'Text', // 'Text' hoặc 'PDF' khi đã chọn giáo trình văn bản
    content_text: '',
    content_url: ''
  });

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (!token || !userStr) {
      navigate('/login');
      return;
    }

    const userData = JSON.parse(userStr);
    const role = (userData.role || '').toLowerCase();
    
    // Bảo vệ tuyến đường: Chỉ Giảng viên hoặc Admin mới có quyền vào quản lý bài giảng
    if (role !== 'teacher' && role !== 'giảng viên' && role !== 'admin' && role !== 'quản trị viên') {
      alert('Bạn không có quyền truy cập chức năng này!');
      navigate('/dashboard');
      return;
    }

    setUser(userData);
    loadCourseAndLessons(token);
  }, [courseId, navigate]);

  // Tải thông tin khóa học và danh sách bài giảng đi kèm
  const loadCourseAndLessons = async (token) => {
    try {
      setLoading(true);
      
      // 1. Lấy thông tin chi tiết khóa học để hiển thị tiêu đề
      const courseRes = await fetch(`/api/lessons/course/${courseId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (courseRes.ok) {
        const courseData = await courseRes.json();
        setCourse(courseData);
      }

      // 2. Lấy danh sách bài giảng của khóa học này (được Backend sắp xếp theo order_index)
      const lessonsRes = await fetch(`/api/lessons/course/${courseId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (lessonsRes.ok) {
        const lessonsData = await lessonsRes.json();
        // Giả định backend trả về mảng lessons, sắp xếp tăng dần theo order_index
        setLessons(lessonsData.lessons || []);
      }
    } catch (error) {
      console.error("Lỗi tải dữ liệu bài giảng:", error);
    } finally {
      setLoading(false);
    }
  };

  // Mở modal ở chế độ THÊM MỚI bài giảng
  const openCreateModal = () => {
    setModalMode('create');
    const nextIndex = lessons.length > 0 ? Math.max(...lessons.map(l => Number(l.order_index) || 0)) + 1 : 1;
    setPdfFile(null);
    setFormData({
      title: '',
      description: '',
      order_index: nextIndex,
      content_type: 'Video',
      textMode: 'Text',
      content_text: '',
      content_url: ''
    });
    setShowModal(true);
  };

  // Mở modal ở chế độ CHỈNH SỬA bài giảng dữ liệu cũ
  const openEditModal = (lesson) => {
    setModalMode('edit');
    setEditingLessonId(lesson.lesson_id);
    setPdfFile(null);
    setFormData({
      title: lesson.title || '',
      description: lesson.description || '',
      order_index: lesson.order_index || '',
      content_type: lesson.content_type === 'Video' ? 'Video' : 'Text',
      textMode: lesson.content_type === 'PDF' ? 'PDF' : 'Text',
      content_text: lesson.content_text || '',
      content_url: lesson.content_url || ''
    });
    setShowModal(true);
  };

  // Xử lý Gửi dữ liệu Form (Cả Tạo mới & Cập nhật)
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');

    const isPdfWithoutFile = formData.textMode === 'PDF' && !pdfFile && (!formData.content_url || modalMode === 'create');
    if (formData.content_type !== 'Video' && isPdfWithoutFile) {
      alert('Vui lòng chọn file PDF trước khi gửi.');
      return;
    }

    try {
      let response;

      if (formData.content_type === 'Video') {
        const payload = {
          courseId: Number(courseId),
          title: formData.title,
          description: formData.description,
          order_index: Number(formData.order_index),
          content_type: 'Video',
          content_text: null,
          content_url: formData.content_url
        };

        if (modalMode === 'create') {
          response = await fetch(`/api/lessons`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(payload)
          });
        } else {
          response = await fetch(`/api/lessons/${editingLessonId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(payload)
          });
        }
      } else if (formData.textMode === 'PDF') {
        const formPayload = new FormData();
        formPayload.append('courseId', courseId);
        formPayload.append('title', formData.title);
        formPayload.append('description', formData.description);
        formPayload.append('order_index', formData.order_index);
        formPayload.append('content_type', 'PDF');
        if (pdfFile) {
          formPayload.append('pdf', pdfFile);
        }

        if (modalMode === 'create') {
          response = await fetch(`/api/lessons/upload-pdf`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formPayload
          });
        } else {
          response = await fetch(`/api/lessons/pdf/${editingLessonId}`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formPayload
          });
        }
      } else {
        const payload = {
          courseId: Number(courseId),
          title: formData.title,
          description: formData.description,
          order_index: Number(formData.order_index),
          content_type: 'Text',
          content_text: formData.content_text,
          content_url: null
        };

        if (modalMode === 'create') {
          response = await fetch(`/api/lessons`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(payload)
          });
        } else {
          response = await fetch(`/api/lessons/${editingLessonId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(payload)
          });
        }
      }

      const result = await response.json();

      if (response.ok) {
        alert(modalMode === 'create' ? "Thêm bài giảng thành công! 🎉" : "Cập nhật bài giảng thành công! 💾");
        setShowModal(false);
        setPdfFile(null);
        loadCourseAndLessons(token);
      } else {
        alert(result.message || "Có lỗi xảy ra, vui lòng kiểm tra lại ràng buộc trùng lặp STT (Unique Order Index). Nếu là PDF, hãy kiểm tra định dạng file.");
      }
    } catch (error) {
      console.error("Lỗi xử lý bài giảng:", error);
      alert("Không thể kết nối đến máy chủ.");
    }
  };

  // CHỨC NĂNG XÓA BÀI GIẢNG
  const handleDeleteLesson = async (lessonId, lessonTitle) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa bài giảng [ ${lessonTitle} ] không? Hành động này không thể hoàn tác!`)) return;
    
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`/api/lessons/${lessonId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        alert("Đã xóa bài giảng thành công!");
        // Cập nhật nhanh UI cục bộ bằng cách loại bỏ bài giảng vừa xóa
        setLessons(prev => prev.filter(l => l.lesson_id !== lessonId));
      } else {
        alert("Xóa bài giảng thất bại từ phía máy chủ.");
      }
    } catch (error) {
      console.error("Lỗi xóa bài giảng:", error);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#FBFCFE] flex flex-col font-['Inter']">
      <Navbar user={user} />

      <main className="container mx-auto px-4 py-10 flex-grow max-w-5xl">
        {/* Thanh điều hướng quay lại & Tiêu đề */}
        <div className="mb-8">
          <Link to="/manage-courses" className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1.5 w-max mb-3">
            <i className="fas fa-arrow-left"></i> Quay lại Quản lý khóa học
          </Link>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <span className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">Mô-đun Giảng Viên</span>
              <h1 className="text-2xl font-extrabold text-gray-800 mt-2 flex items-center gap-2">
                <i className="fas fa-layer-group text-slate-700"></i> Cấu Trúc Bài Giảng
              </h1>
              <p className="text-gray-400 text-sm mt-0.5">
                Khóa học: <span className="text-gray-600 font-bold">{course ? course.title : `Đang tải (#ID:${courseId})...`}</span>
              </p>
            </div>
            <button
              type="button"
              onClick={openCreateModal}
              className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition shadow-lg shadow-blue-100 flex items-center gap-2 w-max cursor-pointer"
            >
              <i className="fas fa-plus"></i> Thêm bài giảng mới
            </button>
          </div>
        </div>

        {/* Khối danh sách bài giảng */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : lessons.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-gray-100">
                <i className="fas fa-book-open text-2xl text-gray-300"></i>
              </div>
              <h3 className="text-base font-bold text-gray-700">Khóa học này chưa có bài giảng</h3>
              <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">Vui lòng bấm nút "Thêm bài giảng mới" ở góc trên để tạo nội dung học đầu tiên.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {/* Vòng lặp map danh sách bài giảng theo thứ tự order_index */}
              {lessons.map((lesson) => (
                <div key={lesson.lesson_id} className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-50/40 transition">
                  <div className="flex items-start gap-4 flex-grow min-w-0">
                    {/* Badge hiển thị số thứ tự bài giảng (order_index) */}
                    <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 font-mono font-extrabold text-slate-700 flex flex-col items-center justify-center flex-shrink-0 shadow-sm">
                      <span className="text-[10px] uppercase text-gray-400 font-bold tracking-tight">Bài</span>
                      <span className="text-base -mt-1">{lesson.order_index}</span>
                    </div>
                    <div className="min-w-0 flex-grow">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-gray-800 truncate text-base">{lesson.title}</h4>
                        {/* Định dạng loại bài giảng */}
                        <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider ${
                          (lesson.content_type || '').toLowerCase() === 'video' 
                            ? 'bg-red-50 text-red-600 border border-red-100' 
                            : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                        }`}>
                          <i className={(lesson.content_type || '').toLowerCase() === 'video' ? "fas fa-play text-[8px] mr-1" : "fas fa-file-alt text-[8px] mr-1"}></i>
                          {lesson.content_type}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 font-normal mt-1 line-clamp-2">{lesson.description || "Chưa có mô tả tóm tắt cho bài giảng này."}</p>
                    </div>
                  </div>

                  {/* Cụm nút Hành động sửa/xóa */}
                  <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => openEditModal(lesson)}
                      className="px-3.5 py-2 bg-slate-50 text-slate-600 hover:text-blue-600 hover:bg-blue-50 border border-slate-100 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      <i className="far fa-edit text-xs"></i> Sửa
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteLesson(lesson.lesson_id, lesson.title)}
                      className="p-2 bg-slate-50 text-slate-400 hover:text-red-600 hover:bg-red-50 border border-slate-100 rounded-xl transition cursor-pointer"
                      title="Xóa bài giảng"
                    >
                      <i className="far fa-trash-alt text-xs"></i>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* ========================================================================= */}
      {/* MODAL PHÒNG CHỨC NĂNG: FORM THÊM / SỬA BÀI GIẢNG (TỰ ĐỘNG THAY ĐỔI FORM) */}
      {/* ========================================================================= */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] p-6 md:p-8 w-full max-w-xl border border-gray-100 shadow-2xl max-h-[90vh] overflow-y-auto space-y-6">
            
            {/* Đầu tiêu đề Modal */}
            <div className="flex items-center justify-between border-b border-gray-50 pb-4">
              <div>
                <h3 className="font-extrabold text-gray-800 text-lg">
                  {modalMode === 'create' ? 'Thêm bài giảng mới' : 'Chỉnh sửa bài giảng'}
                </h3>
                <p className="text-gray-400 text-xs mt-0.5">Thiết lập phân phối học liệu vào cấu trúc khóa học.</p>
              </div>
              <button 
                type="button" 
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-full bg-slate-50 text-slate-400 hover:text-gray-600 flex items-center justify-center transition cursor-pointer"
              >
                <i className="fas fa-times text-sm"></i>
              </button>
            </div>

            {/* Thân Form nhập liệu */}
            <form onSubmit={handleFormSubmit} className="space-y-4">
              
              {/* Hàng 1: Tiêu đề bài giảng & Số thứ tự (order_index) */}
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2 space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase block">Tên bài giảng *</label>
                  <input 
                    type="text" 
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    required
                    placeholder="Ví dụ: Cài đặt môi trường NodeJS"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-500 text-sm font-medium"
                  />
                </div>
                <div className="col-span-1 space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase block" title="Thứ tự hiển thị bài giảng">Số thứ tự *</label>
                  <input 
                    type="number" 
                    value={formData.order_index}
                    onChange={(e) => setFormData({...formData, order_index: e.target.value})}
                    required
                    min="1"
                    placeholder="STT"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-500 text-sm font-mono font-bold text-center text-blue-600"
                  />
                </div>
              </div>

              {/* Hàng 2: Mô tả ngắn */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase block">Mô tả tóm tắt bài học</label>
                <input 
                  type="text" 
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Nêu ngắn gọn nội dung cốt lõi của bài (tối đa 150 ký tự)..."
                  maxLength="150"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-500 text-sm font-medium"
                />
              </div>

              {/* Hàng 3: Loại định dạng bài giảng (Đồng bộ cột content_type trong ERD) */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase block">Hình thức học liệu *</label>
                <div className="grid grid-cols-2 gap-3">
                  <label className={`p-3 rounded-xl border flex items-center justify-center gap-2 cursor-pointer text-xs font-bold transition-all ${
                    formData.content_type === 'Video' 
                      ? 'bg-blue-50 border-blue-200 text-blue-600 shadow-sm' 
                      : 'bg-white border-slate-100 text-slate-500 hover:bg-slate-50'
                  }`}>
                    <input 
                      type="radio" 
                      name="content_type" 
                      value="Video" 
                      checked={formData.content_type === 'Video'}
                      onChange={(e) => setFormData({...formData, content_type: e.target.value, content_url: '', content_text: '', textMode: 'Text'})}
                      className="hidden" 
                    />
                    <i className="fas fa-video"></i> Bài giảng bằng Video
                  </label>

                  <label className={`p-3 rounded-xl border flex items-center justify-center gap-2 cursor-pointer text-xs font-bold transition-all ${
                    formData.content_type === 'Text' 
                      ? 'bg-blue-50 border-blue-200 text-blue-600 shadow-sm' 
                      : 'bg-white border-slate-100 text-slate-500 hover:bg-slate-50'
                  }`}>
                    <input 
                      type="radio" 
                      name="content_type" 
                      value="Text" 
                      checked={formData.content_type === 'Text'}
                      onChange={(e) => setFormData({...formData, content_type: e.target.value, content_url: '', content_text: '', textMode: 'Text'})}
                      className="hidden" 
                    />
                    <i className="fas fa-file-alt"></i> Giáo trình Văn bản
                  </label>
                </div>
              </div>

              {/* Hàng 4: LOGIC TỰ ĐỘNG ĐỔI Ô NHẬP LIỆU THEO CONTENT_TYPE */}
              {formData.content_type === 'Video' ? (
                <div className="space-y-1.5 animate-fadeIn">
                  <label className="text-xs font-bold text-gray-500 uppercase block">Đường dẫn Video bài giảng (URL) *</label>
                  <div className="relative">
                    <i className="fab fa-youtube absolute left-4 top-1/2 -translate-y-1/2 text-red-500 text-sm"></i>
                    <input 
                      type="url" 
                      value={formData.content_url}
                      onChange={(e) => setFormData({...formData, content_url: e.target.value})}
                      required
                      placeholder="https://youtube.com/watch?v=... hoặc link video luồng khác"
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-500 text-sm font-medium font-mono"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4 animate-fadeIn">
                  <div className="grid grid-cols-2 gap-3">
                    <label className={`p-3 rounded-xl border flex items-center justify-center gap-2 cursor-pointer text-xs font-bold transition-all ${
                      formData.textMode === 'Text' 
                        ? 'bg-blue-50 border-blue-200 text-blue-600 shadow-sm' 
                        : 'bg-white border-slate-100 text-slate-500 hover:bg-slate-50'
                    }`}>
                      <input 
                        type="radio" 
                        name="textMode" 
                        value="Text" 
                        checked={formData.textMode === 'Text'}
                        onChange={(e) => setFormData({...formData, textMode: e.target.value, content_text: '', content_url: ''})}
                        className="hidden" 
                      />
                      <i className="fas fa-align-left"></i> Text thuần
                    </label>
                    <label className={`p-3 rounded-xl border flex items-center justify-center gap-2 cursor-pointer text-xs font-bold transition-all ${
                      formData.textMode === 'PDF' 
                        ? 'bg-blue-50 border-blue-200 text-blue-600 shadow-sm' 
                        : 'bg-white border-slate-100 text-slate-500 hover:bg-slate-50'
                    }`}>
                      <input 
                        type="radio" 
                        name="textMode" 
                        value="PDF" 
                        checked={formData.textMode === 'PDF'}
                        onChange={(e) => setFormData({...formData, textMode: e.target.value, content_text: '', content_url: ''})}
                        className="hidden" 
                      />
                      <i className="fas fa-file-pdf"></i> Upload PDF
                    </label>
                  </div>

                  {formData.textMode === 'PDF' ? (
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-500 uppercase block">Tải lên file PDF *</label>
                      <input
                        type="file"
                        accept="application/pdf"
                        onChange={(e) => setPdfFile(e.target.files?.[0] ?? null)}
                        className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-600 hover:file:bg-blue-100"
                      />
                      {modalMode === 'edit' && formData.content_url && (
                        <p className="text-xs text-gray-400">
                          File hiện tại: <a href={formData.content_url} target="_blank" rel="noreferrer" className="text-blue-600 underline">xem PDF</a>
                        </p>
                      )}
                      {!pdfFile && modalMode === 'create' && (
                        <p className="text-xs text-gray-400">Chọn file PDF để upload. Chỉ chấp nhận định dạng .pdf.</p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-500 uppercase block">Nội dung văn bản bài học *</label>
                      <textarea 
                        rows="6" 
                        value={formData.content_text}
                        onChange={(e) => setFormData({...formData, content_text: e.target.value})}
                        required
                        placeholder="Soạn thảo giáo trình hướng dẫn lý thuyết, mã nguồn thực hành tại đây (chấp nhận tối đa 10.000 ký tự)..."
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-500 text-sm font-medium resize-none"
                      ></textarea>
                    </div>
                  )}
                </div>
              )}

              {/* Phần chân Modal chứa nút Lưu/Hủy */}
              <div className="pt-4 flex gap-3 border-t border-gray-50">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-500 text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition shadow-md shadow-blue-100 cursor-pointer"
                >
                  {modalMode === 'create' ? 'Xác nhận thêm' : 'Lưu thay đổi'}
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

export default ManageLessons;