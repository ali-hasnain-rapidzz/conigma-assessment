import { ResearchTaskInput, ResearchTaskResult, WorkflowProgress } from './workflow.types';

export interface StartWorkflowRequest {
  task: ResearchTaskInput;
}

export interface StartWorkflowResponse {
  workflowId: string;
  runId: string;
  status: 'started';
}

export interface WorkflowStatusResponse {
  workflowId: string;
  status: 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'TERMINATED' | 'TIMED_OUT';
  progress?: WorkflowProgress;
  result?: ResearchTaskResult;
  startTime?: string;
  closeTime?: string;
}

export interface ApiErrorResponse {
  error: string;
  code?: string;
  details?: Record<string, unknown>;
}

export function isApiError(response: unknown): response is ApiErrorResponse {
  return (
    typeof response === 'object' &&
    response !== null &&
    'error' in response &&
    typeof (response as ApiErrorResponse).error === 'string'
  );
}

export function isWorkflowRunning(status: WorkflowStatusResponse['status']): boolean {
  return status === 'RUNNING';
}

export function isWorkflowCompleted(status: WorkflowStatusResponse['status']): boolean {
  return status === 'COMPLETED';
}

export function isWorkflowFailed(status: WorkflowStatusResponse['status']): boolean {
  return status === 'FAILED' || status === 'TERMINATED' || status === 'TIMED_OUT';
}
