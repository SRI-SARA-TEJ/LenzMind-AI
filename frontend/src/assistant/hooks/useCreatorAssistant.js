/**
 * assistant/hooks/useCreatorAssistant.js
 *
 * Public API hook for consuming CreatorAssistantContext.
 * Components import this — not the context directly.
 * This abstraction makes it trivial to swap the underlying store later.
 */

export { useCreatorAssistantContext as useCreatorAssistant } from '../context/CreatorAssistantContext';
