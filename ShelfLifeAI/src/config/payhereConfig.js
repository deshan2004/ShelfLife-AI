// src/config/payhereConfig.js
export const PAYHERE_CONFIG = {
  merchantId: import.meta.env.VITE_PAYHERE_MERCHANT_ID || "1235220",
  merchantSecret: import.meta.env.VITE_PAYHERE_MERCHANT_SECRET || "",
  platform: import.meta.env.VITE_PAYHERE_PLATFORM || "sandbox",
  paymentUrl: import.meta.env.VITE_PAYHERE_PLATFORM === "sandbox" 
    ? "https://sandbox.payhere.lk/pay/checkout" 
    : "https://www.payhere.lk/pay/checkout",
  returnUrl: `${window.location.origin}/payment-success`,
  cancelUrl: `${window.location.origin}/payment-cancel`,
  notifyUrl: `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/payment/notify`,
  currency: "LKR"
};

export const PLAN_PRICES = {
  BASIC: { price: 2500, name: "Basic Plan", features: ["200 products", "25 suppliers", "Barcode scanning"] },
  PROFESSIONAL: { price: 5900, name: "Professional Plan", features: ["1000 products", "100 suppliers", "AI OCR scanning", "Flash sale automation"] },
  ENTERPRISE: { price: 14900, name: "Enterprise Plan", features: ["Unlimited products", "Unlimited suppliers", "All features", "API access"] }
};