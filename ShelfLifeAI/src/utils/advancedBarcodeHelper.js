// src/utils/advancedBarcodeHelper.js
export const startBarcodeScanner = (videoElement, onDetect) => {
  let scanning = true
  let lastDetected = null
  let debounceTimeout = null

  const scan = async () => {
    if (!scanning) return
    
    try {
      // Simulate barcode detection for demo
      // In production, use actual BarcodeDetector API
      const mockBarcode = Math.random() > 0.95 ? '8901234567890' : null
      
      if (mockBarcode && mockBarcode !== lastDetected) {
        if (debounceTimeout) clearTimeout(debounceTimeout)
        
        debounceTimeout = setTimeout(() => {
          lastDetected = mockBarcode
          onDetect(mockBarcode)
        }, 500)
      }
    } catch (error) {
      console.error('Scan error:', error)
    }
    
    requestAnimationFrame(scan)
  }
  
  scan()
  
  return () => {
    scanning = false
    if (debounceTimeout) clearTimeout(debounceTimeout)
  }
}

export const isValidBarcode = (barcode) => {
  if (!barcode) return false
  const patterns = [
    /^\d{8}$/,
    /^\d{13}$/,
    /^\d{12}$/,
    /^\d{6}$/,
    /^[A-Z0-9]{8,}$/
  ]
  return patterns.some(pattern => pattern.test(barcode))
}

export const formatBarcode = (barcode) => {
  if (!barcode) return ''
  if (/^\d+$/.test(barcode)) {
    return barcode.replace(/(\d{4})(?=\d)/g, '$1 ')
  }
  return barcode
}

export const barcodeDatabase = {
  '8901234567890': {
    name: 'Fresh Milk (1L)',
    brand: 'Dairy Fresh',
    category: 'Dairy',
    defaultPrice: 350,
    defaultCost: 280
  },
  '8901234567891': {
    name: 'Greek Yogurt',
    brand: 'Yogurt Delight',
    category: 'Dairy',
    defaultPrice: 220,
    defaultCost: 180
  },
  '8901234567892': {
    name: 'Whole Wheat Bread',
    brand: 'Bakery Fresh',
    category: 'Bakery',
    defaultPrice: 150,
    defaultCost: 120
  }
}

export const lookupProductByBarcode = async (barcode) => {
  await new Promise(resolve => setTimeout(resolve, 300))
  return barcodeDatabase[barcode] || null
}