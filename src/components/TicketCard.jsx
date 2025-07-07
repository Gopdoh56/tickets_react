// src/components/TicketCard.jsx

import React, { useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf'; // <-- 1. ADD THIS IMPORT
import './TicketCard.css'; // Your CSS file for this component

const API_URL = 'http://127.0.0.1:8000';

const TicketCard = ({ ticket }) => {
  // Create a ref that we will attach to the div we want to screenshot
  const ticketRef = useRef(null);
  const [isDownloading, setIsDownloading] = useState(false);

  if (!ticket) {
    return null;
  }

  // Helper function to construct image URL
  const getImageUrl = (imageUrl) => {
    if (!imageUrl) return 'https://via.placeholder.com/400x500?text=Event';
    if (imageUrl.startsWith('http')) {
      return imageUrl;
    }
    if (imageUrl.startsWith('/')) {
      return `${API_URL}${imageUrl}`;
    }
    return `${API_URL}/media/${imageUrl}`;
  };

  // Helper function for QR code URL
  const getQRCodeUrl = (qrCodeUrl) => {
    if (!qrCodeUrl) return null;
    if (qrCodeUrl.startsWith('http')) {
      return qrCodeUrl;
    }
    if (qrCodeUrl.startsWith('/')) {
      return `${API_URL}${qrCodeUrl}`;
    }
    return `${API_URL}/media/${qrCodeUrl}`;
  };

  const handleDownload = () => {
    if (!ticketRef.current) {
      console.error("Ticket element ref is not available.");
      alert("Could not download ticket. Please try again.");
      return;
    }

    setIsDownloading(true);

    toPng(ticketRef.current, { cacheBust: true, pixelRatio: 2 })
      .then((dataUrl) => {
        const link = document.createElement('a');
        link.download = `EventTicket-${ticket.event_title.replace(/ /g, '_')}-${ticket.ticket_id.substring(0, 8)}.png`;
        link.href = dataUrl;
        link.click();
        setIsDownloading(false);
      })
      .catch((err) => {
        console.error('Download failed:', err);
        alert("Sorry, we couldn't download the ticket image. This can happen if the event images are blocked. Please try right-clicking the ticket and using 'Save Image As'.");
        setIsDownloading(false);
      });
  };

  // --- 2. ADD THIS NEW FUNCTION FOR PDF DOWNLOAD ---
  const handleDownloadPdf = () => {
    if (!ticketRef.current) return;
    setIsDownloading(true);

    const ticketElement = ticketRef.current;
    
    toPng(ticketElement, { cacheBust: true, pixelRatio: 4 })
      .then((dataUrl) => {
        // Define the PDF dimensions. A standard landscape ticket size.
        // PDF units are in 'mm'. Let's use a 6x4 inch size.
        // 6 inches = 152.4 mm, 4 inches = 101.6 mm.
        const pdf = new jsPDF({
          orientation: 'landscape',
          unit: 'mm',
          format: [152.4, 101.6]
        });

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();

        pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`EventTicket-${ticket.event_title.replace(/ /g, '_')}.pdf`);
      })
      .catch((err) => {
        console.error('PDF download failed:', err);
        alert("Sorry, we couldn't generate the PDF ticket.");
      })
      .finally(() => {
        setIsDownloading(false);
      });
  };
  // --- END OF NEW FUNCTION ---

  // Debug log to check image URLs
  console.log('Ticket event image:', ticket.event_image_url);
  console.log('Ticket QR code:', ticket.qr_code_url);

  return (
    <div className="ticket-container">
      <div className="ticket-visual" ref={ticketRef}>
        <div className="ticket-left">
          <img 
            src={getImageUrl(ticket.event_image_url)} 
            alt={ticket.event_title} 
            className="event-image-background"
            crossOrigin="anonymous"
            onError={(e) => {
              console.error('Failed to load event image:', e.target.src);
              e.target.src = 'https://via.placeholder.com/400x500?text=Event';
            }}
          />
          <div className="event-details-overlay">
            <h2 className="event-title-on-image">{ticket.event_title}</h2>
            <p className="event-venue-on-image">{ticket.event_location}</p>
          </div>
        </div>
        <div className="ticket-right">
          <div className="ticket-header-right">
            <h3>{ticket.ticket_type}</h3>
            <p className="ticket-price">MWK {ticket.ticket_price}</p>
          </div>
          <div className="ticket-body-right">
            <p><strong>Ticket Holder:</strong> {ticket.buyer_name}</p>
            <p><strong>Date:</strong> {new Date(ticket.event_date).toLocaleString()}</p>
            <p><strong>Ticket ID:</strong> {ticket.ticket_id.substring(0, 13)}...</p>
          </div>
          <div className="ticket-qr-section">
            {ticket.qr_code_url ? (
              <img 
                src={getQRCodeUrl(ticket.qr_code_url)} 
                alt="Ticket QR Code" 
                className="qr-code-image"
                crossOrigin="anonymous"
                onError={(e) => {
                  console.error('Failed to load QR code:', e.target.src);
                  e.target.style.display = 'none';
                }}
              />
            ) : (
              <div className="qr-placeholder">QR Code Generating...</div>
            )}
          </div>
        </div>
      </div>
      
      <div className="ticket-actions">
        <button 
          onClick={handleDownload}
          disabled={isDownloading || !ticket.qr_code_url}
          className="download-button"
        >
          {isDownloading ? 'Working...' : 'Download Image'}
        </button>
        
        {/* --- 3. ADD THE NEW PDF DOWNLOAD BUTTON --- */}
        <button 
          onClick={handleDownloadPdf}
          disabled={isDownloading || !ticket.qr_code_url}
          className="download-button pdf" // You can add a 'pdf' class for styling
        >
          {isDownloading ? 'Working...' : 'Download PDF'}
        </button>
        {/* --- END OF NEW BUTTON --- */}
      </div>
    </div>
  );
};

export default TicketCard;