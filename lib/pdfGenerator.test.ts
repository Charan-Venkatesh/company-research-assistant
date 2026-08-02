import { describe, it, expect, vi } from 'vitest';
import { generateReportPdf } from './pdfGenerator';
import type { ResearchResult } from './types';

vi.mock('pdfkit', () => {
  return {
    default: class MockPDFDocument {
      constructor() {
        throw new Error('PDFKit initialization failed');
      }
    }
  };
});

describe('generateReportPdf error handling', () => {
  it('should reject with an error when PDFDocument initialization fails', async () => {
    const dummyResult = {
      company: {
        name: 'Test',
        website: 'test.com',
        summary: 'A test company',
        productsServices: [],
        painPoints: []
      },
      competitors: [],
      generatedAt: new Date().toISOString(),
      model: 'test-model'
    } as ResearchResult;

    await expect(generateReportPdf(dummyResult)).rejects.toThrow('PDFKit initialization failed');
  });
});
