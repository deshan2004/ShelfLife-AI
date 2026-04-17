// src/components/subscription/TrialReminder.jsx

import { useState, useEffect } from 'react'
import subscriptionService from '../../services/subscriptionService'

function TrialReminder({ subscription, onUpgradeClick, onDismiss }) {
  const [daysLeft, setDaysLeft] = useState(0)
  const [showReminder, setShowReminder] = useState(false)
  const [reminderType, setReminderType] = useState(null)
  
  useEffect(() => {
    if (subscription?.status === 'trial_active' && subscription.trialEnd) {
      const end = new Date(subscription.trialEnd)
      const now = new Date()
      const days = Math.ceil((end - now) / (1000 * 60 * 60 * 24))
      setDaysLeft(days)
      
      // Check if reminder should be shown (7, 3, or 1 day remaining)
      const shouldShow = [7, 3, 1].includes(days) && days > 0
      
      if (shouldShow) {
        // Check if we've already shown this reminder
        const notificationKey = `trialReminder${days}d`
        const alreadyShown = subscription.notifications?.[notificationKey]
        
        if (!alreadyShown) {
          setShowReminder(true)
          setReminderType(days === 1 ? 'urgent' : days === 3 ? 'warning' : 'info')
          // Mark as shown
          subscriptionService.markNotificationSent(subscription.userId, notificationKey)
        }
      }
    }
  }, [subscription])
  
  if (!showReminder || daysLeft <= 0) return null
  
  const getReminderMessage = () => {
    if (daysLeft === 7) {
      return {
        title: 'Your free trial ends in 7 days',
        message: 'Upgrade now to continue using all premium features without interruption.'
      }
    }
    if (daysLeft === 3) {
      return {
        title: '⚠️ Only 3 days left in your free trial!',
        message: 'Don\'t lose access to AI-powered expiry tracking and flash sale automation.'
      }
    }
    if (daysLeft === 1) {
      return {
        title: '🚨 Last day of your free trial!',
        message: 'Upgrade today to keep saving thousands on expiry losses.'
      }
    }
    return {
      title: `${daysLeft} days remaining in your free trial`,
      message: 'Upgrade anytime to continue uninterrupted access to all features.'
    }
  }
  
  const { title, message } = getReminderMessage()
  
  const handleDismiss = () => {
    setShowReminder(false)
    if (onDismiss) onDismiss()
  }
  
  return (
    <div className={`trial-reminder ${reminderType}`}>
      <div className="reminder-content">
        <div className="reminder-icon">
          {reminderType === 'urgent' ? (
            <i className="fas fa-exclamation-triangle"></i>
          ) : reminderType === 'warning' ? (
            <i className="fas fa-hourglass-half"></i>
          ) : (
            <i className="fas fa-clock"></i>
          )}
        </div>
        <div className="reminder-text">
          <strong>{title}</strong>
          <p>{message}</p>
        </div>
      </div>
      <div className="reminder-actions">
        <button className="btn-reminder-upgrade" onClick={onUpgradeClick}>
          Upgrade Now <i className="fas fa-arrow-right"></i>
        </button>
        <button className="btn-reminder-dismiss" onClick={handleDismiss}>
          <i className="fas fa-times"></i>
        </button>
      </div>
    </div>
  )
}

export default TrialReminder