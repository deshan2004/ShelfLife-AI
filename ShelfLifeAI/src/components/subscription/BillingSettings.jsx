// src/components/subscription/BillingSettings.jsx
import { useState, useEffect } from 'react';
import subscriptionService from '../../services/subscriptionService';
import paymentService from '../../services/paymentService';
import { PLAN_TIERS, SUBSCRIPTION_STATUS } from '../../models/subscription';

function BillingSettings({ user, onUpgradeClick, refreshSubscription }) {
  const [subscription, setSubscription] = useState(null);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (user && user.uid) {
      loadSubscriptionData();
    } else {
      setLoading(false);
    }
  }, [user]);
  
  const loadSubscriptionData = async () => {
    if (!user || !user.uid) {
      setLoading(false);
      return;
    }
    
    try {
      const sub = await subscriptionService.getSubscriptionStatus(user.uid);
      const history = await subscriptionService.getPaymentHistory(user.uid, 10);
      
      setSubscription(sub);
      setPaymentHistory(history);
    } catch (error) {
      console.error('Error loading subscription:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleManageBilling = async () => {
    try {
      await paymentService.createCustomerPortal(user.uid, window.location.href);
      if (refreshSubscription) refreshSubscription();
    } catch (error) {
      console.error('Portal error:', error);
      alert('Unable to open billing portal. Please try again.');
    }
  };
  
  const getDaysLeft = () => {
    if (!subscription || !subscription.trialEnd) return 0;
    const end = new Date(subscription.trialEnd);
    const now = new Date();
    return Math.ceil((end - now) / (1000 * 60 * 60 * 24));
  };
  
  const getStatusBadge = () => {
    switch (subscription?.status) {
      case SUBSCRIPTION_STATUS.TRIAL_ACTIVE:
        return <span className="status-badge trial">🎁 Free Trial • {getDaysLeft()} days left</span>;
      case SUBSCRIPTION_STATUS.ACTIVE:
        return <span className="status-badge active">✅ Active</span>;
      case SUBSCRIPTION_STATUS.TRIAL_EXPIRED:
        return <span className="status-badge expired">⚠️ Trial Expired</span>;
      case SUBSCRIPTION_STATUS.PAST_DUE:
        return <span className="status-badge past-due">⚠️ Payment Past Due</span>;
      case SUBSCRIPTION_STATUS.CANCELLED:
        return <span className="status-badge cancelled">❌ Cancelled</span>;
      default:
        return <span className="status-badge unknown">Free Trial</span>;
    }
  };
  
  const getPlanName = () => {
    if (!subscription) return 'Free Trial';
    if (subscription.planId === 'FREE_TRIAL') return 'Free Trial';
    return PLAN_TIERS[subscription.planId]?.name || subscription.planId;
  };
  
  const getPlanPrice = () => {
    if (!subscription || subscription.planId === 'FREE_TRIAL') return 0;
    return PLAN_TIERS[subscription.planId]?.price || 0;
  };
  
  if (loading) {
    return (
      <div className="billing-loading">
        <div className="loading-spinner"></div>
        <p>Loading billing information...</p>
      </div>
    );
  }
  
  return (
    <div className="billing-settings">
      {/* Current Plan Section */}
      <div className="current-plan-section">
        <div className="section-header">
          <h2>Current Plan</h2>
          {getStatusBadge()}
        </div>
        
        <div className="current-plan-card">
          <div className="plan-info">
            <div>
              <h3>{getPlanName()}</h3>
              {subscription?.planId !== 'FREE_TRIAL' && subscription?.planId !== 'free_trial' && (
                <div className="plan-price-large">
                  LKR {getPlanPrice().toLocaleString()}
                  <span>/month</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Trial Information */}
          {subscription?.status === SUBSCRIPTION_STATUS.TRIAL_ACTIVE && (
            <div className="trial-info">
              <div className="trial-days">
                <i className="fas fa-hourglass-half"></i>
                <span>{getDaysLeft()} days remaining in your free trial</span>
              </div>
              <div className="trial-progress">
                <div 
                  className="trial-progress-bar" 
                  style={{ width: `${((14 - getDaysLeft()) / 14) * 100}%` }}
                ></div>
              </div>
              <p className="trial-note">
                Your trial ends on {new Date(subscription.trialEnd).toLocaleDateString()}. 
                No charges will be made until you upgrade.
              </p>
              <button className="btn-upgrade-now" onClick={onUpgradeClick}>
                Upgrade Now <i className="fas fa-arrow-right"></i>
              </button>
            </div>
          )}
          
          {/* Active Subscription Information */}
          {subscription?.status === SUBSCRIPTION_STATUS.ACTIVE && (
            <div className="active-info">
              <div className="info-row">
                <i className="fas fa-calendar"></i>
                <span>Next billing date: {new Date(subscription.currentPeriodEnd).toLocaleDateString()}</span>
              </div>
              <button className="btn-manage" onClick={handleManageBilling}>
                <i className="fas fa-cog"></i> Manage Subscription
              </button>
            </div>
          )}
          
          {/* Trial Expired Information */}
          {subscription?.status === SUBSCRIPTION_STATUS.TRIAL_EXPIRED && (
            <div className="expired-info">
              <i className="fas fa-exclamation-triangle"></i>
              <div>
                <strong>Your free trial has ended</strong>
                <p>Upgrade now to continue using ShelfLife AI and keep saving on expiry losses.</p>
              </div>
              <button className="btn-upgrade-now" onClick={onUpgradeClick}>
                Upgrade Now
              </button>
            </div>
          )}
          
          {/* Past Due Information */}
          {subscription?.status === SUBSCRIPTION_STATUS.PAST_DUE && (
            <div className="past-due-info">
              <i className="fas fa-exclamation-circle"></i>
              <div>
                <strong>Payment Past Due</strong>
                <p>Your payment is past due. Please update your payment method to avoid service interruption.</p>
              </div>
              <button className="btn-update-payment" onClick={handleManageBilling}>
                Update Payment Method
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* Upgrade Options - Show for trial users */}
      {(subscription?.status === SUBSCRIPTION_STATUS.TRIAL_ACTIVE || 
        subscription?.status === SUBSCRIPTION_STATUS.TRIAL_EXPIRED) && (
        <div className="upgrade-section">
          <div className="section-header">
            <h2>Upgrade Your Plan</h2>
            <p>Choose the plan that best fits your business needs</p>
          </div>
          
          <div className="plans-grid">
            {/* Basic Plan */}
            <div className="plan-card">
              <div className="plan-header">
                <h3>Basic</h3>
                <div className="plan-price">
                  LKR 2,500
                  <span>/month</span>
                </div>
                <p className="plan-description">Perfect for small shops starting out</p>
              </div>
              <ul className="plan-features">
                <li><i className="fas fa-check-circle"></i> <span>Up to 200 products</span></li>
                <li><i className="fas fa-check-circle"></i> <span>Up to 25 suppliers</span></li>
                <li><i className="fas fa-check-circle"></i> <span>Barcode scanning</span></li>
                <li><i className="fas fa-check-circle"></i> <span>Basic analytics</span></li>
                <li><i className="fas fa-check-circle"></i> <span>Email support</span></li>
              </ul>
              <button className="btn-upgrade btn-secondary" onClick={onUpgradeClick}>
                Upgrade to Basic
              </button>
            </div>
            
            {/* Professional Plan - Featured */}
            <div className="plan-card featured">
              <div className="popular-badge">Most Popular</div>
              <div className="plan-header">
                <h3>Professional</h3>
                <div className="plan-price">
                  LKR 5,900
                  <span>/month</span>
                </div>
                <p className="plan-description">Best for growing retail businesses</p>
              </div>
              <ul className="plan-features">
                <li><i className="fas fa-check-circle"></i> <span>Up to 1,000 products</span></li>
                <li><i className="fas fa-check-circle"></i> <span>Up to 100 suppliers</span></li>
                <li><i className="fas fa-check-circle"></i> <span>AI OCR expiry detection</span></li>
                <li><i className="fas fa-check-circle"></i> <span>Flash sale automation</span></li>
                <li><i className="fas fa-check-circle"></i> <span>Advanced analytics</span></li>
                <li><i className="fas fa-check-circle"></i> <span>Priority support</span></li>
                <li><i className="fas fa-check-circle"></i> <span>Data export (CSV/PDF)</span></li>
              </ul>
              <button className="btn-upgrade btn-primary" onClick={onUpgradeClick}>
                Upgrade to Professional
              </button>
            </div>
            
            {/* Enterprise Plan */}
            <div className="plan-card">
              <div className="plan-header">
                <h3>Enterprise</h3>
                <div className="plan-price">
                  LKR 14,900
                  <span>/month</span>
                </div>
                <p className="plan-description">For large operations with custom needs</p>
              </div>
              <ul className="plan-features">
                <li><i className="fas fa-check-circle"></i> <span>Unlimited products</span></li>
                <li><i className="fas fa-check-circle"></i> <span>Unlimited suppliers</span></li>
                <li><i className="fas fa-check-circle"></i> <span>All Professional features</span></li>
                <li><i className="fas fa-check-circle"></i> <span>REST API access</span></li>
                <li><i className="fas fa-check-circle"></i> <span>Multi-user access</span></li>
                <li><i className="fas fa-check-circle"></i> <span>Custom integrations</span></li>
                <li><i className="fas fa-check-circle"></i> <span>Dedicated support & SLA</span></li>
              </ul>
              <button className="btn-upgrade btn-secondary" onClick={onUpgradeClick}>
                Contact Sales
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Payment History */}
      {paymentHistory.length > 0 && (
        <div className="payment-history-section">
          <div className="section-header">
            <h2>Payment History</h2>
          </div>
          
          <div className="payments-table">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Type</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {paymentHistory.map(payment => (
                  <tr key={payment.id}>
                    <td>{new Date(payment.createdAt).toLocaleDateString()}</td>
                    <td>LKR {payment.amount.toLocaleString()}</td>
                    <td>{payment.type === 'subscription' ? 'Subscription' : payment.type}</td>
                    <td>
                      <span className="payment-status completed">
                        <i className="fas fa-check-circle"></i> Completed
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {/* FAQ Section */}
      <div className="faq-section">
        <div className="section-header">
          <h2>Frequently Asked Questions</h2>
        </div>
        
        <div className="faq-grid">
          <div className="faq-item">
            <h4>Can I cancel anytime?</h4>
            <p>Yes, you can cancel your subscription at any time from the billing portal. No long-term contracts.</p>
          </div>
          <div className="faq-item">
            <h4>What payment methods do you accept?</h4>
            <p>We accept all major credit cards (Visa, Mastercard, Amex) and bank transfers for enterprise plans.</p>
          </div>
          <div className="faq-item">
            <h4>What happens when my trial ends?</h4>
            <p>You'll lose access to premium features but can still view your data. Upgrade to continue using all features.</p>
          </div>
          <div className="faq-item">
            <h4>Is there a setup fee?</h4>
            <p>No setup fees for any plan. Enterprise plans include free onboarding and training.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BillingSettings;