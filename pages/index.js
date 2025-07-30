import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';

// Zone boundaries
const zoneBounds = {
  "Mark's Office": {"x_min": 300, "x_max": 550, "y_min": -1070, "y_max": -770},
  "Sy's Office": {"x_min": 550, "x_max": 775, "y_min": -1070, "y_max": -775},
  "Dietrik's Office": {"x_min": 775, "x_max": 1000, "y_min": -1070, "y_max": -775},
  "SM Conf Room": {"x_min": 1000, "x_max": 1220, "y_min": -1070, "y_max": -775},
  "Customer Service": {"x_min": 1220, "x_max": 1600, "y_min": -1070, "y_max": -775},
  "Entrance": {"x_min": 465, "x_max": 610, "y_min": -650, "y_max": -405},
  "Supply1": {"x_min": 610, "x_max": 775, "y_min": -490, "y_max": -405},
  "Reception": {"x_min": 610, "x_max": 775, "y_min": -650, "y_max": -490},
  "Mark's Hallway": {"x_min": 465, "x_max": 555, "y_min": -770, "y_max": -650},
  "Sy's Hallway": {"x_min": 555, "x_max": 790, "y_min": -770, "y_max": -650},
  "Supply2": {"x_min": 775, "x_max": 1000, "y_min": -490, "y_max": -405},
  "Supply3": {"x_min": 775, "x_max": 1000, "y_min": -650, "y_max": -490},
  "Dietrik's Hallway": {"x_min": 790, "x_max": 1000, "y_min": -770, "y_max": -650},
  "Test": {"x_min": 995, "x_max": 1350, "y_min": -650, "y_max": -405},
  "Conf Hallway": {"x_min": 1000, "x_max": 1225, "y_min": -770, "y_max": -650},
  "Dev": {"x_min": 1350, "x_max": 1650, "y_min": -650, "y_max": -405},
  "Customer Service Hallway": {"x_min": 1225, "x_max": 1655, "y_min": -770, "y_max": -650},
  "99": {"x_min": 300, "x_max": 450, "y_min": -770, "y_max": -405}
};

