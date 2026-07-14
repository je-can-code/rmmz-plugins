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

    // sibling model/manager dependencies- mocked entirely per the unit-tier convention.
    vi.doMock('../../../../../src/plugins/abs/core/managers/JABS_TeamRules.js', () => ({ default: class {} }));
    vi.doMock('../../../../../src/plugins/abs/core/models/JABS_SkillExecution.js', () => ({ default: class {} }));
    vi.doMock('../../../../../src/plugins/abs/core/models/JABS_State.js', () => ({ default: class {} }));
    vi.doMock('../../../../../src/plugins/abs/core/models/JABS_Timer.js', () => ({
      default: class
      {
        constructor(maxTime)
        {
          this.maxTime = maxTime;
        }
      },
    }));
    vi.doMock('../../../../../src/plugins/abs/core/models/JABS_LootDrop.js', () => ({ default: class {} }));
    vi.doMock('../../../../../src/plugins/abs/core/models/JABS_Location.js', () => ({ default: class {} }));
    vi.doMock('../../../../../src/plugins/abs/core/models/JABS_InputAdapter.js', () => ({ default: class {} }));
    vi.doMock('../../../../../src/plugins/abs/core/models/JABS_GlobalCooldown.js', () => ({ default: class {} }));
    vi.doMock('../../../../../src/plugins/abs/core/models/JABS_Battler.js', () => ({ default: class {} }));
    vi.doMock('../../../../../src/plugins/abs/core/managers/JABS_AiManager.js', () => ({ default: class {} }));
    vi.doMock('../../../../../src/plugins/abs/core/models/JABS_ActionOptions.js', () => ({ default: class {} }));
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
});
//endregion plugins/abs/core/managers/jabs-engine.test.js
