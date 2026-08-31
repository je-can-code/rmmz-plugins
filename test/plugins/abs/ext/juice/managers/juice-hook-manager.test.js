//region plugins/abs/ext/juice/managers/juice-hook-manager.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * JuiceHookManager.js is a genuine ES `class` (static-only, never instantiated). Every sibling
 * model/manager it imports is mocked per the "unit tier mocks all downstream file-external
 * dependencies" convention, except JuiceFlurryStrikeRecord- a pure, dependency-free value object
 * imported for real. JABS_Button is a bare global here (not imported by this file), stubbed
 * directly.
 */
describe('JuiceHookManager (unit, all downstream dependencies mocked)', () =>
{
  /** @type {typeof import('../../../../../../src/plugins/abs/ext/juice/managers/JuiceHookManager.js').default} */
  let JuiceHookManager;
  let JuiceMapSpriteFinderMock;
  let JuiceMotionManagerMock;
  let JuiceProfileResolverMock;
  let JuiceWeaponSwingOverlayMock;

  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = {
      ABS: {
        EXT: {
          JUICE: {
            Metadata: {
              flurryDecayPercent: 50,
              targetMagicalSquishIntensity: 0.2,
              targetPhysicalSquishIntensity: 0.3,
              healingRecipientSquishScale: 0.5,
              targetSquishFrames: 10,
              dodgeSquishIntensity: 0.1,
              dodgeSquishFrames: 8,
              unarmedStrikeSquishFrames: 20,
              unarmedStrikeSquishIntensity: 0.4,
              supportCasterPulseFrames: 16,
              supportCasterPulseIntensity: 0.15,
              casterStrikeTiltRadians: 0.3,
              casterStrikeTiltFrames: 6,
              weaponSwingFrames: 12,
              weaponSwingPeakRadians: 0.5,
              castingPulseAmplitude: 0.25,
            },
          },
        },
      },
    };
    globalThis.JABS_Button = { Dodge: 'Dodge' };
    globalThis.Graphics = { frameCount: 0 };

    JuiceMapSpriteFinderMock = { findSpriteCharacterFor: vi.fn() };
    vi.doMock('../../../../../../src/plugins/abs/ext/juice/helpers/JuiceMapSpriteFinder.js', () => ({
      default: JuiceMapSpriteFinderMock,
    }));

    JuiceMotionManagerMock = {
      scheduleSquish: vi.fn(),
      scheduleFlipBody: vi.fn(),
      scheduleTilt: vi.fn(),
      scheduleCastingPulse: vi.fn(),
      cancelForCharacter: vi.fn(),
      cancelCastingPulse: vi.fn(),
    };
    vi.doMock('../../../../../../src/plugins/abs/ext/juice/managers/JuiceMotionManager.js', () => ({
      default: JuiceMotionManagerMock,
    }));

    JuiceProfileResolverMock = {
      resolveJuiceRepeatCount: vi.fn(() => 1),
      resolveJuiceDuration: vi.fn(() => null),
      resolveWeaponStyleKey: vi.fn(() => 'default'),
      resolveStyleMultipliers: vi.fn(() => ({ tiltMul: 1, swingMul: 1 })),
      resolveWeaponIconIndex: vi.fn(() => -1),
      resolveJuiceMotion: vi.fn(() => 'arc'),
      resolveJuiceArcSpanDegrees: vi.fn(() => 120),
      resolveJuiceWeaponTipRadians: vi.fn(() => 0),
      resolveJuiceProfileGun: vi.fn(() => false),
    };
    vi.doMock('../../../../../../src/plugins/abs/ext/juice/resolvers/JuiceProfileResolver.js', () => ({
      default: JuiceProfileResolverMock,
    }));

    JuiceWeaponSwingOverlayMock = { play: vi.fn() };
    vi.doMock('../../../../../../src/plugins/abs/ext/juice/managers/JuiceWeaponSwingOverlay.js', () => ({
      default: JuiceWeaponSwingOverlayMock,
    }));

    ({ default: JuiceHookManager } =
      await import('../../../../../../src/plugins/abs/ext/juice/managers/JuiceHookManager.js'));
  });

  beforeEach(() =>
  {
    globalThis.Graphics.frameCount = 1;
    JuiceMapSpriteFinderMock.findSpriteCharacterFor.mockReset().mockReturnValue({ tag: 'sprite' });
    Object.values(JuiceMotionManagerMock).forEach(fn => fn.mockClear());
    Object.values(JuiceProfileResolverMock).forEach(fn => fn.mockClear());
    JuiceProfileResolverMock.resolveJuiceRepeatCount.mockReturnValue(1);
    JuiceProfileResolverMock.resolveJuiceDuration.mockReturnValue(null);
    JuiceProfileResolverMock.resolveWeaponStyleKey.mockReturnValue('default');
    JuiceProfileResolverMock.resolveStyleMultipliers.mockReturnValue({ tiltMul: 1, swingMul: 1 });
    JuiceProfileResolverMock.resolveWeaponIconIndex.mockReturnValue(-1);
    JuiceProfileResolverMock.resolveJuiceMotion.mockReturnValue('arc');
    JuiceProfileResolverMock.resolveJuiceArcSpanDegrees.mockReturnValue(120);
    JuiceProfileResolverMock.resolveJuiceWeaponTipRadians.mockReturnValue(0);
    JuiceProfileResolverMock.resolveJuiceProfileGun.mockReturnValue(false);
    JuiceWeaponSwingOverlayMock.play.mockClear();
  });

  // JuiceHookManager keys its private static flurry-decay cache by `${actionUuid}::${targetUuid}`
  // and that cache is never reset between tests (no accessor exists- it's a true private static).
  // Defaulting every fake battler/action to a fresh, unique uuid avoids cross-test key collisions;
  // tests that specifically exercise flurry decay reuse the SAME battler/action instances instead.
  let uuidCounter = 0;

  /**
   * Builds a fake battler test double.
   * @param {object} [overrides] Overrides.
   * @returns {object} A fake battler.
   */
  function buildBattler(overrides = {})
  {
    uuidCounter += 1;
    const uuid = `battler-uuid-${uuidCounter}`;
    return {
      getUuid: () => uuid,
      getCharacter: () => ({}),
      getBattler: () => ({ result: () => ({ parried: false, evaded: false }) }),
      isCasting: () => true,
      ...overrides,
    };
  }

  /**
   * Builds a fake action test double.
   * @param {object} [overrides] Overrides.
   * @returns {object} A fake action.
   */
  function buildAction(overrides = {})
  {
    uuidCounter += 1;
    const uuid = `action-uuid-${uuidCounter}`;
    return {
      getUuid: () => uuid,
      getAction: () => ({ item: () => ({ damage: { type: 1 } }), isPhysical: () => false }),
      isHealing: () => false,
      getBaseSkill: () => ({ jabsNoJuice: false, jabsJuiceMotion: String.empty, damage: { type: 1 } }),
      getCooldownType: () => 'combat',
      direction: () => 2,
      ...overrides,
    };
  }

  describe('onPostPrimaryBattleEffects()', () =>
  {
    it('does nothing when the result was parried', () =>
    {
      const target = buildBattler({ getBattler: () => ({ result: () => ({ parried: true, evaded: false }) }) });

      JuiceHookManager.onPostPrimaryBattleEffects(buildAction(), target);

      expect(JuiceMotionManagerMock.scheduleSquish).not.toHaveBeenCalled();
    });

    it('does nothing when the result was evaded', () =>
    {
      const target = buildBattler({ getBattler: () => ({ result: () => ({ parried: false, evaded: true }) }) });

      JuiceHookManager.onPostPrimaryBattleEffects(buildAction(), target);

      expect(JuiceMotionManagerMock.scheduleSquish).not.toHaveBeenCalled();
    });

    it('reacts on a target that is not currently drawn anywhere', () =>
    {
      // Arrange: a hit reaction is declared on the character, not written to a sprite, so a target
      // the spriteset has not built yet still records its reaction and plays it on arrival.
      JuiceMapSpriteFinderMock.findSpriteCharacterFor.mockReturnValue(null);

      // Act
      JuiceHookManager.onPostPrimaryBattleEffects(buildAction(), buildBattler());

      // Assert
      expect(JuiceMotionManagerMock.scheduleSquish).toHaveBeenCalled();
    });

    it('does nothing for a support/utility skill (damage.type 0)', () =>
    {
      const action = buildAction({ getAction: () => ({ item: () => ({ damage: { type: 0 } }), isPhysical: () => false }) });

      JuiceHookManager.onPostPrimaryBattleEffects(action, buildBattler());

      expect(JuiceMotionManagerMock.scheduleSquish).not.toHaveBeenCalled();
    });

    it('uses the physical squish intensity for a physical hit', () =>
    {
      const action = buildAction({ getAction: () => ({ item: () => ({ damage: { type: 1 } }), isPhysical: () => true }) });

      JuiceHookManager.onPostPrimaryBattleEffects(action, buildBattler());

      expect(JuiceMotionManagerMock.scheduleSquish.mock.calls.at(-1)[1]).toBeCloseTo(0.3);
    });

    it('uses the magical squish intensity for a non-physical hit', () =>
    {
      const action = buildAction({ getAction: () => ({ item: () => ({ damage: { type: 1 } }), isPhysical: () => false }) });

      JuiceHookManager.onPostPrimaryBattleEffects(action, buildBattler());

      expect(JuiceMotionManagerMock.scheduleSquish.mock.calls.at(-1)[1]).toBeCloseTo(0.2);
    });

    it('scales intensity down for a healing action', () =>
    {
      const action = buildAction({
        getAction: () => ({ item: () => ({ damage: { type: 1 } }), isPhysical: () => false }),
        isHealing: () => true,
      });

      JuiceHookManager.onPostPrimaryBattleEffects(action, buildBattler());

      expect(JuiceMotionManagerMock.scheduleSquish.mock.calls.at(-1)[1]).toBeCloseTo(0.1);
    });

    it('runs the flurry garbage collector every 600th frame', () =>
    {
      // Arrange: the collector keeps no reachable state of its own, but the flurry cache it empties
      // is readable through the intensity decay - so build a decay up first and watch it vanish.
      // Three hits one frame apart: the first two land inside the flurry window and decay normally,
      // and the third lands on frame 600, where the sweep runs before the count is read and hands
      // back a battler the cache has never seen. Merely calling the hook on frame 600 proves
      // nothing: a collector that never fires also leaves the rest of the hook working.
      const action = buildAction();
      const target = buildBattler();

      globalThis.Graphics.frameCount = 598;
      JuiceHookManager.onPostPrimaryBattleEffects(action, target);
      const [ , firstIntensity ] = JuiceMotionManagerMock.scheduleSquish.mock.calls.at(-1);

      globalThis.Graphics.frameCount = 599;
      JuiceHookManager.onPostPrimaryBattleEffects(action, target);
      const [ , decayedIntensity ] = JuiceMotionManagerMock.scheduleSquish.mock.calls.at(-1);

      // Act
      globalThis.Graphics.frameCount = 600;
      JuiceHookManager.onPostPrimaryBattleEffects(action, target);

      // Assert
      const [ , sweptIntensity ] = JuiceMotionManagerMock.scheduleSquish.mock.calls.at(-1);
      expect(decayedIntensity).toBeLessThan(firstIntensity);
      expect(sweptIntensity).toBeCloseTo(firstIntensity);
    });

    it('decays intensity on a rapid repeat hit against the same target within the flurry window', () =>
    {
      const action = buildAction();
      const target = buildBattler();

      globalThis.Graphics.frameCount = 10;
      JuiceHookManager.onPostPrimaryBattleEffects(action, target);
      const [ , firstIntensity ] = JuiceMotionManagerMock.scheduleSquish.mock.calls.at(-1);

      globalThis.Graphics.frameCount = 11;
      JuiceHookManager.onPostPrimaryBattleEffects(action, target);
      const [ , secondIntensity ] = JuiceMotionManagerMock.scheduleSquish.mock.calls.at(-1);

      expect(secondIntensity).toBeLessThan(firstIntensity);
    });

    it('resets the flurry count once the window has elapsed', () =>
    {
      const action = buildAction();
      const target = buildBattler();

      globalThis.Graphics.frameCount = 20;
      JuiceHookManager.onPostPrimaryBattleEffects(action, target);
      const [ , firstIntensity ] = JuiceMotionManagerMock.scheduleSquish.mock.calls.at(-1);

      globalThis.Graphics.frameCount = 30;
      JuiceHookManager.onPostPrimaryBattleEffects(action, target);
      const [ , secondIntensity ] = JuiceMotionManagerMock.scheduleSquish.mock.calls.at(-1);

      expect(secondIntensity).toBeCloseTo(firstIntensity);
    });
  });

  describe('onExecuteMapAction()', () =>
  {
    it('applies dodge juice and returns early for the dodge cooldown key', () =>
    {
      const action = buildAction({ getCooldownType: () => 'Dodge' });

      JuiceHookManager.onExecuteMapAction(buildBattler(), action);

      expect(JuiceMotionManagerMock.scheduleSquish).toHaveBeenCalledWith(
        expect.anything(), 0.1, 8
      );
    });

    it('does nothing when the skill declares <noJuice>', () =>
    {
      const action = buildAction({ getBaseSkill: () => ({ jabsNoJuice: true }) });

      JuiceHookManager.onExecuteMapAction(buildBattler(), action);

      expect(JuiceMotionManagerMock.scheduleSquish).not.toHaveBeenCalled();
      expect(JuiceMotionManagerMock.scheduleTilt).not.toHaveBeenCalled();
    });

    it('does nothing for <juiceMotion:none>', () =>
    {
      const action = buildAction({
        getBaseSkill: () => ({ jabsNoJuice: false, jabsJuiceMotion: 'none' }),
      });

      JuiceHookManager.onExecuteMapAction(buildBattler(), action);

      expect(JuiceMotionManagerMock.scheduleSquish).not.toHaveBeenCalled();
    });

    it('applies squish caster juice for <juiceMotion:squish>', () =>
    {
      const action = buildAction({
        getBaseSkill: () => ({ jabsNoJuice: false, jabsJuiceMotion: 'squish' }),
      });

      JuiceHookManager.onExecuteMapAction(buildBattler(), action);

      expect(JuiceMotionManagerMock.scheduleSquish).toHaveBeenCalledWith(
        expect.anything(), 0.4, 20, 1
      );
    });

    it('applies support pulse juice for <juiceMotion:pulse>', () =>
    {
      const action = buildAction({
        getBaseSkill: () => ({ jabsNoJuice: false, jabsJuiceMotion: 'pulse' }),
      });

      JuiceHookManager.onExecuteMapAction(buildBattler(), action);

      expect(JuiceMotionManagerMock.scheduleSquish).toHaveBeenCalledWith(
        expect.anything(), 0.15, 16, 1
      );
    });

    it('applies a clockwise flip for <juiceMotion:flip>', () =>
    {
      const action = buildAction({
        getBaseSkill: () => ({ jabsNoJuice: false, jabsJuiceMotion: 'flip' }),
      });

      JuiceHookManager.onExecuteMapAction(buildBattler(), action);

      expect(JuiceMotionManagerMock.scheduleFlipBody).toHaveBeenCalledWith(expect.anything(), 'cw', 20, 1);
    });

    it('applies a counter-clockwise flip for <juiceMotion:flip-reverse>', () =>
    {
      const action = buildAction({
        getBaseSkill: () => ({ jabsNoJuice: false, jabsJuiceMotion: 'flip-reverse' }),
      });

      JuiceHookManager.onExecuteMapAction(buildBattler(), action);

      expect(JuiceMotionManagerMock.scheduleFlipBody).toHaveBeenCalledWith(expect.anything(), 'ccw', 20, 1);
    });

    it('applies the gentle support pulse for healing with no explicit motion tag', () =>
    {
      const action = buildAction({
        isHealing: () => true,
        getBaseSkill: () => ({ jabsNoJuice: false, jabsJuiceMotion: String.empty, damage: { type: 3 } }),
      });

      JuiceHookManager.onExecuteMapAction(buildBattler(), action);

      expect(JuiceMotionManagerMock.scheduleSquish).toHaveBeenCalledWith(
        expect.anything(), 0.15, 16, 1
      );
    });

    it('lets an explicit authored motion win over the healing shortcut', () =>
    {
      const action = buildAction({
        isHealing: () => true,
        getBaseSkill: () => ({ jabsNoJuice: false, jabsJuiceMotion: 'squish', damage: { type: 3 } }),
      });

      JuiceHookManager.onExecuteMapAction(buildBattler(), action);

      // squish (not the healing-shortcut pulse) should have fired.
      expect(JuiceMotionManagerMock.scheduleSquish).toHaveBeenCalledWith(
        expect.anything(), 0.4, 20, 1
      );
    });

    it('falls through to the strike juice when healing with an unrecognized authored motion tag', () =>
    {
      const action = buildAction({
        isHealing: () => true,
        getBaseSkill: () => ({ jabsNoJuice: false, jabsJuiceMotion: 'some-future-motion', damage: { type: 3 } }),
      });

      JuiceHookManager.onExecuteMapAction(buildBattler(), action);

      // the default strike juice (not the healing-shortcut pulse) should have fired.
      expect(JuiceMotionManagerMock.scheduleSquish).toHaveBeenCalledWith(
        expect.anything(), 0.4, 20
      );
    });

    it('applies the support pulse for a non-healing support skill (damage.type 0) with no motion tag', () =>
    {
      const action = buildAction({
        getBaseSkill: () => ({ jabsNoJuice: false, jabsJuiceMotion: String.empty, damage: { type: 0 } }),
      });

      JuiceHookManager.onExecuteMapAction(buildBattler(), action);

      expect(JuiceMotionManagerMock.scheduleSquish).toHaveBeenCalledWith(
        expect.anything(), 0.15, 16, 1
      );
    });

    it('lets an authored motion tag win over the support-skill pulse', () =>
    {
      // Arrange: a support skill (damage.type 0) that asked for a weapon motion by name. The pulse
      // is the shortcut for support skills that said nothing at all - a skill that named its motion
      // has to reach the strike path, the same way the healing shortcut yields to an authored tag.
      // Every existing support case leaves the tag empty, so the tag half of that pairing has never
      // had to be true, and the shortcut could have swallowed authored motions unnoticed.
      JuiceProfileResolverMock.resolveWeaponIconIndex.mockReturnValue(5);
      const action = buildAction({
        getBaseSkill: () => ({ jabsNoJuice: false, jabsJuiceMotion: 'bash', damage: { type: 0 } }),
      });

      // Act
      JuiceHookManager.onExecuteMapAction(buildBattler(), action);

      // Assert: the strike path tilts the caster; the support pulse never does.
      expect(JuiceMotionManagerMock.scheduleTilt).toHaveBeenCalled();
    });

    it('falls through to strike juice for a normal attack with no motion tag', () =>
    {
      JuiceProfileResolverMock.resolveWeaponIconIndex.mockReturnValue(5);
      const action = buildAction({
        getBaseSkill: () => ({ jabsNoJuice: false, jabsJuiceMotion: String.empty, damage: { type: 1 } }),
      });

      JuiceHookManager.onExecuteMapAction(buildBattler(), action);

      expect(JuiceMotionManagerMock.scheduleTilt).toHaveBeenCalled();
    });

    it('reacts on a caster that is not currently drawn anywhere', () =>
    {
      // Arrange: caster reactions are declared on the character, so a battler the spriteset has not
      // built yet still reacts. Only the weapon overlay needs a real sprite to hang off.
      JuiceMapSpriteFinderMock.findSpriteCharacterFor.mockReturnValue(null);
      const action = buildAction({ getBaseSkill: () => ({ jabsNoJuice: false, jabsJuiceMotion: 'flip' }) });

      // Act
      JuiceHookManager.onExecuteMapAction(buildBattler(), action);

      // Assert
      expect(JuiceMotionManagerMock.scheduleFlipBody).toHaveBeenCalledWith(expect.anything(), 'cw', 20, 1);
    });

    it('uses a custom repeat count and duration when resolved', () =>
    {
      JuiceProfileResolverMock.resolveJuiceRepeatCount.mockReturnValue(4);
      JuiceProfileResolverMock.resolveJuiceDuration.mockReturnValue(40);
      const action = buildAction({ getBaseSkill: () => ({ jabsNoJuice: false, jabsJuiceMotion: 'squish' }) });

      JuiceHookManager.onExecuteMapAction(buildBattler(), action);

      // 40 total frames / 4 cycles = 10 per cycle.
      expect(JuiceMotionManagerMock.scheduleSquish).toHaveBeenCalledWith(expect.anything(), 0.4, 10, 4);
    });
  });

  describe('#applyStrikeJuice() via onExecuteMapAction()', () =>
  {
    it('still leans the caster when no sprite is found, and skips only the overlay', () =>
    {
      // Arrange: the lean is composed onto the character and needs no sprite; the overlay is a
      // sprite this plugin parents to the caster's own, and that genuinely cannot happen without one.
      JuiceProfileResolverMock.resolveWeaponIconIndex.mockReturnValue(5);
      JuiceMapSpriteFinderMock.findSpriteCharacterFor.mockReturnValue(null);

      // Act
      JuiceHookManager.onExecuteMapAction(buildBattler(), buildAction());

      // Assert
      expect(JuiceMotionManagerMock.scheduleTilt).toHaveBeenCalled();
      expect(JuiceWeaponSwingOverlayMock.play).not.toHaveBeenCalled();
    });

    it('schedules a weapon swing overlay when a weapon icon resolves', () =>
    {
      JuiceProfileResolverMock.resolveWeaponIconIndex.mockReturnValue(5);

      JuiceHookManager.onExecuteMapAction(buildBattler(), buildAction());

      expect(JuiceWeaponSwingOverlayMock.play).toHaveBeenCalled();
      expect(JuiceMotionManagerMock.scheduleSquish).not.toHaveBeenCalled();
    });

    it('falls back to a squish when no weapon icon resolves', () =>
    {
      JuiceProfileResolverMock.resolveWeaponIconIndex.mockReturnValue(-1);

      JuiceHookManager.onExecuteMapAction(buildBattler(), buildAction());

      expect(JuiceMotionManagerMock.scheduleSquish).toHaveBeenCalledWith(
        expect.anything(), 0.4, 20
      );
    });

    it('falls back to the weapon-swing-frames default when no explicit juice duration resolves', () =>
    {
      JuiceProfileResolverMock.resolveWeaponIconIndex.mockReturnValue(5);
      JuiceProfileResolverMock.resolveJuiceDuration.mockReturnValue(null);

      JuiceHookManager.onExecuteMapAction(buildBattler(), buildAction());

      // duration is the 4th positional argument to JuiceWeaponSwingOverlay.play().
      expect(JuiceWeaponSwingOverlayMock.play.mock.calls.at(-1)[3]).toEqual(24); // weaponSwingFrames(12) * swingDurationMultiplier(2)
    });

    it('uses the explicit resolved juice duration when present', () =>
    {
      JuiceProfileResolverMock.resolveWeaponIconIndex.mockReturnValue(5);
      JuiceProfileResolverMock.resolveJuiceDuration.mockReturnValue(99);

      JuiceHookManager.onExecuteMapAction(buildBattler(), buildAction());

      expect(JuiceWeaponSwingOverlayMock.play.mock.calls.at(-1)[3]).toEqual(99);
    });
  });

  describe('tickCastingJuice()', () =>
  {
    it('renews the pulse with the configured amplitude and a short heartbeat', () =>
    {
      // Arrange
      const battler = buildBattler();

      // Act
      JuiceHookManager.tickCastingJuice(battler);

      // Assert
      expect(JuiceMotionManagerMock.scheduleCastingPulse).toHaveBeenCalledWith(
        expect.anything(), 0.25, 4
      );
    });

    it('renews on every call rather than only the first, which is what makes it a heartbeat', () =>
    {
      // Arrange: the whole point of renewing is that a cast which ends by an unhooked route stops
      // being renewed and lapses. A once-per-cast schedule would leave the pulse running forever.
      const battler = buildBattler();

      // Act
      JuiceHookManager.tickCastingJuice(battler);
      JuiceHookManager.tickCastingJuice(battler);
      JuiceHookManager.tickCastingJuice(battler);

      // Assert
      expect(JuiceMotionManagerMock.scheduleCastingPulse).toHaveBeenCalledTimes(3);
    });

    it('renews on a caster that is not currently drawn anywhere', () =>
    {
      // Arrange
      JuiceMapSpriteFinderMock.findSpriteCharacterFor.mockReturnValue(null);

      // Act
      JuiceHookManager.tickCastingJuice(buildBattler());

      // Assert
      expect(JuiceMotionManagerMock.scheduleCastingPulse).toHaveBeenCalled();
    });
  });

  describe('endCastingJuice()', () =>
  {
    it('settles the caster on the frame the cast actually ended', () =>
    {
      // Arrange
      const battler = buildBattler();

      // Act
      JuiceHookManager.endCastingJuice(battler);

      // Assert
      expect(JuiceMotionManagerMock.cancelCastingPulse).toHaveBeenCalledWith(battler.getCharacter());
    });

    it('leaves a reaction running, because finishing a cast is not a reason to cut one short', () =>
    {
      // Arrange
      const battler = buildBattler();

      // Act
      JuiceHookManager.endCastingJuice(battler);

      // Assert
      expect(JuiceMotionManagerMock.cancelForCharacter).not.toHaveBeenCalled();
    });

    it('settles a caster that is not currently drawn anywhere', () =>
    {
      // Arrange
      JuiceMapSpriteFinderMock.findSpriteCharacterFor.mockReturnValue(null);

      // Act
      JuiceHookManager.endCastingJuice(buildBattler());

      // Assert
      expect(JuiceMotionManagerMock.cancelCastingPulse).toHaveBeenCalled();
    });
  });
});
//endregion plugins/abs/ext/juice/managers/juice-hook-manager.test.js
