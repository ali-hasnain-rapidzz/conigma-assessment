'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { WorkflowStatusResponse } from '@workflow-agent/shared';

const POLLING_INTERVAL = 2000; // 2s - good enough, simpler than websockets

interface UseWorkflowStatusResult {
  status: WorkflowStatusResponse | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useWorkflowStatus(workflowId: string | null): UseWorkflowStatusResult {
  const [status, setStatus] = useState<WorkflowStatusResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(true);

  const fetchStatus = useCallback(async () => {
    if (!workflowId) return;

    try {
      const response = await fetch(`/api/workflow/${workflowId}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch workflow status');
      }

      const data: WorkflowStatusResponse = await response.json();

      if (isMountedRef.current) {
        setStatus(data);
        setError(null);
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
    }
  }, [workflowId]);

  useEffect(() => {
    isMountedRef.current = true;

    if (!workflowId) {
      setStatus(null);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    fetchStatus().finally(() => {
      if (isMountedRef.current) {
        setLoading(false);
      }
    });

    const intervalId = setInterval(() => {
      if (status?.status === 'RUNNING' || status === null) {
        fetchStatus();
      }
    }, POLLING_INTERVAL);

    return () => {
      isMountedRef.current = false;
      clearInterval(intervalId);
    };
  }, [workflowId, fetchStatus, status?.status]);

  return { status, loading, error, refetch: fetchStatus };
}

export function isTerminalStatus(status: WorkflowStatusResponse['status'] | undefined): boolean {
  if (!status) return false;
  return ['COMPLETED', 'FAILED', 'CANCELLED', 'TERMINATED', 'TIMED_OUT'].includes(status);
}

export function getStatusText(status: WorkflowStatusResponse['status'] | undefined): string {
  switch (status) {
    case 'RUNNING': return 'Running';
    case 'COMPLETED': return 'Completed';
    case 'FAILED': return 'Failed';
    case 'CANCELLED': return 'Cancelled';
    case 'TERMINATED': return 'Terminated';
    case 'TIMED_OUT': return 'Timed Out';
    default: return 'Unknown';
  }
}

export function getStepDisplayName(step: string): string {
  const stepNames: Record<string, string> = {
    starting: 'Starting',
    searching: 'Searching Web',
    extracting: 'Extracting Content',
    summarizing: 'Summarizing',
    'fact-checking': 'Fact Checking',
    complete: 'Complete',
    failed: 'Failed',
  };
  return stepNames[step] || step;
}
