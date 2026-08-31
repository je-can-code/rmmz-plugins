//region plugins/motion/core/models/motion-effect.test.js
import { beforeAll, describe, expect, it } from 'vitest';
import { installMotionHostGlobals } from '../../fixtures/install-motion-host-globals.js';

describe('MotionEffect', () =>
{
  /** @type {typeof import('../../../../../src/plugins/motion/core/models/MotionEffect.js').default} */
  let MotionEffect;

  /** @type {typeof import('../../../../../src/plugins/motion/core/models/MotionDeclaration.js').default} */
  let MotionDeclaration;

  beforeAll(async () =>
  {
    installMotionHostGlobals();

    const base = '../../../../../src/plugins/motion/core/';
    ({ default: MotionEffect } = await import(`${base}models/MotionEffect.js`));
    ({ default: MotionDeclaration } = await import(`${base}models/MotionDeclaration.js`));
  });

  /**
   * Builds a bare effect, which is what every subclass inherits before overriding anything.
   * @returns {Object} The effect.
   */
  const anEffect = () =>
  {
    const declaration = new MotionDeclaration('breathe', [ 0.08 ], 'page');

    return new MotionEffect(declaration, { amount: 0.08 }, 17);
  };

  describe('accessors', () =>
  {
    it('reports what it was built with', () =>
    {
      // Arrange
      const effect = anEffect();

      // Assert
      expect(effect.declaration()
        .type()).toBe('breathe');
      expect(effect.parameters()).toEqual({ amount: 0.08 });
      expect(effect.phaseOffset()).toBe(17);
    });

    it('starts with no frames elapsed', () =>
    {
      // Arrange
      const effect = anEffect();

      // Assert
      expect(effect.elapsedFrames()).toBe(0);
    });
  });

  describe('tick', () =>
  {
    it('counts the frames that pass', () =>
    {
      // Arrange
      const effect = anEffect();

      // Act
      effect.tick();
      effect.tick();
      effect.tick();

      // Assert
      expect(effect.elapsedFrames()).toBe(3);
    });
  });

  describe('removal', () =>
  {
    it('has not been asked to stop when it is built', () =>
    {
      // Arrange
      const effect = anEffect();

      // Assert
      expect(effect.hasRemovalRequested()).toBe(false);
      expect(effect.isDiscardable()).toBe(false);
    });

    it('becomes discardable as soon as it is asked to stop', () =>
    {
      // Arrange
      const effect = anEffect();

      // Act
      effect.requestRemoval();

      // Assert
      expect(effect.hasRemovalRequested()).toBe(true);
      expect(effect.isDiscardable()).toBe(true);
    });
  });

  describe('claims', () =>
  {
    it('claims nothing, so an ordinary motion composes with everything else', () =>
    {
      // Arrange
      const effect = anEffect();

      // Assert
      expect(effect.claims()).toEqual([]);
    });
  });

  describe('applyTo', () =>
  {
    it('refuses to run, because a subclass was supposed to say what this motion looks like', () =>
    {
      // Arrange
      const effect = anEffect();

      // Act
      const applying = () => effect.applyTo(null);

      // Assert
      expect(applying).toThrow('MotionEffect#applyTo must be implemented by a subclass.');
    });
  });

  describe('cancelRemoval', () =>
  {
    it('puts a withdrawn effect back to work', () =>
    {
      // Arrange
      const effect = anEffect();
      effect.requestRemoval();

      // Act
      effect.cancelRemoval();

      // Assert
      expect(effect.hasRemovalRequested()).toBe(false);
      expect(effect.isDiscardable()).toBe(false);
    });

    it('leaves an effect nobody withdrew exactly as it was', () =>
    {
      // Arrange
      const effect = anEffect();

      // Act
      effect.cancelRemoval();

      // Assert
      expect(effect.hasRemovalRequested()).toBe(false);
    });
  });
});
//endregion plugins/motion/core/models/motion-effect.test.js