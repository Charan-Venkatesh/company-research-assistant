import { generateReportPdf } from './pdfGenerator';
import type { ResearchResult } from './types';
import { describe, it, expect, vi } from 'vitest';
import PDFDocument from 'pdfkit';

describe('generateReportPdf', () => {
  const mockDate = new Date('2023-01-01T12:00:00Z').toISOString();

  const baseResult: ResearchResult = {
    company: {
      name: 'Test Company',
      website: 'https://test.com',
      phone: '123-456-7890',
      address: '123 Test St, Test City, TS 12345',
      productsServices: ['Product A', 'Service B'],
      summary: 'A company that makes tests.',
      painPoints: ['Slow tests', 'Flaky tests'],
    },
    competitors: [
      {
        name: 'Rival Corp',
        website: 'https://rival.com',
        reason: 'They also make tests.',
      }
    ],
    sourcesUsed: ['https://test.com'],
    crawledPages: ['https://test.com/about'],
    model: 'gpt-4o',
    provider: 'openrouter',
    generatedAt: mockDate,
  };

  it('generates a PDF buffer for a complete ResearchResult', async () => {
    const buffer = await generateReportPdf(baseResult);
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(0);
    // Basic PDF header signature check
    expect(buffer.toString('utf8', 0, 5)).toBe('%PDF-');
  });

  it('handles missing optional company information gracefully', async () => {
    const result: ResearchResult = {
      ...baseResult,
      company: {
        ...baseResult.company,
        phone: null,
        address: null,
      },
    };
    const buffer = await generateReportPdf(result);
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(0);
  });

  it('handles empty lists for productsServices, painPoints, and competitors', async () => {
    const result: ResearchResult = {
      ...baseResult,
      company: {
        ...baseResult.company,
        productsServices: [],
        painPoints: [],
      },
      competitors: [],
    };
    const buffer = await generateReportPdf(result);
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(0);
  });

  it('rejects the promise if PDF generation fails by mocking pdfkit', async () => {
    // We spy on a method of PDFDocument and force it to throw to test the catch block
    const spy = vi.spyOn(PDFDocument.prototype, 'text').mockImplementationOnce(() => {
      throw new Error("Mocked PDF error");
    });

    await expect(generateReportPdf(baseResult)).rejects.toThrow("Mocked PDF error");

    spy.mockRestore();
  });
});
