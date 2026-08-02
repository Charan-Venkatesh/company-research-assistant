import { describe, it, expect, vi, beforeEach, afterEach, MockInstance } from 'vitest';
import { crawlWebsite } from '../crawler';

describe('crawlWebsite', () => {
  let fetchMock: MockInstance;

  beforeEach(() => {
    fetchMock = vi.spyOn(global, 'fetch');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return empty result for invalid URL', async () => {
    const result = await crawlWebsite('not-a-url');
    expect(result.pages).toHaveLength(0);
    expect(result.phone).toBeNull();
    expect(result.address).toBeNull();
  });

  it('should correctly fetch and extract basic page content', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      headers: new Headers({ 'content-type': 'text/html' }),
      text: async () => '<html><head><title>Test Title</title></head><body>Hello world</body></html>'
    });

    const result = await crawlWebsite('http://example.com');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result.pages).toHaveLength(1);
    expect(result.pages[0].title).toBe('Test Title');
    expect(result.pages[0].text).toContain('Hello world');
    expect(result.stats.pagesCrawled).toBe(1);
  });

  it('should extract contact hints (phone and address) correctly', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      headers: new Headers({ 'content-type': 'text/html' }),
      text: async () => `
        <html>
          <body>
            <p>Call us at: +1 (555) 123-4567</p>
            <div class="address">123 Test St, City, Country</div>
          </body>
        </html>
      `
    });

    const result = await crawlWebsite('http://example.com/contact');
    expect(result.phone).toBe('+1 (555) 123-4567');
    expect(result.address).toBe('123 Test St, City, Country');
    expect(result.phoneSource).toBe('http://example.com/contact');
    expect(result.addressSource).toBe('http://example.com/contact');
  });

  it('should discover priority links and ignore patterns', async () => {
    // Mock sequential fetch calls for home, about, and a regular link.
    fetchMock.mockImplementation(async (url: RequestInfo | URL) => {
      // Normalize url param since it may be a string or a Request object (or fetch param types)
      const urlStr = url.toString();
      // NOTE: Our crawler calls fetch with a string url
      if (urlStr === 'http://example.com' || urlStr === 'http://example.com/') {
        return {
          ok: true,
          headers: new Headers({ 'content-type': 'text/html' }),
          text: async () => `
            <html><body>
              <a href="/about">About Us</a>
              <a href="/login">Login</a>
              <a href="http://other.com">External</a>
            </body></html>
          `
        };
      } else if (urlStr.includes('/about')) {
        return {
          ok: true,
          headers: new Headers({ 'content-type': 'text/html' }),
          text: async () => '<html><body>About page content</body></html>'
        };
      }
      return { ok: false };
    });

    const result = await crawlWebsite('http://example.com');

    // It should visit home and about, ignore login and external
    expect(result.pages).toHaveLength(2);
    expect(result.pages.map(p => p.url)).toEqual([
      'http://example.com/',
      'http://example.com/about'
    ]);
    expect(result.stats.pagesIgnored).toBeGreaterThan(0);
  });

  it('should stop crawling after reaching MAX_PAGES (8)', async () => {
    // Generate lots of links on the homepage
    const manyLinks = Array.from({ length: 15 }, (_, i) => `<a href="/page${i}">Page ${i}</a>`).join('');

    fetchMock.mockImplementation(async (url: RequestInfo | URL) => {
      const urlStr = url.toString();
      if (urlStr === 'http://example.com' || urlStr === 'http://example.com/') {
        return {
          ok: true,
          headers: new Headers({ 'content-type': 'text/html' }),
          text: async () => `<html><body>${manyLinks}</body></html>`
        };
      } else {
        return {
          ok: true,
          headers: new Headers({ 'content-type': 'text/html' }),
          text: async () => '<html><body>Mock page</body></html>'
        };
      }
    });

    const result = await crawlWebsite('http://example.com');

    // 1 homepage + 7 internal pages = 8 total pages max
    expect(result.pages).toHaveLength(8);
    expect(result.stats.pagesCrawled).toBe(8);
  });
});
