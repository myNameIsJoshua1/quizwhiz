/**
 * Performance optimization utilities for the application
 */

/**
 * Debounce function to limit how often a function can be called
 * @param {Function} func - The function to debounce
 * @param {number} wait - The debounce wait time in milliseconds
 * @param {boolean} immediate - Whether to call the function immediately
 * @returns {Function} - Debounced function
 */
export const debounce = (func, wait = 300, immediate = false) => {
  let timeout;
  return function(...args) {
    const context = this;
    const later = function() {
      timeout = null;
      if (!immediate) func.apply(context, args);
    };
    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func.apply(context, args);
  };
};

/**
 * Throttle function to limit how often a function can be called
 * @param {Function} func - The function to throttle
 * @param {number} wait - The throttle wait time in milliseconds
 * @returns {Function} - Throttled function
 */
export const throttle = (func, wait = 300) => {
  let waiting = false;
  return function(...args) {
    if (!waiting) {
      func.apply(this, args);
      waiting = true;
      setTimeout(() => {
        waiting = false;
      }, wait);
    }
  };
};

/**
 * Batch multiple state updates to reduce re-renders
 * @param {Function} setStateCallback - The React setState function 
 * @param {Object} updates - Object containing all state updates
 */
export const batchUpdates = (setStateCallback, updates) => {
  setStateCallback(prevState => ({
    ...prevState,
    ...updates
  }));
};

/**
 * Memoize a function to cache results
 * @param {Function} fn - The function to memoize
 * @returns {Function} - Memoized function
 */
export const memoize = (fn) => {
  const cache = new Map();
  return (...args) => {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key);
    }
    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
};

/**
 * Get performance metrics for debugging
 * @returns {Object} - Performance metrics
 */
export const getPerformanceMetrics = () => {
  if (typeof window === 'undefined' || !window.performance) {
    return null;
  }
  
  const navigation = window.performance.getEntriesByType('navigation')[0];
  const paintEntries = window.performance.getEntriesByType('paint');
  
  // Find specific paint metrics
  const firstPaint = paintEntries.find(entry => entry.name === 'first-paint');
  const firstContentfulPaint = paintEntries.find(entry => entry.name === 'first-contentful-paint');
  
  return {
    // Navigation timing
    redirectTime: navigation ? navigation.redirectEnd - navigation.redirectStart : 0,
    dnsTime: navigation ? navigation.domainLookupEnd - navigation.domainLookupStart : 0,
    tcpTime: navigation ? navigation.connectEnd - navigation.connectStart : 0,
    requestTime: navigation ? navigation.responseStart - navigation.requestStart : 0,
    responseTime: navigation ? navigation.responseEnd - navigation.responseStart : 0,
    domProcessingTime: navigation ? navigation.domComplete - navigation.domInteractive : 0,
    domContentLoadedTime: navigation ? navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart : 0,
    loadTime: navigation ? navigation.loadEventEnd - navigation.loadEventStart : 0,
    totalPageLoadTime: navigation ? navigation.loadEventEnd - navigation.startTime : 0,
    
    // Paint timing
    firstPaintTime: firstPaint ? firstPaint.startTime : 0,
    firstContentfulPaintTime: firstContentfulPaint ? firstContentfulPaint.startTime : 0,
  };
};

/**
 * Record custom performance measurements
 * @param {string} markName - The name of the performance mark
 */
export const startMeasurement = (markName) => {
  if (typeof window !== 'undefined' && window.performance) {
    window.performance.mark(markName + "-start");
  }
};

/**
 * End and log a performance measurement
 * @param {string} markName - The name of the performance mark to end
 * @param {boolean} logToConsole - Whether to log to console
 * @returns {number} - The measurement duration in milliseconds
 */
export const endMeasurement = (markName, logToConsole = false) => {
  if (typeof window === 'undefined' || !window.performance) {
    return 0;
  }
  
  window.performance.mark(markName + "-end");
  window.performance.measure(markName, markName + "-start", markName + "-end");
  
  const entries = window.performance.getEntriesByName(markName, "measure");
  const duration = entries.length > 0 ? entries[0].duration : 0;
  
  if (logToConsole) {
    console.log(`Performance: ${markName} took ${duration.toFixed(2)}ms`);
  }
  
  // Clean up marks
  window.performance.clearMarks(markName + "-start");
  window.performance.clearMarks(markName + "-end");
  window.performance.clearMeasures(markName);
  
  return duration;
};

/**
 * Apply appropriate rendering optimizations based on device capability
 * @returns {Object} - Object with optimization flags
 */
export const getOptimizationLevel = () => {
  if (typeof window === 'undefined') {
    return {
      useAnimations: true,
      useTransitions: true, 
      useHighQualityImages: true,
      useShadowEffects: true
    };
  }
  
  // Check if device is likely low-powered
  const isLowPowered = () => {
    const userAgent = navigator.userAgent;
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    const isOlderDevice = /iPhone OS ([1-9]|10|11)_/i.test(userAgent) || /Android [1-6]\./i.test(userAgent);
    
    // Use device memory API if available
    const hasLimitedMemory = navigator.deviceMemory && navigator.deviceMemory < 4;
    
    return (isMobile && isOlderDevice) || hasLimitedMemory;
  };
  
  const lowPower = isLowPowered();
  
  return {
    useAnimations: !lowPower,
    useTransitions: true, // Keep basic transitions even on low-power devices
    useHighQualityImages: !lowPower,
    useShadowEffects: !lowPower
  };
}; 