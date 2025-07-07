import React from 'react';
import './Categories.css';

const Categories = () => {
  const categories = [
    { name: "Music", color: "purple", icon: "music" },
    { name: "Technology", color: "blue", icon: "zap" },
    { name: "Food", color: "green", icon: "camera" },
    { name: "Gaming", color: "red", icon: "gamepad" },
  ];

  const renderIcon = (iconType) => {
    switch (iconType) {
      case 'music':
        return (
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 18V5l12-2v13"></path>
            <circle cx="6" cy="18" r="3"></circle>
            <circle cx="18" cy="16" r="3"></circle>
          </svg>
        );
      case 'zap':
        return (
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="13,2 3,14 12,14 11,22 21,10 12,10 13,2"></polygon>
          </svg>
        );
      case 'camera':
        return (
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
            <circle cx="12" cy="13" r="4"></circle>
          </svg>
        );
      case 'gamepad':
        return (
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="6" y1="11" x2="10" y2="11"></line>
            <line x1="8" y1="9" x2="8" y2="13"></line>
            <line x1="15" y1="12" x2="15.01" y2="12"></line>
            <line x1="18" y1="10" x2="18.01" y2="10"></line>
            <rect x="2" y="6" width="20" height="12" rx="2"></rect>
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <section className="categories">
      <div className="container">
        <h2 className="categories-title">Browse by Category</h2>
        <div className="categories-grid">
          {categories.map((category, index) => (
            <div key={index} className="category-card">
              <div className="category-content">
                <div className={`category-icon ${category.color}`}>
                  {renderIcon(category.icon)}
                </div>
                <h3 className="category-name">{category.name}</h3>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Categories;