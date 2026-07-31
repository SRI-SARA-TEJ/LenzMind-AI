/**
 * coach/hooks/useCreatorCoach.js
 *
 * Public API hook for consuming CreatorCoachContext.
 * Components import this — not the context directly.
 * This abstraction makes it trivial to swap the underlying store later.
 */

export { useCreatorCoachContext as useCreatorCoach } from '../context/CreatorCoachContext';
