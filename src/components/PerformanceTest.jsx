import React, { useState, useEffect } from 'react';
import { startMeasurement, endMeasurement, getPerformanceMetrics } from '../utils/performance';

/**
 * PerformanceTest - A developer utility component to measure and display performance metrics
 * Only intended for development/testing use, not for production.
 */
const PerformanceTest = ({ visible = true }) => {
  const [metrics, setMetrics] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [customMeasurements, setCustomMeasurements] = useState({});
  
  // Collect performance metrics on mount
  useEffect(() => {
    // Start by measuring component render time
    startMeasurement('PerformanceTest-render');
    
    const loadHandler = () => {
      const currentMetrics = getPerformanceMetrics();
      if (currentMetrics) {
        setMetrics(currentMetrics);
      }
      
      // End and record component render measurement
      const renderTime = endMeasurement('PerformanceTest-render');
      setCustomMeasurements(prev => ({ 
        ...prev, 
        'Component Render': `${renderTime.toFixed(2)}ms` 
      }));
    };
    
    // If document already loaded, get metrics immediately
    if (document.readyState === 'complete') {
      loadHandler();
    } else {
      window.addEventListener('load', loadHandler);
      return () => window.removeEventListener('load', loadHandler);
    }
  }, []);
  
  // Run some custom measurements for common operations
  useEffect(() => {
    // Measure DOM operations
    startMeasurement('DOM-operations');
    const testDiv = document.createElement('div');
    for (let i = 0; i < 1000; i++) {
      testDiv.innerHTML = `<p>Test content ${i}</p>`;
      testDiv.setAttribute('data-test', `value-${i}`);
      testDiv.classList.add(`test-class-${i}`);
      testDiv.classList.remove(`test-class-${i}`);
    }
    const domTime = endMeasurement('DOM-operations');
    
    // Measure array operations
    startMeasurement('array-operations');
    const array = [];
    for (let i = 0; i < 10000; i++) {
      array.push(i);
    }
    const filtered = array.filter(num => num % 2 === 0);
    const mapped = filtered.map(num => num * 2);
    const reduced = mapped.reduce((acc, num) => acc + num, 0);
    const arrayTime = endMeasurement('array-operations');
    
    // Update custom measurements
    setCustomMeasurements(prev => ({ 
      ...prev, 
      'DOM Operations (1000 iterations)': `${domTime.toFixed(2)}ms`,
      'Array Operations (10000 items)': `${arrayTime.toFixed(2)}ms`
    }));
  }, []);
  
  // If the component is not visible, don't render anything
  if (!visible) return null;
  
  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md bg-black bg-opacity-80 text-white p-4 rounded-lg shadow-lg text-sm">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-semibold">Performance Metrics</h3>
        <div className="flex space-x-2">
          <button 
            onClick={() => setShowDetails(!showDetails)}
            className="bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded text-xs"
          >
            {showDetails ? 'Hide Details' : 'Show Details'}
          </button>
          <button 
            onClick={() => window.location.reload()}
            className="bg-green-600 hover:bg-green-700 px-2 py-1 rounded text-xs"
          >
            Refresh
          </button>
        </div>
      </div>
      
      {metrics ? (
        <div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 mb-2">
            <div className="text-gray-300">Load Time:</div>
            <div>{metrics.totalPageLoadTime.toFixed(2)}ms</div>
            
            <div className="text-gray-300">First Paint:</div>
            <div>{metrics.firstPaintTime.toFixed(2)}ms</div>
            
            <div className="text-gray-300">First Contentful Paint:</div>
            <div>{metrics.firstContentfulPaintTime.toFixed(2)}ms</div>
          </div>
          
          {showDetails && (
            <>
              <h4 className="font-semibold mt-3 mb-1 border-t border-gray-600 pt-2">Navigation Timing</h4>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                <div className="text-gray-300">DNS Lookup:</div>
                <div>{metrics.dnsTime.toFixed(2)}ms</div>
                
                <div className="text-gray-300">TCP Connection:</div>
                <div>{metrics.tcpTime.toFixed(2)}ms</div>
                
                <div className="text-gray-300">Request Time:</div>
                <div>{metrics.requestTime.toFixed(2)}ms</div>
                
                <div className="text-gray-300">Response Time:</div>
                <div>{metrics.responseTime.toFixed(2)}ms</div>
                
                <div className="text-gray-300">DOM Processing:</div>
                <div>{metrics.domProcessingTime.toFixed(2)}ms</div>
              </div>
              
              <h4 className="font-semibold mt-3 mb-1 border-t border-gray-600 pt-2">Custom Measurements</h4>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                {Object.entries(customMeasurements).map(([key, value]) => (
                  <React.Fragment key={key}>
                    <div className="text-gray-300">{key}:</div>
                    <div>{value}</div>
                  </React.Fragment>
                ))}
              </div>
              
              <h4 className="font-semibold mt-3 mb-1 border-t border-gray-600 pt-2">User Agent</h4>
              <div className="text-xs text-gray-400 break-words">
                {navigator.userAgent}
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-center h-16">
          <div className="animate-spin h-4 w-4 border-2 border-blue-500 rounded-full border-t-transparent mr-2"></div>
          Collecting metrics...
        </div>
      )}
      
      <div className="text-xs text-gray-400 mt-2 text-center">
        Development tool only - remove in production
      </div>
    </div>
  );
};

export default PerformanceTest; 