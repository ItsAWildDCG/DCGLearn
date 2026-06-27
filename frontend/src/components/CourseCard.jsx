import React from 'react';

const CourseCard = ({ course }) => {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow group">
      <div className="h-40 bg-gray-200 relative overflow-hidden">
        <img 
          src={course.image_url || 'https://via.placeholder.com/400x200?text=Course+Image'} 
          alt={course.title} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>
      <div className="p-4">
        <h3 className="font-bold text-gray-800 text-lg line-clamp-1">{course.title}</h3>
        <p className="text-gray-500 text-sm mt-1 line-clamp-2 min-h-[40px]">{course.description}</p>
        <div className="mt-4 flex items-center justify-between">
          <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">
            ID: {course.course_id}
          </span>
          <button className="text-sm font-bold text-white bg-blue-600 px-4 py-1.5 rounded-lg hover:bg-blue-700 transition">
            Vào học
          </button>
        </div>
      </div>
    </div>
  );
};

export default CourseCard;