//region plugins/abs/ext/charge/managers/sound-manager.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('J-ABS-Charge SoundManager (unit, all downstream dependencies mocked)', () =>
{
  let originalPreloadImportantSounds;

  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = { ABS: { EXT: { CHARGE: { Aliased: { SoundManager: new Map() }, Metadata: {} } } } };

    // RPG_SoundEffect is a bare RMMZ-style global constructed for the default sound effects.
    globalThis.RPG_SoundEffect = vi.fn(function(name, volume, pitch, pan)
    {
      this.name = name;
      this.volume = volume;
      this.pitch = pitch;
      this.pan = pan;
    });

    globalThis.AudioManager = { loadStaticSe: vi.fn() };

    originalPreloadImportantSounds = vi.fn();
    globalThis.SoundManager = { preloadImportantSounds: originalPreloadImportantSounds, playSoundEffect: vi.fn() };

    await import('../../../../../../src/plugins/abs/ext/charge/managers/SoundManager.js');
  });

  beforeEach(() =>
  {
    originalPreloadImportantSounds.mockReset();
    globalThis.AudioManager.loadStaticSe.mockReset();
    globalThis.SoundManager.playSoundEffect.mockReset();
    globalThis.J.ABS.EXT.CHARGE.Metadata.TierCompleteSE = undefined;
    globalThis.J.ABS.EXT.CHARGE.Metadata.ChargeReadySE = undefined;
  });

  describe('preloadImportantSounds / loadJabsChargingSounds', () =>
  {
    it('performs the original logic then preloads both charging sound effects', () =>
    {
      // Act
      globalThis.SoundManager.preloadImportantSounds();

      // Assert
      expect(originalPreloadImportantSounds).toHaveBeenCalledTimes(1);
      expect(globalThis.AudioManager.loadStaticSe).toHaveBeenCalledTimes(2);
    });
  });

  describe('chargeTierCompleteSE', () =>
  {
    it('uses the configured metadata sound effect when present', () =>
    {
      // Arrange
      const configured = { name: 'Custom1' };
      globalThis.J.ABS.EXT.CHARGE.Metadata.TierCompleteSE = configured;

      // Act / Assert
      expect(globalThis.SoundManager.chargeTierCompleteSE()).toBe(configured);
    });

    it('defaults to the built-in sound effect when not configured', () =>
    {
      // Act
      const result = globalThis.SoundManager.chargeTierCompleteSE();

      // Assert
      expect(result.name).toBe('Heal6');
    });
  });

  describe('maxChargeReadySE', () =>
  {
    it('uses the configured metadata sound effect when present', () =>
    {
      // Arrange
      const configured = { name: 'Custom2' };
      globalThis.J.ABS.EXT.CHARGE.Metadata.ChargeReadySE = configured;

      // Act / Assert
      expect(globalThis.SoundManager.maxChargeReadySE()).toBe(configured);
    });

    it('defaults to the built-in sound effect when not configured', () =>
    {
      // Act
      const result = globalThis.SoundManager.maxChargeReadySE();

      // Assert
      expect(result.name).toBe('Item3');
    });
  });

  describe('playChargeTierCompleteSE', () =>
  {
    it('plays the charge-tier-complete sound effect', () =>
    {
      // Act
      globalThis.SoundManager.playChargeTierCompleteSE();

      // Assert
      expect(globalThis.SoundManager.playSoundEffect).toHaveBeenCalledWith(globalThis.SoundManager.chargeTierCompleteSE());
    });
  });

  describe('playMaxChargeReadySE', () =>
  {
    it('plays the max-charge-ready sound effect', () =>
    {
      // Act
      globalThis.SoundManager.playMaxChargeReadySE();

      // Assert
      expect(globalThis.SoundManager.playSoundEffect).toHaveBeenCalledWith(globalThis.SoundManager.maxChargeReadySE());
    });
  });
});
//endregion plugins/abs/ext/charge/managers/sound-manager.test.js
