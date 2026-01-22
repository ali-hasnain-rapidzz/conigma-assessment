'use client';

import type { WorkflowStatusResponse } from '@workflow-agent/shared';
import { getStatusText, getStepDisplayName, isTerminalStatus } from '@/hooks/useWorkflowStatus';

interface WorkflowStatusProps {
  status: WorkflowStatusResponse;
}

export function WorkflowStatus({ status }: WorkflowStatusProps) {
  const isTerminal = isTerminalStatus(status.status);
  const statusColor = getStatusColor(status.status);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.statusBadge}>
          <span
            style={{
              ...styles.statusDot,
              backgroundColor: statusColor,
              animation: status.status === 'RUNNING' ? 'pulse 1.5s infinite' : 'none',
            }}
          />
          <span style={{ color: statusColor, fontWeight: 600 }}>
            {getStatusText(status.status)}
          </span>
        </div>
        <span style={styles.workflowId}>ID: {status.workflowId}</span>
      </div>

      {/* Progress Steps */}
      {status.progress && (
        <div style={styles.progressSection}>
          <div style={styles.stepsContainer}>
            {renderProgressSteps(status.progress)}
          </div>
          <div style={styles.currentStep}>
            Current: <strong>{getStepDisplayName(status.progress.currentStep)}</strong>
          </div>
        </div>
      )}

      {/* Timing Info */}
      {status.startTime && (
        <div style={styles.timingInfo}>
          <span>Started: {formatTime(status.startTime)}</span>
          {status.closeTime && (
            <span>Completed: {formatTime(status.closeTime)}</span>
          )}
          {status.startTime && status.closeTime && (
            <span>Duration: {calculateDuration(status.startTime, status.closeTime)}</span>
          )}
        </div>
      )}

      {/* Pulse animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}

function renderProgressSteps(progress: NonNullable<WorkflowStatusResponse['progress']>) {
  const allSteps = ['search', 'extraction', 'summarization', 'fact-check'];
  const completedSet = new Set(progress.completedSteps);

  return (
    <div style={styles.steps}>
      {allSteps.map((step, index) => {
        const isCompleted = completedSet.has(step);
        const isCurrent = getStepFromProgress(progress.currentStep) === step;

        return (
          <div key={step} style={styles.stepItem}>
            <div
              style={{
                ...styles.stepCircle,
                backgroundColor: isCompleted ? '#22c55e' : isCurrent ? '#3b82f6' : '#e5e7eb',
                color: isCompleted || isCurrent ? '#fff' : '#9ca3af',
              }}
            >
              {isCompleted ? '✓' : index + 1}
            </div>
            <span
              style={{
                ...styles.stepLabel,
                color: isCompleted ? '#22c55e' : isCurrent ? '#3b82f6' : '#9ca3af',
                fontWeight: isCurrent ? 600 : 400,
              }}
            >
              {getStepLabel(step)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function getStepFromProgress(currentStep: string): string {
  const mapping: Record<string, string> = {
    searching: 'search',
    extracting: 'extraction',
    summarizing: 'summarization',
    'fact-checking': 'fact-check',
  };
  return mapping[currentStep] || currentStep;
}

function getStepLabel(step: string): string {
  const labels: Record<string, string> = {
    search: 'Search',
    extraction: 'Extract',
    summarization: 'Summarize',
    'fact-check': 'Verify',
  };
  return labels[step] || step;
}

function getStatusColor(status: WorkflowStatusResponse['status']): string {
  switch (status) {
    case 'RUNNING':
      return '#3b82f6';
    case 'COMPLETED':
      return '#22c55e';
    case 'FAILED':
    case 'TERMINATED':
    case 'TIMED_OUT':
      return '#ef4444';
    case 'CANCELLED':
      return '#f59e0b';
    default:
      return '#9ca3af';
  }
}

function formatTime(isoString: string): string {
  return new Date(isoString).toLocaleTimeString();
}

function calculateDuration(start: string, end: string): string {
  const ms = new Date(end).getTime() - new Date(start).getTime();
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '1.5rem',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    backgroundColor: '#fff',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem',
  },
  statusBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  statusDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
  },
  workflowId: {
    fontSize: '0.75rem',
    color: '#666',
    fontFamily: 'monospace',
  },
  progressSection: {
    marginTop: '1rem',
  },
  stepsContainer: {
    marginBottom: '0.75rem',
  },
  steps: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stepItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.5rem',
  },
  stepCircle: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.875rem',
    fontWeight: 600,
  },
  stepLabel: {
    fontSize: '0.75rem',
  },
  currentStep: {
    textAlign: 'center',
    fontSize: '0.875rem',
    color: '#666',
    marginTop: '0.5rem',
  },
  timingInfo: {
    display: 'flex',
    gap: '1.5rem',
    marginTop: '1rem',
    paddingTop: '1rem',
    borderTop: '1px solid #eee',
    fontSize: '0.75rem',
    color: '#666',
  },
};