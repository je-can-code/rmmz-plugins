//region plugins/abs/ext/allyai/_models/jabs-battler.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('J-ABS-AllyAI JABS_Battler (unit, all downstream dependencies mocked)', () =>
{
  let originalShouldEngage;

  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = { ABS: { EXT: { ALLYAI: { Aliased: { JABS_Battler: new Map() } } } } };

    globalThis.JABS_BattlerCoreData = {
      Builder: () => ({ setBattler: vi.fn().mockReturnThis(), build: vi.fn(() => ({ built: true })) }),
    };
    globalThis.JABS_AiManager = { getAlliedBattlersWithinRange: vi.fn() };

    // JABS_AllyAI is a downstream dependency (a sibling model file) imported only for its JSDoc
    // type reference; mock it entirely rather than pulling in its real JABS_AI superclass chain.
    vi.doMock('../../../../../../src/plugins/abs/ext/allyai/_models/JABS_AllyAI.js', () => ({ default: class {} }));

    function JABS_Battler(follower, actor, coreData)
    {
      this.follower = follower;
      this.actor = actor;
      this.coreData = coreData;
    }

    JABS_Battler.allyRubberbandRange = vi.fn(() => 8);
    JABS_Battler.closeDistance = 2;
    JABS_Battler.farDistance = 6;

    originalShouldEngage = vi.fn();
    JABS_Battler.prototype.shouldEngage = originalShouldEngage;
    globalThis.JABS_Battler = JABS_Battler;

    await import('../../../../../../src/plugins/abs/ext/allyai/_models/JABS_Battler.js');
  });

  beforeEach(() =>
  {
    originalShouldEngage.mockReset();
    globalThis.JABS_AiManager.getAlliedBattlersWithinRange.mockReset();
    globalThis.$gameParty = { isAggro: () => false };
    globalThis.$jabsEngine = { getPlayer1: vi.fn(() => ({ hasBattlerLastHit: () => false })) };
  });

  function buildBattler(overrides = {})
  {
    const battler = Object.create(globalThis.JABS_Battler.prototype);
    battler.isEnemy = () => false;
    return Object.assign(battler, overrides);
  }

  describe('createAlly', () =>
  {
    it('returns null when the follower is missing', () =>
    {
      expect(globalThis.JABS_Battler.createAlly(null, {})).toBeNull();
    });

    it('returns null when the actor is missing', () =>
    {
      expect(globalThis.JABS_Battler.createAlly({}, null)).toBeNull();
    });

    it('builds core data from the actor then constructs the battler', () =>
    {
      const follower = { id: 'follower' };
      const actor = { id: 'actor' };
      const result = globalThis.JABS_Battler.createAlly(follower, actor);
      expect(result.follower).toBe(follower);
      expect(result.actor).toBe(actor);
      expect(result.coreData).toEqual({ built: true });
    });
  });

  describe('shouldEngage', () =>
  {
    it('defers to the original logic for enemies', () =>
    {
      const battler = buildBattler({ isEnemy: () => true });
      originalShouldEngage.mockReturnValue(true);
      const target = { isInanimate: () => false };

      const result = battler.shouldEngage(target, 5);

      expect(originalShouldEngage).toHaveBeenCalledWith(target, 5);
      expect(result).toBe(true);
    });

    it('defers to the original logic when the party is aggro and the target is animate', () =>
    {
      globalThis.$gameParty.isAggro = () => true;
      const battler = buildBattler();
      originalShouldEngage.mockReturnValue(true);
      const target = { isInanimate: () => false };

      const result = battler.shouldEngage(target, 5);

      expect(originalShouldEngage).toHaveBeenCalledWith(target, 5);
      expect(result).toBe(true);
    });

    it('delegates to shouldAllyEngage when the party is aggro but the target is inanimate', () =>
    {
      globalThis.$gameParty.isAggro = () => true;
      const battler = buildBattler();
      battler.shouldAllyEngage = vi.fn(() => 'ally-decision');
      const target = { isInanimate: () => true };

      const result = battler.shouldEngage(target, 5);

      expect(battler.shouldAllyEngage).toHaveBeenCalledWith(target, 5);
      expect(originalShouldEngage).not.toHaveBeenCalled();
      expect(result).toBe('ally-decision');
    });

    it('delegates to shouldAllyEngage for a passive ally', () =>
    {
      const battler = buildBattler();
      battler.shouldAllyEngage = vi.fn(() => 'ally-decision');
      const target = { isInanimate: () => false };

      const result = battler.shouldEngage(target, 5);

      expect(battler.shouldAllyEngage).toHaveBeenCalledWith(target, 5);
      expect(result).toBe('ally-decision');
    });
  });

  describe('shouldAllyEngage', () =>
  {
    it('never engages when the ally mode is do-nothing', () =>
    {
      const battler = buildBattler({ getAllyAiMode: () => ({ isDoNothing: () => true }) });
      expect(battler.shouldAllyEngage({ isInanimate: () => false }, 5)).toBe(false);
    });

    it('never engages an inanimate target', () =>
    {
      const battler = buildBattler({ getAllyAiMode: () => null });
      expect(battler.shouldAllyEngage({ isInanimate: () => true }, 5)).toBe(false);
    });

    it('does not engage when the target is out of sight range', () =>
    {
      const battler = buildBattler({ getAllyAiMode: () => null, inSightRange: () => false });
      expect(battler.shouldAllyEngage({ isInanimate: () => false }, 5)).toBe(false);
    });

    it('engages when alerted', () =>
    {
      const battler = buildBattler({ getAllyAiMode: () => null, inSightRange: () => true, isAlerted: () => true });
      expect(battler.shouldAllyEngage({ isInanimate: () => false }, 5)).toBe(true);
    });

    it('engages when the player has a last-hit target, even without being alerted', () =>
    {
      globalThis.$jabsEngine.getPlayer1.mockReturnValue({ hasBattlerLastHit: () => true });
      const battler = buildBattler({ getAllyAiMode: () => null, inSightRange: () => true, isAlerted: () => false });
      expect(battler.shouldAllyEngage({ isInanimate: () => false }, 5)).toBe(true);
    });

    it('does not engage when neither alerted nor the player has a last-hit target', () =>
    {
      const battler = buildBattler({ getAllyAiMode: () => null, inSightRange: () => true, isAlerted: () => false });
      expect(battler.shouldAllyEngage({ isInanimate: () => false }, 5)).toBe(false);
    });
  });

  describe('getAllNearbyAllies', () =>
  {
    it('queries the ai manager within the rubberband range', () =>
    {
      const battler = buildBattler();
      const allies = [ 'ally1' ];
      globalThis.JABS_AiManager.getAlliedBattlersWithinRange.mockReturnValue(allies);

      const result = battler.getAllNearbyAllies();

      expect(globalThis.JABS_AiManager.getAlliedBattlersWithinRange).toHaveBeenCalledWith(battler, 8);
      expect(result).toBe(allies);
    });
  });

  describe('getAllyAiMode', () =>
  {
    it('is null for enemies', () =>
    {
      const battler = buildBattler({ isEnemy: () => true });
      expect(battler.getAllyAiMode()).toBeNull();
    });

    it('reads the ally AI mode from the underlying battler for allies', () =>
    {
      const allyAi = { id: 'ally-ai' };
      const battler = buildBattler({ getBattler: () => ({ getAllyAI: () => allyAi }) });
      expect(battler.getAllyAiMode()).toBe(allyAi);
    });
  });

  describe('getCloseDistance / getFarDistance', () =>
  {
    it('uses the global default for enemies', () =>
    {
      const battler = buildBattler({ isEnemy: () => true });
      expect(battler.getCloseDistance()).toBe(2);
      expect(battler.getFarDistance()).toBe(6);
    });

    it('uses the global default for allies with no ally AI mode', () =>
    {
      const battler = buildBattler({ getAllyAiMode: () => null });
      expect(battler.getCloseDistance()).toBe(2);
      expect(battler.getFarDistance()).toBe(6);
    });

    it('delegates to the ally AI mode\'s own spacing when present', () =>
    {
      const allyAi = { getCloseDistance: () => 1, getFarDistance: () => 9 };
      const battler = buildBattler({ getAllyAiMode: () => allyAi });
      expect(battler.getCloseDistance()).toBe(1);
      expect(battler.getFarDistance()).toBe(9);
    });
  });

  describe('getAllyLeashRange', () =>
  {
    it('uses the base rubberband range with no multiplier when there is no ally AI mode', () =>
    {
      const battler = buildBattler({ getAllyAiMode: () => null });
      expect(battler.getAllyLeashRange()).toBe(8);
    });

    it('scales the base rubberband range by the ally AI leash multiplier', () =>
    {
      const battler = buildBattler({ getAllyAiMode: () => ({ getLeashMultiplier: () => 2 }) });
      expect(battler.getAllyLeashRange()).toBe(16);
    });
  });

  describe('applyBattleMemories', () =>
  {
    it('does nothing for enemies', () =>
    {
      const battler = buildBattler({ isEnemy: () => true, getBattler: vi.fn() });
      battler.applyBattleMemories({ id: 'memory' });
      expect(battler.getBattler).not.toHaveBeenCalled();
    });

    it('applies the memory to the ally AI for allies', () =>
    {
      const applyMemory = vi.fn();
      const battler = buildBattler({ getBattler: () => ({ getAllyAI: () => ({ applyMemory }) }) });
      const memory = { id: 'memory' };

      battler.applyBattleMemories(memory);

      expect(applyMemory).toHaveBeenCalledWith(memory);
    });
  });
});
//endregion plugins/abs/ext/allyai/_models/jabs-battler.test.js
