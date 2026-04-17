// src/config/payhereConfig.js
export const PAYHERE_CONFIG = {
  // Sandbox credentials - Get from https://sandbox.payhere.lk
  merchantId: "1235220", // Demo sandbox ID - Replace with yours after signup
  platform: "sandbox",
  
  // Payment URLs
  paymentUrl: "https://sandbox.payhere.lk/pay/checkout",
  
  // Return URLs
  returnUrl: `${window.location.origin}/payment-success`,
  cancelUrl: `${window.location.origin}/payment-cancel`,
  notifyUrl: `${window.location.origin}/api/payment/notify`,
  
  // Currency
  currency: "LKR"
};

// Plan pricing
export const PLAN_PRICES = {
  BASIC: { 
    price: 2500, 
    name: "Basic Plan",
    features: ["200 products", "25 suppliers", "Barcode scanning", "Basic analytics"]
  },
  PROFESSIONAL: { 
    price: 5900, 
    name: "Professional Plan",
    features: ["1000 products", "100 suppliers", "AI OCR scanning", "Flash sale automation", "Advanced analytics", "Priority support"]
  },
  ENTERPRISE: { 
    price: 14900, 
    name: "Enterprise Plan",
    features: ["Unlimited products", "Unlimited suppliers", "All features", "API access", "Multi-user access", "Dedicated support"]
  }
};

// Test card details for sandbox
export const TEST_CARDS = {
  visa: { number: "4123456789123456", cvv: "123", expiry: "12/25" },
  mastercard: { number: "5111111111111118", cvv: "123", expiry: "12/25" },
  amex: { number: "378282246310005", cvv: "1234", expiry: "12/25" }
};