//region plugins/abs/core/models/jabs-battler.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * JABS_Battler.js is the per-battler map-combat model every JABS_Engine interaction operates on.
 * It is a genuine ES `class` (not a prototype-patch file), so this file dynamically imports it
 * directly. Every sibling model/manager it imports is mocked per the "unit tier mocks all
 * downstream file-external dependencies" convention established for JABS_Engine.js's own test file.
 */
describe('JABS_Battler (unit, all downstream dependencies mocked)', () =>
{
  /** @type {typeof import('../../../../../src/plugins/abs/core/models/JABS_Battler.js').default} */
  let JABS_Battler;

  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = {
      ABS: {
        Metadata: {},
        Directions: {
          UP: 8, RIGHT: 6, LEFT: 4, DOWN: 2,
          LOWERLEFT: 1, LOWERRIGHT: 3, UPPERLEFT: 7, UPPERRIGHT: 9,
        },
        RegExp: {},
      },
      LEVEL: false,
    };

    // bare RMMZ-adjacent global (not imported by JABS_Battler.js- referenced directly).
    globalThis.RPGManager = {
      getSumFromAllNotesByRegex: vi.fn(() => 0),
      getArraysFromNotesByRegex: vi.fn(() => []),
      fateOf100: vi.fn(() => false),
      getNumberFromNoteByRegex: vi.fn(() => 0),
    };

    // sibling model/manager dependencies- mocked entirely per the unit-tier convention.
    vi.doMock('../../../../../src/plugins/abs/core/models/JABS_Action.js', () => ({ default: class {} }));
    vi.doMock('../../../../../src/plugins/abs/core/models/JABS_ActionOptions.js', () => ({
      default: class
      {
        static Builder()
        {
          const built = {};
          const builder = {
            setIsRetaliation: vi.fn((v) => { built.isRetaliation = v; return builder; }),
            setLocation: vi.fn((v) => { built.location = v; return builder; }),
            setIsTerrainDamage: vi.fn((v) => { built.isTerrainDamage = v; return builder; }),
            setRetaliationTarget: vi.fn((v) => { built.retaliationTarget = v; return builder; }),
          };
          builder.build = vi.fn(() => built);
          return builder;
        }

        static Default()
        {
          return {};
        }
      },
    }));
    vi.doMock('../../../../../src/plugins/abs/core/managers/JABS_ActionSpawner.js', () => ({
      default: class
      {
        static buildVolley()
        {
          return [];
        }
      },
    }));
    vi.doMock('../../../../../src/plugins/abs/core/models/JABS_Aggro.js', () => ({
      default: class
      {
        constructor(uuid)
        {
          this._uuid = uuid;
          this._aggro = 0;
        }

        uuid()
        {
          return this._uuid;
        }
      },
    }));
    vi.doMock('../../../../../src/plugins/abs/core/managers/JABS_AiManager.js', () => ({
      default: class
      {
        static maxAiRange = 20;

        static removeBattler()
        {
        }

        static getBattlerByUuid()
        {
          return null;
        }
      },
    }));
    vi.doMock('../../../../../src/plugins/abs/core/models/JABS_BattlerCoreData.js', () => ({
      default: class
      {
        static Builder()
        {
          const built = {};
          const builder = {};
          [
            'setBattlerId', 'setTeam', 'setAiCode', 'setSightRange', 'setAlertedSightBoost',
            'setPursuitRange', 'setAlertedPursuitBoost', 'setAlertDuration', 'setCanIdle',
            'setShowHpBar', 'setShowBattlerName', 'setShowStates', 'setIsInvincible', 'setIsInanimate',
          ].forEach(method => { builder[method] = vi.fn(() => builder); });
          builder.build = vi.fn(() => built);
          return builder;
        }
      },
    }));
    vi.doMock('../../../../../src/plugins/abs/core/models/JABS_BattlerRole.js', () => ({ default: class {} }));
    vi.doMock('../../../../../src/plugins/abs/core/models/JABS_Cooldown.js', () => ({ default: class {} }));
    vi.doMock('../../../../../src/plugins/abs/core/models/JABS_EnemyAI.js', () => ({ default: class {} }));
    vi.doMock('../../../../../src/plugins/abs/core/models/JABS_GlobalCooldown.js', () => ({
      default: class
      {
        static isGlobalBlockingSkillId()
        {
          return false;
        }
      },
    }));
    vi.doMock('../../../../../src/plugins/abs/core/models/JABS_GuardData.js', () => ({ default: class {} }));
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
    vi.doMock('../../../../../src/plugins/abs/core/models/JABS_SkillSlot.js', () => ({ default: class {} }));
    vi.doMock('../../../../../src/plugins/abs/core/managers/JABS_TeamRules.js', () => ({
      default: class
      {
        static isFriendly()
        {
          return false;
        }

        static isOpposed()
        {
          return true;
        }
      },
    }));
    vi.doMock('../../../../../src/plugins/abs/core/models/JABS_Timer.js', () => ({
      default: class
      {
        constructor(maxTime)
        {
          this.maxTime = maxTime;
          this._complete = false;
        }

        update()
        {
          this.updateCalled = true;
        }

        isTimerComplete()
        {
          return this._complete;
        }

        reset()
        {
          this.resetCalled = true;
          this._complete = false;
        }
      },
    }));

    ({ default: JABS_Battler } = await import('../../../../../src/plugins/abs/core/models/JABS_Battler.js'));

    // the poses extension pack aliases this hook onto the prototype at runtime- stub it here
    // so construction doesn't throw in isolation.
    JABS_Battler.prototype.initPoseInfo = function()
    {
    };
  });

  beforeEach(() =>
  {
    globalThis.Graphics = { frameCount: 1000 };
  });

  function buildCoreData(overrides = {})
  {
    return Object.assign({
      battlerId: () => 1,
      team: () => 0,
      sightRange: () => 4,
      alertedSightBoost: () => 2,
      pursuitRange: () => 6,
      alertedPursuitBoost: () => 2,
      alertDuration: () => 300,
      guardRange: () => null,
      ai: () => ({}),
      canIdle: () => true,
      showHpBar: () => true,
      showStates: () => true,
      showBattlerName: () => true,
      isInvincible: () => false,
      isInanimate: () => false,
      battlerRole: () => ({}),
    }, overrides);
  }

  function buildEvent(overrides = {})
  {
    return Object.assign({ _x: 3, _y: 4 }, overrides);
  }

  function buildGameBattler(overrides = {})
  {
    return Object.assign({
      prepareTime: () => 60,
      getSkillSlotManager: () => ({ setupSlots: vi.fn() }),
    }, overrides);
  }

  function buildBattler(overrides = {})
  {
    const event = overrides.event ?? buildEvent();
    const battler = overrides.battler ?? buildGameBattler();
    const coreData = overrides.coreData ?? buildCoreData();
    return new JABS_Battler(event, battler, coreData);
  }

  //region initialization
  describe('initialize', () =>
  {
    it('stores the event, battler, and defaults hidden to false', () =>
    {
      const event = buildEvent();
      const battler = buildGameBattler();
      const jabsBattler = buildBattler({ event, battler });

      expect(jabsBattler.getCharacter()).toBe(event);
      expect(jabsBattler.getBattler()).toBe(battler);
      expect(jabsBattler.isHidden()).toBe(false);
    });
  });

  describe('initCoreData', () =>
  {
    it('adopts every field from the provided battler core data', () =>
    {
      const coreData = buildCoreData({
        battlerId: () => 42,
        team: () => 1,
        sightRange: () => 5,
        alertedSightBoost: () => 3,
        pursuitRange: () => 7,
        alertedPursuitBoost: () => 4,
        alertDuration: () => 120,
        guardRange: () => 8,
        canIdle: () => false,
        showHpBar: () => false,
        showStates: () => false,
        showBattlerName: () => false,
        isInvincible: () => true,
        isInanimate: () => true,
      });
      const jabsBattler = buildBattler({ coreData });

      expect(jabsBattler.getBattlerId()).toBe(42);
      expect(jabsBattler.getTeam()).toBe(1);
      expect(jabsBattler.getSightRadius()).toBe(5);
      expect(jabsBattler.getPursuitRadius()).toBe(7);
      expect(jabsBattler.getAlertDuration()).toBe(120);
      expect(jabsBattler.canIdle()).toBe(false);
      expect(jabsBattler.showHpBar()).toBe(false);
      expect(jabsBattler.showBattlerName()).toBe(false);
      expect(jabsBattler.isInvincible()).toBe(true);
      expect(jabsBattler.isInanimate()).toBe(true);
    });
  });

  describe('initFromNotes', () =>
  {
    it('reads the prepare time from the underlying battler', () =>
    {
      const battler = buildGameBattler({ prepareTime: () => 90 });
      const jabsBattler = buildBattler({ battler });

      expect(jabsBattler._prepareMax).toBe(90);
    });
  });

  describe('initGeneralInfo', () =>
  {
    it('defaults movement lock to false and initializes the wait/engagement timers', () =>
    {
      const jabsBattler = buildBattler();

      expect(jabsBattler._movementLock).toBe(false);
      expect(jabsBattler._waitTimer.maxTime).toBe(0);
      expect(jabsBattler._engagementTimer.maxTime).toBe(15);
    });
  });

  describe('initDodgeInfo', () =>
  {
    it('defaults all dodge tracking fields', () =>
    {
      const jabsBattler = buildBattler();

      expect(jabsBattler._dodgeSteps).toBe(0);
      expect(jabsBattler._dodging).toBe(false);
      expect(jabsBattler._dodgeDirection).toBe(0);
      expect(jabsBattler._dodgeFrame).toBe(0);
      expect(jabsBattler._dodgeIframes).toBeNull();
    });
  });

  describe('initBattleInfo', () =>
  {
    it('defaults combat/engagement/guard/aggro tracking fields', () =>
    {
      const jabsBattler = buildBattler();

      expect(jabsBattler._lastUsedSkillId).toBe(0);
      expect(jabsBattler._phase).toBe(1);
      expect(jabsBattler._casting).toBe(false);
      expect(jabsBattler._channeling).toBe(false);
      expect(jabsBattler._engaged).toBe(false);
      expect(jabsBattler._target).toBeNull();
      expect(jabsBattler._allyTarget).toBeNull();
      expect(jabsBattler._alerted).toBe(false);
      expect(jabsBattler._decidedAction).toBeNull();
      expect(jabsBattler._followers).toEqual([]);
      expect(jabsBattler._isGuarding).toBe(false);
      expect(jabsBattler._dying).toBe(false);
      expect(jabsBattler._aggros).toEqual([]);
      expect(jabsBattler._inCombatWindowMax).toBe(600);
    });
  });

  describe('initIdleInfo', () =>
  {
    it('captures the event\'s home coordinates and defaults to idle', () =>
    {
      const event = buildEvent({ _x: 10, _y: 20 });
      const jabsBattler = buildBattler({ event });

      expect(jabsBattler._homeX).toBe(10);
      expect(jabsBattler._homeY).toBe(20);
      expect(jabsBattler._idle).toBe(true);
      expect(jabsBattler._idleActionReady).toBe(false);
      expect(jabsBattler._idleActionCountMax).toBe(30);
    });
  });

  describe('initCooldowns', () =>
  {
    it('sets up the skill slots using the underlying battler', () =>
    {
      const setupSlots = vi.fn();
      const battler = buildGameBattler({ getSkillSlotManager: () => ({ setupSlots }) });

      buildBattler({ battler });

      expect(setupSlots).toHaveBeenCalledWith(battler);
    });
  });
  //endregion initialization

  //region _reference
  describe('setCharacter', () =>
  {
    it('reassigns the character', () =>
    {
      const jabsBattler = buildBattler();
      const newCharacter = { id: 'new' };

      jabsBattler.setCharacter(newCharacter);

      expect(jabsBattler.getCharacter()).toBe(newCharacter);
    });
  });

  describe('battlerName', () =>
  {
    it('returns the database name of the underlying battler', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.getBattlerDatabaseData = () => ({ name: 'Slime' });

      expect(jabsBattler.battlerName()).toBe('Slime');
    });
  });

  describe('hasEventActions', () =>
  {
    it('is false for a non-event battler', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.isEvent = () => false;

      expect(jabsBattler.hasEventActions()).toBe(false);
    });

    it('is false for an event with no valid page index', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.isEvent = () => true;
      jabsBattler.getCharacter = () => ({ _pageIndex: -1 });

      expect(jabsBattler.hasEventActions()).toBe(false);
    });

    it('is true for an event with a valid page index', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.isEvent = () => true;
      jabsBattler.getCharacter = () => ({ _pageIndex: 0 });

      expect(jabsBattler.hasEventActions()).toBe(true);
    });
  });

  describe('destroy', () =>
  {
    it('sets invincible, unregisters from the ai manager, and erases the character', async () =>
    {
      const { default: JABS_AiManager } = await import('../../../../../src/plugins/abs/core/managers/JABS_AiManager.js');
      JABS_AiManager.removeBattler = vi.fn();
      const character = { erase: vi.fn(), setActionSpriteNeedsRemoving: vi.fn() };
      const jabsBattler = buildBattler();
      jabsBattler.getCharacter = () => character;

      jabsBattler.destroy();

      expect(jabsBattler.isInvincible()).toBe(true);
      expect(JABS_AiManager.removeBattler).toHaveBeenCalledWith(jabsBattler);
      expect(character.erase).toHaveBeenCalledTimes(1);
      expect(character.setActionSpriteNeedsRemoving).toHaveBeenCalledTimes(1);
    });
  });

  describe('revealHiddenBattler / hideBattler / isHidden', () =>
  {
    it('toggles the hidden flag', () =>
    {
      const jabsBattler = buildBattler();
      expect(jabsBattler.isHidden()).toBe(false);

      jabsBattler.hideBattler();
      expect(jabsBattler.isHidden()).toBe(true);

      jabsBattler.revealHiddenBattler();
      expect(jabsBattler.isHidden()).toBe(false);
    });
  });

  describe('isDying / setDying', () =>
  {
    it('tracks the dying state', () =>
    {
      const jabsBattler = buildBattler();
      expect(jabsBattler.isDying()).toBe(false);

      jabsBattler.setDying(true);

      expect(jabsBattler.isDying()).toBe(true);
    });
  });

  describe('inPursuitRange', () =>
  {
    it('is true when the distance is within the vision-modified pursuit radius', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.getPursuitRadius = () => 5;
      const target = { getBattler: () => ({ getVisionModifier: () => 1 }) };

      expect(jabsBattler.inPursuitRange(target, 5)).toBe(true);
    });

    it('is false when the distance exceeds the vision-modified pursuit radius', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.getPursuitRadius = () => 5;
      const target = { getBattler: () => ({ getVisionModifier: () => 1 }) };

      expect(jabsBattler.inPursuitRange(target, 6)).toBe(false);
    });

    it('scales the pursuit radius by the target\'s vision modifier', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.getPursuitRadius = () => 5;
      const target = { getBattler: () => ({ getVisionModifier: () => 2 }) };

      expect(jabsBattler.inPursuitRange(target, 9)).toBe(true);
    });
  });

  describe('applyVisionMultiplier', () =>
  {
    it('scales the given radius by the target\'s vision modifier', () =>
    {
      const jabsBattler = buildBattler();
      const target = { getBattler: () => ({ getVisionModifier: () => 1.5 }) };

      expect(jabsBattler.applyVisionMultiplier(target, 10)).toBe(15);
    });
  });

  describe('inSightRange', () =>
  {
    it('is true when the distance is within the modified sight radius', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.getSightRadius = () => 4;
      jabsBattler.applyVisionMultiplier = vi.fn(() => 4);

      expect(jabsBattler.inSightRange('target', 4)).toBe(true);
    });

    it('is false when the distance exceeds the modified sight radius', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.getSightRadius = () => 4;
      jabsBattler.applyVisionMultiplier = vi.fn(() => 4);

      expect(jabsBattler.inSightRange('target', 5)).toBe(false);
    });
  });

  describe('outOfRange', () =>
  {
    it('is true when there is no target', () =>
    {
      const jabsBattler = buildBattler();
      expect(jabsBattler.outOfRange(null)).toBe(true);
    });

    it('is true when the target exceeds the ai manager\'s max range', async () =>
    {
      const { default: JABS_AiManager } = await import('../../../../../src/plugins/abs/core/managers/JABS_AiManager.js');
      JABS_AiManager.maxAiRange = 20;
      const jabsBattler = buildBattler();
      jabsBattler.distanceToDesignatedTarget = () => 21;

      expect(jabsBattler.outOfRange('target')).toBe(true);
    });

    it('is false when the target is within the ai manager\'s max range', async () =>
    {
      const { default: JABS_AiManager } = await import('../../../../../src/plugins/abs/core/managers/JABS_AiManager.js');
      JABS_AiManager.maxAiRange = 20;
      const jabsBattler = buildBattler();
      jabsBattler.distanceToDesignatedTarget = () => 10;

      expect(jabsBattler.outOfRange('target')).toBe(false);
    });
  });

  describe('getUuid', () =>
  {
    it('returns empty when there is no underlying battler', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.getBattler = () => null;

      expect(jabsBattler.getUuid()).toBe(String.empty);
    });

    it('delegates to the underlying battler\'s uuid', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.getBattler = () => ({ getUuid: () => 'uuid-1' });

      expect(jabsBattler.getUuid()).toBe('uuid-1');
    });
  });

  describe('leader-decided actions', () =>
  {
    it('hasLeaderDecidedActions is false without a leader', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.hasLeader = () => false;

      expect(jabsBattler.hasLeaderDecidedActions()).toBe(false);
    });

    it('hasLeaderDecidedActions reflects the queued action when there is a leader', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.hasLeader = () => true;
      jabsBattler._leaderDecidedAction = 7;

      expect(jabsBattler.hasLeaderDecidedActions()).toBe(7);
    });

    it('getNextLeaderDecidedAction returns and clears the queued action', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler._leaderDecidedAction = 7;

      expect(jabsBattler.getNextLeaderDecidedAction()).toBe(7);
      expect(jabsBattler._leaderDecidedAction).toBeNull();
    });

    it('setLeaderDecidedAction stores the skill id', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.setLeaderDecidedAction(9);

      expect(jabsBattler._leaderDecidedAction).toBe(9);
    });

    it('clearLeaderDecidedActionsQueue clears the queued action', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler._leaderDecidedAction = 9;

      jabsBattler.clearLeaderDecidedActionsQueue();

      expect(jabsBattler._leaderDecidedAction).toBeNull();
    });
  });

  describe('leader / follower management', () =>
  {
    it('getLeader returns the tracked leader uuid', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler._leaderUuid = 'leader-uuid';

      expect(jabsBattler.getLeader()).toBe('leader-uuid');
    });

    it('getLeaderBattler returns null when there is no leader uuid', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler._leaderUuid = String.empty;

      expect(jabsBattler.getLeaderBattler()).toBeNull();
    });

    it('getLeaderBattler resolves the leader battler by uuid', async () =>
    {
      const { default: JABS_AiManager } = await import('../../../../../src/plugins/abs/core/managers/JABS_AiManager.js');
      const leaderBattler = { id: 'leader' };
      JABS_AiManager.getBattlerByUuid = vi.fn(() => leaderBattler);
      const jabsBattler = buildBattler();
      jabsBattler._leaderUuid = 'leader-uuid';

      expect(jabsBattler.getLeaderBattler()).toBe(leaderBattler);
    });

    it('setLeader does nothing when the leader cannot be resolved', async () =>
    {
      const { default: JABS_AiManager } = await import('../../../../../src/plugins/abs/core/managers/JABS_AiManager.js');
      JABS_AiManager.getBattlerByUuid = vi.fn(() => null);
      const jabsBattler = buildBattler();

      jabsBattler.setLeader('leader-uuid');

      expect(jabsBattler._leaderUuid).toBe(String.empty);
    });

    it('setLeader adopts the leader and registers itself as a follower', async () =>
    {
      const { default: JABS_AiManager } = await import('../../../../../src/plugins/abs/core/managers/JABS_AiManager.js');
      const addFollower = vi.fn();
      JABS_AiManager.getBattlerByUuid = vi.fn(() => ({ addFollower }));
      const jabsBattler = buildBattler();
      jabsBattler.getUuid = () => 'follower-uuid';

      jabsBattler.setLeader('leader-uuid');

      expect(jabsBattler._leaderUuid).toBe('leader-uuid');
      expect(addFollower).toHaveBeenCalledWith('follower-uuid');
    });

    it('hasLeader reflects whether a leader uuid is tracked', () =>
    {
      const jabsBattler = buildBattler();
      expect(jabsBattler.hasLeader()).toBe(false);

      jabsBattler._leaderUuid = 'leader-uuid';
      expect(jabsBattler.hasLeader()).toBe(true);
    });

    it('getFollowers returns the tracked follower uuids', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler._followers = [ 'a', 'b' ];

      expect(jabsBattler.getFollowers()).toEqual([ 'a', 'b' ]);
    });

    it('getFollowerByUuid returns null when there are no followers', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.hasFollowers = () => false;

      expect(jabsBattler.getFollowerByUuid('a')).toBeNull();
    });

    it('getFollowerByUuid returns null when the uuid is not tracked', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.hasFollowers = () => true;
      jabsBattler._followers = [ 'a' ];

      expect(jabsBattler.getFollowerByUuid('b')).toBeNull();
    });

    it('getFollowerByUuid resolves the matching follower battler', async () =>
    {
      const { default: JABS_AiManager } = await import('../../../../../src/plugins/abs/core/managers/JABS_AiManager.js');
      const followerBattler = { id: 'follower' };
      JABS_AiManager.getBattlerByUuid = vi.fn(() => followerBattler);
      const jabsBattler = buildBattler();
      jabsBattler.hasFollowers = () => true;
      jabsBattler._followers = [ 'a' ];

      expect(jabsBattler.getFollowerByUuid('a')).toBe(followerBattler);
    });

    it('addFollower appends a new follower uuid', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.getFollowerByUuid = vi.fn(() => null);
      jabsBattler._followers = [];

      jabsBattler.addFollower('new-follower');

      expect(jabsBattler._followers).toEqual([ 'new-follower' ]);
    });

    it('addFollower does not duplicate an already-tracked follower', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.getFollowerByUuid = vi.fn(() => ({ id: 'existing' }));
      jabsBattler._followers = [ 'existing-follower' ];
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      jabsBattler.addFollower('existing-follower');

      expect(jabsBattler._followers).toEqual([ 'existing-follower' ]);
      errorSpy.mockRestore();
    });

    it('removeFollower does not remove a tracked follower since indexOf never matches a function', () =>
    {
      // KNOWN BUG: removeFollower calls this._followers.indexOf(uuid => uuid === oldFollowerUuid)-
      // Array.prototype.indexOf searches for a value by strict equality, not a predicate, so it
      // never matches an arrow function against string uuids in the array. This means the "found"
      // branch (splice) is unreachable in practice; the method always falls through to the
      // console.error branch below, even for a uuid that is genuinely tracked.
      const jabsBattler = buildBattler();
      jabsBattler._followers = [ 'tracked-follower' ];
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      jabsBattler.removeFollower('tracked-follower');

      expect(jabsBattler._followers).toEqual([ 'tracked-follower' ]);
      expect(errorSpy).toHaveBeenCalled();
      errorSpy.mockRestore();
    });

    it('clearFollowers clears leader data for each follower then empties the collection', () =>
    {
      globalThis.$gameMap = { clearLeaderDataByUuid: vi.fn() };
      const jabsBattler = buildBattler();
      jabsBattler._followers = [ 'a', 'b' ];

      jabsBattler.clearFollowers();

      expect(globalThis.$gameMap.clearLeaderDataByUuid).toHaveBeenCalledWith('a');
      expect(globalThis.$gameMap.clearLeaderDataByUuid).toHaveBeenCalledWith('b');
      expect(jabsBattler._followers).toEqual([]);
    });

    it('clearLeader does nothing when there is no leader uuid', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.getLeader = () => String.empty;
      jabsBattler.getUuid = vi.fn();

      jabsBattler.clearLeader();

      expect(jabsBattler.getUuid).not.toHaveBeenCalled();
    });

    it('clearLeader does nothing when this battler has no uuid of its own', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.getLeader = () => 'leader-uuid';
      jabsBattler.getUuid = () => String.empty;

      expect(() => jabsBattler.clearLeader()).not.toThrow();
    });

    it('clearLeader does nothing when the leader battler cannot be resolved', async () =>
    {
      const { default: JABS_AiManager } = await import('../../../../../src/plugins/abs/core/managers/JABS_AiManager.js');
      JABS_AiManager.getBattlerByUuid = vi.fn(() => null);
      const jabsBattler = buildBattler();
      jabsBattler.getLeader = () => 'leader-uuid';
      jabsBattler.getUuid = () => 'my-uuid';

      expect(() => jabsBattler.clearLeader()).not.toThrow();
    });

    it('clearLeader removes this battler from its leader\'s follower list', async () =>
    {
      const { default: JABS_AiManager } = await import('../../../../../src/plugins/abs/core/managers/JABS_AiManager.js');
      const removeFollowerByUuid = vi.fn();
      JABS_AiManager.getBattlerByUuid = vi.fn(() => ({ removeFollowerByUuid }));
      const jabsBattler = buildBattler();
      jabsBattler.getLeader = () => 'leader-uuid';
      jabsBattler.getUuid = () => 'my-uuid';

      jabsBattler.clearLeader();

      expect(removeFollowerByUuid).toHaveBeenCalledWith('my-uuid');
    });

    it('removeFollowerByUuid removes a tracked follower', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler._followers = [ 'a', 'b' ];

      jabsBattler.removeFollowerByUuid('a');

      expect(jabsBattler._followers).toEqual([ 'b' ]);
    });

    it('removeFollowerByUuid does nothing for an untracked follower', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler._followers = [ 'a' ];

      jabsBattler.removeFollowerByUuid('b');

      expect(jabsBattler._followers).toEqual([ 'a' ]);
    });

    it('clearLeaderData clears both the leader uuid and the decided-actions queue', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.setLeader = vi.fn();
      jabsBattler.clearLeaderDecidedActionsQueue = vi.fn();

      jabsBattler.clearLeaderData();

      expect(jabsBattler.setLeader).toHaveBeenCalledWith('');
      expect(jabsBattler.clearLeaderDecidedActionsQueue).toHaveBeenCalledTimes(1);
    });
  });
  //endregion _reference
});
//endregion plugins/abs/core/models/jabs-battler.test.js
