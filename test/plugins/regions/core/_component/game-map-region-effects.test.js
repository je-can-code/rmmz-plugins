//region plugins/regions/core/_component/game-map-region-effects.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import {
  DEFAULT_REGION_EFFECTS_PLUGIN_PARAMS,
  installRegionsCoreHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJRegions,
} from '../../_component/fixtures/install-regions-host-globals.js';

describe('J-RegionEffects Game_Map passage (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installRegionsCoreHostGlobals(globalThis, {
      ...DEFAULT_REGION_EFFECTS_PLUGIN_PARAMS,
      globalAllowRegions: '[10]',
      globalDenyRegions: '[20]',
    });

    setPluginContextToJBase();
    await import('../../../../../src/plugins/_base/_metadata/initialization.js');

    ({ default: globalThis.RPGManager } = await import('../../../../../src/plugins/_base/managers/RPGManager.js'));

    setPluginContextToJRegions();
    await import('../../../../../src/plugins/regions/core/_metadata/initialization.js');

    // patches globalThis.Game_Map.prototype directly, no vm involved.
    await import('../../../../../src/plugins/regions/core/objects/Game_Map.js');
  });

  describe('projectCoordinatesByDirection', () =>
  {
    it('shifts one tile down for direction 2', () =>
    {
      // Arrange
      const map = new globalThis.Game_Map();
      map.initialize();

      // Act & Assert
      expect(map.projectCoordinatesByDirection(3, 4, 2)).toEqual([ 3, 5 ]);
    });

    it('shifts one tile left for direction 4', () =>
    {
      // Arrange
      const map = new globalThis.Game_Map();
      map.initialize();

      // Act & Assert
      expect(map.projectCoordinatesByDirection(3, 4, 4)).toEqual([ 2, 4 ]);
    });

    it('shifts one tile right for direction 6', () =>
    {
      // Arrange
      const map = new globalThis.Game_Map();
      map.initialize();

      // Act & Assert
      expect(map.projectCoordinatesByDirection(3, 4, 6)).toEqual([ 4, 4 ]);
    });

    it('shifts one tile up for direction 8', () =>
    {
      // Arrange
      const map = new globalThis.Game_Map();
      map.initialize();

      // Act & Assert
      expect(map.projectCoordinatesByDirection(3, 4, 8)).toEqual([ 3, 3 ]);
    });
  });

  describe('refreshAllowRegionEffects / refreshDenyRegionEffects', () =>
  {
    it('reads the allowRegions map note tag into the allow list', () =>
    {
      // Arrange
      globalThis.$dataMap = { note: '<allowRegions:[1, 2]>' };
      const map = new globalThis.Game_Map();
      map.initialize();

      // Act
      map.setup(1);

      // Assert
      expect(map.getAllowEffectRegionIds()).toEqual([ 1, 2 ]);
    });

    it('leaves the deny list empty when only an allowRegions tag is present', () =>
    {
      // Arrange
      globalThis.$dataMap = { note: '<allowRegions:[1, 2]>' };
      const map = new globalThis.Game_Map();
      map.initialize();

      // Act
      map.setup(1);

      // Assert
      expect(map.getDenyEffectRegionIds()).toEqual([]);
    });

    it('reads the denyRegions map note tag into the deny list', () =>
    {
      // Arrange
      globalThis.$dataMap = { note: '<denyRegions:[3]>' };
      const map = new globalThis.Game_Map();
      map.initialize();

      // Act
      map.setup(1);

      // Assert
      expect(map.getDenyEffectRegionIds()).toEqual([ 3 ]);
    });

    it('leaves the allow list empty when only a denyRegions tag is present', () =>
    {
      // Arrange
      globalThis.$dataMap = { note: '<denyRegions:[3]>' };
      const map = new globalThis.Game_Map();
      map.initialize();

      // Act
      map.setup(1);

      // Assert
      expect(map.getAllowEffectRegionIds()).toEqual([]);
    });
  });

  describe('isPassable', () =>
  {
    it('returns false when the projected tile region is globally denied', () =>
    {
      // Arrange
      const map = new globalThis.Game_Map();
      map.initialize();
      globalThis.$dataMap = { note: '' };
      map.setup(1);
      map.regionId = function(x, y)
      {
        return x === 5 && y === 6 ? 20 : 0;
      };

      // Act
      const passable = map.isPassable(5, 5, 2);

      // Assert
      expect(passable).toBe(false);
    });

    it('returns true when the projected tile region is globally allowed', () =>
    {
      // Arrange
      const map = new globalThis.Game_Map();
      map.initialize();
      globalThis.$dataMap = { note: '' };
      map.setup(1);
      map.regionId = function(x, y)
      {
        return x === 5 && y === 6 ? 10 : 0;
      };

      // Act
      const passable = map.isPassable(5, 5, 2);

      // Assert
      expect(passable).toBe(true);
    });

    it('defers to the original passage check when the region matches no allow/deny rule', () =>
    {
      // Arrange
      const map = new globalThis.Game_Map();
      map.initialize();
      globalThis.$dataMap = { note: '' };
      map.setup(1);
      map.regionId = function()
      {
        return 99;
      };

      // Act
      const passable = map.isPassable(1, 1, 6);

      // Assert
      expect(passable).toBe(true);
    });
  });
});
//endregion plugins/regions/core/_component/game-map-region-effects.test.js
