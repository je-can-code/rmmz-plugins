//region plugins/motion/core/models/oscillator-motion-effect.test.js
import { beforeAll, describe, expect, it } from 'vitest';
import { installMotionHostGlobals } from '../../fixtures/install-motion-host-globals.js';

describe('OscillatorMotionEffect', () =>
{
  /** @type {typeof import('../../../../../src/plugins/motion/core/models/OscillatorMotionEffect.js').default} */
  let OscillatorMotionEffect;

  /** @type {typeof import('../../../../../src/plugins/motion/core/models/MotionDeclaration.js').default} */
  let MotionDeclaration;

  /** @type {typeof import('../../../../../src/plugins/motion/core/models/MotionComposition.js').default} */
  let MotionComposition;

  /** @type {typeof import('../../../../../src/plugins/motion/core/core/MotionChannels.js').default} */
  let MotionChannels;

  beforeAll(async () =>
  {
    installMotionHostGlobals();

    // every import path here is a literal on purpose. Stryker maps a mutant to the tests that cover
    // it by reading the import graph, and a path built from a template literal is invisible to that
    // - so a file imported that way reports every mutant as surviving whether or not it is tested.
    ({ default: OscillatorMotionEffect } =
      await import('../../../../../src/plugins/motion/core/models/OscillatorMotionEffect.js'));
    ({ default: MotionDeclaration } =
      await import('../../../../../src/plugins/motion/core/models/MotionDeclaration.js'));
    ({ default: MotionComposition } =
      await import('../../../../../src/plugins/motion/core/models/MotionComposition.js'));
    ({ default: MotionChannels } =
      await import('../../../../../src/plugins/motion/core/core/MotionChannels.js'));
  });

  /**
   * Builds an oscillator sitting at a chosen point in its cycle.
   *
   * The phase offset is the lever rather than repeated ticking: it is added to the frame count, so
   * setting it directly puts the effect exactly where a test wants it without a loop, and it also
   * exercises the offset itself on every single case.
   * @param {string} motionType The motion being built.
   * @param {Object} parameters The resolved parameters.
   * @param {number} phaseOffset Where in the cycle to sit.
   * @returns {Object} The effect.
   */
  const anOscillatorAt = (motionType, parameters, phaseOffset) =>
  {
    const declaration = new MotionDeclaration(motionType, [], 'page');

    return new OscillatorMotionEffect(declaration, parameters, phaseOffset);
  };

  /**
   * Applies an effect to a fresh composition and hands it back.
   * @param {Object} effect The effect to apply.
   * @returns {Object} The composition.
   */
  const composedFrom = effect =>
  {
    const composition = new MotionComposition();
    effect.applyTo(composition);

    return composition;
  };

  describe('waveforms', () =>
  {
    it('sits at the start of the cycle when no time has passed', () =>
    {
      // Arrange
      const effect = anOscillatorAt('breathe', { amount: 0.1, period: 100 }, 0);

      // Assert
      expect(effect.progress()).toBe(0);
      expect(effect.wave()).toBe(0);
      expect(effect.rise()).toBe(0);
    });

    it('peaks a quarter of the way through the cycle', () =>
    {
      // Arrange
      const effect = anOscillatorAt('breathe', { amount: 0.1, period: 100 }, 25);

      // Assert
      expect(effect.wave()).toBeCloseTo(1, 10);
      expect(effect.rise()).toBeCloseTo(0.5, 10);
    });

    it('reaches the far end of the unipolar waveform halfway through', () =>
    {
      // Arrange
      const effect = anOscillatorAt('float', { distance: 20, period: 100 }, 50);

      // Assert
      expect(effect.wave()).toBeCloseTo(0, 10);
      expect(effect.rise()).toBeCloseTo(1, 10);
    });

    it('swings negative on the back half of the cycle', () =>
    {
      // Arrange
      const effect = anOscillatorAt('breathe', { amount: 0.1, period: 100 }, 75);

      // Assert
      expect(effect.wave()).toBeCloseTo(-1, 10);
    });

    it('wraps back to the start of the cycle after a full period', () =>
    {
      // Arrange
      const effect = anOscillatorAt('breathe', { amount: 0.1, period: 100 }, 100);

      // Assert
      expect(effect.progress()).toBe(0);
    });

    it('advances with the frames that have elapsed', () =>
    {
      // Arrange
      const effect = anOscillatorAt('breathe', { amount: 0.1, period: 100 }, 0);

      // Act
      effect.tick();
      effect.tick();

      // Assert
      expect(effect.progress()).toBeCloseTo(0.02, 10);
    });
  });

  describe('breathe', () =>
  {
    it('lengthens as it narrows, so the character keeps its volume', () =>
    {
      // Arrange
      const effect = anOscillatorAt('breathe', { amount: 0.1, period: 100 }, 25);

      // Act
      const composition = composedFrom(effect);

      // Assert
      expect(composition.valueFor(MotionChannels.SCALE_Y)).toBeCloseTo(1.1, 10);
      expect(composition.valueFor(MotionChannels.SCALE_X)).toBeCloseTo(0.9, 10);
    });

    it('narrows as it shortens on the other half of the breath', () =>
    {
      // Arrange
      const effect = anOscillatorAt('breathe', { amount: 0.1, period: 100 }, 75);

      // Act
      const composition = composedFrom(effect);

      // Assert
      expect(composition.valueFor(MotionChannels.SCALE_Y)).toBeCloseTo(0.9, 10);
      expect(composition.valueFor(MotionChannels.SCALE_X)).toBeCloseTo(1.1, 10);
    });
  });

  describe('stretch', () =>
  {
    it('changes height and leaves width entirely alone', () =>
    {
      // Arrange
      const effect = anOscillatorAt('stretch', { amount: 0.1, period: 100 }, 25);

      // Act
      const composition = composedFrom(effect);

      // Assert
      expect(composition.valueFor(MotionChannels.SCALE_Y)).toBeCloseTo(1.1, 10);
      expect(composition.valueFor(MotionChannels.SCALE_X)).toBe(1.0);
    });
  });

  describe('pulse', () =>
  {
    it('moves both axes the same way, which is what makes it a heartbeat', () =>
    {
      // Arrange
      const effect = anOscillatorAt('pulse', { amount: 0.1, period: 100 }, 25);

      // Act
      const composition = composedFrom(effect);

      // Assert
      expect(composition.valueFor(MotionChannels.SCALE_Y)).toBeCloseTo(1.1, 10);
      expect(composition.valueFor(MotionChannels.SCALE_X)).toBeCloseTo(1.1, 10);
    });
  });

  describe('float', () =>
  {
    it('rises to its full distance at the top of the cycle', () =>
    {
      // Arrange
      const effect = anOscillatorAt('float', { distance: 20, period: 100 }, 50);

      // Act
      const composition = composedFrom(effect);

      // Assert
      expect(composition.valueFor(MotionChannels.OFFSET_Y)).toBeCloseTo(-20, 10);
    });

    it('rests on the ground at the bottom of the cycle', () =>
    {
      // Arrange
      const effect = anOscillatorAt('float', { distance: 20, period: 100 }, 0);

      // Act
      const composition = composedFrom(effect);

      // Assert
      expect(composition.valueFor(MotionChannels.OFFSET_Y)).toBe(0);
    });

    it('never sinks below the ground at any point in the cycle', () =>
    {
      // Arrange
      const samples = [ 0, 10, 25, 40, 50, 60, 75, 90, 99 ];

      // Act
      const heights = samples.map(offset =>
      {
        const effect = anOscillatorAt('float', { distance: 20, period: 100 }, offset);

        return composedFrom(effect).valueFor(MotionChannels.OFFSET_Y);
      });

      // Assert
      heights.forEach(height => expect(height).toBeLessThanOrEqual(0));
    });
  });

  describe('sway', () =>
  {
    it('drifts to one side at the peak of the wave', () =>
    {
      // Arrange
      const effect = anOscillatorAt('sway', { distance: 8, period: 100 }, 25);

      // Act
      const composition = composedFrom(effect);

      // Assert
      expect(composition.valueFor(MotionChannels.OFFSET_X)).toBeCloseTo(8, 10);
    });

    it('drifts to the other side on the back half, unlike a float', () =>
    {
      // Arrange
      const effect = anOscillatorAt('sway', { distance: 8, period: 100 }, 75);

      // Act
      const composition = composedFrom(effect);

      // Assert
      expect(composition.valueFor(MotionChannels.OFFSET_X)).toBeCloseTo(-8, 10);
    });
  });

  describe('swing', () =>
  {
    it('converts the authored degrees into the radians the channel wants', () =>
    {
      // Arrange
      const effect = anOscillatorAt('swing', { angle: 90, period: 100 }, 25);

      // Act
      const composition = composedFrom(effect);

      // Assert
      expect(composition.valueFor(MotionChannels.ROTATION)).toBeCloseTo(Math.PI / 2, 10);
    });

    it('does not ask for centred rotation, so it rocks about its feet', () =>
    {
      // Arrange
      const effect = anOscillatorAt('swing', { angle: 90, period: 100 }, 25);

      // Act
      const composition = composedFrom(effect);

      // Assert
      expect(composition.hasCenterRotation()).toBe(false);
    });
  });

  describe('ghost', () =>
  {
    it('reaches its authored maximum at the top of the cycle', () =>
    {
      // Arrange
      const effect = anOscillatorAt('ghost', { min: 0.2, max: 0.9, period: 100 }, 25);

      // Act
      const composition = composedFrom(effect);

      // Assert
      expect(composition.valueFor(MotionChannels.OPACITY)).toBeCloseTo(0.9, 10);
    });

    it('reaches its authored minimum at the bottom of the cycle', () =>
    {
      // Arrange
      const effect = anOscillatorAt('ghost', { min: 0.2, max: 0.9, period: 100 }, 75);

      // Act
      const composition = composedFrom(effect);

      // Assert
      expect(composition.valueFor(MotionChannels.OPACITY)).toBeCloseTo(0.2, 10);
    });

    it('sits halfway between the two at the start of the cycle', () =>
    {
      // Arrange
      const effect = anOscillatorAt('ghost', { min: 0.2, max: 0.9, period: 100 }, 0);

      // Act
      const composition = composedFrom(effect);

      // Assert
      expect(composition.valueFor(MotionChannels.OPACITY)).toBeCloseTo(0.55, 10);
    });
  });

  describe('throb', () =>
  {
    it('reaches its full tone at the peak of the pulse', () =>
    {
      // Arrange
      const parameters = { red: 10, green: 20, blue: 80, gray: 40, period: 100 };
      const effect = anOscillatorAt('throb', parameters, 50);

      // Act
      const composition = composedFrom(effect);

      // Assert
      const tone = composition.valueFor(MotionChannels.TONE);
      expect(tone[0]).toBeCloseTo(10, 10);
      expect(tone[2]).toBeCloseTo(80, 10);
      expect(tone[3]).toBeCloseTo(40, 10);
    });

    it('shows no tone at all at the bottom of the pulse', () =>
    {
      // Arrange
      const parameters = { red: 10, green: 20, blue: 80, gray: 40, period: 100 };
      const effect = anOscillatorAt('throb', parameters, 0);

      // Act
      const composition = composedFrom(effect);

      // Assert
      expect(composition.valueFor(MotionChannels.TONE)).toEqual([ 0, 0, 0, 0 ]);
    });
  });

  describe('flash', () =>
  {
    it('pulses its alpha while holding its colour steady', () =>
    {
      // Arrange
      const parameters = { color: [ 255, 128, 0 ], period: 100 };
      const effect = anOscillatorAt('flash', parameters, 50);

      // Act
      const composition = composedFrom(effect);

      // Assert
      const flash = composition.valueFor(MotionChannels.FLASH);
      expect(flash[0]).toBe(255);
      expect(flash[1]).toBe(128);
      expect(flash[3]).toBeCloseTo(255, 10);
    });

    it('is fully transparent at the bottom of the pulse', () =>
    {
      // Arrange
      const parameters = { color: [ 255, 128, 0 ], period: 100 };
      const effect = anOscillatorAt('flash', parameters, 0);

      // Act
      const composition = composedFrom(effect);

      // Assert
      const flash = composition.valueFor(MotionChannels.FLASH);
      expect(flash[3]).toBe(0);
    });
  });

  describe('an unrecognised binding', () =>
  {
    it('contributes nothing rather than throwing', () =>
    {
      // Arrange
      const effect = anOscillatorAt('nonsense', { amount: 0.1, period: 100 }, 25);

      // Act
      const composition = composedFrom(effect);

      // Assert
      expect(composition.valueFor(MotionChannels.SCALE_Y)).toBe(1.0);
      expect(composition.valueFor(MotionChannels.OFFSET_Y)).toBe(0);
    });
  });
});
//endregion plugins/motion/core/models/oscillator-motion-effect.test.js