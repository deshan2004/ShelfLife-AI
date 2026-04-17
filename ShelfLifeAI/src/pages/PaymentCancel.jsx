// src/pages/PaymentCancel.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import payhereService from '../services/payhereService';
import './PaymentPages.css';

function PaymentCancel() {
  const navigate = useNavigate();
  const location = useLocation();
  const [orderInfo, setOrderInfo] = useState(null);

  useEffect(() => {
    // Get parameters from URL
    const params = new URLSearchParams(location.search);
    const orderId = params.get('order_id');
    
    if (orderId) {
      const order = payhereService.getOrder(orderId);
      if (order) {
        setOrderInfo(order);
      }
    }
  }, [location]);

  const handleRetry = () => {
    navigate('/billing');
  };

  return (
    <div className="payment-status-page">
      <div className="payment-status-card cancel">
        <i className="fas fa-times-circle"></i>
        <h2>Payment Cancelled</h2>
        <p>Your payment was cancelled. No charges were made to your account.</p>
        
        {orderInfo && (
          <div className="payment-details">
            <h3>Order Information</h3>
            <div className="detail-row">
              <span>Plan:</span>
              <strong>{orderInfo.planName}</strong>
            </div>
            <div className="detail-row">
              <span>Amount:</span>
              <strong>LKR {orderInfo.amount.toLocaleString()}/month</strong>
            </div>
          </div>
        )}
        
        <div className="cancel-actions">
          <button onClick={handleRetry} className="btn-primary">
            <i className="fas fa-redo"></i> Try Again
          </button>
          <button onClick={() => navigate('/billing')} className="btn-secondary">
            <i className="fas fa-arrow-left"></i> Back to Billing
          </button>
        </div>
        
        <div className="support-note">
          <i className="fas fa-headset"></i>
          <p>Need help? Contact our support team at <strong>support@shelflife.ai</strong></p>
        </div>
      </div>
    </div>
  );
}

export default PaymentCancel;