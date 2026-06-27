import React from 'react';

const RoleBadge = ({ role }) => {
  const currentRole = (role || '').toLowerCase().trim();

  if (currentRole === 'teacher' || currentRole === 'giảng viên') {
    return (
      <span className="px-4 py-1.5 text-xs font-bold rounded-full shadow-sm bg-amber-50 text-amber-600 border border-amber-100">
        Giảng viên
      </span>
    );
  }

  if (currentRole === 'admin') {
    return (
      <span className="px-4 py-1.5 text-xs font-bold rounded-full shadow-sm bg-red-50 text-red-600 border border-red-100 animate-pulse">
        Quản trị viên
      </span>
    );
  }

  return (
    <span className="px-4 py-1.5 text-xs font-bold rounded-full shadow-sm bg-blue-50 text-blue-600 border border-blue-100">
      Học viên
    </span>
  );
};

export default RoleBadge;