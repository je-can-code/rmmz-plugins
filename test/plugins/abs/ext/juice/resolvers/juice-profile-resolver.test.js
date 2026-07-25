//region plugins/abs/ext/juice/resolvers/juice-profile-resolver.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * JuiceProfileResolver.js is a genuine ES `class` (static-only). JuiceWeaponSwingMotionEffect is
 * mocked per the "unit tier mocks all downstream file-external dependencies" convention.
 * JuiceStyleMultiplierRow is a pure, dependency-free value object imported for real. JABS_Button
 * and DataManager are bare globals this file reads, stubbed directly.
 */
describe('JuiceProfileResolver (unit, all downstream dependencies mocked)', () =>
{
  /** @type {typeof import('../../../../../../src/plugins/abs/ext/juice/resolvers/JuiceProfileResolver.js').default} */
  let JuiceProfileResolver;

  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = { ABS: { EXT: { JUICE: { Metadata: { weaponStyleMultipliers: {} } } } } };
    globalThis.JABS_Button = { Offhand: 'Offhand' };
    globalThis.DataManager = { isArmor: vi.fn(() => false) };

    vi.doMock('../../../../../../src/plugins/abs/ext/juice/models/JuiceWeaponSwingMotionEffect.js', () => ({
      default: {
        MotionTypes: {
          Arc: 'arc', ArcOscillate: 'arc-oscillate', ArcReverse: 'arc-reverse', Spin: 'spin',
          SpinReverse: 'spin-reverse', StabForward: 'stab-forward', Present: 'present',
        },
        StabIconTipAngleRadians: -2.356,
        BashRecoilIconTipAngleRadians: 3.14159,
      },
    }));

    ({ default: JuiceProfileResolver } =
      await import('../../../../../../src/plugins/abs/ext/juice/resolvers/JuiceProfileResolver.js'));
  });

  beforeEach(() =>
  {
    globalThis.J.ABS.EXT.JUICE.Metadata.weaponStyleMultipliers = {};
    globalThis.DataManager.isArmor.mockReset().mockReturnValue(false);
  });

  /**
   * Builds a fake action test double.
   * @param {object} [overrides] Overrides.
   * @returns {object} A fake action.
   */
  function buildAction(overrides = {})
  {
    return {
      getBaseSkill: () => ({ id: 1, jabsJuiceMotion: String.empty }),
      getCooldownType: () => 'Main',
      ...overrides,
    };
  }

  describe('resolveJuiceMotion()', () =>
  {
    it('defaults to the arc key for an empty motion tag', () =>
    {
      expect(JuiceProfileResolver.resolveJuiceMotion(buildAction())).toEqual('arc');
    });

    it.each([
      [ 'arc-oscillate', 'arc-oscillate' ],
      [ 'swing-top-down', 'arc' ],
      [ 'swing-bottom-up', 'arc-reverse' ],
      [ 'spin-360', 'spin' ],
      [ 'spin-720', 'spin' ],
      [ 'spin-360-reverse', 'spin-reverse' ],
    ])('normalizes %s to %s', (tag, expected) =>
    {
      const action = buildAction({ getBaseSkill: () => ({ jabsJuiceMotion: tag }) });

      expect(JuiceProfileResolver.resolveJuiceMotion(action)).toEqual(expected);
    });

    it('passes through an unrecognized motion tag as-is', () =>
    {
      const action = buildAction({ getBaseSkill: () => ({ jabsJuiceMotion: 'bash' }) });

      expect(JuiceProfileResolver.resolveJuiceMotion(action)).toEqual('bash');
    });
  });

  describe('resolveJuiceRepeatCount()', () =>
  {
    it('floors a tagged value of 1 or more', () =>
    {
      const action = buildAction({ getBaseSkill: () => ({ jabsJuiceRepeatCount: 3.9 }) });

      expect(JuiceProfileResolver.resolveJuiceRepeatCount(action)).toEqual(3);
    });

    it('defaults to 1 for a tagged value below 1', () =>
    {
      const action = buildAction({ getBaseSkill: () => ({ jabsJuiceRepeatCount: 0 }) });

      expect(JuiceProfileResolver.resolveJuiceRepeatCount(action)).toEqual(1);
    });

    it('defaults to 1 when untagged', () =>
    {
      const action = buildAction({ getBaseSkill: () => ({}) });

      expect(JuiceProfileResolver.resolveJuiceRepeatCount(action)).toEqual(1);
    });
  });

  describe('resolveJuiceArcSpanDegrees()', () =>
  {
    it('returns the tagged value when within range', () =>
    {
      const action = buildAction({ getBaseSkill: () => ({ jabsJuiceArcSpanDegrees: 180 }) });

      expect(JuiceProfileResolver.resolveJuiceArcSpanDegrees(action)).toEqual(180);
    });

    it('defaults to 120 when below range', () =>
    {
      const action = buildAction({ getBaseSkill: () => ({ jabsJuiceArcSpanDegrees: 10 }) });

      expect(JuiceProfileResolver.resolveJuiceArcSpanDegrees(action)).toEqual(120);
    });

    it('defaults to 120 when above range', () =>
    {
      const action = buildAction({ getBaseSkill: () => ({ jabsJuiceArcSpanDegrees: 400 }) });

      expect(JuiceProfileResolver.resolveJuiceArcSpanDegrees(action)).toEqual(120);
    });

    it('defaults to 120 when untagged', () =>
    {
      const action = buildAction({ getBaseSkill: () => ({}) });

      expect(JuiceProfileResolver.resolveJuiceArcSpanDegrees(action)).toEqual(120);
    });
  });

  describe('resolveJuiceDuration()', () =>
  {
    it('passes through the tagged duration value', () =>
    {
      const action = buildAction({ getBaseSkill: () => ({ jabsJuiceDuration: 40 }) });

      expect(JuiceProfileResolver.resolveJuiceDuration(action)).toEqual(40);
    });

    it('passes through null when untagged', () =>
    {
      const action = buildAction({ getBaseSkill: () => ({ jabsJuiceDuration: null }) });

      expect(JuiceProfileResolver.resolveJuiceDuration(action)).toBeNull();
    });
  });

  describe('resolveJuiceProfileGun()', () =>
  {
    it('returns true only for an explicit true tag', () =>
    {
      const action = buildAction({ getBaseSkill: () => ({ jabsJuiceProfileGun: true }) });

      expect(JuiceProfileResolver.resolveJuiceProfileGun(action)).toEqual(true);
    });

    it('returns false for a falsy or missing tag', () =>
    {
      const action = buildAction({ getBaseSkill: () => ({}) });

      expect(JuiceProfileResolver.resolveJuiceProfileGun(action)).toEqual(false);
    });
  });

  describe('resolveJuiceWeaponTipRadians()', () =>
  {
    it('converts a tagged degree value to radians', () =>
    {
      const action = buildAction({ getBaseSkill: () => ({ jabsJuiceStabTipDegrees: 180 }) });

      expect(JuiceProfileResolver.resolveJuiceWeaponTipRadians(action, 'bash')).toBeCloseTo(Math.PI);
    });

    it('defaults to the stab tip angle for stab-forward when untagged', () =>
    {
      const action = buildAction({ getBaseSkill: () => ({}) });

      expect(JuiceProfileResolver.resolveJuiceWeaponTipRadians(action, 'stab-forward')).toEqual(-2.356);
    });

    it('defaults to the stab tip angle for present when untagged', () =>
    {
      const action = buildAction({ getBaseSkill: () => ({}) });

      expect(JuiceProfileResolver.resolveJuiceWeaponTipRadians(action, 'present')).toEqual(-2.356);
    });

    it('defaults to the bash/recoil tip angle for any other motion when untagged', () =>
    {
      const action = buildAction({ getBaseSkill: () => ({}) });

      expect(JuiceProfileResolver.resolveJuiceWeaponTipRadians(action, 'bash')).toEqual(3.14159);
    });

    it('ignores a non-finite tagged degree value', () =>
    {
      const action = buildAction({ getBaseSkill: () => ({ jabsJuiceStabTipDegrees: NaN }) });

      expect(JuiceProfileResolver.resolveJuiceWeaponTipRadians(action, 'bash')).toEqual(3.14159);
    });
  });

  /**
   * Builds a fake game battler (the "gb" internal to #equippedGearForJuiceInference) test double.
   * @param {object} [overrides] Overrides.
   * @returns {object} A fake game battler.
   */
  function buildGameBattler(overrides = {})
  {
    return {
      isActor: () => true,
      weapons: () => [],
      armors: () => [],
      equips: () => [ null, null ],
      isMainhandProvidedOffhandSkill: () => false,
      ...overrides,
    };
  }

  /**
   * Builds a fake caster test double wrapping the given game battler.
   * @param {object} gameBattler The wrapped game battler.
   * @returns {object} A fake caster.
   */
  function buildCaster(gameBattler)
  {
    return { getBattler: () => gameBattler };
  }

  describe('resolveWeaponIconIndex() / #equippedGearForJuiceInference()', () =>
  {
    it('returns the tagged icon index when present', () =>
    {
      const action = buildAction({ getBaseSkill: () => ({ jabsJuiceIconIndex: 7 }) });

      expect(JuiceProfileResolver.resolveWeaponIconIndex(buildCaster(buildGameBattler()), action)).toEqual(7);
    });

    it('returns -1 when the caster is not an actor', () =>
    {
      const gb = buildGameBattler({ isActor: () => false });

      expect(JuiceProfileResolver.resolveWeaponIconIndex(buildCaster(gb), buildAction())).toEqual(-1);
    });

    it('returns -1 when the actor has no weapons equipped', () =>
    {
      const gb = buildGameBattler({ weapons: () => [] });

      expect(JuiceProfileResolver.resolveWeaponIconIndex(buildCaster(gb), buildAction())).toEqual(-1);
    });

    it('uses the mainhand weapon for a non-offhand slot', () =>
    {
      const mainhand = { iconIndex: 10 };
      const gb = buildGameBattler({ weapons: () => [ mainhand ] });

      expect(JuiceProfileResolver.resolveWeaponIconIndex(buildCaster(gb), buildAction({ getCooldownType: () => 'Main' })))
        .toEqual(10);
    });

    it('uses the offhand weapon when dual-wielding', () =>
    {
      const offhand = { iconIndex: 20 };
      const gb = buildGameBattler({ weapons: () => [ {}, offhand ] });

      expect(JuiceProfileResolver.resolveWeaponIconIndex(buildCaster(gb), buildAction({ getCooldownType: () => 'Offhand' })))
        .toEqual(20);
    });

    it('uses the mainhand weapon for a single-weapon offhand skill routed through mainhand-provided path', () =>
    {
      const mainhand = { iconIndex: 30 };
      const gb = buildGameBattler({ weapons: () => [ mainhand ], isMainhandProvidedOffhandSkill: () => true });

      expect(JuiceProfileResolver.resolveWeaponIconIndex(buildCaster(gb), buildAction({ getCooldownType: () => 'Offhand' })))
        .toEqual(30);
    });

    it('uses an orb/shield armor for a single-weapon offhand skill not from the mainhand path', () =>
    {
      const mainhand = { iconIndex: 30 };
      const orbArmor = { iconIndex: 40, jabsOffhandSkillId: 1 };
      const gb = buildGameBattler({
        weapons: () => [ mainhand ],
        armors: () => [ orbArmor ],
        isMainhandProvidedOffhandSkill: () => false,
      });

      expect(JuiceProfileResolver.resolveWeaponIconIndex(buildCaster(gb), buildAction({ getCooldownType: () => 'Offhand' })))
        .toEqual(40);
    });

    it('falls back to the single mainhand weapon when no orb armor is found for the offhand skill', () =>
    {
      const mainhand = { iconIndex: 30 };
      const gb = buildGameBattler({ weapons: () => [ mainhand ], armors: () => [] });

      expect(JuiceProfileResolver.resolveWeaponIconIndex(buildCaster(gb), buildAction({ getCooldownType: () => 'Offhand' })))
        .toEqual(30);
    });
  });

  describe('#armorRowForOffhandSingleWeapon() via resolveWeaponIconIndex()', () =>
  {
    /**
     * Runs the offhand-single-weapon path with the given armors/equips setup.
     * @param {object[]} armors The armors() result.
     * @param {object[]} equips The equips() result.
     * @returns {number}
     */
    function resolveViaOffhand(armors, equips)
    {
      const mainhand = { iconIndex: 99 };
      const gb = buildGameBattler({ weapons: () => [ mainhand ], armors: () => armors, equips: () => equips });
      const action = buildAction({ getCooldownType: () => 'Offhand', getBaseSkill: () => ({ id: 5 }) });
      return JuiceProfileResolver.resolveWeaponIconIndex(buildCaster(gb), action);
    }

    it('matches by jabsOffhandSkillId first', () =>
    {
      const armor = { iconIndex: 1, jabsOffhandSkillId: 5, jabsSkillId: 0 };
      expect(resolveViaOffhand([ armor ], [ null, null ])).toEqual(1);
    });

    it('matches by jabsSkillId when offhand skill id does not match', () =>
    {
      const armor = { iconIndex: 2, jabsOffhandSkillId: 0, jabsSkillId: 5 };
      expect(resolveViaOffhand([ armor ], [ null, null ])).toEqual(2);
    });

    it('falls back to equip slot 1 when it is armor', () =>
    {
      globalThis.DataManager.isArmor.mockReturnValue(true);
      const slot1 = { iconIndex: 3 };
      expect(resolveViaOffhand([], [ null, slot1 ])).toEqual(3);
    });

    it('falls back to the first armor row when slot 1 is not armor', () =>
    {
      globalThis.DataManager.isArmor.mockReturnValue(false);
      const firstArmor = { iconIndex: 4 };
      expect(resolveViaOffhand([ firstArmor ], [ null, {} ])).toEqual(4);
    });

    it('returns null (falls back to the mainhand weapon) when nothing matches at all', () =>
    {
      globalThis.DataManager.isArmor.mockReturnValue(false);
      // no armors at all, and no equip slot 1- #armorRowForOffhandSingleWeapon returns null,
      // so resolveWeaponIconIndex falls through to the mainhand weapon's icon (99).
      expect(resolveViaOffhand([], [ null, null ])).toEqual(99);
    });
  });

  describe('resolveWeaponStyleKey()', () =>
  {
    it('returns the tagged style key when present', () =>
    {
      const action = buildAction({ getBaseSkill: () => ({ jabsJuiceWeaponStyle: 'custom-style' }) });

      expect(JuiceProfileResolver.resolveWeaponStyleKey(buildCaster(buildGameBattler()), action)).toEqual('custom-style');
    });

    it('defaults to "default" when no gear can be inferred', () =>
    {
      const gb = buildGameBattler({ isActor: () => false });

      expect(JuiceProfileResolver.resolveWeaponStyleKey(buildCaster(gb), buildAction())).toEqual('default');
    });

    it('returns the weapon type id as a string for a weapon-inferred gear row', () =>
    {
      const gb = buildGameBattler({ weapons: () => [ { wtypeId: 3 } ] });

      expect(JuiceProfileResolver.resolveWeaponStyleKey(buildCaster(gb), buildAction())).toEqual('3');
    });

    it('returns an "a"-prefixed armor type id for an armor-inferred gear row', () =>
    {
      globalThis.DataManager.isArmor.mockReturnValue(true);
      const mainhand = { iconIndex: 1 };
      const slot1Armor = { atypeId: 6 };
      const gb = buildGameBattler({ weapons: () => [ mainhand ], equips: () => [ null, slot1Armor ] });
      const action = buildAction({ getCooldownType: () => 'Offhand' });

      expect(JuiceProfileResolver.resolveWeaponStyleKey(buildCaster(gb), action)).toEqual('a6');
    });
  });

  describe('resolveStyleMultipliers()', () =>
  {
    it('returns the resolved row for a known style key', () =>
    {
      globalThis.J.ABS.EXT.JUICE.Metadata.weaponStyleMultipliers = { sword: { tiltMul: 1.5, swingMul: 2 } };

      const row = JuiceProfileResolver.resolveStyleMultipliers('sword');

      expect(row.tiltMul).toEqual(1.5);
      expect(row.swingMul).toEqual(2);
    });

    it('falls back to the default table row for an unknown style key', () =>
    {
      globalThis.J.ABS.EXT.JUICE.Metadata.weaponStyleMultipliers = { default: { tiltMul: 1.1, swingMul: 1.2 } };

      const row = JuiceProfileResolver.resolveStyleMultipliers('unknown');

      expect(row.tiltMul).toEqual(1.1);
      expect(row.swingMul).toEqual(1.2);
    });

    it('falls back to a neutral 1/1 row when even the default table entry is missing', () =>
    {
      globalThis.J.ABS.EXT.JUICE.Metadata.weaponStyleMultipliers = {};

      const row = JuiceProfileResolver.resolveStyleMultipliers('unknown');

      expect(row.tiltMul).toEqual(1);
      expect(row.swingMul).toEqual(1);
    });
  });
});
//endregion plugins/abs/ext/juice/resolvers/juice-profile-resolver.test.js
