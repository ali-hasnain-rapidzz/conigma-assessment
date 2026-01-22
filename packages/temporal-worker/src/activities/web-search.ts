// Mock: would call Tavily/Google/Bing API in production
// Simulates ~10% transient failures to show off Temporal's retry

import { ApplicationFailure } from '@temporalio/activity';
import type { WebSearchInput, WebSearchOutput } from '@workflow-agent/shared';

async function simulateLatency(minMs: number, maxMs: number): Promise<void> {
  const delay = minMs + Math.random() * (maxMs - minMs);
  await new Promise((resolve) => setTimeout(resolve, delay));
}

function maybeThrowTransientError(failureRate: number = 0.1): void {
  if (Math.random() < failureRate) {
    throw ApplicationFailure.retryable(
      'Search API temporarily unavailable (simulated transient failure)',
      'TRANSIENT_ERROR'
    );
  }
}

function generateMockResults(query: string, maxResults: number): WebSearchOutput['sources'] {
  const baseResults = [
    {
      url: `https://example.com/research/${encodeURIComponent(query.slice(0, 20))}-overview`,
      title: `Comprehensive Overview: ${query}`,
      snippet: `This article provides a comprehensive overview of ${query}, covering the latest developments, key trends, and expert analysis from industry leaders.`,
    },
    {
      url: `https://example.com/analysis/${encodeURIComponent(query.slice(0, 20))}-deep-dive`,
      title: `Deep Dive Analysis: ${query}`,
      snippet: `An in-depth analysis examining the current state of ${query}, including statistical data, case studies, and future projections from leading researchers.`,
    },
    {
      url: `https://example.com/news/${encodeURIComponent(query.slice(0, 20))}-latest`,
      title: `Latest Developments in ${query}`,
      snippet: `Breaking news and recent developments related to ${query}. Stay updated with the most current information and expert commentary.`,
    },
    {
      url: `https://example.com/guide/${encodeURIComponent(query.slice(0, 20))}-complete-guide`,
      title: `The Complete Guide to ${query}`,
      snippet: `Everything you need to know about ${query}. This comprehensive guide covers fundamentals, advanced topics, and practical applications.`,
    },
    {
      url: `https://example.com/expert/${encodeURIComponent(query.slice(0, 20))}-expert-opinions`,
      title: `Expert Opinions on ${query}`,
      snippet: `Industry experts share their insights and predictions about ${query}. Learn from thought leaders and practitioners in the field.`,
    },
  ];

  return baseResults.slice(0, maxResults);
}

export async function webSearch(input: WebSearchInput): Promise<WebSearchOutput> {
  const { query, maxResults = 5 } = input;

  if (!query || query.trim().length < 2) {
    throw ApplicationFailure.nonRetryable(
      'Search query must be at least 2 characters',
      'INVALID_INPUT'
    );
  }

  console.log(`[webSearch] Starting search for: "${query}" (max ${maxResults} results)`);

  await simulateLatency(500, 1500);
  maybeThrowTransientError(0.1);

  const sources = generateMockResults(query, maxResults);

  console.log(`[webSearch] Found ${sources.length} results for: "${query}"`);

  return {
    sources,
    searchTimestamp: new Date().toISOString(),
  };
}
