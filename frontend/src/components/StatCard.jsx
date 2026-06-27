import React from 'react';

const StatCard = ({ title, value, icon, colorSchema }) => {
  // Bản đồ màu sắc đồng bộ từ bản thiết kế gốc
  const schemas = {
    blue: { bg: 'bg-indigo-50 text-blue-600 border-blue-100', border: 'border-blue-100' },
    amber: { bg: 'bg-amber-50 text-amber-600 border-amber-100', border: 'border-amber-100' },
    green: { bg: 'bg-green-50 text-green-700 border-green-100', border: 'border-green-100' },
    purple: { bg: 'bg-purple-50 text-purple-600 border-purple-100', border: 'border-purple-100' }
  };

  const schema = schemas[colorSchema] || schemas.blue;

  return (
    <div className={`bg-white p-6 rounded-[20px] border ${schema.border} shadow-[0_10px_20px_rgba(0,0,0,0.02)] flex items-center gap-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_15px_30px_rgba(0,0,0,0.05)]`}>
      <div className={`w-[55px] h-[55px] rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${schema.bg}`}>
        <i className={`fas ${icon}`}></i>
      </div>
      <div>
        <p className="text-gray-400 text-sm font-medium mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-gray-800 tracking-tight">{value}</h3>
      </div>
    </div>
  );
};

export default StatCard;