// src/pages/Login.js
import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useNavigate, Link } from 'react-router-dom';

const Login = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');
    
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
      setMessage(error.message);
      setIsLoading(false);
    } else {
      setMessage('✅ Login successful');
      navigate('/dashboard');
    }
  };

  const handlePasswordReset = async () => {
    setIsLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `${window.location.origin}/reset`,
    });
    
    if (error) {
      setMessage(error.message);
    } else {
      setMessage('📧 Password reset email sent! Check your inbox.');
      setShowReset(false);
      setResetEmail('');
    }
    setIsLoading(false);
  };

  // GoandTrack Brand Colors
  const brandRed = '#DC2626';
  const brandDark = '#111827';

  // Styles with GoandTrack branding
  const styles = {
    container: {
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #f5f5f5 0%, #e5e5e5 100%)',
      padding: '20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    },
    loginBox: {
      background: 'white',
      borderRadius: '16px',
      boxShadow: '0 20px 60px rgba(0,0,0,0.1)',
      padding: '50px 40px',
      width: '100%',
      maxWidth: '440px',
      animation: 'slideUp 0.5s ease-out'
    },
    logoContainer: {
      textAlign: 'center',
      marginBottom: '40px'
    },
    logoImage: {
      maxWidth: '200px',
      height: 'auto',
      marginBottom: '12px'
    },
    tagline: {
      color: '#6b7280',
      fontSize: '14px',
      marginTop: '12px',
      letterSpacing: '0.5px'
    },
    title: {
      fontSize: '26px',
      fontWeight: '700',
      color: brandDark,
      marginBottom: '30px',
      textAlign: 'center'
    },
    inputGroup: {
      marginBottom: '20px'
    },
    label: {
      display: 'block',
      marginBottom: '8px',
      color: '#374151',
      fontSize: '14px',
      fontWeight: '600',
      letterSpacing: '0.3px'
    },
    input: {
      width: '100%',
      padding: '14px 16px',
      border: '2px solid #e5e7eb',
      borderRadius: '10px',
      fontSize: '15px',
      transition: 'all 0.3s ease',
      outline: 'none',
      backgroundColor: '#f9fafb',
      boxSizing: 'border-box'
    },
    inputFocus: {
      borderColor: brandRed,
      backgroundColor: 'white',
      boxShadow: `0 0 0 3px ${brandRed}20`
    },
    button: {
      width: '100%',
      padding: '15px',
      background: brandRed,
      color: 'white',
      border: 'none',
      borderRadius: '10px',
      fontSize: '16px',
      fontWeight: '700',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      marginTop: '10px',
      letterSpacing: '0.5px',
      position: 'relative',
      overflow: 'hidden'
    },
    buttonHover: {
      transform: 'translateY(-2px)',
      boxShadow: `0 10px 25px ${brandRed}30`
    },
    buttonDisabled: {
      opacity: '0.7',
      cursor: 'not-allowed'
    },
    forgotPassword: {
      textAlign: 'center',
      marginTop: '20px'
    },
    forgotLink: {
      color: brandRed,
      fontSize: '14px',
      textDecoration: 'none',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'color 0.3s ease'
    },
    signupPrompt: {
      textAlign: 'center',
      marginTop: '30px',
      paddingTop: '30px',
      borderTop: '1px solid #e5e7eb',
      color: '#6b7280',
      fontSize: '14px'
    },
    signupLink: {
      color: brandRed,
      fontWeight: '700',
      textDecoration: 'none',
      marginLeft: '5px'
    },
    message: {
      padding: '12px 16px',
      borderRadius: '8px',
      marginTop: '20px',
      fontSize: '14px',
      fontWeight: '500',
      textAlign: 'center',
      animation: 'fadeIn 0.3s ease'
    },
    errorMessage: {
      backgroundColor: '#fee2e2',
      color: '#991b1b',
      border: '1px solid #fecaca'
    },
    successMessage: {
      backgroundColor: '#dcfce7',
      color: '#166534',
      border: '1px solid #bbf7d0'
    },
    resetModal: {
      marginTop: '20px',
      padding: '20px',
      background: '#f9fafb',
      borderRadius: '10px',
      border: '2px solid #e5e7eb'
    },
    resetTitle: {
      fontSize: '18px',
      fontWeight: '700',
      color: brandDark,
      marginBottom: '15px'
    },
    features: {
      display: 'flex',
      justifyContent: 'space-around',
      marginTop: '25px',
      paddingTop: '25px',
      borderTop: '1px solid #e5e7eb'
    },
    feature: {
      textAlign: 'center',
      fontSize: '12px',
      color: '#6b7280'
    },
    featureIcon: {
      fontSize: '20px',
      marginBottom: '5px',
      color: brandRed
    }
  };

  // Add animation keyframes to the page
  if (!document.getElementById('login-animations')) {
    const style = document.createElement('style');
    style.id = 'login-animations';
    style.innerHTML = `
      @keyframes slideUp {
        from {
          opacity: 0;
          transform: translateY(30px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      input:focus {
        border-color: ${brandRed} !important;
        background-color: white !important;
        box-shadow: 0 0 0 3px ${brandRed}20 !important;
      }
      button:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 10px 25px ${brandRed}30;
        background: #b91c1c;
      }
      a:hover {
        color: #991b1b !important;
      }
    `;
    document.head.appendChild(style);
  }

  return (
    <div style={styles.container}>
      <div style={styles.loginBox}>
        {/* Logo Section - Using actual image */}
        <div style={styles.logoContainer}>
          <img 
            src={`${process.env.PUBLIC_URL}/goandtrack-logo.png`}
            alt="GoandTrack" 
            style={styles.logoImage}
            onError={(e) => {
              // Fallback if logo doesn't load
              e.target.style.display = 'none';
              e.target.parentElement.innerHTML += '<div style="font-size: 32px; font-weight: 800; color: #DC2626; margin-bottom: 12px;">GoandTrack™</div>';
            }}
          />
          <div style={styles.tagline}>AI-Powered Logistics Intelligence</div>
        </div>

        {/* Login Form */}
        <h2 style={styles.title}>Welcome Back</h2>
        
        <form onSubmit={handleLogin}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Email Address</label>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              required
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
              disabled={isLoading}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              required
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
              disabled={isLoading}
            />
          </div>

          <button 
            type="submit" 
            style={{
              ...styles.button,
              ...(isLoading ? styles.buttonDisabled : {})
            }}
            disabled={isLoading}
          >
            {isLoading ? '🔄 Signing in...' : 'Sign In'}
          </button>
        </form>

        {/* Forgot Password */}
        <div style={styles.forgotPassword}>
          <a
            onClick={() => setShowReset(!showReset)}
            style={styles.forgotLink}
          >
            Forgot your password?
          </a>
        </div>

        {/* Password Reset Modal */}
        {showReset && (
          <div style={styles.resetModal}>
            <h4 style={styles.resetTitle}>🔐 Reset Your Password</h4>
            <input
              type="email"
              placeholder="Enter your email address"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              style={{ ...styles.input, marginBottom: '15px' }}
              disabled={isLoading}
            />
            <button 
              onClick={handlePasswordReset} 
              style={{
                ...styles.button,
                marginTop: '0',
                ...(isLoading ? styles.buttonDisabled : {})
              }}
              disabled={isLoading}
            >
              {isLoading ? '🔄 Sending...' : 'Send Reset Link'}
            </button>
          </div>
        )}

        {/* Messages */}
        {message && (
          <div style={{
            ...styles.message,
            ...(message.includes('✅') ? styles.successMessage : styles.errorMessage)
          }}>
            {message}
          </div>
        )}

        {/* Sign Up Prompt */}
        <div style={styles.signupPrompt}>
          Don't have an account?
          <Link to="/signup" style={styles.signupLink}>
            Sign up for free
          </Link>
        </div>

        {/* Features */}
        <div style={styles.features}>
          <div style={styles.feature}>
            <div style={styles.featureIcon}>🚚</div>
            <div>Multi-Provider</div>
          </div>
          <div style={styles.feature}>
            <div style={styles.featureIcon}>🤖</div>
            <div>AI-Powered</div>
          </div>
          <div style={styles.feature}>
            <div style={styles.featureIcon}>⚡</div>
            <div>Real-Time</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;