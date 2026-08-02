import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { readApplicantInfo, readDiscordConfig } from './clientConfig';

describe('clientConfig', () => {
  const originalWindow = global.window;

  beforeEach(() => {
    // Setup a mock window object if needed, but we can test without it
    // for the "typeof window === 'undefined'" case.
  });

  afterEach(() => {
    vi.restoreAllMocks();
    global.window = originalWindow;
  });

  describe('readApplicantInfo', () => {
    it('returns default fallback when window is undefined', () => {
      // Temporarily remove window
      // @ts-ignore
      delete global.window;

      const result = readApplicantInfo();
      expect(result).toEqual({ name: "", email: "" });
    });

    it('returns default fallback when localStorage item is null', () => {
      // Mock window and localStorage
      const mockGetItem = vi.fn().mockReturnValue(null);
      // @ts-ignore
      global.window = {
        localStorage: {
          getItem: mockGetItem,
        },
      };

      const result = readApplicantInfo();
      expect(mockGetItem).toHaveBeenCalledWith('cra:applicantInfo');
      expect(result).toEqual({ name: "", email: "" });
    });

    it('returns parsed object when localStorage item is valid JSON', () => {
      const validApplicant = { name: "John Doe", email: "john@example.com" };
      const mockGetItem = vi.fn().mockReturnValue(JSON.stringify(validApplicant));
      // @ts-ignore
      global.window = {
        localStorage: {
          getItem: mockGetItem,
        },
      };

      const result = readApplicantInfo();
      expect(mockGetItem).toHaveBeenCalledWith('cra:applicantInfo');
      expect(result).toEqual(validApplicant);
    });

    it('returns default fallback when localStorage item is invalid JSON', () => {
      const mockGetItem = vi.fn().mockReturnValue('{ bad json');
      // @ts-ignore
      global.window = {
        localStorage: {
          getItem: mockGetItem,
        },
      };

      const result = readApplicantInfo();
      expect(mockGetItem).toHaveBeenCalledWith('cra:applicantInfo');
      expect(result).toEqual({ name: "", email: "" });
    });
  });

  describe('readDiscordConfig', () => {
      it('returns null when localStorage item is invalid JSON', () => {
          const mockGetItem = vi.fn().mockReturnValue('{ bad json');
          // @ts-ignore
          global.window = {
              localStorage: {
                  getItem: mockGetItem,
              },
          };

          const result = readDiscordConfig();
          expect(mockGetItem).toHaveBeenCalledWith('cra:discordConfig');
          expect(result).toBeNull();
      });
  });
});
