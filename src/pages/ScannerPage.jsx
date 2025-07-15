// src/pages/ScannerPage.jsx

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Html5QrcodeScanner } from 'html5-qrcode';
import axios from 'axios';
import './ScannerPage.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const ScannerPage = () => {
  const { eventId } = useParams();
  const [searchParams] = useSearchParams();
  const scannerRef = useRef(null);
  const html5QrcodeScanner = useRef(null);
  
  const [eventName, setEventName] = useState('');
  const [lastScanned, setLastScanned] = useState(null);
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('Point camera at a ticket QR code.');
  const [scannedCodes, setScannedCodes] = useState(new Set());
  const [validEventTickets, setValidEventTickets] = useState(new Set());
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [debugMode, setDebugMode] = useState(false);
  const [lastRawScan, setLastRawScan] = useState('');

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
      const apiUrl = `${API_URL}/api/tickets/valid-ids/${eventId}/?token=${token}`;
      console.log('Fetching from:', apiUrl);
      
      const response = await axios.get(apiUrl);
      const { event_name, valid_ticket_ids } = response.data;
      const newValidTickets = new Set(valid_ticket_ids);
      
      localStorage.setItem(storageKey, JSON.stringify({
        eventName: event_name,
        validTicketIds: valid_ticket_ids,
      }));
      
      setValidEventTickets(newValidTickets);
      setEventName(event_name);
      setMessage(`Ready to scan for: ${event_name}`);
      setIsReady(true);

    } catch (error) {
      console.error("API fetch failed:", error);
      
      // Try to use stored data
      const storedData = localStorage.getItem(storageKey);
      if (storedData) {
        try {
          const { eventName: storedEventName, validTicketIds: storedTicketIds } = JSON.parse(storedData);
          setValidEventTickets(new Set(storedTicketIds));
          setEventName(storedEventName);
          setMessage(`OFFLINE MODE: Ready to scan for ${storedEventName}`);
          setIsReady(true);
        } catch (parseError) {
          console.error('Error parsing stored data:', parseError);
          setMessage('Error loading stored data. Please refresh and try again.');
          setIsReady(false);
        }
      } else {
        let errorMessage = 'Could not load data.';
        if (error.response?.status === 401) {
          errorMessage = 'Invalid token. Please get a new access link.';
        } else if (error.response?.status === 404) {
          errorMessage = 'Event not found. Please check the event ID.';
        }
        setMessage(`Error: ${errorMessage}`);
        setIsReady(false);
      }
    } finally {
      setIsLoading(false);
    }
  }, [eventId, searchParams]);

  // Simplified ticket ID parsing
  const parseTicketId = (qrContent) => {
    setLastRawScan(qrContent);
    console.log('Raw QR Content:', qrContent);
    
    // Clean the content
    const cleanContent = qrContent.trim();
    
    // Try JSON parsing first
    try {
      const jsonData = JSON.parse(cleanContent);
      if (jsonData.ticketId) return jsonData.ticketId;
      if (jsonData.id) return jsonData.id;
      if (jsonData.ticket_id) return jsonData.ticket_id;
    } catch (e) {
      // Not JSON, continue with other methods
    }
    
    // Check for TicketID: prefix
    if (cleanContent.includes('TicketID:')) {
      const match = cleanContent.match(/TicketID:\s*([^\s\n]+)/);
      if (match) return match[1];
    }
    
    // Check for simple alphanumeric ID (most common case)
    const lines = cleanContent.split('\n').map(line => line.trim()).filter(line => line);
    
    for (const line of lines) {
      // Skip empty lines and common text
      if (!line || line.toLowerCase().includes('event') || line.toLowerCase().includes('ticket')) {
        continue;
      }
      
      // Look for UUID pattern
      if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(line)) {
        return line;
      }
      
      // Look for alphanumeric ID (at least 6 characters)
      if (/^[A-Za-z0-9]{6,}$/.test(line)) {
        return line;
      }
    }
    
    // If single line and looks like an ID, use it
    if (lines.length === 1 && lines[0].length > 5) {
      return lines[0];
    }
    
    return null;
  };

  const handleScanResult = (decodedText, decodedResult) => {
    console.log('Scan result:', decodedText);
    
    // Prevent duplicate scans
    if (decodedText === lastScanned) return;
    setLastScanned(decodedText);
    
    let ticketId;
    try {
      ticketId = parseTicketId(decodedText);
      
      if (!ticketId) {
        throw new Error("Could not extract ticket ID from QR code");
      }
    } catch (error) {
      console.error('QR parsing error:', error);
      setStatus('error');
      setMessage(`INVALID QR CODE: Could not parse ticket ID. ${debugMode ? 'Raw: ' + decodedText.substring(0, 50) + '...' : ''}`);
      setTimeout(() => {
        setStatus('idle');
        setMessage(`Ready to scan for: ${eventName}`);
        setLastScanned(null);
      }, 3500);
      return;
    }
    
    console.log('Parsed ticket ID:', ticketId);
    console.log('Is valid?', validEventTickets.has(ticketId));
    
    // Check ticket validity
    if (scannedCodes.has(ticketId)) {
      setStatus('warning');
      setMessage(`ALREADY SCANNED: Ticket ${ticketId.substring(0,8)}... has already been checked in.`);
    } else if (validEventTickets.has(ticketId)) {
      setStatus('success');
      setMessage(`SUCCESS: Welcome! Ticket ${ticketId.substring(0,8)}... is valid.`);
      setScannedCodes(prev => new Set(prev.add(ticketId)));
    } else {
      setStatus('error');
      setMessage(`INVALID TICKET: Code ${ticketId.substring(0,8)}... is not for this event.`);
    }
    
    // Reset after 3.5 seconds
    setTimeout(() => {
      setStatus('idle');
      setMessage(`Ready to scan for: ${eventName}`);
      setLastScanned(null);
    }, 3500);
  };

  const handleScanError = (error) => {
    // Only log actual errors, not routine scan attempts
    if (error.includes('NotFoundError') || error.includes('No QR code found')) {
      return; // Ignore these common non-errors
    }
    console.warn('QR Scanner Error:', error);
  };

  // Initialize scanner
  useEffect(() => {
    if (!isReady) return;
    
    const config = {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      aspectRatio: 1.0,
      disableFlip: false,
      facingMode: "environment"
    };
    
    html5QrcodeScanner.current = new Html5QrcodeScanner(
      "qr-reader",
      config,
      false
    );
    
    html5QrcodeScanner.current.render(handleScanResult, handleScanError);
    
    // Cleanup function
    return () => {
      if (html5QrcodeScanner.current) {
        html5QrcodeScanner.current.clear().catch(console.error);
      }
    };
  }, [isReady, eventName]);

  useEffect(() => {
    loadEventData();
  }, [loadEventData]);

  if (isLoading) {
    return (
      <div className="scanner-container loading">
        <div className="result-panel">
          <h2>Loading Event Data...</h2>
        </div>
      </div>
    );
  }
  
  if (!isReady) {
    return (
      <div className="scanner-container error">
        <div className="result-panel">
          <p className="result-message">{message}</p>
          <button onClick={loadEventData} className="retry-btn">
            Retry Connection
          </button>
          <div style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
            <p>Debug Info:</p>
            <p>Event ID: {eventId}</p>
            <p>API URL: {API_URL}</p>
            <p>Token: {searchParams.get('token')?.substring(0, 8)}...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`scanner-container ${status}`}>
      <div className="scanner-header">
        Scanning for: <strong>{eventName}</strong>
        <button 
          onClick={() => setDebugMode(!debugMode)}
          style={{ 
            marginLeft: '10px', 
            padding: '2px 6px', 
            fontSize: '10px',
            backgroundColor: debugMode ? '#007bff' : '#ccc',
            color: debugMode ? 'white' : 'black',
            border: 'none',
            borderRadius: '3px',
            cursor: 'pointer'
          }}
        >
          {debugMode ? 'Debug ON' : 'Debug OFF'}
        </button>
      </div>
      
      <div className="scanner-viewfinder">
        <div id="qr-reader" style={{ width: '100%' }}></div>
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
        {debugMode && lastRawScan && (
          <div style={{ 
            marginTop: '10px', 
            padding: '10px', 
            backgroundColor: '#f5f5f5', 
            borderRadius: '5px',
            fontSize: '12px',
            wordBreak: 'break-all',
            color: '#333'
          }}>
            <strong>Last Raw Scan:</strong><br />
            {lastRawScan}
          </div>
        )}
      </div>
    </div>
  );
};

export default ScannerPage;