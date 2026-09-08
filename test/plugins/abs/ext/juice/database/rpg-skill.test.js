//region plugins/abs/ext/juice/database/rpg-skill.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('J-ABS-Juice RPG_Skill (unit, all downstream dependencies mocked)', () =>
{
  const REGEX = {
    NoJuice: Symbol('NoJuice'),
    JuiceIcon: Symbol('JuiceIcon'),
    JuiceWeaponStyle: Symbol('JuiceWeaponStyle'),
    JuiceMotion: Symbol('JuiceMotion'),
    JuiceSpan: Symbol('JuiceSpan'),
    JuiceRepeatCount: Symbol('JuiceRepeatCount'),
    JuiceDuration: Symbol('JuiceDuration'),
    JuiceStabTipDegrees: Symbol('JuiceStabTipDegrees'),
    JuiceProfileGun: Symbol('JuiceProfileGun'),
    CastMotion: Symbol('CastMotion'),
    CastMotionPeriod: Symbol('CastMotionPeriod'),
    CastMotionIntensity: Symbol('CastMotionIntensity'),
  };

  beforeAll(async () =>
  {
    vi.resetModules();

    String.empty = '';
    globalThis.J = { ABS: { EXT: { JUICE: { RegExp: REGEX } } } };
    globalThis.RPGManager = {
      checkForBooleanFromNoteByRegex: vi.fn(),
      getNumberFromNoteByRegex: vi.fn(),
      getStringFromNoteByRegex: vi.fn(),
    };

    function RPG_Skill()
    {
    }

    globalThis.RPG_Skill = RPG_Skill;

    await import('../../../../../../src/plugins/abs/ext/juice/database/RPG_Skill.js');
  });

  beforeEach(() =>
  {
    globalThis.RPGManager.checkForBooleanFromNoteByRegex.mockReset();
    globalThis.RPGManager.getNumberFromNoteByRegex.mockReset();
    globalThis.RPGManager.getStringFromNoteByRegex.mockReset();
  });

  function buildSkill()
  {
    return Object.create(globalThis.RPG_Skill.prototype);
  }

  describe('jabsNoJuice', () =>
  {
    it('is true only when the tag check strictly returns true', () =>
    {
      globalThis.RPGManager.checkForBooleanFromNoteByRegex.mockReturnValue(true);
      expect(buildSkill().jabsNoJuice).toBe(true);
    });

    it('is false when the tag check returns false', () =>
    {
      globalThis.RPGManager.checkForBooleanFromNoteByRegex.mockReturnValue(false);
      expect(buildSkill().jabsNoJuice).toBe(false);
    });
  });

  describe('jabsJuiceCastMotion', () =>
  {
    it('returns the tagged cast motion key, read through the cast-motion regex', () =>
    {
      // Arrange
      globalThis.RPGManager.getStringFromNoteByRegex.mockReturnValue('squish');
      const skill = buildSkill();

      // Act
      const motion = skill.jabsJuiceCastMotion;

      // Assert- the regex matters: the execution-time juiceMotion tag is a sibling that must not
      // be the one consulted here.
      expect(motion).toBe('squish');
      expect(globalThis.RPGManager.getStringFromNoteByRegex)
        .toHaveBeenCalledWith(skill, REGEX.CastMotion, true);
    });

    it('is an empty string when untagged, so the default charge pulse stands', () =>
    {
      // Arrange
      globalThis.RPGManager.getStringFromNoteByRegex.mockReturnValue(null);

      // Act
      const motion = buildSkill().jabsJuiceCastMotion;

      // Assert
      expect(motion).toBe('');
    });
  });

  describe('jabsJuiceCastMotionPeriod', () =>
  {
    it('returns the tagged period in frames', () =>
    {
      // Arrange
      globalThis.RPGManager.getNumberFromNoteByRegex.mockReturnValue(6);
      const skill = buildSkill();

      // Act
      const period = skill.jabsJuiceCastMotionPeriod;

      // Assert
      expect(period).toBe(6);
      expect(globalThis.RPGManager.getNumberFromNoteByRegex)
        .toHaveBeenCalledWith(skill, REGEX.CastMotionPeriod, true);
    });

    it('is zero when untagged, which is the "use the registered default" sentinel', () =>
    {
      // Arrange
      globalThis.RPGManager.getNumberFromNoteByRegex.mockReturnValue(null);

      // Act
      const period = buildSkill().jabsJuiceCastMotionPeriod;

      // Assert
      expect(period).toBe(0);
    });
  });

  describe('jabsJuiceCastMotionIntensity', () =>
  {
    it('returns the tagged intensity percent', () =>
    {
      // Arrange
      globalThis.RPGManager.getNumberFromNoteByRegex.mockReturnValue(45);
      const skill = buildSkill();

      // Act
      const intensity = skill.jabsJuiceCastMotionIntensity;

      // Assert- the regex matters; the period tag is a numeric sibling that must not be the one read.
      expect(intensity).toBe(45);
      expect(globalThis.RPGManager.getNumberFromNoteByRegex)
        .toHaveBeenCalledWith(skill, REGEX.CastMotionIntensity, true);
    });

    it('is zero when untagged, which is the "use the config intensity" sentinel', () =>
    {
      // Arrange
      globalThis.RPGManager.getNumberFromNoteByRegex.mockReturnValue(null);

      // Act
      const intensity = buildSkill().jabsJuiceCastMotionIntensity;

      // Assert
      expect(intensity).toBe(0);
    });
  });

  describe('jabsJuiceIconIndex', () =>
  {
    it('returns the tagged icon index', () =>
    {
      globalThis.RPGManager.getNumberFromNoteByRegex.mockReturnValue(5);
      expect(buildSkill().jabsJuiceIconIndex).toBe(5);
    });

    it('defaults to -1 when untagged', () =>
    {
      globalThis.RPGManager.getNumberFromNoteByRegex.mockReturnValue(null);
      expect(buildSkill().jabsJuiceIconIndex).toBe(-1);
    });
  });

  describe('jabsJuiceWeaponStyle', () =>
  {
    it('returns the tagged style string', () =>
    {
      globalThis.RPGManager.getStringFromNoteByRegex.mockReturnValue('heavy');
      expect(buildSkill().jabsJuiceWeaponStyle).toBe('heavy');
    });

    it('defaults to an empty string when untagged', () =>
    {
      globalThis.RPGManager.getStringFromNoteByRegex.mockReturnValue(null);
      expect(buildSkill().jabsJuiceWeaponStyle).toBe('');
    });
  });

  describe('jabsJuiceMotion', () =>
  {
    it('returns the tagged motion key', () =>
    {
      globalThis.RPGManager.getStringFromNoteByRegex.mockReturnValue('stab-forward');
      expect(buildSkill().jabsJuiceMotion).toBe('stab-forward');
    });

    it('defaults to an empty string when untagged', () =>
    {
      globalThis.RPGManager.getStringFromNoteByRegex.mockReturnValue(null);
      expect(buildSkill().jabsJuiceMotion).toBe('');
    });
  });

  describe('jabsJuiceArcSpanDegrees', () =>
  {
    it('returns the tagged span', () =>
    {
      globalThis.RPGManager.getNumberFromNoteByRegex.mockReturnValue(90);
      expect(buildSkill().jabsJuiceArcSpanDegrees).toBe(90);
    });

    it('defaults to -1 when untagged', () =>
    {
      globalThis.RPGManager.getNumberFromNoteByRegex.mockReturnValue(null);
      expect(buildSkill().jabsJuiceArcSpanDegrees).toBe(-1);
    });
  });

  describe('jabsJuiceRepeatCount', () =>
  {
    it('returns the tagged repeat count', () =>
    {
      globalThis.RPGManager.getNumberFromNoteByRegex.mockReturnValue(3);
      expect(buildSkill().jabsJuiceRepeatCount).toBe(3);
    });

    it('defaults to -1 when untagged', () =>
    {
      globalThis.RPGManager.getNumberFromNoteByRegex.mockReturnValue(null);
      expect(buildSkill().jabsJuiceRepeatCount).toBe(-1);
    });
  });

  describe('jabsJuiceDuration', () =>
  {
    it('returns the tagged duration', () =>
    {
      globalThis.RPGManager.getNumberFromNoteByRegex.mockReturnValue(20);
      expect(buildSkill().jabsJuiceDuration).toBe(20);
    });

    it('defaults to null when untagged (distinct from the -1 sentinel used elsewhere)', () =>
    {
      globalThis.RPGManager.getNumberFromNoteByRegex.mockReturnValue(null);
      expect(buildSkill().jabsJuiceDuration).toBeNull();
    });
  });

  describe('jabsJuiceStabTipDegrees', () =>
  {
    it('returns the tagged tip bearing', () =>
    {
      globalThis.RPGManager.getNumberFromNoteByRegex.mockReturnValue(45);
      expect(buildSkill().jabsJuiceStabTipDegrees).toBe(45);
    });

    it('defaults to null when untagged', () =>
    {
      globalThis.RPGManager.getNumberFromNoteByRegex.mockReturnValue(null);
      expect(buildSkill().jabsJuiceStabTipDegrees).toBeNull();
    });
  });

  describe('jabsJuiceProfileGun', () =>
  {
    it('is true only when the tag check strictly returns true', () =>
    {
      globalThis.RPGManager.checkForBooleanFromNoteByRegex.mockReturnValue(true);
      expect(buildSkill().jabsJuiceProfileGun).toBe(true);
    });

    it('is false when the tag check returns false', () =>
    {
      globalThis.RPGManager.checkForBooleanFromNoteByRegex.mockReturnValue(false);
      expect(buildSkill().jabsJuiceProfileGun).toBe(false);
    });
  });
});
//endregion plugins/abs/ext/juice/database/rpg-skill.test.js
