import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runResearchPipeline, PipelineCallbacks } from './pipeline';
import * as serper from './serper';
import * as crawler from './crawler';
import * as aiProvider from './aiProvider';

// Mock dependencies
vi.mock('./serper', () => ({
  findOfficialWebsite: vi.fn(),
  gatherCompanyFacts: vi.fn(),
  searchCompetitors: vi.fn(),
  hostnameOf: vi.fn((url: string) => {
    try { return new URL(url).hostname; } catch { return url; }
  }),
}));

vi.mock('./crawler', () => ({
  crawlWebsite: vi.fn(),
}));

vi.mock('./aiProvider', () => ({
  analyzeCompany: vi.fn(),
  identifyCompetitors: vi.fn(),
}));

describe('runResearchPipeline', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockCallbacks: PipelineCallbacks = {
    onProgress: vi.fn(),
  };

  const defaultAnalysis = {
    industry: 'Technology',
    country: 'USA',
    productsServices: ['Software'],
    summary: 'A tech company',
    painPoints: ['High cost'],
    targetCustomers: ['Enterprises'],
    confidenceScore: 90,
  };

  it('should resolve input when a valid URL is provided', async () => {
    // Setup mocks
    vi.mocked(crawler.crawlWebsite).mockResolvedValue({
      pages: [],
      stats: { totalPages: 0, failedPages: 0, skippedPages: 0 },
    });
    vi.mocked(serper.gatherCompanyFacts).mockResolvedValue(null as any);
    vi.mocked(aiProvider.analyzeCompany).mockResolvedValue(defaultAnalysis);
    vi.mocked(serper.searchCompetitors).mockResolvedValue([]);
    vi.mocked(aiProvider.identifyCompetitors).mockResolvedValue([]);

    const result = await runResearchPipeline('https://example.com', 'model-a', 'openrouter', mockCallbacks);

    expect(result.company.website).toBe('https://example.com');
    expect(result.company.name).toBe('Example'); // Extracted from URL example.com -> Example
    expect(serper.findOfficialWebsite).not.toHaveBeenCalled();
    expect(mockCallbacks.onProgress).toHaveBeenCalledWith('resolve', 'done', 'https://example.com');
  });

  it('should resolve input when a company name is provided using findOfficialWebsite', async () => {
    vi.mocked(serper.findOfficialWebsite).mockResolvedValue({
      website: 'https://acme.com',
      source: 'organic',
    });
    vi.mocked(crawler.crawlWebsite).mockResolvedValue({
      pages: [],
      stats: { totalPages: 0, failedPages: 0, skippedPages: 0 },
    });
    vi.mocked(serper.gatherCompanyFacts).mockResolvedValue(null as any);
    vi.mocked(aiProvider.analyzeCompany).mockResolvedValue(defaultAnalysis);
    vi.mocked(serper.searchCompetitors).mockResolvedValue([]);
    vi.mocked(aiProvider.identifyCompetitors).mockResolvedValue([]);

    const result = await runResearchPipeline('Acme Corp', 'model-a', 'openrouter', mockCallbacks);

    expect(serper.findOfficialWebsite).toHaveBeenCalledWith('Acme Corp');
    expect(result.company.website).toBe('https://acme.com');
    expect(result.sourcesUsed).toContain('serper:organic');
  });

  it('should throw an error if findOfficialWebsite fails to resolve a website', async () => {
    vi.mocked(serper.findOfficialWebsite).mockResolvedValue(null);

    await expect(runResearchPipeline('Unknown Corp', 'model-a', 'openrouter', mockCallbacks)).rejects.toThrow(
      'Could not find an official website for "Unknown Corp"'
    );
    expect(mockCallbacks.onProgress).toHaveBeenCalledWith('resolve', 'error', 'Could not resolve an official website.');
  });

  it('should use phone and address from crawl if available, overriding knowledge graph', async () => {
    vi.mocked(crawler.crawlWebsite).mockResolvedValue({
      pages: [],
      stats: { totalPages: 0, failedPages: 0, skippedPages: 0 },
      phone: '123-456-7890',
      phoneSource: 'crawler',
      address: '123 Web St',
      addressSource: 'crawler',
    });
    vi.mocked(serper.gatherCompanyFacts).mockResolvedValue({
      general: { knowledgeGraph: {} },
      contact: { knowledgeGraph: { attributes: { 'Phone': '999-999-9999', 'Address': '999 KG St' } } }
    } as any);
    vi.mocked(aiProvider.analyzeCompany).mockResolvedValue(defaultAnalysis);
    vi.mocked(serper.searchCompetitors).mockResolvedValue([]);
    vi.mocked(aiProvider.identifyCompetitors).mockResolvedValue([]);

    const result = await runResearchPipeline('https://test.com', 'model-a', 'openrouter', mockCallbacks);

    expect(result.company.phone).toBe('123-456-7890');
    expect(result.company.phoneSource).toBe('crawler');
    expect(result.company.address).toBe('123 Web St');
    expect(result.company.addressSource).toBe('crawler');
  });

  it('should fallback to knowledge graph if crawl does not provide phone and address', async () => {
    vi.mocked(crawler.crawlWebsite).mockResolvedValue({
      pages: [],
      stats: { totalPages: 0, failedPages: 0, skippedPages: 0 },
      // phone and address missing
    });
    vi.mocked(serper.gatherCompanyFacts).mockResolvedValue({
      general: { knowledgeGraph: {} },
      contact: { knowledgeGraph: { attributes: { 'Phone': '999-999-9999', 'Address': '999 KG St' } } }
    } as any);
    vi.mocked(aiProvider.analyzeCompany).mockResolvedValue(defaultAnalysis);
    vi.mocked(serper.searchCompetitors).mockResolvedValue([]);
    vi.mocked(aiProvider.identifyCompetitors).mockResolvedValue([]);

    const result = await runResearchPipeline('https://test.com', 'model-a', 'openrouter', mockCallbacks);

    expect(result.company.phone).toBe('999-999-9999');
    expect(result.company.phoneSource).toBe('knowledge_graph');
    expect(result.company.address).toBe('999 KG St');
    expect(result.company.addressSource).toBe('knowledge_graph');
  });

  it('should perform competitor analysis when competitors are found in search', async () => {
    vi.mocked(crawler.crawlWebsite).mockResolvedValue({
      pages: [{ title: 'Home', url: 'https://comp.com', text: 'welcome' }],
      stats: { totalPages: 1, failedPages: 0, skippedPages: 0 },
    });
    vi.mocked(serper.gatherCompanyFacts).mockResolvedValue(null as any);
    vi.mocked(aiProvider.analyzeCompany).mockResolvedValue(defaultAnalysis);

    vi.mocked(serper.searchCompetitors).mockResolvedValue([
      { title: 'Competitor 1', link: 'https://c1.com', snippet: 'Comp 1 snippet' }
    ] as any);
    vi.mocked(aiProvider.identifyCompetitors).mockResolvedValue([
      { name: 'Competitor 1', website: 'https://c1.com', reason: 'They do similar things' }
    ]);

    const result = await runResearchPipeline('https://comp.com', 'model-a', 'openrouter', mockCallbacks);

    expect(serper.searchCompetitors).toHaveBeenCalled();
    expect(aiProvider.identifyCompetitors).toHaveBeenCalled();
    expect(result.competitors.length).toBe(1);
    expect(result.competitors[0].name).toBe('Competitor 1');
    expect(result.sourcesUsed).toContain('serper:competitor_search');
  });
});
