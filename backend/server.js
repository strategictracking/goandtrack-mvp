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

// Environment variables
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

// Initialize Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Traccar Configuration
const TRACCAR_CONFIG = {
  serverUrl: 'https://demo.traccar.org/api',
  username: 'matthew@strategictracking.com',
  password: 'HenryG005e!(sf'
};

// Create authentication headers for Traccar
const getTraccarAuth = () => {
  const credentials = Buffer.from(`${TRACCAR_CONFIG.username}:${TRACCAR_CONFIG.password}`).toString('base64');
  return {
    'Authorization': `Basic ${credentials}`,
    'Content-Type': 'application/json'
  };
};

// Test Traccar connection
async function testTraccarConnection() {
  try {
    console.log('🔌 Testing Traccar connection...');
    const response = await axios.get(`${TRACCAR_CONFIG.serverUrl}/server`, {
      headers: getTraccarAuth()
    });
    console.log('✅ Traccar connection successful!');
    console.log(`📍 Server: ${response.data.version || 'Traccar Server'}`);
    return true;
  } catch (error) {
    console.error('❌ Traccar connection failed:', error.response?.data || error.message);
    return false;
  }
}

// Fetch devices from Traccar
async function fetchTraccarDevices() {
  try {
    const response = await axios.get(`${TRACCAR_CONFIG.serverUrl}/devices`, {
      headers: getTraccarAuth()
    });
    console.log(`📱 Found ${response.data.length} devices in Traccar`);
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching Traccar devices:', error.response?.data || error.message);
    return [];
  }
}

// Fetch positions from Traccar
async function fetchTraccarPositions() {
  try {
    const response = await axios.get(`${TRACCAR_CONFIG.serverUrl}/positions`, {
      headers: getTraccarAuth()
    });
    console.log(`📍 Found ${response.data.length} positions from Traccar`);
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching Traccar positions:', error.response?.data || error.message);
    return [];
  }
}

// Reverse geocoding function to get address from coordinates
async function reverseGeocode(lat, lng) {
  try {
    // Using OpenStreetMap Nominatim (free, no API key needed)
    const response = await axios.get(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'GoandTrack GPS Tracking System'
        }
      }
    );
    
    if (response.data && response.data.display_name) {
      // Parse the address for a cleaner display
      const addr = response.data.address || {};
      const parts = [];
      
      if (addr.house_number && addr.road) {
        parts.push(`${addr.house_number} ${addr.road}`);
      } else if (addr.road) {
        parts.push(addr.road);
      }
      
      if (addr.suburb || addr.neighbourhood) {
        parts.push(addr.suburb || addr.neighbourhood);
      }
      
      if (addr.city || addr.town || addr.village) {
        parts.push(addr.city || addr.town || addr.village);
      }
      
      if (addr.postcode) {
        parts.push(addr.postcode);
      }
      
      return parts.join(', ') || response.data.display_name;
    }
    
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  } catch (error) {
    console.log(`📍 Address lookup failed for ${lat}, ${lng}:`, error.message);
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  }
}

// Get admin user ID from database
async function getAdminUserId() {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .eq('email', 'matthew@strategictracking.com')
      .eq('role', 'admin')
      .single();
    
    if (error) {
      console.error('❌ Error fetching admin user:', error);
      return null;
    }
    
    return data.id;
  } catch (error) {
    console.error('❌ Error fetching admin user:', error);
    return null;
  }
}

