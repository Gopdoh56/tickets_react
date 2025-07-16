// src/pages/ScannerPage.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import QrScanner from '../components/QrScanner';
import './ScannerPage.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const ScannerPage = () => {
  const { eventId } = useParams();
  const [searchParams] = useSearchParams();
  
  const [eventName, setEventName] = useState('');
  const [lastScannedId, setLastScannedId] = useState(null);
  const [status, setStatus] = useState('idle'); // idle, success, error, warning
  const [message, setMessage] = useState('Point camera at a ticket QR code.');
  const [scannedCodes, setScannedCodes] = useState(new Set());
  const [validEventTickets, setValidEventTickets] = useState(new Set());
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false); // New state for refresh indicator

  // Fixed data loading function
  const loadEventData = useCallback(async () => {
    const token = searchParams.get('token');
    const storageKey = `event_data_${eventId}`;

    if (!token) {
      setMessage("Access token missing. This page cannot be accessed directly.");
      setIsLoading(false);
      setIsReady(false);
      return;
    }

    // Step 1: Load from local storage if available (for fast initial display)
    const storedData = localStorage.getItem(storageKey);
    let hasStoredData = false;
    
    if (storedData) {
      try {
        const { eventName: storedEventName, validTicketIds: storedTicketIds } = JSON.parse(storedData);
        setValidEventTickets(new Set(storedTicketIds));
        setEventName(storedEventName);
        setMessage(`Ready to scan for ${storedEventName}`);
        setIsReady(true);
        setIsLoading(false); // Stop initial loading since we have cached data
        hasStoredData = true;
      } catch (e) {
        console.error("Failed to parse stored data:", e);
        localStorage.removeItem(storageKey);
      }
    }

    // Step 2: ALWAYS fetch fresh data from server
    try {
      // Show appropriate loading message
      if (hasStoredData) {
        setIsRefreshing(true);
        setMessage(`Checking for updates for: ${eventName}...`);
      } else {
        setMessage('Downloading event data...');
      }
      
      const apiUrl = `${API_URL}/api/tickets/event/${eventId}/valid-ids/?token=${token}`;
      const response = await axios.get(apiUrl);
      
      const { event_name, valid_ticket_ids } = response.data;
      const newValidTickets = new Set(valid_ticket_ids);
      
      // Step 3: Update with fresh data
      console.log("Successfully fetched fresh data. Scanner is now up-to-date.");
      localStorage.setItem(storageKey, JSON.stringify({
        eventName: event_name,
        validTicketIds: valid_ticket_ids,
      }));
      
      setValidEventTickets(newValidTickets);
      setEventName(event_name);
      setMessage(`Ready to scan for: ${event_name}`);
      setIsReady(true);

    } catch (error) {
      console.warn("Could not fetch fresh data:", error.response?.data?.error);
      
      if (!hasStoredData) {
        // Critical error: no cached data and no fresh data
        const errorMessage = error.response?.data?.error || 'Could not load event data.';
        setMessage(`Error: ${errorMessage} Please check connection and refresh.`);
        setIsReady(false);
      } else {
        // Non-critical error: we have cached data, just inform user
        setMessage(`Ready to scan for ${eventName} (using cached data)`);
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [eventId, searchParams]);

  // Initial data load
  useEffect(() => {
    loadEventData();
  }, [loadEventData]);

  // Add a manual refresh function
  const handleRefresh = () => {
    loadEventData();
  };

  const handleScanSuccess = (decodedText, decodedResult) => {
    // Prevent duplicate scans
    if (lastScannedId === decodedText) {
      return;
    }
    
    setLastScannedId(decodedText);
    
    // Check if this ticket is valid for this event
    if (validEventTickets.has(decodedText)) {
      if (scannedCodes.has(decodedText)) {
        // Already scanned
        setStatus('warning');
        setMessage('⚠️ Ticket already scanned!');
      } else {
        // Valid and new scan
        setScannedCodes(prev => new Set(prev).add(decodedText));
        setStatus('success');
        setMessage('✅ Valid ticket! Check-in successful.');
      }
    } else {
      // Invalid ticket
      setStatus('error');
      setMessage('❌ Invalid ticket for this event.');
    }
    
    // Clear the status after 3 seconds
    setTimeout(() => {
      setStatus('idle');
      setMessage('Point camera at a ticket QR code.');
    }, 3000);
  };
  
  const handleScanError = (errorMessage) => {
    // Only log errors, don't show them to user as they're usually just scanning issues
    console.log("QR scan error:", errorMessage);
  };

  // Show full-page loader only on initial load without cached data
  if (isLoading) {
    return <div className="scanner-container loading"><h2>Loading Event Data...</h2></div>;
  }
  
  // Show error state if data could not be loaded
  if (!isReady) {
    return (
      <div className="scanner-container error">
        <div className="result-panel">
          <p className="result-message">{message}</p>
          <button onClick={loadEventData} className="retry-btn">Retry Connection</button>
        </div>
      </div>
    );
  }

  // Main scanner interface
  return (
    <div className={`scanner-container ${status}`}>
      <div className="scanner-header">
        <div>
          Scanning for: <strong>{eventName}</strong>
        </div>
        <button 
          onClick={handleRefresh} 
          className="refresh-btn"
          disabled={isRefreshing}
        >
          {isRefreshing ? 'Updating...' : 'Refresh'}
        </button>
      </div>
      <div className="scanner-viewfinder">
        <QrScanner
          onScanSuccess={handleScanSuccess}
          onScanError={handleScanError}
        />
        <div className="scanner-overlay">
          <div className="scanner-box"></div>
        </div>
      </div>
      <div className="result-panel">
        <div className={`status-icon ${status}`}>
          {status === 'success' && '✓'}
          {status === 'error' && '✗'}
          {status === 'warning' && '!'}
          {status === 'idle' && '📷'}
        </div>
        <p className="result-message">{message}</p>
        <div className="scanned-count">
          Checked In: {scannedCodes.size} | Total Valid: {validEventTickets.size}
        </div>
        {isRefreshing && <div className="refresh-indicator">Updating ticket data...</div>}
      </div>
    </div>
  );
};

export default ScannerPage;