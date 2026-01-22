// Activity types live here (not with implementations) so workflows can import
// them without pulling in activity code - that would break determinism

export interface WebSearchInput {
  query: string;
  maxResults?: number;
}

export interface WebSearchOutput {
  sources: Array<{
    url: string;
    title: string;
    snippet: string;
  }>;
  searchTimestamp: string;
}

export interface ContentExtractorInput {
  urls: string[];
}

export interface ContentExtractorOutput {
  contents: Array<{
    url: string;
    title: string;
    mainText: string;
    extractedAt: string;
  }>;
}

export interface SummarizerInput {
  contents: Array<{
    url: string;
    title: string;
    mainText: string;
  }>;
  originalQuery: string;
}

export interface SummarizerOutput {
  summary: string;
  keyPoints: string[];
  sourceCount: number;
  confidence: number;
}

export interface FactCheckerInput {
  claims: string[];
  originalSources: string[];
}

export interface FactCheckerOutput {
  verifiedClaims: Array<{
    claim: string;
    status: 'verified' | 'unverified' | 'disputed';
    confidence: number;
    source?: string;
  }>;
}

export type WebSearchActivity = (input: WebSearchInput) => Promise<WebSearchOutput>;
export type ContentExtractorActivity = (input: ContentExtractorInput) => Promise<ContentExtractorOutput>;
export type SummarizerActivity = (input: SummarizerInput) => Promise<SummarizerOutput>;
export type FactCheckerActivity = (input: FactCheckerInput) => Promise<FactCheckerOutput>;

export interface Activities {
  webSearch: WebSearchActivity;
  contentExtractor: ContentExtractorActivity;
  summarizer: SummarizerActivity;
  factChecker: FactCheckerActivity;
}
