//region plugins/abs/core/sprites/sprite-character-loot.test.js
import { beforeAll, describe, expect, it } from 'vitest';

import { installMinimalDatabase, installRmmzViewLayer } from '../../../../setup/rmmz-view-harness.js';

/**
 * A loot drop's icon is a child sprite built during `setCharacter`, which is reached from the
 * `Sprite_Character` constructor - so whether an icon exists at all is a wiring question about the
 * seam between J-Base's sprite patches and J-ABS's, and only a real `Sprite_Character` has that seam.
 */
describe('Sprite_Character loot rendering', () =>
{
  let Sprite_Icon;

  beforeAll(async () =>
  {
    // Arrange: the real engine view layer, so Sprite_Character and its PIXI base are genuine.
    installRmmzViewLayer();
    installMinimalDatabase();

    globalThis.__PLUGIN_NAME__ ??= 'J-ABS';

    // models registered at import time only need the call to land somewhere; nothing here saves.
    globalThis.SerializableRegistry = { register: () => {} };

    // J-Base's promise-based loader, which Sprite_Icon builds its iconset bitmap through.
    globalThis.ImageManager.loadBitmapPromise = () => Promise.resolve(globalThis.ImageManager.loadSystem('IconSet'));
    globalThis.ImageManager.iconColumns ??= 16;

    // the namespace shell both patch files hang their alias maps off.
    globalThis.J = {
      BASE: {
        Aliased: { Sprite_Character: new Map() },
        Helpers: { getRandomNumber: (min, max) => Math.floor(Math.random() * (max - min + 1)) + min },
      },
      ABS: {
        Aliased: { Sprite_Character: new Map() },
        Metadata: {},
        Shapes: { Circle: 'circle', Rhombus: 'rhombus', Square: 'square', Wall: 'wall' },
      },
    };

    // J-ABS reaches these as hoisted globals out of the J-Base bundle rather than importing them.
    ({ default: Sprite_Icon } = await import('../../../../../src/plugins/_base/core/sprites/Sprite_Icon.js'));
    globalThis.Sprite_Icon = Sprite_Icon;

    ({ default: globalThis.Sprite_MapGauge } = await import(
      '../../../../../src/plugins/_base/core/sprites/Sprite_MapGauge.js'));
    ({ default: globalThis.Sprite_BaseText } = await import(
      '../../../../../src/plugins/_base/core/sprites/Sprite_BaseText.js'));

    // load order mirrors the shipped one: J-Base patches Sprite_Character before J-ABS does.
    await import('../../../../../src/plugins/_base/core/sprites/Sprite_Character.js');
    await import('../../../../../src/plugins/abs/core/sprites/Sprite_Character.js');
  });

  /**
   * Builds the minimum character a loot sprite needs to be set up against.
   * @returns {Object} A stand-in for the loot's `Game_Event`.
   */
  const buildLootCharacter = () => ({
    _through: false,
    isJabsLoot: () => true,
    isVehicle: () => false,
    hasJabsBattler: () => false,
    isJabsAction: () => false,
    isErased: () => false,
    getJabsLoot: () => ({
      lootIcon: () => 1077,
      isExpired: () => false,
      duration: () => 900,
      countdownDuration: () => {},
    }),
    pattern: () => 1,
    direction: () => 2,
    characterName: () => '',
    characterIndex: () => 0,
    tileId: () => 0,
    isTile: () => false,
    isObjectCharacter: () => false,
    isTransparent: () => false,
    screenX: () => 100,
    screenY: () => 200,
    screenZ: () => 3,
    opacity: () => 255,
    blendMode: () => 0,
    bushDepth: () => 0,
    isBalloonPlaying: () => false,
    startedBalloon: () => false,
    isSpriteVisible: () => true,
    shadowOpacity: () => 0,
  });

  it('builds a loot icon child when the character is loot', () =>
  {
    // Arrange & Act: constructing the sprite runs initMembers, then setCharacter, then loot setup.
    const sprite = new globalThis.Sprite_Character(buildLootCharacter());

    // Assert: the icon is the thing the player actually sees, so its absence is the whole bug.
    expect(sprite.getLootSprite()).not.toBeNull();
    expect(sprite.children).toContain(sprite.getLootSprite());
  });

  it('stays visible through the update pass', () =>
  {
    // Arrange
    const sprite = new globalThis.Sprite_Character(buildLootCharacter());

    // Act: `update` ends in `updateVisibility`, which hides a character the engine reads as empty -
    // and a loot drop has no character graphic, so it only survives because J-ABS intercepts that.
    sprite.update();

    // Assert
    expect(sprite.visible).toBe(true);
  });

  it('positions the loot icon over the tile rather than off it', () =>
  {
    // Arrange & Act
    const sprite = new globalThis.Sprite_Character(buildLootCharacter());
    const icon = sprite.getLootSprite();

    // Assert: centered horizontally on a 32px icon, and lifted onto a 48px tile's middle.
    expect(icon.x).toBeGreaterThanOrEqual(-20);
    expect(icon.x).toBeLessThanOrEqual(-12);
    expect(icon.y).toBeGreaterThanOrEqual(-44);
    expect(icon.y).toBeLessThanOrEqual(-36);
  });
});
//endregion plugins/abs/core/sprites/sprite-character-loot.test.js
