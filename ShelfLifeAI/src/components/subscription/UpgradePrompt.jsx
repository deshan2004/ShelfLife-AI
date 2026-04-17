// src/components/subscription/UpgradePrompt.jsx

import { useState } from 'react'
import { PLAN_TIERS, FEATURE_NAMES } from '../../models/subscription'
import paymentService from '../../services/paymentService'

function UpgradePrompt({ feature, subscription, onClose }) {
  const [selectedPlan, setSelectedPlan] = useState('PROFESSIONAL')
  const [loading, setLoading] = useState(false)
  
  const getFeatureDisplayName = () => {
    if (feature && FEATURE_NAMES[feature]) {
      return FEATURE_NAMES[feature]
    }
    return 'this premium feature'
  }
  
  const isTrialExpired = subscription?.status === 'trial_expired'
  const daysLeft = subscription ? 
    Math.ceil((new Date(subscription.trialEnd) - new Date()) / (1000 * 60 * 60 * 24)) : 0
  
  const handleUpgrade = async (planId) => {
    setLoading(true)
    try {
      const user = JSON.parse(localStorage.getItem('shelflife_user'))
      await paymentService.redirectToCheckout(user.uid, planId)
    } catch (error) {
      console.error('Upgrade error:', error)
      alert('Something went wrong. Please try again or contact support.')
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="upgrade-prompt-overlay" onClick={onClose}>
      <div className="upgrade-prompt" onClick={(e) => e.stopPropagation()}>
        <button className="upgrade-close" onClick={onClose}>
          <i className="fas fa-times"></i>
        </button>
        
        <div className="upgrade-icon">
          <i className="fas fa-crown"></i>
        </div>
        
        <h2>Upgrade to Unlock {getFeatureDisplayName()}</h2>
        
        {isTrialExpired ? (
          <p className="upgrade-message expired">
            <i className="fas fa-exclamation-triangle"></i>
            Your free trial has ended. Choose a plan below to continue using ShelfLife AI.
          </p>
        ) : subscription?.status === 'trial_active' ? (
          <p className="upgrade-message trial">
            <i className="fas fa-hourglass-half"></i>
            You have <strong>{daysLeft} days</strong> left in your free trial.
            Upgrade anytime to continue uninterrupted access.
          </p>
        ) : (
          <p className="upgrade-message">
            Get access to all premium features including AI OCR scanning,
            flash sale automation, supplier returns, and advanced analytics.
          </p>
        )}
        
        <div className="upgrade-plans">
          {Object.entries(PLAN_TIERS).filter(([key]) => key !== 'FREE_TRIAL').map(([key, plan]) => (
            <div 
              key={key} 
              className={`upgrade-plan-card ${selectedPlan === key ? 'selected' : ''} ${plan.popular ? 'popular' : ''}`}
              onClick={() => setSelectedPlan(key)}
            >
              {plan.popular && <div className="popular-badge">Most Popular</div>}
              <h3>{plan.name}</h3>
              <div className="plan-price">
                LKR {plan.price.toLocaleString()}
                <span>/month</span>
              </div>
              <ul className="plan-features-list">
                <li>
                  <i className="fas fa-check"></i>
                  Up to {plan.maxProducts === Infinity ? 'Unlimited' : `${plan.maxProducts.toLocaleString()}+`} products
                </li>
                <li>
                  <i className="fas fa-check"></i>
                  {plan.maxSuppliers === Infinity ? 'Unlimited' : `${plan.maxSuppliers}+`} suppliers
                </li>
                {plan.features.includes('ocr_scanning') && (
                  <li><i className="fas fa-check"></i> AI OCR scanning</li>
                )}
                {plan.features.includes('advanced_analytics') && (
                  <li><i className="fas fa-check"></i> Advanced analytics</li>
                )}
                {plan.features.includes('priority_support') && (
                  <li><i className="fas fa-check"></i> Priority support</li>
                )}
              </ul>
              <button 
                className={`btn-select-plan ${selectedPlan === key ? 'active' : ''}`}
                onClick={() => handleUpgrade(key)}
                disabled={loading}
              >
                {loading ? 'Processing...' : `Select ${plan.name}`}
              </button>
            </div>
          ))}
        </div>
        
        <p className="upgrade-note">
          <i className="fas fa-lock"></i>
          Secure payment via Stripe • Cancel anytime • No hidden fees
        </p>
        
        <button className="btn-later" onClick={onClose}>
          Maybe Later
        </button>
      </div>
    </div>
  )
}

export default UpgradePrompt