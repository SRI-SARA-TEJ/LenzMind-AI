/**
 * growth/hooks/useCreatorGrowth.js
 *
 * Public API hook for consuming CreatorGrowthContext.
 * Components import this — not the context directly.
 * This abstraction makes it trivial to swap the underlying store later.
 */

export { useCreatorGrowthContext as useCreatorGrowth } from '../context/CreatorGrowthContext';
