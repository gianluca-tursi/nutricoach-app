import { Suspense, lazy, ComponentType } from 'react';
import { motion } from 'framer-motion';

interface LazyPageProps {
  component: () => Promise<{ default: ComponentType<any> }>;
  fallback?: React.ReactNode;
}

const DefaultFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-black">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
      <p className="text-white text-lg">Caricamento pagina...</p>
    </div>
  </div>
);

export function LazyPage({ component, fallback = <DefaultFallback /> }: LazyPageProps) {
  const LazyComponent = lazy(component);

  return (
    <Suspense fallback={fallback}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        <LazyComponent />
      </motion.div>
    </Suspense>
  );
}

// Preload delle pagine più utilizzate
export const preloadPage = (component: () => Promise<{ default: ComponentType<any> }>) => {
  // Preload in background
  setTimeout(() => {
    component();
  }, 100);
};
