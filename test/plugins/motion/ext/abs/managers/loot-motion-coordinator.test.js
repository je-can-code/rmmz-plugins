//region plugins/motion/ext/abs/managers/loot-motion-coordinator.test.js
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { installDeathMetadata, installMotionAbsGlobals } from '../fixtures/install-motion-abs-globals.js';

/**
 * The bridge between how long a loot drop has left and whether its sprite is visibly going.
 *
 * The warning runs in two stages that overlap - a blink for the last stretch, a dissolve joining it
 * for the closing stretch inside that - and the contract is easy to break in ways nothing would
 * notice. It is called on every frame of a live drop's life, so declaring has to be idempotent
 * rather than restarting each stage sixty times a second; the two stages have to be declared under
 * separate sources, because a source replacing its own declarations tears down whatever it had
 * running and would restart the blink the moment the dissolve joined it; and a drop that gets
 * claimed mid-warning must have both stages taken back, since it is about to be collected rather
 * than lost.
 */
describe('LootMotionCoordinator', () =>
{
  /** @type {typeof import('../../../../../../src/plugins/motion/ext/abs/managers/LootMotionCoordinator.js').default} */
  let LootMotionCoordinator;

  /** @type {typeof import('../../../../../../src/plugins/motion/core/managers/CharacterMotionComposer.js').default} */
  let CharacterMotionComposer;

  /** @type {typeof import('../../../../../../src/plugins/motion/core/core/MotionChannels.js').default} */
  let MotionChannels;

  beforeAll(async () =>
  {
    installMotionAbsGlobals();

    // literal import paths, so Stryker can map mutants in these files back to this test file.
    ({ default: LootMotionCoordinator } =
      await import('../../../../../../src/plugins/motion/ext/abs/managers/LootMotionCoordinator.js'));
    ({ default: CharacterMotionComposer } =
      await import('../../../../../../src/plugins/motion/core/managers/CharacterMotionComposer.js'));
    ({ default: MotionChannels } =
      await import('../../../../../../src/plugins/motion/core/core/MotionChannels.js'));
  });

  /** @type {Object} */
  let character;

  beforeEach(() =>
  {
    installDeathMetadata();
    character = { name: 'a-loot-sprite' };
  });

  afterEach(() =>
  {
    CharacterMotionComposer.forget(character);
    vi.restoreAllMocks();
  });

  /**
   * Builds a loot sprite stand-in wired to the shared character.
   * @param {Object} lootOverrides What this particular drop reports about itself.
   * @returns {Object} The Sprite_Character stand-in.
   */
  const aLootSprite = (lootOverrides = {}) =>
  {
    const lootDrop = {
      isWaiting: () => true,
      canExpire: () => true,
      duration: () => 900,
      ...lootOverrides,
    };

    character.getJabsLoot = () => lootDrop;

    return { character: () => character };
  };

  /**
   * Runs the composer for a number of frames and reports the final opacity.
   * @param {number} frames How many frames to compose.
   * @returns {number} The composed opacity on the last frame.
   */
  const opacityAfter = frames =>
  {
    let composed = 1;
    for (let frame = 0; frame < frames; frame++)
    {
      composed = CharacterMotionComposer.compose(character)
        .valueFor(MotionChannels.OPACITY);
    }

    return composed;
  };

  describe('syncExpiryWarning', () =>
  {
    it('declares nothing for a drop with plenty of life left', () =>
    {
      // Arrange- 900 frames remaining against a 300 frame warning window.
      const sprite = aLootSprite();

      // Act
      LootMotionCoordinator.syncExpiryWarning(sprite);

      // Assert
      expect(CharacterMotionComposer.hasMotion(character))
        .toEqual(false);
    });

    it('starts a drop blinking once it crosses into the warning window', () =>
    {
      // Arrange- 250 frames left: inside the 300 frame warning window, outside the 120 frame fade
      // one, so only the blink should be running.
      const sprite = aLootSprite({ duration: () => 250 });

      // Act
      LootMotionCoordinator.syncExpiryWarning(sprite);

      // Assert- the blink swings opacity below full without ever driving it to nothing, which is
      // what separates it from the dissolve.
      const composed = opacityAfter(30);
      expect(composed).toBeLessThan(1);
      expect(composed).toBeGreaterThan(0);
    });

    it('does not dissolve a drop that is only in the warning window', () =>
    {
      // Arrange- the same 250 frames, run long enough that a dissolve declared by mistake would
      // have driven opacity to the floor by now.
      const sprite = aLootSprite({ duration: () => 250 });

      // Act
      LootMotionCoordinator.syncExpiryWarning(sprite);

      // Assert- the blink's own floor is 0.2, so anything at or above it has not been dissolved.
      const composed = opacityAfter(200);
      expect(composed).toBeGreaterThanOrEqual(0.2);
    });

    it('adds the dissolve once the drop crosses into the fade window', () =>
    {
      // Arrange- 100 frames left, inside both windows.
      const sprite = aLootSprite({ duration: () => 100 });

      // Act
      LootMotionCoordinator.syncExpiryWarning(sprite);

      // Assert- the dissolve multiplies onto the blink, so opacity now goes below the blink's own
      // floor rather than bouncing off it.
      const composed = opacityAfter(110);
      expect(composed).toBeLessThan(0.2);
    });

    it('declares the blink on the exact frame the warning window opens', () =>
    {
      // Arrange- 300 frames left against a 300 frame window, the boundary itself.
      const sprite = aLootSprite({ duration: () => 300 });

      // Act
      LootMotionCoordinator.syncExpiryWarning(sprite);

      // Assert
      expect(CharacterMotionComposer.hasMotion(character))
        .toEqual(true);
    });

    it('declares nothing one frame before the warning window opens', () =>
    {
      // Arrange- the other side of the same boundary.
      const sprite = aLootSprite({ duration: () => 301 });

      // Act
      LootMotionCoordinator.syncExpiryWarning(sprite);

      // Assert
      expect(CharacterMotionComposer.hasMotion(character))
        .toEqual(false);
    });

    it('does not restart the blink when the dissolve joins it', () =>
    {
      // Arrange- run the blink alone for a while, then let the drop cross into the fade window
      // exactly as the countdown would carry it. Sharing one source key between the two stages
      // would tear the blink down and rebuild it here.
      const blinking = aLootSprite({ duration: () => 250 });
      LootMotionCoordinator.syncExpiryWarning(blinking);
      opacityAfter(40);
      const blinkEffects = CharacterMotionComposer.compose(character);

      // Act
      const dissolving = aLootSprite({ duration: () => 100 });
      LootMotionCoordinator.syncExpiryWarning(dissolving);

      // Assert- the blink is still the same running effect, so the composed opacity keeps moving
      // rather than snapping back to the rest value a fresh declaration would start from.
      expect(blinkEffects.valueFor(MotionChannels.OPACITY))
        .toBeLessThan(1);
      expect(opacityAfter(1))
        .toBeLessThan(1);
    });

    it('withdraws a running warning when the drop gets claimed', () =>
    {
      // Arrange- a drop that blinked and dissolved most of the way out, and only then got
      // magnetized. Letting it run down first is what makes the recovery observable: a
      // barely-started warning is already near full opacity, so it could not tell a withdrawal
      // apart from doing nothing at all.
      const doomed = aLootSprite({ duration: () => 100 });
      LootMotionCoordinator.syncExpiryWarning(doomed);
      const whileDoomed = opacityAfter(110);

      // Act- the same drop, now claimed.
      const claimed = aLootSprite({ duration: () => 100, isWaiting: () => false });
      LootMotionCoordinator.syncExpiryWarning(claimed);

      // Assert- the drop is about to be collected rather than lost, so it has to visibly come back
      // rather than finishing its disappearance.
      expect(opacityAfter(60))
        .toBeGreaterThan(whileDoomed);
    });

    it('declares nothing for a drop that has been claimed', () =>
    {
      // Arrange- inside both windows in every respect except that it is already spoken for, so the
      // waiting check is the only thing that can prevent the warning.
      const sprite = aLootSprite({ duration: () => 100, isWaiting: () => false });

      // Act
      LootMotionCoordinator.syncExpiryWarning(sprite);

      // Assert
      expect(CharacterMotionComposer.hasMotion(character))
        .toEqual(false);
    });

    it('declares nothing for a drop that never expires', () =>
    {
      // Arrange- a permanent drop whose duration happens to sit inside both windows anyway. Only
      // the expiration check can be what stops it, since the duration alone would qualify.
      const sprite = aLootSprite({ duration: () => 100, canExpire: () => false });

      // Act
      LootMotionCoordinator.syncExpiryWarning(sprite);

      // Assert
      expect(CharacterMotionComposer.hasMotion(character))
        .toEqual(false);
    });

    it('reads both window widths from configuration rather than hardcoding them', () =>
    {
      // Arrange- much wider windows than the defaults, and a drop well outside both default ones.
      // If either width were baked in, this drop would not qualify.
      installDeathMetadata({ lootExpiryWarnFrames: 900, lootExpiryFadeFrames: 600 });
      const sprite = aLootSprite({ duration: () => 700 });

      // Act
      LootMotionCoordinator.syncExpiryWarning(sprite);

      // Assert- blinking, since 700 is inside the 900 warning window but outside the 600 fade one.
      const composed = opacityAfter(200);
      expect(composed).toBeLessThan(1);
      expect(composed).toBeGreaterThanOrEqual(0.2);
    });

    it('reads the blink shape from configuration', () =>
    {
      // Arrange- a blink that never leaves full opacity at all. A hardcoded range would still dip.
      installDeathMetadata({ lootExpiryFlicker: { min: 1.0, max: 1.0, interval: 8 } });
      const sprite = aLootSprite({ duration: () => 250 });

      // Act
      LootMotionCoordinator.syncExpiryWarning(sprite);

      // Assert
      expect(opacityAfter(60))
        .toEqual(1);
    });
  });
});
//endregion plugins/motion/ext/abs/managers/loot-motion-coordinator.test.js
