//region plugins/abs/ext/allyai/managers/jabs-ai-manager.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * JABS_AiManager.js (ext/allyai) is a bare-global patch file- it aliases and extends the static
 * `JABS_AiManager` object (imported by nothing; the shipped runtime concatenates core/abs ahead of
 * this extension so the identifier is already a bare global by the time this file runs). This file
 * direct-imports it against a placeholder `JABS_AiManager` global with vi.fn() originals so the
 * aliased references stay reconfigurable per test, and a bare `JABS_Battler` global with the two
 * static guard/dodge-skill checks this file reads as values.
 */
describe('J-ABS-AllyAI JABS_AiManager (unit, all downstream dependencies stubbed)', () =>
{
  let originalExecuteAi;
  let originalAiPhase0;
  let originalMaintainSafeDistance;
  let originalDecideAiPhase2Action;

  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = {
      ABS: {
        EXT: {
          ALLYAI: {
            Aliased: { JABS_AiManager: new Map() },
            Metadata: {
              FormationTypes: [
                { key: 'default', formation: [ [ 0, 1 ], [ 1, 1 ], [ -1, 1 ] ] },
                { key: 'wedge', formation: [ [ 0, 1 ], [ 1, 2 ] ] },
              ],
              FormationTolerance: 0.5,
            },
          },
        },
      },
    };

    originalExecuteAi = vi.fn();
    originalAiPhase0 = vi.fn();
    originalMaintainSafeDistance = vi.fn();
    originalDecideAiPhase2Action = vi.fn();
    globalThis.JABS_AiManager = {
      executeAi: originalExecuteAi,
      aiPhase0: originalAiPhase0,
      maintainSafeDistance: originalMaintainSafeDistance,
      decideAiPhase2Action: originalDecideAiPhase2Action,
      seekForAlerter: vi.fn(),
      isSkillIdValid: vi.fn((skillId) => !!skillId),
      cancelActionSetup: vi.fn(),
      setupActionForNextPhase: vi.fn(),
    };

    globalThis.JABS_Battler = {
      isGuardSkillById: vi.fn(() => false),
      isDodgeSkillById: vi.fn(() => false),
    };

    await import('../../../../../../src/plugins/abs/ext/allyai/managers/JABS_AiManager.js');
  });

  beforeEach(() =>
  {
    originalExecuteAi.mockClear();
    originalAiPhase0.mockClear();
    originalMaintainSafeDistance.mockClear();
    originalDecideAiPhase2Action.mockClear();
    globalThis.JABS_AiManager.seekForAlerter.mockClear();
    globalThis.JABS_AiManager.isSkillIdValid.mockClear().mockImplementation((skillId) => !!skillId);
    globalThis.JABS_AiManager.cancelActionSetup.mockClear();
    globalThis.JABS_AiManager.setupActionForNextPhase.mockClear();
    globalThis.JABS_Battler.isGuardSkillById.mockClear().mockReturnValue(false);
    globalThis.JABS_Battler.isDodgeSkillById.mockClear().mockReturnValue(false);
  });

  /**
   * Builds a minimal fake {@link JABS_Battler} test double with sane defaults.
   * @param {object} [overrides] Overrides for the fake battler.
   * @returns {object} A fake battler.
   */
  function buildBattler(overrides = {})
  {
    return {
      isActor: () => true,
      isEnemy: () => false,
      getCharacter: () => buildCharacter(),
      isCastingOrChanneling: () => false,
      isEngaged: () => false,
      isAlerted: () => false,
      canBattlerMove: () => true,
      getAllyLeashRange: () => 10,
      unlockEngagement: vi.fn(),
      lockEngagement: vi.fn(),
      disengageTarget: vi.fn(),
      resetAllAggro: vi.fn(),
      getX: () => 5,
      getY: () => 5,
      isDodging: () => false,
      guarding: () => false,
      smartMoveTowardCoordinates: vi.fn(),
      distanceToCurrentTarget: () => 5,
      getCloseDistance: () => 2,
      getFarDistance: () => 8,
      smartMoveAwayFromTarget: vi.fn(),
      smartMoveTowardTarget: vi.fn(),
      getAllyAiMode: () => ({ isDoNothing: () => false, decideAction: vi.fn(() => []) }),
      getBattler: () => ({ getValidSkillSlotsForAlly: () => [], findSlotForSkillId: () => ({ key: 'combat-1' }) }),
      getTarget: () => ({}),
      ...overrides,
    };
  }

  /**
   * Builds a minimal fake character test double.
   * @param {object} [overrides] Overrides for the fake character.
   * @returns {object} A fake character.
   */
  function buildCharacter(overrides = {})
  {
    return {
      isFollower: () => false,
      direction: () => 2,
      x: 5, y: 5, _realX: 5, _realY: 5,
      isMoving: () => false,
      locate: vi.fn(),
      setThrough: vi.fn(),
      ...overrides,
    };
  }

  beforeEach(() =>
  {
    globalThis.$jabsEngine = { getPlayer1: () => buildBattler({ getCharacter: () => buildCharacter({ _realX: 0, _realY: 0 }), getX: () => 0, getY: () => 0 }) };
    globalThis.$gamePlayer = { followers: () => ({ areGathering: () => false, data: () => [] }) };
    globalThis.$gameParty = { getPartyFormation: () => 'default' };
    globalThis.$gameMap = { distance: (x1, y1, x2, y2) => Math.abs(x2 - x1) + Math.abs(y2 - y1) };
  });

  describe('executeAi()', () =>
  {
    it('performs original logic directly for a non-actor battler', () =>
    {
      const battler = buildBattler({ isActor: () => false });

      globalThis.JABS_AiManager.executeAi(battler);

      expect(originalExecuteAi).toHaveBeenCalledWith(battler);
    });

    it('performs original logic for an actor whose leash is not exceeded', () =>
    {
      const battler = buildBattler({ isActor: () => true });

      globalThis.JABS_AiManager.executeAi(battler);

      expect(originalExecuteAi).toHaveBeenCalledWith(battler);
    });

    it('stops short of original logic when a leash correction occurs', () =>
    {
      const battler = buildBattler({
        isActor: () => true,
        getCharacter: () => buildCharacter({ _realX: 100, _realY: 100 }),
        getAllyLeashRange: () => 1,
      });

      globalThis.JABS_AiManager.executeAi(battler);

      expect(originalExecuteAi).not.toHaveBeenCalled();
    });
  });

  describe('aiPhase0()/allyAiPhase0()', () =>
  {
    it('performs original logic for an enemy battler', () =>
    {
      const battler = buildBattler({ isEnemy: () => true });

      globalThis.JABS_AiManager.aiPhase0(battler);

      expect(originalAiPhase0).toHaveBeenCalledWith(battler);
    });

    it('routes an ally battler into allyAiPhase0', () =>
    {
      const battler = buildBattler({ isEnemy: () => false });
      const spy = vi.spyOn(globalThis.JABS_AiManager, 'allyAiPhase0');

      globalThis.JABS_AiManager.aiPhase0(battler);

      expect(spy).toHaveBeenCalledWith(battler);
      spy.mockRestore();
    });

    it('bails out early when the ally cannot perform phase 0 (casting)', () =>
    {
      const battler = buildBattler({ isCastingOrChanneling: () => true });
      const followSpy = vi.spyOn(globalThis.JABS_AiManager, 'allyFollowLeader');

      globalThis.JABS_AiManager.allyAiPhase0(battler);

      expect(followSpy).not.toHaveBeenCalled();
      followSpy.mockRestore();
    });

    it('bails out early when the ally cannot perform phase 0 (engaged)', () =>
    {
      const battler = buildBattler({ isEngaged: () => true });
      const followSpy = vi.spyOn(globalThis.JABS_AiManager, 'allyFollowLeader');

      globalThis.JABS_AiManager.allyAiPhase0(battler);

      expect(followSpy).not.toHaveBeenCalled();
      followSpy.mockRestore();
    });

    it('seeks the alerter when alerted and not in do-nothing mode', () =>
    {
      const battler = buildBattler({ isAlerted: () => true });

      globalThis.JABS_AiManager.allyAiPhase0(battler);

      expect(globalThis.JABS_AiManager.seekForAlerter).toHaveBeenCalledWith(battler);
    });

    it('ignores alert state entirely in do-nothing mode', () =>
    {
      const battler = buildBattler({
        isAlerted: () => true,
        getAllyAiMode: () => ({ isDoNothing: () => true }),
      });
      const followSpy = vi.spyOn(globalThis.JABS_AiManager, 'allyFollowLeader').mockImplementation(() => {});

      globalThis.JABS_AiManager.allyAiPhase0(battler);

      expect(globalThis.JABS_AiManager.seekForAlerter).not.toHaveBeenCalled();
      expect(followSpy).toHaveBeenCalled();
      followSpy.mockRestore();
    });

    it('follows the leader when idle and not alerted', () =>
    {
      const battler = buildBattler();
      const followSpy = vi.spyOn(globalThis.JABS_AiManager, 'allyFollowLeader').mockImplementation(() => {});

      globalThis.JABS_AiManager.allyAiPhase0(battler);

      expect(followSpy).toHaveBeenCalledWith(battler);
      followSpy.mockRestore();
    });
  });

  describe('enforceFollowerThroughPolicy()', () =>
  {
    it('does nothing when there is no character', () =>
    {
      const battler = buildBattler({ getCharacter: () => null });

      expect(() => globalThis.JABS_AiManager.enforceFollowerThroughPolicy(battler)).not.toThrow();
    });

    it('does nothing when the character is not a follower', () =>
    {
      const character = buildCharacter({ isFollower: () => false });
      const battler = buildBattler({ getCharacter: () => character });

      globalThis.JABS_AiManager.enforceFollowerThroughPolicy(battler);

      expect(character.setThrough).not.toHaveBeenCalled();
    });

    it('enables through while gathering', () =>
    {
      globalThis.$gamePlayer.followers = () => ({ areGathering: () => true, data: () => [] });
      const character = buildCharacter({ isFollower: () => true });
      const battler = buildBattler({ getCharacter: () => character });

      globalThis.JABS_AiManager.enforceFollowerThroughPolicy(battler);

      expect(character.setThrough).toHaveBeenCalledWith(true);
    });

    it('disables through while not gathering', () =>
    {
      const character = buildCharacter({ isFollower: () => true });
      const battler = buildBattler({ getCharacter: () => character });

      globalThis.JABS_AiManager.enforceFollowerThroughPolicy(battler);

      expect(character.setThrough).toHaveBeenCalledWith(false);
    });
  });

  describe('canPerformAllyPhase0()', () =>
  {
    it('returns false while casting/channeling', () =>
    {
      expect(globalThis.JABS_AiManager.canPerformAllyPhase0(buildBattler({ isCastingOrChanneling: () => true })))
        .toEqual(false);
    });

    it('returns false while engaged', () =>
    {
      expect(globalThis.JABS_AiManager.canPerformAllyPhase0(buildBattler({ isEngaged: () => true })))
        .toEqual(false);
    });

    it('returns true otherwise', () =>
    {
      expect(globalThis.JABS_AiManager.canPerformAllyPhase0(buildBattler())).toEqual(true);
    });
  });

  describe('allyFollowLeader()', () =>
  {
    it('does nothing without a resolvable leader', () =>
    {
      globalThis.$jabsEngine.getPlayer1 = () => null;
      const moveSpy = vi.spyOn(globalThis.JABS_AiManager, 'moveTowardSlotIfNeeded');

      globalThis.JABS_AiManager.allyFollowLeader(buildBattler());

      expect(moveSpy).not.toHaveBeenCalled();
      moveSpy.mockRestore();
    });

    it('stops when a leash correction occurred', () =>
    {
      const battler = buildBattler({
        getCharacter: () => buildCharacter({ _realX: 100, _realY: 100 }),
        getAllyLeashRange: () => 1,
      });
      const moveSpy = vi.spyOn(globalThis.JABS_AiManager, 'moveTowardSlotIfNeeded');

      globalThis.JABS_AiManager.allyFollowLeader(battler);

      expect(moveSpy).not.toHaveBeenCalled();
      moveSpy.mockRestore();
    });

    it('does not follow when the ally cannot move', () =>
    {
      const battler = buildBattler({ canBattlerMove: () => false });
      const moveSpy = vi.spyOn(globalThis.JABS_AiManager, 'moveTowardSlotIfNeeded');

      globalThis.JABS_AiManager.allyFollowLeader(battler);

      expect(moveSpy).not.toHaveBeenCalled();
      moveSpy.mockRestore();
    });

    it('computes the formation target and moves toward it when eligible', () =>
    {
      const battler = buildBattler();
      const moveSpy = vi.spyOn(globalThis.JABS_AiManager, 'moveTowardSlotIfNeeded').mockImplementation(() => {});

      globalThis.JABS_AiManager.allyFollowLeader(battler);

      expect(moveSpy).toHaveBeenCalled();
      moveSpy.mockRestore();
    });
  });

  describe('maintainLeashAndEngagement()', () =>
  {
    it('rubberbands and returns true when beyond the leash', () =>
    {
      const battler = buildBattler({
        getCharacter: () => buildCharacter({ _realX: 100, _realY: 100 }),
        getAllyLeashRange: () => 1,
      });
      const rubberbandSpy = vi.spyOn(globalThis.JABS_AiManager, 'rubberbandAlly').mockImplementation(() => {});
      const leader = buildBattler({ getCharacter: () => buildCharacter({ _realX: 0, _realY: 0 }) });

      expect(globalThis.JABS_AiManager.maintainLeashAndEngagement(battler, leader)).toEqual(true);
      expect(rubberbandSpy).toHaveBeenCalledWith(battler);
      rubberbandSpy.mockRestore();
    });

    it('re-enables engagement when back within half the leash', () =>
    {
      const battler = buildBattler({
        getCharacter: () => buildCharacter({ _realX: 1, _realY: 0 }),
        getAllyLeashRange: () => 10,
      });
      const leader = buildBattler({ getCharacter: () => buildCharacter({ _realX: 0, _realY: 0 }) });

      const result = globalThis.JABS_AiManager.maintainLeashAndEngagement(battler, leader);

      expect(result).toEqual(false);
      expect(battler.unlockEngagement).toHaveBeenCalled();
    });

    it('does nothing further when between half-leash and full-leash', () =>
    {
      const battler = buildBattler({
        getCharacter: () => buildCharacter({ _realX: 7, _realY: 0 }),
        getAllyLeashRange: () => 10,
      });
      const leader = buildBattler({ getCharacter: () => buildCharacter({ _realX: 0, _realY: 0 }) });

      const result = globalThis.JABS_AiManager.maintainLeashAndEngagement(battler, leader);

      expect(result).toEqual(false);
      expect(battler.unlockEngagement).not.toHaveBeenCalled();
    });
  });

  describe('rubberbandAlly()', () =>
  {
    it('locks engagement, disengages, resets aggro, and relocates to the leader', () =>
    {
      const character = buildCharacter();
      const battler = buildBattler({ getCharacter: () => character });

      globalThis.JABS_AiManager.rubberbandAlly(battler);

      expect(battler.lockEngagement).toHaveBeenCalled();
      expect(battler.disengageTarget).toHaveBeenCalled();
      expect(battler.resetAllAggro).toHaveBeenCalledWith(null, true);
      expect(character.locate).toHaveBeenCalledWith(0, 0);
    });
  });

  describe('getFollowerIndexFromBattler()', () =>
  {
    it('returns -1 when there is no character', () =>
    {
      expect(globalThis.JABS_AiManager.getFollowerIndexFromBattler(buildBattler({ getCharacter: () => null })))
        .toEqual(-1);
    });

    it('returns -1 when the character is not a follower', () =>
    {
      const battler = buildBattler({ getCharacter: () => buildCharacter({ isFollower: () => false }) });

      expect(globalThis.JABS_AiManager.getFollowerIndexFromBattler(battler)).toEqual(-1);
    });

    it('returns the resolved index within the followers list', () =>
    {
      const character = buildCharacter({ isFollower: () => true });
      globalThis.$gamePlayer.followers = () => ({ data: () => [ {}, character ] });
      const battler = buildBattler({ getCharacter: () => character });

      expect(globalThis.JABS_AiManager.getFollowerIndexFromBattler(battler)).toEqual(1);
    });
  });

  describe('computeFormationTarget()/getFormationOffsets()/calculateFormationSlotCoordinates()', () =>
  {
    it('resolves a known formation type by key', () =>
    {
      expect(globalThis.JABS_AiManager.getFormationOffsets('wedge')).toEqual([ [ 0, 1 ], [ 1, 2 ] ]);
    });

    it('falls back to the first formation type for an unknown key', () =>
    {
      expect(globalThis.JABS_AiManager.getFormationOffsets('unknown')).toEqual([ [ 0, 1 ], [ 1, 1 ], [ -1, 1 ] ]);
    });

    it('computes the absolute slot coordinate for a follower index', () =>
    {
      const leader = buildBattler({ getX: () => 10, getY: () => 10, getCharacter: () => buildCharacter({ direction: () => 2 }) });

      expect(globalThis.JABS_AiManager.computeFormationTarget(leader, 0, 'default')).toEqual([ 10, 11 ]);
    });

    it('clamps a negative follower index to the first formation slot', () =>
    {
      const leader = buildBattler({ getX: () => 10, getY: () => 10, getCharacter: () => buildCharacter({ direction: () => 2 }) });

      expect(globalThis.JABS_AiManager.computeFormationTarget(leader, -1, 'default')).toEqual([ 10, 11 ]);
    });

    it('cycles the follower index through the available slots', () =>
    {
      const leader = buildBattler({ getX: () => 0, getY: () => 0, getCharacter: () => buildCharacter({ direction: () => 2 }) });

      // "wedge" has 2 slots; index 2 should wrap to slot 0.
      expect(globalThis.JABS_AiManager.computeFormationTarget(leader, 2, 'wedge')).toEqual([ 0, 1 ]);
    });
  });

  describe('rotateOffsetForFacing()', () =>
  {
    it('applies identity transform when facing down', () =>
    {
      expect(globalThis.JABS_AiManager.rotateOffsetForFacing(1, 2, 2)).toEqual([ 1, 2 ]);
    });

    it('rotates +90 degrees when facing left', () =>
    {
      expect(globalThis.JABS_AiManager.rotateOffsetForFacing(1, 2, 4)).toEqual([ -2, 1 ]);
    });

    it('rotates -90 degrees when facing right', () =>
    {
      expect(globalThis.JABS_AiManager.rotateOffsetForFacing(1, 2, 6)).toEqual([ 2, -1 ]);
    });

    it('rotates 180 degrees when facing up', () =>
    {
      expect(globalThis.JABS_AiManager.rotateOffsetForFacing(1, 2, 8)).toEqual([ -1, -2 ]);
    });

    it('defaults to identity for an unsupported direction', () =>
    {
      expect(globalThis.JABS_AiManager.rotateOffsetForFacing(1, 2, 99)).toEqual([ 1, 2 ]);
    });
  });

  describe('moveTowardSlotIfNeeded()', () =>
  {
    it('does nothing while dodging', () =>
    {
      const battler = buildBattler({ isDodging: () => true });

      globalThis.JABS_AiManager.moveTowardSlotIfNeeded(battler, 0, 0);

      expect(battler.smartMoveTowardCoordinates).not.toHaveBeenCalled();
    });

    it('does nothing while guarding', () =>
    {
      const battler = buildBattler({ guarding: () => true });

      globalThis.JABS_AiManager.moveTowardSlotIfNeeded(battler, 0, 0);

      expect(battler.smartMoveTowardCoordinates).not.toHaveBeenCalled();
    });

    it('does not move when already within tolerance', () =>
    {
      const battler = buildBattler({ getCharacter: () => buildCharacter({ x: 5, y: 5 }) });

      globalThis.JABS_AiManager.moveTowardSlotIfNeeded(battler, 5, 5);

      expect(battler.smartMoveTowardCoordinates).not.toHaveBeenCalled();
    });

    it('does not re-issue a move command while already moving', () =>
    {
      const battler = buildBattler({ getCharacter: () => buildCharacter({ x: 0, y: 0, isMoving: () => true }) });

      globalThis.JABS_AiManager.moveTowardSlotIfNeeded(battler, 5, 5);

      expect(battler.smartMoveTowardCoordinates).not.toHaveBeenCalled();
    });

    it('does not move when unable to move', () =>
    {
      const battler = buildBattler({ getCharacter: () => buildCharacter({ x: 0, y: 0 }), canBattlerMove: () => false });

      globalThis.JABS_AiManager.moveTowardSlotIfNeeded(battler, 5, 5);

      expect(battler.smartMoveTowardCoordinates).not.toHaveBeenCalled();
    });

    it('smart-moves toward the desired slot when every gate passes', () =>
    {
      const battler = buildBattler({ getCharacter: () => buildCharacter({ x: 0, y: 0 }) });

      globalThis.JABS_AiManager.moveTowardSlotIfNeeded(battler, 5, 5);

      expect(battler.smartMoveTowardCoordinates).toHaveBeenCalledWith(5, 5);
    });
  });

  describe('isWithinTolerance()', () =>
  {
    it('returns true when within tolerance', () =>
    {
      const battler = buildBattler({ getCharacter: () => buildCharacter({ x: 5, y: 5 }) });

      expect(globalThis.JABS_AiManager.isWithinTolerance(battler, 5, 5, 0.5)).toEqual(true);
    });

    it('returns false when outside tolerance', () =>
    {
      const battler = buildBattler({ getCharacter: () => buildCharacter({ x: 0, y: 0 }) });

      expect(globalThis.JABS_AiManager.isWithinTolerance(battler, 5, 5, 0.5)).toEqual(false);
    });
  });

  describe('maintainSafeDistance()', () =>
  {
    it('performs original logic for an enemy battler', () =>
    {
      const battler = buildBattler({ isEnemy: () => true });

      globalThis.JABS_AiManager.maintainSafeDistance(battler);

      expect(originalMaintainSafeDistance).toHaveBeenCalledWith(battler);
    });

    it('holds position within the ally safe band', () =>
    {
      const battler = buildBattler({ distanceToCurrentTarget: () => 5, getCloseDistance: () => 2, getFarDistance: () => 8 });

      globalThis.JABS_AiManager.maintainSafeDistance(battler);

      expect(battler.smartMoveAwayFromTarget).not.toHaveBeenCalled();
      expect(battler.smartMoveTowardTarget).not.toHaveBeenCalled();
    });

    it('moves away when closer than the close distance', () =>
    {
      const battler = buildBattler({ distanceToCurrentTarget: () => 1, getCloseDistance: () => 2, getFarDistance: () => 8 });

      globalThis.JABS_AiManager.maintainSafeDistance(battler);

      expect(battler.smartMoveAwayFromTarget).toHaveBeenCalled();
    });

    it('moves toward when farther than the far distance', () =>
    {
      const battler = buildBattler({ distanceToCurrentTarget: () => 10, getCloseDistance: () => 2, getFarDistance: () => 8 });

      globalThis.JABS_AiManager.maintainSafeDistance(battler);

      expect(battler.smartMoveTowardTarget).toHaveBeenCalled();
    });
  });

  describe('decideAiPhase2Action()', () =>
  {
    it('performs original logic for an enemy battler', () =>
    {
      const battler = buildBattler({ isEnemy: () => true });

      globalThis.JABS_AiManager.decideAiPhase2Action(battler);

      expect(originalDecideAiPhase2Action).toHaveBeenCalledWith(battler);
    });

    it('routes an ally battler into decideAllyAiPhase2Action', () =>
    {
      const battler = buildBattler({ isEnemy: () => false });
      const spy = vi.spyOn(globalThis.JABS_AiManager, 'decideAllyAiPhase2Action').mockImplementation(() => {});

      globalThis.JABS_AiManager.decideAiPhase2Action(battler);

      expect(spy).toHaveBeenCalledWith(battler);
      spy.mockRestore();
    });
  });

  describe('decideAllyAiPhase2Action()', () =>
  {
    it('cancels setup when no skill is decided', () =>
    {
      const battler = buildBattler({ getAllyAiMode: () => ({ decideAction: () => [] }) });

      globalThis.JABS_AiManager.decideAllyAiPhase2Action(battler);

      expect(globalThis.JABS_AiManager.cancelActionSetup).toHaveBeenCalledWith(battler);
      expect(globalThis.JABS_AiManager.setupActionForNextPhase).not.toHaveBeenCalled();
    });

    it('cancels setup when the decided skill id is invalid', () =>
    {
      globalThis.JABS_AiManager.isSkillIdValid.mockReturnValue(false);
      const battler = buildBattler({ getAllyAiMode: () => ({ decideAction: () => [ 5 ] }) });

      globalThis.JABS_AiManager.decideAllyAiPhase2Action(battler);

      expect(globalThis.JABS_AiManager.cancelActionSetup).toHaveBeenCalledWith(battler);
    });

    it('cancels setup when the decided skill is a dodge skill', () =>
    {
      globalThis.JABS_Battler.isDodgeSkillById.mockReturnValue(true);
      const battler = buildBattler({ getAllyAiMode: () => ({ decideAction: () => [ 5 ] }) });

      globalThis.JABS_AiManager.decideAllyAiPhase2Action(battler);

      expect(globalThis.JABS_AiManager.cancelActionSetup).toHaveBeenCalledWith(battler);
    });

    it('cancels setup when the decided skill is a guard skill', () =>
    {
      globalThis.JABS_Battler.isGuardSkillById.mockReturnValue(true);
      const battler = buildBattler({ getAllyAiMode: () => ({ decideAction: () => [ 5 ] }) });

      globalThis.JABS_AiManager.decideAllyAiPhase2Action(battler);

      expect(globalThis.JABS_AiManager.cancelActionSetup).toHaveBeenCalledWith(battler);
    });

    it('strips already-equipped guard skills from the candidate pool before deciding', () =>
    {
      globalThis.JABS_Battler.isGuardSkillById.mockImplementation((id) => id === 1);
      const decideAction = vi.fn(() => []);
      const battler = buildBattler({
        getBattler: () => ({
          getValidSkillSlotsForAlly: () => [ { id: 1 }, { id: 2 } ],
          findSlotForSkillId: () => ({ key: 'combat-1' }),
        }),
        getAllyAiMode: () => ({ decideAction }),
      });

      globalThis.JABS_AiManager.decideAllyAiPhase2Action(battler);

      expect(decideAction).toHaveBeenCalledWith(battler, battler.getTarget(), [ 2 ]);
    });

    it('sets up the action for the next phase with a valid, non-dodge, non-guard skill', () =>
    {
      const battler = buildBattler({ getAllyAiMode: () => ({ decideAction: () => [ 5 ] }) });

      globalThis.JABS_AiManager.decideAllyAiPhase2Action(battler);

      expect(globalThis.JABS_AiManager.setupActionForNextPhase).toHaveBeenCalledWith(battler, 5, 'combat-1');
    });
  });
});
//endregion plugins/abs/ext/allyai/managers/jabs-ai-manager.test.js
