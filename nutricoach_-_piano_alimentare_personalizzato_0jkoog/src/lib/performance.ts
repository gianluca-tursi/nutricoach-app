// Utility per ottimizzare le performance

// Debounce function per evitare chiamate eccessive
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Throttle function per limitare la frequenza delle chiamate
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// Memoization semplice per funzioni costose
export function memoize<T extends (...args: any[]) => any>(
  func: T,
  getKey?: (...args: Parameters<T>) => string
): T {
  const cache = new Map<string, ReturnType<T>>();
  
  return ((...args: Parameters<T>) => {
    const key = getKey ? getKey(...args) : JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key);
    }
    
    const result = func(...args);
    cache.set(key, result);
    return result;
  }) as T;
}

// Intersection Observer per lazy loading
export function createIntersectionObserver(
  callback: IntersectionObserverCallback,
  options: IntersectionObserverInit = {}
): IntersectionObserver {
  return new IntersectionObserver(callback, {
    rootMargin: '50px',
    threshold: 0.1,
    ...options
  });
}

// Preload di risorse critiche
export function preloadResource(href: string, as: string = 'fetch'): void {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = href;
  link.as = as;
  document.head.appendChild(link);
}

// Ottimizzazione per liste virtuali
export function createVirtualListConfig(
  itemHeight: number,
  containerHeight: number,
  totalItems: number
) {
  const visibleItems = Math.ceil(containerHeight / itemHeight);
  const startIndex = Math.max(0, Math.floor(window.scrollY / itemHeight));
  const endIndex = Math.min(totalItems, startIndex + visibleItems + 2);
  
  return {
    startIndex,
    endIndex,
    visibleItems: endIndex - startIndex,
    totalHeight: totalItems * itemHeight,
    offsetY: startIndex * itemHeight
  };
}

// Cache per localStorage con TTL
export function createLocalStorageCache<T>(key: string, ttl: number = 5 * 60 * 1000) {
  return {
    get: (): T | null => {
      try {
        const item = localStorage.getItem(key);
        if (!item) return null;
        
        const { data, timestamp } = JSON.parse(item);
        if (Date.now() - timestamp > ttl) {
          localStorage.removeItem(key);
          return null;
        }
        
        return data;
      } catch {
        return null;
      }
    },
    set: (data: T): void => {
      try {
        localStorage.setItem(key, JSON.stringify({
          data,
          timestamp: Date.now()
        }));
      } catch {
        // Ignora errori di localStorage
      }
    },
    clear: (): void => {
      localStorage.removeItem(key);
    }
  };
}

// Ottimizzazione per animazioni
export function requestAnimationFrameThrottle<T extends (...args: any[]) => any>(
  func: T
): (...args: Parameters<T>) => void {
  let ticking = false;
  
  return (...args: Parameters<T>) => {
    if (!ticking) {
      requestAnimationFrame(() => {
        func(...args);
        ticking = false;
      });
      ticking = true;
    }
  };
} 