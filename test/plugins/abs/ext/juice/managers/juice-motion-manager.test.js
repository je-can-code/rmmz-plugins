//region plugins/abs/ext/juice/managers/juice-motion-manager.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { installJuiceMotionGlobals, installJuiceMotionTypes } from '../fixtures/install-juice-motion-globals.js';

describe('JuiceMotionManager', () =>
{
  /** @type {typeof import('../../../../../../src/plugins/abs/ext/juice/managers/JuiceMotionManager.js').default} */
  let JuiceMotionManager;

  /** @type {typeof import('../../../../../../src/plugins/motion/core/managers/CharacterMotionComposer.js').default} */
  let CharacterMotionComposer;

  /** @type {typeof import('../../../../../../src/plugins/motion/core/core/MotionChannels.js').default} */
  let MotionChannels;

  /** @type {Object} */
  let character;

  beforeAll(async () =>
  {
    installJuiceMotionGlobals();
    await installJuiceMotionTypes();

    // literal import paths, so Stryker can map mutants in these files back to this test file.
    ({ default: JuiceMotionManager } =
      await import('../../../../../../src/plugins/abs/ext/juice/managers/JuiceMotionManager.js'));
    ({ default: CharacterMotionComposer } =
      await import('../../../../../../src/plugins/motion/core/managers/CharacterMotionComposer.js'));
    ({ default: MotionChannels } =
      await import('../../../../../../src/plugins/motion/core/core/MotionChannels.js'));
  });

  beforeEach(() =>
  {
    character = { name: 'a-battler' };
    JuiceMotionManager.clearAll();
  });

  /**
   * Composes a character for a number of frames and hands back the last composition.
   * @param {number} frames How many frames to compose.
   * @returns {Object} The final composition.
   */
  const composeFrames = frames =>
  {
    let composition = null;

    for (let index = 0; index < frames; index++)
    {
      composition = CharacterMotionComposer.compose(character);
    }

    return composition;
  };

  /**
   * A duck-typed stand-in for a sprite-bound overlay effect, carrying what frameTick reads.
   * @param {Object} overrides Anything a particular test wants to differ.
   * @returns {Object} The fake effect.
   */
  const buildOverlayEffect = (overrides = {}) => Object.assign({
    isSpriteAlive: vi.fn(() => true),
    tick: vi.fn(() => true),
  }, overrides);

  describe('scheduleSquish', () =>
  {
    it('gives the character a squish it did not have before', () =>
    {
      // Arrange
      expect(CharacterMotionComposer.hasMotion(character)).toBe(false);

      // Act
      JuiceMotionManager.scheduleSquish(character, 0.5, 8);

      // Assert
      expect(CharacterMotionComposer.hasMotion(character)).toBe(true);
    });

    it('deforms the body on the axes a squish owns', () =>
    {
      // Arrange
      JuiceMotionManager.scheduleSquish(character, 0.5, 8);

      // Act
      const composition = composeFrames(4);

      // Assert
      expect(composition.valueFor(MotionChannels.SCALE_X)).toBeCloseTo(1.5, 10);
      expect(composition.valueFor(MotionChannels.SCALE_Y)).toBeCloseTo(1 / 1.5, 10);
    });

    it('runs for one cycle per repeat before lapsing', () =>
    {
      // Arrange
      JuiceMotionManager.scheduleSquish(character, 0.5, 8, 2);

      // Act
      composeFrames(15);

      // Assert
      expect(CharacterMotionComposer.hasMotion(character)).toBe(true);
    });

    it('lapses once its whole frame budget is spent', () =>
    {
      // Arrange
      JuiceMotionManager.scheduleSquish(character, 0.5, 8, 2);

      // Act
      composeFrames(16);

      // Assert
      expect(CharacterMotionComposer.hasMotion(character)).toBe(false);
    });

    it('restarts from the beginning when the same squish is asked for again', () =>
    {
      // Arrange
      JuiceMotionManager.scheduleSquish(character, 0.5, 8);
      const atPeak = composeFrames(4)
        .valueFor(MotionChannels.SCALE_X);

      // Act
      JuiceMotionManager.scheduleSquish(character, 0.5, 8);
      const afterRestart = composeFrames(1)
        .valueFor(MotionChannels.SCALE_X);

      // Assert
      expect(atPeak).toBeCloseTo(1.5, 10);
      expect(afterRestart).toBeCloseTo(1.19134, 4);
    });
  });

  describe('scheduleTilt', () =>
  {
    it('leans the body without touching its scale', () =>
    {
      // Arrange
      JuiceMotionManager.scheduleTilt(character, 0.8, 8);

      // Act
      const composition = composeFrames(4);

      // Assert
      expect(composition.valueFor(MotionChannels.ROTATION)).toBeCloseTo(0.8, 10);
      expect(composition.valueFor(MotionChannels.SCALE_X)).toBe(1);
    });

    it('lapses once its duration is spent', () =>
    {
      // Arrange
      JuiceMotionManager.scheduleTilt(character, 0.8, 8);

      // Act
      composeFrames(8);

      // Assert
      expect(CharacterMotionComposer.hasMotion(character)).toBe(false);
    });

    it('replaces a squish that was already running, because a body does one thing at a time', () =>
    {
      // Arrange
      JuiceMotionManager.scheduleSquish(character, 0.5, 8);
      composeFrames(4);

      // Act
      JuiceMotionManager.scheduleTilt(character, 0.8, 8);
      const composition = composeFrames(4);

      // Assert
      expect(composition.valueFor(MotionChannels.ROTATION)).toBeCloseTo(0.8, 10);
      expect(composition.valueFor(MotionChannels.SCALE_X)).toBe(1);
    });
  });

  describe('scheduleFlipBody', () =>
  {
    it('turns the body the way it was told to', () =>
    {
      // Arrange
      JuiceMotionManager.scheduleFlipBody(character, 'cw', 24);

      // Act
      const composition = composeFrames(12);

      // Assert
      expect(composition.valueFor(MotionChannels.ROTATION)).toBeCloseTo(Math.PI, 10);
    });

    it('turns the other way when asked for counter-clockwise', () =>
    {
      // Arrange
      JuiceMotionManager.scheduleFlipBody(character, 'ccw', 24);

      // Act
      const composition = composeFrames(12);

      // Assert
      expect(composition.valueFor(MotionChannels.ROTATION)).toBeCloseTo(-Math.PI, 10);
    });

    it('makes as many turns as it was asked for within the same budget', () =>
    {
      // Arrange
      JuiceMotionManager.scheduleFlipBody(character, 'cw', 24, 2);

      // Act
      const composition = composeFrames(12);

      // Assert
      expect(composition.valueFor(MotionChannels.ROTATION)).toBeCloseTo(2 * Math.PI, 10);
    });
  });

  describe('scheduleCastingPulse', () =>
  {
    it('starts the character shimmering', () =>
    {
      // Act
      JuiceMotionManager.scheduleCastingPulse(character, 0.5, 4);

      // Assert
      expect(CharacterMotionComposer.hasMotion(character)).toBe(true);
    });

    it('lapses shortly after whatever was renewing it stops', () =>
    {
      // Arrange
      JuiceMotionManager.scheduleCastingPulse(character, 0.5, 4);

      // Act
      composeFrames(4);

      // Assert
      expect(CharacterMotionComposer.hasMotion(character)).toBe(false);
    });

    it('keeps building rather than restarting when it is renewed', () =>
    {
      // Arrange
      JuiceMotionManager.scheduleCastingPulse(character, 0.5, 4);
      composeFrames(2);

      // Act
      JuiceMotionManager.scheduleCastingPulse(character, 0.5, 4);
      const composition = composeFrames(1);

      // Assert
      // a restart would compose 1.05226 here, one frame into a fresh pulse.
      expect(composition.valueFor(MotionChannels.SCALE_X)).toBeCloseTo(1.15704, 4);
    });

    it('survives longer than its heartbeat while something keeps renewing it', () =>
    {
      // Arrange
      JuiceMotionManager.scheduleCastingPulse(character, 0.5, 4);

      // Act
      for (let index = 0; index < 20; index++)
      {
        JuiceMotionManager.scheduleCastingPulse(character, 0.5, 4);
        composeFrames(1);
      }

      // Assert
      expect(CharacterMotionComposer.hasMotion(character)).toBe(true);
    });
  });

  describe('cancelCastingPulse', () =>
  {
    it('settles a battler that was charging', () =>
    {
      // Arrange
      JuiceMotionManager.scheduleCastingPulse(character, 0.5, 4);
      composeFrames(1);

      // Act
      JuiceMotionManager.cancelCastingPulse(character);
      composeFrames(1);

      // Assert
      expect(CharacterMotionComposer.hasMotion(character)).toBe(false);
    });

    it('leaves a reaction running, because the two are separate things happening at once', () =>
    {
      // Arrange- this is the whole reason the pulse has its own source. A battler struck while
      // casting is doing both, and finishing the cast must not cut the flinch short.
      JuiceMotionManager.scheduleCastingPulse(character, 0.5, 4);
      JuiceMotionManager.scheduleSquish(character, 0.5, 8);

      // Act
      JuiceMotionManager.cancelCastingPulse(character);
      const composition = composeFrames(4);

      // Assert- still deforming, which only the squish does.
      expect(CharacterMotionComposer.hasMotion(character)).toBe(true);
      expect(composition.valueFor(MotionChannels.SCALE_X)).toBeCloseTo(1.5, 10);
    });
  });

  describe('a reaction landing on a battler that is already charging', () =>
  {
    it('plays the reaction in full rather than being wiped by the next renewal', () =>
    {
      // Arrange- the heartbeat renews the pulse every frame. Sharing one source key with the
      // reaction meant each rebuilt the other, so a hit on a caster flinched for exactly one frame.
      JuiceMotionManager.scheduleCastingPulse(character, 0.5, 4);
      JuiceMotionManager.scheduleSquish(character, 0.5, 8);

      // Act- keep the cast alive across the whole squish, the way a real cast would.
      let composition = null;
      for (let index = 0; index < 4; index++)
      {
        JuiceMotionManager.scheduleCastingPulse(character, 0.5, 4);
        composition = composeFrames(1);
      }

      // Assert- the squish reached its peak, so it survived four renewals of the pulse.
      expect(composition.valueFor(MotionChannels.SCALE_X)).toBeCloseTo(1.5, 10);
    });

    it('keeps the charge glow burning underneath the reaction', () =>
    {
      // Arrange
      JuiceMotionManager.scheduleCastingPulse(character, 0.5, 4);
      JuiceMotionManager.scheduleSquish(character, 0.5, 8);

      // Act
      const composition = composeFrames(2);

      // Assert- the flash is the pulse's alone; the squish never writes it.
      const [ red, green, blue ] = composition.valueFor(MotionChannels.FLASH);
      expect([ red, green, blue ]).toStrictEqual([ 180, 220, 255 ]);
    });
  });

  describe('cancelForCharacter', () =>
  {
    it('settles a battler that was mid-reaction', () =>
    {
      // Arrange
      JuiceMotionManager.scheduleCastingPulse(character, 0.5, 4);
      composeFrames(1);

      // Act
      JuiceMotionManager.cancelForCharacter(character);
      composeFrames(1);

      // Assert
      expect(CharacterMotionComposer.hasMotion(character)).toBe(false);
    });

    it('is harmless on a battler that was not reacting to anything', () =>
    {
      // Act
      JuiceMotionManager.cancelForCharacter(character);

      // Assert
      expect(CharacterMotionComposer.hasMotion(character)).toBe(false);
    });
  });

  describe('frameTick', () =>
  {
    it('advances every queued overlay effect', () =>
    {
      // Arrange
      const effect = buildOverlayEffect();
      JuiceMotionManager.pushExternalEffect(effect);

      // Act
      JuiceMotionManager.frameTick();

      // Assert
      expect(effect.tick).toHaveBeenCalledTimes(1);
    });

    it('does nothing at all when the queue is empty', () =>
    {
      // Arrange
      const effect = buildOverlayEffect();

      // Act
      JuiceMotionManager.frameTick();

      // Assert
      expect(effect.tick).not.toHaveBeenCalled();
    });

    it('keeps an effect that reports it has more to do', () =>
    {
      // Arrange
      const survivor = buildOverlayEffect({ tick: vi.fn(() => true) });
      JuiceMotionManager.pushExternalEffect(survivor);

      // Act
      JuiceMotionManager.frameTick();
      JuiceMotionManager.frameTick();

      // Assert
      expect(survivor.tick).toHaveBeenCalledTimes(2);
    });

    it('drops an effect that reports it has finished', () =>
    {
      // Arrange
      const finished = buildOverlayEffect({ tick: vi.fn(() => false) });
      JuiceMotionManager.pushExternalEffect(finished);

      // Act
      JuiceMotionManager.frameTick();
      JuiceMotionManager.frameTick();

      // Assert
      expect(finished.tick).toHaveBeenCalledTimes(1);
    });

    it('discards an effect whose sprite was destroyed without ticking it', () =>
    {
      // Arrange
      const dead = buildOverlayEffect({ isSpriteAlive: vi.fn(() => false) });
      const alive = buildOverlayEffect();
      JuiceMotionManager.pushExternalEffect(dead);
      JuiceMotionManager.pushExternalEffect(alive);

      // Act
      JuiceMotionManager.frameTick();
      JuiceMotionManager.frameTick();

      // Assert
      expect(dead.tick).not.toHaveBeenCalled();
      expect(alive.tick).toHaveBeenCalledTimes(2);
    });
  });

  describe('clearAll', () =>
  {
    it('empties the overlay queue so a later frameTick ticks nothing', () =>
    {
      // Arrange
      const effect = buildOverlayEffect();
      JuiceMotionManager.pushExternalEffect(effect);

      // Act
      JuiceMotionManager.clearAll();
      JuiceMotionManager.frameTick();

      // Assert
      expect(effect.tick).not.toHaveBeenCalled();
    });
  });
});
//endregion plugins/abs/ext/juice/managers/juice-motion-manager.test.js