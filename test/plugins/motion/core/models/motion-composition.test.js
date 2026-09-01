//region plugins/motion/core/models/motion-composition.test.js
import { beforeAll, describe, expect, it } from 'vitest';
import { installMotionHostGlobals } from '../../fixtures/install-motion-host-globals.js';

describe('MotionComposition', () =>
{
  /** @type {typeof import('../../../../../src/plugins/motion/core/models/MotionComposition.js').default} */
  let MotionComposition;

  /** @type {typeof import('../../../../../src/plugins/motion/core/core/MotionChannels.js').default} */
  let MotionChannels;

  beforeAll(async () =>
  {
    installMotionHostGlobals();

    // literal import paths, so Stryker can map mutants in these files back to this test file.
    ({ default: MotionComposition } =
      await import('../../../../../src/plugins/motion/core/models/MotionComposition.js'));
    ({ default: MotionChannels } =
      await import('../../../../../src/plugins/motion/core/core/MotionChannels.js'));
  });

  /**
   * A stand-in for an effect. The composition compares these by identity and asks each one whether
   * it is a baseline, so a bare object answering that is a truthful collaborator rather than a
   * simplification.
   * @param {string} name A label, so a failing assertion says which one.
   * @returns {Object}
   */
  const anEffect = name => ({
    name,
    isBaseline: () => false,
  });

  /**
   * A stand-in for an effect that states what a channel rests at rather than how it wobbles.
   * @param {string} name A label, so a failing assertion says which one.
   * @returns {Object}
   */
  const aBaselineEffect = name => ({
    name,
    isBaseline: () => true,
  });

  describe('construction', () =>
  {
    it('starts every channel at the value that means "doing nothing"', () =>
    {
      // Act
      const composition = new MotionComposition();

      // Assert
      expect(composition.valueFor(MotionChannels.OFFSET_X)).toBe(0);
      expect(composition.valueFor(MotionChannels.SCALE_X)).toBe(1.0);
      expect(composition.valueFor(MotionChannels.TINT)).toEqual([ 255, 255, 255 ]);
    });

    it('does not ask for centred rotation until something requests it', () =>
    {
      // Act
      const composition = new MotionComposition();

      // Assert
      expect(composition.hasCenterRotation()).toBe(false);
    });
  });

  describe('contribute', () =>
  {
    it('folds an uncontested contribution into the channel', () =>
    {
      // Arrange
      const composition = new MotionComposition();
      const effect = anEffect('sway');

      // Act
      composition.contribute(effect, MotionChannels.OFFSET_X, 6);

      // Assert
      expect(composition.valueFor(MotionChannels.OFFSET_X)).toBe(6);
    });

    it('composes two uncontested contributions to the same channel', () =>
    {
      // Arrange
      const composition = new MotionComposition();
      const sway = anEffect('sway');
      const shake = anEffect('shake');

      // Act
      composition.contribute(sway, MotionChannels.OFFSET_X, 6);
      composition.contribute(shake, MotionChannels.OFFSET_X, 4);

      // Assert
      expect(composition.valueFor(MotionChannels.OFFSET_X)).toBe(10);
    });

    it('discards a contribution to a channel somebody else has claimed', () =>
    {
      // Arrange
      const composition = new MotionComposition();
      const claimant = anEffect('squish');
      const bystander = anEffect('breathe');
      composition.awardClaim(MotionChannels.SCALE_Y, claimant);

      // Act
      composition.contribute(bystander, MotionChannels.SCALE_Y, 1.05);

      // Assert
      expect(composition.valueFor(MotionChannels.SCALE_Y)).toBe(1.0);
    });

    it('takes the claimant\'s value outright rather than combining it', () =>
    {
      // Arrange
      const composition = new MotionComposition();
      const claimant = anEffect('squish');
      composition.awardClaim(MotionChannels.SCALE_Y, claimant);

      // Act
      composition.contribute(claimant, MotionChannels.SCALE_Y, 1.4);

      // Assert
      expect(composition.valueFor(MotionChannels.SCALE_Y)).toBe(1.4);
    });

    it('keeps a baseline contribution to a channel somebody else has claimed', () =>
    {
      // Arrange- the breathe is the near miss: same channel, same claim, but a wobble rather than a
      // baseline, so it must still be discarded while the held scale survives.
      const composition = new MotionComposition();
      const claimant = anEffect('squish');
      const wobble = anEffect('breathe');
      const held = aBaselineEffect('scale');
      composition.awardClaim(MotionChannels.SCALE_Y, claimant);

      // Act
      composition.contribute(held, MotionChannels.SCALE_Y, 1.5);
      composition.contribute(wobble, MotionChannels.SCALE_Y, 1.05);
      composition.contribute(claimant, MotionChannels.SCALE_Y, 0.8);

      // Assert
      expect(composition.valueFor(MotionChannels.SCALE_Y)).toBeCloseTo(1.2, 10);
    });

    it('composes several baselines under one claim', () =>
    {
      // Arrange
      const composition = new MotionComposition();
      const claimant = anEffect('squish');
      const held = aBaselineEffect('scale');
      const alsoHeld = aBaselineEffect('otherScale');
      composition.awardClaim(MotionChannels.SCALE_Y, claimant);

      // Act
      composition.contribute(held, MotionChannels.SCALE_Y, 1.5);
      composition.contribute(alsoHeld, MotionChannels.SCALE_Y, 2.0);
      composition.contribute(claimant, MotionChannels.SCALE_Y, 0.5);

      // Assert
      expect(composition.valueFor(MotionChannels.SCALE_Y)).toBeCloseTo(1.5, 10);
    });

    it('composes a baseline additively on a channel that sums', () =>
    {
      // Arrange- rotation sums rather than multiplying, so a held angle under a tilt's claim has to
      // add to it rather than scale it.
      const composition = new MotionComposition();
      const claimant = anEffect('tilt');
      const held = aBaselineEffect('angle');
      composition.awardClaim(MotionChannels.ROTATION, claimant);

      // Act
      composition.contribute(held, MotionChannels.ROTATION, 0.5);
      composition.contribute(claimant, MotionChannels.ROTATION, 0.25);

      // Assert
      expect(composition.valueFor(MotionChannels.ROTATION)).toBeCloseTo(0.75, 10);
    });

    it('leaves a claimant\'s other channels open to everybody', () =>
    {
      // Arrange
      const composition = new MotionComposition();
      const claimant = anEffect('squish');
      const bystander = anEffect('sway');
      composition.awardClaim(MotionChannels.SCALE_Y, claimant);

      // Act
      composition.contribute(bystander, MotionChannels.OFFSET_X, 6);

      // Assert
      expect(composition.valueFor(MotionChannels.OFFSET_X)).toBe(6);
      expect(composition.valueFor(MotionChannels.SCALE_Y)).toBe(1.0);
    });
  });

  describe('claimantFor', () =>
  {
    it('reports nobody for an uncontested channel', () =>
    {
      // Arrange
      const composition = new MotionComposition();

      // Act
      const claimant = composition.claimantFor(MotionChannels.ROTATION);

      // Assert
      expect(claimant).toBeNull();
    });

    it('reports the effect that was awarded the channel', () =>
    {
      // Arrange
      const composition = new MotionComposition();
      const claimant = anEffect('spin');
      composition.awardClaim(MotionChannels.ROTATION, claimant);

      // Act
      const found = composition.claimantFor(MotionChannels.ROTATION);

      // Assert
      expect(found).toBe(claimant);
    });
  });

  describe('flagCenterRotation', () =>
  {
    it('records the request for the view to act on', () =>
    {
      // Arrange
      const composition = new MotionComposition();

      // Act
      composition.flagCenterRotation();

      // Assert
      expect(composition.hasCenterRotation()).toBe(true);
    });
  });

  describe('accepts', () =>
  {
    it('takes anything on a channel nobody owns', () =>
    {
      // Arrange
      const composition = new MotionComposition();

      // Act
      const accepted = composition.accepts(anEffect('nobody-in-particular'), MotionChannels.ROTATION);

      // Assert
      expect(accepted).toBe(true);
    });

    it('takes a baseline even on a channel somebody else owns', () =>
    {
      // Arrange
      const owner = anEffect('owner');
      const composition = new MotionComposition();
      composition.awardClaim(MotionChannels.ROTATION, owner);

      // Act
      const accepted = composition.accepts(aBaselineEffect('angle'), MotionChannels.ROTATION);

      // Assert
      expect(accepted).toBe(true);
    });

    it('takes the owner\'s own contribution', () =>
    {
      // Arrange
      const owner = anEffect('owner');
      const composition = new MotionComposition();
      composition.awardClaim(MotionChannels.ROTATION, owner);

      // Act
      const accepted = composition.accepts(owner, MotionChannels.ROTATION);

      // Assert
      expect(accepted).toBe(true);
    });

    it('refuses anybody else on an owned channel', () =>
    {
      // Arrange
      const owner = anEffect('owner');
      const outsider = anEffect('outsider');
      const composition = new MotionComposition();
      composition.awardClaim(MotionChannels.ROTATION, owner);

      // Act
      const accepted = composition.accepts(outsider, MotionChannels.ROTATION);

      // Assert
      expect(accepted).toBe(false);
    });

    it('answers per channel, so losing one says nothing about the rest', () =>
    {
      // Arrange- the near-miss. A claim on rotation must not make the same effect unwelcome
      // everywhere else.
      const owner = anEffect('owner');
      const outsider = anEffect('outsider');
      const composition = new MotionComposition();
      composition.awardClaim(MotionChannels.ROTATION, owner);

      // Act
      const onClaimed = composition.accepts(outsider, MotionChannels.ROTATION);
      const onFree = composition.accepts(outsider, MotionChannels.OFFSET_X);

      // Assert
      expect(onClaimed).toBe(false);
      expect(onFree).toBe(true);
    });
  });
});
//endregion plugins/motion/core/models/motion-composition.test.js