//region plugins/motion/core/core/motion-channels.test.js
import { beforeAll, describe, expect, it } from 'vitest';
import { installMotionHostGlobals } from '../../fixtures/install-motion-host-globals.js';

describe('MotionChannels', () =>
{
  /** @type {typeof import('../../../../../src/plugins/motion/core/core/MotionChannels.js').default} */
  let MotionChannels;

  beforeAll(async () =>
  {
    // the tone combiner leans on the engine's Number#clamp.
    installMotionHostGlobals();

    ({ default: MotionChannels } = await import('../../../../../src/plugins/motion/core/core/MotionChannels.js'));
  });

  describe('all', () =>
  {
    it('reports every channel exactly once', () =>
    {
      // Act
      const channels = MotionChannels.all();

      // Assert
      expect(channels).toHaveLength(10);
      expect(new Set(channels).size).toBe(10);
    });
  });

  describe('identityFor', () =>
  {
    it('gives the multiplicative channels an identity of one', () =>
    {
      // Assert
      expect(MotionChannels.identityFor(MotionChannels.SCALE_X)).toBe(1.0);
      expect(MotionChannels.identityFor(MotionChannels.SCALE_Y)).toBe(1.0);
      expect(MotionChannels.identityFor(MotionChannels.OPACITY)).toBe(1.0);
    });

    it('gives the additive channels an identity of zero', () =>
    {
      // Assert
      expect(MotionChannels.identityFor(MotionChannels.OFFSET_X)).toBe(0);
      expect(MotionChannels.identityFor(MotionChannels.ROTATION)).toBe(0);
      expect(MotionChannels.identityFor(MotionChannels.HUE)).toBe(0);
    });

    it('gives an untinted sprite full white rather than black', () =>
    {
      // Act
      const identity = MotionChannels.identityFor(MotionChannels.TINT);

      // Assert
      expect(identity).toEqual([ 255, 255, 255 ]);
    });

    it('gives tone four components and flash four components, both at zero', () =>
    {
      // Assert
      expect(MotionChannels.identityFor(MotionChannels.TONE)).toEqual([ 0, 0, 0, 0 ]);
      expect(MotionChannels.identityFor(MotionChannels.FLASH)).toEqual([ 0, 0, 0, 0 ]);
    });

    it('builds a fresh array each time, so one character cannot colour another', () =>
    {
      // Arrange
      const first = MotionChannels.identityFor(MotionChannels.TONE);

      // Act
      first[0] = 255;
      const second = MotionChannels.identityFor(MotionChannels.TONE);

      // Assert
      expect(second).toEqual([ 0, 0, 0, 0 ]);
    });
  });

  describe('combine', () =>
  {
    it('sums pixel offsets, so two nudges move the sprite twice as far', () =>
    {
      // Act
      const combined = MotionChannels.combine(MotionChannels.OFFSET_X, 4, 3);

      // Assert
      expect(combined).toBe(7);
    });

    it('sums rotations', () =>
    {
      // Act
      const combined = MotionChannels.combine(MotionChannels.ROTATION, 0.5, 0.25);

      // Assert
      expect(combined).toBe(0.75);
    });

    it('multiplies scales, so a swell inside a growth compounds rather than adds', () =>
    {
      // Act
      const combined = MotionChannels.combine(MotionChannels.SCALE_X, 1.5, 1.05);

      // Assert
      expect(combined).toBeCloseTo(1.575, 10);
    });

    it('multiplies opacity', () =>
    {
      // Act
      const combined = MotionChannels.combine(MotionChannels.OPACITY, 0.5, 0.5);

      // Assert
      expect(combined).toBe(0.25);
    });

    it('wraps a hue that runs past a full turn', () =>
    {
      // Act
      const combined = MotionChannels.combine(MotionChannels.HUE, 300, 120);

      // Assert
      expect(combined).toBe(60);
    });

    it('wraps a hue that runs backwards past zero into the positive range', () =>
    {
      // Act
      const combined = MotionChannels.combine(MotionChannels.HUE, 10, -40);

      // Assert
      expect(combined).toBe(330);
    });

    it('leaves a hue inside the range alone', () =>
    {
      // Act
      const combined = MotionChannels.combine(MotionChannels.HUE, 100, 45);

      // Assert
      expect(combined).toBe(145);
    });

    it('multiplies tints in normalized space, so half red over half red deepens', () =>
    {
      // Act
      const combined = MotionChannels.combine(MotionChannels.TINT, [ 255, 128, 128 ], [ 255, 128, 128 ]);

      // Assert
      expect(combined[0]).toBe(255);
      expect(combined[1]).toBeCloseTo(64.25, 2);
    });

    it('sums tone components', () =>
    {
      // Act
      const combined = MotionChannels.combine(MotionChannels.TONE, [ 10, 20, 30, 0 ], [ 5, 5, 5, 40 ]);

      // Assert
      expect(combined).toEqual([ 15, 25, 35, 40 ]);
    });

    it('clamps a tone that would exceed what the colour filter accepts', () =>
    {
      // Act
      const combined = MotionChannels.combine(MotionChannels.TONE, [ 200, 0, 0, 0 ], [ 200, -400, 0, 0 ]);

      // Assert
      expect(combined).toEqual([ 255, -255, 0, 0 ]);
    });

    it('keeps the stronger flash rather than adding the two together', () =>
    {
      // Arrange
      const strong = [ 255, 0, 0, 200 ];
      const weak = [ 0, 0, 255, 90 ];

      // Act
      const combined = MotionChannels.combine(MotionChannels.FLASH, strong, weak);

      // Assert
      expect(combined).toEqual(strong);
    });

    it('takes over from a weaker flash when the newcomer is stronger', () =>
    {
      // Arrange
      const weak = [ 0, 0, 255, 90 ];
      const strong = [ 255, 0, 0, 200 ];

      // Act
      const combined = MotionChannels.combine(MotionChannels.FLASH, weak, strong);

      // Assert
      expect(combined).toEqual(strong);
    });

    it('keeps the incumbent when two flashes are exactly as strong as each other', () =>
    {
      // Arrange
      const incumbent = [ 255, 0, 0, 120 ];
      const rival = [ 0, 255, 0, 120 ];

      // Act
      const combined = MotionChannels.combine(MotionChannels.FLASH, incumbent, rival);

      // Assert
      expect(combined).toEqual(incumbent);
    });
  });
});
//endregion plugins/motion/core/core/motion-channels.test.js