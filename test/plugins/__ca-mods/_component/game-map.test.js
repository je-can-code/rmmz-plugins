//region plugins/__ca-mods/_component/game-map.test.js
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { installCaModsHostGlobals } from './fixtures/install-ca-mods-host-globals.js';

describe('CAMods Game_Map (real engine direct import)', () =>
{
  /** @type {import('vitest').Mock} */
  let originalSetupMock;

  beforeAll(async () =>
  {
    installCaModsHostGlobals();

    await import('../../../../src/plugins/_base/core/_metadata/initialization.js');
    await import('../../../../src/plugins/__ca-mods/core/_metadata/initialization.js');

    // the real engine's setup() loads tilesets/events/etc from $dataMap- far more than this suite
    // needs to exercise. Stand in a trivial no-op so the alias __ca-mods captures has something
    // safe to call through to, and so we can assert the wrapping behavior in isolation.
    originalSetupMock = vi.fn();
    globalThis.Game_Map.prototype.setup = originalSetupMock;

    // the file under test- overwrites checkPassage() and extends setup().
    await import('../../../../src/plugins/__ca-mods/core/objects/Game_Map.js');
  });

  afterAll(() =>
  {
    delete globalThis.PluginManager;
    delete globalThis.PluginMetadata;
    delete globalThis.__PLUGIN_NAME__;
    delete globalThis.__PLUGIN_VERSION__;
    delete globalThis.J;
  });

  afterEach(() =>
  {
    delete globalThis.$gameVariables;
  });

  /**
   * Builds a bare Game_Map stubbed with a single tile at (0, 0) carrying the given flag.
   * @param {number} flag
   * @returns {Game_Map}
   */
  function buildMapWithFlag(flag)
  {
    const map = Object.create(globalThis.Game_Map.prototype);
    map.tilesetFlags = () => [ flag ];
    map.allTiles = () => [ 0 ];
    return map;
  }

  describe('checkPassage', () =>
  {
    it('treats terrain tag 1 as always impassable, regardless of the requested passage bit', () =>
    {
      // (1 << 12) sets the flag's terrain-id nibble to 1- the CA-specific "ceiling" block.
      const map = buildMapWithFlag(1 << 12);

      expect(map.checkPassage(0, 0, 0x0f)).toBe(false);
    });

    it('treats the 0x10 "no effect on passage" bit as a transparent pass-through to the next tile', () =>
    {
      const map = Object.create(globalThis.Game_Map.prototype);
      // the first (upper) tile has 0x10 set and should be skipped; the second (lower) tile is
      // openly passable for the requested bit.
      map.tilesetFlags = () => [ 0x10, 0x00 ];
      map.allTiles = () => [ 0, 1 ];

      expect(map.checkPassage(0, 0, 0x0f)).toBe(true);
    });

    it('returns true when the requested bit is clear on the tile\'s flag (passable)', () =>
    {
      const map = buildMapWithFlag(0x00);

      expect(map.checkPassage(0, 0, 0x0f)).toBe(true);
    });

    it('returns false when the requested bit is fully set on the tile\'s flag (impassable)', () =>
    {
      const map = buildMapWithFlag(0x0f);

      expect(map.checkPassage(0, 0, 0x0f)).toBe(false);
    });
  });

  describe('setup', () =>
  {
    it('calls the original setup then seeds the rare/named-enemy variable with a random 1-100 value', () =>
    {
      const map = Object.create(globalThis.Game_Map.prototype);
      const setValue = vi.fn();
      globalThis.$gameVariables = { setValue };

      map.setup(7);

      // the stubbed original setup() was called through with the same mapId.
      expect(originalSetupMock).toHaveBeenCalledWith(7);
      expect(setValue).toHaveBeenCalledTimes(1);

      const [ [ variableId, value ] ] = setValue.mock.calls;
      expect(variableId).toBe(13);
      expect(value).toBeGreaterThanOrEqual(1);
      expect(value).toBeLessThanOrEqual(100);
    });
  });
});
//endregion plugins/__ca-mods/_component/game-map.test.js
