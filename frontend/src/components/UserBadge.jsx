import React from 'react';

const UserBadge = ({ role }) => {
  const normalizedRole = (role || '').toLowerCase().trim();

  const config = {
    admin: {
      bg: 'bg-red-50 text-red-500 border-red-100',
      icon: 'fa-user-shield',
      text: 'Quản trị viên'
    },
    teacher: {
      bg: 'bg-amber-50 text-amber-600 border-amber-100',
      icon: 'fa-chalkboard-teacher',
      text: 'Giảng viên'
    },
    student: {
      bg: 'bg-blue-50 text-blue-500 border-blue-100',
      icon: 'fa-user-graduate',
      text: 'Học viên'
    }
  };

  const current = config[normalizedRole] || config.student;

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${current.bg}`}>
      <i className={`fas ${current.icon}`}></i>
      {current.text}
    </span>
  );
};

export default UserBadge;