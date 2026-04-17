// src/services/subscriptionService.js
import { PLAN_TIERS, SUBSCRIPTION_STATUS } from '../models/subscription';

class SubscriptionService {
  
  // Start a new free trial
  async startFreeTrial(userId, userEmail, businessName, businessType = 'retail') {
    const trialStart = new Date();
    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + PLAN_TIERS.FREE_TRIAL.durationDays);
    
    const subscription = {
      userId: userId,
      email: userEmail,
      businessName: businessName,
      businessType: businessType,
      planId: 'FREE_TRIAL',
      status: SUBSCRIPTION_STATUS.TRIAL_ACTIVE,
      trialStart: trialStart.toISOString(),
      trialEnd: trialEnd.toISOString(),
      currentPeriodStart: trialStart.toISOString(),
      currentPeriodEnd: trialEnd.toISOString(),
      createdAt: trialStart.toISOString(),
      updatedAt: trialStart.toISOString(),
      features: {
        canBasicScan: true,
        canOCRScan: false,
        canBarcodeScan: true,
        canFlashSale: true,
        canSupplierReturn: false,
        canBasicAnalytics: true,
        canAdvancedAnalytics: false,
        canPrioritySupport: false,
        canAPIAccess: false,
        canMultiUser: false,
        canExportData: false,
        canCustomReports: false
      },
      limits: {
        maxProducts: 50,
        maxSuppliers: 10,
        maxScansPerMonth: 100
      },
      usage: {
        productsCount: 0,
        suppliersCount: 0,
        scansThisMonth: 0,
        flashSalesCount: 0,
        lastResetDate: trialStart.toISOString()
      },
      notifications: {
        trialReminder7d: false,
        trialReminder3d: false,
        trialReminder1d: false,
        paymentFailed: false
      }
    };
    
