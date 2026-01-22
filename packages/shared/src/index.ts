// Types
export type {
  ResearchTaskInput,
  ResearchTaskResult,
  WorkflowProgress,
} from './types/workflow.types';

export type {
  WebSearchInput,
  WebSearchOutput,
  WebSearchActivity,
  ContentExtractorInput,
  ContentExtractorOutput,
  ContentExtractorActivity,
  SummarizerInput,
  SummarizerOutput,
  SummarizerActivity,
  FactCheckerInput,
  FactCheckerOutput,
  FactCheckerActivity,
  Activities,
} from './types/activities.types';

export type {
  StartWorkflowRequest,
  StartWorkflowResponse,
  WorkflowStatusResponse,
  ApiErrorResponse,
} from './types/api.types';

export {
  isApiError,
  isWorkflowRunning,
  isWorkflowCompleted,
  isWorkflowFailed,
} from './types/api.types';

// Constants
export {
  TASK_QUEUE,
  TEMPORAL_ADDRESS,
  TEMPORAL_NAMESPACE,
  WORKFLOW_EXECUTION_TIMEOUT,
  ACTIVITY_TIMEOUTS,
  WORKFLOW_STEPS,
} from './constants';

export type { WorkflowStep } from './constants';
