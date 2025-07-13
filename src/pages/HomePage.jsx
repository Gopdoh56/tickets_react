import React, { useState } from 'react';
import Header from '../components/Header';
import Categories from '../components/Categories';
import FeaturedEvents from '../components/FeaturedEvents';
import Footer from '../components/Footer';

const HomePage = () => {
  // State for the filters lives in the parent component
  const [filters, setFilters] = useState({ search: '', category: '' });

  // This function is passed down to the Categories component
  const handleSearch = (searchTerm) => {
    setFilters({ search: searchTerm, category: '' });
  };

  // This function is also passed down to the Categories component
  const handleCategorySelect = (categorySlug) => {
    setFilters({ search: '', category: categorySlug });
  };

  return (
    <div>
      <Header />
      <main>
        {/* Pass the handler functions as props */}
        <Categories 
          onSearch={handleSearch} 
          onCategorySelect={handleCategorySelect} 
        />
        {/* Pass the current filter state as a prop */}
        <FeaturedEvents filters={filters} />
      </main>
      <Footer />
    </div>
  );
};

export default HomePage;