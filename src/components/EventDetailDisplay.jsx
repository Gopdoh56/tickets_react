import React from 'react';
import './EventDetailDisplay.css';

const API_URL = 'http://127.0.0.1:8000';

const EventDetailDisplay = ({ event }) => {
  // Helper function to construct image URL
  const getImageUrl = (imageUrl) => {
    if (!imageUrl) return "/placeholder.svg";
    
    // Check if the URL is already complete (starts with http)
    if (imageUrl.startsWith('http')) {
      return imageUrl;
    }
    
    // If it's a relative path, construct the full URL
    if (imageUrl.startsWith('/')) {
      return `${API_URL}${imageUrl}`;
    }
    
    // If it doesn't start with /, add /media/ prefix
    return `${API_URL}/media/${imageUrl}`;
  };

  const imageUrl = getImageUrl(event.image);

  // Debug log to check image URL
  console.log('Event detail image:', event.image);
  console.log('Constructed image URL:', imageUrl);

  return (
    <div className="event-detail-display">
      <div className="event-detail-image-container">
        <img 
          src={imageUrl} 
          alt={event.title} 
          className="event-detail-image" 
          onError={(e) => {
            console.error('Failed to load event detail image:', e.target.src);
            e.target.src = "/placeholder.svg";
          }}
        />
        <div className="event-detail-overlay"></div>
        <div className="event-detail-header">
          <h1 className="event-detail-title">{event.title}</h1>
        </div>
      </div>

      <div className="details-card">
        <h2 className="details-title">Event Details</h2>
        <div className="info-grid">
          {/* Date Info Item */}
          <div className="info-item">
            <svg className="info-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            <div>
              <p className="info-label">Date</p>
              <p className="info-value">{new Date(event.date).toLocaleDateString()}</p>
            </div>
          </div>
          {/* Time Info Item */}
          <div className="info-item">
            <svg className="info-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            <div>
              <p className="info-label">Time</p>
              <p className="info-value">{new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
          </div>
          {/* Location Info Item */}
          <div className="info-item">
            <svg className="info-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
            <div>
              <p className="info-label">Location</p>
              <p className="info-value">{event.venue}</p>
            </div>
          </div>
        </div>

        <hr className="separator" />

        <h3 className="about-title">About This Event</h3>
        <p className="about-description">{event.description}</p>
      </div>
    </div>
  );
};

export default EventDetailDisplay;