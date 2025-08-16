import { useState, useEffect, useRef, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholder?: string;
  fallback?: string;
  lazy?: boolean;
  priority?: boolean;
  onLoad?: () => void;
  onError?: () => void;
}

const ImagePlaceholder = memo(() => (
  <div className="bg-gray-200 animate-pulse rounded-lg flex items-center justify-center">
    <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
  </div>
));

ImagePlaceholder.displayName = 'ImagePlaceholder';

const ImageError = memo(() => (
  <div className="bg-gray-100 rounded-lg flex items-center justify-center text-gray-500">
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  </div>
));

ImageError.displayName = 'ImageError';

export const OptimizedImage = memo<OptimizedImageProps>(({
  src,
  alt,
  className = '',
  placeholder,
  fallback = '/placeholder-image.jpg',
  lazy = true,
  priority = false,
  onLoad,
  onError
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(!lazy);
  const [currentSrc, setCurrentSrc] = useState<string>('');
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Intersection Observer per lazy loading
  useEffect(() => {
    if (!lazy || priority) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '50px',
        threshold: 0.1
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
      observerRef.current = observer;
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [lazy, priority]);

  // Gestione del caricamento dell'immagine
  useEffect(() => {
    if (!isInView) return;

    const img = new Image();
    
    const handleLoad = () => {
      setIsLoading(false);
      setHasError(false);
      setCurrentSrc(src);
      onLoad?.();
    };

    const handleError = () => {
      setIsLoading(false);
      setHasError(true);
      setCurrentSrc(fallback);
      onError?.();
    };

    img.onload = handleLoad;
    img.onerror = handleError;
    img.src = src;

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src, isInView, fallback, onLoad, onError]);

  // Preload per immagini prioritarie
  useEffect(() => {
    if (priority) {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = src;
      document.head.appendChild(link);

      return () => {
        document.head.removeChild(link);
      };
    }
  }, [src, priority]);

  return (
    <div className={`relative overflow-hidden ${className}`} ref={imgRef}>
      <AnimatePresence mode="wait">
        {isLoading && (
          <motion.div
            key="loading"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0"
          >
            {placeholder ? (
              <img
                src={placeholder}
                alt=""
                className="w-full h-full object-cover"
                aria-hidden="true"
              />
            ) : (
              <ImagePlaceholder />
            )}
          </motion.div>
        )}

        {hasError && !isLoading && (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0"
          >
            <ImageError />
          </motion.div>
        )}

        {currentSrc && !isLoading && !hasError && (
          <motion.img
            key="image"
            src={currentSrc}
            alt={alt}
            className="w-full h-full object-cover"
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            loading={lazy ? 'lazy' : 'eager'}
            decoding="async"
          />
        )}
      </AnimatePresence>
    </div>
  );
});

OptimizedImage.displayName = 'OptimizedImage';
