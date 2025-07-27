import { useEffect, useRef, useState } from "react";

interface PerformanceMetrics {
  firstContentfulPaint?: number;
  largestContentfulPaint?: number;
  firstInputDelay?: number;
  cumulativeLayoutShift?: number;
  totalBlockingTime?: number;
  timeToInteractive?: number;
  navigationTiming?: PerformanceNavigationTiming;
  resourceTiming?: PerformanceResourceTiming[];
}

interface PerformanceMonitorProps {
  onMetricsUpdate?: (metrics: PerformanceMetrics) => void;
  enableConsoleLogging?: boolean;
  enableResourceTiming?: boolean;
}

export const PerformanceMonitor = ({
  onMetricsUpdate,
  enableConsoleLogging = false,
  enableResourceTiming = false,
}: PerformanceMonitorProps) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({});
  const observerRef = useRef<PerformanceObserver | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const updateMetrics = (newMetrics: Partial<PerformanceMetrics>) => {
      setMetrics(prev => {
        const updated = { ...prev, ...newMetrics };
        onMetricsUpdate?.(updated);
        
        if (enableConsoleLogging) {
          console.log("Performance Metrics Updated:", newMetrics);
        }
        
        return updated;
      });
    };

    // Collect Core Web Vitals
    const observeWebVitals = () => {
      if ("PerformanceObserver" in window) {
        // FCP - First Contentful Paint
        const fcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const fcp = entries.find(entry => entry.name === "first-contentful-paint");
          if (fcp) {
            updateMetrics({ firstContentfulPaint: fcp.startTime });
          }
        });

        // LCP - Largest Contentful Paint
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          if (lastEntry) {
            updateMetrics({ largestContentfulPaint: lastEntry.startTime });
          }
        });

        // FID - First Input Delay
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            if (entry.processingStart && entry.startTime) {
              const fid = entry.processingStart - entry.startTime;
              updateMetrics({ firstInputDelay: fid });
            }
          });
        });

        // CLS - Cumulative Layout Shift
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
              updateMetrics({ cumulativeLayoutShift: clsValue });
            }
          });
        });

        try {
          fcpObserver.observe({ entryTypes: ["paint"] });
          lcpObserver.observe({ entryTypes: ["largest-contentful-paint"] });
          fidObserver.observe({ entryTypes: ["first-input"] });
          clsObserver.observe({ entryTypes: ["layout-shift"] });

          observerRef.current = fcpObserver; // Store one for cleanup
        } catch (error) {
          console.warn("Performance Observer not fully supported:", error);
        }
      }
    };

    // Collect Navigation Timing
    const collectNavigationTiming = () => {
      if ("performance" in window && window.performance.getEntriesByType) {
        const navigationEntries = window.performance.getEntriesByType("navigation");
        if (navigationEntries.length > 0) {
          const navigationTiming = navigationEntries[0] as PerformanceNavigationTiming;
          updateMetrics({ navigationTiming });

          // Calculate additional metrics
          const domContentLoaded = navigationTiming.domContentLoadedEventEnd - navigationTiming.navigationStart;
          const loadComplete = navigationTiming.loadEventEnd - navigationTiming.navigationStart;
          const ttfb = navigationTiming.responseStart - navigationTiming.requestStart;

          if (enableConsoleLogging) {
            console.log("Navigation Timing:", {
              domContentLoaded: `${domContentLoaded.toFixed(2)}ms`,
              loadComplete: `${loadComplete.toFixed(2)}ms`,
              ttfb: `${ttfb.toFixed(2)}ms`,
            });
          }
        }
      }
    };

    // Collect Resource Timing
    const collectResourceTiming = () => {
      if (!enableResourceTiming) return;

      if ("performance" in window && window.performance.getEntriesByType) {
        const resourceEntries = window.performance.getEntriesByType("resource") as PerformanceResourceTiming[];
        
        // Filter and analyze large resources
        const largeResources = resourceEntries
          .filter(entry => entry.transferSize > 100000) // > 100KB
          .sort((a, b) => b.transferSize - a.transferSize)
          .slice(0, 10); // Top 10 largest

        updateMetrics({ resourceTiming: largeResources });

        if (enableConsoleLogging && largeResources.length > 0) {
          console.log("Large Resources (>100KB):", largeResources.map(resource => ({
            name: resource.name.split('/').pop(),
            size: `${(resource.transferSize / 1024).toFixed(2)}KB`,
            duration: `${resource.duration.toFixed(2)}ms`,
          })));
        }
      }
    };

    // Start monitoring
    observeWebVitals();
    
    // Collect timing data after page load
    if (document.readyState === "complete") {
      collectNavigationTiming();
      collectResourceTiming();
    } else {
      window.addEventListener("load", () => {
        setTimeout(() => {
          collectNavigationTiming();
          collectResourceTiming();
        }, 1000); // Wait a bit for all resources to load
      });
    }

    // Cleanup
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [onMetricsUpdate, enableConsoleLogging, enableResourceTiming]);

  // Performance score calculation
  const calculatePerformanceScore = (): number => {
    let score = 100;

    // Deduct points based on Core Web Vitals thresholds
    if (metrics.firstContentfulPaint && metrics.firstContentfulPaint > 1800) {
      score -= 15; // Poor FCP
    } else if (metrics.firstContentfulPaint && metrics.firstContentfulPaint > 1000) {
      score -= 5; // Needs improvement FCP
    }

    if (metrics.largestContentfulPaint && metrics.largestContentfulPaint > 4000) {
      score -= 20; // Poor LCP
    } else if (metrics.largestContentfulPaint && metrics.largestContentfulPaint > 2500) {
      score -= 10; // Needs improvement LCP
    }

    if (metrics.firstInputDelay && metrics.firstInputDelay > 300) {
      score -= 15; // Poor FID
    } else if (metrics.firstInputDelay && metrics.firstInputDelay > 100) {
      score -= 5; // Needs improvement FID
    }

    if (metrics.cumulativeLayoutShift && metrics.cumulativeLayoutShift > 0.25) {
      score -= 20; // Poor CLS
    } else if (metrics.cumulativeLayoutShift && metrics.cumulativeLayoutShift > 0.1) {
      score -= 10; // Needs improvement CLS
    }

    return Math.max(0, score);
  };

  // Don't render anything in production unless explicitly needed
  if (process.env.NODE_ENV === "production" && !enableConsoleLogging) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black bg-opacity-80 text-white p-3 rounded-lg text-xs font-mono z-50 max-w-xs">
      <div className="font-bold mb-2">Performance Monitor</div>
      <div className="space-y-1">
        <div>Score: {calculatePerformanceScore()}/100</div>
        {metrics.firstContentfulPaint && (
          <div>FCP: {metrics.firstContentfulPaint.toFixed(0)}ms</div>
        )}
        {metrics.largestContentfulPaint && (
          <div>LCP: {metrics.largestContentfulPaint.toFixed(0)}ms</div>
        )}
        {metrics.firstInputDelay && (
          <div>FID: {metrics.firstInputDelay.toFixed(0)}ms</div>
        )}
        {metrics.cumulativeLayoutShift && (
          <div>CLS: {metrics.cumulativeLayoutShift.toFixed(3)}</div>
        )}
        {metrics.resourceTiming && metrics.resourceTiming.length > 0 && (
          <div>Large Resources: {metrics.resourceTiming.length}</div>
        )}
      </div>
    </div>
  );
};

// Hook for using performance metrics in components
export const usePerformanceMetrics = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({});

  return {
    metrics,
    setMetrics,
    PerformanceMonitor: (props: Omit<PerformanceMonitorProps, 'onMetricsUpdate'>) => (
      <PerformanceMonitor {...props} onMetricsUpdate={setMetrics} />
    ),
  };
};