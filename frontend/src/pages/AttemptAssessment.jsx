import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const AttemptAssessment = () => {
  const { assessmentId } = useParams();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [assessment, setAssessment] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submissionResult, setSubmissionResult] = useState({ score: null, correct: 0, total: 0, message: '' });
  const [error, setError] = useState('');
  const [timeRemaining, setTimeRemaining] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (!token || !userStr) {
      navigate('/login');
      return;
    }

    setUser(JSON.parse(userStr));
    loadAssessment(token);
  }, [assessmentId, navigate]);

  // Bộ đếm thời gian giảm dần
  useEffect(() => {
    if (!submitted && assessment?.time_limit && timeRemaining !== null) {
      const timer = setTimeout(() => {
        setTimeRemaining(Math.max(0, timeRemaining - 1));
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [timeRemaining, submitted, assessment]);

  const safeParseJSON = async (response) => {
    try {
      return await response.json();
    } catch (err) {
      return null;
    }
  };

  const isMultiSelectQuestion = (question) => /multiple/i.test(question?.question_type);
  const isTrueFalseQuestion = (question) => /true/i.test(question?.question_type);
  const getQuestionTypeLabel = (question) => {
    if (isTrueFalseQuestion(question)) return 'Đúng / Sai';
    if (isMultiSelectQuestion(question)) return 'Nhiều đáp án đúng';
    return 'Một đáp án đúng';
  };
  const optionIsCorrect = (option) => {
    if (option?.is_correct === true || option?.is_correct === 1) return true;
    const raw = String(option?.is_correct).toLowerCase();
    return raw === 'true' || raw === '1';
  };
  const hasCorrectInfo = (question) => {
    return question.options?.some((opt) => opt && Object.prototype.hasOwnProperty.call(opt, 'is_correct'));
  };

  const formatTimeRemaining = (seconds) => {
    if (!seconds && seconds !== 0) return '--:--';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const loadAssessment = async (token) => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch(`/api/assessments/${assessmentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await safeParseJSON(response);
      if (!response.ok) {
        setError(data?.message || 'Không thể tải đề bài.');
        setAssessment(null);
        setQuestions([]);
        return;
      }

      setAssessment(data);
      setQuestions(data.questions || []);
      setTimeRemaining((data.time_limit || 0) * 60); // Chuyển phút sang giây
      setAnswers({});
      setSubmitted(false);
      setSubmissionResult({ score: null, correct: 0, total: data.questions?.length || 0, message: '' });
    } catch (err) {
      console.error('Lỗi tải đề bài:', err);
      setError('Có lỗi khi tải đề bài.');
    } finally {
      setLoading(false);
    }
  };

  const toggleOption = (question, optionId) => {
    if (submitted) return;

    setAnswers((prev) => {
      const current = prev[question.question_id] || [];
      if (isMultiSelectQuestion(question)) {
        const exists = current.includes(optionId);
        return {
          ...prev,
          [question.question_id]: exists ? current.filter((id) => id !== optionId) : [...current, optionId]
        };
      }

      return {
        ...prev,
        [question.question_id]: [optionId]
      };
    });
  };

  const buildPayload = () => {
    return questions.map((question) => ({
      questionId: question.question_id,
      optionIds: (answers[question.question_id] || []).slice()
    }));
  };

  const isQuestionCorrect = (question) => {
    if (!hasCorrectInfo(question)) return null;

    const correctIds = question.options
      .filter((opt) => optionIsCorrect(opt))
      .map((opt) => opt.option_id)
      .sort((a, b) => a - b);

    const selectedIds = (answers[question.question_id] || []).slice().sort((a, b) => a - b);
    return correctIds.join(',') === selectedIds.join(',');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitted) return;

    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    const payload = buildPayload();
    const unanswered = questions.filter((q) => !(answers[q.question_id] || []).length);
    if (unanswered.length > 0) {
      const confirmSkip = window.confirm('Bạn chưa trả lời tất cả câu hỏi. Vẫn muốn nộp bài?');
      if (!confirmSkip) return;
    }

    try {
      setSubmitting(true);
      setError('');
      const response = await fetch('/api/submissions/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ assessmentId: Number(assessmentId), answers: payload })
      });
      const data = await safeParseJSON(response);
      if (!response.ok) {
        setError(data?.message || 'Không thể nộp bài.');
        return;
      }

      setSubmissionResult({
        score: Number(data.score ?? 0),
        correct: Number(data.correct ?? data.correctAnswers ?? 0),
        total: Number(data.total ?? questions.length),
        message: data.message || 'Nộp bài thành công!'
      });
      // Cập nhật questions với reviewQuestions từ server (chứa thông tin is_correct)
      if (Array.isArray(data.reviewQuestions) && data.reviewQuestions.length > 0) {
        setQuestions(data.reviewQuestions);
      }
      setSubmitted(true);
    } catch (err) {
      console.error('Lỗi nộp bài:', err);
      setError('Có lỗi khi nộp bài.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    const token = localStorage.getItem('token');
    if (token && assessment) {
      setAnswers({});
      setSubmitted(false);
      setSubmissionResult({ score: null, correct: 0, total: questions.length });
      setError('');
      setTimeRemaining((assessment.time_limit || 0) * 60); // Reset lại thời gian
      loadAssessment(token); // Tải lại câu hỏi (không có is_correct)
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-['Inter']">
      <Navbar user={user} />
      <main className="container mx-auto px-4 py-8 flex-grow max-w-6xl">
        <div className="mb-6 flex flex-col gap-4">
          <button onClick={() => navigate(-1)} className="text-xs font-bold text-slate-500 hover:text-slate-700 flex items-center gap-2 w-max">
            <i className="fas fa-chevron-left"></i> Quay lại trang trước
          </button>

          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-blue-600 font-bold">Làm bài kiểm tra</p>
                <h1 className="text-3xl font-extrabold text-slate-900 mt-2">{assessment?.title || 'Đang tải bài tập...'}</h1>
                <p className="mt-2 text-sm text-slate-500">{assessment?.description || 'Bài kiểm tra chưa có mô tả.'}</p>
              </div>

              <div className="flex flex-col gap-3 min-w-[220px]">
                <div className="rounded-3xl bg-slate-50 border border-slate-200 px-5 py-4 text-center">
                  <p className="text-[10px] uppercase tracking-[0.25em] text-slate-400 font-bold">Thời gian dự kiến</p>
                  <p className="text-3xl font-extrabold text-slate-900 mt-2">{assessment?.time_limit ?? '-'} phút</p>
                </div>
                {!submitted && (
                  <div className={`rounded-3xl px-5 py-4 text-center border ${
                    timeRemaining !== null && timeRemaining < 300 ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'
                  }`}>
                    <p className="text-[10px] uppercase tracking-[0.25em] font-bold text-slate-400">Thời gian còn lại</p>
                    <p className={`text-3xl font-extrabold mt-2 font-mono ${
                      timeRemaining !== null && timeRemaining < 300 ? 'text-red-600' : 'text-blue-600'
                    }`}>
                      {formatTimeRemaining(timeRemaining)}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {submitted && (
              <div className="rounded-3xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-5 shadow-lg border border-blue-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <p className="text-sm uppercase tracking-[0.2em] text-blue-100 font-bold">Kết quả bài làm</p>
                    <p className="text-2xl font-extrabold mt-2">{submissionResult.score?.toFixed(2) ?? 0} / 10</p>
                    <p className="text-sm text-blue-100 mt-1">Đúng {submissionResult.correct}/{submissionResult.total} câu</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs uppercase tracking-[0.2em] text-blue-100">Trạng thái</p>
                    <p className="text-lg font-bold mt-2">{submissionResult.correct === submissionResult.total ? 'Hoàn thành' : 'Đã nộp'}</p>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="rounded-3xl bg-red-50 border border-red-200 text-red-700 p-4 text-sm">
                {error}
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-[1fr_auto] items-center">
              <div className="rounded-3xl bg-slate-50 border border-slate-200 p-4 text-sm text-slate-600">
                <p className="font-bold text-slate-800">Số câu hỏi</p>
                <p>{questions.length}</p>
              </div>
              <div className="rounded-3xl bg-slate-50 border border-slate-200 p-4 text-sm text-slate-600">
                <p className="font-bold text-slate-800">Đã trả lời</p>
                <p>{questions.filter((q) => (answers[q.question_id] || []).length > 0).length}/{questions.length}</p>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-24">
            <div className="animate-spin rounded-full h-14 w-14 border-b-2 border-blue-600"></div>
          </div>
        ) : questions.length === 0 ? (
          <div className="bg-white rounded-3xl border border-gray-100 p-10 text-center text-slate-500">Không tìm thấy câu hỏi nào để làm.</div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-5">
              {questions.map((question, qIndex) => {
                const questionCorrect = isQuestionCorrect(question);
                const showCorrectInfo = hasCorrectInfo(question);
                const selectedIds = answers[question.question_id] || [];

                return (
                  <div key={question.question_id} className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-800">Câu {qIndex + 1}</p>
                        <p className="mt-2 text-sm text-slate-600">{question.question_text}</p>
                        <div className="mt-2 inline-flex rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-600">
                          {getQuestionTypeLabel(question)}
                        </div>
                      </div>
                      {submitted && (
                        <div className={`rounded-full px-3 py-1 text-xs font-semibold ${showCorrectInfo ? (questionCorrect ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700') : 'bg-slate-100 text-slate-600'}`}>
                          {showCorrectInfo ? (questionCorrect ? 'Đúng' : 'Sai') : 'Đã nộp'}
                        </div>
                      )}
                    </div>

                    <div className="mt-5 grid gap-3">
                      {question.options.map((option) => {
                        const selected = selectedIds.includes(option.option_id);
                        const isCorrect = optionIsCorrect(option);
                        const showCorrect = showCorrectInfo && submitted;
                        
                        // Xác định class dựa trên trạng thái: selected, correct, submitted
                        let optionClass;
                        if (submitted && showCorrect) {
                          // Sau khi nộp bài và có thông tin đáp án đúng
                          if (isCorrect && selected) {
                            // Đã chọn và đúng -> xanh
                            optionClass = 'bg-emerald-50 border-emerald-200 text-emerald-800';
                          } else if (isCorrect && !selected) {
                            // Chưa chọn nhưng đúng -> xanh nhạt để show đáp án
                            optionClass = 'bg-emerald-50 border-emerald-200 text-emerald-700';
                          } else if (!isCorrect && selected) {
                            // Đã chọn nhưng sai -> đỏ
                            optionClass = 'bg-red-50 border-red-200 text-red-600';
                          } else {
                            // Chưa chọn và sai -> xám
                            optionClass = 'bg-slate-50 border-slate-100 text-slate-500';
                          }
                        } else if (submitted && !showCorrect) {
                          // Sau khi nộp bài nhưng không có thông tin đáp án đúng
                          optionClass = selected ? 'bg-blue-50 border-blue-200 text-slate-700' : 'bg-slate-50 border-slate-100 text-slate-500';
                        } else {
                          // Chưa nộp bài
                          optionClass = selected ? 'bg-blue-50 border-blue-200 text-slate-700' : 'bg-slate-50 border-slate-100 text-slate-500';
                        }

                        return (
                          <label key={option.option_id} className={`group flex cursor-pointer items-center gap-3 rounded-3xl border p-4 transition ${optionClass}`}>
                            <input
                              type={isMultiSelectQuestion(question) ? 'checkbox' : 'radio'}
                              name={`question-${question.question_id}`}
                              value={option.option_id}
                              checked={selected}
                              disabled={submitted}
                              onChange={() => toggleOption(question, option.option_id)}
                              className="h-4 w-4 text-blue-600 accent-blue-600"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium">{option.option_text}</p>
                              <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] leading-none">
                                {selected && !submitted && <span className="rounded-full bg-blue-100 px-2 py-1 text-blue-700">Đã chọn</span>}
                                {showCorrect && isCorrect && <span className="rounded-full bg-emerald-100 px-2 py-1 text-emerald-700">Đáp án đúng</span>}
                                {showCorrect && selected && !isCorrect && <span className="rounded-full bg-red-100 px-2 py-1 text-red-700">Sai</span>}
                                {submitted && !showCorrect && selected && <span className="rounded-full bg-slate-100 px-2 py-1 text-slate-600">Đã chọn</span>}
                              </div>
                            </div>
                          </label>
                        );
                      })}
                    </div>

                    {submitted && showCorrectInfo && (
                      <div className="mt-4 rounded-3xl bg-emerald-50 border border-emerald-100 p-4 text-sm text-emerald-800">
                        <span className="font-semibold">Đáp án đúng:</span>
                        <span className="ml-2">{question.options.filter(opt => optionIsCorrect(opt)).map(opt => opt.option_text).join(', ') || 'Chưa có đáp án đúng'}</span>
                      </div>
                    )}

                    {submitted && !showCorrectInfo && (
                      <p className="mt-4 text-xs text-slate-500">Hiển thị các lựa chọn của bạn. Đáp án đúng sẽ được cập nhật khi giảng viên công bố.</p>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-slate-500">
                {submitted
                  ? 'Bạn có thể nhấn Làm lại để gửi bài mới hoặc quay lại trang học để làm tiếp.'
                  : 'Chọn đáp án và nộp để xem kết quả. Các câu hỏi chưa trả lời vẫn có thể được nộp.'}
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                {submitted ? (
                  <>
                    <button
                      type="button"
                      onClick={handleReset}
                      className="rounded-3xl bg-slate-600 px-5 py-3 text-sm font-bold text-white shadow-sm shadow-slate-200 transition hover:bg-slate-700"
                    >
                      <i className="fas fa-redo mr-2"></i> Làm lại bài
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate(-1)}
                      className="rounded-3xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white shadow-sm shadow-emerald-200 transition hover:bg-emerald-700"
                    >
                      <i className="fas fa-arrow-left mr-2"></i> Quay lại
                    </button>
                  </>
                ) : (
                  <button
                    type="submit"
                    disabled={submitting}
                    className="rounded-3xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-sm shadow-blue-200 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
                  >
                    {submitting ? 'Đang nộp...' : 'Nộp bài và xem kết quả'}
                  </button>
                )}
              </div>
            </div>
          </form>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default AttemptAssessment;
