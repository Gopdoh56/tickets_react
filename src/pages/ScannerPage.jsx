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

  const loadEventData = useCallback(async () => {
    setIsLoading(true);
    const token = searchParams.get('token');
    const storageKey = `event_data_${eventId}`;

    if (!token) {
      setMessage("Access token missing. This page cannot be accessed directly.");
      setIsLoading(false);
      setIsReady(false);
      return;
    }
    
    try {
      setMessage('Downloading event data...');
      const apiUrl = `${API_URL}/api/tickets/event/${eventId}/valid-ids/?token=${token}`;
      const response = await axios.get(apiUrl);
      
      const { event_name, valid_ticket_ids } = response.data;
      const newValidTickets = new Set(valid_ticket_ids);
      
      // Save fresh data to local storage for offline use
      localStorage.setItem(storageKey, JSON.stringify({
        eventName: event_name,
        validTicketIds: valid_ticket_ids,
      }));
      
      setValidEventTickets(newValidTickets);
      setEventName(event_name);
      setMessage(`Ready to scan for: ${event_name}`);
      setIsReady(true);

    } catch (error) {
      console.warn("API fetch failed. Trying to load from offline storage.", error.response?.data?.error);
      const storedData = localStorage.getItem(storageKey);
      if (storedData) {
        const { eventName: storedEventName, validTicketIds: storedTicketIds } = JSON.parse(storedData);
        setValidEventTickets(new Set(storedTicketIds));
        setEventName(storedEventName);
        setMessage(`OFFLINE MODE: Ready to scan for ${storedEventName}`);
        setIsReady(true);
      } else {
        const errorMessage = error.response?.data?.error || 'Could not load data.';
        setMessage(`Error: ${errorMessage} Please check your connection and refresh.`);
        setIsReady(false);
      }
    } finally {
      setIsLoading(false);
    }
  }, [eventId, searchParams]);

  useEffect(() => {
    loadEventData();
  }, [loadEventData]);

  const handleScanSuccess = (decodedText, decodedResult) => {
    if (!decodedText || decodedText === lastScannedId) {
      return; 
    }
    setLastScannedId(decodedText);
    
    let scannedId;
    try {
      const lines = decodedText.trim().split('\n');
      const idLine = lines.find(line => line.trim().startsWith('TicketID:'));
      if (!idLine) throw new Error("QR code format invalid.");
      
      scannedId = idLine.split(':')[1].trim();
      if (!scannedId) throw new Error("TicketID value empty.");

    } catch (e) {
      setStatus('error');
      setMessage(`INVALID QR CODE: ${e.message}`);
      setTimeout(() => setStatus('idle'), 3500);
      return;
    }
    
    if (scannedCodes.has(scannedId)) {
      setStatus('warning');
      setMessage(`ALREADY SCANNED: Ticket ${scannedId.substring(0,8)}...`);
    } else if (validEventTickets.has(scannedId)) {
      setStatus('success');
      setMessage(`SUCCESS: Welcome! Ticket ${scannedId.substring(0,8)}... is valid.`);
      setScannedCodes(prev => new Set(prev.add(scannedId)));
    } else {
      setStatus('error');
      setMessage(`INVALID TICKET: Code ${scannedId.substring(0,8)}... not for this event.`);
    }
    
    setTimeout(() => {
      setStatus('idle');
      setMessage(`Ready to scan for: ${eventName}`);
    }, 3500);
  };
  
  const handleScanError = (errorMessage) => {
    // This function is called by html5-qrcode when it fails to decode a QR code
    // in a given frame. It's not a validation error, so we can ignore it.
  };

  if (isLoading) {
    return <div className="scanner-container loading"><h2>Loading Event Data...</h2></div>;
  }
  
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