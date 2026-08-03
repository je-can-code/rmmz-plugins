//region plugins/_base/managers/trait-manager.test.js
import { beforeAll, describe, expect, it } from 'vitest';

describe('TraitManager (direct src import)', () =>
{
  let TraitManager;

  beforeAll(async () =>
  {
    globalThis.TextManager = {
      xparam: (id) => `xparam-${id}`,
    };

    ({ default: TraitManager } = await import('../../../../../src/plugins/_base/core/managers/TraitManager.js'));
  });

  describe('constructor', () =>
  {
    it('throws because it is a static class', () =>
    {
      // Arrange & Act
      const attempt = () => new TraitManager();

      // Assert
      expect(attempt).toThrow('This is a static class.');
    });
  });

  describe('slipName', () =>
  {
    it('returns "HP Poison" for a positive hp slip', () =>
    {
      // Arrange & Act
      const result = TraitManager.slipName('hp', 5);

      // Assert
      expect(result).toBe('HP Poison');
    });

    it('returns the hp regen label for a negative hp slip', () =>
    {
      // Arrange & Act
      const result = TraitManager.slipName('hp', -5);

      // Assert
      expect(result).toBe('xparam-7');
    });

    it('returns "MP Leak" for a positive mp slip', () =>
    {
      // Arrange & Act
      const result = TraitManager.slipName('mp', 5);

      // Assert
      expect(result).toBe('MP Leak');
    });

    it('returns the mp regen label for a negative mp slip', () =>
    {
      // Arrange & Act
      const result = TraitManager.slipName('mp', -5);

      // Assert
      expect(result).toBe('xparam-8');
    });

    it('returns "TP Drain" for a positive tp slip', () =>
    {
      // Arrange & Act
      const result = TraitManager.slipName('tp', 5);

      // Assert
      expect(result).toBe('TP Drain');
    });

    it('returns the tp regen label for a negative tp slip', () =>
    {
      // Arrange & Act
      const result = TraitManager.slipName('tp', -5);

      // Assert
      expect(result).toBe('xparam-9');
    });

    it('returns the generic "Slip" fallback for an unknown resource type', () =>
    {
      // Arrange & Act
      const result = TraitManager.slipName('unknown', 5);

      // Assert
      expect(result).toBe('Slip');
    });
  });

  describe('slipIcon', () =>
  {
    it('returns the poison icon for a positive hp slip', () =>
    {
      // Arrange & Act
      const result = TraitManager.slipIcon('hp', 5);

      // Assert
      expect(result).toBe(2);
    });

    it('returns the hp regen icon for a negative hp slip', () =>
    {
      // Arrange & Act- real IconManager.xparam(7) resolves to the hrg icon.
      const result = TraitManager.slipIcon('hp', -5);

      // Assert
      expect(result).toBeTypeOf('number');
    });

    it('returns the mp drain icon for a positive mp slip', () =>
    {
      // Arrange & Act
      const result = TraitManager.slipIcon('mp', 5);

      // Assert
      expect(result).toBe(67);
    });

    it('returns the mp regen icon for a negative mp slip', () =>
    {
      // Arrange & Act
      const result = TraitManager.slipIcon('mp', -5);

      // Assert
      expect(result).toBeTypeOf('number');
    });

    it('returns the tp drain icon for a positive tp slip', () =>
    {
      // Arrange & Act
      const result = TraitManager.slipIcon('tp', 5);

      // Assert
      expect(result).toBe(11);
    });

    it('returns the tp regen icon for a negative tp slip', () =>
    {
      // Arrange & Act
      const result = TraitManager.slipIcon('tp', -5);

      // Assert
      expect(result).toBeTypeOf('number');
    });

    it('returns 0 for an unknown resource type', () =>
    {
      // Arrange & Act
      const result = TraitManager.slipIcon('unknown', 5);

      // Assert
      expect(result).toBe(0);
    });
  });
});
//endregion plugins/_base/managers/trait-manager.test.js
