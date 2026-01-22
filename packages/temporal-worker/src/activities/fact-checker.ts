// Mock: would use LLM + knowledge base for verification in production
// Returns deterministic results for same input - idempotent for retry safety

import { ApplicationFailure } from '@temporalio/activity';
import type { FactCheckerInput, FactCheckerOutput } from '@workflow-agent/shared';

async function simulateLatency(minMs: number, maxMs: number): Promise<void> {
  const delay = minMs + Math.random() * (maxMs - minMs);
  await new Promise((resolve) => setTimeout(resolve, delay));
}

function maybeThrowServiceError(failureRate: number = 0.05): void {
  if (Math.random() < failureRate) {
    throw ApplicationFailure.retryable(
      'Fact-check service temporarily unavailable (simulated)',
      'SERVICE_ERROR'
    );
  }
}

// Deterministic status based on claim content - same input = same output
function determineVerificationStatus(claim: string): 'verified' | 'unverified' | 'disputed' {
  const lowerClaim = claim.toLowerCase();

  if (
    lowerClaim.includes('significant') ||
    lowerClaim.includes('growing') ||
    lowerClaim.includes('development') ||
    lowerClaim.includes('research')
  ) {
    return 'verified';
  }

  if (
    lowerClaim.includes('challenge') ||
    lowerClaim.includes('remain') ||
    lowerClaim.includes('uncertain') ||
    lowerClaim.includes('debate')
  ) {
    return 'disputed';
  }

  return 'unverified';
}

function calculateConfidence(status: 'verified' | 'unverified' | 'disputed'): number {
  const baseConfidence = {
    verified: 0.85,
    unverified: 0.5,
    disputed: 0.6,
  };

  const variation = (Math.random() - 0.5) * 0.1;
  return Math.min(0.95, Math.max(0.3, baseConfidence[status] + variation));
}

export async function factChecker(input: FactCheckerInput): Promise<FactCheckerOutput> {
  const { claims, originalSources } = input;

  if (!claims || claims.length === 0) {
    throw ApplicationFailure.nonRetryable(
      'At least one claim is required for fact-checking',
      'INVALID_INPUT'
    );
  }

  console.log(`[factChecker] Verifying ${claims.length} claims against ${originalSources.length} sources`);

  await simulateLatency(1500, 3000);
  maybeThrowServiceError(0.05);

  const verifiedClaims = claims.map((claim, index) => {
    const status = determineVerificationStatus(claim);
    const confidence = calculateConfidence(status);

    return {
      claim,
      status,
      confidence: Math.round(confidence * 100) / 100,
      source: originalSources[index % originalSources.length],
    };
  });

  const summary = verifiedClaims.reduce(
    (acc, vc) => {
      acc[vc.status]++;
      return acc;
    },
    { verified: 0, unverified: 0, disputed: 0 }
  );

  console.log(
    `[factChecker] Verification complete: ${summary.verified} verified, ${summary.unverified} unverified, ${summary.disputed} disputed`
  );

  return { verifiedClaims };
}