// Enhanced device conversion with better data formatting and battery debug
async function convertTraccarDeviceToShipment(device, position, adminUserId) {
  const now = new Date();
  const lastUpdate = position ? new Date(position.fixTime || position.serverTime) : now;
  const isOnline = position && (now - lastUpdate) < 300000; // 5 minutes threshold
  
  // Determine device status
  let status = 'offline';
  if (position) {
    const speed = position.speed || 0;
    if (!isOnline) {
      status = 'offline';
    } else if (speed > 5) { // Moving faster than 5 km/h
      status = 'in-transit';
    } else {
      status = 'stopped';
    }
  }
  
  // Get address from coordinates
  let currentLocation = 'Unknown Location';
  if (position && position.latitude && position.longitude) {
    if (position.address) {
      currentLocation = position.address;
    } else {
      // Use reverse geocoding to get address
      currentLocation = await reverseGeocode(position.latitude, position.longitude);
    }
  }
  
  // ENHANCED BATTERY DETECTION WITH DEBUG LOGGING
  let batteryLevel = 100; // Default for devices without battery info
  
  // DEBUG: Log all available attributes to see what battery fields exist
  if (position && position.attributes) {
    console.log(`🔋 DEBUG - Device ${device.name} (ID: ${device.id}) attributes:`, Object.keys(position.attributes));
    console.log(`🔋 DEBUG - All attributes for ${device.name}:`, JSON.stringify(position.attributes, null, 2));
  }
  
  // Try multiple common battery attribute names
  if (position?.attributes?.battery) {
    batteryLevel = Math.round(position.attributes.battery);
    console.log(`🔋 Found battery level: ${batteryLevel}% (from 'battery' field) for ${device.name}`);
  } else if (position?.attributes?.power) {
    batteryLevel = Math.round(position.attributes.power);
    console.log(`🔋 Found battery level: ${batteryLevel}% (from 'power' field) for ${device.name}`);
  } else if (position?.attributes?.batteryLevel) {
    batteryLevel = Math.round(position.attributes.batteryLevel);
    console.log(`🔋 Found battery level: ${batteryLevel}% (from 'batteryLevel' field) for ${device.name}`);
  } else if (position?.attributes?.bat) {
    batteryLevel = Math.round(position.attributes.bat);
    console.log(`🔋 Found battery level: ${batteryLevel}% (from 'bat' field) for ${device.name}`);
  } else if (position?.attributes?.batteryPercent) {
    batteryLevel = Math.round(position.attributes.batteryPercent);
    console.log(`🔋 Found battery level: ${batteryLevel}% (from 'batteryPercent' field) for ${device.name}`);
  } else if (position?.attributes?.voltage) {
    // Convert voltage to percentage (rough estimation for 12V systems)
    const voltage = position.attributes.voltage;
    batteryLevel = Math.min(100, Math.max(0, Math.round(((voltage - 11.0) / (14.4 - 11.0)) * 100)));
    console.log(`🔋 Estimated battery level: ${batteryLevel}% (from voltage: ${voltage}V) for ${device.name}`);
  } else {
    console.log(`🔋 No battery data found for ${device.name}, using default 100%`);
    console.log(`🔋 Available attributes: ${Object.keys(position?.attributes || {}).join(', ')}`);
  }
  
  // Calculate estimated arrival or journey info
  let estimatedArrival = 'Real-time tracking';
  if (position && status === 'in-transit') {
    const speed = position.speed || 0;
    estimatedArrival = `Moving at ${speed.toFixed(1)} km/h`;
  } else if (status === 'stopped') {
    const stoppedTime = Math.round((now - lastUpdate) / 1000 / 60); // minutes
    estimatedArrival = `Stopped for ${stoppedTime} min`;
  } else if (status === 'offline') {
    const offlineTime = Math.round((now - lastUpdate) / 1000 / 60); // minutes
    estimatedArrival = `Offline for ${offlineTime} min`;
  }
  
  return {
    user_id: adminUserId,
    shipment_id: `TRACCAR-${device.uniqueId}`,
    shipment_name: device.name || `Device ${device.uniqueId}`,
    shipment_type: 'vehicle',
    status: status,
    temperature: position?.attributes?.temp || null,
    target_temp_min: null,
    target_temp_max: null,
    battery_level: batteryLevel,
    current_location: currentLocation,
    latitude: position?.latitude || 0,
    longitude: position?.longitude || 0,
    destination_address: device.contact || device.name || 'GPS Vehicle',
    estimated_arrival: estimatedArrival,
    provider: 'Traccar',
    tracking_active: !device.disabled,
    current_geofence: null,
    traccar_device_id: device.id,
    traccar_unique_id: device.uniqueId,
    last_update: lastUpdate.toISOString(),
    speed: position?.speed || 0,
    course: position?.course || 0,
    altitude: position?.altitude || 0,
    accuracy: position?.accuracy || 0,
    created_at: now.toISOString(),
    updated_at: now.toISOString()
  };
}

// Sync Traccar devices to Supabase
async function syncTraccarDevices() {
  try {
    console.log('🔄 Starting Traccar device sync...');
    
    // Get admin user ID
    const adminUserId = await getAdminUserId();
    if (!adminUserId) {
      throw new Error('Admin user not found. Please check database setup.');
    }
    console.log(`👤 Using admin user ID: ${adminUserId}`);
    
    const devices = await fetchTraccarDevices();
    const positions = await fetchTraccarPositions();
    
    if (devices.length === 0) {
      console.log('⚠️ No devices found in Traccar');
      return;
    }
    
    // Create position lookup map
    const positionMap = {};
    positions.forEach(pos => {
      positionMap[pos.deviceId] = pos;
    });
    
    const shipments = [];
    for (const device of devices) {
      const position = positionMap[device.id];
      const shipment = await convertTraccarDeviceToShipment(device, position, adminUserId);
      shipments.push(shipment);
    }
    
    // Insert/update shipments in Supabase
    for (const shipment of shipments) {
      const { data, error } = await supabase
        .from('shipments')
        .upsert(shipment, { 
          onConflict: 'user_id,shipment_id',
          ignoreDuplicates: false 
        });
      
      if (error) {
        console.error(`❌ Error syncing device ${shipment.shipment_id}:`, error);
      } else {
        console.log(`✅ Synced device: ${shipment.shipment_name} (${shipment.shipment_id}) - Battery: ${shipment.battery_level}%`);
      }
    }
    
    console.log(`🎉 Sync complete! ${shipments.length} devices processed`);
    return shipments;
    
  } catch (error) {
    console.error('❌ Error in device sync:', error);
    throw error;
  }
}

