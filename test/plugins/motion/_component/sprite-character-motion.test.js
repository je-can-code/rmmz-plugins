//region plugins/motion/_component/sprite-character-motion.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  installMotionComponentGlobals,
  setMotionConfig,
  setPluginContextToJBase,
  setPluginContextToJMotion,
} from './fixtures/install-motion-component-globals.js';

describe('Sprite_Character motion application (direct src import)', () =>
{
  /** @type {typeof import('../../../../src/plugins/motion/core/managers/CharacterMotionComposer.js').default} */
  let CharacterMotionComposer;

  /** @type {typeof import('../../../../src/plugins/motion/core/models/MotionDeclaration.js').default} */
  let MotionDeclaration;

  beforeAll(async () =>
  {
    vi.resetModules();

    installMotionComponentGlobals();
    setMotionConfig({});

    setPluginContextToJBase();
    await import('../../../../src/plugins/_base/core/_metadata/initialization.js');
    await import('../../../../src/plugins/_base/core/sprites/Sprite_Character.js');

    setPluginContextToJMotion();
    await import('../../../../src/plugins/motion/core/_metadata/initialization.js');

    // literal import paths, so Stryker can map mutants in these files back to this test file.
    await import('../../../../src/plugins/motion/core/core/MotionTypeRegistry.js');
    ({ default: MotionDeclaration } =
      await import('../../../../src/plugins/motion/core/models/MotionDeclaration.js'));
    ({ default: CharacterMotionComposer } =
      await import('../../../../src/plugins/motion/core/managers/CharacterMotionComposer.js'));
    await import('../../../../src/plugins/motion/core/sprites/Sprite_Character.js');
  });

  /** @type {Object} */
  let sprite;

  /** @type {Object} */
  let character;

  beforeEach(() =>
  {
    character = { name: 'a-character' };
    sprite = new globalThis.Sprite_Character();
    sprite._character = character;
    sprite.scale = { x: 1, y: 1 };
    sprite.anchor = { x: 0.5, y: 1 };
    sprite.height = 48;
    sprite.enginePlacedX = 100;
    sprite.enginePlacedY = 200;
    sprite.enginePlacedOpacity = 255;
    sprite.initMembers();
  });

  /**
   * Declares a motion on the sprite's character.
   * @param {string} type The motion type.
   * @param {Array} parameters The authored parameters.
   */
  const declareMotion = (type, parameters) =>
  {
    const declaration = new MotionDeclaration(type, parameters, 'page');
    CharacterMotionComposer.declare(character, 'page', [ declaration ]);
  };

  describe('initMembers', () =>
  {
    it('still performs the engine\'s own member setup', () =>
    {
      // Assert
      expect(sprite.baseInitMembersRan).toBe(true);
    });

    it('starts out having never been coloured', () =>
    {
      // Assert
      expect(sprite.isMotionColored()).toBe(false);
    });
  });

  describe('update', () =>
  {
    it('still performs the engine\'s own update', () =>
    {
      // Act
      sprite.update();

      // Assert
      expect(sprite.x).toBe(100);
    });

    it('does nothing at all when the sprite has no character yet', () =>
    {
      // Arrange
      sprite._character = null;

      // Act
      const updating = () => sprite.update();

      // Assert
      expect(updating).not.toThrow();
      expect(sprite.scale.x).toBe(1);
    });

    it('writes the resting values for a character that is not moving', () =>
    {
      // Act
      sprite.update();

      // Assert
      expect(sprite.x).toBe(100);
      expect(sprite.y).toBe(200);
      expect(sprite.opacity).toBe(255);
      expect(sprite.scale.x).toBe(1);
      expect(sprite.rotation).toBe(0);
    });

    it('resets a scale back to normal after the motion that set it is gone', () =>
    {
      // Arrange
      declareMotion('scale', [ 200, 1 ]);
      sprite.update();
      sprite.update();
      const whileScaled = sprite.scale.x;

      // Act
      CharacterMotionComposer.removeDeclarations(character, 'page');
      sprite.update();
      sprite.update();
      sprite.update();

      // Assert
      expect(whileScaled).toBeCloseTo(2, 5);
      expect(sprite.scale.x).toBe(1);
    });
  });

  describe('applyMotionTransform', () =>
  {
    it('adds an offset to where the engine placed the sprite rather than replacing it', () =>
    {
      // Arrange
      declareMotion('sway', [ 8, 100, 'sync' ]);

      // Act
      const ticks = 25;
      for (let index = 0; index < ticks; index++)
      {
        sprite.update();
      }

      // Assert
      expect(sprite.x).toBeCloseTo(108, 5);
      expect(sprite.y).toBe(200);
    });

    it('multiplies opacity into whatever the engine assigned', () =>
    {
      // Arrange
      sprite.enginePlacedOpacity = 200;
      declareMotion('fade', [ 50, 1 ]);

      // Act
      sprite.update();
      sprite.update();

      // Assert
      expect(sprite.opacity).toBeCloseTo(100, 5);
    });

    it('assigns scale outright, since nothing in the engine writes it', () =>
    {
      // Arrange
      declareMotion('scale', [ 150, 1 ]);

      // Act
      sprite.update();
      sprite.update();

      // Assert
      expect(sprite.scale.x).toBeCloseTo(1.5, 5);
      expect(sprite.scale.y).toBeCloseTo(1.5, 5);
    });

    it('assigns rotation outright', () =>
    {
      // Arrange
      declareMotion('angle', [ 90, 1 ]);

      // Act
      sprite.update();
      sprite.update();

      // Assert
      expect(sprite.rotation).toBeCloseTo(Math.PI / 2, 5);
    });
  });

  describe('applyMotionAnchor', () =>
  {
    it('leaves the anchor at the feet for a motion that rocks', () =>
    {
      // Arrange
      declareMotion('swing', [ 15, 100, 'sync' ]);

      // Act
      sprite.update();

      // Assert
      expect(sprite.anchor.y).toBe(1);
      expect(sprite.y).toBe(200);
    });

    it('moves the anchor to the middle for a motion that spins, and compensates the drop', () =>
    {
      // Arrange
      declareMotion('spin', [ 120, 'cw', 'sync' ]);

      // Act
      sprite.update();

      // Assert
      expect(sprite.anchor.y).toBe(0.5);
      expect(sprite.y).toBe(224);
    });
  });

  describe('applyMotionColor', () =>
  {
    it('never touches the colour filter for a character with no colour motion', () =>
    {
      // Arrange
      declareMotion('sway', [ 8, 100, 'sync' ]);

      // Act
      sprite.update();

      // Assert
      expect(sprite.appliedHue).toBeUndefined();
      expect(sprite.appliedTone).toBeUndefined();
      expect(sprite.isMotionColored()).toBe(false);
    });

    it('writes the colour channels once a hue motion is running', () =>
    {
      // Arrange
      declareMotion('hue', [ 120, 1 ]);

      // Act
      sprite.update();
      sprite.update();

      // Assert
      expect(sprite.appliedHue).toBeCloseTo(120, 5);
      expect(sprite.isMotionColored()).toBe(true);
    });

    it('writes the colour channels for a tone motion', () =>
    {
      // Arrange
      declareMotion('throb', [ 0, 0, 80, 0, 100 ]);

      // Act
      const ticks = 50;
      for (let index = 0; index < ticks; index++)
      {
        sprite.update();
      }

      // Assert
      expect(sprite.appliedTone[2]).toBeGreaterThan(0);
      expect(sprite.isMotionColored()).toBe(true);
    });

    it('writes the colour channels for a flash motion', () =>
    {
      // Arrange
      declareMotion('flash', [ '#ff0000', 100 ]);

      // Act
      const ticks = 50;
      for (let index = 0; index < ticks; index++)
      {
        sprite.update();
      }

      // Assert
      expect(sprite.appliedBlendColor[3]).toBeGreaterThan(0);
    });

    it('writes a tint as a packed colour', () =>
    {
      // Arrange
      declareMotion('tint', [ '#ff8000', 1 ]);

      // Act
      sprite.update();
      sprite.update();

      // Assert
      expect(sprite.tint).toBe(0xff8000);
    });

    it('keeps writing the colour channels on the way back to plain', () =>
    {
      // Arrange
      declareMotion('hue', [ 120, 1 ]);
      sprite.update();
      sprite.update();

      // Act
      CharacterMotionComposer.removeDeclarations(character, 'page');
      sprite.update();
      sprite.update();
      sprite.update();

      // Assert
      expect(sprite.isMotionColored()).toBe(true);
      expect(sprite.appliedHue).toBe(0);
    });
  });

  describe('isMotionColorMeaningful', () =>
  {
    /**
     * A stand-in contributor, since a composition only compares effects by identity.
     * @type {Object}
     */
    const anEffect = { name: 'a-contributor' };

    /**
     * Builds a composition holding only the channel a case cares about.
     * @param {Function} mutate A function that adjusts the fresh composition.
     * @returns {Object} The composition.
     */
    const aCompositionWhere = async mutate =>
    {
      const { default: MotionComposition } =
        await import('../../../../src/plugins/motion/core/models/MotionComposition.js');
      const composition = new MotionComposition();
      mutate(composition);

      return composition;
    };

    it('says a plain composition is not worth a render pass', async () =>
    {
      // Arrange
      const composition = await aCompositionWhere(() =>
      {
      });

      // Act
      const meaningful = globalThis.Sprite_Character.isMotionColorMeaningful(composition);

      // Assert
      expect(meaningful).toBe(false);
    });

    it('notices a hue that has moved', async () =>
    {
      // Arrange
      const { default: MotionChannels } = await import('../../../../src/plugins/motion/core/core/MotionChannels.js');
      const composition = await aCompositionWhere(built => built.contribute(anEffect,MotionChannels.HUE, 90));

      // Act
      const meaningful = globalThis.Sprite_Character.isMotionColorMeaningful(composition);

      // Assert
      expect(meaningful).toBe(true);
    });

    it('notices a tone that has moved', async () =>
    {
      // Arrange
      const { default: MotionChannels } = await import('../../../../src/plugins/motion/core/core/MotionChannels.js');
      const composition = await aCompositionWhere(built => built.contribute(anEffect,MotionChannels.TONE, [ 0, 0, 40, 0 ]));

      // Act
      const meaningful = globalThis.Sprite_Character.isMotionColorMeaningful(composition);

      // Assert
      expect(meaningful).toBe(true);
    });

    it('notices a flash that has any strength at all', async () =>
    {
      // Arrange
      const { default: MotionChannels } = await import('../../../../src/plugins/motion/core/core/MotionChannels.js');
      const composition = await aCompositionWhere(built => built.contribute(anEffect,MotionChannels.FLASH, [ 255, 0, 0, 5 ]));

      // Act
      const meaningful = globalThis.Sprite_Character.isMotionColorMeaningful(composition);

      // Assert
      expect(meaningful).toBe(true);
    });

    it('notices a tint that has left white', async () =>
    {
      // Arrange
      const { default: MotionChannels } = await import('../../../../src/plugins/motion/core/core/MotionChannels.js');
      const composition = await aCompositionWhere(built => built.contribute(anEffect,MotionChannels.TINT, [ 255, 128, 255 ]));

      // Act
      const meaningful = globalThis.Sprite_Character.isMotionColorMeaningful(composition);

      // Assert
      expect(meaningful).toBe(true);
    });
  });
});
//endregion plugins/motion/_component/sprite-character-motion.test.js