// src/hooks/useFeatureAccess.js
import { useState, useEffect, useCallback } from 'react';
import subscriptionService from '../services/subscriptionService';

export function useFeatureAccess() {
  const [features, setFeatures] = useState({
    canBasicScan: false,
    canOCRScan: false,
    canBarcodeScan: false,
    canFlashSale: false,
    canSupplierReturn: false,
    canBasicAnalytics: false,
    canAdvancedAnalytics: false,
    canPrioritySupport: false,
    canAPIAccess: false,
    canMultiUser: false,
    canExportData: false,
    canCustomReports: false,
    isLoading: true
  });
  
  const [usage, setUsage] = useState({
    productsUsed: 0,
    productsLimit: 0,
    productsRemaining: 0,
    productsPercentage: 0,
    suppliersUsed: 0,
    suppliersLimit: 0,
    suppliersRemaining: 0,
    scansUsed: 0,
    scansLimit: 0,
    scansRemaining: 0,
    isLoading: true
  });
  
  const [subscription, setSubscription] = useState(null);
  const [trialDaysLeft, setTrialDaysLeft] = useState(0);
  
  const loadAccess = useCallback(async () => {
    const user = JSON.parse(localStorage.getItem('shelflife_user'));
    
    if (!user || !user.uid) {
      setFeatures(prev => ({ ...prev, isLoading: false }));
      setUsage(prev => ({ ...prev, isLoading: false }));
      return;
    }
    
    try {
      const sub = await subscriptionService.getSubscriptionStatus(user.uid);
      const daysLeft = await subscriptionService.getTrialDaysLeft(user.uid);
      
      const productsCheck = await subscriptionService.checkUsageLimit(user.uid, 'products');
      const suppliersCheck = await subscriptionService.checkUsageLimit(user.uid, 'suppliers');
      const scansCheck = await subscriptionService.checkUsageLimit(user.uid, 'scans');
      
      const isTrialActive = sub?.status === 'trial_active';
      const isActive = sub?.status === 'active';
      const planId = sub?.planId;
      
      // ENABLE OCR FOR TESTING DURING TRIAL
      // Set to false for production
      const ENABLE_OCR_FOR_TESTING = true;
      
      let featureMap = {
        canBasicScan: isTrialActive || isActive,
        canOCRScan: ENABLE_OCR_FOR_TESTING || isActive || (isTrialActive && planId === 'FREE_TRIAL'),
        canBarcodeScan: isTrialActive || isActive,
        canFlashSale: isTrialActive || isActive,
        canSupplierReturn: false,
        canBasicAnalytics: isTrialActive || isActive,
        canAdvancedAnalytics: false,
        canPrioritySupport: false,
        canAPIAccess: false,
        canMultiUser: false,
        canExportData: false,
        canCustomReports: false,
        isLoading: false
      };
      
      if (isActive) {
        if (planId === 'PROFESSIONAL' || planId === 'ENTERPRISE') {
          featureMap.canOCRScan = true;
          featureMap.canSupplierReturn = true;
          featureMap.canAdvancedAnalytics = true;
          featureMap.canPrioritySupport = true;
          featureMap.canExportData = true;
        }
        if (planId === 'ENTERPRISE') {
          featureMap.canAPIAccess = true;
          featureMap.canMultiUser = true;
          featureMap.canCustomReports = true;
        }
      }
      
      setFeatures(featureMap);
      
      setUsage({
        productsUsed: productsCheck.current,
        productsLimit: productsCheck.limit,
        productsRemaining: productsCheck.remaining,
        productsPercentage: productsCheck.percentageUsed,
        suppliersUsed: suppliersCheck.current,
        suppliersLimit: suppliersCheck.limit,
        suppliersRemaining: suppliersCheck.remaining,
        scansUsed: scansCheck.current,
        scansLimit: scansCheck.limit,
        scansRemaining: scansCheck.remaining,
        isLoading: false
      });
      
      setSubscription(sub);
      setTrialDaysLeft(daysLeft);
    } catch (error) {
      console.error('Error loading access:', error);
      setFeatures(prev => ({ ...prev, isLoading: false }));
      setUsage(prev => ({ ...prev, isLoading: false }));
    }
  }, []);
  
  useEffect(() => {
    loadAccess();
  }, [loadAccess]);
  
  const refresh = useCallback(() => {
    loadAccess();
  }, [loadAccess]);
  
  const canAddProduct = usage.productsRemaining > 0 || subscription?.status === 'active';
  const isTrialActive = subscription?.status === 'trial_active';
  const isTrialExpired = subscription?.status === 'trial_expired';
  const isSubscribed = subscription?.status === 'active';
  const isPastDue = subscription?.status === 'past_due';
  
  return {
    features,
    usage,
    subscription,
    trialDaysLeft,
    canAddProduct,
    isTrialActive,
    isTrialExpired,
    isSubscribed,
    isPastDue,
    refresh
  };
}