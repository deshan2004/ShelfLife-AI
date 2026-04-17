// src/services/paymentService.js
import subscriptionService from './subscriptionService';

class PaymentService {
  
  // Create checkout session for subscription (Demo version)
  async createCheckoutSession(userId, planId, successUrl, cancelUrl) {
    console.log(`Creating checkout session for user ${userId} with plan ${planId}`);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Demo: Create a fake session
    return {
      id: 'cs_demo_' + Date.now(),
      url: '#',
      planId: planId
    };
  }
  
  // Redirect to checkout (Demo version)
  async redirectToCheckout(userId, planId) {
    try {
      const session = await this.createCheckoutSession(
        userId,
        planId,
        `${window.location.origin}/payment-success`,
        `${window.location.origin}/payment-cancel`
      );
      
      // Show demo upgrade modal instead of actual payment
      const planPrices = {
        BASIC: 2500,
        PROFESSIONAL: 5900,
        ENTERPRISE: 14900
      };
      
      const confirmed = window.confirm(
        `🛒 DEMO MODE\n\n` +
        `Upgrading to ${planId} plan for LKR ${planPrices[planId].toLocaleString()}/month\n\n` +
        `Click OK to simulate successful payment and upgrade.\n` +
        `Click Cancel to return.`
      );
      
      if (confirmed) {
        // Simulate payment success
        await subscriptionService.upgradeToPaid(
          userId,
          planId,
          'cus_demo_' + Date.now(),
          'sub_demo_' + Date.now()
        );
        
        await subscriptionService.createPaymentRecord(
          userId,
          planPrices[planId],
          'subscription',
          'pi_demo_' + Date.now()
        );
        
        alert(`✅ Successfully upgraded to ${planId} plan!\n\nYour account has been updated. Redirecting...`);
        window.location.href = '/billing?success=true';
      }
      
      return session;
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Payment processing failed. Please try again.');
      throw error;
    }
  }
  
  // Create customer portal session (Demo version)
  async createCustomerPortal(userId, returnUrl) {
    console.log(`Creating portal session for user ${userId}`);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Show demo portal options
    const action = window.confirm(
      '🛒 DEMO MODE - Billing Portal\n\n' +
      'What would you like to do?\n\n' +
      'OK → Simulate updating payment method\n' +
      'Cancel → Simulate canceling subscription'
    );
    
    if (action) {
      alert('✅ Demo: Payment method updated successfully!');
    } else {
      const confirmCancel = window.confirm('Are you sure you want to cancel your subscription?');
      if (confirmCancel) {
        await subscriptionService.cancelSubscription(userId);
        alert('❌ Subscription cancelled. You will lose access at the end of your billing period.');
        window.location.href = returnUrl;
      }
    }
    
    return { url: returnUrl };
  }
  
  // Simulate webhook handling
  async simulatePaymentSuccess(userId, planId) {
    const planPrices = {
      BASIC: 2500,
      PROFESSIONAL: 5900,
      ENTERPRISE: 14900
    };
    
    await subscriptionService.upgradeToPaid(userId, planId);
    await subscriptionService.createPaymentRecord(userId, planPrices[planId], 'subscription');
    
    return { success: true };
  }
}

export default new PaymentService();