export default function Home() {
  // Multi-MAC state management
  const [macDevices, setMacDevices] = useState([
    { id: 1, macAddress: '', error: '', session: null, recordingStatus: 'Idle', currentZone: 'None', recordingTime: '00:00' }
  ]);
  const [activeTab, setActiveTab] = useState(1);
  const [utcTime, setUtcTime] = useState('--:--:--');
  const [sessionInfo, setSessionInfo] = useState(null);
  
  const recordingTimersRef = useRef({});
  const utcTimerRef = useRef(null);
  const recordingStartTimesRef = useRef({});

  // Get current active device
  const getCurrentDevice = () => macDevices.find(device => device.id === activeTab);
  const updateCurrentDevice = (updates) => {
    setMacDevices(prev => prev.map(device => 
      device.id === activeTab ? { ...device, ...updates } : device
    ));
  };

  // Add new MAC device
  const addMacDevice = () => {
    const newId = Math.max(...macDevices.map(d => d.id)) + 1;
    const newDevice = {
      id: newId,
      macAddress: '',
      error: '',
      session: null,
      recordingStatus: 'Idle',
      currentZone: 'None',
      recordingTime: '00:00'
    };
    setMacDevices(prev => [...prev, newDevice]);
    setActiveTab(newId);
  };

  // Remove MAC device
  const removeMacDevice = (deviceId) => {
    if (macDevices.length <= 1) {
      alert('You must have at least one MAC address tab');
      return;
    }

    // Stop recording if device is recording
    const device = macDevices.find(d => d.id === deviceId);
    if (device && device.session) {
      stopRecordingTimer(deviceId);
    }

    setMacDevices(prev => prev.filter(device => device.id !== deviceId));
    
    // Switch to first tab if removing active tab
    if (activeTab === deviceId) {
      const remainingDevices = macDevices.filter(device => device.id !== deviceId);
      setActiveTab(remainingDevices[0]?.id || 1);
    }
  };

  // Validate MAC address
  const validateMacAddress = (mac) => {
    const macPattern = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
    return macPattern.test(mac);
  };

  // Handle MAC address input
  const handleMacChange = (value) => {
    const updates = { macAddress: value };
    
    if (value && !validateMacAddress(value)) {
      updates.error = 'Invalid MAC address format';
    } else {
      updates.error = '';
    }
    
    updateCurrentDevice(updates);
  };

  // Start UTC clock
  useEffect(() => {
    const updateUtcTime = async () => {
      try {
        const response = await fetch('/api/get-utc-time');
        const data = await response.json();
        const serverTime = new Date(data.utc_time);
        const timeString = serverTime.toLocaleTimeString('en-US', { 
          timeZone: 'UTC',
          hour12: false 
        });
        setUtcTime(timeString);
      } catch (error) {
        const now = new Date();
        const utcTime = now.toLocaleTimeString('en-US', { 
          timeZone: 'UTC',
          hour12: false 
        });
        setUtcTime(utcTime + ' (local)');
      }
    };

    updateUtcTime();
    utcTimerRef.current = setInterval(updateUtcTime, 1000);

    return () => {
      if (utcTimerRef.current) {
        clearInterval(utcTimerRef.current);
      }
      // Clean up all recording timers
      Object.values(recordingTimersRef.current).forEach(timer => {
        if (timer) clearInterval(timer);
      });
    };
  }, []);

  // Start recording timer for specific device
  const startRecordingTimer = (deviceId) => {
    recordingStartTimesRef.current[deviceId] = new Date();
    recordingTimersRef.current[deviceId] = setInterval(() => {
      const startTime = recordingStartTimesRef.current[deviceId];
      if (startTime) {
        const elapsed = Math.floor((new Date() - startTime) / 1000);
        const minutes = Math.floor(elapsed / 60).toString().padStart(2, '0');
        const seconds = (elapsed % 60).toString().padStart(2, '0');
        
        setMacDevices(prev => prev.map(device => 
          device.id === deviceId ? { ...device, recordingTime: `${minutes}:${seconds}` } : device
        ));
      }
    }, 1000);
  };

  // Stop recording timer for specific device
  const stopRecordingTimer = (deviceId) => {
    if (recordingTimersRef.current[deviceId]) {
      clearInterval(recordingTimersRef.current[deviceId]);
      recordingTimersRef.current[deviceId] = null;
    }
    delete recordingStartTimesRef.current[deviceId];
  };

  // Handle zone click
  const handleZoneClick = async (zoneId) => {
    const currentDevice = getCurrentDevice();
    
    if (!validateMacAddress(currentDevice.macAddress) || !currentDevice.macAddress) {
      alert('Please enter a valid MAC address first');
      return;
    }

    if (currentDevice.session) {
      alert('Recording already in progress for this device. Stop current recording first.');
      return;
    }

    try {
      const response = await fetch('/api/start-recording', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mac_address: currentDevice.macAddress,
          zone_id: zoneId
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Unknown error');
      }

      const data = await response.json();
      updateCurrentDevice({
        session: data,
        recordingStatus: 'Recording',
        currentZone: zoneId
      });
      startRecordingTimer(activeTab);
      updateSessionInfo(data);
    } catch (error) {
      alert('Failed to start recording: ' + error.message);
    }
  };

  // Stop recording
  const handleStopRecording = async () => {
    const currentDevice = getCurrentDevice();
    if (!currentDevice.session) return;

    try {
      const response = await fetch('/api/stop-recording', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: currentDevice.session.session_id
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Unknown error');
      }

      const data = await response.json();
      const updatedSession = { ...currentDevice.session, ...data.session_data };
      
      updateCurrentDevice({
        session: updatedSession,
        recordingStatus: 'Stopped'
      });
      stopRecordingTimer(activeTab);
      updateSessionInfo(updatedSession);
    } catch (error) {
      alert('Failed to stop recording: ' + error.message);
    }
  };

  // Download data
  const handleDownload = () => {
    const currentDevice = getCurrentDevice();
    if (!currentDevice.session) return;
    
    const url = `/api/download-data?session_id=${currentDevice.session.session_id}`;
    const link = document.createElement('a');
    link.href = url;
    link.download = '';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Reset after download
    resetSession();
  };

  // Update session info
  const updateSessionInfo = (sessionData) => {
    const formatDate = (isoString) => {
      const date = new Date(isoString);
      return date.toLocaleString('en-US', { 
        timeZone: 'UTC',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      }) + ' UTC';
    };

    const duration = sessionData.end_timestamp && sessionData.start_timestamp
      ? Math.round((new Date(sessionData.end_timestamp) - new Date(sessionData.start_timestamp)) / 1000)
      : 'Recording...';

    setSessionInfo({
      macAddress: sessionData.mac_address,
      zoneId: sessionData.zone_id,
      startTime: formatDate(sessionData.start_timestamp),
      endTime: sessionData.end_timestamp ? formatDate(sessionData.end_timestamp) : 'Recording in progress',
      duration: typeof duration === 'number' ? duration + ' seconds' : duration
    });
  };

  // Reset session
  const resetSession = () => {
    updateCurrentDevice({
      session: null,
      recordingStatus: 'Idle',
      currentZone: 'None',
      recordingTime: '00:00'
    });
    setSessionInfo(null);
    stopRecordingTimer(activeTab);
  };

  // Render zone rectangles
  const renderZones = () => {
    const currentDevice = getCurrentDevice();
    
    return Object.entries(zoneBounds).map(([zoneId, bounds]) => {
      const width = bounds.x_max - bounds.x_min;
      const height = bounds.y_max - bounds.y_min;
      const isRecording = currentDevice?.session && currentDevice.session.zone_id === zoneId && currentDevice.recordingStatus === 'Recording';
      
      return (
        <g key={zoneId}>
          <rect
            x={bounds.x_min}
            y={bounds.y_min}
            width={width}
            height={height}
            className={`zone ${isRecording ? 'recording' : ''}`}
            onClick={() => handleZoneClick(zoneId)}
          />
          <text
            x={bounds.x_min + width / 2}
            y={bounds.y_min + height / 2}
            className={`zone-label ${isRecording ? 'recording' : ''}`}
          >
            {zoneId}
          </text>
        </g>
      );
    });
  };

  const currentDevice = getCurrentDevice();

  return (
    <>
      <Head>
        <title>MAC Address Zone Tracker</title>
        <meta name="description" content="Track multiple MAC addresses across zones" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="container">
        <header>
          <h1>MAC Address Zone Tracker</h1>
        </header>
        
        {/* MAC Address Tabs */}
        <div className="tabs-container">
          <div className="tabs-header">
            {macDevices.map(device => (
              <div
                key={device.id}
                className={`tab ${activeTab === device.id ? 'active' : ''} ${device.recordingStatus === 'Recording' ? 'recording' : ''}`}
                onClick={() => setActiveTab(device.id)}
              >
                <span className="tab-title">
                  {device.macAddress || `MAC ${device.id}`}
                </span>
                <span className="tab-status">{device.recordingStatus}</span>
                {macDevices.length > 1 && (
                  <button
                    className="tab-close"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeMacDevice(device.id);
                    }}
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
            <button className="add-tab-btn" onClick={addMacDevice}>
              + Add MAC
            </button>
          </div>
        </div>

        <div className="controls">
          <div className="input-group">
            <label htmlFor="macAddress">MAC Address:</label>
            <input
              type="text"
              id="macAddress"
              value={currentDevice?.macAddress || ''}
              onChange={(e) => handleMacChange(e.target.value)}
              placeholder="e.g., 00:1B:44:11:3A:B7"
              className={currentDevice?.error ? 'invalid' : ''}
            />
            <span className="validation-message">{currentDevice?.error || ''}</span>
          </div>
          
          <div className="status-panel">
            <div className="status-item">
              <span className="label">Status:</span>
              <span className={`status ${currentDevice?.recordingStatus === 'Recording' ? 'status-recording' : 'status-idle'}`}>
                {currentDevice?.recordingStatus || 'Idle'}
              </span>
            </div>
            <div className="status-item">
              <span className="label">Current Zone:</span>
              <span>{currentDevice?.currentZone || 'None'}</span>
            </div>
            <div className="status-item">
              <span className="label">Recording Time:</span>
              <span>{currentDevice?.recordingTime || '00:00'}</span>
            </div>
            <div className="status-item">
              <span className="label">Server UTC Time:</span>
              <span>{utcTime}</span>
            </div>
          </div>
          
          <div className="button-group">
            <button
              className="btn btn-stop"
              onClick={handleStopRecording}
              disabled={!currentDevice?.session || currentDevice?.recordingStatus !== 'Recording'}
            >
              Stop Recording
            </button>
            <button
              className="btn btn-download"
              onClick={handleDownload}
              disabled={!currentDevice?.session || currentDevice?.recordingStatus !== 'Stopped'}
            >
              Download Data
            </button>
          </div>
        </div>
        
        <div className="map-container">
          <h2>Zone Map</h2>
          <p className="instruction">Click on a zone to start recording for <strong>{currentDevice?.macAddress || 'current MAC address'}</strong></p>
          <svg className="zone-map" viewBox="250 -1100 1450 750">
            {renderZones()}
          </svg>
        </div>
        
        {sessionInfo && (
          <div className="session-info">
            <h3>Session Information</h3>
            <div className="session-details">
              <strong>MAC Address:</strong> {sessionInfo.macAddress}<br/>
              <strong>Zone ID:</strong> {sessionInfo.zoneId}<br/>
              <strong>Start Time:</strong> {sessionInfo.startTime}<br/>
              <strong>End Time:</strong> {sessionInfo.endTime}<br/>
              <strong>Duration:</strong> {sessionInfo.duration}
            </div>
          </div>
        )}
      </div>
    </>
  );
}