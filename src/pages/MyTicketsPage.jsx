import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSearchParams } from 'react-router-dom';
import TicketCard from '../components/TicketCard';
import './MyTicketsPage.css';

const MyTicketsPage = () => {
    const [searchParams] = useSearchParams();
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

    useEffect(() => {
        const email = searchParams.get('email');
        if (!email) {
            setError("No email provided in the link. Please use the link from your recovery email.");
            setLoading(false);
            return;
        }

        const fetchTickets = async () => {
            try {
                const response = await axios.get(`${API_URL}/api/payments/user-tickets/?email=${email}`);
                setTickets(response.data.tickets || []);
            } catch (err) {
                setError("Could not find any tickets for this email address.");
            } finally {
                setLoading(false);
            }
        };

        fetchTickets();
    }, [searchParams]);

    if (loading) return <div>Loading your tickets...</div>;
    if (error) return <div style={{color: 'red'}}>{error}</div>;

    return (
        <div className="my-tickets-container">
            <h1>Your Purchased Tickets</h1>
            <p>Here are all the tickets we found for this email address. You can download them as images.</p>
            <div className="tickets-grid-display">
                {tickets.length > 0 ? (
                    tickets.map(ticket => <TicketCard key={ticket.ticket_id} ticket={ticket} />)
                ) : (
                    <p>No tickets found.</p>
                )}
            </div>
        </div>
    );
};

export default MyTicketsPage;