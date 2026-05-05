// src/components/Chatbot.jsx
import { useState, useRef, useEffect } from 'react';
import './Chatbot.css';

function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "👋 Hi there! I'm ShelfLife AI Assistant. How can I help you today?",
      sender: 'bot',
      time: new Date().toLocaleTimeString()
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
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
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
  }, []);

  // Bot responses based on user input
  const getBotResponse = (userMessage) => {
    const msg = userMessage.toLowerCase();
    
    // Product scanning related
    if (msg.includes('scan') || msg.includes('barcode') || msg.includes('qr')) {
      return "📷 To scan a barcode or QR code:\n\n1. Click the 'Add Product' button\n2. Select 'Barcode Scanner'\n3. Position the barcode in the frame\n4. It will auto-detect!\n\nNeed help? I can guide you through the process!";
    }
    
    // OCR / Expiry date related
    if (msg.includes('expiry') || msg.includes('ocr') || msg.includes('date')) {
      return "📅 To scan expiry dates:\n\n1. Click 'Add Product'\n2. Select 'OCR Scanner'\n3. Point your camera at the expiry date\n4. Our AI will read it automatically!\n\nYou can also upload a photo of the label.";
    }
    
    // Flash sale related
    if (msg.includes('flash') || msg.includes('sale') || msg.includes('discount')) {
      return "🔥 Flash Sales help you sell expiring products faster!\n\n• 50% OFF for items expiring in 24h\n• 40% OFF for items expiring in 48h\n• 30% OFF for items expiring in 7 days\n\nClick 'Flash Sale' on any near-expiry product!";
    }
    
    // Inventory related
    if (msg.includes('inventory') || msg.includes('stock') || msg.includes('product')) {
      return "📦 Inventory Management:\n\n• Add products via barcode/OCR scan\n• Track expiry dates automatically\n• Get low stock alerts\n• View all products in one dashboard\n\nWant to add a product? I can help!";
    }
    
    // Suppliers related
    if (msg.includes('supplier') || msg.includes('return')) {
      return "🚚 Supplier Management:\n\n• Track all your suppliers\n• Request returns for near-expiry items\n• View batch information\n• Contact suppliers directly\n\nNeed to return a product? Let me help!";
    }
    
    // Analytics related
    if (msg.includes('analytics') || msg.includes('report') || msg.includes('saving')) {
      return "📊 Analytics Dashboard:\n\n• Track monthly savings\n• Monitor waste reduction\n• View ROI calculations\n• Export reports\n\nYour business intelligence at a glance!";
    }
    
    // Pricing / Plans
    if (msg.includes('price') || msg.includes('plan') || msg.includes('cost') || msg.includes('subscription')) {
      return "💰 Our Plans:\n\n• Basic: LKR 2,500/month\n• Professional: LKR 5,900/month\n• Enterprise: LKR 14,900/month\n\nAll plans include a 14-day free trial! Which plan interests you?";
    }
    
    // Help / Support
    if (msg.includes('help') || msg.includes('support') || msg.includes('assist')) {
      return "🆘 How can I help you?\n\nI can assist with:\n• Scanning products (barcode/OCR)\n• Managing inventory\n• Flash sales\n• Supplier returns\n• Analytics & reports\n• Account & billing\n\nJust type your question!";
    }
    
    // Contact human
    if (msg.includes('human') || msg.includes('agent') || msg.includes('speak') || msg.includes('talk')) {
      return "👨‍💼 I can connect you with a human support agent! Click the 'Connect with Support' button below and fill out the form. Our team will get back to you within 24 hours.";
    }
    
    // Greetings
    if (msg.includes('hello') || msg.includes('hi') || msg.includes('hey') || msg.includes('greeting')) {
      return "👋 Hello! Welcome to ShelfLife AI! How can I assist you today? You can ask me about scanning products, inventory management, flash sales, or anything else!";
    }
    
    // Thank you
    if (msg.includes('thank')) {
      return "🙏 You're very welcome! I'm glad I could help. Is there anything else you'd like to know?";
    }
    
    // Default response
    return "🤔 I'm not sure I understand. Could you please rephrase your question? I can help with:\n\n• Product scanning (barcode/OCR)\n• Inventory management\n• Flash sales\n• Supplier returns\n• Analytics\n• Pricing & plans\n\nOr click 'Connect with Support' to talk to a human!";
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;
    
    // Add user message
    const userMessage = {
      id: messages.length + 1,
      text: inputMessage,
      sender: 'user',
      time: new Date().toLocaleTimeString()
    };
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    
    // Show typing indicator
    setIsTyping(true);
    
    // Simulate bot thinking
    setTimeout(() => {
      const botResponse = getBotResponse(userMessage.text);
      const botMessage = {
        id: messages.length + 2,
        text: botResponse,
        sender: 'bot',
        time: new Date().toLocaleTimeString()
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
    
    // Store in localStorage for demo
    const requests = JSON.parse(localStorage.getItem('support_requests') || '[]');
    requests.push(supportRequest);
    localStorage.setItem('support_requests', JSON.stringify(requests));
    
    alert('✅ Support request sent! Our team will contact you within 24 hours.');
    setShowSupportModal(false);
    
    // Add confirmation message in chat
    const confirmationMessage = {
      id: messages.length + 1,
      text: "📧 Thanks for reaching out! I've forwarded your message to our support team. They'll get back to you within 24 hours. In the meantime, feel free to ask me any questions!",
      sender: 'bot',
      time: new Date().toLocaleTimeString()
    };
    setMessages(prev => [...prev, confirmationMessage]);
  };

  const quickActions = [
    { label: '📷 How to scan?', action: 'How do I scan a product?' },
    { label: '📅 Expiry dates', action: 'How to scan expiry dates?' },
    { label: '🔥 Flash sales', action: 'How do flash sales work?' },
    { label: '💳 Pricing', action: 'What are your pricing plans?' }
  ];

  return (
    <>
      {/* Chatbot Button */}
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

      {/* Chatbot Window */}
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
                      {line}
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