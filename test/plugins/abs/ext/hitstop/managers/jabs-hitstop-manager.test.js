//region plugins/abs/ext/hitstop/managers/jabs-hitstop-manager.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('J-ABS-Hitstop JABS_HitstopManager (unit, all downstream dependencies mocked)', () =>
{
  const HITSTOP_REGEX = Symbol('Hitstop');
  const NO_HITSTOP_REGEX = Symbol('NoHitstop');
  const HITSTOP_SCALE_REGEX = Symbol('HitstopScale');

  /** @type {typeof import('../../../../../../src/plugins/abs/ext/hitstop/managers/JABS_HitstopManager.js').default} */
  let JABS_HitstopManager;
  /** @type {typeof import('../../../../../../src/plugins/abs/ext/hitstop/_models/JABS_HitstopRuntime.js').default} */
  let JABS_HitstopRuntime;

  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = {
      ABS: {
        EXT: {
          HITSTOP: {
            RegExp: { Hitstop: HITSTOP_REGEX, NoHitstop: NO_HITSTOP_REGEX, HitstopScale: HITSTOP_SCALE_REGEX },
            Metadata: {
              defaultHitstopFrames: 5,
              critBonusFrames: 3,
              guardScalePercent: 50,
              maxFrames: 30,
              flurryDecayPercent: 50,
              flurryWindowFrames: 20,
              shakeOnHit: true,
              shakeMinFrames: 2,
              shakeOnlyOnFlurryFirstHit: false,
              onlyOnPlayerImpact: false,
              alsoOnPlayerAsTarget: false,
              shakeCooldownFrames: 10,
              shakeBasePower: 1,
              shakePowerPerFrame: 0.5,
              shakeSpeed: 5,
              shakeMaxDurationFrames: 10,
            },
          },
        },
      },
    };

    globalThis.RPGManager = { getNumberFromNoteByRegex: vi.fn() };
    globalThis.Graphics = { frameCount: 0 };
    globalThis.SceneManager = { _frameCount: 0 };
    globalThis.$gameScreen = { startShake: vi.fn() };

    ({ default: JABS_HitstopRuntime } = await import('../../../../../../src/plugins/abs/ext/hitstop/_models/JABS_HitstopRuntime.js'));
    ({ default: JABS_HitstopManager } = await import('../../../../../../src/plugins/abs/ext/hitstop/managers/JABS_HitstopManager.js'));
  });

  beforeEach(() =>
  {
    globalThis.RPGManager.getNumberFromNoteByRegex.mockReset().mockReturnValue(0);
    globalThis.$gameScreen.startShake.mockReset();
    globalThis.Graphics.frameCount = 0;
    JABS_HitstopRuntime.lastShakeFrame = -1000;
  });

  /** Builds a duck-typed JABS_Action carrying only what hitstop touches. */
  function buildAction(overrides = {})
  {
    return Object.assign({
      skillDisablesHitstop: () => false,
      getHitstopFrames: () => 0,
      getUuid: () => 'action-uuid',
      getActionSprite: () => null,
    }, overrides);
  }

  /** Builds a duck-typed JABS_Battler carrying only what hitstop touches. */
  function buildJabsBattler(character, overrides = {})
  {
    return Object.assign({
      getCharacter: () => character,
      getBattler: () => ({ result: () => ({}) }),
      getBattlerDatabaseData: () => ({}),
      isPlayer: () => false,
    }, overrides);
  }

  /** Builds a duck-typed Game_Character carrying real hitstop data storage. */
  function buildCharacter()
  {
    const frames = { value: 0 };
    const flurryWindows = new Set();
    return {
      getHitstopData: () => ({
        getFrames: () => frames.value,
        setFrames: (f) => { frames.value = f; },
        isInFlurryWindow: (uuid) => flurryWindows.has(uuid),
        flagFlurryWindow: (uuid) => flurryWindows.add(uuid),
      }),
    };
  }

  describe('durationFor', () =>
  {
    it('returns 0 when the skill has no hitstop frames and no default is configured', () =>
    {
      // Arrange
      globalThis.J.ABS.EXT.HITSTOP.Metadata.defaultHitstopFrames = 0;
      const action = buildAction();
      const target = buildJabsBattler(buildCharacter());

      // Act
      const result = JABS_HitstopManager.durationFor(action, null, target);

      // Assert
      expect(result).toBe(0);

      // Cleanup
      globalThis.J.ABS.EXT.HITSTOP.Metadata.defaultHitstopFrames = 5;
    });

    it('returns 0 when the skill declares <noHitstop>', () =>
    {
      // Arrange
      const action = buildAction({ skillDisablesHitstop: () => true });
      const target = buildJabsBattler(buildCharacter());

      // Act
      const result = JABS_HitstopManager.durationFor(action, null, target);

      // Assert
      expect(result).toBe(0);
    });

    it('uses the default frames when the skill has no tagged value', () =>
    {
      // Arrange
      const action = buildAction();
      const target = buildJabsBattler(buildCharacter());

      // Act
      const result = JABS_HitstopManager.durationFor(action, null, target);

      // Assert- default 5 frames, no crit/guard/scale adjustments.
      expect(result).toBe(5);
    });

    it('uses the tagged frames when the skill declares a positive value', () =>
    {
      // Arrange
      const action = buildAction({ getHitstopFrames: () => 8 });
      const target = buildJabsBattler(buildCharacter());

      // Act
      const result = JABS_HitstopManager.durationFor(action, null, target);

      // Assert
      expect(result).toBe(8);
    });

    it('adds the crit bonus when the result was a critical hit', () =>
    {
      // Arrange
      const action = buildAction();
      const target = buildJabsBattler(buildCharacter(), {
        getBattler: () => ({ result: () => ({ critical: true }) }),
      });

      // Act
      const result = JABS_HitstopManager.durationFor(action, null, target);

      // Assert- (5 base + 3 crit) * 1 guard scale = 8.
      expect(result).toBe(8);
    });

    it('scales down by the guard percent when the result was guarded', () =>
    {
      // Arrange
      const action = buildAction();
      const target = buildJabsBattler(buildCharacter(), {
        getBattler: () => ({ result: () => ({ guarded: true }) }),
      });

      // Act
      const result = JABS_HitstopManager.durationFor(action, null, target);

      // Assert- 5 base * 0.5 guard scale = 2 (floored).
      expect(result).toBe(2);
    });

    it('nullifies the duration entirely when the result was parried', () =>
    {
      // Arrange
      const action = buildAction();
      const target = buildJabsBattler(buildCharacter(), {
        getBattler: () => ({ result: () => ({ parried: true }) }),
      });

      // Act
      const result = JABS_HitstopManager.durationFor(action, null, target);

      // Assert
      expect(result).toBe(0);
    });

    it('applies a per-battler scale tag when present', () =>
    {
      // Arrange
      globalThis.RPGManager.getNumberFromNoteByRegex.mockReturnValue(50);
      const action = buildAction();
      const target = buildJabsBattler(buildCharacter());

      // Act
      const result = JABS_HitstopManager.durationFor(action, null, target);

      // Assert- 5 base * 0.5 battler scale = 2 (floored).
      expect(result).toBe(2);
    });

    it('clamps the result to the configured max frames', () =>
    {
      // Arrange
      const action = buildAction({ getHitstopFrames: () => 100 });
      const target = buildJabsBattler(buildCharacter());

      // Act
      const result = JABS_HitstopManager.durationFor(action, null, target);

      // Assert
      expect(result).toBe(30);
    });
  });

  describe('apply', () =>
  {
    it('does nothing when the computed duration is zero', () =>
    {
      // Arrange
      globalThis.J.ABS.EXT.HITSTOP.Metadata.defaultHitstopFrames = 0;
      const action = buildAction();
      const targetChar = buildCharacter();
      const target = buildJabsBattler(targetChar);
      const attacker = buildJabsBattler(buildCharacter());

      // Act
      JABS_HitstopManager.apply(action, attacker, target);

      // Assert
      expect(targetChar.getHitstopData().getFrames()).toBe(0);

      // Cleanup
      globalThis.J.ABS.EXT.HITSTOP.Metadata.defaultHitstopFrames = 5;
    });

    it('applies the computed frames to target, attacker, and the action sprite', () =>
    {
      // Arrange
      const targetChar = buildCharacter();
      const attackerChar = buildCharacter();
      const actionChar = buildCharacter();
      const action = buildAction({ getActionSprite: () => actionChar });
      const target = buildJabsBattler(targetChar);
      const attacker = buildJabsBattler(attackerChar);

      // Act
      JABS_HitstopManager.apply(action, attacker, target);

      // Assert
      expect(targetChar.getHitstopData().getFrames()).toBe(5);
      expect(attackerChar.getHitstopData().getFrames()).toBe(5);
      expect(actionChar.getHitstopData().getFrames()).toBe(5);
    });

    it('does not touch an action sprite when there is none', () =>
    {
      // Arrange
      const targetChar = buildCharacter();
      const attackerChar = buildCharacter();
      const action = buildAction();
      const target = buildJabsBattler(targetChar);
      const attacker = buildJabsBattler(attackerChar);

      // Act / Assert- no throw despite a null action sprite.
      expect(() => JABS_HitstopManager.apply(action, attacker, target)).not.toThrow();
    });

    it('coalesces concurrent impacts by extending rather than overwriting existing frames', () =>
    {
      // Arrange
      const targetChar = buildCharacter();
      targetChar.getHitstopData()
        .setFrames(3);
      const action = buildAction({ getHitstopFrames: () => 1 });
      const target = buildJabsBattler(targetChar);
      const attacker = buildJabsBattler(buildCharacter());

      // Act
      JABS_HitstopManager.apply(action, attacker, target);

      // Assert- computed duration (1) is less than existing (3), so the max wins.
      expect(targetChar.getHitstopData().getFrames()).toBe(3);
    });

    it('decays frames when a second impact from the same action lands inside the flurry window', () =>
    {
      // Arrange
      const targetChar = buildCharacter();
      const action = buildAction({ getHitstopFrames: () => 10 });
      const target = buildJabsBattler(targetChar);
      const attacker = buildJabsBattler(buildCharacter());

      // Act- first impact flags the flurry window; second impact lands inside it and decays.
      JABS_HitstopManager.apply(action, attacker, target);
      targetChar.getHitstopData()
        .setFrames(0);
      JABS_HitstopManager.apply(action, attacker, target);

      // Assert- 10 * 50% flurry decay = 5.
      expect(targetChar.getHitstopData().getFrames()).toBe(5);
    });

    it('does not apply anything when decay reduces the frames to zero', () =>
    {
      // Arrange
      globalThis.J.ABS.EXT.HITSTOP.Metadata.flurryDecayPercent = 0;
      const targetChar = buildCharacter();
      const action = buildAction({ getHitstopFrames: () => 10 });
      const target = buildJabsBattler(targetChar);
      const attacker = buildJabsBattler(buildCharacter());

      // Act
      JABS_HitstopManager.apply(action, attacker, target);
      targetChar.getHitstopData()
        .setFrames(0);
      JABS_HitstopManager.apply(action, attacker, target);

      // Assert
      expect(targetChar.getHitstopData().getFrames()).toBe(0);

      // Cleanup
      globalThis.J.ABS.EXT.HITSTOP.Metadata.flurryDecayPercent = 50;
    });

    describe('micro shake', () =>
    {
      it('does not shake when the shakeOnHit toggle is off', () =>
      {
        // Arrange
        globalThis.J.ABS.EXT.HITSTOP.Metadata.shakeOnHit = false;
        const action = buildAction();
        const target = buildJabsBattler(buildCharacter());
        const attacker = buildJabsBattler(buildCharacter());

        // Act
        JABS_HitstopManager.apply(action, attacker, target);

        // Assert
        expect(globalThis.$gameScreen.startShake).not.toHaveBeenCalled();

        // Cleanup
        globalThis.J.ABS.EXT.HITSTOP.Metadata.shakeOnHit = true;
      });

      it('does not shake when the frames are below the configured minimum', () =>
      {
        // Arrange
        globalThis.J.ABS.EXT.HITSTOP.Metadata.shakeMinFrames = 100;
        const action = buildAction();
        const target = buildJabsBattler(buildCharacter());
        const attacker = buildJabsBattler(buildCharacter());

        // Act
        JABS_HitstopManager.apply(action, attacker, target);

        // Assert
        expect(globalThis.$gameScreen.startShake).not.toHaveBeenCalled();

        // Cleanup
        globalThis.J.ABS.EXT.HITSTOP.Metadata.shakeMinFrames = 2;
      });

      it('does not shake on a non-first flurry hit when configured to only shake on the first', () =>
      {
        // Arrange
        globalThis.J.ABS.EXT.HITSTOP.Metadata.shakeOnlyOnFlurryFirstHit = true;
        const targetChar = buildCharacter();
        const action = buildAction({ getHitstopFrames: () => 10 });
        const target = buildJabsBattler(targetChar);
        const attacker = buildJabsBattler(buildCharacter());

        // Act- first hit shakes and flags the flurry window; second hit should not shake.
        JABS_HitstopManager.apply(action, attacker, target);
        globalThis.$gameScreen.startShake.mockReset();
        targetChar.getHitstopData()
          .setFrames(0);
        JABS_HitstopManager.apply(action, attacker, target);

        // Assert
        expect(globalThis.$gameScreen.startShake).not.toHaveBeenCalled();

        // Cleanup
        globalThis.J.ABS.EXT.HITSTOP.Metadata.shakeOnlyOnFlurryFirstHit = false;
      });

      it('does not shake when gated to player-only impacts and neither side is the player', () =>
      {
        // Arrange
        globalThis.J.ABS.EXT.HITSTOP.Metadata.onlyOnPlayerImpact = true;
        const action = buildAction();
        const target = buildJabsBattler(buildCharacter());
        const attacker = buildJabsBattler(buildCharacter());

        // Act
        JABS_HitstopManager.apply(action, attacker, target);

        // Assert
        expect(globalThis.$gameScreen.startShake).not.toHaveBeenCalled();

        // Cleanup
        globalThis.J.ABS.EXT.HITSTOP.Metadata.onlyOnPlayerImpact = false;
      });

      it('shakes when gated to player-only impacts and the attacker is the player', () =>
      {
        // Arrange
        globalThis.J.ABS.EXT.HITSTOP.Metadata.onlyOnPlayerImpact = true;
        const action = buildAction();
        const target = buildJabsBattler(buildCharacter());
        const attacker = buildJabsBattler(buildCharacter(), { isPlayer: () => true });

        // Act
        JABS_HitstopManager.apply(action, attacker, target);

        // Assert
        expect(globalThis.$gameScreen.startShake).toHaveBeenCalledTimes(1);

        // Cleanup
        globalThis.J.ABS.EXT.HITSTOP.Metadata.onlyOnPlayerImpact = false;
      });

      it('does not shake when the anti-spam cooldown has not yet elapsed', () =>
      {
        // Arrange
        globalThis.Graphics.frameCount = 5;
        JABS_HitstopRuntime.lastShakeFrame = 0;
        const action = buildAction();
        const target = buildJabsBattler(buildCharacter());
        const attacker = buildJabsBattler(buildCharacter());

        // Act
        JABS_HitstopManager.apply(action, attacker, target);

        // Assert- cooldown is 10 frames; only 5 have elapsed.
        expect(globalThis.$gameScreen.startShake).not.toHaveBeenCalled();
      });

      it('shakes with power scaled by frames once the cooldown has elapsed', () =>
      {
        // Arrange
        globalThis.Graphics.frameCount = 1000;
        JABS_HitstopRuntime.lastShakeFrame = 0;
        const action = buildAction();
        const target = buildJabsBattler(buildCharacter());
        const attacker = buildJabsBattler(buildCharacter());

        // Act
        JABS_HitstopManager.apply(action, attacker, target);

        // Assert- power = base(1) + frames(5) * perFrame(0.5) = 3.5; duration = min(5, 10) = 5.
        expect(globalThis.$gameScreen.startShake).toHaveBeenCalledWith(3.5, 5, 5);
        expect(JABS_HitstopRuntime.lastShakeFrame).toBe(1000);
      });
    });
  });
});
//endregion plugins/abs/ext/hitstop/managers/jabs-hitstop-manager.test.js
