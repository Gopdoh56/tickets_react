// src/components/TicketCard.jsx

import React, { useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';
import './TicketCard.css';

const TicketCard = ({ ticket }) => {
  const ticketRef = useRef(null);
  const [isDownloading, setIsDownloading] = useState(false);

  if (!ticket) {
    return null;
  }

  // Helper functions are no longer needed. The backend provides complete URLs.

  const handleDownloadImage = () => {
    if (!ticketRef.current) return;
    setIsDownloading(true);

    toPng(ticketRef.current, { cacheBust: true, pixelRatio: 2.5, backgroundColor: 'white' })
      .then((dataUrl) => {
        const link = document.createElement('a');
        link.download = `Ticket-${ticket.event_title.replace(/ /g, '_')}.png`;
        link.href = dataUrl;
        link.click();
      })
      .catch((err) => {
        console.error('Image download failed:', err);
        alert("Sorry, we couldn't download the ticket image.");
      })
      .finally(() => {
        setIsDownloading(false);
      });
  };

  const handleDownloadPdf = () => {
    if (!ticketRef.current) return;
    setIsDownloading(true);

    toPng(ticketRef.current, { cacheBust: true, pixelRatio: 4, backgroundColor: 'white' })
      .then((dataUrl) => {
        const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a7' });
        pdf.addImage(dataUrl, 'PNG', 0, 0, pdf.internal.pageSize.getWidth(), pdf.internal.pageSize.getHeight());
        pdf.save(`Ticket-${ticket.event_title.replace(/ /g, '_')}.pdf`);
      })
      .catch((err) => {
        console.error('PDF download failed:', err);
        alert("Sorry, we couldn't generate the PDF ticket.");
      })
      .finally(() => {
        setIsDownloading(false);
      });
  };

  return (
    <div className="ticket-container">
      <div className="ticket-visual" ref={ticketRef}>
        <div className="ticket-left">
          <img 
            // --- FIX: Use the URL directly ---
            src={ticket.event_image_url || 'https://via.placeholder.com/400x500?text=Event'} 
            alt={ticket.event_title} 
            className="event-image-background"
            crossOrigin="anonymous"
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
                // --- FIX: Use the Data URL directly ---
                src={ticket.qr_code_url} 
                alt="Ticket QR Code" 
                className="qr-code-image"
              />
            ) : (
              <div className="qr-placeholder">QR Not Available</div>
            )}
          </div>
        </div>
      </div>
      
      <div className="ticket-actions">
        <button 
          onClick={handleDownloadImage}
          disabled={isDownloading || !ticket.qr_code_url}
          className="download-button"
        >
          {isDownloading ? 'Working...' : 'Download Image'}
        </button>
        <button 
          onClick={handleDownloadPdf}
          disabled={isDownloading || !ticket.qr_code_url}
          className="download-button pdf"
        >
          {isDownloading ? 'Working...' : 'Download PDF'}
        </button>
      </div>
    </div>
  );
};

export default TicketCard;