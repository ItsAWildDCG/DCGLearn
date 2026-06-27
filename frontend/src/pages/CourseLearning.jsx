import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const CourseLearning = () => {
  const { courseId } = useParams(); // Lấy ID khóa học từ URL động
  const navigate = useNavigate();

  // Các State lưu trữ dữ liệu
  const [user, setUser] = useState(null);
  const [courseInfo, setCourseInfo] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [progress, setProgress] = useState({ completedLessons: [], passedAssessments: [], totalAssessments: 0, percentage: 0 });
  
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('lessons'); // Quản lý Tab hiển thị: 'lessons' | 'assessments' | 'progress'
  const [selectedLesson, setSelectedLesson] = useState(null); // Bài giảng đang được chọn để xem chi tiết

  const safeParseJSON = async (response) => {
    try {
      return await response.json();
    } catch (error) {
      return null;
    }
  };

  const getEmbedUrl = (url) => {
    if (!url) return url;
    try {
      const parsed = new URL(url);
      const host = parsed.hostname.replace(/^www\./, '').toLowerCase();
      const path = parsed.pathname || '';

      if (host === 'youtube.com' || host === 'm.youtube.com') {
        const videoId = parsed.searchParams.get('v');
        if (videoId) return `https://www.youtube.com/embed/${videoId}`;
        if (path.startsWith('/shorts/')) {
          const id = path.split('/')[2];
          return id ? `https://www.youtube.com/embed/${id}` : url;
        }
        if (path.startsWith('/embed/')) return url;
      }

      if (host === 'youtu.be') {
        const videoId = path.slice(1);
        return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
      }

      if (host === 'vimeo.com') {
        const videoId = path.split('/').filter(Boolean).pop();
        return videoId ? `https://player.vimeo.com/video/${videoId}` : url;
      }

      return url;
    } catch (error) {
      return url;
    }
  };

  const getPdfUrl = (url) => {
    if (!url) return url;
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('//')) return url;
    if (import.meta.env.DEV) {
      return `http://localhost:3000${url}`;
    }
    return url;
  };

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (!token || !userStr) {
      navigate('/login');
      return;
    }

    const userData = JSON.parse(userStr);
    setUser(userData);
    
    // Tải toàn bộ dữ liệu liên quan đến khóa học
    loadLearningData(token);
  }, [courseId, navigate]);

  const loadLearningData = async (token) => {
    try {
      setLoading(true);

      const courseRes = await fetch(`/api/courses/${courseId}`, { headers: { 'Authorization': `Bearer ${token}` } });
      const lessonsRes = await fetch(`/api/lessons/course/${courseId}`, { headers: { 'Authorization': `Bearer ${token}` } });
      const assessmentsRes = await fetch('/api/assessments/all', { headers: { 'Authorization': `Bearer ${token}` } });
      const progressRes = await fetch(`/api/progress/course/${courseId}`, { headers: { 'Authorization': `Bearer ${token}` } });

      const courseData = await safeParseJSON(courseRes);
      const lessonsData = await safeParseJSON(lessonsRes);
      const assessmentsData = await safeParseJSON(assessmentsRes);
      const progressData = await safeParseJSON(progressRes);

      if (courseRes.ok) setCourseInfo(courseData?.course || courseData);

      if (lessonsRes.ok) {
        const listLessons = lessonsData?.lessons || lessonsData || [];
        setLessons(listLessons);
        if (listLessons.length > 0) setSelectedLesson(listLessons[0]);
      }

      if (assessmentsRes.ok) {
        const allAssessments = assessmentsData?.assessments || assessmentsData || [];
        const courseAssessments = allAssessments.filter(a => Number(a.course_id) === Number(courseId));
        setAssessments(courseAssessments);
      } else {
        setAssessments([]);
      }

      if (progressRes.ok) {
        const passedIds = progressData?.passedAssessmentIds || progressData?.completedAssessmentIds || [];
        const completedLessons = progressData?.completedLessons || progressData?.completedLessonIds || [];
        setProgress({
          completedLessons,
          passedAssessments: passedIds,
          totalAssessments: progressData?.totalAssessments ?? assessments.length,
          percentage: progressData?.percentage ?? 0
        });
      } else {
        setProgress({ completedLessons: [], passedAssessments: [], totalAssessments: assessments.length, percentage: 0 });
      }

    } catch (error) {
      console.error("Lỗi tải không gian học tập:", error);
    } finally {
      setLoading(false);
    }
  };

  // Hàm xử lý khi học viên bấm nút "Đánh dấu đã hoàn thành bài học"
  const handleToggleCompleteLesson = async (lessonId) => {
    console.warn('API cập nhật trạng thái bài học chưa được hỗ trợ trên server.');
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-['Inter']">
      <Navbar user={user} />

      {loading ? (
        <div className="flex-grow flex justify-center items-center py-40">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <main className="container mx-auto px-4 py-8 flex-grow max-w-[1200px]">
          
          {/* HEADER KHÓA HỌC & TIẾN ĐỘ TỔNG QUAN */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm mb-6">
            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase tracking-wider">
              Không gian học tập cá nhân
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-2">
              {courseInfo?.title || "Đang tải tên khóa học..."}
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Giáo viên phụ trách: <span className="font-semibold text-gray-700">{courseInfo?.instructor_name || "Giảng viên DCGLearn"}</span>
            </p>

            {/* Thanh tiến độ trực quan */}
            <div className="mt-5 pt-4 border-t border-gray-50">
              <div className="flex justify-between text-sm font-bold text-gray-700 mb-1.5">
                <span>Tiến trình hoàn thành lộ trình</span>
                <span className="text-blue-600">{progress.percentage || 0}%</span>
              </div>
              <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full transition-all duration-500"
                  style={{ width: `${progress.percentage || 0}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* ĐIỀU HƯỚNG TABS CHỨC NĂNG */}
          <div className="flex border-b border-gray-200 mb-6 bg-white px-4 rounded-xl shadow-sm overflow-x-auto">
            <button 
              onClick={() => setActiveTab('lessons')}
              className={`py-4 px-4 font-bold text-sm transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${activeTab === 'lessons' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              <i className="fas fa-book-open"></i> 1. Danh sách bài giảng ({lessons.length})
            </button>
            <button 
              onClick={() => setActiveTab('assessments')}
              className={`py-4 px-4 font-bold text-sm transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${activeTab === 'assessments' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              <i className="fas fa-clipboard-list"></i> 2. Bài tập ({assessments.length})
            </button>
            <button 
              onClick={() => setActiveTab('progress')}
              className={`py-4 px-4 font-bold text-sm transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${activeTab === 'progress' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              <i className="fas fa-chart-line"></i> 3. Chi tiết tiến độ
            </button>
          </div>

          {/* NỘI DUNG CHUYỂN ĐỔI THEO TAB */}
          <div className="min-h-[400px]">
            
            {/* TAB 1: XEM BÀI GIẢNG */}
            {activeTab === 'lessons' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Cột trái: Danh sách bài giảng */}
                <div className="lg:col-span-1 bg-white rounded-2xl border border-gray-100 p-4 shadow-sm h-fit space-y-2">
                  <h3 className="font-bold text-gray-800 text-sm px-2 mb-3 text-uppercase tracking-wider text-gray-400">Nội dung bài học</h3>
                  {lessons.length === 0 ? (
                    <p className="text-gray-400 text-sm p-4 text-center">Khóa học này chưa được cập nhật bài giảng.</p>
                  ) : (
                    lessons.map((lesson, index) => {
                      const isCompleted = progress.completedLessons?.includes(lesson.lesson_id);
                      return (
                        <div 
                          key={lesson.lesson_id}
                          onClick={() => setSelectedLesson(lesson)}
                          className={`p-3.5 rounded-xl cursor-pointer transition-all border flex items-start gap-3 ${selectedLesson?.lesson_id === lesson.lesson_id ? 'bg-blue-50/60 border-blue-200 text-blue-700' : 'bg-transparent border-gray-50 hover:bg-gray-50 text-gray-700'}`}
                        >
                          <span className={`mt-0.5 text-base ${isCompleted ? 'text-green-500' : 'text-gray-300'}`}>
                            <i className={isCompleted ? "fas fa-check-circle" : "far fa-circle"}></i>
                          </span>
                          <div className="flex-grow">
                            <h4 className="font-bold text-sm line-clamp-2">Bài {index + 1}: {lesson.title}</h4>
                            {lesson.duration && <span className="text-xs text-gray-400 font-medium block mt-1"><i className="far fa-clock"></i> {lesson.duration} phút</span>}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Cột phải: Khung nội dung chi tiết bài giảng */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex flex-col justify-between">
                  {selectedLesson ? (
                    <div>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
                        <h2 className="text-xl font-extrabold text-gray-800">{selectedLesson.title}</h2>
                        <button 
                          onClick={() => handleToggleCompleteLesson(selectedLesson.lesson_id)}
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${progress.completedLessons?.includes(selectedLesson.lesson_id) ? 'bg-green-50 text-green-600 border-green-200' : 'bg-blue-600 text-white border-transparent hover:bg-blue-700'}`}
                        >
                          {progress.completedLessons?.includes(selectedLesson.lesson_id) ? (
                            <span><i className="fas fa-check mr-1.5"></i> Đã hoàn thành</span>
                          ) : (
                            <span>Đánh dấu xong <i className="fas fa-arrow-right ml-1.5"></i></span>
                          )}
                        </button>
                      </div>

                      {/* Nội dung bài giảng chính (video, PDF, hoặc text) */}
                      <div className="my-6 rounded-xl overflow-hidden relative group">
                        {selectedLesson.content_type?.toLowerCase() === 'video' && selectedLesson.content_url ? (
                          <div className="relative w-full pb-[56.25%] bg-slate-900 shadow-inner rounded-2xl overflow-hidden">
                            <iframe 
                              className="absolute inset-0 w-full h-full"
                              src={getEmbedUrl(selectedLesson.content_url)}
                              title={selectedLesson.title}
                              allowFullScreen
                            ></iframe>
                          </div>
                        ) : selectedLesson.content_type?.toLowerCase() === 'pdf' && selectedLesson.content_url ? (
                          <div className="w-full min-h-[28rem] bg-white shadow-inner rounded-2xl overflow-hidden border border-slate-200">
                            <iframe
                              className="w-full h-[calc(100vh-320px)] min-h-[28rem] max-h-[75vh]"
                              src={getPdfUrl(selectedLesson.content_url)}
                              title={selectedLesson.title}
                            ></iframe>
                          </div>
                        ) : selectedLesson.content_type?.toLowerCase() === 'text' && (selectedLesson.content_text || selectedLesson.content) ? (
                          <div className="w-full bg-white text-slate-900 p-6 rounded-2xl shadow-inner">
                            <div className="prose max-w-none text-sm leading-relaxed whitespace-pre-line">
                              {selectedLesson.content_text || selectedLesson.content}
                            </div>
                          </div>
                        ) : (
                          <div className="text-center p-6 bg-slate-900">
                            <i className="fas fa-play-circle text-5xl text-slate-400 mb-3 block group-hover:scale-110 transition-transform"></i>
                            <p className="font-medium text-slate-300">Bài học này cung cấp tài liệu đọc nghiên cứu</p>
                          </div>
                        )}
                      </div>

                      {/* Tài liệu chữ đi kèm bài học */}
                      <div className="prose max-w-none text-gray-600 text-sm leading-relaxed mt-4 bg-slate-50 p-5 rounded-xl border border-slate-100">
                        <h4 className="font-bold text-gray-800 mb-2 flex items-center gap-2"><i className="far fa-file-alt text-blue-500"></i> Hướng dẫn & Tóm tắt lý thuyết:</h4>
                        {selectedLesson.content_type?.toLowerCase() === 'pdf' && selectedLesson.content_url ? (
                          <p className="text-sm text-slate-600">Tài liệu PDF được đính kèm tại khung xem trên. Kéo thanh cuộn hoặc dùng phím tắt trình duyệt để zoom nội dung.</p>
                        ) : (
                          <p className="whitespace-pre-line">{selectedLesson.description || "Giảng viên chưa cập nhật mô tả tóm tắt cho bài giảng này."}</p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-20 text-gray-400 text-sm my-auto">
                      <i className="fas fa-book-reader text-4xl mb-3 text-gray-300"></i>
                      <p>Vui lòng chọn một bài học ở danh sách bên trái để bắt đầu học tập.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: DANH SÁCH BÀI TẬP ĐÁNH GIÁ */}
            {activeTab === 'assessments' && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <div className="mb-6">
                  <h3 className="font-extrabold text-gray-800 text-lg">Bài kiểm tra & Bài tập rèn luyện</h3>
                  <p className="text-gray-400 text-xs mt-0.5">Làm đầy đủ các bài tập để củng cố kiến thức và tích lũy điểm số trung bình.</p>
                </div>

                {assessments.length === 0 ? (
                  <div className="text-center py-16 text-gray-400 text-sm border border-dashed border-gray-200 rounded-xl">
                    <i className="fas fa-tasks text-3xl mb-3 text-gray-300"></i>
                    <p>Hiện chưa có bài tập hay đề kiểm tra nào được giao cho khóa học này.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {assessments.map((quiz, index) => {
                      const isDone = progress.passedAssessments?.includes(quiz.assessment_id);
                      return (
                        <div key={quiz.assessment_id} className="p-5 bg-slate-50 rounded-xl border border-slate-100 flex flex-col justify-between gap-4 hover:border-blue-100 hover:bg-blue-50/10 transition-all">
                          <div>
                            <div className="flex justify-between items-start mb-2">
                              <span className="text-[10px] font-bold text-slate-400 bg-slate-200/60 px-2 py-0.5 rounded uppercase">
                                Đề số {index + 1}
                              </span>
                              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isDone ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                {isDone ? 'Đạt >= 5' : 'Chưa đạt'}
                              </span>
                            </div>
                            <h4 className="font-bold text-gray-800 text-base line-clamp-1">{quiz.title}</h4>
                            <p className="text-gray-400 text-xs mt-1 line-clamp-2">{quiz.description || "Không có mô tả yêu cầu đề bài."}</p>
                          </div>

                          <div className="flex justify-between items-center pt-3 border-t border-slate-200/60 mt-2">
                            <span className="text-xs text-slate-500 font-medium">
                              <i className="fas fa-star text-amber-500 mr-1"></i> Trọng số: {quiz.weight || 10}% số điểm
                            </span>
                            <button 
                              onClick={() => navigate(`/quiz/${quiz.assessment_id}`)}
                              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all border cursor-pointer ${isDone ? 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50' : 'bg-blue-600 text-white border-transparent hover:bg-blue-700'}`}
                            >
                              {isDone ? 'Làm lại bài' : 'Bắt đầu làm bài'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: CHI TIẾT TIẾN ĐỘ VÀ PHÂN TÍCH THỐNG KÊ */}
            {activeTab === 'progress' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Card trái: Con số thống kê lớn */}
                <div className="md:col-span-1 bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex flex-col justify-between text-center gap-6">
                  <div>
                    <h4 className="font-bold text-slate-700 text-sm">Bài tập đã nộp</h4>
                    <p className="text-5xl font-black text-blue-600 mt-3 tracking-tight">
                      {progress.passedAssessments?.length ?? 0}/{assessments.length}
                    </p>
                    <p className="text-xs text-slate-400 mt-2 font-medium">Số đề học viên đã đạt điểm {'>='} 5</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-left text-xs space-y-2 text-slate-500 font-medium">
                    <p><i className="fas fa-check text-green-500 mr-2"></i> Đã xem <b>{progress.completedLessons?.length || 0}</b> trên tổng số <b>{lessons.length}</b> bài học.</p>
                    <p><i className="fas fa-check text-green-500 mr-2"></i> Đã hoàn thành <b>{progress.passedAssessments?.length || 0}</b> trên tổng số <b>{assessments.length}</b> bài tập.</p>
                  </div>
                </div>

                {/* Card phải: Danh mục check-list lộ trình */}
                <div className="md:col-span-2 bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                  <h3 className="font-extrabold text-gray-800 text-base mb-4"><i className="fas fa-check-double text-blue-600 mr-1.5"></i> Check-list lộ trình học tập</h3>
                  <div className="max-h-[300px] overflow-y-auto space-y-2.5 pr-1">
                    {assessments.length === 0 ? (
                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-sm text-slate-500 text-center">
                        Chưa có bài tập nào trong khóa học này.
                      </div>
                    ) : (
                      assessments.map((assessment, idx) => {
                        const completed = progress.passedAssessments?.includes(assessment.assessment_id);
                        return (
                          <div key={`check-assessment-${assessment.assessment_id}`} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                            <span className="font-bold text-slate-700">Bài tập {idx + 1}: {assessment.title}</span>
                            <span className={`font-bold px-2 py-0.5 rounded ${completed ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
                              {completed ? 'Đạt >= 5' : 'Chưa đạt'}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

              </div>
            )}

          </div>
        </main>
      )}

      <Footer />
    </div>
  );
};

export default CourseLearning;