// src/services/subscriptionService.js
import { api } from './apiService';

class SubscriptionService {
  async getSubscriptionStatus(userId) {
    if (!userId) return null;
    try {
      const subscription = await api.getSubscription(userId);
      return subscription;
    } catch (error) {
      console.error('Error getting subscription:', error);
      return this.getDefaultSubscription(userId);
    }
  }

  getDefaultSubscription(userId) {
    const createdAt = new Date();
    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + 14);

    return {
      userId,
      planId: 'FREE_TRIAL',
      status: 'trial_active',
      trialStart: createdAt.toISOString(),
      trialEnd: trialEnd.toISOString(),
      currentPeriodStart: createdAt.toISOString(),
      currentPeriodEnd: trialEnd.toISOString(),
      cancelAtPeriodEnd: false,
      createdAt: createdAt.toISOString(),
      updatedAt: createdAt.toISOString(),
      notifications: {},
      features: {
        canBasicScan: true,
        canOCRScan: true,
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
      }
    };
  }

  async refreshSubscription(userId) {
    return this.getSubscriptionStatus(userId);
  }

  async getTrialDaysLeft(userId) {
    const subscription = await this.getSubscriptionStatus(userId);
    if (subscription?.status !== 'trial_active') return 0;
    
    const end = new Date(subscription.trialEnd);
    const now = new Date();
    const days = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    return Math.max(0, days);
  }

  async checkUsageLimit(userId, resourceType) {
    try {
      const usage = await api.checkUsage(userId, resourceType);
      return usage;
    } catch (error) {
      console.error('Error checking usage:', error);
      return this.getDefaultUsageLimit(userId, resourceType);
    }
  }

  getDefaultUsageLimit(userId, resourceType) {
    const limits = {
      products: { current: 6, limit: 50 },
      suppliers: { current: 4, limit: 10 },
      scans: { current: 5, limit: 100 }
    };

    const data = limits[resourceType] || { current: 0, limit: 100 };
    return {
      current: data.current,
      limit: data.limit,
      remaining: Math.max(0, data.limit - data.current),
      percentageUsed: (data.current / data.limit) * 100
    };
  }

  async markNotificationSent(userId, notificationKey) {
    // Store in localStorage for demo
    const notifications = JSON.parse(localStorage.getItem(`notifications_${userId}`) || '{}');
    notifications[notificationKey] = true;
    localStorage.setItem(`notifications_${userId}`, JSON.stringify(notifications));
  }

  async upgradeToPaid(userId, planId, stripeCustomerId = null, stripeSubscriptionId = null) {
    try {
      const result = await api.upgradeSubscription(userId, planId);
      return result;
    } catch (error) {
      console.error('Upgrade error:', error);
      throw error;
    }
  }

  async createPaymentRecord(userId, amount, type, stripePaymentIntentId = null) {
    try {
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
      
      const payments = JSON.parse(localStorage.getItem(`payments_${userId}`) || '[]');
      payments.unshift(payment);
      localStorage.setItem(`payments_${userId}`, JSON.stringify(payments));
      
      return payment;
    } catch (error) {
      console.error('Create payment record error:', error);
      return null;
    }
  }

  async getPaymentHistory(userId, limitCount = 10) {
    try {
      const payments = await api.getPaymentHistory(userId);
      return payments.slice(0, limitCount);
    } catch (error) {
      console.error('Get payment history error:', error);
      const payments = JSON.parse(localStorage.getItem(`payments_${userId}`) || '[]');
      return payments.slice(0, limitCount);
    }
  }
}

export default new SubscriptionService();