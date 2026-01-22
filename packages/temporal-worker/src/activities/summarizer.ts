// Mock: would call Claude/GPT-4 in production
// Simulates ~8% rate limit errors - pretty common with LLM APIs

import { ApplicationFailure } from '@temporalio/activity';
import type { SummarizerInput, SummarizerOutput } from '@workflow-agent/shared';

async function simulateLatency(minMs: number, maxMs: number): Promise<void> {
  const delay = minMs + Math.random() * (maxMs - minMs);
  await new Promise((resolve) => setTimeout(resolve, delay));
}

function maybeThrowRateLimitError(failureRate: number = 0.08): void {
  if (Math.random() < failureRate) {
    throw ApplicationFailure.retryable(
      'LLM API rate limited - too many requests (simulated)',
      'RATE_LIMIT_ERROR'
    );
  }
}

function generateKeyPoints(originalQuery: string, sourceCount: number): string[] {
  return [
    `Research on "${originalQuery}" shows significant recent developments and growing interest from multiple sectors.`,
    `Analysis of ${sourceCount} sources reveals consistent themes around innovation, challenges, and future potential.`,
    `Expert consensus suggests continued growth and evolution in this area over the coming years.`,
    `Key stakeholders are actively investing in research and development related to ${originalQuery}.`,
    `While challenges remain, the overall trajectory appears positive based on available evidence.`,
  ];
}

function generateSummary(originalQuery: string, contents: SummarizerInput['contents']): string {
  const sourceCount = contents.length;

  return `Based on comprehensive analysis of ${sourceCount} sources regarding "${originalQuery}":

The research indicates significant and ongoing developments in this field. Multiple authoritative sources highlight the growing importance and relevance of this topic across various sectors and industries.

Key findings suggest that ${originalQuery} is experiencing a period of rapid evolution, driven by technological advancement, increased investment, and growing expertise. Stakeholders from academia, industry, and government are actively engaged in shaping the direction of progress.

The sources examined present a generally optimistic outlook while acknowledging existing challenges. Experts emphasize the need for continued research, collaboration, and thoughtful implementation to realize the full potential of developments in this area.

Overall, the evidence supports the conclusion that ${originalQuery} represents a significant area of focus with substantial implications for the future. Continued monitoring and engagement with emerging developments is recommended.`;
}

export async function summarizer(input: SummarizerInput): Promise<SummarizerOutput> {
  const { contents, originalQuery } = input;

  if (!contents || contents.length === 0) {
    throw ApplicationFailure.nonRetryable(
      'At least one content item is required for summarization',
      'INVALID_INPUT'
    );
  }

  if (!originalQuery || originalQuery.trim().length === 0) {
    throw ApplicationFailure.nonRetryable(
      'Original query is required for context',
      'INVALID_INPUT'
    );
  }

  console.log(`[summarizer] Summarizing ${contents.length} content items for query: "${originalQuery}"`);

  await simulateLatency(2000, 5000);
  maybeThrowRateLimitError(0.08);

  const summary = generateSummary(originalQuery, contents);
  const keyPoints = generateKeyPoints(originalQuery, contents.length);
  const confidence = Math.min(0.95, 0.7 + contents.length * 0.05);

  console.log(`[summarizer] Generated summary with ${keyPoints.length} key points (confidence: ${confidence.toFixed(2)})`);

  return {
    summary,
    keyPoints,
    sourceCount: contents.length,
    confidence,
  };
}
