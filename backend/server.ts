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

// Convert Traccar device to GoandTrack shipment format
function convertTraccarDeviceToShipment(device, position, adminUserId) {
  const now = new Date();
  const lastUpdate = position ? new Date(position.fixTime || position.serverTime) : now;
  const isOnline = position && (now - lastUpdate) < 300000; // 5 minutes threshold
  
  return {
    user_id: adminUserId, // Dynamic admin account UUID
    shipment_id: `TRACCAR-${device.uniqueId}`,
    shipment_name: device.name || `Device ${device.uniqueId}`,
    shipment_type: 'vehicle',
    status: position ? (isOnline ? 'in-transit' : 'stopped') : 'offline',
    temperature: position?.attributes?.temp || null,
    target_temp_min: null,
    target_temp_max: null,
    battery_level: position?.attributes?.battery || position?.attributes?.power || 100,
    current_location: position?.address || 'Unknown Location',
    latitude: position?.latitude || 0,
    longitude: position?.longitude || 0,
    destination_address: device.contact || 'Not specified',
    estimated_arrival: 'Real-time tracking',
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
    
    const shipments = devices.map(device => {
      const position = positionMap[device.id];
      return convertTraccarDeviceToShipment(device, position, adminUserId);
    });
    
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
        console.log(`✅ Synced device: ${shipment.shipment_name} (${shipment.shipment_id})`);
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