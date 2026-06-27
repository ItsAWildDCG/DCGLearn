import React from 'react';
import UserBadge from './UserBadge';

const UserTableRow = ({ user, onEdit, onDelete }) => {
  const shortId = user.id;

  return (
    <tr className="border-b border-slate-50 hover:bg-slate-50/80 transition-colors">
      <td className="px-6 py-4.5 font-mono text-blue-600 font-semibold text-sm">#{shortId}</td>
      <td className="px-6 py-4.5 font-semibold text-slate-800 text-sm">{user.name || 'Chưa cập nhật'}</td>
      <td className="px-6 py-4.5 text-slate-600 text-sm">{user.email}</td>
      <td className="px-6 py-4.5">
        <UserBadge role={user.role} />
      </td>
      <td className="px-6 py-4.5 text-right">
        <div className="inline-flex gap-2">
          <button 
            onClick={() => onEdit(user.id)}
            className="w-9 h-9 rounded-xl inline-flex items-center justify-center bg-slate-100 text-slate-600 transition-colors hover:bg-slate-200 hover:text-slate-800"
            title="Chỉnh sửa / Đổi mật khẩu"
          >
            <i className="fas fa-key text-xs"></i>
          </button>
          <button 
            onClick={() => onDelete(user.id)}
            className="w-9 h-9 rounded-xl inline-flex items-center justify-center bg-red-50 text-red-500 transition-colors hover:bg-red-100 hover:text-red-600"
            title="Xóa tài khoản"
          >
            <i className="far fa-trash-alt text-xs"></i>
          </button>
        </div>
      </td>
    </tr>
  );
};

export default UserTableRow;