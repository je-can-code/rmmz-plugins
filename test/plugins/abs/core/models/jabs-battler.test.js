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
          // build() returns a fully-shaped core-data fixture so callers like
          // JABS_Battler.createPlayer() can construct a real JABS_Battler from it.
          let battlerId = 0;
          const built = {
            battlerId: () => battlerId,
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
          };
          const builder = {
            isPlayer: vi.fn(() => builder),
            setBattlerId: vi.fn((value) => { battlerId = value; return builder; }),
          };
          [
            'setTeam', 'setAiCode', 'setSightRange', 'setAlertedSightBoost',
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

  describe('distanceToHome', () =>
  {
    it('computes distance to the home coordinates', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler._homeX = 3;
      jabsBattler._homeY = 4;
      jabsBattler.getX = () => 0;
      jabsBattler.getY = () => 0;

      expect(jabsBattler.distanceToHome()).toBe(5);
    });
  });

  describe('simple display/behavior flags', () =>
  {
    it('canIdle/showHpBar/showStates/showBattlerName reflect the core-data-derived fields', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler._canIdle = false;
      jabsBattler._showHpBar = false;
      jabsBattler._showStates = false;
      jabsBattler._showBattlerName = false;

      expect(jabsBattler.canIdle()).toBe(false);
      expect(jabsBattler.showHpBar()).toBe(false);
      expect(jabsBattler.showStates()).toBe(false);
      expect(jabsBattler.showBattlerName()).toBe(false);
    });
  });

  describe('alerted state', () =>
  {
    it('isAlerted/setAlerted track the flag, defaulting to true', () =>
    {
      const jabsBattler = buildBattler();
      expect(jabsBattler.isAlerted()).toBe(false);

      jabsBattler.setAlerted();

      expect(jabsBattler.isAlerted()).toBe(true);
    });

    it('getAlertDuration returns the tracked duration', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler._alertDuration = 300;

      expect(jabsBattler.getAlertDuration()).toBe(300);
    });

    it('setAlertedCounter clears idle and sets alerted when the counter is positive', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.setIdle = vi.fn();

      jabsBattler.setAlertedCounter(60);

      expect(jabsBattler.setIdle).toHaveBeenCalledWith(false);
      expect(jabsBattler.isAlerted()).toBe(true);
    });

    it('setAlertedCounter clears alerted when the counter is 0 or less', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.setAlerted(true);

      jabsBattler.setAlertedCounter(0);

      expect(jabsBattler.isAlerted()).toBe(false);
    });

    it('getAlertedCoordinates/setAlertedCoordinates track the alerter\'s position', () =>
    {
      const jabsBattler = buildBattler();

      jabsBattler.setAlertedCoordinates(3, 4);

      expect(jabsBattler.getAlertedCoordinates()).toEqual([ 3, 4 ]);
    });
  });

  describe('home/position tracking', () =>
  {
    it('isHome is true when the event is at its home coordinates', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler._event.x = 3;
      jabsBattler._event.y = 4;
      jabsBattler._homeX = 3;
      jabsBattler._homeY = 4;

      expect(jabsBattler.isHome()).toBe(true);
    });

    it('isHome is false when the event has moved from home', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler._event.x = 5;
      jabsBattler._event.y = 4;
      jabsBattler._homeX = 3;
      jabsBattler._homeY = 4;

      expect(jabsBattler.isHome()).toBe(false);
    });

    it('getHomeX/getHomeY return the tracked home coordinates', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler._homeX = 3;
      jabsBattler._homeY = 4;

      expect(jabsBattler.getHomeX()).toBe(3);
      expect(jabsBattler.getHomeY()).toBe(4);
    });

    it('getX/getY read the real-pixel coordinates from the character', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.getCharacter = () => ({ _realX: 3, _realY: 4 });

      expect(jabsBattler.getX()).toBe(3);
      expect(jabsBattler.getY()).toBe(4);
    });
  });

  describe('getAiMode / getBattlerRole / getLeaderAiMode', () =>
  {
    it('getAiMode returns the tracked ai mode', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler._aiMode = 'ai-mode';

      expect(jabsBattler.getAiMode()).toBe('ai-mode');
    });

    it('getBattlerRole returns the tracked role', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler._battlerRole = 'role';

      expect(jabsBattler.getBattlerRole()).toBe('role');
    });

    it('getLeaderAiMode is null without a leader', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.hasLeader = () => false;

      expect(jabsBattler.getLeaderAiMode()).toBeNull();
    });

    it('getLeaderAiMode is null when the leader cannot be resolved', async () =>
    {
      const { default: JABS_AiManager } = await import('../../../../../src/plugins/abs/core/managers/JABS_AiManager.js');
      JABS_AiManager.getBattlerByUuid = vi.fn(() => null);
      const jabsBattler = buildBattler();
      jabsBattler.hasLeader = () => true;

      expect(jabsBattler.getLeaderAiMode()).toBeNull();
    });

    it('getLeaderAiMode resolves the leader\'s own ai mode', async () =>
    {
      const { default: JABS_AiManager } = await import('../../../../../src/plugins/abs/core/managers/JABS_AiManager.js');
      JABS_AiManager.getBattlerByUuid = vi.fn(() => ({ getAiMode: () => 'leader-ai' }));
      const jabsBattler = buildBattler();
      jabsBattler.hasLeader = () => true;

      expect(jabsBattler.getLeaderAiMode()).toBe('leader-ai');
    });
  });

  describe('movement helpers', () =>
  {
    describe('moveAwayFromTarget', () =>
    {
      it('does nothing without a target', () =>
      {
        const moveAwayFromCharacter = vi.fn();
        const jabsBattler = buildBattler();
        jabsBattler.getCharacter = () => ({ moveAwayFromCharacter });

        jabsBattler.moveAwayFromTarget();

        expect(moveAwayFromCharacter).not.toHaveBeenCalled();
      });

      it('moves the character away from the target\'s character', () =>
      {
        const moveAwayFromCharacter = vi.fn();
        const jabsBattler = buildBattler();
        jabsBattler.getCharacter = () => ({ moveAwayFromCharacter });
        const targetCharacter = {};
        jabsBattler.setTarget({ getCharacter: () => targetCharacter });

        jabsBattler.moveAwayFromTarget();

        expect(moveAwayFromCharacter).toHaveBeenCalledWith(targetCharacter);
      });
    });

    describe('smartMoveAwayFromTarget', () =>
    {
      function buildMovableBattler(overrides = {})
      {
        const jabsBattler = buildBattler();
        jabsBattler.isDodging = () => false;
        jabsBattler.guarding = () => false;
        Object.assign(jabsBattler, overrides);
        return jabsBattler;
      }

      it('does nothing without a target', () =>
      {
        const moveAwayFromCharacter = vi.fn();
        const jabsBattler = buildMovableBattler();
        jabsBattler.getCharacter = () => ({ moveAwayFromCharacter });

        jabsBattler.smartMoveAwayFromTarget();

        expect(moveAwayFromCharacter).not.toHaveBeenCalled();
      });

      it('does nothing while dodging', () =>
      {
        const moveAwayFromCharacter = vi.fn();
        const jabsBattler = buildMovableBattler({ isDodging: () => true });
        jabsBattler.getCharacter = () => ({ moveAwayFromCharacter });
        jabsBattler.setTarget({ getCharacter: () => ({}) });

        jabsBattler.smartMoveAwayFromTarget();

        expect(moveAwayFromCharacter).not.toHaveBeenCalled();
      });

      it('does nothing while guarding', () =>
      {
        const moveAwayFromCharacter = vi.fn();
        const jabsBattler = buildMovableBattler({ guarding: () => true });
        jabsBattler.getCharacter = () => ({ moveAwayFromCharacter });
        jabsBattler.setTarget({ getCharacter: () => ({}) });

        jabsBattler.smartMoveAwayFromTarget();

        expect(moveAwayFromCharacter).not.toHaveBeenCalled();
      });

      it('moves away from the target and does not wiggle when movement succeeded', () =>
      {
        const moveStraight = vi.fn();
        const jabsBattler = buildMovableBattler();
        jabsBattler.getCharacter = () => ({
          moveAwayFromCharacter: vi.fn(),
          isMovementSucceeded: () => true,
          moveStraight,
        });
        jabsBattler.setTarget({ getCharacter: () => ({}) });

        jabsBattler.smartMoveAwayFromTarget();

        expect(moveStraight).not.toHaveBeenCalled();
      });

      it('wiggles in a different direction when the direct move away failed', () =>
      {
        Math.randomInt = (max) => Math.floor(Math.random() * max);
        const moveStraight = vi.fn();
        const jabsBattler = buildMovableBattler();
        jabsBattler.getCharacter = () => ({
          moveAwayFromCharacter: vi.fn(),
          isMovementSucceeded: () => false,
          reverseDir: () => 2,
          direction: () => 8,
          moveStraight,
        });
        jabsBattler.setTarget({ getCharacter: () => ({}) });

        jabsBattler.smartMoveAwayFromTarget();

        expect(moveStraight).toHaveBeenCalledTimes(1);
        expect(moveStraight.mock.calls[0][0]).not.toBe(2);
      });
    });

    describe('smartMoveTowardTarget / smartMoveTowardAllyTarget', () =>
    {
      it('smartMoveTowardTarget does nothing without a target', () =>
      {
        const jabsBattler = buildBattler();
        jabsBattler.smartMoveTowardCoordinates = vi.fn();

        jabsBattler.smartMoveTowardTarget();

        expect(jabsBattler.smartMoveTowardCoordinates).not.toHaveBeenCalled();
      });

      it('smartMoveTowardTarget delegates to smartMoveTowardCoordinates using the target\'s position', () =>
      {
        const jabsBattler = buildBattler();
        jabsBattler.smartMoveTowardCoordinates = vi.fn();
        jabsBattler.setTarget({ getX: () => 3, getY: () => 4 });

        jabsBattler.smartMoveTowardTarget();

        expect(jabsBattler.smartMoveTowardCoordinates).toHaveBeenCalledWith(3, 4);
      });

      it('smartMoveTowardAllyTarget does nothing without an ally target', () =>
      {
        const jabsBattler = buildBattler();
        jabsBattler.smartMoveTowardCoordinates = vi.fn();

        jabsBattler.smartMoveTowardAllyTarget();

        expect(jabsBattler.smartMoveTowardCoordinates).not.toHaveBeenCalled();
      });

      it('smartMoveTowardAllyTarget delegates to smartMoveTowardCoordinates using the ally target\'s position', () =>
      {
        const jabsBattler = buildBattler();
        jabsBattler.smartMoveTowardCoordinates = vi.fn();
        jabsBattler.setAllyTarget({ getX: () => 3, getY: () => 4 });

        jabsBattler.smartMoveTowardAllyTarget();

        expect(jabsBattler.smartMoveTowardCoordinates).toHaveBeenCalledWith(3, 4);
      });
    });

    describe('smartMoveTowardCoordinates', () =>
    {
      function buildMovableBattler(overrides = {})
      {
        const jabsBattler = buildBattler();
        jabsBattler.isDodging = () => false;
        jabsBattler.guarding = () => false;
        Object.assign(jabsBattler, overrides);
        return jabsBattler;
      }

      it('does nothing while dodging', () =>
      {
        const moveStraight = vi.fn();
        const jabsBattler = buildMovableBattler({ isDodging: () => true });
        jabsBattler.getCharacter = () => ({ moveStraight });

        jabsBattler.smartMoveTowardCoordinates(1, 1);

        expect(moveStraight).not.toHaveBeenCalled();
      });

      it('does nothing while guarding', () =>
      {
        const moveStraight = vi.fn();
        const jabsBattler = buildMovableBattler({ guarding: () => true });
        jabsBattler.getCharacter = () => ({ moveStraight });

        jabsBattler.smartMoveTowardCoordinates(1, 1);

        expect(moveStraight).not.toHaveBeenCalled();
      });

      it('moves diagonally when the next direction is diagonal', () =>
      {
        const moveDiagonally = vi.fn();
        const jabsBattler = buildMovableBattler();
        jabsBattler.getCharacter = () => ({
          findDiagonalDirectionTo: () => 9,
          isDiagonalDirection: () => true,
          getDiagonalDirections: () => [ 6, 8 ],
          moveDiagonally,
        });

        jabsBattler.smartMoveTowardCoordinates(1, 1);

        expect(moveDiagonally).toHaveBeenCalledWith(6, 8);
      });

      it('moves straight when the next direction is cardinal', () =>
      {
        const moveStraight = vi.fn();
        const jabsBattler = buildMovableBattler();
        jabsBattler.getCharacter = () => ({
          findDiagonalDirectionTo: () => 8,
          isDiagonalDirection: () => false,
          moveStraight,
        });

        jabsBattler.smartMoveTowardCoordinates(1, 1);

        expect(moveStraight).toHaveBeenCalledWith(8);
      });
    });

    describe('turnTowardTarget', () =>
    {
      it('does nothing without a target', () =>
      {
        const turnTowardCharacter = vi.fn();
        const jabsBattler = buildBattler();
        jabsBattler.getCharacter = () => ({ turnTowardCharacter });

        jabsBattler.turnTowardTarget();

        expect(turnTowardCharacter).not.toHaveBeenCalled();
      });

      it('turns the character toward the target\'s character', () =>
      {
        const turnTowardCharacter = vi.fn();
        const jabsBattler = buildBattler();
        jabsBattler.getCharacter = () => ({ turnTowardCharacter });
        const targetCharacter = {};
        jabsBattler.setTarget({ getCharacter: () => targetCharacter });

        jabsBattler.turnTowardTarget();

        expect(turnTowardCharacter).toHaveBeenCalledWith(targetCharacter);
      });
    });
  });

  describe('canBattlerUseAttacks / canBattlerUseSkills', () =>
  {
    it('canBattlerUseAttacks is true with no states at all', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.getBattler = () => ({ states: () => [] });

      expect(jabsBattler.canBattlerUseAttacks()).toBe(true);
    });

    it('canBattlerUseAttacks is false when disarmed', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.getBattler = () => ({ states: () => [ { jabsDisarmed: true } ] });

      expect(jabsBattler.canBattlerUseAttacks()).toBe(false);
    });

    it('canBattlerUseAttacks is false when paralyzed', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.getBattler = () => ({ states: () => [ { jabsParalyzed: true } ] });

      expect(jabsBattler.canBattlerUseAttacks()).toBe(false);
    });

    it('canBattlerUseAttacks is true when states are present but none disable attacking', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.getBattler = () => ({ states: () => [ {} ] });

      expect(jabsBattler.canBattlerUseAttacks()).toBe(true);
    });

    it('canBattlerUseSkills is true with no states at all', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.getBattler = () => ({ states: () => [] });

      expect(jabsBattler.canBattlerUseSkills()).toBe(true);
    });

    it('canBattlerUseSkills is false when muted', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.getBattler = () => ({ states: () => [ { jabsMuted: true } ] });

      expect(jabsBattler.canBattlerUseSkills()).toBe(false);
    });

    it('canBattlerUseSkills is false when paralyzed', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.getBattler = () => ({ states: () => [ { jabsParalyzed: true } ] });

      expect(jabsBattler.canBattlerUseSkills()).toBe(false);
    });
  });

  describe('last used skill/slot tracking', () =>
  {
    it('tracks the last used skill id', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.setLastUsedSkillId(5);

      expect(jabsBattler.getLastUsedSkillId()).toBe(5);
    });

    it('tracks the last used slot key', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.setLastUsedSlot('mainhand');

      expect(jabsBattler.getLastUsedSlot()).toBe('mainhand');
    });
  });

  describe('combo skill slot delegation', () =>
  {
    it('getComboNextActionId reads from the skill slot manager', () =>
    {
      const getSlotComboId = vi.fn(() => 7);
      const jabsBattler = buildBattler();
      jabsBattler.getBattler = () => ({ getSkillSlotManager: () => ({ getSlotComboId }) });

      expect(jabsBattler.getComboNextActionId('mainhand')).toBe(7);
      expect(getSlotComboId).toHaveBeenCalledWith('mainhand');
    });

    it('setComboNextActionId writes to the skill slot manager', () =>
    {
      const setSlotComboId = vi.fn();
      const jabsBattler = buildBattler();
      jabsBattler.getBattler = () => ({ getSkillSlotManager: () => ({ setSlotComboId }) });

      jabsBattler.setComboNextActionId('mainhand', 7);

      expect(setSlotComboId).toHaveBeenCalledWith('mainhand', 7);
    });

    it('hasComboReady is true when at least one slot has a pending combo id', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.getBattler = () => ({
        getSkillSlotManager: () => ({ getAllSlots: () => [ { comboId: 0 }, { comboId: 5 } ] }),
      });

      expect(jabsBattler.hasComboReady()).toBe(true);
    });

    it('hasComboReady is false when no slots have a pending combo id', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.getBattler = () => ({
        getSkillSlotManager: () => ({ getAllSlots: () => [ { comboId: 0 } ] }),
      });

      expect(jabsBattler.hasComboReady()).toBe(false);
    });
  });

  describe('ai combo humanized timing', () =>
  {
    it('sets and clears the ready frame', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.setAiComboHumanizedReadyFrame(500);
      expect(jabsBattler._aiComboHumanizedReadyFrame).toBe(500);

      jabsBattler.clearAiComboHumanizedReadyFrame();
      expect(jabsBattler._aiComboHumanizedReadyFrame).toBe(0);
    });

    it('isAiComboHumanizationTimingReady is true when no gate is armed', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler._aiComboHumanizedReadyFrame = 0;

      expect(jabsBattler.isAiComboHumanizationTimingReady()).toBe(true);
    });

    it('isAiComboHumanizationTimingReady is false before the armed frame', () =>
    {
      globalThis.Graphics.frameCount = 100;
      const jabsBattler = buildBattler();
      jabsBattler._aiComboHumanizedReadyFrame = 200;

      expect(jabsBattler.isAiComboHumanizationTimingReady()).toBe(false);
    });

    it('isAiComboHumanizationTimingReady is true once the current frame reaches the armed frame', () =>
    {
      globalThis.Graphics.frameCount = 200;
      const jabsBattler = buildBattler();
      jabsBattler._aiComboHumanizedReadyFrame = 200;

      expect(jabsBattler.isAiComboHumanizationTimingReady()).toBe(true);
    });
  });

  describe('enemy skill pool', () =>
  {
    it('getSkillIdsFromEnemy filters actions through the ai skill filter', () =>
    {
      const jabsBattler = buildBattler();
      const skill1 = { id: 1 };
      const skill2 = { id: 2 };
      jabsBattler.getBattler = () => ({
        enemy: () => ({ actions: [ { skillId: 1 }, { skillId: 2 } ] }),
        skill: (id) => (id === 1 ? skill1 : skill2),
      });
      jabsBattler.aiSkillFilter = (skill) => skill === skill1;

      expect(jabsBattler.getSkillIdsFromEnemy()).toEqual([ 1 ]);
    });

    it('aiSkillFilter excludes explicitly-excluded skills', () =>
    {
      const jabsBattler = buildBattler();

      expect(jabsBattler.aiSkillFilter({ jabsAiSkillExclusion: true })).toBe(false);
    });

    it('aiSkillFilter excludes non-starter combo-chain skills', () =>
    {
      const jabsBattler = buildBattler();

      expect(jabsBattler.aiSkillFilter({ jabsComboAction: true, jabsComboStarter: false })).toBe(false);
    });

    it('aiSkillFilter includes combo-starter skills', () =>
    {
      const jabsBattler = buildBattler();

      expect(jabsBattler.aiSkillFilter({ jabsComboAction: true, jabsComboStarter: true })).toBe(true);
    });

    it('aiSkillFilter includes normal non-combo skills', () =>
    {
      const jabsBattler = buildBattler();

      expect(jabsBattler.aiSkillFilter({})).toBe(true);
    });

    it('getEnemyBasicAttack delegates to the underlying battler', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.getBattler = () => ({ basicAttackSkillId: () => 1 });

      expect(jabsBattler.getEnemyBasicAttack()).toBe(1);
    });

    it('getAllSkillIdsFromEnemy appends the basic attack to the enemy skill pool', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.getSkillIdsFromEnemy = () => [ 10, 11 ];
      jabsBattler.getEnemyBasicAttack = () => 1;

      expect(jabsBattler.getAllSkillIdsFromEnemy()).toEqual([ 10, 11, 1 ]);
    });
  });

  describe('balloons/animations', () =>
  {
    it('showBalloon requests a balloon on the underlying event', () =>
    {
      globalThis.$gameTemp = { requestBalloon: vi.fn() };
      const jabsBattler = buildBattler();

      jabsBattler.showBalloon(3);

      expect(globalThis.$gameTemp.requestBalloon).toHaveBeenCalledWith(jabsBattler._event, 3);
    });

    it('showAnimation requests an animation on the character', () =>
    {
      const requestAnimation = vi.fn();
      const jabsBattler = buildBattler();
      jabsBattler.getCharacter = () => ({ requestAnimation });

      jabsBattler.showAnimation(5);

      expect(requestAnimation).toHaveBeenCalledWith(5);
    });

    it('isShowingAnimation delegates to the character', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.getCharacter = () => ({ isAnimationPlaying: () => true });

      expect(jabsBattler.isShowingAnimation()).toBe(true);
    });
  });

  describe('in-combat tracking', () =>
  {
    it('enterCombat sets the countdown to the combat window max', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.getCombatWindowMax = () => 600;

      jabsBattler.enterCombat();

      expect(jabsBattler.getInCombatCountdown()).toBe(600);
    });

    it('getInCombatCountdown defaults to 0 for a falsy countdown', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler._inCombatCountdown = undefined;

      expect(jabsBattler.getInCombatCountdown()).toBe(0);
    });

    it('getCombatSecondsRemaining converts frames to seconds with one decimal', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.setInCombatCountdown(90);

      expect(jabsBattler.getCombatSecondsRemaining()).toBe(1.5);
    });

    it('isInCombat is true when forced combat is active regardless of countdown', () =>
    {
      globalThis.$jabsEngine = { forcedCombat: true };
      const jabsBattler = buildBattler();
      jabsBattler._inCombatCountdown = 0;

      expect(jabsBattler.isInCombat()).toBe(true);
    });

    it('isInCombat is true while the countdown is positive', () =>
    {
      globalThis.$jabsEngine = { forcedCombat: false };
      const jabsBattler = buildBattler();
      jabsBattler._inCombatCountdown = 5;

      expect(jabsBattler.isInCombat()).toBe(true);
    });

    it('isInCombat is false when neither forced nor counting down', () =>
    {
      globalThis.$jabsEngine = { forcedCombat: false };
      const jabsBattler = buildBattler();
      jabsBattler._inCombatCountdown = 0;

      expect(jabsBattler.isInCombat()).toBe(false);
    });

    it('getCombatWindowMax falls back to 600 for a falsy configured value', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler._inCombatWindowMax = 0;

      expect(jabsBattler.getCombatWindowMax()).toBe(600);
    });

    it('setCombatWindowMax clamps to a zero minimum', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.setCombatWindowMax(-5);

      expect(jabsBattler._inCombatWindowMax).toBe(0);
    });

    it('setInCombatCountdown clamps to a zero minimum', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.setInCombatCountdown(-5);

      expect(jabsBattler.getInCombatCountdown()).toBe(0);
    });

    describe('countdownCombat', () =>
    {
      it('clamps to 0 and stops once the countdown reaches 0', () =>
      {
        const jabsBattler = buildBattler();
        jabsBattler._inCombatCountdown = 0;
        jabsBattler._maybeShortenCombatTail = vi.fn();

        jabsBattler.countdownCombat();

        expect(jabsBattler._inCombatCountdown).toBe(0);
        expect(jabsBattler._maybeShortenCombatTail).not.toHaveBeenCalled();
      });

      it('attempts to shorten the combat tail then decrements while positive', () =>
      {
        const jabsBattler = buildBattler();
        jabsBattler._inCombatCountdown = 10;
        jabsBattler._maybeShortenCombatTail = vi.fn();

        jabsBattler.countdownCombat();

        expect(jabsBattler._maybeShortenCombatTail).toHaveBeenCalledWith(120);
        expect(jabsBattler._inCombatCountdown).toBe(9);
      });
    });

    describe('_maybeShortenCombatTail', () =>
    {
      it('does not shorten when the countdown is already within the tail window', () =>
      {
        const jabsBattler = buildBattler();
        jabsBattler._inCombatCountdown = 100;

        jabsBattler._maybeShortenCombatTail(120);

        expect(jabsBattler._inCombatCountdown).toBe(100);
      });

      it('does not shorten while still within the post-engage grace window', () =>
      {
        const jabsBattler = buildBattler();
        jabsBattler.getCombatWindowMax = () => 600;
        jabsBattler._inCombatCountdown = 590;

        jabsBattler._maybeShortenCombatTail(120);

        expect(jabsBattler._inCombatCountdown).toBe(590);
      });

      it('compresses the tail when nobody is aggroed to the party', async () =>
      {
        const { default: JABS_AiManager } = await import('../../../../../src/plugins/abs/core/managers/JABS_AiManager.js');
        JABS_AiManager.anyLivingEnemiesAggroedToParty = vi.fn(() => false);
        const jabsBattler = buildBattler();
        jabsBattler.getCombatWindowMax = () => 600;
        jabsBattler._inCombatCountdown = 300;

        jabsBattler._maybeShortenCombatTail(120);

        expect(jabsBattler._inCombatCountdown).toBe(120);
      });

      it('does not compress the tail while an enemy remains aggroed to the party', async () =>
      {
        const { default: JABS_AiManager } = await import('../../../../../src/plugins/abs/core/managers/JABS_AiManager.js');
        JABS_AiManager.anyLivingEnemiesAggroedToParty = vi.fn(() => true);
        const jabsBattler = buildBattler();
        jabsBattler.getCombatWindowMax = () => 600;
        jabsBattler._inCombatCountdown = 300;

        jabsBattler._maybeShortenCombatTail(120);

        expect(jabsBattler._inCombatCountdown).toBe(300);
      });
    });
  });
  //endregion _reference

  //region statics
  describe('createPlayer', () =>
  {
    it('builds a player battler using the party leader\'s actor id', () =>
    {
      const battler = { actorId: () => 1, prepareTime: () => 0, getSkillSlotManager: () => ({ setupSlots: vi.fn() }) };
      globalThis.$gameParty = { leader: () => battler };
      globalThis.$gamePlayer = { id: 'player-event', _x: 0, _y: 0 };

      const player = JABS_Battler.createPlayer();

      expect(player.getBattlerId()).toBe(1);
      expect(player.getCharacter()).toBe(globalThis.$gamePlayer);
      expect(player.getBattler()).toBe(battler);
    });

    it('defaults the actor id to 0 when there is no party leader', () =>
    {
      globalThis.$gameParty = { leader: () => null };
      globalThis.$gamePlayer = { id: 'player-event', _x: 0, _y: 0 };
      // with no leader, the underlying battler passed to the constructor is null, and both
      // initFromNotes() and initCooldowns() would dereference it- stub them out since this
      // test only cares about the actor-id-defaulting branch, not the (separately-tested)
      // init pipeline.
      const originalInitFromNotes = JABS_Battler.prototype.initFromNotes;
      const originalInitCooldowns = JABS_Battler.prototype.initCooldowns;
      JABS_Battler.prototype.initFromNotes = function() {};
      JABS_Battler.prototype.initCooldowns = function() {};

      const player = JABS_Battler.createPlayer();

      expect(player.getBattlerId()).toBe(0);
      JABS_Battler.prototype.initFromNotes = originalInitFromNotes;
      JABS_Battler.prototype.initCooldowns = originalInitCooldowns;
    });
  });

  describe('distance classification', () =>
  {
    it('isClose is true at or under the close-distance threshold', () =>
    {
      expect(JABS_Battler.isClose(JABS_Battler.closeDistance)).toBe(true);
      expect(JABS_Battler.isClose(JABS_Battler.closeDistance + 0.1)).toBe(false);
    });

    it('isSafe is true strictly between close and far distance', () =>
    {
      expect(JABS_Battler.isSafe(JABS_Battler.closeDistance)).toBe(false);
      expect(JABS_Battler.isSafe(JABS_Battler.closeDistance + 0.1)).toBe(true);
      expect(JABS_Battler.isSafe(JABS_Battler.farDistance)).toBe(true);
      expect(JABS_Battler.isSafe(JABS_Battler.farDistance + 0.1)).toBe(false);
    });

    it('isFar is true beyond the far-distance threshold', () =>
    {
      expect(JABS_Battler.isFar(JABS_Battler.farDistance)).toBe(false);
      expect(JABS_Battler.isFar(JABS_Battler.farDistance + 0.1)).toBe(true);
    });
  });

  describe('skill type classification', () =>
  {
    beforeEach(() =>
    {
      J.ABS.DefaultValues = { GuardSkillTypeId: 1, DodgeSkillTypeId: 2, WeaponSkillTypeId: 3 };
    });

    it('isGuardSkillById is false without an id', () =>
    {
      expect(JABS_Battler.isGuardSkillById(0)).toBe(false);
    });

    it('isGuardSkillById is true for a matching stype', () =>
    {
      globalThis.$dataSkills = { 1: { stypeId: 1 } };
      expect(JABS_Battler.isGuardSkillById(1)).toBe(true);
    });

    it('isGuardSkillById is false for a non-matching stype', () =>
    {
      globalThis.$dataSkills = { 1: { stypeId: 9 } };
      expect(JABS_Battler.isGuardSkillById(1)).toBe(false);
    });

    it('isDodgeSkillById is false without an id', () =>
    {
      expect(JABS_Battler.isDodgeSkillById(0)).toBe(false);
    });

    it('isDodgeSkillById is true for a matching stype', () =>
    {
      globalThis.$dataSkills = { 1: { stypeId: 2 } };
      expect(JABS_Battler.isDodgeSkillById(1)).toBe(true);
    });

    it('isWeaponSkillById is false without an id', () =>
    {
      expect(JABS_Battler.isWeaponSkillById(0)).toBe(false);
    });

    it('isWeaponSkillById is true for a matching stype', () =>
    {
      globalThis.$dataSkills = { 1: { stypeId: 3 } };
      expect(JABS_Battler.isWeaponSkillById(1)).toBe(true);
    });
  });

  describe('menu visibility classification', () =>
  {
    it('isSkillVisibleInCombatMenu is false for a null skill', () =>
    {
      expect(JABS_Battler.isSkillVisibleInCombatMenu(null)).toBe(false);
    });

    it('isSkillVisibleInCombatMenu is false for a menu-hidden skill', () =>
    {
      expect(JABS_Battler.isSkillVisibleInCombatMenu({ jabsHiddenFromMenus: true })).toBe(false);
    });

    it('isSkillVisibleInCombatMenu is false for a dodge/guard/weapon skill', () =>
    {
      JABS_Battler.isDodgeSkillById = vi.fn(() => true);
      expect(JABS_Battler.isSkillVisibleInCombatMenu({ id: 1 })).toBe(false);
      JABS_Battler.isDodgeSkillById = vi.fn(() => false);
    });

    it('isSkillVisibleInCombatMenu is false for an offhand-eligible skill', () =>
    {
      JABS_Battler.isDodgeSkillById = vi.fn(() => false);
      JABS_Battler.isGuardSkillById = vi.fn(() => false);
      JABS_Battler.isWeaponSkillById = vi.fn(() => false);
      expect(JABS_Battler.isSkillVisibleInCombatMenu({ id: 1, jabsOffhandEligible: true })).toBe(false);
    });

    it('isSkillVisibleInCombatMenu is true for a normal skill', () =>
    {
      JABS_Battler.isDodgeSkillById = vi.fn(() => false);
      JABS_Battler.isGuardSkillById = vi.fn(() => false);
      JABS_Battler.isWeaponSkillById = vi.fn(() => false);
      expect(JABS_Battler.isSkillVisibleInCombatMenu({ id: 1 })).toBe(true);
    });

    it('isSkillVisibleInOffhandMenu is false for a null skill', () =>
    {
      expect(JABS_Battler.isSkillVisibleInOffhandMenu(null)).toBe(false);
    });

    it('isSkillVisibleInOffhandMenu requires the offhand-eligible flag to be exactly true', () =>
    {
      JABS_Battler.isDodgeSkillById = vi.fn(() => false);
      JABS_Battler.isGuardSkillById = vi.fn(() => false);
      JABS_Battler.isWeaponSkillById = vi.fn(() => false);
      expect(JABS_Battler.isSkillVisibleInOffhandMenu({ id: 1, jabsOffhandEligible: 1 })).toBe(false);
      expect(JABS_Battler.isSkillVisibleInOffhandMenu({ id: 1, jabsOffhandEligible: true })).toBe(true);
    });

    it('isSkillVisibleInDodgeMenu is false for a non-dodge skill', () =>
    {
      JABS_Battler.isDodgeSkillById = vi.fn(() => false);
      expect(JABS_Battler.isSkillVisibleInDodgeMenu({ id: 1 })).toBe(false);
    });

    it('isSkillVisibleInDodgeMenu is true for a dodge skill', () =>
    {
      JABS_Battler.isDodgeSkillById = vi.fn(() => true);
      expect(JABS_Battler.isSkillVisibleInDodgeMenu({ id: 1 })).toBe(true);
    });
  });

  describe('team id constants', () =>
  {
    it('exposes ally/enemy/neutral team ids', () =>
    {
      expect(JABS_Battler.allyTeamId()).toBe(0);
      expect(JABS_Battler.enemyTeamId()).toBe(1);
      expect(JABS_Battler.neutralTeamId()).toBe(2);
    });
  });

  describe('allyRubberbandRange', () =>
  {
    it('adds the metadata adjustment to the base of 10', () =>
    {
      J.ABS.Metadata.AllyRubberbandAdjustment = 2;
      expect(JABS_Battler.allyRubberbandRange()).toBe(12);
    });
  });
  //endregion statics

  //region updates: targeting resolution
  describe('updateSelfInterruptOnMove', () =>
  {
    function buildInterruptibleBattler(overrides = {})
    {
      const jabsBattler = buildBattler();
      jabsBattler.isPlayer = () => true;
      jabsBattler.isCastingOrChanneling = () => true;
      jabsBattler.hasUninterruptibleMovementLock = () => false;
      jabsBattler.interrupt = vi.fn();
      Object.assign(jabsBattler, overrides);
      return jabsBattler;
    }

    beforeEach(() =>
    {
      globalThis.Input = { dir8: 0 };
      globalThis.$gameTemp = { isDestinationValid: () => false };
    });

    it('does nothing for a non-player battler', () =>
    {
      const jabsBattler = buildInterruptibleBattler({ isPlayer: () => false });

      jabsBattler.updateSelfInterruptOnMove();

      expect(jabsBattler.interrupt).not.toHaveBeenCalled();
    });

    it('does nothing when not casting or channeling', () =>
    {
      const jabsBattler = buildInterruptibleBattler({ isCastingOrChanneling: () => false });

      jabsBattler.updateSelfInterruptOnMove();

      expect(jabsBattler.interrupt).not.toHaveBeenCalled();
    });

    it('does nothing when the active cast/channel has an uninterruptible movement lock', () =>
    {
      const jabsBattler = buildInterruptibleBattler({ hasUninterruptibleMovementLock: () => true });

      jabsBattler.updateSelfInterruptOnMove();

      expect(jabsBattler.interrupt).not.toHaveBeenCalled();
    });

    it('does nothing when there is no movement intent', () =>
    {
      const jabsBattler = buildInterruptibleBattler();

      jabsBattler.updateSelfInterruptOnMove();

      expect(jabsBattler.interrupt).not.toHaveBeenCalled();
    });

    it('interrupts when directional input signals movement intent', () =>
    {
      globalThis.Input.dir8 = 8;
      const jabsBattler = buildInterruptibleBattler();

      jabsBattler.updateSelfInterruptOnMove();

      expect(jabsBattler.interrupt).toHaveBeenCalledWith(100, true);
    });

    it('interrupts when a click-to-move destination is queued', () =>
    {
      globalThis.$gameTemp.isDestinationValid = () => true;
      const jabsBattler = buildInterruptibleBattler();

      jabsBattler.updateSelfInterruptOnMove();

      expect(jabsBattler.interrupt).toHaveBeenCalledWith(100, true);
    });
  });

  describe('canProcessQueuedActions', () =>
  {
    function buildBaseBattler(overrides = {})
    {
      const jabsBattler = buildBattler();
      jabsBattler.isActionDecided = () => true;
      jabsBattler.isCasting = () => false;
      jabsBattler.isChanneling = () => false;
      jabsBattler.isPlayer = () => true;
      jabsBattler.isInPosition = () => false;
      Object.assign(jabsBattler, overrides);
      return jabsBattler;
    }

    it('is false without a decided action', () =>
    {
      expect(buildBaseBattler({ isActionDecided: () => false }).canProcessQueuedActions()).toBe(false);
    });

    it('is false while casting', () =>
    {
      expect(buildBaseBattler({ isCasting: () => true }).canProcessQueuedActions()).toBe(false);
    });

    it('is false while channeling', () =>
    {
      expect(buildBaseBattler({ isChanneling: () => true }).canProcessQueuedActions()).toBe(false);
    });

    it('is false for a non-player not yet in position', () =>
    {
      expect(buildBaseBattler({ isPlayer: () => false, isInPosition: () => false }).canProcessQueuedActions())
        .toBe(false);
    });

    it('is true for a non-player already in position', () =>
    {
      expect(buildBaseBattler({ isPlayer: () => false, isInPosition: () => true }).canProcessQueuedActions())
        .toBe(true);
    });

    it('is true for the player regardless of in-position status', () =>
    {
      expect(buildBaseBattler({ isPlayer: () => true, isInPosition: () => false }).canProcessQueuedActions())
        .toBe(true);
    });
  });

  describe('processQueuedActions', () =>
  {
    function buildPrimaryAction(overrides = {})
    {
      return Object.assign({
        getBaseSkill: () => ({ id: 7, jabsChannel: [] }),
        getCooldownType: () => 'mainhand',
      }, overrides);
    }

    it('does nothing when queued actions cannot currently be processed', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.canProcessQueuedActions = () => false;
      globalThis.$jabsEngine = { executeMapActions: vi.fn() };

      jabsBattler.processQueuedActions();

      expect(globalThis.$jabsEngine.executeMapActions).not.toHaveBeenCalled();
    });

    it('tracks the last used skill id and slot', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.canProcessQueuedActions = () => true;
      jabsBattler.resolveActionTargetCoordinates = () => [ null, null ];
      globalThis.$jabsEngine = { executeMapActions: vi.fn() };
      jabsBattler.setDecidedAction([ buildPrimaryAction() ]);

      jabsBattler.processQueuedActions();

      expect(jabsBattler.getLastUsedSkillId()).toBe(7);
      expect(jabsBattler.getLastUsedSlot()).toBe('mainhand');
    });

    it('begins a channel and retains the decided action for a channel-tagged skill', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.canProcessQueuedActions = () => true;
      jabsBattler.beginChannel = vi.fn();
      globalThis.$jabsEngine = { executeMapActions: vi.fn() };
      const primaryAction = buildPrimaryAction({ getBaseSkill: () => ({ id: 7, jabsChannel: [ 1 ] }) });
      jabsBattler.setDecidedAction([ primaryAction ]);

      jabsBattler.processQueuedActions();

      expect(jabsBattler.beginChannel).toHaveBeenCalledWith(primaryAction);
      expect(globalThis.$jabsEngine.executeMapActions).not.toHaveBeenCalled();
      expect(jabsBattler.isActionDecided()).toBe(true);
    });

    it('executes the resolved map action and clears the decided action for a normal skill', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.canProcessQueuedActions = () => true;
      jabsBattler.resolveActionTargetCoordinates = () => [ 3, 4 ];
      globalThis.$jabsEngine = { executeMapActions: vi.fn() };
      const decidedActions = [ buildPrimaryAction() ];
      jabsBattler.setDecidedAction(decidedActions);

      jabsBattler.processQueuedActions();

      expect(globalThis.$jabsEngine.executeMapActions).toHaveBeenCalledWith(jabsBattler, decidedActions, 3, 4);
      expect(jabsBattler.isActionDecided()).toBe(false);
    });
  });

  describe('resolveActionTargetCoordinates', () =>
  {
    it('returns [null, null] without an action', () =>
    {
      const jabsBattler = buildBattler();

      expect(jabsBattler.resolveActionTargetCoordinates(null)).toEqual([ null, null ]);
    });

    it('prefers a frozen target location from the action options', () =>
    {
      const jabsBattler = buildBattler();
      const action = {
        getActionOptions: () => ({ getTargetLocation: () => ({ getX: () => 3, getY: () => 4 }) }),
      };

      expect(jabsBattler.resolveActionTargetCoordinates(action)).toEqual([ 3, 4 ]);
    });

    it('falls back to live direct-action resolution without a frozen location', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.resolveDirectActionTargetCoordinates = vi.fn(() => [ 5, 6 ]);
      const action = { getActionOptions: () => null };

      expect(jabsBattler.resolveActionTargetCoordinates(action)).toEqual([ 5, 6 ]);
    });
  });

  describe('resolveDirectActionTargetCoordinates', () =>
  {
    it('returns [null, null] without a direct action', () =>
    {
      const jabsBattler = buildBattler();

      expect(jabsBattler.resolveDirectActionTargetCoordinates({ isDirectAction: () => false })).toEqual([
        null, null,
      ]);
    });

    it('spatializes onto the caster for a self-targeting action', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.getX = () => 1;
      jabsBattler.getY = () => 2;
      const action = { isDirectAction: () => true, getAction: () => ({ isForUser: () => true }) };

      expect(jabsBattler.resolveDirectActionTargetCoordinates(action)).toEqual([ 1, 2 ]);
    });

    it('resolves onto the ally target for an ally-targeting action', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.setAllyTarget({ getX: () => 3, getY: () => 4 });
      const action = {
        isDirectAction: () => true,
        getAction: () => ({ isForUser: () => false, isForFriend: () => true }),
      };

      expect(jabsBattler.resolveDirectActionTargetCoordinates(action)).toEqual([ 3, 4 ]);
    });

    it('falls through to the opponent priority chain otherwise', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.resolveDirectOpponentTarget = vi.fn(() => ({ getX: () => 7, getY: () => 8 }));
      const skill = { id: 1 };
      const action = {
        isDirectAction: () => true,
        getAction: () => ({ isForUser: () => false, isForFriend: () => false }),
        getBaseSkill: () => skill,
      };

      expect(jabsBattler.resolveDirectActionTargetCoordinates(action)).toEqual([ 7, 8 ]);
      expect(jabsBattler.resolveDirectOpponentTarget).toHaveBeenCalledWith(skill);
    });

    it('returns nulls when the opponent chain finds nothing', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.resolveDirectOpponentTarget = vi.fn(() => null);
      const action = {
        isDirectAction: () => true,
        getAction: () => ({ isForUser: () => false, isForFriend: () => false }),
        getBaseSkill: () => ({}),
      };

      expect(jabsBattler.resolveDirectActionTargetCoordinates(action)).toEqual([ null, null ]);
    });
  });

  describe('resolveDirectActionTargetCoordinatesForSkill', () =>
  {
    beforeEach(() =>
    {
      globalThis.Game_Action = vi.fn(function()
      {
        this.setSkill = vi.fn();
      });
    });

    it('returns [null, null] for a non-direct skill', () =>
    {
      const jabsBattler = buildBattler();

      expect(jabsBattler.resolveDirectActionTargetCoordinatesForSkill({ jabsDirect: false })).toEqual([
        null, null,
      ]);
    });

    it('spatializes onto the caster for a self-targeting skill', () =>
    {
      globalThis.Game_Action = vi.fn(function()
      {
        this.setSkill = vi.fn();
        this.isForUser = () => true;
      });
      const jabsBattler = buildBattler();
      jabsBattler.getX = () => 1;
      jabsBattler.getY = () => 2;

      expect(jabsBattler.resolveDirectActionTargetCoordinatesForSkill({ jabsDirect: true, id: 1 })).toEqual([
        1, 2,
      ]);
    });

    it('resolves onto the ally target for an ally-targeting skill', () =>
    {
      globalThis.Game_Action = vi.fn(function()
      {
        this.setSkill = vi.fn();
        this.isForUser = () => false;
        this.isForFriend = () => true;
      });
      const jabsBattler = buildBattler();
      jabsBattler.setAllyTarget({ getX: () => 3, getY: () => 4 });

      expect(jabsBattler.resolveDirectActionTargetCoordinatesForSkill({ jabsDirect: true, id: 1 })).toEqual([
        3, 4,
      ]);
    });

    it('returns nulls for ally-targeting without a selected ally target, without guessing', () =>
    {
      globalThis.Game_Action = vi.fn(function()
      {
        this.setSkill = vi.fn();
        this.isForUser = () => false;
        this.isForFriend = () => true;
      });
      const jabsBattler = buildBattler();

      expect(jabsBattler.resolveDirectActionTargetCoordinatesForSkill({ jabsDirect: true, id: 1 })).toEqual([
        null, null,
      ]);
    });

    it('falls through to the opponent priority chain otherwise', () =>
    {
      globalThis.Game_Action = vi.fn(function()
      {
        this.setSkill = vi.fn();
        this.isForUser = () => false;
        this.isForFriend = () => false;
      });
      const jabsBattler = buildBattler();
      jabsBattler.resolveDirectOpponentTarget = vi.fn(() => ({ getX: () => 7, getY: () => 8 }));
      const skill = { jabsDirect: true, id: 1 };

      expect(jabsBattler.resolveDirectActionTargetCoordinatesForSkill(skill)).toEqual([ 7, 8 ]);
      expect(jabsBattler.resolveDirectOpponentTarget).toHaveBeenCalledWith(skill);
    });
  });

  describe('resolveDirectOpponentTarget', () =>
  {
    it('performs no spatial scan when the skill has no proximity', async () =>
    {
      const { default: JABS_AiManager } = await import('../../../../../src/plugins/abs/core/managers/JABS_AiManager.js');
      JABS_AiManager.getBattlersWithinRange = vi.fn(() => [ 'candidate' ]);
      const jabsBattler = buildBattler();
      jabsBattler.resolveDirectTargetByState = vi.fn(() => null);
      jabsBattler.resolveDirectTargetNonInanimate = vi.fn(() => null);
      jabsBattler.resolveDirectTargetViaScan = vi.fn(() => null);
      jabsBattler.resolveDirectTargetInanimateFallback = vi.fn(() => null);
      jabsBattler.resolveDirectTargetInanimateScan = vi.fn(() => null);

      jabsBattler.resolveDirectOpponentTarget({});

      expect(JABS_AiManager.getBattlersWithinRange).not.toHaveBeenCalled();
      expect(jabsBattler.resolveDirectTargetViaScan).toHaveBeenCalledWith([]);
    });

    it('walks the five-tier chain in priority order, short-circuiting on the first hit', async () =>
    {
      const { default: JABS_AiManager } = await import('../../../../../src/plugins/abs/core/managers/JABS_AiManager.js');
      JABS_AiManager.getBattlersWithinRange = vi.fn(() => [ 'candidate' ]);
      const jabsBattler = buildBattler();
      const winner = { id: 'winner' };
      jabsBattler.resolveDirectTargetByState = vi.fn(() => null);
      jabsBattler.resolveDirectTargetNonInanimate = vi.fn(() => winner);
      jabsBattler.resolveDirectTargetViaScan = vi.fn();
      jabsBattler.resolveDirectTargetInanimateFallback = vi.fn();
      jabsBattler.resolveDirectTargetInanimateScan = vi.fn();

      const result = jabsBattler.resolveDirectOpponentTarget({ jabsProximity: 5 });

      expect(result).toBe(winner);
      expect(jabsBattler.resolveDirectTargetViaScan).not.toHaveBeenCalled();
      expect(jabsBattler.resolveDirectTargetInanimateFallback).not.toHaveBeenCalled();
      expect(jabsBattler.resolveDirectTargetInanimateScan).not.toHaveBeenCalled();
    });
  });

  describe('resolveDirectTargetByState', () =>
  {
    it('returns null when no state id is configured', () =>
    {
      const jabsBattler = buildBattler();

      expect(jabsBattler.resolveDirectTargetByState(null, [ 'candidate' ])).toBeNull();
    });

    function buildCandidate(overrides = {})
    {
      return Object.assign({
        isEnemy: () => true,
        getBattler: () => ({ isStateAffected: () => true }),
      }, overrides);
    }

    it('skips itself and same-team candidates', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.isEnemy = () => true;
      const sameTeam = buildCandidate({ isEnemy: () => true });

      expect(jabsBattler.resolveDirectTargetByState(1, [ jabsBattler, sameTeam ])).toBeNull();
    });

    it('skips candidates not afflicted with the target state', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.isEnemy = () => false;
      const unafflicted = buildCandidate({ getBattler: () => ({ isStateAffected: () => false }) });

      expect(jabsBattler.resolveDirectTargetByState(1, [ unafflicted ])).toBeNull();
    });

    it('returns the closest afflicted opponent', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.isEnemy = () => false;
      jabsBattler.distanceToDesignatedTarget = vi.fn()
        .mockReturnValueOnce(10)
        .mockReturnValueOnce(3);
      const far = buildCandidate();
      const near = buildCandidate();

      expect(jabsBattler.resolveDirectTargetByState(1, [ far, near ])).toBe(near);
    });
  });

  describe('resolveDirectTargetNonInanimate', () =>
  {
    it('returns null when neither target nor last-hit exist', () =>
    {
      const jabsBattler = buildBattler();

      expect(jabsBattler.resolveDirectTargetNonInanimate(0)).toBeNull();
    });

    it('skips an inanimate known target', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.setTarget({ isInanimate: () => true });

      expect(jabsBattler.resolveDirectTargetNonInanimate(0)).toBeNull();
    });

    it('skips a known target outside the proximity limit', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.setTarget({ isInanimate: () => false });
      jabsBattler.distanceToDesignatedTarget = () => 10;

      expect(jabsBattler.resolveDirectTargetNonInanimate(5)).toBeNull();
    });

    it('prefers getTarget() over getBattlerLastHit()', () =>
    {
      const jabsBattler = buildBattler();
      const target = { isInanimate: () => false };
      jabsBattler.setTarget(target);
      jabsBattler.setBattlerLastHit({ isInanimate: () => false, isDead: () => false });
      jabsBattler.distanceToDesignatedTarget = () => 0;

      expect(jabsBattler.resolveDirectTargetNonInanimate(0)).toBe(target);
    });

    it('falls back to getBattlerLastHit() when there is no current target', () =>
    {
      const jabsBattler = buildBattler();
      const lastHit = { isInanimate: () => false, isDead: () => false };
      jabsBattler.setBattlerLastHit(lastHit);
      jabsBattler.distanceToDesignatedTarget = () => 0;

      expect(jabsBattler.resolveDirectTargetNonInanimate(0)).toBe(lastHit);
    });
  });

  describe('resolveDirectTargetViaScan', () =>
  {
    it('returns the closest non-inanimate opponent', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.isEnemy = () => false;
      jabsBattler.distanceToDesignatedTarget = vi.fn()
        .mockReturnValueOnce(10)
        .mockReturnValueOnce(3);
      const far = { isInanimate: () => false, isEnemy: () => true };
      const near = { isInanimate: () => false, isEnemy: () => true };

      expect(jabsBattler.resolveDirectTargetViaScan([ far, near ])).toBe(near);
    });

    it('skips inanimate and same-team candidates', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.isEnemy = () => false;
      const inanimate = { isInanimate: () => true, isEnemy: () => true };
      const sameTeam = { isInanimate: () => false, isEnemy: () => false };

      expect(jabsBattler.resolveDirectTargetViaScan([ inanimate, sameTeam ])).toBeNull();
    });
  });

  describe('resolveDirectTargetInanimateScan', () =>
  {
    it('returns the closest inanimate opponent', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.isEnemy = () => false;
      jabsBattler.distanceToDesignatedTarget = vi.fn()
        .mockReturnValueOnce(10)
        .mockReturnValueOnce(3);
      const far = { isInanimate: () => true, isEnemy: () => true };
      const near = { isInanimate: () => true, isEnemy: () => true };

      expect(jabsBattler.resolveDirectTargetInanimateScan([ far, near ])).toBe(near);
    });

    it('skips non-inanimate and same-team candidates', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.isEnemy = () => false;
      const animate = { isInanimate: () => false, isEnemy: () => true };
      const sameTeam = { isInanimate: () => true, isEnemy: () => false };

      expect(jabsBattler.resolveDirectTargetInanimateScan([ animate, sameTeam ])).toBeNull();
    });
  });

  describe('resolveDirectTargetInanimateFallback', () =>
  {
    it('returns null without a known candidate', () =>
    {
      const jabsBattler = buildBattler();

      expect(jabsBattler.resolveDirectTargetInanimateFallback(0)).toBeNull();
    });

    it('returns null when the candidate is outside the proximity limit', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.setTarget({});
      jabsBattler.distanceToDesignatedTarget = () => 10;

      expect(jabsBattler.resolveDirectTargetInanimateFallback(5)).toBeNull();
    });

    it('returns the known candidate regardless of inanimate status when in range', () =>
    {
      const jabsBattler = buildBattler();
      const target = {};
      jabsBattler.setTarget(target);
      jabsBattler.distanceToDesignatedTarget = () => 3;

      expect(jabsBattler.resolveDirectTargetInanimateFallback(5)).toBe(target);
    });

    it('falls back to getBattlerLastHit() when there is no current target', () =>
    {
      const jabsBattler = buildBattler();
      const lastHit = { isDead: () => false };
      jabsBattler.setBattlerLastHit(lastHit);
      jabsBattler.distanceToDesignatedTarget = () => 3;

      expect(jabsBattler.resolveDirectTargetInanimateFallback(5)).toBe(lastHit);
    });
  });
  //endregion updates: targeting resolution

  //region updates: timers/channeling/interrupt/engagement
  describe('per-timer processing hooks', () =>
  {
    it('processWaitTimer updates the wait timer', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.processWaitTimer();

      expect(jabsBattler._waitTimer.updateCalled).toBe(true);
    });

    it('processAlertTimer counts down only while alerted', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.isAlerted = () => false;
      jabsBattler.countdownAlert = vi.fn();
      jabsBattler.processAlertTimer();
      expect(jabsBattler.countdownAlert).not.toHaveBeenCalled();

      jabsBattler.isAlerted = () => true;
      jabsBattler.processAlertTimer();
      expect(jabsBattler.countdownAlert).toHaveBeenCalledTimes(1);
    });

    it('processParryTimer animates and counts down only while parrying', () =>
    {
      const requestAnimation = vi.fn();
      const jabsBattler = buildBattler();
      jabsBattler.getCharacter = () => ({ requestAnimation });
      jabsBattler.parrying = () => false;
      jabsBattler.countdownParryWindow = vi.fn();
      jabsBattler.processParryTimer();
      expect(requestAnimation).not.toHaveBeenCalled();

      jabsBattler.parrying = () => true;
      jabsBattler.processParryTimer();
      expect(requestAnimation).toHaveBeenCalledWith(131);
      expect(jabsBattler.countdownParryWindow).toHaveBeenCalledTimes(1);
    });

    it('processLastHitTimer counts down only when there is a last-hit battler', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.hasBattlerLastHit = () => false;
      jabsBattler.countdownLastHit = vi.fn();
      jabsBattler.processLastHitTimer();
      expect(jabsBattler.countdownLastHit).not.toHaveBeenCalled();

      jabsBattler.hasBattlerLastHit = () => true;
      jabsBattler.processLastHitTimer();
      expect(jabsBattler.countdownLastHit).toHaveBeenCalledTimes(1);
    });

    it('processCombatTimer counts down only while in combat', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.isInCombat = () => false;
      jabsBattler.countdownCombat = vi.fn();
      jabsBattler.processCombatTimer();
      expect(jabsBattler.countdownCombat).not.toHaveBeenCalled();

      jabsBattler.isInCombat = () => true;
      jabsBattler.processCombatTimer();
      expect(jabsBattler.countdownCombat).toHaveBeenCalledTimes(1);
    });

    it('processEngagementTimer updates the engagement timer', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.processEngagementTimer();

      expect(jabsBattler._engagementTimer.updateCalled).toBe(true);
    });
  });

  describe('processCastingTimer / onCastComplete', () =>
  {
    it('does nothing while not casting', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.isCasting = () => false;
      jabsBattler.countdownCastTime = vi.fn();

      jabsBattler.processCastingTimer();

      expect(jabsBattler.countdownCastTime).not.toHaveBeenCalled();
    });

    it('counts down but does not complete while still casting afterward', () =>
    {
      const jabsBattler = buildBattler();
      let stillCasting = true;
      jabsBattler.isCasting = () => stillCasting;
      jabsBattler.countdownCastTime = vi.fn();
      jabsBattler.onCastComplete = vi.fn();

      jabsBattler.processCastingTimer();

      expect(jabsBattler.countdownCastTime).toHaveBeenCalledTimes(1);
      expect(jabsBattler.onCastComplete).not.toHaveBeenCalled();
    });

    it('fires onCastComplete once the countdown finishes casting', () =>
    {
      const jabsBattler = buildBattler();
      let callCount = 0;
      jabsBattler.isCasting = () => { callCount++; return callCount === 1; };
      jabsBattler.countdownCastTime = vi.fn();
      jabsBattler.onCastComplete = vi.fn();

      jabsBattler.processCastingTimer();

      expect(jabsBattler.onCastComplete).toHaveBeenCalledTimes(1);
    });

    it('onCastComplete does nothing without a decided action', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.getDecidedAction = () => null;

      expect(() => jabsBattler.onCastComplete()).not.toThrow();
    });

    it('onCastComplete flags the primary decided action\'s cast as complete', () =>
    {
      const jabsBattler = buildBattler();
      const completeCast = vi.fn();
      jabsBattler.setDecidedAction([ { completeCast } ]);

      jabsBattler.onCastComplete();

      expect(completeCast).toHaveBeenCalledTimes(1);
    });
  });

  describe('channeling', () =>
  {
    function buildSkillWithChannel(overrides = {})
    {
      return Object.assign({
        jabsChannel: [ 5, 180 ],
        jabsChannelTickSpeed: 30,
        stypeId: 1,
      }, overrides);
    }

    beforeEach(() =>
    {
      globalThis.$jabsEngine = {
        paySkillCosts: vi.fn(),
        logSkillExecution: vi.fn(),
        forceMapAction: vi.fn(),
        applyCooldownCounters: vi.fn(),
      };
    });

    describe('beginChannel', () =>
    {
      it('pays costs once, logs execution, and arms the channel state', () =>
      {
        const jabsBattler = buildBattler();
        jabsBattler.getUuid = () => 'uuid';
        const skill = buildSkillWithChannel();
        const action = { getBaseSkill: () => skill, id: 'skill-7' };

        jabsBattler.beginChannel(action);

        expect(globalThis.$jabsEngine.paySkillCosts).toHaveBeenCalledWith(jabsBattler, action);
        expect(globalThis.$jabsEngine.logSkillExecution).toHaveBeenCalledWith('uuid', undefined, 1);
        expect(jabsBattler._channelSourceAction).toBe(action);
        expect(jabsBattler._channelSkillId).toBe(5);
        expect(jabsBattler._channelDurationRemaining).toBe(180);
        expect(jabsBattler._channelTickCountdown).toBe(30);
        expect(jabsBattler.isChanneling()).toBe(true);
      });
    });

    describe('processChannelingTimer', () =>
    {
      it('does nothing when not channeling', () =>
      {
        const jabsBattler = buildBattler();
        jabsBattler.isChanneling = () => false;
        jabsBattler.executeChannelTick = vi.fn();

        jabsBattler.processChannelingTimer();

        expect(jabsBattler.executeChannelTick).not.toHaveBeenCalled();
      });

      it('does not tick or complete while both counters have frames remaining', () =>
      {
        const jabsBattler = buildBattler();
        jabsBattler.isChanneling = () => true;
        jabsBattler._channelTickCountdown = 5;
        jabsBattler._channelDurationRemaining = 100;
        jabsBattler.executeChannelTick = vi.fn();
        jabsBattler.onChannelComplete = vi.fn();

        jabsBattler.processChannelingTimer();

        expect(jabsBattler.executeChannelTick).not.toHaveBeenCalled();
        expect(jabsBattler.onChannelComplete).not.toHaveBeenCalled();
        expect(jabsBattler._channelTickCountdown).toBe(4);
        expect(jabsBattler._channelDurationRemaining).toBe(99);
      });

      it('executes a tick and resets the tick countdown when it reaches zero', () =>
      {
        const jabsBattler = buildBattler();
        jabsBattler.isChanneling = () => true;
        jabsBattler._channelTickCountdown = 1;
        jabsBattler._channelDurationRemaining = 100;
        jabsBattler._channelSourceAction = { getBaseSkill: () => ({ jabsChannelTickSpeed: 30 }) };
        jabsBattler.executeChannelTick = vi.fn();
        jabsBattler.onChannelComplete = vi.fn();

        jabsBattler.processChannelingTimer();

        expect(jabsBattler.executeChannelTick).toHaveBeenCalledTimes(1);
        expect(jabsBattler._channelTickCountdown).toBe(30);
      });

      it('completes the channel once the duration expires', () =>
      {
        const jabsBattler = buildBattler();
        jabsBattler.isChanneling = () => true;
        jabsBattler._channelTickCountdown = 5;
        jabsBattler._channelDurationRemaining = 1;
        jabsBattler.executeChannelTick = vi.fn();
        jabsBattler.onChannelComplete = vi.fn();

        jabsBattler.processChannelingTimer();

        expect(jabsBattler.onChannelComplete).toHaveBeenCalledTimes(1);
      });
    });

    describe('executeChannelTick', () =>
    {
      it('resolves target coordinates and forces the channel skill', () =>
      {
        const jabsBattler = buildBattler();
        jabsBattler._channelSourceAction = 'source-action';
        jabsBattler._channelSkillId = 5;
        jabsBattler.resolveActionTargetCoordinates = vi.fn(() => [ 3, 4 ]);

        jabsBattler.executeChannelTick();

        expect(jabsBattler.resolveActionTargetCoordinates).toHaveBeenCalledWith('source-action');
        expect(globalThis.$jabsEngine.forceMapAction).toHaveBeenCalledWith(jabsBattler, 5, false, 3, 4);
      });
    });

    describe('onChannelComplete', () =>
    {
      it('ends the channel, fires each payoff skill, applies cooldown, and clears the decided action', () =>
      {
        const jabsBattler = buildBattler();
        const sourceAction = {
          getBaseSkill: () => ({ jabsOnChannelComplete: [ 10, 11 ] }),
        };
        jabsBattler._channelSourceAction = sourceAction;
        jabsBattler.endChannel = vi.fn();
        jabsBattler.resolveActionTargetCoordinates = vi.fn(() => [ 1, 2 ]);
        jabsBattler.setDecidedAction([ 'action' ]);

        jabsBattler.onChannelComplete();

        expect(jabsBattler.endChannel).toHaveBeenCalledTimes(1);
        expect(globalThis.$jabsEngine.forceMapAction).toHaveBeenCalledWith(jabsBattler, 10, false, 1, 2);
        expect(globalThis.$jabsEngine.forceMapAction).toHaveBeenCalledWith(jabsBattler, 11, false, 1, 2);
        expect(globalThis.$jabsEngine.applyCooldownCounters).toHaveBeenCalledWith(jabsBattler, sourceAction);
        expect(jabsBattler.isActionDecided()).toBe(false);
      });
    });

    describe('endChannel', () =>
    {
      it('tears down all channel state', () =>
      {
        const jabsBattler = buildBattler();
        jabsBattler._channeling = true;
        jabsBattler._channelSkillId = 5;
        jabsBattler._channelTickCountdown = 10;
        jabsBattler._channelDurationRemaining = 100;

        jabsBattler.endChannel();

        expect(jabsBattler.isChanneling()).toBe(false);
        expect(jabsBattler._channelSkillId).toBe(0);
        expect(jabsBattler._channelTickCountdown).toBe(0);
        expect(jabsBattler._channelDurationRemaining).toBe(0);
      });
    });

    describe('getChannelDurationRemaining', () =>
    {
      it('returns the tracked duration', () =>
      {
        const jabsBattler = buildBattler();
        jabsBattler._channelDurationRemaining = 42;

        expect(jabsBattler.getChannelDurationRemaining()).toBe(42);
      });
    });

    describe('isCastingOrChanneling', () =>
    {
      it('is true while casting', () =>
      {
        const jabsBattler = buildBattler();
        jabsBattler.isCasting = () => true;
        jabsBattler.isChanneling = () => false;

        expect(jabsBattler.isCastingOrChanneling()).toBe(true);
      });

      it('is true while channeling', () =>
      {
        const jabsBattler = buildBattler();
        jabsBattler.isCasting = () => false;
        jabsBattler.isChanneling = () => true;

        expect(jabsBattler.isCastingOrChanneling()).toBe(true);
      });

      it('is false when neither', () =>
      {
        const jabsBattler = buildBattler();
        jabsBattler.isCasting = () => false;
        jabsBattler.isChanneling = () => false;

        expect(jabsBattler.isCastingOrChanneling()).toBe(false);
      });
    });

    describe('hasUninterruptibleMovementLock', () =>
    {
      it('is false when not casting or channeling', () =>
      {
        const jabsBattler = buildBattler();
        jabsBattler.isCastingOrChanneling = () => false;

        expect(jabsBattler.hasUninterruptibleMovementLock()).toBe(false);
      });

      it('is false without a decided action', () =>
      {
        const jabsBattler = buildBattler();
        jabsBattler.isCastingOrChanneling = () => true;
        jabsBattler.getDecidedAction = () => null;

        expect(jabsBattler.hasUninterruptibleMovementLock()).toBe(false);
      });

      it('reflects the in-flight skill\'s own root tag', () =>
      {
        const jabsBattler = buildBattler();
        jabsBattler.isCastingOrChanneling = () => true;
        jabsBattler.setDecidedAction([ { getBaseSkill: () => ({ jabsCannotMoveToInterrupt: true }) } ]);

        expect(jabsBattler.hasUninterruptibleMovementLock()).toBe(true);
      });
    });
  });

  describe('interrupt', () =>
  {
    beforeEach(() =>
    {
      globalThis.$jabsEngine = { applyCooldownValueForSkill: vi.fn() };
    });

    it('does nothing when neither casting nor channeling', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.isChanneling = () => false;
      jabsBattler.isCasting = () => false;
      jabsBattler.clearDecidedAction = vi.fn();

      jabsBattler.interrupt();

      expect(globalThis.$jabsEngine.applyCooldownValueForSkill).not.toHaveBeenCalled();
      expect(jabsBattler.clearDecidedAction).not.toHaveBeenCalled();
    });

    it('tears down an in-flight channel and applies the full penalty for a self-interrupt', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.isChanneling = () => true;
      const sourceAction = { getCooldown: () => 100 };
      jabsBattler._channelSourceAction = sourceAction;
      jabsBattler.endChannel = vi.fn();

      jabsBattler.interrupt(50, true);

      expect(jabsBattler.endChannel).toHaveBeenCalledTimes(1);
      expect(globalThis.$jabsEngine.applyCooldownValueForSkill).toHaveBeenCalledWith(jabsBattler, sourceAction, 100);
    });

    it('tears down an in-flight cast and scales the penalty by the magnifier for an external interrupt', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.isChanneling = () => false;
      jabsBattler.isCasting = () => true;
      const primaryAction = { getCooldown: () => 100 };
      jabsBattler.setDecidedAction([ primaryAction ]);

      jabsBattler.interrupt(50, false);

      expect(jabsBattler._casting).toBe(false);
      expect(globalThis.$jabsEngine.applyCooldownValueForSkill).toHaveBeenCalledWith(jabsBattler, primaryAction, 50);
    });

    it('clears the decided action after interrupting', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.isChanneling = () => false;
      jabsBattler.isCasting = () => true;
      jabsBattler.setDecidedAction([ { getCooldown: () => 0 } ]);

      jabsBattler.interrupt();

      expect(jabsBattler.isActionDecided()).toBe(false);
    });
  });

  describe('engagement update pipeline', () =>
  {
    describe('canUpdateEngagement', () =>
    {
      function buildEngageableCandidate(overrides = {})
      {
        const jabsBattler = buildBattler();
        jabsBattler.isPlayer = () => false;
        jabsBattler.isInanimate = () => false;
        jabsBattler.isEngaged = () => false;
        jabsBattler.isEngagementLocked = () => false;
        jabsBattler._engagementTimer._complete = true;
        Object.assign(jabsBattler, overrides);
        return jabsBattler;
      }

      it('is false while jabs is paused', () =>
      {
        globalThis.$jabsEngine = { absPause: true };
        expect(buildEngageableCandidate().canUpdateEngagement()).toBe(false);
      });

      it('is false for the player', () =>
      {
        globalThis.$jabsEngine = { absPause: false };
        expect(buildEngageableCandidate({ isPlayer: () => true }).canUpdateEngagement()).toBe(false);
      });

      it('is false for an inanimate battler', () =>
      {
        globalThis.$jabsEngine = { absPause: false };
        expect(buildEngageableCandidate({ isInanimate: () => true }).canUpdateEngagement()).toBe(false);
      });

      it('is false while the engagement timer is not yet complete', () =>
      {
        globalThis.$jabsEngine = { absPause: false };
        const jabsBattler = buildEngageableCandidate();
        jabsBattler._engagementTimer._complete = false;

        expect(jabsBattler.canUpdateEngagement()).toBe(false);
      });

      it('is false while already engaged', () =>
      {
        globalThis.$jabsEngine = { absPause: false };
        expect(buildEngageableCandidate({ isEngaged: () => true }).canUpdateEngagement()).toBe(false);
      });

      it('is false while engagement is locked', () =>
      {
        globalThis.$jabsEngine = { absPause: false };
        expect(buildEngageableCandidate({ isEngagementLocked: () => true }).canUpdateEngagement()).toBe(false);
      });

      it('is true otherwise', () =>
      {
        globalThis.$jabsEngine = { absPause: false };
        expect(buildEngageableCandidate().canUpdateEngagement()).toBe(true);
      });
    });

    describe('canEngageTarget', () =>
    {
      it('is false without a target', () =>
      {
        const jabsBattler = buildBattler();
        expect(jabsBattler.canEngageTarget(null)).toBe(false);
      });

      it('is false when the target is itself', () =>
      {
        const jabsBattler = buildBattler();
        jabsBattler.getUuid = () => 'uuid';

        expect(jabsBattler.canEngageTarget({ getUuid: () => 'uuid' })).toBe(false);
      });

      it('is true for a distinct target', () =>
      {
        const jabsBattler = buildBattler();
        jabsBattler.getUuid = () => 'uuid';

        expect(jabsBattler.canEngageTarget({ getUuid: () => 'other-uuid' })).toBe(true);
      });
    });

    describe('updateEngagement', () =>
    {
      it('does nothing when engagement cannot currently be updated', async () =>
      {
        const { default: JABS_AiManager } = await import('../../../../../src/plugins/abs/core/managers/JABS_AiManager.js');
        JABS_AiManager.getClosestOpposingBattler = vi.fn();
        const jabsBattler = buildBattler();
        jabsBattler.canUpdateEngagement = () => false;

        jabsBattler.updateEngagement();

        expect(JABS_AiManager.getClosestOpposingBattler).not.toHaveBeenCalled();
      });

      it('does nothing when the closest target cannot be engaged', async () =>
      {
        const { default: JABS_AiManager } = await import('../../../../../src/plugins/abs/core/managers/JABS_AiManager.js');
        JABS_AiManager.getClosestOpposingBattler = vi.fn(() => 'target');
        const jabsBattler = buildBattler();
        jabsBattler.canUpdateEngagement = () => true;
        jabsBattler.canEngageTarget = () => false;
        jabsBattler.handleEngagement = vi.fn();

        jabsBattler.updateEngagement();

        expect(jabsBattler.handleEngagement).not.toHaveBeenCalled();
      });

      it('handles engagement and resets the engagement timer when a target can be engaged', async () =>
      {
        const { default: JABS_AiManager } = await import('../../../../../src/plugins/abs/core/managers/JABS_AiManager.js');
        const target = {};
        JABS_AiManager.getClosestOpposingBattler = vi.fn(() => target);
        const jabsBattler = buildBattler();
        jabsBattler.canUpdateEngagement = () => true;
        jabsBattler.canEngageTarget = () => true;
        jabsBattler.distanceToDesignatedTarget = () => 5;
        jabsBattler.handleEngagement = vi.fn();

        jabsBattler.updateEngagement();

        expect(jabsBattler.handleEngagement).toHaveBeenCalledWith(target, 5);
        expect(jabsBattler._engagementTimer.resetCalled).toBe(true);
      });
    });

    describe('handleEngagement', () =>
    {
      it('disengages when already engaged and shouldDisengage is true', () =>
      {
        const jabsBattler = buildBattler();
        jabsBattler.isEngaged = () => true;
        jabsBattler.shouldDisengage = () => true;
        jabsBattler.disengageTarget = vi.fn();
        jabsBattler.engageTarget = vi.fn();

        jabsBattler.handleEngagement('target', 5);

        expect(jabsBattler.disengageTarget).toHaveBeenCalledTimes(1);
        expect(jabsBattler.engageTarget).not.toHaveBeenCalled();
      });

      it('stays engaged when already engaged and shouldDisengage is false', () =>
      {
        const jabsBattler = buildBattler();
        jabsBattler.isEngaged = () => true;
        jabsBattler.shouldDisengage = () => false;
        jabsBattler.disengageTarget = vi.fn();

        jabsBattler.handleEngagement('target', 5);

        expect(jabsBattler.disengageTarget).not.toHaveBeenCalled();
      });

      it('engages when not engaged and shouldEngage is true', () =>
      {
        const jabsBattler = buildBattler();
        jabsBattler.isEngaged = () => false;
        jabsBattler.shouldEngage = () => true;
        jabsBattler.engageTarget = vi.fn();

        jabsBattler.handleEngagement('target', 5);

        expect(jabsBattler.engageTarget).toHaveBeenCalledWith('target');
      });

      it('stays disengaged when not engaged and shouldEngage is false', () =>
      {
        const jabsBattler = buildBattler();
        jabsBattler.isEngaged = () => false;
        jabsBattler.shouldEngage = () => false;
        jabsBattler.engageTarget = vi.fn();

        jabsBattler.handleEngagement('target', 5);

        expect(jabsBattler.engageTarget).not.toHaveBeenCalled();
      });
    });

    describe('shouldDisengage', () =>
    {
      it('reflects the inverse of inPursuitRange', () =>
      {
        const jabsBattler = buildBattler();
        jabsBattler.inPursuitRange = () => true;
        expect(jabsBattler.shouldDisengage('target', 5)).toBe(false);

        jabsBattler.inPursuitRange = () => false;
        expect(jabsBattler.shouldDisengage('target', 5)).toBe(true);
      });
    });

    describe('shouldEngage', () =>
    {
      it('is false when out of sight range', () =>
      {
        const jabsBattler = buildBattler();
        jabsBattler.inSightRange = () => false;

        expect(jabsBattler.shouldEngage('target', 5)).toBe(false);
      });

      it('is true in sight range for a non-sentinel battler', () =>
      {
        const jabsBattler = buildBattler();
        jabsBattler.inSightRange = () => true;
        jabsBattler.getBattlerRole = () => ({ sentinel: false });

        expect(jabsBattler.shouldEngage('target', 5)).toBe(true);
      });

      it('is false for a sentinel when the target is beyond home-leash range', () =>
      {
        const jabsBattler = buildBattler();
        jabsBattler.inSightRange = () => true;
        jabsBattler.getBattlerRole = () => ({ sentinel: true });
        jabsBattler.getSightRadius = () => 5;
        const target = { distanceToPoint: () => 10 };

        expect(jabsBattler.shouldEngage(target, 5)).toBe(false);
      });

      it('is true for a sentinel when the target is within home-leash range', () =>
      {
        const jabsBattler = buildBattler();
        jabsBattler.inSightRange = () => true;
        jabsBattler.getBattlerRole = () => ({ sentinel: true });
        jabsBattler.getSightRadius = () => 5;
        const target = { distanceToPoint: () => 3 };

        expect(jabsBattler.shouldEngage(target, 5)).toBe(true);
      });
    });
  });
  //endregion updates: timers/channeling/interrupt/engagement

  //region updates: dodge movement / death handling
  describe('updateDodging', () =>
  {
    it('does nothing when dodge cannot currently be updated', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.canUpdateDodge = () => false;
      jabsBattler.handleDodgeCancel = vi.fn();
      jabsBattler.handleDodgeMovement = vi.fn();
      jabsBattler.handleDodgeEnd = vi.fn();

      jabsBattler.updateDodging();

      expect(jabsBattler.handleDodgeCancel).not.toHaveBeenCalled();
    });

    it('processes cancel, movement, and end when dodging can be updated', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.canUpdateDodge = () => true;
      jabsBattler.handleDodgeCancel = vi.fn();
      jabsBattler.handleDodgeMovement = vi.fn();
      jabsBattler.handleDodgeEnd = vi.fn();

      jabsBattler.updateDodging();

      expect(jabsBattler.handleDodgeCancel).toHaveBeenCalledTimes(1);
      expect(jabsBattler.handleDodgeMovement).toHaveBeenCalledTimes(1);
      expect(jabsBattler.handleDodgeEnd).toHaveBeenCalledTimes(1);
    });
  });

  describe('canUpdateDodge', () =>
  {
    it('reflects whether the battler is dodging', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.isDodging = () => false;
      expect(jabsBattler.canUpdateDodge()).toBe(false);

      jabsBattler.isDodging = () => true;
      expect(jabsBattler.canUpdateDodge()).toBe(true);
    });
  });

  describe('handleDodgeCancel / shouldCancelDodge', () =>
  {
    it('does not end the dodge when it should not be canceled', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.shouldCancelDodge = () => false;
      jabsBattler.endDodge = vi.fn();

      jabsBattler.handleDodgeCancel();

      expect(jabsBattler.endDodge).not.toHaveBeenCalled();
    });

    it('ends the dodge when it should be canceled', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.shouldCancelDodge = () => true;
      jabsBattler.endDodge = vi.fn();

      jabsBattler.handleDodgeCancel();

      expect(jabsBattler.endDodge).toHaveBeenCalledTimes(1);
    });

    it('shouldCancelDodge is true when the battler cannot move', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.canBattlerMove = () => false;

      expect(jabsBattler.shouldCancelDodge()).toBe(true);
    });

    it('shouldCancelDodge is false when the battler can move', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.canBattlerMove = () => true;

      expect(jabsBattler.shouldCancelDodge()).toBe(false);
    });
  });

  describe('updateDodgeIFrames', () =>
  {
    it('does nothing while not dodging', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.isDodging = () => false;
      jabsBattler.incrementDodgeFrame = vi.fn();

      jabsBattler.updateDodgeIFrames();

      expect(jabsBattler.incrementDodgeFrame).not.toHaveBeenCalled();
    });

    it('does not touch invincibility without an iframe window', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.isDodging = () => true;
      jabsBattler.incrementDodgeFrame = vi.fn();
      jabsBattler.getDodgeIFrames = () => null;
      jabsBattler.setInvincible = vi.fn();

      jabsBattler.updateDodgeIFrames();

      expect(jabsBattler.setInvincible).not.toHaveBeenCalled();
    });

    it('sets invincible true while the current frame is within the iframe window', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.isDodging = () => true;
      jabsBattler.incrementDodgeFrame = vi.fn();
      jabsBattler.getDodgeIFrames = () => [ 2, 5 ];
      jabsBattler.getDodgeFrame = () => 3;
      jabsBattler.setInvincible = vi.fn();

      jabsBattler.updateDodgeIFrames();

      expect(jabsBattler.setInvincible).toHaveBeenCalledWith(true);
    });

    it('sets invincible false outside the iframe window', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.isDodging = () => true;
      jabsBattler.incrementDodgeFrame = vi.fn();
      jabsBattler.getDodgeIFrames = () => [ 2, 5 ];
      jabsBattler.getDodgeFrame = () => 10;
      jabsBattler.setInvincible = vi.fn();

      jabsBattler.updateDodgeIFrames();

      expect(jabsBattler.setInvincible).toHaveBeenCalledWith(false);
    });
  });

  describe('canDodgeMove', () =>
  {
    function buildDodgeableBattler(overrides = {})
    {
      const jabsBattler = buildBattler();
      jabsBattler.getCharacter = () => ({ isMoving: () => false });
      jabsBattler.canBattlerMove = () => true;
      jabsBattler.getDodgeSteps = () => 3;
      jabsBattler.isDodging = () => true;
      Object.assign(jabsBattler, overrides);
      return jabsBattler;
    }

    it('is false while the character is already moving', () =>
    {
      const jabsBattler = buildDodgeableBattler({ getCharacter: () => ({ isMoving: () => true }) });
      expect(jabsBattler.canDodgeMove()).toBe(false);
    });

    it('is false when the battler cannot move', () =>
    {
      expect(buildDodgeableBattler({ canBattlerMove: () => false }).canDodgeMove()).toBe(false);
    });

    it('is false when out of dodge steps', () =>
    {
      expect(buildDodgeableBattler({ getDodgeSteps: () => 0 }).canDodgeMove()).toBe(false);
    });

    it('is false when not dodging', () =>
    {
      expect(buildDodgeableBattler({ isDodging: () => false }).canDodgeMove()).toBe(false);
    });

    it('is true otherwise', () =>
    {
      expect(buildDodgeableBattler().canDodgeMove()).toBe(true);
    });
  });

  describe('executeDodgeMovement', () =>
  {
    it('moves diagonally for a diagonal dodge direction', () =>
    {
      const moveDiagonally = vi.fn();
      const jabsBattler = buildBattler();
      jabsBattler.getCharacter = () => ({ isDiagonalDirection: () => true, moveDiagonally });
      jabsBattler.getDodgeDirection = () => 9;
      jabsBattler.decrementDodgeSteps = vi.fn();

      jabsBattler.executeDodgeMovement();

      expect(moveDiagonally).toHaveBeenCalledWith(9);
      expect(jabsBattler.decrementDodgeSteps).toHaveBeenCalledTimes(1);
    });

    it('moves straight for a cardinal dodge direction', () =>
    {
      const moveStraight = vi.fn();
      const jabsBattler = buildBattler();
      jabsBattler.getCharacter = () => ({
        isDiagonalDirection: () => false, isStraightDirection: () => true, moveStraight,
      });
      jabsBattler.getDodgeDirection = () => 8;
      jabsBattler.decrementDodgeSteps = vi.fn();

      jabsBattler.executeDodgeMovement();

      expect(moveStraight).toHaveBeenCalledWith(8);
    });

    it('decrements dodge steps regardless of movement direction validity', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.getCharacter = () => ({ isDiagonalDirection: () => false, isStraightDirection: () => false });
      jabsBattler.getDodgeDirection = () => 0;
      jabsBattler.decrementDodgeSteps = vi.fn();

      jabsBattler.executeDodgeMovement();

      expect(jabsBattler.decrementDodgeSteps).toHaveBeenCalledTimes(1);
    });
  });

  describe('handleDodgeEnd / shouldEndDodge', () =>
  {
    it('always re-evaluates iframes before checking whether to end', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.updateDodgeIFrames = vi.fn();
      jabsBattler.shouldEndDodge = () => false;
      jabsBattler.endDodge = vi.fn();

      jabsBattler.handleDodgeEnd();

      expect(jabsBattler.updateDodgeIFrames).toHaveBeenCalledTimes(1);
      expect(jabsBattler.endDodge).not.toHaveBeenCalled();
    });

    it('ends the dodge when shouldEndDodge is true', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.updateDodgeIFrames = vi.fn();
      jabsBattler.shouldEndDodge = () => true;
      jabsBattler.endDodge = vi.fn();

      jabsBattler.handleDodgeEnd();

      expect(jabsBattler.endDodge).toHaveBeenCalledTimes(1);
    });

    it('shouldEndDodge is true when out of steps and no longer moving', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.getDodgeSteps = () => 0;
      jabsBattler.getCharacter = () => ({ isMoving: () => false });

      expect(jabsBattler.shouldEndDodge()).toBe(true);
    });

    it('shouldEndDodge is false while still moving', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.getDodgeSteps = () => 0;
      jabsBattler.getCharacter = () => ({ isMoving: () => true });

      expect(jabsBattler.shouldEndDodge()).toBe(false);
    });

    it('shouldEndDodge is false while steps remain', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.getDodgeSteps = () => 3;
      jabsBattler.getCharacter = () => ({ isMoving: () => false });

      expect(jabsBattler.shouldEndDodge()).toBe(false);
    });
  });

  describe('endDodge', () =>
  {
    it('resets all dodge-related state', () =>
    {
      const setDodgeModifier = vi.fn();
      const jabsBattler = buildBattler();
      jabsBattler.getCharacter = () => ({ setDodgeModifier });
      jabsBattler.setDodging = vi.fn();
      jabsBattler.setDodgeSteps = vi.fn();
      jabsBattler.setInvincible = vi.fn();
      jabsBattler.setDodgeFrame = vi.fn();
      jabsBattler.setDodgeIFrames = vi.fn();

      jabsBattler.endDodge();

      expect(jabsBattler.setDodging).toHaveBeenCalledWith(false);
      expect(jabsBattler.setDodgeSteps).toHaveBeenCalledWith(0);
      expect(jabsBattler.setInvincible).toHaveBeenCalledWith(false);
      expect(setDodgeModifier).toHaveBeenCalledWith(0);
      expect(jabsBattler.setDodgeFrame).toHaveBeenCalledWith(0);
      expect(jabsBattler.setDodgeIFrames).toHaveBeenCalledWith(0);
    });
  });

  describe('updateDeathHandling', () =>
  {
    function buildDeathCandidate(overrides = {})
    {
      const jabsBattler = buildBattler();
      jabsBattler.isActor = () => false;
      jabsBattler.isWaiting = () => false;
      jabsBattler.getCharacter = () => ({ isErased: () => false });
      jabsBattler.isDying = () => false;
      jabsBattler.destroy = vi.fn();
      Object.assign(jabsBattler, overrides);
      return jabsBattler;
    }

    it('does nothing for actors/the player', () =>
    {
      globalThis.$gameMap = { isEventRunning: () => false };
      const jabsBattler = buildDeathCandidate({ isActor: () => true, isDying: () => true });

      jabsBattler.updateDeathHandling();

      expect(jabsBattler.destroy).not.toHaveBeenCalled();
    });

    it('does nothing while waiting', () =>
    {
      globalThis.$gameMap = { isEventRunning: () => false };
      const jabsBattler = buildDeathCandidate({ isWaiting: () => true, isDying: () => true });

      jabsBattler.updateDeathHandling();

      expect(jabsBattler.destroy).not.toHaveBeenCalled();
    });

    it('does nothing when the event is already erased', () =>
    {
      globalThis.$gameMap = { isEventRunning: () => false };
      const jabsBattler = buildDeathCandidate({
        getCharacter: () => ({ isErased: () => true }), isDying: () => true,
      });

      jabsBattler.updateDeathHandling();

      expect(jabsBattler.destroy).not.toHaveBeenCalled();
    });

    it('does nothing when not dying', () =>
    {
      globalThis.$gameMap = { isEventRunning: () => false };
      const jabsBattler = buildDeathCandidate({ isDying: () => false });

      jabsBattler.updateDeathHandling();

      expect(jabsBattler.destroy).not.toHaveBeenCalled();
    });

    it('does not self-destruct while an event is running', () =>
    {
      globalThis.$gameMap = { isEventRunning: () => true };
      const jabsBattler = buildDeathCandidate({ isDying: () => true });

      jabsBattler.updateDeathHandling();

      expect(jabsBattler.destroy).not.toHaveBeenCalled();
    });

    it('self-destructs when dying, no event running, and not waiting/erased/actor', () =>
    {
      globalThis.$gameMap = { isEventRunning: () => false };
      const jabsBattler = buildDeathCandidate({ isDying: () => true });

      jabsBattler.updateDeathHandling();

      expect(jabsBattler.destroy).toHaveBeenCalledTimes(1);
    });
  });
  //endregion updates: dodge movement / death handling
});
//endregion plugins/abs/core/models/jabs-battler.test.js
