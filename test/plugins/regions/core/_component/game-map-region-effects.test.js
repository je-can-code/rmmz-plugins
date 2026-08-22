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
    await import('../../../../../src/plugins/_base/core/_metadata/initialization.js');

    ({ default: globalThis.RPGManager } = await import('../../../../../src/plugins/_base/core/managers/RPGManager.js'));

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

    it('overrules an impassable tile when the region allows passage', () =>
    {
      // Arrange: overruling the tileset is the entire job of an allow region, so the original has to
      // be saying no underneath it. Against an original that already says yes, taking the allow
      // branch and falling through to the original produce the same answer and neither is pinned.
      const map = new globalThis.Game_Map();
      map.initialize();
      globalThis.$dataMap = { note: '' };
      map.setup(1);
      map.regionId = function(x, y)
      {
        return x === 5 && y === 6 ? 10 : 0;
      };
      const originalIsPassable = globalThis.J.REGIONS.Aliased.Game_Map.get('isPassable');
      globalThis.J.REGIONS.Aliased.Game_Map.set('isPassable', () => false);

      // Act
      let passable;
      try
      {
        passable = map.isPassable(5, 5, 2);
      }
      finally
      {
        // a failed assertion must not leave the stand-in behind for every later test in this file.
        globalThis.J.REGIONS.Aliased.Game_Map.set('isPassable', originalIsPassable);
      }

      // Assert
      expect(passable).toBe(true);
    });

    it('leaves an untagged region impassable when the original says so', () =>
    {
      // Arrange: the other half of the same pairing - an untagged region must not inherit the allow
      // list's yes, and only an original answering no can show the difference.
      const map = new globalThis.Game_Map();
      map.initialize();
      globalThis.$dataMap = { note: '' };
      map.setup(1);
      map.regionId = function()
      {
        return 99;
      };
      const originalIsPassable = globalThis.J.REGIONS.Aliased.Game_Map.get('isPassable');
      globalThis.J.REGIONS.Aliased.Game_Map.set('isPassable', () => false);

      // Act
      let passable;
      try
      {
        passable = map.isPassable(1, 1, 6);
      }
      finally
      {
        globalThis.J.REGIONS.Aliased.Game_Map.set('isPassable', originalIsPassable);
      }

      // Assert
      expect(passable).toBe(false);
    });
  });

  //region the region id tables
  describe('addAllowEffectRegionId', () =>
  {
    it('tracks a region id it has not seen before', () =>
    {
      // Arrange
      const map = new globalThis.Game_Map();
      map.initialize();

      // Act
      map.addAllowEffectRegionId(31);

      // Assert
      expect(map.getAllowEffectRegionIds()).toContain(31);
    });

    it('does not track the same region id twice', () =>
    {
      // Arrange: the same id arrives twice whenever a map carries both a global and a local tag for
      // it, and a duplicated entry means the region is scanned twice for every passage check.
      const map = new globalThis.Game_Map();
      map.initialize();
      map.addAllowEffectRegionId(31);

      // Act
      map.addAllowEffectRegionId(31);

      // Assert
      expect(map.getAllowEffectRegionIds().filter(id => id === 31).length).toBe(1);
    });
  });

  describe('addDenyEffectRegionId', () =>
  {
    it('tracks a region id it has not seen before', () =>
    {
      // Arrange
      const map = new globalThis.Game_Map();
      map.initialize();

      // Act
      map.addDenyEffectRegionId(41);

      // Assert
      expect(map.getDenyEffectRegionIds()).toContain(41);
    });

    it('does not track the same region id twice', () =>
    {
      // Arrange
      const map = new globalThis.Game_Map();
      map.initialize();
      map.addDenyEffectRegionId(41);

      // Act
      map.addDenyEffectRegionId(41);

      // Assert
      expect(map.getDenyEffectRegionIds().filter(id => id === 41).length).toBe(1);
    });
  });
  //endregion the region id tables

  //region refreshing from the map notes
  describe('canRefreshRegionEffects', () =>
  {
    it('can refresh once the map data has landed', () =>
    {
      // Arrange
      const map = new globalThis.Game_Map();
      map.initialize();
      globalThis.$dataMap = { note: '' };

      // Act & Assert
      expect(map.canRefreshRegionEffects()).toBe(true);
    });

    it('cannot refresh before the map data has landed', () =>
    {
      // Arrange: `setup` runs ahead of the map data during a transfer, and reading a note off
      // nothing would take the whole transfer down.
      const map = new globalThis.Game_Map();
      map.initialize();
      globalThis.$dataMap = null;

      // Act & Assert
      expect(map.canRefreshRegionEffects()).toBe(false);
    });
  });

  describe('refreshAllowRegionEffects', () =>
  {
    it('adds every region the map tagged as allowed', () =>
    {
      // Arrange
      const map = new globalThis.Game_Map();
      map.initialize();
      globalThis.$dataMap = { note: '<allowRegions:[7,8]>' };
      map.clearAllowEffectRegionIds();

      // Act
      map.refreshAllowRegionEffects();

      // Assert
      expect(map.getAllowEffectRegionIds()).toEqual(expect.arrayContaining([ 7, 8 ]));
    });

    it('leaves the table alone on a map carrying no allow tag', () =>
    {
      // Arrange
      const map = new globalThis.Game_Map();
      map.initialize();
      globalThis.$dataMap = { note: '<someOtherTag>' };
      map.clearAllowEffectRegionIds();

      // Act
      map.refreshAllowRegionEffects();

      // Assert
      expect(map.getAllowEffectRegionIds()).toEqual([]);
    });
  });

  describe('refreshDenyRegionEffects', () =>
  {
    it('adds every region the map tagged as denied', () =>
    {
      // Arrange
      const map = new globalThis.Game_Map();
      map.initialize();
      globalThis.$dataMap = { note: '<denyRegions:[17,18]>' };
      map.clearDenyEffectRegionIds();

      // Act
      map.refreshDenyRegionEffects();

      // Assert
      expect(map.getDenyEffectRegionIds()).toEqual(expect.arrayContaining([ 17, 18 ]));
    });

    it('leaves the table alone on a map carrying no deny tag', () =>
    {
      // Arrange
      const map = new globalThis.Game_Map();
      map.initialize();
      globalThis.$dataMap = { note: '<someOtherTag>' };
      map.clearDenyEffectRegionIds();

      // Act
      map.refreshDenyRegionEffects();

      // Assert
      expect(map.getDenyEffectRegionIds()).toEqual([]);
    });
  });

  describe('refreshRegionEffects', () =>
  {
    it('does nothing at all before the map data has landed', () =>
    {
      // Arrange
      const map = new globalThis.Game_Map();
      map.initialize();
      globalThis.$dataMap = null;
      const refreshAllow = vi.spyOn(map, 'refreshAllowRegionEffects');

      // Act
      map.refreshRegionEffects();

      // Assert
      expect(refreshAllow).not.toHaveBeenCalled();

      refreshAllow.mockRestore();
    });

    it('rebuilds the pixel collision table when J-Pixelistics is installed', () =>
    {
      // Arrange: passage is what region effects change, and Pixelistics caches passage into a
      // collision table - so a region refresh that skipped this would leave the player walking
      // through walls the map no longer has.
      const map = new globalThis.Game_Map();
      map.initialize();
      globalThis.$dataMap = { note: '' };
      const setupCollision = vi.fn();
      globalThis.PIXEL_CollisionManager = { setupCollision };

      // Act
      map.refreshRegionEffects();

      // Assert
      expect(setupCollision).toHaveBeenCalled();

      delete globalThis.PIXEL_CollisionManager;
    });

    it('refreshes without a collision table when J-Pixelistics is not installed', () =>
    {
      // Arrange
      const map = new globalThis.Game_Map();
      map.initialize();
      globalThis.$dataMap = { note: '<allowRegions:[7]>' };

      // Act
      map.refreshRegionEffects();

      // Assert
      expect(map.getAllowEffectRegionIds()).toContain(7);
    });
  });
  //endregion refreshing from the map notes
});
//endregion plugins/regions/core/_component/game-map-region-effects.test.js
