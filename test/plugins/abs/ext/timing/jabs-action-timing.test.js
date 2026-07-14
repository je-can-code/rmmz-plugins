//region plugins/abs/ext/timing/jabs-action-timing.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('J-ABS-Timing JABS_Action (unit, all downstream dependencies mocked)', () =>
{
  /** @type {import('vitest').Mock} the "original" getCastTime captured by J.ABS.EXT.TIMING.Aliased at import time- must be mutated in place via mockReturnValue, not reassigned, since the alias map holds a fixed reference to this exact function object. */
  let originalGetCastTime;

  /** @type {import('vitest').Mock} same deal as {@link originalGetCastTime}, for getCooldown. */
  let originalGetCooldown;

  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = {
      ABS: {
        EXT: {
          TIMING: {
            Aliased: { JABS_Action: new Map() },
          },
        },
      },
    };

    // JABS_Action.prototype.getCastTime/getCooldown are aliased ("original") before this file
    // overwrites them; stub them directly with canned return values rather than pulling in the
    // real class (which would need Game_Event/sprite/map construction unrelated to this logic).
    function JABS_Action()
    {
    }

    originalGetCastTime = vi.fn(() => 0);
    originalGetCooldown = vi.fn(() => 0);
    JABS_Action.prototype.getCastTime = originalGetCastTime;
    JABS_Action.prototype.getCooldown = originalGetCooldown;
    globalThis.JABS_Action = JABS_Action;

    // the file under test- patches globalThis.JABS_Action.prototype directly, no vm involved.
    await import('../../../../../src/plugins/abs/ext/timing/_models/JABS_Action.js');
  });

  beforeEach(() =>
  {
    // reset the SAME mock instances the Aliased map already holds a reference to.
    originalGetCastTime.mockReset()
      .mockReturnValue(0);
    originalGetCooldown.mockReset()
      .mockReturnValue(0);
  });

  /**
   * Builds a duck-typed JABS_Action carrying only what getCastTime/getCooldown touch: a caster
   * chain resolving to the given battler stub (or null, to exercise the no-battler bypass).
   * @param {object|null} battler
   * @returns {object}
   */
  function buildAction(battler)
  {
    const action = Object.create(globalThis.JABS_Action.prototype);
    action.getCaster = () => ({ getBattler: () => battler });
    return action;
  }

  describe('getCastTime', () =>
  {
    it('returns the raw (aliased) cast time unmodified when the caster battler is missing', () =>
    {
      // Arrange
      originalGetCastTime.mockReturnValue(30);
      const action = buildAction(null);

      // Act
      const result = action.getCastTime();

      // Assert
      expect(result).toBe(30);
    });

    it('applies the caster battler\'s applyCastSpeed to the raw (aliased) cast time', () =>
    {
      // Arrange
      originalGetCastTime.mockReturnValue(30);
      const applyCastSpeed = vi.fn(() => 40);
      const battler = { applyCastSpeed };
      const action = buildAction(battler);

      // Act
      const result = action.getCastTime();

      // Assert
      expect(applyCastSpeed).toHaveBeenCalledWith(30);
      expect(result).toBe(40);
    });
  });

  describe('getCooldown', () =>
  {
    it('returns the raw (aliased) cooldown unmodified when the caster battler is missing', () =>
    {
      // Arrange
      originalGetCooldown.mockReturnValue(60);
      const action = buildAction(null);

      // Act
      const result = action.getCooldown();

      // Assert
      expect(result).toBe(60);
    });

    it('applies the caster battler\'s applyFastCooldown to the raw (aliased) cooldown', () =>
    {
      // Arrange
      originalGetCooldown.mockReturnValue(60);
      const applyFastCooldown = vi.fn(() => 65);
      const battler = { applyFastCooldown };
      const action = buildAction(battler);

      // Act
      const result = action.getCooldown();

      // Assert
      expect(applyFastCooldown).toHaveBeenCalledWith(60);
      expect(result).toBe(65);
    });
  });
});
//endregion plugins/abs/ext/timing/jabs-action-timing.test.js
