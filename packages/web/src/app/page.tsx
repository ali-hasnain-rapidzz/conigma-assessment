/**
 * Main Page - Workflow Agent UI
 *
 * This is the entry point for the research agent application.
 * Minimal but functional UI - this is a systems exercise, not a UI challenge.
 *
 * Flow:
 * 1. User enters a research topic
 * 2. Form submits to API, which starts a Temporal workflow
 * 3. Page polls for status updates, showing progress
 * 4. When complete, displays the research result
 */

'use client';

import { useState } from 'react';
import { TaskForm } from '@/components/TaskForm';
import { WorkflowStatus } from '@/components/WorkflowStatus';
import { ResultDisplay } from '@/components/ResultDisplay';
import { useWorkflowStatus, isTerminalStatus } from '@/hooks/useWorkflowStatus';

export default function Home() {
  const [currentWorkflowId, setCurrentWorkflowId] = useState<string | null>(null);
  const { status, loading, error } = useWorkflowStatus(currentWorkflowId);

  const isRunning = status?.status === 'RUNNING';
  const isComplete = status?.status === 'COMPLETED';
  const hasFailed = status?.status === 'FAILED' || status?.status === 'TERMINATED' || status?.status === 'TIMED_OUT';

  const handleWorkflowStarted = (workflowId: string) => {
    setCurrentWorkflowId(workflowId);
  };

  const handleNewResearch = () => {
    setCurrentWorkflowId(null);
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <h1 style={styles.title}>Workflow Agent</h1>
        <p style={styles.subtitle}>
          Temporal-backed research agent with multi-step orchestration
        </p>
      </header>

      {/* Main Content */}
      <main style={styles.main}>
        {/* Task Form - Hidden when workflow is running */}
        {!currentWorkflowId && (
          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>Start New Research</h2>
            <TaskForm onWorkflowStarted={handleWorkflowStarted} />
          </section>
        )}

        {/* Loading State */}
        {currentWorkflowId && loading && (
          <section style={styles.section}>
            <div style={styles.loading}>Loading workflow status...</div>
          </section>
        )}

        {/* Error State */}
        {error && (
          <section style={styles.section}>
            <div style={styles.error}>
              <strong>Error:</strong> {error}
              <button onClick={handleNewResearch} style={styles.retryButton}>
                Start Over
              </button>
            </div>
          </section>
        )}

        {/* Workflow Status */}
        {status && !loading && (
          <section style={styles.section}>
            <div style={styles.statusHeader}>
              <h2 style={styles.sectionTitle}>
                {isRunning ? 'Research in Progress' : isComplete ? 'Research Complete' : 'Research Status'}
              </h2>
              {isTerminalStatus(status.status) && (
                <button onClick={handleNewResearch} style={styles.newButton}>
                  New Research
                </button>
              )}
            </div>
            <WorkflowStatus status={status} />
          </section>
        )}

        {/* Result Display */}
        {status?.result && isTerminalStatus(status.status) && (
          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>Results</h2>
            <ResultDisplay result={status.result} />
          </section>
        )}
      </main>

      {/* Footer */}
      <footer style={styles.footer}>
        <div style={styles.footerLinks}>
          <a
            href="http://localhost:8081"
            target="_blank"
            rel="noopener noreferrer"
            style={styles.footerLink}
          >
            Temporal UI
          </a>
          <span style={styles.footerDivider}>|</span>
          <span style={styles.footerText}>
            Built with Next.js + Temporal
          </span>
        </div>
        <p style={styles.footerNote}>
          This is a systems and architecture exercise demonstrating Temporal workflow orchestration.
        </p>
      </footer>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '2rem',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    marginBottom: '2rem',
    textAlign: 'center',
  },
  title: {
    margin: '0 0 0.5rem 0',
    fontSize: '2rem',
    fontWeight: 700,
  },
  subtitle: {
    margin: 0,
    color: '#666',
    fontSize: '1rem',
  },
  main: {
    flex: 1,
  },
  section: {
    marginBottom: '2rem',
  },
  sectionTitle: {
    margin: '0 0 1rem 0',
    fontSize: '1.25rem',
    fontWeight: 600,
  },
  statusHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem',
  },
  loading: {
    padding: '2rem',
    textAlign: 'center',
    color: '#666',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
  },
  error: {
    padding: '1rem',
    backgroundColor: '#fee',
    color: '#c00',
    borderRadius: '8px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  retryButton: {
    padding: '0.5rem 1rem',
    backgroundColor: '#c00',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  newButton: {
    padding: '0.5rem 1rem',
    backgroundColor: '#0070f3',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.875rem',
  },
  footer: {
    marginTop: 'auto',
    paddingTop: '2rem',
    borderTop: '1px solid #eee',
    textAlign: 'center',
  },
  footerLinks: {
    marginBottom: '0.5rem',
  },
  footerLink: {
    color: '#0070f3',
    textDecoration: 'none',
  },
  footerDivider: {
    margin: '0 0.75rem',
    color: '#ccc',
  },
  footerText: {
    color: '#666',
    fontSize: '0.875rem',
  },
  footerNote: {
    margin: 0,
    fontSize: '0.75rem',
    color: '#999',
  },
};