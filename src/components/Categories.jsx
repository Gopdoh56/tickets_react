// src/components/Categories.jsx

import React from 'react';
import './Categories.css';

// The component now accepts `onSearch` and `onCategorySelect` functions as props
const Categories = ({ onSearch, onCategorySelect }) => {
  const categories = [
    { name: "Music", slug: "music", color: "purple", icon: "music" },
    { name: "Technology", slug: "tech", color: "blue", icon: "zap" },
    { name: "Food", slug: "food", color: "green", icon: "camera" },
    { name: "Gaming", slug: "gaming", color: "red", icon: "gamepad" },
  ];

  // This function is called when the user presses 'Enter' in the search box
  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      // It calls the onSearch function that was passed down from HomePage
      onSearch(event.target.value);
    }
  };

  const renderIcon = (iconType) => {
    // Your existing renderIcon switch statement is perfect and doesn't need to change.
    switch (iconType) {
      case 'music':
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle>
          </svg>
        );
      case 'zap':
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="13,2 3,14 12,14 11,22 21,10 12,10 13,2"></polygon>
          </svg>
        );
      case 'camera':
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle>
          </svg>
        );
      case 'gamepad':
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="6" y1="11" x2="10" y2="11"></line><line x1="8" y1="9" x2="8" y2="13"></line><line x1="15" y1="12" x2="15.01" y2="12"></line><line x1="18" y1="10" x2="18.01" y2="10"></line><rect x="2" y="6" width="20" height="12" rx="2"></rect>
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <section className="categories">
      <div className="container">
        {/* The title and search bar are now grouped */}
        <div className="categories-header">
          <h2 className="categories-title">Find Your Next Event</h2>
          <div className="search-bar-wrapper">
            <input
              type="text"
              className="event-search-input"
              placeholder="Search events by name, artist, or location..."
              onKeyDown={handleKeyDown}
            />
          </div>
        </div>

        {/* The category grid remains, but the styling will make it more compact */}
        <div className="categories-grid">
          {categories.map((category) => (
            <div 
              key={category.slug} 
              className="category-card" 
              onClick={() => onCategorySelect(category.slug)}
            >
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