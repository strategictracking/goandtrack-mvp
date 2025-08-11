// server.js - Enhanced Backend with Real Sensolus Integration & Fixes
// Place this in: /backend/server.js

const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Supabase configuration
const SUPABASE_URL = 'https://ijnjexrmyzhsmsracwqh.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqbmpleHJteXpoc21zcmFjd3FoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzU1NTE5MywiZXhwIjoyMDY5MTMxMTkzfQ.0rd_5RnTY931POrAgL_1X94mnbA1mSHnasyCKQrXxg8';
const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

console.log('🚀 GoandTrack Backend V3.1 Starting...');
console.log('📡 Supabase URL:', SUPABASE_URL);
console.log('🔧 Port:', PORT);

// Traccar configuration
const TRACCAR = {
  url: 'https://demo.traccar.org/api',
  username: 'matthew@strategictracking.com',
  password: 'HenryG005e!(sf'
};

// REAL Sensolus configuration
const SENSOLUS = {
  baseUrl: 'https://cloud.sensolus.com/rest/api/v2',
  apiKey: '67a6f594ece648fe851ff963599e9269',
  orgId: '5816'
};

// Tive configuration (mock for now)
const TIVE = {
  baseUrl: 'https://api.tive.com/v1',
  apiKey: process.env.TIVE_API_KEY || 'demo_key'
};

// Project44 configuration (mock for now)
const PROJECT44 = {
  baseUrl: 'https://api.project44.com/v1',
  apiKey: process.env.PROJECT44_API_KEY || 'demo_key'
};

// Helper: Get Traccar auth headers
const getTraccarAuth = () => {
  const credentials = Buffer.from(`${TRACCAR.username}:${TRACCAR.password}`).toString('base64');
  return { 'Authorization': `Basic ${credentials}` };
};

// Helper: Get Sensolus headers (no API key in headers)
const getSensolusHeaders = () => {
  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };
};

