// Signup.js - Enhanced with Display Name Capture
// Place this in: /src/pages/Signup.js

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
      setMessage('Passwords do not match');
      setMessageType('error');
      return;
    }
    
    if (formData.password.length < 6) {
      setMessage('Password must be at least 6 characters');
      setMessageType('error');
      return;
    }
    
    if (!formData.displayName.trim()) {
      setMessage('Display name is required');
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
        setMessage(error.message);
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
      setMessage('An unexpected error occurred');
      setMessageType('error');
      console.error('Signup error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f9fafb'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '12px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        width: '100%',
        maxWidth: '400px'
      }}>
        {/* Logo */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          marginBottom: '2rem'
        }}>
          <div style={{
            width: '60px',
            height: '60px',
            backgroundColor: '#ef4444',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '24px',
            fontWeight: 'bold'
          }}>
            G
          </div>
        </div>
        
        <h2 style={{
          textAlign: 'center',
          marginBottom: '0.5rem',
          fontSize: '24px',
          fontWeight: '600'
        }}>
          Create your account
        </h2>
        
        <p style={{
          textAlign: 'center',
          color: '#6b7280',
          marginBottom: '2rem',
          fontSize: '14px'
        }}>
          Join GoandTrack to start tracking your shipments
        </p>
        
        <form onSubmit={handleSignup}>
          {/* Display Name */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151'
            }}>
              Display Name
            </label>
            <input
              type="text"
              name="displayName"
              placeholder="John Doe"
              value={formData.displayName}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                outline: 'none'
              }}
            />
          </div>
          
          {/* Email */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151'
            }}>
              Email Address
            </label>
            <input
              type="email"
              name="email"
              placeholder="john@company.com"
              value={formData.email}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                outline: 'none'
              }}
            />
          </div>
          
          {/* Password */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151'
            }}>
              Password
            </label>
            <input
              type="password"
              name="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              required
              minLength="6"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                outline: 'none'
              }}
            />
            <p style={{
              marginTop: '0.25rem',
              fontSize: '12px',
              color: '#6b7280'
            }}>
              Must be at least 6 characters
            </p>
          </div>
          
          {/* Confirm Password */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151'
            }}>
              Confirm Password
            </label>
            <input
              type="password"
              name="confirmPassword"
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                outline: 'none'
              }}
            />
          </div>
          
          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '0.75rem',
              backgroundColor: loading ? '#9ca3af' : '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '16px',
              fontWeight: '500',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.2s'
            }}
          >
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>
        
        {/* Message */}
        {message && (
          <div style={{
            marginTop: '1rem',
            padding: '0.75rem',
            backgroundColor: messageType === 'success' ? '#d1fae5' : '#fee2e2',
            color: messageType === 'success' ? '#065f46' : '#991b1b',
            borderRadius: '6px',
            fontSize: '14px',
            textAlign: 'center'
          }}>
            {message}
          </div>
        )}
        
        {/* Login Link */}
        <p style={{
          marginTop: '1.5rem',
          textAlign: 'center',
          fontSize: '14px',
          color: '#6b7280'
        }}>
          Already have an account?{' '}
          <Link to="/login" style={{
            color: '#3b82f6',
            textDecoration: 'none',
            fontWeight: '500'
          }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;