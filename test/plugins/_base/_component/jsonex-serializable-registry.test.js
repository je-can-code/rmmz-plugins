//region plugins/_base/_component/jsonex-serializable-registry.test.js
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import { installRealRmmzEngine } from '../../../setup/rmmz-engine-loader.js';

/**
 * Exercises the SerializableRegistry-first constructor-resolution path in JsonEx._decode
 * (src/plugins/_base/core/JsonEx.js line 99) against the real, vendored JsonEx from
 * project/js/rmmz_core.js, using JABS_HitstopData as the pilot registered model- same approach as
 * jsonex-map-set-direct.test.js, applied to the registry-resolution behavior instead of Map/Set.
 */
describe('JsonEx SerializableRegistry pilot (JABS_HitstopData)', () =>
{
  let JABS_HitstopData;

  beforeAll(async () =>
  {
    vi.resetModules();

    // the real engine, not a guess- installs the actual JsonEx onto globalThis.
    installRealRmmzEngine();

    // J-Base's own requirements the vendored engine files don't provide.
    globalThis.PluginManager = { parameters: () => ({ actorBaseTp: '0', enemyBaseTp: '100' }) };
    globalThis.ColorManager = { textColor: () => 0, itemBackColor1: () => 0, itemBackColor2: () => 0 };
    globalThis.PanelRarity = { fromRarityToColor: () => 0 };
    globalThis.DataManager = {
      isDatabaseLoaded: () => true,
      setupNewGame: () => {},
      extractSaveContents: () => {},
      setupBattleTest: () => {},
    };
    globalThis.ImageManager = {};
    globalThis.SoundManager = {};
    globalThis.StorageManager = {};
    globalThis.TextManager = {};
    globalThis.IconManager = {};
    globalThis.__PLUGIN_NAME__ = 'J-Base';
    globalThis.__PLUGIN_VERSION__ = '0.0.0-test';

    // real production code- sets up globalThis.J, J.BASE.Aliased maps (including Aliased.JsonEx), and
    // the String.empty/Array.empty sentinel augmentations relied on elsewhere in this codebase.
    await import('../../../../src/plugins/_base/_metadata/initialization.js');

    // the file under test- patches the real, engine-provided JsonEx._encode/_decode.
    await import('../../../../src/plugins/_base/core/JsonEx.js');

    // JABS_HitstopData.js references SerializableRegistry as a bare identifier (no import statement)-
    // the shipped bundle concatenates every _base/abs file into one top-level script scope, so this
    // works there without an import; direct-import tests must set up that same bare global themselves.
    const { default: SerializableRegistry } = await import('../../../../src/plugins/_base/core/SerializableRegistry.js');
    globalThis.SerializableRegistry = SerializableRegistry;

    // the model under test- registers itself with SerializableRegistry as an import-time side effect.
    ({ default: JABS_HitstopData } = await import('../../../../src/plugins/abs/ext/hitstop/_models/JABS_HitstopData.js'));
  });

  afterAll(() =>
  {
    vi.unstubAllGlobals();
  });

  it('resolves the constructor via SerializableRegistry, not the window[className] fallback', () =>
  {
    // Arrange- ESM import alone never adds JABS_HitstopData as a bare global, so the
    // `window[constructorName]` half of the `||` fallback in JsonEx._decode has nothing to resolve;
    // only the SerializableRegistry.resolve() half can succeed here.
    expect(globalThis.JABS_HitstopData).toBeUndefined();
    const data = new JABS_HitstopData();
    data.setFrames(10);

    // Act
    const copy = globalThis.JsonEx.makeDeepCopy(data);

    // Assert
    expect(copy).toBeInstanceOf(JABS_HitstopData);
    expect(typeof copy.tick).toBe('function');
    expect(copy.getFrames()).toBe(10);
  });
});
//endregion plugins/_base/_component/jsonex-serializable-registry.test.js