    // Store in localStorage for demo
    localStorage.setItem(`subscription_${userId}`, JSON.stringify(subscription));
    return subscription;
  }
  
  // Get subscription status
  async getSubscriptionStatus(userId) {
    if (!userId) return null;
    
    // Check localStorage first
    const localSub = localStorage.getItem(`subscription_${userId}`);
    let subscription = localSub ? JSON.parse(localSub) : null;
    
    if (!subscription) {
      // Check for legacy format
      const oldSub = localStorage.getItem(`sub_${userId}`);
      if (oldSub) {
        subscription = JSON.parse(oldSub);
      } else {
        return null;
      }
    }
    
    // Check if trial has expired
    if (subscription.status === SUBSCRIPTION_STATUS.TRIAL_ACTIVE) {
      const trialEnd = new Date(subscription.trialEnd);
      const now = new Date();
      
      if (now > trialEnd) {
        subscription.status = SUBSCRIPTION_STATUS.TRIAL_EXPIRED;
        subscription.updatedAt = now.toISOString();
        await this.updateSubscription(userId, subscription);
      }
    }
    
    return subscription;
  }
  
  // Update subscription
  async updateSubscription(userId, subscription) {
    localStorage.setItem(`subscription_${userId}`, JSON.stringify(subscription));
    return subscription;
  }
  
  // Expire trial
  async expireTrial(userId) {
    const subscription = await this.getSubscriptionStatus(userId);
    if (subscription) {
      subscription.status = SUBSCRIPTION_STATUS.TRIAL_EXPIRED;
      subscription.updatedAt = new Date().toISOString();
      localStorage.setItem(`subscription_${userId}`, JSON.stringify(subscription));
    }
    return subscription;
  }
  
  // Upgrade to paid plan (demo version)
  async upgradeToPaid(userId, planId, stripeCustomerId = null, stripeSubscriptionId = null) {
    const plan = PLAN_TIERS[planId];
    if (!plan) throw new Error('Invalid plan');
    
    const now = new Date();
    const periodEnd = new Date();
    periodEnd.setMonth(periodEnd.getMonth() + 1);
    
    const subscription = {
      userId: userId,
      planId: planId,
      status: SUBSCRIPTION_STATUS.ACTIVE,
      stripeCustomerId: stripeCustomerId || `cus_demo_${Date.now()}`,
      stripeSubscriptionId: stripeSubscriptionId || `sub_demo_${Date.now()}`,
      currentPeriodStart: now.toISOString(),
      currentPeriodEnd: periodEnd.toISOString(),
      updatedAt: now.toISOString(),
      features: {
        canBasicScan: true,
        canOCRScan: planId === 'PROFESSIONAL' || planId === 'ENTERPRISE',
        canBarcodeScan: true,
        canFlashSale: true,
        canSupplierReturn: planId === 'PROFESSIONAL' || planId === 'ENTERPRISE',
        canBasicAnalytics: true,
        canAdvancedAnalytics: planId === 'PROFESSIONAL' || planId === 'ENTERPRISE',
        canPrioritySupport: planId === 'PROFESSIONAL' || planId === 'ENTERPRISE',
        canAPIAccess: planId === 'ENTERPRISE',
        canMultiUser: planId === 'ENTERPRISE',
        canExportData: planId === 'PROFESSIONAL' || planId === 'ENTERPRISE',
        canCustomReports: planId === 'ENTERPRISE'
      },
      limits: {
        maxProducts: plan.maxProducts,
        maxSuppliers: plan.maxSuppliers,
        maxScansPerMonth: plan.maxScansPerMonth
      }
    };
    
    localStorage.setItem(`subscription_${userId}`, JSON.stringify(subscription));
    return subscription;
  }
  
  // Cancel subscription
  async cancelSubscription(userId) {
    const subscription = await this.getSubscriptionStatus(userId);
    if (subscription) {
      subscription.status = SUBSCRIPTION_STATUS.CANCELLED;
      subscription.cancelledAt = new Date().toISOString();
      subscription.updatedAt = new Date().toISOString();
      localStorage.setItem(`subscription_${userId}`, JSON.stringify(subscription));
    }
    return subscription;
  }
  
  // Mark as past due
  async markPaymentFailed(userId) {
    const subscription = await this.getSubscriptionStatus(userId);
    if (subscription) {
      subscription.status = SUBSCRIPTION_STATUS.PAST_DUE;
      subscription.updatedAt = new Date().toISOString();
      localStorage.setItem(`subscription_${userId}`, JSON.stringify(subscription));
    }
    return subscription;
  }
  
  // Get trial days left
  async getTrialDaysLeft(userId) {
    const subscription = await this.getSubscriptionStatus(userId);
    if (!subscription || subscription.status !== SUBSCRIPTION_STATUS.TRIAL_ACTIVE) {
      return 0;
    }
    
    const trialEnd = new Date(subscription.trialEnd);
    const now = new Date();
    const daysLeft = Math.ceil((trialEnd - now) / (1000 * 60 * 60 * 24));
    
    return Math.max(0, daysLeft);
  }
  
  // Create payment record
  async createPaymentRecord(userId, amount, type, stripePaymentIntentId = null) {
    const payment = {
      id: `pay_${Date.now()}`,
      userId: userId,
      amount: amount,
      currency: 'LKR',
      type: type,
      status: 'completed',
      stripePaymentIntentId: stripePaymentIntentId || `pi_demo_${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    
    // Store in localStorage
    const payments = JSON.parse(localStorage.getItem(`payments_${userId}`) || '[]');
    payments.unshift(payment);
    localStorage.setItem(`payments_${userId}`, JSON.stringify(payments));
    
    return payment;
  }
  
  // Get payment history
  async getPaymentHistory(userId, limitCount = 10) {
    const payments = JSON.parse(localStorage.getItem(`payments_${userId}`) || '[]');
    return payments.slice(0, limitCount);
  }
  
  // Mark notification as sent
  async markNotificationSent(userId, notificationType) {
    const subscription = await this.getSubscriptionStatus(userId);
    if (subscription) {
      subscription.notifications = subscription.notifications || {};
      subscription.notifications[notificationType] = true;
      subscription.updatedAt = new Date().toISOString();
      localStorage.setItem(`subscription_${userId}`, JSON.stringify(subscription));
    }
  }
  
  // Check usage limit
  async checkUsageLimit(userId, type) {
    const subscription = await this.getSubscriptionStatus(userId);
    if (!subscription) {
      return { current: 0, limit: 0, remaining: 0, percentageUsed: 0 };
    }
    
    let current = 0;
    let limit = 0;
    
    switch (type) {
      case 'products':
        current = subscription.usage?.productsCount || 0;
        limit = subscription.limits?.maxProducts || 50;
        break;
      case 'suppliers':
        current = subscription.usage?.suppliersCount || 0;
        limit = subscription.limits?.maxSuppliers || 10;
        break;
      case 'scans':
        current = subscription.usage?.scansThisMonth || 0;
        limit = subscription.limits?.maxScansPerMonth || 100;
        break;
      default:
        return { current: 0, limit: 0, remaining: 0, percentageUsed: 0 };
    }
    
    const remaining = Math.max(0, limit - current);
    const percentageUsed = limit > 0 ? (current / limit) * 100 : 0;
    
    return { current, limit, remaining, percentageUsed };
  }
  
  // Increment usage
  async incrementUsage(userId, type, incrementBy = 1) {
    const subscription = await this.getSubscriptionStatus(userId);
    if (subscription && subscription.usage) {
      switch (type) {
        case 'products':
          subscription.usage.productsCount = (subscription.usage.productsCount || 0) + incrementBy;
          break;
        case 'suppliers':
          subscription.usage.suppliersCount = (subscription.usage.suppliersCount || 0) + incrementBy;
          break;
        case 'scans':
          subscription.usage.scansThisMonth = (subscription.usage.scansThisMonth || 0) + incrementBy;
          break;
      }
      subscription.updatedAt = new Date().toISOString();
      localStorage.setItem(`subscription_${userId}`, JSON.stringify(subscription));
    }
    return subscription;
  }
}

export default new SubscriptionService();