// Mock: would use Puppeteer/Readability in production
// Assumes page content doesn't change between retries (mostly true for blogs/articles)

import { ApplicationFailure } from '@temporalio/activity';
import type { ContentExtractorInput, ContentExtractorOutput } from '@workflow-agent/shared';

async function simulateLatency(minMs: number, maxMs: number): Promise<void> {
  const delay = minMs + Math.random() * (maxMs - minMs);
  await new Promise((resolve) => setTimeout(resolve, delay));
}

function maybeThrowTransientError(failureRate: number = 0.05): void {
  if (Math.random() < failureRate) {
    throw ApplicationFailure.retryable(
      'Failed to extract content - connection timeout (simulated)',
      'EXTRACTION_ERROR'
    );
  }
}

function generateMockContent(url: string, index: number): ContentExtractorOutput['contents'][0] {
  const urlParts = url.split('/');
  const topic = decodeURIComponent(urlParts[urlParts.length - 1] || 'research topic')
    .replace(/-/g, ' ')
    .slice(0, 50);

  const contentVariations = [
    `This comprehensive article explores ${topic} in detail. Recent studies have shown significant advancements in this field, with researchers from leading institutions contributing groundbreaking work. The implications of these developments extend across multiple industries and have the potential to reshape how we approach related challenges. Key stakeholders have expressed optimism about future progress, citing increased investment and collaboration as driving factors.`,
    `An in-depth examination of ${topic} reveals several important trends. Industry experts have identified critical factors that are shaping the current landscape. Data from multiple sources indicates strong growth potential, with projections suggesting continued expansion over the next several years. Organizations are adapting their strategies to capitalize on emerging opportunities while mitigating associated risks.`,
    `The current state of ${topic} reflects years of research and development. Practitioners in the field have developed innovative approaches that address longstanding challenges. Case studies demonstrate successful implementation across various contexts, providing valuable lessons for future initiatives. The convergence of technology and expertise has accelerated progress beyond initial expectations.`,
    `Understanding ${topic} requires examining both historical context and current developments. Foundational work in this area has paved the way for today's advancements. Contemporary research builds upon established principles while introducing novel methodologies. The synthesis of traditional knowledge and modern techniques has yielded promising results that merit further investigation.`,
    `Expert analysis of ${topic} highlights both opportunities and challenges. While significant progress has been made, certain obstacles remain. Addressing these challenges will require coordinated effort from multiple stakeholders. However, the potential benefits justify continued investment in research and development, with long-term gains expected to outweigh short-term costs.`,
  ];

  return {
    url,
    title: `Article ${index + 1}: Insights on ${topic}`,
    mainText: contentVariations[index % contentVariations.length],
    extractedAt: new Date().toISOString(),
  };
}

export async function contentExtractor(input: ContentExtractorInput): Promise<ContentExtractorOutput> {
  const { urls } = input;

  if (!urls || urls.length === 0) {
    throw ApplicationFailure.nonRetryable(
      'At least one URL is required for content extraction',
      'INVALID_INPUT'
    );
  }

  console.log(`[contentExtractor] Extracting content from ${urls.length} URLs`);

  await simulateLatency(1000, 3000);
  maybeThrowTransientError(0.05);

  const contents = urls.map((url, index) => generateMockContent(url, index));

  console.log(`[contentExtractor] Successfully extracted content from ${contents.length} URLs`);

  return { contents };
}
