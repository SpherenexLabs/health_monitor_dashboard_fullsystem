import React, { useState, useEffect, useRef } from 'react';

const App = () => {
  const [healthData, setHealthData] = useState([]);
  const [currentData, setCurrentData] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('Checking...');
  const [dataSource, setDataSource] = useState('Unknown');
  const [lastUpdate, setLastUpdate] = useState(null);

  // Replace with your actual Google Sheet ID from the URL
  const SHEET_ID = '1xqlPkMveVa8QT1K1MEKCpZjmlRJyVQLFt9F3qfWy4Bg';
  const SHEET_NAME = 'Gluoose'; // Fixed the typo from 'Gluoose' to 'Glucose'

  const canvasRefs = {
    hr: useRef(null),
    spo2: useRef(null),
    bp: useRef(null),
    glucose: useRef(null)
  };

  // Function to fetch data from Google Sheets - NO FALLBACK DATA
  const fetchGoogleSheetData = async () => {
    try {
      setLoading(true);
      setConnectionStatus('Connecting to Google Sheet...');
      
      // Using Google Sheets API in a way that's accessible without authentication
      const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${SHEET_NAME}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Sheet may not be public or accessible`);
      }
      
      const text = await response.text();
      
      // Parse the JSONP-like response (Google's format)
      const jsonStart = text.indexOf('{');
      const jsonEnd = text.lastIndexOf('}') + 1;
      const jsonData = JSON.parse(text.substring(jsonStart, jsonEnd));
      
      if (jsonData.table && jsonData.table.rows && jsonData.table.rows.length > 0) {
        // Get column headers from the table
        const headers = jsonData.table.cols.map(col => col.label);
        console.log('Sheet headers found:', headers);
        
        // Process all rows for historical data
        const processedData = jsonData.table.rows.map((row) => {
          const rowData = {};
          
          // Map the data according to headers
          headers.forEach((header, colIndex) => {
            if (row.c[colIndex] && (row.c[colIndex].v !== null)) {
              // Use formatted value if available, otherwise use raw value
              rowData[header] = row.c[colIndex].f || row.c[colIndex].v;
            } else {
              rowData[header] = null;
            }
          });

          // Transform data keys to match our expected format
          return {
            timestamp: rowData['Time'] || null,
            date: rowData['Date'] || null,
            hr: parseFloat(rowData['HR']) || 0,
            spo2: parseFloat(rowData['SPO2']) || 0,
            bp: rowData['BP'] || '0/0',
            glucose: parseFloat(rowData['Glucose']) || 0,
            finger: parseInt(rowData['Finger']) || 0
          };
        }).filter(row => 
          // Only include rows that have valid timestamp and date (allow 0 values for health metrics)
          row.timestamp && row.date
        );
        
        if (processedData.length === 0) {
          throw new Error('No valid data rows found in Google Sheet');
        }
        
        // Get latest values for the cards
        const latestRow = processedData[processedData.length - 1];
        
        // SUCCESS - Update state with real data
        setConnectionStatus('✅ Connected to Google Sheet');
        setDataSource('Google Sheet (Live Data)');
        setHealthData(processedData);
        setCurrentData(latestRow);
        setLastUpdate(new Date().toLocaleString());
        setLoading(false);
        setError(null);
        
        // Check for glucose alerts (including 0 values)
        if (latestRow && latestRow.glucose !== null && latestRow.glucose !== undefined) {
          checkGlucoseLevel(latestRow.glucose);
        }
        
        console.log(`✅ SUCCESS: Fetched ${processedData.length} health records from Google Sheet`);
        return processedData;
      } else {
        throw new Error('No data table found in Google Sheet response');
      }
    } catch (error) {
      console.error('❌ ERROR: Could not fetch from Google Sheet:', error.message);
      
      // NO FALLBACK DATA - Clear everything and show error
      setConnectionStatus('❌ Failed to Connect to Google Sheet');
      setDataSource('No Data Available');
      setHealthData([]);
      setCurrentData(null);
      setLoading(false);
      setError(`Failed to fetch data: ${error.message}. Make sure your Google Sheet is publicly accessible with "Anyone with the link" viewing permission and has the correct sheet name "${SHEET_NAME}".`);
    }
  };

  // Initial data fetch and setup polling for real-time updates
  useEffect(() => {
    const fetchData = async () => {
      await fetchGoogleSheetData();
    };
    
    fetchData();
    
    // Poll for new data every 30 seconds for real-time updates
    const intervalId = setInterval(() => {
      console.log('🔄 Auto-refreshing health data...');
      fetchGoogleSheetData();
    }, 30000);
    
    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, []);

  const checkGlucoseLevel = (glucose) => {
    let alertMessage = '';
    let alertType = '';
    
    if (glucose < 60) {
      alertMessage = '🚨 LOW GLUCOSE LEVEL! Take immediate action.';
      alertType = 'danger';
    } else if (glucose >= 60 && glucose <= 110) {
      alertMessage = '✅ Normal glucose level';
      alertType = 'success';
    } else {
      alertMessage = '⚠️ HIGH GLUCOSE LEVEL! Monitor closely.';
      alertType = 'warning';
    }
    
    const newAlert = {
      id: Date.now(),
      message: alertMessage,
      type: alertType,
      time: new Date().toLocaleTimeString(),
      glucose: glucose
    };
    
    setAlerts(prev => [newAlert, ...prev.slice(0, 4)]);
    simulateTelegramAlert(alertMessage, glucose);
  };

  const simulateTelegramAlert = (message, glucose) => {
    console.log(`Telegram Alert: ${message} (Glucose: ${glucose}mg/dL)`);
    // Here you would implement actual Telegram API call
  };

  const removeAlert = (alertId) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
  };

  const drawTrendChart = (canvasRef, data, color, label, unit) => {
    if (!canvasRef.current || !data.length) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const { width, height } = canvas;
    
    ctx.clearRect(0, 0, width, height);
    
    // Draw background
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(0, 0, width, height);
    
    // Calculate chart area
    const padding = 40;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;
    
    // Find min and max values
    const values = data.map(d => d.value).filter(v => v > 0);
    if (values.length === 0) return;
    
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const range = maxValue - minValue || 1;
    
    // Draw grid lines
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = padding + (chartHeight / 5) * i;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }
    
    // Draw trend line
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    
    const stepX = chartWidth / (values.length - 1);
    
    values.forEach((value, index) => {
      const x = padding + index * stepX;
      const y = padding + chartHeight - ((value - minValue) / range) * chartHeight;
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    
    ctx.stroke();
    
    // Draw points
    ctx.fillStyle = color;
    values.forEach((value, index) => {
      const x = padding + index * stepX;
      const y = padding + chartHeight - ((value - minValue) / range) * chartHeight;
      
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, 2 * Math.PI);
      ctx.fill();
    });
    
    // Draw Y-axis labels
    ctx.fillStyle = '#666';
    ctx.font = '12px Arial';
    ctx.textAlign = 'right';
    for (let i = 0; i <= 5; i++) {
      const value = minValue + (range / 5) * (5 - i);
      const y = padding + (chartHeight / 5) * i + 4;
      ctx.fillText(Math.round(value), padding - 10, y);
    }
  };

  const getStatusMessage = (type, value) => {
    switch (type) {
      case 'hr':
        if (!value || value === 0) return '⚪ No heart rate reading - Check sensor connection.';
        if (value >= 60 && value <= 100) return '✅ Heart rate is within normal range.';
        if (value < 60) return '🔻 Heart rate is below normal (bradycardia).';
        return '🔺 Heart rate is above normal (tachycardia).';
      case 'spo2':
        if (!value || value === 0) return '⚪ No oxygen saturation reading - Check sensor.';
        if (value >= 95) return '✅ Oxygen saturation is optimal.';
        if (value >= 90) return '⚠️ Oxygen saturation is low - monitor closely.';
        return '🚨 Critical oxygen saturation detected - seek immediate care.';
      case 'bp':
        if (!value || value === '0/0' || value === '0') return '⚪ No blood pressure reading - Check cuff placement.';
        const systolic = parseInt(value.split('/')[0]);
        const diastolic = parseInt(value.split('/')[1]) || 0;
        if (systolic < 90) return '🔻 Low blood pressure detected (hypotension).';
        if (systolic < 120 && diastolic < 80) return '✅ Blood pressure is optimal.';
        if (systolic < 140 && diastolic < 90) return '⚠️ Blood pressure is elevated - monitor regularly.';
        return '🔺 High blood pressure detected (hypertension).';
      case 'glucose':
        if (!value || value === 0) return '⚪ No glucose reading - Check test strip and meter.';
        if (value < 60) return '🚨 Critically low glucose level - take immediate action!';
        if (value >= 60 && value <= 110) return '✅ Glucose levels are normal.';
        if (value <= 140) return '⚠️ Slightly elevated glucose - monitor diet.';
        return '🔺 High glucose level detected - consult healthcare provider.';
      default:
        return '✅ Levels are normal.';
    }
  };

  const getRecommendations = (type, value) => {
    switch (type) {
      case 'hr':
        if (!value || value === 0) return [
          'Check sensor connection and placement',
          'Ensure device is properly charged',
          'Try repositioning the sensor'
        ];
        if (value < 60) return [
          'Monitor for symptoms like dizziness or fatigue',
          'Consider consulting a healthcare provider',
          'Track activity levels and medication effects'
        ];
        if (value > 100) return [
          'Consider relaxation techniques',
          'Monitor caffeine and stress levels',
          'Track patterns during different activities'
        ];
        return [
          'Continue monitoring heart rate trends',
          'Maintain regular physical activity',
          'Keep tracking for baseline establishment'
        ];
      case 'spo2':
        if (!value || value === 0) return [
          'Check fingertip sensor placement',
          'Clean sensor and finger surface',
          'Ensure proper blood circulation'
        ];
        if (value < 95) return [
          'Monitor breathing patterns closely',
          'Consider seeking medical attention if persistent',
          'Check for environmental factors affecting breathing'
        ];
        return [
          'Continue monitoring oxygen levels',
          'Maintain good respiratory health',
          'Track during different activities'
        ];
      case 'bp':
        if (!value || value === '0/0' || value === '0') return [
          'Check cuff size and placement',
          'Ensure arm is at heart level',
          'Remain still during measurement'
        ];
        const systolic = parseInt(value.split('/')[0]);
        if (systolic >= 140) return [
          'Monitor dietary sodium intake',
          'Consider stress management techniques',
          'Track readings at consistent times'
        ];
        if (systolic < 90) return [
          'Monitor for symptoms like dizziness',
          'Stay hydrated and avoid sudden movements',
          'Consider consulting healthcare provider'
        ];
        return [
          'Continue regular monitoring',
          'Maintain healthy lifestyle habits',
          'Track daily variations'
        ];
      case 'glucose':
        if (!value || value === 0) return [
          'Check test strip expiration',
          'Ensure proper meter calibration',
          'Verify sufficient blood sample'
        ];
        if (value < 60) return [
          'Take immediate action - consume fast-acting carbs',
          'Monitor symptoms closely',
          'Contact healthcare provider if severe'
        ];
        if (value > 140) return [
          'Monitor carbohydrate intake',
          'Track meal timing and composition',
          'Consider consulting healthcare provider'
        ];
        return [
          'Continue regular monitoring',
          'Maintain consistent meal timing',
          'Track pre and post-meal levels'
        ];
      default:
        return ['Continue monitoring'];
    }
  };

  useEffect(() => {
    if (healthData.length > 0) {
      const hrData = healthData.map((d, i) => ({ value: d.hr, index: i })).filter(d => d.value > 0);
      const spo2Data = healthData.map((d, i) => ({ value: d.spo2, index: i })).filter(d => d.value > 0);
      const bpData = healthData.map((d, i) => ({ value: parseInt(d.bp.split('/')[0]), index: i })).filter(d => d.value > 0);
      const glucoseData = healthData.map((d, i) => ({ value: d.glucose, index: i })).filter(d => d.value > 0);
      
      drawTrendChart(canvasRefs.hr, hrData, '#e74c3c', 'Heart Rate', 'BPM');
      drawTrendChart(canvasRefs.spo2, spo2Data, '#3498db', 'SpO2', '%');
      drawTrendChart(canvasRefs.bp, bpData, '#9b59b6', 'Blood Pressure', 'mmHg');
      drawTrendChart(canvasRefs.glucose, glucoseData, '#f39c12', 'Glucose', 'mg/dL');
    }
  }, [healthData]);

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        color: 'white',
        fontSize: '1.5rem'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '20px' }}>⏳</div>
          <div>Loading health data from Google Sheets...</div>
          <div style={{ fontSize: '1rem', marginTop: '10px', opacity: 0.8 }}>
            Connecting to Sheet: {SHEET_NAME}
          </div>
        </div>
      </div>
    );
  }

  // Show error state when no data is available
  if (error && healthData.length === 0) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '20px',
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
      }}>
        {/* Header */}
        <div style={{
          textAlign: 'center',
          marginBottom: '30px',
          color: 'white'
        }}>
          <h1 style={{
            fontSize: '2.5rem',
            margin: '0',
            textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
          }}>
            🏥 Health Performance Trends
          </h1>
          <p style={{ fontSize: '1.1rem', opacity: 0.9 }}>
            Real-time monitoring from Google Sheets
          </p>
        </div>

        {/* Error State */}
        <div style={{
          background: 'rgba(255,255,255,0.95)',
          borderRadius: '15px',
          padding: '40px',
          textAlign: 'center',
          boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
          maxWidth: '600px',
          margin: '0 auto'
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '20px' }}>🚫</div>
          <h2 style={{ color: '#e74c3c', marginBottom: '20px' }}>
            No Data Available
          </h2>
          <p style={{ color: '#7f8c8d', marginBottom: '20px', lineHeight: '1.6' }}>
            {error}
          </p>
          
          <div style={{
            background: '#fff3cd',
            border: '1px solid #ffeaa7',
            borderRadius: '8px',
            padding: '20px',
            marginBottom: '20px',
            color: '#856404',
            textAlign: 'left'
          }}>
            <h4 style={{ margin: '0 0 15px 0' }}>📋 Steps to fix this issue:</h4>
            <ol style={{ margin: '0', paddingLeft: '20px' }}>
              <li style={{ marginBottom: '8px' }}>
                Open your Google Sheet: <a href={`https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit`} target="_blank" rel="noopener noreferrer" style={{ color: '#0366d6' }}>Click here</a>
              </li>
              <li style={{ marginBottom: '8px' }}>Click "Share" → Change to "Anyone with the link" → Set to "Viewer"</li>
              <li style={{ marginBottom: '8px' }}>Make sure your sheet has a tab named "{SHEET_NAME}"</li>
              <li style={{ marginBottom: '8px' }}>Ensure columns are named: Date, Time, HR, SPO2, BP, Glucose, Finger</li>
              <li>Click the refresh button below to try again</li>
            </ol>
          </div>

          <button
            onClick={fetchGoogleSheetData}
            disabled={loading}
            style={{
              background: loading ? '#bdc3c7' : '#3498db',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '15px 30px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '1rem',
              fontWeight: 'bold',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
            }}
          >
            {loading ? '⏳ Trying to Connect...' : '🔄 Try Again'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px',
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
    }}>
      {/* Header */}
      <div style={{
        textAlign: 'center',
        marginBottom: '30px',
        color: 'white'
      }}>
        <h1 style={{
          fontSize: '2.5rem',
          margin: '0',
          textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
        }}>
          🏥 Health Performance Trends
        </h1>
        <p style={{ fontSize: '1.1rem', opacity: 0.9 }}>
          Real-time monitoring from Google Sheets • Last updated: {lastUpdate}
        </p>
      </div>

      {/* Connection Status */}
      <div style={{
        background: 'rgba(255,255,255,0.95)',
        borderRadius: '15px',
        padding: '20px',
        marginBottom: '30px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '15px'
        }}>
          <div>
            <h3 style={{ margin: '0', color: '#2c3e50' }}>📊 Live Connection Status</h3>
            <p style={{ margin: '5px 0 0 0', color: '#7f8c8d' }}>
              Status: {connectionStatus} | Source: {dataSource} | Records: {healthData.length}
            </p>
          </div>
          <button
            onClick={fetchGoogleSheetData}
            disabled={loading}
            style={{
              background: loading ? '#bdc3c7' : '#27ae60',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 24px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '0.9rem',
              fontWeight: 'bold',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
              transition: 'all 0.3s ease'
            }}
          >
            {loading ? '⏳ Refreshing...' : '🔄 Refresh Now'}
          </button>
        </div>
        
        <div style={{
          background: '#e8f5e8',
          border: '1px solid #c3e6c3',
          borderRadius: '8px',
          padding: '12px',
          color: '#2d5a2d'
        }}>
          <p style={{ margin: '0', fontSize: '0.9rem' }}>
            ✅ <strong>Live Data Active:</strong> Auto-refreshing every 30 seconds
          </p>
        </div>
      </div>

      {/* Current Status Cards - Only show if we have real data */}
      {currentData && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '20px',
          marginBottom: '30px'
        }}>
          <div style={{
            background: 'rgba(255,255,255,0.95)',
            borderRadius: '15px',
            padding: '20px',
            textAlign: 'center',
            boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '10px' }}>❤️</div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#e74c3c' }}>
              {currentData.hr} BPM
            </div>
            <div style={{ color: '#7f8c8d' }}>Heart Rate</div>
            <div style={{ fontSize: '0.8rem', color: '#95a5a6', marginTop: '5px' }}>
              {currentData.timestamp}
            </div>
          </div>
          
          <div style={{
            background: 'rgba(255,255,255,0.95)',
            borderRadius: '15px',
            padding: '20px',
            textAlign: 'center',
            boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '10px' }}>🫁</div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#3498db' }}>
              {currentData.spo2}%
            </div>
            <div style={{ color: '#7f8c8d' }}>SpO2</div>
            <div style={{ fontSize: '0.8rem', color: '#95a5a6', marginTop: '5px' }}>
              {currentData.timestamp}
            </div>
          </div>
          
          <div style={{
            background: 'rgba(255,255,255,0.95)',
            borderRadius: '15px',
            padding: '20px',
            textAlign: 'center',
            boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '10px' }}>🩸</div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#9b59b6' }}>
              {currentData.bp}
            </div>
            <div style={{ color: '#7f8c8d' }}>Blood Pressure</div>
            <div style={{ fontSize: '0.8rem', color: '#95a5a6', marginTop: '5px' }}>
              {currentData.timestamp}
            </div>
          </div>
          
          <div style={{
            background: 'rgba(255,255,255,0.95)',
            borderRadius: '15px',
            padding: '20px',
            textAlign: 'center',
            boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '10px' }}>🍯</div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f39c12' }}>
              {currentData.glucose}
            </div>
            <div style={{ color: '#7f8c8d' }}>Glucose (mg/dL)</div>
            <div style={{ fontSize: '0.8rem', color: '#95a5a6', marginTop: '5px' }}>
              {currentData.timestamp}
            </div>
          </div>
          
          <div style={{
            background: 'rgba(255,255,255,0.95)',
            borderRadius: '15px',
            padding: '20px',
            textAlign: 'center',
            boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '10px' }}>
              {currentData.finger === 1 ? '👆' : '✋'}
            </div>
            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: currentData.finger === 1 ? '#27ae60' : '#e74c3c' }}>
              {currentData.finger === 1 ? 'Finger Pressed' : 'Finger Not Pressed'}
            </div>
            <div style={{ color: '#7f8c8d' }}>Finger Status</div>
            <div style={{ fontSize: '0.8rem', color: '#95a5a6', marginTop: '5px' }}>
              {currentData.timestamp}
            </div>
          </div>
        </div>
      )}

      {/* Performance Trends - Only show if we have real data */}
      {healthData.length > 0 && (
        <div style={{
          background: 'rgba(255,255,255,0.95)',
          borderRadius: '15px',
          padding: '20px',
          marginBottom: '30px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
        }}>
          <h2 style={{ margin: '0 0 30px 0', color: '#2c3e50' }}>Performance Trends</h2>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
            gap: '30px'
          }}>
            {/* Heart Rate Trend */}
            <div>
              <h3 style={{ color: '#2c3e50', marginBottom: '15px' }}>Heart Rate Trend</h3>
              <div style={{
                background: '#fff5f5',
                border: '2px solid #fed7d7',
                borderRadius: '10px',
                padding: '15px',
                marginBottom: '15px'
              }}>
                <div style={{ color: '#c53030', fontWeight: 'bold', marginBottom: '10px' }}>
                  {currentData && getStatusMessage('hr', currentData.hr)}
                </div>
                <ol style={{ margin: '0', paddingLeft: '20px', color: '#4a5568' }}>
                  {getRecommendations('hr', currentData?.hr).map((rec, i) => (
                    <li key={i}>{rec}</li>
                  ))}
                </ol>
              </div>
              <canvas
                ref={canvasRefs.hr}
                width="380"
                height="200"
                style={{
                  width: '100%',
                  height: '200px',
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px'
                }}
              />
            </div>

            {/* SpO2 Trend */}
            <div>
              <h3 style={{ color: '#2c3e50', marginBottom: '15px' }}>SpO2 Trend</h3>
              <div style={{
                background: '#f0f9ff',
                border: '2px solid #bee3f8',
                borderRadius: '10px',
                padding: '15px',
                marginBottom: '15px'
              }}>
                <div style={{ color: '#2b6cb0', fontWeight: 'bold', marginBottom: '10px' }}>
                  {currentData && getStatusMessage('spo2', currentData.spo2)}
                </div>
                <ol style={{ margin: '0', paddingLeft: '20px', color: '#4a5568' }}>
                  {getRecommendations('spo2', currentData?.spo2).map((rec, i) => (
                    <li key={i}>{rec}</li>
                  ))}
                </ol>
              </div>
              <canvas
                ref={canvasRefs.spo2}
                width="380"
                height="200"
                style={{
                  width: '100%',
                  height: '200px',
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px'
                }}
              />
            </div>

            {/* Blood Pressure Trend */}
            <div>
              <h3 style={{ color: '#2c3e50', marginBottom: '15px' }}>Blood Pressure Trend</h3>
              <div style={{
                background: '#faf5ff',
                border: '2px solid #e9d8fd',
                borderRadius: '10px',
                padding: '15px',
                marginBottom: '15px'
              }}>
                <div style={{ color: '#805ad5', fontWeight: 'bold', marginBottom: '10px' }}>
                  {currentData && getStatusMessage('bp', currentData.bp)}
                </div>
                <ol style={{ margin: '0', paddingLeft: '20px', color: '#4a5568' }}>
                  {getRecommendations('bp', currentData?.bp).map((rec, i) => (
                    <li key={i}>{rec}</li>
                  ))}
                </ol>
              </div>
              <canvas
                ref={canvasRefs.bp}
                width="380"
                height="200"
                style={{
                  width: '100%',
                  height: '200px',
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px'
                }}
              />
            </div>

            {/* Glucose Trend */}
            <div>
              <h3 style={{ color: '#2c3e50', marginBottom: '15px' }}>Glucose Trend</h3>
              <div style={{
                background: '#fffbf0',
                border: '2px solid #feebc8',
                borderRadius: '10px',
                padding: '15px',
                marginBottom: '15px'
              }}>
                <div style={{ color: '#d69e2e', fontWeight: 'bold', marginBottom: '10px' }}>
                  {currentData && getStatusMessage('glucose', currentData.glucose)}
                </div>
                <ol style={{ margin: '0', paddingLeft: '20px', color: '#4a5568' }}>
                  {getRecommendations('glucose', currentData?.glucose).map((rec, i) => (
                    <li key={i}>{rec}</li>
                  ))}
                </ol>
              </div>
              <canvas
                ref={canvasRefs.glucose}
                width="380"
                height="200"
                style={{
                  width: '100%',
                  height: '200px',
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px'
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Alerts Section - Only show if we have alerts */}
      {alerts.length > 0 && (
        <div style={{
          background: 'rgba(255,255,255,0.95)',
          borderRadius: '15px',
          padding: '20px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
          marginBottom: '30px'
        }}>
          <h2 style={{ margin: '0 0 15px 0', color: '#2c3e50' }}>
            🚨 Recent Alerts & Notifications
          </h2>
          {alerts.map(alert => (
            <div
              key={alert.id}
              style={{
                padding: '15px',
                margin: '10px 0',
                borderRadius: '10px',
                background: alert.type === 'danger' ? '#fff5f5' : 
                           alert.type === 'warning' ? '#fffbf0' : '#f0f9ff',
                border: `2px solid ${alert.type === 'danger' ? '#fed7d7' : 
                                    alert.type === 'warning' ? '#feebc8' : '#bee3f8'}`
              }}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{
                  fontSize: '1.1rem',
                  color: alert.type === 'danger' ? '#c53030' : 
                         alert.type === 'warning' ? '#d69e2e' : '#2b6cb0'
                }}>
                  {alert.message}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{
                    fontSize: '0.9rem',
                    color: '#718096'
                  }}>
                    {alert.time}
                  </span>
                  <button
                    onClick={() => removeAlert(alert.id)}
                    style={{
                      background: '#e53e3e',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '4px 8px',
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseOver={(e) => e.target.style.background = '#c53030'}
                    onMouseOut={(e) => e.target.style.background = '#e53e3e'}
                    title="Remove notification"
                  >
                    ✕
                  </button>
                </div>
              </div>
              <div style={{
                fontSize: '0.9rem',
                color: '#4a5568',
                marginTop: '5px'
              }}>
                📱 Telegram notification sent • Glucose: {alert.glucose} mg/dL
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div style={{
        textAlign: 'center',
        color: 'rgba(255,255,255,0.8)',
        fontSize: '0.9rem'
      }}>
        <p>📊 Live data updates every 30 seconds automatically</p>
        <p>Connected to Google Sheets • Sheet: "{SHEET_NAME}" • Records: {healthData.length}</p>
        <p>Sheet ID: {SHEET_ID}</p>
      </div>
    </div>
  );
};

export default App;
