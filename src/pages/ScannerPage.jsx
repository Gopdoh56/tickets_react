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
  const [isLoading, setIsLoading] = useState(true); // Manages the initial loading screen

  // This is the new, more robust data loading function.
  const loadEventData = useCallback(async () => {
    // We only show the full-page "Loading..." screen on the very first load.
    // Subsequent refreshes will happen in the background.
    if (!isReady) {
      setIsLoading(true);
    }

    const token = searchParams.get('token');
    const storageKey = `event_data_${eventId}`;

    if (!token) {
      setMessage("Access token missing. This page cannot be accessed directly.");
      setIsLoading(false);
      setIsReady(false);
      return;
    }

    // --- NEW "STALE-WHILE-REVALIDATE" STRATEGY ---

    // Step 1: Immediately load from local storage to make the app ready fast.
    const storedData = localStorage.getItem(storageKey);
    if (storedData) {
      try {
        const { eventName: storedEventName, validTicketIds: storedTicketIds } = JSON.parse(storedData);
        setValidEventTickets(new Set(storedTicketIds));
        setEventName(storedEventName);
        setMessage(`Ready to scan for ${storedEventName} (using cached data)`);
        setIsReady(true); // The scanner is now ready with potentially stale data
      } catch (e) {
        console.error("Failed to parse stored data:", e);
        localStorage.removeItem(storageKey); // Clear corrupted data
      }
    }

    // Step 2: ALWAYS attempt to fetch fresh data from the server.
    try {
      if (isReady) {
        setMessage(`Checking for updates for: ${eventName}...`);
      } else {
        setMessage('Downloading event data...');
      }
      
      const apiUrl = `${API_URL}/api/tickets/event/${eventId}/valid-ids/?token=${token}`;
      const response = await axios.get(apiUrl);
      
      const { event_name, valid_ticket_ids } = response.data;
      const newValidTickets = new Set(valid_ticket_ids);
      
      // Step 3: If the fetch is successful, update state and local storage.
      console.log("Successfully fetched fresh data. Scanner is now up-to-date.");
      localStorage.setItem(storageKey, JSON.stringify({
        eventName: event_name,
        validTicketIds: valid_ticket_ids,
      }));
      
      setValidEventTickets(newValidTickets);
      setEventName(event_name);
      setMessage(`Ready to scan for: ${event_name} (data updated)`);
      setIsReady(true); // Ensure the app is marked as ready

    } catch (error) {
      // If the API fetch fails, it's okay. The user can continue using the old data if it exists.
      console.warn("Could not fetch fresh data. Continuing in offline/stale mode.", error.response?.data?.error);
      
      if (!storedData) {
        // Only show a critical error if there was no stored data to begin with.
        const errorMessage = error.response?.data?.error || 'Could not load event data.';
        setMessage(`Error: ${errorMessage} Please check connection and refresh.`);
        setIsReady(false);
      } else {
        // If we already loaded stale data, just update the message to inform the user.
        setMessage(`OFFLINE MODE: Ready to scan for ${eventName}`);
      }
    } finally {
      // No matter what, the initial loading process is finished.
      setIsLoading(false);
    }
  }, [eventId, searchParams]); // The `isReady` and `eventName` dependencies were removed to prevent loops

  // This useEffect triggers the initial data load.
  useEffect(() => {
    loadEventData();
  }, [loadEventData]); // This will run once when the component mounts.

  const handleScanSuccess = (decodedText, decodedResult) => {
    // Your existing handleScanSuccess logic is perfect and does not need to change.
    // It correctly uses the `validEventTickets` state, which is now being updated by `loadEventData`.
    // ... (keep the entire function as is) ...
  };
  
  const handleScanError = (errorMessage) => {
    // This function is also fine as is.
  };

  // --- RENDER LOGIC ---

  // Show a full-page loader only on the very first load.
  if (isLoading) {
    return <div className="scanner-container loading"><h2>Loading Event Data...</h2></div>;
  }
  
  // Show an error state if data could not be loaded from either API or cache.
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

  // Once ready, show the main scanner interface.
  return (
    <div className={`scanner-container ${status}`}>
      <div className="scanner-header">
        Scanning for: <strong>{eventName}</strong>
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
      </div>
    </div>
  );
};

export default ScannerPage;