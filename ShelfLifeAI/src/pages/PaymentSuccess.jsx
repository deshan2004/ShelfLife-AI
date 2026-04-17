// src/pages/PaymentSuccess.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import subscriptionService from '../services/subscriptionService';
import payhereService from '../services/payhereService';
import './PaymentPages.css';

function PaymentSuccess() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [paymentInfo, setPaymentInfo] = useState(null);
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const processPayment = async () => {
      // Get parameters from URL
      const params = new URLSearchParams(location.search);
      const orderId = params.get('order_id');
      const paymentId = params.get('payment_id');
      const statusCode = params.get('status_code');
      
      console.log('Payment callback params:', { orderId, paymentId, statusCode });
      
      if (orderId) {
        // Verify payment
        const result = payhereService.verifyPaymentFromUrl({
          order_id: orderId,
          payment_id: paymentId,
          status_code: statusCode
        });
        
        if (result.verified && result.success) {
          setPaymentInfo(result.order);
          
          // Upgrade subscription
          const user = JSON.parse(localStorage.getItem('shelflife_user'));
          if (user && result.order.planId) {
            try {
              await subscriptionService.upgradeToPaid(user.uid, result.order.planId);
              console.log(`✅ Successfully upgraded to ${result.order.planId} plan`);
              
              // Show success message
              const event = new CustomEvent('showToast', { 
                detail: `🎉 Successfully upgraded to ${result.order.planName}!` 
              });
              window.dispatchEvent(event);
            } catch (error) {
              console.error('Upgrade error:', error);
            }
          }
        }
      }
      
      setLoading(false);
      
      // Countdown to redirect
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            navigate('/billing');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      return () => clearInterval(timer);
    };
    
    processPayment();
  }, [location, navigate]);

  if (loading) {
    return (
      <div className="payment-status-page">
        <div className="payment-status-card">
          <div className="loading-spinner"></div>
          <h2>Processing Your Payment...</h2>
          <p>Please wait while we confirm your transaction.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-status-page">
      <div className="payment-status-card success">
        <i className="fas fa-check-circle"></i>
        <h2>Payment Successful! 🎉</h2>
        <p>Thank you for subscribing to ShelfLife AI.</p>
        
        {paymentInfo && (
          <div className="payment-details">
            <h3>Order Details</h3>
            <div className="detail-row">
              <span>Order ID:</span>
              <strong>{paymentInfo.id}</strong>
            </div>
            <div className="detail-row">
              <span>Plan:</span>
              <strong>{paymentInfo.planName}</strong>
            </div>
            <div className="detail-row">
              <span>Amount:</span>
              <strong>LKR {paymentInfo.amount.toLocaleString()}/month</strong>
            </div>
            <div className="detail-row">
              <span>Status:</span>
              <span className="status-badge success">Completed</span>
            </div>
          </div>
        )}
        
        <div className="success-actions">
          <button onClick={() => navigate('/dashboard')} className="btn-primary">
            Go to Dashboard
          </button>
          <button onClick={() => navigate('/inventory')} className="btn-secondary">
            Manage Inventory
          </button>
        </div>
        
        <p className="redirect-note">Redirecting to billing page in {countdown} seconds...</p>
      </div>
    </div>
  );
}

export default PaymentSuccess;