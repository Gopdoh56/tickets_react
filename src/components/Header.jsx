// src/components/Header.jsx

import React from 'react';
import { Link } from 'react-router-dom'; // <-- Import Link for navigation
import './Header.css';

const Header = () => {
  return (
    <header className="header">
      <div className="container">
        <div className="header-content">
          <Link to="/" className="logo"> {/* Make the logo a link to the homepage */}
            <div className="logo-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="13,2 3,14 12,14 11,22 21,10 12,10 13,2"></polygon>
              </svg>
            </div>
            <span className="logo-text">EventHub</span>
          </Link>
          
          <nav className="nav">
            <Link to="/" className="nav-link">Events</Link>
            <Link to="/categories" className="nav-link">Categories</Link>
            <Link to="/about" className="nav-link">About</Link>
            <Link to="/contact" className="nav-link">Contact</Link>
          </nav>
          
          {/* --- NEW BUTTON ADDED HERE --- */}
          <div className="header-actions">
            <Link to="/recover-tickets" className="btn btn-secondary">
              Recover Ticket
            </Link>
          </div>
          {/* --- END OF NEW BUTTON --- */}
          
        </div>
      </div>
    </header>
  );
};

export default Header;