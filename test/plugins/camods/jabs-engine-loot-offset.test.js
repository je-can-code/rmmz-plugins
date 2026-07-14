//region plugins/camods/jabs-engine-loot-offset.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { installCamodsHostGlobals, setPluginContextToJBase, setPluginContextToJCamods } from './fixtures/install-camods-host-globals.js';

describe('J-CA-Mods loot drop offset (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installCamodsHostGlobals();

    setPluginContextToJBase();
    await import('../../../src/plugins/_base/_metadata/initialization.js');

    setPluginContextToJCamods();
    await import('../../../src/plugins/__ca-mods/core/_metadata/initialization.js');

    // patches globalThis.JABS_Engine.prototype directly, no vm involved.
    await import('../../../src/plugins/__ca-mods/core/managers/JABS_Engine.js');
  });

  it('addLootDropToMap offsets targetY by +1', () =>
  {
    // Arrange
    const engine = new globalThis.JABS_Engine();

    // Act
    const result = engine.addLootDropToMap(3, 4, { id: 1 });

    // Assert
    expect(result.targetX).toBe(3);
    expect(result.targetY).toBe(5);
  });
});
//endregion plugins/camods/jabs-engine-loot-offset.test.js
