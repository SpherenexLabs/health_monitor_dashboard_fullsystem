// import { useState, useEffect } from 'react';
// import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
// import { Activity, Heart, Thermometer, Droplet, PieChart } from 'lucide-react';

// // Import the CSS file
// import './App.css';

// // Initialize Firebase at the component level
// const HealthDashboard = () => {
//   // State for health data and history
//   const [healthData, setHealthData] = useState({
//     Diastolic: 0,
//     Heart_Rate: 0,
//     SpO2: 0,
//     Systolic: 0,
//     Temperature: 0
//   });
  
//   const [historyData, setHistoryData] = useState({
//     Diastolic: [],
//     Heart_Rate: [],
//     SpO2: [],
//     Systolic: [],
//     Temperature: []
//   });
  
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   useEffect(() => {
//     // Firebase configuration from user
//     const firebaseConfig = {
//       apiKey: "AIzaSyB9ererNsNonAzH0zQo_GS79XPOyCoMxr4",
//       authDomain: "waterdtection.firebaseapp.com",
//       databaseURL: "https://waterdtection-default-rtdb.firebaseio.com",
//       projectId: "waterdtection",
//       storageBucket: "waterdtection.firebasestorage.app",
//       messagingSenderId: "690886375729",
//       appId: "1:690886375729:web:172c3a47dda6585e4e1810",
//       measurementId: "G-TXF33Y6XY0"
//     };

//     // Import Firebase dynamically
//     const loadFirebase = async () => {
//       try {
//         // Dynamic imports
//         const firebaseApp = await import('firebase/app');
//         const firebaseDatabase = await import('firebase/database');

//         // Initialize Firebase
//         const app = firebaseApp.initializeApp(firebaseConfig);
//         const database = firebaseDatabase.getDatabase(app);
//         const healthRef = firebaseDatabase.ref(database, 'Health_Monitor');

//         // Listen for changes to the health data
//         firebaseDatabase.onValue(healthRef, (snapshot) => {
//           const data = snapshot.val();
//           if (data) {
//             setHealthData(data);
            
//             // Update history data with timestamp
//             const timestamp = new Date().toLocaleTimeString();
//             setHistoryData(prevHistory => {
//               const newHistory = { ...prevHistory };
              
//               // For each health metric, add new data point to its history array
//               Object.keys(data).forEach(key => {
//                 // Keep only the last 20 data points
//                 const updatedHistory = [...(prevHistory[key] || []), {
//                   time: timestamp,
//                   value: parseFloat(data[key])
//                 }].slice(-20);
                
//                 newHistory[key] = updatedHistory;
//               });
              
//               return newHistory;
//             });
            
//             setLoading(false);
//           }
//         }, (error) => {
//           setError(`Error fetching data: ${error.message}`);
//           setLoading(false);
//         });
        
//         return () => {
//           // Clean up listeners
//           firebaseDatabase.off(healthRef);
//         };
//       } catch (error) {
//         setError(`Failed to initialize Firebase: ${error.message}`);
//         setLoading(false);
//       }
//     };

//     loadFirebase();
//   }, []);

//   // No simulation - only update when Firebase values change
//   // We'll keep track of real changes from Firebase only

//   // Helper function to determine status color based on values
//   const getStatusColor = (metric, value) => {
//     const numValue = parseFloat(value);
    
//     switch(metric) {
//       case 'Heart_Rate':
//         return numValue < 60 ? 'text-blue-500' : 
//                numValue > 100 ? 'text-red-500' : 'text-green-500';
//       case 'SpO2':
//         return numValue < 90 ? 'text-red-500' : 
//                numValue < 95 ? 'text-yellow-500' : 'text-green-500';
//       case 'Systolic':
//         return numValue > 140 ? 'text-red-500' : 
//                numValue > 120 ? 'text-yellow-500' : 'text-green-500';
//       case 'Diastolic':
//         return numValue > 90 ? 'text-red-500' : 
//                numValue > 80 ? 'text-yellow-500' : 'text-green-500';
//       case 'Temperature':
//         return numValue > 37.5 ? 'text-red-500' : 
//                numValue < 36 ? 'text-blue-500' : 'text-green-500';
//       default:
//         return 'text-gray-500';
//     }
//   };
  
//   // Helper function to get icon for each metric
//   const getMetricIcon = (metric) => {
//     switch(metric) {
//       case 'Heart_Rate':
//         return <Heart className="w-8 h-8 text-red-500" />;
//       case 'SpO2':
//         return <Activity className="w-8 h-8 text-blue-500" />;
//       case 'Systolic':
//       case 'Diastolic':
//         return <Droplet className="w-8 h-8 text-purple-500" />;
//       case 'Temperature':
//         return <Thermometer className="w-8 h-8 text-amber-500" />;
//       default:
//         return <PieChart className="w-8 h-8 text-gray-500" />;
//     }
//   };
  
//   // Helper function to get display name for each metric
//   const getMetricDisplayName = (metric) => {
//     switch(metric) {
//       case 'Heart_Rate':
//         return 'Heart Rate';
//       case 'SpO2':
//         return 'Oxygen Saturation';
//       case 'Systolic':
//         return 'Systolic BP';
//       case 'Diastolic':
//         return 'Diastolic BP';
//       case 'Temperature':
//         return 'Temperature';
//       default:
//         return metric;
//     }
//   };
  
//   // Helper function to get units for each metric
//   const getMetricUnit = (metric) => {
//     switch(metric) {
//       case 'Heart_Rate':
//         return 'bpm';
//       case 'SpO2':
//         return '%';
//       case 'Systolic':
//       case 'Diastolic':
//         return 'mmHg';
//       case 'Temperature':
//         return '°C';
//       default:
//         return '';
//     }
//   };
  
//   // Helper function to get line color for each metric
//   const getLineColor = (metric) => {
//     switch(metric) {
//       case 'Heart_Rate':
//         return '#ef4444';
//       case 'SpO2':
//         return '#3b82f6';
//       case 'Systolic':
//         return '#8b5cf6';
//       case 'Diastolic':
//         return '#a855f7';
//       case 'Temperature':
//         return '#f59e0b';
//       default:
//         return '#6b7280';
//     }
//   };

//   if (loading) {
//     return (
//       <div className="loading-container">
//         <div className="loading-content">
//           <div className="spinner"></div>
//           <p className="loading-text">Loading health data...</p>
//         </div>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="error-container">
//         <div className="error-content">
//           <div className="error-icon-container">
//             <svg xmlns="http://www.w3.org/2000/svg" className="error-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
//             </svg>
//           </div>
//           <h2 className="error-title">Connection Error</h2>
//           <p className="error-message">{error}</p>
//           <button 
//             onClick={() => window.location.reload()} 
//             className="retry-button"
//           >
//             Try Again
//           </button>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="dashboard-container">
//       <div className="container">
//         <header className='dashboard-header'>
//           <h1>Health Monitoring Dashboard</h1>
//           <p>Real-time health metrics from Firebase</p>
//           <div className="last-updated">
//             <span className="live-indicator"></span>
//             Last updated: {new Date().toLocaleString()}
//           </div>
//         </header>
        
//         {/* Current Values Section */}
//         <div style={{marginBottom: '2.5rem'}}>
//           <h2 className="section-title">Current Health Metrics</h2>
//           <div className="metrics-grid">
//             {Object.keys(healthData).map(metric => (
//               <div key={metric} className="card glass-card">
//                 <div className="card-body">
//                   <div className="metric-header">
//                     <div className="metric-title">
//                       <div className="metric-icon">
//                         {getMetricIcon(metric)}
//                       </div>
//                       <h3>{getMetricDisplayName(metric)}</h3>
//                     </div>
//                     <span className={`status-badge ${
//                       getStatusColor(metric, healthData[metric]) === 'text-green-500' ? 'status-normal' :
//                       getStatusColor(metric, healthData[metric]) === 'text-yellow-500' ? 'status-elevated' :
//                       getStatusColor(metric, healthData[metric]) === 'text-red-500' ? 'status-high' :
//                       getStatusColor(metric, healthData[metric]) === 'text-blue-500' ? 'status-low' : ''
//                     }`}>
//                       {
//                         getStatusColor(metric, healthData[metric]) === 'text-green-500' ? 'Normal' :
//                         getStatusColor(metric, healthData[metric]) === 'text-yellow-500' ? 'Elevated' :
//                         getStatusColor(metric, healthData[metric]) === 'text-red-500' ? 'High' :
//                         getStatusColor(metric, healthData[metric]) === 'text-blue-500' ? 'Low' : 'N/A'
//                       }
//                     </span>
//                   </div>
                  
//                   <div className="metric-value-container">
//                     <span className={`metric-value ${
//                       getStatusColor(metric, healthData[metric]) === 'text-green-500' ? 'value-normal' :
//                       getStatusColor(metric, healthData[metric]) === 'text-yellow-500' ? 'value-elevated' :
//                       getStatusColor(metric, healthData[metric]) === 'text-red-500' ? 'value-high' :
//                       getStatusColor(metric, healthData[metric]) === 'text-blue-500' ? 'value-low' : ''
//                     }`}>
//                       {parseFloat(healthData[metric]).toFixed(metric === 'Temperature' ? 1 : 0)}
//                     </span>
//                     <span className="metric-unit">{getMetricUnit(metric)}</span>
//                   </div>
                  
//                   {/* Mini sparkline chart */}
//                   <div className="sparkline-container">
//                     {historyData[metric] && historyData[metric].length > 0 ? (
//                       <ResponsiveContainer width="100%" height="100%">
//                         <LineChart data={historyData[metric]}>
//                           <Line 
//                             type="monotone" 
//                             dataKey="value" 
//                             stroke={getLineColor(metric)} 
//                             strokeWidth={2}
//                             dot={false}
//                             isAnimationActive={true}
//                             className={`${metric.toLowerCase()}-line`}
//                           />
//                         </LineChart>
//                       </ResponsiveContainer>
//                     ) : (
//                       <div className="no-data">
//                         No data available
//                       </div>
//                     )}
//                   </div>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>
        
//         {/* Detailed Graphs Section */}
//         <div>
//           <h2 className="section-title">Detailed Trends</h2>
//           <div className="trends-grid">
//             {Object.keys(healthData).map(metric => (
//               <div key={`graph-${metric}`} className="chart-card">
//                 <h3 className="chart-title">
//                   {getMetricDisplayName(metric)} Trend
//                 </h3>
                
//                 <div className="chart-container">
//                   {historyData[metric] && historyData[metric].length > 0 ? (
//                     <ResponsiveContainer width="100%" height="100%">
//                       <LineChart 
//                         data={historyData[metric]}
//                         margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
//                       >
//                         <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
//                         <XAxis 
//                           dataKey="time" 
//                           tick={{ fontSize: 12 }} 
//                           tickFormatter={(tick) => tick.split(':').slice(-2).join(':')}
//                         />
//                         <YAxis domain={['auto', 'auto']} />
//                         <Tooltip 
//                           formatter={(value) => [`${value.toFixed(metric === 'Temperature' ? 1 : 0)} ${getMetricUnit(metric)}`, getMetricDisplayName(metric)]}
//                           labelFormatter={(label) => `Time: ${label}`}
//                         />
//                         <Line 
//                           type="monotone" 
//                           dataKey="value" 
//                           stroke={getLineColor(metric)} 
//                           strokeWidth={3}
//                           dot={{ fill: getLineColor(metric), r: 4 }}
//                           activeDot={{ r: 6, stroke: 'white', strokeWidth: 2 }}
//                           isAnimationActive={true}
//                           className={`${metric.toLowerCase()}-line`}
//                         />
//                       </LineChart>
//                     </ResponsiveContainer>
//                   ) : (
//                     <div className="no-data">
//                       No trend data available yet
//                     </div>
//                   )}
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>
        
//         {/* Footer */}
//         <footer>
//           <p>Health Monitoring Dashboard - Connected to Firebase Realtime Database</p>
//           <p>Data updates automatically as values change in the database</p>
//         </footer>
//       </div>
//     </div>
//   );
// };

// export default HealthDashboard;



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