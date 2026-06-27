import React from 'react';

const Logo = ({ className = "" }) => {
  return (
    <div className={`flex items-center gap-2 text-blue-600 font-extrabold text-2xl ${className}`}>
      <i className="fas fa-graduation-cap"></i>
      <span>DCG<span className="text-gray-800">Learn</span></span>
    </div>
  );
};

export default Logo;