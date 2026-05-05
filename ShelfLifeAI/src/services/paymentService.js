// src/services/paymentService.js
import { api } from './apiService';
import subscriptionService from './subscriptionService';

class PaymentService {
  async createCheckoutSession(userId, planId, successUrl, cancelUrl) {
    console.log(`Creating checkout session for user ${userId} with plan ${planId}`);
    
    const planPrices = {
      BASIC: 2500,
      PROFESSIONAL: 5900,
      ENTERPRISE: 14900
    };
    
    // For demo, simulate checkout
    return {
      id: 'cs_demo_' + Date.now(),
      url: '#',
      planId: planId,
      amount: planPrices[planId]
    };
  }
  
  async redirectToCheckout(userId, planId) {
    try {
      const session = await this.createCheckoutSession(
        userId,
        planId,
        `${window.location.origin}/payment-success`,
        `${window.location.origin}/payment-cancel`
      );
      
      const planPrices = {
        BASIC: 2500,
        PROFESSIONAL: 5900,
        ENTERPRISE: 14900
      };
      
      const confirmed = window.confirm(
        `🛒 Upgrade to ${planId} Plan\n\n` +
        `Price: LKR ${planPrices[planId].toLocaleString()}/month\n\n` +
        `Click OK to complete your upgrade.`
      );
      
      if (confirmed) {
        const result = await api.processPayment(userId, planPrices[planId], planId);
        
        if (result.success) {
          await subscriptionService.upgradeToPaid(userId, planId);
          await subscriptionService.createPaymentRecord(userId, planPrices[planId], 'subscription');
          
          alert(`✅ Successfully upgraded to ${planId} plan!\n\nYour account has been updated.`);
          window.location.href = '/billing?success=true';
        }
      }
      
      return session;
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Payment processing failed. Please try again.');
      throw error;
    }
  }
  
  async createCustomerPortal(userId, returnUrl) {
    console.log(`Creating portal session for user ${userId}`);
    
    const action = window.confirm(
      'Manage your subscription\n\n' +
      'OK → View/Update subscription\n' +
      'Cancel → Return to billing'
    );
    
    if (action) {
      window.location.href = returnUrl;
    }
    
    return { url: returnUrl };
  }
}

export default new PaymentService();