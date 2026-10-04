//region plugins/_base/core/sprites/sprite-character-sleep.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { installMinimalDatabase, installRmmzViewLayer } from '../../../../setup/rmmz-view-harness.js';

/**
 * Character sprites sleeping while their characters are far from the screen, tested against the real
 * display classes rather than described ones.
 *
 * Every piece here is a seam between two objects: the spriteset deciding who sleeps, the tilemap
 * honouring it, a sprite moving between the two states, and a caption following its character into
 * and out of them. The one decision in it - near the screen or not - is the engine's own
 * {@link Game_CharacterBase#isNearTheScreen}, so there is no logic left to extract anywhere more
 * measurable, and the harness supplies real sprites so `renderable` is the genuine PIXI flag.
 */
describe('character sprites sleeping off-screen', () =>
{
  /** @type {typeof import('../../../../../src/plugins/_base/core/sprites/Sprite_CharacterOverlay.js').default} */
  let Sprite_CharacterOverlay;

  beforeAll(async () =>
  {
    // the real view layer, so the sprites and containers are all genuine.
    installRmmzViewLayer();
    installMinimalDatabase();

    globalThis.J = {
      BASE: {
        Aliased: {
          Spriteset_Map: new Map(),
          Sprite_Character: new Map(),
        },
      },
    };

    await import('../../../../../src/plugins/_base/core/windows/TileMap.js');
    await import('../../../../../src/plugins/_base/core/sprites/Sprite_Character.js');
    await import('../../../../../src/plugins/_base/core/sprites/Spriteset_Map.js');
    ({ default: Sprite_CharacterOverlay } =
      await import('../../../../../src/plugins/_base/core/sprites/Sprite_CharacterOverlay.js'));
  });

  /**
   * Builds a real character sprite over a character whose distance from the screen can be changed.
   * @param {boolean} isNear Whether the character starts near the screen.
   * @returns {{sprite: Sprite_Character, character: {near: boolean}}}
   */
  const aCharacterSprite = isNear =>
  {
    const character = {
      near: isNear,
      isNearTheScreen()
      {
        return this.near;
      },
    };

    const sprite = new globalThis.Sprite_Character(character);

    return {
      sprite,
      character,
    };
  };

  describe('Sprite_Character.updateSleep', () =>
  {
    it('falls asleep once its character is out of reach of the screen', () =>
    {
      // Arrange - awake, as every sprite starts, with its character far away.
      const { sprite } = aCharacterSprite(false);

      // Act
      sprite.updateSleep();

      // Assert - asleep, which is the very flag PIXI reads to skip drawing it.
      expect(sprite.isAsleep()).toBe(true);
      expect(sprite.renderable).toBe(false);
    });

    it('wakes up once its character comes back near the screen', () =>
    {
      // Arrange - put to sleep by a far character, who then walks back.
      const { sprite, character } = aCharacterSprite(false);
      sprite.updateSleep();
      character.near = true;

      // Act
      sprite.updateSleep();

      // Assert
      expect(sprite.isAsleep()).toBe(false);
      expect(sprite.renderable).toBe(true);
    });

    it('leaves an awake sprite alone while its character stays near', () =>
    {
      // Arrange - both transitions watched, so neither can happen unnoticed.
      const { sprite } = aCharacterSprite(true);
      sprite.wakeUp = vi.fn();
      sprite.fallAsleep = vi.fn();

      // Act
      sprite.updateSleep();

      // Assert
      expect(sprite.wakeUp).not.toHaveBeenCalled();
      expect(sprite.fallAsleep).not.toHaveBeenCalled();
    });

    it('leaves a sleeping sprite alone while its character stays far', () =>
    {
      // Arrange - asleep first, then both transitions watched.
      const { sprite } = aCharacterSprite(false);
      sprite.updateSleep();
      sprite.wakeUp = vi.fn();
      sprite.fallAsleep = vi.fn();

      // Act
      sprite.updateSleep();

      // Assert
      expect(sprite.wakeUp).not.toHaveBeenCalled();
      expect(sprite.fallAsleep).not.toHaveBeenCalled();
    });
  });

  describe('Spriteset_Map.updateCharacterSleep', () =>
  {
    it('puts the far characters to sleep and leaves the near ones awake', () =>
    {
      // Arrange - one of each, so sleeping is proven to be a selection rather than a sweep.
      const spriteset = new globalThis.Sprite();
      Object.setPrototypeOf(spriteset, globalThis.Spriteset_Map.prototype);
      const near = aCharacterSprite(true);
      const far = aCharacterSprite(false);
      spriteset.setCharacterSprites([ near.sprite, far.sprite ]);

      // Act
      spriteset.updateCharacterSleep();

      // Assert
      expect(near.sprite.isAsleep()).toBe(false);
      expect(far.sprite.isAsleep()).toBe(true);
    });
  });

  describe('Tilemap.update', () =>
  {
    /**
     * Builds a tilemap over the given children, without the constructor's layers and bitmaps.
     * @param {Object[]} children The tilemap's children, in draw order.
     * @returns {Tilemap} The tilemap.
     */
    const aTilemap = children =>
    {
      const tilemap = Object.create(globalThis.Tilemap.prototype);
      tilemap.children = children;
      tilemap.animationCount = 0;
      tilemap.animationFrame = 0;

      return tilemap;
    };

    it('updates the children it is going to draw and skips the ones it is not', () =>
    {
      // Arrange - an awake child beside a sleeping one.
      const awake = { renderable: true, update: vi.fn() };
      const asleep = { renderable: false, update: vi.fn() };
      const tilemap = aTilemap([ awake, asleep ]);

      // Act
      tilemap.update();

      // Assert
      expect(awake.update).toHaveBeenCalledTimes(1);
      expect(asleep.update).not.toHaveBeenCalled();
    });

    it('walks past a child with no update of its own', () =>
    {
      // Arrange - a bare layer first, the way the tile layers sit, then something that updates.
      const layer = { renderable: true };
      const after = { renderable: true, update: vi.fn() };
      const tilemap = aTilemap([ layer, after ]);

      // Act
      tilemap.update();

      // Assert - the walk carried on past the layer.
      expect(after.update).toHaveBeenCalledTimes(1);
    });

    it('still advances the autotile animation', () =>
    {
      // Arrange - one frame short of the next animation frame.
      const tilemap = aTilemap([]);
      tilemap.animationCount = 29;

      // Act
      tilemap.update();

      // Assert
      expect(tilemap.animationCount).toBe(30);
      expect(tilemap.animationFrame).toBe(1);
    });
  });

  describe('Sprite_CharacterOverlay.update', () =>
  {
    /**
     * Builds a caption over a stand-in character sprite somewhere specific on screen.
     * @param {boolean} isAsleep Whether the character sprite is asleep.
     * @returns {Sprite_CharacterOverlay} The caption.
     */
    const aCaption = isAsleep =>
    {
      const caption = new Sprite_CharacterOverlay();
      caption.setCharacterSprite({
        isAsleep: () => isAsleep,
        x: 144,
        y: 288,
        z: 5,
        visible: true,
        opacity: 96,
      });

      return caption;
    };

    it('sleeps along with its character and stops following it', () =>
    {
      // Arrange
      const caption = aCaption(true);

      // Act
      caption.update();

      // Assert - not drawn, and still where it was rather than where its character is.
      expect(caption.renderable).toBe(false);
      expect(caption.x).toBe(0);
    });

    it('is drawn and follows its character while that character is awake', () =>
    {
      // Arrange - asleep the frame before, so being drawn again is a change rather than a default.
      const caption = aCaption(false);
      caption.renderable = false;

      // Act
      caption.update();

      // Assert
      expect(caption.renderable).toBe(true);
      expect(caption.x).toBe(144);
      expect(caption.y).toBe(288);
    });
  });
});
//endregion plugins/_base/core/sprites/sprite-character-sleep.test.js
