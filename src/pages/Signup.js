// src/pages/Signup.js
// Enhanced design with actual GoandTrack logo

import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useNavigate, Link } from 'react-router-dom';

const Signup = () => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' or 'error'

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setMessage('');
    setMessageType('');
    
    // Validation
    if (formData.password !== formData.confirmPassword) {
      setMessage('❌ Passwords do not match');
      setMessageType('error');
      return;
    }
    
    if (formData.password.length < 6) {
      setMessage('❌ Password must be at least 6 characters');
      setMessageType('error');
      return;
    }
    
    if (!formData.displayName.trim()) {
      setMessage('❌ Display name is required');
      setMessageType('error');
      return;
    }
    
    setLoading(true);
    
    try {
      // Sign up with Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            display_name: formData.displayName.trim()
          }
        }
      });
      
      if (error) {
        setMessage(`❌ ${error.message}`);
        setMessageType('error');
      } else if (data.user) {
        // Also update the users table if you have one
        const { error: profileError } = await supabase
          .from('users')
          .upsert({
            id: data.user.id,
            email: data.user.email,
            name: formData.displayName.trim(),
            created_at: new Date().toISOString()
          });
        
        if (profileError) {
          console.error('Profile creation error:', profileError);
        }
        
        setMessage('✅ Account created successfully! Check your email for verification.');
        setMessageType('success');
        
        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      }
    } catch (error) {
      setMessage('❌ An unexpected error occurred');
      setMessageType('error');
      console.error('Signup error:', error);
    } finally {
      setLoading(false);
    }
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
    signupBox: {
      background: 'white',
      borderRadius: '16px',
      boxShadow: '0 20px 60px rgba(0,0,0,0.1)',
      padding: '50px 40px',
      width: '100%',
      maxWidth: '480px',
      animation: 'slideUp 0.5s ease-out'
    },
    logoContainer: {
      textAlign: 'center',
      marginBottom: '35px'
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
      marginBottom: '10px',
      textAlign: 'center'
    },
    subtitle: {
      fontSize: '14px',
      color: '#6b7280',
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
    required: {
      color: brandRed,
      marginLeft: '2px'
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
    helpText: {
      marginTop: '6px',
      fontSize: '12px',
      color: '#6b7280'
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
      letterSpacing: '0.5px'
    },
    buttonDisabled: {
      opacity: '0.7',
      cursor: 'not-allowed'
    },
    loginPrompt: {
      textAlign: 'center',
      marginTop: '30px',
      paddingTop: '30px',
      borderTop: '1px solid #e5e7eb',
      color: '#6b7280',
      fontSize: '14px'
    },
    loginLink: {
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
    inviteNote: {
      background: `linear-gradient(135deg, ${brandRed}10, ${brandRed}05)`,
      borderRadius: '10px',
      padding: '15px',
      marginBottom: '25px',
      fontSize: '13px',
      color: brandDark,
      textAlign: 'center',
      border: `1px solid ${brandRed}30`
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

  // Add animation keyframes if not already added
  if (!document.getElementById('signup-animations')) {
    const style = document.createElement('style');
    style.id = 'signup-animations';
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
      <div style={styles.signupBox}>
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

        {/* Title */}
        <h2 style={styles.title}>Create Your Account</h2>
        <p style={styles.subtitle}>Join GoandTrack to start tracking your shipments</p>
        
        {/* Invite Note */}
        <div style={styles.inviteNote}>
          🎯 <strong>Invite-Only Beta</strong><br/>
          Welcome! You've been invited to join our exclusive beta program.
        </div>
        
        <form onSubmit={handleSignup}>
          {/* Display Name - Required */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>
              Display Name
              <span style={styles.required}>*</span>
            </label>
            <input
              type="text"
              name="displayName"
              placeholder="Enter your full name"
              value={formData.displayName}
              onChange={handleChange}
              required
              style={styles.input}
              disabled={loading}
            />
            <p style={styles.helpText}>
              This name will be shown in your dashboard
            </p>
          </div>
          
          {/* Email */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>
              Email Address
              <span style={styles.required}>*</span>
            </label>
            <input
              type="email"
              name="email"
              placeholder="you@company.com"
              value={formData.email}
              onChange={handleChange}
              required
              style={styles.input}
              disabled={loading}
            />
          </div>
          
          {/* Password */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>
              Password
              <span style={styles.required}>*</span>
            </label>
            <input
              type="password"
              name="password"
              placeholder="Create a secure password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength="6"
              style={styles.input}
              disabled={loading}
            />
            <p style={styles.helpText}>
              Must be at least 6 characters
            </p>
          </div>
          
          {/* Confirm Password */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>
              Confirm Password
              <span style={styles.required}>*</span>
            </label>
            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm your password"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              style={styles.input}
              disabled={loading}
            />
          </div>
          
          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.button,
              ...(loading ? styles.buttonDisabled : {})
            }}
          >
            {loading ? '🔄 Creating Account...' : 'Create Account'}
          </button>
        </form>
        
        {/* Message */}
        {message && (
          <div style={{
            ...styles.message,
            ...(messageType === 'success' ? styles.successMessage : styles.errorMessage)
          }}>
            {message}
          </div>
        )}
        
        {/* Login Link */}
        <div style={styles.loginPrompt}>
          Already have an account?
          <Link to="/login" style={styles.loginLink}>
            Sign in here
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

export default Signup;