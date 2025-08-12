// Mobile Performance Optimizer
export class MobileOptimizer {
  private static instance: MobileOptimizer;
  private isMobile: boolean = false;
  private isLowEndMobile: boolean = false;
  private connectionSpeed: 'slow' | 'fast' | 'unknown' = 'unknown';

  private constructor() {
    this.detectDevice();
    this.detectConnection();
  }

  static getInstance(): MobileOptimizer {
    if (!MobileOptimizer.instance) {
      MobileOptimizer.instance = new MobileOptimizer();
    }
    return MobileOptimizer.instance;
  }

  private detectDevice(): void {
    const userAgent = navigator.userAgent.toLowerCase();
    this.isMobile = /mobile|android|iphone|ipad/.test(userAgent);
    
    // Rileva dispositivi a bassa performance
    const memory = (navigator as any).deviceMemory || 4;
    const cores = (navigator as any).hardwareConcurrency || 4;
    const isOldDevice = /android [4-7]|iphone os [8-10]|ipad os [8-10]/i.test(userAgent);
    
    this.isLowEndMobile = this.isMobile && (memory < 4 || cores < 4 || isOldDevice);
  }

  private detectConnection(): void {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      const effectiveType = connection.effectiveType;
      const downlink = connection.downlink;
      
      if (effectiveType === 'slow-2g' || effectiveType === '2g' || downlink < 1) {
        this.connectionSpeed = 'slow';
      } else {
        this.connectionSpeed = 'fast';
      }
    }
  }

  // Ottimizza le animazioni per mobile
  getMobileAnimationConfig() {
    if (this.isLowEndMobile) {
      return {
        duration: 0.2, // Animazioni più brevi
        ease: 'easeOut',
        type: 'tween' as const,
      };
    }
    
    if (this.isMobile) {
      return {
        duration: 0.3, // Durata media per mobile
        ease: 'easeOut',
        type: 'tween' as const,
      };
    }
    
    return {
      duration: 0.4, // Durata normale per desktop
      ease: [0.4, 0, 0.2, 1],
      type: 'tween' as const,
    };
  }

  // Ottimizza le transizioni CSS per mobile
  getMobileTransition(properties: string[] = ['all']): string {
    let duration = '300ms';
    let easing = 'ease-out';
    
    if (this.isLowEndMobile) {
      duration = '200ms';
      easing = 'ease-out';
    } else if (this.isMobile) {
      duration = '250ms';
      easing = 'ease-out';
    }
    
    return properties.map(prop => `${prop} ${duration} ${easing}`).join(', ');
  }

  // Ottimizza le proprietà CSS per mobile
  getMobileStyles(): Record<string, string> {
    const baseStyles = {
      'will-change': 'auto', // Disabilita will-change su mobile per risparmiare memoria
      'transform-style': 'flat', // Più performante su mobile
      'backface-visibility': 'hidden',
    };
    
    if (this.isLowEndMobile) {
      return {
        ...baseStyles,
        'transform': 'translateZ(0)', // Forza layer compositing
        'filter': 'none', // Disabilita filtri costosi
      };
    }
    
    return baseStyles;
  }

  // Riduce la qualità delle immagini su connessioni lente
  shouldReduceImageQuality(): boolean {
    return this.connectionSpeed === 'slow' || this.isLowEndMobile;
  }

  // Disabilita animazioni complesse su dispositivi lenti
  shouldDisableComplexAnimations(): boolean {
    return this.isLowEndMobile;
  }

  // Ottimizza il rendering per mobile
  getMobileRenderingConfig() {
    return {
      reduceMotion: this.isLowEndMobile,
      reduceQuality: this.shouldReduceImageQuality(),
      disableComplexAnimations: this.shouldDisableComplexAnimations(),
      useSimpleTransitions: this.isMobile,
    };
  }
}

// Hook React per ottimizzazioni mobile
export const useMobileOptimizer = () => {
  const optimizer = MobileOptimizer.getInstance();
  
  return {
    isMobile: optimizer.isMobile,
    isLowEndMobile: optimizer.isLowEndMobile,
    getMobileAnimationConfig: optimizer.getMobileAnimationConfig.bind(optimizer),
    getMobileTransition: optimizer.getMobileTransition.bind(optimizer),
    getMobileStyles: optimizer.getMobileStyles.bind(optimizer),
    shouldReduceImageQuality: optimizer.shouldReduceImageQuality.bind(optimizer),
    shouldDisableComplexAnimations: optimizer.shouldDisableComplexAnimations.bind(optimizer),
    getMobileRenderingConfig: optimizer.getMobileRenderingConfig.bind(optimizer),
  };
};

// Utility per ottimizzare elementi DOM per mobile
export const optimizeElementForMobile = (element: HTMLElement): void => {
  const optimizer = MobileOptimizer.getInstance();
  const styles = optimizer.getMobileStyles();
  
  Object.entries(styles).forEach(([property, value]) => {
    element.style.setProperty(property, value);
  });
  
  // Aggiungi classe per CSS specifico mobile
  if (optimizer.isLowEndMobile) {
    element.classList.add('low-end-mobile');
  } else if (optimizer.isMobile) {
    element.classList.add('mobile-optimized');
  }
};

// Utility per debounce su mobile
export const mobileDebounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number = 100
): ((...args: Parameters<T>) => void) => {
  const optimizer = MobileOptimizer.getInstance();
  const debounceTime = optimizer.isLowEndMobile ? wait * 1.5 : wait;
  
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), debounceTime);
  };
};

// Utility per throttle su mobile
export const mobileThrottle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number = 16
): ((...args: Parameters<T>) => void) => {
  const optimizer = MobileOptimizer.getInstance();
  const throttleTime = optimizer.isLowEndMobile ? limit * 2 : limit;
  
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), throttleTime);
    }
  };
};
