import { useCallback, useRef, useState, useEffect } from "react";

/**
 * Optimized state hook that debounces state updates and prevents unnecessary re-renders
 */
export function useOptimizedState<T>(
  initialState: T,
  debounceMs: number = 300
): [T, (value: T | ((prev: T) => T)) => void, T] {
  const [state, setState] = useState<T>(initialState);
  const [debouncedState, setDebouncedState] = useState<T>(initialState);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const setOptimizedState = useCallback(
    (value: T | ((prev: T) => T)) => {
      setState(value);
      
      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Set debounced state after delay
      timeoutRef.current = setTimeout(() => {
        setDebouncedState(typeof value === "function" ? (value as (prev: T) => T)(state) : value);
      }, debounceMs);
    },
    [debounceMs, state]
  );

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return [state, setOptimizedState, debouncedState];
}

/**
 * Hook for batching multiple state updates to reduce re-renders
 */
export function useBatchedState<T extends Record<string, any>>(
  initialState: T
): [T, (updates: Partial<T>) => void] {
  const [state, setState] = useState<T>(initialState);
  const batchTimeoutRef = useRef<NodeJS.Timeout>();
  const pendingUpdatesRef = useRef<Partial<T>>({});

  const batchedSetState = useCallback((updates: Partial<T>) => {
    // Accumulate updates
    pendingUpdatesRef.current = { ...pendingUpdatesRef.current, ...updates };

    // Clear existing timeout
    if (batchTimeoutRef.current) {
      clearTimeout(batchTimeoutRef.current);
    }

    // Batch updates in next tick
    batchTimeoutRef.current = setTimeout(() => {
      setState(prevState => ({
        ...prevState,
        ...pendingUpdatesRef.current,
      }));
      pendingUpdatesRef.current = {};
    }, 0);
  }, []);

  useEffect(() => {
    return () => {
      if (batchTimeoutRef.current) {
        clearTimeout(batchTimeoutRef.current);
      }
    };
  }, []);

  return [state, batchedSetState];
}

/**
 * Hook for memoizing expensive computations with dependencies
 */
export function useOptimizedMemo<T>(
  factory: () => T,
  deps: React.DependencyList,
  isExpensive: boolean = true
): T {
  const memoRef = useRef<{ value: T; deps: React.DependencyList }>();

  // Only compute if dependencies changed or no cached value exists
  if (!memoRef.current || !depsEqual(memoRef.current.deps, deps)) {
    const value = factory();
    memoRef.current = { value, deps: [...deps] };
  }

  return memoRef.current.value;
}

/**
 * Utility function to compare dependency arrays
 */
function depsEqual(deps1: React.DependencyList, deps2: React.DependencyList): boolean {
  if (deps1.length !== deps2.length) return false;
  return deps1.every((dep, index) => Object.is(dep, deps2[index]));
}

/**
 * Hook for virtualized list performance optimization
 */
export function useVirtualizedList<T>(
  items: T[],
  itemHeight: number,
  containerHeight: number,
  overscan: number = 5
) {
  const [scrollTop, setScrollTop] = useState(0);

  const visibleStartIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const visibleEndIndex = Math.min(
    items.length - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  );

  const visibleItems = items.slice(visibleStartIndex, visibleEndIndex + 1);
  const totalHeight = items.length * itemHeight;
  const offsetY = visibleStartIndex * itemHeight;

  return {
    visibleItems,
    totalHeight,
    offsetY,
    visibleStartIndex,
    visibleEndIndex,
    setScrollTop,
  };
}

/**
 * Hook for intersection observer-based lazy loading
 */
export function useLazyLoad(threshold: number = 0.1) {
  const [isVisible, setIsVisible] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const targetRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasLoaded) {
          setIsVisible(true);
          setHasLoaded(true);
        }
      },
      { threshold }
    );

    const currentTarget = targetRef.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [threshold, hasLoaded]);

  return { ref: targetRef, isVisible, hasLoaded };
}