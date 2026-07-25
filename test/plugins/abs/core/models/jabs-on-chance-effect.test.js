//region plugins/abs/core/models/jabs-on-chance-effect.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('JABS_OnChanceEffect (direct src import)', () =>
{
  let JABS_OnChanceEffect;

  beforeAll(async () =>
  {
    globalThis.J = { ABS: { RegExp: { OnDefeatedTarget: /<onDefeatedTarget>/i } } };
    globalThis.RPGManager = {
      checkForBooleanFromNoteByRegex: vi.fn(),
      fateOf100: vi.fn(),
      chanceIn100: vi.fn(),
      resolveProcCount: vi.fn(),
    };
    globalThis.$dataSkills = { at: vi.fn((id) => ({ id, tag: 'db-skill' })) };

    ({ default: JABS_OnChanceEffect } = await import('../../../../../src/plugins/abs/core/models/JABS_OnChanceEffect.js'));
  });

  beforeEach(() =>
  {
    vi.clearAllMocks();
  });

  describe('constructor', () =>
  {
    it('sets every field from the constructor arguments', () =>
    {
      const effect = new JABS_OnChanceEffect(5, 30, 'onDefeat', 1);
      expect(effect.skillId).toBe(5);
      expect(effect.chance).toBe(30);
      expect(effect.key).toBe('onDefeat');
      expect(effect.hitType).toBe(1);
    });

    it('defaults hitType to null when omitted', () =>
    {
      const effect = new JABS_OnChanceEffect(5, 30, 'onDefeat');
      expect(effect.hitType).toBeNull();
    });
  });

  describe('matchesHitType', () =>
  {
    it('is true regardless of incoming hit type when no filter is set', () =>
    {
      const effect = new JABS_OnChanceEffect(5, 30, 'k', null);
      expect(effect.matchesHitType(2)).toBe(true);
    });

    it('is true when the incoming hit type matches the filter', () =>
    {
      const effect = new JABS_OnChanceEffect(5, 30, 'k', 2);
      expect(effect.matchesHitType(2)).toBe(true);
    });

    it('is false when the incoming hit type does not match the filter', () =>
    {
      const effect = new JABS_OnChanceEffect(5, 30, 'k', 2);
      expect(effect.matchesHitType(3)).toBe(false);
    });
  });

  describe('baseSkill', () =>
  {
    it('uses the database skill when no battler is provided', () =>
    {
      const effect = new JABS_OnChanceEffect(5, 30, 'k');
      const result = effect.baseSkill();
      expect(globalThis.$dataSkills.at).toHaveBeenCalledWith(5);
      expect(result).toEqual({ id: 5, tag: 'db-skill' });
    });

    it('uses the battler\'s perceived skill when a battler is provided', () =>
    {
      const effect = new JABS_OnChanceEffect(5, 30, 'k');
      const perceivedSkill = { id: 5, tag: 'perceived' };
      const battler = { skill: vi.fn(() => perceivedSkill) };

      const result = effect.baseSkill(battler);

      expect(battler.skill).toHaveBeenCalledWith(5);
      expect(result).toBe(perceivedSkill);
    });
  });

  describe('appearOnTarget', () =>
  {
    it('reads the onDefeatedTarget tag from the underlying skill note', () =>
    {
      globalThis.RPGManager.checkForBooleanFromNoteByRegex.mockReturnValue(true);
      const effect = new JABS_OnChanceEffect(5, 30, 'k');

      const result = effect.appearOnTarget();

      expect(result).toBe(true);
      expect(globalThis.RPGManager.checkForBooleanFromNoteByRegex).toHaveBeenCalledWith(
        { id: 5, tag: 'db-skill' },
        globalThis.J.ABS.RegExp.OnDefeatedTarget,
      );
    });
  });

  describe('shouldTrigger', () =>
  {
    it('rolls via fateOf100 when a positiveRoller is provided', () =>
    {
      globalThis.RPGManager.fateOf100.mockReturnValue(true);
      const effect = new JABS_OnChanceEffect(5, 40, 'k');
      const roller = { tag: 'roller' };

      const result = effect.shouldTrigger(2, 1, roller);

      expect(result).toBe(true);
      expect(globalThis.RPGManager.fateOf100).toHaveBeenCalledWith(roller, 40, 2, 1);
      expect(globalThis.RPGManager.chanceIn100).not.toHaveBeenCalled();
    });

    it('rolls via chanceIn100 when no positiveRoller is provided', () =>
    {
      globalThis.RPGManager.chanceIn100.mockReturnValue(false);
      const effect = new JABS_OnChanceEffect(5, 40, 'k');

      const result = effect.shouldTrigger(2, 1);

      expect(result).toBe(false);
      expect(globalThis.RPGManager.chanceIn100).toHaveBeenCalledWith(40, 2, 1);
      expect(globalThis.RPGManager.fateOf100).not.toHaveBeenCalled();
    });
  });

  describe('resolveProcCount', () =>
  {
    it('resolves via RPGManager.resolveProcCount when a positiveRoller is provided', () =>
    {
      globalThis.RPGManager.resolveProcCount.mockReturnValue(3);
      const effect = new JABS_OnChanceEffect(5, 40, 'k');
      const roller = { tag: 'roller' };

      const result = effect.resolveProcCount(2, 1, roller);

      expect(result).toBe(3);
      expect(globalThis.RPGManager.resolveProcCount).toHaveBeenCalledWith(roller, 40, 2, 1);
    });

    it('resolves to 1 when no positiveRoller is provided and the plain roll succeeds', () =>
    {
      globalThis.RPGManager.chanceIn100.mockReturnValue(true);
      const effect = new JABS_OnChanceEffect(5, 40, 'k');

      expect(effect.resolveProcCount()).toBe(1);
    });

    it('resolves to 0 when no positiveRoller is provided and the plain roll fails', () =>
    {
      globalThis.RPGManager.chanceIn100.mockReturnValue(false);
      const effect = new JABS_OnChanceEffect(5, 40, 'k');

      expect(effect.resolveProcCount()).toBe(0);
    });
  });
});
//endregion plugins/abs/core/models/jabs-on-chance-effect.test.js
