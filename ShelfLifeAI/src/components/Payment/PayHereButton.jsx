// src/components/Payment/PayHereButton.jsx
import React, { useState } from 'react';
import payhereService from '../../services/payhereService';
import './PayHereButton.css';

function PayHereButton({ user, planId, planName, amount, variant = 'primary', onSuccess, onError }) {
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    console.log('PayHereButton clicked:', { user, planId, planName, amount });
    
    // Get user from props or localStorage
    let activeUser = user;
    
    if (!activeUser || !activeUser.uid) {
      const savedUser = localStorage.getItem('shelflife_user');
      if (savedUser) {
        try {
          activeUser = JSON.parse(savedUser);
          console.log('User loaded from localStorage:', activeUser);
        } catch (e) {
          console.error('Error parsing user:', e);
        }
      }
    }
    
    if (!activeUser || !activeUser.uid) {
      alert('Please login to continue with payment');
      window.location.href = '/';
      return;
    }
    
    // Ensure user has required fields
    const paymentUser = {
      uid: activeUser.uid,
      id: activeUser.uid,
      name: activeUser.name || activeUser.displayName || 'User',
      email: activeUser.email,
      phone: activeUser.phone || '0771234567',
      address: activeUser.address || 'Colombo'
    };
    
    console.log('Final payment user:', paymentUser);
    
    setLoading(true);

    try {
      const result = await payhereService.initiatePayment(paymentUser, planId);
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
          <span>Redirecting to PayHere...</span>
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