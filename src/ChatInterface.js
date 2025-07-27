// src/ChatInterface.js - ADVANCED VERSION MATCHING HTML PROTOTYPE
import React, { useState, useEffect } from 'react';

function ChatInterface() {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [alertSoundEnabled, setAlertSoundEnabled] = useState(true);
  const [notifications, setNotifications] = useState([]);

  // Advanced shipment data matching the HTML prototype
  const shipments = [
    {
      id: 'CC-VAX-2024-001',
      name: 'Pfizer COVID Vaccines',
      type: 'pharmaceuticals',
      status: 'in-transit',
      temperature: -72.5,
      targetTemp: { min: -80, max: -65 },
      battery: 87,
      location: { city: 'Manchester', lat: 53.4708, lng: -2.2426 },
      destination: 'Edinburgh Medical Center',
      estimatedArrival: '14:30 today',
      currentGeofence: null,
      provider: 'Tive'
    },
    {
      id: 'CC-FOOD-2024-078',
      name: 'Frozen Seafood Export',
      type: 'food',
      status: 'in-transit',
      temperature: -18.2,
      targetTemp: { min: -22, max: -15 },
      battery: 72,
      location: { city: 'Dover', lat: 51.1279, lng: 1.3134 },
      destination: 'Paris Distribution Hub',
      estimatedArrival: '16:45 today',
      currentGeofence: 'dover-port',
      provider: 'Project44'
    },
    {
      id: 'CC-BLOOD-2024-156',
      name: 'Blood Products Emergency',
      type: 'medical',
      status: 'critical',
      temperature: 3.8,
      targetTemp: { min: 2, max: 6 },
      battery: 45,
      location: { city: 'London', lat: 51.5074, lng: -0.1278 },
      destination: 'St. Bartholomew\'s Hospital',
      estimatedArrival: '11:15 today',
      currentGeofence: 'london-city',
      provider: 'Tive'
    },
    {
      id: 'CC-ORGAN-2024-023',
      name: 'Transplant Organs',
      type: 'medical',
      status: 'in-transit',
      temperature: 1.2,
      targetTemp: { min: 0, max: 4 },
      battery: 91,
      location: { city: 'Leeds', lat: 53.8008, lng: -1.5491 },
      destination: 'Birmingham Queen Elizabeth Hospital',
      estimatedArrival: '13:45 today',
      currentGeofence: 'leeds-hub',
      provider: 'Project44'
    },
    {
      id: 'CC-INSULIN-2024-234',
      name: 'Insulin Shipment',
      type: 'pharmaceuticals',
      status: 'delayed',
      temperature: 4.5,
      targetTemp: { min: 2, max: 8 },
      battery: 63,
      location: { city: 'Birmingham', lat: 52.4862, lng: -1.8904 },
      destination: 'Cardiff Diabetes Center',
      estimatedArrival: '17:20 today',
      currentGeofence: null,
      provider: 'Tive'
    },
    {
      id: 'CC-PLASMA-2024-089',
      name: 'Blood Plasma Products',
      type: 'medical',
      status: 'at-destination',
      temperature: -20.1,
      targetTemp: { min: -25, max: -18 },
      battery: 78,
      location: { city: 'London Heathrow', lat: 51.4700, lng: -0.4543 },
      destination: 'Heathrow Medical Facility',
      estimatedArrival: 'Delivered',
      currentGeofence: 'heathrow-medical',
      provider: 'Project44'
    }
  ];

  // Initialize with welcome message and sample notifications
  useEffect(() => {
    setMessages([
      {
        id: 1,
        text: "Hello! I'm GoandTrack AI with advanced geofencing and interactive mapping. I provide real-time shipment visibility, exception alerting, and route monitoring. I can track geofence zones, provide live temperature alerts, location updates, and delivery estimates.\n\n📦 Currently Tracking 6 Active Shipments:\n\n💡 Click any shipment ID below for detailed information, or ask me anything!",
        sender: 'ai',
        timestamp: new Date()
      }
    ]);

    // Initialize sample notifications
    setNotifications([
      {
        id: 1,
        time: '1 minute ago',
        content: '🚨 CC-BLOOD-2024-156: Battery at 45% - Critical shipment needs attention',
        type: 'alert',
        shipment: 'CC-BLOOD-2024-156'
      },
      {
        id: 2,
        time: '3 minutes ago',
        content: '🛡️ CC-ORGAN-2024-023: Entered Leeds Transit Hub geofence',
        type: 'info',
        shipment: 'CC-ORGAN-2024-023'
      },
      {
        id: 3,
        time: '5 minutes ago',
        content: '✅ CC-VAX-2024-001: Temperature stable at -72.5°C',
        type: 'success',
        shipment: 'CC-VAX-2024-001'
      }
    ]);
  }, []);

  const processMessage = (message) => {
    const lowerMessage = message.toLowerCase();
    
    // All shipments status
    if (lowerMessage.includes('status') || lowerMessage.includes('all shipment') || lowerMessage.includes('show me all')) {
      const statusData = shipments.map(shipment => {
        const statusIcon = shipment.status === 'critical' ? '🚨' : 
                          shipment.status === 'delayed' ? '⚠️' : 
                          shipment.status === 'at-destination' ? '✅' : '🚛';
        const tempStatus = (shipment.temperature >= shipment.targetTemp.min && 
                           shipment.temperature <= shipment.targetTemp.max) ? '✅' : '❌';
        const batteryStatus = shipment.battery > 50 ? '🔋' : shipment.battery > 20 ? '🟡' : '🔴';
        
        return `${statusIcon} ${shipment.id}: ${shipment.name}\nStatus: ${shipment.status} | Location: ${shipment.location.city}\nTemp: ${tempStatus} ${shipment.temperature}°C | Battery: ${batteryStatus} ${shipment.battery}%\nProvider: ${shipment.provider}\n`;
      }).join('\n');
      
      return `📦 Currently tracking ${shipments.length} shipments:\n\n${statusData}\n💰 Charged $0.50 for today's tracking query.`;
    }
    
    // Temperature check
    if (lowerMessage.includes('temperature') || lowerMessage.includes('temp')) {
      const tempData = shipments.map(shipment => {
        const inRange = shipment.temperature >= shipment.targetTemp.min && 
                       shipment.temperature <= shipment.targetTemp.max;
        const statusIcon = inRange ? '✅' : '🌡️';
        const statusText = inRange ? 'OK' : 'OUT OF RANGE';
        
        return `${statusIcon} ${shipment.id}: ${shipment.temperature}°C\nTarget: ${shipment.targetTemp.min}°C to ${shipment.targetTemp.max}°C | Status: ${statusText}`;
      }).join('\n\n');
      
      return `🌡️ Temperature Status:\n\n${tempData}\n\nAll temperature readings updated. 💰 Charged $0.50 for today's monitoring.`;
    }
    
    // Battery levels
    if (lowerMessage.includes('battery') || lowerMessage.includes('power')) {
      const batteryData = shipments.map(shipment => {
        const batteryIcon = shipment.battery > 50 ? '🔋' : shipment.battery > 20 ? '🟡' : '🔴';
        const batteryStatus = shipment.battery > 50 ? 'Good' : shipment.battery > 20 ? 'Low' : 'Critical';
        
        return `${batteryIcon} ${shipment.id}: ${shipment.battery}%\nStatus: ${batteryStatus}`;
      }).join('\n\n');
      
      return `🔋 Battery Status:\n\n${batteryData}\n\nBattery levels checked across all tracking devices. 💰 Charged $0.50 for today's monitoring.`;
    }
    
    // Critical shipments
    if (lowerMessage.includes('critical') || lowerMessage.includes('emergency')) {
      const criticalShipments = shipments.filter(shipment => 
        shipment.status === 'critical' || shipment.battery < 50 || 
        shipment.temperature < shipment.targetTemp.min || 
        shipment.temperature > shipment.targetTemp.max
      );
      
      if (criticalShipments.length === 0) {
        return "✅ No critical shipments detected. All shipments are operating within normal parameters.";
      }
      
      const criticalData = criticalShipments.map(shipment => {
        const issues = [];
        if (shipment.status === 'critical') issues.push('Critical status');
        if (shipment.battery < 50) issues.push(`Low battery (${shipment.battery}%)`);
        if (shipment.temperature < shipment.targetTemp.min || shipment.temperature > shipment.targetTemp.max) {
          issues.push(`Temperature out of range (${shipment.temperature}°C)`);
        }
        
        return `🚨 ${shipment.id}: ${shipment.name}\nIssues: ${issues.join(', ')}`;
      }).join('\n\n');
      
      return `⚠️ ${criticalShipments.length} shipment(s) need immediate attention:\n\n${criticalData}\n\n💰 Charged $0.50 for critical alert analysis.`;
    }
    
    // Specific shipment query
    if (lowerMessage.includes('cc-')) {
      const shipmentId = message.match(/(cc-[a-z]+-\d{4}-\d{3})/i);
      if (shipmentId) {
        const shipment = shipments.find(s => s.id.toLowerCase() === shipmentId[0].toLowerCase());
        if (shipment) {
          const statusIcon = shipment.status === 'critical' ? '🚨' : 
                            shipment.status === 'delayed' ? '⚠️' : 
                            shipment.status === 'at-destination' ? '✅' : '🚛';
          const tempStatus = (shipment.temperature >= shipment.targetTemp.min && 
                             shipment.temperature <= shipment.targetTemp.max) ? '✅' : '❌';
          const batteryIcon = shipment.battery > 50 ? '🔋' : shipment.battery > 20 ? '🟡' : '🔴';
          const geofenceInfo = shipment.currentGeofence ? `\n🛡️ Current Geofence: ${shipment.currentGeofence}` : '';
          
          return `${statusIcon} ${shipment.id} - ${shipment.name}\n\nStatus: ${shipment.status}\nProvider: ${shipment.provider}\nType: ${shipment.type}\n\nTemperature: ${tempStatus} ${shipment.temperature}°C (Target: ${shipment.targetTemp.min}°C to ${shipment.targetTemp.max}°C)\nBattery: ${batteryIcon} ${shipment.battery}%\n\nCurrent Location: ${shipment.location.city}\nDestination: ${shipment.destination}\nETA: ${shipment.estimatedArrival}${geofenceInfo}\n\n💰 Charged $0.50 for today's tracking query.`;
        }
      }
    }
    
    // Default response
    return `I understand you're asking about "${message}". I can help with:\n\n📦 "Show me all shipments"\n🌡️ "Check temperatures"\n🔋 "Battery levels"\n🚨 "Show critical shipments"\n🔍 "Tell me about CC-[SHIPMENT-ID]"\n\nTry one of these commands!`;
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = {
      id: Date.now(),
      text: inputMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    setTimeout(() => {
      const response = processMessage(inputMessage);
      const aiMessage = {
        id: Date.now() + 1,
        text: response,
        sender: 'ai',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
      setIsLoading(false);
    }, 1000);

    setInputMessage('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  const acknowledgeAlert = (alertId) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === alertId 
          ? { ...notif, acknowledged: true }
          : notif
      )
    );
  };

  // Styles
  const containerStyle = {
    background: 'white',
    borderRadius: '20px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
    width: '100%',
    maxWidth: '1200px',
    height: '85vh',
    display: 'flex',
    border: '1px solid rgba(0, 0, 0, 0.06)',
    overflow: 'hidden',
    margin: '0 auto',
    marginTop: '20px'
  };

  const chatSectionStyle = {
    flex: 1,
    height: '100%',
    display: 'flex',
    flexDirection: 'column'
  };

  const headerStyle = {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    padding: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    height: '80px',
    borderBottom: '1px solid rgba(0, 0, 0, 0.08)'
  };

  const logoStyle = {
    background: '#DC2626',
    width: '45px',
    height: '45px',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontSize: '18px',
    border: '2px solid rgba(0,0,0,0.1)'
  };

  const messagesStyle = {
    flex: 1,
    overflowY: 'auto',
    padding: '20px',
    background: 'white',
    display: 'flex',
    flexDirection: 'column',
    gap: '15px'
  };

  const inputStyle = {
    height: '100px',
    padding: '20px',
    background: 'white',
    borderTop: '1px solid rgba(0, 0, 0, 0.08)',
    display: 'flex',
    gap: '15px',
    alignItems: 'center'
  };

  const notificationsPanelStyle = {
    width: '300px',
    background: 'white',
    borderLeft: '1px solid rgba(0, 0, 0, 0.08)',
    display: 'flex',
    flexDirection: 'column'
  };

  return (
    <div style={containerStyle}>
      {/* Chat Section */}
      <div style={chatSectionStyle}>
        {/* Header */}
        <div style={headerStyle}>
          <div style={{ width: '12px', height: '12px', background: '#10b981', borderRadius: '50%', animation: 'pulse 2s infinite' }}></div>
          <div style={logoStyle}>
            🌐
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: 0, fontWeight: '700', letterSpacing: '-0.025em' }}>
              <span style={{ color: 'white' }}>go</span>
              <span style={{ color: 'white' }}>and</span>
              <span style={{ color: 'white' }}>track</span>
              <span style={{ color: '#10b981', fontWeight: '600', marginLeft: '8px' }}>AI</span>
            </h2>
            <p style={{ margin: '5px 0 0 0', opacity: 0.9, fontSize: '14px' }}>
              Live Shipment Monitoring • Tracking {shipments.length} shipments
            </p>
          </div>
          <button
            onClick={() => setShowHelp(true)}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: '1px solid rgba(255,255,255,0.3)',
              color: 'white',
              padding: '8px 12px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            ? Help
          </button>
        </div>

        {/* Messages */}
        <div style={messagesStyle}>
          {messages.map(message => (
            <div key={message.id} style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              maxWidth: '80%',
              alignSelf: message.sender === 'user' ? 'flex-end' : 'flex-start',
              flexDirection: message.sender === 'user' ? 'row-reverse' : 'row'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                color: 'white',
                background: message.sender === 'user' ? '#000000' : '#6366f1'
              }}>
                {message.sender === 'user' ? 'U' : 'AI'}
              </div>
              <div style={{
                background: message.sender === 'user' ? '#000000' : '#f8f9fa',
                color: message.sender === 'user' ? 'white' : '#000000',
                padding: '15px 20px',
                borderRadius: '18px',
                border: '1px solid rgba(0, 0, 0, 0.06)',
                whiteSpace: 'pre-line'
              }}>
                {message.text}
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '15px 20px', background: 'rgba(0, 0, 0, 0.02)', borderRadius: '18px', margin: '10px 0' }}>
              <div style={{ width: '8px', height: '8px', background: '#6b7280', borderRadius: '50%', animation: 'typing 1.4s infinite' }}></div>
              <div style={{ width: '8px', height: '8px', background: '#6b7280', borderRadius: '50%', animation: 'typing 1.4s infinite 0.2s' }}></div>
              <div style={{ width: '8px', height: '8px', background: '#6b7280', borderRadius: '50%', animation: 'typing 1.4s infinite 0.4s' }}></div>
            </div>
          )}
        </div>

        {/* Input */}
        <div style={inputStyle}>
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about shipment status, map view, geofences, or locations..."
            style={{
              flex: 1,
              padding: '15px 20px',
              border: '2px solid rgba(0, 0, 0, 0.08)',
              borderRadius: '25px',
              fontSize: '16px',
              outline: 'none'
            }}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isLoading}
            style={{
              background: '#000000',
              color: 'white',
              border: 'none',
              padding: '15px 20px',
              borderRadius: '50%',
              cursor: 'pointer',
              width: '50px',
              height: '50px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ➤
          </button>
        </div>
      </div>

      {/* Notifications Panel */}
      <div style={notificationsPanelStyle}>
        <div style={{
          background: 'white',
          padding: '15px 20px 10px 20px',
          fontWeight: '600',
          borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          🔔 Shipment Alerts
          <button
            onClick={() => setAlertSoundEnabled(!alertSoundEnabled)}
            style={{
              marginLeft: 'auto',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              opacity: alertSoundEnabled ? 1 : 0.5
            }}
          >
            {alertSoundEnabled ? '🔊' : '🔇'}
          </button>
        </div>
        
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
          {notifications.map(notification => (
            <div key={notification.id} style={{
              background: notification.type === 'alert' ? 'rgba(239, 68, 68, 0.05)' : 
                         notification.type === 'success' ? 'rgba(16, 185, 129, 0.05)' : 'rgba(16, 185, 129, 0.05)',
              border: `1px solid ${notification.type === 'alert' ? 'rgba(239, 68, 68, 0.1)' : 
                                 notification.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.1)'}`,
              borderRadius: '12px',
              padding: '15px',
              marginBottom: '15px',
              opacity: notification.acknowledged ? 0.6 : 1
            }}>
              <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '5px' }}>
                {notification.time}
              </div>
              <div style={{ fontSize: '14px', lineHeight: '1.4', color: '#000000' }}>
                {notification.content}
              </div>
              {!notification.acknowledged && (
                <div style={{ marginTop: '8px' }}>
                  <button
                    onClick={() => acknowledgeAlert(notification.id)}
                    style={{
                      background: 'rgba(16, 185, 129, 0.05)',
                      border: '1px solid rgba(16, 185, 129, 0.2)',
                      color: '#059669',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '10px',
                      cursor: 'pointer'
                    }}
                  >
                    Acknowledge
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Help Modal */}
      {showHelp && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(0, 0, 0, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '30px',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '80vh',
            overflowY: 'auto',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
            position: 'relative'
          }}>
            <button
              onClick={() => setShowHelp(false)}
              style={{
                position: 'absolute',
                top: '15px',
                right: '15px',
                background: 'none',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                color: '#6b7280'
              }}
            >
              ×
            </button>
            <h3 style={{ color: '#000000', marginBottom: '20px', fontSize: '20px' }}>
              💬 Try These Commands
            </h3>
            {[
              { cmd: "Show me all shipment status", desc: "Get overview of all 6 shipments with temperatures and battery levels" },
              { cmd: "What are the current temperatures?", desc: "View temperature readings and target ranges for all shipments" },
              { cmd: "Check battery levels", desc: "Monitor tracking device battery status and low power warnings" },
              { cmd: "Show me critical shipments", desc: "Display shipments requiring immediate attention" },
              { cmd: "Tell me about CC-PLASMA-2024-089", desc: "Get detailed info about the plasma shipment at Heathrow" }
            ].map((example, idx) => (
              <div key={idx} style={{
                background: 'rgba(0, 0, 0, 0.02)',
                border: '1px solid rgba(0, 0, 0, 0.06)',
                borderRadius: '8px',
                padding: '12px',
                margin: '8px 0',
                cursor: 'pointer'
              }}
              onClick={() => {
                setInputMessage(example.cmd);
                setShowHelp(false);
              }}>
                <div style={{ fontFamily: 'Monaco, monospace', color: '#000000', fontWeight: '600', marginBottom: '4px' }}>
                  "{example.cmd}"
                </div>
                <div style={{ fontSize: '14px', color: '#6b7280' }}>
                  {example.desc}
                </div>
              </div>
            ))}
            <p style={{ marginTop: '20px', fontSize: '14px', color: '#6b7280', textAlign: 'center' }}>
              💡 Click any command above to try it, or type your own question!
            </p>
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes typing {
          0%, 60%, 100% { transform: scale(1); opacity: 0.5; }
          30% { transform: scale(1.2); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

export default ChatInterface;