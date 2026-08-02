import {
  readDiscordConfig,
  writeDiscordConfig,
  readApplicantInfo,
  writeApplicantInfo
} from './clientConfig';

describe('clientConfig', () => {
  const DISCORD_KEY = 'cra:discordConfig';
  const APPLICANT_KEY = 'cra:applicantInfo';
  let originalWindow: typeof window;

  beforeEach(() => {
    window.localStorage.clear();
    jest.restoreAllMocks();
  });

  describe('readDiscordConfig', () => {
    it('should return null if window is undefined', () => {
      originalWindow = global.window;
      try {
        // @ts-ignore - intentional removal for testing
        delete global.window;
        expect(readDiscordConfig()).toBeNull();
      } finally {
        // Restore window
        global.window = originalWindow;
      }
    });

    it('should return null if no config is found in localStorage', () => {
      expect(readDiscordConfig()).toBeNull();
    });

    it('should parse and return the config from localStorage', () => {
      const mockConfig = { webhookUrl: 'https://example.com/webhook' };
      window.localStorage.setItem(DISCORD_KEY, JSON.stringify(mockConfig));

      expect(readDiscordConfig()).toEqual(mockConfig);
    });

    it('should return null and not throw if localStorage contains invalid JSON', () => {
      window.localStorage.setItem(DISCORD_KEY, 'invalid json{');

      expect(readDiscordConfig()).toBeNull();
    });
  });

  describe('writeDiscordConfig', () => {
    it('should write the config to localStorage as JSON string', () => {
      const mockConfig = { webhookUrl: 'https://example.com/webhook' };
      // @ts-ignore
      writeDiscordConfig(mockConfig);

      const stored = window.localStorage.getItem(DISCORD_KEY);
      expect(stored).toEqual(JSON.stringify(mockConfig));
    });
  });

  describe('readApplicantInfo', () => {
    it('should return default empty object if window is undefined', () => {
      originalWindow = global.window;
      try {
        // @ts-ignore
        delete global.window;
        expect(readApplicantInfo()).toEqual({ name: '', email: '' });
      } finally {
        global.window = originalWindow;
      }
    });

    it('should return default empty object if no config is found', () => {
      expect(readApplicantInfo()).toEqual({ name: '', email: '' });
    });

    it('should parse and return applicant info from localStorage', () => {
      const mockInfo = { name: 'John Doe', email: 'john@example.com' };
      window.localStorage.setItem(APPLICANT_KEY, JSON.stringify(mockInfo));

      expect(readApplicantInfo()).toEqual(mockInfo);
    });

    it('should return default empty object if localStorage contains invalid JSON', () => {
      window.localStorage.setItem(APPLICANT_KEY, 'invalid json{');

      expect(readApplicantInfo()).toEqual({ name: '', email: '' });
    });
  });

  describe('writeApplicantInfo', () => {
    it('should write the applicant info to localStorage as JSON string', () => {
      const mockInfo = { name: 'John Doe', email: 'john@example.com' };
      writeApplicantInfo(mockInfo);

      const stored = window.localStorage.getItem(APPLICANT_KEY);
      expect(stored).toEqual(JSON.stringify(mockInfo));
    });
  });
});
