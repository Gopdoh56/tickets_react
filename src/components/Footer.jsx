import React from 'react';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-section">
            <div className="footer-logo">
              <div className="footer-logo-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="13,2 3,14 12,14 11,22 21,10 12,10 13,2"></polygon>
                </svg>
              </div>
              <span className="footer-logo-text">EventPas</span>
            </div>
            <p className="footer-description">
              Your premier destination for discovering and booking amazing events.
            </p>
          </div>


          <div className="footer-section">
            <h3 className="footer-section-title">Categories</h3>
            <ul className="footer-links">
              <li><a href="#" className="footer-link">Music</a></li>
              <li><a href="#" className="footer-link">Technology</a></li>
              <li><a href="#" className="footer-link">Food & Drink</a></li>
            </ul>
          </div>

          <div className="footer-section">
            <h3 className="footer-section-title">Support</h3>
            <ul className="footer-links">
              <li><a href="#" className="footer-link">Contact Us</a></li>
              <li><a href="#" className="footer-link">0991010388 ,manjawiragospel@gmail.com</a></li>
              <li><a href="#" className="footer-link">Help Center</a></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p className="footer-copyright">
            © {new Date().getFullYear()} Eventpas. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;