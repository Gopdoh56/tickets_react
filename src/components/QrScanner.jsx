// src/components/QrScanner.jsx

import React, { useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

const QrScanner = ({ onScanSuccess, onScanError, config }) => {
  const scannerRef = useRef(null);

  useEffect(() => {
    // Only initialize the scanner if the ref is available and it hasn't been initialized
    if (scannerRef.current && !scannerRef.current.scanner) {
      // Default config can be overridden by props
      const finalConfig = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        rememberLastUsedCamera: true,
        ...config, // Merge any config passed in as props
      };

      const html5QrcodeScanner = new Html5QrcodeScanner(
        "qr-reader", // The ID of the div below
        finalConfig,
        /* verbose= */ false
      );

      // The success and error callbacks are passed in from the parent
      html5QrcodeScanner.render(onScanSuccess, onScanError);
      
      // Store the scanner instance on the ref so we can clear it on unmount
      scannerRef.current.scanner = html5QrcodeScanner;
    }

    // Cleanup function to stop the scanner when the component is removed
    return () => {
      if (scannerRef.current && scannerRef.current.scanner) {
        // Check if clearing is supported before calling
        if (scannerRef.current.scanner.getState() === 2) { // 2 is SCANNING state
            scannerRef.current.scanner.clear().catch(error => {
                console.error("Failed to clear html5QrcodeScanner.", error);
            });
        }
        scannerRef.current.scanner = null;
      }
    };
  }, [onScanSuccess, onScanError, config]);

  // The ref is attached to this div, which is where the scanner will be rendered.
  return <div id="qr-reader" ref={scannerRef} />;
};

export default QrScanner;