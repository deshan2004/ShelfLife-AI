// src/components/Payment/PayHereButton.jsx
import { useState } from 'react';
import PaymentModal from './PaymentModal';
import './PayHereButton.css';

function PayHereButton({ user, planId, planName, amount, variant = 'primary', onSuccess, onError }) {
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const plan = {
    id: planId,
    name: planName,
    price: amount,
    features: planId === 'BASIC' ? ['200 products', '25 suppliers', 'Barcode scanning'] :
              planId === 'PROFESSIONAL' ? ['1000 products', '100 suppliers', 'AI OCR scanning', 'Flash sale automation', 'Advanced analytics'] :
              ['Unlimited products', 'Unlimited suppliers', 'All features', 'API access', 'Multi-user access']
  };

  const handlePaymentSuccess = async () => {
    setShowModal(false);
    
    let activeUser = user;
    if (!activeUser || !activeUser.uid) {
      const savedUser = localStorage.getItem('shelflife_user');
      if (savedUser) {
        activeUser = JSON.parse(savedUser);
      }
    }
    
    if (activeUser && activeUser.uid) {
      try {
        const { default: subscriptionService } = await import('../../services/subscriptionService');
        const { default: paymentService } = await import('../../services/paymentService');
        
        await subscriptionService.upgradeToPaid(activeUser.uid, planId);
        await subscriptionService.createPaymentRecord(activeUser.uid, amount, 'subscription');
        await paymentService.simulatePaymentSuccess(activeUser.uid, planId);
        
        alert(`✅ Successfully upgraded to ${planName} plan!`);
        if (onSuccess) onSuccess();
        window.location.reload();
      } catch (error) {
        console.error('Payment error:', error);
        alert('Payment failed. Please try again.');
        if (onError) onError(error);
      }
    }
  };

  return (
    <>
      <button 
        className={`payhere-btn ${variant}`}
        onClick={() => setShowModal(true)}
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
      
      <PaymentModal 
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        plan={plan}
        user={user}
        onSuccess={handlePaymentSuccess}
      />
    </>
  );
}

export default PayHereButton;