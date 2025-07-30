import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';

// Real Supabase Client Setup
const createSupabaseClient = () => {
  // Get credentials from environment variables
  const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
  const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
  
  // Check if credentials are provided
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing database credentials in .env.local file');
    throw new Error('Database credentials not found. Please check your .env.local file.');
  }
  
  // Use the real Supabase client
  return createClient(supabaseUrl, supabaseKey);
};

const GoandTrackApp = () => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [alertSoundEnabled, setAlertSoundEnabled] = useState(true);
  const [showHelp, setShowHelp] = useState(false);
  const [queryHistory, setQueryHistory] = useState([]);
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [totalCost, setTotalCost] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [isInitialized, setIsInitialized] = useState(false);
  const [supabase, setSupabase] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const messagesEndRef = useRef(null);

  // Version and app info
  const APP_VERSION = "v1.0.0";

  // Demo user for MVP (in production, this would come from authentication)
  const demoUser = {
    id: '39f87f08-8388-4fb6-ba33-6f7aaaa238b3',
    email: 'demo@goandtrack.com',
    company: 'Demo Logistics Corp',
    name: 'Demo User',
    username: 'demo.user'
  };

  const [notifications, setNotifications] = useState([
    {
      id: 1,
      time: '1 minute ago',
      content: '🚨 CC-BLOOD-2024-156: Battery at 45% - Critical shipment needs attention',
      type: 'alert',
      shipment: 'CC-BLOOD-2024-156',
      acknowledged: false,
      muted: false
    },
    {
      id: 2,
      time: '3 minutes ago',
      content: '🛡️ CC-ORGAN-2024-023: Entered Leeds Transit Hub geofence',
      type: 'info',
      shipment: 'CC-ORGAN-2024-023',
      acknowledged: false,
      muted: false
    },
    {
      id: 3,
      time: '5 minutes ago',
      content: '✅ CC-VAX-2024-001: Temperature stable at -72.5°C',
      type: 'success',
      shipment: 'CC-VAX-2024-001',
      acknowledged: false,
      muted: false
    }
  ]);
  const [sortBy, setSortBy] = useState('time');
  const [filterBy, setFilterBy] = useState('all');

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Initialize app
  useEffect(() => {
    initializeApp();
  }, []);

  // Generate new alerts automatically every 45 seconds (SINGLE INSTANCE)
  const generateNewAlert = useCallback(() => {
    if (shipments.length === 0) return;

    const alertTypes = [
      { type: 'alert', icon: '🚨', templates: [
        'Battery below 50%',
        'Temperature out of range',
        'Device offline for 10 minutes',
        'Geofence violation detected'
      ]},
      { type: 'info', icon: '🛡️', templates: [
        'Entered new geofence',
        'Location update received',
        'Transit checkpoint passed',
        'Carrier status updated'
      ]},
      { type: 'success', icon: '✅', templates: [
        'Temperature stabilized',
        'Battery charging detected',
        'Arrived at destination',
        'Delivery confirmed'
      ]}
    ];

    const randomShipment = shipments[Math.floor(Math.random() * shipments.length)];
    const randomAlertType = alertTypes[Math.floor(Math.random() * alertTypes.length)];
    const randomTemplate = randomAlertType.templates[Math.floor(Math.random() * randomAlertType.templates.length)];

    const newAlert = {
      id: Date.now(),
      time: 'Just now',
      content: `${randomAlertType.icon} ${randomShipment.shipment_id}: ${randomTemplate}`,
      type: randomAlertType.type,
      shipment: randomShipment.shipment_id,
      acknowledged: false,
      muted: false
    };

    setNotifications(prev => {
      // Age existing notifications
      const aged = prev.map(notif => {
        if (notif.time === 'Just now') return { ...notif, time: '1 minute ago' };
        if (notif.time === '1 minute ago') return { ...notif, time: '2 minutes ago' };
        if (notif.time === '2 minutes ago') return { ...notif, time: '3 minutes ago' };
        if (notif.time === '3 minutes ago') return { ...notif, time: '4 minutes ago' };
        if (notif.time === '4 minutes ago') return { ...notif, time: '5 minutes ago' };
        if (notif.time === '5 minutes ago') return { ...notif, time: '10 minutes ago' };
        if (notif.time === '10 minutes ago') return { ...notif, time: '15 minutes ago' };
        return { ...notif, time: '15+ minutes ago' };
      });
      
      return [newAlert, ...aged.slice(0, 9)]; // Keep only 10 most recent
    });

    // Play alert sound for critical alerts
    if (randomAlertType.type === 'alert') {
      playAlertSound();
    }
  }, [shipments]);

  useEffect(() => {
    const alertTimer = setInterval(() => {
      generateNewAlert();
    }, 45000); // 45 seconds

    return () => clearInterval(alertTimer);
  }, [generateNewAlert]);

  // Play alert sound function - improved
  const playAlertSound = () => {
    if (!alertSoundEnabled) return;
    
    try {
      // Create audio context and play a double beep
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // First beep
      const playBeep = (frequency, startTime, duration) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.4, startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
        
        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
      };

      // Play double beep for alerts
      playBeep(800, audioContext.currentTime, 0.3);
      playBeep(1000, audioContext.currentTime + 0.4, 0.3);
      
      console.log('🔊 Alert sound played');
    } catch (error) {
      console.log('🔇 Alert sound not supported:', error.message);
    }
  };

  const getSortedAndFilteredNotifications = () => {
    let filtered = notifications;

    // Filter by shipment
    if (filterBy !== 'all') {
      filtered = notifications.filter(notif => notif.shipment === filterBy);
    }

    // Sort by criteria
    const sorted = [...filtered].sort((a, b) => {
      if (sortBy === 'time') {
        return new Date(b.time) - new Date(a.time); // Newest first
      } else if (sortBy === 'time-old') {
        return new Date(a.time) - new Date(b.time); // Oldest first
      } else if (sortBy === 'shipment') {
        return a.shipment.localeCompare(b.shipment); // Alphabetical
      } else if (sortBy === 'type') {
        const typeOrder = { alert: 0, info: 1, success: 2 };
        return typeOrder[a.type] - typeOrder[b.type]; // Alerts first
      }
      return 0;
    });

    return sorted;
  };

  const initializeApp = async () => {
    try {
      setConnectionStatus('connecting');
      
      // Initialize Supabase client
      const client = createSupabaseClient();
      setSupabase(client);
      
      await testDatabaseConnection(client);
      await initializeUser(client);
      await loadShipments(client);
      await loadUserStats(client);
      setConnectionStatus('connected');
      setIsInitialized(true);
    } catch (error) {
      console.error('Error initializing app:', error);
      setConnectionStatus('error');
      setIsInitialized(true);
    }
  };

  const testDatabaseConnection = async (client) => {
    try {
      console.log('🔄 Testing database connection...');
      const { data, error } = await client.from('users').select('*').limit(1);
      
      if (error && error.message && !error.message.includes('No rows found')) {
        throw new Error(`Database connection failed: ${error.message}`);
      }
      
      console.log('✅ Database connection successful!');
    } catch (error) {
      console.error('❌ Database connection failed:', error);
      throw error;
    }
  };

  const initializeUser = async (client) => {
    try {
      // Check if demo user exists
      const { data: existingUser, error: fetchError } = await client
        .from('users')
        .select('*')
        .eq('id', demoUser.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error fetching user:', fetchError);
        throw fetchError;
      }

      if (!existingUser) {
        // Create demo user if doesn't exist
        const { error: insertError } = await client
          .from('users')
          .insert([{
            id: demoUser.id,
            email: demoUser.email,
            company: demoUser.company,
            name: demoUser.name,
            subscription_tier: 'demo',
            created_at: new Date().toISOString()
          }]);
        
        if (insertError) {
          console.error('Error creating demo user:', insertError);
          throw insertError;
        }
        console.log('✅ Demo user created in database');
      } else {
        console.log('✅ Demo user found in database');
      }
      
      setCurrentUser(demoUser);
    } catch (error) {
      console.error('Error initializing user:', error);
      // Fall back to demo user even if database fails
      setCurrentUser(demoUser);
    }
  };

  const loadShipments = async (client) => {
    try {
      setLoading(true);
      
      // Try to load from database first
      const { data: dbShipments, error } = await client
        .from('shipments')
        .select('*')
        .eq('user_id', demoUser.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading shipments:', error);
        await loadSampleData(client);
        return;
      }

      if (dbShipments && dbShipments.length > 0) {
        console.log(`✅ Loaded ${dbShipments.length} shipments from database`);
        setShipments(dbShipments);
      } else {
        console.log('📦 No shipments found, loading sample data');
        await loadSampleData(client);
      }
    } catch (error) {
      console.error('Error loading shipments:', error);
      await loadSampleData(client);
    } finally {
      setLoading(false);
    }
  };

  const loadSampleData = async (client) => {
    const sampleShipments = [
      {
        user_id: demoUser.id,
        shipment_id: 'CC-VAX-2024-001',
        shipment_name: 'Pfizer COVID Vaccines',
        shipment_type: 'pharmaceuticals',
        status: 'in-transit',
        temperature: -72.5,
        target_temp_min: -80,
        target_temp_max: -65,
        battery_level: 87,
        current_location: 'Manchester',
        latitude: 53.4708,
        longitude: -2.2426,
        destination_address: 'Edinburgh Medical Center',
        estimated_arrival: '14:30 today',
        provider: 'Tive',
        tracking_active: true,
        created_at: new Date().toISOString()
      },
      {
        user_id: demoUser.id,
        shipment_id: 'CC-FOOD-2024-078',
        shipment_name: 'Frozen Seafood Export',
        shipment_type: 'food',
        status: 'in-transit',
        temperature: -18.2,
        target_temp_min: -22,
        target_temp_max: -15,
        battery_level: 72,
        current_location: 'Dover',
        latitude: 51.1279,
        longitude: 1.3134,
        destination_address: 'Paris Distribution Hub',
        estimated_arrival: '16:45 today',
        current_geofence: 'dover-port',
        provider: 'Project44',
        tracking_active: true,
        created_at: new Date().toISOString()
      },
      {
        user_id: demoUser.id,
        shipment_id: 'CC-BLOOD-2024-156',
        shipment_name: 'Blood Products Emergency',
        shipment_type: 'medical',
        status: 'critical',
        temperature: 3.8,
        target_temp_min: 2,
        target_temp_max: 6,
        battery_level: 45,
        current_location: 'London',
        latitude: 51.5074,
        longitude: -0.1278,
        destination_address: 'St. Bartholomew\'s Hospital',
        estimated_arrival: '11:15 today',
        current_geofence: 'london-city',
        provider: 'Tive',
        tracking_active: true,
        created_at: new Date().toISOString()
      },
      {
        user_id: demoUser.id,
        shipment_id: 'CC-ORGAN-2024-023',
        shipment_name: 'Transplant Organs',
        shipment_type: 'medical',
        status: 'in-transit',
        temperature: 1.2,
        target_temp_min: 0,
        target_temp_max: 4,
        battery_level: 91,
        current_location: 'Leeds',
        latitude: 53.8008,
        longitude: -1.5491,
        destination_address: 'Birmingham Queen Elizabeth Hospital',
        estimated_arrival: '13:45 today',
        current_geofence: 'leeds-hub',
        provider: 'Project44',
        tracking_active: true,
        created_at: new Date().toISOString()
      },
      {
        user_id: demoUser.id,
        shipment_id: 'CC-INSULIN-2024-234',
        shipment_name: 'Insulin Shipment',
        shipment_type: 'pharmaceuticals',
        status: 'delayed',
        temperature: 4.5,
        target_temp_min: 2,
        target_temp_max: 8,
        battery_level: 63,
        current_location: 'Birmingham',
        latitude: 52.4862,
        longitude: -1.8904,
        destination_address: 'Cardiff Diabetes Center',
        estimated_arrival: '17:20 today',
        provider: 'Tive',
        tracking_active: true,
        created_at: new Date().toISOString()
      },
      {
        user_id: demoUser.id,
        shipment_id: 'CC-PLASMA-2024-089',
        shipment_name: 'Blood Plasma Products',
        shipment_type: 'medical',
        status: 'at-destination',
        temperature: -20.1,
        target_temp_min: -25,
        target_temp_max: -18,
        battery_level: 78,
        current_location: 'London Heathrow',
        latitude: 51.4700,
        longitude: -0.4543,
        destination_address: 'Heathrow Medical Facility',
        estimated_arrival: 'Delivered',
        current_geofence: 'heathrow-medical',
        provider: 'Project44',
        tracking_active: true,
        created_at: new Date().toISOString()
      }
    ];

    try {
      // Insert sample data into database
      const { error } = await client
        .from('shipments')
        .upsert(sampleShipments, { 
          onConflict: 'user_id,shipment_id',
          ignoreDuplicates: false 
        });

      if (error) {
        console.error('Error inserting sample data:', error);
      } else {
        console.log('✅ Sample shipments inserted into database');
      }

      setShipments(sampleShipments);
    } catch (error) {
      console.error('Error loading sample data:', error);
      // Fall back to local data if database fails
      setShipments(sampleShipments);
    }
  };

  const loadUserStats = async (client) => {
    try {
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
      
      const { data, error } = await client
        .from('tracking_history')
        .select('cost')
        .eq('user_id', demoUser.id)
        .eq('billing_date', today);

      if (error) {
        console.error('Error loading user stats:', error);
        return;
      }

      const todaysCost = data?.reduce((sum, record) => sum + (record.cost || 0), 0) || 0;
      setTotalCost(todaysCost);
      console.log(`💰 Today's costs: $${todaysCost.toFixed(2)}`);
    } catch (error) {
      console.error('Error loading user stats:', error);
    }
  };

  const saveChatInteraction = async (query, response, shipmentId = null) => {
    if (!currentUser || !supabase) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Check if we've already charged for this shipment today
      if (shipmentId) {
        const { data: existingCharges } = await supabase
          .from('tracking_history')
          .select('id')
          .eq('user_id', currentUser.id)
          .eq('shipment_id', shipmentId)
          .eq('billing_date', today)
          .limit(1);

        // If no existing charges for this shipment today, create new record
        if (!existingCharges || existingCharges.length === 0) {
          const { error } = await supabase
            .from('tracking_history')
            .insert([{
              user_id: currentUser.id,
              shipment_id: shipmentId,
              query: query,
              response: typeof response === 'string' ? response.substring(0, 1000) : 'Interactive response',
              billing_date: today,
              cost: 0.50,
              provider: getShipmentProvider(shipmentId),
              query_count: 1,
              created_at: new Date().toISOString()
            }]);

          if (error) {
            console.error('Error saving chat interaction:', error);
          } else {
            setTotalCost(prev => prev + 0.50);
            console.log(`💰 Charged $0.50 for shipment ${shipmentId}`);
          }
        } else {
          console.log(`💰 Already charged for shipment ${shipmentId} today`);
        }
      } else {
        // General query without specific shipment - still save but don't charge
        const { error } = await supabase
          .from('tracking_history')
          .insert([{
            user_id: currentUser.id,
            shipment_id: null,
            query: query,
            response: typeof response === 'string' ? response.substring(0, 1000) : 'Interactive response',
            billing_date: today,
            cost: 0.00,
            provider: null,
            query_count: 1,
            created_at: new Date().toISOString()
          }]);

        if (error) {
          console.error('Error saving general query:', error);
        }
      }
    } catch (error) {
      console.error('Error saving interaction:', error);
    }
  };

  const getShipmentProvider = (shipmentId) => {
    const shipment = shipments.find(s => s.shipment_id === shipmentId);
    return shipment ? shipment.provider : null;
  };

  const handleLogout = () => {
    // In a real app, this would clear authentication tokens
    if (window.confirm('Are you sure you want to log out?')) {
      // For demo purposes, just refresh the page
      window.location.reload();
    }
  };

  // Initialize welcome message
  useEffect(() => {
    if (shipments.length > 0 && isInitialized) {
      const initialMessage = {
        id: 1,
        content: (
          <div>
            <p>Hello! I'm goandtrack AI connected to your database. I provide real-time shipment visibility, exception alerting, and route monitoring across Tive and Project44 platforms.</p>
            <p><strong>📦 Currently Tracking {shipments.length} Active Shipments:</strong></p>
            <ShipmentList shipments={shipments} onShipmentClick={handleShipmentClick} />
            <p style={{fontSize: '14px', color: '#6b7280', marginTop: '10px'}}>💡 Click any shipment ID above for detailed information, or ask me anything!</p>
            <div style={{
              marginTop: '12px',
              padding: '8px 12px',
              backgroundColor: connectionStatus === 'connected' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              borderRadius: '8px',
              fontSize: '12px'
            }}>
              🔗 Database: {connectionStatus === 'connected' ? '✅ Connected to GoandTrack Database' : 
                         connectionStatus === 'connecting' ? '🔄 Connecting...' : '❌ Connection Error'}
            </div>
          </div>
        ),
        sender: 'ai',
        timestamp: new Date()
      };
      setMessages([initialMessage]);
    }
  }, [shipments, isInitialized, connectionStatus]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const extractShipmentId = (message) => {
    // Support both CC- format and TRACCAR- format
    const ccMatch = message.match(/(cc-[a-z]+-\d{4}-\d{3})/i);
    const traccarMatch = message.match(/(traccar-\d+)/i);
    
    if (ccMatch) return ccMatch[1].toUpperCase();
    if (traccarMatch) return traccarMatch[1].toUpperCase();
    return null;
  };

  // ENHANCED generateAllStatusResponse function
  const generateAllStatusResponse = () => {
    if (shipments.length === 0) {
      return "No active shipments found. Try syncing your GPS devices.";
    }
    
    // Group shipments by status
    const statusGroups = shipments.reduce((groups, shipment) => {
      const status = shipment.status || 'unknown';
      if (!groups[status]) groups[status] = [];
      groups[status].push(shipment);
      return groups;
    }, {});
    
    // Count by provider
    const providerCounts = shipments.reduce((counts, shipment) => {
      const provider = shipment.provider || 'Unknown';
      counts[provider] = (counts[provider] || 0) + 1;
      return counts;
    }, {});
    
    // Generate summary
    const totalDevices = shipments.length;
    
    return (
      <div>
        <div style={{
          backgroundColor: 'rgba(0, 0, 0, 0.02)',
          borderRadius: '12px',
          padding: '15px',
          margin: '15px 0'
        }}>
          <div style={{fontWeight: 'bold', marginBottom: '16px', fontSize: '16px'}}>
            🚛 Fleet Overview ({totalDevices} devices)
          </div>
          
          {/* Status Summary */}
          <div style={{marginBottom: '16px'}}>
            <div style={{fontWeight: '600', marginBottom: '8px'}}>📊 Status Summary:</div>
            <div style={{fontSize: '14px', color: '#374151', lineHeight: '1.6'}}>
              • 🚛 Moving: {statusGroups['in-transit']?.length || 0}<br/>
              • ⏸️ Stopped: {statusGroups['stopped']?.length || 0}<br/>
              • 📴 Offline: {statusGroups['offline']?.length || 0}<br/>
              • 🚨 Critical: {statusGroups['critical']?.length || 0}
            </div>
          </div>
          
          {/* Provider Summary */}
          <div style={{marginBottom: '16px'}}>
            <div style={{fontWeight: '600', marginBottom: '8px'}}>🔗 Providers:</div>
            <div style={{fontSize: '14px', color: '#374151', lineHeight: '1.6'}}>
              {Object.entries(providerCounts).map(([provider, count]) => (
                <div key={provider}>• {provider}: {count} devices</div>
              ))}
            </div>
          </div>
          
          {/* Device List */}
          <div style={{fontWeight: '600', marginBottom: '12px'}}>📱 Active Devices:</div>
          <div style={{maxHeight: '400px', overflowY: 'auto'}}>
            {shipments.map((shipment, index) => {
              const statusIcon = shipment.status === 'offline' ? '📴' : 
                               shipment.status === 'stopped' ? '⏸️' : 
                               shipment.status === 'in-transit' ? '🚛' : 
                               shipment.status === 'critical' ? '🚨' : '📍';
              
              const batteryIcon = shipment.battery_level > 50 ? '🔋' : 
                                 shipment.battery_level > 20 ? '🟡' : '🔴';
              
              // Format last update time
              const formatLastUpdate = () => {
                if (shipment.last_update) {
                  const updateTime = new Date(shipment.last_update);
                  const now = new Date();
                  const diffMinutes = Math.round((now - updateTime) / 1000 / 60);
                  
                  if (diffMinutes < 1) return 'Just now';
                  if (diffMinutes < 60) return `${diffMinutes}m ago`;
                  if (diffMinutes < 1440) return `${Math.round(diffMinutes / 60)}h ago`;
                  return updateTime.toLocaleDateString();
                }
                return 'Unknown';
              };
              
              // Format speed info
              const speedInfo = shipment.speed && shipment.speed > 0 ? 
                ` • ${shipment.speed.toFixed(1)} km/h` : '';
              
              return (
                <div 
                  key={shipment.shipment_id}
                  style={{
                    border: '1px solid #e5e7eb', 
                    borderRadius: '8px', 
                    padding: '12px', 
                    margin: '8px 0', 
                    background: 'white',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s'
                  }}
                  onClick={() => handleShipmentClick(shipment.shipment_id)}
                  onMouseOver={(e) => e.target.style.backgroundColor = '#f9fafb'}
                  onMouseOut={(e) => e.target.style.backgroundColor = 'white'}
                >
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                    <div style={{flex: 1}}>
                      <div style={{fontWeight: '600', color: '#1f2937'}}>
                        {statusIcon} {shipment.shipment_name}
                      </div>
                      <div style={{fontSize: '12px', color: '#6b7280'}}>
                        {shipment.shipment_id}
                      </div>
                    </div>
                    <div style={{textAlign: 'right', fontSize: '12px', color: '#6b7280'}}>
                      <div>{batteryIcon} {shipment.battery_level}%</div>
                      <div>{formatLastUpdate()}{speedInfo}</div>
                    </div>
                  </div>
                  <div style={{marginTop: '8px', fontSize: '12px', color: '#4b5563'}}>
                    📍 {shipment.current_location || 'Unknown Location'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <p style={{fontSize: '12px', color: '#6b7280'}}>
          💰 Live GPS tracking • Updates every 30 seconds • Click any device for details
        </p>
      </div>
    );
  };

  // ENHANCED generateShipmentDetails function
  const generateShipmentDetails = (shipmentId) => {
    const shipment = shipments.find(s => s.shipment_id === shipmentId);
    if (!shipment) {
      return `Shipment ${shipmentId} not found in our tracking system.`;
    }
    
    const statusIcon = shipment.status === 'offline' ? '📴' : 
                     shipment.status === 'stopped' ? '⏸️' : 
                     shipment.status === 'in-transit' ? '🚛' : 
                     shipment.status === 'critical' ? '🚨' : '📍';
    
    const batteryIcon = shipment.battery_level > 80 ? '🔋' : 
                       shipment.battery_level > 50 ? '🔋' : 
                       shipment.battery_level > 20 ? '🟡' : '🔴';
    
    // Enhanced temperature display
    const formatTemperature = () => {
      if (shipment.temperature !== null && shipment.temperature !== undefined) {
        const tempStatus = (shipment.target_temp_min && shipment.target_temp_max) ?
          (shipment.temperature >= shipment.target_temp_min && 
           shipment.temperature <= shipment.target_temp_max) ? '✅' : '❌' : '🌡️';
        
        const targetRange = (shipment.target_temp_min && shipment.target_temp_max) ?
          ` (Target: ${shipment.target_temp_min}°C to ${shipment.target_temp_max}°C)` : '';
        
        return `${tempStatus} ${shipment.temperature}°C${targetRange}`;
      } else {
        return '🚫 No temperature sensor';
      }
    };
    
    // Enhanced GPS coordinates display
    const formatCoordinates = () => {
      if (shipment.latitude && shipment.longitude && 
          shipment.latitude !== 0 && shipment.longitude !== 0) {
        return `📍 GPS: ${shipment.latitude.toFixed(6)}, ${shipment.longitude.toFixed(6)}`;
      }
      return '📍 GPS: No coordinates';
    };
    
    // Enhanced speed/movement display
    const formatMovement = () => {
      const parts = [];
      if (shipment.speed !== undefined && shipment.speed > 0) {
        parts.push(`🏃 Speed: ${shipment.speed.toFixed(1)} km/h`);
      }
      if (shipment.course !== undefined) {
        const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
        const dirIndex = Math.round(shipment.course / 45) % 8;
        parts.push(`🧭 Heading: ${directions[dirIndex]} (${shipment.course.toFixed(0)}°)`);
      }
      return parts.length > 0 ? parts.join(' • ') : '';
    };
    
    // Last update time
    const formatLastUpdate = () => {
      if (shipment.last_update) {
        const updateTime = new Date(shipment.last_update);
        const now = new Date();
        const diffMinutes = Math.round((now - updateTime) / 1000 / 60);
        
        if (diffMinutes < 1) return 'Just now';
        if (diffMinutes < 60) return `${diffMinutes} min ago`;
        if (diffMinutes < 1440) return `${Math.round(diffMinutes / 60)} hours ago`;
        return updateTime.toLocaleDateString();
      }
      return 'Unknown';
    };
    
    return (
      <div>
        <div style={{
          backgroundColor: 'rgba(0, 0, 0, 0.02)',
          border: '1px solid rgba(0, 0, 0, 0.08)',
          borderRadius: '12px',
          padding: '15px',
          margin: '10px 0',
          fontFamily: 'Monaco, monospace',
          fontSize: '14px',
          color: '#000000'
        }}>
          <div style={{fontWeight: 'bold', marginBottom: '16px'}}>
            {statusIcon} {shipment.shipment_id} - {shipment.shipment_name}
          </div>
          
          <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
            <div><strong>Status:</strong> {shipment.status.charAt(0).toUpperCase() + shipment.status.slice(1)}</div>
            <div><strong>Provider:</strong> {shipment.provider}</div>
            <div><strong>Type:</strong> {shipment.shipment_type}</div>
            
            <div><strong>Temperature:</strong> {formatTemperature()}</div>
            <div><strong>Battery:</strong> {batteryIcon} {shipment.battery_level}%</div>
            
            <div><strong>Current Location:</strong> {shipment.current_location}</div>
            <div style={{fontSize: '12px', color: '#666'}}>{formatCoordinates()}</div>
            
            {formatMovement() && (
              <div style={{fontSize: '12px', color: '#666'}}>{formatMovement()}</div>
            )}
            
            <div><strong>Last Update:</strong> {formatLastUpdate()}</div>
            <div><strong>Journey Info:</strong> {shipment.estimated_arrival}</div>
            
            {shipment.current_geofence && (
              <div style={{marginTop: '8px', padding: '8px', backgroundColor: 'rgba(16, 185, 129, 0.1)', borderRadius: '8px'}}>
                🛡️ Current Geofence: {shipment.current_geofence}
              </div>
            )}
            
            <div style={{marginTop: '8px', fontSize: '12px', color: '#6b7280'}}>
              🗄️ Database ID: {shipment.id || 'N/A'} • Device ID: {shipment.traccar_device_id} • Created: {new Date(shipment.created_at).toLocaleDateString()}
            </div>
          </div>
        </div>
        <p style={{fontSize: '12px', color: '#6b7280'}}>
          💰 Real-time GPS tracking active (Updates every 30 seconds)
        </p>
      </div>
    );
  };

  const processMessage = (message) => {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('status') || lowerMessage.includes('overview') || lowerMessage.includes('all shipment')) {
      return generateAllStatusResponse();
    } else if (lowerMessage.includes('cc-') || lowerMessage.includes('traccar-') || shipments.some(s => lowerMessage.includes(s.shipment_id?.toLowerCase()))) {
      const shipmentId = extractShipmentId(lowerMessage);
      if (shipmentId) {
        return generateShipmentDetails(shipmentId);
      } else {
        return "I couldn't identify the specific shipment. Please use the full shipment ID (e.g., CC-VAX-2024-001 or TRACCAR-123456).";
      }
    } else if (lowerMessage.includes('cost') || lowerMessage.includes('billing') || lowerMessage.includes('charges')) {
      return `Today's tracking costs: $${totalCost.toFixed(2)}. You're charged $0.50 per shipment tracked per day.`;
    } else if (lowerMessage.includes('database') || lowerMessage.includes('connection')) {
      return `Database Status: ${connectionStatus === 'connected' ? '✅ Connected to GoandTrack Database' : 
                             connectionStatus === 'connecting' ? '🔄 Connecting to database...' : 
                             '❌ Database connection error'}`;
    } else if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('help')) {
      return "Hello! I'm your goandtrack AI assistant. I can help you track shipments, monitor temperatures, check battery levels, and provide location updates. What would you like to know?";
    } else {
      return `I understand you're asking about "${message}". I can help with:

📦 Shipment tracking and status
🌡️ Temperature monitoring  
🔋 Battery level checks
📍 Location and route updates
🚨 Critical alerts and geofences
💰 Daily billing and costs
🗄️ Database connectivity status

Try asking "Show me all shipment status" or click any shipment ID for details.`;
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;
    
    const userMessage = {
      id: Date.now(),
      content: inputValue,
      sender: 'user',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setQueryHistory(prev => [...prev, inputValue.toLowerCase()]);
    
    const currentInput = inputValue;
    const shipmentId = extractShipmentId(inputValue);
    setInputValue('');
    
    setIsTyping(true);
    
    setTimeout(async () => {
      setIsTyping(false);
      
      const response = processMessage(currentInput);
      const aiResponse = {
        id: Date.now() + 1,
        content: response,
        sender: 'ai',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiResponse]);
      
      // Save interaction to database
      await saveChatInteraction(currentInput, response, shipmentId);
    }, 1000 + Math.random() * 1500);
  };

  const handleShipmentClick = async (shipmentId) => {
    const userMessage = {
      id: Date.now(),
      content: `Tell me about ${shipmentId}`,
      sender: 'user',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);
    
    setTimeout(async () => {
      setIsTyping(false);
      
      const response = generateShipmentDetails(shipmentId);
      const aiResponse = {
        id: Date.now() + 1,
        content: response,
        sender: 'ai',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiResponse]);
      
      // Save interaction to database
      await saveChatInteraction(`Tell me about ${shipmentId}`, response, shipmentId);
      
      // Play alert sound for critical shipments
      const shipment = shipments.find(s => s.shipment_id === shipmentId);
      if (shipment && shipment.status === 'critical') {
        playAlertSound();
      }
    }, 800);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  const handleExampleCommand = (command) => {
    setInputValue(command);
    setShowHelp(false);
    setTimeout(() => handleSendMessage(), 100);
  };

  const acknowledgeAlert = (id) => {
    setNotifications(prev => prev.map(notif => 
      notif.id === id ? { ...notif, acknowledged: true } : notif
    ));
  };

  const muteAlert = (id) => {
    setNotifications(prev => prev.map(notif => 
      notif.id === id ? { ...notif, muted: true } : notif
    ));
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit',
      hour12: true 
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>🚛 Loading GoandTrack AI...</h2>
          <p style={{ color: '#6b7280', marginBottom: '8px' }}>Connecting to database...</p>
          <p style={{ fontSize: '14px', color: '#9ca3af' }}>Status: {connectionStatus}</p>
          {connectionStatus === 'error' && (
            <div style={{
              marginTop: '16px',
              padding: '16px',
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              color: '#b91c1c'
            }}>
              <p style={{ fontWeight: '600' }}>Connection Failed</p>
              <p style={{ fontSize: '14px' }}>Check your .env.local file and database credentials</p>
            </div>
          )}
          <div style={{
            marginTop: '16px',
            width: '32px',
            height: '32px',
            border: '4px solid #dbeafe',
            borderTop: '4px solid #2563eb',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto'
          }}></div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'white',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
      `}</style>
      
      <div style={{
        backgroundColor: 'white',
        borderRadius: '24px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        width: '100%',
        maxWidth: '1200px',
        height: '85vh',
        display: 'flex',
        border: '1px solid #f3f4f6',
        overflow: 'hidden'
      }}>
        
        {/* Main Chat Section */}
        <div style={{
          flex: 1,
          height: '100%',
          display: 'flex',
          flexDirection: 'column'
        }}>
          
          {/* Header */}
          <div style={{
            backgroundColor: 'white',
            padding: '15px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            borderBottom: '1px solid #f3f4f6'
          }}>
            <div style={{
              width: '12px',
              height: '12px',
              backgroundColor: '#10b981',
              borderRadius: '50%',
              animation: 'bounce 2s infinite'
            }}></div>
            <div style={{
              backgroundColor: '#dc2626',
              width: '44px',
              height: '44px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              border: '2px solid #f3f4f6'
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M2 12h20" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" stroke="currentColor" strokeWidth="1.5"/>
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <h2 style={{
                fontSize: '18px',
                fontWeight: 'bold',
                letterSpacing: '-0.025em',
                margin: '0',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <span>
                  <span>go</span>
                  <span>and</span>
                  <span>track</span>
                  <span style={{ color: '#16a34a', fontWeight: '600', marginLeft: '8px' }}>AI</span>
                </span>
                <span style={{ 
                  fontSize: '12px', 
                  backgroundColor: '#f3f4f6', 
                  padding: '2px 6px', 
                  borderRadius: '4px',
                  color: '#6b7280',
                  fontWeight: 'normal'
                }}>
                  {APP_VERSION}
                </span>
              </h2>
              <p style={{
                color: '#6b7280',
                fontSize: '14px',
                margin: '4px 0 0 0'
              }}>
                Live Shipment Monitoring • {shipments.length} shipments • ${totalCost.toFixed(2)} today • 
                <span style={{
                  color: connectionStatus === 'connected' ? '#16a34a' : '#dc2626'
                }}>
                  {connectionStatus === 'connected' ? ' 🟢 Connected' : ' 🔴 DB Error'}
                </span>
              </p>
            </div>
            
            {/* User Info and Logout */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              gap: '4px'
            }}>
              <div style={{ 
                fontSize: '14px', 
                fontWeight: '600',
                color: '#374151'
              }}>
                👤 {currentUser?.username || 'demo.user'}
              </div>
              <div style={{ 
                fontSize: '12px', 
                color: '#6b7280'
              }}>
                {formatDate(currentTime)} • {formatTime(currentTime)}
              </div>
              <button
                onClick={handleLogout}
                style={{
                  fontSize: '11px',
                  padding: '2px 8px',
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '4px',
                  color: '#dc2626',
                  cursor: 'pointer'
                }}
              >
                Logout
              </button>
            </div>
          </div>

          {/* Messages */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '20px',
            backgroundColor: 'white',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            {messages.map((message) => (
              <div key={message.id} style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                maxWidth: '800px',
                alignSelf: message.sender === 'user' ? 'flex-end' : 'flex-start',
                flexDirection: message.sender === 'user' ? 'row-reverse' : 'row'
              }}>
                {message.sender === 'ai' && (
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: '#6366f1',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: 'bold'
                  }}>
                    AI
                  </div>
                )}
                <div style={{
                  padding: '20px',
                  borderRadius: '16px',
                  border: '1px solid',
                  backgroundColor: message.sender === 'user' ? '#000000' : '#f9fafb',
                  borderColor: message.sender === 'user' ? '#000000' : '#f3f4f6',
                  color: message.sender === 'user' ? 'white' : 'black'
                }}>
                  {typeof message.content === 'string' ? message.content : message.content}
                </div>
                {message.sender === 'user' && (
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: '#000000',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: 'bold'
                  }}>
                    U
                  </div>
                )}
              </div>
            ))}
            
            {isTyping && (
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                maxWidth: '800px'
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: '#6366f1',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 'bold'
                }}>
                  AI
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '20px',
                  backgroundColor: '#f9fafb',
                  borderRadius: '16px'
                }}>
                  {[0, 0.2, 0.4].map((delay, i) => (
                    <div key={i} style={{
                      width: '8px',
                      height: '8px',
                      backgroundColor: '#9ca3af',
                      borderRadius: '50%',
                      animation: `bounce 1s infinite ${delay}s`
                    }}></div>
                  ))}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div style={{
            padding: '20px',
            backgroundColor: 'white',
            borderTop: '1px solid #f3f4f6',
            display: 'flex',
            gap: '16px',
            alignItems: 'center'
          }}>
            <button 
              onClick={() => setShowHelp(true)}
              style={{
                backgroundColor: '#f3f4f6',
                border: '1px solid #e5e7eb',
                padding: '12px',
                borderRadius: '50%',
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#e5e7eb'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#f3f4f6'}
              title="Show example commands"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 17h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            
            <div style={{ flex: 1 }}>
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about shipments, costs, or database status..."
                style={{
                  width: '100%',
                  padding: '16px 20px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '24px',
                  fontSize: '16px',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = '#000000'}
                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
              />
            </div>
            
            <button 
              onClick={handleSendMessage}
              style={{
                backgroundColor: '#000000',
                color: 'white',
                padding: '16px',
                borderRadius: '50%',
                border: 'none',
                cursor: 'pointer',
                transition: 'transform 0.2s'
              }}
              onMouseOver={(e) => e.target.style.transform = 'scale(1.05)'}
              onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M2 21L23 12L2 3V10L17 12L2 14V21Z" fill="currentColor"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Notifications Panel */}
        <div style={{
          width: '320px',
          backgroundColor: 'white',
          borderLeft: '1px solid #f3f4f6',
          display: 'flex',
          flexDirection: 'column'
        }}>
          
          {/* Panel Header */}
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderBottom: '1px solid #f3f4f6'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 8A6 6 0 0 0 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M13.73 21A2 2 0 0 1 10.27 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span style={{ fontWeight: '600' }}>Shipment Alerts</span>
              </div>
              <button
                onClick={() => setAlertSoundEnabled(!alertSoundEnabled)}
                style={{
                  fontSize: '12px',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  border: '1px solid',
                  cursor: 'pointer',
                  backgroundColor: alertSoundEnabled ? '#dcfce7' : '#fee2e2',
                  borderColor: alertSoundEnabled ? '#bbf7d0' : '#fecaca',
                  color: alertSoundEnabled ? '#15803d' : '#dc2626'
                }}
                title={alertSoundEnabled ? 'Sound alerts enabled' : 'Sound alerts disabled'}
              >
                {alertSoundEnabled ? '🔊 ON' : '🔇 OFF'}
              </button>
            </div>
            
            <div style={{ display: 'flex', gap: '8px' }}>
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '4px',
                  padding: '4px 8px',
                  fontSize: '12px',
                  flex: 1
                }}
              >
                <option value="time">Latest First</option>
                <option value="time-old">Oldest First</option>
                <option value="shipment">By Shipment ID</option>
                <option value="type">By Alert Type</option>
              </select>
              <select 
                value={filterBy}
                onChange={(e) => setFilterBy(e.target.value)}
                style={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '4px',
                  padding: '4px 8px',
                  fontSize: '12px',
                  flex: 1
                }}
              >
                <option value="all">All Shipments</option>
                {shipments.map(shipment => (
                  <option key={shipment.shipment_id} value={shipment.shipment_id}>
                    {shipment.shipment_id.split('-').slice(-2).join('-')}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Notifications List */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '20px'
          }}>
            {getSortedAndFilteredNotifications().map((notification) => (
              <div 
                key={notification.id} 
                style={{
                  borderRadius: '12px',
                  padding: '16px',
                  marginBottom: '16px',
                  border: '1px solid',
                  transition: 'all 0.2s',
                  backgroundColor: notification.type === 'alert' ? '#fef2f2' : 
                                 notification.type === 'warning' ? '#fffbeb' : '#f0fdf4',
                  borderColor: notification.type === 'alert' ? '#fecaca' : 
                              notification.type === 'warning' ? '#fed7aa' : '#bbf7d0',
                  opacity: notification.acknowledged ? 0.6 : (notification.muted ? 0.4 : 1)
                }}
              >
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                  {notification.time}
                </div>
                <div style={{
                  fontSize: '14px',
                  lineHeight: '1.4',
                  textDecoration: notification.muted ? 'line-through' : 'none',
                  color: notification.acknowledged ? '#6b7280' : 'inherit'
                }}>
                  {notification.content}
                </div>
                <div style={{ display: 'flex', gap: '4px', marginTop: '8px' }}>
                  <button 
                    onClick={() => acknowledgeAlert(notification.id)}
                    disabled={notification.acknowledged}
                    style={{
                      backgroundColor: '#dcfce7',
                      border: '1px solid #bbf7d0',
                      color: '#15803d',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      cursor: notification.acknowledged ? 'not-allowed' : 'pointer',
                      opacity: notification.acknowledged ? 0.5 : 1
                    }}
                  >
                    {notification.acknowledged ? 'Acknowledged' : 'Acknowledge'}
                  </button>
                  <button 
                    onClick={() => muteAlert(notification.id)}
                    disabled={notification.muted}
                    style={{
                      backgroundColor: '#fee2e2',
                      border: '1px solid #fecaca',
                      color: '#dc2626',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      cursor: notification.muted ? 'not-allowed' : 'pointer',
                      opacity: notification.muted ? 0.5 : 1
                    }}
                  >
                    {notification.muted ? 'Muted' : 'Mute'}
                  </button>
                </div>
              </div>
            ))}
            
            {/* Database Status Footer */}
            <div style={{
              marginTop: '16px',
              padding: '12px',
              backgroundColor: '#f9fafb',
              borderRadius: '8px',
              fontSize: '12px'
            }}>
              <div style={{ fontWeight: '600', marginBottom: '4px' }}>🗄️ System Status</div>
              <div style={{
                color: connectionStatus === 'connected' ? '#16a34a' : '#dc2626'
              }}>
                {connectionStatus === 'connected' ? '✅ GoandTrack Database Connected' : 
                 connectionStatus === 'connecting' ? '🔄 Connecting...' : 
                 '❌ Connection Failed'}
              </div>
              <div style={{ color: '#6b7280', marginTop: '4px' }}>
                🔊 Alerts: {alertSoundEnabled ? 'Sound ON' : 'Sound OFF'} • 
                📊 {notifications.length} total alerts
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Help Modal */}
      {showHelp && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50
        }} onClick={() => setShowHelp(false)}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '32px',
            maxWidth: '500px',
            width: '100%',
            maxHeight: '80vh',
            overflowY: 'auto',
            margin: '0 16px',
            position: 'relative'
          }} onClick={(e) => e.stopPropagation()}>
            <button 
              onClick={() => setShowHelp(false)} 
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'none',
                border: 'none',
                color: '#9ca3af',
                fontSize: '24px',
                cursor: 'pointer'
              }}
            >
              &times;
            </button>
            <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '20px' }}>
              💬 Try These Commands
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { command: "Show me all shipment status", description: "Get overview of all shipments from database" },
                { command: "Track TRACCAR-869912033035581", description: "Track your live GPS device" },
                { command: "What are the current temperatures?", description: "View real-time temperature readings" },
                { command: "Where are my shipments located?", description: "Get current locations and estimated arrival times" },
                { command: "Check database connection", description: "Verify database connectivity status" },
                { command: "Show me critical shipments", description: "Display shipments requiring immediate attention" },
                { command: "What are my costs today?", description: "View daily tracking charges" }
              ].map((item, index) => (
                <div 
                  key={index}
                  onClick={() => handleExampleCommand(item.command)}
                  style={{
                    backgroundColor: '#f9fafb',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '12px',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseOver={(e) => e.target.style.backgroundColor = '#f3f4f6'}
                  onMouseOut={(e) => e.target.style.backgroundColor = '#f9fafb'}
                >
                  <div style={{
                    fontFamily: 'Monaco, monospace',
                    fontWeight: '600',
                    fontSize: '14px',
                    marginBottom: '4px'
                  }}>
                    "{item.command}"
                  </div>
                  <div style={{ fontSize: '14px', color: '#6b7280' }}>
                    {item.description}
                  </div>
                </div>
              ))}
            </div>
            
            <p style={{
              marginTop: '20px',
              fontSize: '14px',
              color: '#6b7280',
              textAlign: 'center'
            }}>
              💡 Click any command above to try it, or type your own question!
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

// Component for the initial shipment list
const ShipmentList = ({ shipments, onShipmentClick }) => {
  return (
    <div style={{
      backgroundColor: 'rgba(0, 0, 0, 0.02)',
      borderRadius: '12px',
      padding: '15px',
      margin: '15px 0'
    }}>
      {shipments.map((shipment, index) => {
        const statusIcon = shipment.status === 'critical' ? '🚨' : 
                         shipment.status === 'delayed' ? '⚠️' : 
                         shipment.status === 'at-destination' ? '✅' : 
                         shipment.status === 'offline' ? '📴' : 
                         shipment.status === 'stopped' ? '⏸️' : '🚛';
        
        return (
          <div key={shipment.shipment_id} style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '10px 0',
            borderBottom: index < shipments.length - 1 ? '1px solid rgba(0, 0, 0, 0.05)' : 'none'
          }}>
            <div>
              <span 
                style={{
                  color: '#6366f1',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  fontWeight: '600'
                }}
                onClick={() => onShipmentClick(shipment.shipment_id)}
              >
                {shipment.shipment_id}
              </span>
              <div style={{fontSize: '14px', color: '#6b7280'}}>{shipment.shipment_name}</div>
            </div>
            <div style={{textAlign: 'right'}}>
              <div>{statusIcon} {shipment.status}</div>
              <div style={{fontSize: '14px', color: '#6b7280'}}>
                {shipment.temperature ? `${shipment.temperature}°C` : 'No temp'} | {shipment.battery_level}%
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default GoandTrackApp;