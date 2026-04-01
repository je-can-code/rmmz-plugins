//region plugins/regions/core/metadata.test.js
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { DEFAULT_REGION_EFFECTS_PLUGIN_PARAMS } from '../fixtures/regions-plugin-params.js';
import { loadRegionEffectsPluginVm } from '../regions-vm.js';

describe('J-RegionEffects metadata (out/regions/J-RegionEffects.js)', () =>
{
  let sandbox;

  beforeAll(() =>
  {
    sandbox = { console };
    loadRegionEffectsPluginVm(sandbox);
  });

  afterAll(() =>
  {
    sandbox = null;
  });

  it('initializes metadata and regex objects', () =>
  {
    expect(sandbox.J.REGIONS.Metadata.Name).toBe('J-RegionEffects');
    expect(sandbox.J.REGIONS.Metadata.Version).toBe('1.0.2');
    expect(typeof sandbox.J.REGIONS.RegExp.AllowRegions.test).toBe('function');
    expect(typeof sandbox.J.REGIONS.RegExp.DenyRegions.test).toBe('function');
  });

  it('parses global allow/deny region params from defaults', () =>
  {
    expect(sandbox.J.REGIONS.Metadata.GlobalAllowRegions).toEqual([]);
    expect(sandbox.J.REGIONS.Metadata.GlobalDenyRegions).toEqual([]);
  });
});

describe('J-RegionEffects metadata with custom global region params', () =>
{
  let sandbox;

  beforeAll(() =>
  {
    sandbox = { console };
    loadRegionEffectsPluginVm(sandbox, {
      regionEffectsParams: {
        ...DEFAULT_REGION_EFFECTS_PLUGIN_PARAMS,
        globalAllowRegions: '[1, 2]',
        globalDenyRegions: '[3]',
      },
    });
  });

  afterAll(() =>
  {
    sandbox = null;
  });

  it('translates global allow/deny region ids', () =>
  {
    expect(sandbox.J.REGIONS.Metadata.GlobalAllowRegions).toEqual([ 1, 2 ]);
    expect(sandbox.J.REGIONS.Metadata.GlobalDenyRegions).toEqual([ 3 ]);
  });
});
//endregion plugins/regions/core/metadata.test.js
