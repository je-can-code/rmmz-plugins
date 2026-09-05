//region plugins/__ca-mods/_component/jabs-engine.test.js
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import PluginMetadata from '../../../../src/plugins/_base/core/models/PluginMetadata.js';

describe('CAMods JABS_Engine (direct src import, hand-rolled JABS stand-in)', () =>
{
  /** @type {{canGainReward: Function}} */
  let originals;

  beforeAll(async () =>
  {
    // JABS_Engine is a real ES class defined in the (separately-bundled) J-ABS plugin; by the time
    // the shipped __ca-mods bundle runs, it's already a bare global. Stand in the minimal method
    // surface __ca-mods aliases/extends, matching the shape used by
    // test/plugins/crit/fixtures/crit-companion-stubs.js for the same kind of cross-plugin dependency.
    originals = {
      canGainReward: vi.fn(() => 'original-can-gain-reward'),
    };

    function JABS_Engine() {}

    Object.assign(JABS_Engine.prototype, originals);

    globalThis.JABS_Engine = JABS_Engine;

    globalThis.PluginManager = { parameters: () => '[]' };
    globalThis.PluginMetadata = PluginMetadata;
    globalThis.__PLUGIN_NAME__ = 'Test-Plugin';
    globalThis.__PLUGIN_VERSION__ = '0.0.0-test';

    await import('../../../../src/plugins/_base/core/_metadata/initialization.js');
    await import('../../../../src/plugins/__ca-mods/core/_metadata/initialization.js');

    // the file under test- aliases and extends the stand-in methods above.
    await import('../../../../src/plugins/__ca-mods/core/managers/JABS_Engine.js');
  });

  afterAll(() =>
  {
    delete globalThis.JABS_Engine;
    delete globalThis.PluginManager;
    delete globalThis.PluginMetadata;
    delete globalThis.__PLUGIN_NAME__;
    delete globalThis.__PLUGIN_VERSION__;
    delete globalThis.J;
  });

  describe('canGainReward', () =>
  {
    it('returns false without calling the original when the defeated enemy is inanimate', () =>
    {
      const engine = new globalThis.JABS_Engine();
      const defeatedEnemy = { isInanimate: () => true };

      expect(engine.canGainReward(defeatedEnemy, {})).toBe(false);
      expect(originals.canGainReward).not.toHaveBeenCalled();
    });

    it('defers to the original logic for animate enemies', () =>
    {
      const engine = new globalThis.JABS_Engine();
      const defeatedEnemy = { isInanimate: () => false };
      const victoriousActor = {};

      expect(engine.canGainReward(defeatedEnemy, victoriousActor)).toBe('original-can-gain-reward');
      expect(originals.canGainReward).toHaveBeenCalledWith(defeatedEnemy, victoriousActor);
    });
  });
});
//endregion plugins/__ca-mods/_component/jabs-engine.test.js