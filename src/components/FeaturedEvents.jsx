import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import './FeaturedEvents.css';

// This is the URL of your Django backend.
// CORRECT - This works for both local development and live deployment
const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

const FeaturedEvents = () => {
  // Create state variables
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch data when the component loads
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        // Make a GET request to your Django API endpoint for events
        const response = await axios.get(`${API_URL}/api/events/`);
        console.log('API Response:', response.data); // Debug log to check the response
        setEvents(response.data);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch events:", err);
        setError("Could not load events. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

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

  // Render based on the state
  if (loading) {
    return (
      <section className="featured-events">
        <div className="container">
          <h2 className="featured-events-title">Featured Events</h2>
          <p>Loading...</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="featured-events">
        <div className="container">
          <h2 className="featured-events-title">Featured Events</h2>
          <p style={{ color: 'red' }}>{error}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="featured-events">
      <div className="container">
        <div className="featured-events-header">
          <h2 className="featured-events-title">Featured Events</h2>
          <button className="view-all-btn">View All Events</button>
        </div>

        <div className="events-grid">
          {events.map((event) => {
            // Debug log to check each event's image URL
            console.log(`Event ${event.id} image:`, event.image);
            
            return (
              <Link to={`/events/${event.id}`} key={event.id} className="event-card-link">
                <div className="event-card">
                  <div className="event-image-container">
                    <img
                      src={getImageUrl(event.image)}
                      alt={event.title}
                      className="event-image"
                      onError={(e) => {
                        console.error(`Failed to load image for event ${event.id}:`, e.target.src);
                        e.target.src = "/placeholder.svg";
                      }}
                    />
                    <div className="event-badge">{event.category || 'General'}</div>
                    <div className="event-rating">
                      <svg className="star-icon" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"></polygon>
                      </svg>
                      <span>{event.rating || '4.5'}</span>
                    </div>
                  </div>

                  <div className="event-content">
                    <h3 className="event-title">{event.title}</h3>

                    <div className="event-details">
                      <div className="event-detail">
                        <svg className="detail-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                          <line x1="16" y1="2" x2="16" y2="6"></line>
                          <line x1="8" y1="2" x2="8" y2="6"></line>
                          <line x1="3" y1="10" x2="21" y2="10"></line>
                        </svg>
                        <span>{new Date(event.date).toLocaleDateString()}</span>
                      </div>
                      <div className="event-detail">
                        <svg className="detail-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
                          <circle cx="12" cy="10" r="3"></circle>
                        </svg>
                        <span>{event.venue}</span>
                      </div>
                      <div className="event-detail">
                        <svg className="detail-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                          <circle cx="9" cy="7" r="4"></circle>
                          <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                          <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                        </svg>
                        <span>{event.attendees || '1K+'} attending</span>
                      </div>
                    </div>

                    <div className="event-footer">
                      <div className="event-price">
                        ${event.starting_price ? Number(event.starting_price).toFixed(2) : '0.00'}
                      </div>
                      <div className="get-tickets-btn">Get Tickets</div>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FeaturedEvents;