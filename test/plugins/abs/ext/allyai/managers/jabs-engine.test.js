//region plugins/abs/ext/allyai/managers/jabs-engine.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('J-ABS-AllyAI JABS_Engine (unit, all downstream dependencies mocked)', () =>
{
  let originalPrePartyCycling;
  let originalHandlePartyCycleMemberChanges;
  let originalContinuedPrimaryBattleEffects;
  let originalPostPartyCycling;
  let originalCanBeAlerted;
  let originalProcessOnHitEffects;

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
    originalProcessOnHitEffects = vi.fn();
    JABS_Engine.prototype.prePartyCycling = originalPrePartyCycling;
    JABS_Engine.prototype.handlePartyCycleMemberChanges = originalHandlePartyCycleMemberChanges;
    JABS_Engine.prototype.continuedPrimaryBattleEffects = originalContinuedPrimaryBattleEffects;
    JABS_Engine.prototype.postPartyCycling = originalPostPartyCycling;
    JABS_Engine.prototype.canBeAlerted = originalCanBeAlerted;
    JABS_Engine.prototype.processOnHitEffects = originalProcessOnHitEffects;
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
    originalProcessOnHitEffects.mockReset();
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
    it('does nothing for an enemy target, since canApplyBattleMemories is false for enemies', () =>
    {
      // Arrange
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

      // Assert
      expect(attacker.applyBattleMemories).not.toHaveBeenCalled();
    });

    it('builds and applies a memory for an ally target, since canApplyBattleMemories is true for allies', () =>
    {
      // Arrange
      const attacker = { applyBattleMemories: vi.fn() };
      const action = {
        getBaseSkill: () => ({ id: 7 }),
        getAction: () => ({ calculateRawElementRate: () => 1.5 }),
        getCaster: () => attacker,
      };
      const target = { isEnemy: () => false, getBattlerId: () => 1, getBattler: () => ({}) };
      const engine = buildEngine();

      // Act
      engine.applyBattleMemories({ hpDamage: 10 }, action, target);

      // Assert
      expect(attacker.applyBattleMemories).toHaveBeenCalledTimes(1);
      expect(globalThis.JABS_BattleMemory).toHaveBeenCalledWith(1, 7, 1.5, 10);
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
      const battler = { isActor: () => true, getAllyAiMode: () => ({ isDoNothing: () => false }), isPullingBack: () => false };

      expect(engine.canBeAlerted({}, battler)).toBe(false);
    });

    it('is false for a do-nothing actor ally, even when the original logic allows it', () =>
    {
      const engine = buildEngine();
      const battler = { isActor: () => true, getAllyAiMode: () => ({ isDoNothing: () => true }), isPullingBack: () => false };

      expect(engine.canBeAlerted({}, battler)).toBe(false);
    });

    it('is false for an actor ally pulling back, even when the original logic allows it', () =>
    {
      const engine = buildEngine();
      const battler = { isActor: () => true, getAllyAiMode: () => ({ isDoNothing: () => false }), isPullingBack: () => true };

      expect(engine.canBeAlerted({}, battler)).toBe(false);
    });

    it('is true for a normal actor ally', () =>
    {
      const engine = buildEngine();
      const battler = { isActor: () => true, getAllyAiMode: () => ({ isDoNothing: () => false }), isPullingBack: () => false };

      expect(engine.canBeAlerted({}, battler)).toBe(true);
    });

    it('is true for non-actor battlers regardless of ally AI mode', () =>
    {
      const engine = buildEngine();
      const battler = { isActor: () => false };

      expect(engine.canBeAlerted({}, battler)).toBe(true);
    });
  });

  describe('processOnHitEffects', () =>
  {
    it('performs the original logic, then rallies the allies for whoever cast the hit', () =>
    {
      // Arrange
      const engine = buildEngine({ rallyAlliesForLeaderHit: vi.fn() });
      const caster = { id: 'caster' };
      const action = { getCaster: () => caster };
      const target = { id: 'target' };

      // Act
      engine.processOnHitEffects(action, target);

      // Assert
      expect(originalProcessOnHitEffects).toHaveBeenCalledWith(action, target);
      expect(engine.rallyAlliesForLeaderHit).toHaveBeenCalledWith(caster, target);
    });
  });

  describe('rallyAlliesForLeaderHit', () =>
  {
    const leader = { id: 'leader' };
    const slime = { id: 'slime' };

    it('rallies toward whatever the leader struck', () =>
    {
      // Arrange
      const engine = buildEngine({ getPlayer1: () => leader, rallyAlliesToward: vi.fn() });

      // Act
      engine.rallyAlliesForLeaderHit(leader, slime);

      // Assert
      expect(engine.rallyAlliesToward).toHaveBeenCalledTimes(1);
      expect(engine.rallyAlliesToward).toHaveBeenCalledWith(slime);
    });

    it('rallies toward whoever struck the leader', () =>
    {
      // Arrange
      const engine = buildEngine({ getPlayer1: () => leader, rallyAlliesToward: vi.fn() });

      // Act
      engine.rallyAlliesForLeaderHit(slime, leader);

      // Assert
      expect(engine.rallyAlliesToward).toHaveBeenCalledTimes(1);
      expect(engine.rallyAlliesToward).toHaveBeenCalledWith(slime);
    });

    it('rallies nobody for a hit the leader was no part of', () =>
    {
      // Arrange
      const engine = buildEngine({ getPlayer1: () => leader, rallyAlliesToward: vi.fn() });

      // Act
      engine.rallyAlliesForLeaderHit(slime, { id: 'rupert' });

      // Assert
      expect(engine.rallyAlliesToward).not.toHaveBeenCalled();
    });
  });

  describe('rallyAlliesToward', () =>
  {
    it('rallies every ally on the field toward the foe', () =>
    {
      // Arrange
      const allies = [ { id: 'jerald' }, { id: 'rupert' } ];
      globalThis.$gameMap = { getFollowerBattlers: () => allies };
      const engine = buildEngine({ rallyAllyToward: vi.fn() });
      const foe = { id: 'slime' };

      // Act
      engine.rallyAlliesToward(foe);

      // Assert
      expect(engine.rallyAllyToward).toHaveBeenCalledTimes(2);
      expect(engine.rallyAllyToward).toHaveBeenNthCalledWith(1, allies[0], foe);
      expect(engine.rallyAllyToward).toHaveBeenNthCalledWith(2, allies[1], foe);
    });
  });

  describe('rallyAllyToward', () =>
  {
    /**
     * An ally that records how it was alerted.
     * @returns {object}
     */
    const buildAlly = () => ({
      getAlertDuration: () => 240,
      setAlertedCoordinates: vi.fn(),
      setAlertedCounter: vi.fn(),
    });

    it('leaves alone an ally the foe could not alert', () =>
    {
      // Arrange
      const engine = buildEngine({ canBeAlerted: vi.fn(() => false) });
      const ally = buildAlly();
      const foe = { getX: () => 3, getY: () => 4 };

      // Act
      engine.rallyAllyToward(ally, foe);

      // Assert
      expect(engine.canBeAlerted).toHaveBeenCalledWith(foe, ally);
      expect(ally.setAlertedCounter).not.toHaveBeenCalled();
    });

    it('points the ally at where the foe stands, for a whole alert', () =>
    {
      // Arrange
      const engine = buildEngine({ canBeAlerted: () => true });
      const ally = buildAlly();
      const foe = { getX: () => 3, getY: () => 4 };

      // Act
      engine.rallyAllyToward(ally, foe);

      // Assert
      expect(ally.setAlertedCoordinates).toHaveBeenCalledWith(3, 4);
      expect(ally.setAlertedCounter).toHaveBeenCalledWith(240);
    });
  });
});
//endregion plugins/abs/ext/allyai/managers/jabs-engine.test.js
