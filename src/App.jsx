import React from 'react';
import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import EventDetailPage from './pages/EventDetailPage'; 
import PaymentSuccessPage from './pages/PaymentSuccessPage';
import TicketRecovery from './pages/TicketRecovery'; // <-- 1. IMPORT THE NEW 
import MyTicketsPage from './pages/MyTicketsPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      {/* The :id is a dynamic parameter. It will match /events/1, /events/2, etc. */}
      <Route path="/events/:id" element={<EventDetailPage />} /> 
      <Route path="/payment-success" element={<PaymentSuccessPage />} /> {/* Change this */}
      <Route path="/recover-tickets" element={<TicketRecovery />} />
      <Route path="/my-tickets" element={<MyTicketsPage />} />
    



    </Routes>
  );    
}

export default App;