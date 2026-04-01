//region plugins/regions/core/game-map-region-effects.test.js
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { DEFAULT_REGION_EFFECTS_PLUGIN_PARAMS } from '../fixtures/regions-plugin-params.js';
import { loadRegionEffectsPluginVm } from '../regions-vm.js';

describe('J-RegionEffects Game_Map passage (out/regions/J-RegionEffects.js)', () =>
{
  let sandbox;

  beforeAll(() =>
  {
    sandbox = { console };
    loadRegionEffectsPluginVm(sandbox, {
      regionEffectsParams: {
        ...DEFAULT_REGION_EFFECTS_PLUGIN_PARAMS,
        globalAllowRegions: '[10]',
        globalDenyRegions: '[20]',
      },
    });
  });

  afterAll(() =>
  {
    sandbox = null;
  });

  it('projectCoordinatesByDirection shifts one tile by direction', () =>
  {
    const map = new sandbox.Game_Map();
    map.initialize();

    expect(map.projectCoordinatesByDirection(3, 4, 2)).toEqual([ 3, 5 ]);
    expect(map.projectCoordinatesByDirection(3, 4, 4)).toEqual([ 2, 4 ]);
    expect(map.projectCoordinatesByDirection(3, 4, 6)).toEqual([ 4, 4 ]);
    expect(map.projectCoordinatesByDirection(3, 4, 8)).toEqual([ 3, 3 ]);
  });

  it('refreshAllowRegionEffects reads map note tags into allow list', () =>
  {
    sandbox.$dataMap = { note: '<allowRegions:[1, 2]>' };
    const map = new sandbox.Game_Map();
    map.initialize();
    map.setup(1);

    expect(map.getAllowEffectRegionIds()).toEqual([ 1, 2 ]);
    expect(map.getDenyEffectRegionIds()).toEqual([]);
  });

  it('refreshDenyRegionEffects reads map note tags into deny list', () =>
  {
    sandbox.$dataMap = { note: '<denyRegions:[3]>' };
    const map = new sandbox.Game_Map();
    map.initialize();
    map.setup(1);

    expect(map.getDenyEffectRegionIds()).toEqual([ 3 ]);
    expect(map.getAllowEffectRegionIds()).toEqual([]);
  });

  it('isPassable returns false when projected tile region is globally denied', () =>
  {
    const map = new sandbox.Game_Map();
    map.initialize();
    sandbox.$dataMap = { note: '' };
    map.setup(1);

    map.regionId = function(x, y)
    {
      if (x === 5 && y === 6)
      {
        return 20;
      }

      return 0;
    };

    const passable = map.isPassable(5, 5, 2);
    expect(passable).toBe(false);
  });

  it('isPassable returns true when projected tile region is globally allowed', () =>
  {
    const map = new sandbox.Game_Map();
    map.initialize();
    sandbox.$dataMap = { note: '' };
    map.setup(1);

    map.regionId = function(x, y)
    {
      if (x === 5 && y === 6)
      {
        return 10;
      }

      return 0;
    };

    const passable = map.isPassable(5, 5, 2);
    expect(passable).toBe(true);
  });

  it('isPassable defers to original when region does not match allow/deny rules', () =>
  {
    const map = new sandbox.Game_Map();
    map.initialize();
    sandbox.$dataMap = { note: '' };
    map.setup(1);

    map.regionId = function()
    {
      return 99;
    };

    const passable = map.isPassable(1, 1, 6);
    expect(passable).toBe(true);
  });
});
//endregion plugins/regions/core/game-map-region-effects.test.js
