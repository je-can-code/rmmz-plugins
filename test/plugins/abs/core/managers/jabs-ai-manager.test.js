//region plugins/abs/core/managers/jabs-ai-manager.test.js
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * JABS_AiManager.js is the static registry/AI-loop manager for every non-player {@link JABS_Battler}
 * on the map. It is a genuine ES `class` (static-only, never instantiated), so this file dynamically
 * imports it directly rather than patching a bare global constructor. Every sibling model/manager it
 * imports is mocked per the "unit tier mocks all downstream file-external dependencies" convention.
 * This file covers the "cheap tier": pure geometry, team/range filtering, static battler-registry CRUD,
 * spatial indexing, and the simple update-loop gates. The heavier phase 0-3 orchestration (which needs
 * a much larger fake battler surface) is intentionally left for a follow-up pass.
 */
describe('JABS_AiManager (unit, all downstream dependencies mocked)', () =>
{
  /** @type {typeof import('../../../../../src/plugins/abs/core/managers/JABS_AiManager.js').default} */
  let JABS_AiManager;

  // real static method references, captured once after import so per-test overrides (used to
  // isolate one orchestration method from the real bodies of the ones it calls) can be undone.
  let originalGetAlliedBattlers;
  let originalGetAlliedBattlersWithinRange;
  let originalGetOpposingBattlers;
  let originalReleaseAllyCombatGuardIfStale;
  let originalTryDefensiveInterrupt;
  let originalTryRaiseAllyCombatGuard;
  let originalApplyGuardianTargeting;
  let originalAiPhase0;
  let originalAiPhase1;
  let originalAiPhase2;
  let originalAiPhase3;
  let originalNeedsActionDecision;
  let originalNeedsRepositioning;
  let originalNeedsActionExecution;
  let originalDecideAiPhase2Action;
  let originalDecideAiPhase2Movement;
  let originalExecuteAiPhase2Action;
  let originalGetClosestOpposingBattler;
  let originalFindDefensiveThreatBattler;
  let originalGetOpposingBattlersWithinRange;
  let originalDecideEnemyAiPhase2Action;
  let originalCancelActionSetup;
  let originalSetupActionForNextPhase;
  let originalPerformExecutionAnimation;

  /**
   * Builds a minimal fake {@link JABS_Battler} test double with sane defaults, overridable per-test.
   * @param {object} [overrides] Properties/methods to override on the fake battler.
   * @returns {object} A fake battler.
   */
  function buildBattler(overrides = {})
  {
    return {
      uuid: 'battler-uuid',
      getUuid()
      {
        return this.uuid;
      },
      getTeam: () => 0,
      isActor: () => false,
      isEnemy: () => true,
      isFollower: () => false,
      isDead: () => false,
      isPlayer: () => false,
      isInanimate: () => false,
      isWaiting: () => false,
      canIdle: () => false,
      getX: () => 0,
      getY: () => 0,
      distanceToDesignatedTarget: () => 0,
      getCharacter: () => ({ isVisible: () => true }),
      getAllAggros: () => [],
      ...overrides,
    };
  }

  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = {
      ABS: {
        Directions: {
          UP: 8, RIGHT: 6, LEFT: 4, DOWN: 2,
          LOWERLEFT: 1, LOWERRIGHT: 3, UPPERLEFT: 7, UPPERRIGHT: 9,
        },
        Balloons: { Anger: 1 },
        Metadata: {
          MaxAiUpdateRange: 15,
          SupportDecidedAnimationId: 11,
          AttackDecidedAnimationId: 22,
          AiAllyDefensiveGuardMaxHoldFrames: 120,
          AiAllyDefensiveGuardMaintainMaxTiles: 4,
          AiAllyDefensiveGuardHpThresholdPercent: 0.5,
          AiAllyDefensiveGuardChancePercent: 100,
          AiAllyDefensiveGuardCooldownFrames: 60,
          AiDefensiveDodgeChancePercent: 100,
          AiDefensiveDodgeCooldownFrames: 60,
          AiDefensiveThreatRadiusTiles: 6,
        },
        Shapes: { Circle: 'circle', Rhombus: 'rhombus', Square: 'square', Cross: 'cross', Line: 'line', Arc: 'arc', Wall: 'wall' },
        EXT: { DANGER: false },
      },
    };

    globalThis.RPGManager = { chanceIn100: vi.fn(() => false) };

    // sibling model/manager dependencies- mocked entirely per the unit-tier convention.
    vi.doMock('../../../../../src/plugins/abs/core/managers/JABS_TeamRules.js', () => ({
      default: class
      {
        static isFriendly(teamA, teamB)
        {
          return teamA === teamB;
        }

        static isOpposed(teamA, teamB)
        {
          return teamA !== teamB;
        }
      },
    }));
    vi.doMock('../../../../../src/plugins/abs/core/models/JABS_Location.js', () => ({
      default: class
      {
        static Builder()
        {
          const built = {};
          const builder = {
            setX: vi.fn((x) => { built.x = x; return builder; }),
            setY: vi.fn((y) => { built.y = y; return builder; }),
          };
          builder.build = vi.fn(() => ({ getX: () => built.x, getY: () => built.y }));
          return builder;
        }
      },
    }));
    vi.doMock('../../../../../src/plugins/abs/core/models/JABS_BattlerCoreData.js', () => ({
      default: class
      {
        static Builder()
        {
          const built = {};
          const builder = {
            setBattler: vi.fn((v) => { built.battler = v; return builder; }),
            setShowDangerIndicator: vi.fn((v) => { built.showDangerIndicator = v; return builder; }),
          };
          builder.build = vi.fn(() => built);
          return builder;
        }
      },
    }));
    vi.doMock('../../../../../src/plugins/abs/core/models/JABS_Battler.js', () => ({
      default: class
      {
        constructor(character, battler, coreData)
        {
          this.character = character;
          this.battler = battler;
          this.coreData = coreData;
          this.uuid = 'constructed-uuid';
        }

        getUuid()
        {
          return this.uuid;
        }

        static neutralTeamId()
        {
          return -1;
        }

        static isClose()
        {
          return true;
        }

        static isSafe()
        {
          return false;
        }

        static isFar()
        {
          return false;
        }
      },
    }));
    vi.doMock('../../../../../src/plugins/abs/core/models/JABS_ActionOptions.js', () => ({ default: class {} }));
    vi.doMock('../../../../../src/plugins/abs/core/models/JABS_Action.js', () => ({ default: class {} }));

    ({ default: JABS_AiManager } = await import('../../../../../src/plugins/abs/core/managers/JABS_AiManager.js'));

    originalGetAlliedBattlers = JABS_AiManager.getAlliedBattlers;
    originalGetAlliedBattlersWithinRange = JABS_AiManager.getAlliedBattlersWithinRange;
    originalGetOpposingBattlers = JABS_AiManager.getOpposingBattlers;
    originalReleaseAllyCombatGuardIfStale = JABS_AiManager.releaseAllyCombatGuardIfStale;
    originalTryDefensiveInterrupt = JABS_AiManager.tryDefensiveInterrupt;
    originalTryRaiseAllyCombatGuard = JABS_AiManager.tryRaiseAllyCombatGuard;
    originalApplyGuardianTargeting = JABS_AiManager.applyGuardianTargeting;
    originalAiPhase0 = JABS_AiManager.aiPhase0;
    originalAiPhase1 = JABS_AiManager.aiPhase1;
    originalAiPhase2 = JABS_AiManager.aiPhase2;
    originalAiPhase3 = JABS_AiManager.aiPhase3;
    originalNeedsActionDecision = JABS_AiManager.needsActionDecision;
    originalNeedsRepositioning = JABS_AiManager.needsRepositioning;
    originalNeedsActionExecution = JABS_AiManager.needsActionExecution;
    originalDecideAiPhase2Action = JABS_AiManager.decideAiPhase2Action;
    originalDecideAiPhase2Movement = JABS_AiManager.decideAiPhase2Movement;
    originalExecuteAiPhase2Action = JABS_AiManager.executeAiPhase2Action;
    originalGetClosestOpposingBattler = JABS_AiManager.getClosestOpposingBattler;
    originalFindDefensiveThreatBattler = JABS_AiManager.findDefensiveThreatBattler;
    originalGetOpposingBattlersWithinRange = JABS_AiManager.getOpposingBattlersWithinRange;
    originalDecideEnemyAiPhase2Action = JABS_AiManager.decideEnemyAiPhase2Action;
    originalCancelActionSetup = JABS_AiManager.cancelActionSetup;
    originalSetupActionForNextPhase = JABS_AiManager.setupActionForNextPhase;
    originalPerformExecutionAnimation = JABS_AiManager.performExecutionAnimation;
  });

  beforeEach(() =>
  {
    // static Maps persist across tests- reset the registry and spatial grid so nothing leaks.
    JABS_AiManager.clearBattlers();
    JABS_AiManager.spatialIndex.clear();
    globalThis.RPGManager.chanceIn100.mockReset().mockReturnValue(false);
    globalThis.Graphics = { frameCount: 0 };
    globalThis.JABS_Button = { Offhand: 'offhand' };
    globalThis.$jabsEngine = { getAllActionEvents: () => [] };
  });

  //region dir8ToUnitVector
  describe('dir8ToUnitVector()', () =>
  {
    it('returns a downward unit vector for DOWN', () =>
    {
      expect(JABS_AiManager.dir8ToUnitVector(2)).toEqual({ x: 0, y: 1 });
    });

    it('returns an upward unit vector for UP', () =>
    {
      expect(JABS_AiManager.dir8ToUnitVector(8)).toEqual({ x: 0, y: -1 });
    });

    it('returns a rightward unit vector for RIGHT', () =>
    {
      expect(JABS_AiManager.dir8ToUnitVector(6)).toEqual({ x: 1, y: 0 });
    });

    it('returns a leftward unit vector for LEFT', () =>
    {
      expect(JABS_AiManager.dir8ToUnitVector(4)).toEqual({ x: -1, y: 0 });
    });

    it('returns a normalized lower-right diagonal vector', () =>
    {
      const { x, y } = JABS_AiManager.dir8ToUnitVector(3);
      expect(x).toBeCloseTo(Math.SQRT1_2);
      expect(y).toBeCloseTo(Math.SQRT1_2);
    });

    it('returns a normalized lower-left diagonal vector', () =>
    {
      const { x, y } = JABS_AiManager.dir8ToUnitVector(1);
      expect(x).toBeCloseTo(-Math.SQRT1_2);
      expect(y).toBeCloseTo(Math.SQRT1_2);
    });

    it('returns a normalized upper-right diagonal vector', () =>
    {
      const { x, y } = JABS_AiManager.dir8ToUnitVector(9);
      expect(x).toBeCloseTo(Math.SQRT1_2);
      expect(y).toBeCloseTo(-Math.SQRT1_2);
    });

    it('returns a normalized upper-left diagonal vector', () =>
    {
      const { x, y } = JABS_AiManager.dir8ToUnitVector(7);
      expect(x).toBeCloseTo(-Math.SQRT1_2);
      expect(y).toBeCloseTo(-Math.SQRT1_2);
    });

    it('falls back to downward for an unrecognized dir8 code', () =>
    {
      expect(JABS_AiManager.dir8ToUnitVector(5)).toEqual({ x: 0, y: 1 });
    });
  });
  //endregion dir8ToUnitVector

  //region angleToDir8
  describe('angleToDir8()', () =>
  {
    it('maps 0 degrees to RIGHT', () =>
    {
      expect(JABS_AiManager.angleToDir8(0)).toEqual(6);
    });

    it('maps 90 degrees to DOWN', () =>
    {
      expect(JABS_AiManager.angleToDir8(90)).toEqual(2);
    });

    it('maps 180 degrees to LEFT', () =>
    {
      expect(JABS_AiManager.angleToDir8(180)).toEqual(4);
    });

    it('maps 270 degrees to UP', () =>
    {
      expect(JABS_AiManager.angleToDir8(270)).toEqual(8);
    });

    it('normalizes a negative angle before mapping', () =>
    {
      expect(JABS_AiManager.angleToDir8(-90)).toEqual(8);
    });

    it('normalizes an angle greater than 360 before mapping', () =>
    {
      expect(JABS_AiManager.angleToDir8(450)).toEqual(2);
    });
  });
  //endregion angleToDir8

  //region deriveFreshFacingForAi
  describe('deriveFreshFacingForAi()', () =>
  {
    it('falls back to the conventional facing when there is no target', () =>
    {
      const battler = buildBattler({
        getProjectileSpawnBaseDirection: () => 2,
        getAllyTarget: () => null,
        getTarget: () => null,
      });

      expect(JABS_AiManager.deriveFreshFacingForAi(battler)).toEqual(2);
    });

    it('falls back to the conventional facing when the target overlaps the battler', () =>
    {
      const target = { getX: () => 0, getY: () => 0 };
      const battler = buildBattler({
        getProjectileSpawnBaseDirection: () => 2,
        getAllyTarget: () => null,
        getTarget: () => target,
        getX: () => 0,
        getY: () => 0,
      });

      expect(JABS_AiManager.deriveFreshFacingForAi(battler)).toEqual(2);
    });

    it('falls back to the conventional facing when the target is behind the current facing', () =>
    {
      // facing DOWN (0,1); target is straight above- dot product is negative.
      const target = { getX: () => 0, getY: () => -5 };
      const battler = buildBattler({
        getProjectileSpawnBaseDirection: () => 2,
        getAllyTarget: () => null,
        getTarget: () => target,
        getX: () => 0,
        getY: () => 0,
      });

      expect(JABS_AiManager.deriveFreshFacingForAi(battler)).toEqual(2);
    });

    it('prefers the ally target over the opposing target', () =>
    {
      const allyTarget = { getX: () => 5, getY: () => 0 };
      const battler = buildBattler({
        getProjectileSpawnBaseDirection: () => 6,
        getAllyTarget: () => allyTarget,
        getTarget: () => ({ getX: () => -5, getY: () => 0 }),
        getX: () => 0,
        getY: () => 0,
      });

      expect(JABS_AiManager.deriveFreshFacingForAi(battler)).toEqual(6);
    });

    it('derives a fresh facing angle toward a target that is in front', () =>
    {
      // facing RIGHT (1,0); target is straight to the right- angle 0deg maps to RIGHT.
      const target = { getX: () => 5, getY: () => 0 };
      const battler = buildBattler({
        getProjectileSpawnBaseDirection: () => 6,
        getAllyTarget: () => null,
        getTarget: () => target,
        getX: () => 0,
        getY: () => 0,
      });

      expect(JABS_AiManager.deriveFreshFacingForAi(battler)).toEqual(6);
    });
  });
  //endregion deriveFreshFacingForAi

  describe('constructor', () =>
  {
    it('throws since this is a static-only class', () =>
    {
      expect(() => new JABS_AiManager()).toThrow('This is a static class.');
    });
  });

  //region get battlers
  describe('getAllBattlers()', () =>
  {
    it('returns an empty array when no battlers are tracked', () =>
    {
      expect(JABS_AiManager.getAllBattlers()).toEqual([]);
    });

    it('returns every tracked battler', () =>
    {
      const battler = buildBattler();
      JABS_AiManager.addBattler(battler);

      expect(JABS_AiManager.getAllBattlers()).toEqual([ battler ]);
    });
  });

  describe('getBattlerByUuid()', () =>
  {
    it('returns the battler matching the given uuid', () =>
    {
      const battler = buildBattler({ uuid: 'find-me' });
      JABS_AiManager.addBattler(battler);

      expect(JABS_AiManager.getBattlerByUuid('find-me')).toEqual(battler);
    });

    it('returns undefined when no battler matches the uuid', () =>
    {
      expect(JABS_AiManager.getBattlerByUuid('missing')).toBeUndefined();
    });
  });

  describe('getBattlerByEventId()', () =>
  {
    it('returns the battler whose character has the matching event id', () =>
    {
      const battler = buildBattler({ getCharacter: () => ({ eventId: () => 7 }) });
      JABS_AiManager.addBattler(battler);

      expect(JABS_AiManager.getBattlerByEventId(7)).toEqual(battler);
    });

    it('returns undefined when no battler has a matching event id', () =>
    {
      const battler = buildBattler({ getCharacter: () => ({ eventId: () => 7 }) });
      JABS_AiManager.addBattler(battler);

      expect(JABS_AiManager.getBattlerByEventId(99)).toBeUndefined();
    });
  });

  describe('getBattlersWithinRange()', () =>
  {
    it('returns only battlers within the given range', () =>
    {
      const near = buildBattler({ uuid: 'near' });
      const far = buildBattler({ uuid: 'far' });
      JABS_AiManager.addOrUpdateBattlers([ near, far ]);
      const user = buildBattler({
        uuid: 'user',
        distanceToDesignatedTarget: (target) => (target.uuid === 'near' ? 3 : 30),
      });

      expect(JABS_AiManager.getBattlersWithinRange(user, 10)).toEqual([ near ]);
    });
  });

  describe('getLeaderFollowers()', () =>
  {
    it('returns an empty array when the leader battler does not have the leader role', () =>
    {
      const leader = buildBattler({ getBattlerRole: () => ({ leader: false }) });

      expect(JABS_AiManager.getLeaderFollowers(leader)).toEqual([]);
    });

    it('returns nearby, unled, non-actor followers eligible to follow this leader', () =>
    {
      const leader = buildBattler({
        uuid: 'leader',
        getBattlerRole: () => ({ leader: true }),
        getPursuitRadius: () => 10,
        getUuid: () => 'leader',
      });
      const eligibleFollower = buildBattler({
        uuid: 'follower-1',
        isActor: () => false,
        getBattlerRole: () => ({ follower: true, leader: false, solo: false }),
        hasLeader: () => false,
        getLeader: () => null,
      });
      const actorFollower = buildBattler({
        uuid: 'follower-actor',
        isActor: () => true,
        getBattlerRole: () => ({ follower: true, leader: false, solo: false }),
      });
      const soloBattler = buildBattler({
        uuid: 'solo',
        getBattlerRole: () => ({ follower: true, leader: false, solo: true }),
      });
      const alreadyLedElsewhere = buildBattler({
        uuid: 'led-elsewhere',
        getBattlerRole: () => ({ follower: true, leader: false, solo: false }),
        hasLeader: () => true,
        getLeader: () => 'someone-else',
      });
      JABS_AiManager.addOrUpdateBattlers([ eligibleFollower, actorFollower, soloBattler, alreadyLedElsewhere ]);

      expect(JABS_AiManager.getLeaderFollowers(leader)).toEqual([ eligibleFollower ]);
    });
  });

  describe('getAllBattlersDistanceSortedFromBattler()', () =>
  {
    it('sorts all tracked battlers from closest to farthest', () =>
    {
      const far = buildBattler({ uuid: 'far' });
      const near = buildBattler({ uuid: 'near' });
      const origin = buildBattler({
        uuid: 'origin',
        distanceToDesignatedTarget: (target) => (target.uuid === 'near' ? 1 : 10),
      });
      JABS_AiManager.addOrUpdateBattlers([ far, near ]);

      expect(JABS_AiManager.getAllBattlersDistanceSortedFromBattler(origin)).toEqual([ near, far ]);
    });
  });

  describe('getAllBattlersWithinRangeSortedByDistance()', () =>
  {
    it('filters by range then sorts closest to farthest', () =>
    {
      const near = buildBattler({ uuid: 'near' });
      const far = buildBattler({ uuid: 'far' });
      const outOfRange = buildBattler({ uuid: 'out' });
      const origin = buildBattler({
        uuid: 'origin',
        distanceToDesignatedTarget: (target) =>
        {
          if (target.uuid === 'near') return 1;
          if (target.uuid === 'far') return 5;
          return 999;
        },
      });
      JABS_AiManager.addOrUpdateBattlers([ far, near, outOfRange ]);

      expect(JABS_AiManager.getAllBattlersWithinRangeSortedByDistance(origin, 10)).toEqual([ near, far ]);
    });
  });

  describe('getOpposingBattlers()', () =>
  {
    it('returns only battlers on an opposing, non-neutral team', () =>
    {
      const opposing = buildBattler({ uuid: 'opposing', getTeam: () => 1 });
      const neutral = buildBattler({ uuid: 'neutral', getTeam: () => -1 });
      const invisibleFollower = buildBattler({
        uuid: 'invisible-follower', getTeam: () => 1, isFollower: () => true, getCharacter: () => ({ isVisible: () => false }),
      });
      JABS_AiManager.addOrUpdateBattlers([ opposing, neutral, invisibleFollower ]);
      const selected = buildBattler({ uuid: 'selected', getTeam: () => 0 });

      expect(JABS_AiManager.getOpposingBattlers(selected)).toEqual([ opposing ]);
    });
  });

  describe('getOpposingBattlersWithinRange()', () =>
  {
    it('returns opposing battlers filtered further by range', () =>
    {
      const nearOpposing = buildBattler({ uuid: 'near-opposing', getTeam: () => 1 });
      const farOpposing = buildBattler({ uuid: 'far-opposing', getTeam: () => 1 });
      JABS_AiManager.addOrUpdateBattlers([ nearOpposing, farOpposing ]);
      const selected = buildBattler({
        uuid: 'selected',
        getTeam: () => 0,
        distanceToDesignatedTarget: (target) => (target.uuid === 'near-opposing' ? 2 : 99),
      });

      expect(JABS_AiManager.getOpposingBattlersWithinRange(selected, 10)).toEqual([ nearOpposing ]);
    });
  });

  describe('getClosestOpposingBattler()', () =>
  {
    it('returns null when no opposing battlers are within sight', () =>
    {
      const selected = buildBattler({ uuid: 'selected', getTeam: () => 0, getSightRadius: () => 10 });

      expect(JABS_AiManager.getClosestOpposingBattler(selected)).toBeNull();
    });

    it('returns the closest opposing battler within sight', () =>
    {
      const near = buildBattler({ uuid: 'near', getTeam: () => 1 });
      const far = buildBattler({ uuid: 'far', getTeam: () => 1 });
      JABS_AiManager.addOrUpdateBattlers([ far, near ]);
      const selected = buildBattler({
        uuid: 'selected',
        getTeam: () => 0,
        getSightRadius: () => 10,
        distanceToDesignatedTarget: (target) => (target.uuid === 'near' ? 1 : 5),
      });

      expect(JABS_AiManager.getClosestOpposingBattler(selected)).toEqual(near);
    });
  });

  describe('getAlliedBattlers()', () =>
  {
    it('returns only battlers on a friendly, non-neutral team', () =>
    {
      const ally = buildBattler({ uuid: 'ally', getTeam: () => 0 });
      const neutral = buildBattler({ uuid: 'neutral', getTeam: () => -1 });
      JABS_AiManager.addOrUpdateBattlers([ ally, neutral ]);
      const selected = buildBattler({ uuid: 'selected', getTeam: () => 0 });

      expect(JABS_AiManager.getAlliedBattlers(selected)).toEqual([ ally ]);
    });
  });

  describe('getAlliedBattlersWithinRange()', () =>
  {
    it('returns allied battlers filtered further by range', () =>
    {
      const nearAlly = buildBattler({ uuid: 'near-ally', getTeam: () => 0 });
      const farAlly = buildBattler({ uuid: 'far-ally', getTeam: () => 0 });
      JABS_AiManager.addOrUpdateBattlers([ nearAlly, farAlly ]);
      const selected = buildBattler({
        uuid: 'selected',
        getTeam: () => 0,
        distanceToDesignatedTarget: (target) => (target.uuid === 'near-ally' ? 2 : 99),
      });

      expect(JABS_AiManager.getAlliedBattlersWithinRange(selected, 10)).toEqual([ nearAlly ]);
    });
  });

  describe('getActorBattlers()', () =>
  {
    it('returns only battlers that are actors', () =>
    {
      const actor = buildBattler({ uuid: 'actor', isActor: () => true });
      const enemy = buildBattler({ uuid: 'enemy', isActor: () => false });
      JABS_AiManager.addOrUpdateBattlers([ actor, enemy ]);

      expect(JABS_AiManager.getActorBattlers()).toEqual([ actor ]);
    });
  });

  describe('getEnemyBattlers()', () =>
  {
    it('returns only battlers that are enemies', () =>
    {
      const actor = buildBattler({ uuid: 'actor', isEnemy: () => false });
      const enemy = buildBattler({ uuid: 'enemy', isEnemy: () => true });
      JABS_AiManager.addOrUpdateBattlers([ actor, enemy ]);

      expect(JABS_AiManager.getEnemyBattlers()).toEqual([ enemy ]);
    });
  });

  describe('anyLivingEnemiesAggroedToParty()', () =>
  {
    it('returns false when there are no tracked enemies', () =>
    {
      expect(JABS_AiManager.anyLivingEnemiesAggroedToParty()).toEqual(false);
    });

    it('returns false when every tracked enemy is dead', () =>
    {
      JABS_AiManager.addBattler(buildBattler({ isDead: () => true }));

      expect(JABS_AiManager.anyLivingEnemiesAggroedToParty()).toEqual(false);
    });

    it('returns false when a living enemy has no aggros at all', () =>
    {
      JABS_AiManager.addBattler(buildBattler({ getAllAggros: () => [] }));

      expect(JABS_AiManager.anyLivingEnemiesAggroedToParty()).toEqual(false);
    });

    it('returns false when a living enemy has aggros but none are for a living actor', () =>
    {
      JABS_AiManager.addBattler(buildBattler({ getAllAggros: () => [ { isForLivingActor: () => false } ] }));

      expect(JABS_AiManager.anyLivingEnemiesAggroedToParty()).toEqual(false);
    });

    it('returns true when a living enemy has aggro on a living actor', () =>
    {
      JABS_AiManager.addBattler(buildBattler({ getAllAggros: () => [ { isForLivingActor: () => true } ] }));

      expect(JABS_AiManager.anyLivingEnemiesAggroedToParty()).toEqual(true);
    });
  });
  //endregion get battlers

  //region manage battlers
  describe('addOrUpdateBattler()', () =>
  {
    it('adds a battler that is not already tracked', () =>
    {
      const battler = buildBattler();
      JABS_AiManager.addOrUpdateBattler(battler);

      expect(JABS_AiManager.getBattlerByUuid(battler.getUuid())).toEqual(battler);
    });

    it('updates an already-tracked battler in place', () =>
    {
      const original = buildBattler();
      const replacement = buildBattler({ tag: 'replacement' });
      JABS_AiManager.addBattler(original);
      JABS_AiManager.addOrUpdateBattler(replacement);

      expect(JABS_AiManager.getBattlerByUuid('battler-uuid')).toEqual(replacement);
    });
  });

  describe('removeBattler()', () =>
  {
    it('removes a tracked battler', () =>
    {
      const battler = buildBattler();
      JABS_AiManager.addBattler(battler);
      JABS_AiManager.removeBattler(battler);

      expect(JABS_AiManager.getBattlerByUuid('battler-uuid')).toBeUndefined();
    });

    it('does nothing when the battler is not tracked', () =>
    {
      const battler = buildBattler();

      expect(() => JABS_AiManager.removeBattler(battler)).not.toThrow();
    });
  });

  describe('removeBattlers()', () =>
  {
    it('removes every battler in the given collection', () =>
    {
      const a = buildBattler({ uuid: 'a' });
      const b = buildBattler({ uuid: 'b' });
      JABS_AiManager.addOrUpdateBattlers([ a, b ]);
      JABS_AiManager.removeBattlers([ a, b ]);

      expect(JABS_AiManager.getAllBattlers()).toEqual([]);
    });
  });

  describe('clearBattlers()', () =>
  {
    it('clears every tracked battler', () =>
    {
      JABS_AiManager.addBattler(buildBattler());
      JABS_AiManager.clearBattlers();

      expect(JABS_AiManager.getAllBattlers()).toEqual([]);
    });
  });

  describe('canConvertEventToBattler()', () =>
  {
    it('returns false when the event is not a jabs battler', () =>
    {
      const event = { isJabsBattler: () => false };

      expect(JABS_AiManager.canConvertEventToBattler(event)).toEqual(false);
    });

    it('returns true when the event is a jabs battler', () =>
    {
      const event = { isJabsBattler: () => true };

      expect(JABS_AiManager.canConvertEventToBattler(event)).toEqual(true);
    });
  });

  describe('convertEventToBattler()', () =>
  {
    it('clears the jabs battler uuid and returns null when the event is not convertable', () =>
    {
      const event = { isJabsBattler: () => false, setJabsBattlerUuid: vi.fn() };

      expect(JABS_AiManager.convertEventToBattler(event)).toBeNull();
      expect(event.setJabsBattlerUuid).toHaveBeenCalledWith(String.empty);
    });

    it('builds and tracks a new battler from a convertable event', () =>
    {
      globalThis.Game_Enemy = class
      {
        constructor(battlerId)
        {
          this.battlerId = battlerId;
          this.recoverAllCalled = false;
        }

        recoverAll()
        {
          this.recoverAllCalled = true;
        }
      };
      const event = {
        isJabsBattler: () => true,
        setJabsBattlerUuid: vi.fn(),
        getBattlerId: () => 5,
        getBattlerCoreData: () => ({}),
      };

      const result = JABS_AiManager.convertEventToBattler(event);

      expect(result.uuid).toEqual('constructed-uuid');
      expect(event.setJabsBattlerUuid).toHaveBeenCalledWith('constructed-uuid');
    });
  });

  describe('convertEventsToBattlers()', () =>
  {
    it('converts only the convertable events, dropping the null results', () =>
    {
      globalThis.Game_Enemy = class
      {
        recoverAll()
        {
        }
      };
      const convertable = {
        isJabsBattler: () => true,
        setJabsBattlerUuid: vi.fn(),
        getBattlerId: () => 1,
        getBattlerCoreData: () => ({}),
      };
      const notConvertable = { isJabsBattler: () => false, setJabsBattlerUuid: vi.fn() };

      const results = JABS_AiManager.convertEventsToBattlers([ convertable, notConvertable ]);

      expect(results).toHaveLength(1);
    });
  });

  describe('canConvertFollowerToBattler()', () =>
  {
    it('returns false when the follower has no bound actor', () =>
    {
      const follower = { actor: () => null };

      expect(JABS_AiManager.canConvertFollowerToBattler(follower)).toEqual(false);
    });

    it('returns true when the follower has a bound actor', () =>
    {
      const follower = { actor: () => ({}) };

      expect(JABS_AiManager.canConvertFollowerToBattler(follower)).toEqual(true);
    });
  });

  describe('convertFollowerToBattler()', () =>
  {
    it('returns null when the follower cannot be converted', () =>
    {
      const follower = { actor: () => null };

      expect(JABS_AiManager.convertFollowerToBattler(follower)).toBeNull();
    });

    it('builds and binds a new battler from a convertable follower', () =>
    {
      const follower = { actor: () => ({}), setJabsBattlerUuid: vi.fn() };

      const result = JABS_AiManager.convertFollowerToBattler(follower);

      expect(result.uuid).toEqual('constructed-uuid');
      expect(follower.setJabsBattlerUuid).toHaveBeenCalledWith('constructed-uuid');
    });

    it('suppresses the danger indicator for allies when the danger extension is present', () =>
    {
      globalThis.J.ABS.EXT.DANGER = true;
      const follower = { actor: () => ({}), setJabsBattlerUuid: vi.fn() };

      const result = JABS_AiManager.convertFollowerToBattler(follower);

      expect(result.coreData.showDangerIndicator).toBe(false);

      globalThis.J.ABS.EXT.DANGER = false;
    });
  });

  describe('convertFollowersToBattlers()', () =>
  {
    it('converts only the convertable followers, dropping the null results', () =>
    {
      const convertable = { actor: () => ({}), setJabsBattlerUuid: vi.fn() };
      const notConvertable = { actor: () => null };

      const results = JABS_AiManager.convertFollowersToBattlers([ convertable, notConvertable ]);

      expect(results).toHaveLength(1);
    });
  });
  //endregion manage battlers

  //region spatial indexing
  describe('rebuildSpatialIndex()/queryBattlersInAabb()', () =>
  {
    it('indexes tracked battlers by their floored tile coordinates', () =>
    {
      const battler = buildBattler({ getX: () => 2.9, getY: () => 3.1 });
      JABS_AiManager.addBattler(battler);
      JABS_AiManager.rebuildSpatialIndex();

      expect(JABS_AiManager.queryBattlersInAabb(2, 3, 2, 3)).toEqual([ battler ]);
    });

    it('returns a deduplicated union of candidates across all covered cells', () =>
    {
      const a = buildBattler({ uuid: 'a', getX: () => 0, getY: () => 0 });
      const b = buildBattler({ uuid: 'b', getX: () => 1, getY: () => 1 });
      JABS_AiManager.addOrUpdateBattlers([ a, b ]);
      JABS_AiManager.rebuildSpatialIndex();

      const results = JABS_AiManager.queryBattlersInAabb(0, 0, 1, 1);
      expect(results).toHaveLength(2);
      expect(results).toEqual(expect.arrayContaining([ a, b ]));
    });

    it('returns an empty array when no battlers occupy the queried cells', () =>
    {
      JABS_AiManager.rebuildSpatialIndex();

      expect(JABS_AiManager.queryBattlersInAabb(0, 0, 0, 0)).toEqual([]);
    });

    it('adds multiple battlers occupying the same tile to the same bucket', () =>
    {
      const a = buildBattler({ uuid: 'a', getX: () => 4, getY: () => 4 });
      const b = buildBattler({ uuid: 'b', getX: () => 4, getY: () => 4 });
      JABS_AiManager.addOrUpdateBattlers([ a, b ]);
      JABS_AiManager.rebuildSpatialIndex();

      const results = JABS_AiManager.queryBattlersInAabb(4, 4, 4, 4);
      expect(results).toHaveLength(2);
      expect(results).toEqual(expect.arrayContaining([ a, b ]));
    });

    it('normalizes inverted min/max bounds before querying', () =>
    {
      const battler = buildBattler({ getX: () => 0, getY: () => 0 });
      JABS_AiManager.addBattler(battler);
      JABS_AiManager.rebuildSpatialIndex();

      expect(JABS_AiManager.queryBattlersInAabb(5, 5, -5, -5)).toEqual([ battler ]);
    });
  });
  //endregion spatial indexing

  //region update loop gates
  describe('canUpdate()', () =>
  {
    beforeEach(() =>
    {
      globalThis.$jabsEngine = { absPause: false };
      globalThis.$gameMessage = { isBusy: () => false };
      globalThis.$gameMap = { isEventRunning: () => false };
    });

    it('returns false when the engine is paused', () =>
    {
      globalThis.$jabsEngine.absPause = true;

      expect(JABS_AiManager.canUpdate()).toEqual(false);
    });

    it('returns false when the message window is busy', () =>
    {
      globalThis.$gameMessage.isBusy = () => true;

      expect(JABS_AiManager.canUpdate()).toEqual(false);
    });

    it('returns false when the map is running an event', () =>
    {
      globalThis.$gameMap.isEventRunning = () => true;

      expect(JABS_AiManager.canUpdate()).toEqual(false);
    });

    it('returns true when nothing is blocking the update', () =>
    {
      expect(JABS_AiManager.canUpdate()).toEqual(true);
    });
  });

  describe('update()/manageAi()/handleBattlerAi()', () =>
  {
    beforeEach(() =>
    {
      globalThis.$jabsEngine = { absPause: false, getPlayer1: () => buildBattler({ uuid: 'player1' }) };
      globalThis.$gameMessage = { isBusy: () => false };
      globalThis.$gameMap = { isEventRunning: () => false };
    });

    it('does nothing when canUpdate() is false', () =>
    {
      globalThis.$jabsEngine.absPause = true;
      const spy = vi.spyOn(JABS_AiManager, 'manageAi');

      JABS_AiManager.update();

      expect(spy).not.toHaveBeenCalled();
      spy.mockRestore();
    });

    it('calls manageAi() when canUpdate() is true', () =>
    {
      const spy = vi.spyOn(JABS_AiManager, 'manageAi').mockImplementation(() => {});

      JABS_AiManager.update();

      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });

    it('does nothing when there are no battlers within range', () =>
    {
      const spy = vi.spyOn(JABS_AiManager, 'handleBattlerAi');

      JABS_AiManager.manageAi();

      expect(spy).not.toHaveBeenCalled();
      spy.mockRestore();
    });

    it('handles the ai of each battler within range of the player', () =>
    {
      const battler = buildBattler({ uuid: 'in-range' });
      JABS_AiManager.addBattler(battler);
      const spy = vi.spyOn(JABS_AiManager, 'handleBattlerAi').mockImplementation(() => {});

      JABS_AiManager.manageAi();

      // dispatched via Array#forEach, so index/array are also passed along- only the first arg matters here.
      expect(spy.mock.calls[0][0]).toEqual(battler);
      spy.mockRestore();
    });

    it('does not execute ai for a battler that cannot be managed', () =>
    {
      const battler = buildBattler({ isDead: () => true });
      const spy = vi.spyOn(JABS_AiManager, 'executeAi');

      JABS_AiManager.handleBattlerAi(battler);

      expect(spy).not.toHaveBeenCalled();
      spy.mockRestore();
    });

    it('executes ai for a battler that can be managed', () =>
    {
      const battler = buildBattler({ isWaiting: () => true, isInanimate: () => false });
      const spy = vi.spyOn(JABS_AiManager, 'executeAi').mockImplementation(() => {});

      JABS_AiManager.handleBattlerAi(battler);

      expect(spy).toHaveBeenCalledWith(battler);
      spy.mockRestore();
    });
  });

  describe('canManageAi()', () =>
  {
    it('returns false for a dead battler', () =>
    {
      const battler = buildBattler({ isDead: () => true });

      expect(JABS_AiManager.canManageAi(battler)).toEqual(false);
    });

    it('returns false for the player battler', () =>
    {
      const battler = buildBattler({ isPlayer: () => true });

      expect(JABS_AiManager.canManageAi(battler)).toEqual(false);
    });

    it('returns false for an inanimate battler that cannot idle', () =>
    {
      const battler = buildBattler({ isPlayer: () => false, isInanimate: () => true, canIdle: () => false });

      expect(JABS_AiManager.canManageAi(battler)).toEqual(false);
    });

    it('returns true for an inanimate battler that can idle', () =>
    {
      const battler = buildBattler({ isPlayer: () => false, isInanimate: () => true, canIdle: () => true });

      expect(JABS_AiManager.canManageAi(battler)).toEqual(true);
    });

    it('returns false for an invisible follower', () =>
    {
      const battler = buildBattler({
        isPlayer: () => false,
        isInanimate: () => false,
        isFollower: () => true,
        getCharacter: () => ({ isVisible: () => false }),
      });

      expect(JABS_AiManager.canManageAi(battler)).toEqual(false);
    });

    it('returns true for a normal, living, visible, non-player battler', () =>
    {
      const battler = buildBattler({ isPlayer: () => false, isInanimate: () => false });

      expect(JABS_AiManager.canManageAi(battler)).toEqual(true);
    });
  });
  //endregion update loop gates

  //region isSkillIdValid
  describe('isSkillIdValid()', () =>
  {
    it('returns false for a falsy skill id', () =>
    {
      expect(JABS_AiManager.isSkillIdValid(0)).toEqual(false);
      expect(JABS_AiManager.isSkillIdValid(null)).toEqual(false);
      expect(JABS_AiManager.isSkillIdValid(undefined)).toEqual(false);
    });

    it('returns false for an array of skill ids', () =>
    {
      expect(JABS_AiManager.isSkillIdValid([ 1, 2 ])).toEqual(false);
    });

    it('returns true for a single truthy skill id', () =>
    {
      expect(JABS_AiManager.isSkillIdValid(5)).toEqual(true);
    });
  });
  //endregion isSkillIdValid

  //region _spatialKey
  describe('_spatialKey()', () =>
  {
    it('builds a comma-joined coordinate key', () =>
    {
      expect(JABS_AiManager._spatialKey(3, 4)).toEqual('3,4');
    });
  });
  //endregion _spatialKey

  //region canManageAi
  describe('canManageAi()', () =>
  {
    it('returns false for a dead battler', () =>
    {
      const battler = buildBattler({ isDead: () => true });
      expect(JABS_AiManager.canManageAi(battler)).toEqual(false);
    });

    it('returns false for the player', () =>
    {
      const battler = buildBattler({ isDead: () => false, isPlayer: () => true });
      expect(JABS_AiManager.canManageAi(battler)).toEqual(false);
    });

    it('returns false for an inanimate battler that cannot idle', () =>
    {
      const battler = buildBattler({ isInanimate: () => true, canIdle: () => false });
      expect(JABS_AiManager.canManageAi(battler)).toEqual(false);
    });

    it('returns true for an inanimate battler that can idle', () =>
    {
      const battler = buildBattler({ isInanimate: () => true, canIdle: () => true, isFollower: () => false });
      expect(JABS_AiManager.canManageAi(battler)).toEqual(true);
    });

    it('returns false for an invisible follower', () =>
    {
      const battler = buildBattler({ isFollower: () => true, getCharacter: () => ({ isVisible: () => false }) });
      expect(JABS_AiManager.canManageAi(battler)).toEqual(false);
    });

    it('returns true for a visible follower', () =>
    {
      const battler = buildBattler({ isFollower: () => true, getCharacter: () => ({ isVisible: () => true }) });
      expect(JABS_AiManager.canManageAi(battler)).toEqual(true);
    });

    it('returns true for an ordinary living, visible, non-player battler', () =>
    {
      const battler = buildBattler();
      expect(JABS_AiManager.canManageAi(battler)).toEqual(true);
    });
  });
  //endregion canManageAi

  //region aiPhase0 (idle phase)
  describe('aiPhase0() / seekForAlerter() / goHome() / moveIdly() / canMoveIdly() / shouldMoveIdly()', () =>
  {
    function buildIdleBattler(overrides = {})
    {
      const character = {
        isStopping: () => true,
        isVisible: () => true,
        findDirectionTo: vi.fn(() => 2),
        moveStraight: vi.fn(),
        moveRandom: vi.fn(),
        ...overrides.character,
      };

      return buildBattler({
        canIdle: () => true,
        isIdle: () => false,
        isAlerted: () => false,
        isHome: () => false,
        isMovementLockedByState: () => false,
        getAlertedCoordinates: () => [ 1, 2 ],
        smartMoveTowardCoordinates: vi.fn(),
        getHomeX: () => 10,
        getHomeY: () => 10,
        isIdleActionReady: () => true,
        distanceToHome: () => 0,
        resetIdleAction: vi.fn(),
        setIdle: vi.fn(),
        getCharacter: () => character,
        ...overrides,
      });
    }

    describe('aiPhase0()', () =>
    {
      it('does nothing when the battler cannot idle', () =>
      {
        const battler = buildIdleBattler({ canIdle: () => false });
        battler.getCharacter().isStopping = vi.fn(() => true);

        JABS_AiManager.aiPhase0(battler);

        expect(battler.getCharacter().moveRandom).not.toHaveBeenCalled();
      });

      it('does nothing while the character is still in motion', () =>
      {
        const battler = buildIdleBattler({ isIdle: () => true });
        battler.getCharacter().isStopping = () => false;

        JABS_AiManager.aiPhase0(battler);

        expect(battler.getCharacter().moveRandom).not.toHaveBeenCalled();
      });

      it('seeks the alerter when stopped and alerted', () =>
      {
        const battler = buildIdleBattler({ isAlerted: () => true });

        JABS_AiManager.aiPhase0(battler);

        expect(battler.smartMoveTowardCoordinates).toHaveBeenCalledWith(1, 2);
      });

      it('goes home when stopped, not idle, not alerted, and not home', () =>
      {
        const battler = buildIdleBattler({ isIdle: () => false, isAlerted: () => false, isHome: () => false });

        JABS_AiManager.aiPhase0(battler);

        expect(battler.getCharacter().moveStraight).toHaveBeenCalledWith(2);
      });

      it('does nothing when stopped, not idle, not alerted, but already home', () =>
      {
        const battler = buildIdleBattler({ isIdle: () => false, isAlerted: () => false, isHome: () => true });

        JABS_AiManager.aiPhase0(battler);

        expect(battler.getCharacter().moveStraight).not.toHaveBeenCalled();
        expect(battler.resetIdleAction).not.toHaveBeenCalled();
      });

      it('moves idly when stopped and idle', () =>
      {
        globalThis.RPGManager.chanceIn100.mockReturnValue(true);
        const battler = buildIdleBattler({ isIdle: () => true, isAlerted: () => false });

        JABS_AiManager.aiPhase0(battler);

        expect(battler.resetIdleAction).toHaveBeenCalled();
      });
    });

    describe('seekForAlerter()', () =>
    {
      it('does not move when movement is locked by state', () =>
      {
        const battler = buildIdleBattler({ isMovementLockedByState: () => true });

        JABS_AiManager.seekForAlerter(battler);

        expect(battler.smartMoveTowardCoordinates).not.toHaveBeenCalled();
      });

      it('moves toward the last-alerted coordinates', () =>
      {
        const battler = buildIdleBattler({ getAlertedCoordinates: () => [ 5, 9 ] });

        JABS_AiManager.seekForAlerter(battler);

        expect(battler.smartMoveTowardCoordinates).toHaveBeenCalledWith(5, 9);
      });
    });

    describe('goHome()', () =>
    {
      it('does not move when movement is locked by state', () =>
      {
        const battler = buildIdleBattler({ isMovementLockedByState: () => true });

        JABS_AiManager.goHome(battler);

        expect(battler.getCharacter().moveStraight).not.toHaveBeenCalled();
      });

      it('takes a step toward home without flagging idle when not yet home', () =>
      {
        const battler = buildIdleBattler({ isHome: () => false });

        JABS_AiManager.goHome(battler);

        expect(battler.getCharacter().moveStraight).toHaveBeenCalledWith(2);
        expect(battler.setIdle).not.toHaveBeenCalled();
      });

      it('flags the battler as idle once home is reached', () =>
      {
        const battler = buildIdleBattler({ isHome: () => true });

        JABS_AiManager.goHome(battler);

        expect(battler.setIdle).toHaveBeenCalledWith(true);
      });
    });

    describe('canMoveIdly() / shouldMoveIdly()', () =>
    {
      it('returns false when the idle action is not ready', () =>
      {
        const battler = buildIdleBattler({ isIdleActionReady: () => false });
        expect(JABS_AiManager.canMoveIdly(battler)).toEqual(false);
      });

      it('returns false when RNG does not favor idling', () =>
      {
        globalThis.RPGManager.chanceIn100.mockReturnValue(false);
        const battler = buildIdleBattler({ isIdleActionReady: () => true });
        expect(JABS_AiManager.canMoveIdly(battler)).toEqual(false);
      });

      it('returns true when the idle action is ready and RNG favors idling', () =>
      {
        globalThis.RPGManager.chanceIn100.mockReturnValue(true);
        const battler = buildIdleBattler({ isIdleActionReady: () => true });
        expect(JABS_AiManager.canMoveIdly(battler)).toEqual(true);
      });

      it('delegates to RPGManager.chanceIn100 with a flat 1% weight', () =>
      {
        JABS_AiManager.shouldMoveIdly();
        expect(globalThis.RPGManager.chanceIn100).toHaveBeenCalledWith(1);
      });
    });

    describe('moveIdly()', () =>
    {
      it('does nothing when the battler cannot move idly', async () =>
      {
        globalThis.RPGManager.chanceIn100.mockReturnValue(false);
        const battler = buildIdleBattler({ isIdleActionReady: () => false });

        JABS_AiManager.moveIdly(battler);

        expect(battler.resetIdleAction).not.toHaveBeenCalled();
      });

      it('wanders randomly when close to home', async () =>
      {
        globalThis.RPGManager.chanceIn100.mockReturnValue(true);
        const { default: JABS_Battler } = await import('../../../../../src/plugins/abs/core/models/JABS_Battler.js');
        JABS_Battler.isClose = () => true;
        const battler = buildIdleBattler();

        JABS_AiManager.moveIdly(battler);

        expect(battler.getCharacter().moveRandom).toHaveBeenCalled();
        expect(battler.resetIdleAction).toHaveBeenCalled();
      });

      it('walks toward home when not close to home', async () =>
      {
        globalThis.RPGManager.chanceIn100.mockReturnValue(true);
        const { default: JABS_Battler } = await import('../../../../../src/plugins/abs/core/models/JABS_Battler.js');
        JABS_Battler.isClose = () => false;
        const battler = buildIdleBattler();

        JABS_AiManager.moveIdly(battler);

        expect(battler.getCharacter().moveStraight).toHaveBeenCalledWith(2);
        expect(battler.getCharacter().moveRandom).not.toHaveBeenCalled();

        // restore the shared mock's default for later tests.
        JABS_Battler.isClose = () => true;
      });
    });
  });
  //endregion aiPhase0 (idle phase)

  //region guardian targeting
  describe('applyGuardianTargeting() / getGuardianWardAttacker()', () =>
  {
    function buildGuardian(overrides = {})
    {
      return buildBattler({
        getGuardRange: () => null,
        getSightRadius: () => 5,
        isEngaged: () => false,
        engageTarget: vi.fn(),
        getTarget: () => null,
        setTarget: vi.fn(),
        showBalloon: vi.fn(),
        ...overrides,
      });
    }

    afterEach(() =>
    {
      JABS_AiManager.getAlliedBattlersWithinRange = originalGetAlliedBattlersWithinRange;
      JABS_AiManager.getOpposingBattlers = originalGetOpposingBattlers;
    });

    it('does nothing when no ward is nearby', () =>
    {
      JABS_AiManager.getAlliedBattlersWithinRange = () => [];
      const guardian = buildGuardian();

      JABS_AiManager.applyGuardianTargeting(guardian);

      expect(guardian.engageTarget).not.toHaveBeenCalled();
      expect(guardian.setTarget).not.toHaveBeenCalled();
    });

    it('does nothing when no ward is currently under attack', () =>
    {
      const ward = buildBattler({ getBattlerRole: () => ({ ward: true }), getUuid: () => 'ward-uuid' });
      JABS_AiManager.getAlliedBattlersWithinRange = () => [ ward ];
      JABS_AiManager.getOpposingBattlers = () => [ buildBattler({ getTarget: () => null }) ];
      const guardian = buildGuardian();

      JABS_AiManager.applyGuardianTargeting(guardian);

      expect(guardian.engageTarget).not.toHaveBeenCalled();
      expect(guardian.setTarget).not.toHaveBeenCalled();
    });

    it('ignores allies that are not ward-role', () =>
    {
      const nonWard = buildBattler({ getBattlerRole: () => ({ ward: false }) });
      JABS_AiManager.getAlliedBattlersWithinRange = () => [ nonWard ];
      const getOpposingSpy = vi.fn(() => []);
      JABS_AiManager.getOpposingBattlers = getOpposingSpy;
      const guardian = buildGuardian();

      JABS_AiManager.applyGuardianTargeting(guardian);

      // no wards survive the filter, so the scan short-circuits before ever asking for enemies.
      expect(getOpposingSpy).not.toHaveBeenCalled();
    });

    it('engages the attacker directly when the guardian is not yet engaged', () =>
    {
      const attacker = buildBattler({ getUuid: () => 'attacker-uuid' });
      const ward = buildBattler({ getBattlerRole: () => ({ ward: true }), getUuid: () => 'ward-uuid' });
      JABS_AiManager.getAlliedBattlersWithinRange = () => [ ward ];
      JABS_AiManager.getOpposingBattlers = () => [ buildBattler({ getTarget: () => ward }) ];
      const guardian = buildGuardian({ isEngaged: () => false });

      JABS_AiManager.applyGuardianTargeting(guardian);

      expect(guardian.engageTarget).toHaveBeenCalled();
      expect(guardian.setTarget).not.toHaveBeenCalled();
    });

    it('redirects an already-engaged guardian to the ward\'s attacker', () =>
    {
      const ward = buildBattler({ getBattlerRole: () => ({ ward: true }), getUuid: () => 'ward-uuid' });
      const attacker = buildBattler({ getTarget: () => ward, getUuid: () => 'attacker-uuid' });
      JABS_AiManager.getAlliedBattlersWithinRange = () => [ ward ];
      JABS_AiManager.getOpposingBattlers = () => [ attacker ];
      const guardian = buildGuardian({ isEngaged: () => true, getTarget: () => null });

      JABS_AiManager.applyGuardianTargeting(guardian);

      expect(guardian.setTarget).toHaveBeenCalledWith(attacker);
      expect(guardian.showBalloon).toHaveBeenCalledWith(J.ABS.Balloons.Anger);
    });

    it('does not re-show the anger balloon when the target is not actually changing', () =>
    {
      const ward = buildBattler({ getBattlerRole: () => ({ ward: true }), getUuid: () => 'ward-uuid' });
      const attacker = buildBattler({ getTarget: () => ward, getUuid: () => 'attacker-uuid' });
      JABS_AiManager.getAlliedBattlersWithinRange = () => [ ward ];
      JABS_AiManager.getOpposingBattlers = () => [ attacker ];
      const guardian = buildGuardian({ isEngaged: () => true, getTarget: () => attacker });

      JABS_AiManager.applyGuardianTargeting(guardian);

      expect(guardian.showBalloon).not.toHaveBeenCalled();
      expect(guardian.setTarget).toHaveBeenCalledWith(attacker);
    });

    it('uses the explicit guard range over the sight radius when scanning for wards', () =>
    {
      const rangeSpy = vi.fn(() => []);
      JABS_AiManager.getAlliedBattlersWithinRange = rangeSpy;
      const guardian = buildGuardian({ getGuardRange: () => 3, getSightRadius: () => 99 });

      JABS_AiManager.applyGuardianTargeting(guardian);

      expect(rangeSpy).toHaveBeenCalledWith(guardian, 3);
    });

    it('falls back to the sight radius when no explicit guard range is configured', () =>
    {
      const rangeSpy = vi.fn(() => []);
      JABS_AiManager.getAlliedBattlersWithinRange = rangeSpy;
      const guardian = buildGuardian({ getGuardRange: () => null, getSightRadius: () => 7 });

      JABS_AiManager.applyGuardianTargeting(guardian);

      expect(rangeSpy).toHaveBeenCalledWith(guardian, 7);
    });
  });
  //endregion guardian targeting

  //region executeAi
  describe('executeAi()', () =>
  {
    function buildEngineBattler(overrides = {})
    {
      return buildBattler({
        isWaiting: () => false,
        isInanimate: () => false,
        isEngaged: () => false,
        adjustTargetByAggro: vi.fn(),
        getBattlerRole: () => ({ guardian: false }),
        setIdle: vi.fn(),
        getPhase: () => 0,
        canIdle: () => false,
        getCharacter: () => ({ isStopping: () => false }),
        ...overrides,
      });
    }

    afterEach(() =>
    {
      JABS_AiManager.releaseAllyCombatGuardIfStale = originalReleaseAllyCombatGuardIfStale;
      JABS_AiManager.tryDefensiveInterrupt = originalTryDefensiveInterrupt;
      JABS_AiManager.tryRaiseAllyCombatGuard = originalTryRaiseAllyCombatGuard;
      JABS_AiManager.applyGuardianTargeting = originalApplyGuardianTargeting;
      JABS_AiManager.aiPhase0 = originalAiPhase0;
      JABS_AiManager.aiPhase1 = originalAiPhase1;
      JABS_AiManager.aiPhase2 = originalAiPhase2;
      JABS_AiManager.aiPhase3 = originalAiPhase3;
    });

    it('does nothing when the battler is waiting', () =>
    {
      JABS_AiManager.aiPhase0 = vi.fn();
      const battler = buildEngineBattler({ isWaiting: () => true });

      JABS_AiManager.executeAi(battler);

      expect(JABS_AiManager.aiPhase0).not.toHaveBeenCalled();
    });

    it('only idles an inanimate battler, skipping combat AI entirely', () =>
    {
      JABS_AiManager.aiPhase0 = vi.fn();
      JABS_AiManager.releaseAllyCombatGuardIfStale = vi.fn();
      const battler = buildEngineBattler({ isInanimate: () => true });

      JABS_AiManager.executeAi(battler);

      expect(JABS_AiManager.aiPhase0).toHaveBeenCalledWith(battler);
      expect(JABS_AiManager.releaseAllyCombatGuardIfStale).not.toHaveBeenCalled();
    });

    it('idles a non-guardian, non-engaged battler', () =>
    {
      JABS_AiManager.releaseAllyCombatGuardIfStale = vi.fn();
      JABS_AiManager.aiPhase0 = vi.fn();
      const battler = buildEngineBattler({ isEngaged: () => false });

      JABS_AiManager.executeAi(battler);

      expect(JABS_AiManager.aiPhase0).toHaveBeenCalledWith(battler);
    });

    it('applies guardian targeting for a non-engaged guardian', () =>
    {
      JABS_AiManager.releaseAllyCombatGuardIfStale = vi.fn();
      JABS_AiManager.applyGuardianTargeting = vi.fn();
      JABS_AiManager.aiPhase0 = vi.fn();
      const battler = buildEngineBattler({ isEngaged: () => false, getBattlerRole: () => ({ guardian: true }) });

      JABS_AiManager.executeAi(battler);

      expect(JABS_AiManager.applyGuardianTargeting).toHaveBeenCalledWith(battler);
    });

    it('stops early once removing dead aggros disengages the battler', () =>
    {
      let engaged = true;
      JABS_AiManager.releaseAllyCombatGuardIfStale = vi.fn();
      JABS_AiManager.aiPhase1 = vi.fn();
      const battler = buildEngineBattler({
        isEngaged: () => engaged,
        adjustTargetByAggro: vi.fn(() => { engaged = false; }),
        getPhase: () => 1,
      });

      JABS_AiManager.executeAi(battler);

      expect(JABS_AiManager.aiPhase1).not.toHaveBeenCalled();
    });

    it('applies guardian targeting for an engaged guardian before clearing idle', () =>
    {
      JABS_AiManager.releaseAllyCombatGuardIfStale = vi.fn();
      JABS_AiManager.applyGuardianTargeting = vi.fn();
      JABS_AiManager.tryDefensiveInterrupt = vi.fn(() => false);
      JABS_AiManager.tryRaiseAllyCombatGuard = vi.fn();
      JABS_AiManager.aiPhase0 = vi.fn();
      const battler = buildEngineBattler({
        isEngaged: () => true,
        getBattlerRole: () => ({ guardian: true }),
        getPhase: () => 0,
      });

      JABS_AiManager.executeAi(battler);

      expect(JABS_AiManager.applyGuardianTargeting).toHaveBeenCalledWith(battler);
      expect(battler.setIdle).toHaveBeenCalledWith(false);
    });

    it('stops early when the defensive interrupt takes over the tick', () =>
    {
      JABS_AiManager.releaseAllyCombatGuardIfStale = vi.fn();
      JABS_AiManager.tryDefensiveInterrupt = vi.fn(() => true);
      JABS_AiManager.tryRaiseAllyCombatGuard = vi.fn();
      JABS_AiManager.aiPhase0 = vi.fn();
      const battler = buildEngineBattler({ isEngaged: () => true });

      JABS_AiManager.executeAi(battler);

      expect(JABS_AiManager.tryRaiseAllyCombatGuard).not.toHaveBeenCalled();
      expect(JABS_AiManager.aiPhase0).not.toHaveBeenCalled();
    });

    it('dispatches to aiPhase0 by default when engaged with an unrecognized phase', () =>
    {
      JABS_AiManager.releaseAllyCombatGuardIfStale = vi.fn();
      JABS_AiManager.tryDefensiveInterrupt = vi.fn(() => false);
      JABS_AiManager.tryRaiseAllyCombatGuard = vi.fn();
      JABS_AiManager.aiPhase0 = vi.fn();
      const battler = buildEngineBattler({ isEngaged: () => true, getPhase: () => 0 });

      JABS_AiManager.executeAi(battler);

      expect(JABS_AiManager.aiPhase0).toHaveBeenCalledWith(battler);
    });

    it('dispatches to aiPhase1 when engaged and on phase 1', () =>
    {
      JABS_AiManager.releaseAllyCombatGuardIfStale = vi.fn();
      JABS_AiManager.tryDefensiveInterrupt = vi.fn(() => false);
      JABS_AiManager.tryRaiseAllyCombatGuard = vi.fn();
      JABS_AiManager.aiPhase1 = vi.fn();
      const battler = buildEngineBattler({ isEngaged: () => true, getPhase: () => 1 });

      JABS_AiManager.executeAi(battler);

      expect(JABS_AiManager.aiPhase1).toHaveBeenCalledWith(battler);
    });

    it('dispatches to aiPhase2 when engaged and on phase 2', () =>
    {
      JABS_AiManager.releaseAllyCombatGuardIfStale = vi.fn();
      JABS_AiManager.tryDefensiveInterrupt = vi.fn(() => false);
      JABS_AiManager.tryRaiseAllyCombatGuard = vi.fn();
      JABS_AiManager.aiPhase2 = vi.fn();
      const battler = buildEngineBattler({ isEngaged: () => true, getPhase: () => 2 });

      JABS_AiManager.executeAi(battler);

      expect(JABS_AiManager.aiPhase2).toHaveBeenCalledWith(battler);
    });

    it('dispatches to aiPhase3 when engaged and on phase 3', () =>
    {
      JABS_AiManager.releaseAllyCombatGuardIfStale = vi.fn();
      JABS_AiManager.tryDefensiveInterrupt = vi.fn(() => false);
      JABS_AiManager.tryRaiseAllyCombatGuard = vi.fn();
      JABS_AiManager.aiPhase3 = vi.fn();
      const battler = buildEngineBattler({ isEngaged: () => true, getPhase: () => 3 });

      JABS_AiManager.executeAi(battler);

      expect(JABS_AiManager.aiPhase3).toHaveBeenCalledWith(battler);
    });

    it('always releases stale ally combat guard first', () =>
    {
      JABS_AiManager.releaseAllyCombatGuardIfStale = vi.fn();
      JABS_AiManager.aiPhase0 = vi.fn();
      const battler = buildEngineBattler();

      JABS_AiManager.executeAi(battler);

      expect(JABS_AiManager.releaseAllyCombatGuardIfStale).toHaveBeenCalledWith(battler);
    });

    it('raises ally combat guard after the defensive interrupt check when engaged', () =>
    {
      JABS_AiManager.releaseAllyCombatGuardIfStale = vi.fn();
      JABS_AiManager.tryDefensiveInterrupt = vi.fn(() => false);
      JABS_AiManager.tryRaiseAllyCombatGuard = vi.fn();
      JABS_AiManager.aiPhase0 = vi.fn();
      const battler = buildEngineBattler({ isEngaged: () => true });

      JABS_AiManager.executeAi(battler);

      expect(JABS_AiManager.tryRaiseAllyCombatGuard).toHaveBeenCalledWith(battler);
    });
  });
  //endregion executeAi

  //region Phase 1 - Pre-Action Movement
  describe('aiPhase1() and its collaborators', () =>
  {
    function buildPhase1Battler(overrides = {})
    {
      const character = { isMoving: () => false, ...overrides.character };
      return buildBattler({
        isActionReady: () => false,
        setPhase: vi.fn(),
        canBattlerMove: () => true,
        getCharacter: () => character,
        distanceToCurrentTarget: () => 5,
        getBattlerRole: () => ({ guardian: false, sentinel: false }),
        getPursuitRadius: () => 10,
        disengageTarget: vi.fn(),
        turnTowardTarget: vi.fn(),
        smartMoveAwayFromTarget: vi.fn(),
        smartMoveTowardTarget: vi.fn(),
        getTarget: () => null,
        getHomeX: () => 0,
        getHomeY: () => 0,
        ...overrides,
      });
    }

    describe('canTransitionToPhase2()', () =>
    {
      it('returns false when the battler has not decided an action yet', () =>
      {
        expect(JABS_AiManager.canTransitionToPhase2(buildPhase1Battler({ isActionReady: () => false }))).toEqual(false);
      });

      it('returns true when the battler has decided an action', () =>
      {
        expect(JABS_AiManager.canTransitionToPhase2(buildPhase1Battler({ isActionReady: () => true }))).toEqual(true);
      });
    });

    describe('transitionToPhase2()', () =>
    {
      it('sets the battler phase to 2', () =>
      {
        const battler = buildPhase1Battler();
        JABS_AiManager.transitionToPhase2(battler);
        expect(battler.setPhase).toHaveBeenCalledWith(2);
      });
    });

    describe('canDecidePhase1Movement()', () =>
    {
      it('returns false while the character is already moving', () =>
      {
        const battler = buildPhase1Battler({ character: { isMoving: () => true } });
        expect(JABS_AiManager.canDecidePhase1Movement(battler)).toEqual(false);
      });

      it('returns false when the battler cannot move', () =>
      {
        const battler = buildPhase1Battler({ canBattlerMove: () => false });
        expect(JABS_AiManager.canDecidePhase1Movement(battler)).toEqual(false);
      });

      it('returns true when stationary and able to move', () =>
      {
        const battler = buildPhase1Battler();
        expect(JABS_AiManager.canDecidePhase1Movement(battler)).toEqual(true);
      });
    });

    describe('aiPhase1()', () =>
    {
      it('transitions to phase 2 and stops processing when action-ready', () =>
      {
        const battler = buildPhase1Battler({ isActionReady: () => true });
        JABS_AiManager.aiPhase1(battler);
        expect(battler.setPhase).toHaveBeenCalledWith(2);
        expect(battler.turnTowardTarget).not.toHaveBeenCalled();
      });

      it('decides ai movement when not action-ready and able to move', async () =>
      {
        const { default: JABS_Battler } = await import('../../../../../src/plugins/abs/core/models/JABS_Battler.js');
        JABS_Battler.isSafe = () => true;
        const battler = buildPhase1Battler({ isActionReady: () => false });
        JABS_AiManager.aiPhase1(battler);
        expect(battler.turnTowardTarget).toHaveBeenCalled();
      });

      it('does nothing further when not action-ready and unable to decide movement', () =>
      {
        const battler = buildPhase1Battler({ isActionReady: () => false, canBattlerMove: () => false });
        JABS_AiManager.aiPhase1(battler);
        expect(battler.turnTowardTarget).not.toHaveBeenCalled();
      });
    });

    describe('shouldDisengageTarget()', () =>
    {
      it('returns true when the distance is null (invalid target)', () =>
      {
        const battler = buildPhase1Battler({ distanceToCurrentTarget: () => null });
        expect(JABS_AiManager.shouldDisengageTarget(battler)).toEqual(true);
      });

      it('returns true when the distance exceeds the hard cap of 20', () =>
      {
        const battler = buildPhase1Battler({ distanceToCurrentTarget: () => 21, getPursuitRadius: () => 99 });
        expect(JABS_AiManager.shouldDisengageTarget(battler)).toEqual(true);
      });

      it('returns true when the distance exceeds the battler\'s own pursuit radius', () =>
      {
        const battler = buildPhase1Battler({ distanceToCurrentTarget: () => 8, getPursuitRadius: () => 5 });
        expect(JABS_AiManager.shouldDisengageTarget(battler)).toEqual(true);
      });

      it('returns false when within pursuit radius and not a special role', () =>
      {
        const battler = buildPhase1Battler({ distanceToCurrentTarget: () => 5, getPursuitRadius: () => 10 });
        expect(JABS_AiManager.shouldDisengageTarget(battler)).toEqual(false);
      });

      it('defers to the guardian effective pursuit radius for guardian-role battlers', () =>
      {
        const battler = buildPhase1Battler({
          distanceToCurrentTarget: () => 15,
          getBattlerRole: () => ({ guardian: true }),
          getGuardRange: () => 10,
        });
        expect(JABS_AiManager.shouldDisengageTarget(battler)).toEqual(true);
      });

      it('does not disengage a guardian within its effective pursuit radius', () =>
      {
        const battler = buildPhase1Battler({
          distanceToCurrentTarget: () => 8,
          getBattlerRole: () => ({ guardian: true }),
          getGuardRange: () => 10,
        });
        expect(JABS_AiManager.shouldDisengageTarget(battler)).toEqual(false);
      });

      it('disengages a sentinel once its target has exceeded the home range', () =>
      {
        const target = { distanceToPoint: () => 999 };
        const battler = buildPhase1Battler({
          distanceToCurrentTarget: () => 5,
          getPursuitRadius: () => 10,
          getBattlerRole: () => ({ guardian: false, sentinel: true }),
          getTarget: () => target,
        });
        expect(JABS_AiManager.shouldDisengageTarget(battler)).toEqual(true);
      });

      it('does not disengage a sentinel whose target is still within home range', () =>
      {
        const target = { distanceToPoint: () => 1 };
        const battler = buildPhase1Battler({
          distanceToCurrentTarget: () => 5,
          getPursuitRadius: () => 10,
          getBattlerRole: () => ({ guardian: false, sentinel: true }),
          getTarget: () => target,
        });
        expect(JABS_AiManager.shouldDisengageTarget(battler)).toEqual(false);
      });
    });

    describe('getGuardianEffectivePursuitRadius()', () =>
    {
      afterEach(() =>
      {
        JABS_AiManager.getAlliedBattlers = originalGetAlliedBattlers;
      });

      it('uses the explicit guard range tag when present', () =>
      {
        const guardian = buildPhase1Battler({ getGuardRange: () => 12 });
        expect(JABS_AiManager.getGuardianEffectivePursuitRadius(guardian)).toEqual(12);
      });

      it('falls back to the greater of the guardian\'s own pursuit radius and the largest ward pursuit radius', () =>
      {
        const ward = buildBattler({ getBattlerRole: () => ({ ward: true }), getPursuitRadius: () => 25 });
        const nonWard = buildBattler({ getBattlerRole: () => ({ ward: false }), getPursuitRadius: () => 99 });
        JABS_AiManager.getAlliedBattlers = () => [ ward, nonWard ];
        const guardian = buildPhase1Battler({ getGuardRange: () => null, getPursuitRadius: () => 5 });

        expect(JABS_AiManager.getGuardianEffectivePursuitRadius(guardian)).toEqual(25);
      });

      it('uses the guardian\'s own pursuit radius when it exceeds every ward\'s', () =>
      {
        const ward = buildBattler({ getBattlerRole: () => ({ ward: true }), getPursuitRadius: () => 3 });
        JABS_AiManager.getAlliedBattlers = () => [ ward ];
        const guardian = buildPhase1Battler({ getGuardRange: () => null, getPursuitRadius: () => 15 });

        expect(JABS_AiManager.getGuardianEffectivePursuitRadius(guardian)).toEqual(15);
      });
    });

    describe('hasSentinelTargetExceededHomeRange()', () =>
    {
      it('returns true when there is no target', () =>
      {
        const battler = buildPhase1Battler({ getTarget: () => null });
        expect(JABS_AiManager.hasSentinelTargetExceededHomeRange(battler)).toEqual(true);
      });

      it('returns true when the target has left the home pursuit zone', () =>
      {
        const target = { distanceToPoint: () => 50 };
        const battler = buildPhase1Battler({ getTarget: () => target, getPursuitRadius: () => 10 });
        expect(JABS_AiManager.hasSentinelTargetExceededHomeRange(battler)).toEqual(true);
      });

      it('returns false when the target is still within the home pursuit zone', () =>
      {
        const target = { distanceToPoint: () => 2 };
        const battler = buildPhase1Battler({ getTarget: () => target, getPursuitRadius: () => 10 });
        expect(JABS_AiManager.hasSentinelTargetExceededHomeRange(battler)).toEqual(false);
      });
    });

    describe('maintainSafeDistance()', () =>
    {
      it('does nothing when already at a safe distance', async () =>
      {
        const { default: JABS_Battler } = await import('../../../../../src/plugins/abs/core/models/JABS_Battler.js');
        JABS_Battler.isSafe = () => true;
        const battler = buildPhase1Battler();

        JABS_AiManager.maintainSafeDistance(battler);

        expect(battler.smartMoveAwayFromTarget).not.toHaveBeenCalled();
        expect(battler.smartMoveTowardTarget).not.toHaveBeenCalled();
      });

      it('moves away from the target when too close', async () =>
      {
        const { default: JABS_Battler } = await import('../../../../../src/plugins/abs/core/models/JABS_Battler.js');
        JABS_Battler.isSafe = () => false;
        JABS_Battler.isClose = () => true;
        JABS_Battler.isFar = () => false;
        const battler = buildPhase1Battler();

        JABS_AiManager.maintainSafeDistance(battler);

        expect(battler.smartMoveAwayFromTarget).toHaveBeenCalled();
        expect(battler.smartMoveTowardTarget).not.toHaveBeenCalled();
      });

      it('moves toward the target when too far', async () =>
      {
        const { default: JABS_Battler } = await import('../../../../../src/plugins/abs/core/models/JABS_Battler.js');
        JABS_Battler.isSafe = () => false;
        JABS_Battler.isClose = () => false;
        JABS_Battler.isFar = () => true;
        const battler = buildPhase1Battler();

        JABS_AiManager.maintainSafeDistance(battler);

        expect(battler.smartMoveTowardTarget).toHaveBeenCalled();
        expect(battler.smartMoveAwayFromTarget).not.toHaveBeenCalled();

        // restore the shared mock's defaults for later tests.
        JABS_Battler.isSafe = () => false;
        JABS_Battler.isClose = () => true;
        JABS_Battler.isFar = () => false;
      });
    });

    describe('decideAiMovement()', () =>
    {
      it('disengages and stops processing when disengagement conditions are met', () =>
      {
        const battler = buildPhase1Battler({ distanceToCurrentTarget: () => null });

        JABS_AiManager.decideAiMovement(battler);

        expect(battler.disengageTarget).toHaveBeenCalled();
        expect(battler.turnTowardTarget).not.toHaveBeenCalled();
      });

      it('maintains distance and turns toward the target when not disengaging', async () =>
      {
        const { default: JABS_Battler } = await import('../../../../../src/plugins/abs/core/models/JABS_Battler.js');
        JABS_Battler.isSafe = () => true;
        const battler = buildPhase1Battler({ distanceToCurrentTarget: () => 5, getPursuitRadius: () => 10 });

        JABS_AiManager.decideAiMovement(battler);

        expect(battler.disengageTarget).not.toHaveBeenCalled();
        expect(battler.turnTowardTarget).toHaveBeenCalled();
      });
    });
  });
  //endregion Phase 1 - Pre-Action Movement

  //region Phase 2 - Execute Action Phase
  describe('aiPhase2() and its collaborators', () =>
  {
    function buildAction(overrides = {})
    {
      return {
        isForSelf: () => false,
        getProximity: () => 3,
        getShape: () => 'circle',
        getDegrees: () => 180,
        getRange: () => 3,
        getThicknessTiles: () => 1,
        isSupportAction: () => false,
        ...overrides,
      };
    }

    function buildPhase2Battler(overrides = {})
    {
      const action = overrides.decidedAction ?? buildAction();
      return buildBattler({
        distanceToCurrentTarget: () => 5,
        getPursuitRadius: () => 10,
        getBattlerRole: () => ({ guardian: false, sentinel: false }),
        disengageTarget: vi.fn(),
        isActionDecided: () => false,
        isInPosition: () => false,
        isCastingOrChanneling: () => false,
        canBattlerMove: () => true,
        getCharacter: () => ({ isMoving: () => false, findDirectionTo: () => 2, canPass: () => true, x: 0, y: 0 }),
        getDecidedAction: () => [ action ],
        getAllyTarget: () => null,
        distanceToAllyTarget: () => 0,
        smartMoveTowardAllyTarget: vi.fn(),
        smartMoveTowardTarget: vi.fn(),
        smartMoveTowardCoordinates: vi.fn(),
        setInPosition: vi.fn(),
        getTarget: () => ({ getX: () => 0, getY: () => 0 }),
        getX: () => 0,
        getY: () => 0,
        canExecuteSkill: () => true,
        setDecidedAction: vi.fn(),
        setWaitCountdown: vi.fn(),
        showAnimation: vi.fn(),
        ...overrides,
      });
    }

    afterEach(() =>
    {
      JABS_AiManager.needsActionDecision = originalNeedsActionDecision;
      JABS_AiManager.needsRepositioning = originalNeedsRepositioning;
      JABS_AiManager.needsActionExecution = originalNeedsActionExecution;
      JABS_AiManager.decideAiPhase2Action = originalDecideAiPhase2Action;
      JABS_AiManager.decideAiPhase2Movement = originalDecideAiPhase2Movement;
      JABS_AiManager.executeAiPhase2Action = originalExecuteAiPhase2Action;
    });

    describe('needsActionDecision()', () =>
    {
      it('returns true when no action has been decided', () =>
      {
        expect(JABS_AiManager.needsActionDecision(buildPhase2Battler({ isActionDecided: () => false }))).toEqual(true);
      });

      it('returns false when an action has already been decided', () =>
      {
        expect(JABS_AiManager.needsActionDecision(buildPhase2Battler({ isActionDecided: () => true }))).toEqual(false);
      });
    });

    describe('needsRepositioning()', () =>
    {
      it('returns false while casting or channeling', () =>
      {
        const battler = buildPhase2Battler({ isCastingOrChanneling: () => true });
        expect(JABS_AiManager.needsRepositioning(battler)).toEqual(false);
      });

      it('returns false when already in position', () =>
      {
        const battler = buildPhase2Battler({ isInPosition: () => true });
        expect(JABS_AiManager.needsRepositioning(battler)).toEqual(false);
      });

      it('returns false while the character is moving', () =>
      {
        const battler = buildPhase2Battler({ getCharacter: () => ({ isMoving: () => true }) });
        expect(JABS_AiManager.needsRepositioning(battler)).toEqual(false);
      });

      it('returns false when the battler cannot move', () =>
      {
        const battler = buildPhase2Battler({ canBattlerMove: () => false });
        expect(JABS_AiManager.needsRepositioning(battler)).toEqual(false);
      });

      it('returns true when stationary, movable, not casting, and not in position', () =>
      {
        const battler = buildPhase2Battler();
        expect(JABS_AiManager.needsRepositioning(battler)).toEqual(true);
      });
    });

    describe('needsActionExecution()', () =>
    {
      it('returns false when no action has been decided', () =>
      {
        const battler = buildPhase2Battler({ isActionDecided: () => false });
        expect(JABS_AiManager.needsActionExecution(battler)).toEqual(false);
      });

      it('returns false when not in position', () =>
      {
        const battler = buildPhase2Battler({ isActionDecided: () => true, isInPosition: () => false });
        expect(JABS_AiManager.needsActionExecution(battler)).toEqual(false);
      });

      it('returns false while casting or channeling', () =>
      {
        const battler = buildPhase2Battler({ isActionDecided: () => true, isInPosition: () => true, isCastingOrChanneling: () => true });
        expect(JABS_AiManager.needsActionExecution(battler)).toEqual(false);
      });

      it('returns true when decided, in position, and not casting', () =>
      {
        const battler = buildPhase2Battler({ isActionDecided: () => true, isInPosition: () => true, isCastingOrChanneling: () => false });
        expect(JABS_AiManager.needsActionExecution(battler)).toEqual(true);
      });
    });

    describe('aiPhase2() dispatcher', () =>
    {
      it('disengages and stops when disengagement conditions are met', () =>
      {
        const battler = buildPhase2Battler({ distanceToCurrentTarget: () => null });
        JABS_AiManager.aiPhase2(battler);
        expect(battler.disengageTarget).toHaveBeenCalled();
      });

      it('decides an action and stops when an action decision is needed', () =>
      {
        JABS_AiManager.decideAiPhase2Action = vi.fn();
        const battler = buildPhase2Battler({ isActionDecided: () => false });
        JABS_AiManager.aiPhase2(battler);
        expect(JABS_AiManager.decideAiPhase2Action).toHaveBeenCalledWith(battler);
      });

      it('repositions and stops when repositioning is needed', () =>
      {
        JABS_AiManager.decideAiPhase2Movement = vi.fn();
        const battler = buildPhase2Battler({ isActionDecided: () => true, isInPosition: () => false });
        JABS_AiManager.aiPhase2(battler);
        expect(JABS_AiManager.decideAiPhase2Movement).toHaveBeenCalledWith(battler);
      });

      it('executes the decided action when ready', () =>
      {
        JABS_AiManager.executeAiPhase2Action = vi.fn();
        const battler = buildPhase2Battler({ isActionDecided: () => true, isInPosition: () => true, isCastingOrChanneling: () => false });
        JABS_AiManager.aiPhase2(battler);
        expect(JABS_AiManager.executeAiPhase2Action).toHaveBeenCalledWith(battler);
      });

      it('does nothing further once casting, past the decision and repositioning gates', () =>
      {
        JABS_AiManager.executeAiPhase2Action = vi.fn();
        const battler = buildPhase2Battler({ isActionDecided: () => true, isInPosition: () => true, isCastingOrChanneling: () => true });
        JABS_AiManager.aiPhase2(battler);
        expect(JABS_AiManager.executeAiPhase2Action).not.toHaveBeenCalled();
      });
    });

    describe('canSetupActionForNextPhase()', () =>
    {
      it('returns false when there is no skill id', () =>
      {
        expect(JABS_AiManager.canSetupActionForNextPhase(buildPhase2Battler(), 0)).toEqual(false);
      });

      it('returns false when the battler cannot execute the skill', () =>
      {
        const battler = buildPhase2Battler({ canExecuteSkill: () => false });
        expect(JABS_AiManager.canSetupActionForNextPhase(battler, 5)).toEqual(false);
      });

      it('returns true when there is a skill id and the battler can execute it', () =>
      {
        const battler = buildPhase2Battler({ canExecuteSkill: () => true });
        expect(JABS_AiManager.canSetupActionForNextPhase(battler, 5)).toEqual(true);
      });
    });

    describe('cancelActionSetup()', () =>
    {
      it('clears the decided action and sets a wait countdown', () =>
      {
        const battler = buildPhase2Battler();
        JABS_AiManager.cancelActionSetup(battler);
        expect(battler.setDecidedAction).toHaveBeenCalledWith(null);
        expect(battler.setWaitCountdown).toHaveBeenCalledWith(20);
      });
    });

    describe('buildEnemyCooldownType()', () =>
    {
      it('joins the skill id and name with a hyphen', () =>
      {
        expect(JABS_AiManager.buildEnemyCooldownType({ id: 7, name: 'Fireball' })).toEqual('7-Fireball');
      });
    });

    describe('performExecutionAnimation()', () =>
    {
      it('shows the support-decided animation for a support action', () =>
      {
        const battler = buildPhase2Battler();
        const action = buildAction({ isSupportAction: () => true });
        JABS_AiManager.performExecutionAnimation(battler, action);
        expect(battler.showAnimation).toHaveBeenCalledWith(11);
      });

      it('shows the attack-decided animation for a non-support action', () =>
      {
        const battler = buildPhase2Battler();
        const action = buildAction({ isSupportAction: () => false });
        JABS_AiManager.performExecutionAnimation(battler, action);
        expect(battler.showAnimation).toHaveBeenCalledWith(22);
      });
    });

    describe('canPerformPhase2Movement()', () =>
    {
      it('returns false when no action has been decided', () =>
      {
        expect(JABS_AiManager.canPerformPhase2Movement(buildPhase2Battler({ isActionDecided: () => false }))).toEqual(false);
      });

      it('returns false when already in position', () =>
      {
        const battler = buildPhase2Battler({ isActionDecided: () => true, isInPosition: () => true });
        expect(JABS_AiManager.canPerformPhase2Movement(battler)).toEqual(false);
      });

      it('returns true when decided and not yet in position', () =>
      {
        const battler = buildPhase2Battler({ isActionDecided: () => true, isInPosition: () => false });
        expect(JABS_AiManager.canPerformPhase2Movement(battler)).toEqual(true);
      });
    });

    describe('needsToMoveCloser()', () =>
    {
      it('returns false for a self-targeting action', () =>
      {
        const battler = buildPhase2Battler({ decidedAction: buildAction({ isForSelf: () => true }) });
        expect(JABS_AiManager.needsToMoveCloser(battler)).toEqual(false);
      });

      it('returns true when farther than the action proximity from the current target', () =>
      {
        const battler = buildPhase2Battler({
          decidedAction: buildAction({ getProximity: () => 2 }),
          distanceToCurrentTarget: () => 5,
          getAllyTarget: () => null,
        });
        expect(JABS_AiManager.needsToMoveCloser(battler)).toEqual(true);
      });

      it('returns false when within the action proximity of the current target', () =>
      {
        const battler = buildPhase2Battler({
          decidedAction: buildAction({ getProximity: () => 10 }),
          distanceToCurrentTarget: () => 5,
          getAllyTarget: () => null,
        });
        expect(JABS_AiManager.needsToMoveCloser(battler)).toEqual(false);
      });

      it('measures distance to the ally target instead when one is present', () =>
      {
        const ally = {};
        const battler = buildPhase2Battler({
          decidedAction: buildAction({ getProximity: () => 2 }),
          getAllyTarget: () => ally,
          distanceToAllyTarget: () => 1,
        });
        expect(JABS_AiManager.needsToMoveCloser(battler)).toEqual(false);
      });
    });

    describe('phase2MoveCloser()', () =>
    {
      it('moves toward the ally target when one is present', () =>
      {
        const battler = buildPhase2Battler({ getAllyTarget: () => ({}) });
        JABS_AiManager.phase2MoveCloser(battler);
        expect(battler.smartMoveTowardAllyTarget).toHaveBeenCalled();
        expect(battler.smartMoveTowardTarget).not.toHaveBeenCalled();
      });

      it('moves toward the enemy target when there is no ally target', () =>
      {
        const battler = buildPhase2Battler({ getAllyTarget: () => null });
        JABS_AiManager.phase2MoveCloser(battler);
        expect(battler.smartMoveTowardTarget).toHaveBeenCalled();
        expect(battler.smartMoveTowardAllyTarget).not.toHaveBeenCalled();
      });
    });

    describe('needsAxisAlignment()', () =>
    {
      it('returns false for wide (non-narrow) shapes', () =>
      {
        const battler = buildPhase2Battler({ decidedAction: buildAction({ getShape: () => 'circle' }) });
        expect(JABS_AiManager.needsAxisAlignment(battler)).toEqual(false);
      });

      it('returns false when there is no relevant target', () =>
      {
        const battler = buildPhase2Battler({
          decidedAction: buildAction({ getShape: () => 'line' }),
          getAllyTarget: () => null,
          getTarget: () => null,
        });
        expect(JABS_AiManager.needsAxisAlignment(battler)).toEqual(false);
      });

      it('returns false for a line shape when already within the thickness tolerance', () =>
      {
        const battler = buildPhase2Battler({
          decidedAction: buildAction({ getShape: () => 'line', getThicknessTiles: () => 4 }),
          getX: () => 0,
          getY: () => 0,
          getTarget: () => ({ getX: () => 5, getY: () => 1 }),
        });
        // dominant axis is X (dx=5 >= dy=1), so misalignment is the Y gap (1), tolerance is 4/2=2.
        expect(JABS_AiManager.needsAxisAlignment(battler)).toEqual(false);
      });

      it('returns true for a line shape when beyond the thickness tolerance', () =>
      {
        const battler = buildPhase2Battler({
          decidedAction: buildAction({ getShape: () => 'line', getThicknessTiles: () => 1 }),
          getX: () => 0,
          getY: () => 0,
          getTarget: () => ({ getX: () => 5, getY: () => 3 }),
        });
        // dominant axis is X (dx=5 >= dy=3), so misalignment is the Y gap (3), tolerance is 1/2=0.5.
        expect(JABS_AiManager.needsAxisAlignment(battler)).toEqual(true);
      });

      it('measures misalignment along the X gap when the dominant axis is Y', () =>
      {
        const battler = buildPhase2Battler({
          decidedAction: buildAction({ getShape: () => 'line', getThicknessTiles: () => 1 }),
          getX: () => 0,
          getY: () => 0,
          getTarget: () => ({ getX: () => 3, getY: () => 5 }),
        });
        // dominant axis is Y (dy=5 > dx=3), so misalignment is the X gap (3), tolerance is 1/2=0.5.
        expect(JABS_AiManager.needsAxisAlignment(battler)).toEqual(true);
      });

      it('uses the arc chord half-width as tolerance for arc shapes', () =>
      {
        const battler = buildPhase2Battler({
          decidedAction: buildAction({ getShape: () => 'arc', getDegrees: () => 180, getRange: () => 5 }),
          getX: () => 0,
          getY: () => 0,
          getTarget: () => ({ getX: () => 5, getY: () => 0 }),
        });
        // a 180-degree arc clamps the half-angle to 90, so tolerance = range * sin(90deg) = range = 5.
        // misalignment is the Y gap (0), well within tolerance.
        expect(JABS_AiManager.needsAxisAlignment(battler)).toEqual(false);
      });

      it('prefers the ally target over the enemy target when both are present', () =>
      {
        const battler = buildPhase2Battler({
          decidedAction: buildAction({ getShape: () => 'line', getThicknessTiles: () => 1 }),
          getX: () => 0,
          getY: () => 0,
          getAllyTarget: () => ({ getX: () => 5, getY: () => 3 }),
          getTarget: () => ({ getX: () => 0, getY: () => 0 }),
        });
        // if the enemy target (identical position) were used instead, this would be false.
        expect(JABS_AiManager.needsAxisAlignment(battler)).toEqual(true);
      });
    });

    describe('phase2AlignOnAxis()', () =>
    {
      it('steps toward the aligned coordinates when the lateral tile is passable', () =>
      {
        const character = { findDirectionTo: vi.fn(() => 6), canPass: vi.fn(() => true), x: 0, y: 0 };
        const battler = buildPhase2Battler({
          getX: () => 0,
          getY: () => 0,
          getTarget: () => ({ getX: () => 5, getY: () => 3 }),
          getCharacter: () => character,
        });

        JABS_AiManager.phase2AlignOnAxis(battler);

        // dominant axis is X (dx=5 >= dy=3): align along Y, keeping the battler's own X.
        expect(battler.smartMoveTowardCoordinates).toHaveBeenCalledWith(0, 3);
        expect(battler.setInPosition).not.toHaveBeenCalled();
      });

      it('flags in-position instead of moving when the lateral tile is not passable', () =>
      {
        const character = { findDirectionTo: vi.fn(() => 6), canPass: vi.fn(() => false), x: 0, y: 0 };
        const battler = buildPhase2Battler({
          getX: () => 0,
          getY: () => 0,
          getTarget: () => ({ getX: () => 5, getY: () => 3 }),
          getCharacter: () => character,
        });

        JABS_AiManager.phase2AlignOnAxis(battler);

        expect(battler.setInPosition).toHaveBeenCalledWith(true);
        expect(battler.smartMoveTowardCoordinates).not.toHaveBeenCalled();
      });

      it('aligns along X when the dominant approach axis is vertical', () =>
      {
        const character = { findDirectionTo: vi.fn(() => 8), canPass: vi.fn(() => true), x: 0, y: 0 };
        const battler = buildPhase2Battler({
          getX: () => 0,
          getY: () => 0,
          getTarget: () => ({ getX: () => 1, getY: () => 9 }),
          getCharacter: () => character,
        });

        JABS_AiManager.phase2AlignOnAxis(battler);

        // dominant axis is Y (dy=9 > dx=1): align along X, keeping the target's X and battler's own Y.
        expect(battler.smartMoveTowardCoordinates).toHaveBeenCalledWith(1, 0);
      });
    });

    describe('decideAiPhase2Movement()', () =>
    {
      it('does nothing when phase 2 movement cannot be performed', () =>
      {
        const battler = buildPhase2Battler({ isActionDecided: () => false });
        JABS_AiManager.decideAiPhase2Movement(battler);
        expect(battler.setInPosition).not.toHaveBeenCalled();
      });

      it('moves closer when not yet within proximity', () =>
      {
        const battler = buildPhase2Battler({
          isActionDecided: () => true,
          isInPosition: () => false,
          decidedAction: buildAction({ getProximity: () => 1 }),
          distanceToCurrentTarget: () => 5,
        });
        JABS_AiManager.decideAiPhase2Movement(battler);
        expect(battler.smartMoveTowardTarget).toHaveBeenCalled();
      });

      it('aligns on axis when within proximity but not axis-aligned', () =>
      {
        const character = { isMoving: () => false, findDirectionTo: () => 2, canPass: () => true, x: 0, y: 0 };
        const battler = buildPhase2Battler({
          isActionDecided: () => true,
          isInPosition: () => false,
          decidedAction: buildAction({ getProximity: () => 99, getShape: () => 'line', getThicknessTiles: () => 1 }),
          distanceToCurrentTarget: () => 5,
          getCharacter: () => character,
          getX: () => 0,
          getY: () => 0,
          getTarget: () => ({ getX: () => 5, getY: () => 3 }),
        });
        JABS_AiManager.decideAiPhase2Movement(battler);
        expect(battler.smartMoveTowardCoordinates).toHaveBeenCalled();
      });

      it('flags in-position once close enough and axis-aligned', () =>
      {
        const battler = buildPhase2Battler({
          isActionDecided: () => true,
          isInPosition: () => false,
          decidedAction: buildAction({ getProximity: () => 99, getShape: () => 'circle' }),
          distanceToCurrentTarget: () => 1,
        });
        JABS_AiManager.decideAiPhase2Movement(battler);
        expect(battler.setInPosition).toHaveBeenCalledWith(true);
      });
    });
  });
  //endregion Phase 2 - Execute Action Phase

  //region Phase 3 - Post-Action Cooldown Phase
  describe('aiPhase3() and its collaborators', () =>
  {
    function buildPhase3Battler(overrides = {})
    {
      return buildBattler({
        isPostActionCooldownComplete: () => false,
        resetPhases: vi.fn(),
        canBattlerMove: () => true,
        _event: { isMoving: () => false },
        distanceToCurrentTarget: () => 5,
        getPursuitRadius: () => 10,
        getBattlerRole: () => ({ guardian: false, sentinel: false }),
        disengageTarget: vi.fn(),
        turnTowardTarget: vi.fn(),
        smartMoveAwayFromTarget: vi.fn(),
        smartMoveTowardTarget: vi.fn(),
        ...overrides,
      });
    }

    describe('canResetAiPhases()', () =>
    {
      it('returns false while the post-action cooldown is still running', () =>
      {
        expect(JABS_AiManager.canResetAiPhases(buildPhase3Battler({ isPostActionCooldownComplete: () => false }))).toEqual(false);
      });

      it('returns true once the post-action cooldown completes', () =>
      {
        expect(JABS_AiManager.canResetAiPhases(buildPhase3Battler({ isPostActionCooldownComplete: () => true }))).toEqual(true);
      });
    });

    describe('resetAiPhases()', () =>
    {
      it('delegates to the battler\'s own phase reset', () =>
      {
        const battler = buildPhase3Battler();
        JABS_AiManager.resetAiPhases(battler);
        expect(battler.resetPhases).toHaveBeenCalled();
      });
    });

    describe('canPerformPhase3Movement()', () =>
    {
      it('returns false when the battler cannot move', () =>
      {
        const battler = buildPhase3Battler({ canBattlerMove: () => false });
        expect(JABS_AiManager.canPerformPhase3Movement(battler)).toEqual(false);
      });

      it('returns false while the underlying event is already moving', () =>
      {
        const battler = buildPhase3Battler({ _event: { isMoving: () => true } });
        expect(JABS_AiManager.canPerformPhase3Movement(battler)).toEqual(false);
      });

      it('returns true when movable and stationary', () =>
      {
        const battler = buildPhase3Battler();
        expect(JABS_AiManager.canPerformPhase3Movement(battler)).toEqual(true);
      });
    });

    describe('decideAiPhase3Movement()', () =>
    {
      it('delegates to the shared decideAiMovement safe-distancing logic', async () =>
      {
        const { default: JABS_Battler } = await import('../../../../../src/plugins/abs/core/models/JABS_Battler.js');
        JABS_Battler.isSafe = () => true;
        const battler = buildPhase3Battler();

        JABS_AiManager.decideAiPhase3Movement(battler);

        expect(battler.turnTowardTarget).toHaveBeenCalled();
      });
    });

    describe('aiPhase3() dispatcher', () =>
    {
      it('resets phases once the cooldown completes, without attempting movement', () =>
      {
        const battler = buildPhase3Battler({ isPostActionCooldownComplete: () => true });
        JABS_AiManager.aiPhase3(battler);
        expect(battler.resetPhases).toHaveBeenCalled();
        expect(battler.smartMoveAwayFromTarget).not.toHaveBeenCalled();
      });

      it('moves while cooling down when phase 3 movement is possible', async () =>
      {
        const { default: JABS_Battler } = await import('../../../../../src/plugins/abs/core/models/JABS_Battler.js');
        JABS_Battler.isSafe = () => true;
        const battler = buildPhase3Battler({ isPostActionCooldownComplete: () => false });

        JABS_AiManager.aiPhase3(battler);

        expect(battler.turnTowardTarget).toHaveBeenCalled();
      });

      it('does nothing further when unable to move while cooling down', () =>
      {
        const battler = buildPhase3Battler({ isPostActionCooldownComplete: () => false, canBattlerMove: () => false });
        JABS_AiManager.aiPhase3(battler);
        expect(battler.turnTowardTarget).not.toHaveBeenCalled();
      });
    });
  });
  //endregion Phase 3 - Post-Action Cooldown Phase

  //region Ally defensive guard + defensive interrupt
  describe('releaseAllyCombatGuardIfStale() / tryRaiseAllyCombatGuard() / tryDefensiveInterrupt() / findDefensiveThreatBattler()', () =>
  {
    let JABS_Battler;

    beforeAll(async () =>
    {
      ({ default: JABS_Battler } = await import('../../../../../src/plugins/abs/core/models/JABS_Battler.js'));
    });

    beforeEach(() =>
    {
      JABS_Battler.isGuardSkillById = () => true;
    });

    function buildGuardBattler(overrides = {})
    {
      const gameBattler = { getResolvedSkillId: () => 5, mhp: 100, hp: 100, ...overrides.gameBattler };
      return buildBattler({
        isActor: () => true,
        isPlayer: () => false,
        getBattler: () => gameBattler,
        guarding: () => false,
        executeGuard: vi.fn(),
        isEngaged: () => true,
        _aiAllyGuardRaiseFrame: 0,
        _aiAllyDefensiveGuardReadyFrame: 0,
        distanceToDesignatedTarget: () => 1,
        isGuardSkillByKey: () => true,
        getGuardData: () => ({ canGuard: () => true }),
        ...overrides,
      });
    }

    describe('releaseAllyCombatGuardIfStale()', () =>
    {
      afterEach(() =>
      {
        JABS_AiManager.getClosestOpposingBattler = originalGetClosestOpposingBattler;
        JABS_AiManager.findDefensiveThreatBattler = originalFindDefensiveThreatBattler;
      });

      it('does nothing for a non-actor battler', () =>
      {
        const battler = buildGuardBattler({ isActor: () => false });
        JABS_AiManager.releaseAllyCombatGuardIfStale(battler);
        expect(battler.executeGuard).not.toHaveBeenCalled();
      });

      it('does nothing for the player', () =>
      {
        const battler = buildGuardBattler({ isPlayer: () => true });
        JABS_AiManager.releaseAllyCombatGuardIfStale(battler);
        expect(battler.executeGuard).not.toHaveBeenCalled();
      });

      it('releases held guard when the resolved skill is not a guard skill at all', () =>
      {
        JABS_Battler.isGuardSkillById = () => false;
        const battler = buildGuardBattler({ guarding: () => true });
        JABS_AiManager.releaseAllyCombatGuardIfStale(battler);
        expect(battler.executeGuard).toHaveBeenCalledWith(false, JABS_Button.Offhand);
      });

      it('does nothing when not currently guarding and the resolved skill is invalid', () =>
      {
        JABS_Battler.isGuardSkillById = () => false;
        const battler = buildGuardBattler({ guarding: () => false });
        JABS_AiManager.releaseAllyCombatGuardIfStale(battler);
        expect(battler.executeGuard).not.toHaveBeenCalled();
      });

      it('does nothing when not currently guarding, even with a valid guard skill', () =>
      {
        const battler = buildGuardBattler({ guarding: () => false });
        JABS_AiManager.releaseAllyCombatGuardIfStale(battler);
        expect(battler.executeGuard).not.toHaveBeenCalled();
      });

      it('releases guard once the max hold duration elapses', () =>
      {
        globalThis.Graphics.frameCount = 200;
        const battler = buildGuardBattler({ guarding: () => true, _aiAllyGuardRaiseFrame: 10 });
        JABS_AiManager.releaseAllyCombatGuardIfStale(battler);
        expect(battler.executeGuard).toHaveBeenCalledWith(false, JABS_Button.Offhand);
      });

      it('releases guard once the battler is no longer engaged', () =>
      {
        globalThis.Graphics.frameCount = 10;
        const battler = buildGuardBattler({ guarding: () => true, isEngaged: () => false });
        JABS_AiManager.releaseAllyCombatGuardIfStale(battler);
        expect(battler.executeGuard).toHaveBeenCalledWith(false, JABS_Button.Offhand);
      });

      it('releases guard when there is no closest hostile', () =>
      {
        globalThis.Graphics.frameCount = 10;
        JABS_AiManager.getClosestOpposingBattler = () => null;
        const battler = buildGuardBattler({ guarding: () => true });
        JABS_AiManager.releaseAllyCombatGuardIfStale(battler);
        expect(battler.executeGuard).toHaveBeenCalledWith(false, JABS_Button.Offhand);
      });

      it('releases guard when the closest hostile is already dead', () =>
      {
        globalThis.Graphics.frameCount = 10;
        JABS_AiManager.getClosestOpposingBattler = () => buildBattler({ isDead: () => true });
        const battler = buildGuardBattler({ guarding: () => true });
        JABS_AiManager.releaseAllyCombatGuardIfStale(battler);
        expect(battler.executeGuard).toHaveBeenCalledWith(false, JABS_Button.Offhand);
      });

      it('releases guard when the hostile has drifted beyond the maintain-guard tile range', () =>
      {
        globalThis.Graphics.frameCount = 10;
        JABS_AiManager.getClosestOpposingBattler = () => buildBattler({ isDead: () => false });
        const battler = buildGuardBattler({ guarding: () => true, distanceToDesignatedTarget: () => 99 });
        JABS_AiManager.releaseAllyCombatGuardIfStale(battler);
        expect(battler.executeGuard).toHaveBeenCalledWith(false, JABS_Button.Offhand);
      });

      it('releases guard when separation cannot be measured', () =>
      {
        globalThis.Graphics.frameCount = 10;
        JABS_AiManager.getClosestOpposingBattler = () => buildBattler({ isDead: () => false });
        const battler = buildGuardBattler({ guarding: () => true, distanceToDesignatedTarget: () => null });
        JABS_AiManager.releaseAllyCombatGuardIfStale(battler);
        expect(battler.executeGuard).toHaveBeenCalledWith(false, JABS_Button.Offhand);
      });

      it('releases guard once the tracked threat disappears', () =>
      {
        globalThis.Graphics.frameCount = 10;
        JABS_AiManager.getClosestOpposingBattler = () => buildBattler({ isDead: () => false });
        JABS_AiManager.findDefensiveThreatBattler = () => null;
        const battler = buildGuardBattler({ guarding: () => true });
        JABS_AiManager.releaseAllyCombatGuardIfStale(battler);
        expect(battler.executeGuard).toHaveBeenCalledWith(false, JABS_Button.Offhand);
      });

      it('keeps guard held when every release condition is avoided', () =>
      {
        globalThis.Graphics.frameCount = 10;
        JABS_AiManager.getClosestOpposingBattler = () => buildBattler({ isDead: () => false });
        JABS_AiManager.findDefensiveThreatBattler = () => buildBattler();
        const battler = buildGuardBattler({ guarding: () => true });
        JABS_AiManager.releaseAllyCombatGuardIfStale(battler);
        expect(battler.executeGuard).not.toHaveBeenCalled();
      });

      it('stamps the raise frame the first time it observes an already-guarding battler', () =>
      {
        globalThis.Graphics.frameCount = 42;
        JABS_AiManager.getClosestOpposingBattler = () => buildBattler({ isDead: () => false });
        JABS_AiManager.findDefensiveThreatBattler = () => buildBattler();
        const battler = buildGuardBattler({ guarding: () => true, _aiAllyGuardRaiseFrame: 0 });
        JABS_AiManager.releaseAllyCombatGuardIfStale(battler);
        expect(battler._aiAllyGuardRaiseFrame).toEqual(42);
      });
    });

    describe('tryRaiseAllyCombatGuard()', () =>
    {
      afterEach(() =>
      {
        JABS_AiManager.findDefensiveThreatBattler = originalFindDefensiveThreatBattler;
      });

      function stubThreatFound()
      {
        JABS_AiManager.findDefensiveThreatBattler = () => buildBattler();
      }

      it('does nothing for a non-actor battler', () =>
      {
        const battler = buildGuardBattler({ isActor: () => false });
        JABS_AiManager.tryRaiseAllyCombatGuard(battler);
        expect(battler.executeGuard).not.toHaveBeenCalled();
      });

      it('does nothing for the player', () =>
      {
        const battler = buildGuardBattler({ isPlayer: () => true });
        JABS_AiManager.tryRaiseAllyCombatGuard(battler);
        expect(battler.executeGuard).not.toHaveBeenCalled();
      });

      it('does nothing when not engaged', () =>
      {
        const battler = buildGuardBattler({ isEngaged: () => false });
        JABS_AiManager.tryRaiseAllyCombatGuard(battler);
        expect(battler.executeGuard).not.toHaveBeenCalled();
      });

      it('does nothing when already guarding', () =>
      {
        const battler = buildGuardBattler({ guarding: () => true });
        JABS_AiManager.tryRaiseAllyCombatGuard(battler);
        expect(battler.executeGuard).not.toHaveBeenCalled();
      });

      it('does nothing when hp is above the defensive guard threshold', () =>
      {
        stubThreatFound();
        const battler = buildGuardBattler({ gameBattler: { hp: 90, mhp: 100 } });
        JABS_AiManager.tryRaiseAllyCombatGuard(battler);
        expect(battler.executeGuard).not.toHaveBeenCalled();
      });

      it('does nothing when there is no valid guard skill resolved', () =>
      {
        JABS_Battler.isGuardSkillById = () => false;
        stubThreatFound();
        const battler = buildGuardBattler({ gameBattler: { hp: 10, mhp: 100 } });
        JABS_AiManager.tryRaiseAllyCombatGuard(battler);
        expect(battler.executeGuard).not.toHaveBeenCalled();
      });

      it('does nothing when there is no active threat', () =>
      {
        JABS_AiManager.findDefensiveThreatBattler = () => null;
        const battler = buildGuardBattler({ gameBattler: { hp: 10, mhp: 100 } });
        JABS_AiManager.tryRaiseAllyCombatGuard(battler);
        expect(battler.executeGuard).not.toHaveBeenCalled();
      });

      it('does nothing while the guard cooldown is still active', () =>
      {
        stubThreatFound();
        globalThis.Graphics.frameCount = 5;
        const battler = buildGuardBattler({ gameBattler: { hp: 10, mhp: 100 }, _aiAllyDefensiveGuardReadyFrame: 100 });
        JABS_AiManager.tryRaiseAllyCombatGuard(battler);
        expect(battler.executeGuard).not.toHaveBeenCalled();
      });

      it('does nothing when RNG does not favor raising guard', () =>
      {
        stubThreatFound();
        globalThis.RPGManager.chanceIn100.mockReturnValue(false);
        const battler = buildGuardBattler({ gameBattler: { hp: 10, mhp: 100 } });
        JABS_AiManager.tryRaiseAllyCombatGuard(battler);
        expect(battler.executeGuard).not.toHaveBeenCalled();
      });

      it('does nothing when the battler is not configured with a guard skill by key', () =>
      {
        stubThreatFound();
        globalThis.RPGManager.chanceIn100.mockReturnValue(true);
        const battler = buildGuardBattler({ gameBattler: { hp: 10, mhp: 100 }, isGuardSkillByKey: () => false });
        JABS_AiManager.tryRaiseAllyCombatGuard(battler);
        expect(battler.executeGuard).not.toHaveBeenCalled();
      });

      it('does nothing when there is no usable guard data', () =>
      {
        stubThreatFound();
        globalThis.RPGManager.chanceIn100.mockReturnValue(true);
        const battler = buildGuardBattler({ gameBattler: { hp: 10, mhp: 100 }, getGuardData: () => null });
        JABS_AiManager.tryRaiseAllyCombatGuard(battler);
        expect(battler.executeGuard).not.toHaveBeenCalled();
      });

      it('does nothing when the guard data reports it cannot guard right now', () =>
      {
        stubThreatFound();
        globalThis.RPGManager.chanceIn100.mockReturnValue(true);
        const battler = buildGuardBattler({ gameBattler: { hp: 10, mhp: 100 }, getGuardData: () => ({ canGuard: () => false }) });
        JABS_AiManager.tryRaiseAllyCombatGuard(battler);
        expect(battler.executeGuard).not.toHaveBeenCalled();
      });

      it('raises guard and stamps timing frames when every condition is met', () =>
      {
        stubThreatFound();
        globalThis.RPGManager.chanceIn100.mockReturnValue(true);
        globalThis.Graphics.frameCount = 50;
        const battler = buildGuardBattler({ gameBattler: { hp: 10, mhp: 100 } });

        JABS_AiManager.tryRaiseAllyCombatGuard(battler);

        expect(battler.executeGuard).toHaveBeenCalledWith(true, JABS_Button.Offhand);
        expect(battler._aiAllyGuardRaiseFrame).toEqual(50);
        expect(battler._aiAllyDefensiveGuardReadyFrame).toEqual(110);
      });

      it('skips the hp gate entirely when the threshold is configured at 100% or more', () =>
      {
        stubThreatFound();
        globalThis.RPGManager.chanceIn100.mockReturnValue(true);
        J.ABS.Metadata.AiAllyDefensiveGuardHpThresholdPercent = 1;
        const battler = buildGuardBattler({ gameBattler: { hp: 100, mhp: 100 } });

        JABS_AiManager.tryRaiseAllyCombatGuard(battler);

        expect(battler.executeGuard).toHaveBeenCalledWith(true, JABS_Button.Offhand);

        // restore for later tests.
        J.ABS.Metadata.AiAllyDefensiveGuardHpThresholdPercent = 0.5;
      });
    });

    describe('tryDefensiveInterrupt()', () =>
    {
      function buildDodgeBattler(overrides = {})
      {
        return buildBattler({
          isEngaged: () => true,
          isCastingOrChanneling: () => false,
          isDodging: () => false,
          _aiDefensiveDodgeReadyFrame: 0,
          tryExecuteAiEmergencyDodgeAwayFrom: vi.fn(() => true),
          clearDecidedAction: vi.fn(),
          setInPosition: vi.fn(),
          ...overrides,
        });
      }

      afterEach(() =>
      {
        JABS_AiManager.findDefensiveThreatBattler = originalFindDefensiveThreatBattler;
      });

      it('returns false when not engaged', () =>
      {
        const battler = buildDodgeBattler({ isEngaged: () => false });
        expect(JABS_AiManager.tryDefensiveInterrupt(battler)).toEqual(false);
      });

      it('returns false while casting or channeling', () =>
      {
        const battler = buildDodgeBattler({ isCastingOrChanneling: () => true });
        expect(JABS_AiManager.tryDefensiveInterrupt(battler)).toEqual(false);
      });

      it('returns false while already dodging', () =>
      {
        const battler = buildDodgeBattler({ isDodging: () => true });
        expect(JABS_AiManager.tryDefensiveInterrupt(battler)).toEqual(false);
      });

      it('returns false while the dodge cooldown is still active', () =>
      {
        globalThis.Graphics.frameCount = 5;
        const battler = buildDodgeBattler({ _aiDefensiveDodgeReadyFrame: 100 });
        expect(JABS_AiManager.tryDefensiveInterrupt(battler)).toEqual(false);
      });

      it('returns false when there is no threat to dodge away from', () =>
      {
        JABS_AiManager.findDefensiveThreatBattler = () => null;
        const battler = buildDodgeBattler();
        expect(JABS_AiManager.tryDefensiveInterrupt(battler)).toEqual(false);
      });

      it('returns false when RNG does not favor dodging', () =>
      {
        JABS_AiManager.findDefensiveThreatBattler = () => buildBattler();
        globalThis.RPGManager.chanceIn100.mockReturnValue(false);
        const battler = buildDodgeBattler();
        expect(JABS_AiManager.tryDefensiveInterrupt(battler)).toEqual(false);
      });

      it('returns false when the emergency dodge attempt itself fails', () =>
      {
        JABS_AiManager.findDefensiveThreatBattler = () => buildBattler();
        globalThis.RPGManager.chanceIn100.mockReturnValue(true);
        const battler = buildDodgeBattler({ tryExecuteAiEmergencyDodgeAwayFrom: vi.fn(() => false) });
        expect(JABS_AiManager.tryDefensiveInterrupt(battler)).toEqual(false);
      });

      it('dodges, clears the decided action, and returns true when everything lines up', () =>
      {
        JABS_AiManager.findDefensiveThreatBattler = () => buildBattler();
        globalThis.RPGManager.chanceIn100.mockReturnValue(true);
        globalThis.Graphics.frameCount = 20;
        const battler = buildDodgeBattler();

        const result = JABS_AiManager.tryDefensiveInterrupt(battler);

        expect(result).toEqual(true);
        expect(battler.clearDecidedAction).toHaveBeenCalled();
        expect(battler.setInPosition).toHaveBeenCalledWith(false);
        expect(battler._aiDefensiveDodgeReadyFrame).toEqual(80);
      });
    });

    describe('findDefensiveThreatBattler()', () =>
    {
      afterEach(() =>
      {
        JABS_AiManager.getOpposingBattlersWithinRange = originalGetOpposingBattlersWithinRange;
      });

      it('returns null when there are no opposing battlers within the threat radius', () =>
      {
        JABS_AiManager.getOpposingBattlersWithinRange = () => [];
        expect(JABS_AiManager.findDefensiveThreatBattler(buildGuardBattler())).toBeNull();
      });

      it('skips a candidate with an unmeasurable distance', () =>
      {
        const unmeasurable = buildBattler();
        const measurable = buildBattler({ uuid: 'measurable' });
        JABS_AiManager.getOpposingBattlersWithinRange = () => [ unmeasurable, measurable ];
        const selfBattler = buildGuardBattler({
          distanceToDesignatedTarget: candidate => (candidate === unmeasurable ? null : 3),
        });

        expect(JABS_AiManager.findDefensiveThreatBattler(selfBattler)).toBe(measurable);
      });

      it('picks the closest candidate by distance', () =>
      {
        const near = buildBattler({ uuid: 'near' });
        const far = buildBattler({ uuid: 'far' });
        JABS_AiManager.getOpposingBattlersWithinRange = () => [ far, near ];
        const selfBattler = buildGuardBattler({
          distanceToDesignatedTarget: candidate => (candidate === near ? 1 : 10),
        });

        expect(JABS_AiManager.findDefensiveThreatBattler(selfBattler)).toBe(near);
      });

      it('keeps the earlier best candidate when a later one does not improve on the score', () =>
      {
        const near = buildBattler({ uuid: 'near' });
        const far = buildBattler({ uuid: 'far' });
        // near is evaluated first this time, so far's worse score must not overwrite it.
        JABS_AiManager.getOpposingBattlersWithinRange = () => [ near, far ];
        const selfBattler = buildGuardBattler({
          distanceToDesignatedTarget: candidate => (candidate === near ? 1 : 10),
        });

        expect(JABS_AiManager.findDefensiveThreatBattler(selfBattler)).toBe(near);
      });

      it('applies an active-map-action bias so an actively-attacking candidate can win a close tie', () =>
      {
        const active = buildBattler({ uuid: 'active' });
        const passive = buildBattler({ uuid: 'passive' });
        globalThis.$jabsEngine.getAllActionEvents = () => [ { getCaster: () => active } ];
        JABS_AiManager.getOpposingBattlersWithinRange = () => [ passive, active ];
        // both candidates are otherwise equidistant; the 0.35 bias should break the tie toward `active`.
        const selfBattler = buildGuardBattler({ distanceToDesignatedTarget: () => 3 });

        expect(JABS_AiManager.findDefensiveThreatBattler(selfBattler)).toBe(active);
      });
    });
  });
  //endregion Ally defensive guard + defensive interrupt

  //region Phase 2 action decision + execution pipeline
  describe('decideAiPhase2Action() / decideEnemyAiPhase2Action() / setupActionForNextPhase() / restampActionDirections() / executeAiPhase2Action()', () =>
  {
    let JABS_ActionOptions;
    let JABS_Location;
    let builtOptions;

    beforeAll(async () =>
    {
      ({ default: JABS_ActionOptions } = await import('../../../../../src/plugins/abs/core/models/JABS_ActionOptions.js'));
      ({ default: JABS_Location } = await import('../../../../../src/plugins/abs/core/models/JABS_Location.js'));
    });

    beforeEach(() =>
    {
      builtOptions = {};
      JABS_ActionOptions.Builder = () =>
      {
        const builder = {
          setCooldownKey: vi.fn(key => { builtOptions.cooldownKey = key; return builder; }),
          setLocation: vi.fn(loc => { builtOptions.location = loc; return builder; }),
          build: vi.fn(() => builtOptions),
        };
        return builder;
      };

      globalThis.$jabsEngine = {
        getAllActionEvents: () => [],
        resolveProjectileFormationForSkill: () => 'line',
        resolveProjectileCountForSkill: () => 1,
        determineActionDirections: () => [ 2 ],
      };
    });

    function buildJabsAction(overrides = {})
    {
      return {
        getBaseSkill: () => ({ id: 9 }),
        setFacing: vi.fn(),
        isForSelf: () => false,
        isSupportAction: () => false,
        isCastComplete: () => true,
        getCastTime: () => 0,
        setCooldownType: vi.fn(),
        ...overrides,
      };
    }

    function buildActionBattler(overrides = {})
    {
      return buildBattler({
        getBattlerRole: () => ({ leader: false, follower: false, solo: true, guardian: false }),
        getAiMode: () => ({
          decideActionsForFollowers: vi.fn(),
          decideFollowerAi: vi.fn(() => []),
          decideAction: vi.fn(() => [ 5 ]),
        }),
        getTarget: () => null,
        getAllyTarget: () => null,
        getSkillIdsFromEnemy: () => [ 5 ],
        getSkill: () => ({ id: 5, jabsDirect: false }),
        canExecuteSkill: () => true,
        createJabsActionFromSkill: () => [ buildJabsAction() ],
        setDecidedAction: vi.fn(),
        setWaitCountdown: vi.fn(),
        showAnimation: vi.fn(),
        resolveDirectActionTargetCoordinatesForSkill: () => [ null, null ],
        turnTowardTarget: vi.fn(),
        getDecidedAction: () => [ buildJabsAction() ],
        processQueuedActions: vi.fn(),
        setPhase: vi.fn(),
        isCastingOrChanneling: () => false,
        setCastCountdown: vi.fn(),
        distanceToCurrentTarget: () => 5,
        getPursuitRadius: () => 10,
        getX: () => 0,
        getY: () => 0,
        getCharacter: () => ({ direction: () => 2 }),
        getProjectileSpawnBaseDirection: () => 2,
        ...overrides,
      });
    }

    describe('decideAiPhase2Action()', () =>
    {
      it('delegates directly to decideEnemyAiPhase2Action', () =>
      {
        JABS_AiManager.decideEnemyAiPhase2Action = vi.fn();
        const battler = buildActionBattler();

        JABS_AiManager.decideAiPhase2Action(battler);

        expect(JABS_AiManager.decideEnemyAiPhase2Action).toHaveBeenCalledWith(battler);

        JABS_AiManager.decideEnemyAiPhase2Action = originalDecideEnemyAiPhase2Action;
      });
    });

    describe('decideEnemyAiPhase2Action()', () =>
    {
      afterEach(() =>
      {
        JABS_AiManager.cancelActionSetup = originalCancelActionSetup;
        JABS_AiManager.setupActionForNextPhase = originalSetupActionForNextPhase;
      });

      it('has a leader coordinate its followers before deciding its own action', () =>
      {
        JABS_AiManager.setupActionForNextPhase = vi.fn();
        const decideActionsForFollowers = vi.fn();
        const battler = buildActionBattler({
          getBattlerRole: () => ({ leader: true, follower: false, solo: false, guardian: false }),
          getAiMode: () => ({ decideActionsForFollowers, decideAction: vi.fn(() => [ 5 ]) }),
        });

        JABS_AiManager.decideEnemyAiPhase2Action(battler);

        expect(decideActionsForFollowers).toHaveBeenCalledWith(battler);
      });

      it('a solo leader skips follower coordination', () =>
      {
        JABS_AiManager.setupActionForNextPhase = vi.fn();
        const decideActionsForFollowers = vi.fn();
        const battler = buildActionBattler({
          getBattlerRole: () => ({ leader: true, follower: false, solo: true, guardian: false }),
          getAiMode: () => ({ decideActionsForFollowers, decideAction: vi.fn(() => [ 5 ]) }),
        });

        JABS_AiManager.decideEnemyAiPhase2Action(battler);

        expect(decideActionsForFollowers).not.toHaveBeenCalled();
      });

      it('cancels setup when a follower has no leader-assigned pick', () =>
      {
        JABS_AiManager.cancelActionSetup = vi.fn();
        const battler = buildActionBattler({
          getBattlerRole: () => ({ leader: false, follower: true, solo: false, guardian: false }),
          getAiMode: () => ({ decideFollowerAi: () => [] }),
        });

        JABS_AiManager.decideEnemyAiPhase2Action(battler);

        expect(JABS_AiManager.cancelActionSetup).toHaveBeenCalledWith(battler);
      });

      it('cancels setup when the follower-assigned skill cannot be constructed', () =>
      {
        JABS_AiManager.cancelActionSetup = vi.fn();
        const battler = buildActionBattler({
          getBattlerRole: () => ({ leader: false, follower: true, solo: false, guardian: false }),
          getAiMode: () => ({ decideFollowerAi: () => [ 5 ] }),
          getSkill: () => null,
        });

        JABS_AiManager.decideEnemyAiPhase2Action(battler);

        expect(JABS_AiManager.cancelActionSetup).toHaveBeenCalledWith(battler);
      });

      it('sets up the follower-assigned skill when everything resolves', () =>
      {
        JABS_AiManager.setupActionForNextPhase = vi.fn();
        const battler = buildActionBattler({
          getBattlerRole: () => ({ leader: false, follower: true, solo: false, guardian: false }),
          getAiMode: () => ({ decideFollowerAi: () => [ 5 ] }),
          getSkill: () => ({ id: 5, name: 'Slash' }),
        });

        JABS_AiManager.decideEnemyAiPhase2Action(battler);

        expect(JABS_AiManager.setupActionForNextPhase).toHaveBeenCalledWith(battler, 5, '5-Slash');
      });

      it('cancels setup when the ai mode decides nothing usable for a solo battler', () =>
      {
        JABS_AiManager.cancelActionSetup = vi.fn();
        const battler = buildActionBattler({ getAiMode: () => ({ decideAction: () => [] }) });

        JABS_AiManager.decideEnemyAiPhase2Action(battler);

        expect(JABS_AiManager.cancelActionSetup).toHaveBeenCalledWith(battler);
      });

      it('cancels setup when the decided skill cannot be constructed for a solo battler', () =>
      {
        JABS_AiManager.cancelActionSetup = vi.fn();
        const battler = buildActionBattler({ getSkill: () => null });

        JABS_AiManager.decideEnemyAiPhase2Action(battler);

        expect(JABS_AiManager.cancelActionSetup).toHaveBeenCalledWith(battler);
      });

      it('sets up the ai-decided skill for a solo battler when everything resolves', () =>
      {
        JABS_AiManager.setupActionForNextPhase = vi.fn();
        const battler = buildActionBattler({ getSkill: () => ({ id: 5, name: 'Bolt' }) });

        JABS_AiManager.decideEnemyAiPhase2Action(battler);

        expect(JABS_AiManager.setupActionForNextPhase).toHaveBeenCalledWith(battler, 5, '5-Bolt');
      });
    });

    describe('setupActionForNextPhase()', () =>
    {
      afterEach(() =>
      {
        JABS_AiManager.cancelActionSetup = originalCancelActionSetup;
        JABS_AiManager.performExecutionAnimation = originalPerformExecutionAnimation;
      });

      it('cancels setup when the skill cannot be set up', () =>
      {
        JABS_AiManager.cancelActionSetup = vi.fn();
        const battler = buildActionBattler({ canExecuteSkill: () => false });

        JABS_AiManager.setupActionForNextPhase(battler, 5, 'key');

        expect(JABS_AiManager.cancelActionSetup).toHaveBeenCalledWith(battler);
      });

      it('creates the action(s), stamps their cooldown type, and sets the decided action', () =>
      {
        JABS_AiManager.performExecutionAnimation = vi.fn();
        const jabsAction = buildJabsAction();
        const battler = buildActionBattler({ createJabsActionFromSkill: () => [ jabsAction ] });

        JABS_AiManager.setupActionForNextPhase(battler, 5, 'my-cooldown');

        expect(jabsAction.setCooldownType).toHaveBeenCalledWith('my-cooldown');
        expect(battler.setDecidedAction).toHaveBeenCalledWith([ jabsAction ]);
      });

      it('performs the execution animation using the primary decided action', () =>
      {
        const animationSpy = vi.fn();
        JABS_AiManager.performExecutionAnimation = animationSpy;
        const jabsAction = buildJabsAction();
        const battler = buildActionBattler({ createJabsActionFromSkill: () => [ jabsAction ] });

        JABS_AiManager.setupActionForNextPhase(battler, 5, 'my-cooldown');

        expect(animationSpy).toHaveBeenCalledWith(battler, jabsAction);
      });

      it('does not embed a frozen location for a non-direct skill', () =>
      {
        JABS_AiManager.performExecutionAnimation = vi.fn();
        const resolveSpy = vi.fn(() => [ 3, 4 ]);
        const battler = buildActionBattler({
          getSkill: () => ({ id: 5, jabsDirect: false }),
          resolveDirectActionTargetCoordinatesForSkill: resolveSpy,
        });

        JABS_AiManager.setupActionForNextPhase(battler, 5, 'key');

        expect(resolveSpy).not.toHaveBeenCalled();
      });

      it('embeds a frozen location for a direct skill with a resolvable coordinate', () =>
      {
        JABS_AiManager.performExecutionAnimation = vi.fn();
        const battler = buildActionBattler({
          getSkill: () => ({ id: 5, jabsDirect: true, jabsDirectLock: false }),
          resolveDirectActionTargetCoordinatesForSkill: () => [ 3, 4 ],
        });

        JABS_AiManager.setupActionForNextPhase(battler, 5, 'key');

        expect(builtOptions.location).toEqual({ getX: expect.any(Function), getY: expect.any(Function) });
        expect(builtOptions.location.getX()).toEqual(3);
        expect(builtOptions.location.getY()).toEqual(4);
      });

      it('does not embed a location for a direct skill tagged directLock', () =>
      {
        JABS_AiManager.performExecutionAnimation = vi.fn();
        const resolveSpy = vi.fn(() => [ 3, 4 ]);
        const battler = buildActionBattler({
          getSkill: () => ({ id: 5, jabsDirect: true, jabsDirectLock: true }),
          resolveDirectActionTargetCoordinatesForSkill: resolveSpy,
        });

        JABS_AiManager.setupActionForNextPhase(battler, 5, 'key');

        expect(resolveSpy).not.toHaveBeenCalled();
      });

      it('does not embed a location for a direct skill when no coordinate resolves', () =>
      {
        JABS_AiManager.performExecutionAnimation = vi.fn();
        const battler = buildActionBattler({
          getSkill: () => ({ id: 5, jabsDirect: true, jabsDirectLock: false }),
          resolveDirectActionTargetCoordinatesForSkill: () => [ null, null ],
        });

        JABS_AiManager.setupActionForNextPhase(battler, 5, 'key');

        expect(builtOptions.location).toBeUndefined();
      });
    });

    describe('restampActionDirections()', () =>
    {
      it('does nothing when there are no decided actions', () =>
      {
        const battler = buildActionBattler({ getDecidedAction: () => [] });

        expect(() => JABS_AiManager.restampActionDirections(battler)).not.toThrow();
      });

      it('stamps each decided action with its corresponding fresh spoke direction', () =>
      {
        globalThis.$jabsEngine.determineActionDirections = () => [ 6, 8 ];
        const first = buildJabsAction();
        const second = buildJabsAction();
        const battler = buildActionBattler({ getDecidedAction: () => [ first, second ] });

        JABS_AiManager.restampActionDirections(battler);

        expect(first.setFacing).toHaveBeenCalledWith(6);
        expect(second.setFacing).toHaveBeenCalledWith(8);
      });

      it('does not stamp an action beyond the resolved spoke direction count', () =>
      {
        globalThis.$jabsEngine.determineActionDirections = () => [ 6 ];
        const first = buildJabsAction();
        const second = buildJabsAction();
        const battler = buildActionBattler({ getDecidedAction: () => [ first, second ] });

        JABS_AiManager.restampActionDirections(battler);

        expect(first.setFacing).toHaveBeenCalledWith(6);
        expect(second.setFacing).not.toHaveBeenCalled();
      });
    });

    describe('executeAiPhase2Action()', () =>
    {
      it('faces the target and re-stamps action directions before anything else', () =>
      {
        const battler = buildActionBattler({ getDecidedAction: () => [ buildJabsAction() ] });

        JABS_AiManager.executeAiPhase2Action(battler);

        expect(battler.turnTowardTarget).toHaveBeenCalled();
      });

      it('does nothing further when there is no primary action', () =>
      {
        const battler = buildActionBattler({ getDecidedAction: () => [] });

        expect(() => JABS_AiManager.executeAiPhase2Action(battler)).not.toThrow();
        expect(battler.processQueuedActions).not.toHaveBeenCalled();
      });

      it('executes queued actions, waits, and advances to phase 3 once cast-complete', () =>
      {
        const action = buildJabsAction({ isCastComplete: () => true });
        const battler = buildActionBattler({ getDecidedAction: () => [ action ] });

        JABS_AiManager.executeAiPhase2Action(battler);

        expect(battler.processQueuedActions).toHaveBeenCalled();
        expect(battler.setWaitCountdown).toHaveBeenCalledWith(15);
        expect(battler.setPhase).toHaveBeenCalledWith(3);
      });

      it('does nothing further while actively casting or channeling', () =>
      {
        const action = buildJabsAction({ isCastComplete: () => false });
        const battler = buildActionBattler({ getDecidedAction: () => [ action ], isCastingOrChanneling: () => true });

        JABS_AiManager.executeAiPhase2Action(battler);

        expect(battler.setCastCountdown).not.toHaveBeenCalled();
        expect(battler.processQueuedActions).not.toHaveBeenCalled();
      });

      it('starts the cast timer when not yet cast-complete and not already casting', () =>
      {
        const action = buildJabsAction({ isCastComplete: () => false, getCastTime: () => 45 });
        const battler = buildActionBattler({ getDecidedAction: () => [ action ], isCastingOrChanneling: () => false });

        JABS_AiManager.executeAiPhase2Action(battler);

        expect(battler.setCastCountdown).toHaveBeenCalledWith(45);
      });
    });
  });
  //endregion Phase 2 action decision + execution pipeline
});
//endregion plugins/abs/core/managers/jabs-ai-manager.test.js
