//region plugins/abs/core/sprites/spriteset-map-loot-removal.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { installMinimalDatabase, installRmmzViewLayer } from '../../../../setup/rmmz-view-harness.js';

/**
 * Removing one loot sprite has to remove exactly that one.
 *
 * The fallback scan exists for the case where a drop is collected before the spriteset ever built
 * its sprite - which the loot magnet made routine, since a drop can now be claimed and absorbed
 * within a few frames of landing. A scan that matches the wrong sprite there destroys a bystander
 * drop's icon while leaving its event on the map, which reads to a player as loot that cannot be
 * seen but can still be walked into.
 */
describe('Spriteset_Map loot sprite removal', () =>
{
  let removeLootSprite;
  let tilemap;

  beforeAll(async () =>
  {
    // the real view layer, so `Spriteset_Map` and the sprite classes J-ABS aliases are genuine.
    installRmmzViewLayer();
    installMinimalDatabase();

    globalThis.J = {
      ABS: {
        Aliased: { Spriteset_Map: new Map() },
        Shapes: { Circle: 'circle', Rhombus: 'rhombus', Square: 'square', Wall: 'wall' },
        Metadata: { MaxAiUpdateRange: 30 },
      },
    };

    // models registered at import time only need the call to land somewhere; nothing here saves.
    globalThis.SerializableRegistry = { register: () => {} };

    globalThis.$gameMap = {
      expiredLootEvents: () => [],
      clearExpiredLootEvents: vi.fn(),
    };

    globalThis.$jabsEngine = {};

    await import('../../../../../src/plugins/abs/core/sprites/Spriteset_Map.js');

    ({ removeLootSprite } = globalThis.Spriteset_Map.prototype);
  });

  /**
   * Builds a stand-in loot sprite whose character carries the given uuid.
   * @param {string} uuid The uuid the underlying loot drop answers with.
   * @returns {Object} A stand-in for the drop's `Sprite_Character`.
   */
  const buildLootSprite = uuid => ({
    uuid,
    destroyed: false,
    parent: tilemap,
    character: () => ({
      isJabsLoot: () => true,
      getJabsLoot: () => ({ uuid: () => uuid }),
    }),
    deleteLootSprite: vi.fn(),
    destroy: vi.fn(),
  });

  /**
   * Builds the loot event being removed, deliberately matching no sprite by reference so the
   * fallback uuid scan is the thing under test.
   * @param {string} uuid The uuid of the drop being removed.
   * @returns {Object} A stand-in for the drop's `Game_Event`.
   */
  const buildLootEvent = uuid => ({
    getJabsLoot: () => ({ uuid: () => uuid }),
  });

  beforeEach(() =>
  {
    tilemap = { removeChild: vi.fn() };
  });

  it('removes the sprite whose loot uuid matches when no sprite matches by reference', () =>
  {
    // Arrange: three live drops, the target sitting last so a scan that matches indiscriminately
    // takes a bystander instead. 'loot-b' is the near-miss the operation has to leave alone.
    const spriteA = buildLootSprite('loot-a');
    const spriteB = buildLootSprite('loot-b');
    const spriteC = buildLootSprite('loot-c');
    const sprites = [ spriteA, spriteB, spriteC ];

    const spriteset = Object.create(globalThis.Spriteset_Map.prototype);
    spriteset.characterSprites = () => sprites;
    spriteset.tilemap = () => tilemap;

    // Act
    removeLootSprite.call(spriteset, buildLootEvent('loot-c'));

    // Assert: the named drop is gone and both bystanders are untouched.
    expect(spriteC.destroy).toHaveBeenCalledTimes(1);
    expect(spriteA.destroy).not.toHaveBeenCalled();
    expect(spriteB.destroy).not.toHaveBeenCalled();
    expect(sprites).toEqual([ spriteA, spriteB ]);
  });

  it('removes nothing when no sprite carries the target uuid', () =>
  {
    // Arrange: the drop being removed never got a sprite, and no other drop shares its identity.
    const spriteA = buildLootSprite('loot-a');
    const sprites = [ spriteA ];

    const spriteset = Object.create(globalThis.Spriteset_Map.prototype);
    spriteset.characterSprites = () => sprites;
    spriteset.tilemap = () => tilemap;

    // Act
    removeLootSprite.call(spriteset, buildLootEvent('loot-missing'));

    // Assert: a bystander survives a removal that found nothing of its own to take.
    expect(spriteA.destroy).not.toHaveBeenCalled();
    expect(sprites).toEqual([ spriteA ]);
    expect(globalThis.$gameMap.clearExpiredLootEvents).toHaveBeenCalled();
  });
});
//endregion plugins/abs/core/sprites/spriteset-map-loot-removal.test.js
