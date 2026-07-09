//region plugins/_base/jsonex-map-set-direct.test.js
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import { installRealRmmzEngine } from '../../setup/rmmz-engine-loader.js';

/**
 * Exercises the JsonEx._encode/_decode Map/Set extension (src/plugins/_base/core/JsonEx.js) against
 * the real, vendored JsonEx from project/js/rmmz_core.js- not a hand-rolled placeholder- so the
 * round-trip assertions below reflect the actual production save/load algorithm the extension patches.
 */
describe('J-Base JsonEx Map/Set encode/decode extension (real engine direct import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    // the real engine, not a guess- installs the actual JsonEx (and Game_* classes, unused here) onto globalThis.
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
    await import('../../../src/plugins/_base/_metadata/initialization.js');

    // the file under test- patches the real, engine-provided JsonEx._encode/_decode.
    await import('../../../src/plugins/_base/core/JsonEx.js');
  });

  afterAll(() =>
  {
    vi.unstubAllGlobals();
  });

  it('round-trips a Map with primitive keys and values, preserving key types', () =>
  {
    const original = new Map([ [ 1, 'a' ], [ 'k', 2 ], [ 3, 'c' ] ]);

    const copy = globalThis.JsonEx.makeDeepCopy(original);

    expect(copy).toBeInstanceOf(Map);
    expect(copy).toEqual(original);
    // the whole point- numeric keys survive as real numbers, not stringified.
    expect(copy.get(1)).toBe('a');
    expect(copy.has('1')).toBe(false);
  });

  it('round-trips a Set, preserving element types', () =>
  {
    const original = new Set([ 1, 'two', 3 ]);

    const copy = globalThis.JsonEx.makeDeepCopy(original);

    expect(copy).toBeInstanceOf(Set);
    expect(copy).toEqual(original);
    expect(copy.has(1)).toBe(true);
    expect(copy.has('1')).toBe(false);
  });

  it('round-trips a Map nested inside another Map', () =>
  {
    const inner = new Map([ [ 'x', 1 ] ]);
    const outer = new Map([ [ 'inner', inner ] ]);

    const copy = globalThis.JsonEx.makeDeepCopy(outer);

    expect(copy).toBeInstanceOf(Map);
    expect(copy.get('inner')).toBeInstanceOf(Map);
    expect(copy.get('inner').get('x')).toBe(1);
  });

  it('round-trips a Map whose values are plain objects', () =>
  {
    const original = new Map([ [ 1, { name: 'foo', amount: 5 } ] ]);

    const copy = globalThis.JsonEx.makeDeepCopy(original);

    expect(copy.get(1)).toEqual({ name: 'foo', amount: 5 });
  });

  it('round-trips a Map nested inside a plain object', () =>
  {
    const original = { label: 'bag', contents: new Map([ [ 7, 'seven' ] ]) };

    const copy = globalThis.JsonEx.makeDeepCopy(original);

    expect(copy.contents).toBeInstanceOf(Map);
    expect(copy.contents.get(7)).toBe('seven');
  });

  it('still restores an ordinary class instance via the existing @-tag + SerializableRegistry path', async () =>
  {
    const { default: SerializableRegistry } = await import('../../../src/plugins/_base/core/SerializableRegistry.js');

    class Widget
    {
      value = 0;

      setValue(value)
      {
        this.value = value;
      }
    }

    SerializableRegistry.register(Widget);

    const widget = new Widget();
    widget.setValue(42);

    const copy = globalThis.JsonEx.makeDeepCopy(widget);

    expect(copy).toBeInstanceOf(Widget);
    expect(copy.value).toBe(42);
  });

  it('round-trips a Map field owned by a registered class instance, unmodified, no plugin code involved', async () =>
  {
    // this is the real-world shape this whole fix targets: a class (like Game_Actor in the sks plugin)
    // that stores a Map directly as an instance field, with no reinit/rebuild-on-load logic of its own-
    // it just trusts the save system to round-trip the Map correctly, same as any other own-property.
    const { default: SerializableRegistry } = await import('../../../src/plugins/_base/core/SerializableRegistry.js');

    class SlotHolder
    {
      slotMap = new Map();
    }

    SerializableRegistry.register(SlotHolder);

    const holder = new SlotHolder();
    holder.slotMap.set(0, 101);
    holder.slotMap.set(1, 205);

    const copy = globalThis.JsonEx.makeDeepCopy(holder);

    expect(copy).toBeInstanceOf(SlotHolder);
    expect(copy.slotMap).toBeInstanceOf(Map);
    expect(copy.slotMap.get(0)).toBe(101);
    expect(copy.slotMap.get(1)).toBe(205);
  });

  it('throws when Map/Set nesting exceeds the same maxDepth the original algorithm enforces', () =>
  {
    let deepest = new Map([ [ 'leaf', 1 ] ]);
    for (let i = 0; i < globalThis.JsonEx.maxDepth; i++)
    {
      deepest = new Map([ [ 'nested', deepest ] ]);
    }

    expect(() => globalThis.JsonEx.makeDeepCopy(deepest)).toThrow('Object too deep');
  });
});
//endregion plugins/_base/jsonex-map-set-direct.test.js
