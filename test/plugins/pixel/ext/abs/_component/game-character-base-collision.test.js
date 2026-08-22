//region plugins/pixel/ext/abs/_component/game-character-base-collision.test.js
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  installPixelAbsExtHostGlobals,
  installPixelCoreHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJPixel,
  setPluginContextToJPixelAbsExt,
} from '../../../_component/fixtures/install-pixel-host-globals.js';

/**
 * Builds a character stand-in carrying the pixel-collision surface these methods read.
 * Inherits the real prototype, since the routine calls shared methods on every candidate.
 * @param {object} [overrides] Properties to replace on the built character.
 * @returns {object}
 */
function buildCharacter(overrides = {})
{
  const character = Object.assign(Object.create(globalThis.Game_CharacterBase.prototype), {
    x: 0,
    y: 0,

    // a one-tile square footprint anchored on the character's own position.
    _pixelHitbox: () => ({ hx: 0, hy: 0, w: 1, h: 1 }),
    getEffectiveRadius: () => 0.5,
    getCollisionPivotX: () => 0,
    getCollisionPivotY: () => 0,

    isErased: () => false,
    isThrough: () => false,
    isNormalPriority: () => true,
    isJabsAction: () => false,
  });

  return Object.assign(character, overrides);
}

describe('J-ABS-Pixelistics Game_CharacterBase collision (direct src import)', () =>
{
  /** @type {Map<string, Function>} the alias map the plugin stores original methods in. */
  let aliasMap;
  let previousGameMap;
  let previousPlayer;

  beforeAll(async () =>
  {
    vi.resetModules();

    installPixelCoreHostGlobals();

    setPluginContextToJBase();
    await import('../../../../../../src/plugins/_base/core/_metadata/initialization.js');

    setPluginContextToJPixel();
    await import('../../../../../../src/plugins/pixel/core/_metadata/initialization.js');

    ({ default: globalThis.PIXEL_CollisionManager } = await import('../../../../../../src/plugins/pixel/core/managers/PIXEL_CollisionManager.js'));
    globalThis.PIXEL_CollisionManager.initConfig();
    globalThis.PIXEL_CollisionManager.setupCollision();

    installPixelAbsExtHostGlobals();

    setPluginContextToJPixelAbsExt();
    await import('../../../../../../src/plugins/pixel/ext/abs/_metadata/initialization.js');

    // character-vs-character collision now lives in PIXEL core as a single pivot-aware
    // implementation; the ext layer contributes only the per-event hitbox overrides that feed it.
    await import('../../../../../../src/plugins/pixel/core/objects/Game_CharacterBase.js');
    await import('../../../../../../src/plugins/pixel/ext/abs/objects/Game_CharacterBase.js');

    aliasMap = globalThis.J.PIXEL.EXT.ABS.Aliased.Game_CharacterBase;
  });

  beforeEach(() =>
  {
    previousGameMap = globalThis.$gameMap;
    previousPlayer = globalThis.$gamePlayer;
  });

  afterEach(() =>
  {
    globalThis.$gameMap = previousGameMap;
    globalThis.$gamePlayer = previousPlayer;
  });

  describe('hasCustomPixelHitbox', () =>
  {
    it('reports no custom hitbox for a plain character', () =>
    {
      // Arrange & Act- only Game_Event overrides this; everything else answers no so the square-radius
      // path stays the default.
      const result = globalThis.Game_CharacterBase.prototype.hasCustomPixelHitbox.call({});

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('getPixelAbsBattlerAabbModel', () =>
  {
    it('provides no rectangular model for a plain character', () =>
    {
      // Arrange & Act
      const result = globalThis.Game_CharacterBase.prototype.getPixelAbsBattlerAabbModel.call({});

      // Assert- null is the documented "no custom model" answer that callers fall back from.
      expect(result).toBe(null);
    });
  });

  describe('isOverlappingSolidTiles', () =>
  {
    /**
     * Runs the method against a character, with a map whose passability is described by a predicate.
     * @param {object} character The character to test with.
     * @param {object} mapOverrides The $gameMap stand-in members.
     * @returns {boolean}
     */
    const overlapWith = (character, mapOverrides) =>
    {
      globalThis.$gameMap = Object.assign({ isValid: () => true, isPassable: () => true }, mapOverrides);

      return globalThis.Game_CharacterBase.prototype.isOverlappingSolidTiles.call(character, 0, 0, 0.5);
    };

    it('defers to the original square-radius check when there is no custom hitbox', () =>
    {
      // Arrange- the rectangle path is only correct for characters that actually declare a rectangle;
      // everything else must keep the core behaviour untouched.
      const original = vi.fn(() => 'original-result');
      const realOriginal = aliasMap.get('isOverlappingSolidTiles');
      aliasMap.set('isOverlappingSolidTiles', original);
      const character = buildCharacter({ hasCustomPixelHitbox: () => false });

      // Act
      const result = overlapWith(character, {});

      // Assert
      expect(result).toBe('original-result');
      expect(original).toHaveBeenCalledWith(0, 0, 0.5);

      aliasMap.set('isOverlappingSolidTiles', realOriginal);
    });

    it('treats an out-of-bounds tile as solid', () =>
    {
      // Arrange- walking off the edge of the map must read as a wall rather than as open space.
      const character = buildCharacter({ hasCustomPixelHitbox: () => true });

      // Act
      const result = overlapWith(character, { isValid: () => false });

      // Assert
      expect(result).toBe(true);
    });

    it('treats a tile with no passable cardinal as solid', () =>
    {
      // Arrange- a tile sealed from every direction is a wall, regardless of which way the character
      // approaches it from.
      const character = buildCharacter({ hasCustomPixelHitbox: () => true });

      // Act
      const result = overlapWith(character, { isPassable: () => false });

      // Assert
      expect(result).toBe(true);
    });

    // passability is an OR across all four cardinals, and each operand has to carry the condition on
    // its own. one case per cardinal is the only way to tell "this side opens the tile" apart from
    // "some other side happened to be open too".
    const cardinals = [ 'DOWN', 'LEFT', 'RIGHT', 'UP' ];

    cardinals.forEach(cardinal =>
    {
      it(`accepts a tile whose only passable cardinal is ${cardinal}`, () =>
      {
        // Arrange- every other side of this tile is sealed, so the one open side is the sole reason
        // the tile reads as walkable rather than as a wall.
        const character = buildCharacter({ hasCustomPixelHitbox: () => true });
        const openDirection = globalThis.J.PIXEL.Directions[cardinal];

        // Act
        const result = overlapWith(character, {
          isPassable: (tx, ty, direction) => direction === openDirection,
        });

        // Assert
        expect(result).toBe(false);
      });
    });

    it('reports no overlap when every covered tile is open', () =>
    {
      // Arrange
      const character = buildCharacter({ hasCustomPixelHitbox: () => true });

      // Act
      const result = overlapWith(character, {});

      // Assert
      expect(result).toBe(false);
    });

    it('examines every tile a wide rectangle spans, not just its anchor', () =>
    {
      // Arrange- a three-by-two hitbox has to probe all six tiles, or a wall clipping only the far
      // corner of a large enemy would be missed entirely.
      const character = buildCharacter({
        hasCustomPixelHitbox: () => true,
        _pixelHitbox: () => ({ hx: 0, hy: 0, w: 3, h: 2 }),
      });
      const probed = [];

      // Act
      const result = overlapWith(character, {
        isValid: (tx, ty) =>
        {
          probed.push(`${tx},${ty}`);

          return true;
        },
      });

      // Assert
      expect(result).toBe(false);
      expect(probed).toEqual([ '0,0', '1,0', '2,0', '0,1', '1,1', '2,1' ]);
    });

    it('reports solid as soon as one tile in a spanned rectangle is blocked', () =>
    {
      // Arrange- the second column is a wall; the scan must not report clear just because the first
      // column was open.
      const character = buildCharacter({
        hasCustomPixelHitbox: () => true,
        _pixelHitbox: () => ({ hx: 0, hy: 0, w: 3, h: 1 }),
      });

      // Act
      const result = overlapWith(character, { isPassable: tx => tx !== 1 });

      // Assert
      expect(result).toBe(true);
    });
  });

  describe('isCharacterCollisionAt', () =>
  {
    /**
     * Installs a map and party around the character under test.
     * @param {object[]} events The events on the map.
     * @param {object} [player] The party leader stand-in.
     * @param {object[]} [followers] The follower stand-ins.
     */
    const installWorld = (events, player = buildCharacter({ x: 50, y: 50 }), followers = []) =>
    {
      globalThis.$gameMap = { events: () => events };
      globalThis.$gamePlayer = Object.assign(player, { _followers: { _data: followers } });
    };

    /**
     * Runs the collision probe for a character at its own position.
     * @param {object} character The character being moved.
     * @returns {boolean}
     */
    const collideAt = character =>
      globalThis.Game_CharacterBase.prototype.isCharacterCollisionAt.call(character, character.x, character.y);

    it('collides with an overlapping event', () =>
    {
      // Arrange- two one-tile footprints on the same tile overlap.
      const self = buildCharacter({ x: 0, y: 0 });
      const blocker = buildCharacter({ x: 0, y: 0 });
      installWorld([ blocker ]);

      // Act
      const result = collideAt(self);

      // Assert
      expect(result).toBe(true);
    });

    it('does not collide with an event that is clear of the footprint', () =>
    {
      // Arrange
      const self = buildCharacter({ x: 0, y: 0 });
      const distant = buildCharacter({ x: 10, y: 10 });
      installWorld([ distant ]);

      // Act
      const result = collideAt(self);

      // Assert
      expect(result).toBe(false);
    });

    it('does not collide with itself', () =>
    {
      // Arrange- the mover is always present in the event list and must be filtered out, or every
      // character would permanently block its own movement.
      const self = buildCharacter({ x: 0, y: 0 });
      installWorld([ self ]);

      // Act
      const result = collideAt(self);

      // Assert
      expect(result).toBe(false);
    });

    it('ignores erased events', () =>
    {
      // Arrange- an erased event is gone from play and should not leave an invisible wall behind.
      const self = buildCharacter({ x: 0, y: 0 });
      const erased = buildCharacter({ x: 0, y: 0, isErased: () => true });
      installWorld([ erased ]);

      // Act
      const result = collideAt(self);

      // Assert
      expect(result).toBe(false);
    });

    it('ignores events flagged as through', () =>
    {
      // Arrange
      const self = buildCharacter({ x: 0, y: 0 });
      const ghost = buildCharacter({ x: 0, y: 0, isThrough: () => true });
      installWorld([ ghost ]);

      // Act
      const result = collideAt(self);

      // Assert
      expect(result).toBe(false);
    });

    it('ignores events that are not normal priority', () =>
    {
      // Arrange- below- and above-character priority events are decoration, not obstacles.
      const self = buildCharacter({ x: 0, y: 0 });
      const decoration = buildCharacter({ x: 0, y: 0, isNormalPriority: () => false });
      installWorld([ decoration ]);

      // Act
      const result = collideAt(self);

      // Assert
      expect(result).toBe(false);
    });

    it('ignores JABS action sprites so attacks do not block movement', () =>
    {
      // Arrange- a swung sword is an event on the map; treating it as solid would let a battler wall
      // itself in with its own attack.
      const self = buildCharacter({ x: 0, y: 0 });
      const swing = buildCharacter({ x: 0, y: 0, isJabsAction: () => true });
      installWorld([ swing ]);

      // Act
      const result = collideAt(self);

      // Assert
      expect(result).toBe(false);
    });

    it('collides with the player when the mover is not a party member', () =>
    {
      // Arrange- an enemy must be stopped by the party leader.
      const self = buildCharacter({ x: 0, y: 0 });
      const player = buildCharacter({ x: 0, y: 0 });
      installWorld([], player);

      // Act
      const result = collideAt(self);

      // Assert
      expect(result).toBe(true);
    });

    it('does not collide with the player when the mover is a party member', () =>
    {
      // Arrange- followers stack on the leader constantly; treating that as collision would freeze
      // the whole party in place.
      const self = buildCharacter({ x: 0, y: 0 });
      const player = buildCharacter({ x: 0, y: 0 });
      installWorld([], player, [ self ]);

      // Act
      const result = collideAt(self);

      // Assert
      expect(result).toBe(false);
    });

    it('does not collide with a player flagged as through', () =>
    {
      // Arrange
      const self = buildCharacter({ x: 0, y: 0 });
      const player = buildCharacter({ x: 0, y: 0, isThrough: () => true });
      installWorld([], player);

      // Act
      const result = collideAt(self);

      // Assert
      expect(result).toBe(false);
    });

    it('collides with a follower when the mover is not a party member', () =>
    {
      // Arrange
      const self = buildCharacter({ x: 0, y: 0 });
      const player = buildCharacter({ x: 50, y: 50 });
      const follower = buildCharacter({ x: 0, y: 0 });
      installWorld([], player, [ follower ]);

      // Act
      const result = collideAt(self);

      // Assert
      expect(result).toBe(true);
    });

    it('ignores a follower flagged as through', () =>
    {
      // Arrange
      const self = buildCharacter({ x: 0, y: 0 });
      const player = buildCharacter({ x: 50, y: 50 });
      const follower = buildCharacter({ x: 0, y: 0, isThrough: () => true });
      installWorld([], player, [ follower ]);

      // Act
      const result = collideAt(self);

      // Assert
      expect(result).toBe(false);
    });

    it('never runs the party branch for a mover that is itself a follower', () =>
    {
      // Arrange- a follower standing on top of another follower. Membership is derived *from* the
      // follower list, so being in that list makes the mover a party member by construction, and the
      // whole player/follower branch is skipped. Party members only ever collide with map events.
      const self = buildCharacter({ x: 0, y: 0 });
      const player = buildCharacter({ x: 0, y: 0 });
      const otherFollower = buildCharacter({ x: 0, y: 0 });
      installWorld([], player, [ self, otherFollower ]);

      // Act
      const result = collideAt(self);

      // Assert- neither the overlapping leader nor the overlapping sibling follower blocks the mover,
      // which is what lets a marching party occupy the same space without deadlocking.
      expect(result).toBe(false);
    });

    it('skips a JABS action that reached the candidate list anyway', () =>
    {
      // Arrange- the second guard inside the probe loop is defensive: it catches action sprites
      // arriving via the party path, which the event filter above never sees.
      const self = buildCharacter({ x: 0, y: 0 });
      const actionPlayer = buildCharacter({ x: 0, y: 0, isJabsAction: () => true });
      installWorld([], actionPlayer);

      // Act
      const result = collideAt(self);

      // Assert
      expect(result).toBe(false);
    });

    it('treats edge-touching footprints as clear rather than colliding', () =>
    {
      // Arrange- two one-tile boxes exactly abutting share a boundary but no area. Counting that as
      // a collision would leave a permanent one-pixel gap between any two characters.
      const self = buildCharacter({ x: 0, y: 0 });
      const neighbour = buildCharacter({ x: 1, y: 0 });
      installWorld([ neighbour ]);

      // Act
      const result = collideAt(self);

      // Assert
      expect(result).toBe(false);
    });

    it('honours the collision pivot when placing a footprint', () =>
    {
      // Arrange- the pivot shifts the box away from the raw logical coordinate. Two characters on the
      // same tile whose pivots push them a full tile apart must not collide.
      const self = buildCharacter({ x: 0, y: 0 });
      const shifted = buildCharacter({
        x: 0,
        y: 0,
        getCollisionPivotX: () => 5,
      });
      installWorld([ shifted ]);

      // Act
      const result = collideAt(self);

      // Assert
      expect(result).toBe(false);
    });
  });
});
//endregion plugins/pixel/ext/abs/_component/game-character-base-collision.test.js
