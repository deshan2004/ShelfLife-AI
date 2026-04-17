// src/components/Payment/PayHereButton.jsx
import React, { useState } from 'react';
import payhereService from '../../services/payhereService';
import './PayHereButton.css';

function PayHereButton({ user, planId, planName, amount, variant = 'primary', onSuccess, onError }) {
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    if (!user) {
      alert('Please login to continue');
      return;
    }

    setLoading(true);

    try {
      const result = await payhereService.initiatePayment(user, planId);
      console.log('Payment initiated:', result);
      if (onSuccess) onSuccess(result);
    } catch (error) {
      console.error('Payment error:', error);
      alert('Failed to initiate payment. Please try again.');
      if (onError) onError(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
      className={`payhere-btn ${variant}`}
      onClick={handlePayment}
      disabled={loading}
    >
      {loading ? (
        <>
          <i className="fas fa-spinner fa-pulse"></i>
          <span>Processing...</span>
        </>
      ) : (
        <>
          <i className="fas fa-credit-card"></i>
          <span>Subscribe - LKR {amount.toLocaleString()}/month</span>
        </>
      )}
    </button>
  );
}

export default PayHereButton;