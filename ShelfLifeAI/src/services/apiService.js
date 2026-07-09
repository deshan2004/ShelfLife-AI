// src/services/apiService.js
const API_URL = import.meta.env?.VITE_API_URL || 'http://localhost:5000';

export const api = {
  // ===== HEALTH =====
  async health() {
    const response = await fetch(`${API_URL}/api/health`);
    return response.json();
  },

  // ===== AUTH =====
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

  // ===== INVENTORY =====
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

  // ===== SUPPLIERS =====
  async getSuppliers(userId) {
    const response = await fetch(`${API_URL}/api/suppliers/${userId}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch suppliers');
    }
    return response.json();
  },

  async addSupplier(userId, supplierData) {
    const response = await fetch(`${API_URL}/api/suppliers/${userId}/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ supplier: supplierData })
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to add supplier');
    }
    return response.json();
  },

  async updateSupplier(userId, supplierId, updates) {
    const response = await fetch(`${API_URL}/api/suppliers/${userId}/update`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ supplierId, updates })
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update supplier');
    }
    return response.json();
  },

  async deleteSupplier(userId, supplierId) {
    const response = await fetch(`${API_URL}/api/suppliers/${userId}/delete/${supplierId}`, {
      method: 'DELETE'
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete supplier');
    }
    return response.json();
  },

  // ===== SUBSCRIPTION =====
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

  // ===== SCANS =====
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

  // ===== PAYMENTS =====
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

  // ===== DASHBOARD & ANALYTICS =====
  async getDashboard(userId) {
    const response = await fetch(`${API_URL}/api/dashboard/${userId}`);
    return response.json();
  },

  async getAnalytics(userId) {
    const response = await fetch(`${API_URL}/api/analytics/${userId}`);
    return response.json();
  },

  // ===== USAGE =====
  async checkUsage(userId, type) {
    const response = await fetch(`${API_URL}/api/usage/${userId}/${type}`);
    return response.json();
  }
};