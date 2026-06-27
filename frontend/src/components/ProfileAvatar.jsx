import React from 'react';

const ProfileAvatar = ({ name, imageUrl, onUploadClick }) => {
  const firstLetter = name ? name.charAt(0).toUpperCase() : 'U';

  return (
    <div className="w-32 h-32 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center text-4xl font-extrabold shadow-inner border border-blue-100/50 mb-4 relative group">
      {imageUrl ? (
        <img src={imageUrl} alt={name} className="w-full h-full object-cover rounded-full" />
      ) : (
        firstLetter
      )}
      <button 
        type="button" 
        onClick={onUploadClick}
        className="absolute bottom-0 right-1 w-8 h-8 bg-blue-600 text-white text-xs rounded-full border-2 border-white flex items-center justify-center shadow hover:bg-blue-700 transition duration-200 cursor-pointer"
        title="Thay đổi ảnh đại diện"
      >
        <i className="fas fa-camera"></i>
      </button>
    </div>
  );
};

export default ProfileAvatar;