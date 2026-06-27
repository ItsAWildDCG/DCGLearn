import React from 'react';

const Footer = () => {
  return (
    <footer className="container mx-auto text-center py-10 text-gray-500 text-sm border-t border-gray-100 mt-auto">
      <p>&copy; {new Date().getFullYear()} <span className="font-bold text-gray-700">DCGLearn</span>. Hệ thống quản lý học tập trực tuyến.</p>
    </footer>
  );
};

export default Footer;