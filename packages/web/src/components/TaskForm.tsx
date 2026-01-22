'use client';

import { useState } from 'react';
import type { StartWorkflowResponse, ApiErrorResponse } from '@workflow-agent/shared';

interface TaskFormProps {
  onWorkflowStarted: (workflowId: string) => void;
  disabled?: boolean;
}

export function TaskForm({ onWorkflowStarted, disabled = false }: TaskFormProps) {
  const [query, setQuery] = useState('');
  const [maxSources, setMaxSources] = useState(5);
  const [enableFactChecking, setEnableFactChecking] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!query.trim() || query.trim().length < 3) {
      setError('Please enter a research topic (at least 3 characters)');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/workflow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task: {
            query: query.trim(),
            maxSources,
            enableFactChecking,
          },
        }),
      });

      const data: StartWorkflowResponse | ApiErrorResponse = await response.json();

      if (!response.ok || 'error' in data) {
        throw new Error('error' in data ? data.error : 'Failed to start workflow');
      }

      // Success - notify parent
      onWorkflowStarted(data.workflowId);
      setQuery('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start research');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      <div style={styles.field}>
        <label htmlFor="query" style={styles.label}>
          Research Topic
        </label>
        <input
          id="query"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g., Impact of AI on healthcare in 2024"
          disabled={disabled || isSubmitting}
          style={styles.input}
        />
      </div>

      <div style={styles.row}>
        <div style={styles.field}>
          <label htmlFor="maxSources" style={styles.label}>
            Max Sources
          </label>
          <select
            id="maxSources"
            value={maxSources}
            onChange={(e) => setMaxSources(Number(e.target.value))}
            disabled={disabled || isSubmitting}
            style={styles.select}
          >
            <option value={3}>3 sources</option>
            <option value={5}>5 sources</option>
            <option value={10}>10 sources</option>
          </select>
        </div>

        <div style={styles.field}>
          <label style={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={enableFactChecking}
              onChange={(e) => setEnableFactChecking(e.target.checked)}
              disabled={disabled || isSubmitting}
              style={styles.checkbox}
            />
            Enable Fact Checking
          </label>
        </div>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      <button
        type="submit"
        disabled={disabled || isSubmitting || !query.trim()}
        style={{
          ...styles.button,
          ...(disabled || isSubmitting || !query.trim() ? styles.buttonDisabled : {}),
        }}
      >
        {isSubmitting ? 'Starting Research...' : 'Start Research'}
      </button>
    </form>
  );
}

const styles: Record<string, React.CSSProperties> = {
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    padding: '1.5rem',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    backgroundColor: '#fafafa',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  row: {
    display: 'flex',
    gap: '1rem',
    alignItems: 'flex-end',
  },
  label: {
    fontWeight: 500,
    fontSize: '0.875rem',
  },
  input: {
    padding: '0.75rem',
    fontSize: '1rem',
    border: '1px solid #ccc',
    borderRadius: '4px',
    width: '100%',
  },
  select: {
    padding: '0.75rem',
    fontSize: '1rem',
    border: '1px solid #ccc',
    borderRadius: '4px',
    minWidth: '120px',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.875rem',
    cursor: 'pointer',
  },
  checkbox: {
    width: '18px',
    height: '18px',
  },
  button: {
    padding: '0.875rem 1.5rem',
    fontSize: '1rem',
    fontWeight: 600,
    color: '#fff',
    backgroundColor: '#0070f3',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
    cursor: 'not-allowed',
  },
  error: {
    padding: '0.75rem',
    backgroundColor: '#fee',
    color: '#c00',
    borderRadius: '4px',
    fontSize: '0.875rem',
  },
};