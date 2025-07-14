// src/pages/ScannerPage.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom'; // <-- 1. Import useParams and Link
import { QrReader } from 'react-qr-reader';
import axios from 'axios';
import './ScannerPage.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const ScannerPage = () => {
  // --- 2. Get the eventId dynamically from the URL ---
  const { eventId } = useParams(); 

  const [eventName, setEventName] = useState('');
  const [lastScanned, setLastScanned] = useState(null);
  const [status, setStatus] = useState('idle'); // 'idle', 'success', 'error', 'warning'
  const [message, setMessage] = useState('Point camera at a ticket QR code.');
  
  // Use a Set for efficient 'lookup' operations
  const [scannedCodes, setScannedCodes] = useState(new Set());
  const [validEventTickets, setValidEventTickets] = useState(new Set());
  
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // This function now loads data for the specific eventId from the URL
  const loadEventData = useCallback(async () => {
    setIsLoading(true);
    // Use a unique key for local storage for each event
    const storageKey = `event_data_${eventId}`;
    
    try {
      // Always try to fetch fresh data if online
      setMessage('Downloading event data...');
      
      // NOTE: This API call needs to be authenticated!
      // You'll need to send a JWT token in the headers for a real app.
      const response = await axios.get(`${API_URL}/api/tickets/event/${eventId}/valid-ids/`);
      
      const { valid_ticket_ids, event_name } = response.data; // Assume backend also sends event name
      
      const newValidTickets = new Set(valid_ticket_ids);
      
      // Save fresh data to local storage for offline use
      localStorage.setItem(storageKey, JSON.stringify({
        eventName: event_name,
        validTicketIds: ticket_ids_as_strings
      }));
      
      setValidEventTickets(newValidTickets);
      setEventName(event_name);
      setMessage(`Ready to scan for: ${event_name}`);

    } catch (error) {
      // If fetching fails (e.g., offline), try to use stale data from local storage
      console.warn("API fetch failed, attempting to load from local storage.", error);
      const storedData = localStorage.getItem(storageKey);
      if (storedData) {
        const { eventName: storedEventName, validTicketIds: storedTicketIds } = JSON.parse(storedData);
        setValidEventTickets(new Set(storedTicketIds));
        setEventName(storedEventName);
        setMessage(`Offline Mode: Ready to scan for ${storedEventName}`);
      } else {
        setMessage(`Error: Could not load data for Event ID ${eventId}. Please connect to the internet and refresh.`);
        setIsReady(false);
      }
    } finally {
      setIsReady(true);
      setIsLoading(false);
    }
  }, [eventId]); // Re-run if the eventId in the URL changes

  useEffect(() => {
    loadEventData();
  }, [loadEventData]);


  const handleScanResult = (result, error) => {
    if (!!result) {
      let scannedId;
      try {
        // Your QR code data is multi-line, so we need to parse it
        const lines = result.text.split('\n');
        const idLine = lines.find(line => line.startsWith('TicketID:'));
        if (!idLine) throw new Error("Invalid QR code format");
        scannedId = idLine.split(':')[1];
      } catch (e) {
        setStatus('error');
        setMessage('INVALID QR CODE: This code is not a valid event ticket.');
        return;
      }
      
      // Prevent immediate re-scan of the same code
      if (scannedId === lastScanned) return;
      setLastScanned(scannedId);
      
      // Perform the check
      if (scannedCodes.has(scannedId)) {
        setStatus('warning'); // Orange for already used
        setMessage(`ALREADY SCANNED: Ticket ${scannedId.substring(0,8)}... has already been checked in.`);
      } else if (validEventTickets.has(scannedId)) {
        setStatus('success'); // Green for valid
        setMessage(`SUCCESS: Welcome! Ticket ${scannedId.substring(0,8)}... is valid.`);
        setScannedCodes(prev => new Set(prev.add(scannedId)));
      } else {
        setStatus('error'); // Red for invalid
        setMessage(`INVALID TICKET: Code ${scannedId.substring(0,8)}... is not valid for this event.`);
      }
      
      // Reset the status message/color after a few seconds
      setTimeout(() => {
        setStatus('idle');

        setMessage(`Ready to scan for: ${eventName}`);
      }, 3000);
    }
  };

  if (isLoading) {
    return <div className="scanner-container loading">Loading Event Data...</div>;
  }
  
  if (!isReady) {
    return (
      <div className="scanner-container error">
        <div className="result-panel">
          <p className="result-message">{message}</p>
          <button onClick={loadEventData} className="retry-btn">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className={`scanner-container ${status}`}>
      <div className="scanner-header">
        Scanning for: <strong>{eventName || `Event ID: ${eventId}`}</strong>
      </div>
      <div className="scanner-viewfinder">
        <QrReader
          onResult={handleScanResult}
          constraints={{ facingMode: 'environment' }}
          containerStyle={{ width: '100%', paddingTop: '75%' }} // Aspect ratio fix for some devices
          videoContainerStyle={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}
        />
        <div className="scanner-overlay"></div>
      </div>
      <div className="result-panel">
        <div className={`status-icon ${status}`}>
          {status === 'success' && '✓'}
          {status === 'error' && '✗'}
          {status === 'warning' && ' L'}
        </div>
        <p className="result-message">{message}</p>
        <div className="scanned-count">
          Checked In: {scannedCodes.size} / {validEventTickets.size}
        </div>
      </div>
    </div>
  );
};

export default ScannerPage;