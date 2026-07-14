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
        },
      },
      LEVEL: false,
    };

    // bare RMMZ-style global (not imported by JABS_Engine.js- loaded elsewhere at runtime).
    globalThis.JABS_Button = { Offhand: 'offhand', Mainhand: 'mainhand' };

    // sibling model/manager dependencies- mocked entirely per the unit-tier convention.
    vi.doMock('../../../../../src/plugins/abs/core/managers/JABS_TeamRules.js', () => ({ default: class {} }));
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
    vi.doMock('../../../../../src/plugins/abs/core/models/JABS_LootDrop.js', () => ({ default: class {} }));
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
    vi.doMock('../../../../../src/plugins/abs/core/models/JABS_GlobalCooldown.js', () => ({ default: class {} }));
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
          };
          builder.build = vi.fn(() => built);
          return builder;
        }
      },
    }));
    vi.doMock('../../../../../src/plugins/abs/core/models/JABS_Action.js', () => ({ default: class {} }));
    vi.doMock('../../../../../src/plugins/abs/core/models/JABS_Aabb.js', () => ({ default: FakeAabb }));
    vi.doMock('../../../../../src/plugins/abs/core/models/JABS_DeathContext.js', () => ({ default: class {} }));

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
      await new Promise((resolve) => setTimeout(resolve, 0));

      // Assert
      expect(globalThis.fetch).toHaveBeenCalledWith('data/Map005.json');
      expect(JABS_Engine.getEnemyCloneList()).toBe(events);
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

    it('KNOWN BUG: never actually seeds hitboxOverlaysVisible from metadata on first construction, since the class field default (`hitboxOverlaysVisible = false`) already makes `this.hitboxOverlaysVisible` non-nullish before initialize() runs- `false ?? metadataDefault` short-circuits to `false` regardless of the configured metadata value. The metadata default only takes effect via the unconditional non-transfer branch (initialize(false))', () =>
    {
      globalThis.J.ABS.Metadata.HitboxOverlaysInitiallyVisible = true;
      const engine = new JABS_Engine();
      expect(engine.hitboxOverlaysVisible).toBe(false);

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
        battler: { deathStateId: () => 99, state: () => ({ jabsNegative: false }) },
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
          battler: { deathStateId: () => 99, state: () => ({ jabsNegative: false }) },
        });
        engine.addJabsStateByUuid('uuid-1', positiveState);
        expect(engine.getPositiveJabsStatesByUuid('uuid-1')).toEqual([ positiveState ]);
        expect(engine.getNegativeJabsStatesByUuid('uuid-1')).toEqual([]);
      });

      it('classifies a negative-tagged state as negative', () =>
      {
        const engine = new JABS_Engine();
        const negativeState = buildTrackedState({
          battler: { deathStateId: () => 99, state: () => ({ jabsNegative: true }) },
        });
        engine.addJabsStateByUuid('uuid-1', negativeState);
        expect(engine.getNegativeJabsStatesByUuid('uuid-1')).toEqual([ negativeState ]);
        expect(engine.getPositiveJabsStatesByUuid('uuid-1')).toEqual([]);
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

        expect(jabsState.battler.addState).toHaveBeenCalledWith(9, jabsState.battler);
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

        expect(jabsState.battler.addState).toHaveBeenCalledWith(42, jabsState.battler);
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

    it('handles defeat when the battler qualifies as defeated after updating', () =>
    {
      const engine = new JABS_Engine();
      const player1 = { id: 'player1' };
      engine.setPlayer1(player1);
      engine.shouldHandleDefeatedTarget = () => true;
      engine.handleDefeatedTarget = vi.fn();
      const battler = { update: vi.fn(), setInvincible: vi.fn() };

      engine.performAiBattlerUpdate(battler);

      expect(battler.setInvincible).toHaveBeenCalledTimes(1);
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
    it('does nothing when input updates are not allowed', () =>
    {
      const engine = new JABS_Engine();
      engine.canUpdateInput = () => false;
      vi.spyOn(console, 'warn').mockImplementation(() => {});
      engine.updateInput();
      expect(console.warn).not.toHaveBeenCalled();
      console.warn.mockRestore();
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
      globalThis.$jabsEngine = { requestAbsMenu: false, absPause: false, absEnabled: true, ...overrides };
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

    it('is false while the jabs menu is requested', () =>
    {
      withGates({ requestAbsMenu: true });
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

    describe('handlePartyCycleMemberChanges', () =>
    {
      it('rotates the party array until landing on a living, unlocked member', () =>
      {
        // Arrange- 3 actors; actor 1 (self, skipped), actor 2 (dead, skipped), actor 3 (eligible).
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

        engine.handlePartyCycleMemberChanges();

        // rotation stops once actor 3 lands at the front (after 2 rotations: [2,3,1] then [3,1,2]).
        expect(globalThis.$gameParty._actors[0]).toBe(3);
        expect(globalThis.$gamePlayer.refresh).toHaveBeenCalledTimes(1);
        expect(engine.refreshPlayer1Data).toHaveBeenCalledTimes(1);
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
        globalThis.$actionLogManager = { addLog: vi.fn() };
        const engine = new JABS_Engine();
        engine.setPlayer1({ battlerName: () => 'Hero' });

        engine.partyCycleLogging();

        expect(globalThis.$actionLogManager.addLog).toHaveBeenCalledWith({ built: true });
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

      const [ , actualOptions ] = caster.createJabsActionFromSkill.mock.calls[0];
      expect(actualOptions.isRetaliation).toBe(true);
      expect(actualOptions.isTerrainDamage).toBe(true);
      expect(actualOptions.location.getX()).toBe(3);
      expect(actualOptions.location.getY()).toBe(4);
      expect(engine.executeMapAction).toHaveBeenCalledWith(caster, action1, 3, 4);
      expect(engine.executeMapAction).toHaveBeenCalledWith(caster, action2, 3, 4);
    });

    it('does not execute anything when the generated actions cannot be executed', () =>
    {
      const engine = new JABS_Engine();
      const caster = { createJabsActionFromSkill: () => [] };
      engine.executeMapAction = vi.fn();

      engine.forceMapAction(caster, 5);

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

      expect(caster.executeGuard).toHaveBeenCalledWith(false, 'offhand');
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
    it('applies all four on-cast state effect hooks against the underlying Game_Action', () =>
    {
      const engine = new JABS_Engine();
      const gameAction = {
        applyOnCastSelfStates: vi.fn(),
        applyOnCastSelfStatesIfAfflicted: vi.fn(),
        applyOnCastLoseStates: vi.fn(),
        applyToggleOnExecuteStates: vi.fn(),
      };
      const action = { getAction: () => gameAction };

      engine.handleOnCastStateEffects('caster', action);

      expect(gameAction.applyOnCastSelfStates).toHaveBeenCalledTimes(1);
      expect(gameAction.applyOnCastSelfStatesIfAfflicted).toHaveBeenCalledTimes(1);
      expect(gameAction.applyOnCastLoseStates).toHaveBeenCalledTimes(1);
      expect(gameAction.applyToggleOnExecuteStates).toHaveBeenCalledTimes(1);
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
  });
  //endregion actions: update/execute
});
//endregion plugins/abs/core/managers/jabs-engine.test.js
