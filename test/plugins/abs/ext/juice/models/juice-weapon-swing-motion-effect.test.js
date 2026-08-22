//region plugins/abs/ext/juice/models/juice-weapon-swing-motion-effect.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

/**
 * JuiceWeaponSwingMotionEffect.js is a genuine ES `class` extending JuiceBaseEffect (mocked per
 * the "unit tier mocks all downstream file-external dependencies" convention), so this file
 * dynamically imports it directly. Private static/instance methods (#forwardUnit, #tickArc,
 * #bashStrikeEase, etc.) are not directly reachable from tests- they're exercised indirectly
 * through the public static geometry helpers and through `tick()` across every motion type.
 */
describe('JuiceWeaponSwingMotionEffect (unit, JuiceBaseEffect mocked)', () =>
{
  /** @type {typeof import('../../../../../../src/plugins/abs/ext/juice/models/JuiceWeaponSwingMotionEffect.js').default} */
  let JuiceWeaponSwingMotionEffect;

  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = { ABS: { EXT: { JUICE: { Metadata: { spriteJuiceVerticalOffsetPixels: 0 } } } } };

    function Sprite()
    {
      this.anchor = { x: 0, y: 0 };
      this.scale = { x: 1, y: 1 };
      this.setFrame = vi.fn();
      this.destroy = vi.fn();
    }
    globalThis.Sprite = Sprite;

    vi.doMock('../../../../../../src/plugins/abs/ext/juice/models/JuiceBaseEffect.js', () => ({ default: class {} }));

    ({ default: JuiceWeaponSwingMotionEffect } =
      await import('../../../../../../src/plugins/abs/ext/juice/models/JuiceWeaponSwingMotionEffect.js'));
  });

  /**
   * Builds a fake parent character sprite test double.
   * @param {object} [overrides] Overrides.
   * @returns {object} A fake parent sprite.
   */
  function buildParentSprite(overrides = {})
  {
    return {
      transform: {},
      patternHeight: () => 48,
      removeChild: vi.fn(),
      addChild: vi.fn(),
      ...overrides,
    };
  }

  /**
   * Builds a fake overlay (weapon icon) sprite test double.
   * @param {object} [overrides] Overrides.
   * @returns {object} A fake overlay sprite.
   */
  function buildOverlay(overrides = {})
  {
    return {
      x: 0,
      y: 0,
      rotation: 0,
      scale: { x: 1, y: 1 },
      bitmap: {},
      anchor: { x: 0.5, y: 0.5 },
      _frame: { x: 0, y: 0, width: 32, height: 32 },
      destroy: vi.fn(),
      ...overrides,
    };
  }

  /**
   * Builds a real effect instance with sane, overridable constructor arguments.
   * @param {object} [overrides] Named overrides for constructor args.
   * @returns {{effect: object, parentSprite: object, overlay: object}}
   */
  function buildEffect(overrides = {})
  {
    const parentSprite = overrides.parentSprite ?? buildParentSprite();
    const overlay = overrides.overlay ?? buildOverlay();
    const effect = new JuiceWeaponSwingMotionEffect(
      parentSprite,
      overlay,
      overrides.baseRotation ?? 0,
      overrides.peakRotationRadians ?? 0,
      overrides.durationFrames ?? 10,
      overrides.motionType ?? JuiceWeaponSwingMotionEffect.MotionTypes.Arc,
      overrides.arcSpanDegrees ?? 120,
      overrides.swingDirection ?? 2,
      overrides.stabTipAngleRadians,
      overrides.neutralBaseX,
      overrides.neutralBaseY,
      overrides.repeatCount,
      overrides.profileGun
    );
    return { effect, parentSprite, overlay };
  }

  //region static geometry helpers
  describe('hourToTheta()', () =>
  {
    it('maps 0 (12 oclock) to -pi/2', () =>
    {
      expect(JuiceWeaponSwingMotionEffect.hourToTheta(0)).toBeCloseTo(-Math.PI / 2);
    });

    it('maps 3 (3 oclock) to 0', () =>
    {
      expect(JuiceWeaponSwingMotionEffect.hourToTheta(3)).toBeCloseTo(0);
    });
  });

  describe('arcCenterHourFromDirection()', () =>
  {
    it.each([
      [ 8, 0 ], [ 2, 6 ], [ 4, 9 ], [ 6, 3 ], [ 7, 10.5 ], [ 1, 7.5 ], [ 9, 1.5 ], [ 3, 4.5 ],
    ])('resolves direction %i to center hour %f', (dir, expected) =>
    {
      expect(JuiceWeaponSwingMotionEffect.arcCenterHourFromDirection(dir)).toEqual(expected);
    });

    it('falls back to 9 for an unrecognized direction', () =>
    {
      expect(JuiceWeaponSwingMotionEffect.arcCenterHourFromDirection(5)).toEqual(9);
    });
  });

  describe('computeArcPose()', () =>
  {
    it('computes a forward-arc pose (reverse false)', () =>
    {
      const pose = JuiceWeaponSwingMotionEffect.computeArcPose(2, 48, 120, false, 0.5);

      expect(pose).toHaveProperty('x');
      expect(pose).toHaveProperty('y');
      expect(pose).toHaveProperty('theta');
    });

    it('computes a reverse-arc pose', () =>
    {
      const pose = JuiceWeaponSwingMotionEffect.computeArcPose(2, 48, 120, true, 0.5);

      expect(pose).toHaveProperty('theta');
    });
  });

  describe('computeArcTravelRadians()', () =>
  {
    // The three ease branches only exist to keep both sample points inside 0..1 at the ends of the
    // sweep, and the price of that is a one-sided window: at the boundaries the chord is centred a
    // half-window away from the ease actually asked for, so the answer differs from the mid-range
    // formula by a real, visible amount. Asserting finiteness cannot see any of that - all three
    // branches return finite numbers, so the whole boundary handling could be deleted and the last
    // frame of every arc would quietly point somewhere else with nothing going red.
    it('computes travel radians near the low ease boundary', () =>
    {
      // Arrange & Act
      const travel = JuiceWeaponSwingMotionEffect.computeArcTravelRadians(2, 48, 120, false, 0);

      // Assert
      expect(travel).toBeCloseTo(1.0253809, 6);
    });

    it('computes travel radians near the high ease boundary', () =>
    {
      // Arrange & Act
      const travel = JuiceWeaponSwingMotionEffect.computeArcTravelRadians(2, 48, 120, false, 1);

      // Assert
      expect(travel).toBeCloseTo(-1.0253809, 6);
    });

    it('computes travel radians in the mid-range', () =>
    {
      expect(Number.isFinite(JuiceWeaponSwingMotionEffect.computeArcTravelRadians(2, 48, 120, true, 0.5))).toEqual(true);
    });

    // A near-zero pattern height shrinks the orbit until the two sampled poses sit closer together
    // than the guard's threshold, which is what sends these through the analytic derivative. A flat
    // zero would not do: at zero orbit the analytic derivative is also the zero vector, so both
    // routes hand back the same atan2(0, 0) and the guard could be deleted unnoticed. Kept just
    // above zero, the sampled chord still has a direction - a different one - so the two disagree.
    // Both cases sit at ease 0 on purpose: mid-sweep the chord of a circle is exactly the tangent
    // at its midpoint, so the analytic and sampled reads agree there and cannot be told apart.
    it('falls back to the analytic-derivative branch when sampled velocity degenerates to zero', () =>
    {
      // Arrange & Act
      const result = JuiceWeaponSwingMotionEffect.computeArcTravelRadians(2, 1e-7, 120, false, 0);

      // Assert
      expect(result).toBeCloseTo(1.0471976, 6);
    });

    it('falls back to the analytic-derivative branch on the reverse arc too', () =>
    {
      // Arrange & Act: reverse walks the clock the other way, so its derivative points the opposite
      // way around the orbit - the sign of that term is the only thing the reverse flag changes here.
      const result = JuiceWeaponSwingMotionEffect.computeArcTravelRadians(2, 1e-7, 120, true, 0);

      // Assert
      expect(result).toBeCloseTo(2.0943951, 6);
    });
  });

  describe('bladeRotationFromTravelRadians()', () =>
  {
    it('adds the icon diagonal rest bias to the travel radians', () =>
    {
      expect(JuiceWeaponSwingMotionEffect.bladeRotationFromTravelRadians(1))
        .toBeCloseTo(JuiceWeaponSwingMotionEffect.IconDiagonalRestRadians + 1);
    });
  });

  describe('bladeRotationArcForward()', () =>
  {
    it('adds the icon diagonal rest bias plus a quarter turn to theta', () =>
    {
      expect(JuiceWeaponSwingMotionEffect.bladeRotationArcForward(1))
        .toBeCloseTo(JuiceWeaponSwingMotionEffect.IconDiagonalRestRadians + 1 + (Math.PI / 2));
    });
  });

  describe('computeBashOffset()', () =>
  {
    it('returns wind-up offsets near the start of the strike', () =>
    {
      const off = JuiceWeaponSwingMotionEffect.computeBashOffset(2, 48, 0);

      expect(off).toHaveProperty('x');
      expect(off).toHaveProperty('y');
    });

    it('returns full strike offsets at the end of the ease window', () =>
    {
      const off = JuiceWeaponSwingMotionEffect.computeBashOffset(2, 48, 1);

      expect(Number.isFinite(off.x)).toEqual(true);
      expect(Number.isFinite(off.y)).toEqual(true);
    });

    // #forwardUnit's cases are private and only reachable indirectly through callers like this one.
    // Every direction has to be asserted against the offset it actually produces rather than merely
    // against a finite number: each case returns a finite pair, so a check for finiteness passes
    // whichever case ran, and the whole lookup could resolve every direction to the same vector
    // with nothing going red. A bash would then swing the same way regardless of facing.
    it.each([
      [ 2, -1.8863, 9.0857 ],
      [ 4, -9.0857, -1.8863 ],
      [ 6, 9.0857, 1.8863 ],
      [ 8, 1.8863, -9.0857 ],
      [ 1, -7.7584, 5.0908 ],
      [ 3, 5.0908, 7.7584 ],
      [ 7, -5.0908, -7.7584 ],
      [ 9, 7.7584, -5.0908 ],
    ])('drives the bash along direction %i', (dir, expectedX, expectedY) =>
    {
      // Arrange & Act
      const off = JuiceWeaponSwingMotionEffect.computeBashOffset(dir, 48, 0.5);

      // Assert
      expect(off.x).toBeCloseTo(expectedX, 4);
      expect(off.y).toBeCloseTo(expectedY, 4);
    });

    it('falls back to the leftward unit vector for an unrecognized direction', () =>
    {
      // Arrange: the fallback deliberately matches direction 4, so this case cannot be told from
      // that one by its output alone - it is here to pin that an unknown facing still produces a
      // usable swing rather than a broken one.
      // Act
      const off = JuiceWeaponSwingMotionEffect.computeBashOffset(5, 48, 0.5);

      // Assert
      expect(off.x).toBeCloseTo(-9.0857, 4);
      expect(off.y).toBeCloseTo(-1.8863, 4);
    });
  });

  describe('bashWhipRotationRadians()', () =>
  {
    it('returns zero before the strike-phase threshold', () =>
    {
      expect(JuiceWeaponSwingMotionEffect.bashWhipRotationRadians(0)).toEqual(0);
    });

    it('returns a nonzero wrist snap during the strike phase', () =>
    {
      expect(JuiceWeaponSwingMotionEffect.bashWhipRotationRadians(0.5)).not.toEqual(0);
    });
  });

  describe('computeRecoilPose()', () =>
  {
    it('computes maximum kick at ease 0', () =>
    {
      const pose = JuiceWeaponSwingMotionEffect.computeRecoilPose(2, 48, 0);

      expect(pose.rotationDelta).toBeCloseTo(-0.28);
    });

    it('computes zero kick at ease 1', () =>
    {
      const pose = JuiceWeaponSwingMotionEffect.computeRecoilPose(2, 48, 1);

      expect(pose.x).toBeCloseTo(0);
      expect(pose.rotationDelta).toBeCloseTo(0);
    });
  });

  describe('stabBladeRotationRadians()', () =>
  {
    it('uses the default stab tip angle when none is given', () =>
    {
      expect(Number.isFinite(JuiceWeaponSwingMotionEffect.stabBladeRotationRadians(2, undefined))).toEqual(true);
    });

    it('uses the default stab tip angle for a non-finite override', () =>
    {
      expect(Number.isFinite(JuiceWeaponSwingMotionEffect.stabBladeRotationRadians(2, NaN))).toEqual(true);
    });

    it('uses an explicit tip angle override', () =>
    {
      const withDefault = JuiceWeaponSwingMotionEffect.stabBladeRotationRadians(2, undefined);
      const withOverride = JuiceWeaponSwingMotionEffect.stabBladeRotationRadians(2, 0);

      expect(withOverride).not.toBeCloseTo(withDefault);
    });
  });

  describe('weaponTipAlign()', () =>
  {
    it('returns raw rotation with no mirroring when profileGun is false', () =>
    {
      const align = JuiceWeaponSwingMotionEffect.weaponTipAlign(6, 0, false);

      expect(align.mirrorX).toEqual(false);
    });

    it('normalizes rotation above pi back into range', () =>
    {
      const align = JuiceWeaponSwingMotionEffect.weaponTipAlign(4, -Math.PI * 3, true);

      expect(align.rotation).toBeGreaterThanOrEqual(-Math.PI);
      expect(align.rotation).toBeLessThanOrEqual(Math.PI);
    });

    it('normalizes rotation at or below -pi back into range', () =>
    {
      const align = JuiceWeaponSwingMotionEffect.weaponTipAlign(6, Math.PI * 3, true);

      expect(align.rotation).toBeGreaterThan(-Math.PI);
      expect(align.rotation).toBeLessThanOrEqual(Math.PI);
    });

    it('mirrors instead of rotating when the resolved angle lands near pi', () =>
    {
      // west-facing thrust (pi) minus a zero tip angle lands rotation exactly at pi.
      const align = JuiceWeaponSwingMotionEffect.weaponTipAlign(4, 0, true);

      expect(align.mirrorX).toEqual(true);
      expect(align.rotation).toEqual(0);
    });

    it('does not mirror when the resolved angle is far from pi', () =>
    {
      const align = JuiceWeaponSwingMotionEffect.weaponTipAlign(2, 0, true);

      expect(align.mirrorX).toEqual(false);
    });
  });
  //endregion static geometry helpers

  //region constructor
  describe('constructor', () =>
  {
    it('derives base position from the overlay when no neutral base is given', () =>
    {
      const overlay = buildOverlay({ x: 7, y: 9 });
      const { effect } = buildEffect({ overlay });

      expect(effect._baseX).toEqual(7);
      expect(effect._baseY).toEqual(9);
    });

    it('uses the explicit neutral base position when given', () =>
    {
      const { effect } = buildEffect({ neutralBaseX: 1, neutralBaseY: 2 });

      expect(effect._baseX).toEqual(1);
      expect(effect._baseY).toEqual(2);
    });

    it.each([
      [ undefined, 1 ], [ null, 1 ], [ NaN, 1 ], [ 0, 1 ], [ -3, 1 ], [ 3.9, 3 ], [ 5, 5 ],
    ])('clamps repeatCount %s to %i', (input, expected) =>
    {
      const { effect } = buildEffect({ repeatCount: input });

      expect(effect._repeatCount).toEqual(expected);
    });

    it('clamps out-of-range arc span to the 120 default', () =>
    {
      const { effect } = buildEffect({ arcSpanDegrees: 999 });

      expect(effect._arcSpanDegrees).toEqual(120);
    });

    it('clamps an arc span below the lower bound to the 120 default', () =>
    {
      // Arrange: 999 above only ever exercises the upper bound, so the lower one has never had to
      // do anything - a span of 10 is what tells "at least 30 degrees" from "no floor at all", and
      // without it a skill could ask for a sweep too small to read as a swing.
      const { effect } = buildEffect({ arcSpanDegrees: 10 });

      // Assert
      expect(effect._arcSpanDegrees).toEqual(120);
    });

    it('keeps an in-range arc span as-is', () =>
    {
      const { effect } = buildEffect({ arcSpanDegrees: 90 });

      expect(effect._arcSpanDegrees).toEqual(90);
    });

    it('defaults profileGun to false for any non-true value', () =>
    {
      const { effect } = buildEffect({ profileGun: undefined });

      expect(effect._profileGun).toEqual(false);
    });

    it('sets profileGun true only for an explicit true', () =>
    {
      const { effect } = buildEffect({ profileGun: true });

      expect(effect._profileGun).toEqual(true);
    });

    it('falls back to the default stab tip angle for an invalid override', () =>
    {
      const { effect } = buildEffect({ stabTipAngleRadians: 'not-a-number' });

      expect(effect._stabTipAngleRadians).toEqual(JuiceWeaponSwingMotionEffect.StabIconTipAngleRadians);
    });

    it('uses an explicit finite stab tip angle override', () =>
    {
      const { effect } = buildEffect({ stabTipAngleRadians: 1.5 });

      expect(effect._stabTipAngleRadians).toEqual(1.5);
    });

    it('captures the unsigned overlay scale magnitude', () =>
    {
      const overlay = buildOverlay({ scale: { x: -2, y: 2 } });
      const { effect } = buildEffect({ overlay });

      expect(effect._scaleMag).toEqual(2);
    });
  });
  //endregion constructor

  describe('isSpriteAlive()', () =>
  {
    it('is true while the parent sprite has a transform', () =>
    {
      const { effect } = buildEffect();

      expect(effect.isSpriteAlive()).toEqual(true);
    });

    it('is false once the parent sprite transform is nulled', () =>
    {
      const { effect, parentSprite } = buildEffect();
      parentSprite.transform = null;

      expect(effect.isSpriteAlive()).toEqual(false);
    });
  });

  //region tick() across every motion type
  describe('tick()', () =>
  {
    it('returns true while the swing has not reached its duration', () =>
    {
      const { effect } = buildEffect({ durationFrames: 10 });

      expect(effect.tick()).toEqual(true);
    });

    it('returns false and tears down the overlay once duration is reached', () =>
    {
      const { effect, parentSprite, overlay } = buildEffect({ durationFrames: 1, motionType: JuiceWeaponSwingMotionEffect.MotionTypes.Spin });

      const result = effect.tick();

      expect(result).toEqual(false);
      expect(parentSprite.removeChild).toHaveBeenCalledWith(overlay);
      expect(overlay.destroy).toHaveBeenCalled();
    });

    it('also tears down any still-alive trail afterimages once duration is reached', () =>
    {
      // Spin spawns a trail on frame 2 (`_frame % 2 === 0`); durationFrames: 2 means that same
      // second tick() call both spawns the ghost (via #tickSpin) and reaches the final-frame
      // teardown branch, which destroys every entry left in `_trail` regardless of its ttl.
      const { effect, parentSprite } = buildEffect({ durationFrames: 2, motionType: JuiceWeaponSwingMotionEffect.MotionTypes.Spin });

      effect.tick();
      const result = effect.tick();

      expect(result).toEqual(false);
      expect(parentSprite.addChild).toHaveBeenCalledTimes(1);
      const [ [ ghost ] ] = parentSprite.addChild.mock.calls;
      expect(parentSprite.removeChild).toHaveBeenCalledWith(ghost);
      expect(ghost.destroy).toHaveBeenCalled();
      expect(effect._trail).toHaveLength(0);
    });

    it('drives the Arc motion (default fallback for an unrecognized motion type)', () =>
    {
      const { effect, overlay } = buildEffect({ motionType: 'unrecognized-motion', durationFrames: 10 });

      effect.tick();

      expect(Number.isFinite(overlay.x)).toEqual(true);
      expect(Number.isFinite(overlay.rotation)).toEqual(true);
    });

    // Each motion type routes to its own private tick, and every one of them leaves the overlay
    // holding finite numbers - so asserting finiteness cannot tell which one ran, and the whole
    // dispatch could collapse to a single motion with nothing going red. Every weapon would then
    // animate identically no matter what its skill asked for. These are the poses each type
    // actually produces on the first frame of a ten-frame swing facing down.
    it.each([
      [ 'Arc', -8.4166, -7.8180, 4.4066 ],
      [ 'ArcReverse', 8.4166, -7.8180, 3.4474 ],
      [ 'ArcOscillate', 10.2208, -8.8926, 3.3322 ],
      [ 'Spin', -7.4189, -1.5769, 2.5133 ],
      [ 'SpinReverse', -18.1401, -20.1466, -2.5133 ],
      [ 'StabForward', 0, 7.1544, 3.9270 ],
      [ 'Present', 0, -5.4634, 0 ],
      [ 'Bash', -0.2317, 0.7621, 3.9506 ],
      [ 'Recoil', 0, -9.7978, 3.7229 ],
    ])('poses the overlay for the %s motion', (motionName, expectedX, expectedY, expectedRotation) =>
    {
      // Arrange
      const { effect, overlay } = buildEffect({
        motionType: JuiceWeaponSwingMotionEffect.MotionTypes[ motionName ],
        durationFrames: 10,
        repeatCount: 4,
      });

      // Act
      effect.tick();

      // Assert
      expect(overlay.x).toBeCloseTo(expectedX, 3);
      expect(overlay.y).toBeCloseTo(expectedY, 3);
      expect(overlay.rotation).toBeCloseTo(expectedRotation, 3);
    });

    it('drives the ArcOscillate motion across multiple ticks, alternating direction', () =>
    {
      const { effect, overlay } = buildEffect({
        motionType: JuiceWeaponSwingMotionEffect.MotionTypes.ArcOscillate,
        durationFrames: 20,
        repeatCount: 4,
      });

      for (let i = 0; i < 15; i++) effect.tick();

      expect(Number.isFinite(overlay.rotation)).toEqual(true);
    });

    it('sweeps an odd oscillate slice back the other way', () =>
    {
      // Arrange: the pose table above reads oscillate on frame 1, which is always slice 0 and always
      // sweeps forward - so the flip that gives this motion its name has never had to happen. Four
      // passes over twenty frames puts frame 6 squarely inside slice 1, the first reversed one, and
      // the pose there is the proof the alternation is real rather than four identical sweeps.
      const { effect, overlay } = buildEffect({
        motionType: JuiceWeaponSwingMotionEffect.MotionTypes.ArcOscillate,
        durationFrames: 20,
        repeatCount: 4,
      });

      // Act
      for (let i = 0; i < 6; i++) effect.tick();

      // Assert
      expect(overlay.x).toBeCloseTo(0.4583729, 6);
      expect(overlay.y).toBeCloseTo(-5.7657604, 6);
      expect(overlay.rotation).toBeCloseTo(3.9018581, 6);
    });

    it('keeps the velocity-aligned blade read on the last frame of a reverse arc', () =>
    {
      // Arrange: the pose table reads every motion on frame 1, which lands mid-sweep - and mid-sweep
      // the sampled travel angle happens to equal what the forward-arc formula produces, so the
      // reverse branch could be dropped there without moving a pixel. The final frame is where the
      // two part company: the sampling window is one-sided at the ends of the sweep, so the reverse
      // read trails the forward one, and this is the last frame a player actually sees.
      const { effect, overlay } = buildEffect({
        motionType: JuiceWeaponSwingMotionEffect.MotionTypes.ArcReverse,
        durationFrames: 4,
      });

      // Act
      for (let i = 0; i < 4; i++) effect.tick();

      // Assert
      expect(overlay.rotation).toBeCloseTo(-1.3308136, 6);
    });

    it('drives the Spin motion and spawns a trail afterimage on even frames', () =>
    {
      const { effect, parentSprite } = buildEffect({ motionType: JuiceWeaponSwingMotionEffect.MotionTypes.Spin, durationFrames: 10 });

      effect.tick();
      effect.tick();

      expect(parentSprite.addChild).toHaveBeenCalled();
    });

    it('drives the SpinReverse motion', () =>
    {
      const { effect, overlay } = buildEffect({ motionType: JuiceWeaponSwingMotionEffect.MotionTypes.SpinReverse, durationFrames: 10 });

      effect.tick();

      expect(Number.isFinite(overlay.rotation)).toEqual(true);
    });

    it('drives the StabForward motion', () =>
    {
      const { effect, overlay } = buildEffect({ motionType: JuiceWeaponSwingMotionEffect.MotionTypes.StabForward, durationFrames: 10 });

      effect.tick();

      expect(Number.isFinite(overlay.x)).toEqual(true);
    });

    // The overlay spawns already scaled, and the profile-gun rule is the only thing that rewrites
    // that scale mid-swing. Every fixture below therefore starts the overlay at a scale the rule
    // would have to change: leave the spawn scale at +1 and "mirrored", "not mirrored" and "never
    // touched at all" are three names for the same number, and the whole mirroring rule could be
    // deleted with nothing going red - side-view gun art would silently point backwards.
    it('drives the StabForward motion with profileGun mirroring active', () =>
    {
      // Arrange: west-facing thrust against a zero tip angle lands the alignment near pi, which is
      // the case the rule answers by mirroring instead of rotating.
      const overlay = buildOverlay({ scale: { x: 2, y: 2 } });
      const { effect } = buildEffect({
        overlay,
        motionType: JuiceWeaponSwingMotionEffect.MotionTypes.StabForward,
        durationFrames: 10,
        swingDirection: 4,
        stabTipAngleRadians: 0,
        profileGun: true,
      });

      // Act
      effect.tick();

      // Assert
      expect(overlay.scale.x).toEqual(-2);
      expect(overlay.scale.y).toEqual(2);
    });

    it('leaves the overlay scale alone when profileGun is off', () =>
    {
      // Arrange: the same west-facing thrust that mirrors above, with the flag off. An overlay that
      // spawned mirrored must stay mirrored - the rule is opt-in, and rewriting the scale for every
      // weapon would flip the art of anything spawned with a negative scale.
      const overlay = buildOverlay({ scale: { x: -2, y: 2 } });
      const { effect } = buildEffect({
        overlay,
        motionType: JuiceWeaponSwingMotionEffect.MotionTypes.StabForward,
        durationFrames: 10,
        swingDirection: 4,
        stabTipAngleRadians: 0,
        profileGun: false,
      });

      // Act
      effect.tick();

      // Assert
      expect(overlay.scale.x).toEqual(-2);
    });

    it('drives the Present motion (lifts toward base rotation)', () =>
    {
      const { effect, overlay } = buildEffect({ motionType: JuiceWeaponSwingMotionEffect.MotionTypes.Present, durationFrames: 10, baseRotation: 0.5 });

      effect.tick();

      expect(overlay.rotation).toEqual(0.5);
    });

    it('drives the Bash motion', () =>
    {
      const { effect, overlay } = buildEffect({ motionType: JuiceWeaponSwingMotionEffect.MotionTypes.Bash, durationFrames: 10 });

      effect.tick();

      expect(Number.isFinite(overlay.x)).toEqual(true);
    });

    it('drives the Bash motion with profileGun active but not mirrored (facing far from a flip angle)', () =>
    {
      // swingDirection 2 (down) + tip 0 resolves nowhere near +/-pi, so mirrorX stays false here-
      // covers the ternary's other branch vs. the mirrorX:true case exercised by the StabForward test.
      // The overlay spawns mirrored so that "the rule ran and chose not to mirror" reads differently
      // from "the rule never ran": an unmirrored spawn would leave both answering +2.
      const overlay = buildOverlay({ scale: { x: -2, y: 2 } });
      const { effect } = buildEffect({
        overlay,
        motionType: JuiceWeaponSwingMotionEffect.MotionTypes.Bash,
        durationFrames: 10,
        swingDirection: 2,
        stabTipAngleRadians: 0,
        profileGun: true,
      });

      // Act
      effect.tick();

      // Assert
      expect(overlay.scale.x).toEqual(2);
    });

    it('drives the Recoil motion', () =>
    {
      const { effect, overlay } = buildEffect({ motionType: JuiceWeaponSwingMotionEffect.MotionTypes.Recoil, durationFrames: 10 });

      effect.tick();

      expect(Number.isFinite(overlay.x)).toEqual(true);
    });

    it('fades and eventually removes trail afterimages over successive ticks', () =>
    {
      const { effect, parentSprite } = buildEffect({ motionType: JuiceWeaponSwingMotionEffect.MotionTypes.Spin, durationFrames: 30 });

      // spin spawns a trail every even frame; run enough ticks for the earliest trail (ttl 10) to expire.
      for (let i = 0; i < 12; i++) effect.tick();

      expect(parentSprite.removeChild).toHaveBeenCalled();
    });

    it('keeps an afterimage alive while its time-to-live has frames left', () =>
    {
      // Arrange: the expiry test above only ever proves that something eventually got removed, which
      // is also true of a trail that discards every ghost the frame after it spawns - and that is
      // the difference between a spin leaving a streak and leaving a single flickering copy. Two
      // ticks is one spawn plus one decrement, so the ghost is still owed nine frames of fade.
      const { effect } = buildEffect({
        motionType: JuiceWeaponSwingMotionEffect.MotionTypes.Spin,
        durationFrames: 30,
      });

      // Act
      effect.tick();
      effect.tick();

      // Assert
      expect(effect.trail()).toHaveLength(1);
      expect(effect.trail()[0].ttl).toEqual(9);
    });
  });
  //endregion tick() across every motion type
});
//endregion plugins/abs/ext/juice/models/juice-weapon-swing-motion-effect.test.js
