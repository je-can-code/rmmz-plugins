//region plugins/abs/ext/juice/managers/juice-weapon-swing-overlay.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * JuiceWeaponSwingOverlay.js is a genuine ES `class` (static-only). Every sibling model/manager
 * it imports is mocked per the "unit tier mocks all downstream file-external dependencies"
 * convention- JuiceWeaponSwingMotionEffect's own real geometry is covered by its own dedicated
 * test file, not re-tested here. `ImageManager` and `Sprite` are bare globals this file reads,
 * stubbed directly. Every private static method (#isValidSwingDirection, #isArcMotion,
 * #coalesceSpinCount, #buildSwingProfile) is only reachable indirectly through `play()`.
 */
describe('JuiceWeaponSwingOverlay (unit, all downstream dependencies mocked)', () =>
{
  /** @type {typeof import('../../../../../../src/plugins/abs/ext/juice/managers/JuiceWeaponSwingOverlay.js').default} */
  let JuiceWeaponSwingOverlay;
  let MotionEffectCtor;
  let JuiceMotionManagerMock;

  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = { ABS: { EXT: { JUICE: { Metadata: { spriteJuiceVerticalOffsetPixels: 0 } } } } };

    globalThis.ImageManager = {
      iconWidth: 32,
      iconHeight: 32,
      loadSystem: vi.fn(() => ({ tag: 'bitmap' })),
    };

    function Sprite()
    {
      this.anchor = { x: 0, y: 0 };
      this.scale = { x: 1, y: 1 };
      this.setFrame = vi.fn();
    }
    globalThis.Sprite = Sprite;

    vi.doMock('../../../../../../src/plugins/abs/ext/juice/resolvers/JuiceProfileResolver.js', () => ({ default: class {} }));

    JuiceMotionManagerMock = { pushExternalEffect: vi.fn() };
    vi.doMock('../../../../../../src/plugins/abs/ext/juice/managers/JuiceMotionManager.js', () => ({
      default: JuiceMotionManagerMock,
    }));

    MotionEffectCtor = vi.fn(function(...args)
    {
      this.args = args;
    });
    vi.doMock('../../../../../../src/plugins/abs/ext/juice/models/JuiceWeaponSwingMotionEffect.js', () => ({
      default: Object.assign(MotionEffectCtor, {
        MotionTypes: {
          Arc: 'arc',
          ArcOscillate: 'arc-oscillate',
          ArcReverse: 'arc-reverse',
          Bash: 'bash',
          Present: 'present',
          Recoil: 'recoil',
          Spin: 'spin',
          SpinReverse: 'spin-reverse',
          StabForward: 'stab-forward',
        },
        StabIconTipAngleRadians: -2.356,
        IconDiagonalRestRadians: 0.785,
        computeArcPose: vi.fn(() => ({ x: 1, y: 2, theta: 0.5 })),
        computeArcTravelRadians: vi.fn(() => 0.3),
        bladeRotationFromTravelRadians: vi.fn((t) => t + 1),
        bladeRotationArcForward: vi.fn((theta) => theta + 2),
        computeBashOffset: vi.fn(() => ({ x: 3, y: 4 })),
        weaponTipAlign: vi.fn(() => ({ rotation: 0.1, mirrorX: false })),
        computeRecoilPose: vi.fn(() => ({ x: 5, y: 6, rotationDelta: 0.2 })),
        bashWhipRotationRadians: vi.fn(() => 0.05),
      }),
    }));

    ({ default: JuiceWeaponSwingOverlay } =
      await import('../../../../../../src/plugins/abs/ext/juice/managers/JuiceWeaponSwingOverlay.js'));
  });

  beforeEach(() =>
  {
    JuiceMotionManagerMock.pushExternalEffect.mockClear();
    MotionEffectCtor.mockClear();
    globalThis.ImageManager.loadSystem.mockClear();
  });

  /**
   * Builds a fake parent character sprite test double.
   * @param {object} [overrides] Overrides.
   * @returns {object} A fake parent sprite.
   */
  function buildParentSprite(overrides = {})
  {
    return {
      patternHeight: () => 48,
      addChild: vi.fn(),
      _character: { direction: () => 2 },
      ...overrides,
    };
  }

  describe('play() - arc motions', () =>
  {
    // Arc and arc-reverse are the only two motions routed through the orbit-pose math; every other
    // motion is placed from the hand profile instead. Asserting only that a child got added cannot
    // tell those two placements apart, so the arc branch could have been skipped entirely and the
    // weapon would still have appeared - just parked in the hand rather than out on the orbit.
    // The mocked geometry returns a fixed pose (1, 2) and fixed rotations, which is what makes the
    // two routes distinguishable from the outside.
    it('positions the overlay via arc pose and forward blade rotation', () =>
    {
      // Arrange
      const parentSprite = buildParentSprite();

      // Act
      JuiceWeaponSwingOverlay.play(parentSprite, 5, 0.5, 20, 'arc', 120, 2);

      // Assert
      const [ , overlay ] = MotionEffectCtor.mock.calls.at(-1);
      expect(overlay.x).toEqual(1);
      expect(overlay.y).toEqual(2);
      expect(overlay.rotation).toBeCloseTo(2.5, 6);
      expect(overlay.scale.x).toEqual(1.6);
      expect(JuiceMotionManagerMock.pushExternalEffect).toHaveBeenCalled();
    });

    it('uses travel-radians blade rotation for arc-reverse', () =>
    {
      // Arrange
      const parentSprite = buildParentSprite();

      // Act
      JuiceWeaponSwingOverlay.play(parentSprite, 5, 0.5, 20, 'arc-reverse', 120, 2);

      // Assert: the reverse read comes from travel radians (0.3 + 1), not the forward theta read
      // (0.5 + 2) the arc case above produces - the two rotations are what separate the branches.
      const [ , overlay ] = MotionEffectCtor.mock.calls.at(-1);
      expect(overlay.x).toEqual(1);
      expect(overlay.y).toEqual(2);
      expect(overlay.rotation).toBeCloseTo(1.3, 6);
    });

    it('falls back to the default arc span for an invalid value', () =>
    {
      // Arrange
      const parentSprite = buildParentSprite();

      // Act
      JuiceWeaponSwingOverlay.play(parentSprite, 5, 0.5, 20, 'arc', NaN, 2);

      // Assert: the span is forwarded to the motion effect as constructor arg 6.
      expect(MotionEffectCtor.mock.calls.at(-1)[6]).toEqual(120);
    });

    it('forwards an in-range arc span untouched', () =>
    {
      // Arrange: a finite span must survive the coalesce, or every arc in the game would sweep the
      // same 120 degrees no matter what its skill asked for.
      const parentSprite = buildParentSprite();

      // Act
      JuiceWeaponSwingOverlay.play(parentSprite, 5, 0.5, 20, 'arc', 90, 2);

      // Assert
      expect(MotionEffectCtor.mock.calls.at(-1)[6]).toEqual(90);
    });
  });

  describe('play() - non-arc anchor selection', () =>
  {
    // the overlay sprite is passed as the 2nd constructor arg to JuiceWeaponSwingMotionEffect,
    // so its final anchor can be read off that call instead of swapping the global Sprite ctor
    // (which would need careful restoration- `new` doesn't honor an arrow function's return).
    it('uses the wide spin anchor for Spin', () =>
    {
      const parentSprite = buildParentSprite();

      JuiceWeaponSwingOverlay.play(parentSprite, 5, 0.5, 20, 'spin', 120, 2);

      const [ , overlay ] = MotionEffectCtor.mock.calls.at(-1);
      expect(overlay.anchor.x).toEqual(1.15);
    });

    it('uses the wide spin anchor for SpinReverse', () =>
    {
      const parentSprite = buildParentSprite();

      JuiceWeaponSwingOverlay.play(parentSprite, 5, 0.5, 20, 'spin-reverse', 120, 2);

      const [ , overlay ] = MotionEffectCtor.mock.calls.at(-1);
      expect(overlay.anchor.x).toEqual(1.15);
    });

    it('uses the standard hand-anchor for other motion types', () =>
    {
      const parentSprite = buildParentSprite();

      JuiceWeaponSwingOverlay.play(parentSprite, 5, 0.5, 20, 'bash', 120, 2);

      const [ , overlay ] = MotionEffectCtor.mock.calls.at(-1);
      expect(overlay.anchor.x).toEqual(0.78);
    });
  });

  describe('play() - swing direction resolution', () =>
  {
    it('falls back to the character facing for an invalid swing direction', () =>
    {
      const parentSprite = buildParentSprite({ _character: { direction: () => 6 } });

      JuiceWeaponSwingOverlay.play(parentSprite, 5, 0.5, 20, 'bash', 120, 0);

      // constructor signature: (parentSprite, overlay, baseRotation, peakRotationRadians,
      // durationFrames, motionType, spanDeg, swingDirForMotion, ...) - index 7.
      expect(MotionEffectCtor.mock.calls.at(-1)[7]).toEqual(6);
    });

    it('falls back to the character facing for the neutral direction (5)', () =>
    {
      const parentSprite = buildParentSprite({ _character: { direction: () => 4 } });

      JuiceWeaponSwingOverlay.play(parentSprite, 5, 0.5, 20, 'bash', 120, 5);

      expect(MotionEffectCtor.mock.calls.at(-1)[7]).toEqual(4);
    });

    it('uses the given valid swing direction as-is', () =>
    {
      const parentSprite = buildParentSprite();

      JuiceWeaponSwingOverlay.play(parentSprite, 5, 0.5, 20, 'bash', 120, 9);

      expect(MotionEffectCtor.mock.calls.at(-1)[7]).toEqual(9);
    });

    it('falls back to the character facing for a swing direction above the 8-dir range', () =>
    {
      // Arrange: 9 is the largest valid facing, so the upper bound of the range check has only ever
      // been probed from inside it. A direction of 10 is the value that tells "at most 9" from "any
      // number at all" - without it the upper bound could be dropped and every out-of-range facing
      // would flow into the profile switch's default instead of honouring the character's own.
      const parentSprite = buildParentSprite({ _character: { direction: () => 8 } });

      // Act
      JuiceWeaponSwingOverlay.play(parentSprite, 5, 0.5, 20, 'bash', 120, 10);

      // Assert
      expect(MotionEffectCtor.mock.calls.at(-1)[7]).toEqual(8);
    });
  });

  describe('play() - per-direction hand profile', () =>
  {
    // The hand profile is chosen by an eight-way switch on the swing direction, and nothing here
    // read the result of it - the anchor cases above hold the direction fixed at 2, and the
    // direction cases read only which direction was forwarded to the motion effect, never where
    // the overlay was actually placed. So every case in that switch could have resolved to the
    // same profile and the weapon would sit in the same spot regardless of facing. The four
    // diagonals are blends of their two cardinals, which is why they land between them.
    it.each([
      [ 2, 13, -6.56, 1.5 ],
      [ 4, -23, -20.96, 1.65 ],
      [ 6, 29, -20.96, 1.65 ],
      [ 8, 3, -35.36, 1.5 ],
      [ 1, -5, -13.76, 1.575 ],
      [ 3, 21, -13.76, 1.575 ],
      [ 7, -10, -28.16, 1.575 ],
      [ 9, 16, -28.16, 1.575 ],
    ])('places the overlay in the hand profile for direction %i', (dir, expectedX, expectedY, expectedScale) =>
    {
      // Arrange
      const parentSprite = buildParentSprite();

      // Act
      JuiceWeaponSwingOverlay.play(parentSprite, 5, 0.5, 20, 'bash', 120, dir);

      // Assert
      const [ , overlay ] = MotionEffectCtor.mock.calls.at(-1);
      expect(overlay.x).toBeCloseTo(expectedX, 3);
      expect(overlay.y).toBeCloseTo(expectedY, 3);
      expect(overlay.scale.x).toBeCloseTo(expectedScale, 3);
    });
  });

  describe('play() - weapon tip / spin count resolution', () =>
  {
    it('falls back to the default stab tip angle for a missing weaponTipRadians', () =>
    {
      const parentSprite = buildParentSprite();

      JuiceWeaponSwingOverlay.play(parentSprite, 5, 0.5, 20, 'bash', 120, 2, undefined);

      expect(MotionEffectCtor.mock.calls.at(-1)[8]).toEqual(-2.356);
    });

    it('uses an explicit finite weaponTipRadians', () =>
    {
      const parentSprite = buildParentSprite();

      JuiceWeaponSwingOverlay.play(parentSprite, 5, 0.5, 20, 'bash', 120, 2, 1.23);

      expect(MotionEffectCtor.mock.calls.at(-1)[8]).toEqual(1.23);
    });

    it('coalesces a missing spinCount to 1', () =>
    {
      const parentSprite = buildParentSprite();

      JuiceWeaponSwingOverlay.play(parentSprite, 5, 0.5, 20, 'bash', 120, 2, 0, undefined);

      expect(MotionEffectCtor.mock.calls.at(-1)[11]).toEqual(1);
    });

    it('preserves an explicit finite spinCount', () =>
    {
      const parentSprite = buildParentSprite();

      JuiceWeaponSwingOverlay.play(parentSprite, 5, 0.5, 20, 'bash', 120, 2, 0, 4);

      expect(MotionEffectCtor.mock.calls.at(-1)[11]).toEqual(4);
    });

    it('defaults profileGun to false for a non-true value', () =>
    {
      const parentSprite = buildParentSprite();

      JuiceWeaponSwingOverlay.play(parentSprite, 5, 0.5, 20, 'bash', 120, 2, 0, 1, 'truthy-not-true');

      expect(MotionEffectCtor.mock.calls.at(-1)[12]).toEqual(false);
    });

    it('sets profileGun true for an explicit true', () =>
    {
      const parentSprite = buildParentSprite();

      JuiceWeaponSwingOverlay.play(parentSprite, 5, 0.5, 20, 'bash', 120, 2, 0, 1, true);

      expect(MotionEffectCtor.mock.calls.at(-1)[12]).toEqual(true);
    });
  });

  describe('play() - non-arc motion branches', () =>
  {
    // Every motion below lands somewhere different on the sprite, and the spawn pose is the whole
    // job of this method - but each branch only ever had to not throw, which a branch that never
    // ran also manages. The four-armed if/else could have collapsed to any single arm and every
    // weapon in the game would have spawned in the same pose with nothing going red. The numbers
    // are what the mocked geometry produces against the direction-2 hand profile (x 10, y -10.56):
    // bash adds its offset (3, 4), recoil adds its own (5, 6), stab adds nothing, and present
    // ignores the facing entirely for the upward profile (x 0, y -39.36).
    it('positions via bash offset and tip alignment for Bash', () =>
    {
      // Arrange
      const parentSprite = buildParentSprite();

      // Act
      JuiceWeaponSwingOverlay.play(parentSprite, 5, 0.5, 20, 'bash', 120, 2);

      // Assert
      const [ , overlay ] = MotionEffectCtor.mock.calls.at(-1);
      expect(overlay.x).toBeCloseTo(13, 6);
      expect(overlay.y).toBeCloseTo(-6.56, 6);
      expect(overlay.rotation).toBeCloseTo(0.15, 6);
    });

    it('mirrors the overlay scale for Bash when tip alignment resolves a mirror', () =>
    {
      const parentSprite = buildParentSprite();
      MotionEffectCtor.weaponTipAlign.mockReturnValueOnce({ rotation: 0.1, mirrorX: true });

      JuiceWeaponSwingOverlay.play(parentSprite, 5, 0.5, 20, 'bash', 120, 2);

      const [ , overlay ] = MotionEffectCtor.mock.calls.at(-1);
      expect(overlay.scale.x).toBeLessThan(0);
    });

    it('positions via recoil pose and tip alignment for Recoil', () =>
    {
      // Arrange
      const parentSprite = buildParentSprite();

      // Act
      JuiceWeaponSwingOverlay.play(parentSprite, 5, 0.5, 20, 'recoil', 120, 2);

      // Assert
      const [ , overlay ] = MotionEffectCtor.mock.calls.at(-1);
      expect(overlay.x).toBeCloseTo(15, 6);
      expect(overlay.y).toBeCloseTo(-4.56, 6);
      expect(overlay.rotation).toBeCloseTo(0.3, 6);
    });

    it('mirrors the overlay scale for Recoil when tip alignment resolves a mirror', () =>
    {
      const parentSprite = buildParentSprite();
      MotionEffectCtor.weaponTipAlign.mockReturnValueOnce({ rotation: 0.1, mirrorX: true });

      JuiceWeaponSwingOverlay.play(parentSprite, 5, 0.5, 20, 'recoil', 120, 2);

      const [ , overlay ] = MotionEffectCtor.mock.calls.at(-1);
      expect(overlay.scale.x).toBeLessThan(0);
    });

    it('positions via tip alignment only for StabForward', () =>
    {
      // Arrange
      const parentSprite = buildParentSprite();

      // Act
      JuiceWeaponSwingOverlay.play(parentSprite, 5, 0.5, 20, 'stab-forward', 120, 2);

      // Assert: a stab spawns at the bare hand-neutral spot, with only the tip rotation applied.
      const [ , overlay ] = MotionEffectCtor.mock.calls.at(-1);
      expect(overlay.x).toBeCloseTo(10, 6);
      expect(overlay.y).toBeCloseTo(-10.56, 6);
      expect(overlay.rotation).toBeCloseTo(0.1, 6);
    });

    it('mirrors the overlay scale for StabForward when tip alignment resolves a mirror', () =>
    {
      const parentSprite = buildParentSprite();
      MotionEffectCtor.weaponTipAlign.mockReturnValueOnce({ rotation: 0.1, mirrorX: true });

      JuiceWeaponSwingOverlay.play(parentSprite, 5, 0.5, 20, 'stab-forward', 120, 2);

      const [ , overlay ] = MotionEffectCtor.mock.calls.at(-1);
      expect(overlay.scale.x).toBeLessThan(0);
    });

    it('lifts straight up for Present, forcing the swing direction to up (8) for the motion effect', () =>
    {
      // Arrange: the caster faces down, and present must ignore that - it builds its pose from the
      // upward profile instead, which is the only thing separating it from the plain fallback.
      const parentSprite = buildParentSprite();

      // Act
      JuiceWeaponSwingOverlay.play(parentSprite, 5, 0.5, 20, 'present', 120, 2);

      // Assert
      const [ , overlay ] = MotionEffectCtor.mock.calls.at(-1);
      expect(overlay.x).toBeCloseTo(0, 6);
      expect(overlay.y).toBeCloseTo(-39.36, 6);
      expect(overlay.rotation).toEqual(0.785);
      expect(MotionEffectCtor.mock.calls.at(-1)[7]).toEqual(8);
    });

    it('uses the plain hand-neutral profile for an unrecognized motion type', () =>
    {
      // Arrange
      const parentSprite = buildParentSprite();

      // Act
      JuiceWeaponSwingOverlay.play(parentSprite, 5, 0.5, 20, 'unknown-motion', 120, 2);

      // Assert: the fallback keeps the caster's own facing, so it sits at the direction-2 hand spot
      // rather than the upward one present uses, and takes the icon's resting rotation untouched.
      const [ , overlay ] = MotionEffectCtor.mock.calls.at(-1);
      expect(overlay.x).toBeCloseTo(10, 6);
      expect(overlay.y).toBeCloseTo(-10.56, 6);
      expect(overlay.rotation).toEqual(0.785);
    });
  });

  describe('#buildSwingProfile() via play() across all 8 facings + default', () =>
  {
    it.each([ 2, 4, 6, 8, 1, 3, 7, 9, 5 ])('resolves a profile for direction %i without throwing', (dir) =>
    {
      const parentSprite = buildParentSprite();

      expect(() => JuiceWeaponSwingOverlay.play(parentSprite, 5, 0.5, 20, 'bash', 120, dir)).not.toThrow();
    });

    it('falls back to the left-facing profile when even the character facing is invalid', () =>
    {
      // an invalid swingDirection argument falls back to parentSprite._character.direction()-
      // but that fallback value itself is never re-validated, so a character facing that somehow
      // returns an out-of-range direction flows straight into the switch's default case.
      const parentSprite = buildParentSprite({ _character: { direction: () => 0 } });

      // Act
      JuiceWeaponSwingOverlay.play(parentSprite, 5, 0.5, 20, 'bash', 120, 0);

      // Assert: the default arm of the switch hands back the left-facing profile, which is the same
      // placement direction 4 produces.
      const [ , overlay ] = MotionEffectCtor.mock.calls.at(-1);
      expect(overlay.x).toBeCloseTo(-23, 6);
      expect(overlay.y).toBeCloseTo(-20.96, 6);
    });
  });

  describe('play() - icon sheet slicing', () =>
  {
    it('loads the IconSet bitmap and slices the frame for the given icon index', () =>
    {
      const parentSprite = buildParentSprite();

      JuiceWeaponSwingOverlay.play(parentSprite, 20, 0.5, 20, 'bash', 120, 2);

      expect(globalThis.ImageManager.loadSystem).toHaveBeenCalledWith('IconSet');
    });
  });
});
//endregion plugins/abs/ext/juice/managers/juice-weapon-swing-overlay.test.js
