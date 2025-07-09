// src/pages/AdminEventUpload.jsx

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';

// --- HARDCODED SETTINGS FOR DIRECT TESTING ---
// This is your live Django backend URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';


// --- Get these from your Supabase Project -> API Settings ---
const SUPABASE_URL = 'https://yxbnargvpphqdhbmurnm.supabase.co'; 
// This is the PUBLIC anon key. It is safe to have this in your frontend code.
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4Ym5hcmd2cHBocWRoYm11cm5tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwNDIwOTYsImV4cCI6MjA2NzYxODA5Nn0.MfgT24wGBAspNOnDOjix1Kg2oW9mCWg2tjoz7aFN_EE'; 

// Create the Supabase client instance
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const AdminEventUpload = () => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] =useState(false);
  const [message, setMessage] = useState('');
  const [eventId, setEventId] = useState(''); // State to hold the event ID input

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file || !eventId) {
      setMessage('Please select a file and enter an Event ID.');
      return;
    }

    setUploading(true);
    setMessage(`Uploading image for Event ID: ${eventId}...`);

    try {
      // 1. Prepare a unique file name to avoid overwrites
      const fileExt = file.name.split('.').pop();
      const fileName = `event_${eventId}_${Date.now()}.${fileExt}`;
      const bucketName = 'event-images'; // The bucket you created in Supabase

      // 2. Upload the file directly to your Supabase Storage bucket
      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(fileName, file);

      if (uploadError) {
        throw uploadError; // If upload fails, stop here
      }

      // 3. Get the public URL of the file you just uploaded
      const { data } = supabase.storage
        .from(bucketName)
        .getPublicUrl(fileName);

      const imageUrl = data.publicUrl;
      setMessage('Image uploaded to Supabase! Updating Django backend...');
      console.log('Supabase Image URL:', imageUrl);

      // 4. Send this public URL to your Django backend to save it
      await axios.post(`${API_URL}/api/events/${eventId}/update-image/`, {
        image_url: imageUrl,
      });

      setMessage(`Success! Event ${eventId} image has been updated.`);
      
    } catch (error) {
      console.error('Upload process failed:', error);
      setMessage(`Error: ${error.message || 'An unknown error occurred.'}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ padding: '40px', fontFamily: 'sans-serif', maxWidth: '600px', margin: 'auto' }}>
      <h1>Admin: Upload Event Image</h1>
      <p>This page uploads an image directly to Supabase and then tells the Django backend where to find it.</p>
      
      <div style={{ marginBottom: '20px' }}>
        <label htmlFor="eventId" style={{ display: 'block', marginBottom: '5px' }}>
          Event ID to Update:
        </label>
        <input 
          type="text" 
          id="eventId"
          value={eventId}
          onChange={(e) => setEventId(e.target.value)}
          placeholder="Enter the ID of the event (e.g., 37)"
          style={{ width: '100%', padding: '8px' }}
        />
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label htmlFor="fileInput" style={{ display: 'block', marginBottom: '5px' }}>
          Select Image File:
        </label>
        <input 
          type="file" 
          id="fileInput"
          accept="image/png, image/jpeg"
          onChange={handleFileChange} 
          disabled={uploading} 
        />
      </div>

      <button onClick={handleUpload} disabled={uploading || !file || !eventId} style={{ padding: '10px 20px', fontSize: '16px' }}>
        {uploading ? 'Uploading...' : 'Upload and Save Image'}
      </button>

      {message && <p style={{ marginTop: '20px', fontWeight: 'bold' }}>{message}</p>}
    </div>
  );
};

export default AdminEventUpload;