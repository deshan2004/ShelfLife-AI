/**
 * Advanced OCR Helper - Production-ready expiry date detection
 * Uses Tesseract.js for OCR processing
 */

// Load Tesseract dynamically to avoid initial bundle size
let Tesseract = null

/**
 * Initialize Tesseract (lazy load)
 */
const initTesseract = async () => {
  if (!Tesseract) {
    Tesseract = await import('tesseract.js')
  }
  return Tesseract
}

/**
 * Extract text from image using Tesseract.js
 * @param {string} imageData - Base64 image data or image URL
 * @returns {Promise<string>} - Extracted text
 */
export const extractTextFromImage = async (imageData) => {
  try {
    const TesseractModule = await initTesseract()
    
    const result = await TesseractModule.default.recognize(
      imageData,
      'eng',
      {
        logger: (m) => {
          // Optional: log progress
          if (m.status === 'recognizing text') {
            console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`)
          }
        }
      }
    )
    
    return result.data.text
  } catch (error) {
    console.error('OCR Error:', error)
    throw new Error('Failed to extract text from image')
  }
}

/**
 * Parse expiry date from OCR text
 * @param {string} text - Raw text from OCR
 * @returns {Object} - Parsed date information
 */
export const parseExpiryDateFromText = (text) => {
  if (!text) return { isValid: false, error: 'No text provided' }
  
  // Common expiry date patterns
  const patterns = [
    // Standard formats
    { regex: /(?:exp|expiry|expiration|best before|use by)[:\s]*(\d{4}[-/]\d{1,2}[-/]\d{1,2})/i, format: 'yyyy-mm-dd' },
    { regex: /(?:exp|expiry|expiration|best before|use by)[:\s]*(\d{1,2}[-/]\d{1,2}[-/]\d{4})/i, format: 'dd-mm-yyyy' },
    { regex: /(?:exp|expiry|expiration|best before|use by)[:\s]*(\d{1,2}[-/]\d{1,2}[-/]\d{2})/i, format: 'dd-mm-yy' },
    
    // Just date formats
    { regex: /(\d{4})[-/](\d{1,2})[-/](\d{1,2})/, format: 'yyyy-mm-dd' },
    { regex: /(\d{1,2})[-/](\d{1,2})[-/](\d{4})/, format: 'dd-mm-yyyy' },
    { regex: /(\d{1,2})[-/](\d{1,2})[-/](\d{2})/, format: 'dd-mm-yy' },
    
    // Month name formats
    { regex: /(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{4})/i, format: 'dd-mon-yyyy' },
    { regex: /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{1,2}),?\s+(\d{4})/i, format: 'mon-dd-yyyy' },
    
    // Compact formats
    { regex: /(\d{6})/, format: 'mmddyy' },
    { regex: /(\d{8})/, format: 'mmddyyyy' }
  ]
  
  for (const pattern of patterns) {
    const match = text.match(pattern.regex)
    if (match) {
      let date = null
      
      switch (pattern.format) {
        case 'yyyy-mm-dd':
          date = new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]))
          break
        case 'dd-mm-yyyy':
          date = new Date(parseInt(match[3]), parseInt(match[2]) - 1, parseInt(match[1]))
          break
        case 'dd-mm-yy':
          date = new Date(2000 + parseInt(match[3]), parseInt(match[2]) - 1, parseInt(match[1]))
          break
        case 'dd-mon-yyyy': {
          const months = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 }
          const month = months[match[2].toLowerCase().slice(0, 3)]
          date = new Date(parseInt(match[3]), month, parseInt(match[1]))
          break
        }
        case 'mon-dd-yyyy': {
          const months = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 }
          const month = months[match[1].toLowerCase().slice(0, 3)]
          date = new Date(parseInt(match[3]), month, parseInt(match[2]))
          break
        }
        case 'mmddyy': {
          const mm = match[1].substring(0, 2)
          const dd = match[1].substring(2, 4)
          const yy = match[1].substring(4, 6)
          date = new Date(2000 + parseInt(yy), parseInt(mm) - 1, parseInt(dd))
          break
        }
        case 'mmddyyyy': {
          const mm = match[1].substring(0, 2)
          const dd = match[1].substring(2, 4)
          const yyyy = match[1].substring(4, 8)
          date = new Date(parseInt(yyyy), parseInt(mm) - 1, parseInt(dd))
          break
        }
      }
      
      if (date && !isNaN(date.getTime())) {
        // Check if date is reasonable (not too old or too far in future)
        const now = new Date()
        const minDate = new Date(now.getFullYear() - 5, now.getMonth(), now.getDate())
        const maxDate = new Date(now.getFullYear() + 2, now.getMonth(), now.getDate())
        
        if (date >= minDate && date <= maxDate) {
          return {
            isValid: true,
            date: date,
            formatted: date.toISOString().split('T')[0],
            raw: text,
            confidence: 0.9
          }
        }
      }
    }
  }
  
  return {
    isValid: false,
    error: 'No valid expiry date found in image',
    raw: text
  }
}

/**
 * Process image for expiry date detection
 * @param {string} imageData - Base64 image data
 * @param {Function} onProgress - Progress callback
 * @returns {Promise<Object>} - Detection result
 */
export const detectExpiryDateFromImage = async (imageData, onProgress) => {
  try {
    // Step 1: Extract text using OCR
    onProgress?.({ stage: 'ocr', message: 'Reading text from image...', progress: 30 })
    const extractedText = await extractTextFromImage(imageData)
    
    onProgress?.({ stage: 'parsing', message: 'Parsing date information...', progress: 70 })
    
    // Step 2: Parse expiry date from text
    const result = parseExpiryDateFromText(extractedText)
    
    onProgress?.({ stage: 'complete', message: 'Detection complete!', progress: 100 })
    
    return result
  } catch (error) {
    console.error('Expiry date detection error:', error)
    return {
      isValid: false,
      error: error.message || 'Failed to process image'
    }
  }
}

/**
 * Calculate days until expiry
 * @param {string} expiryDate - Expiry date in YYYY-MM-DD format
 * @returns {number} - Days left (negative if expired)
 */
export const calculateDaysLeft = (expiryDate) => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const expiry = new Date(expiryDate)
  expiry.setHours(0, 0, 0, 0)
  
  const diffTime = expiry - today
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
}

/**
 * Get status based on days left
 * @param {number} daysLeft - Days until expiry
 * @returns {Object} - Status object
 */
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