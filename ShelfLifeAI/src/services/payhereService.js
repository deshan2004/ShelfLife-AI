// src/services/payhereService.js
import { PAYHERE_CONFIG, PLAN_PRICES } from '../config/payhereConfig';
import CryptoJS from 'crypto-js'; 

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

  generateMd5Hash(merchantId, orderId, amount, currency, merchantSecret) {
    const hashedSecret = CryptoJS.MD5(merchantSecret).toString().toUpperCase();
    
    const hashString = merchantId + orderId + amount + currency + hashedSecret;
    
    return CryptoJS.MD5(hashString).toString().toUpperCase();
  }

  initiatePayment(user, planId) {
    return new Promise((resolve, reject) => {
      try {
        const plan = PLAN_PRICES[planId];
        if (!plan) {
          reject(new Error('Invalid plan selected'));
          return;
        }

        if (!user || (!user.uid && !user.id)) { 
          reject(new Error('User not logged in or UID missing'));
          return;
        }

        const userId = user.uid || user.id; 
        const orderId = this.generateOrderId(userId);
        
        const formattedAmount = Number(plan.price).toLocaleString('en-us', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace(/,/g, '');
        
        const order = {
          id: orderId,
          userId: userId,
          planId: planId,
          planName: plan.name,
          amount: formattedAmount, // Save formatted amount
          status: 'pending',
          createdAt: new Date().toISOString()
        };
        
        this.pendingOrders.push(order);
        this.saveToStorage();

        // Create form
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = PAYHERE_CONFIG.paymentUrl; 
        form.target = '_blank';
        form.style.display = 'none';
        
        const firstName = user.name?.split(' ')[0] || 'Demo';
        const lastName = user.name?.split(' ').slice(1).join(' ') || 'User';
        
        // Generate Hash
        const hash = this.generateMd5Hash(
          PAYHERE_CONFIG.merchantId,
          orderId,
          formattedAmount, 
          PAYHERE_CONFIG.currency,
          PAYHERE_CONFIG.merchantSecret
        );
        
        const fields = {
          merchant_id: PAYHERE_CONFIG.merchantId,
          return_url: PAYHERE_CONFIG.returnUrl,
          cancel_url: PAYHERE_CONFIG.cancelUrl,
          notify_url: PAYHERE_CONFIG.notifyUrl,
          
          order_id: orderId,
          items: `${plan.name} Subscription - Monthly`,
          currency: PAYHERE_CONFIG.currency,
          amount: formattedAmount,
          
          first_name: firstName,
          last_name: lastName,
          email: user.email || 'test@example.com', 
          phone: user.phone || '0771234567', 
          address: user.address || 'No. 1, Galle Road, Colombo', 
          city: 'Colombo', 
          country: 'Sri Lanka', 
          
          custom_1: userId,
          custom_2: planId,
          hash: hash,
          // Sandbox mode parameter is usually handled by the URL, but kept for safety if needed
          sandbox: 'true' 
        };
        
        // Create hidden inputs
        Object.keys(fields).forEach(key => {
          const input = document.createElement('input');
          input.type = 'hidden';
          input.name = key;
          input.value = fields[key];
          form.appendChild(input);
        });
        
        document.body.appendChild(form);
        console.log('--- Initiating PayHere Payment ---');
        console.log('Order Details:', fields);
        console.log('Generated Hash:', hash);
        
        // Submit the form
        form.submit();
        
        setTimeout(() => {
          if (document.body.contains(form)) {
            document.body.removeChild(form);
          }
        }, 1000);
        
        resolve({ success: true, orderId, order });
      } catch (error) {
        console.error('Payment Error:', error);
        reject(error);
      }
    });
  }

  verifyPaymentFromUrl(params) {
    const { order_id, payment_id, status_code, md5sig } = params;
    
    console.log('Verifying payment:', params);
    
    if (!order_id) {
      return { verified: false, success: false, error: 'No order ID provided' };
    }
    
    const orderIndex = this.pendingOrders.findIndex(o => o.id === order_id);
    
    if (orderIndex === -1) {
      return { verified: false, success: false, error: 'Order not found' };
    }
    
    const order = this.pendingOrders[orderIndex];
    
    // Verify signature
    const expectedHash = this.generateMd5Hash(
      PAYHERE_CONFIG.merchantId,
      order_id,
      order.amount, 
      PAYHERE_CONFIG.currency,
      PAYHERE_CONFIG.merchantSecret
    );
    
    const isHashValid = md5sig === expectedHash;
    console.log('Hash validation result:', isHashValid);
    
    // status_code '2' means payment successful in PayHere
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