import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const ViewSubmissions = () => {
  const { courseId, assessmentId } = useParams();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [assessment, setAssessment] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showGradeModal, setShowGradeModal] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [gradeValue, setGradeValue] = useState('');

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (!token || !userStr) { navigate('/login'); return; }

    const u = JSON.parse(userStr);
    const role = (u.role || '').toLowerCase();
    if (role !== 'teacher' && role !== 'giảng viên' && role !== 'admin' && role !== 'quản trị viên') {
      alert('Bạn không có quyền truy cập chức năng này!');
      navigate('/dashboard');
      return;
    }
    setUser(u);
    loadData(token);
  }, [assessmentId, courseId, navigate]);

  const loadData = async (token) => {
    try {
      setLoading(true);
      // Fetch assessment details (title)
      const aRes = await fetch(`/api/assessments/${assessmentId}`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (aRes.ok) setAssessment(await aRes.json());

      // Fetch submissions for this assessment
      const res = await fetch(`/api/submissions/assessment/${assessmentId}`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setSubmissions(data.submissions || []);
      } else {
        setSubmissions([]);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const openGradeModal = (submission) => {
    setSelectedSubmission(submission);
    setGradeValue(submission.score != null ? String(submission.score) : '');
    setShowGradeModal(true);
  };

  const handleGradeSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSubmission) return;
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/submissions/grade/${selectedSubmission.submission_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ score: Number(gradeValue) })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Lỗi khi lưu điểm');
      }
      const updated = await res.json();
      alert('Cập nhật điểm thành công.');
      setShowGradeModal(false);
      // Update local list
      setSubmissions(prev => prev.map(s => s.submission_id === updated.submission.submission_id ? updated.submission : s));
    } catch (error) {
      console.error(error);
      alert(error.message || 'Lỗi khi cập nhật điểm');
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#FBFCFE] flex flex-col font-['Inter']">
      <Navbar user={user} />

      <main className="container mx-auto px-4 py-10 flex-grow max-w-5xl">
        <div className="mb-6">
          <button onClick={() => navigate(-1)} className="text-xs font-bold text-slate-500 hover:text-slate-700 flex items-center gap-1 w-max mb-3">
            <i className="fas fa-chevron-left"></i> Quay lại
          </button>
          <div className="flex items-center justify-between gap-4 bg-white p-6 rounded-3xl shadow-sm">
            <div>
              <h2 className="text-lg font-extrabold">Kết quả nộp bài</h2>
              <p className="text-sm text-gray-500">Đề: <span className="font-bold text-gray-700">{assessment?.title || ('ID: ' + assessmentId)}</span></p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div></div>
        ) : submissions.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-3xl border border-dashed text-gray-400">Chưa có ai nộp bài cho đề này.</div>
        ) : (
          <div className="bg-white p-6 rounded-3xl border border-gray-100 space-y-4">
            <div className="grid grid-cols-12 gap-4 text-xs font-bold text-gray-500 px-2">
              <div className="col-span-5">Người nộp</div>
              <div className="col-span-2">Điểm</div>
              <div className="col-span-3">Thời gian nộp</div>
              <div className="col-span-2">Hành động</div>
            </div>
            <div className="divide-y">
              {submissions.map(sub => (
                <div key={sub.submission_id} className="grid grid-cols-12 gap-4 items-center py-3 px-2">
                  <div className="col-span-5 text-sm font-medium text-gray-800">{sub.student_name || sub.student_id}</div>
                  <div className="col-span-2 text-sm">{sub.score != null ? Number(sub.score).toFixed(2) : '—'}</div>
                  <div className="col-span-3 text-sm text-gray-500">{new Date(sub.submitted_at).toLocaleString()}</div>
                  <div className="col-span-2 flex items-center gap-2">
                    <button onClick={() => openGradeModal(sub)} className="px-3 py-1.5 bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-700 rounded-xl text-[11px] font-bold transition">Chấm điểm</button>
                    <button onClick={() => alert('Chi tiết câu trả lời chưa hỗ trợ trên giao diện này.') } className="px-3 py-1.5 bg-slate-100 hover:bg-slate-50 text-slate-600 rounded-xl text-[11px] font-bold">Chi tiết</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {showGradeModal && (
        <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4">
          <form onSubmit={handleGradeSubmit} className="bg-white rounded-2xl p-6 w-full max-w-md border border-gray-100 shadow-2xl">
            <h3 className="font-extrabold text-gray-800 text-base">Chấm điểm</h3>
            <p className="text-sm text-gray-500">Người nộp: <span className="font-bold">{selectedSubmission?.student_name}</span></p>
            <div className="mt-4">
              <label className="text-[10px] font-bold text-gray-400 uppercase">Điểm (0-10)</label>
              <input type="number" value={gradeValue} onChange={e => setGradeValue(e.target.value)} min="0" max="10" step="0.1" required className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-medium outline-none" />
            </div>
            <div className="mt-4 flex gap-3">
              <button type="button" onClick={() => setShowGradeModal(false)} className="flex-1 py-2.5 bg-gray-100 text-gray-500 text-xs font-bold rounded-xl">Hủy</button>
              <button type="submit" className="flex-1 py-2.5 bg-blue-600 text-white text-xs font-bold rounded-xl">Lưu</button>
            </div>
          </form>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default ViewSubmissions;
