// src/components/QrScanner.jsx

import React, { useEffect } from 'react';
import { Html5Qrcode } from 'html5-qrcode'; // <-- Import the core class directly

const QrScanner = ({ onScanSuccess, onScanError }) => {
  useEffect(() => {
    let html5QrCode; // Variable to hold the scanner instance

    const startScanner = async () => {
      try {
        // Create a new instance of the scanner
        html5QrCode = new Html5Qrcode("qr-reader"); // The ID of the div element
        
        // Configuration for the scanner
        const config = {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        };
        
        // Start the scanner. This will request camera permissions automatically.
        // We pass the config and the callback functions.
        await html5QrCode.start(
          { facingMode: "environment" }, // Use the rear camera
          config,
          onScanSuccess,
          onScanError
        );
      } catch (err) {
        console.error("Failed to start html5-qrcode scanner", err);
        // You could pass this error up to the parent component if needed
        // onScanError(err);
      }
    };

    startScanner();

    // Cleanup function: This is crucial to stop the camera when the component unmounts.
    return () => {
      if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop().then(() => {
          console.log("QR Code scanning stopped successfully.");
        }).catch(err => {
          console.error("Failed to stop QR Code scanner.", err);
        });
      }
    };
  }, [onScanSuccess, onScanError]);

  // This div is the container where the camera feed will be rendered.
  // We will style its children with CSS to hide the library's default UI.
  return <div id="qr-reader" style={{ width: '100%', border: 'none' }} />;
};

export default QrScanner;