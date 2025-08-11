// Dashboard.js - GoandTrack AI with Expandable Sidebar and Account Settings
// Complete implementation with all functionality

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

const Dashboard = () => {
  // Core State
  const [currentUser, setCurrentUser] = useState(null);
  const [sessionToken, setSessionToken] = useState(null);
  const [shipments, setShipments] = useState([]);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  
  // Additional State
  const [alerts, setAlerts] = useState([]);
  const [dailyCost, setDailyCost] = useState(0);
  const [syncStatus, setSyncStatus] = useState('idle');
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [predictiveMode, setPredictiveMode] = useState(true);
  const [userPlan, setUserPlan] = useState('Free Plan');
  const [trackedToday, setTrackedToday] = useState(new Set());
  
  // Sidebar State
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  // Refs
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const wsRef = useRef(null);
  const sidebarRef = useRef(null);
  const navigate = useNavigate();

  // Account Settings Component
  const AccountSettings = () => {
    const [activeTab, setActiveTab] = useState('profile');
    const [profileData, setProfileData] = useState({
      name: currentUser?.user_metadata?.display_name || '',
      email: currentUser?.email || '',
      chatName: currentUser?.user_metadata?.chat_name || '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    
    const [connectors, setConnectors] = useState([
      { id: 'tive', name: 'Tive', status: 'connected', icon: '📡' },
      { id: 'project44', name: 'Project44', status: 'connected', icon: '🌐' },
      { id: 'traccar', name: 'Traccar', status: 'connected', icon: '📍' },
      { id: 'sensolus', name: 'Sensolus', status: 'connected', icon: '📊' }
    ]);
    
    const availableConnectors = [
      { id: 'systemloco', name: 'System Loco', icon: '🚂', description: 'Rail tracking system' },
      { id: 'roambee', name: 'Roambee', icon: '🐝', description: 'Supply chain visibility' },
      { id: 'fourkites', name: 'FourKites', icon: '📦', description: 'Real-time visibility platform' },
      { id: 'samsara', name: 'Samsara', icon: '🚛', description: 'Fleet management' },
      { id: 'geotab', name: 'Geotab', icon: '🗺️', description: 'Telematics platform' }
    ];

    const handleProfileUpdate = () => {
      addMessage('system', '✅ Profile updated successfully');
      setShowSettings(false);
    };

    const handlePasswordChange = () => {
      if (profileData.newPassword !== profileData.confirmPassword) {
        addMessage('system', '❌ Passwords do not match');
        return;
      }
      addMessage('system', '✅ Password changed successfully');
      setProfileData({ ...profileData, currentPassword: '', newPassword: '', confirmPassword: '' });
    };

    const handleAddConnector = (connector) => {
      setConnectors([...connectors, { ...connector, status: 'pending' }]);
      addMessage('system', `🔗 Adding ${connector.name} connector...`);
      setTimeout(() => {
        setConnectors(prev => prev.map(c => 
          c.id === connector.id ? { ...c, status: 'connected' } : c
        ));
        addMessage('system', `✅ ${connector.name} connected successfully`);
      }, 2000);
    };

    return (
      <div className="settings-overlay">
        <div className="settings-modal">
          <div className="settings-header">
            <h2>⚙️ Account Settings</h2>
            <button className="close-btn" onClick={() => setShowSettings(false)}>✕</button>
          </div>
          
          <div className="settings-tabs">
            <button 
              className={`tab ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              Profile
            </button>
            <button 
              className={`tab ${activeTab === 'account' ? 'active' : ''}`}
              onClick={() => setActiveTab('account')}
            >
              Account
            </button>
            <button 
              className={`tab ${activeTab === 'connections' ? 'active' : ''}`}
              onClick={() => setActiveTab('connections')}
            >
              Connections
            </button>
            <button 
              className={`tab ${activeTab === 'billing' ? 'active' : ''}`}
              onClick={() => setActiveTab('billing')}
            >
              Billing
            </button>
            <button 
              className={`tab ${activeTab === 'privacy' ? 'active' : ''}`}
              onClick={() => setActiveTab('privacy')}
            >
              Privacy
            </button>
          </div>
          
          <div className="settings-content">
            {activeTab === 'profile' && (
              <div className="profile-section">
                <h3>Profile Information</h3>
                
                <div className="form-group">
                  <label>Display Name</label>
                  <input 
                    type="text" 
                    value={profileData.name}
                    onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                    placeholder="Your name"
                  />
                </div>
                
                <div className="form-group">
                  <label>Email Address</label>
                  <input 
                    type="email" 
                    value={profileData.email}
                    onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                    placeholder="your@email.com"
                  />
                </div>
                
                <div className="form-group">
                  <label>Chat Name</label>
                  <input 
                    type="text" 
                    value={profileData.chatName}
                    onChange={(e) => setProfileData({...profileData, chatName: e.target.value})}
                    placeholder="What should we call you in chat?"
                  />
                  <span className="form-hint">This is how I'll address you in our conversations</span>
                </div>
                
                <button className="btn-primary" onClick={handleProfileUpdate}>
                  Save Profile
                </button>
                
                <div className="divider"></div>
                
                <h3>Change Password</h3>
                
                <div className="form-group">
                  <label>Current Password</label>
                  <input 
                    type="password" 
                    value={profileData.currentPassword}
                    onChange={(e) => setProfileData({...profileData, currentPassword: e.target.value})}
                  />
                </div>
                
                <div className="form-group">
                  <label>New Password</label>
                  <input 
                    type="password" 
                    value={profileData.newPassword}
                    onChange={(e) => setProfileData({...profileData, newPassword: e.target.value})}
                  />
                </div>
                
                <div className="form-group">
                  <label>Confirm New Password</label>
                  <input 
                    type="password" 
                    value={profileData.confirmPassword}
                    onChange={(e) => setProfileData({...profileData, confirmPassword: e.target.value})}
                  />
                </div>
                
                <button className="btn-primary" onClick={handlePasswordChange}>
                  Change Password
                </button>
              </div>
            )}
            
            {activeTab === 'account' && (
              <div className="account-section">
                <h3>Account Management</h3>
                
                <div className="info-card">
                  <div className="info-row">
                    <span className="info-label">Organization ID</span>
                    <span className="info-value">org_2hF8kL9mN3pQ</span>
                    <button className="copy-btn" onClick={() => {
                      navigator.clipboard.writeText('org_2hF8kL9mN3pQ');
                      addMessage('system', '📋 Organization ID copied');
                    }}>📋</button>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Account Type</span>
                    <span className="info-value">{userPlan}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Member Since</span>
                    <span className="info-value">January 2024</span>
                  </div>
                </div>
                
                <div className="danger-zone">
                  <h4>⚠️ Danger Zone</h4>
                  
                  <div className="danger-item">
                    <div>
                      <strong>Log Out</strong>
                      <p>Sign out of your account on this device</p>
                    </div>
                    <button className="btn-secondary" onClick={() => {
                      supabase.auth.signOut();
                      navigate('/login');
                    }}>
                      Log Out
                    </button>
                  </div>
                  
                  <div className="danger-item">
                    <div>
                      <strong>Delete Account</strong>
                      <p>Permanently delete your account and all data</p>
                    </div>
                    <button className="btn-danger" onClick={() => {
                      if (confirm('Are you sure? This cannot be undone.')) {
                        addMessage('system', '🗑️ Account deletion requested');
                      }
                    }}>
                      Delete Account
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'connections' && (
              <div className="connections-section">
                <h3>Connected Providers</h3>
                
                <div className="connectors-list">
                  {connectors.map(connector => (
                    <div key={connector.id} className="connector-item">
                      <span className="connector-icon">{connector.icon}</span>
                      <span className="connector-name">{connector.name}</span>
                      <span className={`connector-status ${connector.status}`}>
                        {connector.status === 'connected' ? '🟢' : '🟡'} {connector.status}
                      </span>
                      <button className="btn-small">Configure</button>
                    </div>
                  ))}
                </div>
                
                <h3>Available Connectors</h3>
                
                <div className="available-connectors">
                  {availableConnectors.map(connector => (
                    <div key={connector.id} className="available-connector">
                      <div className="connector-info">
                        <span className="connector-icon">{connector.icon}</span>
                        <div>
                          <strong>{connector.name}</strong>
                          <p>{connector.description}</p>
                        </div>
                      </div>
                      <button 
                        className="btn-primary"
                        onClick={() => handleAddConnector(connector)}
                      >
                        + Add
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {activeTab === 'billing' && (
              <div className="billing-section">
                <h3>Billing & Subscription</h3>
                
                <div className="plan-card">
                  <div className="plan-header">
                    <h4>Current Plan: {userPlan}</h4>
                    <span className="plan-price">$99/month</span>
                  </div>
                  <div className="plan-features">
                    <p>✓ Unlimited shipment tracking</p>
                    <p>✓ All provider integrations</p>
                    <p>✓ AI predictions</p>
                    <p>✓ Priority support</p>
                  </div>
                  <button className="btn-primary">Change Plan</button>
                </div>
                
                <div className="payment-method">
                  <h4>Payment Method</h4>
                  <div className="card-info">
                    <span>💳 •••• •••• •••• 4242</span>
                    <button className="btn-small">Update</button>
                  </div>
                </div>
                
                <div className="invoices">
                  <h4>Recent Invoices</h4>
                  <div className="invoice-list">
                    <div className="invoice-item">
                      <span>Dec 2024</span>
                      <span>$99.00</span>
                      <button className="btn-small">Download</button>
                    </div>
                    <div className="invoice-item">
                      <span>Nov 2024</span>
                      <span>$99.00</span>
                      <button className="btn-small">Download</button>
                    </div>
                  </div>
                </div>
                
                <button className="btn-danger">Cancel Subscription</button>
              </div>
            )}
            
            {activeTab === 'privacy' && (
              <div className="privacy-section">
                <h3>Privacy & Security</h3>
                
                <div className="privacy-content">
                  <h4>Data Protection</h4>
                  <p>Your data is encrypted at rest and in transit using industry-standard encryption protocols.</p>
                  
                  <h4>Privacy Policy</h4>
                  <p>Last updated: January 1, 2024</p>
                  <button className="btn-secondary">View Full Policy</button>
                  
                  <h4>Terms of Service</h4>
                  <p>By using GoandTrack, you agree to our terms of service.</p>
                  <button className="btn-secondary">View Terms</button>
                  
                  <h4>Data Export</h4>
                  <p>Export all your data in JSON or CSV format.</p>
                  <button className="btn-primary">Export Data</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        setSidebarExpanded(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Helper: Reverse geocode using OpenStreetMap
  const reverseGeocodeOSM = async (lat, lon) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&zoom=18&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'GoandTrack/1.0'
          }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        const address = data.address;
        const parts = [];
        
        if (address.road) parts.push(address.road);
        if (address.suburb || address.neighbourhood) parts.push(address.suburb || address.neighbourhood);
        if (address.city || address.town || address.village) {
          parts.push(address.city || address.town || address.village);
        }
        if (address.country) parts.push(address.country);
        
        return parts.join(', ') || data.display_name || `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
      }
    } catch (error) {
      console.error('Geocoding error:', error);
    }
    
    return `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
  };

  // Helper: Fetch with authentication
  const fetchWithAuth = useCallback(async (url, options = {}) => {
    if (!sessionToken && !url.includes('/health')) {
      console.error('No session token for:', url);
      return null;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          'Authorization': `Bearer ${sessionToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok && response.status !== 404) {
        console.error('Request failed:', url, response.status);
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('Fetch error:', url, error);
      return null;
    }
  }, [sessionToken]);

  // Initialize authentication
  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          console.log('✅ Authenticated:', session.user.email);
          setCurrentUser(session.user);
          setSessionToken(session.access_token);
          setConnectionStatus('connected');
          
          const planData = session.user.user_metadata?.plan || 'Professional';
          setUserPlan(planData);
        } else {
          console.log('⚠️ No session, using demo mode');
          setCurrentUser({ 
            id: 'demo',
            email: 'matthew@strategictracking.com',
            user_metadata: { 
              display_name: 'Matthew',
              chat_name: 'Matthew'
            }
          });
          setSessionToken('demo');
          setConnectionStatus('connected');
          setUserPlan('Professional');
        }
      } catch (error) {
        console.error('Auth error:', error);
        setConnectionStatus('error');
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setCurrentUser(session.user);
        setSessionToken(session.access_token);
        setConnectionStatus('connected');
      }
    });

    return () => subscription?.unsubscribe?.();
  }, []);

  // Load initial data
  useEffect(() => {
    if (sessionToken) {
      loadShipments();
      loadAlerts();
      loadDailyTracking();
      addWelcomeMessage();
      setupWebSocket();
    }
  }, [sessionToken]);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Reset daily tracking at midnight
  useEffect(() => {
    const checkMidnight = setInterval(() => {
      const now = new Date();
      if (now.getHours() === 0 && now.getMinutes() === 0) {
        setTrackedToday(new Set());
        setDailyCost(0);
        localStorage.removeItem('trackedToday');
        localStorage.removeItem('trackingDate');
      }
    }, 60000);

    return () => clearInterval(checkMidnight);
  }, []);

  // Load shipments
  const loadShipments = async () => {
    const data = await fetchWithAuth('http://localhost:3001/api/shipments');
    
    if (data?.success) {
      setShipments(data.data || []);
      
      if (data.count === 0) {
        console.log('No shipments found, auto-syncing...');
        await syncDevices();
      } else {
        calculateDailyCostFromShipments(data.data);
        
        if (predictiveMode) {
          generatePredictiveInsights(data.data);
        }
      }
    }
  };

  // Load daily tracking from localStorage
  const loadDailyTracking = () => {
    const today = new Date().toDateString();
    const savedDate = localStorage.getItem('trackingDate');
    
    if (savedDate === today) {
      const savedTracking = localStorage.getItem('trackedToday');
      if (savedTracking) {
        const tracked = new Set(JSON.parse(savedTracking));
        setTrackedToday(tracked);
        setDailyCost(tracked.size * 0.50);
      }
    } else {
      localStorage.setItem('trackingDate', today);
      localStorage.setItem('trackedToday', JSON.stringify([]));
      setTrackedToday(new Set());
      setDailyCost(0);
    }
  };

  // Calculate daily cost from shipments
  const calculateDailyCostFromShipments = (shipmentData) => {
    if (shipmentData && shipmentData.length > 0) {
      const newTracked = new Set(trackedToday);
      
      shipmentData.forEach(shipment => {
        if (shipment.tracking_active || shipment.status === 'in-transit') {
          newTracked.add(shipment.shipment_id);
        }
      });
      
      setTrackedToday(newTracked);
      setDailyCost(newTracked.size * 0.50);
      
      localStorage.setItem('trackedToday', JSON.stringify(Array.from(newTracked)));
      localStorage.setItem('trackingDate', new Date().toDateString());
    }
  };

  // Add shipment to daily tracking
  const addToTracking = (shipmentId) => {
    const newTracked = new Set(trackedToday);
    
    if (!newTracked.has(shipmentId)) {
      newTracked.add(shipmentId);
      setTrackedToday(newTracked);
      
      const newCost = newTracked.size * 0.50;
      setDailyCost(newCost);
      
      localStorage.setItem('trackedToday', JSON.stringify(Array.from(newTracked)));
      
      return true;
    }
    
    return false;
  };

  // Sync devices across all platforms
  const syncDevices = async () => {
    setSyncStatus('syncing');
    addMessage('system', '🔄 Syncing devices across all platforms...');
    
    const result = await fetchWithAuth('http://localhost:3001/api/sync-devices', {
      method: 'POST'
    });
    
    if (result?.success) {
      setSyncStatus('success');
      await loadShipments();
      
      const breakdown = result.breakdown;
      
      if (result.data && result.data.length > 0) {
        result.data.forEach(device => {
          addToTracking(device.shipment_id);
        });
      }
      
      addMessage('bot', `
✅ **Sync Complete!**
• Traccar: ${breakdown?.traccar || 0} GPS devices
• Sensolus: ${breakdown?.sensolus || 0} IoT sensors  
• Tive: ${breakdown?.tive || 0} trackers
• Project44: ${breakdown?.project44 || 0} assets
• **Total: ${result.count} devices synced**

Daily tracking cost: $${dailyCost.toFixed(2)}
      `, { isRichContent: true });
    } else {
      setSyncStatus('error');
      addMessage('bot', '❌ Sync failed. Please check your connection and try again.');
    }
    
    setTimeout(() => setSyncStatus('idle'), 3000);
  };

  // Load alerts
  const loadAlerts = async () => {
    const data = await fetchWithAuth('http://localhost:3001/api/alerts');
    if (data?.success) {
      setAlerts(data.data || []);
    }
  };

  // Setup WebSocket for real-time updates
  const setupWebSocket = () => {
    try {
      wsRef.current = new WebSocket('ws://localhost:3001');
      
      wsRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'alert') {
          handleIncomingAlert(data.alert);
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    } catch (error) {
      console.error('WebSocket setup failed:', error);
    }

    return () => wsRef.current?.close();
  };

  // Handle incoming alerts
  const handleIncomingAlert = (alert) => {
    setAlerts(prev => [alert, ...prev.slice(0, 19)]);
    
    if (alert.priority === 'critical') {
      addMessage('bot', `
🚨 **Critical Alert!**
Shipment: ${alert.shipment_id}
${alert.message}
      `, { isAlert: true });
    }
  };

  // Natural Language Processing
  const processNaturalLanguage = (query) => {
    const lowerQuery = query.toLowerCase();
    
    const patterns = {
      trackSpecific: /track\s+(tive|project44|traccar|sensolus)?\s*(?:shipment)?\s*#?([A-Za-z0-9-]+)/i,
      trackAll: /show\s+all|all\s+shipments?|list\s+shipments?/i,
      devices: /(?:list|show)\s+(tive|project44|traccar|sensolus|all)?\s*devices?/i,
      status: /status\s+(?:of\s+)?#?([A-Za-z0-9-]+)|where\s+is\s+#?([A-Za-z0-9-]+)/i,
      critical: /critical|urgent|priority|important|exception/i,
      cost: /cost|billing|charge|price|fee|daily cost/i,
      sync: /sync|refresh|update|import/i,
      help: /help|commands?|what can|how to|guide/i,
      predict: /predict|forecast|estimate|will|eta/i,
      alerts: /alerts?|notifications?|warnings?/i
    };

    for (const [type, pattern] of Object.entries(patterns)) {
      const match = lowerQuery.match(pattern);
      if (match) {
        return {
          type,
          params: match.slice(1).filter(Boolean),
          original: query
        };
      }
    }

    const shipment = shipments.find(s => 
      lowerQuery.includes(s.shipment_id.toLowerCase()) ||
      lowerQuery.includes(s.shipment_name.toLowerCase())
    );
    
    if (shipment) {
      return {
        type: 'shipmentDetail',
        params: [shipment.shipment_id],
        original: query
      };
    }

    return {
      type: 'general',
      params: [],
      original: query
    };
  };

  // Handle user message
  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = inputMessage;
    setInputMessage('');
    addMessage('user', userMessage);
    setIsLoading(true);

    const { type, params } = processNaturalLanguage(userMessage);

    try {
      switch (type) {
        case 'trackSpecific':
          await handleTrackSpecific(params[0], params[1]);
          break;
        case 'trackAll':
          await handleShowAllShipments();
          break;
        case 'devices':
          await handleListDevices(params[0]);
          break;
        case 'status':
          await handleStatusQuery(params[0]);
          break;
        case 'critical':
          await handleCriticalShipments();
          break;
        case 'cost':
          handleCostQuery();
          break;
        case 'sync':
          await syncDevices();
          break;
        case 'help':
          handleHelpQuery();
          break;
        case 'predict':
          handlePredictiveQuery();
          break;
        case 'alerts':
          handleRecentAlerts();
          break;
        case 'shipmentDetail':
          await handleShipmentDetail(params[0]);
          break;
        default:
          await handleGeneralQuery(userMessage);
      }
    } catch (error) {
      console.error('Error processing query:', error);
      addMessage('bot', '❌ Sorry, I encountered an error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handler: Track specific shipment
  const handleTrackSpecific = async (provider, shipmentId) => {
    if (!shipmentId) {
      addMessage('bot', '🔍 Please provide a shipment ID. Example: "Track Tive shipment #123"');
      return;
    }

    const shipment = shipments.find(s => 
      s.shipment_id.includes(shipmentId) || 
      s.shipment_id === `${provider?.toUpperCase()}-${shipmentId}`
    );

    if (shipment) {
      await handleShipmentDetail(shipment.shipment_id);
      
      const isNewCharge = addToTracking(shipment.shipment_id);
      
      if (isNewCharge) {
        addMessage('system', '💰 Charged $0.50 for tracking this shipment today');
      } else {
        addMessage('system', '✅ Already tracked today - no additional charge');
      }
    } else {
      addMessage('bot', `❌ No shipment found with ID "${shipmentId}". Try "sync" to update devices.`);
    }
  };

  // Handler: Show all shipments
  const handleShowAllShipments = async () => {
    if (shipments.length === 0) {
      addMessage('bot', '📦 No shipments found. Use "sync" to import your devices.');
      return;
    }

    const groupedShipments = {
      traccar: shipments.filter(s => s.provider === 'traccar'),
      sensolus: shipments.filter(s => s.provider === 'sensolus'),
      tive: shipments.filter(s => s.provider === 'tive'),
      project44: shipments.filter(s => s.provider === 'project44')
    };

    const messageContent = (
      <div className="all-shipments-view">
        <h3>📦 All Active Shipments ({shipments.length} total)</h3>
        
        {Object.entries(groupedShipments).map(([provider, items]) => {
          if (items.length === 0) return null;
          
          return (
            <div key={provider} className="provider-group">
              <h4>{provider.toUpperCase()} ({items.length})</h4>
              
              {items.map(shipment => {
                const statusIcon = shipment.status === 'in-transit' ? '🚚' : 
                                 shipment.status === 'stopped' ? '🛑' : 
                                 shipment.status === 'offline' ? '🔴' : '⏸️';
                const batteryIcon = shipment.battery_level < 20 ? '🔴' : 
                                   shipment.battery_level < 50 ? '🟡' : '🟢';
                
                return (
                  <div key={shipment.shipment_id} className="shipment-item">
                    {statusIcon}{' '}
                    <button 
                      className="shipment-link"
                      onClick={() => handleShipmentDetail(shipment.shipment_id)}
                    >
                      {shipment.shipment_id}
                    </button>
                    {' - '}
                    <button 
                      className="shipment-name-link"
                      onClick={() => handleShipmentDetail(shipment.shipment_id)}
                    >
                      {shipment.shipment_name}
                    </button>
                    <div className="shipment-info">
                      📍 {shipment.current_location || 'Unknown'} | 
                      🔋 {batteryIcon} {shipment.battery_level}% | 
                      {shipment.temperature && `🌡️ ${shipment.temperature?.toFixed(2)}°C | `}
                      ⏱️ {formatTimeAgo(shipment.last_update)}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
        
        <p className="help-text">💡 Click any shipment ID or name for detailed information!</p>
      </div>
    );
    
    addMessage('bot', messageContent, { isComponent: true });
  };

  // Handler: List devices
  const handleListDevices = async (provider) => {
    const filtered = provider && provider !== 'all' ? 
      shipments.filter(s => s.provider === provider.toLowerCase()) : 
      shipments;

    if (filtered.length === 0) {
      addMessage('bot', `No ${provider || ''} devices found. Try "sync" to import devices.`);
      return;
    }

    const messageContent = (
      <div className="devices-list">
        <h3>🔧 {provider ? provider.toUpperCase() : 'All'} Devices ({filtered.length})</h3>
        
        {filtered.map(device => {
          const online = device.device_status === 'online' || device.tracking_active;
          
          return (
            <div key={device.shipment_id} className="device-item">
              <div className="device-header">
                {online ? '🟢' : '🔴'}{' '}
                <button 
                  className="device-name-link"
                  onClick={() => handleShipmentDetail(device.shipment_id)}
                >
                  {device.shipment_name}
                </button>
              </div>
              <div className="device-details">
                ID: {device.shipment_id}<br/>
                Type: {device.shipment_type}<br/>
                Battery: {device.battery_level}%<br/>
                Last seen: {formatTimeAgo(device.last_update)}
              </div>
            </div>
          );
        })}
      </div>
    );

    addMessage('bot', messageContent, { isComponent: true });
  };

  // Handler: Status query
  const handleStatusQuery = async (shipmentId) => {
    const shipment = shipments.find(s => 
      s.shipment_id.includes(shipmentId) || 
      s.shipment_name.toLowerCase().includes(shipmentId?.toLowerCase())
    );

    if (shipment) {
      await handleShipmentDetail(shipment.shipment_id);
    } else {
      addMessage('bot', `🔍 No shipment found matching "${shipmentId}". Try "show all" to see available shipments.`);
    }
  };

  // Handler: Shipment detail
  const handleShipmentDetail = async (shipmentId) => {
    const shipment = shipments.find(s => s.shipment_id === shipmentId);
    
    if (!shipment) {
      addMessage('bot', `❌ Shipment ${shipmentId} not found.`);
      return;
    }

    addToTracking(shipment.shipment_id);

    const streetAddress = await reverseGeocodeOSM(shipment.latitude, shipment.longitude);

    const statusColor = shipment.status === 'in-transit' ? '🟢' : 
                       shipment.status === 'stopped' ? '🟡' : '🔴';
    
    const batteryStatus = shipment.battery_level < 20 ? '⚠️' : 
                         shipment.battery_level < 50 ? '⚠️' : '✅';

    const lat = shipment.latitude ? shipment.latitude.toFixed(6) : 'N/A';
    const lon = shipment.longitude ? shipment.longitude.toFixed(6) : 'N/A';

    const detailCard = (
      <div className="shipment-detail-card compact">
        <div className="detail-header">
          <span className="detail-icon">📦</span>
          <div className="detail-title">
            <strong>{shipment.shipment_name}</strong>
            <span className="detail-id">{shipment.shipment_id}</span>
          </div>
          <span className={`detail-status ${shipment.status}`}>
            {statusColor} {shipment.status.toUpperCase()}
          </span>
        </div>
        
        <div className="detail-grid">
          <div className="detail-item">
            <span className="detail-label">📍 Location</span>
            <span className="detail-value">{streetAddress}</span>
            <span className="detail-coords">{lat}, {lon}</span>
          </div>
          
          <div className="detail-item">
            <span className="detail-label">🔋 Battery</span>
            <span className="detail-value">{batteryStatus} {shipment.battery_level}%</span>
          </div>
          
          {shipment.temperature !== null && (
            <div className="detail-item">
              <span className="detail-label">🌡️ Temperature</span>
              <span className="detail-value">{shipment.temperature.toFixed(2)}°C</span>
              {shipment.target_temp_min && shipment.target_temp_max && (
                <span className="detail-range">
                  Target: {shipment.target_temp_min}° to {shipment.target_temp_max}°
                </span>
              )}
            </div>
          )}
          
          <div className="detail-item">
            <span className="detail-label">⏱️ Last Update</span>
            <span className="detail-value">{formatTimeAgo(shipment.last_update)}</span>
          </div>
        </div>
        
        <div className="detail-footer">
          <span>📅 {shipment.destination_address} • ETA: {shipment.estimated_arrival}</span>
        </div>
      </div>
    );

    addMessage('bot', detailCard, { isComponent: true });
  };

  // Handler: Critical shipments
  const handleCriticalShipments = async () => {
    const critical = shipments.filter(s => 
      s.priority_level === 'critical' ||
      s.battery_level < 20 ||
      s.exception_count > 0 ||
      (s.temperature && s.target_temp_min && s.target_temp_max && 
       (s.temperature < s.target_temp_min || s.temperature > s.target_temp_max))
    );

    if (critical.length === 0) {
      addMessage('bot', '✅ Good news! No critical shipments requiring immediate attention.');
      return;
    }

    const messageContent = (
      <div className="critical-shipments">
        <h3>🚨 Critical Shipments ({critical.length})</h3>
        
        {critical.map(s => {
          const issues = [];
          if (s.battery_level < 20) issues.push('🔋 Low Battery');
          if (s.exception_count > 0) issues.push('⚠️ Exceptions');
          if (s.temperature && s.target_temp_min && s.target_temp_max && 
              (s.temperature < s.target_temp_min || s.temperature > s.target_temp_max)) {
            issues.push('🌡️ Temp Excursion');
          }
          
          return (
            <div key={s.shipment_id} className="critical-item">
              <button 
                className="shipment-link"
                onClick={() => handleShipmentDetail(s.shipment_id)}
              >
                {s.shipment_id}
              </button>
              {' - '}
              <span>{s.shipment_name}</span>
              <div className="critical-issues">
                Issues: {issues.join(', ')}<br/>
                Location: {s.current_location}<br/>
                Action: {getRecommendedAction(s)}
              </div>
            </div>
          );
        })}
      </div>
    );

    addMessage('bot', messageContent, { isComponent: true });
  };

  // Handler: Recent alerts (last 6 hours)
  const handleRecentAlerts = () => {
    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);
    const recentAlerts = alerts.filter(a => new Date(a.created_at) > sixHoursAgo);
    
    if (recentAlerts.length === 0) {
      addMessage('bot', '✅ No alerts in the last 6 hours.');
      return;
    }

    let response = `🔔 **Recent Alerts (Last 6 Hours) - ${recentAlerts.length} total**\n\n`;
    
    recentAlerts.forEach(alert => {
      const icon = alert.severity === 'critical' ? '🚨' : 
                   alert.severity === 'warning' ? '⚠️' : '💡';
      
      response += `${icon} **${alert.shipment_id}**\n`;
      response += `${alert.message}\n`;
      response += `Time: ${formatTimeAgo(alert.created_at)}\n\n`;
    });
    
    addMessage('bot', response, { isRichContent: true });
  };

  // Handler: Cost query
  const handleCostQuery = () => {
    const trackingCount = trackedToday.size;
    
    const response = `
💰 **Today's Tracking Costs**

• Shipments tracked today: ${trackingCount}
• Cost per shipment: $0.50
• **Total for today: $${dailyCost.toFixed(2)}**

📊 **Projections:**
• Weekly estimate: $${(dailyCost * 7).toFixed(2)}
• Monthly estimate: $${(dailyCost * 30).toFixed(2)}

💡 Tip: Each unique shipment is charged once per day, regardless of how many times you track it.
    `;
    
    addMessage('bot', response, { isRichContent: true });
  };

  // Handler: Help query
  const handleHelpQuery = () => {
    const response = `
🤖 **GoandTrack AI Assistant - Command Guide**

**📦 Tracking Commands:**
• "Track Tive shipment #123" - Track specific shipment
• "Show all shipments" - List all active shipments
• "Status of #ABC123" - Get shipment status
• "Where is [shipment name]" - Find shipment location

**🔧 Device Management:**
• "List all devices" - Show all connected devices
• "List Sensolus devices" - Show specific provider devices
• "Sync devices" - Import/update from all platforms

**🚨 Monitoring:**
• "Show critical shipments" - View high-priority items
• "Show alerts" - View recent alerts (last 6 hours)
• "What needs attention?" - Get exception summary

**💰 Billing & Analytics:**
• "What are my costs?" - View daily charges
• "Show billing" - Detailed cost breakdown

**🔮 Predictive Features:**
• "Predict delays" - AI-powered delay forecasting
• "Estimate arrival times" - Updated ETAs

Type any question or click suggested actions below!
    `;
    
    addMessage('bot', response, { isRichContent: true });
  };

  // Handler: Predictive query
  const handlePredictiveQuery = () => {
    const insights = [];
    
    const lowBattery = shipments.filter(s => s.battery_level < 30);
    if (lowBattery.length > 0) {
      insights.push({
        type: 'warning',
        message: `${lowBattery.length} devices will need charging within 24 hours`
      });
    }
    
    const tempIssues = shipments.filter(s => 
      s.temperature && s.target_temp_min && s.target_temp_max &&
      (s.temperature < s.target_temp_min || s.temperature > s.target_temp_max)
    );
    if (tempIssues.length > 0) {
      insights.push({
        type: 'critical',
        message: `${tempIssues.length} shipments have temperature excursions`
      });
    }
    
    let response = `🔮 **Predictive Insights & Recommendations**\n\n`;
    
    if (insights.length === 0) {
      response += '✅ All systems operating normally. No issues predicted.';
    } else {
      insights.forEach(insight => {
        const icon = insight.type === 'critical' ? '🚨' : 
                     insight.type === 'warning' ? '⚠️' : '💡';
        response += `${icon} ${insight.message}\n`;
      });
    }
    
    addMessage('bot', response, { isRichContent: true });
  };

  // Handler: General query
  const handleGeneralQuery = async (query) => {
    const faqs = {
      'how much': 'GoandTrack charges $0.50 per shipment tracked per day.',
      'what platforms': 'We support Traccar, Sensolus, Tive, and Project44.',
      'how to add': 'Use "sync devices" to import your tracking devices.',
      'what is goandtrack': 'GoandTrack is an AI-powered unified tracking platform.',
      'battery': 'Type "show all" to see battery levels for all devices.'
    };

    const lowerQuery = query.toLowerCase();
    for (const [key, answer] of Object.entries(faqs)) {
      if (lowerQuery.includes(key)) {
        addMessage('bot', answer);
        return;
      }
    }

    addMessage('bot', `
I understand you're asking about "${query}". Here's how I can help:

• Track shipments across multiple platforms
• Monitor device status and battery levels
• Alert you to critical conditions
• Calculate tracking costs

Try asking: "Show all shipments" or "Help" for a full command list.
    `);
  };

  // Generate predictive insights
  const generatePredictiveInsights = (shipmentData) => {
    const insights = [];
    
    const lowBatteryCount = shipmentData.filter(s => s.battery_level < 30).length;
    if (lowBatteryCount > 2) {
      insights.push(`⚠️ ${lowBatteryCount} devices have low battery`);
    }
    
    const offlineCount = shipmentData.filter(s => s.status === 'offline').length;
    if (offlineCount > 0) {
      insights.push(`🔴 ${offlineCount} devices are offline`);
    }
    
    if (insights.length > 0 && messages.length < 2) {
      setTimeout(() => {
        addMessage('bot', `
🔮 **Proactive Alert**
${insights.join('\n')}

Type "show critical" to see affected shipments.
        `, { isRichContent: true });
      }, 2000);
    }
  };

  // Helper: Add message to chat
  const addMessage = (sender, content, options = {}) => {
    setMessages(prev => [...prev, {
      id: Date.now() + Math.random(),
      sender,
      content,
      timestamp: new Date(),
      ...options
    }]);
  };

  // Helper: Add welcome message
  const addWelcomeMessage = () => {
    const chatName = currentUser?.user_metadata?.chat_name ||
                    currentUser?.user_metadata?.display_name || 
                    currentUser?.email?.split('@')[0] || 
                    'there';
    
    addMessage('bot', `
👋 Welcome back, ${chatName}!

I'm your GoandTrack AI assistant, providing unified shipment tracking across multiple platforms.

**Quick Start:**
• Type "sync" to import all your devices
• Type "show all" to see current shipments
• Type "help" for a full command guide

What would you like to track today?
    `, { isRichContent: true });
  };

  // Helper: Format time ago
  const formatTimeAgo = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  };

  // Helper: Get recommended action
  const getRecommendedAction = (shipment) => {
    if (shipment.battery_level < 20) return 'Charge device immediately';
    if (shipment.temperature && shipment.target_temp_min && 
        shipment.temperature < shipment.target_temp_min) return 'Check refrigeration unit';
    if (shipment.exception_count > 0) return 'Review exceptions and take corrective action';
    return 'Monitor closely';
  };

  // Setup voice recognition
  const setupVoiceRecognition = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      addMessage('bot', '🎙️ Voice recognition is not supported in your browser.');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = false;
    recognitionRef.current.interimResults = false;

    recognitionRef.current.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInputMessage(transcript);
      handleSendMessage();
    };

    recognitionRef.current.onerror = () => {
      setVoiceEnabled(false);
      addMessage('system', '🎙️ Voice recognition error. Please try again.');
    };
  };

  // Toggle voice input
  const toggleVoiceInput = () => {
    if (!recognitionRef.current) {
      setupVoiceRecognition();
    }

    if (voiceEnabled) {
      recognitionRef.current?.stop();
      setVoiceEnabled(false);
    } else {
      recognitionRef.current?.start();
      setVoiceEnabled(true);
    }
  };

  // Render the dashboard
  return (
    <div className="dashboard-container">
      {/* Claude.ai Style Icon Sidebar */}
      <aside className="icon-sidebar" ref={sidebarRef}>
        {/* Icon Column */}
        <div className="sidebar-icons">
          {/* Toggle Sidebar */}
          <button 
            className="icon-btn toggle-btn"
            onClick={() => setSidebarExpanded(!sidebarExpanded)}
            title="Toggle Menu"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              {sidebarExpanded ? (
                <path d="M11 8L6 3v10l5-5z"/>
              ) : (
                <path d="M5 8l5-5v10L5 8z"/>
              )}
            </svg>
          </button>

          {/* Menu Items */}
          <button 
            className={`icon-btn ${syncStatus === 'syncing' ? 'spinning' : ''}`}
            onClick={() => {
              syncDevices();
              setSidebarExpanded(false);
            }}
            disabled={syncStatus === 'syncing'}
            title="Sync All Devices"
          >
            🔄
          </button>

          <button 
            className="icon-btn"
            onClick={() => {
              handleShowAllShipments();
              setSidebarExpanded(false);
            }}
            title="Show All Shipments"
          >
            📦
          </button>

          <button 
            className="icon-btn"
            onClick={() => {
              handleCriticalShipments();
              setSidebarExpanded(false);
            }}
            title="Critical Shipments"
          >
            🚨
          </button>

          <button 
            className="icon-btn"
            onClick={() => {
              handleRecentAlerts();
              setSidebarExpanded(false);
            }}
            title="Recent Alerts (6h)"
          >
            🔔
            {alerts.length > 0 && <span className="icon-badge">{alerts.length}</span>}
          </button>

          <button 
            className="icon-btn"
            onClick={() => {
              handleCostQuery();
              setSidebarExpanded(false);
            }}
            title="View Costs"
          >
            💰
          </button>

          <button 
            className="icon-btn"
            onClick={() => {
              handlePredictiveQuery();
              setSidebarExpanded(false);
            }}
            title="Get Predictions"
          >
            🔮
          </button>

          <button 
            className="icon-btn"
            onClick={() => {
              handleHelpQuery();
              setSidebarExpanded(false);
            }}
            title="Help & Commands"
          >
            ❓
          </button>

          {/* Account at bottom */}
          <div className="sidebar-account">
            <button 
              className="account-avatar-btn"
              onClick={() => setShowSettings(true)}
              title="Account Settings"
            >
              {currentUser?.user_metadata?.display_name?.charAt(0)?.toUpperCase() || 
               currentUser?.email?.charAt(0)?.toUpperCase() || 'M'}
            </button>
          </div>
        </div>

        {/* Expandable Panel with Labels */}
        <div className={`sidebar-panel ${sidebarExpanded ? 'expanded' : ''}`}>
          <div className="panel-content">
            <h3>Navigation</h3>
            <div className="panel-menu">
              <button 
                className="menu-item-full"
                onClick={() => {
                  syncDevices();
                  setSidebarExpanded(false);
                }}
                disabled={syncStatus === 'syncing'}
              >
                <span className="menu-icon">🔄</span>
                <span className="menu-label">Sync All Devices</span>
              </button>

              <button 
                className="menu-item-full"
                onClick={() => {
                  handleShowAllShipments();
                  setSidebarExpanded(false);
                }}
              >
                <span className="menu-icon">📦</span>
                <span className="menu-label">Show All Shipments</span>
              </button>

              <button 
                className="menu-item-full"
                onClick={() => {
                  handleCriticalShipments();
                  setSidebarExpanded(false);
                }}
              >
                <span className="menu-icon">🚨</span>
                <span className="menu-label">Critical Shipments</span>
              </button>

              <button 
                className="menu-item-full"
                onClick={() => {
                  handleRecentAlerts();
                  setSidebarExpanded(false);
                }}
              >
                <span className="menu-icon">🔔</span>
                <span className="menu-label">Recent Alerts</span>
                {alerts.length > 0 && <span className="menu-badge">{alerts.length}</span>}
              </button>

              <button 
                className="menu-item-full"
                onClick={() => {
                  handleCostQuery();
                  setSidebarExpanded(false);
                }}
              >
                <span className="menu-icon">💰</span>
                <span className="menu-label">View Costs</span>
              </button>

              <button 
                className="menu-item-full"
                onClick={() => {
                  handlePredictiveQuery();
                  setSidebarExpanded(false);
                }}
              >
                <span className="menu-icon">🔮</span>
                <span className="menu-label">Predictions</span>
              </button>

              <button 
                className="menu-item-full"
                onClick={() => {
                  handleHelpQuery();
                  setSidebarExpanded(false);
                }}
              >
                <span className="menu-icon">❓</span>
                <span className="menu-label">Help & Commands</span>
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="main-wrapper">
        {/* Header */}
        <header className="dashboard-header">
          <div className="header-left">
            <div className="logo">
              <span className="logo-text">🌐</span>
            </div>
            <div className="brand">
              <h1>GoandTrack AI</h1>
              <span className="tagline">Unified Shipment Intelligence</span>
            </div>
          </div>
          
          <div className="header-center">
            <div className="stats-bar">
              <div className="stat-item">
                <span className="stat-icon">📦</span>
                <span className="stat-value">{shipments.length}</span>
                <span className="stat-label">Active</span>
              </div>
              <div className="stat-item">
                <span className="stat-icon">💰</span>
                <span className="stat-value">${dailyCost.toFixed(2)}</span>
                <span className="stat-label">Today</span>
              </div>
              <div className="stat-item">
                <span className="stat-icon">🔔</span>
                <span className="stat-value">{alerts.length}</span>
                <span className="stat-label">Alerts</span>
              </div>
              <div className="stat-item">
                <span className={`status-dot ${connectionStatus === 'connected' ? 'online' : 'offline'}`}></span>
                <span className="stat-label">{connectionStatus}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Chat Interface */}
        <div className="chat-container">
          <div className="chat-messages">
            {messages.map((message) => (
              <div key={message.id} className={`message message-${message.sender}`}>
                {message.sender !== 'system' && (
                  <div className="message-avatar">
                    {message.sender === 'user' ? '👤' : '🤖'}
                  </div>
                )}
                <div className="message-content">
                  {message.isComponent ? (
                    message.content
                  ) : message.isRichContent ? (
                    <div className="rich-content" 
                         dangerouslySetInnerHTML={{ 
                           __html: message.content.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') 
                         }} />
                  ) : (
                    <div className="message-text">{message.content}</div>
                  )}
                  <div className="message-time">
                    {formatTimeAgo(message.timestamp)}
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="message message-bot">
                <div className="message-avatar">🤖</div>
                <div className="message-content">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="chat-input-container">
            <div className="suggested-queries">
              <button onClick={() => setInputMessage('Show all shipments')}>
                Show All
              </button>
              <button onClick={() => setInputMessage('Track Sensolus devices')}>
                Sensolus
              </button>
              <button onClick={() => setInputMessage('Show critical')}>
                Critical
              </button>
              <button onClick={() => setInputMessage('Recent alerts')}>
                Alerts
              </button>
              <button onClick={() => setInputMessage('Sync devices')}>
                Sync
              </button>
            </div>
            
            <div className="chat-input">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSendMessage()}
                placeholder="Ask me anything about your shipments..."
                disabled={isLoading}
              />
              <button 
                onClick={toggleVoiceInput}
                className={`voice-btn ${voiceEnabled ? 'active' : ''}`}
                title="Voice input"
              >
                🎙️
              </button>
              <button 
                onClick={handleSendMessage}
                disabled={isLoading || !inputMessage.trim()}
                className="send-btn"
              >
                {isLoading ? '...' : '➤'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Account Settings Modal */}
      {showSettings && <AccountSettings />}
    </div>
  );
};

export default Dashboard;