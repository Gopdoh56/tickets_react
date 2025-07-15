import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams, useLocation } from 'react-router-dom';
import { QrScanner } from '@yudiel/react-qr-scanner';
import axios from 'axios';
import './ScannerPage.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const ScannerPage = () => {
  const { eventId } = useParams();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  
  const [eventName, setEventName] = useState('');
  const [lastScanned, setLastScanned] = useState(null);
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('Point camera at a ticket QR code.');
  const [scannedCodes, setScannedCodes] = useState(new Set());
  const [validEventTickets, setValidEventTickets] = useState(new Set());
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Debug information
  console.log('DEBUG: Current location:', location);
  console.log('DEBUG: Event ID from params:', eventId);
  console.log('DEBUG: Search params:', Object.fromEntries(searchParams));
  console.log('DEBUG: Token from search params:', searchParams.get('token'));

  const loadEventData = useCallback(async () => {
    console.log('DEBUG: Loading event data for eventId:', eventId);
    setIsLoading(true);
    const token = searchParams.get('token');
    const storageKey = `event_data_${eventId}`;

    if (!token) {
      console.error('DEBUG: No token found in search params');
      setMessage("Access token missing. This page cannot be accessed directly.");
      setIsLoading(false);
      setIsReady(false);
      return;
    }

    if (!eventId) {
      console.error('DEBUG: No eventId found in URL params');
      setMessage("Event ID is missing from the URL.");
      setIsLoading(false);
      setIsReady(false);
      return;
    }
    
    try {
      setMessage('Downloading fresh event data...');
      const apiUrl = `${API_URL}/api/tickets/event/${eventId}/valid-ids/?token=${token}`;
      console.log('DEBUG: Making API request to:', apiUrl);
      
      const response = await axios.get(apiUrl);
      console.log('DEBUG: API response:', response.data);
      
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
      console.error("DEBUG: API fetch failed:", error);
      console.warn("API fetch failed. Trying to load from offline storage.", error.response?.data?.error);
      
      const storedData = localStorage.getItem(storageKey);
      if (storedData) {
        try {
          const { eventName: storedEventName, validTicketIds: storedTicketIds } = JSON.parse(storedData);
          setValidEventTickets(new Set(storedTicketIds));
          setEventName(storedEventName);
          setMessage(`OFFLINE MODE: Ready to scan for ${storedEventName}`);
          setIsReady(true);
        } catch (parseError) {
          console.error('DEBUG: Error parsing stored data:', parseError);
          setMessage('Error loading stored data. Please refresh and try again.');
          setIsReady(false);
        }
      } else {
        const errorMessage = error.response?.data?.error || error.message || 'Could not load data.';
        setMessage(`Error: ${errorMessage} Please connect to the internet and refresh.`);
        setIsReady(false);
      }
    } finally {
      setIsLoading(false);
    }
  }, [eventId, searchParams]);

  useEffect(() => {
    console.log('DEBUG: useEffect triggered, calling loadEventData');
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

  // Show debug info at the top when loading
  if (isLoading) {
    return (
      <div className="scanner-container loading">
        <h2>Loading Event Data...</h2>
        <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#f0f0f0', fontSize: '12px' }}>
          <strong>Debug Info:</strong><br/>
          Event ID: {eventId || 'MISSING'}<br/>
          Token: {searchParams.get('token') || 'MISSING'}<br/>
          Current Path: {location.pathname}<br/>
          Full URL: {window.location.href}
        </div>
      </div>
    );
  }
  
  if (!isReady) {
    return (
      <div className="scanner-container error">
        <div className="result-panel">
          <p className="result-message">{message}</p>
          <button onClick={loadEventData} className="retry-btn">Retry Connection</button>
          <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#f0f0f0', fontSize: '12px' }}>
            <strong>Debug Info:</strong><br/>
            Event ID: {eventId || 'MISSING'}<br/>
            Token: {searchParams.get('token') || 'MISSING'}<br/>
            Current Path: {location.pathname}<br/>
            Full URL: {window.location.href}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`scanner-container ${status}`}>
      <div className="scanner-header">
        Scanning for: <strong>{eventName}</strong>
        <div style={{ fontSize: '10px', color: '#666' }}>
          Event ID: {eventId} | Token: {searchParams.get('token')?.substring(0, 8)}...
        </div>
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