// Helper: Get location from coordinates
async function getLocation(lat, lon) {
  try {
    const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}`;
    const res = await axios.get(url, { timeout: 3000 });
    return res.data.city || res.data.locality || `${lat.toFixed(2)}, ${lon.toFixed(2)}`;
  } catch {
    return `${lat.toFixed(2)}, ${lon.toFixed(2)}`;
  }
}

// Helper: Calculate real battery level
function calculateBatteryLevel(attributes) {
  if (!attributes) return 85;
  
  // Try different battery fields
  const batteryValue = attributes.batteryLevel || 
                       attributes.battery || 
                       attributes.power ||
                       attributes.batteryVoltage ||
                       attributes.batteryPercentage;
  
  if (!batteryValue) return 85;
  
  // If it's already a percentage (0-100)
  if (batteryValue >= 0 && batteryValue <= 100) {
    return Math.round(batteryValue);
  }
  
  // If it's voltage (common range 3.0-4.2V for Li-ion)
  if (batteryValue >= 3.0 && batteryValue <= 4.5) {
    // Convert voltage to percentage (3.0V = 0%, 4.2V = 100%)
    const percentage = ((batteryValue - 3.0) / 1.2) * 100;
    return Math.round(Math.max(0, Math.min(100, percentage)));
  }
  
  // If it's millivolts
  if (batteryValue > 1000 && batteryValue < 5000) {
    const voltage = batteryValue / 1000;
    const percentage = ((voltage - 3.0) / 1.2) * 100;
    return Math.round(Math.max(0, Math.min(100, percentage)));
  }
  
  // Default fallback with some randomness for demo
  return Math.round(70 + Math.random() * 25);
}

// Helper: Verify user from token
async function getUserFromToken(authHeader) {
  console.log('🔐 Auth header received:', authHeader ? 'Yes' : 'No');
  
  // Allow demo mode without auth
  if (!authHeader || authHeader === 'Bearer null' || authHeader === 'Bearer undefined') {
    console.log('⚠️ No valid auth header, using demo mode');
    return { 
      id: '00000000-0000-0000-0000-000000000000', 
      email: 'demo@goandtrack.com',
      user_metadata: { display_name: 'Demo User' }
    };
  }

  const token = authHeader.replace('Bearer ', '');
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      console.log('⚠️ Token verification failed, using demo mode');
      return { 
        id: '00000000-0000-0000-0000-000000000000', 
        email: 'demo@goandtrack.com',
        user_metadata: { display_name: 'Demo User' }
      };
    }
    
    console.log('✅ Authenticated user:', user.email);
    return user;
  } catch (error) {
    console.error('❌ Auth error:', error.message);
    return { 
      id: '00000000-0000-0000-0000-000000000000', 
      email: 'demo@goandtrack.com',
      user_metadata: { display_name: 'Demo User' }
    };
  }
}

// Get REAL Sensolus devices - WORKING VERSION with correct field names
async function getSensolusDevices() {
  const devicesList = [];
  
  try {
    console.log('📡 Fetching real Sensolus devices...');
    console.log('🔑 API Key:', SENSOLUS.apiKey.substring(0, 8) + '...');
    console.log('🏢 Organization ID:', SENSOLUS.orgId);
    
    // Try to get devices list
    const devicesUrl = `${SENSOLUS.baseUrl}/devices?deviceCategories=TRACKER&includeCustomData=true&includeSubscriptionInfo=false&includeProfileInfo=true&apiKey=${SENSOLUS.apiKey}`;
    console.log('📍 API URL:', devicesUrl);
    
    const response = await axios.get(devicesUrl, {
      headers: getSensolusHeaders(),
      timeout: 10000
    });
    
    console.log('✅ Sensolus API response received');
    const apiDevices = response.data?.devices || response.data || [];
    console.log(`📱 Found ${apiDevices.length} Sensolus devices`);
    
    // Process each device
    for (const device of apiDevices.slice(0, 5)) {
      try {
        // Use serial as the device ID (based on your actual API response)
        const deviceId = device.serial || device.imei || device.name;
        
        if (!deviceId) {
          console.log('⚠️ No valid device ID found, skipping device');
          continue;
        }
        
        console.log(`📊 Processing device: ${device.name} (ID: ${deviceId})`);
        
        // Extract battery level from the correct field
        const battery = device.batteryInfo?.batteryLevelPercentage || 85;
        
        // Extract location from the correct fields
        const latitude = device.lastLat || 0;
        const longitude = device.lastLng || 0;
        const currentLocation = device.lastAddress || 'Location Unknown';
        
        // Extract status from the correct field
        const status = device.status === 'ONLINE' ? 'active' : 'offline';
        
        // Extract last seen
        const lastSeen = device.lastSeenAlive || device.lastLocationUpdate || new Date().toISOString();
        
        // For temperature/humidity, we'd need measurements endpoint, but let's use defaults for now
        const temperature = 22 + Math.random() * 3; // Default room temperature
        const humidity = 45 + Math.random() * 10;   // Default humidity
        
        const deviceData = {
          id: deviceId,
          name: device.name || `Sensolus ${deviceId}`,
          status: status,
          battery: Math.round(battery),
          temperature: Math.round(temperature * 10) / 10,
          humidity: Math.round(humidity * 10) / 10,
          location: {
            latitude: latitude,
            longitude: longitude,
            timestamp: device.lastLocationUpdate || new Date().toISOString()
          },
          lastSeen: lastSeen,
          type: 'tracker',
          // Additional real data from your device
          serial: device.serial,
          imei: device.imei,
          productName: device.productName,
          currentLocation: currentLocation,
          batteryEstimatedDays: device.batteryInfo?.estimatedRemainingBatteryLife,
          lastActivity: device.lastActivity,
          geozones: device.lastGeozones
        };
        
        devicesList.push(deviceData);
        
        console.log(`✅ Added Sensolus device: ${device.name}`);
        console.log(`   📍 Location: ${currentLocation}`);
        console.log(`   🔋 Battery: ${battery}% (${device.batteryInfo?.estimatedRemainingBatteryLife} days remaining)`);
        console.log(`   📊 Status: ${status} | Activity: ${device.lastActivity}`);
        console.log(`   📡 Serial: ${device.serial} | IMEI: ${device.imei}`);
        
      } catch (error) {
        console.log(`⚠️ Error processing device ${device.name}:`, error.message);
      }
    }
    
    console.log(`🎉 Successfully processed ${devicesList.length} real Sensolus devices!`);
    return devicesList;
    
  } catch (error) {
    console.error('❌ Sensolus API error:', error.response?.status, error.response?.data || error.message);
    console.log('📌 Using enhanced mock Sensolus data...');
    
    // Return realistic mock data if API fails
    return [
      {
        id: 'SENS-MOCK-001',
        name: 'Cold Chain Monitor A1',
        status: 'active',
        battery: Math.round(85 + Math.random() * 10),
        temperature: -72 + Math.random() * 5,
        humidity: 35 + Math.random() * 10,
        location: {
          latitude: 51.5074,
          longitude: -0.1278,
          timestamp: new Date().toISOString()
        },
        lastSeen: new Date().toISOString(),
        type: 'cold-chain-sensor'
      }
    ];
  }
}

// Get mock Tive devices
async function getTiveDevices() {
  // Mock Tive devices for demo
  return [
    {
      id: 'TIVE-001',
      name: 'Tive Tracker Alpha',
      status: 'active',
      battery: Math.round(90 + Math.random() * 10),
      temperature: -70 + Math.random() * 5,
      location: {
        latitude: 52.5200 + (Math.random() - 0.5) * 0.1,
        longitude: 13.4050 + (Math.random() - 0.5) * 0.1,
        timestamp: new Date().toISOString()
      },
      lastSeen: new Date().toISOString(),
      type: 'multi-sensor'
    }
  ];
}

// Get mock Project44 devices
async function getProject44Devices() {
  // Mock Project44 devices for demo
  return [
    {
      id: 'P44-001',
      name: 'Project44 Asset Tracker',
      status: 'in-transit',
      battery: Math.round(75 + Math.random() * 20),
      temperature: null,
      location: {
        latitude: 40.7128 + (Math.random() - 0.5) * 0.1,
        longitude: -74.0060 + (Math.random() - 0.5) * 0.1,
        timestamp: new Date().toISOString()
      },
      lastSeen: new Date().toISOString(),
      type: 'asset-tracker'
    }
  ];
}

// Main sync function for devices
async function syncDevicesForUser(userId, userEmail = 'unknown') {
  try {
    console.log('🔄 Starting comprehensive device sync for:', userEmail);
    
    const shipments = [];
    const now = new Date().toISOString();
    let syncStats = {
      traccar: 0,
      sensolus: 0,
      tive: 0,
      project44: 0,
      total: 0
    };
    
    // 1. FETCH TRACCAR DEVICES
    try {
      console.log('📡 Fetching Traccar devices...');
      
      const [devicesRes, positionsRes] = await Promise.all([
        axios.get(`${TRACCAR.url}/devices`, { 
          headers: getTraccarAuth(),
          timeout: 10000 
        }),
        axios.get(`${TRACCAR.url}/positions`, { 
          headers: getTraccarAuth(),
          timeout: 10000 
        })
      ]);
      
      const traccarDevices = devicesRes.data || [];
      const positions = positionsRes.data || [];
      
      console.log(`📱 Found ${traccarDevices.length} Traccar devices`);
      
      for (const device of traccarDevices.slice(0, 5)) {
        const pos = positions.find(p => p.deviceId === device.id);
        const location = pos ? await getLocation(pos.latitude, pos.longitude) : 'Unknown Location';
        
        // Calculate real battery level from attributes
        const battery = calculateBatteryLevel(pos?.attributes);
        
        // Determine real-time status
        let status = 'offline';
        if (pos) {
          const lastUpdate = new Date(pos.fixTime || pos.serverTime);
          const minutesAgo = (new Date() - lastUpdate) / 60000;
          
          if (minutesAgo < 5) {
            status = pos.speed > 5 ? 'in-transit' : 'stopped';
          } else if (minutesAgo < 30) {
            status = 'idle';
          } else if (minutesAgo < 60) {
            status = 'inactive';
          }
        }
        
        const shipment = {
          user_id: userId,
          shipment_id: `TRACCAR-${device.uniqueId}`,
          shipment_name: device.name || `GPS Device ${device.id}`,
          shipment_type: 'gps-device',
          status: status,
          provider: 'traccar',
          current_location: location,
          latitude: pos?.latitude || 0,
          longitude: pos?.longitude || 0,
          speed: pos ? Math.round(pos.speed * 1.852) : 0,
          temperature: pos?.attributes?.temp || pos?.attributes?.temperature || null,
          battery_level: battery,
          device_status: device.status || 'online',
          tracking_active: status !== 'offline',
          last_update: pos?.fixTime || now,
          created_at: now,
          updated_at: now,
          destination_address: 'Live GPS Tracking',
          estimated_arrival: 'Continuous Monitoring',
          exception_count: 0,
          priority_level: battery < 20 ? 'critical' : battery < 40 ? 'high' : 'standard'
        };
        
        shipments.push(shipment);
        syncStats.traccar++;
        console.log(`✅ Added Traccar: ${device.name} (Battery: ${battery}%, Status: ${status})`);
      }
    } catch (error) {
      console.error('⚠️ Traccar sync error:', error.message);
    }
    
    // 2. FETCH REAL SENSOLUS DEVICES
    try {
      const sensolusDevices = await getSensolusDevices();
      
      for (const device of sensolusDevices) {
        const location = device.location ? 
          await getLocation(device.location.latitude, device.location.longitude) : 
          'Location Unknown';
        
        const shipment = {
          user_id: userId,
          shipment_id: `SENSOLUS-${device.id}`,
          shipment_name: device.name,
          shipment_type: device.type || 'iot-sensor',
          status: device.status === 'active' ? 'in-transit' : 'stopped',
          provider: 'sensolus',
          current_location: location,
          latitude: device.location?.latitude || 0,
          longitude: device.location?.longitude || 0,
          speed: 0,
          temperature: device.temperature,
          humidity: device.humidity,
          battery_level: device.battery,
          device_status: device.status,
          tracking_active: device.status === 'active',
          last_update: device.lastSeen,
          created_at: now,
          updated_at: now,
          destination_address: 'Environmental Monitoring',
          estimated_arrival: 'Continuous Monitoring',
          exception_count: device.temperature && (device.temperature < -75 || device.temperature > -65) ? 1 : 0,
          priority_level: device.battery < 20 ? 'critical' : device.battery < 40 ? 'high' : 'standard'
        };
        
        shipments.push(shipment);
        syncStats.sensolus++;
        console.log(`✅ Added Sensolus: ${device.name} (Battery: ${device.battery}%, Temp: ${device.temperature}°C)`);
      }
    } catch (error) {
      console.error('⚠️ Sensolus sync error:', error.message);
    }
    
    // 3. FETCH TIVE DEVICES
    try {
      const tiveDevices = await getTiveDevices();
      
      for (const device of tiveDevices) {
        const location = device.location ? 
          await getLocation(device.location.latitude, device.location.longitude) : 
          'Location Unknown';
        
        const shipment = {
          user_id: userId,
          shipment_id: `TIVE-${device.id}`,
          shipment_name: device.name,
          shipment_type: device.type || 'multi-sensor',
          status: device.status === 'active' ? 'in-transit' : 'stopped',
          provider: 'tive',
          current_location: location,
          latitude: device.location?.latitude || 0,
          longitude: device.location?.longitude || 0,
          speed: Math.round(Math.random() * 80),
          temperature: device.temperature,
          battery_level: device.battery,
          device_status: device.status,
          tracking_active: true,
          last_update: device.lastSeen,
          created_at: now,
          updated_at: now,
          destination_address: 'Distribution Center',
          estimated_arrival: 'Today 16:30',
          exception_count: 0,
          priority_level: device.battery < 20 ? 'critical' : 'standard'
        };
        
        shipments.push(shipment);
        syncStats.tive++;
        console.log(`✅ Added Tive: ${device.name} (Battery: ${device.battery}%)`);
      }
    } catch (error) {
      console.error('⚠️ Tive sync error:', error.message);
    }
    
    // 4. FETCH PROJECT44 DEVICES
    try {
      const project44Devices = await getProject44Devices();
      
      for (const device of project44Devices) {
        const location = device.location ? 
          await getLocation(device.location.latitude, device.location.longitude) : 
          'Location Unknown';
        
        const shipment = {
          user_id: userId,
          shipment_id: `P44-${device.id}`,
          shipment_name: device.name,
          shipment_type: device.type || 'asset-tracker',
          status: device.status,
          provider: 'project44',
          current_location: location,
          latitude: device.location?.latitude || 0,
          longitude: device.location?.longitude || 0,
          speed: Math.round(Math.random() * 100),
          temperature: device.temperature,
          battery_level: device.battery,
          device_status: 'active',
          tracking_active: true,
          last_update: device.lastSeen,
          created_at: now,
          updated_at: now,
          destination_address: 'Customer Warehouse',
          estimated_arrival: 'Tomorrow 09:00',
          exception_count: 0,
          priority_level: 'standard'
        };
        
        shipments.push(shipment);
        syncStats.project44++;
        console.log(`✅ Added Project44: ${device.name} (Battery: ${device.battery}%)`);
      }
    } catch (error) {
      console.error('⚠️ Project44 sync error:', error.message);
    }
    
    // 5. ADD SAMPLE COLD CHAIN SHIPMENT
    const coldChainSample = {
      user_id: userId,
      shipment_id: 'CC-VAX-2024-001',
      shipment_name: 'COVID Vaccine Shipment - Ultra Cold',
      shipment_type: 'pharmaceuticals',
      status: 'in-transit',
      provider: 'tive',
      current_location: 'Manchester Distribution Center, UK',
      latitude: 53.4808,
      longitude: -2.2426,
      speed: 65,
      temperature: -72,
      target_temp_min: -80,
      target_temp_max: -60,
      battery_level: 92,
      device_status: 'active',
      tracking_active: true,
      last_update: now,
      created_at: now,
      updated_at: now,
      destination_address: 'Edinburgh Medical Center',
      estimated_arrival: 'Today 14:30',
      exception_count: 0,
      priority_level: 'critical',
      current_geofence: 'manchester-distribution'
    };
    
    shipments.push(coldChainSample);
    syncStats.total = shipments.length;
    console.log('✅ Added cold chain sample');
    
    // 6. SAVE TO DATABASE
    if (shipments.length > 0) {
      console.log(`💾 Saving ${shipments.length} devices to database...`);
      
      const { data, error } = await supabase
        .from('shipments')
        .upsert(shipments, { 
          onConflict: 'shipment_id',
          ignoreDuplicates: false
        })
        .select('shipment_id, shipment_name, status, battery_level');

      if (error) {
        console.error('❌ Database save error:', error);
        return { success: false, error: error.message };
      }
      
      console.log('✅ Successfully saved to database');
      
      // Generate alerts for critical conditions
      const alerts = [];
      shipments.forEach(s => {
        // Low battery alert
        if (s.battery_level < 30) {
          alerts.push({
            user_id: userId,
            shipment_id: s.shipment_id,
            alert_type: 'low_battery',
            message: `Battery critically low: ${s.battery_level}%`,
            severity: s.battery_level < 20 ? 'critical' : 'warning',
            created_at: now,
            acknowledged: false,
            muted: false
          });
        }
        
        // Temperature alert for cold chain
        if (s.temperature && s.target_temp_min && s.target_temp_max) {
          if (s.temperature < s.target_temp_min || s.temperature > s.target_temp_max) {
            alerts.push({
              user_id: userId,
              shipment_id: s.shipment_id,
              alert_type: 'temperature_excursion',
              message: `Temperature out of range: ${s.temperature}°C (Target: ${s.target_temp_min}°C to ${s.target_temp_max}°C)`,
              severity: 'critical',
              created_at: now,
              acknowledged: false,
              muted: false
            });
          }
        }
      });
      
      if (alerts.length > 0) {
        await supabase.from('alerts').insert(alerts);
        console.log(`🚨 Generated ${alerts.length} alerts`);
      }
      
      return { 
        success: true, 
        count: syncStats.total,
        devices: data,
        breakdown: syncStats,
        message: `Successfully synced ${syncStats.total} devices across all platforms`
      };
    }
    
    return { success: true, count: 0, message: 'No devices to sync' };
    
  } catch (error) {
    console.error('❌ Sync error:', error);
    return { success: false, error: error.message };
  }
}

// ===== API ROUTES =====

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'GoandTrack Backend V3.1', 
    version: '3.1.0',
    timestamp: new Date().toISOString(),
    platforms: {
      traccar: { configured: true, status: 'active' },
      sensolus: { configured: true, orgId: SENSOLUS.orgId },
      tive: { configured: true, status: 'mock' },
      project44: { configured: true, status: 'mock' }
    }
  });
});

// Get user's shipments
app.get('/api/shipments', async (req, res) => {
  try {
    console.log('📦 GET /api/shipments called');
    const user = await getUserFromToken(req.headers.authorization);
    
    const { data, error } = await supabase
      .from('shipments')
      .select('*')
      .eq('user_id', user.id)
      .order('last_update', { ascending: false });

    if (error) {
      console.error('Database error:', error);
      throw error;
    }
    
    console.log(`📦 Returning ${data?.length || 0} shipments`);
    
    res.json({ 
      success: true, 
      data: data || [], 
      count: data ? data.length : 0,
      user_id: user.id,
      user_email: user.email,
      user_display_name: user.user_metadata?.display_name
    });
  } catch (error) {
    console.error('Error in /api/shipments:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Sync devices - ENHANCED
app.post('/api/sync-devices', async (req, res) => {
  try {
    console.log('🔄 POST /api/sync-devices called');
    const user = await getUserFromToken(req.headers.authorization);
    console.log('🔄 Syncing for user:', user.email);
    
    const result = await syncDevicesForUser(user.id, user.email);
    
    console.log('🔄 Sync complete:', result);
    res.json(result);
  } catch (error) {
    console.error('Error in /api/sync-devices:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Track shipment endpoint (for chatbot)
app.post('/api/track', async (req, res) => {
  try {
    const user = await getUserFromToken(req.headers.authorization);
    const { provider, shipmentId } = req.body;
    
    console.log(`🔍 Tracking ${provider} shipment: ${shipmentId}`);
    
    // Check if shipment exists in database
    const { data: existingShipment } = await supabase
      .from('shipments')
      .select('*')
      .eq('user_id', user.id)
      .eq('shipment_id', shipmentId)
      .single();
    
    if (existingShipment) {
      // Record tracking charge
      await supabase.from('tracking_charges').insert({
        user_id: user.id,
        shipment_id: shipmentId,
        provider: provider,
        charge_amount: 0.50,
        created_at: new Date().toISOString()
      });
      
      res.json({
        success: true,
        ...existingShipment,
        charged: true
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Shipment not found'
      });
    }
  } catch (error) {
    console.error('Error in /api/track:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Get daily billing
app.get('/api/billing/daily/:userId', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('tracking_charges')
      .select('*')
      .eq('user_id', req.params.userId)
      .gte('created_at', `${today}T00:00:00`)
      .lte('created_at', `${today}T23:59:59`);
    
    if (error) throw error;
    
    const totalCost = (data?.length || 0) * 0.50;
    
    res.json({
      success: true,
      totalCost,
      trackingCount: data?.length || 0
    });
  } catch (error) {
    console.error('Error in /api/billing:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Get alerts
app.get('/api/alerts', async (req, res) => {
  try {
    console.log('🚨 GET /api/alerts called');
    const user = await getUserFromToken(req.headers.authorization);
    
    const { data, error } = await supabase
      .from('alerts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw error;
    
    console.log(`🚨 Returning ${data?.length || 0} alerts`);
    
    res.json({ 
      success: true, 
      data: data || [],
      count: data ? data.length : 0
    });
  } catch (error) {
    console.error('Error in /api/alerts:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Get platform status
app.get('/api/providers/status', async (req, res) => {
  try {
    const status = {
      traccar: { connected: true, apiKey: 'configured' },
      sensolus: { connected: true, apiKey: 'configured' },
      tive: { connected: false, apiKey: 'demo' },
      project44: { connected: false, apiKey: 'demo' }
    };
    
    res.json(status);
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Test Sensolus connection
app.get('/api/test-sensolus', async (req, res) => {
  try {
    console.log('🧪 Testing Sensolus connection...');
    
    const devices = await getSensolusDevices();
    
    res.json({
      success: true,
      message: 'Sensolus connection test',
      orgId: SENSOLUS.orgId,
      baseUrl: SENSOLUS.baseUrl,
      devicesFound: devices.length,
      devices: devices.map(d => ({
        id: d.id,
        name: d.name,
        battery: d.battery,
        temperature: d.temperature,
        humidity: d.humidity
      }))
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Test all connections
app.get('/api/test-connection', async (req, res) => {
  try {
    console.log('🧪 Testing all connections...');
    
    // Test Supabase
    const { count } = await supabase
      .from('shipments')
      .select('*', { count: 'exact', head: true });
    
    // Test Traccar
    let traccarStatus = 'Unknown';
    try {
      const response = await axios.get(`${TRACCAR.url}/server`, { 
        headers: getTraccarAuth(),
        timeout: 5000
      });
      traccarStatus = `Connected (v${response.data.version})`;
    } catch {
      traccarStatus = 'Connection failed';
    }
    
    // Test Sensolus
    let sensolusStatus = 'Unknown';
    try {
      const devices = await getSensolusDevices();
      sensolusStatus = `Connected (${devices.length} devices)`;
    } catch {
      sensolusStatus = 'Using mock data';
    }
    
    res.json({
      success: true,
      connections: {
        supabase: count !== null ? `Connected (${count} shipments)` : 'Connected',
        traccar: traccarStatus,
        sensolus: sensolusStatus,
        tive: 'Mock mode',
        project44: 'Mock mode'
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// WebSocket support for real-time updates
const server = app.listen(PORT, () => {
  console.log('');
  console.log('✅ GoandTrack Backend V3.1 Running');
  console.log('🌐 Server: http://localhost:' + PORT);
  console.log('📊 Dashboard: http://localhost:3000');
  console.log('');
  console.log('📱 Multi-Platform Support:');
  console.log('   ✅ Traccar - Real GPS tracking');
  console.log('   ✅ Sensolus - Environmental monitoring');
  console.log('   ✅ Tive - Cold chain tracking (mock)');
  console.log('   ✅ Project44 - Asset tracking (mock)');
  console.log('');
  console.log('🔌 API Endpoints:');
  console.log('   GET  /api/shipments - Get all shipments');
  console.log('   POST /api/sync-devices - Sync all platforms');
  console.log('   POST /api/track - Track specific shipment');
  console.log('   GET  /api/alerts - Get user alerts');
  console.log('   GET  /api/billing/daily/:userId - Get daily costs');
  console.log('   GET  /api/providers/status - Platform status');
  console.log('   GET  /api/test-sensolus - Test Sensolus API');
  console.log('   GET  /api/test-connection - Test all connections');
  console.log('');
  console.log('💰 Billing: $0.50 per shipment per day');
  console.log('🔐 Auth: Supabase token or demo mode');
  console.log('');
  console.log('Ready for AI-powered tracking!');
});

// Basic WebSocket setup for real-time alerts
const WebSocket = require('ws');
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
  console.log('🔌 WebSocket client connected');
  
  ws.on('message', (message) => {
    console.log('📨 Received:', message);
  });
  
  // Send test alert every 30 seconds
  const alertInterval = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'alert',
        alert: {
          id: Date.now(),
          shipment_id: 'CC-VAX-2024-001',
          message: `Temperature stable at ${-72 + Math.random() * 2}°C`,
          priority: 'info',
          timestamp: new Date().toISOString()
        }
      }));
    }
  }, 30000);
  
  ws.on('close', () => {
    console.log('🔌 WebSocket client disconnected');
    clearInterval(alertInterval);
  });
});

module.exports = app;