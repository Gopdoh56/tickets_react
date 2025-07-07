import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import PaymentSuccess from '../components/PaymentSuccess';

const PaymentSuccessPage = () => {
  return (
    <div>
      <Header />
      <main>
        <PaymentSuccess />
      </main>
      <Footer />
    </div>
  );
};

export default PaymentSuccessPage;