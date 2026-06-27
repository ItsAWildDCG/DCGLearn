import React from 'react';

const TeacherCourseCard = ({ course }) => {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-all group">
      <div className="h-44 bg-slate-100 relative overflow-hidden">
        <img 
          src={course.image_url || 'https://via.placeholder.com/400x225?text=No+Image'} 
          alt={course.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute top-3 left-3">
          <span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-blue-600 text-xs font-bold rounded-lg shadow-sm">
            ID: {course.course_id}
          </span>
        </div>
      </div>
      
      <div className="p-5">
        <h3 className="text-lg font-bold text-gray-800 line-clamp-1 mb-2">{course.title}</h3>
        <p className="text-gray-500 text-sm line-clamp-2 mb-4 h-10">{course.description}</p>
        
        <div className="flex items-center justify-between pt-4 border-t border-gray-50">
          <div className="flex items-center gap-2 text-gray-400 text-xs font-medium">
            <i className="far fa-calendar-alt"></i>
            <span>{new Date(course.created_at).toLocaleDateString('vi-VN')}</span>
          </div>
          <button
          onClick={() => navigate(`/edit-course/${course.course_id}`)}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white text-sm font-bold rounded-xl hover:bg-black transition-colors">
            <i className="fas fa-edit text-[10px]"></i>
            
            Quản lý
          </button>
        </div>
      </div>
    </div>
  );
};

export default TeacherCourseCard;