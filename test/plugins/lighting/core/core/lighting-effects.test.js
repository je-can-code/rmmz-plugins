//region plugins/lighting/core/core/lighting-effects.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

describe('LightingEffects and the curves that drive them', () =>
{
  let LightingEffects;
  let LightingEasing;

  beforeAll(async () =>
  {
    vi.resetModules();

    ({ default: LightingEffects } =
      await import('../../../../../src/plugins/lighting/core/core/LightingEffects.js'));
    ({ default: LightingEasing } =
      await import('../../../../../src/plugins/lighting/core/core/LightingEasing.js'));
  });

  describe('LightingEffects', () =>
  {
    it('offers exactly the behaviours an author can write', () =>
    {
      // Arrange
      // Act
      const result = LightingEffects.authorable();

      // Assert
      expect(result).toEqual([ 'flicker', 'pulse', 'glitch' ]);
    });

    it('does not offer steady as a keyword, since it is what silence means', () =>
    {
      // Arrange
      // Act
      const result = LightingEffects.isEffect(LightingEffects.STEADY);

      // Assert
      // offering it would invite the question of what `<light:[4, steady, flicker]>` means.
      expect(result).toBe(false);
    });

    it('recognises a behaviour it knows', () =>
    {
      // Arrange
      // Act
      const result = LightingEffects.isEffect('glitch');

      // Assert
      expect(result).toBe(true);
    });

    it('does not recognise a near-miss of one it knows', () =>
    {
      // Arrange
      // Act
      const result = LightingEffects.isEffect('flickr');

      // Assert
      // the near-miss is the point: a typo has to be refused rather than quietly honoured.
      expect(result).toBe(false);
    });
  });

  describe('pulseStrength', () =>
  {
    it('never brightens a light past the strength its author asked for', () =>
    {
      // Arrange
      const samples = [];

      // Act
      for (let frame = 0; frame < 400; frame++) samples.push(LightingEasing.pulseStrength(frame, 0, 0.45, 90));

      // Assert
      expect(Math.max(...samples)).toBeLessThanOrEqual(1);
    });

    it('never dims below the depth its author asked for', () =>
    {
      // Arrange
      const samples = [];

      // Act
      for (let frame = 0; frame < 400; frame++) samples.push(LightingEasing.pulseStrength(frame, 0, 0.45, 90));

      // Assert
      expect(Math.min(...samples)).toBeGreaterThanOrEqual(0.55);
    });

    it('repeats exactly, which is what separates it from a flicker', () =>
    {
      // Arrange
      const first = LightingEasing.pulseStrength(10, 0, 0.45, 90);

      // Act
      const oneCycleLater = LightingEasing.pulseStrength(100, 0, 0.45, 90);

      // Assert
      expect(oneCycleLater).toBeCloseTo(first, 10);
    });

    it('does not repeat on a flicker, which is what separates that from a pulse', () =>
    {
      // Arrange
      const first = LightingEasing.flickerStrength(10, 0, 0.45, 90);

      // Act
      const oneCycleLater = LightingEasing.flickerStrength(100, 0, 0.45, 90);

      // Assert
      // the two beating waves are chosen at a fractional ratio precisely so this never lines up.
      expect(oneCycleLater).not.toBeCloseTo(first, 3);
    });

    it('holds a light perfectly steady when its pulse has no depth', () =>
    {
      // Arrange
      // Act
      const result = LightingEasing.pulseStrength(37, 1.2, 0, 90);

      // Assert
      expect(result).toBe(1);
    });
  });

  describe('glitchStrength', () =>
  {
    /**
     * How many of a stretch of frames the light was actually dropped for.
     * @param {number} phase The light's own offset.
     * @param {number} chance How likely a window is to fault.
     * @returns {number}
     */
    const droppedFramesOver = (phase, chance) =>
    {
      let dropped = 0;

      for (let frame = 0; frame < 2000; frame++)
      {
        if (LightingEasing.glitchStrength(frame, phase, 0.85, 55, chance) < 1) dropped++;
      }

      return dropped;
    };

    it('spends most of its time at full strength', () =>
    {
      // Arrange
      // Act
      const dropped = droppedFramesOver(1.7, 0.28);

      // Assert
      // what sells a dying tube is the waiting; a light that stuttered constantly is just a flicker.
      expect(dropped).toBeLessThan(2000 * 0.2);
    });

    it('actually faults sometimes', () =>
    {
      // Arrange
      // Act
      const dropped = droppedFramesOver(1.7, 0.28);

      // Assert
      expect(dropped).toBeGreaterThan(0);
    });

    it('never faults at all when nothing is ever going to go wrong', () =>
    {
      // Arrange
      // Act
      const dropped = droppedFramesOver(1.7, 0);

      // Assert
      expect(dropped).toBe(0);
    });

    it('holds its verdict for the whole of a window rather than re-rolling each frame', () =>
    {
      // Arrange
      // a window that faults should keep faulting through its burst; one that does not should stay
      // quiet for its whole length. re-rolling per frame would turn both into constant noise.
      const values = [];

      // Act
      for (let frame = 0; frame < 55; frame++) values.push(LightingEasing.glitchStrength(frame, 0, 0.85, 55, 1));

      // Assert
      // with certainty of faulting, the burst occupies the opening and the rest is quiet.
      expect(values.slice(20)
        .every(value => value === 1)).toBe(true);
      expect(values.slice(0, 18)
        .some(value => value < 1)).toBe(true);
    });

    it('stutters within its burst rather than simply dropping for the whole of it', () =>
    {
      // Arrange
      // a window certain to fault, so the only thing left to observe is the shape of the burst.
      const dropped = LightingEasing.glitchStrength(0, 0, 0.85, 55, 1);

      // Act
      const recovered = LightingEasing.glitchStrength(2, 0, 0.85, 55, 1);

      // Assert
      // a tube that just went dark for a third of a second has died; one that chatters on and off is
      // failing, which is the thing being drawn. the two frames are deliberately adjacent steps.
      expect(dropped).toBeCloseTo(0.15, 10);
      expect(recovered).toBe(1);
    });

    it('holds each step for more than a single frame, so the stutter is visible', () =>
    {
      // Arrange
      const firstFrameOfStep = LightingEasing.glitchStrength(0, 0, 0.85, 55, 1);

      // Act
      const secondFrameOfStep = LightingEasing.glitchStrength(1, 0, 0.85, 55, 1);

      // Assert
      // alternating every single frame at sixty frames a second reads as a grey haze rather than as
      // a stutter, so a step lasts long enough to be seen as an on or an off.
      expect(secondFrameOfStep).toBe(firstFrameOfStep);
    });

    it('bursts at different moments even when two lights are both certain to fault', () =>
    {
      // Arrange
      // certainty removes the other reason this could pass: with `chance` at 1 neither light can
      // skip a window, so a difference between them can only come from WHEN each one bursts.
      const first = [];
      const second = [];

      // Act
      for (let frame = 0; frame < 220; frame++)
      {
        first.push(LightingEasing.glitchStrength(frame, 0, 0.85, 55, 1) < 1);
        second.push(LightingEasing.glitchStrength(frame, 0.5, 0.85, 55, 1) < 1);
      }

      // Assert
      expect(first).not.toEqual(second);
    });

    it('gives two lights different schedules, so a room never stutters in unison', () =>
    {
      // Arrange
      const first = [];
      const second = [];

      // Act
      for (let frame = 0; frame < 600; frame++)
      {
        first.push(LightingEasing.glitchStrength(frame, 0.4, 0.85, 55, 0.28));
        second.push(LightingEasing.glitchStrength(frame, 9.1, 0.85, 55, 0.28));
      }

      // Assert
      expect(first).not.toEqual(second);
    });
  });

  describe('randomRate', () =>
  {
    it('stays within the spread it was given', () =>
    {
      // Arrange
      const rates = [];

      // Act
      for (let roll = 0; roll < 500; roll++) rates.push(LightingEasing.randomRate(0.2));

      // Assert
      expect(Math.min(...rates)).toBeGreaterThanOrEqual(0.8);
      expect(Math.max(...rates)).toBeLessThanOrEqual(1.2);
    });

    it('actually varies, rather than sitting on the tuned rate', () =>
    {
      // Arrange
      const rates = new Set();

      // Act
      for (let roll = 0; roll < 50; roll++) rates.add(LightingEasing.randomRate(0.2));

      // Assert
      expect(rates.size).toBeGreaterThan(1);
    });

    it('hands every light the tuned rate exactly when no spread is allowed', () =>
    {
      // Arrange
      // Act
      const result = LightingEasing.randomRate(0);

      // Assert
      // a bank of failing machines should fault on one schedule, so zero has to mean zero.
      expect(result).toBe(1);
    });
  });

  describe('strengthFor', () =>
  {
    const tuning = { depth: 0.5, period: 40, chance: 0.28 };

    it('stretches an effect to the tempo of the light running it', () =>
    {
      // Arrange
      // a light at half rate runs a period twice as long, so frame 20 of it should sit exactly where
      // frame 20 of a period-80 light sits.
      const expected = LightingEasing.pulseStrength(20, 0, tuning.depth, 80);

      // Act
      const result = LightingEasing.strengthFor('pulse', 20, 0, tuning, 2);

      // Assert
      expect(result).toBe(expected);
    });

    it('lets two lights of one tuning drift apart rather than holding their stagger', () =>
    {
      // Arrange
      // the same phase on purpose: with a shared rate these two would be identical forever, so any
      // difference between them can only have come from the tempo.
      const slow = [];
      const quick = [];

      // Act
      for (let frame = 0; frame < 300; frame++)
      {
        slow.push(LightingEasing.strengthFor('pulse', frame, 0, tuning, 0.85));
        quick.push(LightingEasing.strengthFor('pulse', frame, 0, tuning, 1.15));
      }

      // Assert
      expect(slow).not.toEqual(quick);
    });

    it('leaves a steady light alone entirely', () =>
    {
      // Arrange
      // Act
      const result = LightingEasing.strengthFor('steady', 37, 1.2, tuning, 1);

      // Assert
      expect(result).toBe(1);
    });

    it('routes a flicker to the flame curve', () =>
    {
      // Arrange
      const expected = LightingEasing.flickerStrength(37, 1.2, tuning.depth, tuning.period);

      // Act
      const result = LightingEasing.strengthFor('flicker', 37, 1.2, tuning, 1);

      // Assert
      expect(result).toBe(expected);
    });

    it('routes a pulse to the breathing curve', () =>
    {
      // Arrange
      const expected = LightingEasing.pulseStrength(37, 1.2, tuning.depth, tuning.period);

      // Act
      const result = LightingEasing.strengthFor('pulse', 37, 1.2, tuning, 1);

      // Assert
      expect(result).toBe(expected);
    });

    it('routes a glitch to the faulting curve', () =>
    {
      // Arrange
      // a tuning certain to fault, at the frame its burst opens. a glitch spends most of its life at
      // full strength, so asking it at an arbitrary frame would get back the same `1` that a light
      // dispatched nowhere at all returns - and the assertion could not tell those apart.
      const certainToFault = { depth: 0.5, period: 40, chance: 1 };

      // Act
      const result = LightingEasing.strengthFor('glitch', 0, 0, certainToFault, 1);

      // Assert
      expect(result).toBe(0.5);
    });

    it('leaves a light alone when asked for a behaviour nobody has heard of', () =>
    {
      // Arrange
      // Act
      const result = LightingEasing.strengthFor('wobble', 37, 1.2, tuning, 1);

      // Assert
      expect(result).toBe(1);
    });
  });
});
//endregion plugins/lighting/core/core/lighting-effects.test.js