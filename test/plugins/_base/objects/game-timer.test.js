//region plugins/_base/objects/game-timer.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('J-Base Game_Timer (direct src import)', () =>
{
  let originalInitialize;
  let originalStart;

  beforeAll(async () =>
  {
    globalThis.J = { BASE: { Aliased: { Game_Timer: new Map() } } };

    function Game_Timer()
    {
    }

    // vanilla RMMZ behavior (rmmz_objects.js), stubbed bare so J.BASE.Aliased captures real functions.
    originalInitialize = vi.fn(function()
    {
      this._frames = 0;
      this._working = false;
    });
    originalStart = vi.fn(function(count)
    {
      this._frames = count;
      this._working = true;
    });
    Game_Timer.prototype.initialize = originalInitialize;
    Game_Timer.prototype.start = originalStart;

    globalThis.Game_Timer = Game_Timer;

    await import('../../../../src/plugins/_base/objects/Game_Timer.js');
  });

  beforeEach(() =>
  {
    originalInitialize.mockClear();
    originalStart.mockClear();
  });

  function buildTimer()
  {
    return Object.create(globalThis.Game_Timer.prototype);
  }

  describe('initialize', () =>
  {
    it('calls the original aliased initialize (regression: used to call the aliased start instead)', () =>
    {
      // Arrange
      const timer = buildTimer();

      // Act
      timer.initialize();

      // Assert
      expect(originalInitialize).toHaveBeenCalledOnce();
      expect(originalStart).not.toHaveBeenCalled();
    });

    it('leaves the timer in the correct zeroed/stopped state', () =>
    {
      // Arrange
      const timer = buildTimer();

      // Act
      timer.initialize();

      // Assert
      expect(timer._frames).toBe(0);
      expect(timer._working).toBe(false);
    });

    it('also initializes _duration to 0', () =>
    {
      // Arrange
      const timer = buildTimer();

      // Act
      timer.initialize();

      // Assert
      expect(timer._duration).toBe(0);
    });
  });

  describe('start', () =>
  {
    it('calls the original aliased start with the given duration', () =>
    {
      // Arrange
      const timer = buildTimer();

      // Act
      timer.start(60);

      // Assert
      expect(originalStart).toHaveBeenCalledWith(60);
    });

    it('stores the duration for later elapsedFrames reads', () =>
    {
      // Arrange
      const timer = buildTimer();

      // Act
      timer.start(60);

      // Assert
      expect(timer._duration).toBe(60);
    });
  });

  describe('elapsedFrames', () =>
  {
    it('returns the difference between the stored duration and the current frame count', () =>
    {
      // Arrange
      const timer = buildTimer();
      timer.start(60);
      timer._frames = 45;

      // Act
      const result = timer.elapsedFrames();

      // Assert
      expect(result).toBe(15);
    });
  });
});
//endregion plugins/_base/objects/game-timer.test.js
