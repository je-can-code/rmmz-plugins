//region plugins/weather/core/_component/map-declaration-reading.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';
import {
  installWeatherHostGlobals,
  setPluginContextToJWeather,
} from '../../fixtures/install-weather-host-globals.js';

/**
 * Reading a map's note box, through the real regular expressions and the real note reader.
 *
 * Deliberately not a unit test with hand-copied patterns. The thing worth checking here is whether
 * the *shipped* regexes match what an author will actually type, and a test carrying its own copy of
 * them would agree with itself no matter how wrong both were. So this imports J-Weather's own
 * initialization for the patterns and J-Base's `RPGManager` for the reading, and hands them note
 * strings of the kind that end up in Map Properties.
 */
describe('reading a map weather declaration', () =>
{
  let MapWeatherResolver;

  beforeAll(async () =>
  {
    vi.resetModules();

    installWeatherHostGlobals();
    setPluginContextToJWeather();

    // the real note reader rather than a stub: how a tag is found in a note is the question.
    ({ default: globalThis.RPGManager } =
      await import('../../../../../src/plugins/_base/core/managers/RPGManager.js'));

    // the real patterns, out of the ship that declares them.
    await import('../../../../../src/plugins/weather/core/_metadata/initialization.js');

    ({ default: MapWeatherResolver } =
      await import('../../../../../src/plugins/weather/core/core/MapWeatherResolver.js'));
  });

  /**
   * Builds a stand-in for `$dataMap` carrying a given note.
   *
   * `meta` is supplied rather than derived because RMMZ builds it at runtime from the note, and this
   * is reading the note directly - the two are separate paths and conflating them would test neither.
   * @param {string} note What is typed in Map Properties.
   * @param {object} meta What RMMZ extracted from it.
   * @returns {object}
   */
  const buildMap = (note, meta = {}) => ({
    note,
    meta,
  });

  it('reads the preset out of a weather tag', () =>
  {
    // Arrange.
    const dataMap = buildMap('<weather:rain>');

    // Act.
    const result = MapWeatherResolver.declarationFor(dataMap);

    // Assert.
    expect(result.preset)
      .toBe('rain');
    expect(result.suppressed)
      .toBe(false);
  });

  it('tolerates the optional space an author may leave after the colon', () =>
  {
    // Arrange - every tag in this repo allows exactly one, and somebody always types it.
    const dataMap = buildMap('<weather: motes>');

    // Act.
    const result = MapWeatherResolver.declarationFor(dataMap);

    // Assert.
    expect(result.preset)
      .toBe('motes');
  });

  it('reads a preset name carrying a hyphen', () =>
  {
    // Arrange - `submerged` is one word, but a two-word look is a matter of time.
    const dataMap = buildMap('<weather:fall-drift>');

    // Act.
    const result = MapWeatherResolver.declarationFor(dataMap);

    // Assert.
    expect(result.preset)
      .toBe('fall-drift');
  });

  it('finds the tag among the other things a map note carries', () =>
  {
    // Arrange - a real note box, where weather is one line of several.
    const dataMap = buildMap('<noToneChange>\n<ambient:[85]>\n<weather:motes>', { noToneChange: true });

    // Act.
    const result = MapWeatherResolver.declarationFor(dataMap);

    // Assert - the right tag read, and the neighbouring ones neither swallowed nor mistaken for it.
    expect(result.preset)
      .toBe('motes');
    expect(result.hasSky)
      .toBe(false);
  });

  it('reports no preset for a map that authored none', () =>
  {
    // Arrange - most of the game.
    const dataMap = buildMap('');

    // Act.
    const result = MapWeatherResolver.declarationFor(dataMap);

    // Assert.
    expect(result.preset)
      .toBeNull();
  });

  it('notices an opt-out', () =>
  {
    // Arrange - a courtyard under a canopy.
    const dataMap = buildMap('<noWeather>');

    // Act.
    const result = MapWeatherResolver.declarationFor(dataMap);

    // Assert.
    expect(result.suppressed)
      .toBe(true);
  });

  it('does not mistake a weather tag for an opt-out', () =>
  {
    // Arrange - the two tags share a prefix, which is exactly how a lazy pattern goes wrong.
    const dataMap = buildMap('<weather:rain>');

    // Act.
    const result = MapWeatherResolver.declarationFor(dataMap);

    // Assert.
    expect(result.suppressed)
      .toBe(false);
  });

  it('reads sky overhead for a map that never said otherwise', () =>
  {
    // Arrange - an ordinary field.
    const dataMap = buildMap('<weather:rain>');

    // Act.
    const result = MapWeatherResolver.declarationFor(dataMap);

    // Assert.
    expect(result.hasSky)
      .toBe(true);
  });

  it('reads no sky for a map that opted out of the day cycle', () =>
  {
    // Arrange - J-TIME's tag, which is the one place this answer lives.
    const dataMap = buildMap('<noToneChange>', { noToneChange: true });

    // Act.
    const result = MapWeatherResolver.declarationFor(dataMap);

    // Assert.
    expect(result.hasSky)
      .toBe(false);
  });
});
//endregion plugins/weather/core/_component/map-declaration-reading.test.js