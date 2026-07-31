/**
 * learning/hooks/useCreatorLearning.js
 *
 * Public API hook for consuming CreatorLearningContext.
 * Components import this — not the context directly.
 * This abstraction makes it trivial to swap the underlying store later.
 */

export { useCreatorLearningContext as useCreatorLearning } from '../context/CreatorLearningContext';
