// src/components/LoginModal.jsx
import { useState, useEffect } from 'react'
import './LoginModal.css'
import { auth, googleProvider, githubProvider, facebookProvider } from '../firebaseConfig';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile,
  sendPasswordResetEmail,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult
} from "firebase/auth";
import axios from 'axios';

function LoginModal({ isOpen, onClose, onLogin }) {
  const [isLogin, setIsLogin] = useState(true)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetSent, setResetSent] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    businessName: '',
    confirmPassword: '',
    agreeTerms: false
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState(0)
  const [focusedField, setFocusedField] = useState(null)
  const [socialLoading, setSocialLoading] = useState(null)

  useEffect(() => {
    if (!isOpen) {
      setFormData({
        email: '',
        password: '',
        name: '',
        businessName: '',
        confirmPassword: '',
        agreeTerms: false
      })
      setErrors({})
      setShowForgotPassword(false)
      setResetSent(false)
    }
  }, [isOpen])

  // Handle redirect result for social logins
  useEffect(() => {
    const handleRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          await handleSocialLoginSuccess(result.user);
        }
      } catch (error) {
        console.error("Redirect result error:", error);
        setErrors({ general: error.message });
      }
    };
    
    if (isOpen) {
      handleRedirectResult();
    }
  }, [isOpen]);

  if (!isOpen) return null

  const checkPasswordStrength = (password) => {
    let strength = 0
    if (password.length >= 6) strength++
    if (password.match(/[a-z]/)) strength++
    if (password.match(/[A-Z]/)) strength++
    if (password.match(/[0-9]/)) strength++
    if (password.match(/[^a-zA-Z0-9]/)) strength++
    setPasswordStrength(strength)
    return strength
  }

  const handleSocialLoginSuccess = async (firebaseUser) => {
    try {
      const idToken = await firebaseUser.getIdToken();
      const response = await axios.post('/api/social-login', { 
        idToken,
        email: firebaseUser.email,
        name: firebaseUser.displayName,
        provider: firebaseUser.providerData[0]?.providerId
      });
      
      const userData = {
        uid: firebaseUser.uid,
        id: firebaseUser.uid,
        ...response.data.user,
        email: firebaseUser.email,
        name: firebaseUser.displayName || response.data.user?.name,
        photoURL: firebaseUser.photoURL,
        lastLogin: new Date().toISOString()
      };
      
      localStorage.setItem('shelflife_user', JSON.stringify(userData));
      onLogin(userData);
      onClose();
    } catch (error) {
      console.error("Social login error:", error);
      setErrors({ general: error.message });
    }
  };

  const handleGoogleLogin = async () => {
    setSocialLoading('google');
    try {
      const result = await signInWithPopup(auth, googleProvider);
      await handleSocialLoginSuccess(result.user);
    } catch (error) {
      if (error.code === 'auth/popup-blocked') {
        await signInWithRedirect(auth, googleProvider);
      } else {
        console.error("Google login error:", error);
        setErrors({ general: error.message });
      }
    } finally {
      setSocialLoading(null);
    }
  };

  const handleGithubLogin = async () => {
    setSocialLoading('github');
    try {
      const result = await signInWithPopup(auth, githubProvider);
      await handleSocialLoginSuccess(result.user);
    } catch (error) {
      if (error.code === 'auth/popup-blocked') {
        await signInWithRedirect(auth, githubProvider);
      } else {
        console.error("GitHub login error:", error);
        setErrors({ general: error.message });
      }
    } finally {
      setSocialLoading(null);
    }
  };

  const handleFacebookLogin = async () => {
    setSocialLoading('facebook');
    try {
      const result = await signInWithPopup(auth, facebookProvider);
      await handleSocialLoginSuccess(result.user);
    } catch (error) {
      if (error.code === 'auth/popup-blocked') {
        await signInWithRedirect(auth, facebookProvider);
      } else {
        console.error("Facebook login error:", error);
        setErrors({ general: error.message });
      }
    } finally {
      setSocialLoading(null);
    }
  };

  const handleLoginSubmit = async () => {
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);
      const idToken = await userCredential.user.getIdToken();
      const firebaseUser = userCredential.user;
      
      const response = await axios.post('/api/login', { idToken });
      
      const userData = {
        uid: firebaseUser.uid,
        id: firebaseUser.uid,
        ...response.data.user,
        email: formData.email,
        lastLogin: new Date().toISOString()
      };
      
      localStorage.setItem('shelflife_user', JSON.stringify(userData));
      onLogin(userData);
      onClose();
    } catch (error) {
      console.error("Login error:", error);
      if (error.code === 'auth/user-not-found') {
        setErrors({ email: 'No account found with this email' });
      } else if (error.code === 'auth/wrong-password') {
        setErrors({ password: 'Incorrect password' });
      } else if (error.code === 'auth/too-many-requests') {
        setErrors({ general: 'Too many failed attempts. Try again later.' });
      } else {
        setErrors({ general: error.message });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignupSubmit = async () => {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const firebaseUser = userCredential.user;
      
      await updateProfile(firebaseUser, { displayName: formData.name });
      
      const response = await axios.post('/api/signup', {
        email: formData.email,
        password: formData.password,
        name: formData.name,
        businessName: formData.businessName || `${formData.name}'s Store`,
        businessType: 'retail',
        firebaseUid: firebaseUser.uid
      });
      
      alert('✅ Account created successfully!\n\nPlease login with your credentials.');
      setIsLogin(true);
      setFormData({ email: '', password: '', name: '', businessName: '', confirmPassword: '', agreeTerms: false });
    } catch (error) {
      console.error("Signup error:", error);
      if (error.code === 'auth/email-already-in-use') {
        setErrors({ email: 'Email already registered' });
      } else if (error.code === 'auth/weak-password') {
        setErrors({ password: 'Password too weak' });
      } else {
        setErrors({ general: error.message });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!resetEmail) {
      setErrors({ resetEmail: 'Please enter your email' });
      return;
    }
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, resetEmail);
      setResetSent(true);
    } catch (error) {
      setErrors({ resetEmail: 'Failed to send reset email' });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
    if (name === 'password') {
      checkPasswordStrength(value);
    }
  }

  const validateLogin = () => {
    const newErrors = {}
    if (!formData.email) newErrors.email = 'Email is required'
    if (!formData.password) newErrors.password = 'Password is required'
    return newErrors
  }

  const validateSignup = () => {
    const newErrors = {}
    if (!formData.name) newErrors.name = 'Full name is required'
    if (!formData.email) newErrors.email = 'Email is required'
    if (!formData.email.includes('@')) newErrors.email = 'Invalid email format'
    if (!formData.password) newErrors.password = 'Password is required'
    if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters'
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match'
    if (!formData.agreeTerms) newErrors.agreeTerms = 'You must agree to the terms'
    return newErrors
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const validationErrors = isLogin ? validateLogin() : validateSignup()
    
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    if (isLogin) {
      await handleLoginSubmit();
    } else {
      await handleSignupSubmit();
    }
  }

  const switchMode = () => {
    setIsLogin(!isLogin)
    setShowForgotPassword(false)
    setErrors({})
    setFormData({
      email: '',
      password: '',
      name: '',
      businessName: '',
      confirmPassword: '',
      agreeTerms: false
    })
  }

  const getPasswordStrengthText = () => {
    if (passwordStrength === 0) return 'Very Weak'
    if (passwordStrength === 1) return 'Weak'
    if (passwordStrength === 2) return 'Fair'
    if (passwordStrength === 3) return 'Good'
    return 'Strong'
  }

  const getPasswordStrengthColor = () => {
    if (passwordStrength === 0) return '#ef4444'
    if (passwordStrength === 1) return '#f59e0b'
    if (passwordStrength === 2) return '#eab308'
    if (passwordStrength === 3) return '#22c55e'
    return '#39e75f'
  }

  if (showForgotPassword) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-container" onClick={(e) => e.stopPropagation()}>
          <button className="modal-close" onClick={onClose}>✕</button>
          
          <div className="modal-header">
            <div className="modal-logo">
              <div className="logo-icon"><i className="fas fa-leaf"></i></div>
              <span>ShelfLife <span className="logo-ai">AI</span></span>
            </div>
            <h2>Reset Password</h2>
            <p>We'll send you a link to reset your password</p>
          </div>

          <div className="modal-body">
            {!resetSent ? (
              <>
                <div className="form-group">
                  <label><i className="fas fa-envelope"></i> Email Address</label>
                  <input
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="your@email.com"
                    className={errors.resetEmail ? 'error' : ''}
                  />
                  {errors.resetEmail && <span className="error-message">{errors.resetEmail}</span>}
                </div>
                <button className="btn-reset-password" onClick={handleForgotPassword} disabled={loading}>
                  {loading ? <><i className="fas fa-spinner fa-pulse"></i> Sending...</> : 'Send Reset Link'}
                </button>
                <button className="btn-back-to-login" onClick={() => setShowForgotPassword(false)}>
                  <i className="fas fa-arrow-left"></i> Back to Login
                </button>
              </>
            ) : (
              <div className="reset-success">
                <i className="fas fa-check-circle"></i>
                <h3>Check Your Email</h3>
                <p>We've sent a password reset link to <strong>{resetEmail}</strong></p>
                <button className="btn-back-to-login" onClick={() => setShowForgotPassword(false)}>
                  Back to Login
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>
        
        {/* Animated Background Elements */}
        <div className="modal-bg-decoration">
          <div className="decoration-circle circle-1"></div>
          <div className="decoration-circle circle-2"></div>
          <div className="decoration-circle circle-3"></div>
          <div className="particle particle-1"></div>
          <div className="particle particle-2"></div>
          <div className="particle particle-3"></div>
          <div className="particle particle-4"></div>
        </div>

        <div className="modal-header">
          <div className="modal-logo">
            <div className="logo-icon">
              <i className="fas fa-leaf"></i>
            </div>
            <span>ShelfLife <span className="logo-ai">AI</span></span>
          </div>
          
          <div className="mode-switch">
            <button 
              className={`mode-btn ${isLogin ? 'active' : ''}`}
              onClick={() => setIsLogin(true)}
            >
              <i className="fas fa-sign-in-alt"></i> Sign In
            </button>
            <button 
              className={`mode-btn ${!isLogin ? 'active' : ''}`}
              onClick={() => setIsLogin(false)}
            >
              <i className="fas fa-user-plus"></i> Sign Up
            </button>
          </div>
          
          <h2>{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
          <p>{isLogin ? 'Sign in to continue to your account' : 'Start your 14-day free trial'}</p>
        </div>

        {/* Social Login Buttons */}
        <div className="social-login-section">
          <button 
            className="social-btn google" 
            onClick={handleGoogleLogin}
            disabled={socialLoading}
          >
            {socialLoading === 'google' ? (
              <i className="fas fa-spinner fa-pulse"></i>
            ) : (
              <i className="fab fa-google"></i>
            )}
            <span>Continue with Google</span>
          </button>
          
          <button 
            className="social-btn github" 
            onClick={handleGithubLogin}
            disabled={socialLoading}
          >
            {socialLoading === 'github' ? (
              <i className="fas fa-spinner fa-pulse"></i>
            ) : (
              <i className="fab fa-github"></i>
            )}
            <span>Continue with GitHub</span>
          </button>
          
          <button 
            className="social-btn facebook" 
            onClick={handleFacebookLogin}
            disabled={socialLoading}
          >
            {socialLoading === 'facebook' ? (
              <i className="fas fa-spinner fa-pulse"></i>
            ) : (
              <i className="fab fa-facebook-f"></i>
            )}
            <span>Continue with Facebook</span>
          </button>
        </div>

        <div className="divider">
          <span>Or continue with email</span>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {!isLogin && (
            <>
              <div className="form-group">
                <label><i className="fas fa-user"></i> Full Name</label>
                <input 
                  type="text" 
                  name="name" 
                  value={formData.name} 
                  onChange={handleChange}
                  onFocus={() => setFocusedField('name')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="John Doe"
                  className={focusedField === 'name' ? 'focused' : ''}
                />
                {errors.name && <span className="error-message">{errors.name}</span>}
              </div>

              <div className="form-group">
                <label><i className="fas fa-store"></i> Business Name <span className="optional">(Optional)</span></label>
                <input 
                  type="text" 
                  name="businessName" 
                  value={formData.businessName} 
                  onChange={handleChange}
                  placeholder="Your Store Name"
                />
              </div>
            </>
          )}

          <div className="form-group">
            <label><i className="fas fa-envelope"></i> Email Address</label>
            <input 
              type="email" 
              name="email" 
              value={formData.email} 
              onChange={handleChange}
              placeholder="hello@shelflife.ai"
              className={errors.email ? 'error' : ''}
            />
            {errors.email && <span className="error-message">{errors.email}</span>}
          </div>

          <div className="form-group">
            <label><i className="fas fa-lock"></i> Password</label>
            <input 
              type="password" 
              name="password" 
              value={formData.password} 
              onChange={handleChange}
              placeholder="••••••••"
              className={errors.password ? 'error' : ''}
            />
            {!isLogin && formData.password && (
              <div className="password-strength">
                <div className="strength-bar">
                  <div 
                    className="strength-fill" 
                    style={{ 
                      width: `${(passwordStrength / 5) * 100}%`,
                      background: getPasswordStrengthColor()
                    }}
                  ></div>
                </div>
                <span className="strength-text" style={{ color: getPasswordStrengthColor() }}>
                  {getPasswordStrengthText()}
                </span>
              </div>
            )}
            {errors.password && <span className="error-message">{errors.password}</span>}
          </div>

          {!isLogin && (
            <div className="form-group">
              <label><i className="fas fa-check-circle"></i> Confirm Password</label>
              <input 
                type="password" 
                name="confirmPassword" 
                value={formData.confirmPassword} 
                onChange={handleChange}
                placeholder="••••••••"
              />
              {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
            </div>
          )}

          {isLogin && (
            <div className="form-options">
              <label className="checkbox-label">
                <input type="checkbox" /> <span>Remember me</span>
              </label>
              <button 
                type="button" 
                className="forgot-password"
                onClick={() => setShowForgotPassword(true)}
              >
                Forgot Password?
              </button>
            </div>
          )}

          {!isLogin && (
            <div className="terms-checkbox">
              <label className="checkbox-label">
                <input 
                  type="checkbox" 
                  name="agreeTerms" 
                  checked={formData.agreeTerms} 
                  onChange={handleChange}
                />
                <span>I agree to the <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a></span>
              </label>
              {errors.agreeTerms && <span className="error-message">{errors.agreeTerms}</span>}
            </div>
          )}

          {errors.general && (
            <div className="general-error">
              <i className="fas fa-exclamation-triangle"></i>
              <span>{errors.general}</span>
            </div>
          )}

          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? (
              <><i className="fas fa-spinner fa-pulse"></i> {isLogin ? 'Signing In...' : 'Creating Account...'}</>
            ) : (
              <>{isLogin ? 'Sign In' : 'Create Free Account'}</>
            )}
          </button>
        </form>

        {!isLogin && (
          <div className="trial-info">
            <i className="fas fa-gift"></i>
            <div>
              <strong>14-day free trial</strong>
              <p>No credit card required • Cancel anytime</p>
            </div>
          </div>
        )}

        <div className="modal-footer">
          <p>
            {isLogin ? "Don't have an account?" : "Already have an account?"}
            <button type="button" onClick={switchMode} className="switch-mode">
              {isLogin ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}

export default LoginModal;