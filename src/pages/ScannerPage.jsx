// src/pages/ScannerPage.jsx

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode';
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
  const [debugMode, setDebugMode] = useState(false);
  const [lastRawScan, setLastRawScan] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  
  const scannerRef = useRef(null);
  const html5QrcodeScanner = useRef(null);

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
      console.log('Attempting to fetch from:', apiUrl);
      console.log('Event ID:', eventId);
      console.log('Token:', token);
      
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
      
      // More detailed error logging
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
        console.error('Response headers:', error.response.headers);
      } else if (error.request) {
        console.error('Request made but no response:', error.request);
      } else {
        console.error('Error setting up request:', error.message);
      }
      
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
        
        if (error.response?.status === 404) {
          errorMessage = 'API endpoint not found. Please check your backend server.';
        } else if (error.response?.status === 401) {
          errorMessage = 'Invalid token. Please get a new access link.';
        } else if (error.response?.status === 403) {
          errorMessage = 'Access denied. Please check your permissions.';
        } else if (error.code === 'ECONNREFUSED' || error.message.includes('Network Error')) {
          errorMessage = 'Cannot connect to server. Please check if the backend is running.';
        } else if (error.response?.data?.error) {
          errorMessage = error.response.data.error;
        }
        
        setMessage(`Error: ${errorMessage} Please connect to the internet and refresh.`);
        setIsReady(false);
      }
    } finally {
      setIsLoading(false);
    }
  }, [eventId, searchParams]);

  // Enhanced parsing function with better QR code support
  const parseTicketId = (qrContent) => {
    // Store raw scan for debugging
    setLastRawScan(qrContent);
    
    console.log('Raw QR Content:', qrContent);
    console.log('QR Content type:', typeof qrContent);
    console.log('QR Content length:', qrContent.length);
    
    // Method 1: Direct ticket ID (most common for simple QR codes)
    const trimmedContent = qrContent.trim();
    if (trimmedContent && !trimmedContent.includes('\n') && !trimmedContent.includes(' ')) {
      console.log('Treating entire content as ticket ID:', trimmedContent);
      return trimmedContent;
    }
    
    // Method 2: Look for TicketID: prefix
    const lines = qrContent.split('\n');
    const idLine = lines.find(line => line.startsWith('TicketID:'));
    if (idLine) {
      const ticketId = idLine.split(':')[1]?.trim();
      console.log('Found TicketID with prefix:', ticketId);
      return ticketId;
    }
    
    // Method 3: Check for common QR code patterns
    const patterns = [
      /ticket[_-]?id[:\s=]+([^\s\n]+)/i,
      /id[:\s=]+([^\s\n]+)/i,
      /([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i, // UUID
      /^([A-Za-z0-9]{8,})$/m, // Alphanumeric ID on its own line
    ];
    
    for (const pattern of patterns) {
      const match = qrContent.match(pattern);
      if (match) {
        console.log('Found ticket ID with pattern:', pattern, 'Result:', match[1] || match[0]);
        return match[1] || match[0];
      }
    }
    
    // Method 4: Try to parse as JSON
    try {
      const jsonData = JSON.parse(qrContent);
      if (jsonData.ticketId) {
        console.log('Found ticket ID in JSON:', jsonData.ticketId);
        return jsonData.ticketId;
      }
      if (jsonData.id) {
        console.log('Found ID in JSON:', jsonData.id);
        return jsonData.id;
      }
      if (jsonData.ticket_id) {
        console.log('Found ticket_id in JSON:', jsonData.ticket_id);
        return jsonData.ticket_id;
      }
    } catch (e) {
      // Not JSON, continue
    }
    
    // Method 5: URL parsing (if QR contains a URL with ID)
    try {
      const url = new URL(qrContent);
      const urlParams = new URLSearchParams(url.search);
      const ticketId = urlParams.get('ticket_id') || urlParams.get('id') || urlParams.get('ticketId');
      if (ticketId) {
        console.log('Found ticket ID in URL:', ticketId);
        return ticketId;
      }
    } catch (e) {
      // Not a valid URL, continue
    }
    
    return null;
  };

  const handleScanResult = useCallback((decodedText, decodedResult) => {
    console.log('Html5QrCode scan result:', decodedText);
    console.log('Decoded result object:', decodedResult);
    
    let scannedId;
    try {
      scannedId = parseTicketId(decodedText);
      
      if (!scannedId) {
        throw new Error("Could not extract ticket ID from QR code");
      }
    } catch (e) {
      console.error('QR parsing error:', e);
      setStatus('error');
      setMessage(`INVALID QR CODE: Could not parse ticket ID. ${debugMode ? 'Raw: ' + decodedText.substring(0, 50) + '...' : ''}`);
      setTimeout(() => {
        setStatus('idle');
        setMessage(`Ready to scan for: ${eventName}`);
      }, 3500);
      return;
    }
    
    if (scannedId === lastScanned) return;
    setLastScanned(scannedId);
    
    console.log('Parsed ticket ID:', scannedId);
    console.log('Valid tickets:', Array.from(validEventTickets));
    console.log('Is valid?', validEventTickets.has(scannedId));
    
    if (scannedCodes.has(scannedId)) {
      setStatus('warning');
      setMessage(`ALREADY SCANNED: Ticket ${scannedId.substring(0,8)}... has already been checked in.`);
    } else if (validEventTickets.has(scannedId)) {
      setStatus('success');
      setMessage(`SUCCESS: Welcome! Ticket ${scannedId.substring(0,8)}... is valid.`);
      setScannedCodes(prev => new Set(prev.add(scannedId)));
    } else {
      setStatus('error');
      setMessage(`INVALID TICKET: Code ${scannedId.substring(0,8)}... is not for this event.`);
    }
    
    setTimeout(() => {
      setStatus('idle');
      setLastScanned(null);
      setMessage(`Ready to scan for: ${eventName}`);
    }, 3500);
  }, [lastScanned, scannedCodes, validEventTickets, eventName, debugMode]);

  const handleScanError = useCallback((error) => {
    console.error('QR Scanner Error:', error);
    // Don't show error for every scan attempt failure
    if (error.includes('QR code parse error')) {
      // This is normal when camera is moving or no QR code is visible
      return;
    }
    setMessage('Scanner error: ' + error);
    setStatus('error');
  }, []);

  const initializeScanner = useCallback(() => {
    if (html5QrcodeScanner.current) {
      html5QrcodeScanner.current.clear();
    }

    const config = {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      aspectRatio: 1.0,
      disableFlip: false,
      supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
      formatsToSupport: [
        // Support common QR code formats
        'QR_CODE',
        'DATA_MATRIX',
        'AZTEC',
        'CODE_128',
        'CODE_39',
        'CODE_93',
        'CODABAR',
        'EAN_13',
        'EAN_8',
        'UPC_A',
        'UPC_E'
      ],
      showTorchButtonIfSupported: true,
      showZoomSliderIfSupported: true,
      defaultZoomValueIfSupported: 1,
    };

    html5QrcodeScanner.current = new Html5QrcodeScanner(
      "qr-reader",
      config,
      /* verbose= */ false
    );

    html5QrcodeScanner.current.render(handleScanResult, handleScanError);
    setIsScanning(true);
  }, [handleScanResult, handleScanError]);

  const stopScanner = useCallback(() => {
    if (html5QrcodeScanner.current) {
      html5QrcodeScanner.current.clear().catch(console.error);
      html5QrcodeScanner.current = null;
    }
    setIsScanning(false);
  }, []);

  useEffect(() => {
    loadEventData();
  }, [loadEventData]);

  useEffect(() => {
    if (isReady && !isScanning) {
      initializeScanner();
    }

    return () => {
      stopScanner();
    };
  }, [isReady, initializeScanner, stopScanner, isScanning]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, [stopScanner]);

  if (isLoading) {
    return <div className="scanner-container loading"><h2>Loading Event Data...</h2></div>;
  }
  
  if (!isReady) {
    return (
      <div className="scanner-container error">
        <div className="result-panel">
          <p className="result-message">{message}</p>
          <button onClick={loadEventData} className="retry-btn">Retry Connection</button>
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
            borderRadius: '3px'
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
            wordBreak: 'break-all'
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