//region plugins/sks/_component/metadata.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { installSksHostGlobals, setPluginContextToJBase, setPluginContextToJSks } from './fixtures/install-sks-host-globals.js';

describe('J-SkillSlots metadata and regex (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installSksHostGlobals();

    setPluginContextToJBase();
    await import('../../../../src/plugins/_base/_metadata/initialization.js');

    setPluginContextToJSks();
    await import('../../../../src/plugins/sks/core/_metadata/initialization.js');
  });

  it('exposes J.SKS namespace and versioned metadata', () =>
  {
    // Arrange & Act & Assert
    expect(globalThis.J.SKS.Metadata.name).toBe('J-SkillSlots');
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
});
//endregion plugins/sks/_component/metadata.test.js
