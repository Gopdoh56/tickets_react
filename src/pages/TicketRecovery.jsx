// src/pages/TicketRecovery.jsx

import React, { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import './TicketRecovery.css'; // You can reuse the CSS from the previous version

const TicketRecovery = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // 'idle', 'loading', 'success', 'error'
  const [message, setMessage] = useState('');

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      setMessage('Please enter your email address.');
      setStatus('error');
      return;
    }

    setStatus('loading');
    setMessage('');

    try {
      const response = await axios.post(`${API_URL}/api/payments/recover-tickets/`, { email });
      
      setStatus('success');
      setMessage(response.data.message || 'Your recovery link has been sent!');
      setEmail('');
      
    } catch (error) {
      setStatus('error');
      setMessage(error.response?.data?.error || 'An unexpected error occurred. Please try again.');
    }
  };

  return (
    <div className="ticket-recovery-container">
      <div className="recovery-card">
        <h1 className="recovery-title">Find Your Tickets</h1>
        <p className="recovery-subtitle">
          Enter the email address you used during purchase, and we'll send you a special link to view and download all your tickets.
        </p>

        <form onSubmit={handleSubmit} className="recovery-form">
          <div className="form-group">
            <label htmlFor="email">Your Purchase Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              disabled={status === 'loading'}
            />
          </div>
          <button type="submit" className="btn-resend" disabled={status === 'loading'}>
            {status === 'loading' ? 'Sending Link...' : 'Send Recovery Email'}
          </button>
        </form>

        {message && (
          <div 
            className={`message-box ${status === 'success' ? 'success' : 'error'}`}
            style={{ display: status !== 'idle' ? 'block' : 'none' }}
          >
            {message}
          </div>
        )}

        <div className="back-link-container">
          <Link to="/" className="back-link">← Back to Home</Link>
        </div>
      </div>
    </div>
  );
};

export default TicketRecovery;