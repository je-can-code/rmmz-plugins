//region plugins/abs/ext/allyai/managers/jabs-engine.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('J-ABS-AllyAI JABS_Engine (unit, all downstream dependencies mocked)', () =>
{
  let originalPrePartyCycling;
  let originalHandlePartyCycleMemberChanges;
  let originalContinuedPrimaryBattleEffects;
  let originalPostPartyCycling;
  let originalCanBeAlerted;

  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = { ABS: { EXT: { ALLYAI: { Aliased: { JABS_Engine: new Map() } } } } };
    globalThis.JABS_AiManager = {
      removeBattler: vi.fn(),
      convertFollowersToBattlers: vi.fn(),
      addOrUpdateBattlers: vi.fn(),
    };
    globalThis.JABS_BattleMemory = vi.fn(function(battlerId, skillId, elementRate, hpDamage)
    {
      this.battlerId = battlerId;
      this.skillId = skillId;
      this.elementRate = elementRate;
      this.hpDamage = hpDamage;
    });

    function JABS_Engine()
    {
    }

    originalPrePartyCycling = vi.fn();
    originalHandlePartyCycleMemberChanges = vi.fn();
    originalContinuedPrimaryBattleEffects = vi.fn();
    originalPostPartyCycling = vi.fn();
    originalCanBeAlerted = vi.fn(() => true);
    JABS_Engine.prototype.prePartyCycling = originalPrePartyCycling;
    JABS_Engine.prototype.handlePartyCycleMemberChanges = originalHandlePartyCycleMemberChanges;
    JABS_Engine.prototype.continuedPrimaryBattleEffects = originalContinuedPrimaryBattleEffects;
    JABS_Engine.prototype.postPartyCycling = originalPostPartyCycling;
    JABS_Engine.prototype.canBeAlerted = originalCanBeAlerted;
    globalThis.JABS_Engine = JABS_Engine;

    await import('../../../../../../src/plugins/abs/ext/allyai/managers/JABS_Engine.js');
  });

  beforeEach(() =>
  {
    originalPrePartyCycling.mockReset();
    originalHandlePartyCycleMemberChanges.mockReset();
    originalContinuedPrimaryBattleEffects.mockReset();
    originalPostPartyCycling.mockReset();
    originalCanBeAlerted.mockReset().mockReturnValue(true);
    globalThis.JABS_AiManager.removeBattler.mockReset();
    globalThis.JABS_AiManager.convertFollowersToBattlers.mockReset();
    globalThis.JABS_AiManager.addOrUpdateBattlers.mockReset();
    globalThis.$gamePlayer = { jumpFollowersToMe: vi.fn(), followers: () => ({ data: () => [ 'follower1' ] }) };
    globalThis.$gameParty = { leaderJabsBattler: vi.fn() };
    globalThis.$jabsEngine = { requestAlliesRefresh: false };
  });

  function buildEngine(overrides = {})
  {
    return Object.assign(Object.create(globalThis.JABS_Engine.prototype), overrides);
  }

  describe('requestAlliesRefresh', () =>
  {
    it('defaults to false on the prototype', () =>
    {
      const engine = buildEngine();
      expect(engine.requestAlliesRefresh).toBe(false);
    });
  });

  describe('prePartyCycling', () =>
  {
    it('performs the original logic then jumps all followers to the player', () =>
    {
      const engine = buildEngine();
      engine.prePartyCycling();
      expect(originalPrePartyCycling).toHaveBeenCalledTimes(1);
      expect(globalThis.$gamePlayer.jumpFollowersToMe).toHaveBeenCalledTimes(1);
    });
  });

  describe('handlePartyCycleMemberChanges', () =>
  {
    it('removes the former leader battler before performing the original logic', () =>
    {
      const formerLeader = { id: 'former-leader' };
      globalThis.$gameParty.leaderJabsBattler.mockReturnValue(formerLeader);
      const engine = buildEngine();

      engine.handlePartyCycleMemberChanges();

      expect(globalThis.JABS_AiManager.removeBattler).toHaveBeenCalledWith(formerLeader);
      expect(originalHandlePartyCycleMemberChanges).toHaveBeenCalledTimes(1);
    });

    it('does not attempt to remove a battler when there is no former leader', () =>
    {
      globalThis.$gameParty.leaderJabsBattler.mockReturnValue(null);
      const engine = buildEngine();

      engine.handlePartyCycleMemberChanges();

      expect(globalThis.JABS_AiManager.removeBattler).not.toHaveBeenCalled();
    });

    it('flags allies for a refresh after the party cycle completes', () =>
    {
      const engine = buildEngine();
      engine.handlePartyCycleMemberChanges();
      expect(globalThis.$jabsEngine.requestAlliesRefresh).toBe(true);
    });
  });

  describe('continuedPrimaryBattleEffects', () =>
  {
    it('performs the original logic then applies battle memories using the target\'s result', () =>
    {
      const engine = buildEngine();
      engine.applyBattleMemories = vi.fn();
      const result = { hpDamage: 5 };
      const target = { getBattler: () => ({ result: () => result }) };
      const action = { id: 'action' };

      engine.continuedPrimaryBattleEffects(action, target);

      expect(originalContinuedPrimaryBattleEffects).toHaveBeenCalledWith(action, target);
      expect(engine.applyBattleMemories).toHaveBeenCalledWith(result, action, target);
    });
  });

  describe('applyBattleMemories', () =>
  {
    it('KNOWN BUG: the guard is inverted (`if (this.canApplyBattleMemories(target)) return;`), so memories are built and applied exactly when canApplyBattleMemories is FALSE- i.e. for enemies, not allies, backwards from both the comment ("only apply if allowed") and the feature\'s intent', () =>
    {
      // Arrange- an "enemy" target, for which canApplyBattleMemories legitimately returns false.
      const attacker = { applyBattleMemories: vi.fn() };
      const action = {
        getBaseSkill: () => ({ id: 7 }),
        getAction: () => ({ calculateRawElementRate: () => 1.5 }),
        getCaster: () => attacker,
      };
      const target = { isEnemy: () => true, getBattlerId: () => 42, getBattler: () => ({}) };
      const engine = buildEngine();

      // Act
      engine.applyBattleMemories({ hpDamage: 10 }, action, target);

      // Assert- a memory WAS built and applied, despite target being an enemy.
      expect(attacker.applyBattleMemories).toHaveBeenCalledTimes(1);
      expect(globalThis.JABS_BattleMemory).toHaveBeenCalledWith(42, 7, 1.5, 10);
    });

    it('KNOWN BUG (inverse case): does nothing for an ally target, for which canApplyBattleMemories legitimately returns true- the intended case this feature exists for', () =>
    {
      // Arrange- an "ally" (non-enemy) target, for which canApplyBattleMemories returns true.
      const attacker = { applyBattleMemories: vi.fn() };
      const action = { getBaseSkill: () => ({ id: 7 }), getAction: () => ({}), getCaster: () => attacker };
      const target = { isEnemy: () => false, getBattlerId: () => 1, getBattler: () => ({}) };
      const engine = buildEngine();

      // Act
      engine.applyBattleMemories({ hpDamage: 10 }, action, target);

      // Assert- no memory applied, despite this being the intended "should apply" case.
      expect(attacker.applyBattleMemories).not.toHaveBeenCalled();
    });
  });

  describe('canApplyBattleMemories', () =>
  {
    it('is false for enemies', () =>
    {
      const engine = buildEngine();
      expect(engine.canApplyBattleMemories({ isEnemy: () => true })).toBe(false);
    });

    it('is true for allies', () =>
    {
      const engine = buildEngine();
      expect(engine.canApplyBattleMemories({ isEnemy: () => false })).toBe(true);
    });
  });

  describe('rebuildActorAllies', () =>
  {
    it('converts current followers into battlers then registers them with the ai manager', () =>
    {
      const allies = [ 'ally-battler' ];
      globalThis.JABS_AiManager.convertFollowersToBattlers.mockReturnValue(allies);
      const engine = buildEngine();

      engine.rebuildActorAllies();

      expect(globalThis.JABS_AiManager.convertFollowersToBattlers).toHaveBeenCalledWith([ 'follower1' ]);
      expect(globalThis.JABS_AiManager.addOrUpdateBattlers).toHaveBeenCalledWith(allies);
    });
  });

  describe('postPartyCycling', () =>
  {
    it('performs the original logic then rebuilds actor allies', () =>
    {
      const engine = buildEngine();
      engine.rebuildActorAllies = vi.fn();

      engine.postPartyCycling();

      expect(originalPostPartyCycling).toHaveBeenCalledTimes(1);
      expect(engine.rebuildActorAllies).toHaveBeenCalledTimes(1);
    });
  });

  describe('canBeAlerted', () =>
  {
    it('defers to the original logic result when it is already false', () =>
    {
      originalCanBeAlerted.mockReturnValue(false);
      const engine = buildEngine();
      const battler = { isActor: () => true, getAllyAiMode: () => ({ isDoNothing: () => false }) };

      expect(engine.canBeAlerted({}, battler)).toBe(false);
    });

    it('is false for a do-nothing actor ally, even when the original logic allows it', () =>
    {
      const engine = buildEngine();
      const battler = { isActor: () => true, getAllyAiMode: () => ({ isDoNothing: () => true }) };

      expect(engine.canBeAlerted({}, battler)).toBe(false);
    });

    it('is true for a normal actor ally', () =>
    {
      const engine = buildEngine();
      const battler = { isActor: () => true, getAllyAiMode: () => ({ isDoNothing: () => false }) };

      expect(engine.canBeAlerted({}, battler)).toBe(true);
    });

    it('is true for non-actor battlers regardless of ally AI mode', () =>
    {
      const engine = buildEngine();
      const battler = { isActor: () => false };

      expect(engine.canBeAlerted({}, battler)).toBe(true);
    });
  });
});
//endregion plugins/abs/ext/allyai/managers/jabs-engine.test.js
