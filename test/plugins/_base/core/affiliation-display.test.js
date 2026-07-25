//region plugins/_base/core/affiliation-display.test.js
import { beforeAll, describe, expect, it } from 'vitest';

describe('AffiliationDisplay (direct src import)', () =>
{
  let AffiliationDisplay;

  beforeAll(async () =>
  {
    // vanilla RMMZ core prototype extension (rmmz_core.js), not part of this plugin.
    Number.prototype.padZero = function(length)
    {
      return String(this)
        .padStart(length, '0');
    };

    ({ default: AffiliationDisplay } = await import('../../../../src/plugins/_base/core/AffiliationDisplay.js'));
  });

  describe('formatDelta', () =>
  {
    it('returns the plain ABSORB label when the absorbed rate is exactly baseline (100%)', () =>
    {
      // Arrange & Act
      const result = AffiliationDisplay.formatDelta(100, { absorbed: true });

      // Assert
      expect(result).toEqual({ value: 'ABSORB', colorIndex: 5 });
    });

    it('returns ABSORB with a signed delta when the absorbed rate differs from baseline', () =>
    {
      // Arrange & Act
      const result = AffiliationDisplay.formatDelta(150, { absorbed: true });

      // Assert
      expect(result.value).toBe('ABSORB (+0050%)');
      expect(result.colorIndex).toBe(5);
    });

    it('returns IMMUNE when the immune flag is set', () =>
    {
      // Arrange & Act
      const result = AffiliationDisplay.formatDelta(50, { immune: true });

      // Assert
      expect(result).toEqual({ value: 'IMMUNE', colorIndex: 7 });
    });

    it('returns IMMUNE when the rate is 0 or below, even without the immune flag', () =>
    {
      // Arrange & Act
      const result = AffiliationDisplay.formatDelta(0);

      // Assert
      expect(result).toEqual({ value: 'IMMUNE', colorIndex: 7 });
    });

    it('returns null when the rate matches the 100% baseline exactly', () =>
    {
      // Arrange & Act
      const result = AffiliationDisplay.formatDelta(100);

      // Assert
      expect(result).toBeNull();
    });

    it('returns IMMUNE via the dedicated diff<=-100 branch (rate just above 0, rounds to a 0 magnitude)', () =>
    {
      // Arrange- ratePercent=0.3 is > 0 so it passes the earlier ratePercent<=0 guard, but
      // rounds to 0, producing diff = round(0.3) - 100 = -100, hitting the diff<=-100 branch
      // rather than the earlier immune/ratePercent<=0 guard.
      const result = AffiliationDisplay.formatDelta(0.3);

      // Assert
      expect(result).toEqual({ value: 'IMMUNE', colorIndex: 7 });
    });

    it('uses colorIndex 10 for a positive (harmful) delta', () =>
    {
      // Arrange & Act
      const result = AffiliationDisplay.formatDelta(150);

      // Assert
      expect(result.colorIndex).toBe(10);
      expect(result.value).toBe('+0050%');
    });

    it('uses colorIndex 3 for a negative (beneficial) delta', () =>
    {
      // Arrange & Act
      const result = AffiliationDisplay.formatDelta(80);

      // Assert
      expect(result.colorIndex).toBe(3);
      expect(result.value).toBe('-0020%');
    });
  });

  describe('resolveDisplay', () =>
  {
    it('returns the formatted delta when one is produced', () =>
    {
      // Arrange & Act
      const result = AffiliationDisplay.resolveDisplay(150);

      // Assert
      expect(result.value).toBe('+0050%');
    });

    it('falls back to a zeroed baseline display when formatDelta returns null', () =>
    {
      // Arrange & Act
      const result = AffiliationDisplay.resolveDisplay(100);

      // Assert- zero reserves a leading space rather than a plus sign (see padSignedMagnitude).
      expect(result).toEqual({ value: ' 0000%', colorIndex: 0 });
    });
  });
});
//endregion plugins/_base/core/affiliation-display.test.js
