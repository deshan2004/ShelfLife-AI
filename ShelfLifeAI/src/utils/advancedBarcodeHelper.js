/**
 * Advanced Barcode Helper - Production-ready barcode scanning
 * Uses BarcodeDetector API when available, falls back to manual input
 */

// Check if BarcodeDetector API is supported
const isBarcodeDetectorSupported = () => {
  return 'BarcodeDetector' in window
}

/**
 * Detect barcode from video stream using BarcodeDetector API
 * @param {HTMLVideoElement} videoElement - The video element to scan
 * @returns {Promise<string|null>} - Detected barcode or null
 */
export const detectBarcodeFromVideo = async (videoElement) => {
  if (!isBarcodeDetectorSupported()) {
    console.warn('BarcodeDetector API not supported, using fallback')
    return null
  }

  try {
    const barcodeDetector = new BarcodeDetector({
      formats: ['qr_code', 'ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'code_93', 'codabar', 'itf']
    })
    
    const barcodes = await barcodeDetector.detect(videoElement)
    
    if (barcodes.length > 0) {
      return barcodes[0].rawValue
    }
    return null
  } catch (error) {
    console.error('Barcode detection error:', error)
    return null
  }
}

/**
 * Start continuous barcode scanning
 * @param {HTMLVideoElement} videoElement - The video element
 * @param {Function} onDetect - Callback when barcode is detected
 * @returns {Function} - Stop function
 */
export const startBarcodeScanner = (videoElement, onDetect) => {
  let scanning = true
  let lastDetected = null
  let debounceTimeout = null

  const scan = async () => {
    if (!scanning) return
    
    try {
      const barcode = await detectBarcodeFromVideo(videoElement)
      
      if (barcode && barcode !== lastDetected) {
        // Debounce to avoid multiple detections
        if (debounceTimeout) clearTimeout(debounceTimeout)
        
        debounceTimeout = setTimeout(() => {
          lastDetected = barcode
          onDetect(barcode)
        }, 500)
      }
    } catch (error) {
      console.error('Scan error:', error)
    }
    
    // Continue scanning
    requestAnimationFrame(scan)
  }
  
  scan()
  
  // Return stop function
  return () => {
    scanning = false
    if (debounceTimeout) clearTimeout(debounceTimeout)
  }
}

/**
 * Validate barcode format
 * @param {string} barcode - The barcode to validate
 * @returns {boolean} - True if valid
 */
export const isValidBarcode = (barcode) => {
  if (!barcode) return false
  
  // Common barcode formats
  const patterns = [
    /^\d{8}$/,      // EAN-8
    /^\d{13}$/,     // EAN-13
    /^\d{12}$/,     // UPC-A
    /^\d{6}$/,      // UPC-E
    /^[A-Z0-9]{8,}$/ // Code 128/39
  ]
  
  return patterns.some(pattern => pattern.test(barcode))
}

/**
 * Format barcode for display
 * @param {string} barcode - Raw barcode
 * @returns {string} - Formatted barcode
 */
export const formatBarcode = (barcode) => {
  if (!barcode) return ''
  
  // Add spaces every 4 digits for readability
  if (/^\d+$/.test(barcode)) {
    return barcode.replace(/(\d{4})(?=\d)/g, '$1 ')
  }
  return barcode
}

/**
 * Mock barcode database for demo
 */
export const barcodeDatabase = {
  '8901234567890': {
    name: 'Fresh Milk (1L)',
    brand: 'Dairy Fresh',
    category: 'Dairy',
    defaultPrice: 350,
    defaultCost: 280,
    unit: '1L'
  },
  '8901234567891': {
    name: 'Greek Yogurt',
    brand: 'Yogurt Delight',
    category: 'Dairy',
    defaultPrice: 220,
    defaultCost: 180,
    unit: '500g'
  },
  '8901234567892': {
    name: 'Whole Wheat Bread',
    brand: 'Bakery Fresh',
    category: 'Bakery',
    defaultPrice: 150,
    defaultCost: 120,
    unit: '400g'
  },
  '5901234123457': {
    name: 'Organic Orange Juice',
    brand: 'Nature\'s Best',
    category: 'Beverages',
    defaultPrice: 280,
    defaultCost: 220,
    unit: '1L'
  }
}

/**
 * Lookup product by barcode
 * @param {string} barcode - Barcode to lookup
 * @returns {Promise<Object|null>} - Product info
 */
export const lookupProductByBarcode = async (barcode) => {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 300))
  return barcodeDatabase[barcode] || null
}