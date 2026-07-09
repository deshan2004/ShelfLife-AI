// src/services/apiService.js
const API_URL = import.meta.env?.VITE_API_URL || 'http://localhost:5000';

export const api = {
  // ===== HEALTH =====
  async health() {
    const response = await fetch(`${API_URL}/api/health`);
    return response.json();
  },

  // ===== INVENTORY =====
  async getInventory(userId) {
    if (!userId) throw new Error('User ID is required');
    const response = await fetch(`${API_URL}/api/inventory/${userId}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch inventory');
    }
    return response.json();
  },

  async addProduct(userId, product) {
    if (!userId) throw new Error('User ID is required');
    const response = await fetch(`${API_URL}/api/inventory/${userId}/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product })
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to add product');
    }
    return response.json();
  },

  async updateProduct(userId, itemId, updates) {
    if (!userId) throw new Error('User ID is required');
    const response = await fetch(`${API_URL}/api/inventory/${userId}/update`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemId, updates })
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update product');
    }
    return response.json();
  },

  async deleteProduct(userId, itemId) {
    if (!userId) throw new Error('User ID is required');
    const response = await fetch(`${API_URL}/api/inventory/${userId}/delete/${itemId}`, {
      method: 'DELETE'
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete product');
    }
    return response.json();
  },

  // ===== SUPPLIERS =====
  async getSuppliers(userId) {
    if (!userId) throw new Error('User ID is required');
    const response = await fetch(`${API_URL}/api/suppliers/${userId}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch suppliers');
    }
    return response.json();
  },

  async addSupplier(userId, supplierData) {
    if (!userId) throw new Error('User ID is required');
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
    if (!userId) throw new Error('User ID is required');
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
    if (!userId) throw new Error('User ID is required');
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
    if (!userId) throw new Error('User ID is required');
    const response = await fetch(`${API_URL}/api/subscription/${userId}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch subscription');
    }
    return response.json();
  },

  async upgradeSubscription(userId, planId) {
    if (!userId) throw new Error('User ID is required');
    const response = await fetch(`${API_URL}/api/subscription/upgrade`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, planId })
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to upgrade subscription');
    }
    return response.json();
  },

  // ===== SCANS =====
  async logScan(userId, scanData) {
    if (!userId) throw new Error('User ID is required');
    const response = await fetch(`${API_URL}/api/scans/${userId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(scanData)
    });
    return response.json();
  },

  async getScanHistory(userId) {
    if (!userId) throw new Error('User ID is required');
    const response = await fetch(`${API_URL}/api/scans/${userId}`);
    return response.json();
  },

  // ===== PAYMENTS =====
  async processPayment(userId, amount, planId, paymentId) {
    if (!userId) throw new Error('User ID is required');
    const response = await fetch(`${API_URL}/api/payments/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, amount, planId, paymentId })
    });
    return response.json();
  },

  async getPaymentHistory(userId) {
    if (!userId) throw new Error('User ID is required');
    const response = await fetch(`${API_URL}/api/payments/${userId}`);
    return response.json();
  },

  // ===== DASHBOARD & ANALYTICS =====
  async getDashboard(userId) {
    if (!userId) throw new Error('User ID is required');
    const response = await fetch(`${API_URL}/api/dashboard/${userId}`);
    return response.json();
  },

  async getAnalytics(userId) {
    if (!userId) throw new Error('User ID is required');
    const response = await fetch(`${API_URL}/api/analytics/${userId}`);
    return response.json();
  },

  // ===== USAGE =====
  async checkUsage(userId, type) {
    if (!userId) throw new Error('User ID is required');
    const response = await fetch(`${API_URL}/api/usage/${userId}/${type}`);
    return response.json();
  }
};