// Update Traccar connection status in database
async function updateConnectionStatus(status) {
  try {
    const adminUserId = await getAdminUserId();
    if (!adminUserId) {
      console.error('❌ Admin user not found for connection status update');
      return;
    }
    
    const { error } = await supabase
      .from('user_device_connections')
      .update({ 
        connection_status: status,
        last_sync: new Date().toISOString()
      })
      .eq('provider', 'Traccar')
      .eq('user_id', adminUserId);
    
    if (error) {
      console.error('❌ Error updating connection status:', error);
    }
  } catch (error) {
    console.error('❌ Error updating connection status:', error);
  }
}

// API Routes

// Test connection endpoint
app.get('/api/test-connection', async (req, res) => {
  try {
    const isConnected = await testTraccarConnection();
    await updateConnectionStatus(isConnected ? 'connected' : 'failed');
    
    res.json({
      success: isConnected,
      message: isConnected ? 'Traccar connection successful' : 'Traccar connection failed',
      server: TRACCAR_CONFIG.serverUrl
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Connection test failed',
      error: error.message
    });
  }
});

// Sync devices endpoint
app.post('/api/sync-devices', async (req, res) => {
  try {
    const shipments = await syncTraccarDevices();
    await updateConnectionStatus('connected');
    
    res.json({
      success: true,
      message: `Successfully synced ${shipments.length} devices`,
      devices: shipments.length,
      data: shipments
    });
  } catch (error) {
    await updateConnectionStatus('failed');
    res.status(500).json({
      success: false,
      message: 'Device sync failed',
      error: error.message
    });
  }
});

// Get live positions
app.get('/api/positions', async (req, res) => {
  try {
    const positions = await fetchTraccarPositions();
    res.json({
      success: true,
      positions: positions,
      count: positions.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch positions',
      error: error.message
    });
  }
});

// Get devices from Traccar
app.get('/api/devices', async (req, res) => {
  try {
    const devices = await fetchTraccarDevices();
    res.json({
      success: true,
      devices: devices,
      count: devices.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch devices',
      error: error.message
    });
  }
});

// Get device events
app.get('/api/events', async (req, res) => {
  try {
    const { deviceId, from, to } = req.query;
    let url = `${TRACCAR_CONFIG.serverUrl}/events`;
    
    const params = new URLSearchParams();
    if (deviceId) params.append('deviceId', deviceId);
    if (from) params.append('from', from);
    if (to) params.append('to', to);
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
    
    const response = await axios.get(url, {
      headers: getTraccarAuth()
    });
    
    res.json({
      success: true,
      events: response.data,
      count: response.data.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch events',
      error: error.message
    });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'GoandTrack Traccar Backend',
    version: '1.0.0'
  });
});

// Auto-sync every 30 seconds for real-time updates
let syncInterval;

async function startAutoSync() {
  console.log('🔄 Starting auto-sync every 30 seconds...');
  
  // Initial sync
  await testTraccarConnection();
  await syncTraccarDevices();
  
  // Set up interval
  syncInterval = setInterval(async () => {
    try {
      await syncTraccarDevices();
    } catch (error) {
      console.error('❌ Auto-sync error:', error.message);
    }
  }, 30000); // 30 seconds
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('🛑 Shutting down gracefully...');
  if (syncInterval) {
    clearInterval(syncInterval);
  }
  process.exit(0);
});

// Start server
app.listen(PORT, async () => {
  console.log(`🚀 GoandTrack Traccar Backend running on port ${PORT}`);
  console.log(`📡 Connected to Traccar: ${TRACCAR_CONFIG.serverUrl}`);
  console.log(`👤 User: ${TRACCAR_CONFIG.username}`);
  
  // Start auto-sync
  setTimeout(startAutoSync, 2000); // Start after 2 seconds
});

module.exports = app;