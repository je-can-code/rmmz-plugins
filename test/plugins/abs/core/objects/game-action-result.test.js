//region plugins/abs/core/objects/game-action-result.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('J-ABS Game_ActionResult augments (direct src import)', () =>
{
  let Game_ActionResult;

  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = { ABS: { Aliased: { Game_ActionResult: new Map() } } };

    function StubGameActionResult()
    {
    }

    StubGameActionResult.prototype.initialize = vi.fn();
    StubGameActionResult.prototype.clear = vi.fn();
    globalThis.Game_ActionResult = StubGameActionResult;

    await import('../../../../../src/plugins/abs/core/objects/Game_ActionResult.js');
    ({ Game_ActionResult } = globalThis);
  });

  beforeEach(() =>
  {
    vi.clearAllMocks();
  });

  describe('initialize', () =>
  {
    it('sets the guard/parry/glance/reduced members to their defaults', () =>
    {
      // Arrange
      const result = new Game_ActionResult();

      // Act
      result.initialize();

      // Assert
      expect(result.guarded).toBe(false);
      expect(result.parried).toBe(false);
      expect(result.glancing).toBe(false);
      expect(result.reduced).toBe(0);
    });

    it('always calls through to the original aliased implementation', () =>
    {
      // Arrange
      const result = new Game_ActionResult();

      // Act
      result.initialize();

      // Assert
      expect(globalThis.J.ABS.Aliased.Game_ActionResult.get('initialize')).toHaveBeenCalledTimes(1);
    });
  });

  describe('clear', () =>
  {
    it('always calls through to the original aliased implementation', () =>
    {
      // Arrange
      const result = new Game_ActionResult();

      // Act
      result.clear();

      // Assert
      expect(globalThis.J.ABS.Aliased.Game_ActionResult.get('clear')).toHaveBeenCalledTimes(1);
    });

    it('resets the guard/parry/glance/reduced members back to their defaults', () =>
    {
      // Arrange
      const result = new Game_ActionResult();
      result.guarded = true;
      result.parried = true;
      result.glancing = true;
      result.reduced = 10;

      // Act
      result.clear();

      // Assert
      expect(result.guarded).toBe(false);
      expect(result.parried).toBe(false);
      expect(result.glancing).toBe(false);
      expect(result.reduced).toBe(0);
    });
  });

  describe('isHit', () =>
  {
    it('is true when used, not parried, and not evaded', () =>
    {
      // Arrange
      const result = new Game_ActionResult();
      result.used = true;
      result.parried = false;
      result.evaded = false;

      // Act & Assert
      expect(result.isHit()).toBe(true);
    });

    it('is false when the action was never used', () =>
    {
      // Arrange
      const result = new Game_ActionResult();
      result.used = false;
      result.parried = false;
      result.evaded = false;

      // Act & Assert
      expect(result.isHit()).toBe(false);
    });

    it('is false when the action was parried', () =>
    {
      // Arrange
      const result = new Game_ActionResult();
      result.used = true;
      result.parried = true;
      result.evaded = false;

      // Act & Assert
      expect(result.isHit()).toBe(false);
    });

    it('is false when the action was evaded', () =>
    {
      // Arrange
      const result = new Game_ActionResult();
      result.used = true;
      result.parried = false;
      result.evaded = true;

      // Act & Assert
      expect(result.isHit()).toBe(false);
    });
  });

  describe('isEvaded', () =>
  {
    it('reflects the underlying evaded flag', () =>
    {
      // Arrange
      const result = new Game_ActionResult();
      result.evaded = true;

      // Act & Assert
      expect(result.isEvaded()).toBe(true);
    });
  });
});
//endregion plugins/abs/core/objects/game-action-result.test.js
