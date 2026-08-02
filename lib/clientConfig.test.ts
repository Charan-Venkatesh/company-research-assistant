import { describe, it, expect, beforeEach, vi } from 'vitest';
import { readApplicantInfo } from './clientConfig';

describe('clientConfig', () => {
  describe('readApplicantInfo', () => {
    const APPLICANT_KEY = "cra:applicantInfo";

    beforeEach(() => {
      // Clear localStorage before each test
      window.localStorage.clear();
      vi.restoreAllMocks();
    });

    it('returns default object when window is undefined', () => {
      // Mock window as undefined
      const originalWindow = global.window;
      // @ts-expect-error - we need to delete global.window to test the undefined window case
      delete global.window;

      expect(readApplicantInfo()).toEqual({ name: "", email: "" });

      // Restore window
      global.window = originalWindow;
    });

    it('returns default object when localStorage has no data', () => {
      expect(readApplicantInfo()).toEqual({ name: "", email: "" });
    });

    it('returns parsed object when localStorage has valid JSON data', () => {
      const mockData = { name: "John Doe", email: "john@example.com" };
      window.localStorage.setItem(APPLICANT_KEY, JSON.stringify(mockData));

      expect(readApplicantInfo()).toEqual(mockData);
    });

    it('returns default object when localStorage has invalid JSON data', () => {
      window.localStorage.setItem(APPLICANT_KEY, "invalid-json");

      expect(readApplicantInfo()).toEqual({ name: "", email: "" });
    });

    it('handles localStorage throwing an error', () => {
      // Mock localStorage.getItem to throw an error
      const mockGetItem = vi.spyOn(window.localStorage, 'getItem').mockImplementation(() => {
        throw new Error("localStorage error");
      });

      expect(readApplicantInfo()).toEqual({ name: "", email: "" });

      mockGetItem.mockRestore();
    });
  });
});
