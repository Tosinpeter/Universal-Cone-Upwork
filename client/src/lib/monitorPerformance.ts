/**
 * Advanced Performance Monitoring
 * Real-time monitoring and alerting for performance issues
 */

interface PerformanceAlert {
  type: 'warning' | 'critical';
  metric: string;
  value: number;
  threshold: number;
  timestamp: number;
}

class PerformanceMonitor {
  private alerts: PerformanceAlert[] = [];
  private readonly thresholds = {
    // API Response times (ms)
    ttsGeneration: 3000,
    apiRequest: 5000,
    
    // Render times (ms)
    componentRender: 100,
    
    // Memory (bytes)
    memoryUsage: 50 * 1024 * 1024, // 50MB
    
    // Network (bytes)
    payloadSize: 1024 * 1024, // 1MB
  };

  /**
   * Monitor an async operation
   */
  async monitor<T>(
    name: string,
    operation: () => Promise<T>,
    threshold?: number
  ): Promise<T> {
    const startTime = performance.now();
    const startMemory = this.getMemoryUsage();

    try {
      const result = await operation();
      const duration = performance.now() - startTime;
      const memoryDelta = this.getMemoryUsage() - startMemory;

      this.logMetric(name, duration, threshold);
      this.checkThreshold(name, duration, threshold);
      
      if (memoryDelta > 5 * 1024 * 1024) { // 5MB increase
        console.warn(`⚠️ Memory spike in ${name}: +${(memoryDelta / 1024 / 1024).toFixed(2)}MB`);
      }

      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      console.error(`❌ ${name} failed after ${duration.toFixed(2)}ms:`, error);
      throw error;
    }
  }

  /**
   * Get current memory usage (if available)
   */
  private getMemoryUsage(): number {
    if ('memory' in performance) {
      return (performance as any).memory.usedJSHeapSize;
    }
    return 0;
  }

  /**
   * Log performance metric
   */
  private logMetric(name: string, duration: number, threshold?: number): void {
    const color = duration < (threshold || 1000) ? '✅' : '⚠️';
    console.log(`${color} ${name}: ${duration.toFixed(2)}ms`);
  }

  /**
   * Check if metric exceeds threshold
   */
  private checkThreshold(name: string, value: number, customThreshold?: number): void {
    const threshold = customThreshold || this.thresholds[name as keyof typeof this.thresholds] || 1000;
    
    if (value > threshold) {
      const severity = value > threshold * 1.5 ? 'critical' : 'warning';
      this.addAlert({
        type: severity,
        metric: name,
        value,
        threshold,
        timestamp: Date.now(),
      });
    }
  }

  /**
   * Add performance alert
   */
  private addAlert(alert: PerformanceAlert): void {
    this.alerts.push(alert);
    
    // Keep only last 50 alerts
    if (this.alerts.length > 50) {
      this.alerts.shift();
    }

    if (alert.type === 'critical') {
      console.error(`🚨 CRITICAL: ${alert.metric} took ${alert.value.toFixed(2)}ms (threshold: ${alert.threshold}ms)`);
    } else {
      console.warn(`⚠️ WARNING: ${alert.metric} took ${alert.value.toFixed(2)}ms (threshold: ${alert.threshold}ms)`);
    }
  }

  /**
   * Get recent alerts
   */
  getAlerts(minutesAgo: number = 5): PerformanceAlert[] {
    const cutoff = Date.now() - minutesAgo * 60 * 1000;
    return this.alerts.filter(a => a.timestamp > cutoff);
  }

  /**
   * Get performance report
   */
  getReport(): {
    totalAlerts: number;
    criticalAlerts: number;
    recentAlerts: PerformanceAlert[];
    memoryUsage: number;
  } {
    const recent = this.getAlerts(5);
    return {
      totalAlerts: this.alerts.length,
      criticalAlerts: this.alerts.filter(a => a.type === 'critical').length,
      recentAlerts: recent,
      memoryUsage: this.getMemoryUsage(),
    };
  }

  /**
   * Clear all alerts
   */
  clearAlerts(): void {
    this.alerts = [];
  }

  /**
   * Check Core Web Vitals
   */
  async checkWebVitals(): Promise<void> {
    if (!('PerformanceObserver' in window)) {
      console.warn('PerformanceObserver not available');
      return;
    }

    // Largest Contentful Paint (LCP)
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1] as any;
      const lcp = lastEntry.renderTime || lastEntry.loadTime;
      
      console.log(`📊 LCP: ${lcp.toFixed(2)}ms`);
      if (lcp > 2500) {
        console.warn('⚠️ LCP is above recommended threshold (2500ms)');
      }
    }).observe({ entryTypes: ['largest-contentful-paint'] });

    // First Input Delay (FID) - approximated
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry: any) => {
        const fid = entry.processingStart - entry.startTime;
        console.log(`📊 FID: ${fid.toFixed(2)}ms`);
        if (fid > 100) {
          console.warn('⚠️ FID is above recommended threshold (100ms)');
        }
      });
    }).observe({ entryTypes: ['first-input'] });

    // Cumulative Layout Shift (CLS)
    let clsScore = 0;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as any[]) {
        if (!entry.hadRecentInput) {
          clsScore += entry.value;
        }
      }
      console.log(`📊 CLS: ${clsScore.toFixed(3)}`);
      if (clsScore > 0.1) {
        console.warn('⚠️ CLS is above recommended threshold (0.1)');
      }
    }).observe({ entryTypes: ['layout-shift'] });
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Expose to window in development
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  (window as any).perfMonitor = performanceMonitor;
  console.log('💡 Performance monitor available at window.perfMonitor');
  
  // Auto-check web vitals on load
  if (document.readyState === 'complete') {
    performanceMonitor.checkWebVitals();
  } else {
    window.addEventListener('load', () => {
      performanceMonitor.checkWebVitals();
    });
  }
}

/**
 * Utility to measure component render time
 * Note: Use React DevTools Profiler for more accurate measurements
 */
export function measureRenderTime(componentName: string, startTime: number): void {
  const duration = performance.now() - startTime;
  
  if (duration > 50 && process.env.NODE_ENV === 'development') {
    console.warn(`⚠️ ${componentName} render took ${duration.toFixed(2)}ms`);
  }
}
