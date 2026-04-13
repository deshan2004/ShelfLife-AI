import { useState } from 'react'
import './LoginModal.css'
import { auth } from '../firebaseConfig';
import { signInWithEmailAndPassword } from "firebase/auth";
import axios from 'axios';

function LoginModal({ isOpen, onClose, onLogin }) {
  const [isLogin, setIsLogin] = useState(true)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    confirmPassword: ''
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  // --- Login Logic ---
  const handleLoginSubmit = async () => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);
      const idToken = await userCredential.user.getIdToken();

      // Vite Proxy පාවිච්චි කරන නිසා කෙලින්ම /api/login ලෙස ලබා දිය හැක
      const response = await axios.post('/api/login', { idToken });
      
      console.log("User Data Received:", response.data.user);
      onLogin(response.data.user); 
      setToastMsg(`Welcome back, ${response.data.user.name || 'User'}!`);
      onClose(); 
    } catch (error) {
      console.error("Login error:", error);
      alert("Login Failed: " + (error.response?.data?.error || error.message));
    }
  };

  // --- Signup Logic ---
  const handleSignupSubmit = async () => {
    try {
      // මෙතන නිවැරදි Endpoint එක /api/signup විය යුතුය
      const response = await axios.post('/api/signup', {
        email: formData.email,
        password: formData.password,
        name: formData.name
      });
      
      alert(response.data.message);
      setIsLogin(true); // Signup වුණාම Login screen එකට මාරු කරනවා
    } catch (error) {
      console.error("Signup error:", error);
      alert("Signup Failed: " + (error.response?.data?.error || error.message));
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const validationErrors = isLogin ? validateLogin() : validateSignup()
    
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setLoading(true)
    if (isLogin) {
      await handleLoginSubmit();
    } else {
      await handleSignupSubmit();
    }
    setLoading(false)
  }

  // Validation functions
  const validateLogin = () => {
    const newErrors = {}
    if (!formData.email) newErrors.email = 'Email is required'
    if (!formData.password) newErrors.password = 'Password is required'
    return newErrors
  }

  const validateSignup = () => {
    const newErrors = {}
    if (!formData.name) newErrors.name = 'Name is required'
    if (!formData.email) newErrors.email = 'Email is required'
    if (!formData.password) newErrors.password = 'Password is required'
    if (formData.password.length < 6) newErrors.password = 'At least 6 characters'
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match'
    return newErrors
  }

  const switchMode = () => {
    setIsLogin(!isLogin)
    setErrors({})
    setFormData({ email: '', password: '', name: '', confirmPassword: '' })
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>
        
        <div className="modal-header">
          <h2>{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {!isLogin && (
            <div className="form-group">
              <label>Full Name</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} />
              {errors.name && <span className="error-message">{errors.name}</span>}
            </div>
          )}

          <div className="form-group">
            <label>Email Address</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} />
            {errors.email && <span className="error-message">{errors.email}</span>}
          </div>

          <div className="form-group">
            <label>Password</label>
            <input type="password" name="password" value={formData.password} onChange={handleChange} />
            {errors.password && <span className="error-message">{errors.password}</span>}
          </div>

          {!isLogin && (
            <div className="form-group">
              <label>Confirm Password</label>
              <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} />
              {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
            </div>
          )}

          <button type="submit" className="btn-login" disabled={loading}>
            {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        <div className="modal-footer">
          <button onClick={switchMode} className="switch-mode">
            {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
          </button>
        </div>
      </div>
    </div>
  )
}

function setToastMsg(message) {
  const event = new CustomEvent('showToast', { detail: message })
  window.dispatchEvent(event)
}

export default LoginModal;