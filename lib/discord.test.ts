import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { sendReportToDiscord } from './discord';
import type { ApplicantInfo, DiscordConfig, ResearchResult } from './types';

describe('sendReportToDiscord', () => {
  const mockBuffer = Buffer.from('mock pdf data');
  const validConfig: DiscordConfig = { botToken: 'mock-token', channelId: 'mock-channel-id' };
  const applicant: ApplicantInfo = { name: 'John Doe', email: 'john@example.com' };
  const result: ResearchResult = {
    company: { name: 'Acme Corp', website: 'https://acme.com', description: 'A great company' },
    summary: 'Great summary',
    productsAndServices: ['Product A', 'Service B'],
    painPoints: ['Pain 1', 'Pain 2'],
    competitors: [{ name: 'Competitor X', website: 'https://x.com', analysis: 'Good' }],
    model: 'mock-model',
    generatedAt: '2023-01-01T00:00:00.000Z',
    sources: [],
  };

  const originalFetch = global.fetch;

  beforeEach(() => {
    // Reset global fetch before each test
    global.fetch = vi.fn();
  });

  afterEach(() => {
    // Restore global fetch after tests
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('should return error if botToken is missing', async () => {
    const response = await sendReportToDiscord(
      { botToken: '', channelId: 'mock-channel-id' },
      applicant,
      result,
      mockBuffer
    );
    expect(response).toEqual({ ok: false, error: 'Missing Discord bot token or channel ID.' });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('should return error if channelId is missing', async () => {
    const response = await sendReportToDiscord(
      { botToken: 'mock-token', channelId: '' },
      applicant,
      result,
      mockBuffer
    );
    expect(response).toEqual({ ok: false, error: 'Missing Discord bot token or channel ID.' });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('should handle missing applicant fields with fallbacks', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      status: 200,
    });
    const emptyApplicant = { name: '', email: '' };
    const emptyResult = {
        ...result,
        company: { name: 'Acme Corp', website: '', description: '' }
    };
    await sendReportToDiscord(validConfig, emptyApplicant, emptyResult, mockBuffer);
    const [, options] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    const body = options.body as FormData;
    const payloadJsonString = body.get('payload_json') as string;
    const payloadJson = JSON.parse(payloadJsonString);
    const embed = payloadJson.embeds[0];

    expect(embed.fields[0].value).toBe('Unknown'); // applicant name
    expect(embed.fields[1].value).toBe('Unknown'); // applicant email
    expect(embed.fields[2].value).toBe('Unknown'); // company website
  });

  it('should send a correct API request and return ok: true on success', async () => {
    // Mock fetch to return an ok response
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      status: 200,
    });

    const response = await sendReportToDiscord(validConfig, applicant, result, mockBuffer);

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(response).toEqual({ ok: true });

    // Verify the URL and basic options
    const [url, options] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toBe(`https://discord.com/api/v10/channels/${validConfig.channelId}/messages`);
    expect(options.method).toBe('POST');
    expect(options.headers).toEqual({ Authorization: `Bot ${validConfig.botToken}` });

    // Verify FormData body
    expect(options.body).toBeInstanceOf(FormData);
    const body = options.body as FormData;

    // Check payload_json
    const payloadJsonString = body.get('payload_json') as string;
    expect(payloadJsonString).toBeDefined();
    const payloadJson = JSON.parse(payloadJsonString);

    expect(payloadJson.embeds).toBeDefined();
    expect(payloadJson.embeds[0].title).toBe(`New Company Research Report — ${result.company.name}`);

    // Check files[0]
    const file = body.get('files[0]') as File | Blob;
    expect(file).toBeDefined();
    expect(file.type).toBe('application/pdf');
  });

  it('should handle API errors and return the error message', async () => {
    const errorBody = JSON.stringify({ message: 'Missing Access', code: 50001 });
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      status: 403,
      text: vi.fn().mockResolvedValue(errorBody),
    });

    const response = await sendReportToDiscord(validConfig, applicant, result, mockBuffer);

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(response).toEqual({
      ok: false,
      error: `Discord API error (403): ${errorBody}`,
    });
  });

  it('should handle API errors when res.text() fails', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      status: 500,
      text: vi.fn().mockRejectedValue(new Error('Cannot read body')),
    });

    const response = await sendReportToDiscord(validConfig, applicant, result, mockBuffer);

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(response).toEqual({
      ok: false,
      error: `Discord API error (500): `,
    });
  });

  it('should handle fetch throwing an exception (e.g. network error)', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Network error'));

    await expect(sendReportToDiscord(validConfig, applicant, result, mockBuffer))
      .rejects.toThrow('Network error');
  });
});
