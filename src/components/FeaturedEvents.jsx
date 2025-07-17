import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import './FeaturedEvents.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

// --- CHANGE 1: The component now accepts a 'filters' prop ---
const FeaturedEvents = ({ filters }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- CHANGE 2: The useEffect hook now depends on the 'filters' prop ---
  useEffect(() => {
    const fetchEvents = async () => {
      // Set loading to true every time we fetch
      setLoading(true); 
      setError(null);

      try {
        // Build the query parameters for the API call
        const params = new URLSearchParams();
        
        // Always filter for featured events in this component
        params.append('is_featured', 'true');
        
        // If a search term exists in the filters, add it to the request
        if (filters && filters.search) {
          params.append('search', filters.search);
        }
        
        // If a category exists in the filters, add it to the request
        if (filters && filters.category) {
            params.append('category__slug', filters.category);
        }

        const response = await axios.get(`${API_URL}/api/events/?${params.toString()}`);
        
        console.log('API Response:', response.data);
        setEvents(response.data);

      } catch (err) {
        console.error("Failed to fetch events:", err);
        setError("Could not load events. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [filters]); // The effect re-runs whenever the filters object changes

  // --- NO OTHER CHANGES ARE MADE BELOW THIS LINE ---

  // Helper function to construct image URL
  const getImageUrl = (imageUrl) => {
    if (!imageUrl) return "/placeholder.svg";
    if (imageUrl.startsWith('http')) {
      return imageUrl;
    }
    if (imageUrl.startsWith('/')) {
      return `${API_URL}${imageUrl}`;
    }
    return `${API_URL}/media/${imageUrl}`;
  };

  // Render based on the state
  if (loading) {
    return (
      <section className="featured-events">
        <div className="container">
          <h2 className="featured-events-title">Featured Events</h2>
          <div className="loading-placeholder">Loading events...</div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="featured-events">
        <div className="container">
          <h2 className="featured-events-title">Featured Events</h2>
          <div className="error-message">{error}</div>
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

        {/* Added a check for when no events are found */}
        {events.length > 0 ? (
          <div className="events-grid">
            {events.map((event) => {
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
                    </div>

                    <div className="event-content">
                      <h3 className="event-title">{event.title}</h3>
                      
                      {/* UPDATED: More compact event details with proper icons */}
                      <div className="event-details-inline">
                        <div className="event-detail-item-inline">
                          <svg className="detail-icon-inline" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                          </svg>
                          <span>{new Date(event.date).toLocaleDateString()}</span>
                        </div>
                        <div className="event-detail-item-inline">
                          <svg className="detail-icon-inline" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                          </svg>
                          <span>{event.venue}</span>
                        </div>
                      </div>

                      <div className="event-footer">
                        <div className="event-price">
                          MWK{event.starting_price ? Number(event.starting_price).toFixed(2) : '0.00'}
                        </div>
                        <div className="get-tickets-btn">Get Tickets</div>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="no-events-found">
            <p>No featured events match your search. Try a different term or browse all events.</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default FeaturedEvents;