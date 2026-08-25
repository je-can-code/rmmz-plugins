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

    // bare RMMZ-style global (not imported by JABS_Battler.js- loaded elsewhere at runtime).
    globalThis.JABS_Button = {
      Offhand: 'offhand', Mainhand: 'mainhand', Dodge: 'dodge', Tool: 'tool', UsableItem: 'usableItem',
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
            setCooldownKey: vi.fn((v) => { built.cooldownKey = v; return builder; }),
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
          this.aggro = 0;
        }

        uuid()
        {
          return this._uuid;
        }

        setAggro(value)
        {
          this.aggro = value;
        }

        modAggro(value)
        {
          this.aggro += value;
        }

        resetAggro()
        {
          this.aggro = 0;
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

        getMaxTime()
        {
          return this.maxTime;
        }

        setMaxTime(maxTime)
        {
          this.maxTime = maxTime;
        }

        forceComplete()
        {
          this._complete = true;
        }
      },
    }));

    ({ default: JABS_Battler } = await import('../../../../../src/plugins/abs/core/models/JABS_Battler.js'));
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

    it('getLeaderBattler returns null when there is no leader uuid', async () =>
    {
      // Arrange
      const { default: JABS_AiManager } = await import('../../../../../src/plugins/abs/core/managers/JABS_AiManager.js');
      // the manager answers every lookup, so only the guard can produce the null.
      JABS_AiManager.getBattlerByUuid = vi.fn(() => ({ id: 'anyone' }));
      const jabsBattler = buildBattler();
      jabsBattler._leaderUuid = String.empty;

      // Act
      const leaderBattler = jabsBattler.getLeaderBattler();

      // Assert
      expect(leaderBattler).toBeNull();
      expect(JABS_AiManager.getBattlerByUuid).not.toHaveBeenCalled();
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

    it('getFollowerByUuid returns null when the uuid is not tracked', async () =>
    {
      // Arrange
      const { default: JABS_AiManager } = await import('../../../../../src/plugins/abs/core/managers/JABS_AiManager.js');
      // the manager answers every lookup, so only the not-found guard can produce the null.
      JABS_AiManager.getBattlerByUuid = vi.fn(() => ({ id: 'anyone' }));
      const jabsBattler = buildBattler();
      jabsBattler.hasFollowers = () => true;
      jabsBattler._followers = [ 'a' ];

      // Act
      const found = jabsBattler.getFollowerByUuid('b');

      // Assert
      expect(found).toBeNull();
      expect(JABS_AiManager.getBattlerByUuid).not.toHaveBeenCalled();
    });

    it('getFollowerByUuid resolves the matching follower battler', async () =>
    {
      // Arrange
      const { default: JABS_AiManager } = await import('../../../../../src/plugins/abs/core/managers/JABS_AiManager.js');
      JABS_AiManager.getBattlerByUuid = vi.fn(uuid => ({ id: uuid }));
      const jabsBattler = buildBattler();
      jabsBattler.hasFollowers = () => true;
      // the first entry is a near-miss that must survive the search.
      jabsBattler._followers = [ 'decoy', 'a' ];

      // Act
      const found = jabsBattler.getFollowerByUuid('a');

      // Assert
      expect(found).toEqual({ id: 'a' });
      expect(JABS_AiManager.getBattlerByUuid).toHaveBeenCalledWith('a');
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

    it('clearLeader does nothing when this battler has no uuid of its own', async () =>
    {
      // Arrange
      const { default: JABS_AiManager } = await import('../../../../../src/plugins/abs/core/managers/JABS_AiManager.js');
      const removeFollowerByUuid = vi.fn();
      // the leader is fully resolvable, so only the missing-uuid guard can stop the removal.
      JABS_AiManager.getBattlerByUuid = vi.fn(() => ({ removeFollowerByUuid }));
      const jabsBattler = buildBattler();
      jabsBattler.getLeader = () => 'leader-uuid';
      jabsBattler.getUuid = () => String.empty;

      // Act
      jabsBattler.clearLeader();

      // Assert
      expect(removeFollowerByUuid).not.toHaveBeenCalled();
      expect(JABS_AiManager.getBattlerByUuid).not.toHaveBeenCalled();
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

    it('is false when facing up and the target is not facing down', () =>
    {
      // Arrange
      const jabsBattler = buildBattler();
      jabsBattler.getCharacter = () => ({ direction: () => J.ABS.Directions.UP });

      // Act
      const isFacing = jabsBattler.isFacingTarget({ direction: () => J.ABS.Directions.LEFT });

      // Assert
      expect(isFacing).toBe(false);
    });

    it('is false when facing left and the target is not facing right', () =>
    {
      // Arrange
      const jabsBattler = buildBattler();
      jabsBattler.getCharacter = () => ({ direction: () => J.ABS.Directions.LEFT });

      // Act
      const isFacing = jabsBattler.isFacingTarget({ direction: () => J.ABS.Directions.UP });

      // Assert
      expect(isFacing).toBe(false);
    });

    it('is false when facing right and the target is not facing left', () =>
    {
      // Arrange
      const jabsBattler = buildBattler();
      jabsBattler.getCharacter = () => ({ direction: () => J.ABS.Directions.RIGHT });

      // Act
      const isFacing = jabsBattler.isFacingTarget({ direction: () => J.ABS.Directions.UP });

      // Assert
      expect(isFacing).toBe(false);
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

    it('isActor is false for a non-player whose battler is not an actor', () =>
    {
      // Arrange
      const jabsBattler = buildBattler();
      jabsBattler.isPlayer = () => false;
      jabsBattler.getBattler = () => ({ isActor: () => false });

      // Act
      const isActor = jabsBattler.isActor();

      // Assert
      expect(isActor).toBe(false);
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

    /**
     * The reset case above reaches the defensive-timing fields directly, which leaves their getters
     * unexercised even though the fields themselves are asserted. These round-trip each one through
     * its own accessor pair, so a getter wired to the wrong backing field would be caught.
     */
    it('aiDefensiveDodgeReadyFrame reports the frame its setter stored', () =>
    {
      // Arrange
      const jabsBattler = buildBattler();

      // Act
      jabsBattler.setAiDefensiveDodgeReadyFrame(42);

      // Assert
      expect(jabsBattler.aiDefensiveDodgeReadyFrame()).toBe(42);
    });

    it('aiAllyDefensiveGuardReadyFrame reports the frame its setter stored', () =>
    {
      // Arrange
      const jabsBattler = buildBattler();

      // Act
      jabsBattler.setAiAllyDefensiveGuardReadyFrame(77);

      // Assert
      expect(jabsBattler.aiAllyDefensiveGuardReadyFrame()).toBe(77);
    });

    it('aiAllyGuardRaiseFrame reports the frame its setter stored', () =>
    {
      // Arrange
      const jabsBattler = buildBattler();

      // Act
      jabsBattler.setAiAllyGuardRaiseFrame(13);

      // Assert
      expect(jabsBattler.aiAllyGuardRaiseFrame()).toBe(13);
    });

    it('keeps the three defensive-timing frames independent of one another', () =>
    {
      // Arrange
      const jabsBattler = buildBattler();

      // Act
      jabsBattler.setAiDefensiveDodgeReadyFrame(1);
      jabsBattler.setAiAllyDefensiveGuardReadyFrame(2);
      jabsBattler.setAiAllyGuardRaiseFrame(3);

      // Assert
      // these three sit adjacent in the source with near-identical accessor pairs, which is exactly
      // the shape where a copy-paste slip crosses two of them onto the same backing field.
      expect([
        jabsBattler.aiDefensiveDodgeReadyFrame(),
        jabsBattler.aiAllyDefensiveGuardReadyFrame(),
        jabsBattler.aiAllyGuardRaiseFrame(),
      ]).toEqual([ 1, 2, 3 ]);
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

    it('clearBattlerLastHit leaves a non-player\'s target alone', () =>
    {
      // Arrange
      const jabsBattler = buildBattler();
      jabsBattler.isPlayer = () => false;
      const aiTarget = { id: 'ai-target' };
      jabsBattler.setTarget(aiTarget);
      jabsBattler.setBattlerLastHit({ isDead: () => false });

      // Act
      jabsBattler.clearBattlerLastHit();

      // Assert
      expect(jabsBattler.getTarget()).toBe(aiTarget);
      expect(jabsBattler.hasBattlerLastHit()).toBe(false);
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

    it('countdownLastHit does not clear anything when there was no last-hit battler tracked', () =>
    {
      // Arrange
      const jabsBattler = buildBattler();
      // as the player, clearing would also drop the target- which is what proves the guard held.
      jabsBattler.isPlayer = () => true;
      const playerTarget = { id: 'player-target' };
      jabsBattler.setTarget(playerTarget);
      jabsBattler._lastHitCountdown = 0;

      // Act
      jabsBattler.countdownLastHit();

      // Assert
      expect(jabsBattler.getTarget()).toBe(playerTarget);
      expect(jabsBattler.hasBattlerLastHit()).toBe(false);
    });

    it('countdownLastHit holds the countdown at zero rather than going negative', () =>
    {
      // Arrange
      const jabsBattler = buildBattler();
      jabsBattler._lastHitCountdown = 1;

      // Act
      // the first tick spends the last frame; the second must find nothing left to spend.
      jabsBattler.countdownLastHit();
      jabsBattler.countdownLastHit();

      // Assert
      expect(jabsBattler._lastHitCountdown).toBe(0);
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

    it('setAlertedCounter touches neither idle nor alerted for a NaN counter (neither comparison is true)', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.setIdle = vi.fn();
      jabsBattler.setAlerted(true);

      jabsBattler.setAlertedCounter(NaN);

      expect(jabsBattler.setIdle).not.toHaveBeenCalled();
      expect(jabsBattler.isAlerted()).toBe(true);
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

    it('isHome is false when only the y coordinate differs from home', () =>
    {
      // Arrange
      const jabsBattler = buildBattler();
      jabsBattler._event.x = 3;
      jabsBattler._event.y = 9;
      jabsBattler._homeX = 3;
      jabsBattler._homeY = 4;

      // Act
      const isHome = jabsBattler.isHome();

      // Assert
      expect(isHome).toBe(false);
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

    it('getLeaderAiMode is null without a leader', async () =>
    {
      // Arrange
      const { default: JABS_AiManager } = await import('../../../../../src/plugins/abs/core/managers/JABS_AiManager.js');
      // the manager would happily answer, so only the no-leader guard can produce the null.
      JABS_AiManager.getBattlerByUuid = vi.fn(() => ({ getAiMode: () => 'leader-ai' }));
      const jabsBattler = buildBattler();
      jabsBattler.hasLeader = () => false;

      // Act
      const leaderAiMode = jabsBattler.getLeaderAiMode();

      // Assert
      expect(leaderAiMode).toBeNull();
      expect(JABS_AiManager.getBattlerByUuid).not.toHaveBeenCalled();
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

      it('re-rolls the wiggle direction when the first roll lands on the threat direction', () =>
      {
        // force the first roll to reproduce the threat direction (2), then a different one (4),
        // to deterministically exercise the while-loop's re-roll body.
        const rolls = [ 0, 1 ];
        Math.randomInt = vi.fn(() => rolls.shift());
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

        expect(Math.randomInt).toHaveBeenCalledTimes(2);
        expect(moveStraight).toHaveBeenCalledWith(4);
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

    it('canBattlerUseSkills is true when states are present but none silence casting', () =>
    {
      // Arrange
      const jabsBattler = buildBattler();
      // a state carrying the sibling attack-side flag must not read as a mute.
      jabsBattler.getBattler = () => ({ states: () => [ { jabsDisarmed: true } ] });

      // Act
      const canUseSkills = jabsBattler.canBattlerUseSkills();

      // Assert
      expect(canUseSkills).toBe(true);
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

    it('getInCombatCountdown starts at 0 on a freshly built battler', () =>
    {
      const jabsBattler = buildBattler();

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

    it('getCombatWindowMax honors a configured zero rather than substituting a default', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.setCombatWindowMax(0);

      expect(jabsBattler.getCombatWindowMax()).toBe(0);
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

    it('isDodgeSkillById is false for a non-matching stype', () =>
    {
      globalThis.$dataSkills = { 1: { stypeId: 9 } };
      expect(JABS_Battler.isDodgeSkillById(1)).toBe(false);
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

    it('isWeaponSkillById is false for a non-matching stype', () =>
    {
      globalThis.$dataSkills = { 1: { stypeId: 9 } };
      expect(JABS_Battler.isWeaponSkillById(1)).toBe(false);
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

    it('isSkillVisibleInCombatMenu is false for a dodge skill', () =>
    {
      JABS_Battler.isDodgeSkillById = vi.fn(() => true);
      expect(JABS_Battler.isSkillVisibleInCombatMenu({ id: 1 })).toBe(false);
      JABS_Battler.isDodgeSkillById = vi.fn(() => false);
    });

    it('isSkillVisibleInCombatMenu is false for a guard skill', () =>
    {
      JABS_Battler.isDodgeSkillById = vi.fn(() => false);
      JABS_Battler.isGuardSkillById = vi.fn(() => true);
      expect(JABS_Battler.isSkillVisibleInCombatMenu({ id: 1 })).toBe(false);
      JABS_Battler.isGuardSkillById = vi.fn(() => false);
    });

    it('isSkillVisibleInCombatMenu is false for a weapon skill', () =>
    {
      JABS_Battler.isDodgeSkillById = vi.fn(() => false);
      JABS_Battler.isGuardSkillById = vi.fn(() => false);
      JABS_Battler.isWeaponSkillById = vi.fn(() => true);
      expect(JABS_Battler.isSkillVisibleInCombatMenu({ id: 1 })).toBe(false);
      JABS_Battler.isWeaponSkillById = vi.fn(() => false);
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

    it('isSkillVisibleInOffhandMenu is false for a menu-hidden skill', () =>
    {
      expect(JABS_Battler.isSkillVisibleInOffhandMenu({ id: 1, jabsHiddenFromMenus: true })).toBe(false);
    });

    it('isSkillVisibleInOffhandMenu is false for a dodge skill', () =>
    {
      JABS_Battler.isDodgeSkillById = vi.fn(() => true);
      expect(JABS_Battler.isSkillVisibleInOffhandMenu({ id: 1 })).toBe(false);
      JABS_Battler.isDodgeSkillById = vi.fn(() => false);
    });

    it('isSkillVisibleInOffhandMenu is false for a guard skill', () =>
    {
      JABS_Battler.isDodgeSkillById = vi.fn(() => false);
      JABS_Battler.isGuardSkillById = vi.fn(() => true);
      expect(JABS_Battler.isSkillVisibleInOffhandMenu({ id: 1 })).toBe(false);
      JABS_Battler.isGuardSkillById = vi.fn(() => false);
    });

    it('isSkillVisibleInOffhandMenu is false for a weapon skill', () =>
    {
      // Arrange
      JABS_Battler.isDodgeSkillById = vi.fn(() => false);
      JABS_Battler.isGuardSkillById = vi.fn(() => false);
      JABS_Battler.isWeaponSkillById = vi.fn(() => true);

      // Act
      // the eligibility flag is opted-in, so only the weapon-skill guard can reject this.
      const isVisible = JABS_Battler.isSkillVisibleInOffhandMenu({
        id: 1,
        jabsOffhandEligible: true
      });

      // Assert
      expect(isVisible).toBe(false);
      JABS_Battler.isWeaponSkillById = vi.fn(() => false);
    });

    it('isSkillVisibleInOffhandMenu requires the offhand-eligible flag to be exactly true', () =>
    {
      JABS_Battler.isDodgeSkillById = vi.fn(() => false);
      JABS_Battler.isGuardSkillById = vi.fn(() => false);
      JABS_Battler.isWeaponSkillById = vi.fn(() => false);
      expect(JABS_Battler.isSkillVisibleInOffhandMenu({ id: 1, jabsOffhandEligible: 1 })).toBe(false);
      expect(JABS_Battler.isSkillVisibleInOffhandMenu({ id: 1, jabsOffhandEligible: true })).toBe(true);
    });

    it('isSkillVisibleInDodgeMenu is false for a null skill', () =>
    {
      expect(JABS_Battler.isSkillVisibleInDodgeMenu(null)).toBe(false);
    });

    it('isSkillVisibleInDodgeMenu is false for a menu-hidden skill', () =>
    {
      expect(JABS_Battler.isSkillVisibleInDodgeMenu({ id: 1, jabsHiddenFromMenus: true })).toBe(false);
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
  describe('update', () =>
  {
    function buildUpdatableBattler(overrides = {})
    {
      const jabsBattler = buildBattler();
      jabsBattler.updateCooldowns = vi.fn();
      jabsBattler.updateTimers = vi.fn();
      jabsBattler.updateEngagement = vi.fn();
      jabsBattler.updateRegen = vi.fn();
      jabsBattler.updateDodging = vi.fn();
      jabsBattler.updateDeathHandling = vi.fn();
      jabsBattler.updateSelfInterruptOnMove = vi.fn();
      Object.assign(jabsBattler, overrides);
      return jabsBattler;
    }

    it('does nothing when JABS is disabled', () =>
    {
      globalThis.$jabsEngine = { absEnabled: false };
      const jabsBattler = buildUpdatableBattler();

      jabsBattler.update();

      expect(jabsBattler.updateCooldowns).not.toHaveBeenCalled();
      expect(jabsBattler.updateTimers).not.toHaveBeenCalled();
      expect(jabsBattler.updateEngagement).not.toHaveBeenCalled();
      expect(jabsBattler.updateRegen).not.toHaveBeenCalled();
      expect(jabsBattler.updateDodging).not.toHaveBeenCalled();
      expect(jabsBattler.updateDeathHandling).not.toHaveBeenCalled();
      expect(jabsBattler.updateSelfInterruptOnMove).not.toHaveBeenCalled();
    });

    it('runs every per-battler update hook when JABS is enabled', () =>
    {
      globalThis.$jabsEngine = { absEnabled: true };
      const jabsBattler = buildUpdatableBattler();

      jabsBattler.update();

      expect(jabsBattler.updateCooldowns).toHaveBeenCalled();
      expect(jabsBattler.updateTimers).toHaveBeenCalled();
      expect(jabsBattler.updateEngagement).toHaveBeenCalled();
      expect(jabsBattler.updateRegen).toHaveBeenCalled();
      expect(jabsBattler.updateDodging).toHaveBeenCalled();
      expect(jabsBattler.updateDeathHandling).toHaveBeenCalled();
      expect(jabsBattler.updateSelfInterruptOnMove).toHaveBeenCalled();
    });
  });

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
      // Arrange
      // movement intent is present, so being a non-player is the only thing that can suppress this.
      globalThis.Input.dir8 = 8;
      const jabsBattler = buildInterruptibleBattler({ isPlayer: () => false });

      // Act
      jabsBattler.updateSelfInterruptOnMove();

      // Assert
      expect(jabsBattler.interrupt).not.toHaveBeenCalled();
    });

    it('does nothing when not casting or channeling', () =>
    {
      // Arrange
      // movement intent is present, so the idle cast state is the only thing that can suppress this.
      globalThis.Input.dir8 = 8;
      const jabsBattler = buildInterruptibleBattler({ isCastingOrChanneling: () => false });

      // Act
      jabsBattler.updateSelfInterruptOnMove();

      // Assert
      expect(jabsBattler.interrupt).not.toHaveBeenCalled();
    });

    it('does nothing when the active cast/channel has an uninterruptible movement lock', () =>
    {
      // Arrange
      // movement intent is present, so the root tag is the only thing that can suppress this.
      globalThis.Input.dir8 = 8;
      const jabsBattler = buildInterruptibleBattler({ hasUninterruptibleMovementLock: () => true });

      // Act
      jabsBattler.updateSelfInterruptOnMove();

      // Assert
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
      // Arrange
      const jabsBattler = buildBattler();
      // an ally target is standing by with its own tile; an opponent-scoped action must ignore it.
      jabsBattler.setAllyTarget({
        getX: () => 3,
        getY: () => 4
      });
      jabsBattler.resolveDirectOpponentTarget = vi.fn(() => ({
        getX: () => 7,
        getY: () => 8
      }));
      const skill = { id: 1 };
      const action = {
        isDirectAction: () => true,
        getAction: () => ({
          isForUser: () => false,
          isForFriend: () => false
        }),
        getBaseSkill: () => skill,
      };

      // Act
      const coordinates = jabsBattler.resolveDirectActionTargetCoordinates(action);

      // Assert
      expect(coordinates).toEqual([ 7, 8 ]);
      expect(jabsBattler.resolveDirectOpponentTarget).toHaveBeenCalledWith(skill);
    });

    it('falls through to the opponent priority chain for ally-targeting without a selected ally target', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.resolveDirectOpponentTarget = vi.fn(() => ({ getX: () => 7, getY: () => 8 }));
      const skill = { id: 1 };
      const action = {
        isDirectAction: () => true,
        getAction: () => ({ isForUser: () => false, isForFriend: () => true }),
        getBaseSkill: () => skill,
      };

      expect(jabsBattler.resolveDirectActionTargetCoordinates(action)).toEqual([ 7, 8 ]);
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

    it('returns nulls when the opponent chain finds nothing', () =>
    {
      globalThis.Game_Action = vi.fn(function()
      {
        this.setSkill = vi.fn();
        this.isForUser = () => false;
        this.isForFriend = () => false;
      });
      const jabsBattler = buildBattler();
      jabsBattler.resolveDirectOpponentTarget = vi.fn(() => null);

      expect(jabsBattler.resolveDirectActionTargetCoordinatesForSkill({ jabsDirect: true, id: 1 })).toEqual([
        null, null,
      ]);
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

      const result = jabsBattler.resolveDirectOpponentTarget({
        jabsProximity: 5,
        jabsDirectStateTarget: 3
      });

      expect(result).toBe(winner);
      expect(JABS_AiManager.getBattlersWithinRange).toHaveBeenCalledWith(jabsBattler, 5);
      // the single scan is what feeds the scan-based tiers; an empty list would starve them.
      expect(jabsBattler.resolveDirectTargetByState).toHaveBeenCalledWith(3, [ 'candidate' ]);
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

    it('keeps the earlier closer candidate when a later one is not actually closer', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.isEnemy = () => false;
      jabsBattler.distanceToDesignatedTarget = vi.fn()
        .mockReturnValueOnce(3)
        .mockReturnValueOnce(10);
      const near = buildCandidate();
      const far = buildCandidate();

      expect(jabsBattler.resolveDirectTargetByState(1, [ near, far ])).toBe(near);
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

    it('keeps a known target inside a real proximity limit', () =>
    {
      // Arrange: the refusal above is paired with nothing that gets accepted under the same
      // non-zero limit, so the distance comparison had only ever been watched saying no - which a
      // comparison that always said no would satisfy, leaving every capped skill unable to reach
      // anything at all.
      const jabsBattler = buildBattler();
      const target = { isInanimate: () => false };
      jabsBattler.setTarget(target);
      jabsBattler.distanceToDesignatedTarget = () => 3;

      // Act
      const resolved = jabsBattler.resolveDirectTargetNonInanimate(5);

      // Assert
      expect(resolved).toBe(target);
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

    it('treats a proximity limit of zero as uncapped rather than as a distance of zero', () =>
    {
      // Arrange: every other case here that passes a limit of zero also sits at a distance of
      // zero, so the two readings agree and the short-circuit could be dropped unnoticed. A
      // distant target under an uncapped limit is where they part ways - reading zero as a literal
      // cap would reject every target that is not standing on top of the caster.
      const jabsBattler = buildBattler();
      const target = { isInanimate: () => false };
      jabsBattler.setTarget(target);
      jabsBattler.distanceToDesignatedTarget = () => 50;

      // Act
      const resolved = jabsBattler.resolveDirectTargetNonInanimate(0);

      // Assert
      expect(resolved).toBe(target);
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

    it('does not let a farther-away later candidate replace the current closest', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.isEnemy = () => false;
      jabsBattler.distanceToDesignatedTarget = vi.fn()
        .mockReturnValueOnce(3)
        .mockReturnValueOnce(10);
      const near = { isInanimate: () => false, isEnemy: () => true };
      const far = { isInanimate: () => false, isEnemy: () => true };

      expect(jabsBattler.resolveDirectTargetViaScan([ near, far ])).toBe(near);
    });

    it('skips inanimate and same-team candidates', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.isEnemy = () => false;
      const inanimate = { isInanimate: () => true, isEnemy: () => true };
      const sameTeam = { isInanimate: () => false, isEnemy: () => false };

      expect(jabsBattler.resolveDirectTargetViaScan([ inanimate, sameTeam ])).toBeNull();
    });

    it('skips itself when it appears in the candidate list', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.isEnemy = () => false;

      expect(jabsBattler.resolveDirectTargetViaScan([ jabsBattler ])).toBeNull();
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

    it('does not let a farther-away later candidate replace the current closest', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.isEnemy = () => false;
      jabsBattler.distanceToDesignatedTarget = vi.fn()
        .mockReturnValueOnce(3)
        .mockReturnValueOnce(10);
      const near = { isInanimate: () => true, isEnemy: () => true };
      const far = { isInanimate: () => true, isEnemy: () => true };

      expect(jabsBattler.resolveDirectTargetInanimateScan([ near, far ])).toBe(near);
    });

    it('skips non-inanimate and same-team candidates', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.isEnemy = () => false;
      const animate = { isInanimate: () => false, isEnemy: () => true };
      const sameTeam = { isInanimate: () => true, isEnemy: () => false };

      expect(jabsBattler.resolveDirectTargetInanimateScan([ animate, sameTeam ])).toBeNull();
    });

    it('skips itself when it appears in the candidate list', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.isEnemy = () => false;

      expect(jabsBattler.resolveDirectTargetInanimateScan([ jabsBattler ])).toBeNull();
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

    it('treats a proximity limit of zero as uncapped rather than as a distance of zero', () =>
    {
      // Arrange: this is the last resort in the targeting chain, so reading an uncapped limit as a
      // literal cap of zero would leave a skill with no proximity tag unable to fall back to
      // anything at all unless it was standing on top of the caster.
      const jabsBattler = buildBattler();
      const target = {};
      jabsBattler.setTarget(target);
      jabsBattler.distanceToDesignatedTarget = () => 50;

      // Act
      const resolved = jabsBattler.resolveDirectTargetInanimateFallback(0);

      // Assert
      expect(resolved).toBe(target);
    });
  });
  //endregion updates: targeting resolution

  //region updates: timers/channeling/interrupt/engagement
  describe('updateCooldowns', () =>
  {
    it('delegates to the skill slot manager with the current casting/channeling state', () =>
    {
      const updateCooldowns = vi.fn();
      const jabsBattler = buildBattler();
      jabsBattler.getBattler = () => ({ getSkillSlotManager: () => ({ updateCooldowns }) });
      jabsBattler.isCastingOrChanneling = () => true;

      jabsBattler.updateCooldowns();

      expect(updateCooldowns).toHaveBeenCalledWith(true);
    });
  });

  describe('updateTimers', () =>
  {
    it('processes every tracked timer', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.processWaitTimer = vi.fn();
      jabsBattler.processAlertTimer = vi.fn();
      jabsBattler.processParryTimer = vi.fn();
      jabsBattler.processGuardIntervalTimer = vi.fn();
      jabsBattler.processLastHitTimer = vi.fn();
      jabsBattler.processCombatTimer = vi.fn();
      jabsBattler.processCastingTimer = vi.fn();
      jabsBattler.processChannelingTimer = vi.fn();
      jabsBattler.processEngagementTimer = vi.fn();

      jabsBattler.updateTimers();

      expect(jabsBattler.processWaitTimer).toHaveBeenCalled();
      expect(jabsBattler.processAlertTimer).toHaveBeenCalled();
      expect(jabsBattler.processParryTimer).toHaveBeenCalled();
      expect(jabsBattler.processGuardIntervalTimer).toHaveBeenCalled();
      expect(jabsBattler.processLastHitTimer).toHaveBeenCalled();
      expect(jabsBattler.processCombatTimer).toHaveBeenCalled();
      expect(jabsBattler.processCastingTimer).toHaveBeenCalled();
      expect(jabsBattler.processChannelingTimer).toHaveBeenCalled();
      expect(jabsBattler.processEngagementTimer).toHaveBeenCalled();
    });
  });

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

    it('processGuardIntervalTimer does not advance the cadence while not guarding', () =>
    {
      const forceMapAction = vi.fn();
      globalThis.$jabsEngine = { forceMapAction };
      const jabsBattler = buildBattler();
      jabsBattler.guarding = () => false;
      const intervalTimer = jabsBattler.guardIntervalTimer();
      intervalTimer.setMaxTime(60);

      jabsBattler.processGuardIntervalTimer();

      expect(intervalTimer.updateCalled).toBeUndefined();
      expect(forceMapAction).not.toHaveBeenCalled();
    });

    it('processGuardIntervalTimer does not advance the cadence for a guard that does not refire', () =>
    {
      const forceMapAction = vi.fn();
      globalThis.$jabsEngine = { forceMapAction };
      const jabsBattler = buildBattler();
      jabsBattler.guarding = () => true;
      const intervalTimer = jabsBattler.guardIntervalTimer();
      intervalTimer.setMaxTime(0);

      jabsBattler.processGuardIntervalTimer();

      expect(intervalTimer.updateCalled).toBeUndefined();
      expect(forceMapAction).not.toHaveBeenCalled();
    });

    it('processGuardIntervalTimer advances without firing before the cadence elapses', () =>
    {
      const forceMapAction = vi.fn();
      globalThis.$jabsEngine = { forceMapAction };
      const jabsBattler = buildBattler();
      jabsBattler.guarding = () => true;
      const intervalTimer = jabsBattler.guardIntervalTimer();
      intervalTimer.setMaxTime(60);

      jabsBattler.processGuardIntervalTimer();

      expect(intervalTimer.updateCalled).toBe(true);
      expect(intervalTimer.resetCalled).toBeUndefined();
      expect(forceMapAction).not.toHaveBeenCalled();
    });

    it('processGuardIntervalTimer re-arms and fires the guard skill when the cadence elapses', () =>
    {
      const forceMapAction = vi.fn();
      globalThis.$jabsEngine = { forceMapAction };
      const jabsBattler = buildBattler();
      jabsBattler.guarding = () => true;
      jabsBattler.setGuardSkillId(201);
      const intervalTimer = jabsBattler.guardIntervalTimer();
      intervalTimer.setMaxTime(60);
      intervalTimer.forceComplete();

      jabsBattler.processGuardIntervalTimer();

      expect(intervalTimer.updateCalled).toBe(true);
      expect(intervalTimer.resetCalled).toBe(true);
      expect(forceMapAction).toHaveBeenCalledWith(jabsBattler, 201, false);
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
      const stillCasting = true;
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
        // Arrange
        const jabsBattler = buildBattler();
        jabsBattler.isCastingOrChanneling = () => false;
        // a rooted skill sits in the decided slot; with nothing in flight it must not root anything.
        jabsBattler.setDecidedAction([ { getBaseSkill: () => ({ jabsCannotMoveToInterrupt: true }) } ]);

        // Act
        const hasLock = jabsBattler.hasUninterruptibleMovementLock();

        // Assert
        expect(hasLock).toBe(false);
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
      // Arrange
      const jabsBattler = buildBattler();
      jabsBattler.isChanneling = () => false;
      jabsBattler.isCasting = () => false;
      jabsBattler.clearDecidedAction = vi.fn();
      // a decided action is queued but not in-flight; only the cast/channel checks keep it safe.
      jabsBattler.setDecidedAction([ { getCooldown: () => 100 } ]);

      // Act
      jabsBattler.interrupt();

      // Assert
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

    it('does nothing further when casting with no decided action to tear down', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.isChanneling = () => false;
      jabsBattler.isCasting = () => true;

      jabsBattler.interrupt();

      expect(jabsBattler._casting).toBe(false);
      expect(globalThis.$jabsEngine.applyCooldownValueForSkill).not.toHaveBeenCalled();
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

  describe('handleDodgeMovement', () =>
  {
    it('updates the iframes then does not move when the battler cannot dodge-move', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.updateDodgeIFrames = vi.fn();
      jabsBattler.canDodgeMove = () => false;
      jabsBattler.executeDodgeMovement = vi.fn();

      jabsBattler.handleDodgeMovement();

      expect(jabsBattler.updateDodgeIFrames).toHaveBeenCalledTimes(1);
      expect(jabsBattler.executeDodgeMovement).not.toHaveBeenCalled();
    });

    it('updates the iframes then executes the movement when the battler can dodge-move', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.updateDodgeIFrames = vi.fn();
      jabsBattler.canDodgeMove = () => true;
      jabsBattler.executeDodgeMovement = vi.fn();

      jabsBattler.handleDodgeMovement();

      expect(jabsBattler.executeDodgeMovement).toHaveBeenCalledTimes(1);
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

    it('sets invincible false after the iframe window has passed', () =>
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

    it('sets invincible false before the iframe window has opened', () =>
    {
      // Arrange
      const jabsBattler = buildBattler();
      jabsBattler.isDodging = () => true;
      jabsBattler.incrementDodgeFrame = vi.fn();
      jabsBattler.getDodgeIFrames = () => [ 2, 5 ];
      // frame 1 is still inside the window's tail, but the window has not opened yet.
      jabsBattler.getDodgeFrame = () => 1;
      jabsBattler.setInvincible = vi.fn();

      // Act
      jabsBattler.updateDodgeIFrames();

      // Assert
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

  //region aggro
  describe('getAllAggros / getAggrosSortedHighestToLowest', () =>
  {
    it('getAllAggros returns the tracked aggro list', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler._aggros = [ 'a', 'b' ];

      expect(jabsBattler.getAllAggros()).toEqual([ 'a', 'b' ]);
    });

    it('sorts aggros from highest to lowest', () =>
    {
      const jabsBattler = buildBattler();
      const low = { aggro: 1 };
      const high = { aggro: 10 };
      const mid = { aggro: 5 };
      jabsBattler._aggros = [ low, high, mid ];

      expect(jabsBattler.getAggrosSortedHighestToLowest()).toEqual([ high, mid, low ]);
    });
  });

  describe('getHighestAggro', () =>
  {
    it('returns null when there are no aggros', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler._aggros = [];

      expect(jabsBattler.getHighestAggro()).toBeNull();
    });

    it('returns the single tracked aggro', () =>
    {
      const jabsBattler = buildBattler();
      const only = { aggro: 5 };
      jabsBattler._aggros = [ only ];

      expect(jabsBattler.getHighestAggro()).toBe(only);
    });

    it('returns the clear highest of two distinct aggros', () =>
    {
      const jabsBattler = buildBattler();
      const high = { aggro: 10 };
      const low = { aggro: 5 };
      jabsBattler._aggros = [ high, low ];

      expect(jabsBattler.getHighestAggro()).toBe(high);
    });

    it('bumps the top aggro by 1 to break a tie with the second-highest', () =>
    {
      const jabsBattler = buildBattler();
      const first = { aggro: 5, modAggro: vi.fn(function(amount) { this.aggro += amount; }) };
      const second = { aggro: 5, modAggro: vi.fn() };
      jabsBattler._aggros = [ first, second ];

      const result = jabsBattler.getHighestAggro();

      expect(first.modAggro).toHaveBeenCalledWith(1, true);
      expect(result).toBe(first);
    });
  });

  describe('aggro validity / removal', () =>
  {
    it('isAggroInvalid is true when the battler cannot be found', async () =>
    {
      const { default: JABS_AiManager } = await import('../../../../../src/plugins/abs/core/managers/JABS_AiManager.js');
      JABS_AiManager.getBattlerByUuid = vi.fn(() => null);
      const jabsBattler = buildBattler();

      expect(jabsBattler.isAggroInvalid('uuid')).toBe(true);
    });

    it('isAggroInvalid is true when the battler is dead', async () =>
    {
      const { default: JABS_AiManager } = await import('../../../../../src/plugins/abs/core/managers/JABS_AiManager.js');
      JABS_AiManager.getBattlerByUuid = vi.fn(() => ({ isDead: () => true }));
      const jabsBattler = buildBattler();

      expect(jabsBattler.isAggroInvalid('uuid')).toBe(true);
    });

    it('isAggroInvalid is true when the battler is out of range', async () =>
    {
      const { default: JABS_AiManager } = await import('../../../../../src/plugins/abs/core/managers/JABS_AiManager.js');
      JABS_AiManager.getBattlerByUuid = vi.fn(() => ({ isDead: () => false, outOfRange: () => true }));
      const jabsBattler = buildBattler();

      expect(jabsBattler.isAggroInvalid('uuid')).toBe(true);
    });

    it('isAggroInvalid is false for a valid, alive, in-range battler', async () =>
    {
      const { default: JABS_AiManager } = await import('../../../../../src/plugins/abs/core/managers/JABS_AiManager.js');
      JABS_AiManager.getBattlerByUuid = vi.fn(() => ({ isDead: () => false, outOfRange: () => false }));
      const jabsBattler = buildBattler();

      expect(jabsBattler.isAggroInvalid('uuid')).toBe(false);
    });

    it('removeAggroIfInvalid removes aggro only when invalid', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.isAggroInvalid = () => false;
      jabsBattler.removeAggro = vi.fn();
      jabsBattler.removeAggroIfInvalid('uuid');
      expect(jabsBattler.removeAggro).not.toHaveBeenCalled();

      jabsBattler.isAggroInvalid = () => true;
      jabsBattler.removeAggroIfInvalid('uuid');
      expect(jabsBattler.removeAggro).toHaveBeenCalledWith('uuid');
    });

    it('removeAggro does nothing for an untracked uuid', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler._aggros = [];
      jabsBattler.disengageTarget = vi.fn();

      jabsBattler.removeAggro('uuid');

      expect(jabsBattler.disengageTarget).not.toHaveBeenCalled();
      expect(jabsBattler._aggros).toEqual([]);
    });

    it('removeAggro disengages when removing the aggro of the current target', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler._aggros = [ { uuid: () => 'target-uuid' } ];
      jabsBattler.setTarget({ getUuid: () => 'target-uuid' });
      jabsBattler.disengageTarget = vi.fn();

      jabsBattler.removeAggro('target-uuid');

      expect(jabsBattler.disengageTarget).toHaveBeenCalledTimes(1);
      expect(jabsBattler._aggros).toEqual([]);
    });

    it('removeAggro removes without disengaging when the uuid is not the current target', () =>
    {
      // Arrange
      const jabsBattler = buildBattler();
      // the decoy is listed first, so a predicate that matched anything would take it instead.
      const decoy = { uuid: () => 'decoy-uuid' };
      jabsBattler._aggros = [ decoy, { uuid: () => 'other-uuid' } ];
      jabsBattler.setTarget({ getUuid: () => 'target-uuid' });
      jabsBattler.disengageTarget = vi.fn();

      // Act
      jabsBattler.removeAggro('other-uuid');

      // Assert
      expect(jabsBattler.disengageTarget).not.toHaveBeenCalled();
      expect(jabsBattler._aggros).toEqual([ decoy ]);
    });

    it('removeAggro purges a tracked aggro while nothing is currently targeted', () =>
    {
      // Arrange- aggro survives a disengage, so a battler with no target at all can still be asked
      // to drop one; the uuid matches what would have been the target, leaving the absent target as
      // the only thing that can keep the disengage from firing.
      const jabsBattler = buildBattler();
      jabsBattler._aggros = [ { uuid: () => 'target-uuid' } ];
      jabsBattler.setTarget(null);
      jabsBattler.disengageTarget = vi.fn();

      // Act
      jabsBattler.removeAggro('target-uuid');

      // Assert
      expect(jabsBattler.disengageTarget).not.toHaveBeenCalled();
      expect(jabsBattler._aggros).toEqual([]);
    });
  });

  describe('addUpdateAggro / resetOneAggro / resetAllAggro / aggroExists', () =>
  {
    function buildAggroableBattler(overrides = {})
    {
      const jabsBattler = buildBattler();
      jabsBattler.getBattler = () => ({ isAggroLocked: () => false });
      Object.assign(jabsBattler, overrides);
      return jabsBattler;
    }

    it('addUpdateAggro does nothing when locked and not forced', () =>
    {
      const jabsBattler = buildAggroableBattler({ getBattler: () => ({ isAggroLocked: () => true }) });

      jabsBattler.addUpdateAggro('uuid', 5);

      expect(jabsBattler.getAllAggros()).toEqual([]);
    });

    it('addUpdateAggro bypasses the lock when forced', () =>
    {
      const jabsBattler = buildAggroableBattler({ getBattler: () => ({ isAggroLocked: () => true }) });

      jabsBattler.addUpdateAggro('uuid', 5, true);

      expect(jabsBattler.getAllAggros()).toHaveLength(1);
    });

    it('addUpdateAggro creates a new aggro tracker for an unseen uuid', () =>
    {
      const jabsBattler = buildAggroableBattler();

      jabsBattler.addUpdateAggro('uuid', 5);

      const [ created ] = jabsBattler.getAllAggros();
      expect(created.uuid()).toBe('uuid');
      expect(created.aggro).toBe(5);
    });

    it('addUpdateAggro updates an existing aggro tracker', () =>
    {
      const jabsBattler = buildAggroableBattler();
      jabsBattler.addUpdateAggro('uuid', 5);

      jabsBattler.addUpdateAggro('uuid', 3);

      expect(jabsBattler.getAllAggros()).toHaveLength(1);
      expect(jabsBattler.getAllAggros()[0].aggro).toBe(8);
    });

    it('aggroExists finds a tracked aggro by uuid', () =>
    {
      const jabsBattler = buildAggroableBattler();
      jabsBattler.addUpdateAggro('uuid', 5);

      expect(jabsBattler.aggroExists('uuid')).toBeDefined();
      expect(jabsBattler.aggroExists('other')).toBeUndefined();
    });

    it('resetOneAggro does nothing when locked and not forced', () =>
    {
      const jabsBattler = buildAggroableBattler({ getBattler: () => ({ isAggroLocked: () => true }) });
      jabsBattler.addUpdateAggro = vi.fn();

      jabsBattler.resetOneAggro('uuid');

      expect(jabsBattler.addUpdateAggro).not.toHaveBeenCalled();
    });

    it('resetOneAggro resets an existing tracked aggro', () =>
    {
      const jabsBattler = buildAggroableBattler();
      jabsBattler.addUpdateAggro('uuid', 5);

      jabsBattler.resetOneAggro('uuid');

      expect(jabsBattler.getAllAggros()[0].aggro).toBe(0);
    });

    it('resetOneAggro does nothing for an empty uuid with no existing tracker', () =>
    {
      const jabsBattler = buildAggroableBattler();

      jabsBattler.resetOneAggro('');

      expect(jabsBattler.getAllAggros()).toEqual([]);
    });

    it('resetOneAggro creates a fresh zero-aggro tracker for an untracked, non-empty uuid', () =>
    {
      const jabsBattler = buildAggroableBattler();

      jabsBattler.resetOneAggro('uuid');

      expect(jabsBattler.getAllAggros()).toHaveLength(1);
      expect(jabsBattler.getAllAggros()[0].aggro).toBe(0);
    });

    it('resetAllAggro does nothing when locked and not forced', () =>
    {
      const jabsBattler = buildAggroableBattler({ getBattler: () => ({ isAggroLocked: () => true }) });
      jabsBattler.resetOneAggro = vi.fn();

      jabsBattler.resetAllAggro('uuid');

      expect(jabsBattler.resetOneAggro).not.toHaveBeenCalled();
    });

    it('resetAllAggro resets the triggering uuid and every tracked aggro', () =>
    {
      const jabsBattler = buildAggroableBattler();
      jabsBattler.addUpdateAggro('a', 5);
      jabsBattler.addUpdateAggro('b', 7);

      jabsBattler.resetAllAggro('a');

      expect(jabsBattler.getAllAggros().every(aggro => aggro.aggro === 0)).toBe(true);
    });
  });

  describe('adjustTargetByAggro', () =>
  {
    it('does nothing for inanimate battlers', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.isInanimate = () => true;
      jabsBattler.getHighestAggro = vi.fn();

      jabsBattler.adjustTargetByAggro();

      expect(jabsBattler.getHighestAggro).not.toHaveBeenCalled();
    });

    it('adopts the highest-aggro battler as the target when there is no current target', async () =>
    {
      const { default: JABS_AiManager } = await import('../../../../../src/plugins/abs/core/managers/JABS_AiManager.js');
      const newTarget = { id: 'new-target' };
      JABS_AiManager.getBattlerByUuid = vi.fn(() => newTarget);
      const jabsBattler = buildBattler();
      jabsBattler.isInanimate = () => false;
      jabsBattler.getHighestAggro = () => ({ uuid: () => 'uuid' });

      jabsBattler.adjustTargetByAggro();

      expect(jabsBattler.getTarget()).toBe(newTarget);
    });

    it('leaves the target unset when no battler is found without a current target', async () =>
    {
      const { default: JABS_AiManager } = await import('../../../../../src/plugins/abs/core/managers/JABS_AiManager.js');
      JABS_AiManager.getBattlerByUuid = vi.fn(() => null);
      const jabsBattler = buildBattler();
      jabsBattler.isInanimate = () => false;
      jabsBattler.getHighestAggro = () => ({ uuid: () => 'uuid' });

      jabsBattler.adjustTargetByAggro();

      expect(jabsBattler.getTarget()).toBeNull();
    });

    it('disengages when the current target has no remaining aggros', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.isInanimate = () => false;
      jabsBattler.getHighestAggro = () => ({ uuid: () => 'uuid' });
      jabsBattler.setTarget({ getUuid: () => 'target-uuid' });
      jabsBattler.removeAggroIfInvalid = vi.fn();
      jabsBattler.getAggrosSortedHighestToLowest = () => [];
      jabsBattler.disengageTarget = vi.fn();

      jabsBattler.adjustTargetByAggro();

      expect(jabsBattler.disengageTarget).toHaveBeenCalledTimes(1);
    });

    it('switches to the sole remaining aggro target when it differs from the current target', async () =>
    {
      const { default: JABS_AiManager } = await import('../../../../../src/plugins/abs/core/managers/JABS_AiManager.js');
      const newTarget = { id: 'new-target' };
      JABS_AiManager.getBattlerByUuid = vi.fn(() => newTarget);
      const jabsBattler = buildBattler();
      jabsBattler.isInanimate = () => false;
      jabsBattler.getHighestAggro = () => ({ uuid: () => 'uuid' });
      jabsBattler.setTarget({ getUuid: () => 'current-uuid' });
      jabsBattler.removeAggroIfInvalid = vi.fn();
      jabsBattler.getAggrosSortedHighestToLowest = () => [ { uuid: () => 'sole-uuid' } ];

      jabsBattler.adjustTargetByAggro();

      expect(jabsBattler.getTarget()).toBe(newTarget);
    });

    it('purges the sole remaining aggro when its battler cannot be found', async () =>
    {
      const { default: JABS_AiManager } = await import('../../../../../src/plugins/abs/core/managers/JABS_AiManager.js');
      JABS_AiManager.getBattlerByUuid = vi.fn(() => null);
      const jabsBattler = buildBattler();
      jabsBattler.isInanimate = () => false;
      jabsBattler.getHighestAggro = () => ({ uuid: () => 'uuid' });
      jabsBattler.setTarget({ getUuid: () => 'current-uuid' });
      jabsBattler.removeAggroIfInvalid = vi.fn();
      jabsBattler.getAggrosSortedHighestToLowest = () => [ { uuid: () => 'sole-uuid' } ];
      jabsBattler.removeAggro = vi.fn();

      jabsBattler.adjustTargetByAggro();

      expect(jabsBattler.removeAggro).toHaveBeenCalledWith('sole-uuid');
    });

    it('stops with a sole remaining aggro when the target becomes unset partway through the tick', () =>
    {
      // a defensive re-check: getTarget() is truthy for the earlier gates (so we actually reach
      // the sole-aggro branch) but reports unset by the time the inner guard runs.
      const jabsBattler = buildBattler();
      jabsBattler.isInanimate = () => false;
      jabsBattler.getHighestAggro = () => ({ uuid: () => 'uuid' });
      jabsBattler.removeAggroIfInvalid = vi.fn();
      jabsBattler.getAggrosSortedHighestToLowest = () => [ { uuid: () => 'sole-uuid' } ];
      const target = { getUuid: () => 'current-uuid' };
      jabsBattler.getTarget = vi.fn()
        .mockReturnValueOnce(target)
        .mockReturnValueOnce(target)
        .mockReturnValueOnce(null);

      expect(() => jabsBattler.adjustTargetByAggro()).not.toThrow();
      expect(jabsBattler.getTarget).toHaveBeenCalledTimes(3);
    });

    it('keeps the current target when it already matches the sole remaining aggro', async () =>
    {
      // Arrange
      const { default: JABS_AiManager } = await import('../../../../../src/plugins/abs/core/managers/JABS_AiManager.js');
      // the sole aggro resolves cleanly, so re-targeting would succeed if the match check let it.
      JABS_AiManager.getBattlerByUuid = vi.fn(() => ({ id: 'sole-battler' }));
      const jabsBattler = buildBattler();
      jabsBattler.isInanimate = () => false;
      jabsBattler.getHighestAggro = () => ({ uuid: () => 'uuid' });
      const target = { getUuid: () => 'sole-uuid' };
      jabsBattler.setTarget(target);
      jabsBattler.removeAggroIfInvalid = vi.fn();
      jabsBattler.getAggrosSortedHighestToLowest = () => [ { uuid: () => 'sole-uuid' } ];
      jabsBattler.removeAggro = vi.fn();
      const setTargetSpy = vi.spyOn(jabsBattler, 'setTarget');

      // Act
      jabsBattler.adjustTargetByAggro();

      // Assert
      expect(setTargetSpy).not.toHaveBeenCalled();
      expect(jabsBattler.removeAggro).not.toHaveBeenCalled();
      expect(jabsBattler.getTarget()).toBe(target);
    });

    it('gives up with multiple aggros when there is no current target', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.isInanimate = () => false;
      jabsBattler.getHighestAggro = () => ({ uuid: () => 'uuid' });
      jabsBattler.removeAggroIfInvalid = vi.fn();
      jabsBattler.getAggrosSortedHighestToLowest = () => [ { uuid: () => 'a' }, { uuid: () => 'b' } ];
      jabsBattler.setTarget(null);

      expect(() => jabsBattler.adjustTargetByAggro()).not.toThrow();
    });

    it('gives up with multiple aggros when the target becomes unset partway through the tick', () =>
    {
      // a defensive re-check: getTarget() is truthy for the earlier gates (so we actually reach
      // the multi-aggro branch) but reports unset by the time the second guard runs.
      const jabsBattler = buildBattler();
      jabsBattler.isInanimate = () => false;
      jabsBattler.getHighestAggro = () => ({ uuid: () => 'uuid' });
      jabsBattler.removeAggroIfInvalid = vi.fn();
      jabsBattler.getAggrosSortedHighestToLowest = () => [ { uuid: () => 'a' }, { uuid: () => 'b' } ];
      const target = { getUuid: () => 'current-uuid' };
      jabsBattler.getTarget = vi.fn()
        .mockReturnValueOnce(target)
        .mockReturnValueOnce(target)
        .mockReturnValueOnce(null);

      expect(() => jabsBattler.adjustTargetByAggro()).not.toThrow();
      expect(jabsBattler.getTarget).toHaveBeenCalledTimes(3);
    });

    it('does not adjust targets when all aggro\'d targets are out of pursuit range', async () =>
    {
      const { default: JABS_AiManager } = await import('../../../../../src/plugins/abs/core/managers/JABS_AiManager.js');
      JABS_AiManager.getBattlerByUuid = vi.fn(() => ({ id: 'far' }));
      const jabsBattler = buildBattler();
      jabsBattler.isInanimate = () => false;
      jabsBattler.getHighestAggro = () => ({ uuid: () => 'uuid' });
      const target = { getUuid: () => 'current-uuid' };
      jabsBattler.setTarget(target);
      jabsBattler.removeAggroIfInvalid = vi.fn();
      jabsBattler.getAggrosSortedHighestToLowest = () => [ { uuid: () => 'a' }, { uuid: () => 'b' } ];
      jabsBattler.getPursuitRadius = () => 5;
      jabsBattler.distanceToDesignatedTarget = () => 10;

      jabsBattler.adjustTargetByAggro();

      expect(jabsBattler.getTarget()).toBe(target);
    });

    it('keeps the current target when it already matches the highest in-range aggro', async () =>
    {
      const { default: JABS_AiManager } = await import('../../../../../src/plugins/abs/core/managers/JABS_AiManager.js');
      JABS_AiManager.getBattlerByUuid = vi.fn(() => ({ id: 'existence-check' }));
      const jabsBattler = buildBattler();
      jabsBattler.isInanimate = () => false;
      jabsBattler.getHighestAggro = () => ({ uuid: () => 'uuid' });
      const target = { getUuid: () => 'a' };
      jabsBattler.setTarget(target);
      jabsBattler.removeAggroIfInvalid = vi.fn();
      jabsBattler.getAggrosSortedHighestToLowest = () => [ { uuid: () => 'a' }, { uuid: () => 'b' } ];
      jabsBattler.getPursuitRadius = () => 100;
      jabsBattler.distanceToDesignatedTarget = () => 1;
      jabsBattler.engageTarget = vi.fn();

      jabsBattler.adjustTargetByAggro();

      expect(jabsBattler.engageTarget).not.toHaveBeenCalled();
      expect(jabsBattler.getTarget()).toBe(target);
    });

    it('engages the highest in-range aggro target when it differs from the current target', async () =>
    {
      const { default: JABS_AiManager } = await import('../../../../../src/plugins/abs/core/managers/JABS_AiManager.js');
      const newTarget = { id: 'new-target' };
      JABS_AiManager.getBattlerByUuid = vi.fn(() => newTarget);
      const jabsBattler = buildBattler();
      jabsBattler.isInanimate = () => false;
      jabsBattler.getHighestAggro = () => ({ uuid: () => 'uuid' });
      jabsBattler.setTarget({ getUuid: () => 'current-uuid' });
      jabsBattler.removeAggroIfInvalid = vi.fn();
      jabsBattler.getAggrosSortedHighestToLowest = () => [ { uuid: () => 'a' }, { uuid: () => 'b' } ];
      jabsBattler.getPursuitRadius = () => 100;
      jabsBattler.distanceToDesignatedTarget = () => 1;
      jabsBattler.engageTarget = vi.fn();

      jabsBattler.adjustTargetByAggro();

      expect(jabsBattler.engageTarget).toHaveBeenCalledWith(newTarget);
    });

    it('skips an aggro whose battler no longer exists when picking the highest', async () =>
    {
      // Arrange
      const { default: JABS_AiManager } = await import('../../../../../src/plugins/abs/core/managers/JABS_AiManager.js');
      const survivingBattler = { id: 'b' };
      // the top-ranked aggro has no battler behind it anymore; the runner-up does.
      JABS_AiManager.getBattlerByUuid = vi.fn(uuid => (uuid === 'a'
        ? null
        : survivingBattler));
      const jabsBattler = buildBattler();
      jabsBattler.isInanimate = () => false;
      jabsBattler.getHighestAggro = () => ({ uuid: () => 'uuid' });
      jabsBattler.setTarget({ getUuid: () => 'current-uuid' });
      jabsBattler.removeAggroIfInvalid = vi.fn();
      jabsBattler.getAggrosSortedHighestToLowest = () => [ { uuid: () => 'a' }, { uuid: () => 'b' } ];
      jabsBattler.getPursuitRadius = () => 100;
      jabsBattler.distanceToDesignatedTarget = () => 1;
      jabsBattler.engageTarget = vi.fn();
      jabsBattler.removeAggro = vi.fn();

      // Act
      jabsBattler.adjustTargetByAggro();

      // Assert
      expect(jabsBattler.engageTarget).toHaveBeenCalledWith(survivingBattler);
      expect(jabsBattler.removeAggro).not.toHaveBeenCalled();
    });

    it('purges the highest in-range aggro when its battler cannot be found', async () =>
    {
      const { default: JABS_AiManager } = await import('../../../../../src/plugins/abs/core/managers/JABS_AiManager.js');
      JABS_AiManager.getBattlerByUuid = vi.fn()
        .mockReturnValueOnce({ id: 'existence-check' })
        .mockReturnValueOnce(null);
      const jabsBattler = buildBattler();
      jabsBattler.isInanimate = () => false;
      jabsBattler.getHighestAggro = () => ({ uuid: () => 'uuid' });
      jabsBattler.setTarget({ getUuid: () => 'current-uuid' });
      jabsBattler.removeAggroIfInvalid = vi.fn();
      jabsBattler.getAggrosSortedHighestToLowest = () => [ { uuid: () => 'a' }, { uuid: () => 'b' } ];
      jabsBattler.getPursuitRadius = () => 100;
      jabsBattler.distanceToDesignatedTarget = () => 1;
      jabsBattler.removeAggro = vi.fn();

      jabsBattler.adjustTargetByAggro();

      expect(jabsBattler.removeAggro).toHaveBeenCalledWith('a');
    });

    it('leaves the target alone when it already matches the highest in-range aggro', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.isInanimate = () => false;
      jabsBattler.getHighestAggro = () => ({ uuid: () => 'uuid' });
      const target = { getUuid: () => 'a' };
      jabsBattler.setTarget(target);
      jabsBattler.removeAggroIfInvalid = vi.fn();
      jabsBattler.getAggrosSortedHighestToLowest = () => [ { uuid: () => 'a' }, { uuid: () => 'b' } ];
      jabsBattler.getPursuitRadius = () => 100;
      jabsBattler.distanceToDesignatedTarget = () => 1;
      jabsBattler.engageTarget = vi.fn();

      jabsBattler.adjustTargetByAggro();

      expect(jabsBattler.engageTarget).not.toHaveBeenCalled();
      expect(jabsBattler.getTarget()).toBe(target);
    });
  });
  //endregion aggro

  //region dodging
  describe('dodge state accessors', () =>
  {
    it('tracks dodge direction, steps (with decrement), frame (with increment), and iframes', () =>
    {
      const jabsBattler = buildBattler();

      jabsBattler.setDodgeDirection(8);
      expect(jabsBattler.getDodgeDirection()).toBe(8);

      jabsBattler.setDodgeSteps(3);
      jabsBattler.decrementDodgeSteps();
      expect(jabsBattler.getDodgeSteps()).toBe(2);

      jabsBattler.setDodgeFrame(0);
      jabsBattler.incrementDodgeFrame();
      expect(jabsBattler.getDodgeFrame()).toBe(1);

    });

    it('setDodgeIFrames updates what getDodgeIFrames returns', () =>
    {
      // FIXED: setDodgeIFrames(frames) previously set this._dodgeIFrames (capital F) while
      // getDodgeIFrames()/initDodgeInfo() read this._dodgeIframes (lowercase f), so the setter
      // silently never updated the getter- a dodge skill's parsed iframe window (executeDodgeSkill)
      // or its reset (endDodge) never actually took effect. Both now agree on _dodgeIframes.
      const jabsBattler = buildBattler();

      jabsBattler.setDodgeIFrames([ 1, 5 ]);

      expect(jabsBattler.getDodgeIFrames()).toEqual([ 1, 5 ]);
    });
  });

  describe('tryDodgeSkill', () =>
  {
    it('does nothing when the dodge slot has no resolved skill id', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.getBattler = () => ({ getResolvedSkillId: () => 0 });
      jabsBattler.executeDodgeSkill = vi.fn();

      jabsBattler.tryDodgeSkill();

      expect(jabsBattler.executeDodgeSkill).not.toHaveBeenCalled();
    });

    it('does not execute when the cost cannot be paid', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.getBattler = () => ({ getResolvedSkillId: () => 1, canPaySkillCost: () => false });
      jabsBattler.getSkill = () => ({ id: 1 });
      jabsBattler.executeDodgeSkill = vi.fn();

      jabsBattler.tryDodgeSkill();

      expect(jabsBattler.executeDodgeSkill).not.toHaveBeenCalled();
    });

    it('executes the dodge skill when payable', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.getBattler = () => ({ getResolvedSkillId: () => 1, canPaySkillCost: () => true });
      const skill = { id: 1 };
      jabsBattler.getSkill = () => skill;
      jabsBattler.executeDodgeSkill = vi.fn();

      jabsBattler.tryDodgeSkill();

      expect(jabsBattler.executeDodgeSkill).toHaveBeenCalledWith(skill);
    });
  });

  describe('executeDodgeSkill', () =>
  {
    function buildDodgeSkill(overrides = {})
    {
      return Object.assign({
        id: 1,
        jabsIFrames: [ 1, 5 ],
        jabsInvincibleDodge: true,
        jabsDodgeSpeed: 2,
        jabsDodgeSteps: 3,
        jabsMoveType: 'forward',
      }, overrides);
    }

    function buildDodgingBattler(overrides = {})
    {
      const jabsBattler = buildBattler();
      jabsBattler.guarding = () => false;
      jabsBattler.executeGuard = vi.fn();
      jabsBattler.determineDodgeDirection = vi.fn(() => 2);
      jabsBattler.createJabsActionFromSkill = vi.fn(() => [ { setCooldownType: vi.fn() } ]);
      globalThis.$jabsEngine = { executeMapActions: vi.fn() };
      Object.assign(jabsBattler, overrides);
      return jabsBattler;
    }

    it('drops an active guard before dodging', () =>
    {
      const jabsBattler = buildDodgingBattler({ guarding: () => true });
      jabsBattler.getCharacter = () => ({ setDodgeModifier: vi.fn() });

      jabsBattler.executeDodgeSkill(buildDodgeSkill());

      expect(jabsBattler.executeGuard).toHaveBeenCalledWith(false);
    });

    it('does not touch guard when not currently guarding', () =>
    {
      const jabsBattler = buildDodgingBattler();
      jabsBattler.getCharacter = () => ({ setDodgeModifier: vi.fn() });

      jabsBattler.executeDodgeSkill(buildDodgeSkill());

      expect(jabsBattler.executeGuard).not.toHaveBeenCalled();
    });

    it('applies iframes, invincibility, dodge speed, and step count from the skill', () =>
    {
      const setDodgeModifier = vi.fn();
      const jabsBattler = buildDodgingBattler();
      jabsBattler.getCharacter = () => ({ setDodgeModifier });

      jabsBattler.executeDodgeSkill(buildDodgeSkill());

      expect(jabsBattler.getDodgeIFrames()).toEqual([ 1, 5 ]);
      expect(jabsBattler.isInvincible()).toBe(true);
      expect(setDodgeModifier).toHaveBeenCalledWith(2);
      expect(jabsBattler.getDodgeSteps()).toBe(3);
    });

    it('uses the forced direction when provided, bypassing move-type inference', () =>
    {
      const jabsBattler = buildDodgingBattler();
      jabsBattler.getCharacter = () => ({ setDodgeModifier: vi.fn() });

      jabsBattler.executeDodgeSkill(buildDodgeSkill(), 6);

      expect(jabsBattler.getDodgeDirection()).toBe(6);
      expect(jabsBattler.determineDodgeDirection).not.toHaveBeenCalled();
    });

    it('infers the direction from move type when no forced direction is given', () =>
    {
      const jabsBattler = buildDodgingBattler();
      jabsBattler.getCharacter = () => ({ setDodgeModifier: vi.fn() });

      jabsBattler.executeDodgeSkill(buildDodgeSkill({ jabsMoveType: 'forward' }));

      expect(jabsBattler.determineDodgeDirection).toHaveBeenCalledWith('forward');
      expect(jabsBattler.getDodgeDirection()).toBe(2);
    });

    it('infers the direction from move type when the forced direction is explicitly null', () =>
    {
      // Arrange
      const jabsBattler = buildDodgingBattler();
      jabsBattler.getCharacter = () => ({ setDodgeModifier: vi.fn() });

      // Act
      // a null forced direction is an absent one- it must never become the dodge direction.
      jabsBattler.executeDodgeSkill(buildDodgeSkill({ jabsMoveType: 'backward' }), null);

      // Assert
      expect(jabsBattler.determineDodgeDirection).toHaveBeenCalledWith('backward');
      expect(jabsBattler.getDodgeDirection()).toBe(2);
    });

    it('executes the built actions and flags the battler as dodging', () =>
    {
      const action = { setCooldownType: vi.fn() };
      const jabsBattler = buildDodgingBattler({ createJabsActionFromSkill: vi.fn(() => [ action ]) });
      jabsBattler.getCharacter = () => ({ setDodgeModifier: vi.fn() });

      jabsBattler.executeDodgeSkill(buildDodgeSkill());

      expect(action.setCooldownType).toHaveBeenCalledWith(JABS_Button.Dodge);
      expect(globalThis.$jabsEngine.executeMapActions).toHaveBeenCalledWith(jabsBattler, [ action ]);
      expect(jabsBattler.isDodging()).toBe(true);
    });
  });

  describe('tryExecuteAiEmergencyDodgeAwayFrom', () =>
  {
    function buildEmergencyDodgeableBattler(overrides = {})
    {
      const jabsBattler = buildBattler();
      jabsBattler.getBattler = () => ({ getResolvedSkillId: () => 1, canPaySkillCost: () => true });
      jabsBattler.canExecuteSkill = () => true;
      jabsBattler.getSkill = () => ({ id: 1 });
      jabsBattler.executeDodgeSkill = vi.fn();
      Object.assign(jabsBattler, overrides);
      return jabsBattler;
    }

    it('is false without a resolved dodge skill id', () =>
    {
      const jabsBattler = buildEmergencyDodgeableBattler({
        getBattler: () => ({ getResolvedSkillId: () => 0 }),
      });

      expect(jabsBattler.tryExecuteAiEmergencyDodgeAwayFrom('threat')).toBe(false);
    });

    it('is false when the resolved skill is not actually a dodge skill', () =>
    {
      JABS_Battler.isDodgeSkillById = vi.fn(() => false);
      const jabsBattler = buildEmergencyDodgeableBattler();

      expect(jabsBattler.tryExecuteAiEmergencyDodgeAwayFrom('threat')).toBe(false);
    });

    it('is false when the skill cannot currently be executed', () =>
    {
      JABS_Battler.isDodgeSkillById = vi.fn(() => true);
      const jabsBattler = buildEmergencyDodgeableBattler({ canExecuteSkill: () => false });

      expect(jabsBattler.tryExecuteAiEmergencyDodgeAwayFrom('threat')).toBe(false);
    });

    it('is false when the cost cannot be paid', () =>
    {
      JABS_Battler.isDodgeSkillById = vi.fn(() => true);
      const jabsBattler = buildEmergencyDodgeableBattler({
        getBattler: () => ({ getResolvedSkillId: () => 1, canPaySkillCost: () => false }),
      });

      expect(jabsBattler.tryExecuteAiEmergencyDodgeAwayFrom('threat')).toBe(false);
    });

    it('executes the dodge away from the threat and reports true', () =>
    {
      JABS_Battler.isDodgeSkillById = vi.fn(() => true);
      const jabsBattler = buildEmergencyDodgeableBattler();
      jabsBattler.getCharacter = () => ({
        findDirectionTo: () => 8,
        reverseDir: (dir) => (dir === 8 ? 2 : dir),
      });
      const threatBattler = { getCharacter: () => ({ x: 1, y: 1 }) };

      const result = jabsBattler.tryExecuteAiEmergencyDodgeAwayFrom(threatBattler);

      expect(result).toBe(true);
      expect(jabsBattler.executeDodgeSkill).toHaveBeenCalledWith({ id: 1 }, 2);
    });
  });

  describe('canDirectionalDodgeStepPass', () =>
  {
    it('checks diagonal passability for a diagonal direction', () =>
    {
      const jabsBattler = buildBattler();
      const canPassDiagonally = vi.fn(() => true);
      const character = {
        _x: 1, _y: 1,
        isDiagonalDirection: () => true,
        getDiagonalDirections: () => [ 6, 8 ],
        canPassDiagonally,
      };

      expect(jabsBattler.canDirectionalDodgeStepPass(character, 9)).toBe(true);
      expect(canPassDiagonally).toHaveBeenCalledWith(1, 1, 6, 8);
    });

    it('checks cardinal passability for a cardinal direction', () =>
    {
      const jabsBattler = buildBattler();
      const canPass = vi.fn(() => true);
      const character = { _x: 1, _y: 1, isDiagonalDirection: () => false, canPass };

      expect(jabsBattler.canDirectionalDodgeStepPass(character, 8)).toBe(true);
      expect(canPass).toHaveBeenCalledWith(1, 1, 8);
    });
  });

  describe('buildDirectionalDodgeScores', () =>
  {
    it('scores each of the eight directions and sorts best-alignment-first', () =>
    {
      const scored = JABS_Battler.buildDirectionalDodgeScores(0, 1);

      expect(scored).toHaveLength(8);
      // fleeing straight down (uy=1) should score DOWN highest.
      expect(scored[0].d).toBe(J.ABS.Directions.DOWN);
      expect(scored[0].s).toBe(1);
    });
  });

  describe('pickAiDirectionalDodgeDirection', () =>
  {
    it('falls back to the character\'s current facing without any threat', async () =>
    {
      const { default: JABS_AiManager } = await import('../../../../../src/plugins/abs/core/managers/JABS_AiManager.js');
      JABS_AiManager.getClosestOpposingBattler = vi.fn(() => null);
      JABS_AiManager.findDefensiveThreatBattler = vi.fn(() => null);
      const jabsBattler = buildBattler();
      jabsBattler.getCharacter = () => ({ direction: () => 2 });

      expect(jabsBattler.pickAiDirectionalDodgeDirection()).toBe(2);
    });

    it('falls back to current facing when the threat is dead', async () =>
    {
      const { default: JABS_AiManager } = await import('../../../../../src/plugins/abs/core/managers/JABS_AiManager.js');
      JABS_AiManager.getClosestOpposingBattler = vi.fn(() => ({ isDead: () => true }));
      const jabsBattler = buildBattler();
      jabsBattler.getCharacter = () => ({ direction: () => 4 });

      expect(jabsBattler.pickAiDirectionalDodgeDirection()).toBe(4);
    });

    it('reverses current facing when standing exactly on top of the threat', async () =>
    {
      const { default: JABS_AiManager } = await import('../../../../../src/plugins/abs/core/managers/JABS_AiManager.js');
      const threat = { isDead: () => false, getX: () => 5, getY: () => 5 };
      JABS_AiManager.getClosestOpposingBattler = vi.fn(() => threat);
      const jabsBattler = buildBattler();
      jabsBattler.getCharacter = () => ({ x: 5, y: 5, direction: () => 2, reverseDir: () => 8 });

      expect(jabsBattler.pickAiDirectionalDodgeDirection()).toBe(8);
    });

    it('picks the best-scoring passable direction away from the threat', async () =>
    {
      const { default: JABS_AiManager } = await import('../../../../../src/plugins/abs/core/managers/JABS_AiManager.js');
      const threat = { isDead: () => false, getX: () => 0, getY: () => 5 };
      JABS_AiManager.getClosestOpposingBattler = vi.fn(() => threat);
      const jabsBattler = buildBattler();
      // battler is above the threat (y=0 vs threat y=5), so "away" is further up (UP direction).
      jabsBattler.getCharacter = () => ({ x: 0, y: 0, direction: () => 2 });
      jabsBattler.canDirectionalDodgeStepPass = vi.fn(() => true);

      expect(jabsBattler.pickAiDirectionalDodgeDirection()).toBe(J.ABS.Directions.UP);
    });

    it('relaxes the alignment floor when the best-aligned directions are all blocked', async () =>
    {
      const { default: JABS_AiManager } = await import('../../../../../src/plugins/abs/core/managers/JABS_AiManager.js');
      const threat = { isDead: () => false, getX: () => 0, getY: () => 5 };
      JABS_AiManager.getClosestOpposingBattler = vi.fn(() => threat);
      const jabsBattler = buildBattler();
      // the current facing is deliberately not DOWN, so the fallback cannot masquerade as a pick.
      jabsBattler.getCharacter = () => ({
        x: 0,
        y: 0,
        direction: () => J.ABS.Directions.LEFT
      });
      // only the exact-opposite direction (toward the threat) is passable- forces the floor
      // all the way down to -999 before anything qualifies.
      jabsBattler.canDirectionalDodgeStepPass = vi.fn((character, dir) => dir === J.ABS.Directions.DOWN);

      expect(jabsBattler.pickAiDirectionalDodgeDirection()).toBe(J.ABS.Directions.DOWN);
    });

    it('falls back to current facing when nothing at all is passable', async () =>
    {
      const { default: JABS_AiManager } = await import('../../../../../src/plugins/abs/core/managers/JABS_AiManager.js');
      const threat = { isDead: () => false, getX: () => 0, getY: () => 5 };
      JABS_AiManager.getClosestOpposingBattler = vi.fn(() => threat);
      const jabsBattler = buildBattler();
      jabsBattler.getCharacter = () => ({ x: 0, y: 0, direction: () => 6 });
      jabsBattler.canDirectionalDodgeStepPass = vi.fn(() => false);

      expect(jabsBattler.pickAiDirectionalDodgeDirection()).toBe(6);
    });

    it('settles for the middle relaxed-alignment tier (-0.2 floor) when the best-aligned directions are all blocked but a perpendicular direction is passable', async () =>
    {
      const { default: JABS_AiManager } = await import('../../../../../src/plugins/abs/core/managers/JABS_AiManager.js');
      const threat = { isDead: () => false, getX: () => 5, getY: () => 0 };
      JABS_AiManager.getClosestOpposingBattler = vi.fn(() => threat);
      const jabsBattler = buildBattler();
      // battler is left of the threat (x=0 vs threat x=5), so "away" is pure -x: LEFT/UPPERLEFT/
      // LOWERLEFT score highest (1), UP/DOWN score 0 (perpendicular), RIGHT-ish score lowest (-1).
      jabsBattler.getCharacter = () => ({ x: 0, y: 0, direction: () => 6 });
      // block every top-scoring (best-aligned) direction, but leave the perpendicular UP passable-
      // this forces the floor down to -0.2 (since UP's score of 0 fails the initial 0.01 floor)
      // without ever reaching the final -999 floor.
      jabsBattler.canDirectionalDodgeStepPass = vi.fn((character, dir) => dir === J.ABS.Directions.UP);

      expect(jabsBattler.pickAiDirectionalDodgeDirection()).toBe(J.ABS.Directions.UP);
    });
  });

  describe('determineDodgeDirection', () =>
  {
    beforeEach(() =>
    {
      J.ABS.Notetags = { MoveType: { Forward: 'forward', Backward: 'backward', Directional: 'directional' } };
    });

    it('returns the character\'s current facing for a forward dodge', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.getCharacter = () => ({ direction: () => 2 });

      expect(jabsBattler.determineDodgeDirection('forward')).toBe(2);
    });

    it('returns the reversed facing for a backward dodge', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.getCharacter = () => ({ direction: () => 2, reverseDir: () => 8 });

      expect(jabsBattler.determineDodgeDirection('backward')).toBe(8);
    });

    it('returns the current facing for a directional player dodge with no input', () =>
    {
      globalThis.Input = { dir8: 0 };
      const jabsBattler = buildBattler();
      jabsBattler.getCharacter = () => ({ isPlayer: () => true, direction: () => 4 });

      expect(jabsBattler.determineDodgeDirection('directional')).toBe(4);
    });

    it('returns the raw input direction for a directional player dodge with input', () =>
    {
      globalThis.Input = { dir8: 6 };
      const jabsBattler = buildBattler();
      jabsBattler.getCharacter = () => ({ isPlayer: () => true, direction: () => 4 });

      expect(jabsBattler.determineDodgeDirection('directional')).toBe(6);
    });

    it('delegates to the ai picker for a directional non-player dodge', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.getCharacter = () => ({ isPlayer: () => false });
      jabsBattler.pickAiDirectionalDodgeDirection = vi.fn(() => 9);

      expect(jabsBattler.determineDodgeDirection('directional')).toBe(9);
    });

    it('falls back to current facing for an unrecognized move type', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.getCharacter = () => ({ direction: () => 2 });

      expect(jabsBattler.determineDodgeDirection('unknown')).toBe(2);
    });
  });
  //endregion dodging

  //region guarding
  describe('parrying / setParryWindow', () =>
  {
    it('parrying reflects a positive parry window', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler._parryWindow = 0;
      expect(jabsBattler.parrying()).toBe(false);

      jabsBattler._parryWindow = 5;
      expect(jabsBattler.parrying()).toBe(true);
    });

    it('setParryWindow clamps negative values to 0', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.setParryWindow(-5);

      expect(jabsBattler._parryWindow).toBe(0);
    });

    it('setParryWindow stores non-negative values as-is', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.setParryWindow(10);

      expect(jabsBattler._parryWindow).toBe(10);
    });
  });

  describe('guarding flag and reductions', () =>
  {
    it('tracks the guarding flag', () =>
    {
      const jabsBattler = buildBattler();
      expect(jabsBattler.guarding()).toBe(false);

      jabsBattler.setGuarding(true);

      expect(jabsBattler.guarding()).toBe(true);
    });

    it('flatGuardReduction is 0 while not guarding', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.setFlatGuardReduction(5);
      jabsBattler.setGuarding(false);

      expect(jabsBattler.flatGuardReduction()).toBe(0);
    });

    it('flatGuardReduction returns the tracked value while guarding', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.setFlatGuardReduction(5);
      jabsBattler.setGuarding(true);

      expect(jabsBattler.flatGuardReduction()).toBe(5);
    });

    it('percGuardReduction is 0 while not guarding', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.setPercGuardReduction(50);
      jabsBattler.setGuarding(false);

      expect(jabsBattler.percGuardReduction()).toBe(0);
    });

    it('percGuardReduction returns the tracked value while guarding', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.setPercGuardReduction(50);
      jabsBattler.setGuarding(true);

      expect(jabsBattler.percGuardReduction()).toBe(50);
    });
  });

  describe('counter-guard / counter-parry ids', () =>
  {
    it('counterGuard is empty while not guarding', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.setCounterGuard([ 1, 2 ]);
      jabsBattler.setGuarding(false);

      expect(jabsBattler.counterGuard()).toEqual([]);
    });

    it('counterGuard returns the tracked ids while guarding', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.setCounterGuard([ 1, 2 ]);
      jabsBattler.setGuarding(true);

      expect(jabsBattler.counterGuard()).toEqual([ 1, 2 ]);
    });

    it('counterParry is empty while not guarding', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.setCounterParry([ 3 ]);
      jabsBattler.setGuarding(false);

      expect(jabsBattler.counterParry()).toEqual([]);
    });

    it('counterParry returns the tracked ids while guarding', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.setCounterParry([ 3 ]);
      jabsBattler.setGuarding(true);

      expect(jabsBattler.counterParry()).toEqual([ 3 ]);
    });
  });

  describe('getGuardSkillId / setGuardSkillId', () =>
  {
    it('tracks the guard skill id', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.setGuardSkillId(7);

      expect(jabsBattler.getGuardSkillId()).toBe(7);
    });
  });

  describe('getGuardData', () =>
  {
    it('returns null without a resolved guard skill id', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.getBattler = () => ({ getGuardSkillId: () => 0 });

      expect(jabsBattler.getGuardData()).toBeNull();
    });

    it('returns null when the resolved skill is not a guard skill', () =>
    {
      JABS_Battler.isGuardSkillById = vi.fn(() => false);
      const jabsBattler = buildBattler();
      jabsBattler.getBattler = () => ({ getGuardSkillId: () => 1 });

      expect(jabsBattler.getGuardData()).toBeNull();
    });

    it('returns null when the skill conditions are not met', () =>
    {
      JABS_Battler.isGuardSkillById = vi.fn(() => true);
      const jabsBattler = buildBattler();
      jabsBattler.getBattler = () => ({
        getGuardSkillId: () => 1, meetsSkillConditions: () => false,
      });
      jabsBattler.getSkill = () => ({ jabsGuardData: 'guard-data' });

      expect(jabsBattler.getGuardData()).toBeNull();
    });

    it('returns the skill\'s guard data when everything checks out', () =>
    {
      JABS_Battler.isGuardSkillById = vi.fn(() => true);
      const jabsBattler = buildBattler();
      jabsBattler.getBattler = () => ({
        getGuardSkillId: () => 1, meetsSkillConditions: () => true,
      });
      jabsBattler.getSkill = () => ({ jabsGuardData: 'guard-data' });

      expect(jabsBattler.getGuardData()).toBe('guard-data');
    });
  });

  describe('isGuardSkillEquipped', () =>
  {
    it('is false without a resolved guard skill id', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.getGuardData = () => null;

      expect(jabsBattler.isGuardSkillEquipped()).toBe(false);
    });

    it('is true when guard data resolves', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.getGuardData = () => ({ canGuard: () => true });

      expect(jabsBattler.isGuardSkillEquipped()).toBe(true);
    });
  });

  describe('executeGuard', () =>
  {
    it('does nothing when already guarding and asked to guard again', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.guarding = () => true;
      jabsBattler.endGuarding = vi.fn();
      jabsBattler.startGuarding = vi.fn();

      jabsBattler.executeGuard(true);

      expect(jabsBattler.endGuarding).not.toHaveBeenCalled();
      expect(jabsBattler.startGuarding).not.toHaveBeenCalled();
    });

    it('ends guarding when asked to stop while currently guarding', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.guarding = () => true;
      jabsBattler.endGuarding = vi.fn();
      jabsBattler.startGuarding = vi.fn();

      jabsBattler.executeGuard(false);

      expect(jabsBattler.endGuarding).toHaveBeenCalledTimes(1);
      expect(jabsBattler.startGuarding).not.toHaveBeenCalled();
    });

    it('does nothing when asked to stop while already not guarding', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.guarding = () => false;
      jabsBattler.endGuarding = vi.fn();
      jabsBattler.startGuarding = vi.fn();

      jabsBattler.executeGuard(false);

      expect(jabsBattler.endGuarding).not.toHaveBeenCalled();
    });

    it('does not start guarding without valid guard data', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.guarding = () => false;
      jabsBattler.getGuardData = () => null;
      jabsBattler.startGuarding = vi.fn();

      jabsBattler.executeGuard(true);

      expect(jabsBattler.startGuarding).not.toHaveBeenCalled();
    });

    it('does not start guarding when the guard data reports it cannot guard', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.guarding = () => false;
      jabsBattler.getGuardData = () => ({ canGuard: () => false });
      jabsBattler.startGuarding = vi.fn();

      jabsBattler.executeGuard(true);

      expect(jabsBattler.startGuarding).not.toHaveBeenCalled();
    });

    it('starts guarding when not currently guarding and the guard data allows it', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.guarding = () => false;
      jabsBattler.getGuardData = () => ({ canGuard: () => true });
      jabsBattler.startGuarding = vi.fn();

      jabsBattler.executeGuard(true);

      expect(jabsBattler.startGuarding).toHaveBeenCalledWith();
    });
  });

  describe('startGuarding', () =>
  {
    function buildGuardData(overrides = {})
    {
      return Object.assign({
        flatGuardReduction: 5,
        percGuardReduction: 50,
        counterGuardIds: [ 1 ],
        counterParryIds: [ 2 ],
        skillId: 7,
        parryDuration: 10,
        canParry: () => false,
      }, overrides);
    }

    it('applies all guard data fields to the battler', () =>
    {
      const jabsBattler = buildBattler();
      const guardData = buildGuardData();
      jabsBattler.getGuardData = () => guardData;
      jabsBattler.getBonusParryFrames = () => 0;

      jabsBattler.startGuarding();

      expect(jabsBattler.guarding()).toBe(true);
      expect(jabsBattler.flatGuardReduction()).toBe(5);
      expect(jabsBattler.percGuardReduction()).toBe(50);
      expect(jabsBattler.counterGuard()).toEqual([ 1 ]);
      expect(jabsBattler.counterParry()).toEqual([ 2 ]);
      expect(jabsBattler.getGuardSkillId()).toBe(7);
    });

    it('applies the parry window when the guard data supports parrying', () =>
    {
      const jabsBattler = buildBattler();
      const guardData = buildGuardData({ canParry: () => true, parryDuration: 10 });
      jabsBattler.getGuardData = () => guardData;
      jabsBattler.getBonusParryFrames = () => 5;

      jabsBattler.startGuarding();

      expect(jabsBattler._parryWindow).toBe(15);
    });

    it('does not apply a parry window when the guard data does not support parrying', () =>
    {
      const jabsBattler = buildBattler();
      const guardData = buildGuardData({ canParry: () => false });
      jabsBattler.getGuardData = () => guardData;
      jabsBattler.getBonusParryFrames = () => 5;

      jabsBattler.startGuarding();

      expect(jabsBattler._parryWindow).toBe(0);
    });
  });

  describe('endGuarding', () =>
  {
    it('clears guarding, ally guard timing, and parry window, and stops posing', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.setGuarding(true);
      jabsBattler._aiAllyGuardRaiseFrame = 100;
      jabsBattler._parryWindow = 10;
      jabsBattler.endAnimation = vi.fn();

      jabsBattler.endGuarding();

      expect(jabsBattler.guarding()).toBe(false);
      expect(jabsBattler._aiAllyGuardRaiseFrame).toBe(0);
      expect(jabsBattler._parryWindow).toBe(0);
      expect(jabsBattler.endAnimation).toHaveBeenCalledTimes(1);
    });
  });

  describe('getBonusParryFrames', () =>
  {
    it('scales parry duration by 1 plus the battler\'s per stat', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.getBattler = () => ({ per: 0.5 });

      expect(jabsBattler.getBonusParryFrames({ parryDuration: 10 })).toBe(15);
    });
  });

  describe('countdownParryWindow', () =>
  {
    it('decrements the parry window while parrying', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler._parryWindow = 5;

      jabsBattler.countdownParryWindow();

      expect(jabsBattler._parryWindow).toBe(4);
    });

    it('does not decrement when not parrying', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler._parryWindow = 0;

      jabsBattler.countdownParryWindow();

      expect(jabsBattler._parryWindow).toBe(0);
    });

    it('clamps to 0 if it somehow goes negative', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler._parryWindow = -1;

      jabsBattler.countdownParryWindow();

      expect(jabsBattler._parryWindow).toBe(0);
    });
  });
  //endregion guarding

  //region map: connection/scope/action-building
  describe('canActionConnect', () =>
  {
    function buildConnectableBattler(overrides = {})
    {
      const jabsBattler = buildBattler();
      jabsBattler.isInvincible = () => false;
      jabsBattler.getCharacter = () => ({ isJabsAction: () => false });
      jabsBattler.isFollower = () => false;
      Object.assign(jabsBattler, overrides);
      return jabsBattler;
    }

    it('is false while invincible', () =>
    {
      expect(buildConnectableBattler({ isInvincible: () => true }).canActionConnect()).toBe(false);
    });

    it('is false for a jabs action event itself', () =>
    {
      const jabsBattler = buildConnectableBattler();
      jabsBattler.getCharacter = () => ({ isJabsAction: () => true });

      expect(jabsBattler.canActionConnect()).toBe(false);
    });

    it('is false for an invisible follower', () =>
    {
      const jabsBattler = buildConnectableBattler({ isFollower: () => true });
      jabsBattler.getCharacter = () => ({ isJabsAction: () => false, isVisible: () => false });

      expect(jabsBattler.canActionConnect()).toBe(false);
    });

    it('is true for a visible follower', () =>
    {
      const jabsBattler = buildConnectableBattler({ isFollower: () => true });
      jabsBattler.getCharacter = () => ({ isJabsAction: () => false, isVisible: () => true });

      expect(jabsBattler.canActionConnect()).toBe(true);
    });

    it('is true otherwise', () =>
    {
      expect(buildConnectableBattler().canActionConnect()).toBe(true);
    });
  });

  describe('isWithinScope', () =>
  {
    function buildGameAction(overrides = {})
    {
      return Object.assign({
        isForFriend: () => false,
        isForOpponent: () => false,
        isForOne: () => false,
        isForUser: () => false,
        isForAll: () => false,
        isForEveryone: () => false,
      }, overrides);
    }

    function buildActionAndUser(gameActionOverrides = {}, userOverrides = {})
    {
      const user = Object.assign({ getUuid: () => 'user-uuid', getTeam: () => 0 }, userOverrides);
      const gameAction = buildGameAction(gameActionOverrides);
      const action = {
        getCaster: () => user,
        getAction: () => gameAction,
        isDirectAction: () => false,
      };
      return { action, user, gameAction };
    }

    it('is false for a single-scope action that already hit one target', () =>
    {
      const jabsBattler = buildBattler();
      const { action } = buildActionAndUser({ isForOne: () => true });
      const target = { getUuid: () => 'target-uuid', isInanimate: () => false };

      expect(jabsBattler.isWithinScope(action, target, true)).toBe(false);
    });

    it('is true when the target is the caster and the scope is self', () =>
    {
      const jabsBattler = buildBattler();
      const { action, user } = buildActionAndUser({ isForUser: () => true });

      expect(jabsBattler.isWithinScope(action, user)).toBe(true);
    });

    it('refuses a single-scope action that already hit, even when the target would otherwise qualify', async () =>
    {
      // Arrange: the existing already-hit case arranges no scope that could have said yes, so the
      // action was going to be refused whether or not the single-target guard ran. Pair it with a
      // target the opponent scope genuinely covers, and the guard becomes the only thing standing
      // between one hit and a single-target skill sweeping a crowd.
      const { default: JABS_TeamRules } = await import('../../../../../src/plugins/abs/core/managers/JABS_TeamRules.js');
      JABS_TeamRules.isFriendly = vi.fn(() => false);
      JABS_TeamRules.isOpposed = vi.fn(() => true);
      const jabsBattler = buildBattler();
      const { action } = buildActionAndUser({
        isForOne: () => true,
        isForOpponent: () => true,
      });
      const target = {
        getUuid: () => 'target-uuid',
        isInanimate: () => false,
      };

      // Act
      const withinScope = jabsBattler.isWithinScope(action, target, true);

      // Assert
      expect(withinScope).toBe(false);
    });

    it('recognises the caster as the target by uuid, not only by an explicit self scope', async () =>
    {
      // Arrange: the self-scope case above sets isForUser, which makes the target read as the
      // caster on its own - so the uuid comparison beside it never has to work. An ally-scoped
      // heal aimed at the caster is the case that needs the comparison, and refusing it would
      // leave a healer unable to heal themselves.
      const { default: JABS_TeamRules } = await import('../../../../../src/plugins/abs/core/managers/JABS_TeamRules.js');
      JABS_TeamRules.isFriendly = vi.fn(() => false);
      JABS_TeamRules.isOpposed = vi.fn(() => false);
      const jabsBattler = buildBattler();
      const { action, user } = buildActionAndUser({ isForFriend: () => true });

      // Act
      const withinScope = jabsBattler.isWithinScope(action, user);

      // Assert
      expect(withinScope).toBe(true);

      // restore the team rules this file's later cases expect, rather than leaking them onward.
      JABS_TeamRules.isOpposed = vi.fn(() => true);
    });

    it('refuses the caster as the target when the action reaches neither allies nor self', async () =>
    {
      // Arrange: an opponent-scoped action aimed at its own caster, with nobody opposed. Nothing
      // here covers the caster, so the self branch must fall through rather than answer yes -
      // which is what keeps an offensive skill from detonating on the battler who cast it.
      const { default: JABS_TeamRules } = await import('../../../../../src/plugins/abs/core/managers/JABS_TeamRules.js');
      JABS_TeamRules.isFriendly = vi.fn(() => false);
      JABS_TeamRules.isOpposed = vi.fn(() => false);
      const jabsBattler = buildBattler();
      const { action, user } = buildActionAndUser({ isForOpponent: () => true });

      // Act
      const withinScope = jabsBattler.isWithinScope(action, user);

      // Assert
      expect(withinScope).toBe(false);

      // restore the team rules this file's later cases expect, rather than leaking them onward.
      JABS_TeamRules.isOpposed = vi.fn(() => true);
    });

    it('is true when the target is the caster and the scope is everyone, with no other scope flag set', () =>
    {
      const jabsBattler = buildBattler();
      const { action, user } = buildActionAndUser({ isForEveryone: () => true });

      expect(jabsBattler.isWithinScope(action, user)).toBe(true);
    });

    it('is true for an ally target from a same-team caster, excluding inanimate direct hits', async () =>
    {
      const { default: JABS_TeamRules } = await import('../../../../../src/plugins/abs/core/managers/JABS_TeamRules.js');
      JABS_TeamRules.isFriendly = vi.fn(() => true);
      const jabsBattler = buildBattler();
      jabsBattler._team = 0;
      const { action } = buildActionAndUser({ isForFriend: () => true });
      const target = { getUuid: () => 'target-uuid', isInanimate: () => false };

      expect(jabsBattler.isWithinScope(action, target)).toBe(true);
      JABS_TeamRules.isFriendly = vi.fn(() => false);
    });

    it('excludes an inanimate target from a direct ally-scoped action', async () =>
    {
      const { default: JABS_TeamRules } = await import('../../../../../src/plugins/abs/core/managers/JABS_TeamRules.js');
      JABS_TeamRules.isFriendly = vi.fn(() => true);
      const jabsBattler = buildBattler();
      const { gameAction } = buildActionAndUser({ isForFriend: () => true });
      const action = {
        getCaster: () => ({ getUuid: () => 'user-uuid', getTeam: () => 0 }),
        getAction: () => gameAction,
        isDirectAction: () => true,
      };
      const target = { getUuid: () => 'target-uuid', isInanimate: () => true };

      expect(jabsBattler.isWithinScope(action, target)).toBe(false);
      JABS_TeamRules.isFriendly = vi.fn(() => false);
    });

    it('is true for a same-team target when the caster is friendly and scope is everyone, with no ally flag set', async () =>
    {
      const { default: JABS_TeamRules } = await import('../../../../../src/plugins/abs/core/managers/JABS_TeamRules.js');
      JABS_TeamRules.isFriendly = vi.fn(() => true);
      const jabsBattler = buildBattler();
      const { action } = buildActionAndUser({ isForEveryone: () => true });
      const target = { getUuid: () => 'target-uuid', isInanimate: () => false };

      expect(jabsBattler.isWithinScope(action, target)).toBe(true);
      JABS_TeamRules.isFriendly = vi.fn(() => false);
    });

    it('is true for an opponent target when the caster is opposed and scope is opponent', async () =>
    {
      const { default: JABS_TeamRules } = await import('../../../../../src/plugins/abs/core/managers/JABS_TeamRules.js');
      JABS_TeamRules.isFriendly = vi.fn(() => false);
      JABS_TeamRules.isOpposed = vi.fn(() => true);
      const jabsBattler = buildBattler();
      const { action } = buildActionAndUser({ isForOpponent: () => true });
      const target = { getUuid: () => 'target-uuid', isInanimate: () => false };

      expect(jabsBattler.isWithinScope(action, target)).toBe(true);
      JABS_TeamRules.isOpposed = vi.fn(() => true);
    });

    it('is false when nothing about the target/scope combination qualifies', async () =>
    {
      const { default: JABS_TeamRules } = await import('../../../../../src/plugins/abs/core/managers/JABS_TeamRules.js');
      JABS_TeamRules.isFriendly = vi.fn(() => false);
      JABS_TeamRules.isOpposed = vi.fn(() => false);
      const jabsBattler = buildBattler();
      const { action } = buildActionAndUser({ isForOpponent: () => true });
      const target = { getUuid: () => 'target-uuid', isInanimate: () => false };

      expect(jabsBattler.isWithinScope(action, target)).toBe(false);
    });

    it('is false for an ally target when the action reaches only opponents', async () =>
    {
      // Arrange
      const { default: JABS_TeamRules } = await import('../../../../../src/plugins/abs/core/managers/JABS_TeamRules.js');
      // a friendly, animate, non-direct target- everything about the ally branch qualifies except
      // the scope itself, which is what keeps an offensive skill from mowing down the party.
      JABS_TeamRules.isFriendly = vi.fn(() => true);
      JABS_TeamRules.isOpposed = vi.fn(() => false);
      const jabsBattler = buildBattler();
      const { action } = buildActionAndUser({ isForOpponent: () => true });
      const target = {
        getUuid: () => 'target-uuid',
        isInanimate: () => false
      };

      // Act
      const withinScope = jabsBattler.isWithinScope(action, target);

      // Assert
      expect(withinScope).toBe(false);

      // restore the team rules this file's later cases expect, rather than leaking them onward.
      JABS_TeamRules.isFriendly = vi.fn(() => false);
      JABS_TeamRules.isOpposed = vi.fn(() => true);
    });
  });

  describe('createJabsActionFromSkill', () =>
  {
    beforeEach(() =>
    {
      globalThis.Game_Action = vi.fn(function()
      {
        this.setSkill = vi.fn();
        this.setResolvedCastTimeFrames = vi.fn();
      });
      globalThis.$jabsEngine = {
        resolveProjectileFormationForSkill: vi.fn(() => 'line'),
        resolveProjectileCountForSkill: vi.fn(() => 1),
        determineActionDirections: vi.fn(() => [ 2 ]),
      };
    });

    it('builds actions via the projectile direction conversion pipeline', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.getSkill = () => ({ id: 1 });
      jabsBattler.getProjectileSpawnBaseDirection = () => 2;
      const builtAction = { getCastTime: () => 10 };
      jabsBattler.convertProjectileDirectionsToActions = vi.fn(() => [ builtAction ]);

      const result = jabsBattler.createJabsActionFromSkill(1);

      expect(result).toEqual([ builtAction ]);
    });

    it('stamps the resolved cast time from the first generated action', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.getSkill = () => ({ id: 1 });
      jabsBattler.getProjectileSpawnBaseDirection = () => 2;
      const gameActionInstance = new globalThis.Game_Action();
      globalThis.Game_Action = vi.fn(function() { return gameActionInstance; }); // eslint-disable-line prefer-arrow-callback -- must stay new-able
      const builtAction = { getCastTime: () => 42 };
      jabsBattler.convertProjectileDirectionsToActions = vi.fn(() => [ builtAction ]);

      jabsBattler.createJabsActionFromSkill(1);

      expect(gameActionInstance.setResolvedCastTimeFrames).toHaveBeenCalledWith(42);
    });

    it('stamps 0 cast time when no actions were generated', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.getSkill = () => ({ id: 1 });
      jabsBattler.getProjectileSpawnBaseDirection = () => 2;
      const gameActionInstance = new globalThis.Game_Action();
      globalThis.Game_Action = vi.fn(function() { return gameActionInstance; }); // eslint-disable-line prefer-arrow-callback -- must stay new-able
      jabsBattler.convertProjectileDirectionsToActions = vi.fn(() => []);

      jabsBattler.createJabsActionFromSkill(1);

      expect(gameActionInstance.setResolvedCastTimeFrames).toHaveBeenCalledWith(0);
    });
  });

  describe('convertProjectileDirectionsToActions', () =>
  {
    it('delegates to JABS_ActionSpawner.buildVolley', async () =>
    {
      const { default: JABS_ActionSpawner } = await import('../../../../../src/plugins/abs/core/managers/JABS_ActionSpawner.js');
      JABS_ActionSpawner.buildVolley = vi.fn(() => [ 'built-action' ]);
      const jabsBattler = buildBattler();

      const result = jabsBattler.convertProjectileDirectionsToActions([ 2, 4 ], 'action', 'options');

      expect(result).toEqual([ 'built-action' ]);
      expect(JABS_ActionSpawner.buildVolley).toHaveBeenCalledWith(jabsBattler, [ 2, 4 ], 'action', 'options');
    });
  });

  describe('getProjectileSpawnBaseDirection', () =>
  {
    it('reads the character\'s current facing', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.getCharacter = () => ({ direction: () => 6 });

      expect(jabsBattler.getProjectileSpawnBaseDirection()).toBe(6);
    });
  });

  describe('battlerHasPermissionForSlot / getSkillIdForAction', () =>
  {
    it('battlerHasPermissionForSlot is true when a combo follow-up is queued', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.getComboNextActionId = () => 5;

      expect(jabsBattler.battlerHasPermissionForSlot('mainhand')).toBe(true);
    });

    it('battlerHasPermissionForSlot checks the raw equipped skill for the base slot', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.getComboNextActionId = () => 0;
      jabsBattler.getBattler = () => ({
        getEquippedSkillId: () => 3, hasSkill: (id) => id === 3,
      });

      expect(jabsBattler.battlerHasPermissionForSlot('mainhand')).toBe(true);
    });

    it('battlerHasPermissionForSlot is false when the raw equipped skill is not known', () =>
    {
      // Arrange
      const jabsBattler = buildBattler();
      // no combo is armed, so the equipped-skill check is the only thing that can answer.
      jabsBattler.getComboNextActionId = () => 0;
      jabsBattler.getBattler = () => ({
        getEquippedSkillId: () => 3,
        hasSkill: () => false
      });

      // Act
      const hasPermission = jabsBattler.battlerHasPermissionForSlot('mainhand');

      // Assert
      expect(hasPermission).toBe(false);
    });

    it('getSkillIdForAction returns the queued combo id when present', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.getComboNextActionId = () => 5;

      expect(jabsBattler.getSkillIdForAction('mainhand')).toBe(5);
    });

    it('getSkillIdForAction resolves via the battler when no combo is queued', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.getComboNextActionId = () => 0;
      jabsBattler.getBattler = () => ({ getResolvedSkillId: () => 9 });

      expect(jabsBattler.getSkillIdForAction('mainhand')).toBe(9);
    });
  });

  describe('getAttackData', () =>
  {
    function buildAttackableBattler(overrides = {})
    {
      const jabsBattler = buildBattler();
      jabsBattler.getBattler = () => ({
        meetsSkillConditions: () => true, skill: () => ({}),
      });
      jabsBattler.getSkillIdForAction = () => 1;
      jabsBattler.battlerHasPermissionForSlot = () => true;
      jabsBattler.getSkill = () => ({ id: 1, jabsDirect: false });
      jabsBattler.createJabsActionFromSkill = vi.fn(() => [ 'built-action' ]);
      Object.assign(jabsBattler, overrides);
      return jabsBattler;
    }

    it('returns an empty array without a resolved skill id', () =>
    {
      const jabsBattler = buildAttackableBattler({ getSkillIdForAction: () => 0 });

      expect(jabsBattler.getAttackData('mainhand')).toEqual([]);
    });

    it('returns an empty array when skill conditions are not met', () =>
    {
      const jabsBattler = buildAttackableBattler();
      jabsBattler.getBattler = () => ({ meetsSkillConditions: () => false, skill: () => ({}) });

      expect(jabsBattler.getAttackData('mainhand')).toEqual([]);
    });

    it('returns an empty array without slot permission', () =>
    {
      const jabsBattler = buildAttackableBattler({ battlerHasPermissionForSlot: () => false });

      expect(jabsBattler.getAttackData('mainhand')).toEqual([]);
    });

    it('builds the action from the resolved skill id and options', () =>
    {
      const jabsBattler = buildAttackableBattler();

      const result = jabsBattler.getAttackData('mainhand');

      expect(result).toEqual([ 'built-action' ]);
      expect(jabsBattler.createJabsActionFromSkill).toHaveBeenCalledWith(1, expect.anything());
    });

    it('freezes a direct-skill location when decision-time coordinates resolve', () =>
    {
      const jabsBattler = buildAttackableBattler({
        getSkill: () => ({ id: 1, jabsDirect: true, jabsDirectLock: false }),
      });
      jabsBattler.resolveDirectActionTargetCoordinatesForSkill = vi.fn(() => [ 3, 4 ]);

      jabsBattler.getAttackData('mainhand');

      const [ [ , actionOptions ] ] = jabsBattler.createJabsActionFromSkill.mock.calls;
      expect(actionOptions.location.getX()).toBe(3);
      expect(actionOptions.location.getY()).toBe(4);
    });

    it('does not freeze a location for a direct-locked skill', () =>
    {
      const jabsBattler = buildAttackableBattler({
        getSkill: () => ({ id: 1, jabsDirect: true, jabsDirectLock: true }),
      });
      jabsBattler.resolveDirectActionTargetCoordinatesForSkill = vi.fn();

      jabsBattler.getAttackData('mainhand');

      expect(jabsBattler.resolveDirectActionTargetCoordinatesForSkill).not.toHaveBeenCalled();
    });

    it('does not freeze a location when decision-time coordinates fail to resolve', () =>
    {
      const jabsBattler = buildAttackableBattler({
        getSkill: () => ({ id: 1, jabsDirect: true, jabsDirectLock: false }),
      });
      jabsBattler.resolveDirectActionTargetCoordinatesForSkill = vi.fn(() => [ null, null ]);

      jabsBattler.getAttackData('mainhand');

      const [ [ , actionOptions ] ] = jabsBattler.createJabsActionFromSkill.mock.calls;
      expect(actionOptions.location).toBeUndefined();
    });
  });
  //endregion map: connection/scope/action-building

  //region map: tool/item effects
  describe('applyToolItemEffects', () =>
  {
    function buildToolItem(overrides = {})
    {
      return Object.assign({ id: 5, scope: 1, jabsCooldown: 0, jabsSkillId: 0 }, overrides);
    }

    function buildToolableBattler(overrides = {})
    {
      const jabsBattler = buildBattler();
      const clearSlot = vi.fn();
      const flagSkillSlotForRefresh = vi.fn();
      jabsBattler.getBattler = () => ({
        consumeItem: vi.fn(),
        getSkillSlotManager: () => ({
          getSkillSlotByKey: () => ({ flagSkillSlotForRefresh }),
          clearSlot,
        }),
      });
      jabsBattler.createToolLog = vi.fn();
      jabsBattler.applyToolToPlayer = vi.fn();
      jabsBattler.applyToolForAllAllies = vi.fn();
      jabsBattler.applyToolForAllOpponents = vi.fn();
      jabsBattler.applyToolForOneOpponent = vi.fn();
      jabsBattler.modCooldownCounter = vi.fn();
      Object.assign(jabsBattler, overrides);
      return jabsBattler;
    }

    function buildGameActionMock(overrides = {})
    {
      const gameAction = Object.assign({
        setItem: vi.fn(),
        item: () => ({ scope: 1 }),
        isForUser: () => false,
        isForFriend: () => false,
        isForOpponent: () => false,
        isForOne: () => false,
        isForAll: () => false,
        isForEveryone: () => false,
        applyGlobal: vi.fn(),
      }, overrides);
      globalThis.Game_Action = vi.fn(function() { return gameAction; }); // eslint-disable-line prefer-arrow-callback -- must stay new-able
      return gameAction;
    }

    beforeEach(() =>
    {
      globalThis.$dataItems = [];
      globalThis.$dataItems[5] = buildToolItem();
      globalThis.$gameParty = { items: () => [] };
      globalThis.J.ABS.DefaultValues = { CooldownlessItems: 60 };
      globalThis.LootLogBuilder = vi.fn(function()
      {
        this.setupUsedLastItem = vi.fn().mockReturnThis();
        this.build = vi.fn(() => ({ built: true }));
      });
      globalThis.$mapLogs = { loot: { addLog: vi.fn() } };
    });

    it('applies to self for a self-scoped tool', () =>
    {
      buildGameActionMock({ isForUser: () => true });
      const jabsBattler = buildToolableBattler();

      jabsBattler.applyToolItemEffects(5, JABS_Button.Tool);

      expect(jabsBattler.applyToolToPlayer).toHaveBeenCalledWith(5);
    });

    it('applies to self for a single-ally-scoped tool', () =>
    {
      buildGameActionMock({ isForOne: () => true, isForFriend: () => true });
      const jabsBattler = buildToolableBattler();

      jabsBattler.applyToolItemEffects(5, JABS_Button.Tool);

      expect(jabsBattler.applyToolToPlayer).toHaveBeenCalledWith(5);
    });

    it('applies to all allies and all opponents for an everyone-scoped tool', () =>
    {
      buildGameActionMock({ isForEveryone: () => true });
      const jabsBattler = buildToolableBattler();

      jabsBattler.applyToolItemEffects(5, JABS_Button.Tool);

      expect(jabsBattler.applyToolForAllAllies).toHaveBeenCalledWith(5);
      expect(jabsBattler.applyToolForAllOpponents).toHaveBeenCalledWith(5);
    });

    it('applies to one opponent for a single-opponent-scoped tool', () =>
    {
      buildGameActionMock({ isForOne: () => true, isForOpponent: () => true });
      const jabsBattler = buildToolableBattler();

      jabsBattler.applyToolItemEffects(5, JABS_Button.Tool);

      expect(jabsBattler.applyToolForOneOpponent).toHaveBeenCalledWith(5);
    });

    it('applies to all allies for an all-ally-scoped tool', () =>
    {
      buildGameActionMock({ isForAll: () => true, isForFriend: () => true });
      const jabsBattler = buildToolableBattler();

      jabsBattler.applyToolItemEffects(5, JABS_Button.Tool);

      expect(jabsBattler.applyToolForAllAllies).toHaveBeenCalledWith(5);
    });

    it('applies to all opponents for an all-opponent-scoped tool', () =>
    {
      buildGameActionMock({ isForAll: () => true, isForOpponent: () => true });
      const jabsBattler = buildToolableBattler();

      jabsBattler.applyToolItemEffects(5, JABS_Button.Tool);

      expect(jabsBattler.applyToolForAllOpponents).toHaveBeenCalledWith(5);
    });

    it('does nothing extra for a no-scope tool relying purely on its skill id', () =>
    {
      // Arrange
      buildGameActionMock({ item: () => ({ scope: 0 }) });
      const jabsBattler = buildToolableBattler();
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      // Act
      jabsBattler.applyToolItemEffects(5, JABS_Button.Tool);

      // Assert
      expect(jabsBattler.applyToolToPlayer).not.toHaveBeenCalled();
      // a scopeless item is a recognized shape, not an unhandled one.
      expect(warnSpy).not.toHaveBeenCalled();
      // the tool log proves the method ran all the way through rather than bailing early.
      expect(jabsBattler.createToolLog).toHaveBeenCalledTimes(1);
      warnSpy.mockRestore();
    });

    it('warns about an unhandled scope combination', () =>
    {
      buildGameActionMock({ item: () => ({ scope: 99 }) });
      const jabsBattler = buildToolableBattler();
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      jabsBattler.applyToolItemEffects(5, JABS_Button.Tool);

      expect(warnSpy).toHaveBeenCalled();
      warnSpy.mockRestore();
    });

    it('executes an attached skill and stamps the cooldown type with the given button type', () =>
    {
      buildGameActionMock({ isForUser: () => true });
      globalThis.$dataItems[5] = buildToolItem({ jabsSkillId: 7 });
      globalThis.$jabsEngine = { executeMapAction: vi.fn() };
      const action = { setCooldownType: vi.fn() };
      const jabsBattler = buildToolableBattler();
      jabsBattler.createJabsActionFromSkill = vi.fn(() => [ action ]);

      jabsBattler.applyToolItemEffects(5, JABS_Button.Tool);

      expect(action.setCooldownType).toHaveBeenCalledWith(JABS_Button.Tool);
      expect(globalThis.$jabsEngine.executeMapAction).toHaveBeenCalledWith(jabsBattler, action);
    });

    it('clears the given button type\'s slot and logs when the last copy of the item was consumed', () =>
    {
      buildGameActionMock({ isForUser: () => true });
      globalThis.$gameParty = { items: () => [] };
      const clearSlot = vi.fn();
      const jabsBattler = buildToolableBattler();
      jabsBattler.getBattler = () => ({
        consumeItem: vi.fn(),
        getSkillSlotManager: () => ({ getSkillSlotByKey: () => ({ flagSkillSlotForRefresh: vi.fn() }), clearSlot }),
      });

      jabsBattler.applyToolItemEffects(5, JABS_Button.Tool);

      expect(clearSlot).toHaveBeenCalledWith(JABS_Button.Tool);
      expect(globalThis.$mapLogs.loot.addLog).toHaveBeenCalledWith({ built: true });
    });

    it('applies the item\'s custom cooldown when copies remain and it is not loot', () =>
    {
      buildGameActionMock({ isForUser: () => true });
      globalThis.$dataItems[5] = buildToolItem({ jabsCooldown: 30 });
      globalThis.$gameParty = { items: () => [ globalThis.$dataItems[5] ] };
      const jabsBattler = buildToolableBattler();

      jabsBattler.applyToolItemEffects(5, JABS_Button.Tool, false);

      expect(jabsBattler.modCooldownCounter).toHaveBeenCalledWith(JABS_Button.Tool, 30);
      // the custom cooldown is the only one applied; the cooldownless default must not stack on it.
      expect(jabsBattler.modCooldownCounter).toHaveBeenCalledTimes(1);
    });

    it('does not apply a cooldown for loot pickups even with copies remaining', () =>
    {
      buildGameActionMock({ isForUser: () => true });
      globalThis.$dataItems[5] = buildToolItem({ jabsCooldown: 30 });
      globalThis.$gameParty = { items: () => [ globalThis.$dataItems[5] ] };
      const jabsBattler = buildToolableBattler();

      jabsBattler.applyToolItemEffects(5, JABS_Button.Tool, true);

      expect(jabsBattler.modCooldownCounter).not.toHaveBeenCalled();
    });

    it('applies the default cooldownless-item cooldown when there is neither a skill nor a custom cooldown', () =>
    {
      buildGameActionMock({ isForUser: () => true });
      globalThis.$gameParty = { items: () => [ globalThis.$dataItems[5] ] };
      const jabsBattler = buildToolableBattler();

      jabsBattler.applyToolItemEffects(5, JABS_Button.Tool, false);

      expect(jabsBattler.modCooldownCounter).toHaveBeenCalledWith(JABS_Button.Tool, 60);
      // an item with no cooldown of its own must not also spend a zero-length one.
      expect(jabsBattler.modCooldownCounter).toHaveBeenCalledTimes(1);
    });

    it('uses the UsableItem slot key and button type instead of Tool when called with that button type', () =>
    {
      buildGameActionMock({ isForUser: () => true });
      globalThis.$gameParty = { items: () => [ globalThis.$dataItems[5] ] };
      const jabsBattler = buildToolableBattler();

      jabsBattler.applyToolItemEffects(5, JABS_Button.UsableItem, false);

      expect(jabsBattler.modCooldownCounter).toHaveBeenCalledWith(JABS_Button.UsableItem, 60);
    });
  });

  describe('applyUsableItemEffects', () =>
  {
    it('delegates to applyToolItemEffects bound to the UsableItem button', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.applyToolItemEffects = vi.fn();

      jabsBattler.applyUsableItemEffects(6, true);

      expect(jabsBattler.applyToolItemEffects).toHaveBeenCalledWith(6, JABS_Button.UsableItem, true);
    });

    it('defaults isLoot to false', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.applyToolItemEffects = vi.fn();

      jabsBattler.applyUsableItemEffects(6);

      expect(jabsBattler.applyToolItemEffects).toHaveBeenCalledWith(6, JABS_Button.UsableItem, false);
    });
  });

  describe('applyToolToPlayer', () =>
  {
    it('applies the item action to self and shows the item\'s animation', () =>
    {
      globalThis.$dataItems = [];
      globalThis.$dataItems[5] = { animationId: 42 };
      const apply = vi.fn();
      globalThis.Game_Action = vi.fn(function()
      {
        this.setItem = vi.fn();
        this.apply = apply;
      });
      const jabsBattler = buildBattler();
      jabsBattler.onItemApplied = vi.fn();
      jabsBattler.showAnimation = vi.fn();

      jabsBattler.applyToolToPlayer(5);

      expect(apply).toHaveBeenCalledWith(jabsBattler.getBattler());
      expect(jabsBattler.onItemApplied).toHaveBeenCalledTimes(1);
      expect(jabsBattler.showAnimation).toHaveBeenCalledWith(42);
    });
  });

  describe('onItemApplied', () =>
  {
    it('is a no-op', () =>
    {
      const jabsBattler = buildBattler();
      expect(() => jabsBattler.onItemApplied('action', 5)).not.toThrow();
    });
  });

  describe('applyToolForAllAllies', () =>
  {
    it('applies to the player alone when the party has only one battle member', () =>
    {
      globalThis.$gameParty = { battleMembers: () => [ 'leader' ] };
      const jabsBattler = buildBattler();
      jabsBattler.applyToolToPlayer = vi.fn();

      jabsBattler.applyToolForAllAllies(5);

      expect(jabsBattler.applyToolToPlayer).toHaveBeenCalledWith(5);
    });

    it('applies to each non-leader ally and then the player', () =>
    {
      const apply = vi.fn();
      globalThis.Game_Action = vi.fn(function() { this.setItem = vi.fn(); this.apply = apply; });
      const ally1 = {};
      const ally2 = {};
      globalThis.$gameParty = { battleMembers: () => [ 'leader', ally1, ally2 ] };
      const jabsBattler = buildBattler();
      jabsBattler.applyToolToPlayer = vi.fn();

      jabsBattler.applyToolForAllAllies(5);

      expect(apply).toHaveBeenCalledWith(ally1);
      expect(apply).toHaveBeenCalledWith(ally2);
      expect(jabsBattler.applyToolToPlayer).toHaveBeenCalledWith(5);
    });
  });

  describe('applyToolForOneOpponent', () =>
  {
    beforeEach(() =>
    {
      globalThis.$dataItems = { 5: {} };
      globalThis.Game_Action = vi.fn(function() { this.apply = vi.fn(); });
    });

    it('does nothing without a target or last-hit battler', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.getTarget = () => null;
      jabsBattler.getBattlerLastHit = () => null;
      jabsBattler.onItemApplied = vi.fn();

      jabsBattler.applyToolForOneOpponent(5);

      expect(jabsBattler.onItemApplied).not.toHaveBeenCalled();
    });

    it('applies to the current target when present', () =>
    {
      const targetBattler = {};
      const target = { getBattler: () => targetBattler };
      const jabsBattler = buildBattler();
      jabsBattler.getTarget = () => target;
      jabsBattler.onItemApplied = vi.fn();

      jabsBattler.applyToolForOneOpponent(5);

      expect(jabsBattler.onItemApplied).toHaveBeenCalledWith(expect.anything(), 5, target);
    });

    it('falls back to the last-hit battler without a current target', () =>
    {
      const lastHitBattler = {};
      const lastHit = { getBattler: () => lastHitBattler };
      const jabsBattler = buildBattler();
      jabsBattler.getTarget = () => null;
      jabsBattler.getBattlerLastHit = () => lastHit;
      jabsBattler.onItemApplied = vi.fn();

      jabsBattler.applyToolForOneOpponent(5);

      expect(jabsBattler.onItemApplied).toHaveBeenCalledWith(expect.anything(), 5, lastHit);
    });
  });

  describe('applyToolForAllOpponents', () =>
  {
    it('applies the tool to every enemy battler', async () =>
    {
      const { default: JABS_AiManager } = await import('../../../../../src/plugins/abs/core/managers/JABS_AiManager.js');
      const enemy1Battler = {};
      const enemy2Battler = {};
      const enemy1 = { getBattler: () => enemy1Battler };
      const enemy2 = { getBattler: () => enemy2Battler };
      JABS_AiManager.getEnemyBattlers = vi.fn(() => [ enemy1, enemy2 ]);
      const apply = vi.fn();
      globalThis.Game_Action = vi.fn(function() { this.apply = apply; });
      const jabsBattler = buildBattler();
      jabsBattler.onItemApplied = vi.fn();

      jabsBattler.applyToolForAllOpponents(5);

      expect(apply).toHaveBeenCalledWith(enemy1Battler);
      expect(apply).toHaveBeenCalledWith(enemy2Battler);
      expect(jabsBattler.onItemApplied).toHaveBeenCalledTimes(2);
    });
  });

  describe('createToolLog', () =>
  {
    beforeEach(() =>
    {
      globalThis.LootLogBuilder = vi.fn(function()
      {
        this.setupUsedItem = vi.fn().mockReturnThis();
        this.build = vi.fn(() => ({ built: true }));
      });
      globalThis.$mapLogs = { loot: { addLog: vi.fn() } };
    });

    it('does nothing when logging is disabled', () =>
    {
      globalThis.J.LOG = false;
      const jabsBattler = buildBattler();

      jabsBattler.createToolLog({ id: 1 });

      expect(globalThis.$mapLogs.loot.addLog).not.toHaveBeenCalled();
      globalThis.J.LOG = true;
    });

    it('logs the tool usage when logging is enabled', () =>
    {
      globalThis.J.LOG = true;
      const jabsBattler = buildBattler();

      jabsBattler.createToolLog({ id: 1 });

      expect(globalThis.$mapLogs.loot.addLog).toHaveBeenCalledWith({ built: true });
    });
  });
  //endregion map: tool/item effects

  //region map: defeat/evade effects
  describe('performPredefeatEffects', () =>
  {
    it('runs death animations, own-defeat skills, then target-defeat skills in order', () =>
    {
      const jabsBattler = buildBattler();
      const callOrder = [];
      jabsBattler.handleOnDeathAnimations = vi.fn(() => callOrder.push('animations'));
      jabsBattler.handleOnOwnDefeatSkills = vi.fn(() => callOrder.push('own'));
      jabsBattler.handleOnTargetDefeatSkills = vi.fn(() => callOrder.push('target'));

      jabsBattler.performPredefeatEffects('victor');

      expect(callOrder).toEqual([ 'animations', 'own', 'target' ]);
      expect(jabsBattler.handleOnOwnDefeatSkills).toHaveBeenCalledWith('victor');
      expect(jabsBattler.handleOnTargetDefeatSkills).toHaveBeenCalledWith('victor');
    });
  });

  describe('handleOnDeathAnimations', () =>
  {
    it('plays the actor death animation for an actor needing the death effect', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.getBattler = () => ({ isActor: () => true, needsDeathEffect: () => true });
      jabsBattler.handleActorOnDeathAnimation = vi.fn();
      jabsBattler.handleEnemyOnDeathAnimation = vi.fn();

      jabsBattler.handleOnDeathAnimations();

      expect(jabsBattler.handleActorOnDeathAnimation).toHaveBeenCalledTimes(1);
      expect(jabsBattler.handleEnemyOnDeathAnimation).not.toHaveBeenCalled();
    });

    it('does not re-play the actor death animation once already performed', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.getBattler = () => ({ isActor: () => true, needsDeathEffect: () => false, isEnemy: () => false });
      jabsBattler.handleActorOnDeathAnimation = vi.fn();
      jabsBattler.handleEnemyOnDeathAnimation = vi.fn();

      jabsBattler.handleOnDeathAnimations();

      expect(jabsBattler.handleActorOnDeathAnimation).not.toHaveBeenCalled();
      expect(jabsBattler.handleEnemyOnDeathAnimation).not.toHaveBeenCalled();
    });

    it('plays the enemy death animation for an enemy', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.getBattler = () => ({ isActor: () => false, isEnemy: () => true });
      jabsBattler.handleActorOnDeathAnimation = vi.fn();
      jabsBattler.handleEnemyOnDeathAnimation = vi.fn();

      jabsBattler.handleOnDeathAnimations();

      expect(jabsBattler.handleEnemyOnDeathAnimation).toHaveBeenCalledTimes(1);
    });
  });

  describe('handleActorOnDeathAnimation / handleEnemyOnDeathAnimation', () =>
  {
    it('shows animation 152 and toggles the death effect for an actor', () =>
    {
      const toggleDeathEffect = vi.fn();
      const jabsBattler = buildBattler();
      jabsBattler.getBattler = () => ({ toggleDeathEffect });
      jabsBattler.showAnimation = vi.fn();

      jabsBattler.handleActorOnDeathAnimation();

      expect(jabsBattler.showAnimation).toHaveBeenCalledWith(152);
      expect(toggleDeathEffect).toHaveBeenCalledTimes(1);
    });

    it('shows animation 151 for an enemy', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.showAnimation = vi.fn();

      jabsBattler.handleEnemyOnDeathAnimation();

      expect(jabsBattler.showAnimation).toHaveBeenCalledWith(151);
    });
  });

  describe('handleOnOwnDefeatSkills', () =>
  {
    beforeEach(() =>
    {
      globalThis.$jabsEngine = { forceMapAction: vi.fn() };
    });

    it('does not trigger a skill that fails its own roll', () =>
    {
      const jabsBattler = buildBattler();
      const skill = { skillId: 1, shouldTrigger: () => false };
      jabsBattler.getBattler = () => ({ onOwnDefeatSkillIds: () => [ skill ] });

      jabsBattler.handleOnOwnDefeatSkills({});

      expect(globalThis.$jabsEngine.forceMapAction).not.toHaveBeenCalled();
    });

    it('casts from the target position when the skill appears on the target', () =>
    {
      const jabsBattler = buildBattler();
      const skill = { skillId: 1, shouldTrigger: () => true, appearOnTarget: () => true };
      jabsBattler.getBattler = () => ({ onOwnDefeatSkillIds: () => [ skill ] });
      const victor = { getX: () => 3, getY: () => 4 };

      jabsBattler.handleOnOwnDefeatSkills(victor);

      expect(globalThis.$jabsEngine.forceMapAction).toHaveBeenCalledWith(jabsBattler, 1, false, 3, 4);
    });

    it('casts from the caster when the skill does not appear on the target', () =>
    {
      const jabsBattler = buildBattler();
      const skill = { skillId: 1, shouldTrigger: () => true, appearOnTarget: () => false };
      jabsBattler.getBattler = () => ({ onOwnDefeatSkillIds: () => [ skill ] });

      jabsBattler.handleOnOwnDefeatSkills({});

      expect(globalThis.$jabsEngine.forceMapAction).toHaveBeenCalledWith(jabsBattler, 1, false);
    });
  });

  describe('handleOnTargetDefeatSkills', () =>
  {
    beforeEach(() =>
    {
      globalThis.$jabsEngine = { forceMapAction: vi.fn() };
    });

    it('does not trigger a skill that fails its own roll', () =>
    {
      const jabsBattler = buildBattler();
      const skill = { skillId: 1, shouldTrigger: () => false };
      const victor = { getBattler: () => ({ onTargetDefeatSkillIds: () => [ skill ] }) };

      jabsBattler.handleOnTargetDefeatSkills(victor);

      expect(globalThis.$jabsEngine.forceMapAction).not.toHaveBeenCalled();
    });

    it('casts from the (defeated) target position when the skill appears on the target', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.getX = () => 3;
      jabsBattler.getY = () => 4;
      const skill = { skillId: 1, shouldTrigger: () => true, appearOnTarget: () => true };
      const victor = { getBattler: () => ({ onTargetDefeatSkillIds: () => [ skill ] }) };

      jabsBattler.handleOnTargetDefeatSkills(victor);

      expect(globalThis.$jabsEngine.forceMapAction).toHaveBeenCalledWith(victor, 1, false, 3, 4);
    });

    it('casts from the victor when the skill does not appear on the target', () =>
    {
      const jabsBattler = buildBattler();
      const skill = { skillId: 1, shouldTrigger: () => true, appearOnTarget: () => false };
      const victor = { getBattler: () => ({ onTargetDefeatSkillIds: () => [ skill ] }) };

      jabsBattler.handleOnTargetDefeatSkills(victor);

      expect(globalThis.$jabsEngine.forceMapAction).toHaveBeenCalledWith(victor, 1, false);
    });
  });

  describe('handleOnEvadeSkills', () =>
  {
    beforeEach(() =>
    {
      globalThis.$jabsEngine = { forceMapAction: vi.fn() };
    });

    it('does nothing when there are no on-evade effects', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.getBattler = () => ({ onEvadeExecuteEffects: () => [] });

      jabsBattler.handleOnEvadeSkills(null);

      expect(globalThis.$jabsEngine.forceMapAction).not.toHaveBeenCalled();
    });

    it('fires the skill toward the attacker\'s position when an attacker is provided', () =>
    {
      const evaderBattler = {
        getPositiveRollsForSkill: () => 0, getNegativeRollsForSkill: () => 0,
      };
      const effect = {
        skillId: 1,
        baseSkill: () => ({}),
        resolveProcCount: () => 1,
      };
      const jabsBattler = buildBattler();
      jabsBattler.getBattler = () => Object.assign(evaderBattler, { onEvadeExecuteEffects: () => [ effect ] });
      const attacker = { getX: () => 3, getY: () => 4 };

      jabsBattler.handleOnEvadeSkills(attacker);

      expect(globalThis.$jabsEngine.forceMapAction).toHaveBeenCalledWith(jabsBattler, 1, false, 3, 4);
    });

    it('fires without a seed target when there is no attacker reference', () =>
    {
      const evaderBattler = {
        getPositiveRollsForSkill: () => 0, getNegativeRollsForSkill: () => 0,
      };
      const effect = {
        skillId: 1,
        baseSkill: () => ({}),
        resolveProcCount: () => 1,
      };
      const jabsBattler = buildBattler();
      jabsBattler.getBattler = () => Object.assign(evaderBattler, { onEvadeExecuteEffects: () => [ effect ] });

      jabsBattler.handleOnEvadeSkills(null);

      expect(globalThis.$jabsEngine.forceMapAction).toHaveBeenCalledWith(jabsBattler, 1, false);
    });

    it('fires the skill once per resolved proc count', () =>
    {
      const evaderBattler = {
        getPositiveRollsForSkill: () => 0, getNegativeRollsForSkill: () => 0,
      };
      const effect = {
        skillId: 1,
        baseSkill: () => ({}),
        resolveProcCount: () => 3,
      };
      const jabsBattler = buildBattler();
      jabsBattler.getBattler = () => Object.assign(evaderBattler, { onEvadeExecuteEffects: () => [ effect ] });

      jabsBattler.handleOnEvadeSkills(null);

      expect(globalThis.$jabsEngine.forceMapAction).toHaveBeenCalledTimes(3);
    });
  });

  describe('performPostdefeatEffects', () =>
  {
    it('flags an actor as dying', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.isActor = () => true;

      jabsBattler.performPostdefeatEffects('victor');

      expect(jabsBattler.isDying()).toBe(true);
    });

    it('does not flag a non-actor as dying', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.isActor = () => false;

      jabsBattler.performPostdefeatEffects('victor');

      expect(jabsBattler.isDying()).toBe(false);
    });
  });
  //endregion map: defeat/evade effects

  //region movement
  describe('isMovementLocked / setMovementLock', () =>
  {
    it('tracks the movement lock flag, defaulting to true', () =>
    {
      const jabsBattler = buildBattler();
      expect(jabsBattler.isMovementLocked()).toBe(false);

      jabsBattler.setMovementLock();

      expect(jabsBattler.isMovementLocked()).toBe(true);

      jabsBattler.setMovementLock(false);

      expect(jabsBattler.isMovementLocked()).toBe(false);
    });
  });

  describe('canBattlerMove / isMovementLockedByState', () =>
  {
    it('is false when explicitly movement-locked', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.isMovementLocked = () => true;

      expect(jabsBattler.canBattlerMove()).toBe(false);
    });

    it('is false when locked by state', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.isMovementLocked = () => false;
      jabsBattler.isMovementLockedByState = () => true;

      expect(jabsBattler.canBattlerMove()).toBe(false);
    });

    it('is true otherwise', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.isMovementLocked = () => false;
      jabsBattler.isMovementLockedByState = () => false;

      expect(jabsBattler.canBattlerMove()).toBe(true);
    });

    it('isMovementLockedByState is false with no states', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.getBattler = () => ({ states: () => [] });

      expect(jabsBattler.isMovementLockedByState()).toBe(false);
    });

    it('isMovementLockedByState is true when rooted', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.getBattler = () => ({ states: () => [ { jabsRooted: true } ] });

      expect(jabsBattler.isMovementLockedByState()).toBe(true);
    });

    it('isMovementLockedByState is true when paralyzed', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.getBattler = () => ({ states: () => [ { jabsParalyzed: true } ] });

      expect(jabsBattler.isMovementLockedByState()).toBe(true);
    });

    it('isMovementLockedByState is false when states are present but none lock movement', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.getBattler = () => ({ states: () => [ {} ] });

      expect(jabsBattler.isMovementLockedByState()).toBe(false);
    });
  });
  //endregion movement

  //region readiness
  describe('initializeCooldown', () =>
  {
    it('does nothing without a resolved skill slot', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.getBattler = () => ({ getSkillSlot: () => null });

      expect(() => jabsBattler.initializeCooldown('mainhand', 60)).not.toThrow();
    });

    it('sets the cooldown frames on the resolved slot', () =>
    {
      const setFrames = vi.fn();
      const jabsBattler = buildBattler();
      jabsBattler.getBattler = () => ({ getSkillSlot: () => ({ getCooldown: () => ({ setFrames }) }) });

      jabsBattler.initializeCooldown('mainhand', 60);

      expect(setFrames).toHaveBeenCalledWith(60);
    });
  });

  describe('getCooldown', () =>
  {
    it('warns and returns null without a resolved skill slot', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.getBattler = () => ({ getSkillSlot: () => null });
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      expect(jabsBattler.getCooldown('mainhand')).toBeNull();
      warnSpy.mockRestore();
    });

    it('returns the resolved slot\'s cooldown', () =>
    {
      const cooldown = {};
      const jabsBattler = buildBattler();
      jabsBattler.getBattler = () => ({ getSkillSlot: () => ({ getCooldown: () => cooldown }) });

      expect(jabsBattler.getCooldown('mainhand')).toBe(cooldown);
    });
  });

  describe('getActionKeyData', () =>
  {
    it('returns null when the cooldown could not be resolved', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.getCooldown = () => null;
      jabsBattler.getBattler = () => ({ getSkillSlot: () => ({}) });

      expect(jabsBattler.getActionKeyData('mainhand')).toBeNull();
    });

    it('returns null when the skill slot could not be resolved', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.getCooldown = () => ({});
      jabsBattler.getBattler = () => ({ getSkillSlot: () => null });

      expect(jabsBattler.getActionKeyData('mainhand')).toBeNull();
    });

    it('returns the cooldown and skillslot pair when both resolve', () =>
    {
      const cooldown = {};
      const skillslot = {};
      const jabsBattler = buildBattler();
      jabsBattler.getCooldown = () => cooldown;
      jabsBattler.getBattler = () => ({ getSkillSlot: () => skillslot });

      expect(jabsBattler.getActionKeyData('mainhand')).toEqual({ cooldown, skillslot });
    });
  });

  describe('isPostActionCooldownComplete', () =>
  {
    it('is immediately true once already flagged complete', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler._postActionCooldownComplete = true;

      expect(jabsBattler.isPostActionCooldownComplete()).toBe(true);
    });

    it('increments the counter and reports false while still charging', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler._postActionCooldownComplete = false;
      jabsBattler._postActionCooldown = 0;
      jabsBattler._postActionCooldownMax = 5;

      expect(jabsBattler.isPostActionCooldownComplete()).toBe(false);
      expect(jabsBattler._postActionCooldown).toBe(1);
    });

    it('flags complete and resets the counter once the max is exceeded', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler._postActionCooldownComplete = false;
      jabsBattler._postActionCooldown = 10;
      jabsBattler._postActionCooldownMax = 5;

      expect(jabsBattler.isPostActionCooldownComplete()).toBe(true);
      expect(jabsBattler._postActionCooldownComplete).toBe(true);
      expect(jabsBattler._postActionCooldown).toBe(0);
    });
  });

  describe('startPostActionCooldown', () =>
  {
    it('resets and arms the post-action cooldown', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.startPostActionCooldown(30);

      expect(jabsBattler._postActionCooldownComplete).toBe(false);
      expect(jabsBattler._postActionCooldown).toBe(0);
      expect(jabsBattler._postActionCooldownMax).toBe(30);
    });
  });

  describe('isIdle / setIdle', () =>
  {
    it('tracks the idle flag', () =>
    {
      const jabsBattler = buildBattler();
      expect(jabsBattler.isIdle()).toBe(true);

      jabsBattler.setIdle(false);

      expect(jabsBattler.isIdle()).toBe(false);
    });
  });

  describe('isIdleActionReady', () =>
  {
    it('is immediately true once already flagged ready', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler._idleActionReady = true;

      expect(jabsBattler.isIdleActionReady()).toBe(true);
    });

    it('increments the counter and reports false while still charging', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler._idleActionReady = false;
      jabsBattler._idleActionCount = 0;
      jabsBattler._idleActionCountMax = 5;

      expect(jabsBattler.isIdleActionReady()).toBe(false);
      expect(jabsBattler._idleActionCount).toBe(1);
    });

    it('flags ready and resets the counter once the max is exceeded', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler._idleActionReady = false;
      jabsBattler._idleActionCount = 10;
      jabsBattler._idleActionCountMax = 5;

      expect(jabsBattler.isIdleActionReady()).toBe(true);
      expect(jabsBattler._idleActionReady).toBe(true);
      expect(jabsBattler._idleActionCount).toBe(0);
    });
  });

  describe('isSkillTypeCooldownReady', () =>
  {
    it('delegates to the skill slot manager', () =>
    {
      const isAnyCooldownReadyForSlot = vi.fn(() => true);
      const jabsBattler = buildBattler();
      jabsBattler.getBattler = () => ({ getSkillSlotManager: () => ({ isAnyCooldownReadyForSlot }) });

      expect(jabsBattler.isSkillTypeCooldownReady('mainhand')).toBe(true);
      expect(isAnyCooldownReadyForSlot).toHaveBeenCalledWith('mainhand');
    });
  });

  describe('cooldown/combo mutation delegates', () =>
  {
    it('modCooldownCounter delegates to modBaseFrames', () =>
    {
      const modBaseFrames = vi.fn();
      const jabsBattler = buildBattler();
      jabsBattler.getCooldown = () => ({ modBaseFrames });

      jabsBattler.modCooldownCounter('mainhand', 10);

      expect(modBaseFrames).toHaveBeenCalledWith(10);
    });

    it('setCooldownCounter delegates to setFrames', () =>
    {
      const setFrames = vi.fn();
      const jabsBattler = buildBattler();
      jabsBattler.getCooldown = () => ({ setFrames });

      jabsBattler.setCooldownCounter('mainhand', 10);

      expect(setFrames).toHaveBeenCalledWith(10);
    });

    it('resetComboData delegates to resetCombo on the resolved skill slot', () =>
    {
      const resetCombo = vi.fn();
      const jabsBattler = buildBattler();
      jabsBattler.getBattler = () => ({
        getSkillSlotManager: () => ({ getSkillSlotByKey: () => ({ resetCombo }) }),
      });

      jabsBattler.resetComboData('mainhand');

      expect(resetCombo).toHaveBeenCalledTimes(1);
    });

    it('setComboFrames delegates to the cooldown', () =>
    {
      const setComboFrames = vi.fn();
      const jabsBattler = buildBattler();
      jabsBattler.getCooldown = () => ({ setComboFrames });

      jabsBattler.setComboFrames('mainhand', 10);

      expect(setComboFrames).toHaveBeenCalledWith(10);
    });

    it('setComboExpireFrames delegates to the cooldown', () =>
    {
      const setComboExpireFrames = vi.fn();
      const jabsBattler = buildBattler();
      jabsBattler.getCooldown = () => ({ setComboExpireFrames });

      jabsBattler.setComboExpireFrames('mainhand', 10);

      expect(setComboExpireFrames).toHaveBeenCalledWith(10);
    });
  });

  describe('isActionReady', () =>
  {
    it('is immediately true once already flagged ready', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler._prepareReady = true;

      expect(jabsBattler.isActionReady()).toBe(true);
    });

    it('increments the counter and reports false while still charging', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler._prepareReady = false;
      jabsBattler._prepareCounter = 0;
      jabsBattler._prepareMax = 5;

      expect(jabsBattler.isActionReady()).toBe(false);
      expect(jabsBattler._prepareCounter).toBe(1);
    });

    it('flags ready and resets the counter once the max is reached', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler._prepareReady = false;
      jabsBattler._prepareCounter = 5;
      jabsBattler._prepareMax = 5;

      expect(jabsBattler.isActionReady()).toBe(true);
      expect(jabsBattler._prepareReady).toBe(true);
      expect(jabsBattler._prepareCounter).toBe(0);
    });
  });

  describe('getPrepareTime', () =>
  {
    it('delegates to the underlying battler', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.getBattler = () => ({ prepareTime: () => 42 });

      expect(jabsBattler.getPrepareTime()).toBe(42);
    });
  });

  describe('getCooldownKeyBySkillId', () =>
  {
    it('resolves a semantic slot for an enemy when one exists', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.isEnemy = () => true;
      jabsBattler.getBattler = () => ({ findSlotForSkillId: () => ({ key: 'dodge' }) });

      expect(jabsBattler.getCooldownKeyBySkillId(1)).toBe('dodge');
    });

    it('falls back to an arbitrary id-name key for an enemy with no slot', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.isEnemy = () => true;
      jabsBattler.getBattler = () => ({ findSlotForSkillId: () => null });
      jabsBattler.getSkill = () => ({ id: 5, name: 'Fireball' });

      expect(jabsBattler.getCooldownKeyBySkillId(5)).toBe('5-Fireball');
    });

    it('returns null for an enemy with no slot and no resolvable skill', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.isEnemy = () => true;
      jabsBattler.getBattler = () => ({ findSlotForSkillId: () => null });
      jabsBattler.getSkill = () => null;

      expect(jabsBattler.getCooldownKeyBySkillId(5)).toBeNull();
    });

    it('resolves the slot key for an actor', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.isEnemy = () => false;
      jabsBattler.isActor = () => true;
      jabsBattler.getBattler = () => ({ findSlotForSkillId: () => ({ key: 'mainhand' }) });

      expect(jabsBattler.getCooldownKeyBySkillId(1)).toBe('mainhand');
    });

    it('returns null for an actor with no matching slot', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.isEnemy = () => false;
      jabsBattler.isActor = () => true;
      jabsBattler.getBattler = () => ({ findSlotForSkillId: () => null });

      expect(jabsBattler.getCooldownKeyBySkillId(1)).toBeNull();
    });

    it('falls back to the global cooldown key for neither actor nor enemy', () =>
    {
      J.ABS.Globals = { GlobalCooldownKey: 'gcd' };
      const jabsBattler = buildBattler();
      jabsBattler.isEnemy = () => false;
      jabsBattler.isActor = () => false;

      expect(jabsBattler.getCooldownKeyBySkillId(1)).toBe('gcd');
    });
  });

  describe('isSkillIdBasicAttack', () =>
  {
    it('is true when the skill id matches the enemy basic attack', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.isEnemy = () => true;
      jabsBattler.getEnemyBasicAttack = () => 1;

      expect(jabsBattler.isSkillIdBasicAttack(1)).toBe(true);
    });

    it('is false when the skill id does not match the enemy basic attack', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.isEnemy = () => true;
      jabsBattler.getEnemyBasicAttack = () => 1;

      expect(jabsBattler.isSkillIdBasicAttack(2)).toBe(false);
    });

    it('is false for an actor with no matching slot', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.isEnemy = () => false;
      jabsBattler.isActor = () => true;
      jabsBattler.getBattler = () => ({ findSlotForSkillId: () => null });

      expect(jabsBattler.isSkillIdBasicAttack(1)).toBe(false);
    });

    it('is true for an actor whose skill lives in the mainhand slot', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.isEnemy = () => false;
      jabsBattler.isActor = () => true;
      jabsBattler.getBattler = () => ({ findSlotForSkillId: () => ({ key: JABS_Button.Mainhand }) });

      expect(jabsBattler.isSkillIdBasicAttack(1)).toBe(true);
    });

    it('is true for an actor whose skill lives in the offhand slot', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.isEnemy = () => false;
      jabsBattler.isActor = () => true;
      jabsBattler.getBattler = () => ({ findSlotForSkillId: () => ({ key: JABS_Button.Offhand }) });

      expect(jabsBattler.isSkillIdBasicAttack(1)).toBe(true);
    });

    it('is false for an actor whose skill lives in a slot other than the two hands', () =>
    {
      // Arrange
      const jabsBattler = buildBattler();
      jabsBattler.isEnemy = () => false;
      jabsBattler.isActor = () => true;
      // a combat slot holds a real equipped skill; it is simply not a basic attack.
      jabsBattler.getBattler = () => ({ findSlotForSkillId: () => ({ key: 'combat1' }) });

      // Act
      const isBasicAttack = jabsBattler.isSkillIdBasicAttack(1);

      // Assert
      expect(isBasicAttack).toBe(false);
    });

    it('warns and returns false for neither actor nor enemy', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.isEnemy = () => false;
      jabsBattler.isActor = () => false;
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      expect(jabsBattler.isSkillIdBasicAttack(1)).toBe(false);
      warnSpy.mockRestore();
    });
  });

  describe('getSkill', () =>
  {
    it('returns null without a skill id', () =>
    {
      const jabsBattler = buildBattler();

      expect(jabsBattler.getSkill(0)).toBeNull();
    });

    it('delegates to the underlying battler for a valid skill id', () =>
    {
      const skill = { id: 1 };
      const jabsBattler = buildBattler();
      jabsBattler.getBattler = () => ({ skill: () => skill });

      expect(jabsBattler.getSkill(1)).toBe(skill);
    });
  });

  describe('canPaySkillCost', () =>
  {
    it('is false when the battler cannot pay the cost', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.getSkill = () => ({ id: 1 });
      jabsBattler.getBattler = () => ({ canPaySkillCost: () => false });

      expect(jabsBattler.canPaySkillCost(1)).toBe(false);
    });

    it('is true when the battler can pay the cost', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.getSkill = () => ({ id: 1 });
      jabsBattler.getBattler = () => ({ canPaySkillCost: () => true });

      expect(jabsBattler.canPaySkillCost(1)).toBe(true);
    });
  });

  describe('canExecuteSkill', () =>
  {
    function buildExecutableBattler(overrides = {})
    {
      const jabsBattler = buildBattler();
      jabsBattler.canBattlerUseSkills = () => true;
      jabsBattler.canBattlerUseAttacks = () => true;
      jabsBattler.isSkillIdBasicAttack = () => false;
      jabsBattler.canPaySkillCost = () => true;
      jabsBattler.getCooldownKeyBySkillId = () => 'mainhand';
      jabsBattler.getCooldown = () => ({ isBaseReady: () => true });
      jabsBattler.getBattler = () => ({ getSkillSlot: () => ({ comboId: 0 }) });
      Object.assign(jabsBattler, overrides);
      return jabsBattler;
    }

    beforeEach(async () =>
    {
      const { default: JABS_GlobalCooldown } = await import('../../../../../src/plugins/abs/core/models/JABS_GlobalCooldown.js');
      JABS_GlobalCooldown.isGlobalBlockingSkillId = vi.fn(() => false);
    });

    it('is false without a chosen skill id', () =>
    {
      // Arrange
      const jabsBattler = buildExecutableBattler();

      // Act
      const result = jabsBattler.canExecuteSkill(0);

      // Assert
      expect(result).toBe(false);
    });

    it('short-circuits before resolving basic-attack status when neither skills nor attacks can be used', () =>
    {
      // Arrange- the "neither" gate is a fast path: it bails before calling isSkillIdBasicAttack,
      // which for an actor runs a findSlotForSkillId slot scan on every AI decision tick. Spying on
      // that call is what makes this test meaningful- asserting only the false return would still
      // pass with the fast path deleted, since the two gates below it catch the same cases.
      const isSkillIdBasicAttack = vi.fn(() => false);
      const jabsBattler = buildExecutableBattler({
        canBattlerUseSkills: () => false, canBattlerUseAttacks: () => false, isSkillIdBasicAttack,
      });

      // Act
      const result = jabsBattler.canExecuteSkill(1);

      // Assert
      expect(result).toBe(false);
      expect(isSkillIdBasicAttack).not.toHaveBeenCalled();
    });

    it('is false for a basic attack when attacks are blocked', () =>
    {
      // Arrange
      const jabsBattler = buildExecutableBattler({
        canBattlerUseAttacks: () => false, isSkillIdBasicAttack: () => true,
      });

      // Act
      const result = jabsBattler.canExecuteSkill(1);

      // Assert
      expect(result).toBe(false);
    });

    it('is false for a non-basic-attack skill when skills are blocked', () =>
    {
      // Arrange
      const jabsBattler = buildExecutableBattler({
        canBattlerUseSkills: () => false, isSkillIdBasicAttack: () => false,
      });

      // Act
      const result = jabsBattler.canExecuteSkill(1);

      // Assert
      expect(result).toBe(false);
    });

    it('is false when the cost cannot be paid', () =>
    {
      // Arrange
      const jabsBattler = buildExecutableBattler({ canPaySkillCost: () => false });

      // Act
      const result = jabsBattler.canExecuteSkill(1);

      // Assert
      expect(result).toBe(false);
    });

    it('is false without a resolvable cooldown key', () =>
    {
      // Arrange
      const jabsBattler = buildExecutableBattler({ getCooldownKeyBySkillId: () => null });

      // Act
      const result = jabsBattler.canExecuteSkill(1);

      // Assert
      expect(result).toBe(false);
    });

    it('warns and is false when the resolved key has no cooldown', () =>
    {
      // Arrange- a resolved key with no cooldown behind it means a follower's skill leaked into
      // this battler's slots, so the source logs a warn plus a trace to surface the culprit.
      const jabsBattler = buildExecutableBattler({ getCooldown: () => null });
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const traceSpy = vi.spyOn(console, 'trace').mockImplementation(() => {});

      // Act
      const result = jabsBattler.canExecuteSkill(1);

      // Assert- the diagnostics are the point of this branch, so assert them, not just the return.
      expect(result).toBe(false);
      expect(warnSpy).toHaveBeenCalledWith(
        '[J-ABS] a follower was asked to cast a skill it does not own a cooldown for.',
        {
          battler: jabsBattler,
          skillSlotKey: 'mainhand',
        });
      expect(traceSpy).toHaveBeenCalledTimes(1);
      warnSpy.mockRestore();
      traceSpy.mockRestore();
    });

    it('is false when the base cooldown is not ready and this is not a combo', () =>
    {
      // Arrange
      const jabsBattler = buildExecutableBattler({
        getCooldown: () => ({ isBaseReady: () => false }),
      });

      // Act
      const result = jabsBattler.canExecuteSkill(1);

      // Assert
      expect(result).toBe(false);
    });

    it('is true for a combo skill even when the base cooldown is not ready', () =>
    {
      // Arrange- a combo follow-up is allowed to ignore the base cooldown of its own slot.
      const jabsBattler = buildExecutableBattler({
        getCooldown: () => ({ isBaseReady: () => false }),
        getBattler: () => ({ getSkillSlot: () => ({ comboId: 1 }) }),
      });

      // Act
      const result = jabsBattler.canExecuteSkill(1);

      // Assert
      expect(result).toBe(true);
    });

    it('is false when the global cooldown is blocking this skill', async () =>
    {
      // Arrange
      const { default: JABS_GlobalCooldown } = await import('../../../../../src/plugins/abs/core/models/JABS_GlobalCooldown.js');
      JABS_GlobalCooldown.isGlobalBlockingSkillId = vi.fn(() => true);
      const jabsBattler = buildExecutableBattler();

      // Act
      const result = jabsBattler.canExecuteSkill(1);

      // Assert
      expect(result).toBe(false);
    });

    it('is true when every gate passes', () =>
    {
      // Arrange
      const jabsBattler = buildExecutableBattler();

      // Act
      const result = jabsBattler.canExecuteSkill(1);

      // Assert
      expect(result).toBe(true);
    });
  });
  //endregion readiness

  //region regeneration
  describe('updateRegen', () =>
  {
    it('does nothing when regen cannot currently be updated', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.canUpdateRegen = () => false;
      jabsBattler.performRegeneration = vi.fn();

      jabsBattler.updateRegen();

      expect(jabsBattler.performRegeneration).not.toHaveBeenCalled();
    });

    it('performs regeneration then resets the counter to the resolved tick interval', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.canUpdateRegen = () => true;
      jabsBattler.performRegeneration = vi.fn();
      jabsBattler.getNaturalRegenTickInterval = () => 90;

      jabsBattler.updateRegen();

      expect(jabsBattler.performRegeneration).toHaveBeenCalledTimes(1);
      expect(jabsBattler.getRegenCounter()).toBe(90);
    });
  });

  describe('getNaturalRegenTickInterval', () =>
  {
    it('delegates to the battler, which owns the actual base/flat/percent/floor math', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.getBattler = () => ({ getNaturalRegenTickInterval: () => 42 });

      expect(jabsBattler.getNaturalRegenTickInterval()).toBe(42);
    });
  });

  describe('canUpdateRegen / isRegenReady / regen counter accessors', () =>
  {
    it('canUpdateRegen is false when regen is not ready', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.isRegenReady = () => false;

      expect(jabsBattler.canUpdateRegen()).toBe(false);
    });

    it('canUpdateRegen is false when the battler is dead', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.isRegenReady = () => true;
      jabsBattler.getBattler = () => ({ isDead: () => true });

      expect(jabsBattler.canUpdateRegen()).toBe(false);
    });

    it('canUpdateRegen is true when ready and alive', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.isRegenReady = () => true;
      jabsBattler.getBattler = () => ({ isDead: () => false });

      expect(jabsBattler.canUpdateRegen()).toBe(true);
    });

    it('isRegenReady clamps to 0 and reports true once the counter reaches 0', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.setRegenCounter(-5);

      expect(jabsBattler.isRegenReady()).toBe(true);
      expect(jabsBattler.getRegenCounter()).toBe(0);
    });

    it('isRegenReady decrements and reports false while still counting down', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.setRegenCounter(5);

      expect(jabsBattler.isRegenReady()).toBe(false);
      expect(jabsBattler.getRegenCounter()).toBe(4);
    });
  });

  describe('performRegeneration', () =>
  {
    it('does nothing without an underlying battler', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.getBattler = () => null;
      jabsBattler.processNaturalRegens = vi.fn();

      jabsBattler.performRegeneration();

      expect(jabsBattler.processNaturalRegens).not.toHaveBeenCalled();
    });

    it('processes natural regens and skips state cleanup with no states', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.getBattler = () => ({ allStates: () => [] });
      jabsBattler.processNaturalRegens = vi.fn();
      jabsBattler.shouldProcessState = vi.fn();

      jabsBattler.performRegeneration();

      expect(jabsBattler.processNaturalRegens).toHaveBeenCalledTimes(1);
      expect(jabsBattler.shouldProcessState).not.toHaveBeenCalled();
    });

    it('runs shouldProcessState for every tracked state for cleanup side effects', () =>
    {
      const jabsBattler = buildBattler();
      const states = [ { id: 1 }, { id: 2 } ];
      jabsBattler.getBattler = () => ({ allStates: () => states });
      jabsBattler.processNaturalRegens = vi.fn();
      jabsBattler.shouldProcessState = vi.fn();

      jabsBattler.performRegeneration();

      expect(jabsBattler.shouldProcessState).toHaveBeenCalledWith(states[0], 0, states);
      expect(jabsBattler.shouldProcessState).toHaveBeenCalledWith(states[1], 1, states);
    });
  });

  describe('processNaturalRegens', () =>
  {
    it('processes hp/mp/tp regen with the resolved reduction flag', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.isNaturalRegenReduced = () => true;
      jabsBattler.processNaturalHpRegen = vi.fn();
      jabsBattler.processNaturalMpRegen = vi.fn();
      jabsBattler.processNaturalTpRegen = vi.fn();

      jabsBattler.processNaturalRegens();

      expect(jabsBattler.processNaturalHpRegen).toHaveBeenCalledWith(true);
      expect(jabsBattler.processNaturalMpRegen).toHaveBeenCalledWith(true);
      expect(jabsBattler.processNaturalTpRegen).toHaveBeenCalledWith(true);
    });
  });

  describe('isNaturalRegenReduced', () =>
  {
    it('is false for enemies regardless of anything else', () =>
    {
      globalThis.$jabsEngine = { forcedCombat: true };
      const jabsBattler = buildBattler();
      jabsBattler.isEnemy = () => true;

      expect(jabsBattler.isNaturalRegenReduced()).toBe(false);
    });

    it('is true when combat is globally forced for a non-enemy', () =>
    {
      globalThis.$jabsEngine = { forcedCombat: true };
      const jabsBattler = buildBattler();
      jabsBattler.isEnemy = () => false;

      expect(jabsBattler.isNaturalRegenReduced()).toBe(true);
    });

    it('is true for an in-combat actor', () =>
    {
      globalThis.$jabsEngine = { forcedCombat: false };
      const jabsBattler = buildBattler();
      jabsBattler.isEnemy = () => false;
      jabsBattler.isActor = () => true;
      jabsBattler.isInCombat = () => true;

      expect(jabsBattler.isNaturalRegenReduced()).toBe(true);
    });

    it('is false for an out-of-combat actor with no forced combat', () =>
    {
      globalThis.$jabsEngine = { forcedCombat: false };
      const jabsBattler = buildBattler();
      jabsBattler.isEnemy = () => false;
      jabsBattler.isActor = () => true;
      jabsBattler.isInCombat = () => false;

      expect(jabsBattler.isNaturalRegenReduced()).toBe(false);
    });
  });

  describe('calculatedRegen', () =>
  {
    it('applies the full base value in full every tick, scaled to per-100', () =>
    {
      const jabsBattler = buildBattler();

      expect(jabsBattler.calculatedRegen(1)).toBe(100);
    });

    it('reduces to 20% of the normal value when reduced', () =>
    {
      const jabsBattler = buildBattler();

      expect(jabsBattler.calculatedRegen(1, true)).toBe(20);
    });
  });

  describe('processNaturalHpRegen / MpRegen / TpRegen', () =>
  {
    it('processNaturalHpRegen gains hp scaled by rec when below max', () =>
    {
      const gainHp = vi.fn();
      const jabsBattler = buildBattler();
      jabsBattler.getBattler = () => ({ hp: 1, mhp: 100, hrg: 1, rec: 2, gainHp });
      jabsBattler.calculatedRegen = () => 5;

      jabsBattler.processNaturalHpRegen(false);

      expect(gainHp).toHaveBeenCalledWith(10);
    });

    it('processNaturalHpRegen does nothing at full hp', () =>
    {
      const gainHp = vi.fn();
      const jabsBattler = buildBattler();
      jabsBattler.getBattler = () => ({ hp: 100, mhp: 100, hrg: 1, rec: 2, gainHp });

      jabsBattler.processNaturalHpRegen(false);

      expect(gainHp).not.toHaveBeenCalled();
    });

    it('processNaturalMpRegen gains mp scaled by rec when below max', () =>
    {
      const gainMp = vi.fn();
      const jabsBattler = buildBattler();
      jabsBattler.getBattler = () => ({ mp: 1, mmp: 100, mrg: 1, rec: 2, gainMp });
      jabsBattler.calculatedRegen = () => 5;

      jabsBattler.processNaturalMpRegen(false);

      expect(gainMp).toHaveBeenCalledWith(10);
    });

    it('processNaturalMpRegen does nothing at full mp', () =>
    {
      const gainMp = vi.fn();
      const jabsBattler = buildBattler();
      jabsBattler.getBattler = () => ({ mp: 100, mmp: 100, mrg: 1, rec: 2, gainMp });

      jabsBattler.processNaturalMpRegen(false);

      expect(gainMp).not.toHaveBeenCalled();
    });

    it('processNaturalTpRegen gains tp scaled by rec when below max', () =>
    {
      const gainTp = vi.fn();
      const jabsBattler = buildBattler();
      jabsBattler.getBattler = () => ({ tp: 1, maxTp: () => 100, trg: 1, rec: 2, gainTp });
      jabsBattler.calculatedRegen = () => 5;

      jabsBattler.processNaturalTpRegen(false);

      expect(gainTp).toHaveBeenCalledWith(10);
    });

    it('processNaturalTpRegen does nothing at full tp', () =>
    {
      const gainTp = vi.fn();
      const jabsBattler = buildBattler();
      jabsBattler.getBattler = () => ({ tp: 100, maxTp: () => 100, trg: 1, rec: 2, gainTp });

      jabsBattler.processNaturalTpRegen(false);

      expect(gainTp).not.toHaveBeenCalled();
    });
  });

  describe('processStateTick', () =>
  {
    /**
     * Builds a fake tracked {@link JABS_State} for the engine lookup to hand back mid-tick.
     * Defaults to no amplification sources so existing rec-only assertions stay unaffected;
     * override `source`/`sourceSkill` per-test to exercise amp behavior.
     */
    function buildJabsState(overrides = {})
    {
      return Object.assign({
        stateId: 1,
        source: { getAllNotes: () => [], getUuid: () => 'source-uuid' },
        sourceSkill: null,
      }, overrides);
    }

    beforeEach(() =>
    {
      globalThis.$jabsEngine = { getJabsStateByUuidAndStateId: vi.fn(() => buildJabsState()) };
    });

    it('does nothing without a battler', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.getBattler = () => null;
      jabsBattler.applySlipEffect = vi.fn();

      jabsBattler.processStateTick({ id: 1 });

      expect(jabsBattler.applySlipEffect).not.toHaveBeenCalled();
    });

    it('does nothing for a dead battler', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.getBattler = () => ({ isDead: () => true });
      jabsBattler.applySlipEffect = vi.fn();

      jabsBattler.processStateTick({ id: 1 });

      expect(jabsBattler.applySlipEffect).not.toHaveBeenCalled();
    });

    it('skips a zero slip value for a given resource', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.getBattler = () => ({ isDead: () => false, rec: 1, getUuid: () => 'uuid' });
      jabsBattler.stateSlipHp = () => 0;
      jabsBattler.stateSlipMp = () => 0;
      jabsBattler.stateSlipTp = () => 0;
      jabsBattler.applySlipEffect = vi.fn();
      jabsBattler.onSlipRegenTick = vi.fn();

      jabsBattler.processStateTick({ id: 1 });

      expect(jabsBattler.applySlipEffect).not.toHaveBeenCalled();
    });

    it('scales a positive (healing) slip value by rec, but not a negative (damage) one', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.getBattler = () => ({
        isDead: () => false, rec: 2, getUuid: () => 'uuid', setLastHitSource: vi.fn(),
      });
      jabsBattler.stateSlipHp = () => 5;
      jabsBattler.stateSlipMp = () => -5;
      jabsBattler.stateSlipTp = () => 0;
      jabsBattler.applySlipEffect = vi.fn();
      jabsBattler.onSlipRegenTick = vi.fn();

      jabsBattler.processStateTick({ id: 1 });

      expect(jabsBattler.applySlipEffect).toHaveBeenCalledWith(10, 0);
      expect(jabsBattler.applySlipEffect).toHaveBeenCalledWith(-5, 1);
    });

    it('records the last-hit source on the battler when the slip amount is damage', () =>
    {
      const jabsBattler = buildBattler();
      const battler = {
        isDead: () => false, rec: 1, getUuid: () => 'uuid', setLastHitSource: vi.fn(),
      };
      jabsBattler.getBattler = () => battler;
      jabsBattler.stateSlipHp = () => -10;
      jabsBattler.stateSlipMp = () => 0;
      jabsBattler.stateSlipTp = () => 0;
      jabsBattler.applySlipEffect = vi.fn();
      jabsBattler.onSlipRegenTick = vi.fn();
      globalThis.$jabsEngine.getJabsStateByUuidAndStateId = vi.fn(() => buildJabsState({ stateId: 9 }));

      jabsBattler.processStateTick({ id: 9 });

      expect(battler.setLastHitSource).toHaveBeenCalledWith('state', 'source-uuid', 9);
    });

    it('does not record a last-hit source when the slip amount is healing, not damage', () =>
    {
      const jabsBattler = buildBattler();
      const battler = {
        isDead: () => false, rec: 1, getUuid: () => 'uuid', setLastHitSource: vi.fn(),
      };
      jabsBattler.getBattler = () => battler;
      jabsBattler.stateSlipHp = () => 10;
      jabsBattler.stateSlipMp = () => 0;
      jabsBattler.stateSlipTp = () => 0;
      jabsBattler.applySlipEffect = vi.fn();
      jabsBattler.onSlipRegenTick = vi.fn();

      jabsBattler.processStateTick({ id: 1 });

      expect(battler.setLastHitSource).not.toHaveBeenCalled();
    });

    it('fires the slip-tick hook with the sign-normalized display amount and state id', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.getBattler = () => ({ isDead: () => false, rec: 1, getUuid: () => 'uuid' });
      jabsBattler.stateSlipHp = () => 5;
      jabsBattler.stateSlipMp = () => 0;
      jabsBattler.stateSlipTp = () => 0;
      jabsBattler.applySlipEffect = vi.fn();
      jabsBattler.onSlipRegenTick = vi.fn();
      globalThis.$jabsEngine.getJabsStateByUuidAndStateId = vi.fn(() => buildJabsState({ stateId: 7 }));

      jabsBattler.processStateTick({ id: 7 });

      expect(jabsBattler.onSlipRegenTick).toHaveBeenCalledWith(-5, 0, 7);
    });

    it('amplifies a healing slip value by the combined battler-wide and skill-scoped HoT amp rate', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.getBattler = () => ({ isDead: () => false, rec: 1, getUuid: () => 'uuid' });
      jabsBattler.stateSlipHp = () => 10;
      jabsBattler.stateSlipMp = () => 0;
      jabsBattler.stateSlipTp = () => 0;
      jabsBattler.applySlipEffect = vi.fn();
      jabsBattler.onSlipRegenTick = vi.fn();
      globalThis.$jabsEngine.getJabsStateByUuidAndStateId = vi.fn(() => buildJabsState({
        source: { getAllNotes: () => [ 'ring-of-mending' ] },
        sourceSkill: 'heal-skill',
      }));
      RPGManager.getSumFromAllNotesByRegex.mockReturnValueOnce(50);
      RPGManager.getNumberFromNoteByRegex.mockReturnValueOnce(25);

      jabsBattler.processStateTick({ id: 1 });

      // rec (1) * (1 + (50 + 25) / 100) = 1.75; 10 * 1.75 = 17.5.
      expect(jabsBattler.applySlipEffect).toHaveBeenCalledWith(17.5, 0);
    });

    it('amplifies a damage slip value by the combined battler-wide and skill-scoped DoT amp rate', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.getBattler = () => ({
        isDead: () => false, rec: 1, getUuid: () => 'uuid', setLastHitSource: vi.fn(),
      });
      jabsBattler.stateSlipHp = () => -10;
      jabsBattler.stateSlipMp = () => 0;
      jabsBattler.stateSlipTp = () => 0;
      jabsBattler.applySlipEffect = vi.fn();
      jabsBattler.onSlipRegenTick = vi.fn();
      globalThis.$jabsEngine.getJabsStateByUuidAndStateId = vi.fn(() => buildJabsState({
        source: { getAllNotes: () => [ 'ring-of-melting' ], getUuid: () => 'source-uuid' },
        sourceSkill: 'poison-skill',
      }));
      RPGManager.getSumFromAllNotesByRegex.mockReturnValueOnce(100);
      RPGManager.getNumberFromNoteByRegex.mockReturnValueOnce(0);

      jabsBattler.processStateTick({ id: 1 });

      // -10 * (1 + 100 / 100) = -20; no REC involvement on the harm side.
      expect(jabsBattler.applySlipEffect).toHaveBeenCalledWith(-20, 0);
    });

    it('does not consult the skill-scoped amp tag when no source skill is on record', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.getBattler = () => ({
        isDead: () => false, rec: 1, getUuid: () => 'uuid', setLastHitSource: vi.fn(),
      });
      jabsBattler.stateSlipHp = () => -10;
      jabsBattler.stateSlipMp = () => 0;
      jabsBattler.stateSlipTp = () => 0;
      jabsBattler.applySlipEffect = vi.fn();
      jabsBattler.onSlipRegenTick = vi.fn();
      globalThis.$jabsEngine.getJabsStateByUuidAndStateId = vi.fn(() => buildJabsState({ sourceSkill: null }));

      // this mock's call history accumulates across the whole file, so clear it immediately
      // before the action under test to make the "not called" assertion below trustworthy.
      RPGManager.getNumberFromNoteByRegex.mockClear();

      jabsBattler.processStateTick({ id: 1 });

      expect(RPGManager.getNumberFromNoteByRegex).not.toHaveBeenCalled();
      expect(jabsBattler.applySlipEffect).toHaveBeenCalledWith(-10, 0);
    });
  });

  describe('shouldProcessState', () =>
  {
    beforeEach(() =>
    {
      globalThis.$jabsEngine = { getJabsStateByUuidAndStateId: vi.fn() };
    });

    it('is true for an untracked passive state', () =>
    {
      globalThis.$jabsEngine.getJabsStateByUuidAndStateId = vi.fn(() => null);
      const jabsBattler = buildBattler();
      jabsBattler.getBattler = () => ({
        getUuid: () => 'uuid', isPassiveState: () => true, removeState: vi.fn(),
      });

      expect(jabsBattler.shouldProcessState({ id: 1 })).toBe(true);
    });

    it('removes and returns false for an untracked, non-passive state', () =>
    {
      globalThis.$jabsEngine.getJabsStateByUuidAndStateId = vi.fn(() => null);
      const removeState = vi.fn();
      const jabsBattler = buildBattler();
      jabsBattler.getBattler = () => ({
        getUuid: () => 'uuid', isPassiveState: () => false, removeState,
      });

      expect(jabsBattler.shouldProcessState({ id: 1 })).toBe(false);
      expect(removeState).toHaveBeenCalledWith(1);
    });

    it('is false for a tracked state with no metadata', () =>
    {
      globalThis.$jabsEngine.getJabsStateByUuidAndStateId = vi.fn(() => ({}));
      const jabsBattler = buildBattler();
      jabsBattler.getBattler = () => ({ getUuid: () => 'uuid' });

      expect(jabsBattler.shouldProcessState({ id: 1, meta: null })).toBe(false);
    });

    it('is true for a tracked state with metadata', () =>
    {
      globalThis.$jabsEngine.getJabsStateByUuidAndStateId = vi.fn(() => ({}));
      const jabsBattler = buildBattler();
      jabsBattler.getBattler = () => ({ getUuid: () => 'uuid' });

      expect(jabsBattler.shouldProcessState({ id: 1, meta: {} })).toBe(true);
    });
  });

  describe('stateSlipHp / stateSlipMp / stateSlipTp', () =>
  {
    it('stateSlipHp sums flat, percent-of-mhp, and formula contributions', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.getBattler = () => ({ mhp: 100 });
      jabsBattler.calculateStateSlipFormula = () => 3;
      const state = {
        jabsSlipHpFlat: 5, jabsSlipHpPercent: 10, jabsSlipHpFormula: 'a.atk',
      };

      // 5 + (100 * 0.10) + 3 = 18.
      expect(jabsBattler.stateSlipHp(state)).toBe(18);
    });

    it('stateSlipHp skips the formula contribution when untagged', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.getBattler = () => ({ mhp: 100 });
      jabsBattler.calculateStateSlipFormula = vi.fn();
      const state = { jabsSlipHpFlat: 5, jabsSlipHpPercent: 0, jabsSlipHpFormula: null };

      expect(jabsBattler.stateSlipHp(state)).toBe(5);
      expect(jabsBattler.calculateStateSlipFormula).not.toHaveBeenCalled();
    });

    it('stateSlipMp sums flat, percent-of-mmp, and formula contributions', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.getBattler = () => ({ mmp: 50 });
      jabsBattler.calculateStateSlipFormula = () => 2;
      const state = {
        jabsSlipMpFlat: 1, jabsSlipMpPercent: 10, jabsSlipMpFormula: 'a.mat',
      };

      // 1 + (50 * 0.10) + 2 = 8.
      expect(jabsBattler.stateSlipMp(state)).toBe(8);
    });

    it('stateSlipMp skips the formula contribution when untagged', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.getBattler = () => ({ mmp: 50 });
      jabsBattler.calculateStateSlipFormula = vi.fn();
      const state = { jabsSlipMpFlat: 1, jabsSlipMpPercent: 0, jabsSlipMpFormula: null };

      expect(jabsBattler.stateSlipMp(state)).toBe(1);
      expect(jabsBattler.calculateStateSlipFormula).not.toHaveBeenCalled();
    });

    it('stateSlipTp sums flat, percent-of-maxTp, and formula contributions', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.getBattler = () => ({ maxTp: () => 20 });
      jabsBattler.calculateStateSlipFormula = () => 1;
      const state = {
        jabsSlipTpFlat: 2, jabsSlipTpPercent: 50, jabsSlipTpFormula: 'a.def',
      };

      // 2 + (20 * 0.50) + 1 = 13.
      expect(jabsBattler.stateSlipTp(state)).toBe(13);
    });

    it('stateSlipTp skips the formula contribution when untagged', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.getBattler = () => ({ maxTp: () => 20 });
      jabsBattler.calculateStateSlipFormula = vi.fn();
      const state = { jabsSlipTpFlat: 2, jabsSlipTpPercent: 0, jabsSlipTpFormula: null };

      expect(jabsBattler.stateSlipTp(state)).toBe(2);
      expect(jabsBattler.calculateStateSlipFormula).not.toHaveBeenCalled();
    });
  });

  describe('calculateModifiedSlipAmount', () =>
  {
    it('applies the healing-over-time amp for a positive (HoT) original amount', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.applyHealingOverTimeAmp = vi.fn(() => 10);
      jabsBattler.applyDamageOverTimeAmp = vi.fn();
      const jabsState = {};

      const result = jabsBattler.calculateModifiedSlipAmount(5, jabsState);

      expect(jabsBattler.applyHealingOverTimeAmp).toHaveBeenCalledWith(5, jabsState);
      expect(result).toEqual(10);
    });

    it('applies the damage-over-time amp for a negative (DoT) original amount', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.applyHealingOverTimeAmp = vi.fn();
      jabsBattler.applyDamageOverTimeAmp = vi.fn(() => -8);
      const jabsState = {};

      const result = jabsBattler.calculateModifiedSlipAmount(-5, jabsState);

      expect(jabsBattler.applyDamageOverTimeAmp).toHaveBeenCalledWith(-5, jabsState);
      expect(result).toEqual(-8);
    });

    it('returns the original value unmodified when it is exactly zero', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.applyHealingOverTimeAmp = vi.fn();
      jabsBattler.applyDamageOverTimeAmp = vi.fn();

      const result = jabsBattler.calculateModifiedSlipAmount(0, {});

      expect(jabsBattler.applyHealingOverTimeAmp).not.toHaveBeenCalled();
      expect(jabsBattler.applyDamageOverTimeAmp).not.toHaveBeenCalled();
      expect(result).toEqual(0);
    });

    it('returns the original value unmodified when it is NaN (fails both the HoT and DoT checks)', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.applyHealingOverTimeAmp = vi.fn();
      jabsBattler.applyDamageOverTimeAmp = vi.fn();

      const result = jabsBattler.calculateModifiedSlipAmount(NaN, {});

      expect(jabsBattler.applyHealingOverTimeAmp).not.toHaveBeenCalled();
      expect(jabsBattler.applyDamageOverTimeAmp).not.toHaveBeenCalled();
      expect(result).toBeNaN();
    });
  });

  describe('calculateStateSlipFormula', () =>
  {
    beforeEach(() =>
    {
      globalThis.$jabsEngine = { getJabsStateByUuidAndStateId: vi.fn() };
    });

    it('uses the battler as both source and afflicted when no tracked state exists', () =>
    {
      globalThis.$jabsEngine.getJabsStateByUuidAndStateId = vi.fn(() => null);
      const battler = { getUuid: () => 'uuid' };
      const jabsBattler = buildBattler();
      jabsBattler.slipEval = vi.fn(() => 5);

      jabsBattler.calculateStateSlipFormula('a.atk', battler, { id: 1 });

      expect(jabsBattler.slipEval).toHaveBeenCalledWith('a.atk', battler, battler, { id: 1 });
    });

    it('uses the tracked state\'s source/battler when a tracked state exists', () =>
    {
      const source = {};
      const afflicted = {};
      globalThis.$jabsEngine.getJabsStateByUuidAndStateId = vi.fn(() => ({ source, battler: afflicted }));
      const battler = { getUuid: () => 'uuid' };
      const jabsBattler = buildBattler();
      jabsBattler.slipEval = vi.fn(() => 5);

      jabsBattler.calculateStateSlipFormula('a.atk', battler, { id: 1 });

      expect(jabsBattler.slipEval).toHaveBeenCalledWith('a.atk', source, afflicted, { id: 1 });
    });
  });

  describe('slipEval', () =>
  {
    beforeEach(() =>
    {
      globalThis.$gameVariables = { _data: [ 0, 10 ] };
    });

    it('evaluates the formula with a/b/v/s bindings, negated and rounded', () =>
    {
      const jabsBattler = buildBattler();
      const source = { atk: 10 };
      const afflicted = {};
      const state = { id: 1 };

      const result = jabsBattler.slipEval('a.atk', source, afflicted, state);

      expect(result).toBe(-10);
    });

    it('throws for a formula that produces non-finite output', () =>
    {
      const jabsBattler = buildBattler();
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const traceSpy = vi.spyOn(console, 'trace').mockImplementation(() => {});

      expect(() => jabsBattler.slipEval('1/0 - Infinity', {}, {}, {})).toThrow();

      warnSpy.mockRestore();
      traceSpy.mockRestore();
    });

    it('throws and logs for an invalid formula expression', () =>
    {
      const jabsBattler = buildBattler();
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const traceSpy = vi.spyOn(console, 'trace').mockImplementation(() => {});

      expect(() => jabsBattler.slipEval('this is not valid js;;;', {}, {}, {})).toThrow();

      expect(warnSpy).toHaveBeenCalled();
      warnSpy.mockRestore();
      traceSpy.mockRestore();
    });
  });

  describe('applySlipEffect', () =>
  {
    it('gains hp for type 0', () =>
    {
      const gainHp = vi.fn();
      const jabsBattler = buildBattler();
      jabsBattler.getBattler = () => ({ gainHp });

      jabsBattler.applySlipEffect(10, 0);

      expect(gainHp).toHaveBeenCalledWith(10);
    });

    it('gains mp for type 1', () =>
    {
      const gainMp = vi.fn();
      const jabsBattler = buildBattler();
      jabsBattler.getBattler = () => ({ gainMp });

      jabsBattler.applySlipEffect(10, 1);

      expect(gainMp).toHaveBeenCalledWith(10);
    });

    it('gains tp for type 2', () =>
    {
      const gainTp = vi.fn();
      const jabsBattler = buildBattler();
      jabsBattler.getBattler = () => ({ gainTp });

      jabsBattler.applySlipEffect(10, 2);

      expect(gainTp).toHaveBeenCalledWith(10);
    });
  });

  describe('onSlipRegenTick', () =>
  {
    it('is a no-op', () =>
    {
      const jabsBattler = buildBattler();
      expect(() => jabsBattler.onSlipRegenTick(-5, 0, 1)).not.toThrow();
    });
  });
  //endregion regeneration

  //region timers
  describe('setWaitCountdown / isWaiting', () =>
  {
    it('resets and re-arms the wait timer', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler._waitTimer.setMaxTime = vi.fn();

      jabsBattler.setWaitCountdown(30);

      expect(jabsBattler._waitTimer.resetCalled).toBe(true);
      expect(jabsBattler._waitTimer.setMaxTime).toHaveBeenCalledWith(30);
    });

    it('isWaiting reflects the inverse of timer completion', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler._waitTimer._complete = false;
      expect(jabsBattler.isWaiting()).toBe(true);

      jabsBattler._waitTimer._complete = true;
      expect(jabsBattler.isWaiting()).toBe(false);
    });
  });

  describe('countdownCastTime', () =>
  {
    it('performs the cast animation every tick', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.performCastAnimation = vi.fn();
      jabsBattler._castTimeCountdown = 5;

      jabsBattler.countdownCastTime();

      expect(jabsBattler.performCastAnimation).toHaveBeenCalledTimes(1);
    });

    it('decrements the countdown while positive without ending the cast', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.performCastAnimation = vi.fn();
      jabsBattler._castTimeCountdown = 5;
      jabsBattler._casting = true;

      jabsBattler.countdownCastTime();

      expect(jabsBattler._castTimeCountdown).toBe(4);
      expect(jabsBattler.isCasting()).toBe(true);
    });

    it('ends the cast once the countdown reaches 0', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.performCastAnimation = vi.fn();
      jabsBattler._castTimeCountdown = 0;
      jabsBattler._casting = true;

      jabsBattler.countdownCastTime();

      expect(jabsBattler.isCasting()).toBe(false);
      expect(jabsBattler._castTimeCountdown).toBe(0);
    });

    it('does not end the cast for a NaN countdown (neither comparison is true)', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.performCastAnimation = vi.fn();
      jabsBattler._castTimeCountdown = NaN;
      jabsBattler._casting = true;

      jabsBattler.countdownCastTime();

      expect(jabsBattler.isCasting()).toBe(true);
    });
  });

  describe('performCastAnimation / canPerformCastAnimation', () =>
  {
    it('does not show an animation when it cannot perform one', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.canPerformCastAnimation = () => false;
      jabsBattler.showAnimation = vi.fn();

      jabsBattler.performCastAnimation();

      expect(jabsBattler.showAnimation).not.toHaveBeenCalled();
    });

    it('shows the decided action\'s cast animation when able', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.canPerformCastAnimation = () => true;
      jabsBattler.showAnimation = vi.fn();
      jabsBattler.setDecidedAction([ { getCastAnimation: () => 42 } ]);

      jabsBattler.performCastAnimation();

      expect(jabsBattler.showAnimation).toHaveBeenCalledWith(42);
    });

    it('canPerformCastAnimation is false without a decided action', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.getDecidedAction = () => null;

      expect(jabsBattler.canPerformCastAnimation()).toBe(false);
    });

    it('canPerformCastAnimation is false when the skill has no cast animation', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.setDecidedAction([ { getCastAnimation: () => 0 } ]);

      expect(jabsBattler.canPerformCastAnimation()).toBe(false);
    });

    it('canPerformCastAnimation is false while another animation is already showing', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.setDecidedAction([ { getCastAnimation: () => 42 } ]);
      jabsBattler.isShowingAnimation = () => true;

      expect(jabsBattler.canPerformCastAnimation()).toBe(false);
    });

    it('canPerformCastAnimation is true otherwise', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.setDecidedAction([ { getCastAnimation: () => 42 } ]);
      jabsBattler.isShowingAnimation = () => false;

      expect(jabsBattler.canPerformCastAnimation()).toBe(true);
    });
  });

  describe('setCastCountdown / isCasting / cast time countdown accessors', () =>
  {
    it('flags casting true when the given cast time is positive', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.setCastCountdown(10);

      expect(jabsBattler.isCasting()).toBe(true);
      expect(jabsBattler.getCastTimeCountdown()).toBe(10);
    });

    it('flags casting false and zeroes the countdown for a non-positive cast time', () =>
    {
      // Arrange
      const jabsBattler = buildBattler();
      // start mid-cast, so clearing the flag is something the act has to actually do.
      jabsBattler.setCastCountdown(10);
      expect(jabsBattler.isCasting()).toBe(true);

      // Act
      jabsBattler.setCastCountdown(0);

      // Assert
      expect(jabsBattler.isCasting()).toBe(false);
      expect(jabsBattler.getCastTimeCountdown()).toBe(0);
    });

    it('setCastTimeCountdown/getCastTimeCountdown track the raw value', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.setCastTimeCountdown(15);

      expect(jabsBattler.getCastTimeCountdown()).toBe(15);
    });
  });

  describe('countdownAlert / clearAlert', () =>
  {
    it('decrements the alerted counter while positive', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler._alertedCounter = 5;
      jabsBattler.clearAlert = vi.fn();

      jabsBattler.countdownAlert();

      expect(jabsBattler._alertedCounter).toBe(4);
      expect(jabsBattler.clearAlert).not.toHaveBeenCalled();
    });

    it('clears the alert once the counter reaches 0', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler._alertedCounter = 0;
      jabsBattler.clearAlert = vi.fn();

      jabsBattler.countdownAlert();

      expect(jabsBattler.clearAlert).toHaveBeenCalledTimes(1);
    });

    it('does not clear the alert for a NaN counter (neither comparison is true)', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler._alertedCounter = NaN;
      jabsBattler.clearAlert = vi.fn();

      jabsBattler.countdownAlert();

      expect(jabsBattler.clearAlert).not.toHaveBeenCalled();
    });

    it('clearAlert resets the alerted flag and counter', () =>
    {
      const jabsBattler = buildBattler();
      jabsBattler.setAlerted(true);
      jabsBattler._alertedCounter = 10;

      jabsBattler.clearAlert();

      expect(jabsBattler.isAlerted()).toBe(false);
      expect(jabsBattler._alertedCounter).toBe(0);
    });
  });
  //endregion timers
});
//endregion plugins/abs/core/models/jabs-battler.test.js
