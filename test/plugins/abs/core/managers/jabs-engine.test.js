//region plugins/abs/core/managers/jabs-engine.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * JABS_Engine.js is the core combat engine every abs/ext pack aliases into. It is a genuine ES
 * `class` (not a prototype-patch file), so this file dynamically imports it directly rather than
 * patching a bare global constructor. Every sibling model/manager it imports is mocked per the
 * "unit tier mocks all downstream file-external dependencies" convention- see
 * JABS_Aabb (a lightweight functional stand-in is used since several static geometry methods
 * construct real instances and call real methods on them) for the one exception worth calling out.
 */
describe('JABS_Engine (unit, all downstream dependencies mocked)', () =>
{
  /** @type {typeof import('../../../../../src/plugins/abs/core/managers/JABS_Engine.js').default} */
  let JABS_Engine;
  let respawnCreateRecordMock;
  let respawnIsDueMock;

  /** faithful functional stand-in for JABS_Aabb- several static geometry methods construct real
   *  instances and call real methods on them, so a bare mock would be more work than just mirroring
   *  the (already-pure, already-tested-separately) real implementation. */
  class FakeAabb
  {
    constructor(x, y, w, h)
    {
      this.x = x;
      this.y = y;
      this.w = w;
      this.h = h;
      this.cx = x + (w / 2);
      this.cy = y + (h / 2);
    }

    static fromFeet(feetX, feetY, tw, th)
    {
      return new FakeAabb(feetX - (tw / 2), feetY - th, tw, th);
    }

    static centerSized(cx, cy, w, h)
    {
      return new FakeAabb(cx - (w / 2), cy - (h / 2), w, h);
    }

    intersectsRect(other)
    {
      return !(other.x > (this.x + this.w)
        || (other.x + other.w) < this.x
        || other.y > (this.y + this.h)
        || (other.y + other.h) < this.y);
    }

    intersectsCircle(cx, cy, r)
    {
      const closestX = Math.max(this.x, Math.min(cx, this.x + this.w));
      const closestY = Math.max(this.y, Math.min(cy, this.y + this.h));
      const dx = cx - closestX;
      const dy = cy - closestY;
      return (dx * dx + dy * dy) <= (r * r);
    }

    expanded(padX, padY)
    {
      return new FakeAabb(this.x - padX, this.y - padY, this.w + (2 * padX), this.h + (2 * padY));
    }
  }

  beforeAll(async () =>
  {
    vi.resetModules();

    // vanilla RMMZ core prototype extensions (rmmz_core.js), not part of this plugin- stubbed
    // explicitly rather than relying on another test file having already mutated the prototype.
    String.prototype.format = function(...args)
    {
      return this.replace(/%([0-9]+)/g, (_match, n) => args[Number(n) - 1]);
    };
    Number.prototype.padZero = function(length)
    {
      return String(this).padStart(length, '0');
    };
    Object.defineProperty(Array, 'empty', {
      enumerable: true,
      configurable: true,
      get: () => Array.of(),
    });
    Object.defineProperty(String, 'empty', {
      enumerable: true,
      configurable: true,
      get: () => '',
    });

    globalThis.J = {
      ABS: {
        Metadata: {
          DefaultEnemyMapId: 5,
          HitboxMeleeOriginOffsetPxX: 0,
          HitboxMeleeOriginOffsetPxY: 0,
          HitboxMeleeOriginExtraPxYFacingDown: 10,
          HitboxMeleeOriginExtraPxYFacingUp: -10,
          HitboxMeleeOriginLiftReductionPxFacingDown: 6,
          AiComboHumanizeWindowMinPercent: 0.2,
          AiComboHumanizeWindowMaxPercent: 0.8,
          ImplicitParryBaselineFloor: 10,
          ImplicitParryBaselinePerLevel: 0,
          ImplicitParryDominanceMultiplier: 2,
          GlancingBlowDominanceMultiplier: 1.5,
          HitboxOverlaysInitiallyVisible: false,
          BaseAggro: 5,
          AggroPerHp: 1,
          AggroPerMp: 2,
          AggroPerTp: 10,
          AggroDrain: 3,
          AggroParryFlatAmount: -50,
          AggroParryUserGain: 25,
          AggroPlayerReduction: 0.5,
        },
        Directions: {
          UP: 8, RIGHT: 6, LEFT: 4, DOWN: 2,
          LOWERLEFT: 1, LOWERRIGHT: 3, UPPERLEFT: 7, UPPERRIGHT: 9,
        },
        ProjectileFormations: { Line: 'line', Spray: 'spray', Cross: 'cross', Xburst: 'xburst', Nova: 'nova' },
        Globals: { GlobalCooldownKey: 'gcd' },
        RegExp: { KnockbackResist: /knockbackResist/i, ProximityKnockback: /proximityKnockback/i },
      },
      LEVEL: false,
    };

    // bare RMMZ-adjacent global (not imported by JABS_Engine.js- referenced directly as a static utility).
    globalThis.RPGManager = {
      getSumFromAllNotesByRegex: vi.fn(() => 0),
      getArraysFromNotesByRegex: vi.fn(() => []),
      fateOf100: vi.fn(() => false),
      getNumberFromNoteByRegex: vi.fn(() => 0),
    };

    // bare RMMZ-style global (not imported by JABS_Engine.js- loaded elsewhere at runtime).
    globalThis.JABS_Button = { Offhand: 'offhand', Mainhand: 'mainhand' };

    // sibling model/manager dependencies- mocked entirely per the unit-tier convention.
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
    vi.doMock('../../../../../src/plugins/abs/core/models/JABS_SkillExecution.js', () => ({
      default: class
      {
        constructor(skillId, skillTypeId)
        {
          this.skillId = skillId;
          this.skillTypeId = skillTypeId;
        }
      },
    }));
    vi.doMock('../../../../../src/plugins/abs/core/models/JABS_State.js', () => ({
      default: class
      {
        static reapplicationType = { Refresh: 'refresh', Extend: 'extend', Stack: 'stack' };
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
    vi.doMock('../../../../../src/plugins/abs/core/models/JABS_LootDrop.js', () => ({
      // the engine reads uuid() and writes setDuration() on every loot it creates.
      default: class
      {
        _uuid = 'mock-loot-uuid';
        _duration = 0;
        uuid() { return this._uuid; }
        duration() { return this._duration; }
        setDuration(v) { this._duration = v; }
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
    vi.doMock('../../../../../src/plugins/abs/core/models/JABS_InputAdapter.js', () => ({
      default: class
      {
        static hasControllers()
        {
          return true;
        }
      },
    }));
    vi.doMock('../../../../../src/plugins/abs/core/models/JABS_GlobalCooldown.js', () => ({
      default: class
      {
        static skillIsSubjectToGlobalCooldown()
        {
          return false;
        }

        static framesForSkill()
        {
          return 0;
        }

        static reducedFramesForCaster()
        {
          return 0;
        }
      },
    }));
    vi.doMock('../../../../../src/plugins/abs/core/models/JABS_Battler.js', () => ({
      default: class
      {
        static isGuardSkillById()
        {
          return false;
        }

        static createPlayer()
        {
          return {};
        }
      },
    }));
    vi.doMock('../../../../../src/plugins/abs/core/managers/JABS_AiManager.js', () => ({ default: class {} }));
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
      },
    }));
    vi.doMock('../../../../../src/plugins/abs/core/models/JABS_Action.js', () => ({ default: class {} }));
    vi.doMock('../../../../../src/plugins/abs/core/models/JABS_Aabb.js', () => ({ default: FakeAabb }));
    vi.doMock('../../../../../src/plugins/abs/core/models/JABS_DeathContext.js', () => ({
      default: class
      {
        constructor(elementIds, hitType, stypeId, killerUuid)
        {
          this.elementIds = elementIds;
          this.hitType = hitType;
          this.stypeId = stypeId;
          this.killerUuid = killerUuid;
        }
      },
    }));

    respawnCreateRecordMock = vi.fn();
    respawnIsDueMock = vi.fn();
    vi.doMock('../../../../../src/plugins/abs/core/managers/JABS_RespawnManager.js', () => ({
      default: class
      {
        static createRecord(event, enemy)
        {
          return respawnCreateRecordMock(event, enemy);
        }

        static isDue(record)
        {
          return respawnIsDueMock(record);
        }
      },
    }));

    ({ default: JABS_Engine } = await import('../../../../../src/plugins/abs/core/managers/JABS_Engine.js'));
  });

  beforeEach(() =>
  {
    globalThis.$gameMap = { tileWidth: () => 48, tileHeight: () => 48 };
    globalThis.Graphics = { frameCount: 1000 };
    // the enemy clone list is static/module-level state that outlives any single test- reset it
    // so tests don't leak into each other regardless of execution order.
    JABS_Engine.setEnemyCloneList(null);
    // resetting the clone list above means every `new JABS_Engine()` call re-triggers the
    // constructor's initializeEnemyMap() fetch- default it to a harmless no-op response so tests
    // that don't care about enemy-map bootstrapping (i.e. almost all of them) don't need their own.
    globalThis.fetch = vi.fn(() => Promise.resolve({ json: () => Promise.resolve({ events: [] }) }));
    globalThis.RPGManager.getSumFromAllNotesByRegex.mockReset().mockReturnValue(0);
    globalThis.RPGManager.getArraysFromNotesByRegex.mockReset().mockReturnValue([]);
    globalThis.RPGManager.fateOf100.mockReset().mockReturnValue(false);
    globalThis.RPGManager.getNumberFromNoteByRegex.mockReset().mockReturnValue(0);
  });

  //region static: enemy clone list
  describe('getEnemyCloneList / setEnemyCloneList', () =>
  {
    it('tracks the enemy clone list independently of instance state', () =>
    {
      const enemies = [ { id: 1 } ];
      JABS_Engine.setEnemyCloneList(enemies);
      expect(JABS_Engine.getEnemyCloneList()).toBe(enemies);
    });
  });

  describe('initializeEnemyMap', () =>
  {
    it('fetches the configured enemy map and populates the clone list from its events', async () =>
    {
      // Arrange
      const events = [ null, { id: 'enemy-event' } ];
      globalThis.fetch = vi.fn(() => Promise.resolve({ json: () => Promise.resolve({ events }) }));

      // Act
      JABS_Engine.initializeEnemyMap();
      // flush the microtask queue past the two chained .then() hops- a macrotask boundary
      // guarantees every pending microtask (including the flattened nested promise from
      // data.json()) has settled before we assert.
      await new Promise((resolve) => { setTimeout(resolve, 0); });

      // Assert
      expect(globalThis.fetch).toHaveBeenCalledWith('data/Map005.json');
      expect(JABS_Engine.getEnemyCloneList()).toBe(events);
    });
  });

  describe('constructor enemy-map bootstrapping', () =>
  {
    it('kicks off enemy-map initialization when the clone list has never been populated', () =>
    {
      // Arrange- the shared beforeEach already nulled the clone list and installed a fetch spy.
      globalThis.fetch.mockClear();

      // Act
      const engine = new JABS_Engine();

      // Assert- the fetch is the only observable evidence the enemy map bootstrap ran.
      expect(globalThis.fetch).toHaveBeenCalledWith('data/Map005.json');
      expect(engine.getAllActionEvents()).toEqual([]);
    });

    it('skips enemy-map initialization when the clone list is already populated', () =>
    {
      // Arrange- a populated list is the near-miss sibling of the null list above.
      JABS_Engine.setEnemyCloneList([ { id: 'already-loaded' } ]);
      globalThis.fetch.mockClear();

      // Act
      const engine = new JABS_Engine();

      // Assert- construction still completes, it just does not re-fetch the map.
      expect(globalThis.fetch).not.toHaveBeenCalled();
      expect(engine.getAllActionEvents()).toEqual([]);
    });
  });
  //endregion static: enemy clone list

  //region static: geometry
  describe('getBattlerAabbModel', () =>
  {
    it('returns an empty rect when there is no character', () =>
    {
      const result = JABS_Engine.getBattlerAabbModel(null);
      expect(result).toMatchObject({ x: 0, y: 0, w: 0, h: 0 });
    });

    it('builds a feet-anchored AABB one tile tall/wide from the character\'s screen position', () =>
    {
      const character = { screenX: () => 100, screenY: () => 200 };
      const result = JABS_Engine.getBattlerAabbModel(character);
      expect(result).toMatchObject({ x: 100 - 24, y: 200 - 48, w: 48, h: 48 });
    });
  });

  describe('resolveMeleeOriginPixelOffsetsForFacing', () =>
  {
    it('suppresses the Y offset entirely for left/right facings', () =>
    {
      expect(JABS_Engine.resolveMeleeOriginPixelOffsetsForFacing(4)).toEqual({ ox: 0, oy: 0 });
      expect(JABS_Engine.resolveMeleeOriginPixelOffsetsForFacing(6)).toEqual({ ox: 0, oy: 0 });
    });

    it('adds the full down-facing extra Y offset when facing straight down', () =>
    {
      expect(JABS_Engine.resolveMeleeOriginPixelOffsetsForFacing(2)).toEqual({ ox: 0, oy: 10 });
    });

    it('adds the full up-facing extra Y offset when facing straight up', () =>
    {
      expect(JABS_Engine.resolveMeleeOriginPixelOffsetsForFacing(8)).toEqual({ ox: 0, oy: -10 });
    });

    it('adds half the down-facing extra Y offset for down-diagonal facings', () =>
    {
      expect(JABS_Engine.resolveMeleeOriginPixelOffsetsForFacing(1)).toEqual({ ox: 0, oy: 5 });
      expect(JABS_Engine.resolveMeleeOriginPixelOffsetsForFacing(3)).toEqual({ ox: 0, oy: 5 });
    });

    it('adds half the up-facing extra Y offset for up-diagonal facings', () =>
    {
      expect(JABS_Engine.resolveMeleeOriginPixelOffsetsForFacing(7)).toEqual({ ox: 0, oy: -5 });
      expect(JABS_Engine.resolveMeleeOriginPixelOffsetsForFacing(9)).toEqual({ ox: 0, oy: -5 });
    });

    it('adds no extra Y offset for an unrecognized facing value', () =>
    {
      expect(JABS_Engine.resolveMeleeOriginPixelOffsetsForFacing(5)).toEqual({ ox: 0, oy: 0 });
    });

    it('suppresses a non-zero global Y offset for left/right facings only', () =>
    {
      // Arrange- the shared metadata fixture configures a zero base Y offset, which makes
      // "suppressed" and "not suppressed" the same number for every facing. a non-zero base
      // is the only configuration where the left/right bypass is observable at all.
      globalThis.J.ABS.Metadata.HitboxMeleeOriginOffsetPxY = 12;

      // Act
      const facingLeft = JABS_Engine.resolveMeleeOriginPixelOffsetsForFacing(4);
      const facingRight = JABS_Engine.resolveMeleeOriginPixelOffsetsForFacing(6);
      const facingOther = JABS_Engine.resolveMeleeOriginPixelOffsetsForFacing(5);

      // Assert- both lateral facings drop the base entirely, the sibling facing keeps it.
      expect(facingLeft).toEqual({ ox: 0, oy: 0 });
      expect(facingRight).toEqual({ ox: 0, oy: 0 });
      expect(facingOther).toEqual({ ox: 0, oy: 12 });

      globalThis.J.ABS.Metadata.HitboxMeleeOriginOffsetPxY = 0;
    });
  });

  describe('resolveMeleeVerticalLiftPxForFacing', () =>
  {
    it('lifts by half a tile by default', () =>
    {
      expect(JABS_Engine.resolveMeleeVerticalLiftPxForFacing(6)).toBe(24);
    });

    it('reduces lift fully for straight-down facing', () =>
    {
      expect(JABS_Engine.resolveMeleeVerticalLiftPxForFacing(2)).toBe(18);
    });

    it('reduces lift by half for down-diagonal facings', () =>
    {
      expect(JABS_Engine.resolveMeleeVerticalLiftPxForFacing(1)).toBe(21);
      expect(JABS_Engine.resolveMeleeVerticalLiftPxForFacing(3)).toBe(21);
    });

    it('clamps the lift to a sane minimum so it never collapses to zero or negative', () =>
    {
      globalThis.$gameMap.tileHeight = () => 10;
      // reduction (6) would take an 8px down-lift below the 8px/1.8px floor without the clamp.
      const result = JABS_Engine.resolveMeleeVerticalLiftPxForFacing(2);
      expect(result).toBeGreaterThanOrEqual(8);
    });
  });

  describe('getActionOriginPixels', () =>
  {
    it('returns a neutral origin when there is no action event', () =>
    {
      expect(JABS_Engine.getActionOriginPixels(null)).toEqual({ x: 0, y: 0 });
    });

    it('defaults facing to down when the action event has no jabs action', () =>
    {
      const actionEvent = { getJabsAction: () => null, screenX: () => 100, screenY: () => 200 };
      const result = JABS_Engine.getActionOriginPixels(actionEvent);
      // facing 2 (down): oy=10, lift=18 -> y = 200 - 18 + 10 = 192.
      expect(result).toEqual({ x: 100, y: 192 });
    });

    it('reads facing from the action event\'s jabs action when present', () =>
    {
      const actionEvent = {
        getJabsAction: () => ({ direction: () => 8 }),
        screenX: () => 100,
        screenY: () => 200,
      };
      const result = JABS_Engine.getActionOriginPixels(actionEvent);
      // facing 8 (up): oy=-10, lift=24 -> y = 200 - 24 + (-10) = 166.
      expect(result).toEqual({ x: 100, y: 166 });
    });
  });

  describe('getMeleeVisualOriginPixelsFromCharacter', () =>
  {
    it('returns a neutral origin when there is no character', () =>
    {
      expect(JABS_Engine.getMeleeVisualOriginPixelsFromCharacter(null)).toEqual({ x: 0, y: 0 });
    });

    it('derives origin from the character\'s own current facing', () =>
    {
      const character = { direction: () => 2, screenX: () => 50, screenY: () => 60 };
      const result = JABS_Engine.getMeleeVisualOriginPixelsFromCharacter(character);
      // facing 2 (down): oy=10, lift=18 -> y = 60 - 18 + 10 = 52.
      expect(result).toEqual({ x: 50, y: 52 });
    });
  });
  //endregion static: geometry

  //region static: AI combo timing
  describe('computeAiComboHumanizedReadyFrameForSkill', () =>
  {
    it('handles a cooldown shorter than (or equal to) the delay by using a 1-frame window', () =>
    {
      // maxFrames = Math.max(cooldownFrames, delayFrames + 1) guarantees windowWidth is always
      // >= 1, so the `if (windowWidth <= 0)` branch in the source is actually unreachable dead
      // code- this asserts the narrowest real window (cooldown <= delay) collapses to a single
      // frame of "humanize" jitter instead of the wider window the other test exercises.
      vi.spyOn(Math, 'random').mockReturnValue(0);
      const skill = { jabsComboDelay: 30, jabsCooldown: 10 };
      const result = JABS_Engine.computeAiComboHumanizedReadyFrameForSkill(skill);
      expect(result).toBe(1000 + 30);
      Math.random.mockRestore();
    });

    it('picks a randomized ready frame within the configured humanize window', () =>
    {
      const skill = { jabsComboDelay: 10, jabsCooldown: 60 };
      vi.spyOn(Math, 'random').mockReturnValue(0);

      // pct = min (0.2); windowWidth = 60-10=50; offset = 10 + round(0.2*50) = 10+10=20.
      const resultAtMin = JABS_Engine.computeAiComboHumanizedReadyFrameForSkill(skill);
      expect(resultAtMin).toBe(1000 + 20);

      Math.random.mockReturnValue(1);
      // pct = max (0.8); offset = 10 + round(0.8*50) = 10+40=50.
      const resultAtMax = JABS_Engine.computeAiComboHumanizedReadyFrameForSkill(skill);
      expect(resultAtMax).toBe(1000 + 50);

      Math.random.mockRestore();
    });
  });
  //endregion static: AI combo timing

  //region static: defensive formulas
  describe('implicitParryChancePercent / glancingBlowChancePercent', () =>
  {
    function buildBattler(overrides = {})
    {
      return Object.assign({ getBattler: () => Object.assign({ level: 1, grd: 1, agi: 0, luk: 0, hit: 0 }, overrides) });
    }

    it('returns 0 when the attacker overwhelmingly dominates the defender', () =>
    {
      const caster = buildBattler({ hit: 100 });
      const target = buildBattler({ grd: 1 });
      expect(JABS_Engine.implicitParryChancePercent(caster, target, 0)).toBe(0);
    });

    it('returns 100 when the defender overwhelmingly dominates the attacker', () =>
    {
      const caster = buildBattler({ hit: 0 });
      const target = buildBattler({ grd: 100 });
      expect(JABS_Engine.implicitParryChancePercent(caster, target, 0)).toBe(100);
    });

    it('interpolates a mid-range chance when pressures are close', () =>
    {
      const caster = buildBattler({ hit: 0 });
      const target = buildBattler({ grd: 1 });
      const result = JABS_Engine.implicitParryChancePercent(caster, target, 0);
      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThan(100);
    });

    it('reduces the defender\'s effective pressure as ignoreParryPercent increases', () =>
    {
      const caster = buildBattler({ hit: 5 });
      const target = buildBattler({ grd: 5 });
      const withoutIgnore = JABS_Engine.implicitParryChancePercent(caster, target, 0);
      const withIgnore = JABS_Engine.implicitParryChancePercent(caster, target, 50);
      expect(withIgnore).toBeLessThanOrEqual(withoutIgnore);
    });

    it('applies the level-scaling multiplier to attacker pressure when J-LevelScaling is active', () =>
    {
      globalThis.J.LEVEL = true;
      globalThis.$gameSystem = { isLevelScalingEnabled: () => true };
      globalThis.LevelScaling = { Scope: { COMBAT: 'combat' }, multiplier: vi.fn(() => 2) };
      const caster = buildBattler({ hit: 5 });
      const target = buildBattler({ grd: 5 });

      JABS_Engine.implicitParryChancePercent(caster, target, 0);

      expect(globalThis.LevelScaling.multiplier).toHaveBeenCalledWith(1, 1, 'combat');
      globalThis.J.LEVEL = false;
    });

    it('defaults ignoreParryPercent to 0 when not provided', () =>
    {
      const caster = buildBattler({ hit: 5 });
      const target = buildBattler({ grd: 5 });
      const withZero = JABS_Engine.implicitParryChancePercent(caster, target, 0);
      const withUndefined = JABS_Engine.implicitParryChancePercent(caster, target, undefined);
      expect(withUndefined).toBe(withZero);
    });

    it('clamps a dominance multiplier of 0 to the safe default of 2', () =>
    {
      globalThis.J.ABS.Metadata.ImplicitParryDominanceMultiplier = 0;
      const caster = buildBattler({ hit: 5 });
      const target = buildBattler({ grd: 5 });

      expect(JABS_Engine.implicitParryChancePercent(caster, target, 0)).toBe(50);

      globalThis.J.ABS.Metadata.ImplicitParryDominanceMultiplier = 2;
    });

    it('clamps a dominance multiplier below 1 to the safe default of 2', () =>
    {
      // Arrange- a multiplier of 0.5 is finite but inverts the band (1/M = 2), so honoring it
      // would make the defender "dominant" at any pressure ratio at or under 2 and pin the
      // chance at 100. the clamp is what keeps the band widening rather than inverting.
      globalThis.J.ABS.Metadata.ImplicitParryDominanceMultiplier = 0.5;
      const caster = buildBattler({ hit: 5 });
      const target = buildBattler({ grd: 5 });

      // Act
      const result = JABS_Engine.implicitParryChancePercent(caster, target, 0);

      // Assert
      expect(result).toBe(50);

      globalThis.J.ABS.Metadata.ImplicitParryDominanceMultiplier = 2;
    });

    it('glancingBlowChancePercent uses its own dominance multiplier, independent of implicit parry', () =>
    {
      const caster = buildBattler({ hit: 5 });
      const target = buildBattler({ grd: 5 });
      const parryChance = JABS_Engine.implicitParryChancePercent(caster, target, 0);
      const glancingChance = JABS_Engine.glancingBlowChancePercent(caster, target, 0);
      // different dominance multipliers (2 vs 1.5) over an identical A/D pressure pair produce
      // different interpolated chances.
      expect(glancingChance).not.toBe(parryChance);
    });
  });
  //endregion static: defensive formulas

  //region init
  describe('initialize', () =>
  {
    it('resets ephemeral map-transfer state on a real transfer', () =>
    {
      const engine = new JABS_Engine();
      engine.addActionEvent({ id: 'stale-action' });
      engine.initialize(true);
      expect(engine.getAllActionEvents()).toEqual([]);
      expect(engine._activeActions).toEqual([]);
    });

    it('preserves jabs states and skill execution log across a map transfer', () =>
    {
      const engine = new JABS_Engine();
      engine.getJabsStates()
        .set('uuid-1', new Map());
      engine.initialize(true);
      expect(engine.getJabsStates().has('uuid-1')).toBe(true);
    });

    it('discards jabs states and skill execution log on a non-transfer (fresh game) init', () =>
    {
      const engine = new JABS_Engine();
      engine.getJabsStates()
        .set('uuid-1', new Map());
      engine.initialize(false);
      expect(engine.getJabsStates().has('uuid-1')).toBe(false);
    });

    it('seeds hitboxOverlaysVisible from metadata on first construction (fixed- field default is now null, not false)', () =>
    {
      globalThis.J.ABS.Metadata.HitboxOverlaysInitiallyVisible = true;
      const engine = new JABS_Engine();
      expect(engine.hitboxOverlaysVisible).toBe(true);

      globalThis.J.ABS.Metadata.HitboxOverlaysInitiallyVisible = false;
    });

    it('does read the metadata default on a non-transfer (fresh game) init, since that branch is unconditional', () =>
    {
      globalThis.J.ABS.Metadata.HitboxOverlaysInitiallyVisible = true;
      const engine = new JABS_Engine();
      engine.initialize(false);
      expect(engine.hitboxOverlaysVisible).toBe(true);

      globalThis.J.ABS.Metadata.HitboxOverlaysInitiallyVisible = false;
    });

    it('preserves an explicitly-set truthy value across a map transfer', () =>
    {
      const engine = new JABS_Engine();
      engine.hitboxOverlaysVisible = true;
      engine.initialize(true);
      expect(engine.hitboxOverlaysVisible).toBe(true);
    });
  });

  describe('action event tracking', () =>
  {
    it('getAllActionEvents/setAllActionEvents track the raw collection', () =>
    {
      const engine = new JABS_Engine();
      const events = [ { id: 'a' } ];
      engine.setAllActionEvents(events);
      expect(engine.getAllActionEvents()).toBe(events);
    });

    it('addActionEvent tracks the action and its optional event metadata', () =>
    {
      const engine = new JABS_Engine();
      const action = { id: 'action' };
      const eventData = { uniqueId: 'uuid-1' };
      engine.addActionEvent(action, eventData);
      expect(engine.getAllActionEvents()).toContain(action);
      expect(engine._activeActions).toContain(eventData);
    });

    it('addActionEvent does not track event metadata when none is provided', () =>
    {
      const engine = new JABS_Engine();
      engine.addActionEvent({ id: 'action' }, undefined);
      expect(engine._activeActions).toEqual([]);
    });

    it('event finds active action metadata by uuid', () =>
    {
      const engine = new JABS_Engine();
      const eventData = { uniqueId: 'uuid-1' };
      engine.addActionEvent({ id: 'action' }, eventData);
      expect(engine.event('uuid-1')).toBe(eventData);
      expect(engine.event('missing')).toBeUndefined();
    });

    it('clearActionEvents removes actions flagged for removal and requests a map clear', () =>
    {
      const engine = new JABS_Engine();
      const keep = { getNeedsRemoval: () => false };
      const remove = { getNeedsRemoval: () => true };
      engine.setAllActionEvents([ keep, remove ]);

      engine.clearActionEvents();

      expect(engine.getAllActionEvents()).toEqual([ keep ]);
      expect(engine.requestClearMap).toBe(true);
    });

    it('clearActionEvents does not request a map clear when nothing needed removal', () =>
    {
      const engine = new JABS_Engine();
      const keep = { getNeedsRemoval: () => false };
      engine.setAllActionEvents([ keep ]);

      engine.clearActionEvents();

      expect(engine.requestClearMap).toBe(false);
    });
  });

  describe('getAnimationId', () =>
  {
    beforeEach(() =>
    {
      globalThis.J.ABS.DefaultValues = { AttackAnimationId: 1 };
    });

    it('returns the skill\'s own animation id when it is not -1', () =>
    {
      const engine = new JABS_Engine();
      const result = engine.getAnimationId({ animationId: 42 }, { isEnemy: () => false });
      expect(result).toBe(42);
    });

    it('returns the default attack animation for an enemy caster using normal attack', () =>
    {
      const engine = new JABS_Engine();
      const result = engine.getAnimationId({ animationId: -1 }, { isEnemy: () => true });
      expect(result).toBe(1);
    });

    it('returns the first equipped weapon\'s animation id for a non-enemy caster', () =>
    {
      const engine = new JABS_Engine();
      const caster = {
        isEnemy: () => false,
        getBattler: () => ({ weapons: () => [ { animationId: 7 }, { animationId: 8 } ] }),
      };
      const result = engine.getAnimationId({ animationId: -1 }, caster);
      expect(result).toBe(7);
    });

    it('falls back to the default attack animation for a barefisted non-enemy caster', () =>
    {
      const engine = new JABS_Engine();
      const caster = { isEnemy: () => false, getBattler: () => ({ weapons: () => [] }) };
      const result = engine.getAnimationId({ animationId: -1 }, caster);
      expect(result).toBe(1);
    });
  });

  describe('player1 management', () =>
  {
    it('getPlayer1/setPlayer1 track the current player battler', () =>
    {
      const engine = new JABS_Engine();
      const battler = { id: 'battler' };
      engine.setPlayer1(battler);
      expect(engine.getPlayer1()).toBe(battler);
    });

    describe('isBattlerPlayer1', () =>
    {
      it('is false when there is no player 1 yet', () =>
      {
        const engine = new JABS_Engine();
        expect(engine.isBattlerPlayer1({})).toBe(false);
      });

      it('is false when the given battler is not the same as player 1\'s underlying battler', () =>
      {
        const engine = new JABS_Engine();
        engine.setPlayer1({ getBattler: () => ({ id: 'player-battler' }) });
        expect(engine.isBattlerPlayer1({ id: 'other-battler' })).toBe(false);
      });

      it('is true when the given battler matches player 1\'s underlying battler', () =>
      {
        const engine = new JABS_Engine();
        const rawBattler = { id: 'player-battler' };
        engine.setPlayer1({ getBattler: () => rawBattler });
        expect(engine.isBattlerPlayer1(rawBattler)).toBe(true);
      });
    });

    describe('canInitializePlayer1', () =>
    {
      it('is true when there is no player 1 at all', () =>
      {
        const engine = new JABS_Engine();
        expect(engine.canInitializePlayer1()).toBe(true);
      });

      it('is true when player 1 exists but has no battler id', () =>
      {
        const engine = new JABS_Engine();
        engine.setPlayer1({ getBattlerId: () => 0 });
        expect(engine.canInitializePlayer1()).toBe(true);
      });

      it('is false when player 1 exists and has a battler id', () =>
      {
        const engine = new JABS_Engine();
        engine.setPlayer1({ getBattlerId: () => 1 });
        expect(engine.canInitializePlayer1()).toBe(false);
      });
    });

    describe('initializePlayer1', () =>
    {
      it('does nothing when initialization is not allowed', () =>
      {
        const engine = new JABS_Engine();
        engine.canInitializePlayer1 = () => false;
        engine.refreshPlayer1Data = vi.fn();
        engine.initializePlayer1();
        expect(engine.refreshPlayer1Data).not.toHaveBeenCalled();
      });

      it('refreshes player 1 data when initialization is allowed', () =>
      {
        const engine = new JABS_Engine();
        engine.canInitializePlayer1 = () => true;
        engine.refreshPlayer1Data = vi.fn();
        engine.initializePlayer1();
        expect(engine.refreshPlayer1Data).toHaveBeenCalledTimes(1);
      });
    });

    describe('refreshPlayer1Data', () =>
    {
      it('creates a fresh player battler, assigns its uuid to $gamePlayer, and registers it with the ai manager', async () =>
      {
        const { default: JABS_Battler } = await import('../../../../../src/plugins/abs/core/models/JABS_Battler.js');
        const { default: JABS_AiManager } = await import('../../../../../src/plugins/abs/core/managers/JABS_AiManager.js');
        const playerBattler = { getUuid: () => 'player-uuid' };
        JABS_Battler.createPlayer = vi.fn(() => playerBattler);
        JABS_AiManager.addOrUpdateBattler = vi.fn();
        globalThis.$gamePlayer = { setJabsBattlerUuid: vi.fn() };

        const engine = new JABS_Engine();
        engine.refreshPlayer1Data();

        expect(engine.getPlayer1()).toBe(playerBattler);
        expect(globalThis.$gamePlayer.setJabsBattlerUuid).toHaveBeenCalledWith('player-uuid');
        expect(JABS_AiManager.addOrUpdateBattler).toHaveBeenCalledWith(playerBattler);
      });
    });
  });

  describe('update', () =>
  {
    it('runs the full per-frame update pipeline in order', async () =>
    {
      const { default: JABS_AiManager } = await import('../../../../../src/plugins/abs/core/managers/JABS_AiManager.js');
      JABS_AiManager.rebuildSpatialIndex = vi.fn();
      const engine = new JABS_Engine();
      const callOrder = [];
      engine.updatePlayers = vi.fn(() => callOrder.push('updatePlayers'));
      engine.updateAiBattlers = vi.fn(() => callOrder.push('updateAiBattlers'));
      JABS_AiManager.rebuildSpatialIndex.mockImplementation(() => callOrder.push('rebuildSpatialIndex'));
      engine.updateActions = vi.fn(() => callOrder.push('updateActions'));
      engine.updateJabsStates = vi.fn(() => callOrder.push('updateJabsStates'));
      engine.updateSkillExecutionLog = vi.fn(() => callOrder.push('updateSkillExecutionLog'));
      engine.updateInput = vi.fn(() => callOrder.push('updateInput'));

      engine.update();

      expect(callOrder).toEqual([
        'updatePlayers', 'updateAiBattlers', 'rebuildSpatialIndex',
        'updateActions', 'updateJabsStates', 'updateSkillExecutionLog', 'updateInput',
      ]);
    });
  });

  describe('updatePlayers / getPlayers', () =>
  {
    it('getPlayers returns a collection containing player 1', () =>
    {
      const engine = new JABS_Engine();
      const player1 = { id: 'player1' };
      engine.setPlayer1(player1);
      expect(engine.getPlayers()).toEqual([ player1 ]);
    });

    it('updatePlayers updates every player returned by getPlayers', () =>
    {
      const engine = new JABS_Engine();
      const player1 = { id: 'player1' };
      engine.getPlayers = () => [ player1 ];
      engine.updatePlayer = vi.fn();

      engine.updatePlayers();

      // updatePlayer is invoked via players.forEach(this.updatePlayer, this), so it receives the
      // standard forEach callback signature (element, index, array), not just the element.
      expect(engine.updatePlayer).toHaveBeenCalledWith(player1, 0, [ player1 ]);
    });
  });

  describe('updatePlayer / canUpdatePlayer', () =>
  {
    it('canUpdatePlayer is false for a null player', () =>
    {
      const engine = new JABS_Engine();
      expect(engine.canUpdatePlayer(null)).toBe(false);
    });

    it('canUpdatePlayer is true for a real player', () =>
    {
      const engine = new JABS_Engine();
      expect(engine.canUpdatePlayer({})).toBe(true);
    });

    it('updatePlayer does nothing when the player cannot be updated', () =>
    {
      const engine = new JABS_Engine();
      engine.canUpdatePlayer = () => false;
      const player = { isDead: vi.fn(), update: vi.fn() };
      engine.updatePlayer(player);
      expect(player.isDead).not.toHaveBeenCalled();
    });

    it('handles player defeat and stops processing when the player is dead', () =>
    {
      const engine = new JABS_Engine();
      engine.canUpdatePlayer = () => true;
      engine.handleDefeatedPlayer = vi.fn();
      const player = { isDead: () => true, processQueuedActions: vi.fn(), update: vi.fn() };

      engine.updatePlayer(player);

      expect(engine.handleDefeatedPlayer).toHaveBeenCalledTimes(1);
      expect(player.processQueuedActions).not.toHaveBeenCalled();
      expect(player.update).not.toHaveBeenCalled();
    });

    it('processes queued actions then updates a living player', () =>
    {
      const engine = new JABS_Engine();
      engine.canUpdatePlayer = () => true;
      const player = { isDead: () => false, processQueuedActions: vi.fn(), update: vi.fn() };

      engine.updatePlayer(player);

      expect(player.processQueuedActions).toHaveBeenCalledTimes(1);
      expect(player.update).toHaveBeenCalledTimes(1);
    });
  });
  //endregion init

  //region state tracking
  describe('state tracking', () =>
  {
    function buildTrackedState(overrides = {})
    {
      return Object.assign({
        expired: false,
        stateId: 1,
        battler: { deathStateId: () => 99, state: () => ({ isNegativeType: () => false }) },
      }, overrides);
    }

    describe('getJabsStatesByUuid', () =>
    {
      it('lazily initializes an empty map for a battler never seen before', () =>
      {
        const engine = new JABS_Engine();
        const result = engine.getJabsStatesByUuid('uuid-1');
        expect(result).toBeInstanceOf(Map);
        expect(result.size).toBe(0);
      });

      it('returns the same map on repeated calls for the same uuid', () =>
      {
        const engine = new JABS_Engine();
        const first = engine.getJabsStatesByUuid('uuid-1');
        const second = engine.getJabsStatesByUuid('uuid-1');
        expect(second).toBe(first);
      });
    });

    describe('getPositiveJabsStatesByUuid / getNegativeJabsStatesByUuid', () =>
    {
      it('excludes expired states from both positive and negative results', () =>
      {
        const engine = new JABS_Engine();
        const expiredState = buildTrackedState({ expired: true });
        engine.addJabsStateByUuid('uuid-1', expiredState);
        expect(engine.getPositiveJabsStatesByUuid('uuid-1')).toEqual([]);
        expect(engine.getNegativeJabsStatesByUuid('uuid-1')).toEqual([]);
      });

      it('excludes the battler\'s death state from both positive and negative results', () =>
      {
        const engine = new JABS_Engine();
        const deathState = buildTrackedState({ stateId: 99 });
        engine.addJabsStateByUuid('uuid-1', deathState);
        expect(engine.getPositiveJabsStatesByUuid('uuid-1')).toEqual([]);
        expect(engine.getNegativeJabsStatesByUuid('uuid-1')).toEqual([]);
      });

      it('classifies a non-negative-tagged state as positive', () =>
      {
        const engine = new JABS_Engine();
        const positiveState = buildTrackedState({
          battler: { deathStateId: () => 99, state: () => ({ isNegativeType: () => false }) },
        });
        engine.addJabsStateByUuid('uuid-1', positiveState);
        expect(engine.getPositiveJabsStatesByUuid('uuid-1')).toEqual([ positiveState ]);
        expect(engine.getNegativeJabsStatesByUuid('uuid-1')).toEqual([]);
      });

      it('classifies a negative-tagged state as negative', () =>
      {
        const engine = new JABS_Engine();
        const negativeState = buildTrackedState({
          battler: { deathStateId: () => 99, state: () => ({ isNegativeType: () => true }) },
        });
        engine.addJabsStateByUuid('uuid-1', negativeState);
        expect(engine.getNegativeJabsStatesByUuid('uuid-1')).toEqual([ negativeState ]);
        expect(engine.getPositiveJabsStatesByUuid('uuid-1')).toEqual([]);
      });

      it('excludes an expired state from the negative results even when it is negative-tagged', () =>
      {
        // Arrange- a non-negative expired state would be dropped by the negative-type check
        // downstream, so the expiry guard could never be seen to matter. tagging it negative
        // leaves expiry as the only reason it can be excluded, and the live sibling proves the
        // filter is discriminating rather than rejecting everything.
        const engine = new JABS_Engine();
        const negativeBattler = { deathStateId: () => 99, state: () => ({ isNegativeType: () => true }) };
        const expiredState = buildTrackedState({ stateId: 1, expired: true, battler: negativeBattler });
        const liveState = buildTrackedState({ stateId: 2, battler: negativeBattler });
        engine.addJabsStateByUuid('uuid-1', expiredState);
        engine.addJabsStateByUuid('uuid-1', liveState);

        // Act
        const result = engine.getNegativeJabsStatesByUuid('uuid-1');

        // Assert
        expect(result).toEqual([ liveState ]);
      });

      it('excludes the death state from the negative results even when it is negative-tagged', () =>
      {
        // Arrange- same reasoning as the expiry sibling above: the death state is tagged
        // negative so the death-state guard is the only thing that can exclude it.
        const engine = new JABS_Engine();
        const negativeBattler = { deathStateId: () => 99, state: () => ({ isNegativeType: () => true }) };
        const deathState = buildTrackedState({ stateId: 99, battler: negativeBattler });
        const liveState = buildTrackedState({ stateId: 2, battler: negativeBattler });
        engine.addJabsStateByUuid('uuid-1', deathState);
        engine.addJabsStateByUuid('uuid-1', liveState);

        // Act
        const result = engine.getNegativeJabsStatesByUuid('uuid-1');

        // Assert
        expect(result).toEqual([ liveState ]);
      });
    });

    describe('hasJabsStateByUuid / getJabsStateByUuidAndStateId', () =>
    {
      it('is false/undefined for an unapplied state', () =>
      {
        const engine = new JABS_Engine();
        expect(engine.hasJabsStateByUuid('uuid-1', 5)).toBe(false);
        expect(engine.getJabsStateByUuidAndStateId('uuid-1', 5)).toBeUndefined();
      });

      it('is true/defined once a state has been applied', () =>
      {
        const engine = new JABS_Engine();
        const trackedState = buildTrackedState({ stateId: 5 });
        engine.addJabsStateByUuid('uuid-1', trackedState);
        expect(engine.hasJabsStateByUuid('uuid-1', 5)).toBe(true);
        expect(engine.getJabsStateByUuidAndStateId('uuid-1', 5)).toBe(trackedState);
      });
    });

    describe('addOrUpdateStateByUuid', () =>
    {
      it('adds the state anew when the battler does not already have it', () =>
      {
        const engine = new JABS_Engine();
        const jabsState = buildTrackedState({ stateId: 5 });
        engine.addOrUpdateStateByUuid('uuid-1', jabsState);
        expect(engine.getJabsStateByUuidAndStateId('uuid-1', 5)).toBe(jabsState);
      });

      it('updates (not replaces) the existing tracked state when the battler already has it', () =>
      {
        const engine = new JABS_Engine();
        const existing = buildTrackedState({ stateId: 5 });
        engine.addJabsStateByUuid('uuid-1', existing);
        engine.updateJabsStateByUuid = vi.fn();

        const incoming = buildTrackedState({ stateId: 5 });
        engine.addOrUpdateStateByUuid('uuid-1', incoming);

        expect(engine.updateJabsStateByUuid).toHaveBeenCalledWith('uuid-1', incoming);
        // the tracked map entry is untouched by addOrUpdateStateByUuid itself- updateJabsStateByUuid
        // (mocked away here) owns replacing it.
        expect(engine.getJabsStateByUuidAndStateId('uuid-1', 5)).toBe(existing);
      });
    });

    describe('updateJabsStateByUuid / handleJabsStateUpdate', () =>
    {
      it('dispatches to refreshJabsState for the Refresh reapply type', async () =>
      {
        const { default: JABS_State } = await import('../../../../../src/plugins/abs/core/models/JABS_State.js');
        const engine = new JABS_Engine();
        const oldState = { stateId: 5, battler: { state: () => ({ jabsStateReapplyType: JABS_State.reapplicationType.Refresh }) } };
        engine.addJabsStateByUuid('uuid-1', oldState);
        engine.refreshJabsState = vi.fn();
        const newState = { stateId: 5 };

        engine.updateJabsStateByUuid('uuid-1', newState);

        expect(engine.refreshJabsState).toHaveBeenCalledWith(oldState, newState);
      });

      it('dispatches to extendJabsState for the Extend reapply type', async () =>
      {
        const { default: JABS_State } = await import('../../../../../src/plugins/abs/core/models/JABS_State.js');
        const engine = new JABS_Engine();
        const oldState = { stateId: 5, battler: { state: () => ({ jabsStateReapplyType: JABS_State.reapplicationType.Extend }) } };
        engine.addJabsStateByUuid('uuid-1', oldState);
        engine.extendJabsState = vi.fn();
        const newState = { stateId: 5 };

        engine.updateJabsStateByUuid('uuid-1', newState);

        expect(engine.extendJabsState).toHaveBeenCalledWith(oldState, newState);
      });

      it('dispatches to stackJabsState for the Stack reapply type', async () =>
      {
        const { default: JABS_State } = await import('../../../../../src/plugins/abs/core/models/JABS_State.js');
        const engine = new JABS_Engine();
        const oldState = { stateId: 5, battler: { state: () => ({ jabsStateReapplyType: JABS_State.reapplicationType.Stack }) } };
        engine.addJabsStateByUuid('uuid-1', oldState);
        engine.stackJabsState = vi.fn();
        const newState = { stateId: 5 };

        engine.updateJabsStateByUuid('uuid-1', newState);

        expect(engine.stackJabsState).toHaveBeenCalledWith(oldState, newState);
      });

      it('falls back to the default metadata reapply type when the state has none tagged', () =>
      {
        globalThis.J.ABS.Metadata.DefaultStateReapplyType = 'refresh';
        const engine = new JABS_Engine();
        const oldState = { stateId: 5, battler: { state: () => ({ jabsStateReapplyType: undefined }) } };
        engine.addJabsStateByUuid('uuid-1', oldState);
        engine.refreshJabsState = vi.fn();
        const newState = { stateId: 5 };

        engine.updateJabsStateByUuid('uuid-1', newState);

        expect(engine.refreshJabsState).toHaveBeenCalledWith(oldState, newState);
      });
    });

    describe('refreshJabsState', () =>
    {
      it('applies refresh-diminishment scaled by how many times it has already refreshed', () =>
      {
        const engine = new JABS_Engine();
        const jabsState = {
          battler: { state: () => ({ jabsStateRefreshDiminish: 5, jabsStateRefreshReset: 100 }) },
          timesRefreshed: 3,
          refreshRefreshResetCounter: vi.fn(),
          refreshDuration: vi.fn(),
        };
        const newJabsState = { duration: 100 };

        engine.refreshJabsState(jabsState, newJabsState);

        // diminishment = 3 * 5 = 15; refreshAmount = 100 - 15 = 85.
        expect(jabsState.refreshDuration).toHaveBeenCalledWith(85);
        expect(jabsState.refreshRefreshResetCounter).toHaveBeenCalledWith(100);
      });

      it('never refreshes to a duration below -1', () =>
      {
        const engine = new JABS_Engine();
        const jabsState = {
          battler: { state: () => ({ jabsStateRefreshDiminish: 1000, jabsStateRefreshReset: 100 }) },
          timesRefreshed: 5,
          refreshRefreshResetCounter: vi.fn(),
          refreshDuration: vi.fn(),
        };
        const newJabsState = { duration: 10 };

        engine.refreshJabsState(jabsState, newJabsState);

        expect(jabsState.refreshDuration).toHaveBeenCalledWith(-1);
      });
    });

    describe('extendJabsState', () =>
    {
      it('adds the extend amount to the current duration', () =>
      {
        const engine = new JABS_Engine();
        const jabsState = {
          duration: 100,
          battler: { state: () => ({ jabsStateExtendAmount: 50, jabsStateExtendMax: 500 }) },
          refreshDuration: vi.fn(),
        };

        engine.extendJabsState(jabsState, { stateId: 5 });

        expect(jabsState.refreshDuration).toHaveBeenCalledWith(150);
      });

      it('caps the extended duration at the configured maximum', () =>
      {
        const engine = new JABS_Engine();
        const jabsState = {
          duration: 400,
          battler: { state: () => ({ jabsStateExtendAmount: 500, jabsStateExtendMax: 500 }) },
          refreshDuration: vi.fn(),
        };

        engine.extendJabsState(jabsState, { stateId: 5 });

        expect(jabsState.refreshDuration).toHaveBeenCalledWith(500);
      });
    });

    describe('stackJabsState', () =>
    {
      it('applies stack gain, updates the base duration, and refreshes the state', () =>
      {
        const engine = new JABS_Engine();
        engine.refreshJabsState = vi.fn();
        const jabsState = { applyStackGain: vi.fn(), setBaseDuration: vi.fn() };
        const newJabsState = { stackCount: 3, duration: 200 };

        engine.stackJabsState(jabsState, newJabsState);

        expect(jabsState.applyStackGain).toHaveBeenCalledWith(3);
        expect(jabsState.setBaseDuration).toHaveBeenCalledWith(200);
        expect(engine.refreshJabsState).toHaveBeenCalledWith(jabsState, newJabsState);
      });
    });

    describe('checkStackConversion', () =>
    {
      function buildConversionState(overrides = {})
      {
        return Object.assign({
          stateId: 5,
          stackCount: 3,
          source: { state: () => ({ jabsConvertUsesCaster: false }) },
          battler: {
            state: () => ({ jabsStacksConvertToState: { stateId: 9, stacksRequired: 3 }, jabsRemoveOnConvert: false }),
            addState: vi.fn(),
          },
          removeFromBattler: vi.fn(),
        }, overrides);
      }

      it('does nothing when there is no conversion data at all', () =>
      {
        const engine = new JABS_Engine();
        const jabsState = buildConversionState({
          battler: { state: () => ({ jabsStacksConvertToState: null }), addState: vi.fn() },
        });

        engine.checkStackConversion(jabsState);

        expect(jabsState.battler.addState).not.toHaveBeenCalled();
      });

      it('does nothing when the stack count has not yet reached the threshold', () =>
      {
        const engine = new JABS_Engine();
        const jabsState = buildConversionState({ stackCount: 2 });

        engine.checkStackConversion(jabsState);

        expect(jabsState.battler.addState).not.toHaveBeenCalled();
      });

      it('converts the state once the threshold is reached', () =>
      {
        const engine = new JABS_Engine();
        const jabsState = buildConversionState();

        engine.checkStackConversion(jabsState);

        expect(jabsState.battler.addState).toHaveBeenCalledWith(9, jabsState.battler, jabsState.sourceSkill);
        expect(jabsState.removeFromBattler).not.toHaveBeenCalled();
      });

      it('removes the source state after conversion when configured to do so', () =>
      {
        const engine = new JABS_Engine();
        const jabsState = buildConversionState({
          battler: {
            state: () => ({
              jabsStacksConvertToState: { stateId: 9, stacksRequired: 3 },
              jabsRemoveOnConvert: true,
            }),
            addState: vi.fn(),
          },
        });

        engine.checkStackConversion(jabsState);

        expect(jabsState.removeFromBattler).toHaveBeenCalledTimes(1);
      });

      it('reads conversion data from the caster\'s perceived state when convertUsesCaster is tagged', () =>
      {
        const engine = new JABS_Engine();
        const jabsState = buildConversionState({
          source: {
            state: () => ({
              jabsConvertUsesCaster: true,
              jabsStacksConvertToState: { stateId: 42, stacksRequired: 3 },
              jabsRemoveOnConvert: false,
            }),
          },
          battler: { state: () => ({ jabsStacksConvertToState: { stateId: 9, stacksRequired: 3 } }), addState: vi.fn() },
        });

        engine.checkStackConversion(jabsState);

        expect(jabsState.battler.addState).toHaveBeenCalledWith(42, jabsState.battler, jabsState.sourceSkill);
      });
    });

    describe('removeJabsStateByUuid', () =>
    {
      it('deletes the tracked state entry entirely', () =>
      {
        const engine = new JABS_Engine();
        engine.addJabsStateByUuid('uuid-1', buildTrackedState({ stateId: 5 }));
        engine.removeJabsStateByUuid('uuid-1', 5);
        expect(engine.hasJabsStateByUuid('uuid-1', 5)).toBe(false);
      });
    });

    describe('updateJabsStates', () =>
    {
      it('updates every tracked state for every battler', () =>
      {
        const engine = new JABS_Engine();
        const state1 = { update: vi.fn() };
        const state2 = { update: vi.fn() };
        engine.getJabsStates()
          .set('uuid-1', new Map([ [ 1, state1 ] ]));
        engine.getJabsStates()
          .set('uuid-2', new Map([ [ 2, state2 ] ]));

        engine.updateJabsStates();

        expect(state1.update).toHaveBeenCalledTimes(1);
        expect(state2.update).toHaveBeenCalledTimes(1);
      });
    });
  });
  //endregion state tracking

  //region skill execution log
  describe('skill execution log', () =>
  {
    beforeEach(() =>
    {
      globalThis.J.ABS.Metadata.SkillExecutionExcludedSkillTypeSet = new Set();
    });

    describe('getSkillExecutionLogByUuid', () =>
    {
      it('lazily initializes an empty array for a battler never seen before', () =>
      {
        const engine = new JABS_Engine();
        expect(engine.getSkillExecutionLogByUuid('uuid-1')).toEqual([]);
      });

      it('returns the same array on repeated calls', () =>
      {
        const engine = new JABS_Engine();
        const first = engine.getSkillExecutionLogByUuid('uuid-1');
        const second = engine.getSkillExecutionLogByUuid('uuid-1');
        expect(second).toBe(first);
      });
    });

    describe('logSkillExecution', () =>
    {
      it('appends a new execution entry to the battler\'s log', () =>
      {
        const engine = new JABS_Engine();
        engine.logSkillExecution('uuid-1', 5, 1);
        const log = engine.getSkillExecutionLogByUuid('uuid-1');
        expect(log).toHaveLength(1);
        expect(log[0]).toMatchObject({ skillId: 5, skillTypeId: 1 });
      });

      it('silently ignores skill types in the excluded set', () =>
      {
        globalThis.J.ABS.Metadata.SkillExecutionExcludedSkillTypeSet = new Set([ 1 ]);
        const engine = new JABS_Engine();
        engine.logSkillExecution('uuid-1', 5, 1);
        expect(engine.getSkillExecutionLogByUuid('uuid-1')).toEqual([]);
      });
    });

    describe('querySkillExecutionLog', () =>
    {
      function buildEntry(overrides = {})
      {
        return Object.assign({
          skillId: 5,
          skillTypeId: 1,
          isWithinWindow: () => true,
          matchesSkillId: () => true,
          matchesTypeId: () => true,
        }, overrides);
      }

      it('counts all matching entries within the window for the "all" mode', () =>
      {
        const engine = new JABS_Engine();
        engine.getSkillExecutionLog()
          .set('uuid-1', [ buildEntry(), buildEntry() ]);
        expect(engine.querySkillExecutionLog('uuid-1', 5, 1, 10, 'all')).toBe(2);
      });

      it('defaults to "all" semantics for an unrecognized count mode', () =>
      {
        const engine = new JABS_Engine();
        engine.getSkillExecutionLog()
          .set('uuid-1', [ buildEntry() ]);
        expect(engine.querySkillExecutionLog('uuid-1', 5, 1, 10, 'bogus-mode')).toBe(1);
      });

      it('excludes entries outside the time window', () =>
      {
        const engine = new JABS_Engine();
        engine.getSkillExecutionLog()
          .set('uuid-1', [ buildEntry({ isWithinWindow: () => false }) ]);
        expect(engine.querySkillExecutionLog('uuid-1', 5, 1, 10, 'all')).toBe(0);
      });

      it('excludes entries that do not match the skill id filter', () =>
      {
        const engine = new JABS_Engine();
        engine.getSkillExecutionLog()
          .set('uuid-1', [ buildEntry({ matchesSkillId: () => false }) ]);
        expect(engine.querySkillExecutionLog('uuid-1', 5, 1, 10, 'all')).toBe(0);
      });

      it('excludes entries that do not match the type id filter', () =>
      {
        const engine = new JABS_Engine();
        engine.getSkillExecutionLog()
          .set('uuid-1', [ buildEntry({ matchesTypeId: () => false }) ]);
        expect(engine.querySkillExecutionLog('uuid-1', 5, 1, 10, 'all')).toBe(0);
      });

      it('counts distinct skill ids for the "unique" mode', () =>
      {
        const engine = new JABS_Engine();
        engine.getSkillExecutionLog()
          .set('uuid-1', [ buildEntry({ skillId: 5 }), buildEntry({ skillId: 5 }), buildEntry({ skillId: 6 }) ]);
        expect(engine.querySkillExecutionLog('uuid-1', 0, 0, 10, 'unique')).toBe(2);
      });

      it('counts distinct skill type ids for the "distinct_types" mode', () =>
      {
        const engine = new JABS_Engine();
        engine.getSkillExecutionLog()
          .set('uuid-1', [ buildEntry({ skillTypeId: 1 }), buildEntry({ skillTypeId: 1 }), buildEntry({ skillTypeId: 2 }) ]);
        expect(engine.querySkillExecutionLog('uuid-1', 0, 0, 10, 'distinct_types')).toBe(2);
      });

    });

    describe('streak counting (via querySkillExecutionLog countMode "streak")', () =>
    {
      function buildEntry(overrides = {})
      {
        return Object.assign({
          isWithinWindow: () => true,
          matchesSkillId: () => true,
          matchesTypeId: () => true,
        }, overrides);
      }

      it('counts consecutive matching entries from the tail backward', () =>
      {
        const engine = new JABS_Engine();
        engine.getSkillExecutionLog()
          .set('uuid-1', [ buildEntry(), buildEntry(), buildEntry() ]);
        expect(engine.querySkillExecutionLog('uuid-1', 5, 1, 10, 'streak')).toBe(3);
      });

      it('stops the streak at the first entry outside the time window', () =>
      {
        const engine = new JABS_Engine();
        engine.getSkillExecutionLog()
          .set('uuid-1', [ buildEntry({ isWithinWindow: () => false }), buildEntry(), buildEntry() ]);
        expect(engine.querySkillExecutionLog('uuid-1', 5, 1, 10, 'streak')).toBe(2);
      });

      it('stops the streak at the first entry that does not match the skill id filter', () =>
      {
        const engine = new JABS_Engine();
        engine.getSkillExecutionLog()
          .set('uuid-1', [ buildEntry({ matchesSkillId: () => false }), buildEntry() ]);
        expect(engine.querySkillExecutionLog('uuid-1', 5, 1, 10, 'streak')).toBe(1);
      });

      it('stops the streak at the first entry that does not match the type id filter', () =>
      {
        const engine = new JABS_Engine();
        engine.getSkillExecutionLog()
          .set('uuid-1', [ buildEntry({ matchesTypeId: () => false }), buildEntry() ]);
        expect(engine.querySkillExecutionLog('uuid-1', 5, 1, 10, 'streak')).toBe(1);
      });

      it('is zero for an empty log', () =>
      {
        const engine = new JABS_Engine();
        expect(engine.querySkillExecutionLog('uuid-1', 5, 1, 10, 'streak')).toBe(0);
      });

      it('counts only the unbroken tail, not every matching entry in the window', () =>
      {
        // Arrange- every other streak fixture puts its non-matching entry at the head, where
        // "consecutive from the tail" and "all matches in the window" happen to agree. an
        // interleaved log is the only shape that separates the streak path from the generic
        // filter-and-count path the other count modes share.
        const engine = new JABS_Engine();
        const entries = [ buildEntry(), buildEntry({ matchesSkillId: () => false }), buildEntry() ];
        engine.getSkillExecutionLog()
          .set('uuid-1', entries);

        // Act
        const streak = engine.querySkillExecutionLog('uuid-1', 5, 1, 10, 'streak');
        const all = engine.querySkillExecutionLog('uuid-1', 5, 1, 10, 'all');

        // Assert
        expect(streak).toBe(1);
        expect(all).toBe(2);
      });
    });

    describe('updateSkillExecutionLog', () =>
    {
      beforeEach(() =>
      {
        globalThis.J.ABS.Metadata.SkillExecutionMaxWindowSeconds = 60;
      });

      it('ticks the throttle timer every call, but only ages/prunes once the timer completes', () =>
      {
        const engine = new JABS_Engine();
        engine._skillExecutionTimer._complete = false;
        const entry = { tick: vi.fn(), isExpired: () => false };
        engine.getSkillExecutionLog()
          .set('uuid-1', [ entry ]);

        engine.updateSkillExecutionLog();

        expect(engine._skillExecutionTimer.updateCalled).toBe(true);
        expect(entry.tick).not.toHaveBeenCalled();
      });

      it('ages every entry and resets the throttle timer once it completes', () =>
      {
        const engine = new JABS_Engine();
        engine._skillExecutionTimer._complete = true;
        const entry = { tick: vi.fn(), isExpired: () => false };
        engine.getSkillExecutionLog()
          .set('uuid-1', [ entry ]);

        engine.updateSkillExecutionLog();

        expect(entry.tick).toHaveBeenCalledTimes(1);
        expect(engine._skillExecutionTimer.resetCalled).toBe(true);
      });

      it('prunes entries that have exceeded the global max window', () =>
      {
        const engine = new JABS_Engine();
        engine._skillExecutionTimer._complete = true;
        const expiredEntry = { tick: vi.fn(), isExpired: () => true };
        const freshEntry = { tick: vi.fn(), isExpired: () => false };
        engine.getSkillExecutionLog()
          .set('uuid-1', [ expiredEntry, freshEntry ]);

        engine.updateSkillExecutionLog();

        expect(engine.getSkillExecutionLog().get('uuid-1')).toEqual([ freshEntry ]);
      });
    });
  });
  //endregion skill execution log

  //region update ai battlers
  describe('updateAiBattlers', () =>
  {
    it('does nothing when ai battler updates are not allowed', async () =>
    {
      const { default: JABS_AiManager } = await import('../../../../../src/plugins/abs/core/managers/JABS_AiManager.js');
      JABS_AiManager.getBattlersWithinRange = vi.fn();
      const engine = new JABS_Engine();
      engine.canUpdateAiBattlers = () => false;

      engine.updateAiBattlers();

      expect(JABS_AiManager.getBattlersWithinRange).not.toHaveBeenCalled();
    });

    it('updates every on-screen battler within range of player 1', async () =>
    {
      const { default: JABS_AiManager } = await import('../../../../../src/plugins/abs/core/managers/JABS_AiManager.js');
      const player1 = { id: 'player1' };
      const other = { id: 'other' };
      JABS_AiManager.getBattlersWithinRange = vi.fn(() => [ other ]);
      const engine = new JABS_Engine();
      engine.setPlayer1(player1);
      engine.performAiBattlerUpdate = vi.fn();

      engine.updateAiBattlers();

      expect(JABS_AiManager.getBattlersWithinRange).toHaveBeenCalledWith(player1, 30);
      expect(engine.performAiBattlerUpdate).toHaveBeenCalledWith(other, 0, [ other ]);
    });
  });

  describe('canUpdateAiBattlers', () =>
  {
    it('is always true', () =>
    {
      const engine = new JABS_Engine();
      expect(engine.canUpdateAiBattlers()).toBe(true);
    });
  });

  describe('performAiBattlerUpdate', () =>
  {
    it('does not update the player battler a second time when it appears in the ai collection', () =>
    {
      const engine = new JABS_Engine();
      const player1 = { update: vi.fn() };
      engine.setPlayer1(player1);

      engine.performAiBattlerUpdate(player1);

      expect(player1.update).not.toHaveBeenCalled();
    });

    it('updates a non-player battler', () =>
    {
      const engine = new JABS_Engine();
      engine.setPlayer1({ id: 'player1' });
      const battler = { update: vi.fn() };
      engine.shouldHandleDefeatedTarget = () => false;

      engine.performAiBattlerUpdate(battler);

      expect(battler.update).toHaveBeenCalledTimes(1);
    });

    it('handles defeat when the battler qualifies as defeated after updating, falling back to player1 with no last-hit record', () =>
    {
      const engine = new JABS_Engine();
      const player1 = { id: 'player1' };
      engine.setPlayer1(player1);
      engine.shouldHandleDefeatedTarget = () => true;
      engine.handleDefeatedTarget = vi.fn();
      const battler = {
        update: vi.fn(),
        setInvincible: vi.fn(),
        getBattler: () => ({ getLastHitSource: () => null }),
      };

      engine.performAiBattlerUpdate(battler);

      expect(battler.setInvincible).toHaveBeenCalledTimes(1);
      expect(engine.handleDefeatedTarget).toHaveBeenCalledWith(battler, player1);
    });

    it('handles defeat crediting whoever last hit the target when a last-hit record resolves', async () =>
    {
      const { default: JABS_AiManager } = await import('../../../../../src/plugins/abs/core/managers/JABS_AiManager.js');
      const actualKiller = { id: 'ally1' };
      JABS_AiManager.getBattlerByUuid = vi.fn(() => actualKiller);

      const engine = new JABS_Engine();
      engine.setPlayer1({ id: 'player1' });
      engine.shouldHandleDefeatedTarget = () => true;
      engine.handleDefeatedTarget = vi.fn();
      const battler = {
        update: vi.fn(),
        setInvincible: vi.fn(),
        getBattler: () => ({ getLastHitSource: () => ({ uuid: 'ally1-uuid', id: 5 }) }),
      };

      engine.performAiBattlerUpdate(battler);

      expect(JABS_AiManager.getBattlerByUuid).toHaveBeenCalledWith('ally1-uuid');
      expect(engine.handleDefeatedTarget).toHaveBeenCalledWith(battler, actualKiller);
    });

    it('falls back to player1 when the recorded last-hit uuid no longer resolves to a live battler', async () =>
    {
      const { default: JABS_AiManager } = await import('../../../../../src/plugins/abs/core/managers/JABS_AiManager.js');
      JABS_AiManager.getBattlerByUuid = vi.fn(() => undefined);

      const engine = new JABS_Engine();
      const player1 = { id: 'player1' };
      engine.setPlayer1(player1);
      engine.shouldHandleDefeatedTarget = () => true;
      engine.handleDefeatedTarget = vi.fn();
      const battler = {
        update: vi.fn(),
        setInvincible: vi.fn(),
        getBattler: () => ({ getLastHitSource: () => ({ uuid: 'stale-uuid', id: 5 }) }),
      };

      engine.performAiBattlerUpdate(battler);

      expect(engine.handleDefeatedTarget).toHaveBeenCalledWith(battler, player1);
    });

    it('does not handle defeat when the battler does not qualify', () =>
    {
      const engine = new JABS_Engine();
      engine.setPlayer1({ id: 'player1' });
      engine.shouldHandleDefeatedTarget = () => false;
      engine.handleDefeatedTarget = vi.fn();
      const battler = { update: vi.fn(), setInvincible: vi.fn() };

      engine.performAiBattlerUpdate(battler);

      expect(battler.setInvincible).not.toHaveBeenCalled();
      expect(engine.handleDefeatedTarget).not.toHaveBeenCalled();
    });
  });

  describe('shouldHandleDefeatedTarget', () =>
  {
    it('is false when the target is not dead', () =>
    {
      const engine = new JABS_Engine();
      const target = { isDead: () => false };
      expect(engine.shouldHandleDefeatedTarget(target)).toBe(false);
    });

    it('is false while the target is still in its dying animation', () =>
    {
      const engine = new JABS_Engine();
      const target = { isDead: () => true, isDying: () => true };
      expect(engine.shouldHandleDefeatedTarget(target)).toBe(false);
    });

    it('is false for an enemy whose character has already been erased (already handled)', () =>
    {
      const engine = new JABS_Engine();
      const target = {
        isDead: () => true,
        isDying: () => false,
        isEnemy: () => true,
        getCharacter: () => ({ isErased: () => true }),
      };
      expect(engine.shouldHandleDefeatedTarget(target)).toBe(false);
    });

    it('is true for a dead, non-dying enemy whose character is not yet erased', () =>
    {
      const engine = new JABS_Engine();
      const target = {
        isDead: () => true,
        isDying: () => false,
        isEnemy: () => true,
        getCharacter: () => ({ isErased: () => false }),
      };
      expect(engine.shouldHandleDefeatedTarget(target)).toBe(true);
    });

    it('is true for a dead, non-dying non-enemy (the enemy-erased check is skipped)', () =>
    {
      const engine = new JABS_Engine();
      const target = { isDead: () => true, isDying: () => false, isEnemy: () => false };
      expect(engine.shouldHandleDefeatedTarget(target)).toBe(true);
    });
  });
  //endregion update ai battlers

  //region update input
  describe('updateInput', () =>
  {
    it('does nothing when input updates are not allowed', async () =>
    {
      // Arrange- the registered-controller check is the other reason this method stays silent,
      // so it is forced off here: with a controller registered the method would warn about
      // nothing either way and the gate under test would carry none of the assertion.
      const { default: JABS_InputAdapter } = await import('../../../../../src/plugins/abs/core/models/JABS_InputAdapter.js');
      JABS_InputAdapter.hasControllers = () => false;
      const engine = new JABS_Engine();
      engine.canUpdateInput = () => false;
      vi.spyOn(console, 'warn').mockImplementation(() => {});

      // Act
      engine.updateInput();

      // Assert
      expect(console.warn).not.toHaveBeenCalled();
      console.warn.mockRestore();
      JABS_InputAdapter.hasControllers = () => true;
    });

    it('warns when no input controllers have been registered', async () =>
    {
      const { default: JABS_InputAdapter } = await import('../../../../../src/plugins/abs/core/models/JABS_InputAdapter.js');
      JABS_InputAdapter.hasControllers = () => false;
      const engine = new JABS_Engine();
      engine.canUpdateInput = () => true;
      vi.spyOn(console, 'warn').mockImplementation(() => {});

      engine.updateInput();

      expect(console.warn).toHaveBeenCalled();
      console.warn.mockRestore();
      JABS_InputAdapter.hasControllers = () => true;
    });

    it('does not warn once at least one controller is registered', async () =>
    {
      const { default: JABS_InputAdapter } = await import('../../../../../src/plugins/abs/core/models/JABS_InputAdapter.js');
      JABS_InputAdapter.hasControllers = () => true;
      const engine = new JABS_Engine();
      engine.canUpdateInput = () => true;
      vi.spyOn(console, 'warn').mockImplementation(() => {});

      engine.updateInput();

      expect(console.warn).not.toHaveBeenCalled();
      console.warn.mockRestore();
    });
  });

  describe('canUpdateInput', () =>
  {
    function withGates(overrides = {})
    {
      globalThis.$gameMap = Object.assign(globalThis.$gameMap, { isEventRunning: () => false });
      globalThis.$gameMessage = { isBusy: () => false };
      globalThis.$jabsEngine = { absPause: false, absEnabled: true, ...overrides };
    }

    it('is false while a map event is running', () =>
    {
      withGates();
      globalThis.$gameMap.isEventRunning = () => true;
      const engine = new JABS_Engine();
      expect(engine.canUpdateInput()).toBe(false);
    });

    it('is false while the message window is busy', () =>
    {
      withGates();
      globalThis.$gameMessage.isBusy = () => true;
      const engine = new JABS_Engine();
      expect(engine.canUpdateInput()).toBe(false);
    });

    it('is false while jabs is paused', () =>
    {
      withGates({ absPause: true });
      const engine = new JABS_Engine();
      expect(engine.canUpdateInput()).toBe(false);
    });

    it('is false while jabs is disabled', () =>
    {
      withGates({ absEnabled: false });
      const engine = new JABS_Engine();
      expect(engine.canUpdateInput()).toBe(false);
    });

    it('is true when every gate passes', () =>
    {
      withGates();
      const engine = new JABS_Engine();
      expect(engine.canUpdateInput()).toBe(true);
    });
  });
  //endregion update input

  //region party cycling
  describe('party cycling', () =>
  {
    beforeEach(() =>
    {
      globalThis.J.LOG = false;
    });

    describe('performPartyCycling', () =>
    {
      it('does nothing when party cycling is not currently possible', () =>
      {
        const engine = new JABS_Engine();
        engine.canPerformPartyCycling = () => false;
        engine.prePartyCycling = vi.fn();

        engine.performPartyCycling();

        expect(engine.prePartyCycling).not.toHaveBeenCalled();
      });

      it('runs the full cycling pipeline in order when allowed', () =>
      {
        const engine = new JABS_Engine();
        engine.canPerformPartyCycling = () => true;
        const callOrder = [];
        engine.prePartyCycling = vi.fn(() => callOrder.push('pre'));
        engine.handlePartyCycleMemberChanges = vi.fn(() => callOrder.push('handleChanges'));
        engine.onPartyCycling = vi.fn(() => callOrder.push('on'));
        engine.postPartyCycling = vi.fn(() => callOrder.push('post'));

        engine.performPartyCycling();

        expect(callOrder).toEqual([ 'pre', 'handleChanges', 'on', 'post' ]);
      });
    });

    describe('canPerformPartyCycling', () =>
    {
      it('is false when no other party member is eligible to cycle to', () =>
      {
        globalThis.$gameParty = { _actors: [ 1 ] };
        const engine = new JABS_Engine();
        engine.canCycleToAlly = () => false;
        expect(engine.canPerformPartyCycling()).toBe(false);
      });

      it('is true when at least one other party member is eligible', () =>
      {
        globalThis.$gameParty = { _actors: [ 1, 2 ] };
        const engine = new JABS_Engine();
        engine.canCycleToAlly = (actorId, index) => index === 1;
        expect(engine.canPerformPartyCycling()).toBe(true);
      });
    });

    describe('canCycleToAlly', () =>
    {
      it('is false for the party leader (index 0)', () =>
      {
        const engine = new JABS_Engine();
        expect(engine.canCycleToAlly(1, 0)).toBe(false);
      });

      it('is false for a dead candidate', () =>
      {
        globalThis.$gameActors = { actor: () => ({ isDead: () => true, switchLocked: () => false }) };
        const engine = new JABS_Engine();
        expect(engine.canCycleToAlly(2, 1)).toBe(false);
      });

      it('is false for a switch-locked candidate', () =>
      {
        globalThis.$gameActors = { actor: () => ({ isDead: () => false, switchLocked: () => true }) };
        const engine = new JABS_Engine();
        expect(engine.canCycleToAlly(2, 1)).toBe(false);
      });

      it('is true for a living, unlocked non-leader candidate', () =>
      {
        globalThis.$gameActors = { actor: () => ({ isDead: () => false, switchLocked: () => false }) };
        const engine = new JABS_Engine();
        expect(engine.canCycleToAlly(2, 1)).toBe(true);
      });
    });

    describe('prePartyCycling', () =>
    {
      it('is a no-op hook', () =>
      {
        const engine = new JABS_Engine();
        expect(() => engine.prePartyCycling()).not.toThrow();
      });
    });

    describe('handlePartyCycleMemberChanges', () =>
    {
      it('cycles to the member standing immediately behind the leader', () =>
      {
        // Arrange- everybody is eligible, so the member directly behind the leader is the one who
        // takes over. this is the case a loop that steps over its first candidate gets wrong, and
        // it is also the one a player notices, because that member is who they expect to get.
        globalThis.$gameParty = { _actors: [ 1, 2, 3 ], leader: () => ({ onBattlerDataChange: vi.fn() }) };
        globalThis.$gameActors = {
          actor: () => ({
            isDead: () => false,
            switchLocked: () => false,
          }),
        };
        globalThis.$gamePlayer = { refresh: vi.fn() };
        const engine = new JABS_Engine();
        engine.refreshPlayer1Data = vi.fn();

        // Act
        engine.handlePartyCycleMemberChanges();

        // Assert- the whole order matters, not just the leader: asserting only the front cannot tell
        // a single rotation from a full lap that happens to end somewhere plausible.
        expect(globalThis.$gameParty._actors).toEqual([ 2, 3, 1 ]);
        expect(globalThis.$gamePlayer.refresh).toHaveBeenCalledTimes(1);
        expect(engine.refreshPlayer1Data).toHaveBeenCalledTimes(1);
      });

      it('rotates past a dead candidate and stops on the next eligible one', () =>
      {
        // Arrange- the member immediately behind the leader is the dead one, which is the only
        // arrangement that forces the isDead()-true continue before anybody eligible is reached.
        globalThis.$gameParty = { _actors: [ 1, 2, 3 ], leader: () => ({ onBattlerDataChange: vi.fn() }) };
        globalThis.$gameActors = {
          actor: (id) => ({
            isDead: () => id === 2,
            switchLocked: () => false,
          }),
        };
        globalThis.$gamePlayer = { refresh: vi.fn() };
        const engine = new JABS_Engine();
        engine.refreshPlayer1Data = vi.fn();

        // Act
        engine.handlePartyCycleMemberChanges();

        // Assert- two rotations, landing on actor 3 with the dead member left behind them.
        expect(globalThis.$gameParty._actors).toEqual([ 3, 1, 2 ]);
      });

      it('rotates past a switch-locked candidate and stops on the next eligible one', () =>
      {
        // Arrange- the locked-member twin of the dead-member case above, arranged identically so
        // the two continue branches are exercised in isolation from one another.
        globalThis.$gameParty = { _actors: [ 1, 2, 3 ], leader: () => ({ onBattlerDataChange: vi.fn() }) };
        globalThis.$gameActors = {
          actor: (id) => ({
            isDead: () => false,
            switchLocked: () => id === 2,
          }),
        };
        globalThis.$gamePlayer = { refresh: vi.fn() };
        const engine = new JABS_Engine();
        engine.refreshPlayer1Data = vi.fn();

        // Act
        engine.handlePartyCycleMemberChanges();

        // Assert
        expect(globalThis.$gameParty._actors).toEqual([ 3, 1, 2 ]);
      });

      it('reaches every member in turn across repeated cycles', () =>
      {
        // Arrange- four eligible members. a single cycle cannot distinguish "advances by one" from
        // "advances by some other fixed amount", and an implementation that shuffles the order can
        // strand members permanently out of reach; only walking the whole party proves otherwise.
        globalThis.$gameParty = { _actors: [ 1, 2, 3, 4 ], leader: () => ({ onBattlerDataChange: vi.fn() }) };
        globalThis.$gameActors = {
          actor: () => ({
            isDead: () => false,
            switchLocked: () => false,
          }),
        };
        globalThis.$gamePlayer = { refresh: vi.fn() };
        const engine = new JABS_Engine();
        engine.refreshPlayer1Data = vi.fn();

        // Act- cycle once per member, collecting who leads after each.
        const leaders = [];
        for (let cycle = 0; cycle < 4; cycle++)
        {
          engine.handlePartyCycleMemberChanges();
          leaders.push(globalThis.$gameParty._actors[0]);
        }

        // Assert- everyone takes a turn, in party order, and the party returns to where it started.
        expect(leaders).toEqual([ 2, 3, 4, 1 ]);
        expect(globalThis.$gameParty._actors).toEqual([ 1, 2, 3, 4 ]);
      });

      it('leaves the party untouched when nobody else is eligible', () =>
      {
        // Arrange- a two-member party whose only other member is dead. the loop runs out of
        // candidates and lands back on the original leader, which must not be treated as a cycle.
        globalThis.$gameParty = { _actors: [ 1, 2 ], leader: () => ({ onBattlerDataChange: vi.fn() }) };
        globalThis.$gameActors = {
          actor: (id) => ({
            isDead: () => id === 2,
            switchLocked: () => false,
          }),
        };
        globalThis.$gamePlayer = { refresh: vi.fn() };
        const engine = new JABS_Engine();
        engine.refreshPlayer1Data = vi.fn();

        // Act
        engine.handlePartyCycleMemberChanges();

        // Assert
        expect(globalThis.$gameParty._actors).toEqual([ 1, 2 ]);
      });

      it('triggers onBattlerDataChange for the new leader', () =>
      {
        globalThis.$gameParty = { _actors: [ 1 ], leader: vi.fn(() => ({ onBattlerDataChange: vi.fn() })) };
        globalThis.$gameActors = { actor: () => ({ isDead: () => false, switchLocked: () => false }) };
        globalThis.$gamePlayer = { refresh: vi.fn() };
        const engine = new JABS_Engine();
        engine.refreshPlayer1Data = vi.fn();
        const leaderBattler = { onBattlerDataChange: vi.fn() };
        globalThis.$gameParty.leader = () => leaderBattler;

        engine.handlePartyCycleMemberChanges();

        expect(leaderBattler.onBattlerDataChange).toHaveBeenCalledTimes(1);
      });
    });

    describe('onPartyCycling / partyCyclingEffects', () =>
    {
      it('runs the animation then the logging effect', () =>
      {
        const engine = new JABS_Engine();
        const callOrder = [];
        engine.partyCycleAnimation = vi.fn(() => callOrder.push('animation'));
        engine.partyCycleLogging = vi.fn(() => callOrder.push('logging'));

        engine.onPartyCycling();

        expect(callOrder).toEqual([ 'animation', 'logging' ]);
      });
    });

    describe('partyCycleAnimation', () =>
    {
      it('requests the party-cycle animation on player 1\'s character', () =>
      {
        const engine = new JABS_Engine();
        const requestAnimation = vi.fn();
        engine.setPlayer1({ getCharacter: () => ({ requestAnimation }) });

        engine.partyCycleAnimation();

        expect(requestAnimation).toHaveBeenCalledWith(40);
      });
    });

    describe('partyCycleLogging', () =>
    {
      it('does nothing when the logging plugin is not present', () =>
      {
        globalThis.J.LOG = false;
        const engine = new JABS_Engine();
        expect(() => engine.partyCycleLogging()).not.toThrow();
      });

      it('builds and submits a party-cycle log entry when logging is available', () =>
      {
        globalThis.J.LOG = true;
        globalThis.ActionLogBuilder = vi.fn(function()
        {
          this.setupPartyCycle = vi.fn().mockReturnThis();
          this.build = vi.fn(() => ({ built: true }));
        });
        globalThis.$mapLogs = { action: { addLog: vi.fn() } };
        const engine = new JABS_Engine();
        engine.setPlayer1({ battlerName: () => 'Hero' });

        engine.partyCycleLogging();

        expect(globalThis.$mapLogs.action.addLog).toHaveBeenCalledWith({ built: true });
      });
    });

    describe('postPartyCycling', () =>
    {
      it('requests party rotation and a sprite refresh', () =>
      {
        const engine = new JABS_Engine();
        engine.postPartyCycling();
        expect(engine.requestPartyRotation).toBe(true);
        expect(engine.requestSpriteRefresh).toBe(true);
      });
    });
  });
  //endregion party cycling

  //region actions: update/execute
  describe('updateActions', () =>
  {
    it('does nothing when there are no tracked actions', () =>
    {
      const engine = new JABS_Engine();
      expect(() => engine.updateActions()).not.toThrow();
    });

    it('updates every tracked action', () =>
    {
      const engine = new JABS_Engine();
      const action1 = { update: vi.fn() };
      const action2 = { update: vi.fn() };
      engine.setAllActionEvents([ action1, action2 ]);

      engine.updateActions();

      expect(action1.update).toHaveBeenCalledTimes(1);
      expect(action2.update).toHaveBeenCalledTimes(1);
    });
  });

  describe('forceMapAction', () =>
  {
    it('builds location/options then executes each generated action against the caster', () =>
    {
      const engine = new JABS_Engine();
      const action1 = { id: 'action1' };
      const action2 = { id: 'action2' };
      const caster = { createJabsActionFromSkill: vi.fn(() => [ action1, action2 ]) };
      engine.executeMapAction = vi.fn();

      engine.forceMapAction(caster, 5, true, 3, 4, true);

      const [ [ , actualOptions ] ] = caster.createJabsActionFromSkill.mock.calls;
      expect(actualOptions.isRetaliation).toBe(true);
      expect(actualOptions.isTerrainDamage).toBe(true);
      expect(actualOptions.location.getX()).toBe(3);
      expect(actualOptions.location.getY()).toBe(4);
      expect(engine.executeMapAction).toHaveBeenCalledWith(caster, action1, 3, 4);
      expect(engine.executeMapAction).toHaveBeenCalledWith(caster, action2, 3, 4);
    });

    it('does not execute anything when the generated actions cannot be executed', () =>
    {
      // Arrange- the actions collection is deliberately non-empty. an empty collection is
      // rejected by canExecuteMapActions anyway, so nothing would execute even if the gate
      // here were removed entirely and the assertion below would prove nothing.
      const engine = new JABS_Engine();
      const caster = { createJabsActionFromSkill: () => [ { id: 'action1' } ] };
      engine.canExecuteMapActions = vi.fn(() => false);
      engine.executeMapAction = vi.fn();

      // Act
      engine.forceMapAction(caster, 5);

      // Assert
      expect(engine.canExecuteMapActions).toHaveBeenCalledTimes(1);
      expect(engine.executeMapAction).not.toHaveBeenCalled();
    });
  });

  describe('canExecuteMapActions', () =>
  {
    it('is false for an empty actions collection', () =>
    {
      const engine = new JABS_Engine();
      expect(engine.canExecuteMapActions({}, [])).toBe(false);
    });

    it('is true for a non-empty actions collection', () =>
    {
      const engine = new JABS_Engine();
      expect(engine.canExecuteMapActions({}, [ {} ])).toBe(true);
    });
  });

  describe('executeMapActions', () =>
  {
    function buildAction(overrides = {})
    {
      return Object.assign({
        getBaseSkill: () => ({ id: 5 }),
        getActionOptions: () => null,
      }, overrides);
    }

    it('does nothing when the actions cannot be executed', () =>
    {
      const engine = new JABS_Engine();
      engine.applyOnExecutionEffects = vi.fn();
      engine.executeMapActions({}, []);
      expect(engine.applyOnExecutionEffects).not.toHaveBeenCalled();
    });

    it('drops held guard before an offensive strike when the caster is guarding with a non-guard skill', () =>
    {
      const engine = new JABS_Engine();
      engine.applyOnExecutionEffects = vi.fn();
      engine.executeMapAction = vi.fn();
      const caster = { guarding: () => true, executeGuard: vi.fn() };

      engine.executeMapActions(caster, [ buildAction() ], 1, 2);

      expect(caster.executeGuard).toHaveBeenCalledWith(false);
    });

    it('does not drop guard when the strike skill is itself a guard skill', async () =>
    {
      const { default: JABS_Battler } = await import('../../../../../src/plugins/abs/core/models/JABS_Battler.js');
      JABS_Battler.isGuardSkillById = () => true;
      const engine = new JABS_Engine();
      engine.applyOnExecutionEffects = vi.fn();
      engine.executeMapAction = vi.fn();
      const caster = { guarding: () => true, executeGuard: vi.fn() };

      engine.executeMapActions(caster, [ buildAction() ], 1, 2);

      expect(caster.executeGuard).not.toHaveBeenCalled();
      JABS_Battler.isGuardSkillById = () => false;
    });

    it('does not touch guard when the caster is not guarding', () =>
    {
      const engine = new JABS_Engine();
      engine.applyOnExecutionEffects = vi.fn();
      engine.executeMapAction = vi.fn();
      const caster = { guarding: () => false, executeGuard: vi.fn() };

      engine.executeMapActions(caster, [ buildAction() ], 1, 2);

      expect(caster.executeGuard).not.toHaveBeenCalled();
    });

    it('executes every action using the explicitly provided coordinates', () =>
    {
      const engine = new JABS_Engine();
      engine.applyOnExecutionEffects = vi.fn();
      engine.executeMapAction = vi.fn();
      const caster = { guarding: () => false };
      const action = buildAction();

      engine.executeMapActions(caster, [ action ], 10, 20);

      expect(engine.executeMapAction).toHaveBeenCalledWith(caster, action, 10, 20);
    });

    it('falls back to the primary action\'s frozen target location when coordinates are omitted', () =>
    {
      const engine = new JABS_Engine();
      engine.applyOnExecutionEffects = vi.fn();
      engine.executeMapAction = vi.fn();
      const caster = { guarding: () => false };
      const frozenLocation = { getX: () => 7, getY: () => 8 };
      const action = buildAction({
        getActionOptions: () => ({ getTargetLocation: () => frozenLocation }),
      });

      engine.executeMapActions(caster, [ action ], null, null);

      expect(engine.executeMapAction).toHaveBeenCalledWith(caster, action, 7, 8);
    });

    it('prefers explicitly provided coordinates over the frozen target location', () =>
    {
      // Arrange- the action carries a frozen location that differs from the coordinates passed
      // in, so consulting options when it should not is visible in the executed coordinates.
      const engine = new JABS_Engine();
      engine.applyOnExecutionEffects = vi.fn();
      engine.executeMapAction = vi.fn();
      const caster = { guarding: () => false };
      const frozenLocation = { getX: () => 7, getY: () => 8 };
      const action = buildAction({
        getActionOptions: () => ({ getTargetLocation: () => frozenLocation }),
      });

      // Act
      engine.executeMapActions(caster, [ action ], 10, 20);

      // Assert
      expect(engine.executeMapAction).toHaveBeenCalledWith(caster, action, 10, 20);
    });

    it('consults the frozen target location when only the x coordinate is omitted', () =>
    {
      // Arrange- a half-supplied coordinate pair is unusable, so either omission has to send
      // the whole pair back to the frozen location rather than only the missing half.
      const engine = new JABS_Engine();
      engine.applyOnExecutionEffects = vi.fn();
      engine.executeMapAction = vi.fn();
      const caster = { guarding: () => false };
      const frozenLocation = { getX: () => 7, getY: () => 8 };
      const action = buildAction({
        getActionOptions: () => ({ getTargetLocation: () => frozenLocation }),
      });

      // Act
      engine.executeMapActions(caster, [ action ], null, 20);

      // Assert
      expect(engine.executeMapAction).toHaveBeenCalledWith(caster, action, 7, 8);
    });

    it('consults the frozen target location when only the y coordinate is omitted', () =>
    {
      // Arrange- the mirror of the missing-x case, since each half of the coordinate check
      // is an independent reason to fall back.
      const engine = new JABS_Engine();
      engine.applyOnExecutionEffects = vi.fn();
      engine.executeMapAction = vi.fn();
      const caster = { guarding: () => false };
      const frozenLocation = { getX: () => 7, getY: () => 8 };
      const action = buildAction({
        getActionOptions: () => ({ getTargetLocation: () => frozenLocation }),
      });

      // Act
      engine.executeMapActions(caster, [ action ], 10, null);

      // Assert
      expect(engine.executeMapAction).toHaveBeenCalledWith(caster, action, 7, 8);
    });

    it('leaves coordinates null when omitted and there is no frozen target location', () =>
    {
      const engine = new JABS_Engine();
      engine.applyOnExecutionEffects = vi.fn();
      engine.executeMapAction = vi.fn();
      const caster = { guarding: () => false };
      const action = buildAction({ getActionOptions: () => null });

      engine.executeMapActions(caster, [ action ], null, null);

      expect(engine.executeMapAction).toHaveBeenCalledWith(caster, action, null, null);
    });
  });

  describe('applyOnExecutionEffects', () =>
  {
    it('does nothing for a retaliation action', () =>
    {
      const engine = new JABS_Engine();
      engine.paySkillCosts = vi.fn();
      const action = { isRetaliation: () => true };

      engine.applyOnExecutionEffects({}, action);

      expect(engine.paySkillCosts).not.toHaveBeenCalled();
    });

    it('pays costs, applies cooldowns, and logs skill execution for a non-retaliation action', () =>
    {
      const engine = new JABS_Engine();
      engine.paySkillCosts = vi.fn();
      engine.applyCooldownCounters = vi.fn();
      engine.logSkillExecution = vi.fn();
      const caster = { getUuid: () => 'caster-uuid' };
      const action = { isRetaliation: () => false, getBaseSkill: () => ({ id: 5, stypeId: 2 }) };

      engine.applyOnExecutionEffects(caster, action);

      expect(engine.paySkillCosts).toHaveBeenCalledWith(caster, action);
      expect(engine.applyCooldownCounters).toHaveBeenCalledWith(caster, action);
      expect(engine.logSkillExecution).toHaveBeenCalledWith('caster-uuid', 5, 2);
    });
  });

  describe('executeMapAction', () =>
  {
    it('handles combo, fires on-execute effects, then handles action generation in order', () =>
    {
      const engine = new JABS_Engine();
      const callOrder = [];
      engine.handleActionCombo = vi.fn(() => callOrder.push('combo'));
      engine.onExecuteMapAction = vi.fn(() => callOrder.push('onExecute'));
      engine.handleActionGeneration = vi.fn(() => callOrder.push('generation'));

      engine.executeMapAction('caster', 'action', 1, 2);

      expect(callOrder).toEqual([ 'combo', 'onExecute', 'generation' ]);
      expect(engine.handleActionGeneration).toHaveBeenCalledWith('caster', 'action', 1, 2);
    });
  });

  describe('handleActionCombo', () =>
  {
    it('checks the combo sequence when the skill is tagged for free combo', () =>
    {
      const engine = new JABS_Engine();
      engine.checkComboSequence = vi.fn();
      const action = { getBaseSkill: () => ({ jabsFreeCombo: true }) };

      engine.handleActionCombo('caster', action);

      expect(engine.checkComboSequence).toHaveBeenCalledWith('caster', action);
    });

    it('does nothing when the skill is not tagged for free combo', () =>
    {
      const engine = new JABS_Engine();
      engine.checkComboSequence = vi.fn();
      const action = { getBaseSkill: () => ({ jabsFreeCombo: false }) };

      engine.handleActionCombo('caster', action);

      expect(engine.checkComboSequence).not.toHaveBeenCalled();
    });
  });

  describe('onExecuteMapAction', () =>
  {
    it('runs cast animation, on-cast animation, then on-cast state effects in order', () =>
    {
      const engine = new JABS_Engine();
      const callOrder = [];
      engine.handleActionCastAnimation = vi.fn(() => callOrder.push('castAnimation'));
      engine.handleActionOnCastAnimation = vi.fn(() => callOrder.push('onCastAnimation'));
      engine.handleOnCastStateEffects = vi.fn(() => callOrder.push('onCastStateEffects'));

      engine.onExecuteMapAction('caster', 'action');

      expect(callOrder).toEqual([ 'castAnimation', 'onCastAnimation', 'onCastStateEffects' ]);
    });
  });

  describe('handleActionCastAnimation', () =>
  {
    it('does nothing when the action has no cast animation', () =>
    {
      const engine = new JABS_Engine();
      const requestAnimation = vi.fn();
      const caster = { getCharacter: () => ({ requestAnimation }) };
      const action = { getCastAnimation: () => null };

      engine.handleActionCastAnimation(caster, action);

      expect(requestAnimation).not.toHaveBeenCalled();
    });

    it('requests the cast animation on the caster\'s character when one exists', () =>
    {
      const engine = new JABS_Engine();
      const requestAnimation = vi.fn();
      const caster = { getCharacter: () => ({ requestAnimation }) };
      const action = { getCastAnimation: () => 42 };

      engine.handleActionCastAnimation(caster, action);

      expect(requestAnimation).toHaveBeenCalledWith(42);
    });
  });

  describe('handleActionOnCastAnimation', () =>
  {
    it('does nothing when there is no on-cast animation id', () =>
    {
      const engine = new JABS_Engine();
      const action = { hasOnCastAnimationId: () => false, performOnCastAnimation: vi.fn() };

      engine.handleActionOnCastAnimation('caster', action);

      expect(action.performOnCastAnimation).not.toHaveBeenCalled();
    });

    it('plays the on-cast animation once when configured', () =>
    {
      const engine = new JABS_Engine();
      const caster = { id: 'caster' };
      const action = { hasOnCastAnimationId: () => true, performOnCastAnimation: vi.fn() };

      engine.handleActionOnCastAnimation(caster, action);

      expect(action.performOnCastAnimation).toHaveBeenCalledWith(caster);
    });
  });

  describe('handleOnCastStateEffects', () =>
  {
    it('applies all seven on-cast state effect hooks against the underlying Game_Action', () =>
    {
      const engine = new JABS_Engine();
      const gameAction = {
        applyOnCastSelfStates: vi.fn(),
        applyOnCastSelfStatesIfAfflicted: vi.fn(),
        applyOnCastLoseStates: vi.fn(),
        applyToggleOnExecuteStates: vi.fn(),
        applyToggleGroupOnExecuteStates: vi.fn(),
        applyOnCastExecuteSkills: vi.fn(),
        applyOnCastExecuteSkillsIfAfflicted: vi.fn(),
      };
      const action = { getAction: () => gameAction };

      engine.handleOnCastStateEffects('caster', action);

      expect(gameAction.applyOnCastSelfStates).toHaveBeenCalledTimes(1);
      expect(gameAction.applyOnCastSelfStatesIfAfflicted).toHaveBeenCalledTimes(1);
      expect(gameAction.applyOnCastLoseStates).toHaveBeenCalledTimes(1);
      expect(gameAction.applyToggleOnExecuteStates).toHaveBeenCalledTimes(1);
      expect(gameAction.applyToggleGroupOnExecuteStates).toHaveBeenCalledTimes(1);
      expect(gameAction.applyOnCastExecuteSkills).toHaveBeenCalledWith('caster');
      expect(gameAction.applyOnCastExecuteSkillsIfAfflicted).toHaveBeenCalledWith('caster');
    });
  });

  describe('handleActionGeneration', () =>
  {
    it('creates a map event and tracks it for a non-direct action', () =>
    {
      const engine = new JABS_Engine();
      const eventData = { id: 'event-data' };
      engine.buildActionEventData = vi.fn(() => eventData);
      engine.addJabsActionToMap = vi.fn();
      engine.addActionEvent = vi.fn();
      const action = { isDirectAction: () => false };

      engine.handleActionGeneration('caster', action, null, null);

      expect(engine.addJabsActionToMap).toHaveBeenCalledWith(eventData, action);
      expect(engine.addActionEvent).toHaveBeenCalledWith(action, eventData);
    });

    it('creates a map event for a direct action when coordinates are provided', () =>
    {
      const engine = new JABS_Engine();
      const eventData = { id: 'event-data' };
      engine.buildActionEventData = vi.fn(() => eventData);
      engine.addJabsActionToMap = vi.fn();
      engine.addActionEvent = vi.fn();
      const action = { isDirectAction: () => true };

      engine.handleActionGeneration('caster', action, 3, 4);

      expect(engine.addJabsActionToMap).toHaveBeenCalledWith(eventData, action);
    });

    it('does not create a map event for a direct action with no coordinates, but still tracks it', () =>
    {
      const engine = new JABS_Engine();
      engine.buildActionEventData = vi.fn();
      engine.addJabsActionToMap = vi.fn();
      engine.addActionEvent = vi.fn();
      const action = { isDirectAction: () => true };

      engine.handleActionGeneration('caster', action, null, null);

      expect(engine.buildActionEventData).not.toHaveBeenCalled();
      expect(engine.addJabsActionToMap).not.toHaveBeenCalled();
      expect(engine.addActionEvent).toHaveBeenCalledWith(action, null);
    });

    it('does not create a map event for a direct action given only an x coordinate', () =>
    {
      // Arrange- half a coordinate pair cannot place an event, so each half of the pair is
      // independently required. with both halves supplied or both omitted, either half could
      // be ignored without anything noticing.
      const engine = new JABS_Engine();
      engine.buildActionEventData = vi.fn();
      engine.addJabsActionToMap = vi.fn();
      engine.addActionEvent = vi.fn();
      const action = { isDirectAction: () => true };

      // Act
      engine.handleActionGeneration('caster', action, 3, null);

      // Assert
      expect(engine.buildActionEventData).not.toHaveBeenCalled();
      expect(engine.addActionEvent).toHaveBeenCalledWith(action, null);
    });

    it('does not create a map event for a direct action given only a y coordinate', () =>
    {
      // Arrange- the mirror of the x-only case above.
      const engine = new JABS_Engine();
      engine.buildActionEventData = vi.fn();
      engine.addJabsActionToMap = vi.fn();
      engine.addActionEvent = vi.fn();
      const action = { isDirectAction: () => true };

      // Act
      engine.handleActionGeneration('caster', action, null, 4);

      // Assert
      expect(engine.buildActionEventData).not.toHaveBeenCalled();
      expect(engine.addActionEvent).toHaveBeenCalledWith(action, null);
    });
  });
  //endregion actions: update/execute

  //region action geometry
  describe('buildActionEventData', () =>
  {
    beforeEach(() =>
    {
      globalThis.JsonEx = { makeDeepCopy: (x) => JSON.parse(JSON.stringify(x)) };
      globalThis.$actionMap = { events: { 7: { id: 7, x: 0, y: 0 } } };
    });

    function buildAction(overrides = {})
    {
      return Object.assign({
        getActionId: () => 7,
        getActionOptions: () => null,
        getUuid: () => 'action-uuid',
      }, overrides);
    }

    it('spawns at the caster\'s position when no coordinates are provided', () =>
    {
      const engine = new JABS_Engine();
      const caster = { getX: () => 5, getY: () => 6 };
      const result = engine.buildActionEventData(caster, buildAction(), null, null);
      expect(result.x).toBe(5);
      expect(result.y).toBe(6);
    });

    it('spawns at the explicitly provided coordinates when given', () =>
    {
      const engine = new JABS_Engine();
      const caster = { getX: () => 5, getY: () => 6 };
      const result = engine.buildActionEventData(caster, buildAction(), 10, 20);
      expect(result.x).toBe(10);
      expect(result.y).toBe(20);
    });

    it('applies the per-projectile spawn offset when action options are present', () =>
    {
      const engine = new JABS_Engine();
      const caster = { getX: () => 5, getY: () => 6 };
      const action = buildAction({
        getActionOptions: () => ({ getSpawnOffsetX: () => 2, getSpawnOffsetY: () => -1 }),
      });
      const result = engine.buildActionEventData(caster, action, null, null);
      expect(result.x).toBe(7);
      expect(result.y).toBe(5);
    });

    it('flags the copied event as an action, bumps its id, and stamps the action uuid', () =>
    {
      const engine = new JABS_Engine();
      const caster = { getX: () => 0, getY: () => 0 };
      const result = engine.buildActionEventData(caster, buildAction(), null, null);
      expect(result.isAction).toBe(true);
      expect(result.id).toBe(1007);
      expect(result.uniqueId).toBe('action-uuid');
      expect(result.actionDeleted).toBe(false);
    });
  });

  describe('determineActionDirections', () =>
  {
    it('repeats each spoke direction "count" times for a per-spoke formation', () =>
    {
      const engine = new JABS_Engine();
      engine.resolveFormationSpokes = () => [ 8, 6 ];
      engine.isPerSpokeFormation = () => true;
      expect(engine.determineActionDirections(8, 'cross', 2)).toEqual([ 8, 8, 6, 6 ]);
    });

    it('repeats only the first spoke "count" times for a total-count formation', () =>
    {
      const engine = new JABS_Engine();
      engine.resolveFormationSpokes = () => [ 8 ];
      engine.isPerSpokeFormation = () => false;
      expect(engine.determineActionDirections(8, 'line', 3)).toEqual([ 8, 8, 8 ]);
    });

    it('falls back to the facing when a total-count formation resolves no spokes at all', () =>
    {
      const engine = new JABS_Engine();
      engine.resolveFormationSpokes = () => [];
      engine.isPerSpokeFormation = () => false;
      expect(engine.determineActionDirections(6, 'line', 2)).toEqual([ 6, 6 ]);
    });
  });

  describe('resolveFormationSpokes', () =>
  {
    it('resolves the Line formation to a single forward spoke', () =>
    {
      const engine = new JABS_Engine();
      expect(engine.resolveFormationSpokes(8, 'line')).toEqual([ 8 ]);
    });

    it('resolves the Cross formation to the four cardinals, rotated to the facing', () =>
    {
      const engine = new JABS_Engine();
      const result = engine.resolveFormationSpokes(8, 'cross');
      expect(result).toEqual([ 8, 6, 2, 4 ]);
    });

    it('resolves the Spray formation to forward + both forward diagonals', () =>
    {
      const engine = new JABS_Engine();
      const result = engine.resolveFormationSpokes(8, 'spray');
      expect(result).toEqual([ 8, 9, 7 ]);
    });

    it('resolves the Xburst formation to the four diagonals', () =>
    {
      const engine = new JABS_Engine();
      const result = engine.resolveFormationSpokes(8, 'xburst');
      expect(result).toEqual([ 9, 3, 1, 7 ]);
    });

    it('resolves the Nova formation to all eight directions', () =>
    {
      const engine = new JABS_Engine();
      const result = engine.resolveFormationSpokes(8, 'nova');
      expect(result).toHaveLength(8);
    });

    it('rotates canonical spokes to match a non-up facing', () =>
    {
      const engine = new JABS_Engine();
      // canonical Line spoke is UP(8); facing RIGHT(6) should rotate it to 6.
      expect(engine.resolveFormationSpokes(6, 'line')).toEqual([ 6 ]);
    });
  });

  describe('isPerSpokeFormation', () =>
  {
    it.each([
      [ 'spray', true ], [ 'cross', true ], [ 'xburst', true ], [ 'nova', true ], [ 'line', false ],
    ])('formation %s is per-spoke: %s', (formation, expected) =>
    {
      const engine = new JABS_Engine();
      expect(engine.isPerSpokeFormation(formation)).toBe(expected);
    });
  });

  describe('rotateSpokeFromUpToFacing', () =>
  {
    it('returns the canonical direction unchanged when facing is already UP', () =>
    {
      const engine = new JABS_Engine();
      expect(engine.rotateSpokeFromUpToFacing(6, 8)).toBe(6);
    });

    it('returns the canonical direction unchanged for an unrecognized facing', () =>
    {
      const engine = new JABS_Engine();
      expect(engine.rotateSpokeFromUpToFacing(6, 999)).toBe(6);
    });

    it('rotates the canonical direction clockwise by the facing\'s step count from UP', () =>
    {
      const engine = new JABS_Engine();
      // facing RIGHT(6) is 2 steps clockwise from UP; canonical UP(8) rotates 2 steps -> RIGHT(6).
      expect(engine.rotateSpokeFromUpToFacing(8, 6)).toBe(6);
    });
  });

  describe('actionTravelDirectionToSpritePatternDirection', () =>
  {
    it.each([ 2, 4, 6, 8 ])('returns cardinal travel direction %i unchanged', (dir) =>
    {
      const engine = new JABS_Engine();
      expect(engine.actionTravelDirectionToSpritePatternDirection(dir, 2)).toBe(dir);
    });

    it('returns a cardinal travel direction that disagrees with the casted cardinal unchanged', () =>
    {
      // Arrange- the parametrized cardinal cases above all cast downward, so travel dir 2 and
      // the casted cardinal are the same number and the early return cannot be distinguished
      // from the later fall-through that returns the casted cardinal instead.
      const engine = new JABS_Engine();

      // Act
      const result = engine.actionTravelDirectionToSpritePatternDirection(2, 4);

      // Assert
      expect(result).toBe(2);
    });

    it.each([ 4, 6, 8 ])('falls back to casted cardinal %i for an unrecognized travel direction', (casted) =>
    {
      // Arrange- each cardinal is its own operand of the fall-through validity check, and the
      // method's own fallback is 2, so only a casted cardinal other than 2 proves the operand
      // for that cardinal is doing anything.
      const engine = new JABS_Engine();

      // Act
      const result = engine.actionTravelDirectionToSpritePatternDirection(999, casted);

      // Assert
      expect(result).toBe(casted);
    });

    it('falls back to DOWN when both travel direction and casted cardinal are unrecognized', () =>
    {
      const engine = new JABS_Engine();
      expect(engine.actionTravelDirectionToSpritePatternDirection(999, 999)).toBe(2);
    });

    it('falls back to DOWN when the travel direction is a valid diagonal but the casted cardinal is unrecognized', () =>
    {
      // travelDir=1 passes the early diagonal guard and reaches the switch(casted), but casted=999
      // matches none of the 2/4/6/8 cases- exercises the switch's outer default arm.
      const engine = new JABS_Engine();
      expect(engine.actionTravelDirectionToSpritePatternDirection(1, 999)).toBe(2);
    });

    it.each([
      [ 2, 1, 2 ], [ 2, 3, 2 ], [ 2, 7, 8 ], [ 2, 9, 8 ],
      [ 4, 1, 4 ], [ 4, 7, 4 ], [ 4, 3, 6 ], [ 4, 9, 6 ],
      [ 6, 3, 6 ], [ 6, 9, 6 ], [ 6, 1, 4 ], [ 6, 7, 4 ],
      [ 8, 7, 8 ], [ 8, 9, 8 ], [ 8, 1, 2 ], [ 8, 3, 2 ],
    ])('resolves diagonal travel dir %i with casted cardinal %i to %i', (casted, travelDir, expected) =>
    {
      const engine = new JABS_Engine();
      expect(engine.actionTravelDirectionToSpritePatternDirection(travelDir, casted)).toBe(expected);
    });
  });

  describe('resolveProjectileFormationForSkill', () =>
  {
    it('returns the tagged formation when present', () =>
    {
      const engine = new JABS_Engine();
      expect(engine.resolveProjectileFormationForSkill({ jabsProjectileFormation: 'nova' })).toBe('nova');
    });

    it('defaults to Line when untagged', () =>
    {
      const engine = new JABS_Engine();
      expect(engine.resolveProjectileFormationForSkill({ jabsProjectileFormation: undefined })).toBe('line');
    });
  });

  describe('resolveProjectileCountForSkill', () =>
  {
    it('returns the tagged count when present', () =>
    {
      const engine = new JABS_Engine();
      expect(engine.resolveProjectileCountForSkill({ jabsProjectile: 5 })).toBe(5);
    });

    it('defaults to 1 when untagged', () =>
    {
      const engine = new JABS_Engine();
      expect(engine.resolveProjectileCountForSkill({ jabsProjectile: undefined })).toBe(1);
    });
  });

  describe('rotate45degrees', () =>
  {
    it.each([
      [ 8, true, 9 ], [ 8, false, 7 ],
      [ 6, true, 3 ], [ 6, false, 9 ],
      [ 4, true, 7 ], [ 4, false, 1 ],
      [ 2, true, 1 ], [ 2, false, 3 ],
      [ 1, true, 4 ], [ 1, false, 2 ],
      [ 3, true, 2 ], [ 3, false, 6 ],
      [ 7, true, 8 ], [ 7, false, 4 ],
      [ 9, true, 6 ], [ 9, false, 8 ],
    ])('rotates %i (%s clockwise) to %i', (direction, clockwise, expected) =>
    {
      const engine = new JABS_Engine();
      expect(engine.rotate45degrees(direction, clockwise)).toBe(expected);
    });
  });

  describe('rotate90degrees', () =>
  {
    it.each([
      [ 8, true, 6 ], [ 8, false, 4 ],
      [ 6, true, 2 ], [ 6, false, 8 ],
      [ 4, true, 8 ], [ 4, false, 2 ],
      [ 2, true, 4 ], [ 2, false, 6 ],
      [ 1, true, 7 ], [ 1, false, 3 ],
      [ 3, true, 1 ], [ 3, false, 9 ],
      [ 7, true, 9 ], [ 7, false, 1 ],
      [ 9, true, 3 ], [ 9, false, 7 ],
    ])('rotates %i (%s clockwise) to %i', (direction, clockwise, expected) =>
    {
      const engine = new JABS_Engine();
      expect(engine.rotate90degrees(direction, clockwise)).toBe(expected);
    });

    it('warns and leaves the direction unchanged for a non-dir8 value', () =>
    {
      const engine = new JABS_Engine();
      vi.spyOn(console, 'warn').mockImplementation(() => {});
      expect(engine.rotate90degrees(99, true)).toBe(99);
      console.warn.mockRestore();
    });
  });

  describe('rotate180degrees', () =>
  {
    it.each([
      [ 8, 2 ], [ 6, 4 ], [ 4, 6 ], [ 2, 8 ],
      [ 1, 9 ], [ 3, 7 ], [ 7, 3 ], [ 9, 1 ],
    ])('rotates %i to its opposite %i', (direction, expected) =>
    {
      const engine = new JABS_Engine();
      expect(engine.rotate180degrees(direction)).toBe(expected);
    });

    it('warns and leaves the direction unchanged for a non-dir8 value', () =>
    {
      const engine = new JABS_Engine();
      vi.spyOn(console, 'warn').mockImplementation(() => {});
      expect(engine.rotate180degrees(99)).toBe(99);
      console.warn.mockRestore();
    });
  });
  //endregion action geometry

  //region costs and cooldowns
  describe('isBasicAttack', () =>
  {
    it('is true for the mainhand cooldown key', () =>
    {
      const engine = new JABS_Engine();
      expect(engine.isBasicAttack('mainhand')).toBe(true);
    });

    it('is true for the offhand cooldown key', () =>
    {
      const engine = new JABS_Engine();
      expect(engine.isBasicAttack('offhand')).toBe(true);
    });

    it('is false for any other cooldown key', () =>
    {
      const engine = new JABS_Engine();
      expect(engine.isBasicAttack('combat1')).toBe(false);
    });
  });

  describe('paySkillCosts', () =>
  {
    it('pays the skill cost against the caster\'s underlying battler', () =>
    {
      const engine = new JABS_Engine();
      const paySkillCost = vi.fn();
      const caster = { getBattler: () => ({ paySkillCost }) };
      const skill = { id: 5 };
      const action = { getBaseSkill: () => skill };

      engine.paySkillCosts(caster, action);

      expect(paySkillCost).toHaveBeenCalledWith(skill);
    });
  });

  describe('applyCooldownCounters', () =>
  {
    it('delegates to applyCasterCooldowns', () =>
    {
      const engine = new JABS_Engine();
      engine.applyCasterCooldowns = vi.fn();
      engine.applyCooldownCounters('caster', 'action');
      expect(engine.applyCasterCooldowns).toHaveBeenCalledWith('caster', 'action');
    });
  });

  describe('applyCasterCooldowns', () =>
  {
    it('applies the skill\'s own effective cooldown value', () =>
    {
      const engine = new JABS_Engine();
      engine.applyCooldownValueForSkill = vi.fn();
      const action = { getBaseSkill: () => ({ id: 5 }), getCooldown: () => 42 };

      engine.applyCasterCooldowns('caster', action);

      expect(engine.applyCooldownValueForSkill).toHaveBeenCalledWith('caster', action, 42);
    });

    it('does not stamp the global cooldown when the skill is not subject to it', () =>
    {
      const engine = new JABS_Engine();
      engine.applyCooldownValueForSkill = vi.fn();
      const caster = { setCooldownCounter: vi.fn() };
      const action = { getBaseSkill: () => ({ id: 5 }), getCooldown: () => 42 };

      engine.applyCasterCooldowns(caster, action);

      expect(caster.setCooldownCounter).not.toHaveBeenCalled();
    });

    it('stamps the reduced global cooldown frames when the skill is subject to it', async () =>
    {
      const { default: JABS_GlobalCooldown } = await import('../../../../../src/plugins/abs/core/models/JABS_GlobalCooldown.js');
      JABS_GlobalCooldown.skillIsSubjectToGlobalCooldown = () => true;
      JABS_GlobalCooldown.framesForSkill = () => 100;
      JABS_GlobalCooldown.reducedFramesForCaster = () => 80;
      const engine = new JABS_Engine();
      engine.applyCooldownValueForSkill = vi.fn();
      const caster = { setCooldownCounter: vi.fn() };
      const action = { getBaseSkill: () => ({ id: 5 }), getCooldown: () => 42 };

      engine.applyCasterCooldowns(caster, action);

      expect(caster.setCooldownCounter).toHaveBeenCalledWith('gcd', 80);
      JABS_GlobalCooldown.skillIsSubjectToGlobalCooldown = () => false;
    });
  });

  describe('applyCooldownValueForSkill', () =>
  {
    it('stamps only the executed slot for a uniquely-cooldowned skill', () =>
    {
      const engine = new JABS_Engine();
      engine.applyComboModeForSkill = vi.fn();
      const caster = { setCooldownCounter: vi.fn(), getBattler: vi.fn() };
      const action = { getCooldownType: () => 'combat1', getBaseSkill: () => ({ jabsUniqueCooldown: true }) };

      engine.applyCooldownValueForSkill(caster, action, 30);

      expect(caster.setCooldownCounter).toHaveBeenCalledWith('combat1', 30);
      expect(caster.getBattler).not.toHaveBeenCalled();
    });

    it('stamps only the executed slot for a basic attack, even without the unique-cooldown tag', () =>
    {
      const engine = new JABS_Engine();
      engine.applyComboModeForSkill = vi.fn();
      const caster = { setCooldownCounter: vi.fn(), getBattler: vi.fn() };
      const action = { getCooldownType: () => 'mainhand', getBaseSkill: () => ({ jabsUniqueCooldown: false }) };

      engine.applyCooldownValueForSkill(caster, action, 30);

      expect(caster.setCooldownCounter).toHaveBeenCalledWith('mainhand', 30);
      expect(caster.getBattler).not.toHaveBeenCalled();
    });

    it('stamps every equipped slot resolving to the same executed skill for a shared-cooldown skill', () =>
    {
      const engine = new JABS_Engine();
      engine.applyComboModeForSkill = vi.fn();
      const skill = { id: 5, jabsUniqueCooldown: false };
      const slots = [ { id: 1, key: 'combat1' }, { id: 2, key: 'combat2' } ];
      const battler = {
        getAllEquippedSkills: () => slots,
        resolveEquippedSkillId: (id) => (id === 1 ? 5 : 6),
      };
      const caster = { setCooldownCounter: vi.fn(), getBattler: () => battler };
      const action = { getCooldownType: () => 'combat1', getBaseSkill: () => skill };

      engine.applyCooldownValueForSkill(caster, action, 30);

      expect(caster.setCooldownCounter).toHaveBeenCalledTimes(1);
      expect(caster.setCooldownCounter).toHaveBeenCalledWith('combat1', 30);
    });

    it('stamps the resolved slot keys rather than the executed cooldown type for a shared-cooldown skill', () =>
    {
      // Arrange- the executed cooldown type is deliberately a slot key that appears nowhere in
      // the equipped list. when the two coincide, stamping "the executed slot" and stamping
      // "every slot resolving to this skill" write the same key and the unique-vs-shared fork
      // carries none of the assertion. combat2 is the near-miss sibling: same shape, resolves
      // to a different skill, and has to survive untouched.
      const engine = new JABS_Engine();
      engine.applyComboModeForSkill = vi.fn();
      const skill = { id: 5, jabsUniqueCooldown: false };
      const slots = [ { id: 1, key: 'combat1' }, { id: 2, key: 'combat2' } ];
      const battler = {
        getAllEquippedSkills: () => slots,
        resolveEquippedSkillId: (id) => (id === 1 ? 5 : 6),
      };
      const caster = { setCooldownCounter: vi.fn(), getBattler: () => battler };
      const action = { getCooldownType: () => 'combat9', getBaseSkill: () => skill };

      // Act
      engine.applyCooldownValueForSkill(caster, action, 30);

      // Assert
      expect(caster.setCooldownCounter).toHaveBeenCalledTimes(1);
      expect(caster.setCooldownCounter).toHaveBeenCalledWith('combat1', 30);
      expect(engine.applyComboModeForSkill).toHaveBeenCalledWith(caster, 'combat1', skill);
    });

    it('stamps the combo mode for every slot it touches', () =>
    {
      const engine = new JABS_Engine();
      engine.applyComboModeForSkill = vi.fn();
      const skill = { jabsUniqueCooldown: true };
      const caster = { setCooldownCounter: vi.fn() };
      const action = { getCooldownType: () => 'mainhand', getBaseSkill: () => skill };

      engine.applyCooldownValueForSkill(caster, action, 30);

      expect(engine.applyComboModeForSkill).toHaveBeenCalledWith(caster, 'mainhand', skill);
    });
  });

  describe('applyComboModeForSkill', () =>
  {
    it('does nothing when the caster has no cooldown for the given key', () =>
    {
      const engine = new JABS_Engine();
      const caster = { getCooldown: () => null };
      expect(() => engine.applyComboModeForSkill(caster, 'mainhand', {})).not.toThrow();
    });

    it('sets combo mode to "none" when the skill has no combo tag', () =>
    {
      const engine = new JABS_Engine();
      const cooldown = { setComboMode: vi.fn(), setComboFrames: vi.fn(), setComboExpireFrames: vi.fn() };
      const caster = { getCooldown: () => cooldown };

      engine.applyComboModeForSkill(caster, 'mainhand', { jabsComboAction: null });

      expect(cooldown.setComboMode).toHaveBeenCalledWith('none');
    });

    it('sets combo mode to "expiring" and pre-arms both timers when the combo has an expiry window', () =>
    {
      const engine = new JABS_Engine();
      const cooldown = { setComboMode: vi.fn(), setComboFrames: vi.fn(), setComboExpireFrames: vi.fn() };
      const caster = { getCooldown: () => cooldown };
      const skill = { jabsComboAction: {}, jabsComboExpire: 30, jabsComboDelay: 10 };

      engine.applyComboModeForSkill(caster, 'mainhand', skill);

      expect(cooldown.setComboMode).toHaveBeenCalledWith('expiring');
      expect(cooldown.setComboFrames).toHaveBeenCalledWith(10);
      expect(cooldown.setComboExpireFrames).toHaveBeenCalledWith(30);
    });

    it('sets combo mode to "infinite" and pre-arms only the delay when the combo has no expiry', () =>
    {
      const engine = new JABS_Engine();
      const cooldown = { setComboMode: vi.fn(), setComboFrames: vi.fn(), setComboExpireFrames: vi.fn() };
      const caster = { getCooldown: () => cooldown };
      const skill = { jabsComboAction: {}, jabsComboExpire: 0, jabsComboDelay: 10 };

      engine.applyComboModeForSkill(caster, 'mainhand', skill);

      expect(cooldown.setComboMode).toHaveBeenCalledWith('infinite');
      expect(cooldown.setComboFrames).toHaveBeenCalledWith(10);
      expect(cooldown.setComboExpireFrames).not.toHaveBeenCalled();
    });
  });
  //endregion costs and cooldowns

  //region map spawning
  describe('addJabsActionToMap', () =>
  {
    /** duck-typed stand-in for the bare RMMZ Game_Event global this file constructs directly. */
    function buildFakeGameEventClass()
    {
      return vi.fn(function(mapId, eventId)
      {
        this.mapId = mapId;
        this.eventId = eventId;
        this.findProperPageIndex = () => 0;
        this.setActionSpriteNeedsAdding = vi.fn();
        this.setMoveFrequency = vi.fn();
        this.setMoveRoute = vi.fn();
        this.setCastedDirection = vi.fn();
        this.setJabsAction = vi.fn();
        this.getCastedDirection = () => 2;
        this.setDirection = vi.fn();
        this.setActionSprite = vi.fn();
      });
    }

    function buildActionEventData(overrides = {})
    {
      return Object.assign({
        x: 5, y: 6,
        pages: [ { image: { characterName: 'Actor1', characterIndex: 0 }, moveFrequency: 3, moveRoute: {} } ],
      }, overrides);
    }

    function buildAction(overrides = {})
    {
      return Object.assign({
        getBaseSkill: () => ({ name: 'Fireball' }),
        getCaster: () => ({ battlerName: () => 'Hero', getCharacter: () => ({ direction: () => 2 }) }),
        stampActionMapVisualNoteFromActionEvent: vi.fn(),
        setActionSprite: vi.fn(),
        direction: () => 2,
      }, overrides);
    }

    beforeEach(() =>
    {
      globalThis.Game_Event = buildFakeGameEventClass();
      globalThis.$dataMap = { events: [ null, {} ] };
      globalThis.$gameMap = Object.assign(globalThis.$gameMap, { addEvent: vi.fn() });
      globalThis.J.ABS.DefaultValues = { ActionMap: 5 };
    });

    it('reuses the first empty hole in the data map event list', () =>
    {
      const engine = new JABS_Engine();
      const actionEventData = buildActionEventData();

      engine.addJabsActionToMap(actionEventData, buildAction());

      expect(globalThis.$dataMap.events[0]).toBe(actionEventData);
      expect(actionEventData.actionIndex).toBe(0);
    });

    it('appends to the end when there is no hole to reuse', () =>
    {
      globalThis.$dataMap.events = [ {}, {} ];
      const engine = new JABS_Engine();
      const actionEventData = buildActionEventData();

      engine.addJabsActionToMap(actionEventData, buildAction());

      expect(globalThis.$dataMap.events[2]).toBe(actionEventData);
      expect(actionEventData.actionIndex).toBe(2);
    });

    it('logs an error and aborts when the action event data has no pages', () =>
    {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      const engine = new JABS_Engine();
      const actionEventData = buildActionEventData({ pages: [] });

      engine.addJabsActionToMap(actionEventData, buildAction());

      expect(console.error).toHaveBeenCalled();
      expect(globalThis.$gameMap.addEvent).not.toHaveBeenCalled();
      console.error.mockRestore();
    });

    it('wires the sprite\'s image, action, and casted direction, then adds it to the map', () =>
    {
      const engine = new JABS_Engine();
      const actionEventData = buildActionEventData();
      const action = buildAction();

      engine.addJabsActionToMap(actionEventData, action);

      expect(globalThis.$gameMap.addEvent).toHaveBeenCalledTimes(1);
      expect(action.setActionSprite).toHaveBeenCalledTimes(1);
      expect(engine.requestActionRendering).toBe(true);
    });

    it('disables the no-op start handler so players cannot interact with the action event', () =>
    {
      const engine = new JABS_Engine();
      const actionEventData = buildActionEventData();

      engine.addJabsActionToMap(actionEventData, buildAction());

      const [ [ createdSprite ] ] = globalThis.$gameMap.addEvent.mock.calls;
      expect(createdSprite.start()).toBe(false);
    });
  });

  describe('applyActionToActionEventSprite', () =>
  {
    it('wires the jabs action then sets the sprite-safe cardinal direction', () =>
    {
      const engine = new JABS_Engine();
      engine.actionTravelDirectionToSpritePatternDirection = vi.fn(() => 6);
      const setJabsAction = vi.fn();
      const setDirection = vi.fn();
      const actionEventSprite = { setJabsAction, setDirection, getCastedDirection: () => 4 };
      const action = { direction: () => 9 };

      engine.applyActionToActionEventSprite(actionEventSprite, action);

      expect(setJabsAction).toHaveBeenCalledWith(action);
      expect(engine.actionTravelDirectionToSpritePatternDirection).toHaveBeenCalledWith(9, 4);
      expect(setDirection).toHaveBeenCalledWith(6);
    });
  });

  describe('addLootDropToMap', () =>
  {
    beforeEach(() =>
    {
      globalThis.JsonEx = { makeDeepCopy: (x) => JSON.parse(JSON.stringify(x)) };
      globalThis.$actionMap = { events: { 1: { id: 1, x: 0, y: 0 } } };
      globalThis.$dataMap = { events: [ null ] };
      globalThis.$gameMap = Object.assign(globalThis.$gameMap, { addEvent: vi.fn(), mapId: () => 3 });
      globalThis.Game_Event = vi.fn(function(mapId, eventId)
      {
        this.mapId = mapId;
        this.eventId = eventId;
        this.setJabsLoot = vi.fn();
        this.setLootNeedsAdding = vi.fn();
      });
      globalThis.J.ABS.Metadata.DefaultLootExpiration = 300;
    });

    it('positions the cloned loot event at the given coordinates', () =>
    {
      const engine = new JABS_Engine();
      const item = { id: 1 };

      engine.addLootDropToMap(10, 20, item);

      expect(globalThis.$dataMap.events[0]).toMatchObject({ x: 10, y: 20 });
    });

    it('reuses a hole in the data map event list when one exists', () =>
    {
      const engine = new JABS_Engine();
      engine.addLootDropToMap(1, 2, { id: 1 });
      expect(globalThis.$dataMap.events[0].lootIndex).toBe(0);
    });

    it('appends when there is no hole to reuse', () =>
    {
      globalThis.$dataMap.events = [ {} ];
      const engine = new JABS_Engine();
      engine.addLootDropToMap(1, 2, { id: 1 });
      expect(globalThis.$dataMap.events[1].lootIndex).toBe(1);
    });

    it('adds the loot event to the map and requests loot rendering', () =>
    {
      const engine = new JABS_Engine();
      const result = engine.addLootDropToMap(1, 2, { id: 1 });
      expect(globalThis.$gameMap.addEvent).toHaveBeenCalledWith(result);
      expect(engine.requestLootRendering).toBe(true);
    });

    it('uses the item\'s tagged expiration when present, otherwise the metadata default', () =>
    {
      const engineWithTag = new JABS_Engine();
      const withCustom = engineWithTag.addLootDropToMap(1, 2, { id: 1, jabsExpiration: 999 });
      expect(withCustom.setJabsLoot.mock.calls[0][0].duration()).toBe(999);

      globalThis.$dataMap.events = [ null ];
      const engineWithoutTag = new JABS_Engine();
      const withDefault = engineWithoutTag.addLootDropToMap(1, 2, { id: 1 });
      expect(withDefault.setJabsLoot.mock.calls[0][0].duration()).toBe(300);
    });
  });

  describe('addEnemyToMap', () =>
  {
    beforeEach(() =>
    {
      globalThis.JsonEx = { makeDeepCopy: (x) => JSON.parse(JSON.stringify(x)) };
      globalThis.$dataMap = { events: [ null ] };
      globalThis.$gameMap = Object.assign(globalThis.$gameMap, { addEvent: vi.fn(), mapId: () => 3 });
      globalThis.Game_Event = vi.fn(function(mapId, eventId)
      {
        this.mapId = mapId;
        this.eventId = eventId;
        this.flagBattlerForAdding = vi.fn();
        this.flagAsDynamicSpawn = vi.fn();
      });
      JABS_Engine.setEnemyCloneList([ { id: 'enemy-template', x: 0, y: 0 } ]);
    });

    it('KNOWN GAP: kicks off enemy-map initialization on demand, but since that fetch is async and unwaited, immediately trying to clone from the still-null list throws synchronously (harmless in practice since the constructor already initializes this well before any real addEnemyToMap call)', () =>
    {
      // Arrange- the engine is built while the list is populated so the constructor's own
      // bootstrap is not the thing that satisfies the fetch assertion below; only then is the
      // list emptied, leaving this method's own on-demand check as the sole trigger.
      const engine = new JABS_Engine();
      JABS_Engine.setEnemyCloneList(null);
      globalThis.fetch.mockClear();

      // Act / Assert
      expect(() => engine.addEnemyToMap(1, 2, 0)).toThrow();
      expect(globalThis.fetch).toHaveBeenCalledWith('data/Map005.json');
    });

    it('does not re-fetch the enemy map when the clone list is already populated', () =>
    {
      // Arrange- the populated-list sibling of the on-demand bootstrap above.
      const engine = new JABS_Engine();
      globalThis.fetch.mockClear();

      // Act
      const result = engine.addEnemyToMap(10, 20, 0);

      // Assert- the clone still lands on the map, it is just built from the cached list.
      expect(globalThis.fetch).not.toHaveBeenCalled();
      expect(globalThis.$gameMap.addEvent).toHaveBeenCalledWith(result);
    });

    it('logs an error and returns nothing when the enemy clone id does not resolve', () =>
    {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      const engine = new JABS_Engine();

      const result = engine.addEnemyToMap(1, 2, 99);

      expect(console.error).toHaveBeenCalled();
      expect(result).toBeUndefined();
      console.error.mockRestore();
    });

    it('clones the enemy template at the given coordinates and adds it to the map', () =>
    {
      const engine = new JABS_Engine();

      const result = engine.addEnemyToMap(10, 20, 0);

      expect(globalThis.$dataMap.events.at(-1)).toMatchObject({ x: 10, y: 20 });
      expect(globalThis.$gameMap.addEvent).toHaveBeenCalledWith(result);
      expect(result.flagBattlerForAdding).toHaveBeenCalledTimes(1);
      expect(engine.requestBattlerRendering).toBe(true);
    });
  });
  //endregion map spawning

  //region battle effects
  describe('applyPrimaryBattleEffects', () =>
  {
    it('runs the full battle-effects pipeline in order', () =>
    {
      const engine = new JABS_Engine();
      const callOrder = [];
      engine.executeSkillEffects = vi.fn(() => callOrder.push('execute'));
      engine.applyOnHitEffects = vi.fn(() => callOrder.push('onHit'));
      engine.continuedPrimaryBattleEffects = vi.fn(() => callOrder.push('continued'));
      engine.postPrimaryBattleEffects = vi.fn(() => callOrder.push('post'));

      engine.applyPrimaryBattleEffects('action', 'target');

      expect(callOrder).toEqual([ 'execute', 'onHit', 'continued', 'post' ]);
    });
  });

  describe('executeSkillEffects', () =>
  {
    function buildResult(overrides = {})
    {
      return Object.assign({ clear: vi.fn() }, overrides);
    }

    function buildTargetBattler(result)
    {
      return { result: () => result, isDead: () => false, setLastHitSource: vi.fn() };
    }

    function buildTarget(overrides = {})
    {
      return Object.assign({
        guarding: () => false,
        setDeathContext: vi.fn(),
      }, overrides);
    }

    function buildAction(overrides = {})
    {
      const gameAction = { apply: vi.fn() };
      return Object.assign({
        isUnparryable: () => true,
        isHealing: () => false,
        getCaster: () => ({ getBattler: () => ({ getUuid: () => 'caster-uuid' }) }),
        getAction: () => gameAction,
      }, overrides);
    }

    it('clears the target\'s result before and delegates to pre/post execution hooks', () =>
    {
      const engine = new JABS_Engine();
      engine.preExecuteSkillEffects = vi.fn();
      engine.postExecuteSkillEffects = vi.fn();
      const result = buildResult();
      const targetBattler = buildTargetBattler(result);
      const target = buildTarget({ getBattler: () => targetBattler });
      const action = buildAction();

      engine.executeSkillEffects(action, target);

      expect(result.clear).toHaveBeenCalled();
      expect(engine.preExecuteSkillEffects).toHaveBeenCalledWith(action, target);
      expect(engine.postExecuteSkillEffects).toHaveBeenCalledWith(action, target);
    });

    it('applies the underlying game action against the target battler', () =>
    {
      const engine = new JABS_Engine();
      engine.preExecuteSkillEffects = vi.fn();
      engine.postExecuteSkillEffects = vi.fn();
      const result = buildResult();
      const targetBattler = buildTargetBattler(result);
      const target = buildTarget({ getBattler: () => targetBattler });
      const action = buildAction();

      engine.executeSkillEffects(action, target);

      expect(action.getAction().apply).toHaveBeenCalledWith(targetBattler);
    });

    it('records the last-hit source on the target when the action dealt damage', () =>
    {
      const engine = new JABS_Engine();
      engine.preExecuteSkillEffects = vi.fn();
      engine.postExecuteSkillEffects = vi.fn();
      const result = buildResult({ hpDamage: 10 });
      const targetBattler = buildTargetBattler(result);
      const target = buildTarget({ getBattler: () => targetBattler });
      const gameAction = { apply: vi.fn(), item: () => ({ id: 42 }) };
      const action = buildAction({ getAction: () => gameAction });

      engine.executeSkillEffects(action, target);

      expect(targetBattler.setLastHitSource).toHaveBeenCalledWith('skill', 'caster-uuid', 42);
    });

    it.each([
      [ 'mp', 'mpDamage' ],
      [ 'tp', 'tpDamage' ],
    ])('records the last-hit source for a hit that only drained %s', (_label, field) =>
    {
      // Arrange: damage is a three-way or, and every case above drives it through hp alone - so
      // the other two operands carry nothing and could each be forced false unnoticed. A skill
      // that only burns mp or tp is a real hit, and forgetting it would let an earlier, unrelated
      // attacker keep the credit for whatever happens next.
      const engine = new JABS_Engine();
      engine.preExecuteSkillEffects = vi.fn();
      engine.postExecuteSkillEffects = vi.fn();
      const result = buildResult({ [ field ]: 10 });
      const targetBattler = buildTargetBattler(result);
      const target = buildTarget({ getBattler: () => targetBattler });
      const gameAction = {
        apply: vi.fn(),
        item: () => ({ id: 42 }),
      };
      const action = buildAction({ getAction: () => gameAction });

      // Act
      engine.executeSkillEffects(action, target);

      // Assert
      expect(targetBattler.setLastHitSource).toHaveBeenCalledWith('skill', 'caster-uuid', 42);
    });

    it('does not record a last-hit source when the action dealt no damage (miss/parry)', () =>
    {
      const engine = new JABS_Engine();
      engine.preExecuteSkillEffects = vi.fn();
      engine.postExecuteSkillEffects = vi.fn();
      const result = buildResult();
      const targetBattler = buildTargetBattler(result);
      const target = buildTarget({ getBattler: () => targetBattler });
      const action = buildAction();

      engine.executeSkillEffects(action, target);

      expect(targetBattler.setLastHitSource).not.toHaveBeenCalled();
    });

    it('flags the result as guarded when the target is guarding', () =>
    {
      const engine = new JABS_Engine();
      engine.preExecuteSkillEffects = vi.fn();
      engine.postExecuteSkillEffects = vi.fn();
      const result = buildResult();
      const targetBattler = buildTargetBattler(result);
      const target = buildTarget({ getBattler: () => targetBattler, guarding: () => true });
      const action = buildAction();

      engine.executeSkillEffects(action, target);

      expect(result.guarded).toBe(true);
    });

    it('leaves the result unguarded when the target is not guarding', () =>
    {
      // Arrange- the guarded flag is only ever written by the guard check, so the seeded false
      // below can only survive if that check actually declined to fire.
      const engine = new JABS_Engine();
      engine.preExecuteSkillEffects = vi.fn();
      engine.postExecuteSkillEffects = vi.fn();
      const result = buildResult({ guarded: false });
      const targetBattler = buildTargetBattler(result);
      const target = buildTarget({ getBattler: () => targetBattler, guarding: () => false });
      const action = buildAction();

      // Act
      engine.executeSkillEffects(action, target);

      // Assert- the applied action is the proof the method ran all the way through.
      expect(result.guarded).toBe(false);
      expect(action.getAction().apply).toHaveBeenCalledWith(targetBattler);
    });

    it('does not attempt any defensive check when the action is unparryable', () =>
    {
      const engine = new JABS_Engine();
      engine.preExecuteSkillEffects = vi.fn();
      engine.postExecuteSkillEffects = vi.fn();
      engine.canAttemptImplicitParry = vi.fn();
      const target = buildTarget({ getBattler: () => buildTargetBattler(buildResult()) });
      const action = buildAction({ isUnparryable: () => true });

      engine.executeSkillEffects(action, target);

      expect(engine.canAttemptImplicitParry).not.toHaveBeenCalled();
    });

    it('treats healing actions as unparryable regardless of the tag', () =>
    {
      const engine = new JABS_Engine();
      engine.preExecuteSkillEffects = vi.fn();
      engine.postExecuteSkillEffects = vi.fn();
      engine.canAttemptImplicitParry = vi.fn();
      const target = buildTarget({ getBattler: () => buildTargetBattler(buildResult()) });
      const action = buildAction({ isUnparryable: () => false, isHealing: () => true });

      engine.executeSkillEffects(action, target);

      expect(engine.canAttemptImplicitParry).not.toHaveBeenCalled();
    });

    it('does not check for parry/glance when the target cannot attempt implicit parry', () =>
    {
      const engine = new JABS_Engine();
      engine.preExecuteSkillEffects = vi.fn();
      engine.postExecuteSkillEffects = vi.fn();
      engine.canAttemptImplicitParry = () => false;
      engine.checkImplicitFullParry = vi.fn();
      const target = buildTarget({ getBattler: () => buildTargetBattler(buildResult()) });
      const action = buildAction({ isUnparryable: () => false });

      engine.executeSkillEffects(action, target);

      expect(engine.checkImplicitFullParry).not.toHaveBeenCalled();
    });

    it('fully negates the action and flags parried when the full parry check succeeds', () =>
    {
      const engine = new JABS_Engine();
      engine.preExecuteSkillEffects = vi.fn();
      engine.postExecuteSkillEffects = vi.fn();
      engine.canAttemptImplicitParry = () => true;
      engine.checkImplicitFullParry = () => true;
      engine.checkGlancingBlow = vi.fn();
      const result = buildResult();
      const target = buildTarget({ getBattler: () => buildTargetBattler(result) });
      const action = buildAction({ isUnparryable: () => false });

      engine.executeSkillEffects(action, target);

      expect(result.parried).toBe(true);
      expect(result.clear).toHaveBeenCalledTimes(2);
      expect(engine.checkGlancingBlow).not.toHaveBeenCalled();
    });

    it('flags glancing when the full parry fails but the glancing check succeeds', () =>
    {
      const engine = new JABS_Engine();
      engine.preExecuteSkillEffects = vi.fn();
      engine.postExecuteSkillEffects = vi.fn();
      engine.canAttemptImplicitParry = () => true;
      engine.checkImplicitFullParry = () => false;
      engine.checkGlancingBlow = () => true;
      const result = buildResult();
      const target = buildTarget({ getBattler: () => buildTargetBattler(result) });
      const action = buildAction({ isUnparryable: () => false });

      engine.executeSkillEffects(action, target);

      expect(result.glancing).toBe(true);
    });

    it('neither parries nor glances when both defensive checks fail', () =>
    {
      const engine = new JABS_Engine();
      engine.preExecuteSkillEffects = vi.fn();
      engine.postExecuteSkillEffects = vi.fn();
      engine.canAttemptImplicitParry = () => true;
      engine.checkImplicitFullParry = () => false;
      engine.checkGlancingBlow = () => false;
      const result = buildResult();
      const target = buildTarget({ getBattler: () => buildTargetBattler(result) });
      const action = buildAction({ isUnparryable: () => false });

      engine.executeSkillEffects(action, target);

      expect(result.parried).toBeUndefined();
      expect(result.glancing).toBeUndefined();
    });

    it('does not snapshot a death context when the target survives', () =>
    {
      const engine = new JABS_Engine();
      engine.preExecuteSkillEffects = vi.fn();
      engine.postExecuteSkillEffects = vi.fn();
      const target = buildTarget({ getBattler: () => buildTargetBattler(buildResult()) });
      const action = buildAction();

      engine.executeSkillEffects(action, target);

      expect(target.setDeathContext).not.toHaveBeenCalled();
    });

    it('snapshots a physical death context when the killing action is physical', () =>
    {
      const engine = new JABS_Engine();
      engine.preExecuteSkillEffects = vi.fn();
      engine.postExecuteSkillEffects = vi.fn();
      const gameAction = {
        apply: vi.fn(),
        getApplicableElements: () => [ 1, 2 ],
        isPhysical: () => true,
        isMagical: () => false,
        item: () => ({ stypeId: 3 }),
      };
      const targetBattler = { result: () => buildResult(), isDead: () => true, setDeathContext: vi.fn() };
      const target = buildTarget({ getBattler: () => targetBattler });
      const action = buildAction({ getAction: () => gameAction });

      engine.executeSkillEffects(action, target);

      expect(targetBattler.setDeathContext).toHaveBeenCalledWith(expect.objectContaining({
        elementIds: [ 1, 2 ], hitType: 'physical', stypeId: 3, killerUuid: 'caster-uuid',
      }));
    });

    it('snapshots a magical death context when the killing action is magical', () =>
    {
      const engine = new JABS_Engine();
      engine.preExecuteSkillEffects = vi.fn();
      engine.postExecuteSkillEffects = vi.fn();
      const gameAction = {
        apply: vi.fn(), getApplicableElements: () => [], isPhysical: () => false, isMagical: () => true,
        item: () => ({ stypeId: 3 }),
      };
      const targetBattler = { result: () => buildResult(), isDead: () => true, setDeathContext: vi.fn() };
      const target = buildTarget({ getBattler: () => targetBattler });
      const action = buildAction({ getAction: () => gameAction });

      engine.executeSkillEffects(action, target);

      expect(targetBattler.setDeathContext).toHaveBeenCalledWith(expect.objectContaining({ hitType: 'magical' }));
    });

    it('snapshots a certain-hit death context when the killing action is neither physical nor magical', () =>
    {
      const engine = new JABS_Engine();
      engine.preExecuteSkillEffects = vi.fn();
      engine.postExecuteSkillEffects = vi.fn();
      const gameAction = {
        apply: vi.fn(), getApplicableElements: () => [], isPhysical: () => false, isMagical: () => false,
        item: () => ({ stypeId: 3 }),
      };
      const targetBattler = { result: () => buildResult(), isDead: () => true, setDeathContext: vi.fn() };
      const target = buildTarget({ getBattler: () => targetBattler });
      const action = buildAction({ getAction: () => gameAction });

      engine.executeSkillEffects(action, target);

      expect(targetBattler.setDeathContext).toHaveBeenCalledWith(expect.objectContaining({ hitType: 'certain' }));
    });
  });

  describe('preExecuteSkillEffects', () =>
  {
    it('is a no-op', () =>
    {
      const engine = new JABS_Engine();
      expect(() => engine.preExecuteSkillEffects('action', 'target')).not.toThrow();
    });
  });

  describe('postExecuteSkillEffects', () =>
  {
    it('applies aggro effects unconditionally', () =>
    {
      const engine = new JABS_Engine();
      engine.applyAggroEffects = vi.fn();
      engine.postExecuteSkillEffects('action', 'target');
      expect(engine.applyAggroEffects).toHaveBeenCalledWith('action', 'target');
    });
  });
  //endregion battle effects

  //region aggro & on-hit effects
  describe('applyAggroEffects', () =>
  {
    function buildAttacker(overrides = {})
    {
      return Object.assign({
        getTeam: () => 'attacker-team',
        getUuid: () => 'attacker-uuid',
        getBattler: () => ({ states: () => [], tgr: 1 }),
        isPlayer: () => false,
        addUpdateAggro: vi.fn(),
      }, overrides);
    }

    function buildAggroResult(overrides = {})
    {
      return Object.assign({
        hpDamage: 0, mpDamage: 0, tpDamage: 0, drain: false, parried: false,
      }, overrides);
    }

    function buildTarget(result, overrides = {})
    {
      return Object.assign({
        getTeam: () => 'target-team',
        getUuid: () => 'target-uuid',
        getBattler: () => ({ result: () => result, states: () => [] }),
        addUpdateAggro: vi.fn(),
      }, overrides);
    }

    function buildAction(attacker, overrides = {})
    {
      return Object.assign({
        getCaster: () => attacker,
        bonusAggro: () => 0,
        aggroMultiplier: () => 1,
        aggroPercent: () => 0,
        notMyAggro: () => 0,
        notMyAggroPercent: () => 0,
      }, overrides);
    }

    it('does not apply any aggro when the attacker and target are on friendly teams', async () =>
    {
      const { default: JABS_TeamRules } = await import('../../../../../src/plugins/abs/core/managers/JABS_TeamRules.js');
      JABS_TeamRules.isFriendly = vi.fn(() => true);
      const engine = new JABS_Engine();
      const attacker = buildAttacker();
      const target = buildTarget(buildAggroResult());
      const action = buildAction(attacker);

      engine.applyAggroEffects(action, target);

      expect(target.addUpdateAggro).not.toHaveBeenCalled();
      JABS_TeamRules.isFriendly = vi.fn(() => false);
    });

    it('applies the base aggro alone when nothing else contributes', () =>
    {
      const engine = new JABS_Engine();
      const attacker = buildAttacker();
      const target = buildTarget(buildAggroResult());
      const action = buildAction(attacker);

      engine.applyAggroEffects(action, target);

      expect(target.addUpdateAggro).toHaveBeenCalledWith('attacker-uuid', 5);
    });

    it('adds hp-damage aggro on top of the base', () =>
    {
      const engine = new JABS_Engine();
      const attacker = buildAttacker();
      const target = buildTarget(buildAggroResult({ hpDamage: 10 }));
      const action = buildAction(attacker);

      engine.applyAggroEffects(action, target);

      expect(target.addUpdateAggro).toHaveBeenCalledWith('attacker-uuid', 15);
    });

    it.each([
      [ 'hp', 'hpDamage' ],
      [ 'mp', 'mpDamage' ],
      [ 'tp', 'tpDamage' ],
    ])('ignores restored %s rather than letting it subtract aggro', (_label, field) =>
    {
      // Arrange: healing is negative damage in this engine, so each of these guards is what keeps
      // a restorative hit from running the aggro arithmetic backwards. Every fixture here leaves
      // the damage fields at zero or sets them positive, and zero times a rate is zero either way
      // - so the guards could all be dropped and the totals would not move. A negative value is
      // the only input that tells them apart, and without them a healer topping up an enemy would
      // quietly make that enemy care about them less.
      const engine = new JABS_Engine();
      const attacker = buildAttacker();
      const target = buildTarget(buildAggroResult({ [ field ]: -10 }));
      const action = buildAction(attacker);

      // Act
      engine.applyAggroEffects(action, target);

      // Assert
      expect(target.addUpdateAggro).toHaveBeenCalledWith('attacker-uuid', 5);
    });

    it('adds mp-damage aggro on top of the base', () =>
    {
      const engine = new JABS_Engine();
      const attacker = buildAttacker();
      const target = buildTarget(buildAggroResult({ mpDamage: 10 }));
      const action = buildAction(attacker);

      engine.applyAggroEffects(action, target);

      expect(target.addUpdateAggro).toHaveBeenCalledWith('attacker-uuid', 25);
    });

    it('adds tp-damage aggro on top of the base', () =>
    {
      const engine = new JABS_Engine();
      const attacker = buildAttacker();
      const target = buildTarget(buildAggroResult({ tpDamage: 3 }));
      const action = buildAction(attacker);

      engine.applyAggroEffects(action, target);

      expect(target.addUpdateAggro).toHaveBeenCalledWith('attacker-uuid', 35);
    });

    it('adds bonus drain aggro on top of the hp-damage aggro when the hit drained hp', () =>
    {
      const engine = new JABS_Engine();
      const attacker = buildAttacker();
      const target = buildTarget(buildAggroResult({ hpDamage: 10, drain: true }));
      const action = buildAction(attacker);

      engine.applyAggroEffects(action, target);

      // base(5) + hp(10) + drain(10 * 3) = 45.
      expect(target.addUpdateAggro).toHaveBeenCalledWith('attacker-uuid', 45);
    });

    it('reduces the target\'s aggro on a parry while flipping aggro onto the attacker instead', () =>
    {
      const engine = new JABS_Engine();
      const attacker = buildAttacker();
      const target = buildTarget(buildAggroResult({ parried: true }));
      const action = buildAction(attacker);

      engine.applyAggroEffects(action, target);

      // base(5) + parryFlat(-50) = -45.
      expect(target.addUpdateAggro).toHaveBeenCalledWith('attacker-uuid', -45);
      expect(attacker.addUpdateAggro).toHaveBeenCalledWith('target-uuid', 25);
    });

    it('applies the skill\'s bonus aggro before the skill\'s aggro multiplier', () =>
    {
      const engine = new JABS_Engine();
      const attacker = buildAttacker();
      const target = buildTarget(buildAggroResult());
      const action = buildAction(attacker, { bonusAggro: () => 10, aggroMultiplier: () => 2 });

      engine.applyAggroEffects(action, target);

      // (base(5) + bonus(10)) * multiplier(2) = 30.
      expect(target.addUpdateAggro).toHaveBeenCalledWith('attacker-uuid', 30);
    });

    it('amplifies outgoing aggro for each attacker state with a non-negative jabsAggroOutAmp', () =>
    {
      const engine = new JABS_Engine();
      const attacker = buildAttacker({
        getBattler: () => ({
          states: () => [ { jabsAggroOutAmp: 2 }, { jabsAggroOutAmp: -1 } ],
          tgr: 1,
        }),
      });
      const target = buildTarget(buildAggroResult());
      const action = buildAction(attacker);

      engine.applyAggroEffects(action, target);

      // base(5) * outAmp(2) only- the negative-tagged state is ignored.
      expect(target.addUpdateAggro).toHaveBeenCalledWith('attacker-uuid', 10);
    });

    it('reduces incoming aggro for a target state with a non-negative jabsAggroInAmp', () =>
    {
      const engine = new JABS_Engine();
      const attacker = buildAttacker();
      const target = buildTarget(buildAggroResult(), {
        getBattler: () => ({ result: () => buildAggroResult(), states: () => [ { jabsAggroInAmp: 0.5 } ] }),
      });
      const action = buildAction(attacker);

      engine.applyAggroEffects(action, target);

      expect(target.addUpdateAggro).toHaveBeenCalledWith('attacker-uuid', 2.5);
    });

    it('ignores a target state with a negative jabsAggroInAmp', () =>
    {
      const engine = new JABS_Engine();
      const attacker = buildAttacker();
      const target = buildTarget(buildAggroResult(), {
        getBattler: () => ({ result: () => buildAggroResult(), states: () => [ { jabsAggroInAmp: -1 } ] }),
      });
      const action = buildAction(attacker);

      engine.applyAggroEffects(action, target);

      expect(target.addUpdateAggro).toHaveBeenCalledWith('attacker-uuid', 5);
    });

    it('multiplies the final aggro by the attacker\'s tgr', () =>
    {
      const engine = new JABS_Engine();
      const attacker = buildAttacker({ getBattler: () => ({ states: () => [], tgr: 2 }) });
      const target = buildTarget(buildAggroResult());
      const action = buildAction(attacker);

      engine.applyAggroEffects(action, target);

      expect(target.addUpdateAggro).toHaveBeenCalledWith('attacker-uuid', 10);
    });

    it('reduces aggro dealt by the player to compensate for their faster attack pace', () =>
    {
      const engine = new JABS_Engine();
      const attacker = buildAttacker({ isPlayer: () => true });
      const target = buildTarget(buildAggroResult());
      const action = buildAction(attacker);

      engine.applyAggroEffects(action, target);

      // base(5) * playerReduction(0.5) = 2.5.
      expect(target.addUpdateAggro).toHaveBeenCalledWith('attacker-uuid', 2.5);
    });

    describe('applyAggroPercentEffect', () =>
    {
      it('does nothing when aggroPercent is 0', () =>
      {
        const engine = new JABS_Engine();
        const attacker = buildAttacker();
        const target = buildTarget(buildAggroResult(), { aggroExists: vi.fn() });
        const action = buildAction(attacker, { aggroPercent: () => 0 });

        engine.applyAggroPercentEffect(action, attacker, target);

        expect(target.aggroExists).not.toHaveBeenCalled();
      });

      it('does nothing when the attacker has no existing aggro entry to scale', () =>
      {
        const engine = new JABS_Engine();
        const attacker = buildAttacker();
        const target = buildTarget(buildAggroResult(), { aggroExists: vi.fn(() => undefined) });
        const action = buildAction(attacker, { aggroPercent: () => 100 });

        expect(() => engine.applyAggroPercentEffect(action, attacker, target)).not.toThrow();
      });

      it('scales the attacker\'s existing aggro entry by (1 + percent/100)', () =>
      {
        const engine = new JABS_Engine();
        const attacker = buildAttacker();
        const ownAggro = { aggro: 1000, modAggro: vi.fn() };
        const target = buildTarget(buildAggroResult(), { aggroExists: vi.fn(() => ownAggro) });
        const action = buildAction(attacker, { aggroPercent: () => 100 });

        engine.applyAggroPercentEffect(action, attacker, target);

        expect(ownAggro.modAggro).toHaveBeenCalledWith(1000);
      });

      it('scales down the attacker\'s existing aggro entry with a negative percent', () =>
      {
        const engine = new JABS_Engine();
        const attacker = buildAttacker();
        const ownAggro = { aggro: 1000, modAggro: vi.fn() };
        const target = buildTarget(buildAggroResult(), { aggroExists: vi.fn(() => ownAggro) });
        const action = buildAction(attacker, { aggroPercent: () => -50 });

        engine.applyAggroPercentEffect(action, attacker, target);

        expect(ownAggro.modAggro).toHaveBeenCalledWith(-500);
      });
    });

    describe('applyNotMyAggroEffects', () =>
    {
      it('does nothing when both notMyAggro and notMyAggroPercent are 0', () =>
      {
        const engine = new JABS_Engine();
        const attacker = buildAttacker();
        const target = buildTarget(buildAggroResult(), { getAllAggros: vi.fn() });
        const action = buildAction(attacker);

        engine.applyNotMyAggroEffects(action, attacker, target);

        expect(target.getAllAggros).not.toHaveBeenCalled();
      });

      it('skips the attacker\'s own aggro entry', async () =>
      {
        const { default: JABS_AiManager } = await import('../../../../../src/plugins/abs/core/managers/JABS_AiManager.js');
        const engine = new JABS_Engine();
        const attacker = buildAttacker();
        const ownAggro = { uuid: () => 'attacker-uuid', aggro: 100, modAggro: vi.fn() };
        const target = buildTarget(buildAggroResult(), { getAllAggros: () => [ ownAggro ] });
        const action = buildAction(attacker, { notMyAggro: () => -50 });
        JABS_AiManager.getBattlerByUuid = vi.fn();

        engine.applyNotMyAggroEffects(action, attacker, target);

        expect(JABS_AiManager.getBattlerByUuid).not.toHaveBeenCalled();
        expect(ownAggro.modAggro).not.toHaveBeenCalled();
      });

      it('skips an entry whose battler no longer exists', async () =>
      {
        const { default: JABS_AiManager } = await import('../../../../../src/plugins/abs/core/managers/JABS_AiManager.js');
        const engine = new JABS_Engine();
        const attacker = buildAttacker();
        const otherAggro = { uuid: () => 'stale-uuid', aggro: 100, modAggro: vi.fn() };
        const target = buildTarget(buildAggroResult(), { getAllAggros: () => [ otherAggro ] });
        const action = buildAction(attacker, { notMyAggro: () => -50 });
        JABS_AiManager.getBattlerByUuid = vi.fn(() => undefined);

        engine.applyNotMyAggroEffects(action, attacker, target);

        expect(otherAggro.modAggro).not.toHaveBeenCalled();
      });

      it('skips an entry belonging to a non-friendly team', async () =>
      {
        const { default: JABS_AiManager } = await import('../../../../../src/plugins/abs/core/managers/JABS_AiManager.js');
        const { default: JABS_TeamRules } = await import('../../../../../src/plugins/abs/core/managers/JABS_TeamRules.js');
        const engine = new JABS_Engine();
        const attacker = buildAttacker();
        const otherAggro = { uuid: () => 'other-uuid', aggro: 100, modAggro: vi.fn() };
        const target = buildTarget(buildAggroResult(), { getAllAggros: () => [ otherAggro ] });
        const action = buildAction(attacker, { notMyAggro: () => -50 });
        JABS_AiManager.getBattlerByUuid = vi.fn(() => ({ getTeam: () => 'other-team' }));
        JABS_TeamRules.isFriendly = vi.fn(() => false);

        engine.applyNotMyAggroEffects(action, attacker, target);

        expect(otherAggro.modAggro).not.toHaveBeenCalled();
        JABS_TeamRules.isFriendly = vi.fn(() => false);
      });

      it('applies the flat adjustment to a same-team other entry', async () =>
      {
        const { default: JABS_AiManager } = await import('../../../../../src/plugins/abs/core/managers/JABS_AiManager.js');
        const { default: JABS_TeamRules } = await import('../../../../../src/plugins/abs/core/managers/JABS_TeamRules.js');
        const engine = new JABS_Engine();
        const attacker = buildAttacker();
        const otherAggro = { uuid: () => 'other-uuid', aggro: 100, modAggro: vi.fn() };
        const target = buildTarget(buildAggroResult(), { getAllAggros: () => [ otherAggro ] });
        const action = buildAction(attacker, { notMyAggro: () => -50 });
        JABS_AiManager.getBattlerByUuid = vi.fn(() => ({ getTeam: () => 'attacker-team' }));
        JABS_TeamRules.isFriendly = vi.fn(() => true);

        engine.applyNotMyAggroEffects(action, attacker, target);

        expect(otherAggro.modAggro).toHaveBeenCalledWith(-50);
        JABS_TeamRules.isFriendly = vi.fn(() => false);
      });

      it('applies the percent adjustment off the entry\'s current value, after any flat adjustment', async () =>
      {
        const { default: JABS_AiManager } = await import('../../../../../src/plugins/abs/core/managers/JABS_AiManager.js');
        const { default: JABS_TeamRules } = await import('../../../../../src/plugins/abs/core/managers/JABS_TeamRules.js');
        const engine = new JABS_Engine();
        const attacker = buildAttacker();
        // modAggro mutates .aggro in place, same as the real JABS_Aggro#modAggro.
        const otherAggro = {
          uuid: () => 'other-uuid',
          aggro: 100,
          modAggro: vi.fn(function(delta)
          {
            this.aggro += delta;
          }),
        };
        const target = buildTarget(buildAggroResult(), { getAllAggros: () => [ otherAggro ] });
        const action = buildAction(attacker, { notMyAggro: () => -50, notMyAggroPercent: () => -50 });
        JABS_AiManager.getBattlerByUuid = vi.fn(() => ({ getTeam: () => 'attacker-team' }));
        JABS_TeamRules.isFriendly = vi.fn(() => true);

        engine.applyNotMyAggroEffects(action, attacker, target);

        // flat: 100 - 50 = 50. percent: 50 * (-50/100) = -25. total delta calls: -50, then -25.
        expect(otherAggro.modAggro).toHaveBeenNthCalledWith(1, -50);
        expect(otherAggro.modAggro).toHaveBeenNthCalledWith(2, -25);
        JABS_TeamRules.isFriendly = vi.fn(() => false);
      });

      it('skips the flat adjustment entirely when notMyAggro is 0, applying only the percent', async () =>
      {
        const { default: JABS_AiManager } = await import('../../../../../src/plugins/abs/core/managers/JABS_AiManager.js');
        const { default: JABS_TeamRules } = await import('../../../../../src/plugins/abs/core/managers/JABS_TeamRules.js');
        const engine = new JABS_Engine();
        const attacker = buildAttacker();
        const otherAggro = { uuid: () => 'other-uuid', aggro: 100, modAggro: vi.fn() };
        const target = buildTarget(buildAggroResult(), { getAllAggros: () => [ otherAggro ] });
        const action = buildAction(attacker, { notMyAggro: () => 0, notMyAggroPercent: () => -50 });
        JABS_AiManager.getBattlerByUuid = vi.fn(() => ({ getTeam: () => 'attacker-team' }));
        JABS_TeamRules.isFriendly = vi.fn(() => true);

        engine.applyNotMyAggroEffects(action, attacker, target);

        expect(otherAggro.modAggro).toHaveBeenCalledTimes(1);
        expect(otherAggro.modAggro).toHaveBeenCalledWith(-50);
        JABS_TeamRules.isFriendly = vi.fn(() => false);
      });
    });
  });

  describe('applyOnHitEffects', () =>
  {
    function buildTarget(result)
    {
      return { getBattler: () => ({ result: () => result }) };
    }

    it('does not process on-hit effects when the result is neither a hit nor a parry', () =>
    {
      const engine = new JABS_Engine();
      engine.processOnHitEffects = vi.fn();
      const target = buildTarget({ isHit: () => false, parried: false });

      engine.applyOnHitEffects('action', target);

      expect(engine.processOnHitEffects).not.toHaveBeenCalled();
    });

    it('processes on-hit effects when the result is a hit', () =>
    {
      const engine = new JABS_Engine();
      engine.processOnHitEffects = vi.fn();
      const target = buildTarget({ isHit: () => true, parried: false });

      engine.applyOnHitEffects('action', target);

      expect(engine.processOnHitEffects).toHaveBeenCalledWith('action', target);
    });

    it('processes on-hit effects when the result was parried', () =>
    {
      const engine = new JABS_Engine();
      engine.processOnHitEffects = vi.fn();
      const target = buildTarget({ isHit: () => false, parried: true });

      engine.applyOnHitEffects('action', target);

      expect(engine.processOnHitEffects).toHaveBeenCalledWith('action', target);
    });
  });

  describe('processOnHitEffects', () =>
  {
    function buildEngine(overrides = {})
    {
      const engine = new JABS_Engine();
      engine.getAnimationId = vi.fn(() => 999);
      engine.checkComboSequence = vi.fn();
      engine.checkKnockback = vi.fn();
      engine.checkInterrupt = vi.fn();
      engine.triggerAlert = vi.fn();
      return Object.assign(engine, overrides);
    }

    function buildCaster(overrides = {})
    {
      return Object.assign({
        getTeam: () => 'caster-team',
        setBattlerLastHit: vi.fn(),
        enterCombat: vi.fn(),
      }, overrides);
    }

    function buildTarget(result, overrides = {})
    {
      return Object.assign({
        getTeam: () => 'target-team',
        getCharacter: () => ({ requestAnimation: vi.fn() }),
        getBattler: () => ({ result: () => result }),
        isInanimate: () => false,
        enterCombat: vi.fn(),
      }, overrides);
    }

    function buildAction(caster, overrides = {})
    {
      return Object.assign({
        getCaster: () => caster,
        getBaseSkill: () => ({}),
        hasSelfAnimationId: () => false,
        performSelfAnimation: vi.fn(),
        isHealing: () => false,
      }, overrides);
    }

    it('requests the skill\'s animation on the target when the hit was not parried', () =>
    {
      const engine = buildEngine();
      const caster = buildCaster();
      const targetCharacter = { requestAnimation: vi.fn() };
      const target = buildTarget({ isHit: () => true, parried: false }, { getCharacter: () => targetCharacter });
      const action = buildAction(caster);

      engine.processOnHitEffects(action, target);

      expect(targetCharacter.requestAnimation).toHaveBeenCalledWith(999);
    });

    it('requests the parry-flash animation instead of the skill\'s animation when parried', () =>
    {
      const engine = buildEngine();
      const caster = buildCaster();
      const targetCharacter = { requestAnimation: vi.fn() };
      const target = buildTarget({ isHit: () => false, parried: true }, { getCharacter: () => targetCharacter });
      const action = buildAction(caster);

      engine.processOnHitEffects(action, target);

      expect(targetCharacter.requestAnimation).toHaveBeenCalledWith(122);
    });

    it('performs the self-animation when the skill has one', () =>
    {
      const engine = buildEngine();
      const caster = buildCaster();
      const target = buildTarget({ isHit: () => true, parried: false });
      const action = buildAction(caster, { hasSelfAnimationId: () => true });

      engine.processOnHitEffects(action, target);

      expect(action.performSelfAnimation).toHaveBeenCalledTimes(1);
    });

    it('does not perform a self-animation when the skill has none', () =>
    {
      const engine = buildEngine();
      const caster = buildCaster();
      const target = buildTarget({ isHit: () => true, parried: false });
      const action = buildAction(caster, { hasSelfAnimationId: () => false });

      engine.processOnHitEffects(action, target);

      expect(action.performSelfAnimation).not.toHaveBeenCalled();
    });

    it('checks the combo sequence when the skill is not a free-combo skill', () =>
    {
      const engine = buildEngine();
      const caster = buildCaster();
      const target = buildTarget({ isHit: () => true, parried: false });
      const action = buildAction(caster, { getBaseSkill: () => ({ jabsFreeCombo: false }) });

      engine.processOnHitEffects(action, target);

      expect(engine.checkComboSequence).toHaveBeenCalledWith(caster, action);
    });

    it('skips the combo sequence check when the skill already free-combos', () =>
    {
      const engine = buildEngine();
      const caster = buildCaster();
      const target = buildTarget({ isHit: () => true, parried: false });
      const action = buildAction(caster, { getBaseSkill: () => ({ jabsFreeCombo: true }) });

      engine.processOnHitEffects(action, target);

      expect(engine.checkComboSequence).not.toHaveBeenCalled();
    });

    it('always delegates to checkKnockback, checkInterrupt, and triggerAlert', () =>
    {
      const engine = buildEngine();
      const caster = buildCaster();
      const target = buildTarget({ isHit: () => true, parried: false });
      const action = buildAction(caster);

      engine.processOnHitEffects(action, target);

      expect(engine.checkKnockback).toHaveBeenCalledWith(action, target);
      expect(engine.checkInterrupt).toHaveBeenCalledWith(action, target);
      expect(engine.triggerAlert).toHaveBeenCalledWith(caster, target);
    });

    it('does not mark last-hit or enter combat when the caster and target are not opposed', async () =>
    {
      const { default: JABS_TeamRules } = await import('../../../../../src/plugins/abs/core/managers/JABS_TeamRules.js');
      JABS_TeamRules.isOpposed = vi.fn(() => false);
      const engine = buildEngine();
      const caster = buildCaster();
      const target = buildTarget({ isHit: () => true, parried: false });
      const action = buildAction(caster);

      engine.processOnHitEffects(action, target);

      expect(caster.setBattlerLastHit).not.toHaveBeenCalled();
      JABS_TeamRules.isOpposed = vi.fn(() => true);
    });

    it('marks the target as the caster\'s last hit when opposed', () =>
    {
      const engine = buildEngine();
      const caster = buildCaster();
      const target = buildTarget({ isHit: () => true, parried: false });
      const action = buildAction(caster);

      engine.processOnHitEffects(action, target);

      expect(caster.setBattlerLastHit).toHaveBeenCalledWith(target);
    });

    it('enters both battlers into combat on a real, non-healing hit against an animate target', () =>
    {
      const engine = buildEngine();
      const caster = buildCaster();
      const target = buildTarget({ isHit: () => true, parried: false });
      const action = buildAction(caster, { isHealing: () => false });

      engine.processOnHitEffects(action, target);

      expect(caster.enterCombat).toHaveBeenCalledTimes(1);
      expect(target.enterCombat).toHaveBeenCalledTimes(1);
    });

    it('does not enter combat when the action was a healing action', () =>
    {
      const engine = buildEngine();
      const caster = buildCaster();
      const target = buildTarget({ isHit: () => true, parried: false });
      const action = buildAction(caster, { isHealing: () => true });

      engine.processOnHitEffects(action, target);

      expect(caster.enterCombat).not.toHaveBeenCalled();
      expect(target.enterCombat).not.toHaveBeenCalled();
    });

    it('does not enter combat when the target is inanimate', () =>
    {
      const engine = buildEngine();
      const caster = buildCaster();
      const target = buildTarget({ isHit: () => true, parried: false }, { isInanimate: () => true });
      const action = buildAction(caster);

      engine.processOnHitEffects(action, target);

      expect(caster.enterCombat).not.toHaveBeenCalled();
      expect(target.enterCombat).not.toHaveBeenCalled();
    });

    it('does not enter combat when the result was neither a hit nor a parry', () =>
    {
      // Arrange- healing, inanimate targets and unopposed teams each independently suppress
      // the combat entry below, so all three are set to their permissive values here and the
      // hit/parry pair is the only remaining reason nothing happens.
      const engine = buildEngine();
      const caster = buildCaster();
      const target = buildTarget({ isHit: () => false, parried: false }, { isInanimate: () => false });
      const action = buildAction(caster, { isHealing: () => false });

      // Act
      engine.processOnHitEffects(action, target);

      // Assert- last-hit marking sits outside the combat gate, so it proves the method reached
      // the opposed-team block rather than bailing out somewhere earlier.
      expect(caster.setBattlerLastHit).toHaveBeenCalledWith(target);
      expect(caster.enterCombat).not.toHaveBeenCalled();
      expect(target.enterCombat).not.toHaveBeenCalled();
    });
  });

  describe('canBeKnockedBack', () =>
  {
    it('is false while the target is already jumping', () =>
    {
      const engine = new JABS_Engine();
      const target = { getCharacter: () => ({ isJumping: () => true }), getBattler: () => ({ result: () => ({ parried: false }) }) };

      expect(engine.canBeKnockedBack('action', target)).toBe(false);
    });

    it('is false when the hit was parried', () =>
    {
      const engine = new JABS_Engine();
      const target = { getCharacter: () => ({ isJumping: () => false }), getBattler: () => ({ result: () => ({ parried: true }) }) };

      expect(engine.canBeKnockedBack('action', target)).toBe(false);
    });

    it('is true otherwise', () =>
    {
      const engine = new JABS_Engine();
      const target = { getCharacter: () => ({ isJumping: () => false }), getBattler: () => ({ result: () => ({ parried: false }) }) };

      expect(engine.canBeKnockedBack('action', target)).toBe(true);
    });
  });

  describe('getProximityKnockbackBonusPct', () =>
  {
    function buildCaster(notes)
    {
      return { getBattler: () => ({ getAllNotes: () => notes }) };
    }

    it('returns 0 when the caster has no proximity-knockback tags at all', () =>
    {
      const engine = new JABS_Engine();
      globalThis.RPGManager.getArraysFromNotesByRegex.mockReturnValue([]);
      const caster = buildCaster([ { note: '' } ]);

      expect(engine.getProximityKnockbackBonusPct(caster)).toBe(0);
    });

    it('sums each tag\'s percent scaled by however many opposing battlers are within its radius', async () =>
    {
      const { default: JABS_AiManager } = await import('../../../../../src/plugins/abs/core/managers/JABS_AiManager.js');
      JABS_AiManager.getOpposingBattlersWithinRange = vi.fn()
        .mockReturnValueOnce([ 'enemy1', 'enemy2' ])
        .mockReturnValueOnce([ 'enemy1' ]);
      globalThis.RPGManager.getArraysFromNotesByRegex.mockReturnValue([ [ 3, 10 ], [ 5, 20 ] ]);
      const engine = new JABS_Engine();
      const caster = buildCaster([ { note: '<proximityKnockback>' } ]);

      const result = engine.getProximityKnockbackBonusPct(caster);

      // (10 * 2) + (20 * 1) = 40.
      expect(result).toBe(40);
    });
  });

  describe('getFlatKnockbackAmpPct', () =>
  {
    it('sums the caster\'s knockbackAmp note tags', () =>
    {
      const engine = new JABS_Engine();
      const caster = { getBattler: () => ({ getAllNotes: () => 'notes' }) };
      globalThis.RPGManager.getSumFromAllNotesByRegex.mockReturnValue(15);

      expect(engine.getFlatKnockbackAmpPct(caster)).toBe(15);
    });

    it('defaults to 0 when untagged', () =>
    {
      const engine = new JABS_Engine();
      const caster = { getBattler: () => ({ getAllNotes: () => 'notes' }) };
      globalThis.RPGManager.getSumFromAllNotesByRegex.mockReturnValue(null);

      expect(engine.getFlatKnockbackAmpPct(caster)).toBe(0);
    });
  });

  describe('getThisKnockbackAmpPct', () =>
  {
    it('reads the thisKnockbackAmp tag from the base skill', () =>
    {
      const engine = new JABS_Engine();
      const skill = {};
      const action = { getBaseSkill: () => skill };
      globalThis.RPGManager.getNumberFromNoteByRegex.mockReturnValue(25);

      expect(engine.getThisKnockbackAmpPct(action)).toBe(25);
    });

    it('defaults to 0 when untagged', () =>
    {
      const engine = new JABS_Engine();
      const action = { getBaseSkill: () => ({}) };
      globalThis.RPGManager.getNumberFromNoteByRegex.mockReturnValue(null);

      expect(engine.getThisKnockbackAmpPct(action)).toBe(0);
    });
  });

  describe('getKnockbackAmplificationPct', () =>
  {
    it('sums the flat, this-skill, and proximity knockback bonuses', () =>
    {
      const engine = new JABS_Engine();
      engine.getFlatKnockbackAmpPct = vi.fn(() => 10);
      engine.getThisKnockbackAmpPct = vi.fn(() => 20);
      engine.getProximityKnockbackBonusPct = vi.fn(() => 30);
      const caster = {};
      const action = {};

      expect(engine.getKnockbackAmplificationPct(caster, action)).toBe(60);
      expect(engine.getFlatKnockbackAmpPct).toHaveBeenCalledWith(caster);
      expect(engine.getThisKnockbackAmpPct).toHaveBeenCalledWith(action);
      expect(engine.getProximityKnockbackBonusPct).toHaveBeenCalledWith(caster);
    });
  });

  describe('checkKnockback', () =>
  {
    function buildEngine(overrides = {})
    {
      const engine = new JABS_Engine();
      engine.canBeKnockedBack = vi.fn(() => true);
      engine.getKnockbackAmplificationPct = vi.fn(() => 0);
      return Object.assign(engine, overrides);
    }

    function buildTargetSprite(overrides = {})
    {
      return Object.assign({
        jump: vi.fn(),
        walkInDirectionClamped: vi.fn(() => [ 0, 0 ]),
      }, overrides);
    }

    function buildTarget(targetSprite, overrides = {})
    {
      return Object.assign({
        getBattler: () => ({ getAllNotes: () => [] }),
        getCharacter: () => targetSprite,
      }, overrides);
    }

    function buildAction(overrides = {})
    {
      return Object.assign({
        isHealing: () => false,
        getKnockback: () => 3,
        getCaster: () => ({}),
        isDirectAction: () => false,
        getActionSprite: () => ({ direction: () => J.ABS.Directions.DOWN }),
        getBaseSkill: () => ({ jabsIgnoreTerrain: false }),
      }, overrides);
    }

    it('does not process knockback when the target cannot be knocked back', () =>
    {
      const engine = buildEngine({ canBeKnockedBack: vi.fn(() => false) });
      const targetSprite = buildTargetSprite();
      const target = buildTarget(targetSprite);
      const action = buildAction();

      engine.checkKnockback(action, target);

      expect(targetSprite.jump).not.toHaveBeenCalled();
    });

    it('does not process knockback for a healing action', () =>
    {
      const engine = buildEngine();
      const targetSprite = buildTargetSprite();
      const target = buildTarget(targetSprite);
      const action = buildAction({ isHealing: () => true });

      engine.checkKnockback(action, target);

      expect(targetSprite.jump).not.toHaveBeenCalled();
    });

    it('does not process knockback when the target has full (100%+) knockback resist', () =>
    {
      globalThis.RPGManager.getSumFromAllNotesByRegex.mockReturnValue(100);
      const engine = buildEngine();
      const targetSprite = buildTargetSprite();
      const target = buildTarget(targetSprite);
      const action = buildAction();

      engine.checkKnockback(action, target);

      expect(targetSprite.jump).not.toHaveBeenCalled();
    });

    it('does not process knockback when the skill has no knockback value', () =>
    {
      const engine = buildEngine();
      const targetSprite = buildTargetSprite();
      const target = buildTarget(targetSprite);
      const action = buildAction({ getKnockback: () => null });

      engine.checkKnockback(action, target);

      expect(targetSprite.jump).not.toHaveBeenCalled();
    });

    it('hops the target in place when the computed knockback is 0', () =>
    {
      // Arrange- a non-direct action, so the hop is attributable to the zero distance alone.
      const engine = buildEngine();
      const targetSprite = buildTargetSprite();
      const target = buildTarget(targetSprite);
      const action = buildAction({ getKnockback: () => 0, isDirectAction: () => false });

      // Act
      engine.checkKnockback(action, target);

      // Assert- the walk path also ends in jump(0, 0) when the distance is zero, so the jump
      // alone cannot tell the hop-in-place shortcut from a full displacement walk that simply
      // had nowhere to go. skipping the walk entirely is what actually distinguishes them.
      expect(targetSprite.jump).toHaveBeenCalledWith(0, 0);
      expect(targetSprite.walkInDirectionClamped).not.toHaveBeenCalled();
    });

    it('hops the target in place for a direct action regardless of knockback value', () =>
    {
      const engine = buildEngine();
      const targetSprite = buildTargetSprite();
      const target = buildTarget(targetSprite);
      const action = buildAction({ isDirectAction: () => true });

      engine.checkKnockback(action, target);

      expect(targetSprite.jump).toHaveBeenCalledWith(0, 0);
    });

    it('reduces the effective knockback distance by the target\'s resist percentage', () =>
    {
      globalThis.RPGManager.getSumFromAllNotesByRegex.mockReturnValue(50);
      const engine = buildEngine();
      const targetSprite = buildTargetSprite();
      const target = buildTarget(targetSprite);
      const action = buildAction({ getKnockback: () => 10, getBaseSkill: () => ({ jabsIgnoreTerrain: true }) });

      engine.checkKnockback(action, target);

      // knockback(10) * (100 - resist(50)) / 100 = 5, direction DOWN means yPlus += ceil(5).
      expect(targetSprite.jump).toHaveBeenCalledWith(0, 5);
    });

    it('amplifies the knockback distance by the combined amplification percent', () =>
    {
      const engine = buildEngine({ getKnockbackAmplificationPct: vi.fn(() => 100) });
      const targetSprite = buildTargetSprite();
      const target = buildTarget(targetSprite);
      const action = buildAction({ getKnockback: () => 5, getBaseSkill: () => ({ jabsIgnoreTerrain: true }) });

      engine.checkKnockback(action, target);

      // knockback(5) * (1 + 100/100) = 10, direction DOWN means yPlus += ceil(10).
      expect(targetSprite.jump).toHaveBeenCalledWith(0, 10);
    });

    it('jumps straight to the computed destination for a skill tagged to ignore terrain', () =>
    {
      const engine = buildEngine();
      const targetSprite = buildTargetSprite();
      const target = buildTarget(targetSprite);
      const action = buildAction({ getKnockback: () => 4, getBaseSkill: () => ({ jabsIgnoreTerrain: true }) });

      engine.checkKnockback(action, target);

      expect(targetSprite.jump).toHaveBeenCalledWith(0, 4);
      expect(targetSprite.walkInDirectionClamped).not.toHaveBeenCalled();
    });

    it('computes a negative y offset for an UP-facing knockback', () =>
    {
      const engine = buildEngine();
      const targetSprite = buildTargetSprite();
      const target = buildTarget(targetSprite);
      const action = buildAction({
        getKnockback: () => 4,
        getBaseSkill: () => ({ jabsIgnoreTerrain: true }),
        getActionSprite: () => ({ direction: () => J.ABS.Directions.UP }),
      });

      engine.checkKnockback(action, target);

      expect(targetSprite.jump).toHaveBeenCalledWith(0, -4);
    });

    it('computes a negative x offset for a LEFT-facing knockback', () =>
    {
      const engine = buildEngine();
      const targetSprite = buildTargetSprite();
      const target = buildTarget(targetSprite);
      const action = buildAction({
        getKnockback: () => 4,
        getBaseSkill: () => ({ jabsIgnoreTerrain: true }),
        getActionSprite: () => ({ direction: () => J.ABS.Directions.LEFT }),
      });

      engine.checkKnockback(action, target);

      expect(targetSprite.jump).toHaveBeenCalledWith(-4, 0);
    });

    it('computes a positive x offset for a RIGHT-facing knockback', () =>
    {
      const engine = buildEngine();
      const targetSprite = buildTargetSprite();
      const target = buildTarget(targetSprite);
      const action = buildAction({
        getKnockback: () => 4,
        getBaseSkill: () => ({ jabsIgnoreTerrain: true }),
        getActionSprite: () => ({ direction: () => J.ABS.Directions.RIGHT }),
      });

      engine.checkKnockback(action, target);

      expect(targetSprite.jump).toHaveBeenCalledWith(4, 0);
    });

    it('walks tile-by-tile toward the destination, stopping at the last passable tile, for a terrain-respecting skill', () =>
    {
      const engine = buildEngine();
      const targetSprite = buildTargetSprite({ walkInDirectionClamped: vi.fn(() => [ 0, 2 ]) });
      const target = buildTarget(targetSprite);
      const action = buildAction({ getKnockback: () => 4, getBaseSkill: () => ({ jabsIgnoreTerrain: false }) });

      engine.checkKnockback(action, target);

      expect(targetSprite.walkInDirectionClamped).toHaveBeenCalledWith(J.ABS.Directions.DOWN, 4);
      expect(targetSprite.jump).toHaveBeenCalledWith(0, 2);
    });
  });

  describe('checkInterrupt', () =>
  {
    function buildTarget(overrides = {})
    {
      return Object.assign({
        isCastingOrChanneling: () => true,
        getDecidedAction: () => null,
        getBattler: () => ({ isImmuneToInterrupt: () => false }),
        interrupt: vi.fn(),
      }, overrides);
    }

    function buildAction(overrides = {})
    {
      return Object.assign({
        getBaseSkill: () => ({ jabsInterruptMagnifier: 2 }),
      }, overrides);
    }

    it('does nothing when the target is not casting or channeling', () =>
    {
      const engine = new JABS_Engine();
      const target = buildTarget({ isCastingOrChanneling: () => false });
      const action = buildAction();

      engine.checkInterrupt(action, target);

      expect(target.interrupt).not.toHaveBeenCalled();
    });

    it('does nothing when the attacking skill carries no interrupt magnifier', () =>
    {
      const engine = new JABS_Engine();
      const target = buildTarget();
      const action = buildAction({ getBaseSkill: () => ({ jabsInterruptMagnifier: 0 }) });

      engine.checkInterrupt(action, target);

      expect(target.interrupt).not.toHaveBeenCalled();
    });

    it('does nothing when the interrupted skill is itself immune to interruption', () =>
    {
      const engine = new JABS_Engine();
      const target = buildTarget({
        getDecidedAction: () => [ { getBaseSkill: () => ({ jabsThisCannotBeInterrupted: true }) } ],
      });
      const action = buildAction();

      engine.checkInterrupt(action, target);

      expect(target.interrupt).not.toHaveBeenCalled();
    });

    it('does nothing when the target battler is wholly immune to interruption', () =>
    {
      const engine = new JABS_Engine();
      const target = buildTarget({ getBattler: () => ({ isImmuneToInterrupt: () => true }) });
      const action = buildAction();

      engine.checkInterrupt(action, target);

      expect(target.interrupt).not.toHaveBeenCalled();
    });

    it('interrupts the target with the skill\'s magnifier otherwise', () =>
    {
      const engine = new JABS_Engine();
      const target = buildTarget();
      const action = buildAction();

      engine.checkInterrupt(action, target);

      expect(target.interrupt).toHaveBeenCalledWith(2, false);
    });

    it('still interrupts when there is no in-flight decided action to check for skill-specific immunity', () =>
    {
      const engine = new JABS_Engine();
      const target = buildTarget({ getDecidedAction: () => null });
      const action = buildAction();

      engine.checkInterrupt(action, target);

      expect(target.interrupt).toHaveBeenCalledWith(2, false);
    });
  });
  //endregion aggro & on-hit effects

  //region combo sequence
  describe('canUpdateComboSequence', () =>
  {
    it('is false when the skill has no combo follow-up', () =>
    {
      const engine = new JABS_Engine();
      const caster = { getBattler: () => ({ hasSkill: () => true }) };
      const action = { getBaseSkill: () => ({ jabsComboAction: false }) };

      expect(engine.canUpdateComboSequence(caster, action)).toBe(false);
    });

    it('is false when the caster has not learned the combo skill', () =>
    {
      const engine = new JABS_Engine();
      const hasSkill = vi.fn(() => false);
      const caster = { getBattler: () => ({ hasSkill }) };
      const action = { getBaseSkill: () => ({ jabsComboAction: true, jabsComboSkillId: 42 }) };

      expect(engine.canUpdateComboSequence(caster, action)).toBe(false);
      expect(hasSkill).toHaveBeenCalledWith(42);
    });

    it('is true when the skill combos into a follow-up the caster knows', () =>
    {
      const engine = new JABS_Engine();
      const caster = { getBattler: () => ({ hasSkill: () => true }) };
      const action = { getBaseSkill: () => ({ jabsComboAction: true, jabsComboSkillId: 42 }) };

      expect(engine.canUpdateComboSequence(caster, action)).toBe(true);
    });
  });

  describe('updateComboSequence', () =>
  {
    function buildCaster(overrides = {})
    {
      return Object.assign({
        getComboNextActionId: () => 0,
        setPhase: vi.fn(),
        setComboFrames: vi.fn(),
        setComboNextActionId: vi.fn(),
        setComboExpireFrames: vi.fn(),
        setAiComboHumanizedReadyFrame: vi.fn(),
      }, overrides);
    }

    function buildAction(overrides = {})
    {
      return Object.assign({
        getBaseSkill: () => ({ jabsComboSkillId: 42, jabsComboDelay: 10, jabsComboExpire: 60 }),
        getCooldownType: () => 'mainhand',
      }, overrides);
    }

    it('advances the caster to the action phase when combo-ing into a new step', () =>
    {
      const engine = new JABS_Engine();
      const caster = buildCaster({ getComboNextActionId: () => 0 });
      const action = buildAction();

      engine.updateComboSequence(caster, action);

      expect(caster.setPhase).toHaveBeenCalledWith(2);
    });

    it('does not force a phase change when already on the same combo step', () =>
    {
      const engine = new JABS_Engine();
      const caster = buildCaster({ getComboNextActionId: () => 42 });
      const action = buildAction();

      engine.updateComboSequence(caster, action);

      expect(caster.setPhase).not.toHaveBeenCalled();
    });

    it('stores the combo delay, next skill id, and expiry window on the cooldown slot', () =>
    {
      const engine = new JABS_Engine();
      const caster = buildCaster();
      const action = buildAction();

      engine.updateComboSequence(caster, action);

      expect(caster.setComboFrames).toHaveBeenCalledWith('mainhand', 10);
      expect(caster.setComboNextActionId).toHaveBeenCalledWith('mainhand', 42);
      expect(caster.setComboExpireFrames).toHaveBeenCalledWith('mainhand', 60);
    });

    it('arms the humanized ai-combo ready frame using the skill', () =>
    {
      JABS_Engine.computeAiComboHumanizedReadyFrameForSkill = vi.fn(() => 123);
      const engine = new JABS_Engine();
      const caster = buildCaster();
      const action = buildAction();

      engine.updateComboSequence(caster, action);

      expect(caster.setAiComboHumanizedReadyFrame).toHaveBeenCalledWith(123);
    });
  });

  describe('tryClearComboWhenChainCannotAdvance', () =>
  {
    function buildCaster(overrides = {})
    {
      return Object.assign({
        getComboNextActionId: () => 42,
        setComboNextActionId: vi.fn(),
        clearAiComboHumanizedReadyFrame: vi.fn(),
        setComboExpireFrames: vi.fn(),
      }, overrides);
    }

    function buildAction(overrides = {})
    {
      return Object.assign({
        getBaseSkill: () => ({ id: 42 }),
        getCooldownType: () => 'mainhand',
      }, overrides);
    }

    it('leaves the combo slot alone when nothing is pending on it', () =>
    {
      const engine = new JABS_Engine();
      const caster = buildCaster({ getComboNextActionId: () => 0 });
      const action = buildAction();

      engine.tryClearComboWhenChainCannotAdvance(caster, action);

      expect(caster.setComboNextActionId).not.toHaveBeenCalled();
    });

    it('leaves the combo slot alone when the pending id does not match the executed skill', () =>
    {
      const engine = new JABS_Engine();
      const caster = buildCaster({ getComboNextActionId: () => 7 });
      const action = buildAction({ getBaseSkill: () => ({ id: 42 }) });

      engine.tryClearComboWhenChainCannotAdvance(caster, action);

      expect(caster.setComboNextActionId).not.toHaveBeenCalled();
    });

    it('clears the combo slot back to starter routing when the executed skill consumed it', () =>
    {
      const engine = new JABS_Engine();
      const caster = buildCaster({ getComboNextActionId: () => 42 });
      const action = buildAction({ getBaseSkill: () => ({ id: 42 }) });

      engine.tryClearComboWhenChainCannotAdvance(caster, action);

      expect(caster.setComboNextActionId).toHaveBeenCalledWith('mainhand', 0);
      expect(caster.clearAiComboHumanizedReadyFrame).toHaveBeenCalledTimes(1);
      expect(caster.setComboExpireFrames).toHaveBeenCalledWith('mainhand', 0);
    });
  });

  describe('checkComboSequence', () =>
  {
    it('updates the combo sequence when the skill can combo further', () =>
    {
      const engine = new JABS_Engine();
      engine.canUpdateComboSequence = vi.fn(() => true);
      engine.updateComboSequence = vi.fn();
      engine.tryClearComboWhenChainCannotAdvance = vi.fn();

      engine.checkComboSequence('caster', 'action');

      expect(engine.updateComboSequence).toHaveBeenCalledWith('caster', 'action');
      expect(engine.tryClearComboWhenChainCannotAdvance).not.toHaveBeenCalled();
    });

    it('tries to clear the combo slot when the skill cannot combo further', () =>
    {
      const engine = new JABS_Engine();
      engine.canUpdateComboSequence = vi.fn(() => false);
      engine.updateComboSequence = vi.fn();
      engine.tryClearComboWhenChainCannotAdvance = vi.fn();

      engine.checkComboSequence('caster', 'action');

      expect(engine.tryClearComboWhenChainCannotAdvance).toHaveBeenCalledWith('caster', 'action');
      expect(engine.updateComboSequence).not.toHaveBeenCalled();
    });
  });
  //endregion combo sequence

  //region implicit parry / glancing blow / alert
  describe('isParryPossible', () =>
  {
    function buildCaster(overrides = {})
    {
      return Object.assign({
        isFacingTarget: () => true,
        getBattler: () => ({ ignoreAllParry: () => false }),
      }, overrides);
    }

    function buildTarget(overrides = {})
    {
      return Object.assign({
        getCharacter: () => ({}),
        getBattler: () => ({ grd: 10 }),
      }, overrides);
    }

    it('is false when the caster is not facing the target', () =>
    {
      const engine = new JABS_Engine();
      const caster = buildCaster({ isFacingTarget: () => false });
      const target = buildTarget();

      expect(engine.isParryPossible(caster, target)).toBe(false);
    });

    it('is false when the target has no grd to parry with', () =>
    {
      const engine = new JABS_Engine();
      const caster = buildCaster();
      const target = buildTarget({ getBattler: () => ({ grd: 0 }) });

      expect(engine.isParryPossible(caster, target)).toBe(false);
    });

    it('is false when the caster has a state that ignores all parry', () =>
    {
      const engine = new JABS_Engine();
      const caster = buildCaster({ getBattler: () => ({ ignoreAllParry: () => true }) });
      const target = buildTarget();

      expect(engine.isParryPossible(caster, target)).toBe(false);
    });

    it('is true otherwise', () =>
    {
      const engine = new JABS_Engine();
      const caster = buildCaster();
      const target = buildTarget();

      expect(engine.isParryPossible(caster, target)).toBe(true);
    });
  });

  describe('getIgnoreParryPct', () =>
  {
    function buildIgnoreParryCaster()
    {
      return { getBattler: () => ({ getAllNotes: () => [] }) };
    }

    it('sums the caster-wide sources with the skill-scoped one', () =>
    {
      // Arrange
      globalThis.RPGManager.getSumFromAllNotesByRegex.mockReturnValue(30);
      const engine = new JABS_Engine();
      const action = { getBaseSkill: () => ({ jabsIgnoreParry: 25 }) };

      // Act
      const result = engine.getIgnoreParryPct(buildIgnoreParryCaster(), action);

      // Assert
      expect(result).toBe(55);
    });

    it('caps the total at 100 so the guard pressure factor never inverts', () =>
    {
      // Arrange
      globalThis.RPGManager.getSumFromAllNotesByRegex.mockReturnValue(80);
      const engine = new JABS_Engine();
      const action = { getBaseSkill: () => ({ jabsIgnoreParry: 70 }) };

      // Act
      const result = engine.getIgnoreParryPct(buildIgnoreParryCaster(), action);

      // Assert
      expect(result).toBe(100);
    });
  });

  describe('getFlatIgnoreParryPct', () =>
  {
    it('returns the total summed across the caster note sources', () =>
    {
      // Arrange
      globalThis.RPGManager.getSumFromAllNotesByRegex.mockReturnValue(45);
      const engine = new JABS_Engine();
      const notes = [ { note: '<ignoreParry:45>' } ];
      const caster = { getBattler: () => ({ getAllNotes: () => notes }) };

      // Act
      const result = engine.getFlatIgnoreParryPct(caster);

      // Assert
      expect(result).toBe(45);
      expect(globalThis.RPGManager.getSumFromAllNotesByRegex)
        .toHaveBeenCalledWith(notes, J.ABS.RegExp.IgnoreParry);
    });

    it('returns zero when no note source carries the tag', () =>
    {
      // Arrange
      globalThis.RPGManager.getSumFromAllNotesByRegex.mockReturnValue(null);
      const engine = new JABS_Engine();
      const caster = { getBattler: () => ({ getAllNotes: () => [] }) };

      // Act
      const result = engine.getFlatIgnoreParryPct(caster);

      // Assert
      expect(result).toBe(0);
    });
  });

  describe('getThisIgnoreParryPct', () =>
  {
    it('returns the executing skill own tag value', () =>
    {
      // Arrange
      const engine = new JABS_Engine();
      const action = { getBaseSkill: () => ({ jabsIgnoreParry: 40 }) };

      // Act
      const result = engine.getThisIgnoreParryPct(action);

      // Assert
      expect(result).toBe(40);
    });

    it('returns zero when the executing skill has no tag', () =>
    {
      // Arrange
      const engine = new JABS_Engine();
      const action = { getBaseSkill: () => ({ jabsIgnoreParry: null }) };

      // Act
      const result = engine.getThisIgnoreParryPct(action);

      // Assert
      expect(result).toBe(0);
    });
  });

  describe('checkImplicitFullParry', () =>
  {
    function buildTarget(overrides = {})
    {
      const targetBattler = { getPositiveRolls: () => 0 };
      return Object.assign({ getBattler: () => targetBattler }, overrides);
    }

    function buildCaster(overrides = {})
    {
      return Object.assign({
        getBattler: () => ({
          getNegativeRollsForSkill: () => 0,
          getAllNotes: () => [],
        }),
      }, overrides);
    }

    function buildAction(overrides = {})
    {
      return Object.assign({
        getBaseSkill: () => ({ jabsIgnoreParry: 0 }),
      }, overrides);
    }

    it('is false when the parry prerequisites are not met', () =>
    {
      const engine = new JABS_Engine();
      engine.isParryPossible = vi.fn(() => false);

      expect(engine.checkImplicitFullParry(buildCaster(), buildTarget(), buildAction())).toBe(false);
      expect(globalThis.RPGManager.fateOf100).not.toHaveBeenCalled();
    });

    it('rolls the scaled-down full-parry chance when prerequisites are met', () =>
    {
      J.ABS.Metadata.ImplicitParryScaleFactor = 0.5;
      JABS_Engine.implicitParryChancePercent = vi.fn(() => 40);
      globalThis.RPGManager.fateOf100.mockReturnValue(true);
      const engine = new JABS_Engine();
      engine.isParryPossible = vi.fn(() => true);
      const target = buildTarget();
      const caster = buildCaster();
      const action = buildAction();

      const result = engine.checkImplicitFullParry(caster, target, action);

      expect(result).toBe(true);
      // rawChance(40) * scaleFactor(0.5) = 20, rounded.
      expect(globalThis.RPGManager.fateOf100).toHaveBeenCalledWith(target.getBattler(), 20, 1, 0);
    });

    it('defaults ignoreParryPercent to 0 when the skill has no tag', () =>
    {
      JABS_Engine.implicitParryChancePercent = vi.fn(() => 40);
      globalThis.RPGManager.fateOf100.mockReturnValue(true);
      const engine = new JABS_Engine();
      engine.isParryPossible = vi.fn(() => true);
      const target = buildTarget();
      const caster = buildCaster();
      const action = buildAction({ getBaseSkill: () => ({ jabsIgnoreParry: null }) });

      engine.checkImplicitFullParry(caster, target, action);

      expect(JABS_Engine.implicitParryChancePercent).toHaveBeenCalledWith(caster, target, 0);
    });
  });

  describe('checkGlancingBlow', () =>
  {
    function buildTarget(overrides = {})
    {
      const targetBattler = { getPositiveRolls: () => 0 };
      return Object.assign({ getBattler: () => targetBattler }, overrides);
    }

    function buildCaster(overrides = {})
    {
      return Object.assign({
        getBattler: () => ({
          getNegativeRollsForSkill: () => 0,
          getAllNotes: () => [],
        }),
      }, overrides);
    }

    function buildAction(overrides = {})
    {
      return Object.assign({
        getBaseSkill: () => ({ jabsIgnoreParry: 0 }),
      }, overrides);
    }

    it('is false when the parry prerequisites are not met', () =>
    {
      const engine = new JABS_Engine();
      engine.isParryPossible = vi.fn(() => false);

      expect(engine.checkGlancingBlow(buildCaster(), buildTarget(), buildAction())).toBe(false);
      expect(globalThis.RPGManager.fateOf100).not.toHaveBeenCalled();
    });

    it('rolls the glancing-blow chance when prerequisites are met', () =>
    {
      JABS_Engine.glancingBlowChancePercent = vi.fn(() => 30);
      globalThis.RPGManager.fateOf100.mockReturnValue(true);
      const engine = new JABS_Engine();
      engine.isParryPossible = vi.fn(() => true);
      const target = buildTarget();
      const caster = buildCaster();
      const action = buildAction();

      const result = engine.checkGlancingBlow(caster, target, action);

      expect(result).toBe(true);
      expect(globalThis.RPGManager.fateOf100).toHaveBeenCalledWith(target.getBattler(), 30, 1, 0);
    });

    it('defaults ignoreParryPercent to 0 when the skill has no tag', () =>
    {
      JABS_Engine.glancingBlowChancePercent = vi.fn(() => 30);
      globalThis.RPGManager.fateOf100.mockReturnValue(true);
      const engine = new JABS_Engine();
      engine.isParryPossible = vi.fn(() => true);
      const target = buildTarget();
      const caster = buildCaster();
      const action = buildAction({ getBaseSkill: () => ({ jabsIgnoreParry: null }) });

      engine.checkGlancingBlow(caster, target, action);

      expect(JABS_Engine.glancingBlowChancePercent).toHaveBeenCalledWith(caster, target, 0);
    });
  });

  describe('canAttemptImplicitParry', () =>
  {
    it('is false while the target is guarding', () =>
    {
      const engine = new JABS_Engine();
      const target = { guarding: () => true };

      expect(engine.canAttemptImplicitParry(target)).toBe(false);
    });

    it('is false while the target is casting or channeling', () =>
    {
      const engine = new JABS_Engine();
      const target = { guarding: () => false, isCastingOrChanneling: () => true };

      expect(engine.canAttemptImplicitParry(target)).toBe(false);
    });

    it('is false while the target is dashing', () =>
    {
      const engine = new JABS_Engine();
      const target = {
        guarding: () => false,
        isCastingOrChanneling: () => false,
        getCharacter: () => ({ isDashing: () => true }),
      };

      expect(engine.canAttemptImplicitParry(target)).toBe(false);
    });

    it('is true otherwise', () =>
    {
      const engine = new JABS_Engine();
      const target = {
        guarding: () => false,
        isCastingOrChanneling: () => false,
        getCharacter: () => ({ isDashing: () => false }),
      };

      expect(engine.canAttemptImplicitParry(target)).toBe(true);
    });
  });

  describe('canBeAlerted', () =>
  {
    function buildAttacker(overrides = {})
    {
      return Object.assign({ isInanimate: () => false, getTeam: () => 'attacker-team' }, overrides);
    }

    function buildBattler(overrides = {})
    {
      return Object.assign({
        getTeam: () => 'target-team',
        isPlayer: () => false,
        isEngaged: () => false,
        isInanimate: () => false,
      }, overrides);
    }

    it('is false for an inanimate attacker', () =>
    {
      const engine = new JABS_Engine();
      expect(engine.canBeAlerted(buildAttacker({ isInanimate: () => true }), buildBattler())).toBe(false);
    });

    it('is false when the attacker and battler are on friendly teams', async () =>
    {
      const { default: JABS_TeamRules } = await import('../../../../../src/plugins/abs/core/managers/JABS_TeamRules.js');
      JABS_TeamRules.isFriendly = vi.fn(() => true);
      const engine = new JABS_Engine();

      expect(engine.canBeAlerted(buildAttacker(), buildBattler())).toBe(false);
      JABS_TeamRules.isFriendly = vi.fn(() => false);
    });

    it('is false for the player', () =>
    {
      const engine = new JABS_Engine();
      expect(engine.canBeAlerted(buildAttacker(), buildBattler({ isPlayer: () => true }))).toBe(false);
    });

    it('is false for an already-engaged battler', () =>
    {
      const engine = new JABS_Engine();
      expect(engine.canBeAlerted(buildAttacker(), buildBattler({ isEngaged: () => true }))).toBe(false);
    });

    it('is false for an inanimate battler', () =>
    {
      const engine = new JABS_Engine();
      expect(engine.canBeAlerted(buildAttacker(), buildBattler({ isInanimate: () => true }))).toBe(false);
    });

    it('is true otherwise', () =>
    {
      const engine = new JABS_Engine();
      expect(engine.canBeAlerted(buildAttacker(), buildBattler())).toBe(true);
    });
  });

  describe('triggerAlert', () =>
  {
    function buildTarget(overrides = {})
    {
      return Object.assign({
        showBalloon: vi.fn(),
        setAlertedCoordinates: vi.fn(),
        getAlertDuration: () => 90,
        setAlertedCounter: vi.fn(),
        isAlerted: () => false,
        setWaitCountdown: vi.fn(),
      }, overrides);
    }

    function buildAttacker(overrides = {})
    {
      return Object.assign({ getX: () => 3, getY: () => 4 }, overrides);
    }

    it('does nothing when the target cannot be alerted', () =>
    {
      const engine = new JABS_Engine();
      engine.canBeAlerted = vi.fn(() => false);
      const target = buildTarget();

      engine.triggerAlert(buildAttacker(), target);

      expect(target.showBalloon).not.toHaveBeenCalled();
    });

    it('alerts the target at the attacker\'s coordinates for the configured duration', () =>
    {
      J.ABS.Balloons = { Question: 2 };
      const engine = new JABS_Engine();
      engine.canBeAlerted = vi.fn(() => true);
      const target = buildTarget();
      const attacker = buildAttacker();

      engine.triggerAlert(attacker, target);

      expect(target.showBalloon).toHaveBeenCalledWith(2);
      expect(target.setAlertedCoordinates).toHaveBeenCalledWith(3, 4);
      expect(target.setAlertedCounter).toHaveBeenCalledWith(90);
    });

    it('pauses briefly the first time entering the alerted state', () =>
    {
      const engine = new JABS_Engine();
      engine.canBeAlerted = vi.fn(() => true);
      const target = buildTarget({ isAlerted: () => false });

      engine.triggerAlert(buildAttacker(), target);

      expect(target.setWaitCountdown).toHaveBeenCalledWith(45);
    });

    it('does not re-pause when already alerted', () =>
    {
      const engine = new JABS_Engine();
      engine.canBeAlerted = vi.fn(() => true);
      const target = buildTarget({ isAlerted: () => true });

      engine.triggerAlert(buildAttacker(), target);

      expect(target.setWaitCountdown).not.toHaveBeenCalled();
    });
  });
  //endregion implicit parry / glancing blow / alert

  //region retaliation
  describe('continuedPrimaryBattleEffects', () =>
  {
    it('delegates to checkRetaliate', () =>
    {
      const engine = new JABS_Engine();
      engine.checkRetaliate = vi.fn();

      engine.continuedPrimaryBattleEffects('action', 'target');

      expect(engine.checkRetaliate).toHaveBeenCalledWith('action', 'target');
    });
  });

  describe('checkRetaliate', () =>
  {
    function buildAction(overrides = {})
    {
      return Object.assign({
        isRetaliation: () => false,
        getCaster: () => ({ getTeam: () => 'caster-team' }),
      }, overrides);
    }

    function buildTargetBattler(overrides = {})
    {
      return Object.assign({ getTeam: () => 'target-team', isActor: () => true }, overrides);
    }

    it('does not retaliate against another battler\'s retaliation', () =>
    {
      const engine = new JABS_Engine();
      engine.handleActorRetaliation = vi.fn();
      engine.handleEnemyRetaliation = vi.fn();
      const action = buildAction({ isRetaliation: () => true });

      engine.checkRetaliate(action, buildTargetBattler());

      expect(engine.handleActorRetaliation).not.toHaveBeenCalled();
      expect(engine.handleEnemyRetaliation).not.toHaveBeenCalled();
    });

    it('does not retaliate against friendly-team hits', async () =>
    {
      const { default: JABS_TeamRules } = await import('../../../../../src/plugins/abs/core/managers/JABS_TeamRules.js');
      JABS_TeamRules.isFriendly = vi.fn(() => true);
      const engine = new JABS_Engine();
      engine.handleActorRetaliation = vi.fn();
      engine.handleEnemyRetaliation = vi.fn();

      engine.checkRetaliate(buildAction(), buildTargetBattler());

      expect(engine.handleActorRetaliation).not.toHaveBeenCalled();
      expect(engine.handleEnemyRetaliation).not.toHaveBeenCalled();
      JABS_TeamRules.isFriendly = vi.fn(() => false);
    });

    it('handles actor retaliation for an actor target', () =>
    {
      const engine = new JABS_Engine();
      engine.handleActorRetaliation = vi.fn();
      engine.handleEnemyRetaliation = vi.fn();
      const action = buildAction();
      const target = buildTargetBattler({ isActor: () => true });

      engine.checkRetaliate(action, target);

      expect(engine.handleActorRetaliation).toHaveBeenCalledWith(target, action);
      expect(engine.handleEnemyRetaliation).not.toHaveBeenCalled();
    });

    it('handles enemy retaliation for a non-actor target', () =>
    {
      const engine = new JABS_Engine();
      engine.handleActorRetaliation = vi.fn();
      engine.handleEnemyRetaliation = vi.fn();
      const action = buildAction();
      const target = buildTargetBattler({ isActor: () => false });

      engine.checkRetaliate(action, target);

      expect(engine.handleEnemyRetaliation).toHaveBeenCalledWith(target, action);
      expect(engine.handleActorRetaliation).not.toHaveBeenCalled();
    });
  });

  describe('canBattlerParry', () =>
  {
    it('is false when the battler has no counter-parry ids', () =>
    {
      const engine = new JABS_Engine();
      const battler = { counterParry: () => [] };

      expect(engine.canBattlerParry(battler)).toBe(false);
    });

    it('is true when the battler has counter-parry ids', () =>
    {
      const engine = new JABS_Engine();
      const battler = { counterParry: () => [ 1 ] };

      expect(engine.canBattlerParry(battler)).toBe(true);
    });
  });

  describe('handleCounterParry', () =>
  {
    it('does nothing and reports false when the battler cannot parry', () =>
    {
      const engine = new JABS_Engine();
      engine.canBattlerParry = vi.fn(() => false);
      engine.doCounterParry = vi.fn();

      expect(engine.handleCounterParry('battler')).toBe(false);
      expect(engine.doCounterParry).not.toHaveBeenCalled();
    });

    it('performs the counterparry with the offhand slot and reports true', () =>
    {
      const engine = new JABS_Engine();
      engine.canBattlerParry = vi.fn(() => true);
      engine.doCounterParry = vi.fn();

      expect(engine.handleCounterParry('battler')).toBe(true);
      expect(engine.doCounterParry).toHaveBeenCalledWith('battler');
    });
  });

  describe('handleCounterGuard', () =>
  {
    it('does nothing when the battler already counter-parried', () =>
    {
      const engine = new JABS_Engine();
      engine.doCounterGuard = vi.fn();
      const battler = { guarding: () => true, counterGuard: () => [ 1 ] };

      expect(engine.handleCounterGuard(battler, true)).toBe(false);
      expect(engine.doCounterGuard).not.toHaveBeenCalled();
    });

    it('does not counter-guard when the battler is not guarding', () =>
    {
      const engine = new JABS_Engine();
      engine.doCounterGuard = vi.fn();
      const battler = { guarding: () => false, counterGuard: () => [ 1 ] };

      expect(engine.handleCounterGuard(battler, false)).toBe(false);
      expect(engine.doCounterGuard).not.toHaveBeenCalled();
    });

    it('does not counter-guard when the battler has no counter-guard skills', () =>
    {
      const engine = new JABS_Engine();
      engine.doCounterGuard = vi.fn();
      const battler = { guarding: () => true, counterGuard: () => [] };

      expect(engine.handleCounterGuard(battler, false)).toBe(false);
      expect(engine.doCounterGuard).not.toHaveBeenCalled();
    });

    it('performs the counterguard with the offhand slot and reports true', () =>
    {
      const engine = new JABS_Engine();
      engine.doCounterGuard = vi.fn();
      const battler = { guarding: () => true, counterGuard: () => [ 1 ] };

      expect(engine.handleCounterGuard(battler, false)).toBe(true);
      expect(engine.doCounterGuard).toHaveBeenCalledWith(battler);
    });
  });

  describe('canAutoCounter', () =>
  {
    it('is false when there is no guard data for the offhand slot', () =>
    {
      const engine = new JABS_Engine();
      const battler = { getGuardData: () => null };

      expect(engine.canAutoCounter(battler)).toBe(false);
    });

    it('is false when the guard data cannot counter', () =>
    {
      const engine = new JABS_Engine();
      const battler = { getGuardData: () => ({ canCounter: () => false }) };

      expect(engine.canAutoCounter(battler)).toBe(false);
    });

    it('is true when the guard data can counter', () =>
    {
      const engine = new JABS_Engine();
      const battler = { getGuardData: () => ({ canCounter: () => true }) };

      expect(engine.canAutoCounter(battler)).toBe(true);
    });
  });

  describe('handleAutoCounter', () =>
  {
    it('does not roll or counter when the battler cannot auto-counter', () =>
    {
      const engine = new JABS_Engine();
      engine.canAutoCounter = vi.fn(() => false);
      engine.doAutoCounter = vi.fn();
      const battler = { getBattler: () => ({}) };

      engine.handleAutoCounter(battler);

      expect(globalThis.RPGManager.fateOf100).not.toHaveBeenCalled();
      expect(engine.doAutoCounter).not.toHaveBeenCalled();
    });

    it('does not auto-counter when the roll fails', () =>
    {
      const engine = new JABS_Engine();
      engine.canAutoCounter = vi.fn(() => true);
      engine.doAutoCounter = vi.fn();
      globalThis.RPGManager.fateOf100.mockReturnValue(false);
      const counterBattler = { getPositiveRolls: () => 0, getNegativeRolls: () => 0, cnt: 0.3 };
      const battler = { getBattler: () => counterBattler };

      engine.handleAutoCounter(battler);

      expect(globalThis.RPGManager.fateOf100).toHaveBeenCalledWith(counterBattler, 30, 1, 0);
      expect(engine.doAutoCounter).not.toHaveBeenCalled();
    });

    it('auto-counters when the roll succeeds', () =>
    {
      const engine = new JABS_Engine();
      engine.canAutoCounter = vi.fn(() => true);
      engine.doAutoCounter = vi.fn();
      globalThis.RPGManager.fateOf100.mockReturnValue(true);
      const counterBattler = { getPositiveRolls: () => 0, getNegativeRolls: () => 0, cnt: 0.3 };
      const battler = { getBattler: () => counterBattler };

      engine.handleAutoCounter(battler);

      expect(engine.doAutoCounter).toHaveBeenCalledWith(battler);
    });
  });

  describe('doAutoCounter', () =>
  {
    it('performs both counterparry and counterguard for the battler', () =>
    {
      const engine = new JABS_Engine();
      engine.doCounterParry = vi.fn();
      engine.doCounterGuard = vi.fn();

      engine.doAutoCounter('battler');

      expect(engine.doCounterParry).toHaveBeenCalledWith('battler');
      expect(engine.doCounterGuard).toHaveBeenCalledWith('battler');
    });
  });

  describe('doCounterGuard', () =>
  {
    it('does nothing when there are no counter-guard skill ids for the slot', () =>
    {
      const engine = new JABS_Engine();
      engine.forceMapAction = vi.fn();
      const battler = { getGuardData: () => ({ counterGuardIds: [] }) };

      engine.doCounterGuard(battler);

      expect(engine.forceMapAction).not.toHaveBeenCalled();
    });

    it('forces a map action for every counter-guard skill id', () =>
    {
      const engine = new JABS_Engine();
      engine.forceMapAction = vi.fn();
      const battler = { getGuardData: () => ({ counterGuardIds: [ 10, 20 ] }) };

      engine.doCounterGuard(battler);

      expect(engine.forceMapAction).toHaveBeenCalledWith(battler, 10, true);
      expect(engine.forceMapAction).toHaveBeenCalledWith(battler, 20, true);
    });
  });

  describe('doCounterParry', () =>
  {
    it('does nothing when there are no counter-parry skill ids for the slot', () =>
    {
      const engine = new JABS_Engine();
      engine.forceMapAction = vi.fn();
      const battler = { getGuardData: () => ({ counterParryIds: [] }) };

      engine.doCounterParry(battler);

      expect(engine.forceMapAction).not.toHaveBeenCalled();
    });

    it('forces a map action for every counter-parry skill id', () =>
    {
      const engine = new JABS_Engine();
      engine.forceMapAction = vi.fn();
      const battler = { getGuardData: () => ({ counterParryIds: [ 30 ] }) };

      engine.doCounterParry(battler);

      expect(engine.forceMapAction).toHaveBeenCalledWith(battler, 30, true);
    });
  });

  describe('handleActorRetaliation', () =>
  {
    function buildBattler(overrides = {})
    {
      return Object.assign({
        getBattler: () => ({ result: () => ({ parried: false }), retaliationSkills: () => [] }),
        parrying: () => false,
      }, overrides);
    }

    it('counter-parries on a parried result and skips counter-guard/auto-counter', () =>
    {
      const engine = new JABS_Engine();
      engine.handleCounterParry = vi.fn(() => true);
      engine.handleCounterGuard = vi.fn(() => false);
      engine.handleAutoCounter = vi.fn();
      engine.executeRetaliationSkills = vi.fn();
      const battler = buildBattler({ getBattler: () => ({ result: () => ({ parried: true }), retaliationSkills: () => [] }) });

      engine.handleActorRetaliation(battler, 'triggeringAction');

      expect(engine.handleCounterParry).toHaveBeenCalledWith(battler);
      expect(engine.handleAutoCounter).not.toHaveBeenCalled();
    });

    it('counter-parries when the battler is actively parrying, even without a parried result', () =>
    {
      const engine = new JABS_Engine();
      engine.handleCounterParry = vi.fn(() => true);
      engine.handleCounterGuard = vi.fn(() => false);
      engine.handleAutoCounter = vi.fn();
      const battler = buildBattler({ parrying: () => true });

      engine.handleActorRetaliation(battler, 'triggeringAction');

      expect(engine.handleCounterParry).toHaveBeenCalledWith(battler);
    });

    it('auto-counters when neither counterparry nor counterguard fired', () =>
    {
      // Arrange- the battler neither took a parried result nor is actively parrying, which is
      // the only configuration where the parry reaction should never be reached at all.
      const engine = new JABS_Engine();
      engine.handleCounterParry = vi.fn(() => false);
      engine.handleCounterGuard = vi.fn(() => false);
      engine.handleAutoCounter = vi.fn();
      const battler = buildBattler();

      // Act
      engine.handleActorRetaliation(battler, 'triggeringAction');

      // Assert- a counter-parry that returns false and one that is never attempted produce the
      // same auto-counter, so the reaction itself has to be pinned as un-attempted.
      expect(engine.handleCounterParry).not.toHaveBeenCalled();
      expect(engine.handleAutoCounter).toHaveBeenCalledWith(battler);
    });

    it('does not auto-counter when counterguard already fired', () =>
    {
      const engine = new JABS_Engine();
      engine.handleCounterParry = vi.fn(() => false);
      engine.handleCounterGuard = vi.fn(() => true);
      engine.handleAutoCounter = vi.fn();
      const battler = buildBattler();

      engine.handleActorRetaliation(battler, 'triggeringAction');

      expect(engine.handleAutoCounter).not.toHaveBeenCalled();
    });

    it('executes any passive retaliation skills the battler has', () =>
    {
      const engine = new JABS_Engine();
      engine.handleCounterParry = vi.fn(() => false);
      engine.handleCounterGuard = vi.fn(() => false);
      engine.handleAutoCounter = vi.fn();
      engine.executeRetaliationSkills = vi.fn();
      const retaliationSkills = [ 'skill1' ];
      const battler = buildBattler({
        getBattler: () => ({ result: () => ({ parried: false }), retaliationSkills: () => retaliationSkills }),
      });

      engine.handleActorRetaliation(battler, 'triggeringAction');

      expect(engine.executeRetaliationSkills).toHaveBeenCalledWith(battler, retaliationSkills, 'triggeringAction');
    });

    it('does not attempt to execute retaliation skills when there are none', () =>
    {
      const engine = new JABS_Engine();
      engine.handleCounterParry = vi.fn(() => false);
      engine.handleCounterGuard = vi.fn(() => false);
      engine.handleAutoCounter = vi.fn();
      engine.executeRetaliationSkills = vi.fn();
      const battler = buildBattler();

      engine.handleActorRetaliation(battler, 'triggeringAction');

      expect(engine.executeRetaliationSkills).not.toHaveBeenCalled();
    });
  });

  describe('handleEnemyRetaliation', () =>
  {
    it('does not execute anything when the enemy has no retaliation skills', () =>
    {
      const engine = new JABS_Engine();
      engine.executeRetaliationSkills = vi.fn();
      const enemy = { getBattler: () => ({ retaliationSkills: () => [] }) };

      engine.handleEnemyRetaliation(enemy, 'triggeringAction');

      expect(engine.executeRetaliationSkills).not.toHaveBeenCalled();
    });

    it('executes any passive retaliation skills the enemy has', () =>
    {
      const engine = new JABS_Engine();
      engine.executeRetaliationSkills = vi.fn();
      const retaliationSkills = [ 'skill1' ];
      const enemy = { getBattler: () => ({ retaliationSkills: () => retaliationSkills }) };

      engine.handleEnemyRetaliation(enemy, 'triggeringAction');

      expect(engine.executeRetaliationSkills).toHaveBeenCalledWith(enemy, retaliationSkills, 'triggeringAction');
    });
  });

  describe('executeRetaliationSkills', () =>
  {
    function buildRetaliationAction(overrides = {})
    {
      const gameAction = { setTriggerDamage: vi.fn() };
      return Object.assign({
        getAction: () => gameAction,
        isDirectAction: () => false,
        getProximity: () => 5,
        setActionOptions: vi.fn(),
      }, overrides);
    }

    function buildRetaliator(retaliationActions, overrides = {})
    {
      const retaliatorBattler = {
        result: () => ({ hpDamage: 1, mpDamage: 2, tpDamage: 3 }),
        getPositiveRollsForSkill: () => 0,
        getNegativeRollsForSkill: () => 0,
      };
      return Object.assign({
        getBattler: () => retaliatorBattler,
        createJabsActionFromSkill: vi.fn(() => retaliationActions),
        distanceToDesignatedTarget: () => 10,
      }, overrides);
    }

    function buildSkillChance(overrides = {})
    {
      return Object.assign({
        matchesHitType: () => true,
        baseSkill: () => ({}),
        resolveProcCount: () => 1,
        skillId: 7,
      }, overrides);
    }

    function buildTriggeringAction(overrides = {})
    {
      return Object.assign({
        getBaseSkill: () => ({ hitType: 1 }),
        getCaster: () => ({ getX: () => 3, getY: () => 4 }),
      }, overrides);
    }

    it('skips a retaliation skill whose hit-type filter does not match the incoming hit', () =>
    {
      const engine = new JABS_Engine();
      engine.canExecuteMapActions = vi.fn(() => true);
      engine.executeMapAction = vi.fn();
      const retaliator = buildRetaliator([]);
      const skillChance = buildSkillChance({ matchesHitType: () => false });

      engine.executeRetaliationSkills(retaliator, [ skillChance ], buildTriggeringAction());

      expect(retaliator.createJabsActionFromSkill).not.toHaveBeenCalled();
    });

    it('fires the retaliation action and stamps the triggering damage onto it', () =>
    {
      const engine = new JABS_Engine();
      engine.canExecuteMapActions = vi.fn(() => true);
      engine.executeMapAction = vi.fn();
      const retaliationAction = buildRetaliationAction();
      const retaliator = buildRetaliator([ retaliationAction ]);
      const skillChance = buildSkillChance();

      engine.executeRetaliationSkills(retaliator, [ skillChance ], buildTriggeringAction());

      expect(retaliationAction.getAction().setTriggerDamage).toHaveBeenCalledWith(1, 2, 3);
      expect(engine.executeMapAction).toHaveBeenCalledWith(retaliator, retaliationAction, null, null);
      // location freezing exists to stop a direct action from body-anchoring to the retaliator;
      // a non-direct action must keep the options it was built with, and null coordinates alone
      // do not prove that since the freeze rewrites the options without touching them.
      expect(retaliationAction.setActionOptions).not.toHaveBeenCalled();
    });

    it('does not fire when canExecuteMapActions reports the actions cannot execute', () =>
    {
      const engine = new JABS_Engine();
      engine.canExecuteMapActions = vi.fn(() => false);
      engine.executeMapAction = vi.fn();
      const retaliationAction = buildRetaliationAction();
      const retaliator = buildRetaliator([ retaliationAction ]);
      const skillChance = buildSkillChance();

      engine.executeRetaliationSkills(retaliator, [ skillChance ], buildTriggeringAction());

      expect(engine.executeMapAction).not.toHaveBeenCalled();
    });

    it('fires once per resolved proc count', () =>
    {
      const engine = new JABS_Engine();
      engine.canExecuteMapActions = vi.fn(() => true);
      engine.executeMapAction = vi.fn();
      const retaliator = buildRetaliator([ buildRetaliationAction() ]);
      const skillChance = buildSkillChance({ resolveProcCount: () => 3 });

      engine.executeRetaliationSkills(retaliator, [ skillChance ], buildTriggeringAction());

      expect(retaliator.createJabsActionFromSkill).toHaveBeenCalledTimes(3);
    });

    it('blocks a direct retaliation when the attacker is out of its proximity range', () =>
    {
      const engine = new JABS_Engine();
      engine.canExecuteMapActions = vi.fn(() => true);
      engine.executeMapAction = vi.fn();
      const directAction = buildRetaliationAction({ isDirectAction: () => true, getProximity: () => 2 });
      const retaliator = buildRetaliator([ directAction ], { distanceToDesignatedTarget: () => 10 });
      const skillChance = buildSkillChance();

      engine.executeRetaliationSkills(retaliator, [ skillChance ], buildTriggeringAction());

      expect(engine.executeMapAction).not.toHaveBeenCalled();
    });

    it('freezes the target location to the attacker for a direct retaliation within range', () =>
    {
      const engine = new JABS_Engine();
      engine.canExecuteMapActions = vi.fn(() => true);
      engine.executeMapAction = vi.fn();
      const directAction = buildRetaliationAction({ isDirectAction: () => true, getProximity: () => 20 });
      const retaliator = buildRetaliator([ directAction ], { distanceToDesignatedTarget: () => 10 });
      const skillChance = buildSkillChance();
      const triggeringAction = buildTriggeringAction();

      engine.executeRetaliationSkills(retaliator, [ skillChance ], triggeringAction);

      expect(directAction.setActionOptions).toHaveBeenCalledTimes(1);
      expect(engine.executeMapAction).toHaveBeenCalledWith(retaliator, directAction, 3, 4);
    });
  });
  //endregion retaliation

  //region post-primary battle effects & logging
  describe('postPrimaryBattleEffects', () =>
  {
    it('creates the attack log then processes purge states', () =>
    {
      const engine = new JABS_Engine();
      const callOrder = [];
      engine.createAttackLog = vi.fn(() => callOrder.push('log'));
      engine.processPurgeStates = vi.fn(() => callOrder.push('purge'));

      engine.postPrimaryBattleEffects('action', 'target');

      expect(callOrder).toEqual([ 'log', 'purge' ]);
      expect(engine.createAttackLog).toHaveBeenCalledWith('action', 'target');
      expect(engine.processPurgeStates).toHaveBeenCalledWith('action', 'target');
    });
  });

  describe('processPurgeStates', () =>
  {
    function buildTarget(overrides = {})
    {
      return Object.assign({
        getBattler: () => ({ result: () => ({ isHit: () => true }), removeStatesByPriority: vi.fn(() => []) }),
      }, overrides);
    }

    it('does not purge states on a non-hit result', () =>
    {
      const engine = new JABS_Engine();
      engine.createPurgeStateLogs = vi.fn();
      const target = buildTarget({ getBattler: () => ({ result: () => ({ isHit: () => false }) }) });
      const action = { getBaseSkill: () => ({ jabsPurgeStatesParams: [ 'negative', false, 1 ] }) };

      engine.processPurgeStates(action, target);

      expect(engine.createPurgeStateLogs).not.toHaveBeenCalled();
    });

    it('does nothing when the skill has no purgeStates tag', () =>
    {
      const engine = new JABS_Engine();
      engine.createPurgeStateLogs = vi.fn();
      const target = buildTarget();
      const action = { getBaseSkill: () => ({ jabsPurgeStatesParams: null }) };

      engine.processPurgeStates(action, target);

      expect(engine.createPurgeStateLogs).not.toHaveBeenCalled();
    });

    it('defaults type to negative, allowDeath to false, and count to 1 when omitted', () =>
    {
      const engine = new JABS_Engine();
      engine.createPurgeStateLogs = vi.fn();
      const removeStatesByPriority = vi.fn(() => []);
      const target = buildTarget({
        getBattler: () => ({ result: () => ({ isHit: () => true }), removeStatesByPriority }),
      });
      const action = { getBaseSkill: () => ({ jabsPurgeStatesParams: [ undefined, undefined, undefined ] }) };

      engine.processPurgeStates(action, target);

      expect(removeStatesByPriority).toHaveBeenCalledWith('negative', false, 1);
    });

    it('parses explicit type, allowDeath, and count from the tag', () =>
    {
      const engine = new JABS_Engine();
      engine.createPurgeStateLogs = vi.fn();
      const removeStatesByPriority = vi.fn(() => []);
      const target = buildTarget({
        getBattler: () => ({ result: () => ({ isHit: () => true }), removeStatesByPriority }),
      });
      const action = { getBaseSkill: () => ({ jabsPurgeStatesParams: [ 'positive', true, '3' ] }) };

      engine.processPurgeStates(action, target);

      expect(removeStatesByPriority).toHaveBeenCalledWith('positive', true, 3);
    });

    it('logs whatever states were actually purged', () =>
    {
      const engine = new JABS_Engine();
      engine.createPurgeStateLogs = vi.fn();
      const purged = [ { id: 5 } ];
      const target = buildTarget({
        getBattler: () => ({ result: () => ({ isHit: () => true }), removeStatesByPriority: () => purged }),
      });
      const action = { getBaseSkill: () => ({ jabsPurgeStatesParams: [ 'negative', false, 1 ] }) };

      engine.processPurgeStates(action, target);

      expect(engine.createPurgeStateLogs).toHaveBeenCalledWith(target, purged);
    });
  });

  describe('createPurgeStateLogs', () =>
  {
    beforeEach(() =>
    {
      globalThis.ActionLogBuilder = vi.fn(function()
      {
        this.setupStatePurged = vi.fn().mockReturnThis();
        this.build = vi.fn(() => ({ built: true }));
      });
      globalThis.$mapLogs = { action: { addLog: vi.fn() } };
    });

    it('does nothing when logging is disabled', () =>
    {
      globalThis.J.LOG = false;
      const engine = new JABS_Engine();
      const target = { getBattlerDatabaseData: () => ({ name: 'Slime' }) };

      engine.createPurgeStateLogs(target, [ { id: 1 } ]);

      expect(globalThis.$mapLogs.action.addLog).not.toHaveBeenCalled();
      globalThis.J.LOG = true;
    });

    it('does nothing when nothing was purged', () =>
    {
      globalThis.J.LOG = true;
      const engine = new JABS_Engine();
      const target = { getBattlerDatabaseData: () => ({ name: 'Slime' }) };

      engine.createPurgeStateLogs(target, []);

      expect(globalThis.$mapLogs.action.addLog).not.toHaveBeenCalled();
    });

    it('emits one log entry per purged state', () =>
    {
      globalThis.J.LOG = true;
      const engine = new JABS_Engine();
      const target = { getBattlerDatabaseData: () => ({ name: 'Slime' }) };

      engine.createPurgeStateLogs(target, [ { id: 1 }, { id: 2 } ]);

      expect(globalThis.$mapLogs.action.addLog).toHaveBeenCalledTimes(2);
    });

    it('skips logging for a state explicitly tagged to suppress logs', () =>
    {
      globalThis.J.LOG = true;
      const engine = new JABS_Engine();
      const target = { getBattlerDatabaseData: () => ({ name: 'Slime' }) };

      engine.createPurgeStateLogs(target, [ { id: 1, jabsNoLogs: true }, { id: 2 } ]);

      expect(globalThis.$mapLogs.action.addLog).toHaveBeenCalledTimes(1);
    });
  });

  describe('createAttackLog', () =>
  {
    function buildActionLogBuilderMock()
    {
      const instance = {};
      globalThis.ActionLogBuilder = vi.fn(function()
      {
        Object.assign(this, instance);
        [
          'setupParry', 'setupDodge', 'setupRetaliation', 'setupUndamaged',
          'setupTerrainDamage', 'setupExecution', 'setupTargetDefeated', 'setupStateAfflicted',
        ].forEach(method => { this[method] = vi.fn().mockReturnThis(); });
        this.build = vi.fn(() => ({ built: true }));
      });
    }

    function buildResult(overrides = {})
    {
      return Object.assign({
        parried: false, evaded: false, hpDamage: 0, mpDamage: 0, tpDamage: 0,
        reduced: 0, critical: false, addedStates: [],
      }, overrides);
    }

    function buildTargetBattler(result, overrides = {})
    {
      return Object.assign({
        result: () => result,
        deathStateId: () => 1,
        state: () => ({}),
        name: 'Slime',
      }, overrides);
    }

    function buildTarget(targetBattler, overrides = {})
    {
      return Object.assign({
        getBattler: () => targetBattler,
        getBattlerDatabaseData: () => ({ name: 'Slime' }),
        parrying: () => false,
      }, overrides);
    }

    function buildAction(overrides = {})
    {
      return Object.assign({
        getCaster: () => ({ getBattlerDatabaseData: () => ({ name: 'Hero' }) }),
        getBaseSkill: () => ({ id: 7, damage: { type: 1 } }),
        isRetaliation: () => false,
        isTerrainDamage: () => false,
      }, overrides);
    }

    beforeEach(() =>
    {
      buildActionLogBuilderMock();
      globalThis.$mapLogs = { action: { addLog: vi.fn() } };
    });

    it('does nothing when logging is disabled', () =>
    {
      globalThis.J.LOG = false;
      const engine = new JABS_Engine();
      const target = buildTarget(buildTargetBattler(buildResult()));

      engine.createAttackLog(buildAction(), target);

      expect(globalThis.$mapLogs.action.addLog).not.toHaveBeenCalled();
      globalThis.J.LOG = true;
    });

    it('logs a parry and stops processing further branches', () =>
    {
      globalThis.J.LOG = true;
      const engine = new JABS_Engine();
      const target = buildTarget(buildTargetBattler(buildResult({ parried: true })));

      engine.createAttackLog(buildAction(), target);

      expect(globalThis.ActionLogBuilder.mock.results[0].value.setupParry)
        .toHaveBeenCalledWith('Slime', 'Hero', 7, false);
      expect(globalThis.$mapLogs.action.addLog).toHaveBeenCalledTimes(1);
    });

    it('logs an evasion and stops processing further branches', () =>
    {
      globalThis.J.LOG = true;
      const engine = new JABS_Engine();
      const target = buildTarget(buildTargetBattler(buildResult({ evaded: true })));

      engine.createAttackLog(buildAction(), target);

      expect(globalThis.ActionLogBuilder.mock.results[0].value.setupDodge)
        .toHaveBeenCalledWith('Slime', 'Hero', 7);
      expect(globalThis.$mapLogs.action.addLog).toHaveBeenCalledTimes(1);
    });

    it('logs a retaliation and falls through to damage/state processing', () =>
    {
      globalThis.J.LOG = true;
      const engine = new JABS_Engine();
      const target = buildTarget(buildTargetBattler(buildResult({ hpDamage: 5 })));
      const action = buildAction({ isRetaliation: () => true });

      engine.createAttackLog(action, target);

      expect(globalThis.ActionLogBuilder.mock.results[0].value.setupRetaliation)
        .toHaveBeenCalledWith('Hero');
      // 2 logs: retaliation + the fallthrough damage entry.
      expect(globalThis.$mapLogs.action.addLog).toHaveBeenCalledTimes(2);
    });

    it('logs an undamaged hit when no damage or states landed', () =>
    {
      globalThis.J.LOG = true;
      const engine = new JABS_Engine();
      const target = buildTarget(buildTargetBattler(buildResult()));

      engine.createAttackLog(buildAction(), target);

      expect(globalThis.ActionLogBuilder.mock.results[0].value.setupUndamaged)
        .toHaveBeenCalledWith('Slime', 'Hero', 7);
    });

    it('suppresses the undamaged log for a no-damage-type (support) skill', () =>
    {
      globalThis.J.LOG = true;
      const engine = new JABS_Engine();
      const target = buildTarget(buildTargetBattler(buildResult()));
      const action = buildAction({ getBaseSkill: () => ({ id: 7, damage: { type: 0 } }) });

      engine.createAttackLog(action, target);

      expect(globalThis.$mapLogs.action.addLog).not.toHaveBeenCalled();
    });

    it('logs an execution entry for mp-only damage, skipping the hp-damage block entirely', () =>
    {
      globalThis.J.LOG = true;
      const engine = new JABS_Engine();
      const target = buildTarget(buildTargetBattler(buildResult({ mpDamage: 10 })));

      engine.createAttackLog(buildAction(), target);

      expect(globalThis.$mapLogs.action.addLog).not.toHaveBeenCalled();
    });

    it('formats negative hp damage (healing) without a leading minus sign', () =>
    {
      globalThis.J.LOG = true;
      const engine = new JABS_Engine();
      const target = buildTarget(buildTargetBattler(buildResult({ hpDamage: -8 })));

      engine.createAttackLog(buildAction(), target);

      expect(globalThis.ActionLogBuilder.mock.results[0].value.setupExecution)
        .toHaveBeenCalledWith('Slime', 'Hero', 7, '8', String.empty, true, false);
    });

    it('logs the standard execution entry for hp damage', () =>
    {
      globalThis.J.LOG = true;
      const engine = new JABS_Engine();
      const target = buildTarget(buildTargetBattler(buildResult({ hpDamage: 12, reduced: 3 })));

      engine.createAttackLog(buildAction(), target);

      expect(globalThis.ActionLogBuilder.mock.results[0].value.setupExecution)
        .toHaveBeenCalledWith('Slime', 'Hero', 7, 12, '(3)', false, false);
    });

    it('logs a terrain-damage entry instead of a normal execution entry for terrain damage', () =>
    {
      globalThis.J.LOG = true;
      const engine = new JABS_Engine();
      const target = buildTarget(buildTargetBattler(buildResult({ hpDamage: 8 })));
      const action = buildAction({ isTerrainDamage: () => true });

      engine.createAttackLog(action, target);

      expect(globalThis.ActionLogBuilder.mock.results[0].value.setupTerrainDamage)
        .toHaveBeenCalledWith('Slime', 7, 8, String.empty, false, false);
    });

    it('logs a target-defeated entry when the added state is the death state', () =>
    {
      globalThis.J.LOG = true;
      const engine = new JABS_Engine();
      const targetBattler = buildTargetBattler(buildResult({ hpDamage: 999, addedStates: [ 1 ] }), { deathStateId: () => 1 });
      const target = buildTarget(targetBattler);

      engine.createAttackLog(buildAction(), target);

      expect(globalThis.ActionLogBuilder.mock.results[1].value.setupTargetDefeated)
        .toHaveBeenCalledWith('Slime');
    });

    it('logs a state-afflicted entry for each non-death added state', () =>
    {
      globalThis.J.LOG = true;
      const engine = new JABS_Engine();
      const targetBattler = buildTargetBattler(
        buildResult({ hpDamage: 5, addedStates: [ 2 ] }),
        { deathStateId: () => 1, state: () => ({ jabsNoLogs: false }) },
      );
      const target = buildTarget(targetBattler);

      engine.createAttackLog(buildAction(), target);

      expect(globalThis.ActionLogBuilder.mock.results[1].value.setupStateAfflicted)
        .toHaveBeenCalledWith('Slime', 2);
    });

    it('skips a state-afflicted entry when the state explicitly forbids logging', () =>
    {
      globalThis.J.LOG = true;
      const engine = new JABS_Engine();
      const targetBattler = buildTargetBattler(
        buildResult({ hpDamage: 5, addedStates: [ 2 ] }),
        { deathStateId: () => 1, state: () => ({ jabsNoLogs: true }) },
      );
      const target = buildTarget(targetBattler);

      engine.createAttackLog(buildAction(), target);

      // only the damage-execution log fires; the state-afflicted entry is suppressed.
      expect(globalThis.$mapLogs.action.addLog).toHaveBeenCalledTimes(1);
    });
  });

  describe('determineElementalIcon', () =>
  {
    beforeEach(() =>
    {
      globalThis.DataManager = { isItem: vi.fn(() => false) };
      globalThis.$dataItems = [];
    });

    it('returns 0 when elemental icons are not in use', () =>
    {
      J.ABS.Metadata.UseElementalIcons = false;
      const engine = new JABS_Engine();
      const skill = { damage: { elementId: 3 } };

      expect(engine.determineElementalIcon(skill, {})).toBe(0);
    });

    it('returns the item icon index for an item-based skill', () =>
    {
      J.ABS.Metadata.UseElementalIcons = true;
      globalThis.DataManager.isItem = vi.fn(() => true);
      globalThis.$dataItems = { 7: { iconIndex: 55 } };
      const engine = new JABS_Engine();
      const skill = { id: 7, damage: { elementId: 3 } };

      expect(engine.determineElementalIcon(skill, {})).toBe(55);
    });

    it('resolves the weapon\'s first attack element for an actor using a weapon-based skill', () =>
    {
      J.ABS.Metadata.UseElementalIcons = true;
      J.ABS.Metadata.ElementalIcons = [ { element: 5, icon: 99 } ];
      const engine = new JABS_Engine();
      const skill = { damage: { elementId: -1 } };
      const caster = {
        isActor: () => true,
        getBattler: () => ({ attackElements: () => [ 5 ] }),
      };

      expect(engine.determineElementalIcon(skill, caster)).toBe(99);
    });

    it('falls back to elementId 0 for a weapon-based skill with no attack elements', () =>
    {
      J.ABS.Metadata.UseElementalIcons = true;
      J.ABS.Metadata.ElementalIcons = [ { element: 0, icon: 11 } ];
      const engine = new JABS_Engine();
      const skill = { damage: { elementId: -1 } };
      const caster = {
        isActor: () => true,
        getBattler: () => ({ attackElements: () => [] }),
      };

      expect(engine.determineElementalIcon(skill, caster)).toBe(11);
    });

    it('returns 0 when no configured icon matches the resolved element', () =>
    {
      J.ABS.Metadata.UseElementalIcons = true;
      J.ABS.Metadata.ElementalIcons = [ { element: 5, icon: 99 } ];
      const engine = new JABS_Engine();
      const skill = { damage: { elementId: 3 } };

      expect(engine.determineElementalIcon(skill, {})).toBe(0);
    });
  });
  //endregion post-primary battle effects & logging

  //region collision
  // shared origin helper: with $gameMap tiles at 48x48 and a down-facing (default) action event
  // at screenX=0/screenY=8, getActionOriginPixels resolves to exactly (0, 0)- see the already-
  // tested math in the "getActionOriginPixels" describe block above (facing 2: lift=18, oy=10).
  function buildOriginAction(overrides = {})
  {
    return Object.assign({
      getJabsAction: () => ({ direction: () => J.ABS.Directions.DOWN, getThicknessTiles: () => 1 }),
      screenX: () => 0,
      screenY: () => 8,
    }, overrides);
  }

  // places the target's AABB center at (cx, cy)- getBattlerAabbModel builds a 48x48 box one tile
  // above the character's feet, so feetY = cy + 24 recovers the desired center.
  function buildTargetAt(cx, cy)
  {
    return { screenX: () => cx, screenY: () => cy + 24 };
  }

  describe('getActionDegrees', () =>
  {
    it('returns null when no degrees tag is present', () =>
    {
      const engine = new JABS_Engine();
      globalThis.RPGManager.getNumberFromNoteByRegex.mockReturnValue(null);
      const actionEvent = { getJabsAction: () => ({ getBaseSkill: () => ({}) }) };

      expect(engine.getActionDegrees(actionEvent)).toBeNull();
    });

    it('returns null when the tag resolves to exactly 0', () =>
    {
      const engine = new JABS_Engine();
      globalThis.RPGManager.getNumberFromNoteByRegex.mockReturnValue(0);
      const actionEvent = { getJabsAction: () => ({ getBaseSkill: () => ({}) }) };

      expect(engine.getActionDegrees(actionEvent)).toBeNull();
    });

    it('clamps the found degrees to the [0, 360] range', () =>
    {
      const engine = new JABS_Engine();
      globalThis.RPGManager.getNumberFromNoteByRegex.mockReturnValue(500);
      const actionEvent = { getJabsAction: () => ({ getBaseSkill: () => ({}) }) };

      expect(engine.getActionDegrees(actionEvent)).toBe(360);
    });

    it('returns the found degrees unmodified when already in range', () =>
    {
      const engine = new JABS_Engine();
      globalThis.RPGManager.getNumberFromNoteByRegex.mockReturnValue(90);
      const actionEvent = { getJabsAction: () => ({ getBaseSkill: () => ({}) }) };

      expect(engine.getActionDegrees(actionEvent)).toBe(90);
    });
  });

  describe('getActionThicknessTiles', () =>
  {
    it('delegates to the action event\'s jabs action', () =>
    {
      const engine = new JABS_Engine();
      const getThicknessTiles = vi.fn(() => 3);
      const actionEvent = { getJabsAction: () => ({ getThicknessTiles }) };

      expect(engine.getActionThicknessTiles(actionEvent)).toBe(3);
    });
  });

  describe('dir8ToUnitVector', () =>
  {
    it('maps each cardinal and diagonal direction to its normalized unit vector', () =>
    {
      const engine = new JABS_Engine();
      expect(engine.dir8ToUnitVector(J.ABS.Directions.DOWN)).toEqual({ x: 0, y: 1 });
      expect(engine.dir8ToUnitVector(J.ABS.Directions.UP)).toEqual({ x: 0, y: -1 });
      expect(engine.dir8ToUnitVector(J.ABS.Directions.RIGHT)).toEqual({ x: 1, y: 0 });
      expect(engine.dir8ToUnitVector(J.ABS.Directions.LEFT)).toEqual({ x: -1, y: 0 });

      const sqrt2Inv = 1 / Math.sqrt(2);
      expect(engine.dir8ToUnitVector(J.ABS.Directions.LOWERRIGHT)).toEqual({ x: sqrt2Inv, y: sqrt2Inv });
      expect(engine.dir8ToUnitVector(J.ABS.Directions.LOWERLEFT)).toEqual({ x: -sqrt2Inv, y: sqrt2Inv });
      expect(engine.dir8ToUnitVector(J.ABS.Directions.UPPERRIGHT)).toEqual({ x: sqrt2Inv, y: -sqrt2Inv });
      expect(engine.dir8ToUnitVector(J.ABS.Directions.UPPERLEFT)).toEqual({ x: -sqrt2Inv, y: -sqrt2Inv });
    });

    it('defaults to a downward unit vector for an unrecognized direction', () =>
    {
      const engine = new JABS_Engine();
      expect(engine.dir8ToUnitVector(0)).toEqual({ x: 0, y: 1 });
    });
  });

  describe('collisionCircle', () =>
  {
    it('is true for a target overlapping the origin', () =>
    {
      const engine = new JABS_Engine();
      const action = buildOriginAction();
      const target = buildTargetAt(0, 0);

      expect(engine.collisionCircle(target, action, 1)).toBe(true);
    });

    it('is false for a target far outside the radius', () =>
    {
      const engine = new JABS_Engine();
      const action = buildOriginAction();
      const target = buildTargetAt(1000, 1000);

      expect(engine.collisionCircle(target, action, 1)).toBe(false);
    });

    it('honors the range-to-pixel conversion, so a larger range reaches a farther target', () =>
    {
      const engine = new JABS_Engine();
      const action = buildOriginAction();
      const target = buildTargetAt(200, 0);

      expect(engine.collisionCircle(target, action, 1)).toBe(false);
      expect(engine.collisionCircle(target, action, 5)).toBe(true);
    });
  });

  describe('collisionSquare', () =>
  {
    it('is true for a target within the centered square', () =>
    {
      const engine = new JABS_Engine();
      const action = buildOriginAction();
      const target = buildTargetAt(0, 0);

      expect(engine.collisionSquare(target, action, 1)).toBe(true);
    });

    it('is false for a target outside the square', () =>
    {
      const engine = new JABS_Engine();
      const action = buildOriginAction();
      const target = buildTargetAt(1000, 1000);

      expect(engine.collisionSquare(target, action, 1)).toBe(false);
    });
  });

  describe('collisionRhombus', () =>
  {
    it('is true for a target within the diamond\'s Manhattan distance', () =>
    {
      const engine = new JABS_Engine();
      const action = buildOriginAction();
      // 1 tile diagonally in each direction- well within a 2-tile rhombus (L1 distance ~2 tiles).
      const target = buildTargetAt(48, 48);

      expect(engine.collisionRhombus(target, action, 2)).toBe(true);
    });

    it('is false for a target outside the diamond even though it would be inside a same-radius circle', () =>
    {
      const engine = new JABS_Engine();
      const action = buildOriginAction();
      // far enough diagonally that Manhattan (L1) distance exceeds the range even though it's
      // closer than the range in straight-line (L2) terms- this is what distinguishes a rhombus
      // from a circle of the same nominal range.
      const target = buildTargetAt(90, 90);

      expect(engine.collisionRhombus(target, action, 2)).toBe(false);
    });

    it('measures the gap from the right/bottom edges when the origin is right of and below the target', () =>
    {
      const engine = new JABS_Engine();
      const action = buildOriginAction();
      // resolved origin (0, 0) sits to the right of and below a target rect placed at negative coordinates.
      const target = buildTargetAt(-48, -48);

      expect(engine.collisionRhombus(target, action, 2)).toBe(true);
    });

    it('has no horizontal gap when the origin\'s x already falls within the rect\'s horizontal span', () =>
    {
      const engine = new JABS_Engine();
      const action = buildOriginAction();
      // rect spans x:[-24, 24], so the resolved origin's x (0) sits inside it- neither the
      // left-of nor right-of horizontal branch fires, leaving dxPx at its initialized 0.
      const target = buildTargetAt(0, 200);

      expect(engine.collisionRhombus(target, action, 2)).toBe(false);
    });

    it('has no vertical gap when the origin\'s y already falls within the rect\'s vertical span', () =>
    {
      const engine = new JABS_Engine();
      const action = buildOriginAction();
      // rect spans y:[-24, 24], so the resolved origin's y (0) sits inside it- neither the
      // above nor below vertical branch fires, leaving dyPx at its initialized 0.
      const target = buildTargetAt(200, 0);

      expect(engine.collisionRhombus(target, action, 2)).toBe(false);
    });

    it('is false for a target up and to the left whose combined edge gaps exceed the range', () =>
    {
      // Arrange- rect spans x:[-84, -36] and y:[-120, -72], so the origin (0, 0) is right of
      // and below it: gaps of 0.75 and 1.5 tiles sum to 2.25, just past a 2-tile rhombus.
      // both gaps are deliberately narrow, because a comfortably-out-of-range target stays
      // out of range even when an edge gap is measured from the wrong edge or dropped to zero,
      // and every such miscomputation shrinks the distance rather than growing it.
      const engine = new JABS_Engine();
      const action = buildOriginAction();
      const target = buildTargetAt(-60, -96);

      // Act / Assert
      expect(engine.collisionRhombus(target, action, 2)).toBe(false);
    });

    it('is false for a target directly below whose vertical gap alone exceeds the range', () =>
    {
      // Arrange- the origin's x sits inside the rect's horizontal span, so the horizontal gap
      // is a true zero; the 2.25-tile vertical gap alone carries the rejection, and a negative
      // horizontal gap computed from the wrong edge would pull it back into range.
      const engine = new JABS_Engine();
      const action = buildOriginAction();
      const target = buildTargetAt(0, 132);

      // Act / Assert
      expect(engine.collisionRhombus(target, action, 2)).toBe(false);
    });

    it('is false for a target directly to the right whose horizontal gap alone exceeds the range', () =>
    {
      // Arrange- the mirror of the vertical case above: the origin's y sits inside the rect's
      // vertical span, leaving the 2.25-tile horizontal gap to carry the rejection alone.
      const engine = new JABS_Engine();
      const action = buildOriginAction();
      const target = buildTargetAt(132, 0);

      // Act / Assert
      expect(engine.collisionRhombus(target, action, 2)).toBe(false);
    });
  });

  describe('collisionCross', () =>
  {
    it('is true for a target far out along the horizontal arm', () =>
    {
      const engine = new JABS_Engine();
      const action = buildOriginAction();
      const target = buildTargetAt(48, 0);

      expect(engine.collisionCross(target, action, 1)).toBe(true);
    });

    it('is true for a target far out along the vertical arm', () =>
    {
      const engine = new JABS_Engine();
      const action = buildOriginAction();
      const target = buildTargetAt(0, 48);

      expect(engine.collisionCross(target, action, 1)).toBe(true);
    });

    it('is false for a target off of both arms entirely', () =>
    {
      const engine = new JABS_Engine();
      const action = buildOriginAction();
      const target = buildTargetAt(1000, 1000);

      expect(engine.collisionCross(target, action, 1)).toBe(false);
    });
  });

  describe('collisionOrientedRectFromOrigin', () =>
  {
    it('is true for a target ahead of the origin within the forward span and breadth band', () =>
    {
      const engine = new JABS_Engine();
      const targetRect = { cx: 0, cy: 50, w: 10, h: 10 };

      expect(engine.collisionOrientedRectFromOrigin(targetRect, 0, 0, J.ABS.Directions.DOWN, 100, 20)).toBe(true);
    });

    it('is false for a target behind the origin (outside the forward span)', () =>
    {
      const engine = new JABS_Engine();
      const targetRect = { cx: 0, cy: -50, w: 10, h: 10 };

      expect(engine.collisionOrientedRectFromOrigin(targetRect, 0, 0, J.ABS.Directions.DOWN, 100, 20)).toBe(false);
    });

    it('is false for a target ahead but outside the lateral breadth band', () =>
    {
      const engine = new JABS_Engine();
      const targetRect = { cx: 200, cy: 50, w: 10, h: 10 };

      expect(engine.collisionOrientedRectFromOrigin(targetRect, 0, 0, J.ABS.Directions.DOWN, 100, 20)).toBe(false);
    });

    it('is false for a target inside the breadth band but past the end of the forward span', () =>
    {
      // Arrange- the forward span is bounded at both ends, and a target behind the origin is
      // rejected by the near bound alone. only a target dead ahead and beyond the far end
      // leaves the far bound as the sole reason the rectangle does not reach it.
      const engine = new JABS_Engine();
      const targetRect = { cx: 0, cy: 200, w: 10, h: 10 };

      // Act / Assert
      expect(engine.collisionOrientedRectFromOrigin(targetRect, 0, 0, J.ABS.Directions.DOWN, 100, 20)).toBe(false);
    });
  });

  describe('collisionLine', () =>
  {
    it('delegates to collisionOrientedRectFromOrigin with a length derived from range and default thickness', () =>
    {
      const engine = new JABS_Engine();
      engine.getActionThicknessTiles = vi.fn(() => 1);
      engine.collisionOrientedRectFromOrigin = vi.fn(() => true);
      const action = buildOriginAction();
      const target = buildTargetAt(0, 40);

      const result = engine.collisionLine(target, action, 2, J.ABS.Directions.DOWN);

      expect(result).toBe(true);
      expect(engine.collisionOrientedRectFromOrigin).toHaveBeenCalledWith(
        expect.anything(), 0, 0, J.ABS.Directions.DOWN, expect.any(Number), expect.any(Number),
      );
    });
  });

  describe('collisionWall', () =>
  {
    it('delegates to collisionOrientedRectFromOrigin with a breadth spanning the range', () =>
    {
      const engine = new JABS_Engine();
      engine.getActionThicknessTiles = vi.fn(() => 1);
      engine.collisionOrientedRectFromOrigin = vi.fn(() => true);
      const action = buildOriginAction();
      const target = buildTargetAt(0, 40);

      const result = engine.collisionWall(target, action, 2, J.ABS.Directions.DOWN);

      expect(result).toBe(true);
      expect(engine.collisionOrientedRectFromOrigin).toHaveBeenCalledWith(
        expect.anything(), 0, 0, J.ABS.Directions.DOWN, expect.any(Number), expect.any(Number),
      );
    });
  });

  describe('collisionSector', () =>
  {
    it('is true immediately for a full 360-degree sweep once the circle test passes', () =>
    {
      const engine = new JABS_Engine();
      const action = buildOriginAction();
      const target = buildTargetAt(0, 0);

      expect(engine.collisionSector(target, action, 1, J.ABS.Directions.DOWN, 360)).toBe(true);
    });

    it('is false when the circle fast-reject fails outright', () =>
    {
      const engine = new JABS_Engine();
      const action = buildOriginAction();
      const target = buildTargetAt(1000, 1000);

      expect(engine.collisionSector(target, action, 1, J.ABS.Directions.DOWN, 90)).toBe(false);
    });

    it('is true for a target within the wedge angle', () =>
    {
      const engine = new JABS_Engine();
      const action = buildOriginAction();
      // straight down from the origin, well within a facing-down 90 degree wedge.
      const target = buildTargetAt(0, 40);

      expect(engine.collisionSector(target, action, 1, J.ABS.Directions.DOWN, 90)).toBe(true);
    });

    it('is false for a target within range but outside the wedge angle', () =>
    {
      const engine = new JABS_Engine();
      const action = buildOriginAction();
      // directly behind (up) a down-facing narrow wedge, but still within the circle radius.
      const target = buildTargetAt(0, -40);

      expect(engine.collisionSector(target, action, 1, J.ABS.Directions.DOWN, 30)).toBe(false);
    });

    it('is true when a sample point sits exactly at the arc origin (degenerate case)', () =>
    {
      const engine = new JABS_Engine();
      const action = buildOriginAction();
      // centers the target's AABB exactly on the action origin (0, 0), so the center sample
      // point's vector to the origin is (0, 0)- the degenerate zero-length-vector branch.
      const target = buildTargetAt(0, 0);

      expect(engine.collisionSector(target, action, 1, J.ABS.Directions.DOWN, 30)).toBe(true);
    });

    it('is true for an over-full sweep against a target directly behind the facing', () =>
    {
      // Arrange- a sweep wider than a full turn still describes the whole circle, but the
      // wedge math would read it as a half-angle past 180 degrees and reject everything that
      // is not almost dead ahead. the target sits directly behind a downward facing, far
      // enough that no corner of its box creeps back inside that narrowed sweep.
      const engine = new JABS_Engine();
      const action = buildOriginAction();
      const target = buildTargetAt(0, -200);

      // Act / Assert
      expect(engine.collisionSector(target, action, 4, J.ABS.Directions.DOWN, 400)).toBe(true);
    });

    it('is false for a target level with the origin but perpendicular to a narrow wedge', () =>
    {
      // Arrange- the target's center sits exactly level with the arc origin, so its vector has
      // a zero vertical component while its horizontal component is large. that is the
      // near-miss sibling of the degenerate origin case: one component is zero, but the point
      // is nowhere near the origin and a 90 degree downward wedge must not claim it.
      const engine = new JABS_Engine();
      const action = buildOriginAction();
      const target = buildTargetAt(200, 0);

      // Act / Assert
      expect(engine.collisionSector(target, action, 4, J.ABS.Directions.DOWN, 90)).toBe(false);
    });
  });

  describe('isTargetWithinRange', () =>
  {
    function buildEngineWithShapeMocks()
    {
      const engine = new JABS_Engine();
      engine.collisionCircle = vi.fn(() => 'circle');
      engine.collisionRhombus = vi.fn(() => 'rhombus');
      engine.collisionSquare = vi.fn(() => 'square');
      engine.collisionCross = vi.fn(() => 'cross');
      engine.collisionLine = vi.fn(() => 'line');
      engine.collisionSector = vi.fn(() => 'sector');
      engine.collisionWall = vi.fn(() => 'wall');
      engine.getActionDegrees = vi.fn(() => null);
      return engine;
    }

    beforeEach(() =>
    {
      J.ABS.Shapes = {
        Circle: 'circle', Rhombus: 'rhombus', Square: 'square', Cross: 'cross',
        Line: 'line', Arc: 'arc', Wall: 'wall',
      };
    });

    it('dispatches to collisionCircle for the circle shape', () =>
    {
      const engine = buildEngineWithShapeMocks();
      expect(engine.isTargetWithinRange(2, 'target', 'action', 1, J.ABS.Shapes.Circle)).toBe('circle');
    });

    it('dispatches to collisionRhombus for the rhombus shape', () =>
    {
      const engine = buildEngineWithShapeMocks();
      expect(engine.isTargetWithinRange(2, 'target', 'action', 1, J.ABS.Shapes.Rhombus)).toBe('rhombus');
    });

    it('dispatches to collisionSquare for the square shape', () =>
    {
      const engine = buildEngineWithShapeMocks();
      expect(engine.isTargetWithinRange(2, 'target', 'action', 1, J.ABS.Shapes.Square)).toBe('square');
    });

    it('dispatches to collisionCross for the cross shape', () =>
    {
      const engine = buildEngineWithShapeMocks();
      expect(engine.isTargetWithinRange(2, 'target', 'action', 1, J.ABS.Shapes.Cross)).toBe('cross');
    });

    it('dispatches to collisionLine for the line shape, passing along facing', () =>
    {
      const engine = buildEngineWithShapeMocks();
      expect(engine.isTargetWithinRange(2, 'target', 'action', 1, J.ABS.Shapes.Line)).toBe('line');
    });

    it('dispatches to collisionWall for the wall shape, passing along facing', () =>
    {
      const engine = buildEngineWithShapeMocks();
      expect(engine.isTargetWithinRange(2, 'target', 'action', 1, J.ABS.Shapes.Wall)).toBe('wall');
    });

    it('dispatches to collisionSector for the arc shape, defaulting degrees to 180 when untagged', () =>
    {
      const engine = buildEngineWithShapeMocks();
      engine.getActionDegrees = vi.fn(() => null);

      engine.isTargetWithinRange(2, 'target', 'action', 1, J.ABS.Shapes.Arc);

      expect(engine.collisionSector).toHaveBeenCalledWith('target', 'action', 1, 2, 180);
    });

    it('uses the tagged degrees for the arc shape when present', () =>
    {
      const engine = buildEngineWithShapeMocks();
      engine.getActionDegrees = vi.fn(() => 45);

      engine.isTargetWithinRange(2, 'target', 'action', 1, J.ABS.Shapes.Arc);

      expect(engine.collisionSector).toHaveBeenCalledWith('target', 'action', 1, 2, 45);
    });

    it('falls back to collisionCircle for an unrecognized shape', () =>
    {
      const engine = buildEngineWithShapeMocks();
      expect(engine.isTargetWithinRange(2, 'target', 'action', 1, 'unknown-shape')).toBe('circle');
    });

    it('excludes a target centered within the inner-radius dead zone regardless of shape', () =>
    {
      const engine = buildEngineWithShapeMocks();
      const action = buildOriginAction();
      const target = buildTargetAt(0, 0);

      const result = engine.isTargetWithinRange(2, target, action, 5, J.ABS.Shapes.Circle, 1);

      expect(result).toBe(false);
      expect(engine.collisionCircle).not.toHaveBeenCalled();
    });

    it('does not exclude a target outside the inner-radius dead zone', () =>
    {
      const engine = buildEngineWithShapeMocks();
      const action = buildOriginAction();
      const target = buildTargetAt(500, 0);

      engine.isTargetWithinRange(2, target, action, 5, J.ABS.Shapes.Circle, 1);

      expect(engine.collisionCircle).toHaveBeenCalled();
    });

    it('does not apply the dead zone when innerRadius is 0', () =>
    {
      const engine = buildEngineWithShapeMocks();
      const action = buildOriginAction();
      const target = buildTargetAt(0, 0);

      engine.isTargetWithinRange(2, target, action, 5, J.ABS.Shapes.Circle, 0);

      expect(engine.collisionCircle).toHaveBeenCalled();
    });
  });

  describe('getTriggerTouchTargets', () =>
  {
    /** builds a minimal JABS_Action-shaped object for the delay-arm proximity check. */
    function buildTriggerJabsAction(overrides = {})
    {
      return Object.assign({
        getCaster: () => ({ isEnemy: () => false }),
        getActionSprite: () => ({ _realX: 0, _realY: 0 }),
        direction: () => 2,
      }, overrides);
    }

    beforeEach(() =>
    {
      J.ABS.Shapes = {
        Circle: 'circle', Rhombus: 'rhombus', Square: 'square', Cross: 'cross',
        Line: 'line', Arc: 'arc', Wall: 'wall',
      };
    });

    it('returns no targets when the action has no action sprite yet', () =>
    {
      // Arrange
      const engine = new JABS_Engine();
      const jabsAction = buildTriggerJabsAction({ getActionSprite: () => null });

      // Act
      const result = engine.getTriggerTouchTargets(jabsAction, 3);

      // Assert
      expect(result).toEqual([]);
    });

    it('queries the spatial index using an AABB anchored on the action sprite, padded by the radius', async () =>
    {
      // Arrange
      const { default: JABS_AiManager } = await import('../../../../../src/plugins/abs/core/managers/JABS_AiManager.js');
      JABS_AiManager.queryBattlersInAabb = vi.fn(() => []);
      const engine = new JABS_Engine();
      const jabsAction = buildTriggerJabsAction({ getActionSprite: () => ({ _realX: 10, _realY: 20 }) });

      // Act
      engine.getTriggerTouchTargets(jabsAction, 3);

      // Assert
      expect(JABS_AiManager.queryBattlersInAabb).toHaveBeenCalledWith(7, 17, 13, 23);
    });

    it('excludes a candidate that cannot connect with the action', async () =>
    {
      // Arrange
      const { default: JABS_AiManager } = await import('../../../../../src/plugins/abs/core/managers/JABS_AiManager.js');
      const candidate = { canActionConnect: () => false, isWithinScope: () => true, isInanimate: () => false };
      JABS_AiManager.queryBattlersInAabb = vi.fn(() => [ candidate ]);
      const engine = new JABS_Engine();
      const jabsAction = buildTriggerJabsAction();

      // Act
      const result = engine.getTriggerTouchTargets(jabsAction, 3);

      // Assert
      expect(result).toEqual([]);
    });

    it('excludes a candidate that fails the scope check', async () =>
    {
      // Arrange
      const { default: JABS_AiManager } = await import('../../../../../src/plugins/abs/core/managers/JABS_AiManager.js');
      const candidate = { canActionConnect: () => true, isWithinScope: () => false, isInanimate: () => false };
      JABS_AiManager.queryBattlersInAabb = vi.fn(() => [ candidate ]);
      const engine = new JABS_Engine();
      const jabsAction = buildTriggerJabsAction();

      // Act
      const result = engine.getTriggerTouchTargets(jabsAction, 3);

      // Assert
      expect(result).toEqual([]);
    });

    it('excludes an inanimate candidate when the caster is an enemy', async () =>
    {
      // Arrange
      const { default: JABS_AiManager } = await import('../../../../../src/plugins/abs/core/managers/JABS_AiManager.js');
      const candidate = { canActionConnect: () => true, isWithinScope: () => true, isInanimate: () => true };
      JABS_AiManager.queryBattlersInAabb = vi.fn(() => [ candidate ]);
      const engine = new JABS_Engine();
      const jabsAction = buildTriggerJabsAction({ getCaster: () => ({ isEnemy: () => true }) });

      // Act
      const result = engine.getTriggerTouchTargets(jabsAction, 3);

      // Assert
      expect(result).toEqual([]);
    });

    it('includes an inanimate candidate when the caster is not an enemy', async () =>
    {
      // Arrange
      const { default: JABS_AiManager } = await import('../../../../../src/plugins/abs/core/managers/JABS_AiManager.js');
      const character = {};
      const candidate = {
        canActionConnect: () => true,
        isWithinScope: () => true,
        isInanimate: () => true,
        getCharacter: () => character,
      };
      JABS_AiManager.queryBattlersInAabb = vi.fn(() => [ candidate ]);
      const engine = new JABS_Engine();
      engine.isTargetWithinRange = vi.fn(() => true);
      const jabsAction = buildTriggerJabsAction({ getCaster: () => ({ isEnemy: () => false }) });

      // Act
      const result = engine.getTriggerTouchTargets(jabsAction, 3);

      // Assert
      expect(result).toEqual([ candidate ]);
    });

    it('collects a candidate whose character falls within the trigger circle', async () =>
    {
      // Arrange
      const { default: JABS_AiManager } = await import('../../../../../src/plugins/abs/core/managers/JABS_AiManager.js');
      const character = {};
      const candidate = {
        canActionConnect: () => true,
        isWithinScope: () => true,
        isInanimate: () => false,
        getCharacter: () => character,
      };
      JABS_AiManager.queryBattlersInAabb = vi.fn(() => [ candidate ]);
      const engine = new JABS_Engine();
      engine.isTargetWithinRange = vi.fn(() => true);
      const actionSprite = { _realX: 0, _realY: 0 };
      const jabsAction = buildTriggerJabsAction({ getActionSprite: () => actionSprite });

      // Act
      const result = engine.getTriggerTouchTargets(jabsAction, 3);

      // Assert: this method now correctly resolves against JABS_Engine's own isTargetWithinRange-
      // it used to live on JABS_Action, which does not define that method, and would throw.
      expect(engine.isTargetWithinRange).toHaveBeenCalledWith(2, character, actionSprite, 3, J.ABS.Shapes.Circle);
      expect(result).toEqual([ candidate ]);
    });

    it('excludes a candidate whose character falls outside the trigger circle', async () =>
    {
      // Arrange
      const { default: JABS_AiManager } = await import('../../../../../src/plugins/abs/core/managers/JABS_AiManager.js');
      const candidate = {
        canActionConnect: () => true,
        isWithinScope: () => true,
        isInanimate: () => false,
        getCharacter: () => ({}),
      };
      JABS_AiManager.queryBattlersInAabb = vi.fn(() => [ candidate ]);
      const engine = new JABS_Engine();
      engine.isTargetWithinRange = vi.fn(() => false);
      const jabsAction = buildTriggerJabsAction();

      // Act
      const result = engine.getTriggerTouchTargets(jabsAction, 3);

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('getCollisionTargets', () =>
  {
    function buildJabsAction(overrides = {})
    {
      return Object.assign({
        getAction: () => ({ isForUser: () => false, isForOne: () => false }),
        getCaster: () => ({ getAllyTarget: () => null, isEnemy: () => false }),
        getActionOptions: () => null,
        getActionSprite: () => null,
        getRange: () => 1,
        isDirectAction: () => false,
        getShape: () => 'circle',
        getInnerRadius: () => 0,
      }, overrides);
    }

    it('hits an in-range candidate for a self-targeting, direct, non-spatial action', async () =>
    {
      const { default: JABS_AiManager } = await import('../../../../../src/plugins/abs/core/managers/JABS_AiManager.js');
      const caster = { canActionConnect: () => true, isWithinScope: () => true, isInanimate: () => false, id: 'caster' };
      JABS_AiManager.queryBattlersInAabb = vi.fn(() => [ caster ]);
      const engine = new JABS_Engine();
      const jabsAction = buildJabsAction({
        getAction: () => ({ isForUser: () => true, isForOne: () => true }),
        isDirectAction: () => true,
        getProximity: () => 0,
        getCaster: () => ({ getAllyTarget: () => null, isEnemy: () => false, getX: () => 0, getY: () => 0 }),
      });

      expect(engine.getCollisionTargets(jabsAction)).toEqual([ caster ]);
    });

    it('does not hit a candidate that fails the scope check for a self-targeting, direct, non-spatial action', async () =>
    {
      const { default: JABS_AiManager } = await import('../../../../../src/plugins/abs/core/managers/JABS_AiManager.js');
      const bystander = { canActionConnect: () => true, isWithinScope: () => false, isInanimate: () => false };
      JABS_AiManager.queryBattlersInAabb = vi.fn(() => [ bystander ]);
      const engine = new JABS_Engine();
      const jabsAction = buildJabsAction({
        getAction: () => ({ isForUser: () => true, isForOne: () => true }),
        isDirectAction: () => true,
        getProximity: () => 0,
        getCaster: () => ({ getAllyTarget: () => null, isEnemy: () => false, getX: () => 0, getY: () => 0 }),
      });

      expect(engine.getCollisionTargets(jabsAction)).toEqual([]);
    });

    it('returns only the ally target for a single-target ally-targeted action that can connect', () =>
    {
      const engine = new JABS_Engine();
      const allyTarget = { canActionConnect: () => true, isWithinScope: () => true };
      const jabsAction = buildJabsAction({
        getAction: () => ({ isForUser: () => false, isForOne: () => true }),
        getCaster: () => ({ getAllyTarget: () => allyTarget, isEnemy: () => false }),
      });

      expect(engine.getCollisionTargets(jabsAction)).toEqual([ allyTarget ]);
    });

    it('falls through past an ally target that cannot connect', async () =>
    {
      const { default: JABS_AiManager } = await import('../../../../../src/plugins/abs/core/managers/JABS_AiManager.js');
      JABS_AiManager.getAllBattlers = vi.fn(() => []);
      const engine = new JABS_Engine();
      const allyTarget = { canActionConnect: () => false, isWithinScope: () => true };
      const jabsAction = buildJabsAction({
        getAction: () => ({ isForUser: () => false, isForOne: () => true }),
        getCaster: () => ({ getAllyTarget: () => allyTarget, isEnemy: () => false }),
      });

      expect(engine.getCollisionTargets(jabsAction)).toEqual([]);
    });

    it('returns only the retaliation target for a single-target retaliation that can connect', () =>
    {
      const engine = new JABS_Engine();
      const retaliationTarget = { canActionConnect: () => true, isWithinScope: () => true };
      const jabsAction = buildJabsAction({
        getAction: () => ({ isForUser: () => false, isForOne: () => true }),
        getActionOptions: () => ({ getRetaliationTarget: () => retaliationTarget }),
      });

      expect(engine.getCollisionTargets(jabsAction)).toEqual([ retaliationTarget ]);
    });

    it('falls through past a retaliation target that cannot connect', async () =>
    {
      const { default: JABS_AiManager } = await import('../../../../../src/plugins/abs/core/managers/JABS_AiManager.js');
      JABS_AiManager.getAllBattlers = vi.fn(() => []);
      const engine = new JABS_Engine();
      const retaliationTarget = { canActionConnect: () => false, isWithinScope: () => true };
      const jabsAction = buildJabsAction({
        getAction: () => ({ isForUser: () => false, isForOne: () => true }),
        getActionOptions: () => ({ getRetaliationTarget: () => retaliationTarget }),
      });

      expect(engine.getCollisionTargets(jabsAction)).toEqual([]);
    });

    it('filters out candidates that cannot connect with the action', async () =>
    {
      const { default: JABS_AiManager } = await import('../../../../../src/plugins/abs/core/managers/JABS_AiManager.js');
      const untargetable = { canActionConnect: () => false, isWithinScope: () => true, isInanimate: () => false };
      JABS_AiManager.getAllBattlers = vi.fn(() => [ untargetable ]);
      const engine = new JABS_Engine();
      const jabsAction = buildJabsAction();

      expect(engine.getCollisionTargets(jabsAction)).toEqual([]);
    });

    it('excludes inanimate candidates when the caster is an enemy', async () =>
    {
      const { default: JABS_AiManager } = await import('../../../../../src/plugins/abs/core/managers/JABS_AiManager.js');
      const inanimateCandidate = { canActionConnect: () => true, isWithinScope: () => true, isInanimate: () => true };
      JABS_AiManager.getAllBattlers = vi.fn(() => [ inanimateCandidate ]);
      const engine = new JABS_Engine();
      const jabsAction = buildJabsAction({ getCaster: () => ({ getAllyTarget: () => null, isEnemy: () => true }) });

      expect(engine.getCollisionTargets(jabsAction)).toEqual([]);
    });

    it('collects candidates that pass a non-direct action\'s spatial collision check', async () =>
    {
      const { default: JABS_AiManager } = await import('../../../../../src/plugins/abs/core/managers/JABS_AiManager.js');
      const character = {};
      const candidate = {
        canActionConnect: () => true,
        isWithinScope: () => true,
        isInanimate: () => false,
        getCharacter: () => character,
      };
      JABS_AiManager.queryBattlersInAabb = vi.fn(() => [ candidate ]);
      const engine = new JABS_Engine();
      engine.isTargetWithinRange = vi.fn(() => true);
      const actionSprite = { _realX: 0, _realY: 0, getJabsAction: () => ({ direction: () => 2 }) };
      const jabsAction = buildJabsAction({ getActionSprite: () => actionSprite });

      expect(engine.getCollisionTargets(jabsAction)).toEqual([ candidate ]);
    });

    it('skips a later candidate once single-scope has already been satisfied by an earlier hit', async () =>
    {
      const { default: JABS_AiManager } = await import('../../../../../src/plugins/abs/core/managers/JABS_AiManager.js');
      // isWithinScope is consulted twice per candidate: once by the pre-filter (no hitOne arg,
      // always passes), and once by the per-candidate processor (respects hitOne once true).
      const isWithinScope = (jabsAction, battler, hitOne) => hitOne !== true;
      const first = { canActionConnect: () => true, isWithinScope, isInanimate: () => false, getCharacter: () => ({}) };
      const second = { canActionConnect: () => true, isWithinScope, isInanimate: () => false, getCharacter: () => ({}) };
      JABS_AiManager.queryBattlersInAabb = vi.fn(() => [ first, second ]);
      const engine = new JABS_Engine();
      engine.isTargetWithinRange = vi.fn(() => true);
      const actionSprite = { _realX: 0, _realY: 0, getJabsAction: () => ({ direction: () => 2 }) };
      const jabsAction = buildJabsAction({ getActionSprite: () => actionSprite });

      expect(engine.getCollisionTargets(jabsAction)).toEqual([ first ]);
    });

    it('falls back to a 1-tile point-contact range for a direct action with no explicit range tag', async () =>
    {
      const { default: JABS_AiManager } = await import('../../../../../src/plugins/abs/core/managers/JABS_AiManager.js');
      JABS_AiManager.queryBattlersInAabb = vi.fn(() => []);
      const engine = new JABS_Engine();
      const jabsAction = buildJabsAction({
        getRange: () => null,
        isDirectAction: () => true,
        getProximity: () => 0,
        getCaster: () => ({ getAllyTarget: () => null, isEnemy: () => false, getX: () => 0, getY: () => 0 }),
      });

      expect(() => engine.getCollisionTargets(jabsAction)).not.toThrow();
    });

    it('falls back to a null range for a non-direct action with no explicit range tag', async () =>
    {
      const { default: JABS_AiManager } = await import('../../../../../src/plugins/abs/core/managers/JABS_AiManager.js');
      JABS_AiManager.getAllBattlers = vi.fn(() => []);
      const engine = new JABS_Engine();
      const jabsAction = buildJabsAction({ getRange: () => null, isDirectAction: () => false });

      expect(() => engine.getCollisionTargets(jabsAction)).not.toThrow();
    });

    it('excludes candidates that fail a non-direct action\'s spatial collision check', async () =>
    {
      const { default: JABS_AiManager } = await import('../../../../../src/plugins/abs/core/managers/JABS_AiManager.js');
      const candidate = {
        canActionConnect: () => true,
        isWithinScope: () => true,
        isInanimate: () => false,
        getCharacter: () => ({}),
      };
      JABS_AiManager.queryBattlersInAabb = vi.fn(() => [ candidate ]);
      const engine = new JABS_Engine();
      engine.isTargetWithinRange = vi.fn(() => false);
      const actionSprite = { _realX: 0, _realY: 0, getJabsAction: () => ({ direction: () => 2 }) };
      const jabsAction = buildJabsAction({ getActionSprite: () => actionSprite });

      expect(engine.getCollisionTargets(jabsAction)).toEqual([]);
    });

    it('hits a direct, non-spatial candidate within proximity', async () =>
    {
      const { default: JABS_AiManager } = await import('../../../../../src/plugins/abs/core/managers/JABS_AiManager.js');
      const candidate = { canActionConnect: () => true, isWithinScope: () => true, isInanimate: () => false };
      JABS_AiManager.queryBattlersInAabb = vi.fn(() => [ candidate ]);
      const engine = new JABS_Engine();
      const distanceToDesignatedTarget = vi.fn(() => 2);
      const jabsAction = buildJabsAction({
        isDirectAction: () => true,
        getProximity: () => 5,
        getCaster: () => ({
          getAllyTarget: () => null, isEnemy: () => false, getX: () => 0, getY: () => 0, distanceToDesignatedTarget,
        }),
      });

      expect(engine.getCollisionTargets(jabsAction)).toEqual([ candidate ]);
    });

    it('excludes a direct, non-spatial candidate outside proximity', async () =>
    {
      const { default: JABS_AiManager } = await import('../../../../../src/plugins/abs/core/managers/JABS_AiManager.js');
      const candidate = { canActionConnect: () => true, isWithinScope: () => true, isInanimate: () => false };
      JABS_AiManager.queryBattlersInAabb = vi.fn(() => [ candidate ]);
      const engine = new JABS_Engine();
      const distanceToDesignatedTarget = vi.fn(() => 10);
      const jabsAction = buildJabsAction({
        isDirectAction: () => true,
        getProximity: () => 5,
        getCaster: () => ({
          getAllyTarget: () => null, isEnemy: () => false, getX: () => 0, getY: () => 0, distanceToDesignatedTarget,
        }),
      });

      expect(engine.getCollisionTargets(jabsAction)).toEqual([]);
    });

    it('uses spatial collision for a direct action that has an action sprite', async () =>
    {
      const { default: JABS_AiManager } = await import('../../../../../src/plugins/abs/core/managers/JABS_AiManager.js');
      const candidate = {
        canActionConnect: () => true, isWithinScope: () => true, isInanimate: () => false, getCharacter: () => ({}),
      };
      JABS_AiManager.queryBattlersInAabb = vi.fn(() => [ candidate ]);
      const engine = new JABS_Engine();
      engine.isTargetWithinRange = vi.fn(() => true);
      const actionSprite = { _realX: 0, _realY: 0, getJabsAction: () => ({ direction: () => 2 }) };
      const jabsAction = buildJabsAction({ isDirectAction: () => true, getActionSprite: () => actionSprite });

      expect(engine.getCollisionTargets(jabsAction)).toEqual([ candidate ]);
    });

    it('excludes a candidate that fails spatial collision for a direct action with an action sprite', async () =>
    {
      const { default: JABS_AiManager } = await import('../../../../../src/plugins/abs/core/managers/JABS_AiManager.js');
      const candidate = {
        canActionConnect: () => true, isWithinScope: () => true, isInanimate: () => false, getCharacter: () => ({}),
      };
      JABS_AiManager.queryBattlersInAabb = vi.fn(() => [ candidate ]);
      const engine = new JABS_Engine();
      engine.isTargetWithinRange = vi.fn(() => false);
      const actionSprite = { _realX: 0, _realY: 0, getJabsAction: () => ({ direction: () => 2 }) };
      const jabsAction = buildJabsAction({ isDirectAction: () => true, getActionSprite: () => actionSprite });

      expect(engine.getCollisionTargets(jabsAction)).toEqual([]);
    });
  });
  //endregion collision

  //region defeated target aftermath
  describe('handleDefeatedTarget', () =>
  {
    it('runs predefeat before the type-specific handler and postdefeat after it', () =>
    {
      const engine = new JABS_Engine();
      const callOrder = [];
      engine.predefeatHandler = vi.fn(() => callOrder.push('pre'));
      engine.handleDefeatedPlayer = vi.fn(() => callOrder.push('player'));
      engine.postDefeatHandler = vi.fn(() => callOrder.push('post'));
      const target = { isPlayer: () => true, isActor: () => true, isDying: () => false, isEnemy: () => false };

      engine.handleDefeatedTarget(target, 'caster');

      expect(callOrder).toEqual([ 'pre', 'player', 'post' ]);
    });

    it('handles a dying player', () =>
    {
      const engine = new JABS_Engine();
      engine.predefeatHandler = vi.fn();
      engine.postDefeatHandler = vi.fn();
      engine.handleDefeatedPlayer = vi.fn();
      engine.handleDefeatedAlly = vi.fn();
      engine.handleDefeatedEnemy = vi.fn();
      const target = { isPlayer: () => true, isActor: () => true, isDying: () => false, isEnemy: () => false };

      engine.handleDefeatedTarget(target, 'caster');

      expect(engine.handleDefeatedPlayer).toHaveBeenCalledTimes(1);
      expect(engine.handleDefeatedAlly).not.toHaveBeenCalled();
      expect(engine.handleDefeatedEnemy).not.toHaveBeenCalled();
    });

    it('handles a non-dying actor ally', () =>
    {
      const engine = new JABS_Engine();
      engine.predefeatHandler = vi.fn();
      engine.postDefeatHandler = vi.fn();
      engine.handleDefeatedPlayer = vi.fn();
      engine.handleDefeatedAlly = vi.fn();
      engine.handleDefeatedEnemy = vi.fn();
      const target = { isPlayer: () => false, isActor: () => true, isDying: () => false, isEnemy: () => false };

      engine.handleDefeatedTarget(target, 'caster');

      expect(engine.handleDefeatedAlly).toHaveBeenCalledWith(target);
      expect(engine.handleDefeatedPlayer).not.toHaveBeenCalled();
    });

    it('does not re-handle an actor ally that is already dying', () =>
    {
      const engine = new JABS_Engine();
      engine.predefeatHandler = vi.fn();
      engine.postDefeatHandler = vi.fn();
      engine.handleDefeatedAlly = vi.fn();
      engine.handleDefeatedEnemy = vi.fn();
      const target = { isPlayer: () => false, isActor: () => true, isDying: () => true, isEnemy: () => false };

      engine.handleDefeatedTarget(target, 'caster');

      expect(engine.handleDefeatedAlly).not.toHaveBeenCalled();
      expect(engine.handleDefeatedEnemy).not.toHaveBeenCalled();
    });

    it('handles a defeated enemy', () =>
    {
      const engine = new JABS_Engine();
      engine.predefeatHandler = vi.fn();
      engine.postDefeatHandler = vi.fn();
      engine.handleDefeatedAlly = vi.fn();
      engine.handleDefeatedEnemy = vi.fn();
      const target = { isPlayer: () => false, isActor: () => false, isDying: () => false, isEnemy: () => true };

      engine.handleDefeatedTarget(target, 'caster');

      expect(engine.handleDefeatedEnemy).toHaveBeenCalledWith(target, 'caster');
    });
  });

  describe('predefeatHandler', () =>
  {
    it('delegates to the target\'s predefeat effects', () =>
    {
      const engine = new JABS_Engine();
      const target = { performPredefeatEffects: vi.fn() };

      engine.predefeatHandler(target, 'caster');

      expect(target.performPredefeatEffects).toHaveBeenCalledWith('caster');
    });
  });

  describe('postDefeatHandler', () =>
  {
    it('delegates to the target\'s postdefeat effects', () =>
    {
      const engine = new JABS_Engine();
      const target = { performPostdefeatEffects: vi.fn() };

      engine.postDefeatHandler(target, 'caster');

      expect(target.performPostdefeatEffects).toHaveBeenCalledWith('caster');
    });
  });

  describe('handleDefeatedPlayer', () =>
  {
    it('triggers party cycling', () =>
    {
      const engine = new JABS_Engine();
      engine.performPartyCycling = vi.fn();

      engine.handleDefeatedPlayer();

      expect(engine.performPartyCycling).toHaveBeenCalledTimes(1);
    });
  });

  describe('handleDefeatedAlly', () =>
  {
    it('is a no-op hook', () =>
    {
      const engine = new JABS_Engine();
      expect(() => engine.handleDefeatedAlly({})).not.toThrow();
    });
  });

  describe('handleDefeatedEnemy', () =>
  {
    function buildDefeatedTarget(overrides = {})
    {
      return Object.assign({
        clearFollowers: vi.fn(),
        clearLeader: vi.fn(),
        getCharacter: () => ({
          start: vi.fn(),
          isDynamicSpawn: () => false,
          eventId: () => 4,
        }),
        isInanimate: () => false,
        hasEventActions: () => false,
        getBattler: () => ({}),
        setDying: vi.fn(),
      }, overrides);
    }

    beforeEach(() =>
    {
      globalThis.SoundManager = { playEnemyCollapse: vi.fn() };
      // the respawn tracking path consults the registry on the system and the current map id.
      globalThis.$gameMap = {
        tileWidth: () => 48,
        tileHeight: () => 48,
        mapId: () => 7,
      };
      globalThis.$gameSystem = { setRespawnRecord: vi.fn() };
      respawnCreateRecordMock.mockReset().mockReturnValue(null);
    });

    it('clears followers and leader data', () =>
    {
      const engine = new JABS_Engine();
      const target = buildDefeatedTarget();

      engine.handleDefeatedEnemy(target, null);

      expect(target.clearFollowers).toHaveBeenCalledTimes(1);
      expect(target.clearLeader).toHaveBeenCalledTimes(1);
    });

    it('plays the death cry for an animate target', () =>
    {
      const engine = new JABS_Engine();
      const target = buildDefeatedTarget({ isInanimate: () => false });

      engine.handleDefeatedEnemy(target, null);

      expect(globalThis.SoundManager.playEnemyCollapse).toHaveBeenCalledTimes(1);
    });

    it('does not play a death cry for an inanimate target', () =>
    {
      const engine = new JABS_Engine();
      const target = buildDefeatedTarget({ isInanimate: () => true });

      engine.handleDefeatedEnemy(target, null);

      expect(globalThis.SoundManager.playEnemyCollapse).not.toHaveBeenCalled();
    });

    it('starts the death-control event when the target has event actions', () =>
    {
      const engine = new JABS_Engine();
      const start = vi.fn();
      const target = buildDefeatedTarget({
        hasEventActions: () => true,
        getCharacter: () => ({
          start,
          isDynamicSpawn: () => false,
          eventId: () => 4,
        }),
      });

      engine.handleDefeatedEnemy(target, null);

      expect(start).toHaveBeenCalledTimes(1);
    });

    it('does not start a death-control event when the target has no event actions', () =>
    {
      // Arrange- nothing else in this method touches the character's event, so the untouched
      // start below belongs to the event-actions check and to nothing else.
      const engine = new JABS_Engine();
      const start = vi.fn();
      const target = buildDefeatedTarget({
        hasEventActions: () => false,
        getCharacter: () => ({
          start,
          isDynamicSpawn: () => false,
          eventId: () => 4,
        }),
      });

      // Act
      engine.handleDefeatedEnemy(target, null);

      // Assert- flagging the target as dying is the tail of the method and proves it ran.
      expect(start).not.toHaveBeenCalled();
      expect(target.setDying).toHaveBeenCalledWith(true);
    });

    it('grants rewards and loot when the caster is an actor', () =>
    {
      const engine = new JABS_Engine();
      engine.gainBasicRewards = vi.fn();
      engine.createLootDrops = vi.fn();
      const target = buildDefeatedTarget();
      const caster = { isActor: () => true };

      engine.handleDefeatedEnemy(target, caster);

      expect(engine.gainBasicRewards).toHaveBeenCalledWith(target.getBattler(), caster);
      expect(engine.createLootDrops).toHaveBeenCalledWith(target, caster);
    });

    it('does not grant rewards when there is no caster', () =>
    {
      const engine = new JABS_Engine();
      engine.gainBasicRewards = vi.fn();
      engine.createLootDrops = vi.fn();
      const target = buildDefeatedTarget();

      engine.handleDefeatedEnemy(target, null);

      expect(engine.gainBasicRewards).not.toHaveBeenCalled();
      expect(engine.createLootDrops).not.toHaveBeenCalled();
    });

    it('does not grant rewards when the caster is not an actor', () =>
    {
      const engine = new JABS_Engine();
      engine.gainBasicRewards = vi.fn();
      engine.createLootDrops = vi.fn();
      const target = buildDefeatedTarget();
      const caster = { isActor: () => false };

      engine.handleDefeatedEnemy(target, caster);

      expect(engine.gainBasicRewards).not.toHaveBeenCalled();
      expect(engine.createLootDrops).not.toHaveBeenCalled();
    });

    it('flags the target as dying', () =>
    {
      const engine = new JABS_Engine();
      const target = buildDefeatedTarget();

      engine.handleDefeatedEnemy(target, null);

      expect(target.setDying).toHaveBeenCalledWith(true);
    });
  });

  describe('processRespawnTracking', () =>
  {
    beforeEach(() =>
    {
      globalThis.$gameMap = Object.assign(globalThis.$gameMap, { mapId: () => 7 });
      globalThis.$gameSystem = { setRespawnRecord: vi.fn() };
      respawnCreateRecordMock.mockReset().mockReturnValue(null);
    });

    /**
     * Builds a defeated target riding an authored (or dynamically-spawned) event.
     */
    function buildRespawnTarget({ dynamicSpawn = false } = {})
    {
      const enemy = { name: 'the-defeated-enemy' };
      return {
        getCharacter: () => ({
          isDynamicSpawn: () => dynamicSpawn,
          eventId: () => 4,
        }),
        getBattler: () => enemy,
        enemy,
      };
    }

    it('never tracks a dynamically-spawned clone', () =>
    {
      // Arrange
      const engine = new JABS_Engine();
      const target = buildRespawnTarget({ dynamicSpawn: true });

      // Act
      engine.processRespawnTracking(target);

      // Assert
      expect(respawnCreateRecordMock).not.toHaveBeenCalled();
      expect($gameSystem.setRespawnRecord).not.toHaveBeenCalled();
    });

    it('tracks nothing when the battler declares no respawn behavior', () =>
    {
      // Arrange
      const engine = new JABS_Engine();
      const target = buildRespawnTarget();
      respawnCreateRecordMock.mockReturnValue(null);

      // Act
      engine.processRespawnTracking(target);

      // Assert- the resolution ran against the event and its enemy, but nothing registered.
      expect(respawnCreateRecordMock).toHaveBeenCalledWith(expect.anything(), target.enemy);
      expect($gameSystem.setRespawnRecord).not.toHaveBeenCalled();
    });

    it('registers the created record against the current map and event', () =>
    {
      // Arrange
      const engine = new JABS_Engine();
      const target = buildRespawnTarget();
      const record = { method: 'seconds', due: 6400 };
      respawnCreateRecordMock.mockReturnValue(record);

      // Act
      engine.processRespawnTracking(target);

      // Assert
      expect($gameSystem.setRespawnRecord).toHaveBeenCalledWith(7, 4, record);
    });
  });

  describe('updateRespawns', () =>
  {
    beforeEach(() =>
    {
      globalThis.$gameSystem = { respawnRecordsForMap: vi.fn(() => []) };
      globalThis.$gameMap = Object.assign(globalThis.$gameMap, { mapId: () => 7 });
    });

    it('only ticks the throttle while the countdown has not lapsed', () =>
    {
      // Arrange
      const engine = new JABS_Engine();
      engine.respawnSweepCountdown = 5;

      // Act
      engine.updateRespawns();

      // Assert
      expect(engine.respawnSweepCountdown).toBe(4);
      expect($gameSystem.respawnRecordsForMap).not.toHaveBeenCalled();
    });

    it('sweeps and resets the throttle when the countdown lapses', () =>
    {
      // Arrange
      const engine = new JABS_Engine();
      engine.respawnSweepCountdown = 1;

      // Act
      engine.updateRespawns();

      // Assert
      expect($gameSystem.respawnRecordsForMap).toHaveBeenCalledWith(7);
      expect(engine.respawnSweepCountdown).toBe(60);
    });
  });

  describe('processDueRespawns', () =>
  {
    beforeEach(() =>
    {
      globalThis.$gameMap = Object.assign(globalThis.$gameMap, { mapId: () => 7 });
    });

    it('leaves records that have not come due right where they are', () =>
    {
      // Arrange
      const engine = new JABS_Engine();
      engine.respawnEnemy = vi.fn();
      const record = { method: 'seconds', due: 999999 };
      globalThis.$gameSystem = { respawnRecordsForMap: () => [ [ 4, record ] ] };
      respawnIsDueMock.mockReturnValue(false);

      // Act
      engine.processDueRespawns();

      // Assert
      expect(respawnIsDueMock).toHaveBeenCalledWith(record);
      expect(engine.respawnEnemy).not.toHaveBeenCalled();
    });

    it('revives only the records that have come due', () =>
    {
      // Arrange- a not-yet-due sibling must survive the sweep untouched.
      const engine = new JABS_Engine();
      engine.respawnEnemy = vi.fn();
      const dueRecord = { method: 'seconds', due: 100 };
      const pendingRecord = { method: 'seconds', due: 999999 };
      globalThis.$gameSystem = {
        respawnRecordsForMap: () => [ [ 4, dueRecord ], [ 9, pendingRecord ] ],
      };
      respawnIsDueMock.mockImplementation(record => record === dueRecord);

      // Act
      engine.processDueRespawns();

      // Assert
      expect(engine.respawnEnemy).toHaveBeenCalledTimes(1);
      expect(engine.respawnEnemy).toHaveBeenCalledWith(4);
    });
  });

  describe('forceRespawns', () =>
  {
    /**
     * Installs the map and registry collaborators the forced reset walks.
     * @param {[number, object][]} records The event-id-to-record pairs the current map is tracking.
     */
    function buildForcedWorld(records)
    {
      globalThis.$gameMap = Object.assign(globalThis.$gameMap, { mapId: () => 7 });
      globalThis.$gameSystem = {
        respawnRecordsForMap: vi.fn(() => records),
        clearAllRespawnRecords: vi.fn(),
      };
    }

    /**
     * Builds a record stub carrying only the predicate the forced reset consults.
     * @param {boolean} permanent Whether this record declares permanence.
     */
    function buildRecord(permanent)
    {
      return { isPermanent: () => permanent };
    }

    it('leaves permanent placements down when permanence is not overruled', () =>
    {
      // Arrange- a pending sibling on the same map must still come back.
      const engine = new JABS_Engine();
      engine.respawnEnemy = vi.fn();
      buildForcedWorld([ [ 4, buildRecord(true) ], [ 9, buildRecord(false) ] ]);

      // Act
      engine.forceRespawns(false);

      // Assert
      expect(engine.respawnEnemy).toHaveBeenCalledTimes(1);
      expect(engine.respawnEnemy).toHaveBeenCalledWith(9);
    });

    it('revives permanent placements when permanence is overruled', () =>
    {
      // Arrange
      const engine = new JABS_Engine();
      engine.respawnEnemy = vi.fn();
      buildForcedWorld([ [ 4, buildRecord(true) ], [ 9, buildRecord(false) ] ]);

      // Act
      engine.forceRespawns(true);

      // Assert
      expect(engine.respawnEnemy).toHaveBeenCalledTimes(2);
      expect(engine.respawnEnemy).toHaveBeenCalledWith(4);
      expect(engine.respawnEnemy).toHaveBeenCalledWith(9);
    });

    it('rebuilds nothing on a map tracking no records', () =>
    {
      // Arrange
      const engine = new JABS_Engine();
      engine.respawnEnemy = vi.fn();
      buildForcedWorld([]);

      // Act
      engine.forceRespawns(false);

      // Assert
      expect($gameSystem.respawnRecordsForMap).toHaveBeenCalledWith(7);
      expect(engine.respawnEnemy).not.toHaveBeenCalled();
    });

    it('hands the permanence flag onward to the world-wide wipe', () =>
    {
      // Arrange
      const engine = new JABS_Engine();
      engine.respawnEnemy = vi.fn();
      buildForcedWorld([ [ 9, buildRecord(false) ] ]);

      // Act
      engine.forceRespawns(true);

      // Assert
      expect($gameSystem.clearAllRespawnRecords).toHaveBeenCalledWith(true);
    });
  });

  describe('respawnEnemy', () =>
  {
    /**
     * Installs the map/player/system collaborators the respawn rebuild touches.
     */
    function buildRespawnWorld({
      staleEvent = {
        event: () => ({
          x: 10,
          y: 20,
        }),
      },
      playerOnTile = false,
    } = {})
    {
      globalThis.$gameMap = {
        tileWidth: () => 48,
        tileHeight: () => 48,
        mapId: () => 7,
        event: vi.fn(() => staleEvent),
        setEventByIndex: vi.fn(),
        refreshOneBattler: vi.fn(),
      };
      globalThis.$gamePlayer = { pos: vi.fn(() => playerOnTile) };
      globalThis.$gameSystem = { clearRespawnRecord: vi.fn() };
      globalThis.Game_Event = vi.fn(function(mapId, eventId)
      {
        this.mapId = mapId;
        this.eventId = eventId;
        this.flagBattlerForAdding = vi.fn();
      });
    }

    it('drops the record of an event that no longer exists on the map', () =>
    {
      // Arrange- a husk from a map edited since the save was written.
      const engine = new JABS_Engine();
      buildRespawnWorld({ staleEvent: null });

      // Act
      engine.respawnEnemy(4);

      // Assert- the husk is dropped and no rebuild is attempted.
      expect($gameSystem.clearRespawnRecord).toHaveBeenCalledWith(7, 4);
      expect(globalThis.Game_Event).not.toHaveBeenCalled();
    });

    it('defers the respawn while the player occupies the authored tile', () =>
    {
      // Arrange
      const engine = new JABS_Engine();
      buildRespawnWorld({ playerOnTile: true });

      // Act
      engine.respawnEnemy(4);

      // Assert- the record survives, so a later sweep can try again.
      expect($gamePlayer.pos).toHaveBeenCalledWith(10, 20);
      expect($gameSystem.clearRespawnRecord).not.toHaveBeenCalled();
      expect($gameMap.setEventByIndex).not.toHaveBeenCalled();
    });

    it('rebuilds the authored slot and converts the fresh event back into a battler', () =>
    {
      // Arrange
      const engine = new JABS_Engine();
      buildRespawnWorld();
      engine.processRespawnAnimation = vi.fn();
      engine.requestBattlerRendering = false;

      // Act
      engine.respawnEnemy(4);

      // Assert- fresh event in the authored slot, spent record cleared, battler and sprite queued.
      expect(globalThis.Game_Event).toHaveBeenCalledWith(7, 4);
      const [ [ , freshEvent ] ] = $gameMap.setEventByIndex.mock.calls;
      expect($gameMap.setEventByIndex).toHaveBeenCalledWith(4, freshEvent);
      expect($gameSystem.clearRespawnRecord).toHaveBeenCalledWith(7, 4);
      expect($gameMap.refreshOneBattler).toHaveBeenCalledWith(freshEvent);
      expect(freshEvent.flagBattlerForAdding).toHaveBeenCalledTimes(1);
      expect(engine.requestBattlerRendering).toBe(true);
      expect(engine.processRespawnAnimation).toHaveBeenCalledWith(freshEvent);
    });
  });

  describe('processRespawnAnimation', () =>
  {
    it('announces nothing when the refreshed page no longer declares a battler', () =>
    {
      // Arrange
      const engine = new JABS_Engine();
      const freshEvent = {
        getJabsBattler: () => null,
        getRespawnAnimationOverrides: vi.fn(),
        requestAnimation: vi.fn(),
      };

      // Act
      engine.processRespawnAnimation(freshEvent);

      // Assert- resolution never even ran.
      expect(freshEvent.getRespawnAnimationOverrides).not.toHaveBeenCalled();
    });

    it('plays nothing when the resolved animation id is zero', () =>
    {
      // Arrange
      vi.useFakeTimers();
      const engine = new JABS_Engine();
      const freshEvent = {
        getJabsBattler: () => ({ getBattler: () => ({ respawnAnimationId: () => 0 }) }),
        getRespawnAnimationOverrides: () => null,
        requestAnimation: vi.fn(),
      };

      // Act
      engine.processRespawnAnimation(freshEvent);
      vi.runAllTimers();

      // Assert
      expect(freshEvent.requestAnimation).not.toHaveBeenCalled();
      vi.useRealTimers();
    });

    it('plays the comment-overridden animation over the enemy note animation', () =>
    {
      // Arrange- the enemy note carries a decoy animation that must lose to the comment.
      vi.useFakeTimers();
      const engine = new JABS_Engine();
      const freshEvent = {
        getJabsBattler: () => ({ getBattler: () => ({ respawnAnimationId: () => 99 }) }),
        getRespawnAnimationOverrides: () => 12,
        requestAnimation: vi.fn(),
      };

      // Act
      engine.processRespawnAnimation(freshEvent);
      vi.runAllTimers();

      // Assert
      expect(freshEvent.requestAnimation).toHaveBeenCalledWith(12);
      vi.useRealTimers();
    });

    it('falls back to the enemy note animation when no comment overrides it', () =>
    {
      // Arrange
      vi.useFakeTimers();
      const engine = new JABS_Engine();
      const freshEvent = {
        getJabsBattler: () => ({ getBattler: () => ({ respawnAnimationId: () => 99 }) }),
        getRespawnAnimationOverrides: () => null,
        requestAnimation: vi.fn(),
      };

      // Act
      engine.processRespawnAnimation(freshEvent);
      vi.runAllTimers();

      // Assert
      expect(freshEvent.requestAnimation).toHaveBeenCalledWith(99);
      vi.useRealTimers();
    });
  });

  describe('gainBasicRewards', () =>
  {
    it('determines and gains both experience and gold, then logs the rewards', () =>
    {
      const engine = new JABS_Engine();
      engine.determineExperienceGained = vi.fn(() => 100);
      engine.gainExperienceReward = vi.fn();
      engine.determineGoldGained = vi.fn(() => 50);
      engine.gainGoldReward = vi.fn();
      engine.createRewardsLog = vi.fn();
      const actorCharacter = {};
      const actorBattler = {};
      const actor = { getCharacter: () => actorCharacter, getBattler: () => actorBattler };
      const enemy = {};

      engine.gainBasicRewards(enemy, actor);

      expect(engine.determineExperienceGained).toHaveBeenCalledWith(enemy, actorBattler);
      expect(engine.gainExperienceReward).toHaveBeenCalledWith(100, actorCharacter);
      expect(engine.determineGoldGained).toHaveBeenCalledWith(enemy, actorBattler);
      expect(engine.gainGoldReward).toHaveBeenCalledWith(50, actorCharacter);
      expect(engine.createRewardsLog).toHaveBeenCalledWith(100, 50, actor);
    });
  });

  describe('canGainReward', () =>
  {
    it('is true by default', () =>
    {
      const engine = new JABS_Engine();
      expect(engine.canGainReward('enemy', 'actor')).toBe(true);
    });
  });

  describe('determineExperienceGained', () =>
  {
    it('returns 0 when the reward policy gate rejects rewards', () =>
    {
      const engine = new JABS_Engine();
      engine.canGainReward = vi.fn(() => false);
      const enemy = { exp: () => 100 };

      expect(engine.determineExperienceGained(enemy, 'actor')).toBe(0);
    });

    it('scales the yielded experience by the reward multiplier', () =>
    {
      const engine = new JABS_Engine();
      engine.canGainReward = vi.fn(() => true);
      engine.getRewardScalingMultiplier = vi.fn(() => 2);
      const enemy = { exp: () => 100 };

      expect(engine.determineExperienceGained(enemy, 'actor')).toBe(200);
    });

    it('normalizes negative scaled experience to 0', () =>
    {
      const engine = new JABS_Engine();
      engine.canGainReward = vi.fn(() => true);
      engine.getRewardScalingMultiplier = vi.fn(() => -1);
      const enemy = { exp: () => 100 };

      expect(engine.determineExperienceGained(enemy, 'actor')).toBe(0);
    });
  });

  describe('determineGoldGained', () =>
  {
    it('returns 0 when the reward policy gate rejects rewards', () =>
    {
      const engine = new JABS_Engine();
      engine.canGainReward = vi.fn(() => false);
      const enemy = { gold: () => 100 };

      expect(engine.determineGoldGained(enemy, 'actor')).toBe(0);
    });

    it('scales the yielded gold by the reward multiplier', () =>
    {
      const engine = new JABS_Engine();
      engine.canGainReward = vi.fn(() => true);
      engine.getRewardScalingMultiplier = vi.fn(() => 2);
      const enemy = { gold: () => 100 };

      expect(engine.determineGoldGained(enemy, 'actor')).toBe(200);
    });

    it('normalizes negative scaled gold to 0', () =>
    {
      const engine = new JABS_Engine();
      engine.canGainReward = vi.fn(() => true);
      engine.getRewardScalingMultiplier = vi.fn(() => -1);
      const enemy = { gold: () => 100 };

      expect(engine.determineGoldGained(enemy, 'actor')).toBe(0);
    });
  });

  describe('getRewardScalingMultiplier', () =>
  {
    it('defaults to a 1x multiplier when level scaling is unavailable', () =>
    {
      J.LEVEL = false;
      const engine = new JABS_Engine();

      expect(engine.getRewardScalingMultiplier({ level: 5 }, { level: 5 })).toBe(1.0);
    });

    it('defaults to a 1x multiplier when level scaling is available but disabled', () =>
    {
      J.LEVEL = true;
      globalThis.$gameSystem = { isLevelScalingEnabled: () => false };
      const engine = new JABS_Engine();

      expect(engine.getRewardScalingMultiplier({ level: 5 }, { level: 5 })).toBe(1.0);
      J.LEVEL = false;
    });

    it('uses the level-scaling multiplier when level scaling is enabled', () =>
    {
      J.LEVEL = true;
      globalThis.$gameSystem = { isLevelScalingEnabled: () => true };
      globalThis.LevelScaling = { Scope: { REWARD: 'reward' }, multiplier: vi.fn(() => 3) };
      const engine = new JABS_Engine();

      const result = engine.getRewardScalingMultiplier({ level: 10 }, { level: 5 });

      expect(result).toBe(3);
      expect(globalThis.LevelScaling.multiplier).toHaveBeenCalledWith(10, 5, 'reward');
      J.LEVEL = false;
    });
  });

  describe('gainExperienceReward', () =>
  {
    it('does nothing when there is no experience to grant', () =>
    {
      globalThis.$gameParty = { battleMembers: vi.fn(() => []) };
      const engine = new JABS_Engine();

      engine.gainExperienceReward(0, {});

      expect(globalThis.$gameParty.battleMembers).not.toHaveBeenCalled();
    });

    it('grants experience to every battle member', () =>
    {
      const member1 = { gainExp: vi.fn() };
      const member2 = { gainExp: vi.fn() };
      globalThis.$gameParty = { battleMembers: () => [ member1, member2 ] };
      const engine = new JABS_Engine();

      engine.gainExperienceReward(100, {});

      expect(member1.gainExp).toHaveBeenCalledWith(100);
      expect(member2.gainExp).toHaveBeenCalledWith(100);
    });
  });

  describe('gainGoldReward', () =>
  {
    it('does nothing when there is no gold to grant', () =>
    {
      globalThis.$gameParty = { gainGold: vi.fn() };
      const engine = new JABS_Engine();

      engine.gainGoldReward(0, {});

      expect(globalThis.$gameParty.gainGold).not.toHaveBeenCalled();
    });

    it('grants the gold to the party', () =>
    {
      globalThis.$gameParty = { gainGold: vi.fn() };
      const engine = new JABS_Engine();

      engine.gainGoldReward(50, {});

      expect(globalThis.$gameParty.gainGold).toHaveBeenCalledWith(50);
    });
  });

  describe('createRewardsLog', () =>
  {
    beforeEach(() =>
    {
      globalThis.ActionLogBuilder = vi.fn(function()
      {
        this.setupExperienceGained = vi.fn().mockReturnThis();
        this.build = vi.fn(() => ({ builtExp: true }));
      });
      globalThis.LootLogBuilder = vi.fn(function()
      {
        this.setupGoldFound = vi.fn().mockReturnThis();
        this.build = vi.fn(() => ({ builtGold: true }));
      });
      globalThis.$mapLogs = {
        action: { addLog: vi.fn() },
        loot: { addLog: vi.fn() },
      };
    });

    it('does nothing when logging is disabled', () =>
    {
      globalThis.J.LOG = false;
      const engine = new JABS_Engine();

      engine.createRewardsLog(100, 50, { getBattlerDatabaseData: () => ({ name: 'Hero' }) });

      expect(globalThis.$mapLogs.action.addLog).not.toHaveBeenCalled();
      expect(globalThis.$mapLogs.loot.addLog).not.toHaveBeenCalled();
      globalThis.J.LOG = true;
    });

    it('logs experience gained when experience is non-zero', () =>
    {
      globalThis.J.LOG = true;
      const engine = new JABS_Engine();
      const caster = { getBattlerDatabaseData: () => ({ name: 'Hero' }) };

      engine.createRewardsLog(100, 0, caster);

      expect(globalThis.$mapLogs.action.addLog).toHaveBeenCalledWith({ builtExp: true });
      expect(globalThis.$mapLogs.loot.addLog).not.toHaveBeenCalled();
    });

    it('logs gold found when gold is non-zero', () =>
    {
      globalThis.J.LOG = true;
      const engine = new JABS_Engine();
      const caster = { getBattlerDatabaseData: () => ({ name: 'Hero' }) };

      engine.createRewardsLog(0, 50, caster);

      expect(globalThis.$mapLogs.loot.addLog).toHaveBeenCalledWith({ builtGold: true });
      expect(globalThis.$mapLogs.action.addLog).not.toHaveBeenCalled();
    });
  });

  describe('createLootDrops', () =>
  {
    it('does not drop loot for an actor target', () =>
    {
      const engine = new JABS_Engine();
      engine.addLootDropToMap = vi.fn();
      const target = { isActor: () => true };

      engine.createLootDrops(target, 'caster');

      expect(engine.addLootDropToMap).not.toHaveBeenCalled();
    });

    it('does nothing when the enemy has no drops', () =>
    {
      const engine = new JABS_Engine();
      engine.addLootDropToMap = vi.fn();
      const target = { isActor: () => false, getBattler: () => ({ makeDropItems: () => [] }) };
      const caster = { getBattler: () => ({}) };

      engine.createLootDrops(target, caster);

      expect(engine.addLootDropToMap).not.toHaveBeenCalled();
    });

    it('adds a loot drop to the map for each item dropped', () =>
    {
      const engine = new JABS_Engine();
      engine.addLootDropToMap = vi.fn();
      const items = [ { id: 1 }, { id: 2 } ];
      const casterBattler = {};
      const target = {
        isActor: () => false,
        getBattler: () => ({ makeDropItems: vi.fn((cb) => { expect(cb).toBe(casterBattler); return items; }) }),
        getX: () => 5,
        getY: () => 6,
      };
      const caster = { getBattler: () => casterBattler };

      engine.createLootDrops(target, caster);

      expect(engine.addLootDropToMap).toHaveBeenCalledWith(5, 6, items[0]);
      expect(engine.addLootDropToMap).toHaveBeenCalledWith(5, 6, items[1]);
    });
  });

  describe('createLootLog', () =>
  {
    beforeEach(() =>
    {
      globalThis.LootLogBuilder = vi.fn(function()
      {
        this.setupLootObtained = vi.fn().mockReturnThis();
        this.build = vi.fn(() => ({ built: true }));
      });
      globalThis.$mapLogs = { loot: { addLog: vi.fn() } };
    });

    it('does nothing when logging is disabled', () =>
    {
      globalThis.J.LOG = false;
      const engine = new JABS_Engine();

      engine.createLootLog({ id: 1, itypeId: 1 });

      expect(globalThis.$mapLogs.loot.addLog).not.toHaveBeenCalled();
      globalThis.J.LOG = true;
    });

    it('logs an armor drop', () =>
    {
      globalThis.J.LOG = true;
      const engine = new JABS_Engine();

      engine.createLootLog({ id: 1, atypeId: 2 });

      expect(globalThis.LootLogBuilder.mock.results[0].value.setupLootObtained).toHaveBeenCalledWith('armor', 1);
    });

    it('logs a weapon drop', () =>
    {
      globalThis.J.LOG = true;
      const engine = new JABS_Engine();

      engine.createLootLog({ id: 1, wtypeId: 3 });

      expect(globalThis.LootLogBuilder.mock.results[0].value.setupLootObtained).toHaveBeenCalledWith('weapon', 1);
    });

    it('logs an item drop', () =>
    {
      globalThis.J.LOG = true;
      const engine = new JABS_Engine();

      engine.createLootLog({ id: 1, itypeId: 4 });

      expect(globalThis.LootLogBuilder.mock.results[0].value.setupLootObtained).toHaveBeenCalledWith('item', 1);
    });

    it('logs an empty loot type when none of the recognized type flags are present', () =>
    {
      globalThis.J.LOG = true;
      const engine = new JABS_Engine();

      engine.createLootLog({ id: 5 });

      expect(globalThis.LootLogBuilder.mock.results[0].value.setupLootObtained).toHaveBeenCalledWith(String.empty, 5);
    });
  });

  describe('onItemPickedUp', () =>
  {
    it('is a no-op', () =>
    {
      const engine = new JABS_Engine();
      expect(() => engine.onItemPickedUp([ 'item' ], {})).not.toThrow();
    });
  });

  describe('battlerLevelup', () =>
  {
    it('does nothing when no battler is found for the uuid', async () =>
    {
      const { default: JABS_AiManager } = await import('../../../../../src/plugins/abs/core/managers/JABS_AiManager.js');
      JABS_AiManager.getBattlerByUuid = vi.fn(() => null);
      const engine = new JABS_Engine();
      engine.playLevelUpAnimation = vi.fn();
      engine.createLevelUpLog = vi.fn();

      engine.battlerLevelup('uuid');

      expect(engine.playLevelUpAnimation).not.toHaveBeenCalled();
      expect(engine.createLevelUpLog).not.toHaveBeenCalled();
    });

    it('plays the level-up animation and logs the level-up when the battler is found', async () =>
    {
      const { default: JABS_AiManager } = await import('../../../../../src/plugins/abs/core/managers/JABS_AiManager.js');
      const character = {};
      const battler = { getCharacter: () => character };
      JABS_AiManager.getBattlerByUuid = vi.fn(() => battler);
      const engine = new JABS_Engine();
      engine.playLevelUpAnimation = vi.fn();
      engine.createLevelUpLog = vi.fn();

      engine.battlerLevelup('uuid');

      expect(engine.playLevelUpAnimation).toHaveBeenCalledWith(character);
      expect(engine.createLevelUpLog).toHaveBeenCalledWith(battler);
    });
  });

  describe('createLevelUpLog', () =>
  {
    it('does nothing when logging is disabled', () =>
    {
      globalThis.J.LOG = false;
      const engine = new JABS_Engine();
      engine.configureLevelUpLog = vi.fn();
      const jabsBattler = { getBattler: () => ({ name: () => 'Hero', level: 5 }) };

      engine.createLevelUpLog(jabsBattler);

      expect(engine.configureLevelUpLog).not.toHaveBeenCalled();
      globalThis.J.LOG = true;
    });

    it('configures and logs the level-up when logging is enabled', () =>
    {
      globalThis.J.LOG = true;
      globalThis.$mapLogs = { action: { addLog: vi.fn() } };
      const engine = new JABS_Engine();
      engine.configureLevelUpLog = vi.fn(() => ({ built: true }));
      const jabsBattler = { getBattler: () => ({ name: () => 'Hero', level: 5 }) };

      engine.createLevelUpLog(jabsBattler);

      expect(engine.configureLevelUpLog).toHaveBeenCalledWith('Hero', 5);
      expect(globalThis.$mapLogs.action.addLog).toHaveBeenCalledWith({ built: true });
    });
  });

  describe('configureLevelUpLog', () =>
  {
    it('builds a level-up log entry', () =>
    {
      globalThis.ActionLogBuilder = vi.fn(function()
      {
        this.setupLevelUp = vi.fn().mockReturnThis();
        this.build = vi.fn(() => ({ built: true }));
      });
      const engine = new JABS_Engine();

      const result = engine.configureLevelUpLog('Hero', 5);

      expect(globalThis.ActionLogBuilder.mock.results[0].value.setupLevelUp).toHaveBeenCalledWith('Hero', 5);
      expect(result).toEqual({ built: true });
    });
  });

  describe('playLevelUpAnimation', () =>
  {
    it('requests the level-up animation on the character', () =>
    {
      const engine = new JABS_Engine();
      const character = { requestAnimation: vi.fn() };

      engine.playLevelUpAnimation(character);

      expect(character.requestAnimation).toHaveBeenCalledWith(49);
    });
  });

  describe('battlerSkillLearn', () =>
  {
    it('does nothing when no battler is found for the uuid', async () =>
    {
      const { default: JABS_AiManager } = await import('../../../../../src/plugins/abs/core/managers/JABS_AiManager.js');
      JABS_AiManager.getBattlerByUuid = vi.fn(() => null);
      const engine = new JABS_Engine();
      engine.createSkillLearnLog = vi.fn();

      engine.battlerSkillLearn({ id: 1 }, 'uuid');

      expect(engine.createSkillLearnLog).not.toHaveBeenCalled();
    });

    it('logs the skill learn when the battler is found', async () =>
    {
      const { default: JABS_AiManager } = await import('../../../../../src/plugins/abs/core/managers/JABS_AiManager.js');
      const battler = { getCharacter: () => ({}) };
      JABS_AiManager.getBattlerByUuid = vi.fn(() => battler);
      const engine = new JABS_Engine();
      engine.createSkillLearnLog = vi.fn();
      const skill = { id: 1 };

      engine.battlerSkillLearn(skill, 'uuid');

      expect(engine.createSkillLearnLog).toHaveBeenCalledWith(skill, battler);
    });
  });

  describe('createSkillLearnLog', () =>
  {
    it('does nothing when logging is disabled', () =>
    {
      globalThis.J.LOG = false;
      const engine = new JABS_Engine();
      engine.configureSkillLearnLog = vi.fn();
      const player = { getBattlerDatabaseData: () => ({ name: 'Hero' }) };

      engine.createSkillLearnLog({ id: 1 }, player);

      expect(engine.configureSkillLearnLog).not.toHaveBeenCalled();
      globalThis.J.LOG = true;
    });

    it('configures and logs the skill learn when logging is enabled', () =>
    {
      globalThis.J.LOG = true;
      globalThis.$mapLogs = { action: { addLog: vi.fn() } };
      const engine = new JABS_Engine();
      engine.configureSkillLearnLog = vi.fn(() => ({ built: true }));
      const player = { getBattlerDatabaseData: () => ({ name: 'Hero' }) };

      engine.createSkillLearnLog({ id: 7 }, player);

      expect(engine.configureSkillLearnLog).toHaveBeenCalledWith('Hero', 7);
      expect(globalThis.$mapLogs.action.addLog).toHaveBeenCalledWith({ built: true });
    });
  });

  describe('configureSkillLearnLog', () =>
  {
    it('builds a skill-learn log entry', () =>
    {
      globalThis.ActionLogBuilder = vi.fn(function()
      {
        this.setupSkillLearn = vi.fn().mockReturnThis();
        this.build = vi.fn(() => ({ built: true }));
      });
      const engine = new JABS_Engine();

      const result = engine.configureSkillLearnLog('Hero', 7);

      expect(globalThis.ActionLogBuilder.mock.results[0].value.setupSkillLearn).toHaveBeenCalledWith('Hero', 7);
      expect(result).toEqual({ built: true });
    });
  });
  //endregion defeated target aftermath
});
//endregion plugins/abs/core/managers/jabs-engine.test.js
