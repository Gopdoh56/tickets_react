// src/pages/PaymentSuccess.jsx

import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Link, useSearchParams } from 'react-router-dom';
import TicketCard from '../components/TicketCard';
import './PaymentSuccess.css'; 

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const [verificationStatus, setVerificationStatus] = useState('verifying');
  const [tickets, setTickets] = useState([]);
  const [message, setMessage] = useState('Verifying your payment...');
  
  const hasFetched = useRef(false);
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  useEffect(() => {
    const txRef = searchParams.get('tx_ref');
    if (!txRef || hasFetched.current) {
      if(!txRef) {
          setVerificationStatus('failed');
          setMessage('No transaction reference found in URL.');
      }
      return;
    }
    hasFetched.current = true;

    const verifyAndFetch = async () => {
      try {
        const verifyResponse = await axios.get(`${API_URL}/api/payments/verify-payment/${txRef}/`);
        
        if (verifyResponse.data.status === 'success') {
          setMessage('Payment confirmed! Fetching your tickets...');
          
          const userEmail = verifyResponse.data.email;

          // --- THIS IS THE FIX ---
          // We add '&order_id=${txRef}' to the end of the URL.
          // This tells the backend to fetch tickets ONLY for this specific transaction.
          const ticketsResponse = await axios.get(`${API_URL}/api/payments/user-tickets/?email=${userEmail}&order_id=${txRef}`);
          // --- END OF FIX ---
          
          setTickets(ticketsResponse.data.tickets || []);
          setVerificationStatus('success');
          setMessage('Your tickets are ready! You can download them below.');
        } else {
          setVerificationStatus('failed');
          setMessage(verifyResponse.data.message || 'Payment could not be confirmed.');
        }
      } catch (error) {
        console.error('An error occurred during verification:', error);
        setVerificationStatus('failed');
        setMessage(error.response?.data?.message || 'A server error occurred.');
      }
    };

    verifyAndFetch();
  }, [searchParams, API_URL]);

  // --- RENDER LOGIC (No changes needed here) ---
  if (verificationStatus === 'verifying') {
    return (
      <div className="payment-status-container">
        <h2>Processing Your Order...</h2>
        <p>{message}</p>
        <div className="spinner"></div>
      </div>
    );
  }

  if (verificationStatus === 'failed') {
    return (
      <div className="payment-status-container">
        <h1>Verification Failed</h1>
        <p style={{ color: 'red' }}>{message}</p>
        <Link to="/" className="btn-home">Back to Events</Link>
      </div>
    );
  }

  return (
    <div className="payment-success-container">
      <div className="success-header">
        <h1>Payment Successful!</h1>
        <p>{message}</p>
      </div>
      <div className="tickets-section">
        <h2>Your Tickets For This Order ({tickets.length})</h2>
        <div className="tickets-grid-display">
          {tickets.length > 0 ? (
            tickets.map((ticket) => (
              <TicketCard key={ticket.ticket_id} ticket={ticket} />
            ))
          ) : (
            <p>No tickets found for this order. Please contact support.</p>
          )}
        </div>
      </div>
      <div className="success-footer">
        <p>Your tickets are ready. Please download them for your records.</p>
        <Link to="/recover-tickets" className="link">Lost your tickets? Recover them here.</Link>
        <br />
        <Link to="/" className="btn-home">Explore More Events</Link>
      </div>
    </div>
  );
};

export default PaymentSuccess;