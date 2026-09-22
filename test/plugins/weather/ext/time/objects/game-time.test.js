//region plugins/weather/ext/time/objects/game-time.test.js
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { installWeatherTimeGlobals } from '../fixtures/install-weather-time-globals.js';

/**
 * The bridge from the clock announcing itself to the forecast moving along.
 *
 * Three lines of source, and every one of them is a decision this plugin got wrong once during
 * design: it must call through to whatever else aliased the announcement, it must **advance and
 * not push**, and it must read the clock it was handed rather than the global.
 *
 * That last one is not a style preference. The very first announcement of a new game comes from
 * inside `Game_Time`'s own constructor, and `$gameTime` is still null until that constructor
 * returns - so the case below deliberately leaves the global unset.
 */
describe('Game_Time - the forecast bridge', () =>
{
  let clock;
  let ForecastDirector;
  let original;

  beforeEach(async () =>
  {
    vi.resetModules();

    installWeatherTimeGlobals({});

    // the engine class the alias hangs off. The announcement it extends is a spy installed before
    // the import, so the alias captures the spy and reaching the original is observable.
    original = vi.fn();
    globalThis.Game_Time = class
    {
    };
    globalThis.Game_Time.prototype.onTimeChanged = original;

    ({ default: ForecastDirector } =
      await import('../../../../../../src/plugins/weather/ext/time/managers/ForecastDirector.js'));

    vi.spyOn(ForecastDirector, 'advance')
      .mockImplementation(() =>
      {});
    vi.spyOn(ForecastDirector, 'push')
      .mockImplementation(() =>
      {});

    await import('../../../../../../src/plugins/weather/ext/time/objects/Game_Time.js');
    clock = new globalThis.Game_Time();
  });

  it('winds the forecast forward when the clock announces', () =>
  {
    // Act.
    clock.onTimeChanged();

    // Assert.
    expect(ForecastDirector.advance)
      .toHaveBeenCalledTimes(1);
  });

  it('hands over the clock that announced rather than reaching for the global', () =>
  {
    // Arrange - exactly the state of a new game's first announcement: the constructor is still
    // running, so the global this clock will become does not exist.
    delete globalThis.$gameTime;

    // Act.
    clock.onTimeChanged();

    // Assert.
    expect(ForecastDirector.advance)
      .toHaveBeenCalledWith(clock);
  });

  it('never pushes to the screen from the announcement', () =>
  {
    // Act.
    clock.onTimeChanged();

    // Assert - pushing reaches `$dataMap`, and the first announcement of a new game happens while
    // game objects are being created and no map exists. This is the whole reason the director is
    // split in two, and it is the one assertion that would catch somebody recombining it.
    expect(ForecastDirector.push)
      .not
      .toHaveBeenCalled();
  });

  it('still reaches whatever else had aliased the announcement', () =>
  {
    // Arrange - J-Lighting-Time aliases this same method, so a chain that stopped here would take
    // the day/night cycle down with it. The original was captured at import time, before this
    // test ran, which is what makes reaching it something the alias has to actually do.

    // Act.
    clock.onTimeChanged();

    // Assert.
    expect(original)
      .toHaveBeenCalledTimes(1);
  });

  it('calls the original on the clock that announced', () =>
  {
    // Arrange - an alias that called through with the wrong receiver would still satisfy the case
    // above while breaking every extension that reads the clock's own fields.

    // Act.
    clock.onTimeChanged();

    // Assert.
    expect(original.mock.instances[0])
      .toBe(clock);
  });
});
//endregion plugins/weather/ext/time/objects/game-time.test.js