// src/pages/BillingPage.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import subscriptionService from '../services/subscriptionService';
import paymentService from '../services/paymentService';
import PayHereButton from '../components/Payment/PayHereButton';
import { PLAN_PRICES } from '../config/payhereConfig';
import './Pages.css';
import './BillingPage.css';

function BillingPage({ user }) {
  const navigate = useNavigate();
  const [subscription, setSubscription] = useState(null);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('PROFESSIONAL');
  const [upgrading, setUpgrading] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }
    loadSubscriptionData(user.uid);
  }, [user, navigate]);

  const loadSubscriptionData = async (userId) => {
    try {
      const sub = await subscriptionService.getSubscriptionStatus(userId);
      const history = await subscriptionService.getPaymentHistory(userId, 10);
      setSubscription(sub);
      setPaymentHistory(history);
    } catch (error) {
      console.error('Error loading subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysLeft = () => {
    if (!subscription || !subscription.trialEnd) return 0;
    const end = new Date(subscription.trialEnd);
    const now = new Date();
    return Math.ceil((end - now) / (1000 * 60 * 60 * 24));
  };

  const handleUpgrade = async (planId) => {
    if (!user) {
      alert('Please log in to upgrade');
      navigate('/');
      return;
    }
    
    setUpgrading(true);
    try {
      await paymentService.redirectToCheckout(user.uid, planId);
      await loadSubscriptionData(user.uid);
    } catch (error) {
      console.error('Upgrade error:', error);
      alert('Something went wrong. Please try again.');
    } finally {
      setUpgrading(false);
      setShowUpgradeModal(false);
    }
  };

  const handleStartFreeTrial = async () => {
    if (!user) {
      alert('Please sign up first');
      navigate('/');
      return;
    }
    
    const existingSub = await subscriptionService.getSubscriptionStatus(user.uid);
    if (existingSub) {
      alert('You already have an active subscription or trial');
      return;
    }
    
    setUpgrading(true);
    try {
      await subscriptionService.startFreeTrial(
        user.uid,
        user.email,
        user.businessName || user.name + "'s Store",
        'retail'
      );
      await loadSubscriptionData(user.uid);
      alert('🎉 Your 14-day free trial has started!');
    } catch (error) {
      console.error('Error starting trial:', error);
      alert('Failed to start trial. Please try again.');
    } finally {
      setUpgrading(false);
    }
  };

  if (loading) {
    return (
      <div className="billing-page">
        <div className="container">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading billing information...</p>
          </div>
        </div>
      </div>
    );
  }

  const daysLeft = getDaysLeft();
  const isTrialActive = subscription?.status === 'trial_active';
  const isTrialExpired = subscription?.status === 'trial_expired';
  const isActive = subscription?.status === 'active';
  const hasNoSubscription = !subscription;

  return (
    <div className="billing-page">
      <div className="container">
        {/* Header */}
        <div className="billing-header">
          <h1>
            <i className="fas fa-credit-card"></i>
            Billing & Subscription
          </h1>
          <p>Manage your plan, payment methods, and subscription settings</p>
        </div>

        {/* Stats Cards */}
        <div className="billing-stats">
          <div className="stat-card">
            <div className="stat-icon">
              <i className="fas fa-calendar-alt"></i>
            </div>
            <div className="stat-info">
              <h3>{isTrialActive ? `${daysLeft} days` : isActive ? 'Active' : hasNoSubscription ? 'Not Started' : 'Expired'}</h3>
              <p>Trial Status</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <i className="fas fa-chart-line"></i>
            </div>
            <div className="stat-info">
              <h3>LKR 5,000+</h3>
              <p>Monthly Savings</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <i className="fas fa-percent"></i>
            </div>
            <div className="stat-info">
              <h3>340%</h3>
              <p>ROI</p>
            </div>
          </div>
        </div>

        {/* Start Free Trial Banner */}
        {hasNoSubscription && (
          <div className="start-trial-banner">
            <div className="start-trial-content">
              <i className="fas fa-gift"></i>
              <div>
                <h2>Start Your Free Trial</h2>
                <p>Get 14 days free access to all features. No credit card required.</p>
              </div>
              <button 
                className="btn-start-trial" 
                onClick={handleStartFreeTrial}
                disabled={upgrading}
              >
                {upgrading ? 'Starting...' : 'Start Free Trial'} 
                <i className="fas fa-arrow-right"></i>
              </button>
            </div>
          </div>
        )}

        {/* Current Plan Card */}
        {(isTrialActive || isActive || isTrialExpired) && (
          <div className="current-plan-card">
            <div className="plan-header-section">
              <span className={`plan-badge ${isTrialActive ? 'trial' : isActive ? 'active' : 'expired'}`}>
                {isTrialActive ? 'Free Trial' : isActive ? 'Active Plan' : 'Trial Expired'}
              </span>
              <div className="plan-name">
                {subscription?.planId === 'FREE_TRIAL' ? 'Free Trial' : 
                 subscription?.planId === 'PROFESSIONAL' ? 'Professional Plan' :
                 subscription?.planId === 'BASIC' ? 'Basic Plan' : 'Free Trial'}
              </div>
            </div>
            
            {isTrialActive && (
              <div className="trial-section">
                <div className="plan-price">LKR 0<span>/month for 14 days</span></div>
                <div className="trial-progress-container">
                  <div className="trial-days">
                    <i className="fas fa-hourglass-half"></i>
                    <span>{daysLeft} days remaining in your free trial</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${((14 - daysLeft) / 14) * 100}%` }}></div>
                  </div>
                </div>
                <button 
                  className="btn-upgrade-now" 
                  onClick={() => setShowUpgradeModal(true)}
                  disabled={upgrading}
                >
                  Upgrade Now <i className="fas fa-arrow-right"></i>
                </button>
              </div>
            )}
            
            {isActive && (
              <div className="active-section">
                <div className="plan-price">
                  LKR {subscription?.planId === 'PROFESSIONAL' ? '5,900' : subscription?.planId === 'BASIC' ? '2,500' : '0'}<span>/month</span>
                </div>
                <button 
                  className="btn-manage" 
                  onClick={() => paymentService.createCustomerPortal(user?.uid, window.location.href)}
                >
                  <i className="fas fa-cog"></i> Manage Subscription
                </button>
              </div>
            )}
            
            {isTrialExpired && (
              <div className="expired-section">
                <i className="fas fa-exclamation-triangle"></i>
                <div>
                  <strong>Your free trial has ended</strong>
                  <p>Upgrade now to continue using ShelfLife AI and keep saving on expiry losses.</p>
                </div>
                <button 
                  className="btn-upgrade-now" 
                  onClick={() => setShowUpgradeModal(true)}
                  disabled={upgrading}
                >
                  Upgrade Now
                </button>
              </div>
            )}
          </div>
        )}

        {/* Plans Section */}
        {(isTrialActive || isTrialExpired || hasNoSubscription) && (
          <div className="plans-section">
            <h2>Choose Your Plan</h2>
            <div className="plans-grid">
              {/* Basic Plan */}
              <div className="plan-card">
                <h3>Basic</h3>
                <div className="price">LKR 2,500<span>/month</span></div>
                <p className="description">Perfect for small shops starting out</p>
                <ul className="feature-list">
                  {PLAN_PRICES.BASIC.features.map((feature, idx) => (
                    <li key={idx}><i className="fas fa-check-circle"></i> {feature}</li>
                  ))}
                </ul>
                <PayHereButton 
                  user={user}
                  planId="BASIC"
                  planName="Basic Plan"
                  amount={2500}
                  variant="secondary"
                />
              </div>

              {/* Professional Plan */}
              <div className="plan-card featured">
                <div className="popular-tag">Most Popular</div>
                <h3>Professional</h3>
                <div className="price">LKR 5,900<span>/month</span></div>
                <p className="description">Best for growing retail businesses</p>
                <ul className="feature-list">
                  {PLAN_PRICES.PROFESSIONAL.features.map((feature, idx) => (
                    <li key={idx}><i className="fas fa-check-circle"></i> {feature}</li>
                  ))}
                </ul>
                <PayHereButton 
                  user={user}
                  planId="PROFESSIONAL"
                  planName="Professional Plan"
                  amount={5900}
                  variant="primary"
                />
              </div>

              {/* Enterprise Plan */}
              <div className="plan-card">
                <h3>Enterprise</h3>
                <div className="price">LKR 14,900<span>/month</span></div>
                <p className="description">For large operations with custom needs</p>
                <ul className="feature-list">
                  {PLAN_PRICES.ENTERPRISE.features.map((feature, idx) => (
                    <li key={idx}><i className="fas fa-check-circle"></i> {feature}</li>
                  ))}
                </ul>
                <button 
                  className="btn-contact-sales" 
                  onClick={() => window.location.href = 'mailto:sales@shelflife.ai'}
                >
                  <i className="fas fa-envelope"></i> Contact Sales
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Payment History */}
        {paymentHistory.length > 0 && (
          <div className="payment-history-section">
            <h2>Payment History</h2>
            <div className="payment-table-container">
              <table className="payment-table">
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
                        <span className="status-success">
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
          <h2>Frequently Asked Questions</h2>
          <div className="faq-grid">
            <div className="faq-item">
              <h4>Can I cancel anytime?</h4>
              <p>Yes, you can cancel your subscription at any time from the billing portal. No long-term contracts.</p>
            </div>
            <div className="faq-item">
              <h4>What payment methods do you accept?</h4>
              <p>We accept all major credit cards (Visa, Mastercard, Amex) through PayHere.</p>
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

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div className="modal-overlay" onClick={() => setShowUpgradeModal(false)}>
          <div className="upgrade-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2><i className="fas fa-rocket"></i> Upgrade Your Plan</h2>
              <button className="modal-close" onClick={() => setShowUpgradeModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              <div className="upgrade-plans-grid">
                <div 
                  className={`upgrade-plan-card ${selectedPlan === 'BASIC' ? 'selected' : ''}`}
                  onClick={() => setSelectedPlan('BASIC')}
                >
                  <h3>Basic</h3>
                  <div className="price">LKR 2,500<span>/month</span></div>
                  <ul>
                    <li><i className="fas fa-check"></i> 200 products</li>
                    <li><i className="fas fa-check"></i> 25 suppliers</li>
                    <li><i className="fas fa-check"></i> Barcode scanning</li>
                  </ul>
                </div>
                <div 
                  className={`upgrade-plan-card popular ${selectedPlan === 'PROFESSIONAL' ? 'selected' : ''}`}
                  onClick={() => setSelectedPlan('PROFESSIONAL')}
                >
                  <div className="popular-tag">Popular</div>
                  <h3>Professional</h3>
                  <div className="price">LKR 5,900<span>/month</span></div>
                  <ul>
                    <li><i className="fas fa-check"></i> 1,000 products</li>
                    <li><i className="fas fa-check"></i> 100 suppliers</li>
                    <li><i className="fas fa-check"></i> AI OCR scanning</li>
                    <li><i className="fas fa-check"></i> Flash sale automation</li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowUpgradeModal(false)}>
                Maybe Later
              </button>
              <button 
                className="btn-confirm-upgrade" 
                onClick={() => handleUpgrade(selectedPlan)}
                disabled={upgrading}
              >
                {upgrading ? 'Processing...' : `Upgrade to ${selectedPlan}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default BillingPage;