// src/pages/BillingPage.jsx - Beautiful Payment Page
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import subscriptionService from '../services/subscriptionService';
import paymentService from '../services/paymentService';
import PayHereButton from '../components/Payment/PayHereButton';
import { PLAN_PRICES } from '../config/payhereConfig';
import './BillingPage.css';

function BillingPage({ user }) {
  const navigate = useNavigate();
  const [subscription, setSubscription] = useState(null);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState('PROFESSIONAL');

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }
    loadSubscriptionData();
  }, [user, navigate]);

  const loadSubscriptionData = async () => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }
    
    try {
      const sub = await subscriptionService.getSubscriptionStatus(user.uid);
      const history = await subscriptionService.getPaymentHistory(user.uid, 5);
      setSubscription(sub);
      setPaymentHistory(history);
    } catch (error) {
      console.error('Error loading subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysLeft = () => {
    if (!subscription?.trialEnd) return 0;
    const end = new Date(subscription.trialEnd);
    const now = new Date();
    return Math.ceil((end - now) / (1000 * 60 * 60 * 24));
  };

  const getTrialProgress = () => {
    const daysLeft = getDaysLeft();
    return ((14 - daysLeft) / 14) * 100;
  };

  const isTrialActive = subscription?.status === 'trial_active';
  const isTrialExpired = subscription?.status === 'trial_expired';
  const isActive = subscription?.status === 'active';
  const daysLeft = getDaysLeft();

  const plans = [
    {
      id: 'BASIC',
      name: 'Basic',
      price: 2500,
      description: 'Perfect for small shops just starting out',
      features: ['200 products', '25 suppliers', 'Barcode scanning', 'Basic analytics', 'Email support'],
      popular: false
    },
    {
      id: 'PROFESSIONAL',
      name: 'Professional',
      price: 5900,
      description: 'Best for growing retail businesses',
      features: ['1000 products', '100 suppliers', 'AI OCR scanning', 'Flash sale automation', 'Advanced analytics', 'Priority support', 'Data export'],
      popular: true
    },
    {
      id: 'ENTERPRISE',
      name: 'Enterprise',
      price: 14900,
      description: 'For large operations with custom needs',
      features: ['Unlimited products', 'Unlimited suppliers', 'All Professional features', 'API access', 'Multi-user access', 'Dedicated support'],
      popular: false
    }
  ];

  const stats = [
    { value: '14 days', label: 'Free Trial', icon: 'fa-gift' },
    { value: 'LKR 0', label: 'Setup Fee', icon: 'fa-money-bill' },
    { value: 'Cancel anytime', label: 'No contracts', icon: 'fa-calendar-times' }
  ];

  if (loading) {
    return (
      <div className="billing-loading">
        <div className="loading-spinner"></div>
        <p>Loading billing information...</p>
      </div>
    );
  }

  return (
    <div className="billing-page">
      <div className="container">
        <div className="billing-header">
          <h1>
            <i className="fas fa-crown"></i>
            Choose Your Plan
          </h1>
          <p>Start with 14 days free trial. No credit card required.</p>
        </div>

        <div className="billing-stats">
          {stats.map((stat, index) => (
            <div key={index} className="billing-stat-card">
              <div className="billing-stat-icon">
                <i className={`fas ${stat.icon}`}></i>
              </div>
              <div className="billing-stat-info">
                <h3>{stat.value}</h3>
                <p>{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {isTrialActive && daysLeft > 0 && (
          <div className="trial-banner">
            <div className="trial-banner-content">
              <i className="fas fa-gift"></i>
              <div>
                <h3>Your Free Trial is Active!</h3>
                <p>You have <span className="trial-days">{daysLeft} days</span> remaining in your trial</p>
              </div>
            </div>
            <div className="trial-progress">
              <div className="trial-progress-bar">
                <div className="trial-progress-fill" style={{ width: `${getTrialProgress()}%` }}></div>
              </div>
            </div>
            <button className="btn-upgrade-trial" onClick={() => document.getElementById('plans').scrollIntoView({ behavior: 'smooth' })}>
              Upgrade Now <i className="fas fa-arrow-right"></i>
            </button>
          </div>
        )}

        {isTrialExpired && (
          <div className="trial-banner" style={{ borderColor: '#ef4444' }}>
            <div className="trial-banner-content">
              <i className="fas fa-exclamation-triangle" style={{ color: '#ef4444' }}></i>
              <div>
                <h3>Your Free Trial Has Ended</h3>
                <p>Upgrade now to continue using all premium features</p>
              </div>
            </div>
            <button className="btn-upgrade-trial" onClick={() => document.getElementById('plans').scrollIntoView({ behavior: 'smooth' })}>
              Upgrade Now <i className="fas fa-arrow-right"></i>
            </button>
          </div>
        )}

        {isActive && (
          <div className="trial-banner" style={{ borderColor: '#22c55e' }}>
            <div className="trial-banner-content">
              <i className="fas fa-check-circle" style={{ color: '#22c55e' }}></i>
              <div>
                <h3>Active Subscription</h3>
                <p>You are on the <strong>{subscription?.planId}</strong> plan</p>
              </div>
            </div>
          </div>
        )}

        <div id="plans" className="plans-section">
          <h2>Select Your Perfect Plan</h2>
          <div className="plans-grid">
            {plans.map((plan) => (
              <div key={plan.id} className={`plan-card ${plan.popular ? 'featured' : ''}`}>
                {plan.popular && <div className="popular-badge">🔥 Most Popular</div>}
                <h3>{plan.name}</h3>
                <div className="plan-price">
                  <span className="amount">LKR {plan.price.toLocaleString()}</span>
                  <span className="period">/month</span>
                </div>
                <p className="plan-description">{plan.description}</p>
                <ul className="plan-features">
                  {plan.features.map((feature, idx) => (
                    <li key={idx}>
                      <i className="fas fa-check-circle"></i>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <PayHereButton 
                  user={user}
                  planId={plan.id}
                  planName={plan.name}
                  amount={plan.price}
                  variant={plan.popular ? 'primary' : 'secondary'}
                />
              </div>
            ))}
          </div>
        </div>

        {paymentHistory.length > 0 && (
          <div className="payment-history-section">
            <h2>
              <i className="fas fa-history"></i>
              Payment History
            </h2>
            <div style={{ overflowX: 'auto' }}>
              <table className="payment-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Plan</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {paymentHistory.map((payment) => (
                    <tr key={payment.id}>
                      <td>{new Date(payment.createdAt).toLocaleDateString()}</td>
                      <td>LKR {payment.amount?.toLocaleString()}</td>
                      <td>{payment.planId || 'Subscription'}</td>
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

        <div className="faq-section">
          <h2>
            <i className="fas fa-question-circle"></i>
            Frequently Asked Questions
          </h2>
          <div className="faq-grid">
            <div className="faq-item">
              <h4>Can I cancel anytime?</h4>
              <p>Yes, you can cancel your subscription at any time. No long-term contracts or hidden fees.</p>
            </div>
            <div className="faq-item">
              <h4>What payment methods do you accept?</h4>
              <p>We accept all major credit cards (Visa, Mastercard, Amex) through our secure payment partner PayHere.</p>
            </div>
            <div className="faq-item">
              <h4>What happens when my trial ends?</h4>
              <p>You'll lose access to premium features. Upgrade anytime to continue using all features.</p>
            </div>
            <div className="faq-item">
              <h4>Is there a setup fee?</h4>
              <p>No setup fees for any plan. Enterprise plans include free onboarding and training.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BillingPage;