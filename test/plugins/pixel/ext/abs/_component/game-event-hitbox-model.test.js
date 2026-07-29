//region plugins/pixel/ext/abs/_component/game-event-hitbox-model.test.js
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  installPixelAbsExtHostGlobals,
  installPixelCoreHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJPixel,
  setPluginContextToJPixelAbsExt,
} from '../../../_component/fixtures/install-pixel-host-globals.js';

describe('J-ABS-Pixelistics Game_Event hitbox model (direct src import)', () =>
{
  /** @type {object} the patched prototype, invoked with `.call` against plain stand-ins. */
  let proto;
  /** @type {Map<string, Function>} */
  let aliasMap;
  let previousGameMap;
  let previousEnemies;

  beforeAll(async () =>
  {
    vi.resetModules();

    installPixelCoreHostGlobals();

    setPluginContextToJBase();
    await import('../../../../../../src/plugins/_base/_metadata/initialization.js');

    setPluginContextToJPixel();
    await import('../../../../../../src/plugins/pixel/core/_metadata/initialization.js');

    ({ default: globalThis.PIXEL_CollisionManager } = await import('../../../../../../src/plugins/pixel/core/managers/PIXEL_CollisionManager.js'));
    globalThis.PIXEL_CollisionManager.initConfig();
    globalThis.PIXEL_CollisionManager.setupCollision();

    installPixelAbsExtHostGlobals();

    setPluginContextToJPixelAbsExt();
    await import('../../../../../../src/plugins/pixel/ext/abs/_metadata/initialization.js');

    // the tile-space AABB builder lives on PIXEL core's Game_CharacterBase, which this event
    // inherits from; the ext layer only supplies the hitbox and pivot overrides that feed it.
    await import('../../../../../../src/plugins/pixel/core/objects/Game_CharacterBase.js');

    await import('../../../../../../src/plugins/pixel/ext/abs/database/RPG_Enemy.js');
    await import('../../../../../../src/plugins/pixel/ext/abs/objects/Game_Event.js');

    proto = globalThis.Game_Event.prototype;
    aliasMap = globalThis.J.PIXEL.EXT.ABS.Aliased.Game_Event;
  });

  beforeEach(() =>
  {
    previousGameMap = globalThis.$gameMap;
    previousEnemies = globalThis.$gameEnemies;
  });

  afterEach(() =>
  {
    globalThis.$gameMap = previousGameMap;
    globalThis.$gameEnemies = previousEnemies;
  });

  /**
   * Builds an event stand-in that has no hitbox cache yet.
   *
   * These methods call *each other* through `this`, so a stand-in has to inherit from the patched
   * prototype rather than being a bare object literal- otherwise the first internal hop dies on
   * "this.initPixelAbsHitboxData is not a function".
   *
   * @param {object} [overrides] Properties to replace on the built event.
   * @returns {object}
   */
  const buildBareEvent = (overrides = {}) => Object.assign(Object.create(proto), overrides);

  /**
   * Builds an event stand-in with a pre-initialized hitbox cache.
   * @param {object} [overrides] Properties to replace on the built event.
   * @returns {object}
   */
  const buildEvent = (overrides = {}) => buildBareEvent(Object.assign({
    x: 0,
    y: 0,
    _j: { _pixel: { _abs: { _hitboxSizeData: null, _hitboxRevealRange: null } } },
    isJabsBattler: () => true,
    getBattlerId: () => 1,
  }, overrides));

  describe('initPixelAbsHitboxData', () =>
  {
    it('builds the nested cache structure from nothing', () =>
    {
      // Arrange- a bare event has no `_j` at all until a plugin creates it.
      const event = {};

      // Act
      proto.initPixelAbsHitboxData.call(event);

      // Assert
      expect(event._j._pixel._abs._hitboxSizeData).toBe(null);
      expect(event._j._pixel._abs._hitboxRevealRange).toBe(null);
    });

    it('preserves sibling data already stored under the shared namespace', () =>
    {
      // Arrange- `_j` is shared across every J plugin, so this must add to it rather than replace it.
      const event = { _j: { _someOtherPlugin: 'keep me' } };

      // Act
      proto.initPixelAbsHitboxData.call(event);

      // Assert
      expect(event._j._someOtherPlugin).toBe('keep me');
      expect(event._j._pixel._abs).toBeDefined();
    });
  });

  describe('getPixelAbsHitboxSizeData', () =>
  {
    it('returns the cached size data', () =>
    {
      // Arrange
      const event = buildEvent();
      event._j._pixel._abs._hitboxSizeData = { widthTiles: 2, heightTiles: 3 };

      // Act
      const result = proto.getPixelAbsHitboxSizeData.call(event);

      // Assert
      expect(result).toEqual({ widthTiles: 2, heightTiles: 3 });
    });

    it('reports null when nothing has been cached yet', () =>
    {
      // Arrange
      const event = buildEvent({ isJabsBattler: () => true });

      // Act
      const result = proto.getPixelAbsHitboxSizeData.call(event);

      // Assert
      expect(result).toBe(null);
    });
  });

  describe('setPixelAbsHitboxSizeData', () =>
  {
    it('stores a defensive copy rather than the caller object', () =>
    {
      // Arrange- keeping the caller's object would let later external mutation silently resize a
      // battler's hitbox mid-fight.
      const event = buildEvent();
      const incoming = { widthTiles: 2, heightTiles: 3 };

      // Act
      proto.setPixelAbsHitboxSizeData.call(event, incoming);
      incoming.widthTiles = 99;

      // Assert
      expect(event._j._pixel._abs._hitboxSizeData).toEqual({ widthTiles: 2, heightTiles: 3 });
    });

    it('stores null to mean "use the vanilla footprint"', () =>
    {
      // Arrange
      const event = buildEvent();
      event._j._pixel._abs._hitboxSizeData = { widthTiles: 2, heightTiles: 3 };

      // Act
      proto.setPixelAbsHitboxSizeData.call(event, null);

      // Assert
      expect(event._j._pixel._abs._hitboxSizeData).toBe(null);
    });

  });

  describe('getPixelAbsHitboxRevealRange / setPixelAbsHitboxRevealRange', () =>
  {
    it('round-trips a reveal range through the cache', () =>
    {
      // Arrange
      const event = buildEvent();

      // Act
      proto.setPixelAbsHitboxRevealRange.call(event, 4);
      const result = proto.getPixelAbsHitboxRevealRange.call(event);

      // Assert
      expect(result).toBe(4);
    });

    it('reports null before any reveal range is stored', () =>
    {
      // Arrange
      const event = buildEvent();

      // Act
      const result = proto.getPixelAbsHitboxRevealRange.call(event);

      // Assert
      expect(result).toBe(null);
    });
  });

  describe('canUsePixelAbsEnemyHitboxData', () =>
  {
    it('rejects an event that is not a JABS battler', () =>
    {
      // Arrange- ordinary map events (doors, NPCs) have no enemy hitbox model.
      const event = buildEvent({ isJabsBattler: () => false });

      // Act & Assert
      expect(proto.canUsePixelAbsEnemyHitboxData.call(event)).toBe(false);
    });

    it('rejects a battler whose enemy id is not valid', () =>
    {
      // Arrange- actor-side battlers report a non-positive enemy id and have no enemy database row.
      const event = buildEvent({ getBattlerId: () => 0 });

      // Act & Assert
      expect(proto.canUsePixelAbsEnemyHitboxData.call(event)).toBe(false);
    });

    it('accepts an enemy battler with a valid id', () =>
    {
      // Arrange
      const event = buildEvent();

      // Act & Assert
      expect(proto.canUsePixelAbsEnemyHitboxData.call(event)).toBe(true);
    });
  });

  describe('canUsePixelAbsHitboxSize', () =>
  {
    it('mirrors the enemy hitbox eligibility check', () =>
    {
      // Arrange- this is a named alias so callers read clearly; it must not drift from its source.
      const event = buildEvent({ isJabsBattler: () => false });

      // Act & Assert
      expect(proto.canUsePixelAbsHitboxSize.call(event)).toBe(false);
      expect(proto.canUsePixelAbsHitboxSize.call(buildEvent())).toBe(true);
    });
  });

  describe('hasCustomPixelHitbox', () =>
  {
    it('reports true once size data is resolved', () =>
    {
      // Arrange
      const event = buildEvent();
      event._j._pixel._abs._hitboxSizeData = { widthTiles: 2, heightTiles: 2 };

      // Act & Assert
      expect(proto.hasCustomPixelHitbox.call(event)).toBe(true);
    });

    it('reports false while size data is absent', () =>
    {
      // Arrange
      const event = buildEvent();

      // Act & Assert
      expect(proto.hasCustomPixelHitbox.call(event)).toBe(false);
    });
  });

  describe('getPixelAbsEnemyData', () =>
  {
    it('returns null for a non-positive battler id', () =>
    {
      // Arrange
      const event = buildEvent({ getBattlerId: () => 0 });

      // Act & Assert
      expect(proto.getPixelAbsEnemyData.call(event)).toBe(null);
    });

    it('returns null when the enemy wrapper cannot be resolved', () =>
    {
      // Arrange- a battler id pointing at a deleted database row yields no wrapper.
      const event = buildEvent();
      globalThis.$gameEnemies = { enemy: () => null };

      // Act & Assert
      expect(proto.getPixelAbsEnemyData.call(event)).toBe(null);
    });

    it('returns the hydrated database row behind the wrapper', () =>
    {
      // Arrange
      const enemyData = { hitboxSizeData: { widthTiles: 3, heightTiles: 4 }, hitboxRevealRange: 6 };
      const event = buildEvent();
      globalThis.$gameEnemies = { enemy: () => ({ enemy: () => enemyData }) };

      // Act & Assert
      expect(proto.getPixelAbsEnemyData.call(event)).toBe(enemyData);
    });
  });

  describe('enemy fallbacks', () =>
  {
    it('yields no size fallback when there is no enemy data', () =>
    {
      // Arrange
      const event = buildEvent({ getBattlerId: () => 0 });

      // Act & Assert
      expect(proto.getPixelAbsHitboxSizeEnemyFallback.call(event)).toBe(null);
    });

    it('yields the enemy size data when it is available', () =>
    {
      // Arrange
      const event = buildEvent();
      globalThis.$gameEnemies = {
        enemy: () => ({ enemy: () => ({ hitboxSizeData: { widthTiles: 3, heightTiles: 4 } }) }),
      };

      // Act & Assert
      expect(proto.getPixelAbsHitboxSizeEnemyFallback.call(event)).toEqual({ widthTiles: 3, heightTiles: 4 });
    });

    it('yields no reveal fallback when there is no enemy data', () =>
    {
      // Arrange
      const event = buildEvent({ getBattlerId: () => 0 });

      // Act & Assert
      expect(proto.getPixelAbsHitboxRevealEnemyFallback.call(event)).toBe(null);
    });

    it('yields the enemy reveal range when it is available', () =>
    {
      // Arrange
      const event = buildEvent();
      globalThis.$gameEnemies = { enemy: () => ({ enemy: () => ({ hitboxRevealRange: 6 }) }) };

      // Act & Assert
      expect(proto.getPixelAbsHitboxRevealEnemyFallback.call(event)).toBe(6);
    });
  });

  describe('refreshPixelAbsHitboxSizeData', () =>
  {
    it('clears the cache for an event that is not an eligible battler', () =>
    {
      // Arrange
      const event = buildEvent({ isJabsBattler: () => false });
      event._j._pixel._abs._hitboxSizeData = { widthTiles: 9, heightTiles: 9 };

      // Act
      proto.refreshPixelAbsHitboxSizeData.call(event);

      // Assert
      expect(event._j._pixel._abs._hitboxSizeData).toBe(null);
    });

    it('prefers an event comment override above everything else', () =>
    {
      // Arrange- a per-event comment is the most specific authoring surface and must win.
      const event = buildEvent({
        getPixelAbsHitboxSizeCommentOverride: () => ({ widthTiles: 1, heightTiles: 2 }),
        getPixelAbsHitboxSizeEnemyFallback: () => ({ widthTiles: 5, heightTiles: 5 }),
      });

      // Act
      proto.refreshPixelAbsHitboxSizeData.call(event);

      // Assert
      expect(event._j._pixel._abs._hitboxSizeData).toEqual({ widthTiles: 1, heightTiles: 2 });
    });

    it('falls back to the enemy database row when there is no comment', () =>
    {
      // Arrange
      const event = buildEvent({
        getPixelAbsHitboxSizeCommentOverride: () => null,
        getPixelAbsHitboxSizeEnemyFallback: () => ({ widthTiles: 5, heightTiles: 5 }),
      });

      // Act
      proto.refreshPixelAbsHitboxSizeData.call(event);

      // Assert
      expect(event._j._pixel._abs._hitboxSizeData).toEqual({ widthTiles: 5, heightTiles: 5 });
    });

    it('falls back to the plugin default when neither source supplies a size', () =>
    {
      // Arrange
      const event = buildEvent({
        getPixelAbsHitboxSizeCommentOverride: () => null,
        getPixelAbsHitboxSizeEnemyFallback: () => null,
      });
      const { DefaultEnemyHitboxWidth, DefaultEnemyHitboxHeight } = globalThis.J.PIXEL.EXT.ABS.Metadata;

      // Act
      proto.refreshPixelAbsHitboxSizeData.call(event);

      // Assert
      expect(event._j._pixel._abs._hitboxSizeData).toEqual({
        widthTiles: DefaultEnemyHitboxWidth,
        heightTiles: DefaultEnemyHitboxHeight,
      });
    });
  });

  describe('refreshPixelAbsHitboxRevealRange', () =>
  {
    it('clears the range for an event that is not an eligible battler', () =>
    {
      // Arrange
      const event = buildEvent({ isJabsBattler: () => false });
      event._j._pixel._abs._hitboxRevealRange = 9;

      // Act
      proto.refreshPixelAbsHitboxRevealRange.call(event);

      // Assert
      expect(event._j._pixel._abs._hitboxRevealRange).toBe(null);
    });

    it('prefers an event comment override', () =>
    {
      // Arrange
      const event = buildEvent({
        getPixelAbsHitboxRevealCommentOverride: () => 3,
        getPixelAbsHitboxRevealEnemyFallback: () => 8,
      });

      // Act
      proto.refreshPixelAbsHitboxRevealRange.call(event);

      // Assert
      expect(event._j._pixel._abs._hitboxRevealRange).toBe(3);
    });

    it('falls back to the enemy database row when there is no comment', () =>
    {
      // Arrange
      const event = buildEvent({
        getPixelAbsHitboxRevealCommentOverride: () => null,
        getPixelAbsHitboxRevealEnemyFallback: () => 8,
      });

      // Act
      proto.refreshPixelAbsHitboxRevealRange.call(event);

      // Assert
      expect(event._j._pixel._abs._hitboxRevealRange).toBe(8);
    });

    it('falls back to the plugin default when neither source supplies a range', () =>
    {
      // Arrange
      const event = buildEvent({
        getPixelAbsHitboxRevealCommentOverride: () => null,
        getPixelAbsHitboxRevealEnemyFallback: () => null,
      });

      // Act
      proto.refreshPixelAbsHitboxRevealRange.call(event);

      // Assert
      expect(event._j._pixel._abs._hitboxRevealRange)
        .toBe(globalThis.J.PIXEL.EXT.ABS.Metadata.DefaultEnemyHitboxRevealRange);
    });

    it('treats a comment override of zero as an explicit answer, not a missing one', () =>
    {
      // Arrange- zero disables the reveal for this battler specifically. A truthiness check here
      // would skip past it and wrongly apply the enemy or plugin default instead.
      const event = buildEvent({
        getPixelAbsHitboxRevealCommentOverride: () => 0,
        getPixelAbsHitboxRevealEnemyFallback: () => 8,
      });

      // Act
      proto.refreshPixelAbsHitboxRevealRange.call(event);

      // Assert
      expect(event._j._pixel._abs._hitboxRevealRange).toBe(0);
    });
  });

  describe('canShowPixelAbsHitboxReveal', () =>
  {
    /**
     * Builds an eligible battler event with a resolved reveal range.
     * @param {object} overrides Scenario-specific members.
     * @returns {object}
     */
    const buildRevealEvent = overrides => buildEvent(Object.assign({
      getJabsBattler: () => ({ isInvincible: () => false }),
      isPixelAbsHitboxRevealAlwaysActive: () => false,
      getPixelAbsHitboxRevealRange: () => 5,
      distanceFromPlayer: () => 3,
    }, overrides));

    it('refuses for an event that is not an eligible battler', () =>
    {
      // Arrange
      const event = buildRevealEvent({ isJabsBattler: () => false });

      // Act & Assert
      expect(proto.canShowPixelAbsHitboxReveal.call(event)).toBe(false);
    });

    it('refuses when the event has no JABS battler attached', () =>
    {
      // Arrange- an event mid-teardown can be eligible by id yet already have lost its battler.
      const event = buildRevealEvent({ getJabsBattler: () => null });

      // Act & Assert
      expect(proto.canShowPixelAbsHitboxReveal.call(event)).toBe(false);
    });

    it('refuses for an invincible battler', () =>
    {
      // Arrange- the outline advertises where to strike, which is misleading on something that
      // cannot be struck.
      const event = buildRevealEvent({ getJabsBattler: () => ({ isInvincible: () => true }) });

      // Act & Assert
      expect(proto.canShowPixelAbsHitboxReveal.call(event)).toBe(false);
    });

    it('always shows when the always-active setting is on, ignoring range', () =>
    {
      // Arrange
      const event = buildRevealEvent({
        isPixelAbsHitboxRevealAlwaysActive: () => true,
        getPixelAbsHitboxRevealRange: () => 0,
        distanceFromPlayer: () => 999,
      });

      // Act & Assert
      expect(proto.canShowPixelAbsHitboxReveal.call(event)).toBe(true);
    });

    it('refuses when the resolved range disables the feature', () =>
    {
      // Arrange
      const event = buildRevealEvent({ getPixelAbsHitboxRevealRange: () => 0 });

      // Act & Assert
      expect(proto.canShowPixelAbsHitboxReveal.call(event)).toBe(false);
    });

    it('shows when the player is inside the reveal range', () =>
    {
      // Arrange
      const event = buildRevealEvent({ distanceFromPlayer: () => 4 });

      // Act & Assert
      expect(proto.canShowPixelAbsHitboxReveal.call(event)).toBe(true);
    });

    it('shows at exactly the reveal range boundary', () =>
    {
      // Arrange- the comparison is inclusive, so standing precisely on the edge still reveals.
      const event = buildRevealEvent({ distanceFromPlayer: () => 5 });

      // Act & Assert
      expect(proto.canShowPixelAbsHitboxReveal.call(event)).toBe(true);
    });

    it('hides when the player is beyond the reveal range', () =>
    {
      // Arrange
      const event = buildRevealEvent({ distanceFromPlayer: () => 6 });

      // Act & Assert
      expect(proto.canShowPixelAbsHitboxReveal.call(event)).toBe(false);
    });
  });

  describe('geometry derived from the resolved rectangle', () =>
  {
    /**
     * Builds an event carrying a resolved two-by-three rectangle.
     * @param {object} [overrides] Extra members.
     * @returns {object}
     */
    const buildSizedEvent = (overrides = {}) =>
    {
      const event = buildEvent(overrides);
      event._j._pixel._abs._hitboxSizeData = { widthTiles: 2, heightTiles: 3 };

      return event;
    };

    it('derives the compatibility radius from the larger half-extent', () =>
    {
      // Arrange- PIXEL still asks for a scalar in places, and the larger half-extent is the only
      // value that never under-reports the rectangle.
      const event = buildSizedEvent();

      // Act & Assert
      expect(proto.getCollisionRadius.call(event)).toBe(1.5);
    });

    it('defers the radius to the original when no rectangle is resolved', () =>
    {
      // Arrange
      const original = vi.fn(() => 0.42);
      const realOriginal = aliasMap.get('getCollisionRadius');
      aliasMap.set('getCollisionRadius', original);
      const event = buildEvent();

      // Act
      const result = proto.getCollisionRadius.call(event);

      // Assert
      expect(result).toBe(0.42);

      aliasMap.set('getCollisionRadius', realOriginal);
    });

    it('reuses the compatibility radius as the effective radius', () =>
    {
      // Arrange- feet-anchored rectangles are already normalized, so the legacy downward-bleed clamp
      // must not be reapplied on top of them.
      const event = buildSizedEvent();

      // Act & Assert
      expect(proto.getEffectiveRadius.call(event)).toBe(1.5);
    });

    it('defers the effective radius to the original when no rectangle is resolved', () =>
    {
      // Arrange
      const original = vi.fn(() => 0.31);
      const realOriginal = aliasMap.get('getEffectiveRadius');
      aliasMap.set('getEffectiveRadius', original);
      const event = buildEvent();

      // Act
      const result = proto.getEffectiveRadius.call(event);

      // Assert
      expect(result).toBe(0.31);

      aliasMap.set('getEffectiveRadius', realOriginal);
    });

    it('anchors the vertical pivot at the tile bottom edge', () =>
    {
      // Arrange- enemy rectangles hang from the feet, so the pivot sits a full tile down.
      const event = buildSizedEvent();

      // Act & Assert
      expect(proto.getCollisionPivotY.call(event)).toBe(1.0);
    });

    it('defers the vertical pivot to the original when no rectangle is resolved', () =>
    {
      // Arrange
      const original = vi.fn(() => 0.5);
      const realOriginal = aliasMap.get('getCollisionPivotY');
      aliasMap.set('getCollisionPivotY', original);
      const event = buildEvent();

      // Act
      const result = proto.getCollisionPivotY.call(event);

      // Assert
      expect(result).toBe(0.5);

      aliasMap.set('getCollisionPivotY', realOriginal);
    });

    it('builds a feet-anchored, horizontally-centred hitbox', () =>
    {
      // Arrange- the offsets place the rectangle centred on x and hanging upward from the feet.
      const event = buildSizedEvent();

      // Act
      const hitbox = proto._pixelHitbox.call(event, 0.5);

      // Assert
      expect(hitbox).toEqual({ w: 2, h: 3, hx: -1, hy: -3 });
    });

    it('defers the hitbox to the original when no rectangle is resolved', () =>
    {
      // Arrange
      const original = vi.fn(() => ({ w: 1, h: 1, hx: 0, hy: 0 }));
      const realOriginal = aliasMap.get('_pixelHitbox');
      aliasMap.set('_pixelHitbox', original);
      const event = buildEvent();

      // Act
      const result = proto._pixelHitbox.call(event, 0.75);

      // Assert
      expect(original).toHaveBeenCalledWith(0.75);
      expect(result).toEqual({ w: 1, h: 1, hx: 0, hy: 0 });

      aliasMap.set('_pixelHitbox', realOriginal);
    });

    it('builds the tile-space AABB from the event position by default', () =>
    {
      // Arrange
      const event = buildSizedEvent({
        x: 10,
        y: 20,
        getCollisionPivotX: () => 0.5,
      });

      // Act
      const aabb = proto.getPixelAbsHitboxTileAabb.call(event);

      // Assert- x is centred on the pivot, y hangs upward from the feet.
      expect(aabb).toEqual({
        left: 9.5,
        top: 18,
        right: 11.5,
        bottom: 21,
        width: 2,
        height: 3,
      });
    });

    it('builds the tile-space AABB at an explicitly proposed position', () =>
    {
      // Arrange- movement code probes a *candidate* location before committing to it.
      const event = buildSizedEvent({ x: 10, y: 20, getCollisionPivotX: () => 0 });

      // Act
      const aabb = proto.getPixelAbsHitboxTileAabb.call(event, 0, 0);

      // Assert
      expect(aabb.left).toBe(-1);
      expect(aabb.top).toBe(-2);
    });

    it('provides no battler AABB model when no rectangle is resolved', () =>
    {
      // Arrange
      const event = buildEvent();

      // Act & Assert
      expect(proto.getPixelAbsBattlerAabbModel.call(event)).toBe(null);
    });

    it('converts the resolved rectangle into a screen-space battler AABB', () =>
    {
      // Arrange- JABS works in screen pixels, so the tile rectangle is scaled and re-anchored.
      globalThis.$gameMap = { tileWidth: () => 48, tileHeight: () => 48 };
      const event = buildSizedEvent({
        screenX: () => 100,
        screenY: () => 200,
      });

      // Act
      const model = proto.getPixelAbsBattlerAabbModel.call(event);

      // Assert- 2 tiles wide is 96px, centred on screenX; 3 tiles tall is 144px, hanging above the feet.
      expect(model.x).toBe(52);
      expect(model.y).toBe(56);
      expect(model.w).toBe(96);
      expect(model.h).toBe(144);
    });
  });
});
//endregion plugins/pixel/ext/abs/_component/game-event-hitbox-model.test.js
