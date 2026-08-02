import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { writeApplicantInfo } from './clientConfig';
import type { ApplicantInfo } from './types';

describe('clientConfig', () => {
  describe('writeApplicantInfo', () => {
    let setItemMock: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      // Mock window.localStorage.setItem
      setItemMock = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {});
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should correctly stringify and store applicant info in localStorage under the right key', () => {
      const applicantInfo: ApplicantInfo = {
        name: 'John Doe',
        email: 'john.doe@example.com'
      };

      writeApplicantInfo(applicantInfo);

      expect(setItemMock).toHaveBeenCalledTimes(1);
      expect(setItemMock).toHaveBeenCalledWith('cra:applicantInfo', JSON.stringify(applicantInfo));
    });

    it('should store empty object values correctly', () => {
      const emptyInfo = { name: '', email: '' };

      writeApplicantInfo(emptyInfo);

      expect(setItemMock).toHaveBeenCalledTimes(1);
      expect(setItemMock).toHaveBeenCalledWith('cra:applicantInfo', JSON.stringify(emptyInfo));
    });
  });
});
