//region plugins/camods/metadata.test.js
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { loadCamodsPluginVm } from './camods-vm.js';

describe('J-CA-Mods metadata (out/ca-mods/J-CA-Mods.js)', () =>
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

  it('initializes tracking constants', () =>
  {
    expect(sandbox.J.CAMods.Metadata.name).toBe('J-CA-Mods');
    expect(sandbox.J.CAMods.Metadata.version.major).toBe(1);
    expect(sandbox.J.CAMods.Metadata.version.minor).toBe(0);
    expect(sandbox.J.CAMods.Metadata.version.patch).toBe(0);
    expect(sandbox.J.CAMods.Tracking.EnemiesDefeated).toBe(101);
    expect(sandbox.J.CAMods.Tracking.NumberOfDeaths).toBe(117);
  });
});
//endregion plugins/camods/metadata.test.js
