import { useState, useEffect, useCallback, useRef } from 'react';
import { createLocalStorageCache, debounce } from '@/lib/performance';

interface QueryOptions<T> {
  enabled?: boolean;
  cacheKey?: string;
  cacheTime?: number;
  staleTime?: number;
  retry?: number;
  retryDelay?: number;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
}

interface QueryResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  invalidate: () => void;
}

export function useOptimizedQuery<T>(
  queryFn: () => Promise<T>,
  options: QueryOptions<T> = {}
): QueryResult<T> {
  const {
    enabled = true,
    cacheKey,
    cacheTime = 5 * 60 * 1000, // 5 minuti
    staleTime = 60 * 1000, // 1 minuto
    retry = 3,
    retryDelay = 1000,
    onSuccess,
    onError
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastFetch, setLastFetch] = useState<number>(0);
  
  const cache = useRef(cacheKey ? createLocalStorageCache<T>(cacheKey, cacheTime) : null);
  const retryCount = useRef(0);
  const abortController = useRef<AbortController | null>(null);

  // Funzione per eseguire la query
  const executeQuery = useCallback(async (force = false) => {
    if (!enabled) return;

    // Controlla se i dati sono ancora validi
    if (!force && data && lastFetch && Date.now() - lastFetch < staleTime) {
      return;
    }

    // Prova dal cache se disponibile
    if (!force && cache.current) {
      const cachedData = cache.current.get();
      if (cachedData) {
        setData(cachedData);
        setLastFetch(Date.now());
        onSuccess?.(cachedData);
        return;
      }
    }

    // Cancella richieste precedenti
    if (abortController.current) {
      abortController.current.abort();
    }
    abortController.current = new AbortController();

    setLoading(true);
    setError(null);

    try {
      const result = await queryFn();
      
      setData(result);
      setLastFetch(Date.now());
      setError(null);
      retryCount.current = 0;

      // Salva nel cache
      if (cache.current) {
        cache.current.set(result);
      }

      onSuccess?.(result);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      
      // Retry logic
      if (retryCount.current < retry && !abortController.current?.signal.aborted) {
        retryCount.current++;
        setTimeout(() => {
          executeQuery(force);
        }, retryDelay * retryCount.current);
        return;
      }

      setError(error);
      onError?.(error);
    } finally {
      setLoading(false);
    }
  }, [enabled, data, lastFetch, staleTime, cacheKey, retry, retryDelay, onSuccess, onError, queryFn]);

  // Debounced refetch
  const debouncedRefetch = useCallback(
    debounce(() => executeQuery(true), 300),
    [executeQuery]
  );

  // Esegui la query quando cambiano le dipendenze
  useEffect(() => {
    if (enabled) {
      executeQuery();
    }
  }, [enabled, executeQuery]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (abortController.current) {
        abortController.current.abort();
      }
    };
  }, []);

  const refetch = useCallback(async () => {
    await executeQuery(true);
  }, [executeQuery]);

  const invalidate = useCallback(() => {
    if (cache.current) {
      cache.current.clear();
    }
    setData(null);
    setLastFetch(0);
  }, []);

  return {
    data,
    loading,
    error,
    refetch,
    invalidate
  };
}

// Hook per ottimizzare le mutazioni
export function useOptimizedMutation<T, R>(
  mutationFn: (data: T) => Promise<R>,
  options: {
    onSuccess?: (data: R) => void;
    onError?: (error: Error) => void;
    invalidateQueries?: string[];
  } = {}
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(async (data: T): Promise<R | null> => {
    setLoading(true);
    setError(null);

    try {
      const result = await mutationFn(data);
      options.onSuccess?.(result);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      options.onError?.(error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [mutationFn, options]);

  return {
    mutate,
    loading,
    error
  };
}
