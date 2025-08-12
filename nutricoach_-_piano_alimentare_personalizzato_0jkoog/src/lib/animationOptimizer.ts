// Animation Optimizer per migliorare la fluidità delle animazioni
export class AnimationOptimizer {
  private static instance: AnimationOptimizer;
  private isLowPerformance: boolean = false;
  private isReducedMotion: boolean = false;
  private frameRate: number = 60;

  private constructor() {
    this.detectPerformance();
    this.detectReducedMotion();
    this.measureFrameRate();
  }

  static getInstance(): AnimationOptimizer {
    if (!AnimationOptimizer.instance) {
      AnimationOptimizer.instance = new AnimationOptimizer();
    }
    return AnimationOptimizer.instance;
  }

  private detectPerformance(): void {
    // Rileva dispositivi a bassa performance
    const userAgent = navigator.userAgent.toLowerCase();
    const isMobile = /mobile|android|iphone|ipad/.test(userAgent);
    const memory = (navigator as any).deviceMemory || 4;
    const cores = (navigator as any).hardwareConcurrency || 4;
    
    this.isLowPerformance = isMobile && (memory < 4 || cores < 4);
  }

  private detectReducedMotion(): void {
    // Rileva preferenze utente per riduzione movimento
    this.isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  private measureFrameRate(): void {
    // Misura il frame rate del dispositivo
    let lastTime = performance.now();
    let frames = 0;
    
    const measure = () => {
      frames++;
      const currentTime = performance.now();
      
      if (currentTime - lastTime >= 1000) {
        this.frameRate = Math.round((frames * 1000) / (currentTime - lastTime));
        frames = 0;
        lastTime = currentTime;
      }
      
      requestAnimationFrame(measure);
    };
    
    requestAnimationFrame(measure);
  }

  // Ottimizza le durate delle animazioni
  getOptimizedDuration(baseDuration: number = 300): number {
    if (this.isReducedMotion) return 0;
    if (this.isLowPerformance) return baseDuration * 0.7;
    if (this.frameRate < 30) return baseDuration * 0.8;
    return baseDuration;
  }

  // Ottimizza le curve di easing
  getOptimizedEasing(): string {
    if (this.isLowPerformance || this.frameRate < 30) {
      return 'ease-out'; // Più semplice per dispositivi lenti
    }
    return 'ease-out'; // Framer Motion non supporta cubic-bezier come stringa
  }

  // Ottimizza le proprietà di trasformazione
  getOptimizedTransform(transform: string): string {
    // Forza l'uso di transform3d per attivare l'accelerazione hardware
    if (transform.includes('translate')) {
      return transform.replace(/translate\(/g, 'translate3d(').replace(/\)$/, ', 0)');
    }
    if (transform.includes('scale')) {
      return transform.replace(/scale\(/g, 'scale3d(').replace(/\)$/, ', 1)');
    }
    return transform;
  }

  // Ottimizza le proprietà CSS per animazioni fluide
  getOptimizedStyles(): Record<string, string> {
    return {
      'will-change': this.isLowPerformance ? 'auto' : 'transform, opacity',
      'transform-style': 'preserve-3d',
      'backface-visibility': 'hidden',
      'perspective': '1000px',
    };
  }

  // Controlla se ridurre le animazioni
  shouldReduceAnimations(): boolean {
    return this.isReducedMotion || this.isLowPerformance || this.frameRate < 30;
  }

  // Ottimizza le animazioni Framer Motion
  getFramerMotionConfig() {
    return {
      duration: this.getOptimizedDuration() / 1000, // Framer Motion usa secondi
      ease: this.isLowPerformance || this.frameRate < 30 ? 'easeOut' : [0.4, 0, 0.2, 1], // Array per cubic-bezier
      type: 'tween' as const,
    };
  }

  // Ottimizza le transizioni CSS
  getCSSTransition(properties: string[] = ['all']): string {
    const duration = this.getOptimizedDuration();
    const easing = this.isLowPerformance || this.frameRate < 30 ? 'ease-out' : 'ease-out';
    return properties.map(prop => `${prop} ${duration}ms ${easing}`).join(', ');
  }
}

// Hook React per ottimizzare le animazioni
export const useAnimationOptimizer = () => {
  const optimizer = AnimationOptimizer.getInstance();
  
  return {
    getOptimizedDuration: optimizer.getOptimizedDuration.bind(optimizer),
    getOptimizedEasing: optimizer.getOptimizedEasing.bind(optimizer),
    getOptimizedTransform: optimizer.getOptimizedTransform.bind(optimizer),
    getOptimizedStyles: optimizer.getOptimizedStyles.bind(optimizer),
    shouldReduceAnimations: optimizer.shouldReduceAnimations.bind(optimizer),
    getFramerMotionConfig: optimizer.getFramerMotionConfig.bind(optimizer),
    getCSSTransition: optimizer.getCSSTransition.bind(optimizer),
  };
};

// Utility per ottimizzare elementi DOM
export const optimizeElementForAnimation = (element: HTMLElement): void => {
  const optimizer = AnimationOptimizer.getInstance();
  const styles = optimizer.getOptimizedStyles();
  
  Object.entries(styles).forEach(([property, value]) => {
    element.style.setProperty(property, value);
  });
};

// Utility per debounce le animazioni
export const debounceAnimation = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Utility per throttle le animazioni
export const throttleAnimation = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};
