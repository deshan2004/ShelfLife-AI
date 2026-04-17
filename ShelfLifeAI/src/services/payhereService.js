// src/services/payhereService.js (Simplified - No crypto-js needed)
import { PAYHERE_CONFIG, PLAN_PRICES } from '../config/payhereConfig';

class PayHereService {
  constructor() {
    this.pendingOrders = [];
    this.loadFromStorage();
  }

  loadFromStorage() {
    const stored = localStorage.getItem('payhere_pending_orders');
    if (stored) {
      this.pendingOrders = JSON.parse(stored);
    }
  }

  saveToStorage() {
    localStorage.setItem('payhere_pending_orders', JSON.stringify(this.pendingOrders));
  }

  generateOrderId(userId) {
    return `ORDER_${userId.substring(0, 8)}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  }

  initiatePayment(user, planId) {
    return new Promise((resolve, reject) => {
      try {
        const plan = PLAN_PRICES[planId];
        if (!plan) {
          reject(new Error('Invalid plan selected'));
          return;
        }

        if (!user || !user.uid) {
          reject(new Error('User not logged in'));
          return;
        }

        const orderId = this.generateOrderId(user.uid);
        
        const order = {
          id: orderId,
          userId: user.uid,
          planId: planId,
          planName: plan.name,
          amount: plan.price,
          status: 'pending',
          createdAt: new Date().toISOString()
        };
        
        this.pendingOrders.push(order);
        this.saveToStorage();

        const form = document.createElement('form');
        form.method = 'POST';
        form.action = PAYHERE_CONFIG.paymentUrl;
        form.target = '_blank';
        form.style.display = 'none';
        
        const fields = {
          merchant_id: PAYHERE_CONFIG.merchantId,
          return_url: PAYHERE_CONFIG.returnUrl,
          cancel_url: PAYHERE_CONFIG.cancelUrl,
          notify_url: PAYHERE_CONFIG.notifyUrl,
          order_id: orderId,
          items: `${plan.name} Subscription - Monthly`,
          currency: PAYHERE_CONFIG.currency,
          amount: plan.price.toString(),
          first_name: user.name?.split(' ')[0] || 'Demo',
          last_name: user.name?.split(' ')[1] || 'User',
          email: user.email,
          phone: user.phone || '0771234567',
          address: user.address || 'Colombo',
          city: 'Colombo',
          country: 'Sri Lanka',
          delivery_address: user.address || 'Colombo',
          delivery_city: 'Colombo',
          delivery_country: 'Sri Lanka'
        };
        
        if (PAYHERE_CONFIG.platform === 'sandbox') {
          fields.sandbox = 'true';
        }
        
        Object.keys(fields).forEach(key => {
          const input = document.createElement('input');
          input.type = 'hidden';
          input.name = key;
          input.value = fields[key];
          form.appendChild(input);
        });
        
        document.body.appendChild(form);
        console.log('Submitting payment:', { orderId, plan: plan.name, amount: plan.price });
        
        form.submit();
        document.body.removeChild(form);
        
        resolve({ success: true, orderId, order });
      } catch (error) {
        console.error('Payment error:', error);
        reject(error);
      }
    });
  }

  verifyPaymentFromUrl(params) {
    const { order_id, payment_id, status_code } = params;
    
    console.log('Verifying payment:', { order_id, payment_id, status_code });
    
    if (!order_id) {
      return { verified: false, success: false, error: 'No order ID provided' };
    }
    
    const orderIndex = this.pendingOrders.findIndex(o => o.id === order_id);
    
    if (orderIndex === -1) {
      return { verified: false, success: false, error: 'Order not found' };
    }
    
    const isSuccess = status_code === '2';
    
    if (isSuccess) {
      this.pendingOrders[orderIndex].status = 'completed';
      this.pendingOrders[orderIndex].paymentId = payment_id;
      this.pendingOrders[orderIndex].completedAt = new Date().toISOString();
      this.saveToStorage();
      
      return { 
        verified: true, 
        success: true, 
        order: this.pendingOrders[orderIndex],
        message: 'Payment completed successfully'
      };
    } else {
      this.pendingOrders[orderIndex].status = 'failed';
      this.pendingOrders[orderIndex].paymentId = payment_id;
      this.pendingOrders[orderIndex].failedAt = new Date().toISOString();
      this.saveToStorage();
      
      return { 
        verified: true, 
        success: false, 
        order: this.pendingOrders[orderIndex],
        message: 'Payment failed or cancelled'
      };
    }
  }

  getOrder(orderId) {
    return this.pendingOrders.find(o => o.id === orderId);
  }

  getUserOrders(userId) {
    return this.pendingOrders.filter(o => o.userId === userId);
  }

  getCompletedOrders(userId) {
    return this.pendingOrders.filter(o => o.userId === userId && o.status === 'completed');
  }

  clearOldOrders() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    this.pendingOrders = this.pendingOrders.filter(order => {
      const orderDate = new Date(order.createdAt);
      return orderDate > thirtyDaysAgo || order.status === 'pending';
    });
    
    this.saveToStorage();
  }
}

export default new PayHereService();