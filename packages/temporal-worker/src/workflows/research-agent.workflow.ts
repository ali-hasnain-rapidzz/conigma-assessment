// HEADS UP: This file runs in Temporal's sandboxed V8 - no Date.now(), Math.random(),
// or any I/O. All that stuff goes in activities. Temporal replays this code from history
// after crashes, so it has to produce the same commands every time.

import {
  proxyActivities,
  defineQuery,
  defineSignal,
  setHandler,
  ApplicationFailure,
} from '@temporalio/workflow';

// types only! importing actual activity code would break determinism
import type * as activities from '../activities';

import type {
  ResearchTaskInput,
  ResearchTaskResult,
  WorkflowProgress,
} from '@workflow-agent/shared';

const { webSearch } = proxyActivities<typeof activities>({
  startToCloseTimeout: '30s',
  retry: {
    initialInterval: '1s',
    backoffCoefficient: 2,
    maximumAttempts: 3,
    maximumInterval: '30s',
    nonRetryableErrorTypes: ['INVALID_INPUT'],
  },
});

const { contentExtractor } = proxyActivities<typeof activities>({
  startToCloseTimeout: '60s',
  retry: {
    initialInterval: '2s',
    backoffCoefficient: 2,
    maximumAttempts: 3,
    maximumInterval: '60s',
    nonRetryableErrorTypes: ['INVALID_INPUT'],
  },
});

const { summarizer } = proxyActivities<typeof activities>({
  startToCloseTimeout: '120s',
  retry: {
    initialInterval: '5s',
    backoffCoefficient: 2,
    maximumAttempts: 5, // LLMs get rate limited a lot
    maximumInterval: '60s',
    nonRetryableErrorTypes: ['INVALID_INPUT', 'CONTENT_POLICY_VIOLATION'],
  },
});

const { factChecker } = proxyActivities<typeof activities>({
  startToCloseTimeout: '60s',
  retry: {
    initialInterval: '2s',
    backoffCoefficient: 2,
    maximumAttempts: 3,
    maximumInterval: '30s',
    nonRetryableErrorTypes: ['INVALID_INPUT'],
  },
});

export const getProgressQuery = defineQuery<WorkflowProgress>('getProgress');
export const cancelResearchSignal = defineSignal('cancelResearch');

export async function researchAgentWorkflow(
  input: ResearchTaskInput
): Promise<ResearchTaskResult> {
  let progress: WorkflowProgress = {
    currentStep: 'starting',
    completedSteps: [],
    totalSteps: input.enableFactChecking !== false ? 4 : 3,
    startedAt: new Date().toISOString(),
  };

  let isCancelled = false;

  setHandler(cancelResearchSignal, () => {
    isCancelled = true;
  });

  setHandler(getProgressQuery, () => progress);

  const updateProgress = (step: WorkflowProgress['currentStep'], completedStep?: string) => {
    progress = {
      ...progress,
      currentStep: step,
      completedSteps: completedStep
        ? [...progress.completedSteps, completedStep]
        : progress.completedSteps,
    };
  };

  const createCancelledResult = (): ResearchTaskResult => ({
    status: 'cancelled',
    query: input.query,
    metadata: {
      cancelledAt: progress.currentStep,
      completedSteps: progress.completedSteps,
    },
  });

  try {
    if (!input.query || input.query.trim().length < 3) {
      throw ApplicationFailure.nonRetryable(
        'Query must be at least 3 characters',
        'INVALID_INPUT'
      );
    }

    const { query, maxSources = 5, enableFactChecking = true } = input;

    // Step 1: Search
    updateProgress('searching');
    const searchResults = await webSearch({ query, maxResults: maxSources });
    updateProgress('extracting', 'search');

    if (isCancelled) return createCancelledResult();

    // Step 2: Extract content
    const urls = searchResults.sources.map((source) => source.url);
    const extractedContent = await contentExtractor({ urls });
    updateProgress('summarizing', 'extraction');

    if (isCancelled) return createCancelledResult();

    // Step 3: Summarize
    const summaryResult = await summarizer({
      contents: extractedContent.contents.map((c) => ({
        url: c.url,
        title: c.title,
        mainText: c.mainText,
      })),
      originalQuery: query,
    });

    if (enableFactChecking) {
      updateProgress('fact-checking', 'summarization');
    } else {
      updateProgress('complete', 'summarization');
    }

    if (isCancelled) return createCancelledResult();

    // Step 4: Fact check (optional)
    let factCheckResult = null;
    if (enableFactChecking) {
      factCheckResult = await factChecker({
        claims: summaryResult.keyPoints,
        originalSources: urls,
      });
      updateProgress('complete', 'fact-check');
    }

    return {
      status: 'success',
      query,
      summary: summaryResult.summary,
      keyFindings: summaryResult.keyPoints,
      sources: searchResults.sources.map((s) => ({ url: s.url, title: s.title })),
      factCheck: factCheckResult ? { verifiedClaims: factCheckResult.verifiedClaims } : null,
      metadata: {
        sourcesAnalyzed: searchResults.sources.length,
        confidence: summaryResult.confidence,
        completedAt: new Date().toISOString(),
        completedSteps: progress.completedSteps,
      },
    };
  } catch (error) {
    updateProgress('failed');
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    return {
      status: 'failed',
      query: input.query,
      error: errorMessage,
      metadata: {
        failedAt: progress.currentStep,
        completedSteps: progress.completedSteps,
      },
    };
  }
}
