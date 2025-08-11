// Account.js - GoandTrack Account Management Page V4
// Enhanced with Sync, Edit, Remove buttons for connections
// Place this in: /src/pages/Account.js

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useNavigate, useLocation } from 'react-router-dom';
import './Account.css';

const Account = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // Profile state
  const [profile, setProfile] = useState({
    displayName: '',
    chatName: '',
    email: '',
    organizationId: ''
  });
  
  // Password state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  // Connections state
  const [connections, setConnections] = useState([
    { id: 'traccar', name: 'Traccar', status: 'connected', icon: '📍', apiKey: '***' },
    { id: 'sensolus', name: 'Sensolus', status: 'connected', icon: '🌡️', apiKey: '***' },
    { id: 'tive', name: 'Tive', status: 'disconnected', icon: '📦', apiKey: '' },
    { id: 'project44', name: 'Project44', status: 'disconnected', icon: '🚚', apiKey: '' },
    { id: 'systemloco', name: 'SystemLoco', status: 'available', icon: '🚂', apiKey: '' },
    { id: 'roambee', name: 'Roambee', status: 'available', icon: '🐝', apiKey: '' },
    { id: 'five', name: 'Five', status: 'available', icon: '5️⃣', apiKey: '' }
  ]);
  
  // Billing state
  const [billing, setBilling] = useState({
    plan: 'Free Plan',
    price: '$0/month',
    nextBilling: 'N/A',
    paymentMethod: null,
    invoices: []
  });
  
  const [plans] = useState([
    {
      name: 'Free Plan',
      price: '$0/month',
      features: ['Up to 5 devices', 'Basic tracking', 'Email support'],
      current: true
    },
    {
      name: 'Starter',
      price: '$29/month',
      features: ['Up to 25 devices', 'Advanced analytics', 'Priority support', 'API access'],
      current: false
    },
    {
      name: 'Professional',
      price: '$99/month',
      features: ['Up to 100 devices', 'Predictive AI', '24/7 phone support', 'Custom integrations'],
      current: false
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      features: ['Unlimited devices', 'Dedicated account manager', 'SLA guarantee', 'On-premise option'],
      current: false
    }
  ]);

  // Check URL hash for tab navigation
  useEffect(() => {
    const hash = location.hash.replace('#', '');
    if (hash && ['profile', 'connections', 'billing', 'privacy'].includes(hash)) {
      setActiveTab(hash);
    }
  }, [location]);

  // Load user data
  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        setCurrentUser(user);
        setProfile({
          displayName: user.user_metadata?.display_name || '',
          chatName: user.user_metadata?.chat_name || '',
          email: user.email,
          organizationId: user.user_metadata?.organization_id || generateOrgId()
        });
        
        // Load billing info
        const plan = user.user_metadata?.plan || 'Free Plan';
        setBilling(prev => ({
          ...prev,
          plan,
          price: plans.find(p => p.name === plan)?.price || '$0/month'
        }));
      } else {
        navigate('/login');
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      setMessage({ type: 'error', text: 'Failed to load user data' });
    }
  };

  const generateOrgId = () => {
    return 'ORG-' + Math.random().toString(36).substr(2, 9).toUpperCase();
  };

  // Update profile
  const handleUpdateProfile = async () => {
    setLoading(true);
    setMessage({ type: '', text: '' });
    
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          display_name: profile.displayName,
          chat_name: profile.chatName,
          organization_id: profile.organizationId
        }
      });
      
      if (error) throw error;
      
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  // Change password
  const handleChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }
    
    if (passwordForm.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters' });
      return;
    }
    
    setLoading(true);
    setMessage({ type: '', text: '' });
    
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordForm.newPassword
      });
      
      if (error) throw error;
      
      setMessage({ type: 'success', text: 'Password changed successfully!' });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  // Delete account
  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to delete your account? This action cannot be undone.'
    );
    
    if (!confirmed) return;
    
    const doubleConfirm = window.prompt(
      'Type "DELETE" to permanently delete your account:'
    );
    
    if (doubleConfirm !== 'DELETE') {
      setMessage({ type: 'error', text: 'Account deletion cancelled' });
      return;
    }
    
    setLoading(true);
    
    try {
      // In production, you'd call an API to delete the user
      // For now, just sign out
      await supabase.auth.signOut();
      navigate('/login');
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
      setLoading(false);
    }
  };

  // Add new connection
  const handleAddConnection = async (providerId) => {
    const apiKey = window.prompt(`Enter API key for ${providerId}:`);
    
    if (!apiKey) return;
    
    setConnections(prev => prev.map(conn => 
      conn.id === providerId 
        ? { ...conn, status: 'connected', apiKey: '***' + apiKey.slice(-4) }
        : conn
    ));
    
    setMessage({ type: 'success', text: `${providerId} connected successfully!` });
  };

  // Remove connection
  const handleRemoveConnection = (providerId) => {
    const confirmed = window.confirm(`Are you sure you want to disconnect ${providerId}?`);
    
    if (!confirmed) return;
    
    setConnections(prev => prev.map(conn => 
      conn.id === providerId 
        ? { ...conn, status: 'available', apiKey: '' }
        : conn
    ));
    
    setMessage({ type: 'success', text: `${providerId} disconnected` });
  };

  // Sync connection (refresh)
  const handleSyncConnection = async (providerId) => {
    setMessage({ type: 'info', text: `Syncing ${providerId}...` });
    
    // In production, this would call the actual API to refresh the connection
    // For now, simulate with a timeout
    setTimeout(() => {
      const provider = connections.find(c => c.id === providerId);
      setMessage({ type: 'success', text: `${provider?.name} connection refreshed successfully!` });
      
      // Optionally trigger a device sync
      if (window.location.pathname === '/dashboard') {
        // If we're on the dashboard, trigger a sync
        window.dispatchEvent(new CustomEvent('sync-devices'));
      }
    }, 1500);
  };

  // Edit connection
  const handleEditConnection = async (providerId) => {
    const provider = connections.find(c => c.id === providerId);
    
    const newApiKey = window.prompt(
      `Edit API key/webhook for ${provider?.name}:\n\nCurrent: ${provider?.apiKey}\n\nEnter new API key:`, 
      ''
    );
    
    if (newApiKey) {
      setConnections(prev => prev.map(conn => 
        conn.id === providerId 
          ? { ...conn, apiKey: '***' + newApiKey.slice(-4) }
          : conn
      ));
      
      setMessage({ type: 'success', text: `${provider?.name} credentials updated!` });
      
      // Optionally trigger a sync after updating credentials
      setTimeout(() => {
        handleSyncConnection(providerId);
      }, 500);
    }
  };

  // Change plan
  const handleChangePlan = (planName) => {
    if (planName === 'Enterprise') {
      window.open('mailto:sales@goandtrack.com?subject=Enterprise Plan Inquiry', '_blank');
      return;
    }
    
    setMessage({ type: 'info', text: `Redirecting to payment for ${planName}...` });
    // In production, redirect to Stripe checkout
    setTimeout(() => {
      setBilling(prev => ({ ...prev, plan: planName }));
      setMessage({ type: 'success', text: `Subscribed to ${planName}!` });
    }, 2000);
  };

  // Cancel plan
  const handleCancelPlan = () => {
    const confirmed = window.confirm(
      'Are you sure you want to cancel your subscription? You will lose access to premium features.'
    );
    
    if (!confirmed) return;
    
    setBilling(prev => ({ ...prev, plan: 'Free Plan', price: '$0/month' }));
    setMessage({ type: 'success', text: 'Subscription cancelled. You are now on the Free Plan.' });
  };

  return (
    <div className="account-container">
      {/* Header */}
      <header className="account-header">
        <div className="header-content">
          <button 
            className="back-button"
            onClick={() => navigate('/dashboard')}
          >
            ← Back to Dashboard
          </button>
          <h1>Account Settings</h1>
        </div>
      </header>

      {/* Tabs */}
      <div className="account-tabs">
        <button 
          className={`tab ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          👤 Profile
        </button>
        <button 
          className={`tab ${activeTab === 'connections' ? 'active' : ''}`}
          onClick={() => setActiveTab('connections')}
        >
          🔌 Connections
        </button>
        <button 
          className={`tab ${activeTab === 'billing' ? 'active' : ''}`}
          onClick={() => setActiveTab('billing')}
        >
          💳 Billing
        </button>
        <button 
          className={`tab ${activeTab === 'privacy' ? 'active' : ''}`}
          onClick={() => setActiveTab('privacy')}
        >
          🔒 Privacy
        </button>
      </div>

      {/* Message */}
      {message.text && (
        <div className={`message-bar ${message.type}`}>
          {message.text}
        </div>
      )}

      {/* Content */}
      <div className="account-content">
        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="tab-content">
            <div className="section">
              <h2>Profile Information</h2>
              
              <div className="form-group">
                <label>Display Name</label>
                <input
                  type="text"
                  value={profile.displayName}
                  onChange={(e) => setProfile(prev => ({ ...prev, displayName: e.target.value }))}
                  placeholder="How should we display your name?"
                />
                <span className="help-text">This name appears in the dashboard header</span>
              </div>
              
              <div className="form-group">
                <label>Chat Name</label>
                <input
                  type="text"
                  value={profile.chatName}
                  onChange={(e) => setProfile(prev => ({ ...prev, chatName: e.target.value }))}
                  placeholder="What should the AI call you?"
                />
                <span className="help-text">The AI assistant will use this name in conversations</span>
              </div>
              
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={profile.email}
                  disabled
                />
                <span className="help-text">Email cannot be changed</span>
              </div>
              
              <div className="form-group">
                <label>Organization ID</label>
                <input
                  type="text"
                  value={profile.organizationId}
                  disabled
                />
                <span className="help-text">Your unique organization identifier</span>
              </div>
              
              <button 
                className="btn-primary"
                onClick={handleUpdateProfile}
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>

            <div className="section">
              <h2>Change Password</h2>
              
              <div className="form-group">
                <label>Current Password</label>
                <input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                />
              </div>
              
              <div className="form-group">
                <label>New Password</label>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                />
              </div>
              
              <div className="form-group">
                <label>Confirm New Password</label>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                />
              </div>
              
              <button 
                className="btn-primary"
                onClick={handleChangePassword}
                disabled={loading}
              >
                {loading ? 'Changing...' : 'Change Password'}
              </button>
            </div>

            <div className="section danger-zone">
              <h2>Danger Zone</h2>
              
              <div className="danger-item">
                <div>
                  <h3>Delete Account</h3>
                  <p>Permanently delete your account and all associated data</p>
                </div>
                <button 
                  className="btn-danger"
                  onClick={handleDeleteAccount}
                >
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Connections Tab - ENHANCED WITH SYNC, EDIT, REMOVE */}
        {activeTab === 'connections' && (
          <div className="tab-content">
            <div className="section">
              <h2>Provider Connections</h2>
              <p>Connect your tracking platforms to import devices</p>
              
              <div className="connections-grid">
                {connections.map(conn => (
                  <div key={conn.id} className={`connection-card ${conn.status}`}>
                    <div className="connection-header">
                      <span className="connection-icon">{conn.icon}</span>
                      <h3>{conn.name}</h3>
                      <span className={`status-badge ${conn.status}`}>
                        {conn.status === 'connected' ? '✓ Connected' : 
                         conn.status === 'disconnected' ? '✗ Disconnected' : 
                         'Available'}
                      </span>
                    </div>
                    
                    {conn.status === 'connected' && (
                      <div className="connection-info">
                        <p>API Key: {conn.apiKey}</p>
                        <div className="connection-actions">
                          <button 
                            className="btn-secondary"
                            onClick={() => handleSyncConnection(conn.id)}
                            title="Refresh connection and sync devices"
                          >
                            🔄 Sync
                          </button>
                          <button 
                            className="btn-secondary"
                            onClick={() => handleEditConnection(conn.id)}
                            title="Edit API key or webhook settings"
                          >
                            ✏️ Edit
                          </button>
                          <button 
                            className="btn-secondary danger"
                            onClick={() => handleRemoveConnection(conn.id)}
                            title="Disconnect this provider"
                          >
                            ✗ Remove
                          </button>
                        </div>
                      </div>
                    )}
                    
                    {conn.status !== 'connected' && (
                      <button 
                        className="btn-primary"
                        onClick={() => handleAddConnection(conn.id)}
                      >
                        Connect
                      </button>
                    )}
                  </div>
                ))}
              </div>
              
              <div style={{ marginTop: '24px', padding: '16px', background: '#f0f2f5', borderRadius: '8px' }}>
                <h3 style={{ fontSize: '14px', marginBottom: '8px' }}>How to Connect:</h3>
                <ol style={{ fontSize: '13px', color: '#65676b', lineHeight: '1.6' }}>
                  <li>Click "Connect" on any provider</li>
                  <li>Enter your API key or webhook URL</li>
                  <li>Use "Sync" to refresh device list</li>
                  <li>Use "Edit" to update credentials</li>
                  <li>Use "Remove" to disconnect</li>
                </ol>
              </div>
            </div>
          </div>
        )}

        {/* Billing Tab */}
        {activeTab === 'billing' && (
          <div className="tab-content">
            <div className="section">
              <h2>Current Plan</h2>
              
              <div className="current-plan-card">
                <h3>{billing.plan}</h3>
                <p className="plan-price">{billing.price}</p>
                {billing.plan !== 'Free Plan' && (
                  <>
                    <p>Next billing: {billing.nextBilling}</p>
                    <button 
                      className="btn-danger"
                      onClick={handleCancelPlan}
                    >
                      Cancel Subscription
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="section">
              <h2>Available Plans</h2>
              
              <div className="plans-grid">
                {plans.map(plan => (
                  <div 
                    key={plan.name} 
                    className={`plan-card ${plan.current ? 'current' : ''}`}
                  >
                    <h3>{plan.name}</h3>
                    <p className="plan-price">{plan.price}</p>
                    <ul className="plan-features">
                      {plan.features.map((feature, idx) => (
                        <li key={idx}>✓ {feature}</li>
                      ))}
                    </ul>
                    {!plan.current && (
                      <button 
                        className="btn-primary"
                        onClick={() => handleChangePlan(plan.name)}
                      >
                        {plan.name === 'Enterprise' ? 'Contact Sales' : 'Select Plan'}
                      </button>
                    )}
                    {plan.current && (
                      <button className="btn-disabled" disabled>
                        Current Plan
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="section">
              <h2>Payment Method</h2>
              
              {billing.paymentMethod ? (
                <div className="payment-method">
                  <p>•••• •••• •••• {billing.paymentMethod}</p>
                  <button className="btn-secondary">Update Card</button>
                </div>
              ) : (
                <div className="no-payment">
                  <p>No payment method on file</p>
                  <button className="btn-primary">Add Payment Method</button>
                </div>
              )}
            </div>

            <div className="section">
              <h2>Invoices</h2>
              
              {billing.invoices.length > 0 ? (
                <table className="invoices-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {billing.invoices.map((invoice, idx) => (
                      <tr key={idx}>
                        <td>{invoice.date}</td>
                        <td>{invoice.amount}</td>
                        <td>{invoice.status}</td>
                        <td>
                          <button className="btn-link">Download</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p>No invoices yet</p>
              )}
            </div>
          </div>
        )}

        {/* Privacy Tab */}
        {activeTab === 'privacy' && (
          <div className="tab-content">
            <div className="section">
              <h2>Privacy Policy</h2>
              
              <div className="privacy-content">
                <h3>Data Collection</h3>
                <p>GoandTrack collects the following information:</p>
                <ul>
                  <li>Account information (email, name)</li>
                  <li>Device tracking data from connected platforms</li>
                  <li>Usage analytics to improve our service</li>
                </ul>
                
                <h3>Data Usage</h3>
                <p>Your data is used to:</p>
                <ul>
                  <li>Provide shipment tracking services</li>
                  <li>Generate analytics and insights</li>
                  <li>Send important notifications</li>
                  <li>Improve our AI predictions</li>
                </ul>
                
                <h3>Data Protection</h3>
                <p>We protect your data with:</p>
                <ul>
                  <li>End-to-end encryption</li>
                  <li>Regular security audits</li>
                  <li>GDPR compliance</li>
                  <li>SOC 2 Type II certification</li>
                </ul>
                
                <h3>Your Rights</h3>
                <p>You have the right to:</p>
                <ul>
                  <li>Access your personal data</li>
                  <li>Request data deletion</li>
                  <li>Export your data</li>
                  <li>Opt-out of marketing communications</li>
                </ul>
                
                <div className="privacy-actions">
                  <button className="btn-secondary">Download My Data</button>
                  <button className="btn-secondary">Privacy Settings</button>
                  <button 
                    className="btn-link"
                    onClick={() => window.open('https://goandtrack.com/privacy', '_blank')}
                  >
                    View Full Privacy Policy →
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Account;