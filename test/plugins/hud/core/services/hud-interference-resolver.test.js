//region plugins/hud/core/services/hud-interference-resolver.test.js
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';

describe('HudInterferenceResolver (direct src import)', () =>
{
  let HudInterferenceResolver;

  beforeAll(async () =>
  {
    ({ default: HudInterferenceResolver } = await import('../../../../../src/plugins/hud/core/services/HudInterferenceResolver.js'));
  });

  /**
   * Stands the player at a given screen position on a 48px-tile map.
   * @param {number} centerX The horizontal center of the player sprite.
   * @param {number} feetY The bottom of the player sprite.
   */
  const standPlayerAt = (centerX, feetY) =>
  {
    globalThis.$gameMap = {
      tileWidth: () => 48,
      tileHeight: () => 48,
    };

    globalThis.$gamePlayer = {
      screenX: () => centerX,
      screenY: () => feetY,
    };
  };

  beforeEach(() =>
  {
    // most cases care about geometry rather than where the player happens to be standing.
    standPlayerAt(960, 540);
  });

  afterEach(() =>
  {
    delete globalThis.$gameMap;
    delete globalThis.$gamePlayer;
  });

  describe('playerBounds', () =>
  {
    it('builds the box outward from screenX and upward from screenY', () =>
    {
      // Arrange
      standPlayerAt(500, 400);

      // Act
      const result = HudInterferenceResolver.playerBounds();

      // Assert
      expect(result).toEqual({
        left: 476,
        top: 352,
        right: 524,
        bottom: 400,
      });
    });
  });

  describe('frameBounds', () =>
  {
    it('inflates the window rectangle by the margin on every side', () =>
    {
      // Arrange
      const frame = {
        x: 100,
        y: 200,
        width: 300,
        height: 400,
      };

      // Act
      const result = HudInterferenceResolver.frameBounds(frame);

      // Assert
      expect(result).toEqual({
        left: 76,
        top: 176,
        right: 424,
        bottom: 624,
      });
    });
  });

  describe('overlaps', () =>
  {
    // a fixed reference box every case is measured against, so a mutant that ignores one operand
    // cannot pass by accident on a box that happens to be symmetrical.
    const reference = {
      left: 100,
      top: 200,
      right: 300,
      bottom: 400,
    };

    it('returns false when the first box is entirely left of the second', () =>
    {
      // Arrange
      const first = {
        left: 0,
        top: 200,
        right: 99,
        bottom: 400,
      };

      // Act
      const result = HudInterferenceResolver.overlaps(first, reference);

      // Assert
      expect(result).toBe(false);
    });

    it('returns false when the first box is entirely right of the second', () =>
    {
      // Arrange
      const first = {
        left: 301,
        top: 200,
        right: 500,
        bottom: 400,
      };

      // Act
      const result = HudInterferenceResolver.overlaps(first, reference);

      // Assert
      expect(result).toBe(false);
    });

    it('returns false when the first box is entirely above the second', () =>
    {
      // Arrange
      const first = {
        left: 100,
        top: 0,
        right: 300,
        bottom: 199,
      };

      // Act
      const result = HudInterferenceResolver.overlaps(first, reference);

      // Assert
      expect(result).toBe(false);
    });

    it('returns false when the first box is entirely below the second', () =>
    {
      // Arrange
      const first = {
        left: 100,
        top: 401,
        right: 300,
        bottom: 600,
      };

      // Act
      const result = HudInterferenceResolver.overlaps(first, reference);

      // Assert
      expect(result).toBe(false);
    });

    it('returns false when the boxes only touch along an edge', () =>
    {
      // Arrange
      const first = {
        left: 300,
        top: 200,
        right: 500,
        bottom: 400,
      };

      // Act
      const result = HudInterferenceResolver.overlaps(first, reference);

      // Assert
      expect(result).toBe(false);
    });

    it('returns true when the boxes share area', () =>
    {
      // Arrange
      const first = {
        left: 299,
        top: 399,
        right: 500,
        bottom: 600,
      };

      // Act
      const result = HudInterferenceResolver.overlaps(first, reference);

      // Assert
      expect(result).toBe(true);
    });
  });

  describe('isPlayerInterfering', () =>
  {
    // the frame this pair of cases straddles: a 200x100 window at (400, 300), inflated by the
    // 24px margin to (376, 276)-(624, 424). the player box is 48 wide and 48 tall.
    const bounds = {
      left: 376,
      top: 276,
      right: 624,
      bottom: 424,
    };

    it('returns true when the player box crosses into the inflated bounds', () =>
    {
      // Arrange - the player's right edge lands at 377, one pixel past the left bound.
      standPlayerAt(353, 300);

      // Act
      const result = HudInterferenceResolver.isPlayerInterfering(bounds);

      // Assert
      expect(result).toBe(true);
    });

    it('returns false when the player box stops one pixel short of the inflated bounds', () =>
    {
      // Arrange - the player's right edge lands exactly on 376, which touches rather than overlaps.
      standPlayerAt(352, 300);

      // Act
      const result = HudInterferenceResolver.isPlayerInterfering(bounds);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('steppedAlpha', () =>
  {
    it('snaps to the target when already sitting on it', () =>
    {
      // Arrange/Act
      const result = HudInterferenceResolver.steppedAlpha(0.25, 0.25);

      // Assert
      expect(result).toBe(0.25);
    });

    it('snaps to the target when the remaining distance is within a single step', () =>
    {
      // Arrange/Act - 0.03 of travel left, which is less than the 0.06 step.
      const result = HudInterferenceResolver.steppedAlpha(0.22, 0.25);

      // Assert
      expect(result).toBe(0.25);
    });

    it('steps upward when the target is more than one step above', () =>
    {
      // Arrange/Act
      const result = HudInterferenceResolver.steppedAlpha(0.5, 1.0);

      // Assert
      expect(result).toBeCloseTo(0.56, 10);
    });

    it('steps downward when the target is more than one step below', () =>
    {
      // Arrange/Act
      const result = HudInterferenceResolver.steppedAlpha(1.0, 0.25);

      // Assert
      expect(result).toBeCloseTo(0.94, 10);
    });
  });

  describe('nextFrameAlpha', () =>
  {
    // a 200x100 window at (400, 300); inflated bounds run (376, 276)-(624, 424).
    const buildFrame = alpha => (
    {
      x: 400,
      y: 300,
      width: 200,
      height: 100,
      alpha,
    });

    it('steps toward the dimmed alpha while the player stands on the frame', () =>
    {
      // Arrange
      standPlayerAt(500, 350);
      const frame = buildFrame(1.0);

      // Act
      const result = HudInterferenceResolver.nextFrameAlpha(frame);

      // Assert
      expect(result).toBeCloseTo(0.94, 10);
    });

    it('steps toward the full alpha while the player stands clear of the frame', () =>
    {
      // Arrange - far below and right of the inflated bounds.
      standPlayerAt(1500, 900);
      const frame = buildFrame(0.25);

      // Act
      const result = HudInterferenceResolver.nextFrameAlpha(frame);

      // Assert
      expect(result).toBeCloseTo(0.31, 10);
    });
  });
});
//endregion plugins/hud/core/services/hud-interference-resolver.test.js