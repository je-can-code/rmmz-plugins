//region plugins/weather/ext/time/core/forecast-places.test.js
import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * What the forecast knows about the places it reports on.
 *
 * **The whole design claim is "no duplication"** - a place is a map id, and its weather is read
 * from the same note the map itself uses. So the cases below hand over realistic map JSON and
 * check that what comes back is a declaration the game's own resolver would have produced, not a
 * second opinion assembled from config.
 */
describe('ForecastPlaces', () =>
{
  let ForecastPlaces;
  let reads;

  /**
   * Stands in for the map files on disk.
   * @param {object} files Map file paths to their raw JSON text.
   */
  const withMaps = files =>
  {
    reads = [];
    globalThis.StorageManager = {
      fsReadFile: path =>
      {
        reads.push(path);

        if (files[path] === undefined) return null;

        return files[path];
      },
    };
  };

  /**
   * A map file as RPG Maker writes one, trimmed to what matters here.
   * @param {string} note What its note box says.
   * @returns {string}
   */
  const mapJson = note => JSON.stringify({
    note,
    data: [ 0, 0, 0 ],
    events: [],
  });

  beforeEach(async () =>
  {
    vi.resetModules();

    String.empty = '';
    globalThis.__PLUGIN_NAME__ = 'J-Weather-Time';

    globalThis.J = {
      WEATHER: {
        RegExp: {
          Weather: /<weather:[ ]?([a-zA-Z][a-zA-Z0-9_-]*)>/i,
          NoWeather: /<noWeather>/i,
        },
        EXT: {
          TIME: {
            Aliased: { MapWeatherResolver: new Map() },
            RegExp: { Climate: /<climate:[ ]?([a-zA-Z][a-zA-Z0-9_-]*)>/i },
          },
        },
      },
    };

    // the real resolver, plus this extension's alias of it, so what comes back is exactly what
    // the game itself would produce for the same note - which is the whole claim being tested.
    ({ default: globalThis.RPGManager } =
      await import('../../../../../../src/plugins/_base/core/managers/RPGManager.js'));
    ({ default: globalThis.MapWeatherResolver } =
      await import('../../../../../../src/plugins/weather/core/core/MapWeatherResolver.js'));
    await import('../../../../../../src/plugins/weather/ext/time/core/MapWeatherResolver.js');

    // the engine's own note parser, which is what makes a file read off disk indistinguishable
    // from a map the engine loaded itself.
    globalThis.DataManager = {
      extractMetadata: data =>
      {
        const regExp = /<([^<>:]+)(:?)([^>]*)>/g;
        data.meta = {};
        for (;;)
        {
          const match = regExp.exec(data.note);
          if (!match) break;
          data.meta[match[1]] = match[2] === ':' ? match[3] : true;
        }
      },
    };

    ({ default: ForecastPlaces } =
      await import('../../../../../../src/plugins/weather/ext/time/core/ForecastPlaces.js'));
    ForecastPlaces.forget();
  });

  describe('pathFor', () =>
  {
    it('pads a map id the way RPG Maker names its files', () =>
    {
      // Act.
      const result = ForecastPlaces.pathFor(19);

      // Assert - three digits, so map 19 is Map019 rather than Map19.
      expect(result)
        .toBe('data/Map019.json');
    });

    it('does not pad a map id that already fills the width', () =>
    {
      // Arrange - the near miss on the other side of the padding.
      const result = ForecastPlaces.pathFor(125);

      // Assert.
      expect(result)
        .toBe('data/Map125.json');
    });
  });

  describe('declarationOf', () =>
  {
    it('reads a map own weather tag off disk', () =>
    {
      // Arrange.
      withMaps({ 'data/Map120.json': mapJson('<weather:snow>') });

      // Act.
      const result = ForecastPlaces.declarationOf(120);

      // Assert - the very shape the resolver takes on arrival, produced by the resolver itself.
      expect(result)
        .toEqual({
          suppressed: false,
          preset: 'snow',
          hasSky: true,
          climate: null,
        });
    });

    it('reads a climate alongside it', () =>
    {
      // Arrange - the Forest, which is the reason climates exist.
      withMaps({ 'data/Map024.json': mapJson('<weather:fog>\n<climate:dreaming>') });

      // Act.
      const result = ForecastPlaces.declarationOf(24);

      // Assert.
      expect(result.climate)
        .toBe('dreaming');
    });

    it('notices a map that cannot see the sky', () =>
    {
      // Arrange - `hasSky` comes from J-TIME's tag through the engine's own meta parsing, so this
      // also proves extractMetadata ran on the file that was read.
      withMaps({ 'data/Map093.json': mapJson('<weather:motes>\n<noToneChange>') });

      // Act.
      const result = ForecastPlaces.declarationOf(93);

      // Assert.
      expect(result.hasSky)
        .toBe(false);
    });

    it('reports a map that does not exist rather than guessing', () =>
    {
      // Arrange.
      withMaps({});
      const warn = vi.spyOn(Diagnostics, 'warn')
        .mockImplementation(() =>
        {});

      // Act.
      const result = ForecastPlaces.declarationOf(999);

      // Assert.
      expect(result)
        .toBeNull();
      expect(warn)
        .toHaveBeenCalledWith('J-Weather-Time', 'forecast names a map that does not exist: [ data/Map999.json ]!');

      warn.mockRestore();
    });

    it('reads a given map exactly once', () =>
    {
      // Arrange - the forecast scene is something a player opens repeatedly, and a map's note
      // cannot change while the game runs.
      withMaps({ 'data/Map120.json': mapJson('<weather:snow>') });

      // Act.
      ForecastPlaces.declarationOf(120);
      ForecastPlaces.declarationOf(120);
      ForecastPlaces.declarationOf(120);

      // Assert.
      expect(reads)
        .toEqual([ 'data/Map120.json' ]);
    });

    it('remembers a map that was missing, rather than asking again every time', () =>
    {
      // Arrange - otherwise a mistyped id means a failed disk read and a console warning on every
      // single frame the scene is open.
      withMaps({});
      const warn = vi.spyOn(Diagnostics, 'warn')
        .mockImplementation(() =>
        {});

      // Act.
      ForecastPlaces.declarationOf(999);
      ForecastPlaces.declarationOf(999);

      // Assert.
      expect(reads)
        .toHaveLength(1);
      expect(warn)
        .toHaveBeenCalledTimes(1);

      warn.mockRestore();
    });
  });

  describe('forget', () =>
  {
    it('makes the next ask read the file again', () =>
    {
      // Arrange - what the development plugin command is for: retag a map, look again.
      withMaps({ 'data/Map120.json': mapJson('<weather:snow>') });
      ForecastPlaces.declarationOf(120);

      // Act.
      ForecastPlaces.forget();
      ForecastPlaces.declarationOf(120);

      // Assert.
      expect(reads)
        .toHaveLength(2);
    });

    it('picks up a tag that changed on disk', () =>
    {
      // Arrange - the proof that forgetting is worth anything at all: the answer has to change.
      const files = { 'data/Map120.json': mapJson('<weather:snow>') };
      withMaps(files);
      const before = ForecastPlaces.declarationOf(120).preset;

      // Act.
      files['data/Map120.json'] = mapJson('<weather:rain>');
      ForecastPlaces.forget();

      // Assert.
      expect(before)
        .toBe('snow');
      expect(ForecastPlaces.declarationOf(120).preset)
        .toBe('rain');
    });
  });

  describe('resolveAll', () =>
  {
    it('pairs every configured place with what its map declared', () =>
    {
      // Arrange.
      withMaps({
        'data/Map120.json': mapJson('<weather:snow>'),
        'data/Map125.json': mapJson('<weather:rain>'),
      });
      const places = [
        { name: 'Negative Peaks', mapId: 120 },
        { name: 'Deluge Valley', mapId: 125 },
      ];

      // Act.
      const result = ForecastPlaces.resolveAll(places);

      // Assert.
      expect(result.map(place => place.name))
        .toEqual([ 'Negative Peaks', 'Deluge Valley' ]);
      expect(result.map(place => place.declaration.preset))
        .toEqual([ 'snow', 'rain' ]);
    });

    it('drops a place whose map is missing and keeps the rest', () =>
    {
      // Arrange - a blank row reads as "clear" to anybody scanning, which is worse than absent.
      withMaps({ 'data/Map120.json': mapJson('<weather:snow>') });
      const warn = vi.spyOn(Diagnostics, 'warn')
        .mockImplementation(() =>
        {});
      const places = [
        { name: 'Nowhere', mapId: 999 },
        { name: 'Negative Peaks', mapId: 120 },
      ];

      // Act.
      const result = ForecastPlaces.resolveAll(places);

      // Assert.
      expect(result.map(place => place.name))
        .toEqual([ 'Negative Peaks' ]);

      warn.mockRestore();
    });

    it('reports nothing for a config that lists no places', () =>
    {
      // Arrange - the `places` block is optional.
      withMaps({});

      // Act.
      const result = ForecastPlaces.resolveAll(undefined);

      // Assert.
      expect(result)
        .toEqual([]);
    });
  });
});
//endregion plugins/weather/ext/time/core/forecast-places.test.js