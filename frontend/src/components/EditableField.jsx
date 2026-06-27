import React from 'react';

const EditableField = ({ label, name, value, isEditing, onChange, type = 'text', disabled = false, placeholder = '' }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-y-1 sm:gap-y-0 gap-x-4 text-sm items-center py-2.5 border-b border-gray-50">
      <span className="text-gray-400 font-medium">{label}:</span>
      <div className="sm:col-span-2">
        {isEditing && !disabled ? (
          <input
            type={type}
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl font-semibold text-gray-700 focus:outline-none focus:border-blue-500 focus:bg-white transition text-sm"
          />
        ) : (
          <span className={`font-semibold ${disabled ? 'text-gray-400 select-all' : 'text-gray-700'}`}>
            {value || <span className="text-gray-300 italic font-normal">Chưa cập nhật</span>}
          </span>
        )}
      </div>
    </div>
  );
};

export default EditableField;