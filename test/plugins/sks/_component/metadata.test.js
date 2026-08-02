//region plugins/sks/_component/metadata.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { DEFAULT_SKS_PLUGIN_PARAMS, installSksHostGlobals, setPluginContextToJBase, setPluginContextToJSks } from './fixtures/install-sks-host-globals.js';
import { installPluginManagerWithParams } from '../../../setup/install-plugin-manager-with-params.js';

/**
 * Rebuilds J.SKS.Metadata from scratch against the given raw plugin parameter strings, without
 * repeating the full host-globals install. PluginMetadata tracks registered plugin names on a
 * class-private static field, so re-running JSkillSlots_PluginMetadata's constructor against the
 * same class object throws "duplicate plugin entry" on a second call- re-importing PluginMetadata
 * fresh (after resetModules) gives every call its own never-registered class.
 * @param {Record<string, string>} pluginParameterStrings
 * @returns {object} The freshly-built J.SKS.Metadata instance.
 */
async function buildSksMetadata(pluginParameterStrings)
{
  vi.resetModules();

  ({ default: globalThis.PluginMetadata } = await import('../../../../src/plugins/_base/core/models/PluginMetadata.js'));

  installPluginManagerWithParams(globalThis, 'J-SkillSlots', pluginParameterStrings);
  setPluginContextToJSks();
  await import('../../../../src/plugins/sks/core/_metadata/initialization.js');
  return globalThis.J.SKS.Metadata;
}

describe('J-SkillSlots metadata and regex (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installSksHostGlobals();

    setPluginContextToJBase();
    await import('../../../../src/plugins/_base/core/_metadata/initialization.js');

    setPluginContextToJSks();
    await import('../../../../src/plugins/sks/core/_metadata/initialization.js');
  });

  it('slotCost regex parses signed integers from skill notes', () =>
  {
    // Arrange & Act
    const m = globalThis.J.SKS.RegExp.SlotCost.exec('<slotCost:2>');

    // Assert
    expect(m[1]).toBe('2');
  });

  it('defaults equippable type list to empty so all skill types remain eligible', () =>
  {
    // Arrange & Act & Assert
    expect(globalThis.J.SKS.Metadata.equippableSkillTypeIds.length).toBe(0);
  });

  it('defaults enableExclusiveMode to false when the param is absent/default', () =>
  {
    // Arrange & Act & Assert
    expect(globalThis.J.SKS.Metadata.enableExclusiveMode).toBe(false);
  });

  it('defaults slotsOnly to false when the param is absent/default', () =>
  {
    // Arrange & Act & Assert
    expect(globalThis.J.SKS.Metadata.slotsOnly).toBe(false);
  });
});

describe('J-SkillSlots metadata exclusive mode params enabled (direct src import)', () =>
{
  it('parses enableExclusiveMode as true from the \'true\' string param', async () =>
  {
    // Act
    const metadata = await buildSksMetadata({ ...DEFAULT_SKS_PLUGIN_PARAMS, 'enable-exclusive-mode': 'true' });

    // Assert
    expect(metadata.enableExclusiveMode).toBe(true);
  });

  it('parses slotsOnly as true from the \'true\' string param', async () =>
  {
    // Act
    const metadata = await buildSksMetadata({ ...DEFAULT_SKS_PLUGIN_PARAMS, 'slots-only': 'true' });

    // Assert
    expect(metadata.slotsOnly).toBe(true);
  });
});
//endregion plugins/sks/_component/metadata.test.js
