// src/services/apiService.js
const API_URL = import.meta.env?.VITE_API_URL || 'http://localhost:5000';

export const api = {
  // Health check
  async health() {
    const response = await fetch(`${API_URL}/api/health`);
    return response.json();
  },
  
  // Auth endpoints
  async signup(data) {
    const response = await fetch(`${API_URL}/api/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Signup failed');
    }
    return response.json();
  },
  
  async login(idToken) {
    const response = await fetch(`${API_URL}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken })
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Login failed');
    }
    return response.json();
  },
  
  async socialLogin(data) {
    const response = await fetch(`${API_URL}/api/social-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.json();
  },
  
  // Inventory endpoints
  async getInventory(userId) {
    const response = await fetch(`${API_URL}/api/inventory/${userId}`);
    return response.json();
  },
  
  async addProduct(userId, product) {
    const response = await fetch(`${API_URL}/api/inventory/${userId}/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product })
    });
    return response.json();
  },
  
  async updateProduct(userId, itemId, updates) {
    const response = await fetch(`${API_URL}/api/inventory/${userId}/update`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemId, updates })
    });
    return response.json();
  },
  
  async deleteProduct(userId, itemId) {
    const response = await fetch(`${API_URL}/api/inventory/${userId}/delete/${itemId}`, {
      method: 'DELETE'
    });
    return response.json();
  },
  
  // Subscription endpoints
  async getSubscription(userId) {
    const response = await fetch(`${API_URL}/api/subscription/${userId}`);
    return response.json();
  },
  
  async upgradeSubscription(userId, planId) {
    const response = await fetch(`${API_URL}/api/subscription/upgrade`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, planId })
    });
    return response.json();
  },
  
  // Scan endpoints
  async logScan(userId, scanData) {
    const response = await fetch(`${API_URL}/api/scans/${userId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(scanData)
    });
    return response.json();
  },
  
  async getScanHistory(userId) {
    const response = await fetch(`${API_URL}/api/scans/${userId}`);
    return response.json();
  },
  
  // Payment endpoints
  async processPayment(userId, amount, planId, paymentId) {
    const response = await fetch(`${API_URL}/api/payments/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, amount, planId, paymentId })
    });
    return response.json();
  },
  
  async getPaymentHistory(userId) {
    const response = await fetch(`${API_URL}/api/payments/${userId}`);
    return response.json();
  },
  
  // Dashboard and Analytics
  async getDashboard(userId) {
    const response = await fetch(`${API_URL}/api/dashboard/${userId}`);
    return response.json();
  },
  
  async getAnalytics(userId) {
    const response = await fetch(`${API_URL}/api/analytics/${userId}`);
    return response.json();
  },
  
  // Usage check
  async checkUsage(userId, type) {
    const response = await fetch(`${API_URL}/api/usage/${userId}/${type}`);
    return response.json();
  }
};