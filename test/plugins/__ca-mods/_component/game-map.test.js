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
