import React from 'react';

// Import all your components
import Header from '../components/Header';
import Categories from '../components/Categories';
import FeaturedEvents from '../components/FeaturedEvents';
import Footer from '../components/Footer';

// This is our main page component
const HomePage = () => {
  return (
    <div>
      <Header />
      <main>
        <Categories />
        <FeaturedEvents />
        
        
      </main>
      <Footer />
    </div>
  );
};

export default HomePage;