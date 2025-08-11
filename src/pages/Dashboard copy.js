// Dashboard.js - GoandTrack AI with Fixed Quick Actions and Cost Calculation
// V6: Complete version with working accordion menu and proper daily cost tracking

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
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false); // Accordion state
  const [userPlan, setUserPlan] = useState('Free Plan');
  const [trackedToday, setTrackedToday] = useState(new Set()); // Track unique shipments per day
  
  // Refs
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const wsRef = useRef(null);
  const accountMenuRef = useRef(null);
  const navigate = useNavigate();

  // Close account menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target)) {
        setShowAccountMenu(false);
      }
    };

    if (showAccountMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showAccountMenu]);

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
          
          const planData = session.user.user_metadata?.plan || 'Free Plan';
          setUserPlan(planData);
        } else {
          console.log('⚠️ No session, using demo mode');
          setCurrentUser({ 
            id: 'demo',
            email: 'matthew@strategictracking.com',
            user_metadata: { display_name: 'Matthew' }
          });
          setSessionToken('demo');
          setConnectionStatus('connected');
          setUserPlan('Free Plan');
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
    }, 60000); // Check every minute

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
        // Calculate cost based on active shipments
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
      // New day, reset tracking
      localStorage.setItem('trackingDate', today);
      localStorage.setItem('trackedToday', JSON.stringify([]));
      setTrackedToday(new Set());
      setDailyCost(0);
    }
  };

  // Calculate daily cost from active shipments
  const calculateDailyCostFromShipments = (shipmentData) => {
    // If we have shipments being tracked today, calculate the cost
    if (shipmentData && shipmentData.length > 0) {
      // Check if these shipments are already in today's tracking
      const newTracked = new Set(trackedToday);
      
      shipmentData.forEach(shipment => {
        if (shipment.tracking_active || shipment.status === 'in-transit') {
          newTracked.add(shipment.shipment_id);
        }
      });
      
      setTrackedToday(newTracked);
      setDailyCost(newTracked.size * 0.50);
      
      // Save to localStorage
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
      
      // Save to localStorage
      localStorage.setItem('trackedToday', JSON.stringify(Array.from(newTracked)));
      
      return true; // New tracking, charge applied
    }
    
    return false; // Already tracked today, no new charge
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
      
      // Add all synced devices to today's tracking
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
      
      // Add to tracking and check if it's a new charge
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

    // Add to tracking when viewing details
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
    const displayName = currentUser?.user_metadata?.display_name || 
                       currentUser?.user_metadata?.chat_name ||
                       currentUser?.email?.split('@')[0] || 
                       'there';
    
    addMessage('bot', `
👋 Welcome back, ${displayName}!

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

      {/* Main Content */}
      <div className="dashboard-main">
        {/* Sidebar with Collapsible Quick Actions */}
        <aside className="dashboard-sidebar">
          <div className="sidebar-section">
            <button 
              className="quick-actions-toggle"
              onClick={() => setShowQuickActions(!showQuickActions)}
            >
              <span className="toggle-icon">{showQuickActions ? '▼' : '▶'}</span>
              <span className="toggle-label">⚡ Quick Actions</span>
            </button>
            
            <div className={`quick-actions ${showQuickActions ? 'expanded' : 'collapsed'}`}>
              <button onClick={() => syncDevices()} disabled={syncStatus === 'syncing'}>
                {syncStatus === 'syncing' ? '🔄 Syncing...' : '🔄 Sync All Devices'}
              </button>
              <button onClick={() => handleShowAllShipments()}>
                📦 Show All Shipments
              </button>
              <button onClick={() => handleCriticalShipments()}>
                🚨 Critical Shipments
              </button>
              <button onClick={() => handleRecentAlerts()}>
                🔔 Recent Alerts (6h)
              </button>
              <button onClick={() => handleCostQuery()}>
                💰 View Costs
              </button>
              <button onClick={() => handlePredictiveQuery()}>
                🔮 Get Predictions
              </button>
              <button onClick={() => handleHelpQuery()}>
                ❓ Help & Commands
              </button>
            </div>
          </div>
          
          {/* Account Menu at Bottom */}
          <div className="sidebar-bottom">
            <div className="account-menu-container" ref={accountMenuRef}>
              <button 
                className="account-menu-trigger"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowAccountMenu(!showAccountMenu);
                }}
              >
                <div className="account-avatar">
                  {currentUser?.user_metadata?.display_name?.charAt(0)?.toUpperCase() || 
                   currentUser?.email?.charAt(0)?.toUpperCase() || 'M'}
                </div>
                <div className="account-info-inline">
                  <span className="account-name">
                    {currentUser?.user_metadata?.display_name || currentUser?.email?.split('@')[0] || 'Matthew'}
                  </span>
                  <span className="account-plan-inline">{userPlan}</span>
                </div>
              </button>
              
              {showAccountMenu && (
                <div className="account-dropdown bottom-left">
                  <div className="account-dropdown-header">
                    <div className="account-email">{currentUser?.email}</div>
                    <div className="account-info">
                      <span className="account-badge">Personal</span>
                      <span className="account-plan">{userPlan}</span>
                    </div>
                  </div>
                  
                  <div className="account-dropdown-divider" />
                  
                  <div className="account-dropdown-section">
                    <div className="dropdown-section-title">Settings</div>
                    
                    <button 
                      className="dropdown-item"
                      onClick={() => {
                        setShowAccountMenu(false);
                        navigate('/account');
                      }}
                    >
                      <span className="dropdown-icon">👤</span>
                      My Account
                    </button>
                    
                    <button 
                      className="dropdown-item"
                      onClick={() => {
                        setShowAccountMenu(false);
                        navigate('/account#connections');
                      }}
                    >
                      <span className="dropdown-icon">🔌</span>
                      Connections
                    </button>
                    
                    <button 
                      className="dropdown-item"
                      onClick={() => {
                        setShowAccountMenu(false);
                        navigate('/account#billing');
                      }}
                    >
                      <span className="dropdown-icon">💳</span>
                      Billing & Plans
                    </button>
                  </div>
                  
                  <div className="account-dropdown-divider" />
                  
                  <button 
                    className="dropdown-item"
                    onClick={() => {
                      setShowAccountMenu(false);
                      window.open('https://goandtrack.com/help', '_blank');
                    }}
                  >
                    <span className="dropdown-icon">❓</span>
                    Get Help
                  </button>
                  
                  <button 
                    className="dropdown-item"
                    onClick={() => {
                      setShowAccountMenu(false);
                      window.open('https://goandtrack.com/privacy', '_blank');
                    }}
                  >
                    <span className="dropdown-icon">🔒</span>
                    Privacy Policy
                  </button>
                  
                  <div className="account-dropdown-divider" />
                  
                  <button 
                    className="dropdown-item logout-item"
                    onClick={() => {
                      setShowAccountMenu(false);
                      supabase.auth.signOut();
                    }}
                  >
                    <span className="dropdown-icon">🚪</span>
                    Log Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </aside>

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
    </div>
  );
};

export default Dashboard;