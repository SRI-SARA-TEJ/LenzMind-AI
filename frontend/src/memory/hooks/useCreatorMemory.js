/**
 * memory/hooks/useCreatorMemory.js
 *
 * Public API hook for consuming CreatorMemoryContext.
 * Components import this — not the context directly.
 * This abstraction makes it trivial to swap the underlying store later.
 */

export { useCreatorMemoryContext as useCreatorMemory } from '../context/CreatorMemoryContext';
