'use client';

import type { ResearchTaskResult } from '@workflow-agent/shared';

interface ResultDisplayProps {
  result: ResearchTaskResult;
}

export function ResultDisplay({ result }: ResultDisplayProps) {
  if (result.status === 'failed') {
    return (
      <div style={styles.container}>
        <div style={styles.errorHeader}>
          <span style={styles.errorIcon}>⚠</span>
          <h3 style={styles.errorTitle}>Research Failed</h3>
        </div>
        <p style={styles.errorMessage}>{result.error || 'An unknown error occurred'}</p>
        {result.metadata.completedSteps && result.metadata.completedSteps.length > 0 && (
          <p style={styles.errorDetail}>
            Completed steps before failure: {result.metadata.completedSteps.join(', ')}
          </p>
        )}
      </div>
    );
  }

  if (result.status === 'cancelled') {
    return (
      <div style={styles.container}>
        <div style={styles.cancelledHeader}>
          <span style={styles.cancelledIcon}>⏹</span>
          <h3 style={styles.cancelledTitle}>Research Cancelled</h3>
        </div>
        <p style={styles.cancelledMessage}>
          The research was cancelled at step: {result.metadata.cancelledAt || 'unknown'}
        </p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <span style={styles.successIcon}>✓</span>
        <h3 style={styles.title}>Research Complete</h3>
        <span style={styles.confidence}>
          Confidence: {Math.round((result.metadata.confidence || 0) * 100)}%
        </span>
      </div>

      {/* Query */}
      <div style={styles.querySection}>
        <span style={styles.queryLabel}>Query:</span>
        <span style={styles.queryText}>{result.query}</span>
      </div>

      {/* Summary */}
      {result.summary && (
        <div style={styles.section}>
          <h4 style={styles.sectionTitle}>Summary</h4>
          <p style={styles.summaryText}>{result.summary}</p>
        </div>
      )}

      {/* Key Findings */}
      {result.keyFindings && result.keyFindings.length > 0 && (
        <div style={styles.section}>
          <h4 style={styles.sectionTitle}>Key Findings</h4>
          <ul style={styles.findingsList}>
            {result.keyFindings.map((finding, index) => (
              <li key={index} style={styles.findingItem}>
                {finding}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Fact Check Results */}
      {result.factCheck && result.factCheck.verifiedClaims.length > 0 && (
        <div style={styles.section}>
          <h4 style={styles.sectionTitle}>Fact Check Results</h4>
          <div style={styles.factCheckList}>
            {result.factCheck.verifiedClaims.map((claim, index) => (
              <div key={index} style={styles.factCheckItem}>
                <div style={styles.factCheckHeader}>
                  <span
                    style={{
                      ...styles.factCheckStatus,
                      backgroundColor: getStatusColor(claim.status),
                    }}
                  >
                    {claim.status.toUpperCase()}
                  </span>
                  <span style={styles.factCheckConfidence}>
                    {Math.round(claim.confidence * 100)}% confidence
                  </span>
                </div>
                <p style={styles.factCheckClaim}>{claim.claim}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sources */}
      {result.sources && result.sources.length > 0 && (
        <div style={styles.section}>
          <h4 style={styles.sectionTitle}>
            Sources ({result.metadata.sourcesAnalyzed || result.sources.length})
          </h4>
          <ul style={styles.sourcesList}>
            {result.sources.map((source, index) => (
              <li key={index} style={styles.sourceItem}>
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={styles.sourceLink}
                >
                  {source.title}
                </a>
                <span style={styles.sourceUrl}>{source.url}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Metadata */}
      <div style={styles.metadata}>
        {result.metadata.completedAt && (
          <span>Completed: {new Date(result.metadata.completedAt).toLocaleString()}</span>
        )}
      </div>
    </div>
  );
}

function getStatusColor(status: 'verified' | 'unverified' | 'disputed'): string {
  switch (status) {
    case 'verified':
      return '#22c55e';
    case 'disputed':
      return '#f59e0b';
    case 'unverified':
      return '#9ca3af';
    default:
      return '#9ca3af';
  }
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
    alignItems: 'center',
    gap: '0.75rem',
    marginBottom: '1rem',
    paddingBottom: '1rem',
    borderBottom: '1px solid #eee',
  },
  successIcon: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    backgroundColor: '#22c55e',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: 'bold',
  },
  title: {
    margin: 0,
    fontSize: '1.25rem',
    flex: 1,
  },
  confidence: {
    fontSize: '0.875rem',
    color: '#666',
    backgroundColor: '#f0f0f0',
    padding: '0.25rem 0.75rem',
    borderRadius: '12px',
  },
  querySection: {
    marginBottom: '1.5rem',
    padding: '0.75rem',
    backgroundColor: '#f8f9fa',
    borderRadius: '4px',
  },
  queryLabel: {
    fontWeight: 600,
    marginRight: '0.5rem',
  },
  queryText: {
    color: '#333',
  },
  section: {
    marginBottom: '1.5rem',
  },
  sectionTitle: {
    margin: '0 0 0.75rem 0',
    fontSize: '1rem',
    fontWeight: 600,
    color: '#333',
  },
  summaryText: {
    margin: 0,
    lineHeight: 1.6,
    color: '#444',
    whiteSpace: 'pre-wrap',
  },
  findingsList: {
    margin: 0,
    paddingLeft: '1.25rem',
  },
  findingItem: {
    marginBottom: '0.5rem',
    lineHeight: 1.5,
  },
  factCheckList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  factCheckItem: {
    padding: '0.75rem',
    backgroundColor: '#f8f9fa',
    borderRadius: '4px',
  },
  factCheckHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    marginBottom: '0.5rem',
  },
  factCheckStatus: {
    fontSize: '0.625rem',
    fontWeight: 700,
    color: '#fff',
    padding: '0.125rem 0.5rem',
    borderRadius: '4px',
  },
  factCheckConfidence: {
    fontSize: '0.75rem',
    color: '#666',
  },
  factCheckClaim: {
    margin: 0,
    fontSize: '0.875rem',
    lineHeight: 1.4,
  },
  sourcesList: {
    margin: 0,
    padding: 0,
    listStyle: 'none',
  },
  sourceItem: {
    marginBottom: '0.75rem',
    paddingBottom: '0.75rem',
    borderBottom: '1px solid #eee',
  },
  sourceLink: {
    display: 'block',
    color: '#0070f3',
    textDecoration: 'none',
    fontWeight: 500,
    marginBottom: '0.25rem',
  },
  sourceUrl: {
    fontSize: '0.75rem',
    color: '#999',
    wordBreak: 'break-all',
  },
  metadata: {
    marginTop: '1rem',
    paddingTop: '1rem',
    borderTop: '1px solid #eee',
    fontSize: '0.75rem',
    color: '#666',
  },
  // Error states
  errorHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    marginBottom: '1rem',
  },
  errorIcon: {
    fontSize: '1.5rem',
    color: '#ef4444',
  },
  errorTitle: {
    margin: 0,
    color: '#ef4444',
  },
  errorMessage: {
    margin: 0,
    color: '#666',
  },
  errorDetail: {
    marginTop: '0.5rem',
    fontSize: '0.875rem',
    color: '#999',
  },
  // Cancelled states
  cancelledHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    marginBottom: '1rem',
  },
  cancelledIcon: {
    fontSize: '1.5rem',
    color: '#f59e0b',
  },
  cancelledTitle: {
    margin: 0,
    color: '#f59e0b',
  },
  cancelledMessage: {
    margin: 0,
    color: '#666',
  },
};