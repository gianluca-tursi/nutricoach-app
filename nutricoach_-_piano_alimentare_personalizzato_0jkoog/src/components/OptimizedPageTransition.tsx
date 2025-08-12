import { motion } from 'framer-motion';
import { useAnimationOptimizer } from '@/lib/animationOptimizer';
import { useMobileOptimizer } from '@/lib/mobileOptimizer';
import { ReactNode } from 'react';

interface OptimizedPageTransitionProps {
  children: ReactNode;
  className?: string;
}

export function OptimizedPageTransition({ children, className = '' }: OptimizedPageTransitionProps) {
  const { getFramerMotionConfig, shouldReduceAnimations } = useAnimationOptimizer();
  const { getMobileAnimationConfig, isMobile, isLowEndMobile } = useMobileOptimizer();

  // Disabilita completamente le animazioni su dispositivi a bassa performance
  if (shouldReduceAnimations() || isLowEndMobile) {
    return <div className={`${className} ${isLowEndMobile ? 'low-end-mobile' : ''}`}>{children}</div>;
  }

  // Usa configurazioni ottimizzate per mobile
  const animationConfig = isMobile ? getMobileAnimationConfig() : getFramerMotionConfig();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={animationConfig}
      className={`gpu-accelerated ${className} ${isMobile ? 'mobile-optimized' : ''}`}
    >
      {children}
    </motion.div>
  );
}
