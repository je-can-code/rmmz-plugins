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
});
//endregion plugins/abs/core/models/jabs-battler.test.js
