import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import StatCard from '../components/StatCard';

const LearningStats = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [courses, setCourses] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [stats, setStats] = useState({
    totalCourses: 0,
    totalAssessments: 0,
    totalStudents: 0,
  });

  const navigate = useNavigate();

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (!token || !userStr) {
      navigate('/login');
      return;
    }

    let userData;
    try {
      userData = JSON.parse(userStr);
    } catch (err) {
      localStorage.removeItem('user');
      navigate('/login');
      return;
    }

    const role = (userData.role || '').trim();
    if (role !== 'Teacher' && role !== 'Giảng viên') {
      alert('Bạn không có quyền truy cập khu vực giảng dạy!');
      navigate('/');
      return;
    }

    setUser(userData);
    loadStats(token, userData.id);
  }, [navigate]);

  const loadStats = async (token, userId) => {
    setLoading(true);
    setError('');

    try {
      const [coursesRes, assessmentsRes, studentsRes] = await Promise.all([
        fetch('/api/courses/all', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/assessments/all', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/user/stats', { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      if (!coursesRes.ok || !assessmentsRes.ok || !studentsRes.ok) {
        throw new Error('Không lấy được dữ liệu từ server');
      }

      const coursesData = await coursesRes.json();
      const assessmentsData = await assessmentsRes.json();
      const studentsData = await studentsRes.json();

      const teacherCourses = (coursesData.courses || []).filter(course => Number(course.instructor_id) === Number(userId));
      const courseIds = teacherCourses.map(course => Number(course.course_id));
      const teacherAssessments = (assessmentsData.assessments || []).filter(assessment => courseIds.includes(Number(assessment.course_id)));

      setCourses(teacherCourses);
      setAssessments(teacherAssessments);
      setStats({
        totalCourses: teacherCourses.length,
        totalAssessments: teacherAssessments.length,
        totalStudents: studentsData.totalUniqueStudents || 0,
      });
    } catch (fetchError) {
      console.error('Lỗi tải thông số học tập:', fetchError);
      setError('Không thể tải dữ liệu thống kê. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  const renderCourseSummary = () => {
    if (!courses.length) {
      return (
        <div className="rounded-[2rem] border border-dashed border-slate-200 bg-white/80 p-10 text-center text-slate-500">
          Bạn hiện chưa có khóa học nào do bạn quản lý. Hãy tạo hoặc cập nhật khóa học trước.
        </div>
      );
    }

    return (
      <div className="grid gap-5 lg:grid-cols-2">
        {courses.map(course => {
          const courseCount = assessments.filter(a => Number(a.course_id) === Number(course.course_id)).length;
          return (
            <div key={course.course_id} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-md transition">
              <div className="flex items-center justify-between gap-4 mb-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Khóa học</p>
                  <h3 className="text-xl font-extrabold text-slate-900">{course.title}</h3>
                </div>
                <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                  {courseCount} bài tập
                </span>
              </div>
              <p className="text-sm text-slate-500 leading-relaxed">{course.description || 'Chưa có mô tả cho khóa học này.'}</p>
            </div>
          );
        })}
      </div>
    );
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-['Inter']">
      <Navbar user={user} />

      <main className="container mx-auto px-4 py-10 flex-grow max-w-6xl">
        <div className="mb-8 rounded-[2rem] bg-gradient-to-r from-purple-600 to-indigo-700 p-8 text-white shadow-xl shadow-purple-200/40">
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight">Thống kê giảng dạy</h1>
          <p className="mt-3 text-slate-100 max-w-2xl text-sm sm:text-base leading-relaxed">
            Xem tổng quan về khóa học và học viên của bạn. Dữ liệu được tổng hợp từ các API hiện tại của hệ thống.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white/90 border-slate-200"></div>
          </div>
        ) : (
          <div className="space-y-8">
            {error && (
              <div className="rounded-[2rem] border border-red-200 bg-red-50 p-6 text-red-700">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <StatCard
                title="Khóa học đang quản lý"
                value={stats.totalCourses}
                icon="fas fa-book"
                colorSchema="blue"
              />
              <StatCard
                title="Bài tập đã tạo"
                value={stats.totalAssessments}
                icon="fas fa-file-alt"
                colorSchema="purple"
              />
              <StatCard
                title="Học viên đang học"
                value={stats.totalStudents}
                icon="fas fa-user-graduate"
                colorSchema="green"
              />
            </div>

            <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 rounded-[2rem] border border-gray-100 bg-white p-8 shadow-sm">
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-extrabold text-slate-900">Danh sách khóa học của bạn</h2>
                    <p className="text-sm text-slate-500 mt-1">Hiển thị các khóa học bạn đang quản lý và số lượng bài tập đánh giá.</p>
                  </div>
                </div>
                {renderCourseSummary()}
              </div>

              <div className="rounded-[2rem] border border-gray-100 bg-white p-8 shadow-sm">
                <h2 className="text-xl font-extrabold text-slate-900 mb-4">Gợi ý hành động</h2>
                <div className="space-y-3 text-slate-600 text-sm">
                  <p>• Nếu số học viên đang học thấp, hãy mời thêm học viên hoặc quảng bá khóa học.</p>
                  <p>• Cập nhật bài giảng và bài tập để tăng tương tác học viên.</p>
                  <p>• Duy trì tần suất chấm điểm để học viên nắm rõ tiến độ.</p>
                </div>
              </div>
            </section>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default LearningStats;
