// src/components/Payment/PaymentModal.jsx
import { useState } from 'react'
import './PaymentModal.css'

function PaymentModal({ isOpen, onClose, plan, user, onSuccess }) {
  const [paymentMethod, setPaymentMethod] = useState('card')
  const [cardDetails, setCardDetails] = useState({
    number: '',
    expiry: '',
    cvv: '',
    name: ''
  })
  const [processing, setProcessing] = useState(false)

  if (!isOpen) return null

  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '')
    const matches = v.match(/\d{4,16}/g)
    const match = matches && matches[0] || ''
    const parts = []
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4))
    }
    if (parts.length) {
      return parts.join(' ')
    } else {
      return value
    }
  }

  const formatExpiry = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '')
    if (v.length >= 2) {
      return v.substring(0, 2) + (v.length > 2 ? '/' + v.substring(2, 4) : '')
    }
    return v
  }

  const handleCardNumberChange = (e) => {
    const formatted = formatCardNumber(e.target.value)
    setCardDetails({ ...cardDetails, number: formatted })
  }

  const handleExpiryChange = (e) => {
    const formatted = formatExpiry(e.target.value)
    setCardDetails({ ...cardDetails, expiry: formatted })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setProcessing(true)
    
    // Validate card details
    if (paymentMethod === 'card') {
      if (cardDetails.number.replace(/\s/g, '').length < 16) {
        alert('Please enter a valid card number')
        setProcessing(false)
        return
      }
      if (cardDetails.expiry.length < 5) {
        alert('Please enter a valid expiry date')
        setProcessing(false)
        return
      }
      if (cardDetails.cvv.length < 3) {
        alert('Please enter a valid CVV')
        setProcessing(false)
        return
      }
      if (!cardDetails.name.trim()) {
        alert('Please enter cardholder name')
        setProcessing(false)
        return
      }
    }
    
    // Simulate payment processing
    setTimeout(() => {
      setProcessing(false)
      onSuccess()
    }, 2000)
  }

  return (
    <div className="payment-modal-overlay" onClick={onClose}>
      <div className="payment-modal" onClick={(e) => e.stopPropagation()}>
        <button className="payment-modal-close" onClick={onClose}>✕</button>
        
        <div className="payment-modal-header">
          <div className="payment-logo">
            <i className="fas fa-leaf"></i>
            <span>ShelfLife <span className="logo-ai">AI</span></span>
          </div>
          <div className="payment-amount">
            <span className="amount-label">Total Amount</span>
            <span className="amount-value">LKR {plan.price.toLocaleString()}</span>
            <span className="amount-period">/month</span>
          </div>
        </div>
        
        <div className="payment-modal-body">
          <div className="payment-plan-info">
            <div className="plan-icon">
              <i className="fas fa-crown"></i>
            </div>
            <div>
              <h3>{plan.name} Plan</h3>
              <p>Monthly subscription • Premium features</p>
            </div>
          </div>
          
          <div className="payment-methods">
            <div className="payment-methods-header">
              <i className="fas fa-credit-card"></i>
              <span>Pay with</span>
            </div>
            
            <div className="payment-methods-grid">
              <button 
                className={`payment-method-btn ${paymentMethod === 'card' ? 'active' : ''}`}
                onClick={() => setPaymentMethod('card')}
              >
                <i className="fas fa-credit-card"></i>
                <span>Card</span>
              </button>
              <button 
                className={`payment-method-btn ${paymentMethod === 'mobile' ? 'active' : ''}`}
                onClick={() => setPaymentMethod('mobile')}
              >
                <i className="fas fa-mobile-alt"></i>
                <span>Mobile</span>
              </button>
              <button 
                className={`payment-method-btn ${paymentMethod === 'bank' ? 'active' : ''}`}
                onClick={() => setPaymentMethod('bank')}
              >
                <i className="fas fa-university"></i>
                <span>Bank</span>
              </button>
            </div>
          </div>
          
          {paymentMethod === 'card' && (
            <form onSubmit={handleSubmit} className="payment-form">
              <div className="card-icons">
                <i className="fab fa-cc-visa"></i>
                <i className="fab fa-cc-mastercard"></i>
                <i className="fab fa-cc-amex"></i>
                <i className="fab fa-cc-discover"></i>
                <i className="fab fa-cc-jcb"></i>
                <i className="fab fa-cc-apple-pay"></i>
                <i className="fab fa-google-pay"></i>
              </div>
              
              <div className="form-group">
                <label>Card Number</label>
                <div className="input-with-icon">
                  <i className="fas fa-credit-card"></i>
                  <input 
                    type="text" 
                    placeholder="1234 5678 9012 3456"
                    value={cardDetails.number}
                    onChange={handleCardNumberChange}
                    maxLength="19"
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Expiry Date</label>
                  <div className="input-with-icon">
                    <i className="fas fa-calendar"></i>
                    <input 
                      type="text" 
                      placeholder="MM/YY"
                      value={cardDetails.expiry}
                      onChange={handleExpiryChange}
                      maxLength="5"
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>CVV</label>
                  <div className="input-with-icon">
                    <i className="fas fa-lock"></i>
                    <input 
                      type="password" 
                      placeholder="123"
                      value={cardDetails.cvv}
                      onChange={(e) => setCardDetails({...cardDetails, cvv: e.target.value})}
                      maxLength="4"
                    />
                  </div>
                </div>
              </div>
              
              <div className="form-group">
                <label>Cardholder Name</label>
                <div className="input-with-icon">
                  <i className="fas fa-user"></i>
                  <input 
                    type="text" 
                    placeholder="John Doe"
                    value={cardDetails.name}
                    onChange={(e) => setCardDetails({...cardDetails, name: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="payment-secure">
                <i className="fas fa-lock"></i>
                <span>Your payment is secure and encrypted</span>
              </div>
              
              <button type="submit" className="btn-pay" disabled={processing}>
                {processing ? (
                  <><i className="fas fa-spinner fa-pulse"></i> Processing...</>
                ) : (
                  <><i className="fas fa-check-circle"></i> Pay LKR {plan.price.toLocaleString()}</>
                )}
              </button>
            </form>
          )}
          
          {paymentMethod === 'mobile' && (
            <div className="mobile-payment">
              <div className="mobile-options">
                <div className="mobile-option">
                  <i className="fab fa-google-pay"></i>
                  <span>Google Pay</span>
                </div>
                <div className="mobile-option">
                  <i className="fab fa-apple-pay"></i>
                  <span>Apple Pay</span>
                </div>
                <div className="mobile-option">
                  <i className="fas fa-mobile-alt"></i>
                  <span>Wallet</span>
                </div>
              </div>
              <div className="mobile-number-input">
                <label>Mobile Number</label>
                <input type="tel" placeholder="+94 XX XXX XXXX" />
              </div>
              <button className="btn-pay" onClick={handleSubmit} disabled={processing}>
                {processing ? (
                  <><i className="fas fa-spinner fa-pulse"></i> Processing...</>
                ) : (
                  <><i className="fas fa-mobile-alt"></i> Pay with Mobile</>
                )}
              </button>
            </div>
          )}
          
          {paymentMethod === 'bank' && (
            <div className="bank-payment">
              <div className="bank-info">
                <div className="bank-detail">
                  <span>Bank Name:</span>
                  <strong>Sample Bank PLC</strong>
                </div>
                <div className="bank-detail">
                  <span>Account Name:</span>
                  <strong>ShelfLife AI (Pvt) Ltd</strong>
                </div>
                <div className="bank-detail">
                  <span>Account Number:</span>
                  <strong>1234 5678 9012 3456</strong>
                </div>
                <div className="bank-detail">
                  <span>Branch:</span>
                  <strong>Colombo Main</strong>
                </div>
              </div>
              <div className="bank-reference">
                <label>Reference / Invoice Number</label>
                <input type="text" placeholder="Enter invoice number" />
              </div>
              <button className="btn-pay" onClick={handleSubmit} disabled={processing}>
                {processing ? (
                  <><i className="fas fa-spinner fa-pulse"></i> Processing...</>
                ) : (
                  <><i className="fas fa-check-circle"></i> Confirm Bank Transfer</>
                )}
              </button>
            </div>
          )}
        </div>
        
        <div className="payment-modal-footer">
          <p className="secure-badge">
            <i className="fas fa-shield-alt"></i>
            Secured by PayHere • PCI DSS Compliant
          </p>
          <button className="btn-back" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  )
}

export default PaymentModal