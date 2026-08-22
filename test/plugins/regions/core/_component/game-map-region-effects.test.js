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
      globalDenyTerrainTags: '[1]',
    });

    setPluginContextToJBase();
    await import('../../../../../src/plugins/_base/core/_metadata/initialization.js');

    ({ default: globalThis.RPGManager } = await import('../../../../../src/plugins/_base/core/managers/RPGManager.js'));

    setPluginContextToJRegions();
    await import('../../../../../src/plugins/regions/core/_metadata/initialization.js');

    // patches globalThis.Game_Map.prototype directly, no vm involved.
    await import('../../../../../src/plugins/regions/core/objects/Game_Map.js');
  });

  /**
   * Builds a bare Game_Map stubbed with a single tile at (0, 0) carrying the given flag.
   * @param {number} flag The tileset flag for that tile.
   * @returns {Game_Map}
   */
  function buildMapWithFlag(flag)
  {
    const map = Object.create(globalThis.Game_Map.prototype);
    map.tilesetFlags = () => [ flag ];
    map.allTiles = () => [ 0 ];

    return map;
  }

  describe('checkPassage', () =>
  {
    it('refuses passage over a tile whose terrain tag is globally denied', () =>
    {
      // Arrange- (1 << 12) sets the flag's terrain-id nibble to 1, which this suite configures as a
      // denied tag. Every direction bit is left clear, so the tile would otherwise be openly
      // passable and only the tag can be what refuses it.
      const map = buildMapWithFlag(1 << 12);

      // Act & Assert
      expect(map.checkPassage(0, 0, 0x0f)).toBe(false);
    });

    it('allows passage over a tile whose terrain tag is not denied', () =>
    {
      // Arrange- terrain tag 2 is the near-miss: tagged, but not one of the denied ones. Without it,
      // "refuses denied tags" and "refuses every tagged tile" are the same program.
      const map = buildMapWithFlag(2 << 12);

      // Act & Assert
      expect(map.checkPassage(0, 0, 0x0f)).toBe(true);
    });

    it('treats the 0x10 "no effect on passage" bit as a transparent pass-through to the next tile', () =>
    {
      // Arrange- the upper tile carries 0x10 AND every requested passage bit. The extra bits are
      // what make this load-bearing: a tile of bare 0x10 reads as openly passable anyway, so
      // skipping it and evaluating it produce the same answer and the skip proves nothing.
      const map = Object.create(globalThis.Game_Map.prototype);
      map.tilesetFlags = () => [ 0x10 | 0x0f, 0x00 ];
      map.allTiles = () => [ 0, 1 ];

      // Act & Assert
      expect(map.checkPassage(0, 0, 0x0f)).toBe(true);
    });

    it('returns true when the requested bit is clear on the tile\'s flag (passable)', () =>
    {
      // Arrange & Act & Assert
      expect(buildMapWithFlag(0x00).checkPassage(0, 0, 0x0f)).toBe(true);
    });

    it('returns false when the requested bit is fully set on the tile\'s flag (impassable)', () =>
    {
      // Arrange- an openly passable tile sits behind the impassable one and must never be reached.
      // Without it, an impassable tile that merely fell out of the loop would also answer false, and
      // the test could not tell "decided here" from "decided by the default at the bottom".
      const map = Object.create(globalThis.Game_Map.prototype);
      map.tilesetFlags = () => [ 0x0f, 0x00 ];
      map.allTiles = () => [ 0, 1 ];

      // Act & Assert
      expect(map.checkPassage(0, 0, 0x0f)).toBe(false);
    });

    it('refuses passage for a tile that blocks only some of the requested directions', () =>
    {
      // Arrange- a flag overlapping the requested bits matches neither the fully-open nor the
      // fully-closed case, so it falls out of the loop entirely. Defaulting that to impassable is
      // the safe answer: letting it through would walk the player into geometry.
      const map = buildMapWithFlag(0x01);

      // Act & Assert
      expect(map.checkPassage(0, 0, 0x0f)).toBe(false);
    });

    it('defers a partially-blocking tile to the next tile rather than deciding on it', () =>
    {
      // Arrange- the upper tile blocks only one requested direction, so the loop must move on. That
      // the lower tile is openly passable is what makes the deferral observable: deciding
      // "impassable" on the partial match would answer false and never look at it.
      const map = Object.create(globalThis.Game_Map.prototype);
      map.tilesetFlags = () => [ 0x01, 0x00 ];
      map.allTiles = () => [ 0, 1 ];

      // Act & Assert
      expect(map.checkPassage(0, 0, 0x0f)).toBe(true);
    });
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
