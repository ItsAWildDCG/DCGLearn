import React from 'react';
import Logo from './Logo';

const AuthHeader = ({ title, subtitle }) => {
  return (
    <div className="text-center mb-8">
      <Logo className="justify-center mb-4" />
      <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
      <p className="text-gray-500">{subtitle}</p>
    </div>
  );
};

export default AuthHeader;