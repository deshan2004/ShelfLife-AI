// src/components/Chatbot/Chatbot.jsx
import { useState, useRef, useEffect } from 'react';
import './Chatbot.css';

function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "👋 Hi there! 👋\n\nI'm ShelfLife AI Assistant. I can help you with:\n\n📷 Scanning products (barcode/OCR)\n📦 Managing inventory\n🔥 Flash sales\n🚚 Supplier returns\n📊 Analytics\n💰 Pricing & plans\n\nHow can I assist you today?",
      sender: 'bot',
      time: '09:15 AM'
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current.focus();
      }, 300);
    }
  }, [isOpen]);

  // Show welcome notification after delay
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isOpen) {
        setNotificationCount(1);
      }
    }, 5000);
    return () => clearTimeout(timer);
  }, [isOpen]);

  // Listen for flash sale events from outside
  useEffect(() => {
    const handleFlashSaleMessage = (event) => {
      const { productName, discount, newPrice, saleType } = event.detail;
      
      const botMessage = {
        id: Date.now(),
        text: `🔥 **${saleType || 'Flash Sale'} Applied!**\n\n✅ **${productName}**\n💰 Discount: **${discount}**\n🆕 New Price: **LKR ${newPrice}**\n\n💡 This product is now on sale! Don't miss out!`,
        sender: 'bot',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      
      setMessages(prev => [...prev, botMessage]);
      
      if (window.showToast) {
        window.showToast(`🔥 ${discount} applied to ${productName}!`);
      }
    };

    window.addEventListener('flashSaleApplied', handleFlashSaleMessage);
    return () => window.removeEventListener('flashSaleApplied', handleFlashSaleMessage);
  }, []);

  // Bot responses based on user input
  const getBotResponse = (userMessage) => {
    const msg = userMessage.toLowerCase();
    
    if (msg.includes('scan') || msg.includes('barcode') || msg.includes('qr')) {
      return "📷 **How to scan products:**\n\n1️⃣ Click the 'Add Product' button on Inventory page\n2️⃣ Select 'Barcode Scanner'\n3️⃣ Position the barcode in the frame\n4️⃣ It will auto-detect!\n\n💡 Tip: You can also use your phone camera by clicking 'Scan with Phone Camera'";
    }
    
    if (msg.includes('expiry') || msg.includes('ocr') || msg.includes('date')) {
      return "📅 **How to scan expiry dates:**\n\n1️⃣ Click 'Add Product'\n2️⃣ Select 'OCR Scanner'\n3️⃣ Point your camera at the expiry date\n4️⃣ Our AI will read it automatically!\n\n📱 You can also upload a photo of the label.";
    }
    
    if (msg.includes('flash') || msg.includes('sale') || msg.includes('discount') || msg.includes('expired pricing')) {
      return "🔥 **Flash Sale Pricing for Expired/Expiring Items:**\n\n• **24 hours or less** → 50% OFF (BOGO)\n• **48 hours or less** → 40% OFF\n• **7 days or less** → 30% OFF\n• **Expired items** → Return to supplier or dispose\n\n💡 Click 'Flash Sale' on any near-expiry product in your inventory!\n\n🛒 I'll notify you here when a flash sale is applied!";
    }
    
    if (msg.includes('inventory') || msg.includes('stock') || msg.includes('product')) {
      return "📦 **Inventory Management Features:**\n\n✅ Add products via barcode/OCR scan\n✅ Track expiry dates automatically\n✅ Get low stock alerts\n✅ View all products in one dashboard\n✅ Edit product details\n✅ Delete products\n\nWant to add a product? Go to Inventory page and click 'Add Product'!";
    }
    
    if (msg.includes('supplier') || msg.includes('return')) {
      return "🚚 **Supplier Management:**\n\n✅ Track all your suppliers\n✅ Request returns for near-expiry items\n✅ View batch information\n✅ Contact suppliers directly\n✅ Return history\n\nNeed to return a product? Go to Suppliers page and click 'Return' on any item!";
    }
    
    if (msg.includes('analytics') || msg.includes('report') || msg.includes('saving')) {
      return "📊 **Analytics Dashboard:**\n\n📈 Track monthly savings\n📉 Monitor waste reduction\n💰 View ROI calculations\n📄 Export reports\n📊 Category performance\n\nVisit the Analytics page to see your business intelligence!";
    }
    
    if (msg.includes('price') || msg.includes('plan') || msg.includes('cost') || msg.includes('subscription')) {
      return "💰 **Our Pricing Plans:**\n\n**Basic** - LKR 2,500/month\n• 200 products • 25 suppliers • Barcode scanning\n\n**Professional** - LKR 5,900/month\n• 1000 products • 100 suppliers • AI OCR scanning • Flash sales\n\n**Enterprise** - LKR 14,900/month\n• Unlimited • All features • API access\n\n✨ All plans include 14-day free trial!";
    }
    
    if (msg.includes('hello') || msg.includes('hi') || msg.includes('hey')) {
      return "👋 **Hello! Welcome to ShelfLife AI!**\n\nI'm your virtual assistant. I can help you with:\n\n• 📷 Scanning products\n• 📦 Inventory management\n• 🔥 Flash sales\n• 📊 Analytics\n• 💰 Pricing plans\n\nWhat would you like to know?";
    }
    
    if (msg.includes('thank')) {
      return "🙏 **You're very welcome!**\n\nI'm glad I could help. Is there anything else you'd like to know about ShelfLife AI?\n\n💡 Tip: Check out our video tutorials in the Help section!";
    }
    
    // Default response
    return "🤔 **I'm not sure I understand.**\n\nCould you please rephrase your question? I can help with:\n\n📷 Product scanning (barcode/OCR)\n📦 Inventory management\n🔥 Flash sales\n🚚 Supplier returns\n📊 Analytics\n💰 Pricing & plans\n\nOr click **'Connect with Human Support'** below to talk to a real person!";
  };

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;
    
    const userMessage = {
      id: messages.length + 1,
      text: inputMessage,
      sender: 'user',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    
    setIsTyping(true);
    
    setTimeout(() => {
      const botResponse = getBotResponse(userMessage.text);
      const botMessage = {
        id: messages.length + 2,
        text: botResponse,
        sender: 'bot',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, botMessage]);
      setIsTyping(false);
    }, 800);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleQuickAction = (action) => {
    setInputMessage(action);
    setTimeout(() => handleSendMessage(), 100);
  };

  const handleConnectHuman = () => {
    setShowSupportModal(true);
  };

  const handleSupportSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const supportRequest = {
      name: formData.get('name'),
      email: formData.get('email'),
      message: formData.get('message'),
      timestamp: new Date().toISOString()
    };
    
    const requests = JSON.parse(localStorage.getItem('support_requests') || '[]');
    requests.push(supportRequest);
    localStorage.setItem('support_requests', JSON.stringify(requests));
    
    alert('✅ Support request sent! Our team will contact you within 24 hours.');
    setShowSupportModal(false);
    
    const confirmationMessage = {
      id: messages.length + 1,
      text: "📧 **Support request received!**\n\nI've forwarded your message to our support team. They'll get back to you within 24 hours.\n\nIn the meantime, feel free to ask me any questions!",
      sender: 'bot',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, confirmationMessage]);
  };

  // ✅ Shortened quick action labels - "📦 Expired Pricing" instead of long text
  const quickActions = [
    { label: '📷 How to scan?', action: 'How do I scan a product?' },
    { label: '📅 Expiry dates', action: 'How to scan expiry dates?' },
    { label: '🔥 Flash sales', action: 'How do flash sales work?' },
    { label: '💰 Pricing', action: 'What are your pricing plans?' },
    { label: '📦 Expired Pricing', action: 'How does flash sale pricing work for expired items?' }
  ];

  return (
    <>
      {/* Chatbot Button - Always visible */}
      <button 
        className="chatbot-button"
        onClick={() => {
          setIsOpen(!isOpen);
          if (notificationCount > 0) setNotificationCount(0);
        }}
      >
        <i className="fas fa-comment-dots"></i>
        {notificationCount > 0 && !isOpen && (
          <span className="notification-badge">{notificationCount}</span>
        )}
      </button>

      {/* Chatbot Window - Shows when open */}
      {isOpen && (
        <div className="chatbot-window">
          <div className="chatbot-header">
            <div className="chatbot-header-info">
              <div className="chatbot-avatar">
                <i className="fas fa-leaf"></i>
              </div>
              <div className="chatbot-header-text">
                <h3>ShelfLife AI Assistant</h3>
                <p>
                  <span className="status-dot"></span>
                  Online • Ready to help
                </p>
              </div>
            </div>
            <button className="chatbot-close" onClick={() => setIsOpen(false)}>
              <i className="fas fa-times"></i>
            </button>
          </div>

          <div className="chat-messages">
            {messages.map((message) => (
              <div key={message.id} className={`message ${message.sender}`}>
                <div className="message-content">
                  {message.text.split('\n').map((line, i) => (
                    <span key={i}>
                      {line.includes('**') ? (
                        <strong>{line.replace(/\*\*/g, '')}</strong>
                      ) : line.startsWith('•') ? (
                        <span style={{ display: 'block', marginLeft: '8px' }}>{line}</span>
                      ) : line.startsWith('1️⃣') || line.startsWith('2️⃣') || line.startsWith('3️⃣') || line.startsWith('4️⃣') ? (
                        <span style={{ display: 'block' }}>{line}</span>
                      ) : (
                        line
                      )}
                      {i < message.text.split('\n').length - 1 && <br />}
                    </span>
                  ))}
                  <span className="message-time">{message.time}</span>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="message bot">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="quick-actions">
            {quickActions.map((action, index) => (
              <button
                key={index}
                className="quick-action-btn"
                onClick={() => handleQuickAction(action.action)}
              >
                {action.label}
              </button>
            ))}
          </div>

          <div className="chat-input-area">
            <input
              ref={inputRef}
              type="text"
              className="chat-input"
              placeholder="Type your message..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
            />
            <button 
              className="chat-send-btn"
              onClick={handleSendMessage}
              disabled={!inputMessage.trim()}
            >
              <i className="fas fa-paper-plane"></i>
            </button>
          </div>

          <button className="connect-human-btn" onClick={handleConnectHuman}>
            <i className="fas fa-headset"></i>
            Connect with Human Support
          </button>
        </div>
      )}

      {/* Support Modal */}
      {showSupportModal && (
        <div className="support-modal-overlay" onClick={() => setShowSupportModal(false)}>
          <div className="support-modal" onClick={(e) => e.stopPropagation()}>
            <div className="support-modal-header">
              <h3>
                <i className="fas fa-headset"></i>
                Contact Support
              </h3>
              <button className="support-modal-close" onClick={() => setShowSupportModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <form onSubmit={handleSupportSubmit} className="support-modal-body">
              <div className="support-form-group">
                <label>Your Name</label>
                <input type="text" name="name" placeholder="John Doe" required />
              </div>
              <div className="support-form-group">
                <label>Email Address</label>
                <input type="email" name="email" placeholder="john@example.com" required />
              </div>
              <div className="support-form-group">
                <label>Your Message</label>
                <textarea 
                  name="message" 
                  rows="4" 
                  placeholder="Describe your issue or question..."
                  required
                ></textarea>
              </div>
              <button type="submit" className="support-submit-btn">
                <i className="fas fa-paper-plane"></i>
                Send Message
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default Chatbot;