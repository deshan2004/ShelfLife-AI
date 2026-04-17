// src/utils/advancedOCRHelper.js
export const detectExpiryDateFromImage = async (imageData, onProgress) => {
  try {
    onProgress?.({ stage: 'ocr', message: 'Reading text from image...', progress: 30 })
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    onProgress?.({ stage: 'parsing', message: 'Parsing date information...', progress: 70 })
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Mock OCR result for demo
    const mockDate = new Date()
    mockDate.setDate(mockDate.getDate() + 14)
    const formattedDate = mockDate.toISOString().split('T')[0]
    
    onProgress?.({ stage: 'complete', message: 'Detection complete!', progress: 100 })
    
    return {
      isValid: true,
      formatted: formattedDate,
      raw: `Best before: ${formattedDate}`,
      confidence: 0.95
    }
  } catch (error) {
    return {
      isValid: false,
      error: error.message || 'Failed to process image'
    }
  }
}

export const calculateDaysLeft = (expiryDate) => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const expiry = new Date(expiryDate)
  expiry.setHours(0, 0, 0, 0)
  const diffTime = expiry - today
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
}

export const getExpiryStatus = (daysLeft) => {
  if (daysLeft <= 0) {
    return { text: 'Expired', color: '#ef4444', severity: 'critical', icon: 'fa-skull-crosswalk' }
  }
  if (daysLeft <= 3) {
    return { text: 'Critical', color: '#ef4444', severity: 'critical', icon: 'fa-exclamation-triangle' }
  }
  if (daysLeft <= 7) {
    return { text: 'Near Expiry', color: '#f59e0b', severity: 'warning', icon: 'fa-clock' }
  }
  if (daysLeft <= 30) {
    return { text: 'Expiring Soon', color: '#eab308', severity: 'info', icon: 'fa-hourglass-half' }
  }
  return { text: 'Healthy', color: '#22c55e', severity: 'good', icon: 'fa-check-circle' }
}