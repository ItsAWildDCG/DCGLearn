import React from 'react';
import { useNavigate } from 'react-router-dom';

const EnrolledCourseCard = ({ course }) => {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
      <div>
        <div className="flex justify-between items-start mb-4">
          {/* Đổi icon và màu sắc sang tone xanh lá (Green) đại diện cho học tập/hoàn thành */}
          <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-green-600">
            <i className="fas fa-graduation-cap text-xl"></i>
          </div>
          <span className="text-xs font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded">
            ID: {course.course_id}
          </span>
        </div>

        <h3 className="font-bold text-gray-800 text-lg mb-2 line-clamp-1">{course.title}</h3>
        <p className="text-gray-500 text-sm line-clamp-2 mb-6 h-10">{course.description}</p>
      </div>

      <div className="pt-4 border-t border-gray-50">
        <button 
          onClick={() => navigate(`/learning/${course.course_id}`)}
          className="w-full py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-sm shadow-blue-100"
        >
          <i className="fas fa-play text-xs"></i> Vào học ngay
        </button>
      </div>
    </div>
  );
};

export default EnrolledCourseCard;