import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const ManageAssessments = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [course, setCourse] = useState(null);
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);

  // CHUYỂN ĐỔI CHẾ ĐỘ XEM: 'list' (Danh sách bài tập) hoặc 'questions' (Chi tiết câu hỏi bên trong)
  const [viewMode, setViewMode] = useState('list'); 
  const [selectedAssessment, setSelectedAssessment] = useState(null);
  const [questions, setQuestions] = useState([]);

  // Modals Điều khiển
  const [showAsmModal, setShowAsmModal] = useState(false);
  const [asmModalMode, setAsmModalMode] = useState('create');
  const [editingAsmId, setEditingAsmId] = useState(null);

  const [showQuesModal, setShowQuesModal] = useState(false);
  const [quesModalMode, setQuesModalMode] = useState('create');
  const [editingQuesId, setEditingQuesId] = useState(null);

  // Form Dữ liệu Bài tập (Assessment)
  const [asmForm, setAsmForm] = useState({ title: '', description: '', time_limit: 15 });

  // Form Dữ liệu Câu hỏi & Các đáp án (Question & Options)
  const [quesForm, setQuesForm] = useState({
    question_text: '',
    question_type: 'Single Correct', // single, multiple, True-False
    options: [
      { option_text: '', is_correct: false },
      { option_text: '', is_correct: false },
      { option_text: '', is_correct: false },
      { option_text: '', is_correct: false }
    ]
  });

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (!token || !userStr) { navigate('/login'); return; }

    const userData = JSON.parse(userStr);
    const role = (userData.role || '').toLowerCase();
    if (role !== 'teacher' && role !== 'giảng viên' && role !== 'admin' && role !== 'quản trị viên') {
      alert('Bạn không có quyền truy cập chức năng này!');
      navigate('/dashboard');
      return;
    }
    setUser(userData);
    loadCourseAndAssessments(token);
  }, [courseId, navigate]);

  // =========================================================================
  // LOGIC TẦNG 1: QUẢN LÝ BÀI TẬP (ASSESSMENT CRUD)
  // =========================================================================
  const loadCourseAndAssessments = async (token) => {
    try {
      setLoading(true);
      const courseRes = await fetch(`/api/courses/${courseId}`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (courseRes.ok) setCourse(await courseRes.json());

      const asmRes = await fetch('/api/assessments/all', { headers: { 'Authorization': `Bearer ${token}` } });
      if (asmRes.ok) {
        const data = await asmRes.json();
        const allAssessments = data.assessments || data || [];
        const courseAssessments = allAssessments.filter(a => Number(a.course_id) === Number(courseId));
        setAssessments(courseAssessments);
      } else {
        setAssessments([]);
      }
    } catch (error) {
      console.error(error);
    } finally { setLoading(false); }
  };

  const openCreateAsm = () => {
    setAsmModalMode('create');
    setAsmForm({ title: '', description: '', time_limit: 15 });
    setShowAsmModal(true);
  };

  const openEditAsm = (asm) => {
    setAsmModalMode('edit');
    setEditingAsmId(asm.assessment_id);
    setAsmForm({ title: asm.title, description: asm.description, time_limit: asm.time_limit });
    setShowAsmModal(true);
  };

  const openEditQues = (ques) => {
    setQuesModalMode('edit');
    setEditingQuesId(ques.question_id);
    setQuesForm({
      question_text: ques.question_text,
      question_type: ques.question_type,
      options: ques.options.map(opt => ({ option_text: opt.option_text, is_correct: opt.is_correct }))
    });
    setShowQuesModal(true);
  };

  const handleAsmSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const method = asmModalMode === 'create' ? 'POST' : 'PUT';
    const url = asmModalMode === 'create'
      ? '/api/assessments'
      : `/api/assessments/${editingAsmId}`;
    const payload = {
      title: asmForm.title,
      description: asmForm.description,
      timeLimit: Number(asmForm.time_limit),
      courseId: Number(courseId),
      questions: []
    };

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Lưu bài tập thất bại.');
      }

      alert(`${asmModalMode === 'create' ? 'Thêm' : 'Cập nhật'} bài tập thành công!`);
      setShowAsmModal(false);
      loadCourseAndAssessments(token);
    } catch (error) {
      console.error(error);
      alert(error.message || 'Đã có lỗi khi lưu bài tập.');
    }
  };

  const handleDeleteAsm = async (id) => {
    if (!window.confirm("Xóa bài tập này sẽ xóa toàn bộ câu hỏi bên trong. Bạn có chắc không?")) return;

    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/assessments/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Xóa bài tập thất bại.');
      }
      setAssessments(prev => prev.filter(a => a.assessment_id !== id));
      alert('Đã xóa bài tập thành công.');
    } catch (error) {
      console.error(error);
      alert(error.message || 'Đã có lỗi khi xóa bài tập.');
    }
  };

  const closeQuestionView = () => {
    setViewMode('list');
    setSelectedAssessment(null);
    setQuestions([]);
  };

  const getQuestionsStorageKey = (assessmentId) => `manageAssessmentQuestions_${assessmentId}`;

  const loadQuestionsFromStorage = (assessmentId) => {
    if (!assessmentId) return null;
    try {
      const raw = localStorage.getItem(getQuestionsStorageKey(assessmentId));
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      console.error('Lỗi đọc câu hỏi từ localStorage', error);
      return null;
    }
  };

  const saveQuestionsToStorage = (assessmentId, questions) => {
    if (!assessmentId) return;
    try {
      localStorage.setItem(getQuestionsStorageKey(assessmentId), JSON.stringify(questions));
    } catch (error) {
      console.error('Lỗi lưu câu hỏi vào localStorage', error);
    }
  };

  const loadAssessmentQuestions = async (asm, token) => {
    // Try loading teacher-full view first (includes isCorrect), fallback to student view
    const storedQuestions = loadQuestionsFromStorage(asm.assessment_id);
    if (storedQuestions) setQuestions(storedQuestions);

    try {
      setLoading(true);
      const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

      // Teacher-specific full endpoint
      let res = await fetch(`/api/assessments/full/${asm.assessment_id}`, { headers });
      if (!res.ok) {
        // fallback to public detail (student view)
        res = await fetch(`/api/assessments/${asm.assessment_id}`, { headers });
      }

      if (res.ok) {
        const data = await res.json();
        // Normalize backend shape to match frontend `questions` expected structure
        const backendQuestions = (data.questions || []).map(q => {
          // backend may return questionId/text/type and options with optionId/text/isCorrect
          const normalizedOptions = (q.options || []).map(opt => ({ option_text: opt.text || opt.option_text || '', is_correct: opt.isCorrect || opt.is_correct || false }));
          return {
            question_id: q.questionId || q.question_id,
            question_text: q.text || q.question_text,
            question_type: q.type || q.question_type,
            options: normalizedOptions
          };
        });

        const finalQuestions = backendQuestions.length ? backendQuestions : (storedQuestions || []);
        setQuestions(finalQuestions);
        // keep local copy as fallback
        if (finalQuestions.length) saveQuestionsToStorage(asm.assessment_id, finalQuestions);
      } else {
        setQuestions(storedQuestions || []);
      }
    } catch (error) {
      console.error(error);
      setQuestions(storedQuestions || []);
    } finally {
      setLoading(false);
    }
  };

  // =========================================================================
  // LOGIC TẦNG 2 & 3: QUẢN LÝ CÂU HỎI & ĐÁP ÁN ĐA DẠNG (QUESTION & OPTION BUILDER)
  // =========================================================================
  const enterQuestionView = async (asm) => {
    setSelectedAssessment(asm);
    setViewMode('questions');
    const token = localStorage.getItem('token');
    await loadAssessmentQuestions(asm, token);
  };

  // Đồng bộ thay đổi kiểu câu hỏi -> Tự cấu hình lại mảng options tương ứng
  const handleQuestionTypeChange = (type) => {
    if (type === 'True-False') {
      setQuesForm({
        question_text: quesForm.question_text,
        question_type: type,
        options: [
          { option_text: 'Đúng', is_correct: false },
          { option_text: 'Sai', is_correct: false }
        ]
      });
    } else {
      setQuesForm({
        question_text: quesForm.question_text,
        question_type: type,
        options: [
          { option_text: '', is_correct: false },
          { option_text: '', is_correct: false },
          { option_text: '', is_correct: false },
          { option_text: '', is_correct: false }
        ]
      });
    }
  };

  // Cập nhật text của một đáp án cụ thể
  const handleOptionTextChange = (index, value) => {
    const updatedOptions = [...quesForm.options];
    updatedOptions[index].option_text = value;
    setQuesForm({ ...quesForm, options: updatedOptions });
  };

  // CHỌN ĐÁP ÁN ĐÚNG TRONG FORM (Xử lý thông minh phân tách Single vs Multiple)
  const handleSelectCorrectOption = (index, type) => {
    const updatedOptions = [...quesForm.options];
    if (type === 'Single Correct' || type === 'True-False') {
      // Loại 1 đáp án: Bật index này lên, tắt toàn bộ các index còn lại
      updatedOptions.forEach((opt, idx) => opt.is_correct = idx === index);
    } else {
      // Loại nhiều đáp án: Đảo trạng thái true/false thoải mái tự do
      updatedOptions[index].is_correct = !updatedOptions[index].is_correct;
    }
    setQuesForm({ ...quesForm, options: updatedOptions });
  };

  const handleQuesSubmit = async (e) => {
    e.preventDefault();
    // Kiểm tra xem giảng viên đã tích chọn đáp án đúng nào chưa
    const hasCorrect = quesForm.options.some(o => o.is_correct);
    if (!hasCorrect) { alert("Vui lòng tích chọn ít nhất một đáp án đúng cho câu hỏi này!"); return; }

    const token = localStorage.getItem('token');
    try {
      if (!selectedAssessment?.assessment_id) throw new Error('Không có đề thi được chọn.');

      if (quesModalMode === 'create') {
        const payload = {
          text: quesForm.question_text,
          type: quesForm.question_type,
          options: quesForm.options.map(o => ({ text: o.option_text, isCorrect: !!o.is_correct }))
        };

        const res = await fetch(`/api/assessments/${selectedAssessment.assessment_id}/question`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify(payload)
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.message || 'Thêm câu hỏi thất bại.');
        }

        alert('Thêm câu hỏi thành công!');
      } else {
        // update
        const payload = {
          text: quesForm.question_text,
          options: quesForm.options.map(o => ({ text: o.option_text, isCorrect: !!o.is_correct }))
        };

        const res = await fetch(`/api/assessments/questions/${editingQuesId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify(payload)
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.message || 'Cập nhật câu hỏi thất bại.');
        }

        alert('Cập nhật câu hỏi thành công!');
      }

      // Sau khi thành công, reload từ backend
      await loadAssessmentQuestions(selectedAssessment, token);
      setShowQuesModal(false);
    } catch (error) {
      console.error(error);
      alert(error.message || 'Đã có lỗi khi lưu câu hỏi.');
    }
  };

  const handleDeleteQues = async (id) => {
    if (!window.confirm("Bạn muốn xóa câu hỏi này?")) return;
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/assessments/questions/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Xóa câu hỏi thất bại.');
      }

      // reload questions from backend
      if (selectedAssessment) await loadAssessmentQuestions(selectedAssessment, token);
      alert('Đã xóa câu hỏi.');
    } catch (error) {
      console.error(error);
      alert(error.message || 'Đã có lỗi khi xóa câu hỏi.');
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#FBFCFE] flex flex-col font-['Inter']">
      <Navbar user={user} />

      <main className="container mx-auto px-4 py-10 flex-grow max-w-5xl">
        
        {/* ========================================================================= */}
        {/* VIEW MÀN HÌNH 1: DANH SÁCH BÀI TẬP TỔNG (VIEW MODE == 'LIST') */}
        {/* ========================================================================= */}
        {viewMode === 'list' && (
          <div>
            <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <Link to="/manage-courses" className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1.5 mb-2 w-max">
                  <i className="fas fa-arrow-left"></i> Quay lại Quản lý khóa học
                </Link>
                <h1 className="text-2xl font-extrabold text-gray-800 flex items-center gap-2">
                  <i className="fas fa-clipboard-list text-purple-600"></i> Quản Lý Bài Tập Trắc Nghiệm
                </h1>
                <p className="text-gray-400 text-sm mt-0.5">Khóa học: <span className="font-bold text-gray-600">{course?.title || 'Đang tải...'}</span></p>
              </div>
              <button onClick={openCreateAsm} className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition shadow-md cursor-pointer">
                <i className="fas fa-plus mr-1"></i> Tạo đề bài tập mới
              </button>
            </div>

            {loading ? (
              <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div></div>
            ) : assessments.length === 0 ? (
              <div className="bg-white p-12 text-center rounded-3xl border border-gray-100 text-gray-400">Chưa có đề kiểm tra nào được tạo cho khóa học này.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {assessments.map(asm => (
                  <div key={asm.assessment_id} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition">
                    <div className="space-y-2">
                      <div className="flex justify-between items-start gap-2">
                        <h3 className="font-extrabold text-gray-800 text-base line-clamp-1">{asm.title}</h3>
                        <span className="text-[10px] bg-purple-50 text-purple-600 border border-purple-100 px-2 py-0.5 rounded-md font-bold flex items-center gap-1 whitespace-nowrap">
                          <i className="far fa-clock"></i> {asm.time_limit} phút
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 line-clamp-2">{asm.description || 'Không có mô tả chi tiết.'}</p>
                    </div>

                    <div className="mt-6 pt-4 border-t border-gray-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => enterQuestionView(asm)} className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5">
                          <i className="fas fa-cog"></i> Cài đặt câu hỏi
                        </button>
                        <Link
                          to={`/courses/${courseId}/assessments/${asm.assessment_id}/submissions`}
                          className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5"
                        >
                          <i className="fas fa-chart-line"></i> Xem kết quả
                        </Link>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEditAsm(asm)} className="px-3 py-2 bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-700 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1">
                          <i className="far fa-edit"></i> Sửa
                        </button>
                        <button onClick={() => handleDeleteAsm(asm.assessment_id)} className="px-3 py-2 bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-700 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1">
                          <i className="far fa-trash-alt"></i> Xóa
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW MÀN HÌNH 2: TRÌNH DỰNG CÂU HỎI PHÂN RÃ CHI TIẾT (VIEW MODE == 'QUESTIONS') */}
        {/* ========================================================================= */}
        {viewMode === 'questions' && (
          <div>
            <div className="mb-6">
              <button onClick={() => setViewMode('list')} className="text-xs font-bold text-slate-500 hover:text-slate-700 flex items-center gap-1 w-max mb-3 cursor-pointer">
                <i className="fas fa-chevron-left"></i> Quay ra danh sách bài tập tổng
              </button>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-900 text-white p-6 rounded-3xl shadow-sm">
                <div>
                  <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest block">Đang biên soạn câu hỏi cho đề:</span>
                  <h2 className="text-lg font-extrabold mt-1">{selectedAssessment?.title}</h2>
                </div>
                <button 
                  onClick={() => {
                    setQuesModalMode('create');
                    setQuesForm({ question_text: '', question_type: 'Single Correct', options: [{ option_text: '', is_correct: false }, { option_text: '', is_correct: false }, { option_text: '', is_correct: false }, { option_text: '', is_correct: false }] });
                    setShowQuesModal(true);
                  }}
                  className="px-4 py-2.5 bg-cyan-500 hover:bg-cyan-600 text-slate-900 font-extrabold rounded-xl text-xs transition whitespace-nowrap cursor-pointer"
                >
                  <i className="fas fa-plus-circle mr-1"></i> Thêm câu hỏi trắc nghiệm
                </button>
              </div>
            </div>

            {/* Danh sách các câu hỏi hiện có trong đề */}
            <div className="space-y-4">
              {questions.length === 0 ? (
                <div className="bg-white p-12 text-center rounded-3xl border border-dashed text-gray-400">Đề thi này trống rỗng. Hãy bấm nút phía trên để tạo câu hỏi đầu tiên.</div>
              ) : (
                questions.map((q, qIdx) => (
                  <div key={q.question_id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4 relative">
                    <div className="flex justify-between items-start gap-4">
                      <h4 className="font-bold text-gray-800 text-sm flex items-start gap-2">
                        <span className="bg-slate-100 text-slate-700 w-5 h-5 text-[11px] rounded-md font-mono font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{qIdx + 1}</span>
                        {q.question_text}
                      </h4>
                          <div className="flex gap-2 flex-shrink-0">
                        <button onClick={() => openEditQues(q)} className="px-3 py-1.5 bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-700 rounded-xl text-[11px] font-bold transition cursor-pointer flex items-center gap-1">
                          <i className="far fa-edit"></i> <span>Sửa</span>
                        </button>
                        <button onClick={() => handleDeleteQues(q.question_id)} className="px-3 py-1.5 bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-700 rounded-xl text-[11px] font-bold transition cursor-pointer flex items-center gap-1">
                          <i className="far fa-trash-alt"></i> <span>Xóa</span>
                        </button>
                      </div>
                    </div>

                    {/* Hiển thị danh sách các Option bên dưới câu hỏi */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pl-7">
                      {q.options.map((opt, oIdx) => (
                        <div key={oIdx} className={`p-3 rounded-xl border text-xs font-medium flex items-center justify-between ${
                          opt.is_correct ? 'bg-emerald-50/50 border-emerald-200 text-emerald-800 font-bold' : 'bg-slate-50/50 border-slate-100 text-gray-500'
                        }`}>
                          <span>{String.fromCharCode(65 + oIdx)}. {opt.option_text}</span>
                          {opt.is_correct && <i className="fas fa-check-circle text-emerald-600 text-sm"></i>}
                        </div>
                      ))}
                    </div>

                    {/* Loại thẻ Badge hiển thị hình thức câu hỏi */}
                    <div className="pl-7 text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                      Hình thức: {q.question_type === 'Single Correct' ? 'Một đáp án đúng' : q.question_type === 'Multiple Correct' ? 'Nhiều đáp án đúng' : 'Đúng / Sai'}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

      </main>

      {/* ========================================================================= */}
      {/* MODAL 1: FORM THÊM / SỬA BÀI TẬP TỔNG (ASM MODAL) */}
      {/* ========================================================================= */}
      {showAsmModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleAsmSubmit} className="bg-white rounded-[2rem] p-6 w-full max-w-md border border-gray-100 shadow-2xl space-y-4">
            <h3 className="font-extrabold text-gray-800 text-base">{asmModalMode === 'create' ? 'Tạo đề kiểm tra mới' : 'Cập nhật đề kiểm tra'}</h3>
            
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase">Tiêu đề đề bài *</label>
              <input type="text" value={asmForm.title} onChange={e => setAsmForm({...asmForm, title: e.target.value})} required className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-medium outline-none" />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase">Thời gian làm bài (Phút) *</label>
              <input type="number" value={asmForm.time_limit} onChange={e => setAsmForm({...asmForm, time_limit: Number(e.target.value)})} min="1" required className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none font-mono" />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase">Mô tả ngắn</label>
              <textarea rows="2" value={asmForm.description} onChange={e => setAsmForm({...asmForm, description: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-medium outline-none resize-none" />
            </div>

            <div className="pt-2 flex gap-3">
              <button type="button" onClick={() => setShowAsmModal(false)} className="flex-1 py-2.5 bg-gray-100 text-gray-500 text-xs font-bold rounded-xl cursor-pointer">Hủy</button>
              <button type="submit" className="flex-1 py-2.5 bg-blue-600 text-white text-xs font-bold rounded-xl cursor-pointer">Xác nhận</button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: TRÌNH DỰNG CÂU HỎI PHỨC HỢP THAY ĐỔI THEO LOẠI (QUESTION MODAL) */}
      {/* ========================================================================= */}
      {showQuesModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleQuesSubmit} className="bg-white rounded-[2rem] p-6 w-full max-w-lg border border-gray-100 shadow-2xl max-h-[90vh] overflow-y-auto space-y-4">
            <div>
              <h3 className="font-extrabold text-gray-800 text-base">Biên soạn câu hỏi trắc nghiệm</h3>
              <p className="text-gray-400 text-[11px]">Thiết lập câu hỏi và phân phối đáp án đúng/sai tương thích.</p>
            </div>

            {/* 1. Chọn loại hình trắc nghiệm (3 loại theo yêu cầu) */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase">Hình thức câu hỏi</label>
              <select 
                value={quesForm.question_type} 
                onChange={(e) => handleQuestionTypeChange(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none"
              >
                <option value="Single Correct">Một đáp án đúng (Single Choice)</option>
                <option value="Multiple Correct">Nhiều đáp án đúng (Multiple Choice)</option>
                <option value="True-False">Đúng / Sai (True or False)</option>
              </select>
            </div>

            {/* 2. Nhập text câu hỏi */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase">Nội dung câu hỏi *</label>
              <textarea rows="2" value={quesForm.question_text} onChange={e => setQuesForm({...quesForm, question_text: e.target.value})} required placeholder="Nhập câu hỏi tại đây..." className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-medium outline-none" />
            </div>

            {/* 3. CỤM INPUT ĐÁP ÁN: ĐỔI GIAO DIỆN TỰ ĐỘNG THEO LOẠI HÌNH TRẮC NGHIỆM */}
            <div className="space-y-2.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase block">Danh sách đáp án & Đánh dấu kết quả đúng *</label>
              
              {quesForm.options.map((opt, index) => (
                <div key={index} className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  
                  {/* Nút bấm check đáp án đúng (Radio cho Single, Checkbox cho Multiple) */}
                  <div className="flex items-center justify-center pl-1">
                    {quesForm.question_type === 'Multiple Correct' ? (
                      // Loại nhiều đáp án: Dùng input checkbox vuông
                      <input 
                        type="checkbox" 
                        checked={opt.is_correct} 
                        onChange={() => handleSelectCorrectOption(index, 'Multiple Correct')}
                        className="w-4 h-4 rounded text-blue-600 focus:ring-0 cursor-pointer"
                      />
                    ) : (
                      // Loại 1 đáp án hoặc Đúng/Sai: Dùng input radio tròn
                      <input 
                        type="radio" 
                        name="correct_option_radio" 
                        checked={opt.is_correct} 
                        onChange={() => handleSelectCorrectOption(index, quesForm.question_type)}
                        className="w-4 h-4 text-blue-600 focus:ring-0 cursor-pointer"
                      />
                    )}
                  </div>

                  {/* Nhãn ký tự A, B, C, D */}
                  <span className="font-mono text-xs font-bold text-gray-400">{String.fromCharCode(65 + index)}</span>

                  {/* Ô gõ chữ nội dung đáp án */}
                  <input 
                    type="text" 
                    value={opt.option_text}
                    onChange={(e) => handleOptionTextChange(index, e.target.value)}
                    required
                    disabled={quesForm.question_type === 'True-False'} // Nếu là Đúng/Sai thì khóa cứng text, không cho sửa chữ
                    placeholder={quesForm.question_type === 'True-False' ? '' : `Nhập nội dung lựa chọn ${String.fromCharCode(65 + index)}...`}
                    className={`w-full bg-transparent text-xs font-medium outline-none border-b border-transparent focus:border-gray-200 pb-0.5 ${
                      quesForm.question_type === 'True-False' ? 'font-bold text-gray-700 cursor-not-allowed' : 'text-gray-600'
                    }`}
                  />
                </div>
              ))}
            </div>

            {/* Chân Modal câu hỏi */}
            <div className="pt-2 flex gap-3">
              <button type="button" onClick={() => setShowQuesModal(false)} className="flex-1 py-2.5 bg-gray-100 text-gray-500 text-xs font-bold rounded-xl cursor-pointer">Hủy bỏ</button>
              <button type="submit" className="flex-1 py-2.5 bg-blue-600 text-white text-xs font-bold rounded-xl cursor-pointer">Lưu câu hỏi</button>
            </div>
          </form>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default ManageAssessments;