export interface ResearchTaskInput {
  query: string;
  maxSources?: number;
  enableFactChecking?: boolean;
}

export interface ResearchTaskResult {
  status: 'success' | 'failed' | 'cancelled';
  query: string;
  summary?: string;
  keyFindings?: string[];
  sources?: Array<{
    url: string;
    title: string;
  }>;
  factCheck?: {
    verifiedClaims: Array<{
      claim: string;
      status: 'verified' | 'unverified' | 'disputed';
      confidence: number;
    }>;
  } | null;
  error?: string;
  metadata: {
    sourcesAnalyzed?: number;
    confidence?: number;
    completedAt?: string;
    failedAt?: string;
    cancelledAt?: string;
    completedSteps?: string[];
  };
}

export interface WorkflowProgress {
  currentStep: 'starting' | 'searching' | 'extracting' | 'summarizing' | 'fact-checking' | 'complete' | 'failed';
  completedSteps: string[];
  totalSteps: number;
  startedAt: string;
}
