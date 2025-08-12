import { motion } from 'framer-motion';
import { useAnimationOptimizer } from '@/lib/animationOptimizer';
import { ReactNode } from 'react';

interface OptimizedPageTransitionProps {
  children: ReactNode;
  className?: string;
}

export function OptimizedPageTransition({ children, className = '' }: OptimizedPageTransitionProps) {
  const { getFramerMotionConfig, shouldReduceAnimations } = useAnimationOptimizer();

  if (shouldReduceAnimations()) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={getFramerMotionConfig()}
      className={`gpu-accelerated ${className}`}
    >
      {children}
    </motion.div>
  );
}
