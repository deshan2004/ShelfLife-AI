// src/components/subscription/SubscriptionGuard.jsx

import { useFeatureAccess } from '../../hooks/useFeatureAccess'
import UpgradePrompt from './UpgradePrompt'

const FEATURE_MAP = {
  'ocr-scan': 'canOCRScan',
  'barcode-scan': 'canBarcodeScan',
  'flash-sale': 'canFlashSale',
  'supplier-return': 'canSupplierReturn',
  'advanced-analytics': 'canAdvancedAnalytics',
  'multi-user': 'canMultiUser',
  'api-access': 'canAPIAccess',
  'export-data': 'canExportData'
}

function SubscriptionGuard({ 
  children, 
  feature,
  fallback = null,
  showUpgradePrompt = true,
  requiredPlan = null
}) {
  const { features, isLoading, subscription } = useFeatureAccess()
  
  if (isLoading) {
    return (
      <div className="guard-loading">
        <div className="loading-spinner-small"></div>
      </div>
    )
  }
  
  let hasAccess = true
  
  if (requiredPlan) {
    const planLevels = { FREE_TRIAL: 0, BASIC: 1, PROFESSIONAL: 2, ENTERPRISE: 3 }
    const currentLevel = planLevels[subscription?.planId] || 0
    const requiredLevel = planLevels[requiredPlan]
    hasAccess = currentLevel >= requiredLevel
  }
  
  if (feature && FEATURE_MAP[feature]) {
    hasAccess = features[FEATURE_MAP[feature]]
  }
  
  if (!hasAccess) {
    if (showUpgradePrompt) {
      return <UpgradePrompt feature={feature} subscription={subscription} />
    }
    return fallback || null
  }
  
  return children
}

export default SubscriptionGuard