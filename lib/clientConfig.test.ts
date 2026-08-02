import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { readDiscordConfig, writeDiscordConfig, readApplicantInfo, writeApplicantInfo } from './clientConfig';

describe('clientConfig', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('writeDiscordConfig', () => {
    it('should write discord config to localStorage as JSON', () => {
      const config = { botToken: 'test-token', channelId: 'test-channel' };
      writeDiscordConfig(config);

      const stored = window.localStorage.getItem('cra:discordConfig');
      expect(stored).toBe(JSON.stringify(config));
    });

    it('should overwrite existing discord config in localStorage', () => {
      window.localStorage.setItem('cra:discordConfig', JSON.stringify({ botToken: 'old', channelId: 'old' }));
      const config = { botToken: 'new-token', channelId: 'new-channel' };
      writeDiscordConfig(config);

      const stored = window.localStorage.getItem('cra:discordConfig');
      expect(stored).toBe(JSON.stringify(config));
    });
  });

  describe('readDiscordConfig', () => {
    it('should read discord config from localStorage', () => {
      const config = { botToken: 'test-token', channelId: 'test-channel' };
      window.localStorage.setItem('cra:discordConfig', JSON.stringify(config));

      const result = readDiscordConfig();
      expect(result).toEqual(config);
    });

    it('should return null if nothing is stored', () => {
      const result = readDiscordConfig();
      expect(result).toBeNull();
    });

    it('should return null if JSON is invalid', () => {
      window.localStorage.setItem('cra:discordConfig', 'invalid-json');
      const result = readDiscordConfig();
      expect(result).toBeNull();
    });

    it('should return null if window is undefined', () => {
      // Mock window to be undefined
      const originalWindow = global.window;
      // @ts-ignore
      delete global.window;

      const result = readDiscordConfig();
      expect(result).toBeNull();

      global.window = originalWindow;
    });
  });

  describe('writeApplicantInfo', () => {
    it('should write applicant info to localStorage as JSON', () => {
      const info = { name: 'John Doe', email: 'john@example.com' };
      writeApplicantInfo(info);

      const stored = window.localStorage.getItem('cra:applicantInfo');
      expect(stored).toBe(JSON.stringify(info));
    });
  });

  describe('readApplicantInfo', () => {
    it('should read applicant info from localStorage', () => {
      const info = { name: 'John Doe', email: 'john@example.com' };
      window.localStorage.setItem('cra:applicantInfo', JSON.stringify(info));

      const result = readApplicantInfo();
      expect(result).toEqual(info);
    });

    it('should return default empty info if nothing is stored', () => {
      const result = readApplicantInfo();
      expect(result).toEqual({ name: '', email: '' });
    });

    it('should return default empty info if JSON is invalid', () => {
      window.localStorage.setItem('cra:applicantInfo', 'invalid-json');
      const result = readApplicantInfo();
      expect(result).toEqual({ name: '', email: '' });
    });

    it('should return default empty info if window is undefined', () => {
      const originalWindow = global.window;
      // @ts-ignore
      delete global.window;

      const result = readApplicantInfo();
      expect(result).toEqual({ name: '', email: '' });

      global.window = originalWindow;
    });
  });
});
