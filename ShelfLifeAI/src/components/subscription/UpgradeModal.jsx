// src/components/subscription/UpgradeModal.jsx
import { useState } from 'react';
import paymentService from '../../services/paymentService';
import { PLAN_TIERS } from '../../models/subscription';

function UpgradeModal({ onClose, currentUsage, limit, resourceType = 'products' }) {
  const [selectedPlan, setSelectedPlan] = useState('PROFESSIONAL');
  const [loading, setLoading] = useState(false);
  
  const getResourceName = () => {
    return resourceType === 'products' ? 'products' : 'suppliers';
  };
  
  const handleUpgrade = async (planId) => {
    setLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem('shelflife_user'));
      if (!user || !user.uid) {
        alert('Please log in to upgrade');
        onClose();
        return;
      }
      await paymentService.redirectToCheckout(user.uid, planId);
    } catch (error) {
      console.error('Upgrade error:', error);
      alert('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Get plan details
  const plans = [
    { id: 'BASIC', name: 'Basic', price: 2500, products: 200, suppliers: 25, popular: false },
    { id: 'PROFESSIONAL', name: 'Professional', price: 5900, products: 1000, suppliers: 100, popular: true },
    { id: 'ENTERPRISE', name: 'Enterprise', price: 14900, products: 'Unlimited', suppliers: 'Unlimited', popular: false }
  ];
  
  return (
    <div className="upgrade-modal-overlay" onClick={onClose}>
      <div className="upgrade-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2><i className="fas fa-rocket"></i> Upgrade Required</h2>
          <button className="modal-close" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>
        
        <div className="modal-body">
          <div className="limit-warning">
            <i className="fas fa-exclamation-triangle"></i>
            <div>
              <strong>Free trial limit reached</strong>
              <p>
                You've used {currentUsage} out of {limit} {getResourceName()} in your free trial.
                Upgrade to add more {getResourceName()} and unlock all premium features.
              </p>
            </div>
          </div>
          
          <div className="quick-plans">
            <h3>Choose a plan that works for you</h3>
            
            <div className="plan-comparison">
              {plans.map(plan => (
                <div 
                  key={plan.id}
                  className={`comparison-card ${selectedPlan === plan.id ? 'selected' : ''} ${plan.popular ? 'featured' : ''}`}
                  onClick={() => setSelectedPlan(plan.id)}
                >
                  {plan.popular && <div className="popular-tag">Most Popular</div>}
                  <h4>{plan.name}</h4>
                  <div className="price">
                    LKR {typeof plan.price === 'number' ? plan.price.toLocaleString() : plan.price}
                    <span>/month</span>
                  </div>
                  <ul>
                    <li>✓ {typeof plan.products === 'number' ? `${plan.products.toLocaleString()}+` : plan.products} products</li>
                    <li>✓ {typeof plan.suppliers === 'number' ? `${plan.suppliers}+` : plan.suppliers} suppliers</li>
                    {plan.id === 'PROFESSIONAL' && <li>✓ AI OCR scanning</li>}
                    {plan.id === 'PROFESSIONAL' && <li>✓ Advanced analytics</li>}
                    {plan.id === 'PROFESSIONAL' && <li>✓ Flash sale automation</li>}
                    {plan.id === 'ENTERPRISE' && <li>✓ Priority support</li>}
                    {plan.id === 'ENTERPRISE' && <li>✓ API access</li>}
                    {plan.id === 'ENTERPRISE' && <li>✓ Multi-user access</li>}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose}>
            Maybe Later
          </button>
          <button 
            className="btn-upgrade-now"
            onClick={() => handleUpgrade(selectedPlan)}
            disabled={loading}
          >
            {loading ? 'Processing...' : `Upgrade to ${selectedPlan}`}
          </button>
        </div>
      </div>
    </div>
  );
}

export default UpgradeModal;