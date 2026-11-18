//region plugins/abs/core/sprites/spriteset-map-effect-riders.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { installMinimalDatabase, installRmmzViewLayer } from '../../../../setup/rmmz-view-harness.js';

/**
 * A character sprite J-ABS destroys has to take its balloons and animations with it.
 *
 * The engine never destroys a character's sprite while the map is up, so a balloon or an animation reads its target's
 * position every frame until it finishes. J-ABS destroys the sprites of expired actions and collected loot, and a
 * summon is an action that is also a battler: it can run out of time with a "!" still over its head. Whatever was left
 * playing on it read the destroyed sprite on the next frame and took the game down with it.
 *
 * The engine's own `removeBalloon` and `removeAnimation` run for real here, so these prove the effect actually leaves
 * the engine's lists, not merely that something was asked to remove it.
 */
describe('Spriteset_Map ending the effects on a sprite it destroys', () =>
{
  let tilemap;

  beforeAll(async () =>
  {
    // the real view layer, so `Spriteset_Map` and the engine's effect removal are genuine.
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
      clearExpiredJabsActionEvents: vi.fn(),
    };

    globalThis.$jabsEngine = {};

    await import('../../../../../src/plugins/abs/core/sprites/Spriteset_Map.js');

    tilemap = { removeChild: vi.fn() };
  });

  /**
   * Builds a bare spriteset carrying the given character sprites, balloons and animations.<br/>
   * The two effect accessors read the engine's own lists, exactly as J-Base's do, so the engine's removal methods
   * mutate the very arrays the assertions read.
   * @param {{ sprites?: Object[], balloons?: Object[], animations?: Object[] }} contents What the spriteset holds.
   * @returns {Spriteset_Map}
   */
  function buildSpriteset({ sprites = [], balloons = [], animations = [] } = {})
  {
    const spriteset = Object.create(globalThis.Spriteset_Map.prototype);
    spriteset._balloonSprites = balloons;
    spriteset._animationSprites = animations;
    spriteset._effectsContainer = { removeChild: vi.fn() };
    spriteset.balloonSprites = () => spriteset._balloonSprites;
    spriteset.animationSprites = () => spriteset._animationSprites;
    spriteset.characterSprites = () => sprites;
    spriteset.tilemap = () => tilemap;
    return spriteset;
  }

  /**
   * Builds a stand-in character the effects can be requested on, able to hear that its effects ended.
   * @returns {Object}
   */
  const buildCharacter = () => ({ endBalloon: vi.fn(), endAnimation: vi.fn() });

  /**
   * Builds a stand-in character sprite drawing the given character, recording its destruction into `order`.
   * @param {Object} character The character the sprite draws.
   * @param {string[]} order Where the moment of destruction gets written down.
   * @returns {Object}
   */
  const buildCharacterSprite = (character, order = []) => ({
    character: () => character,
    parent: tilemap,
    destroyed: false,
    deleteLootSprite: vi.fn(),
    destroy: vi.fn(() => order.push('destroy')),
  });

  describe('endEffectsOn()', () =>
  {
    it('ends the balloon over the departing character, and leaves a balloon over a bystander showing', () =>
    {
      // Arrange
      const departing = buildCharacter();
      const bystander = buildCharacter();
      const departingBalloon = { targetObject: departing, destroy: vi.fn() };
      const bystanderBalloon = { targetObject: bystander, destroy: vi.fn() };
      const spriteset = buildSpriteset({ balloons: [ departingBalloon, bystanderBalloon ] });

      // Act
      spriteset.endEffectsOn(buildCharacterSprite(departing));

      // Assert
      expect(spriteset._balloonSprites).toEqual([ bystanderBalloon ]);
      expect(departingBalloon.destroy).toHaveBeenCalledTimes(1);
      expect(departing.endBalloon).toHaveBeenCalledTimes(1);
      expect(bystanderBalloon.destroy).not.toHaveBeenCalled();
    });

    it('ends the animation playing on the departing character, and leaves one on a bystander playing', () =>
    {
      // Arrange
      const departing = buildCharacter();
      const bystander = buildCharacter();
      const departingAnimation = { targetObjects: [ departing ], destroy: vi.fn() };
      const bystanderAnimation = { targetObjects: [ bystander ], destroy: vi.fn() };
      const spriteset = buildSpriteset({ animations: [ departingAnimation, bystanderAnimation ] });

      // Act
      spriteset.endEffectsOn(buildCharacterSprite(departing));

      // Assert
      expect(spriteset._animationSprites).toEqual([ bystanderAnimation ]);
      expect(departingAnimation.destroy).toHaveBeenCalledTimes(1);
      expect(departing.endAnimation).toHaveBeenCalledTimes(1);
      expect(bystanderAnimation.destroy).not.toHaveBeenCalled();
    });
  });

  describe('the paths that destroy a character sprite', () =>
  {
    it('ends what plays on an expiring action\'s sprite before destroying it, and touches no bystander', () =>
    {
      // Arrange
      const order = [];
      const character = buildCharacter();
      const sprite = buildCharacterSprite(character, order);
      const bystander = buildCharacterSprite(buildCharacter());
      const spriteset = buildSpriteset({ sprites: [ bystander, sprite ] });
      spriteset.endEffectsOn = vi.fn(() => order.push('end'));
      const actionEvent = {
        getJabsAction: () => ({ getActionSprite: () => character }),
        getJabsActionUuid: () => '',
        setActionSpriteNeedsRemoving: vi.fn(),
      };

      // Act
      spriteset.removeActionSprite(actionEvent);

      // Assert
      expect(order).toEqual([ 'end', 'destroy' ]);
      expect(spriteset.endEffectsOn).toHaveBeenCalledTimes(1);
      expect(spriteset.endEffectsOn).toHaveBeenCalledWith(sprite);
      expect(bystander.destroy).not.toHaveBeenCalled();
    });

    it('ends what plays on the sprite the fallback scan finds before destroying it', () =>
    {
      // Arrange: an action event that lost its action, so only the scan by the event itself can find its sprite.
      const order = [];
      const actionEvent = {
        getJabsAction: () => null,
        getJabsActionUuid: () => '',
        setActionSpriteNeedsRemoving: vi.fn(),
      };
      const sprite = buildCharacterSprite(actionEvent, order);
      const spriteset = buildSpriteset({ sprites: [ sprite ] });
      spriteset.endEffectsOn = vi.fn(() => order.push('end'));

      // Act
      spriteset.removeActionSprite(actionEvent);

      // Assert
      expect(order).toEqual([ 'end', 'destroy' ]);
      expect(spriteset.endEffectsOn).toHaveBeenCalledWith(sprite);
    });

    it('ends what plays on a collected drop\'s sprite before destroying it', () =>
    {
      // Arrange
      const order = [];
      const lootEvent = {};
      const sprite = buildCharacterSprite(lootEvent, order);
      const spriteset = buildSpriteset({ sprites: [ sprite ] });
      spriteset.endEffectsOn = vi.fn(() => order.push('end'));

      // Act
      spriteset.removeLootSprite(lootEvent);

      // Assert
      expect(order).toEqual([ 'end', 'destroy' ]);
      expect(spriteset.endEffectsOn).toHaveBeenCalledWith(sprite);
    });
  });
});
//endregion plugins/abs/core/sprites/spriteset-map-effect-riders.test.js