import React, { useEffect, useState } from 'react';
import { getPerformanceMetrics, getOptimizationLevel } from '../utils/performance';

/**
 * PerformanceMonitor component that monitors app performance and applies optimizations
 * when needed. This is a non-visual component that should be placed near the root of the app.
 */
const PerformanceMonitor = ({ children }) => {
  const [optimizationLevel, setOptimizationLevel] = useState(() => getOptimizationLevel());
  
  // Apply performance monitoring
  useEffect(() => {
    // First paint already happened, so check performance after load
    const checkPerformanceAfterLoad = () => {
      const metrics = getPerformanceMetrics();
      
      if (!metrics) return;
      
      // If first contentful paint is slow (> 2s), reduce visual effects
      if (metrics.firstContentfulPaintTime > 2000) {
        setOptimizationLevel(prevLevel => ({
          ...prevLevel,
          useAnimations: false,
          useShadowEffects: false
        }));
      }
      
      // If total page load time is very slow (> 5s), apply more aggressive optimizations
      if (metrics.totalPageLoadTime > 5000) {
        setOptimizationLevel(prevLevel => ({
          ...prevLevel,
          useHighQualityImages: false,
          useAnimations: false,
          useShadowEffects: false
        }));
      }
    };
    
    // Apply monitoring
    window.addEventListener('load', checkPerformanceAfterLoad);
    
    // Check if frame rate is dropping (indicates performance issues)
    let frameRateCheckId;
    let lastTime = performance.now();
    let frameCount = 0;
    let slowFrames = 0;
    
    const checkFrameRate = () => {
      const now = performance.now();
      const elapsed = now - lastTime;
      frameCount++;
      
      // Check every second
      if (elapsed > 1000) {
        const fps = Math.round((frameCount * 1000) / elapsed);
        
        // If FPS drops below 30, consider reducing visual effects
        if (fps < 30) {
          slowFrames++;
          
          // If we've had multiple slow periods, reduce animations
          if (slowFrames >= 3) {
            setOptimizationLevel(prevLevel => ({
              ...prevLevel,
              useAnimations: false
            }));
          }
        }
        
        // Reset counters
        frameCount = 0;
        lastTime = now;
      }
      
      frameRateCheckId = requestAnimationFrame(checkFrameRate);
    };
    
    // Start monitoring frame rate
    frameRateCheckId = requestAnimationFrame(checkFrameRate);
    
    // Monitor memory usage if available (Chrome only)
    const memoryCheckInterval = setInterval(() => {
      // Check if performance.memory is available (Chrome only)
      if (window.performance && 'memory' in window.performance) {
        const memoryInfo = window.performance.memory;
        
        // Make sure we have all the required properties
        if (memoryInfo && memoryInfo.usedJSHeapSize && memoryInfo.jsHeapSizeLimit) {
          // If heap usage is over 80% of limit, apply memory optimizations
          if (memoryInfo.usedJSHeapSize / memoryInfo.jsHeapSizeLimit > 0.8) {
            setOptimizationLevel(prevLevel => ({
              ...prevLevel,
              useHighQualityImages: false
            }));
          }
        }
      }
    }, 30000); // Check every 30 seconds
    
    return () => {
      window.removeEventListener('load', checkPerformanceAfterLoad);
      cancelAnimationFrame(frameRateCheckId);
      clearInterval(memoryCheckInterval);
    };
  }, []);
  
  // Store optimization level in localStorage for persistence
  useEffect(() => {
    try {
      localStorage.setItem('app_optimization_level', JSON.stringify(optimizationLevel));
    } catch (e) {
      // Ignore localStorage errors
    }
  }, [optimizationLevel]);
  
  // Provide optimization context to the app
  return (
    <OptimizationContext.Provider value={optimizationLevel}>
      {children}
    </OptimizationContext.Provider>
  );
};

// Create context for optimization settings
export const OptimizationContext = React.createContext(getOptimizationLevel());

// Custom hook to use optimization settings
export const useOptimization = () => React.useContext(OptimizationContext);

export default PerformanceMonitor; 