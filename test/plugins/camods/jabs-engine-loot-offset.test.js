//region plugins/camods/jabs-engine-loot-offset.test.js
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { loadCamodsPluginVm } from './camods-vm.js';

describe('J-CA-Mods loot drop offset (out/ca-mods/J-CA-Mods.js)', () =>
{
  let sandbox;

  beforeAll(() =>
  {
    sandbox = { console };
    loadCamodsPluginVm(sandbox);
  });

  afterAll(() =>
  {
    sandbox = null;
  });

  it('addLootDropToMap offsets targetY by +1', () =>
  {
    const engine = new sandbox.JABS_Engine();
    const result = engine.addLootDropToMap(3, 4, { id: 1 });
    expect(result.targetX).toBe(3);
    expect(result.targetY).toBe(5);
  });
});
//endregion plugins/camods/jabs-engine-loot-offset.test.js
