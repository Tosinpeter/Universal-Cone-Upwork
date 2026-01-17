/**
 * Performance Monitoring Utility
 * Tracks and logs performance metrics for optimization
 */

interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: number;
}

const metrics: PerformanceMetric[] = [];
const MAX_METRICS = 100;

/**
 * Start a performance measurement
 */
export function startMeasure(name: string): () => void {
  const startTime = performance.now();
  
  return () => {
    const duration = performance.now() - startTime;
    addMetric(name, duration);
  };
}

/**
 * Add a metric to the collection
 */
function addMetric(name: string, duration: number): void {
  if (metrics.length >= MAX_METRICS) {
    metrics.shift(); // Remove oldest metric
  }
  
  metrics.push({
    name,
    duration,
    timestamp: Date.now(),
  });
  
  // Log in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`⚡ Performance: ${name} took ${duration.toFixed(2)}ms`);
  }
}

/**
 * Get all metrics
 */
export function getMetrics(): PerformanceMetric[] {
  return [...metrics];
}

/**
 * Get average duration for a specific metric
 */
export function getAverageDuration(name: string): number {
  const filtered = metrics.filter(m => m.name === name);
  if (filtered.length === 0) return 0;
  
  const total = filtered.reduce((sum, m) => sum + m.duration, 0);
  return total / filtered.length;
}

/**
 * Clear all metrics
 */
export function clearMetrics(): void {
  metrics.length = 0;
}

/**
 * Get performance summary
 */
export function getPerformanceSummary(): Record<string, {
  count: number;
  average: number;
  min: number;
  max: number;
}> {
  const summary: Record<string, {
    count: number;
    average: number;
    min: number;
    max: number;
  }> = {};
  
  metrics.forEach(metric => {
    if (!summary[metric.name]) {
      summary[metric.name] = {
        count: 0,
        average: 0,
        min: Infinity,
        max: -Infinity,
      };
    }
    
    const s = summary[metric.name];
    s.count++;
    s.min = Math.min(s.min, metric.duration);
    s.max = Math.max(s.max, metric.duration);
  });
  
  // Calculate averages
  Object.keys(summary).forEach(name => {
    summary[name].average = getAverageDuration(name);
  });
  
  return summary;
}

/**
 * Log performance summary to console
 */
export function logPerformanceSummary(): void {
  const summary = getPerformanceSummary();
  
  console.group('📊 Performance Summary');
  Object.entries(summary).forEach(([name, stats]) => {
    console.log(`${name}:`, {
      count: stats.count,
      avg: `${stats.average.toFixed(2)}ms`,
      min: `${stats.min.toFixed(2)}ms`,
      max: `${stats.max.toFixed(2)}ms`,
    });
  });
  console.groupEnd();
}

// Expose performance utilities to window in development
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  (window as any).performance_utils = {
    getMetrics,
    getAverageDuration,
    clearMetrics,
    getPerformanceSummary,
    logPerformanceSummary,
  };
  
  console.log('💡 Performance utilities available at window.performance_utils');
}
