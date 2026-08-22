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
      // Arrange- the first (upper) tile carries 0x10 AND every requested passage bit. The extra bits
      // are what make this load-bearing: a tile of bare 0x10 would read as openly passable anyway,
      // so skipping it and evaluating it produce the same answer and the skip proves nothing. Set
      // the blocking bits too and the two paths diverge- skipped yields the lower tile's `true`,
      // evaluated yields `false`.
      const map = Object.create(globalThis.Game_Map.prototype);
      map.tilesetFlags = () => [ 0x10 | 0x0f, 0x00 ];
      map.allTiles = () => [ 0, 1 ];

      // Act & Assert
      expect(map.checkPassage(0, 0, 0x0f)).toBe(true);
    });

    it('returns true when the requested bit is clear on the tile\'s flag (passable)', () =>
    {
      const map = buildMapWithFlag(0x00);

      expect(map.checkPassage(0, 0, 0x0f)).toBe(true);
    });

    it('returns false when the requested bit is fully set on the tile\'s flag (impassable)', () =>
    {
      // Arrange- an openly passable tile sits behind the impassable one and must never be reached.
      // Without it, an impassable tile that merely fell out of the loop would also answer false,
      // and the test could not tell "decided here" from "decided by the default at the bottom".
      const map = Object.create(globalThis.Game_Map.prototype);
      map.tilesetFlags = () => [ 0x0f, 0x00 ];
      map.allTiles = () => [ 0, 1 ];

      // Act & Assert
      expect(map.checkPassage(0, 0, 0x0f)).toBe(false);
    });

    it('refuses passage for a tile that blocks only some of the requested directions', () =>
    {
      // Arrange- a flag overlapping the requested bits partially matches neither the fully-open nor
      // the fully-closed case, so it falls out of the loop entirely. Defaulting that to impassable
      // is the safe answer: letting it through would walk the player into geometry.
      const map = buildMapWithFlag(0x01);

      // Act & Assert
      expect(map.checkPassage(0, 0, 0x0f)).toBe(false);
    });

    it('defers a partially-blocking tile to the next tile rather than deciding on it', () =>
    {
      // Arrange- the upper tile blocks only one of the requested directions, which is neither the
      // fully-open nor the fully-closed case, so the loop must move on to the lower tile. That the
      // lower tile is openly passable is what makes the deferral observable: deciding "impassable"
      // on the partial match would answer false and never look at it.
      const map = Object.create(globalThis.Game_Map.prototype);
      map.tilesetFlags = () => [ 0x01, 0x00 ];
      map.allTiles = () => [ 0, 1 ];

      // Act & Assert
      expect(map.checkPassage(0, 0, 0x0f)).toBe(true);
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
