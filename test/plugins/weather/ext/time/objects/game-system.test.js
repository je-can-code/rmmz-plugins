//region plugins/weather/ext/time/objects/game-system.test.js
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { installWeatherTimeGlobals } from '../fixtures/install-weather-time-globals.js';

/**
 * The sky's own memory, on the object every savefile already carries.
 *
 * Two fields and four accessors, which sounds too small to be worth a suite until you notice what
 * the two fields do: one is the forecast a player can read, and the other is the dedupe that keeps
 * a once-a-minute announcement from stepping the sky two hundred and forty times a phase. Both
 * have to survive a load, and both are seeded rather than saved on every file written before this
 * plugin existed.
 */
describe('Game_System - the sky slice', () =>
{
  let system;

  beforeEach(async () =>
  {
    vi.resetModules();

    installWeatherTimeGlobals({});

    await import('../../../../../../src/plugins/weather/ext/time/objects/Game_System.js');
    system = new globalThis.Game_System();
  });

  describe('initWeatherTimeMembers', () =>
  {
    it('seeds an empty forecast rather than rolling one', () =>
    {
      // Act.
      const result = system.skyForecast();

      // Assert - rolling here would need the clock, and the clock does not exist yet at the moment
      // game objects are created.
      expect(result)
        .toEqual({ startPhase: 0, types: [], intensities: [] });
    });

    it('seeds the last applied phase as no phase at all', () =>
    {
      // Act.
      const result = system.lastAppliedSkyPhase();

      // Assert - -1 rather than 0, because 0 is a real phase and seeding it there would dedupe
      // away the very first decision of a new game.
      expect(result)
        .toBe(-1);
    });

    it('still reaches whatever else had claimed initMembers', () =>
    {
      // Arrange - the alias has to call through, or every other plugin's slice vanishes. The
      // fixture's base class is the stand-in for all of them.
      const base = Object.getPrototypeOf(system).constructor;
      let reached = false;
      base.prototype.initMembers = function()
      {
        reached = true;
      };

      // Act.
      system.initMembers();

      // Assert.
      expect(reached)
        .toBe(true);
    });
  });

  describe('skyForecast', () =>
  {
    it('hands back whatever was last stored', () =>
    {
      // Arrange - a forecast unlike the seeded one in every field, so a getter that ignored the
      // setter and returned the default would be visible.
      const forecast = {
        startPhase: 4366250,
        types: [ 'rain', 'overcast' ],
        intensities: [ 'heavy', 'light' ],
      };

      // Act.
      system.setSkyForecast(forecast);

      // Assert.
      expect(system.skyForecast())
        .toEqual(forecast);
    });
  });

  describe('lastAppliedSkyPhase', () =>
  {
    it('hands back whatever was last stored', () =>
    {
      // Arrange.
      // Act.
      system.setLastAppliedSkyPhase(4366250);

      // Assert.
      expect(system.lastAppliedSkyPhase())
        .toBe(4366250);
    });
  });
});
//endregion plugins/weather/ext/time/objects/game-system.test.js