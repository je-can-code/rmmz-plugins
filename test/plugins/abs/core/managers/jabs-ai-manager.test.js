//region plugins/abs/core/managers/jabs-ai-manager.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

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
        Metadata: { MaxAiUpdateRange: 15 },
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
  });

  beforeEach(() =>
  {
    // static Maps persist across tests- reset the registry and spatial grid so nothing leaks.
    JABS_AiManager.clearBattlers();
    JABS_AiManager.spatialIndex.clear();
    globalThis.RPGManager.chanceIn100.mockReset().mockReturnValue(false);
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
});
//endregion plugins/abs/core/managers/jabs-ai-manager.test.js
