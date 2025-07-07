// This is the base URL of your Django backend
const API_BASE_URL = 'http://127.0.0.1:8000';

/**
 * A reusable fetch function with error handling.
 * @param {string} endpoint - The API endpoint to call (e.g., '/api/events/')
 * @param {object} options - The options for the fetch call (method, headers, body)
 * @returns {Promise<any>} - The JSON response from the API
 */
async function fetchFromAPI(endpoint, options = {}) {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);

    if (!response.ok) {
      // If the server responds with an error, try to parse the error message
      const errorData = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    // If the response is successful but has no content (like for a DELETE request)
    if (response.status === 204) {
      return null;
    }

    return await response.json();

  } catch (error) {
    console.error(`API call to ${endpoint} failed:`, error);
    // Re-throw the error so the component that called this function can handle it
    throw error;
  }
}

// --- Define specific API functions for your app ---

// Function to get all events
export const getEvents = () => {
  return fetchFromAPI('/api/events/');
};

// Function to get a single event by its ID
export const getEventById = (id) => {
  return fetchFromAPI(`/api/events/${id}/`);
};

// Add more functions as you need them...
// export const buyTicket = (ticketData) => {
//   return fetchFromAPI('/api/tickets/buy/', {
//     method: 'POST',
//     headers: { 'Content-Type': 'application/json' },
//     body: JSON.stringify(ticketData),
//   });
// };