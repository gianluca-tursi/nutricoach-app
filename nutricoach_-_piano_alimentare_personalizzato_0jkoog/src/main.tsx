import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import './lib/performance.ts';
import { productionOptimizations } from './lib/production.ts';
import { AnimationOptimizer } from './lib/animationOptimizer';

// Performance monitoring
productionOptimizations.performance.mark('app-start');

// Initialize animation optimizer
AnimationOptimizer.getInstance();

// Service Worker registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

// Error boundary for the entire app
window.addEventListener('error', (event) => {
  // Prevent default error handling to avoid message channel issues
  event.preventDefault();
  productionOptimizations.errorHandler(event.error, {
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno
  });
});

window.addEventListener('unhandledrejection', (event) => {
  // Prevent default rejection handling to avoid message channel issues
  event.preventDefault();
  productionOptimizations.errorHandler(new Error(event.reason), {
    type: 'unhandledrejection'
  });
});

// Memory optimization on page visibility change
document.addEventListener('visibilitychange', () => {
  if (document.hidden && productionOptimizations.isProduction) {
    // Clean up memory when page is hidden
    try {
      setTimeout(() => {
        productionOptimizations.memoryOptimization.cleanup();
      }, 1000);
    } catch (error) {
      // Ignore cleanup errors to avoid message channel issues
      console.warn('Memory cleanup error:', error);
    }
  }
});

// Network optimization
if (productionOptimizations.networkOptimization.shouldReduceQuality()) {
  // Reduce image quality, disable animations, etc.
  document.documentElement.classList.add('reduced-quality');
}

// Animation optimization
if (productionOptimizations.animationOptimization.shouldReduceAnimations()) {
  document.documentElement.classList.add('reduced-motion');
}

const root = createRoot(document.getElementById('root')!);

root.render(
  <StrictMode>
    <App />
  </StrictMode>
);

// Performance measurement
productionOptimizations.performance.mark('app-rendered');
productionOptimizations.performance.measure('app-initialization', 'app-start', 'app-rendered');

// Log performance info in development
if (productionOptimizations.isDevelopment) {
  const memoryInfo = productionOptimizations.memoryOptimization.getMemoryInfo();
  const connectionInfo = productionOptimizations.networkOptimization.getConnectionInfo();
  
  console.log('🚀 App initialized with optimizations:');
  console.log('📊 Memory:', memoryInfo);
  console.log('🌐 Connection:', connectionInfo);
  console.log('⚡ Animations reduced:', productionOptimizations.animationOptimization.shouldReduceAnimations());
}
