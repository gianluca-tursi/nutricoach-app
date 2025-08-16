// Ottimizzazioni per la produzione

export const isProduction = import.meta.env.PROD;
export const isDevelopment = import.meta.env.DEV;

// Disable console logs in production
if (isProduction) {
  const originalConsoleLog = console.log;
  const originalConsoleWarn = console.warn;
  const originalConsoleInfo = console.info;
  
  console.log = () => {};
  console.warn = () => {};
  console.info = () => {};
  // Keep console.error for critical errors
}

// Performance monitoring
export const performance = {
  mark: (name: string) => {
    if (typeof window !== 'undefined' && window.performance) {
      window.performance.mark(name);
    }
  },
  
  measure: (name: string, startMark: string, endMark: string) => {
    if (typeof window !== 'undefined' && window.performance) {
      try {
        window.performance.measure(name, startMark, endMark);
        const measure = window.performance.getEntriesByName(name)[0];
        console.log(`${name}: ${measure.duration.toFixed(2)}ms`);
      } catch (error) {
        // Ignore measurement errors
      }
    }
  },
  
  clearMarks: () => {
    if (typeof window !== 'undefined' && window.performance) {
      window.performance.clearMarks();
      window.performance.clearMeasures();
    }
  }
};

// Error boundary helper
export const errorHandler = (error: Error, errorInfo?: any) => {
  if (isProduction) {
    // In production, send to error reporting service
    console.error('Production error:', error, errorInfo);
  } else {
    // In development, log to console
    console.error('Development error:', error, errorInfo);
  }
};

// Memory management
export const memoryOptimization = {
  // Clear unused references
  cleanup: () => {
    if (typeof window !== 'undefined' && 'gc' in window) {
      // Force garbage collection if available
      (window as any).gc?.();
    }
  },
  
  // Monitor memory usage
  getMemoryInfo: () => {
    if (typeof window !== 'undefined' && 'memory' in performance) {
      const memory = (performance as any).memory;
      return {
        used: Math.round(memory.usedJSHeapSize / 1048576 * 100) / 100,
        total: Math.round(memory.totalJSHeapSize / 1048576 * 100) / 100,
        limit: Math.round(memory.jsHeapSizeLimit / 1048576 * 100) / 100
      };
    }
    return null;
  }
};

// Network optimization
export const networkOptimization = {
  // Check connection type
  getConnectionInfo: () => {
    if (typeof navigator !== 'undefined' && 'connection' in navigator) {
      const connection = (navigator as any).connection;
      return {
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt,
        saveData: connection.saveData
      };
    }
    return null;
  },
  
  // Adjust quality based on connection
  shouldReduceQuality: () => {
    const connectionInfo = networkOptimization.getConnectionInfo();
    if (connectionInfo) {
      return connectionInfo.effectiveType === 'slow-2g' || 
             connectionInfo.effectiveType === '2g' ||
             connectionInfo.saveData;
    }
    return false;
  }
};

// Animation optimization
export const animationOptimization = {
  // Check if device prefers reduced motion
  prefersReducedMotion: () => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  },
  
  // Check if device is on low power mode (iOS)
  isLowPowerMode: () => {
    if (typeof navigator === 'undefined') return false;
    // Return false by default, can be enhanced with battery API if needed
    return false;
  },
  
  // Should reduce animations
  shouldReduceAnimations: () => {
    return animationOptimization.prefersReducedMotion() || animationOptimization.isLowPowerMode();
  }
};

// Cache management
export const cacheManagement = {
  // Clear all caches
  clearAllCaches: async () => {
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
    }
  },
  
  // Clear specific cache
  clearCache: async (cacheName: string) => {
    if ('caches' in window) {
      await caches.delete(cacheName);
    }
  },
  
  // Get cache size
  getCacheSize: async () => {
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      let totalSize = 0;
      
      for (const name of cacheNames) {
        const cache = await caches.open(name);
        const keys = await cache.keys();
        for (const request of keys) {
          const response = await cache.match(request);
          if (response) {
            const blob = await response.blob();
            totalSize += blob.size;
          }
        }
      }
      
      return Math.round(totalSize / 1024 / 1024 * 100) / 100; // MB
    }
    return 0;
  }
};

// Export all optimizations
export const productionOptimizations = {
  isProduction,
  isDevelopment,
  performance,
  errorHandler,
  memoryOptimization,
  networkOptimization,
  animationOptimization,
  cacheManagement
};
