import React, { useState, useMemo } from 'react';
import axios from 'axios';
import './TicketSidebar.css';

const TicketSidebar = ({ event }) => {
  // --- THIS IS THE FIRST CHANGE ---
  // This makes your component work in both local development and on Vercel
  // by reading the environment variable provided by Vercel.
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
  // --- END OF CHANGE ---

  // State to hold quantities for each ticket type
  const [quantities, setQuantities] = useState({});
  // State for user's contact information
  const [userInfo, setUserInfo] = useState({ name: '', email: '', whatsapp: '' });
  // State for loading and error messages
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Handler to change quantity for a specific ticket type
  const handleQuantityChange = (ticketTypeId, change) => {
    const currentQuantity = quantities[ticketTypeId] || 0;
    const newQuantity = currentQuantity + change;
    const ticketType = event.ticket_types.find(t => t.id === ticketTypeId);
    if (!ticketType) return;

    if (newQuantity >= 0 && newQuantity <= ticketType.available_quantity) {
      setQuantities(prev => ({ ...prev, [ticketTypeId]: newQuantity }));
    }
  };

  // Handler for the user info input fields
  const handleUserInfoChange = (e) => {
    const { name, value } = e.target;
    setUserInfo(prev => ({ ...prev, [name]: value }));
  };

  // Calculate total price and total items using useMemo for performance
  const { totalItems, totalPrice } = useMemo(() => {
    let items = 0;
    let price = 0;
    for (const ticketTypeId in quantities) {
      const quantity = quantities[ticketTypeId];
      if (quantity > 0) {
        const ticketType = event.ticket_types.find(t => t.id === parseInt(ticketTypeId));
        if (ticketType) {
          items += quantity;
          price += quantity * parseFloat(ticketType.price);
        }
      }
    }
    return { totalItems: items, totalPrice: price };
  }, [quantities, event.ticket_types]);

  // Define your service fee
  const serviceFee = 500.00;

  // The purchase handler now uses the dynamic API_URL
  const handlePurchase = async () => {
    if (totalItems === 0) {
      alert("Please select at least one ticket.");
      return;
    }
    if (!userInfo.name || !userInfo.email || !userInfo.whatsapp) {
      setError("Please fill in your name, email, and WhatsApp number.");
      return;
    }

    setIsLoading(true);
    setError(null);

    const purchaseDetails = {
      items: Object.entries(quantities)
        .filter(([_, quantity]) => quantity > 0)
        .map(([ticketTypeId, quantity]) => ({
          ticket_type_id: parseInt(ticketTypeId),
          quantity: quantity,
        })),
      user_info: userInfo,
    };

    try {
      localStorage.setItem('purchaser_email', userInfo.email);

      // --- THIS IS THE SECOND CHANGE ---
      // The hardcoded 'localhost' URL has been replaced with the API_URL variable.
      const response = await axios.post(
        `${API_URL}/api/payments/initiate-payment/`, 
        purchaseDetails
      );
      // --- END OF CHANGE ---
      
      const { payment_url } = response.data;

      if (payment_url) {
        window.location.href = payment_url;
      } else {
        setError('Could not retrieve payment link. Please try again.');
      }

    } catch (err) {
      const errorMessage = err.response?.data?.error || 'An unexpected error occurred during payment initiation.';
      setError(errorMessage);
      console.error("Purchase error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Determine if all ticket types are sold out
  const isSoldOut = event.ticket_types.every(t => t.available_quantity === 0);

  return (
    <div className="ticket-sidebar">
      <div className="ticket-card">
        <div className="ticket-header">
          <h3 className="ticket-title">Get Your Tickets</h3>
          <div className="ticket-price">
            <span className="price-label">Starting at</span>
            <span className="price-amount">K{Number(event.starting_price).toFixed(2)}</span>
          </div>
        </div>

        {isSoldOut ? (
          <div className="sold-out">
            <div className="sold-out-badge">SOLD OUT</div>
            <p className="sold-out-text">This event is currently sold out.</p>
          </div>
        ) : (
          <div className="ticket-purchase">
            <div className="ticket-type-list">
              {event.ticket_types && event.ticket_types.map(ticketType => (
                <div key={ticketType.id} className="ticket-type-item">
                  <div className="ticket-type-info">
                    <span className="ticket-type-name">{ticketType.name}</span>
                    <span className="ticket-type-price">K{Number(ticketType.price).toFixed(2)}</span>
                  </div>
                  {ticketType.available_quantity > 0 ? (
                    <div className="quantity-controls">
                      <button 
                        className="quantity-btn"
                        onClick={() => handleQuantityChange(ticketType.id, -1)}
                        disabled={!quantities[ticketType.id] || quantities[ticketType.id] <= 0}
                      >
                        -
                      </button>
                      <span className="quantity-display">{quantities[ticketType.id] || 0}</span>
                      <button 
                        className="quantity-btn"
                        onClick={() => handleQuantityChange(ticketType.id, 1)}
                        disabled={(quantities[ticketType.id] || 0) >= ticketType.available_quantity}
                      >
                        +
                      </button>
                    </div>
                  ) : (
                    <span className="ticket-type-soldout">Sold Out</span>
                  )}
                </div>
              ))}
            </div>

            {totalItems > 0 && (
              <>
                <div className="user-info-section">
                  <h4 className="user-info-title">Your Details</h4>
                  <input
                    type="text"
                    name="name"
                    placeholder="Full Name"
                    value={userInfo.name}
                    onChange={handleUserInfoChange}
                    className="user-input"
                    required
                  />
                  <input
                    type="email"
                    name="email"
                    placeholder="Email Address"
                    value={userInfo.email}
                    onChange={handleUserInfoChange}
                    className="user-input"
                    required
                  />
                  <input
                    type="tel"
                    name="whatsapp"
                    placeholder="WhatsApp Number (e.g., +265...)"
                    value={userInfo.whatsapp}
                    onChange={handleUserInfoChange}
                    className="user-input"
                    required
                  />
                </div>

                <div className="total-section">
                  <div className="total-row">
                    <span>Subtotal ({totalItems} {totalItems === 1 ? 'item' : 'items'}):</span>
                    <span>K{totalPrice.toFixed(2)}</span>
                  </div>
                  <div className="total-row fees">
                    <span>Service Fee:</span>
                    <span>K{serviceFee.toFixed(2)}</span>
                  </div>
                  <div className="total-row total">
                    <span>Total:</span>
                    <span>K{(totalPrice + serviceFee).toFixed(2)}</span>
                  </div>
                </div>
              </>
            )}

            {error && <p className="error-message">{error}</p>}

            <button 
              className="purchase-btn"
              onClick={handlePurchase}
              disabled={totalItems === 0 || isLoading}
            >
              {isLoading ? 'Processing...' : 'BUY!'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TicketSidebar;