// src/services/apiService.js
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Helper function for API calls
const fetchApi = async (endpoint, options = {}) => {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const data = await response.json();
  if (!response.ok) {
    const errorMessage = data.error || data.details?.join(', ') || 'Something went wrong';
    throw new Error(errorMessage);
  }
  return data;
};

export const api = {
  // Health
  async health() {
    return fetchApi('/api/health');
  },

  // Inventory
  async getInventory(userId) {
    return fetchApi(`/api/inventory/${userId}`);
  },

  async addProduct(userId, product) {
    return fetchApi(`/api/inventory/${userId}/add`, {
      method: 'POST',
      body: JSON.stringify({ product }),
    });
  },

  async updateProduct(userId, itemId, updates) {
    return fetchApi(`/api/inventory/${userId}/update`, {
      method: 'PUT',
      body: JSON.stringify({ itemId, updates }),
    });
  },

  async deleteProduct(userId, itemId) {
    return fetchApi(`/api/inventory/${userId}/delete/${itemId}`, {
      method: 'DELETE',
    });
  },

  // Suppliers
  async getSuppliers(userId) {
    return fetchApi(`/api/suppliers/${userId}`);
  },

  async addSupplier(userId, supplier) {
    return fetchApi(`/api/suppliers/${userId}/add`, {
      method: 'POST',
      body: JSON.stringify(supplier),
    });
  },

  async updateSupplier(userId, supplierId, updates) {
    return fetchApi(`/api/suppliers/${userId}/update/${supplierId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  async deleteSupplier(userId, supplierId) {
    return fetchApi(`/api/suppliers/${userId}/delete/${supplierId}`, {
      method: 'DELETE',
    });
  },

  // Subscription
  async getSubscription(userId) {
    return fetchApi(`/api/subscription/${userId}`);
  },

  async upgradeSubscription(userId, planId) {
    return fetchApi('/api/subscription/upgrade', {
      method: 'POST',
      body: JSON.stringify({ userId, planId }),
    });
  },

  // Usage
  async checkUsage(userId, type) {
    return fetchApi(`/api/usage/${userId}/${type}`);
  },

  // Admin
  async adminGetUsers() {
    return fetchApi('/api/admin/users');
  },

  async adminUpdateRole(uid, role) {
    return fetchApi(`/api/admin/users/${uid}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    });
  },

  async adminDeleteUser(uid) {
    return fetchApi(`/api/admin/users/${uid}`, {
      method: 'DELETE',
    });
  },

  async adminExtendTrial(uid, days) {
    return fetchApi(`/api/admin/subscriptions/${uid}/extend`, {
      method: 'POST',
      body: JSON.stringify({ days }),
    });
  },

  async adminUpgradePlan(uid, planId) {
    return fetchApi(`/api/admin/subscriptions/${uid}/upgrade`, {
      method: 'POST',
      body: JSON.stringify({ planId }),
    });
  },
};