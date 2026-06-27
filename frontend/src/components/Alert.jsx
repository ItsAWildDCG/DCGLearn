import React from 'react';

const Alert = ({ message, type = 'success' }) => {
  if (!message) return null;
  
  const styles = type === 'success' 
    ? 'bg-green-50 border-green-200 text-green-700' 
    : 'bg-red-50 border-red-200 text-red-700';

  return (
    <div className={`p-4 rounded-xl border ${styles} flex items-center gap-3 mb-6 animate-in fade-in duration-300`}>
      <i className={`fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}`}></i>
      <span className="text-sm font-medium">{message}</span>
    </div>
  );
};

export default Alert;