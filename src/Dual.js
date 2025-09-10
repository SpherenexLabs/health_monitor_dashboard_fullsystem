import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { Zap, Activity, Wifi, WifiOff } from 'lucide-react';
import './Dual.css';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB9ererNsNonAzH0zQo_GS79XPOyCoMxr4",
  authDomain: "waterdtection.firebaseapp.com",
  databaseURL: "https://waterdtection-default-rtdb.firebaseio.com",
  projectId: "waterdtection",
  storageBucket: "waterdtection.firebasestorage.app",
  messagingSenderId: "690886375729",
  appId: "1:690886375729:web:172c3a47dda6585e4e1810",
  measurementId: "G-TXF33Y6XY0"
};

const Dashboard = () => {
  const [currentValue, setCurrentValue] = useState(0);
  const [voltageValue, setVoltageValue] = useState(0);
  const [currentHistory, setCurrentHistory] = useState([]);
  const [voltageHistory, setVoltageHistory] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);

  useEffect(() => {
    // Initialize Firebase
    const initFirebase = async () => {
      try {
        // Import Firebase modules dynamically
        const { initializeApp } = await import('https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js');
        const { getDatabase, ref, onValue, off } = await import('https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js');
        
        const app = initializeApp(firebaseConfig);
        const database = getDatabase(app);
        
        // Reference to the Dual_Axis data
        const dataRef = ref(database, 'Dual_Axis');
        
        // Set up real-time listener
        const unsubscribe = onValue(dataRef, (snapshot) => {
          const data = snapshot.val();
          if (data) {
            const current = parseFloat(data.Current) || 0;
            const voltage = parseFloat(data.Voltage) || 0;
            const timestamp = new Date().toLocaleTimeString();
            
            setCurrentValue(current);
            setVoltageValue(voltage);
            setLastUpdate(new Date());
            setIsConnected(true);
            
            // Update history (keep last 20 points)
            setCurrentHistory(prev => {
              const newHistory = [...prev, { time: timestamp, value: current }];
              return newHistory.slice(-20);
            });
            
            setVoltageHistory(prev => {
              const newHistory = [...prev, { time: timestamp, value: voltage }];
              return newHistory.slice(-20);
            });
          }
        }, (error) => {
          console.error('Firebase connection error:', error);
          setIsConnected(false);
        });
        
        // Cleanup function
        return () => off(dataRef, unsubscribe);
      } catch (error) {
        console.error('Failed to initialize Firebase:', error);
        setIsConnected(false);
      }
    };

    initFirebase();
  }, []);

  const formatTime = (timeStr) => {
    return timeStr.split(':').slice(1).join(':');
  };

  const getStatusClass = (value, type) => {
    if (type === 'current') {
      if (value > 10) return 'danger';
      if (value > 5) return 'warning';
      return 'safe';
    } else {
      if (value > 5) return 'danger';
      if (value > 3) return 'warning';
      return 'safe';
    }
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-wrapper">
        {/* Header */}
        <div className="dashboard-header">
          <h1 className="dashboard-title">
            🌊 Dual Axis Monitoring Dashboard
          </h1>
          <div className="connection-status">
            <div className="status-indicator">
              {isConnected ? (
                <>
                  <Wifi style={{ width: '16px', height: '16px', color: '#10b981' }} />
                  <span>Connected to Firebase</span>
                </>
              ) : (
                <>
                  <WifiOff style={{ width: '16px', height: '16px', color: '#ef4444' }} />
                  <span>Disconnected</span>
                </>
              )}
            </div>
            {lastUpdate && (
              <span>
                Last update: {lastUpdate.toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>

        {/* Main Data Cards */}
        <div className="cards-grid">
          {/* Current Value Card */}
          <div className="data-card">
            <div className="card-header">
              <div className="card-info">
                <div className="icon-container current">
                  <Zap />
                </div>
                <div className="card-meta">
                  <h2>Current</h2>
                  <p>Real-time current measurement</p>
                </div>
              </div>
              <div className={`connection-indicator ${isConnected ? 'connected' : 'disconnected'}`}></div>
            </div>
            
            <div className="value-display">
              <div className={`value-number ${getStatusClass(currentValue, 'current')}`}>
                {currentValue.toFixed(5)}
              </div>
              <div className="value-unit">Amperes</div>
            </div>

            {/* Current Wave Graph */}
            <div className="chart-wrapper">
              <h3 className="chart-title">Current Trend</h3>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={currentHistory}>
                    <XAxis 
                      dataKey="time" 
                      tick={{ fontSize: 10, fill: '#9CA3AF' }}
                      tickFormatter={formatTime}
                    />
                    <YAxis 
                      tick={{ fontSize: 10, fill: '#9CA3AF' }}
                      domain={['dataMin - 0.1', 'dataMax + 0.1']}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(0,0,0,0.8)', 
                        border: 'none', 
                        borderRadius: '8px',
                        color: 'white'
                      }}
                      formatter={(value) => [`${value.toFixed(5)} A`, 'Current']}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#3B82F6" 
                      strokeWidth={2}
                      dot={false}
                      strokeDasharray="0"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Voltage Value Card */}
          <div className="data-card">
            <div className="card-header">
              <div className="card-info">
                <div className="icon-container voltage">
                  <Activity />
                </div>
                <div className="card-meta">
                  <h2>Voltage</h2>
                  <p>Real-time voltage measurement</p>
                </div>
              </div>
              <div className={`connection-indicator ${isConnected ? 'connected' : 'disconnected'}`}></div>
            </div>
            
            <div className="value-display">
              <div className={`value-number ${getStatusClass(voltageValue, 'voltage')}`}>
                {voltageValue.toFixed(5)}
              </div>
              <div className="value-unit">Volts</div>
            </div>

            {/* Voltage Wave Graph */}
            <div className="chart-wrapper">
              <h3 className="chart-title">Voltage Trend</h3>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={voltageHistory}>
                    <XAxis 
                      dataKey="time" 
                      tick={{ fontSize: 10, fill: '#9CA3AF' }}
                      tickFormatter={formatTime}
                    />
                    <YAxis 
                      tick={{ fontSize: 10, fill: '#9CA3AF' }}
                      domain={['dataMin - 0.1', 'dataMax + 0.1']}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(0,0,0,0.8)', 
                        border: 'none', 
                        borderRadius: '8px',
                        color: 'white'
                      }}
                      formatter={(value) => [`${value.toFixed(5)} V`, 'Voltage']}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#F59E0B" 
                      strokeWidth={2}
                      dot={false}
                      strokeDasharray="0"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Combined Overview Chart */}
        <div className="combined-chart-card">
          <h2 className="combined-title">
            📊 Combined Data Overview
          </h2>
          <div className="combined-chart-wrapper">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart>
                <XAxis 
                  dataKey="time" 
                  tick={{ fontSize: 12, fill: '#9CA3AF' }}
                  type="category"
                  allowDuplicatedCategory={false}
                />
                <YAxis 
                  yAxisId="current"
                  orientation="left"
                  tick={{ fontSize: 12, fill: '#3B82F6' }}
                  label={{ value: 'Current (A)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#3B82F6' } }}
                />
                <YAxis 
                  yAxisId="voltage"
                  orientation="right"
                  tick={{ fontSize: 12, fill: '#F59E0B' }}
                  label={{ value: 'Voltage (V)', angle: 90, position: 'insideRight', style: { textAnchor: 'middle', fill: '#F59E0B' } }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(0,0,0,0.9)', 
                    border: 'none', 
                    borderRadius: '8px',
                    color: 'white'
                  }}
                />
                <Line 
                  yAxisId="current"
                  type="monotone" 
                  dataKey="value" 
                  data={currentHistory}
                  stroke="#3B82F6" 
                  strokeWidth={3}
                  dot={false}
                  name="Current (A)"
                />
                <Line 
                  yAxisId="voltage"
                  type="monotone" 
                  dataKey="value" 
                  data={voltageHistory}
                  stroke="#F59E0B" 
                  strokeWidth={3}
                  dot={false}
                  name="Voltage (V)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          
          {/* Legend */}
          <div className="chart-legend">
            <div className="legend-item">
              <div className="legend-color current"></div>
              <span className="legend-text">Current (A)</span>
            </div>
            <div className="legend-item">
              <div className="legend-color voltage"></div>
              <span className="legend-text">Voltage (V)</span>
            </div>
          </div>
        </div>

        {/* Status Footer */}
        <div className="dashboard-footer">
          <div className="footer-text">
            <p>🔄 Data updates automatically from Firebase Realtime Database</p>
            <p>📡 Connection status: {isConnected ? '✅ Connected' : '❌ Disconnected'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;