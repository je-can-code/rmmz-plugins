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
    it('positions the overlay via arc pose and forward blade rotation', () =>
    {
      const parentSprite = buildParentSprite();

      JuiceWeaponSwingOverlay.play(parentSprite, 5, 0.5, 20, 'arc', 120, 2);

      expect(parentSprite.addChild).toHaveBeenCalled();
      expect(JuiceMotionManagerMock.pushExternalEffect).toHaveBeenCalled();
    });

    it('uses travel-radians blade rotation for arc-reverse', () =>
    {
      const parentSprite = buildParentSprite();

      JuiceWeaponSwingOverlay.play(parentSprite, 5, 0.5, 20, 'arc-reverse', 120, 2);

      expect(parentSprite.addChild).toHaveBeenCalled();
    });

    it('falls back to the default arc span for an invalid value', () =>
    {
      const parentSprite = buildParentSprite();

      expect(() => JuiceWeaponSwingOverlay.play(parentSprite, 5, 0.5, 20, 'arc', NaN, 2)).not.toThrow();
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
    it('positions via bash offset and tip alignment for Bash', () =>
    {
      const parentSprite = buildParentSprite();

      expect(() => JuiceWeaponSwingOverlay.play(parentSprite, 5, 0.5, 20, 'bash', 120, 2)).not.toThrow();
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
      const parentSprite = buildParentSprite();

      expect(() => JuiceWeaponSwingOverlay.play(parentSprite, 5, 0.5, 20, 'recoil', 120, 2)).not.toThrow();
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
      const parentSprite = buildParentSprite();

      expect(() => JuiceWeaponSwingOverlay.play(parentSprite, 5, 0.5, 20, 'stab-forward', 120, 2)).not.toThrow();
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
      const parentSprite = buildParentSprite();

      JuiceWeaponSwingOverlay.play(parentSprite, 5, 0.5, 20, 'present', 120, 2);

      expect(MotionEffectCtor.mock.calls.at(-1)[7]).toEqual(8);
    });

    it('uses the plain hand-neutral profile for an unrecognized motion type', () =>
    {
      const parentSprite = buildParentSprite();

      expect(() => JuiceWeaponSwingOverlay.play(parentSprite, 5, 0.5, 20, 'unknown-motion', 120, 2)).not.toThrow();
    });
  });

  describe('#buildSwingProfile() via play() across all 8 facings + default', () =>
  {
    it.each([ 2, 4, 6, 8, 1, 3, 7, 9, 5 ])('resolves a profile for direction %i without throwing', (dir) =>
    {
      const parentSprite = buildParentSprite();

      expect(() => JuiceWeaponSwingOverlay.play(parentSprite, 5, 0.5, 20, 'bash', 120, dir)).not.toThrow();
    });

    it('uses the wider spacing constants for non-tight-orbit motions', () =>
    {
      const parentSprite = buildParentSprite();

      expect(() => JuiceWeaponSwingOverlay.play(parentSprite, 5, 0.5, 20, 'stab-forward', 120, 4)).not.toThrow();
    });

    it('falls back to the left-facing profile when even the character facing is invalid', () =>
    {
      // an invalid swingDirection argument falls back to parentSprite._character.direction()-
      // but that fallback value itself is never re-validated, so a character facing that somehow
      // returns an out-of-range direction flows straight into the switch's default case.
      const parentSprite = buildParentSprite({ _character: { direction: () => 0 } });

      expect(() => JuiceWeaponSwingOverlay.play(parentSprite, 5, 0.5, 20, 'bash', 120, 0)).not.toThrow();
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
