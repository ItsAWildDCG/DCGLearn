import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Alert from '../components/Alert';
import AvailableCourseCard from '../components/AvailableCourseCard'; // IMPORT COMPONENT CON VÀO ĐÂY

const ViewCourseList = () => {
  const [courses, setCourses] = useState([]);
  const [enrolledIds, setEnrolledIds] = useState(new Set());
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrollLoading, setEnrollLoading] = useState(null);
  const [message, setMessage] = useState({ text: '', type: '' });
  const navigate = useNavigate();

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (!token || !userStr) {
      navigate('/login');
      return;
    }

    const userData = JSON.parse(userStr);
    const currentRole = userData.role?.toLowerCase();

    if (currentRole === 'teacher' || currentRole === 'giảng viên') {
      navigate('/dashboard-teacher');
      return;
    } else if (currentRole === 'admin') {
      navigate('/admin-dashboard');
      return;
    }

    setUser(userData);
    loadAllCourseData(token);
  }, [navigate]);

  const loadAllCourseData = async (token) => {
    try {
      const resAll = await fetch('/api/courses/all', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const dataAll = await resAll.json();

    const resEnrolled = await fetch('/api/enrollments/my-courses', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const dataEnrolled = await resEnrolled.json();
    
    if (resAll.ok) {
      setCourses(dataAll.courses || []);
    }
    
    // Backend trả về mảng mang tên "enrollments" thay vì "courses"
    if (resEnrolled.ok && dataEnrolled.enrollments) {
      const ids = new Set(dataEnrolled.enrollments.map(c => String(c.course_id)));
      setEnrolledIds(ids);
    }

    } catch (error) {
      console.error("Lỗi tải dữ liệu khóa học:", error);
      setMessage({ text: 'Không thể kết nối đến máy chủ dữ liệu.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async (courseId) => {
    if (!window.confirm("Bạn có chắc chắn muốn tham gia khóa học này không?")) return;
    
    setEnrollLoading(courseId);
    setMessage({ text: '', type: '' });

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/enrollments/enroll', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ courseId: Number(courseId) }) // Gửi object chứa courseId lên body
    });


      const data = await response.json();

      if (response.ok) {
        setMessage({ text: 'Chúc mừng! Bạn đã đăng ký tham gia khóa học thành công. 🎉', type: 'success' });
        setEnrolledIds(prev => {
          const nextSet = new Set(prev);
          nextSet.add(String(courseId));
          return nextSet;
        });

        setTimeout(() => {
          navigate('/enrolled-courses');
        }, 1500);
      } else {
        setMessage({ text: data.message || 'Đăng ký tham gia thất bại.', type: 'error' });
      }
    } catch (error) {
      console.error("Lỗi đăng ký:", error);
      setMessage({ text: 'Đã xảy ra lỗi hệ thống khi gửi yêu cầu.', type: 'error' });
    } finally {
      setEnrollLoading(null);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-['Inter']">
      <Navbar user={user} />

      <main className="container mx-auto px-4 py-10 flex-grow">
        {message.text && (
          <div className="mb-6 max-w-2xl mx-auto">
            <Alert message={message.text} type={message.type} />
          </div>
        )}

        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-10 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900">Thư viện khóa học</h1>
            <p className="text-gray-500 mt-1">Khám phá và tham gia các khóa học công nghệ chất lượng cao của DCGLearn.</p>
          </div>
          <Link 
            to="/enrolled-courses"
            className="self-start px-5 py-2.5 bg-white border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all text-sm flex items-center gap-2 shadow-sm"
          >
            <i className="fas fa-graduation-cap text-blue-600"></i> Khóa học của tôi
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : courses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {/* VÒNG LẶP RÚT GỌN SIÊU SẠCH SẼ */}
            {courses.map(course => (
              <AvailableCourseCard 
                key={course.course_id} 
                course={course}
                isAlreadyEnrolled={enrolledIds.has(String(course.course_id))}
                onEnroll={handleEnroll}
                isLoading={enrollLoading === course.course_id}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white p-20 rounded-[2rem] border-2 border-dashed border-gray-200 text-center">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <i className="fas fa-box-open text-3xl text-gray-300"></i>
            </div>
            <h2 className="text-xl font-bold text-gray-800">Thư viện trống</h2>
            <p className="text-gray-500 mt-2">Hiện chưa có khóa học nào được giảng viên phát hành trên hệ thống.</p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default ViewCourseList;