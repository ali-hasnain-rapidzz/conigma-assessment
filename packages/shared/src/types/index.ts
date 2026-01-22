/**
 * Type Exports
 *
 * Central export point for all shared types.
 */

// Workflow types
export type {
  ResearchTaskInput,
  ResearchTaskResult,
  WorkflowProgress,
} from './workflow.types';

// Activity types
export type {
  // Web Search
  WebSearchInput,
  WebSearchOutput,
  WebSearchActivity,
  // Content Extractor
  ContentExtractorInput,
  ContentExtractorOutput,
  ContentExtractorActivity,
  // Summarizer
  SummarizerInput,
  SummarizerOutput,
  SummarizerActivity,
  // Fact Checker
  FactCheckerInput,
  FactCheckerOutput,
  FactCheckerActivity,
  // Combined
  Activities,
} from './activities.types';

// API types
export type {
  StartWorkflowRequest,
  StartWorkflowResponse,
  WorkflowStatusResponse,
  ApiErrorResponse,
} from './api.types';

// Type guards
export {
  isApiError,
  isWorkflowRunning,
  isWorkflowCompleted,
  isWorkflowFailed,
} from './api.types';