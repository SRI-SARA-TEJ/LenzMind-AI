/**
 * analytics/hooks/useAnalytics.js
 *
 * Public API hook for consuming AnalyticsContext.
 * Components import this — not the context directly.
 * This abstraction makes it trivial to swap the underlying store later.
 */

export { useAnalyticsContext as useAnalytics } from '../context/AnalyticsContext';
