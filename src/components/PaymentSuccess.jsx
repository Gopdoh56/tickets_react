// src/pages/PaymentSuccess.jsx

import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Link, useSearchParams } from 'react-router-dom';
import TicketCard from '../components/TicketCard'; // Import the self-sufficient component
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

          // --- THIS IS THE ONLY CHANGE ---
          // We add '&order_id=${txRef}' to the end of the URL.
          // This tells the backend to fetch tickets only for this specific transaction.
          const ticketsResponse = await axios.get(`${API_URL}/api/payments/user-tickets/?email=${userEmail}&order_id=${txRef}`);
          // --- END OF CHANGE ---
          
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

  // --- RENDER LOGIC ---

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
        <h2>Your Tickets ({tickets.length})</h2>
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
        <p>A confirmation has also been sent to your email and WhatsApp (if provided).</p>
        <Link to="/" className="btn-home">Explore More Events</Link>
      </div>
    </div>
  );
};

export default PaymentSuccess;