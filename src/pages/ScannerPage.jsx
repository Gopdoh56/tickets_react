// src/pages/ScannerPage.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { QrScanner } from '@yudiel/react-qr-scanner';
import axios from 'axios';
import './ScannerPage.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const ScannerPage = () => {
  const { eventId } = useParams();
  const [searchParams] = useSearchParams();
  
  const [eventName, setEventName] = useState('');
  const [lastScanned, setLastScanned] = useState(null);
  const [status, setStatus] = useState('idle');
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
      setMessage('Downloading fresh event data...');
      const response = await axios.get(`${API_URL}/api/tickets/event/${eventId}/valid-ids/?token=${token}`);
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
        setMessage(`Error: ${error.response?.data?.error || 'Could not load data.'} Please connect to the internet and refresh.`);
        setIsReady(false);
      }
    } finally {
      setIsLoading(false);
    }
  }, [eventId, searchParams]);

  useEffect(() => {
    loadEventData();
  }, [loadEventData]);

  const handleScanResult = (result) => {
    if (!!result) {
      let scannedId;
      try {
        const lines = result.split('\n');
        const idLine = lines.find(line => line.startsWith('TicketID:'));
        if (!idLine) {
          throw new Error("Invalid QR code format");
        }
        scannedId = idLine.split(':')[1];
      } catch (e) {
        setStatus('error');
        setMessage('INVALID QR CODE: This is not a valid event ticket.');
        return;
      }
      
      if (scannedId === lastScanned) return;
      setLastScanned(scannedId);
      
      if (scannedCodes.has(scannedId)) {
        setStatus('warning');
        setMessage(`ALREADY SCANNED: Ticket ${scannedId.substring(0,8)}... has already been checked in.`);
      } else if (validEventTickets.has(scannedId)) {
        setStatus('success');
        setMessage(`SUCCESS: Welcome! Ticket ${scannedId.substring(0,8)}... is valid.`);
        setScannedCodes(prev => new Set(prev.add(scannedId)));
      } else {
        setStatus('error');
        setMessage(`INVALID TICKET: Code ${scannedId.substring(0,8)}... is not for this event or has been cancelled.`);
      }
      
      setTimeout(() => {
        setStatus('idle');
        setLastScanned(null);
        setMessage(`Ready to scan for: ${eventName}`);
      }, 3500);
    }
  };

  const handleError = (error) => {
    console.error('QR Scanner Error:', error);
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
          onDecode={handleScanResult}
          onError={handleError}
          constraints={{
            facingMode: 'environment'
          }}
          containerStyle={{ width: '100%' }}
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