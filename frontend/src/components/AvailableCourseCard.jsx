import React from 'react';

const AvailableCourseCard = ({ course, isAlreadyEnrolled, onEnroll, isLoading }) => {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
      <div>
        <div className="flex justify-between items-start mb-4">
          <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
            <i className="fas fa-book text-xl"></i>
          </div>
          <span className="text-xs font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded">
            ID: {course.course_id}
          </span>
        </div>

        <h3 className="font-bold text-gray-800 text-lg mb-2 line-clamp-1">{course.title}</h3>
        <p className="text-gray-500 text-sm line-clamp-2 mb-6 h-10">{course.description}</p>
      </div>

      <div className="pt-4 border-t border-gray-50">
        {isAlreadyEnrolled ? (
          /* TRẠNG THÁI: ĐÃ ĐĂNG KÝ HỌC */
          <button 
            disabled
            className="w-full py-2.5 bg-gray-100 text-gray-400 font-bold rounded-xl cursor-not-allowed flex items-center justify-center gap-2 text-sm"
          >
            <i className="fas fa-check-circle text-green-500"></i> Đã đăng ký học
          </button>
        ) : (
          /* TRẠNG THÁI: CHƯA ĐĂNG KÝ */
          <button 
            onClick={() => onEnroll(course.course_id)}
            disabled={isLoading}
            className="w-full py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-2 text-sm shadow-sm shadow-blue-100 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <i className="fas fa-spinner fa-spin"></i> Đang xử lý...
              </>
            ) : (
              <>
                <i className="fas fa-plus text-xs"></i> Tham gia khóa học
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default AvailableCourseCard;