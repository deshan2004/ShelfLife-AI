// src/services/apiService.js
const API_URL = import.meta.env.VITE_API_URL || '/api';

export const api = {
  async health() {
    const response = await fetch(`${API_URL}/health`);
    return response.json();
  },

  // ============================================================
  // SUPPLIER ENDPOINTS
  // ============================================================
  async getSuppliers(userId) {
    const response = await fetch(`${API_URL}/suppliers/${userId}`);
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Server error: ${text}`);
    }
    return response.json();
  },

  async addSupplier(userId, supplier) {
    const response = await fetch(`${API_URL}/suppliers/${userId}/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(supplier)
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Server error: ${text}`);
    }
    return response.json();
  },

  async updateSupplier(userId, supplierId, updates) {
    const response = await fetch(`${API_URL}/suppliers/${userId}/update/${supplierId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Server error: ${text}`);
    }
    return response.json();
  },

  async deleteSupplier(userId, supplierId) {
    const response = await fetch(`${API_URL}/suppliers/${userId}/delete/${supplierId}`, {
      method: 'DELETE'
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Server error: ${text}`);
    }
    return response.json();
  },

  // ============================================================
  // INVENTORY ENDPOINTS
  // ============================================================
  async getInventory(userId) {
    const response = await fetch(`${API_URL}/inventory/${userId}`);
    return response.json();
  },

  async addProduct(userId, product) {
    const response = await fetch(`${API_URL}/inventory/${userId}/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product })
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to add product');
    }
    return data;
  },

  async updateProduct(userId, itemId, updates) {
    const response = await fetch(`${API_URL}/inventory/${userId}/update`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemId, updates })
    });
    return response.json();
  },

  async deleteProduct(userId, itemId) {
    const response = await fetch(`${API_URL}/inventory/${userId}/delete/${itemId}`, {
      method: 'DELETE'
    });
    return response.json();
  },

  // ============================================================
  // SUBSCRIPTION ENDPOINTS
  // ============================================================
  async getSubscription(userId) {
    const response = await fetch(`${API_URL}/subscription/${userId}`);
    return response.json();
  },

  async upgradeSubscription(userId, planId) {
    const response = await fetch(`${API_URL}/subscription/upgrade`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, planId })
    });
    return response.json();
  },

  // ============================================================
  // USAGE CHECK
  // ============================================================
  async checkUsage(userId, type) {
    const response = await fetch(`${API_URL}/usage/${userId}/${type}`);
    return response.json();
  },

  // ============================================================
  // PAYMENT ENDPOINTS
  // ============================================================
  async processPayment(userId, amount, planId) {
    const response = await fetch(`${API_URL}/payment/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, amount, planId })
    });
    return response.json();
  },

  async getPaymentHistory(userId) {
    const response = await fetch(`${API_URL}/payment/history/${userId}`);
    return response.json();
  }
};