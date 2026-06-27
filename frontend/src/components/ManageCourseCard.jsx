import React from 'react';
import { useNavigate } from 'react-router-dom';

const ManageCourseCard = ({ course, onDelete }) => {
  const navigate = useNavigate();

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

      {/* 👉 THAY ĐỔI TẠI ĐÂY: Chuyển từ flex sang grid-cols-2 để chứa vừa vặn 4 nút */}
      <div className="grid grid-cols-2 gap-2 pt-4 border-t border-gray-50">
        
        {/* 1. Nút Quản lý bài giảng */}
        <button 
          onClick={() => navigate(`/teacher/courses/${course.course_id}/lessons`)}
          className="py-2.5 bg-indigo-50 text-indigo-600 font-bold rounded-xl hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center gap-1 text-[10px] sm:text-xs text-center cursor-pointer"
        >
          <i className="fas fa-book-open"></i> QL Bài giảng
        </button>

        {/* 2. Nút Quản lý bài tập */}
        <button 
          onClick={() => navigate(`/teacher/courses/${course.course_id}/assessments`)}
          className="py-2.5 bg-purple-50 text-purple-600 font-bold rounded-xl hover:bg-purple-600 hover:text-white transition-all flex items-center justify-center gap-1 text-[10px] sm:text-xs text-center cursor-pointer"
        >
          <i className="fas fa-tasks"></i> QL Bài tập
        </button>

        {/* 3. Nút Sửa */}
        <button 
          onClick={() => navigate(`/edit-course/${course.course_id}`)}
          className="py-2.5 bg-blue-50 text-blue-600 font-bold rounded-xl hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center gap-1 text-[10px] sm:text-xs text-center cursor-pointer"
        >
          <i className="far fa-edit"></i> Sửa
        </button>

        {/* 4. Nút Xóa */}
        <button 
          onClick={() => onDelete(course.course_id)}
          className="py-2.5 bg-red-50 text-red-600 font-bold rounded-xl hover:bg-red-600 hover:text-white transition-all flex items-center justify-center gap-1 text-[10px] sm:text-xs text-center cursor-pointer"
        >
          <i className="far fa-trash-alt"></i> Xóa
        </button>
        
      </div>
    </div>
  );
};

export default ManageCourseCard;