// src/models/subscription.js

export const PLAN_TIERS = {
  FREE_TRIAL: {
    id: 'free_trial',
    name: 'Free Trial',
    durationDays: 14,
    maxProducts: 50,
    maxSuppliers: 10,
    maxScansPerMonth: 100,
    features: [
      'basic_scanning',
      'manual_entry',
      'email_support',
      'basic_inventory'
    ],
    price: 0,
    priceId: null
  },
  BASIC: {
    id: 'basic',
    name: 'Basic',
    price: 2500,
    maxProducts: 200,
    maxSuppliers: 25,
    maxScansPerMonth: 500,
    features: [
      'basic_scanning',
      'manual_entry',
      'flash_sales',
      'email_support',
      'basic_analytics',
      'supplier_tracking'
    ],
    priceId: 'price_basic_monthly',
    popular: false
  },
  PROFESSIONAL: {
    id: 'professional',
    name: 'Professional',
    price: 5900,
    maxProducts: 1000,
    maxSuppliers: 100,
    maxScansPerMonth: 2000,
    features: [
      'ocr_scanning',
      'barcode_scanning',
      'flash_sales',
      'supplier_returns',
      'advanced_analytics',
      'priority_support',
      'api_access',
      'multi_user',
      'export_data',
      'custom_reports'
    ],
    priceId: 'price_pro_monthly',
    popular: true
  },
  ENTERPRISE: {
    id: 'enterprise',
    name: 'Enterprise',
    price: 14900,
    maxProducts: Infinity,
    maxSuppliers: Infinity,
    maxScansPerMonth: Infinity,
    features: [
      'all_features',
      'custom_integration',
      'dedicated_support',
      'sla_guarantee',
      'training_session',
      'white_label',
      'unlimited_users'
    ],
    priceId: 'price_enterprise_monthly',
    popular: false
  }
}

export const SUBSCRIPTION_STATUS = {
  TRIAL_ACTIVE: 'trial_active',
  TRIAL_EXPIRED: 'trial_expired',
  ACTIVE: 'active',
  PAST_DUE: 'past_due',
  CANCELLED: 'cancelled',
  EXPIRED: 'expired'
}

export const FEATURE_NAMES = {
  basic_scanning: 'Basic Barcode Scanning',
  ocr_scanning: 'AI OCR Expiry Detection',
  barcode_scanning: 'Advanced Barcode Scanner',
  flash_sales: 'Flash Sale Automation',
  supplier_returns: 'Supplier Return Management',
  basic_analytics: 'Basic Analytics Dashboard',
  advanced_analytics: 'Advanced Analytics & Insights',
  priority_support: 'Priority Email Support',
  api_access: 'REST API Access',
  multi_user: 'Multi-User Access',
  export_data: 'Data Export (CSV/PDF)',
  custom_reports: 'Custom Report Builder'
}