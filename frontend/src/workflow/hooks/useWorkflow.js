/**
 * workflow/hooks/useWorkflow.js
 *
 * Public API hook for consuming WorkflowContext.
 * Components import this — not the context directly.
 * This abstraction makes it trivial to swap the underlying store later.
 */

export { useWorkflowContext as useWorkflow } from '../context/WorkflowContext';
