// src/App.jsx

import React from 'react';
import { Routes, Route } from 'react-router-dom';

// Import all your page components
import HomePage from './pages/HomePage';
import EventDetailPage from './pages/EventDetailPage'; 
import PaymentSuccessPage from './pages/PaymentSuccessPage';
import TicketRecovery from './pages/TicketRecovery';
import MyTicketsPage from './pages/MyTicketsPage';
import AdminEventUpload from './pages/AdminEventUpload';
import ScannerPage from './pages/ScannerPage'; // <-- Make sure this is imported

function App() {
  return (
    <Routes>
      {/* Your existing routes */}
      <Route path="/" element={<HomePage />} />
      <Route path="/events/:id" element={<EventDetailPage />} /> 
      <Route path="/payment-success" element={<PaymentSuccessPage />} />
      <Route path="/recover-tickets" element={<TicketRecovery />} />
      <Route path="/my-tickets" element={<MyTicketsPage />} />
      <Route path="/admin/1234upload" element={<AdminEventUpload />} />
      
      {/* --- THIS IS THE MISSING LINE YOU NEED TO ADD --- */}
      {/* The ':eventId' part tells the router to match any value here */}
      <Route path="/scanner/:eventId" element={<ScannerPage />} />
      
      {/* Optional: A catch-all route for 404 Not Found pages */}
      <Route path="*" element={<h1>404: Page Not Found</h1>} />
    </Routes>
  );    
}

export default App;