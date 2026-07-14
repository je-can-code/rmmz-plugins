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
    return Object.assign({ _x: 3, _y: 4, isPlayer: () => false }, overrides);
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

  describe('hasFollowers', () =>
  {
    it('is false when the battler is not a leader', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.getBattlerRole = () => ({ leader: false });
      jabsBattler._followers = [ 'a' ];

      expect(jabsBattler.hasFollowers()).toBe(false);
    });

    it('is false for a leader with no followers', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.getBattlerRole = () => ({ leader: true });
      jabsBattler._followers = [];

      expect(jabsBattler.hasFollowers()).toBe(false);
    });

    it('is true for a leader with tracked followers', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.getBattlerRole = () => ({ leader: true });
      jabsBattler._followers = [ 'a' ];

      expect(jabsBattler.hasFollowers()).toBe(true);
    });
  });

  describe('getBattlerDatabaseData', () =>
  {
    it('returns an empty object when there is no underlying battler', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.getBattler = () => null;

      expect(jabsBattler.getBattlerDatabaseData()).toEqual({});
    });

    it('delegates to the underlying battler\'s database data', () =>
    {
      const databaseData = { name: 'Slime' };
      const jabsBattler = buildBattler();
      jabsBattler.getBattler = () => ({ databaseData: () => databaseData });

      expect(jabsBattler.getBattlerDatabaseData()).toBe(databaseData);
    });
  });

  describe('isFacingTarget', () =>
  {
    it('is true when facing down and the target faces up', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.getCharacter = () => ({ direction: () => J.ABS.Directions.DOWN });

      expect(jabsBattler.isFacingTarget({ direction: () => J.ABS.Directions.UP })).toBe(true);
    });

    it('is true when facing up and the target faces down', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.getCharacter = () => ({ direction: () => J.ABS.Directions.UP });

      expect(jabsBattler.isFacingTarget({ direction: () => J.ABS.Directions.DOWN })).toBe(true);
    });

    it('is true when facing left and the target faces right', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.getCharacter = () => ({ direction: () => J.ABS.Directions.LEFT });

      expect(jabsBattler.isFacingTarget({ direction: () => J.ABS.Directions.RIGHT })).toBe(true);
    });

    it('is true when facing right and the target faces left', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.getCharacter = () => ({ direction: () => J.ABS.Directions.RIGHT });

      expect(jabsBattler.isFacingTarget({ direction: () => J.ABS.Directions.LEFT })).toBe(true);
    });

    it('is false when facing the same direction as the target', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.getCharacter = () => ({ direction: () => J.ABS.Directions.DOWN });

      expect(jabsBattler.isFacingTarget({ direction: () => J.ABS.Directions.DOWN })).toBe(false);
    });

    it('is false for a diagonal facing not covered by the cardinal switch', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.getCharacter = () => ({ direction: () => J.ABS.Directions.LOWERLEFT });

      expect(jabsBattler.isFacingTarget({ direction: () => J.ABS.Directions.UPPERRIGHT })).toBe(false);
    });
  });

  describe('isPlayer / isActor / isFollower / isEnemy / isEvent', () =>
  {
    it('isPlayer delegates to the character', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.getCharacter = () => ({ isPlayer: () => true });

      expect(jabsBattler.isPlayer()).toBe(true);
    });

    it('isActor is true for the player regardless of the underlying battler', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.isPlayer = () => true;
      jabsBattler.getBattler = () => ({ isActor: () => false });

      expect(jabsBattler.isActor()).toBe(true);
    });

    it('isActor delegates to the underlying battler for a non-player', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.isPlayer = () => false;
      jabsBattler.getBattler = () => ({ isActor: () => true });

      expect(jabsBattler.isActor()).toBe(true);
    });

    it('isFollower delegates to the character', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.getCharacter = () => ({ isFollower: () => true });

      expect(jabsBattler.isFollower()).toBe(true);
    });

    it('isEnemy delegates to the underlying battler', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.getBattler = () => ({ isEnemy: () => true });

      expect(jabsBattler.isEnemy()).toBe(true);
    });

    it('isEvent delegates to the character', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.getCharacter = () => ({ isEvent: () => true });

      expect(jabsBattler.isEvent()).toBe(true);
    });
  });

  describe('team comparisons', () =>
  {
    it('isSameTeam compares against this battler\'s team', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler._team = 1;

      expect(jabsBattler.isSameTeam(1)).toBe(true);
      expect(jabsBattler.isSameTeam(2)).toBe(false);
    });

    it('isFriendlyTeam delegates to JABS_TeamRules.isFriendly', async () =>
    {
      const { default: JABS_TeamRules } = await import('../../../../../src/plugins/abs/core/managers/JABS_TeamRules.js');
      JABS_TeamRules.isFriendly = vi.fn(() => true);
      const jabsBattler = buildBattler();
      jabsBattler._team = 1;

      expect(jabsBattler.isFriendlyTeam(2)).toBe(true);
      expect(JABS_TeamRules.isFriendly).toHaveBeenCalledWith(1, 2);
    });

    it('isOpposingTeam delegates to JABS_TeamRules.isOpposed', async () =>
    {
      const { default: JABS_TeamRules } = await import('../../../../../src/plugins/abs/core/managers/JABS_TeamRules.js');
      JABS_TeamRules.isOpposed = vi.fn(() => true);
      const jabsBattler = buildBattler();
      jabsBattler._team = 1;

      expect(jabsBattler.isOpposingTeam(2)).toBe(true);
      expect(JABS_TeamRules.isOpposed).toHaveBeenCalledWith(1, 2);
    });
  });

  describe('phase management', () =>
  {
    it('getPhase/setPhase track the current phase', () =>
    {
      const jabsBattler = buildBattler();
      expect(jabsBattler.getPhase()).toBe(1);

      jabsBattler.setPhase(2);

      expect(jabsBattler.getPhase()).toBe(2);
    });

    it('resetPhases resets phase, prepare tracking, and decided/position/combo state', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.setPhase(3);
      jabsBattler._prepareReady = true;
      jabsBattler._prepareCounter = 5;
      jabsBattler._postActionCooldownComplete = true;
      jabsBattler.setDecidedAction = vi.fn();
      jabsBattler.setAllyTarget = vi.fn();
      jabsBattler.setInPosition = vi.fn();
      jabsBattler.clearAiComboHumanizedReadyFrame = vi.fn();
      jabsBattler._aiDefensiveDodgeReadyFrame = 10;
      jabsBattler._aiAllyDefensiveGuardReadyFrame = 10;
      jabsBattler._aiAllyGuardRaiseFrame = 10;

      jabsBattler.resetPhases();

      expect(jabsBattler.getPhase()).toBe(1);
      expect(jabsBattler._prepareReady).toBe(false);
      expect(jabsBattler._prepareCounter).toBe(0);
      expect(jabsBattler._postActionCooldownComplete).toBe(false);
      expect(jabsBattler.setDecidedAction).toHaveBeenCalledWith(null);
      expect(jabsBattler.setAllyTarget).toHaveBeenCalledWith(null);
      expect(jabsBattler.setInPosition).toHaveBeenCalledWith(false);
      expect(jabsBattler.clearAiComboHumanizedReadyFrame).toHaveBeenCalledTimes(1);
      expect(jabsBattler._aiDefensiveDodgeReadyFrame).toBe(0);
      expect(jabsBattler._aiAllyDefensiveGuardReadyFrame).toBe(0);
      expect(jabsBattler._aiAllyGuardRaiseFrame).toBe(0);
    });
  });

  describe('in-position tracking', () =>
  {
    it('isInPosition/setInPosition track the flag, defaulting to true', () =>
    {
      const jabsBattler = buildBattler();
      expect(jabsBattler.isInPosition()).toBe(false);

      jabsBattler.setInPosition();

      expect(jabsBattler.isInPosition()).toBe(true);

      jabsBattler.setInPosition(false);

      expect(jabsBattler.isInPosition()).toBe(false);
    });
  });

  describe('decided action tracking', () =>
  {
    it('isActionDecided reflects whether an action has been set', () =>
    {
      const jabsBattler = buildBattler();
      expect(jabsBattler.isActionDecided()).toBe(false);

      jabsBattler.setDecidedAction([ 'action' ]);

      expect(jabsBattler.isActionDecided()).toBe(true);
      expect(jabsBattler.getDecidedAction()).toEqual([ 'action' ]);

      jabsBattler.clearDecidedAction();

      expect(jabsBattler.isActionDecided()).toBe(false);
    });
  });

  describe('resetIdleAction', () =>
  {
    it('resets the idle-action-ready flag', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler._idleActionReady = true;

      jabsBattler.resetIdleAction();

      expect(jabsBattler._idleActionReady).toBe(false);
    });
  });

  describe('isEventReady', () =>
  {
    it('is false for the player', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.getCharacter = () => ({ isPlayer: () => true });

      expect(jabsBattler.isEventReady()).toBe(false);
    });

    it('is false when the underlying event is not yet loaded', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.getCharacter = () => ({ isPlayer: () => false, event: () => null });

      expect(jabsBattler.isEventReady()).toBe(false);
    });

    it('is true when the underlying event is loaded', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.getCharacter = () => ({ isPlayer: () => false, event: () => ({}) });

      expect(jabsBattler.isEventReady()).toBe(true);
    });
  });

  describe('getSightRadius', () =>
  {
    it('returns the base sight radius when not alerted', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler._sightRadius = 4;
      jabsBattler.isAlerted = () => false;

      expect(jabsBattler.getSightRadius()).toBe(4);
    });

    it('adds the alerted sight boost when alerted', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler._sightRadius = 4;
      jabsBattler._alertedSightBoost = 2;
      jabsBattler.isAlerted = () => true;

      expect(jabsBattler.getSightRadius()).toBe(6);
    });
  });

  describe('getPursuitRadius', () =>
  {
    it('returns the base pursuit radius when not alerted', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler._pursuitRadius = 6;
      jabsBattler.isAlerted = () => false;

      expect(jabsBattler.getPursuitRadius()).toBe(6);
    });

    it('adds the alerted pursuit boost when alerted', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler._pursuitRadius = 6;
      jabsBattler._alertedPursuitBoost = 3;
      jabsBattler.isAlerted = () => true;

      expect(jabsBattler.getPursuitRadius()).toBe(9);
    });
  });

  describe('getGuardRange', () =>
  {
    it('returns the tracked guard range', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler._guardRange = 5;

      expect(jabsBattler.getGuardRange()).toBe(5);
    });
  });

  describe('setEngaged / isEngaged', () =>
  {
    it('tracks the engaged flag', () =>
    {
      const jabsBattler = buildBattler();
      expect(jabsBattler.isEngaged()).toBe(false);

      jabsBattler.setEngaged(true);

      expect(jabsBattler.isEngaged()).toBe(true);
    });
  });

  describe('engageTarget', () =>
  {
    function buildEngageableBattler(overrides = {})
    {
      const jabsBattler = buildBattler();
      jabsBattler.isEngagementLocked = () => false;
      jabsBattler.setIdle = vi.fn();
      jabsBattler.addUpdateAggro = vi.fn();
      jabsBattler.clearAlert = vi.fn();
      jabsBattler.onEngage = vi.fn();
      jabsBattler.isActor = () => false;
      Object.assign(jabsBattler, overrides);
      return jabsBattler;
    }

    it('does nothing when engagement is locked', () =>
    {
      const jabsBattler = buildEngageableBattler({ isEngagementLocked: () => true });

      jabsBattler.engageTarget('target');

      expect(jabsBattler.isEngaged()).toBe(false);
      expect(jabsBattler.onEngage).not.toHaveBeenCalled();
    });

    it('sets idle false, engages, and targets the given battler', () =>
    {
      const jabsBattler = buildEngageableBattler();
      const target = { getUuid: () => 'target-uuid' };

      jabsBattler.engageTarget(target);

      expect(jabsBattler.setIdle).toHaveBeenCalledWith(false);
      expect(jabsBattler.isEngaged()).toBe(true);
      expect(jabsBattler.getTarget()).toBe(target);
      expect(jabsBattler.addUpdateAggro).toHaveBeenCalledWith('target-uuid', 0);
    });

    it('disables through-walls for an actor-based battler', () =>
    {
      const setThrough = vi.fn();
      const jabsBattler = buildEngageableBattler({ isActor: () => true });
      jabsBattler.getCharacter = () => ({ setThrough });
      const target = { getUuid: () => 'target-uuid' };

      jabsBattler.engageTarget(target);

      expect(setThrough).toHaveBeenCalledWith(false);
    });

    it('clears the alert state and performs the on-engage hook', () =>
    {
      const jabsBattler = buildEngageableBattler();
      const target = { getUuid: () => 'target-uuid' };

      jabsBattler.engageTarget(target);

      expect(jabsBattler.clearAlert).toHaveBeenCalledTimes(1);
      expect(jabsBattler.onEngage).toHaveBeenCalledTimes(1);
    });
  });

  describe('onEngage', () =>
  {
    it('shows the exclamation balloon', () =>
    {
      J.ABS.Balloons = { Exclamation: 1 };
      const jabsBattler = buildBattler();
      jabsBattler.showBalloon = vi.fn();

      jabsBattler.onEngage();

      expect(jabsBattler.showBalloon).toHaveBeenCalledWith(1);
    });
  });

  describe('disengageTarget', () =>
  {
    function buildDisengageableBattler()
    {
      const jabsBattler = buildBattler();
      jabsBattler.onDisengage = vi.fn();
      jabsBattler.clearAlert = vi.fn();
      jabsBattler.clearFollowers = vi.fn();
      jabsBattler.clearLeaderData = vi.fn();
      jabsBattler.resetPhases = vi.fn();
      return jabsBattler;
    }

    it('fires the on-disengage hook before clearing state', () =>
    {
      const jabsBattler = buildDisengageableBattler();
      jabsBattler.onDisengage = vi.fn(() => { expect(jabsBattler.isEngaged()).toBe(true); });
      jabsBattler.setEngaged(true);

      jabsBattler.disengageTarget();

      expect(jabsBattler.onDisengage).toHaveBeenCalledTimes(1);
    });

    it('clears targeting, engagement, alert, leader/follower data, decided action, and phases', () =>
    {
      const jabsBattler = buildDisengageableBattler();
      jabsBattler.setTarget('target');
      jabsBattler.setAllyTarget('ally');
      jabsBattler.setEngaged(true);
      jabsBattler.setDecidedAction([ 'action' ]);

      jabsBattler.disengageTarget();

      expect(jabsBattler.getTarget()).toBeNull();
      expect(jabsBattler.getAllyTarget()).toBeNull();
      expect(jabsBattler.isEngaged()).toBe(false);
      expect(jabsBattler.clearAlert).toHaveBeenCalledTimes(1);
      expect(jabsBattler.clearFollowers).toHaveBeenCalledTimes(1);
      expect(jabsBattler.clearLeaderData).toHaveBeenCalledTimes(1);
      expect(jabsBattler.isActionDecided()).toBe(false);
      expect(jabsBattler.resetPhases).toHaveBeenCalledTimes(1);
    });
  });

  describe('onDisengage', () =>
  {
    it('does nothing when not currently engaged', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.isEngaged = () => false;
      jabsBattler.showBalloon = vi.fn();

      jabsBattler.onDisengage();

      expect(jabsBattler.showBalloon).not.toHaveBeenCalled();
    });

    it('does not show a balloon when disabled via metadata', () =>
    {
      J.ABS.Metadata.ShowDisengageBalloon = false;
      const jabsBattler = buildBattler();
      jabsBattler.isEngaged = () => true;
      jabsBattler.showBalloon = vi.fn();

      jabsBattler.onDisengage();

      expect(jabsBattler.showBalloon).not.toHaveBeenCalled();
      J.ABS.Metadata.ShowDisengageBalloon = true;
    });

    it('shows the disengage balloon when engaged and enabled', () =>
    {
      J.ABS.Metadata.ShowDisengageBalloon = true;
      J.ABS.Metadata.DisengageBalloonId = 5;
      const jabsBattler = buildBattler();
      jabsBattler.isEngaged = () => true;
      jabsBattler.showBalloon = vi.fn();

      jabsBattler.onDisengage();

      expect(jabsBattler.showBalloon).toHaveBeenCalledWith(5);
    });
  });

  describe('engagement locking', () =>
  {
    it('tracks the engagement lock flag', () =>
    {
      const jabsBattler = buildBattler();
      expect(jabsBattler.isEngagementLocked()).toBe(false);

      jabsBattler.lockEngagement();
      expect(jabsBattler.isEngagementLocked()).toBe(true);

      jabsBattler.unlockEngagement();
      expect(jabsBattler.isEngagementLocked()).toBe(false);
    });
  });

  describe('getTarget / setTarget', () =>
  {
    it('tracks the current target', () =>
    {
      const jabsBattler = buildBattler();
      expect(jabsBattler.getTarget()).toBeNull();

      jabsBattler.setTarget('target');

      expect(jabsBattler.getTarget()).toBe('target');
    });
  });

  describe('battler-last-hit tracking', () =>
  {
    it('getBattlerLastHit clears and returns null when the last hit battler is dead', () =>
    {
      const jabsBattler = buildBattler();
      const deadBattler = { isDead: () => true };
      jabsBattler._lastHit = deadBattler;

      expect(jabsBattler.getBattlerLastHit()).toBeNull();
    });

    it('getBattlerLastHit returns a still-alive last-hit battler', () =>
    {
      const jabsBattler = buildBattler();
      const aliveBattler = { isDead: () => false };
      jabsBattler._lastHit = aliveBattler;

      expect(jabsBattler.getBattlerLastHit()).toBe(aliveBattler);
    });

    it('setBattlerLastHit also sets the current target for the player', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.isPlayer = () => true;
      const battler = { isDead: () => false };

      jabsBattler.setBattlerLastHit(battler);

      expect(jabsBattler.getTarget()).toBe(battler);
    });

    it('setBattlerLastHit does not touch the target for a non-player', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.isPlayer = () => false;
      const battler = { isDead: () => false };

      jabsBattler.setBattlerLastHit(battler);

      expect(jabsBattler.getTarget()).toBeNull();
    });

    it('hasBattlerLastHit reflects whether a last-hit battler is tracked', () =>
    {
      const jabsBattler = buildBattler();
      expect(jabsBattler.hasBattlerLastHit()).toBe(false);

      jabsBattler.setBattlerLastHit({ isDead: () => false });

      expect(jabsBattler.hasBattlerLastHit()).toBe(true);
    });

    it('clearBattlerLastHit clears the last hit, the countdown, and the player\'s target', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.isPlayer = () => true;
      jabsBattler.setBattlerLastHit({ isDead: () => false });
      jabsBattler.setLastBattlerHitCountdown(500);

      jabsBattler.clearBattlerLastHit();

      expect(jabsBattler.hasBattlerLastHit()).toBe(false);
      expect(jabsBattler._lastHitCountdown).toBe(0);
      expect(jabsBattler.getTarget()).toBeNull();
    });

    it('setLastBattlerHitCountdown defaults to 900 frames', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.setLastBattlerHitCountdown();

      expect(jabsBattler._lastHitCountdown).toBe(900);
    });

    it('countdownLastHit clears the last-hit battler once the countdown reaches 0', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.setBattlerLastHit({ isDead: () => false });
      jabsBattler._lastHitCountdown = 0;

      jabsBattler.countdownLastHit();

      expect(jabsBattler.hasBattlerLastHit()).toBe(false);
    });

    it('countdownLastHit decrements the countdown while positive', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler._lastHitCountdown = 5;

      jabsBattler.countdownLastHit();

      expect(jabsBattler._lastHitCountdown).toBe(4);
    });
  });

  describe('isDead', () =>
  {
    it('is true when there is no underlying battler', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.getBattler = () => null;

      expect(jabsBattler.isDead()).toBe(true);
    });

    it('is true when the battler is not tracked on the map', async () =>
    {
      const { default: JABS_AiManager } = await import('../../../../../src/plugins/abs/core/managers/JABS_AiManager.js');
      JABS_AiManager.getBattlerByUuid = vi.fn(() => null);
      const jabsBattler = buildBattler();
      jabsBattler.getBattler = () => ({ getUuid: () => 'uuid', isDead: () => false });

      expect(jabsBattler.isDead()).toBe(true);
    });

    it('is true when the underlying battler reports dead', async () =>
    {
      const { default: JABS_AiManager } = await import('../../../../../src/plugins/abs/core/managers/JABS_AiManager.js');
      JABS_AiManager.getBattlerByUuid = vi.fn(() => ({}));
      const jabsBattler = buildBattler();
      jabsBattler.getBattler = () => ({ getUuid: () => 'uuid', isDead: () => true });
      jabsBattler.isDying = () => false;

      expect(jabsBattler.isDead()).toBe(true);
    });

    it('is true when this battler is dying, even if the underlying battler is not dead', async () =>
    {
      const { default: JABS_AiManager } = await import('../../../../../src/plugins/abs/core/managers/JABS_AiManager.js');
      JABS_AiManager.getBattlerByUuid = vi.fn(() => ({}));
      const jabsBattler = buildBattler();
      jabsBattler.getBattler = () => ({ getUuid: () => 'uuid', isDead: () => false });
      jabsBattler.isDying = () => true;

      expect(jabsBattler.isDead()).toBe(true);
    });

    it('is false for a tracked, alive, non-dying battler', async () =>
    {
      const { default: JABS_AiManager } = await import('../../../../../src/plugins/abs/core/managers/JABS_AiManager.js');
      JABS_AiManager.getBattlerByUuid = vi.fn(() => ({}));
      const jabsBattler = buildBattler();
      jabsBattler.getBattler = () => ({ getUuid: () => 'uuid', isDead: () => false });
      jabsBattler.isDying = () => false;

      expect(jabsBattler.isDead()).toBe(false);
    });
  });

  describe('getAllyTarget / setAllyTarget', () =>
  {
    it('tracks the ally target', () =>
    {
      const jabsBattler = buildBattler();
      expect(jabsBattler.getAllyTarget()).toBeNull();

      jabsBattler.setAllyTarget('ally');

      expect(jabsBattler.getAllyTarget()).toBe('ally');
    });
  });

  describe('distance calculations', () =>
  {
    it('distanceToPoint returns null when both coordinates are null', () =>
    {
      const jabsBattler = buildBattler();

      expect(jabsBattler.distanceToPoint(null, null)).toBeNull();
    });

    it('distanceToPoint computes the rounded euclidean distance', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.getX = () => 0;
      jabsBattler.getY = () => 0;

      expect(jabsBattler.distanceToPoint(3, 4)).toBe(5);
    });

    it('distanceToDesignatedTarget returns null without a target', () =>
    {
      const jabsBattler = buildBattler();

      expect(jabsBattler.distanceToDesignatedTarget(null)).toBeNull();
    });

    it('distanceToDesignatedTarget delegates to distanceToPoint using the target\'s coordinates', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.getX = () => 0;
      jabsBattler.getY = () => 0;
      const target = { getX: () => 3, getY: () => 4 };

      expect(jabsBattler.distanceToDesignatedTarget(target)).toBe(5);
    });

    it('distanceToCurrentTarget returns null without a current target', () =>
    {
      const jabsBattler = buildBattler();

      expect(jabsBattler.distanceToCurrentTarget()).toBeNull();
    });

    it('distanceToCurrentTarget computes distance to the current target', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.getX = () => 0;
      jabsBattler.getY = () => 0;
      jabsBattler.setTarget({ getX: () => 3, getY: () => 4 });

      expect(jabsBattler.distanceToCurrentTarget()).toBe(5);
    });

    it('distanceToAllyTarget returns null without an ally target', () =>
    {
      const jabsBattler = buildBattler();

      expect(jabsBattler.distanceToAllyTarget()).toBeNull();
    });

    it('distanceToAllyTarget computes distance to the ally target', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.getX = () => 0;
      jabsBattler.getY = () => 0;
      jabsBattler.setAllyTarget({ getX: () => 3, getY: () => 4 });

      expect(jabsBattler.distanceToAllyTarget()).toBe(5);
    });
  });
  //endregion _reference
});
//endregion plugins/abs/core/models/jabs-battler.test.js
