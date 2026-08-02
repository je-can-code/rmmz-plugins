//region plugins/abs/core/_metadata/initialization.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import {
  installAbsHostGlobals,
  setPluginContextToJAbs,
  setPluginContextToJBase,
} from '../../_component/fixtures/install-abs-host-globals.js';

describe('J-ABS initialization.js (direct src import)', () =>
{
  // J-Base's own initialization.js patches real global prototypes (e.g. Array.empty) with
  // non-configurable properties, so it can only ever be imported once per test file- re-running it
  // throws on the second Object.defineProperty call. Every scenario below therefore shares this one
  // J-Base import and only ever resets/re-imports J-ABS's own initialization.js.
  beforeAll(async () =>
  {
    vi.resetModules();

    installAbsHostGlobals();

    setPluginContextToJBase();
    await import('../../../../../src/plugins/_base/core/_metadata/initialization.js');

    ({ default: globalThis.JABS_Button } = await import(
      '../../../../../src/plugins/abs/ext/input/_models/JABS_Button.js'
    ));
  });

  describe('version check', () =>
  {
    it('throws when J-Base is below the required minimum version', async () =>
    {
      // Arrange- drop J-Base's already-established version below J-ABS's requiredBaseVersion
      // ('3.0.0'); only J-ABS's own initialization.js needs a fresh module-cache entry.
      const savedVersion = globalThis.J.BASE.Metadata.Version;
      globalThis.J.BASE.Metadata.Version = '2.9.9';
      vi.resetModules();
      setPluginContextToJAbs();

      // Act & Assert
      await expect(import('../../../../../src/plugins/abs/core/_metadata/initialization.js'))
        .rejects.toThrow(/Either missing J-Base or has a lower version/);

      // Cleanup- restore the satisfying version for every later scenario in this file.
      globalThis.J.BASE.Metadata.Version = savedVersion;
    });
  });

  describe('after a normal import', () =>
  {
    beforeAll(async () =>
    {
      vi.resetModules();
      setPluginContextToJAbs();
      await import('../../../../../src/plugins/abs/core/_metadata/initialization.js');
    });

    describe('TranslateOptionToSlot', () =>
    {
      it.each([
        [ 'Tool', 'Tool' ],
        [ 'UsableItem', 'UsableItem' ],
        [ 'Dodge', 'Dodge' ],
        [ 'Offhand', 'Offhand' ],
        [ 'L1A', 'CombatSkill1' ],
        [ 'L1B', 'CombatSkill2' ],
        [ 'L1X', 'CombatSkill3' ],
        [ 'L1Y', 'CombatSkill4' ],
      ])('translates plugin-command slot option %s to JABS_Button.%s', (slot, expected) =>
      {
        // Act & Assert
        expect(globalThis.J.ABS.Helpers.PluginManager.TranslateOptionToSlot(slot))
          .toBe(globalThis.JABS_Button[expected]);
      });

      it('returns undefined for a slot option with no known mapping', () =>
      {
        // Act & Assert
        expect(globalThis.J.ABS.Helpers.PluginManager.TranslateOptionToSlot('NotARealSlot')).toBeUndefined();
      });
    });

    describe('TranslateElementalIcons', () =>
    {
      it('returns an empty array for a falsy raw value', () =>
      {
        // Act & Assert
        expect(globalThis.J.ABS.Helpers.PluginManager.TranslateElementalIcons('')).toEqual([]);
      });

      it('returns an empty array when the parsed array is empty', () =>
      {
        // Act & Assert
        expect(globalThis.J.ABS.Helpers.PluginManager.TranslateElementalIcons('[]')).toEqual([]);
      });

      it('maps each nested JSON entry into an {element, icon} pair', () =>
      {
        // Arrange- RMMZ struct-array plugin params are a JSON array of JSON-string elements.
        const raw = JSON.stringify([
          JSON.stringify({ elementId: '2', iconIndex: '64' }),
          JSON.stringify({ elementId: '3', iconIndex: '65' }),
        ]);

        // Act
        const result = globalThis.J.ABS.Helpers.PluginManager.TranslateElementalIcons(raw);

        // Assert
        expect(result).toEqual([
          { element: 2, icon: 64 },
          { element: 3, icon: 65 },
        ]);
      });
    });

    describe('loadExternalConfig', () =>
    {
      it('throws when called before J.ABS.Metadata has been assigned', () =>
      {
        // Arrange- the normal import already assigned Metadata; blank it to simulate calling
        // this helper too early.
        const savedMetadata = globalThis.J.ABS.Metadata;
        globalThis.J.ABS.Metadata = undefined;

        // Act & Assert
        expect(() => globalThis.J.ABS.Helpers.loadExternalConfig())
          .toThrow('J.ABS.Metadata must be assigned before J.ABS.Helpers.loadExternalConfig().');

        // Cleanup
        globalThis.J.ABS.Metadata = savedMetadata;
      });
    });
  });
});
//endregion plugins/abs/core/_metadata/initialization.test.js
