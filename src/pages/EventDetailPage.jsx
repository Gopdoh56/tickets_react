import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

import Header from '../components/Header';
import Footer from '../components/Footer';
import EventDetailDisplay from '../components/EventDetailDisplay';
import TicketSidebar from '../components/TicketSidebar';
import './EventDetailPage.css';
// CORRECT - This works for both local development and live deployment
const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

const EventDetailPage = () => {
  const { id } = useParams(); // Gets the event ID from the URL
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/events/${id}/`);
        setEvent(response.data);
      } catch (err) {
        setError("Could not find this event.");
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [id]); // This effect re-runs if the ID in the URL changes

  if (loading) return <div className="page-status">Loading...</div>;
  if (error) return <div className="page-status error">{error}</div>;

  return (
    <div>
      <Header />
      <main className="container page-layout">
        <EventDetailDisplay event={event} />
        <TicketSidebar event={event} />
      </main>
      <Footer />
    </div>
  );
};

export default EventDetailPage;