// Single queue for now - would split into workflow/search/llm queues in prod
export const TASK_QUEUE = 'research-agent-queue';

export const TEMPORAL_ADDRESS = 'localhost:7233';
export const TEMPORAL_NAMESPACE = 'default';

export const WORKFLOW_EXECUTION_TIMEOUT = '10m';

export const ACTIVITY_TIMEOUTS = {
  webSearch: {
    startToCloseTimeout: '30s',
    retry: {
      initialInterval: '1s',
      backoffCoefficient: 2,
      maximumAttempts: 3,
      maximumInterval: '30s',
    },
  },
  contentExtractor: {
    startToCloseTimeout: '60s',
    retry: {
      initialInterval: '2s',
      backoffCoefficient: 2,
      maximumAttempts: 3,
      maximumInterval: '60s',
    },
  },
  summarizer: {
    startToCloseTimeout: '120s',
    retry: {
      initialInterval: '5s',
      backoffCoefficient: 2,
      maximumAttempts: 5, // LLM rate limits are real
      maximumInterval: '60s',
    },
  },
  factChecker: {
    startToCloseTimeout: '60s',
    retry: {
      initialInterval: '2s',
      backoffCoefficient: 2,
      maximumAttempts: 3,
      maximumInterval: '30s',
    },
  },
} as const;

export const WORKFLOW_STEPS = [
  'searching',
  'extracting',
  'summarizing',
  'fact-checking',
] as const;

export type WorkflowStep = (typeof WORKFLOW_STEPS)[number];
