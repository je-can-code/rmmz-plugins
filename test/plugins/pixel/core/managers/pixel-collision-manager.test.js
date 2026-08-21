//region plugins/pixel/core/managers/pixel-collision-manager.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  buildDefaultPixelGameMap,
  installPixelCoreHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJPixel,
} from '../../_component/fixtures/install-pixel-host-globals.js';

/**
 * Unit coverage for the collision manager's table-authoring layer: the single-subcell merge
 * rules, the uniform-tile shortcut, and the two configuration fallbacks. The scenario file
 * alongside this one drives the manager through a built map; this one drives the individual
 * authoring statics directly, because several of their branches are unreachable from a map
 * build (a uniformly-solid tile that is still reachable from a neighbor, for instance, cannot
 * be produced by the default loader- it short-circuits to a solid fill one branch earlier).
 */
describe('J-Pixelistics PIXEL_CollisionManager authoring layer (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installPixelCoreHostGlobals();

    setPluginContextToJBase();
    await import('../../../../../src/plugins/_base/core/_metadata/initialization.js');

    setPluginContextToJPixel();
    await import('../../../../../src/plugins/pixel/core/_metadata/initialization.js');

    ({ default: globalThis.PIXEL_CollisionManager } = await import('../../../../../src/plugins/pixel/core/managers/PIXEL_CollisionManager.js'));
  });

  beforeEach(() =>
  {
    globalThis.$gameMap = buildDefaultPixelGameMap();
    globalThis.J.PIXEL.Metadata.CollisionStepCount = 4;
  });

  //region _mergeSingleTile
  describe('_mergeSingleTile', () =>
  {
    /**
     * Every merge rule, keyed by the four edge-block flags the caller passes in. The manager
     * only consults this path when a tile is subdivided into a single subcell, so the four
     * directional blocks have to collapse into one representative shape code.
     * @type {Array<{name: string, blocks: boolean[], code: string}>}
     */
    const mergeCases = [
      { name: 'all four edges blocked', blocks: [ true, true, true, true ], code: 'Solid' },
      { name: 'both vertical edges blocked', blocks: [ true, true, false, false ], code: 'VerticalLine' },
      { name: 'both horizontal edges blocked', blocks: [ false, false, true, true ], code: 'HorizontalLine' },
      { name: 'only the up edge blocked', blocks: [ true, false, false, false ], code: 'EdgeUp' },
      { name: 'only the down edge blocked', blocks: [ false, true, false, false ], code: 'EdgeDown' },
      { name: 'only the left edge blocked', blocks: [ false, false, true, false ], code: 'EdgeLeft' },
      { name: 'only the right edge blocked', blocks: [ false, false, false, true ], code: 'EdgeRight' },
      { name: 'up and left blocked', blocks: [ true, false, true, false ], code: 'CornerTopLeft' },
      { name: 'up and right blocked', blocks: [ true, false, false, true ], code: 'CornerTopRight' },
      { name: 'down and left blocked', blocks: [ false, true, true, false ], code: 'CornerBottomLeft' },
      { name: 'down and right blocked', blocks: [ false, true, false, true ], code: 'CornerBottomRight' },
    ];

    it.each(mergeCases)('merges $name into $code', ({ blocks, code }) =>
    {
      // Arrange
      const { Codes } = globalThis.PIXEL_CollisionManager;
      const [ blockUp, blockDown, blockLeft, blockRight ] = blocks;

      // Act
      const merged = globalThis.PIXEL_CollisionManager._mergeSingleTile(blockUp, blockDown, blockLeft, blockRight);

      // Assert
      expect(merged).toBe(Codes[code]);
    });

    it('merges a fully open tile into Open, since no specific rule applies', () =>
    {
      // Arrange
      const { Codes } = globalThis.PIXEL_CollisionManager;

      // Act
      const merged = globalThis.PIXEL_CollisionManager._mergeSingleTile(false, false, false, false);

      // Assert
      expect(merged).toBe(Codes.Open);
    });

    it('falls through to Open for a three-sided block, which matches no corner or line rule', () =>
    {
      // Arrange: up + down + left leaves only the right edge open, which is neither a line
      // (those need an opposing pair with the other pair clear) nor a corner (those need
      // exactly two adjacent sides), so the rule table deliberately declines to encode it.
      const { Codes } = globalThis.PIXEL_CollisionManager;

      // Act
      const merged = globalThis.PIXEL_CollisionManager._mergeSingleTile(true, true, true, false);

      // Assert
      expect(merged).toBe(Codes.Open);
    });
  });
  //endregion _mergeSingleTile

  //region _applyTileCollision
  describe('_applyTileCollision', () =>
  {
    it('fills a tile solid when every direction out of it is blocked', () =>
    {
      // Arrange: the default loader can never reach this branch- a tile blocked on all four
      // sides is normally caught by the earlier "unreachable from any neighbor" fill. A tile
      // that is enterable but not exitable only arises from asymmetric passability, so drive
      // the authoring call directly.
      globalThis.PIXEL_CollisionManager.initConfig();
      globalThis.PIXEL_CollisionManager.setupCollision();

      // Act
      globalThis.PIXEL_CollisionManager._applyTileCollision(0, 0, false, false, false, false);

      // Assert
      const passable = globalThis.PIXEL_CollisionManager
        .isPositionPassable(0.5, 0.5, globalThis.J.PIXEL.Directions.DOWN);
      expect(passable).toBe(false);
    });

    it('fills a tile open when every direction out of it is allowed', () =>
    {
      // Arrange
      globalThis.PIXEL_CollisionManager.initConfig();
      globalThis.PIXEL_CollisionManager.setupCollision();

      // Act
      globalThis.PIXEL_CollisionManager._applyTileCollision(0, 0, true, true, true, true);

      // Assert
      const passable = globalThis.PIXEL_CollisionManager
        .isPositionPassable(0.5, 0.5, globalThis.J.PIXEL.Directions.DOWN);
      expect(passable).toBe(true);
    });

    /**
     * Where two blocked sides meet, the tile gets an extra single-subcell blocker in the corner
     * between them, drawn after the edge lines so it overwrites whichever edge got there first.
     *
     * The distinction the assertions rest on: an edge subcell refuses only the one direction it
     * names, while a corner subcell refuses every direction. So sampling the corner while moving in
     * a direction *neither* adjacent edge would block separates the two - if the corner were never
     * drawn, or drawn in the wrong quadrant, that sample would land on a plain edge and answer
     * passable. Both the four corner conditions and the two position ternaries inside the corner
     * writer depend on it.
     */
    describe('corner blockers where two blocked sides meet', () =>
    {
      it.each([
        [ 'top-left', true, false, true, false, 0.1, 0.1, 'DOWN' ],
        [ 'top-right', true, true, false, false, 0.8, 0.1, 'DOWN' ],
        [ 'bottom-left', false, false, true, true, 0.1, 0.8, 'UP' ],
        [ 'bottom-right', false, true, false, true, 0.8, 0.8, 'UP' ],
      ])(
        'blocks the %s corner subcell in every direction',
        (_label, passDown, passLeft, passRight, passUp, sampleX, sampleY, unblockedDirKey) =>
        {
          // Arrange
          globalThis.PIXEL_CollisionManager.initConfig();
          globalThis.PIXEL_CollisionManager.setupCollision();

          // Act
          globalThis.PIXEL_CollisionManager._applyTileCollision(0, 0, passDown, passLeft, passRight, passUp);

          // Assert: neither edge meeting at this corner names this direction, so only the corner
          // blocker itself can refuse it.
          const passable = globalThis.PIXEL_CollisionManager
            .isPositionPassable(sampleX, sampleY, globalThis.J.PIXEL.Directions[ unblockedDirKey ]);
          expect(passable).toBe(false);
        });

      it('leaves the opposite corner of the same tile alone', () =>
      {
        // Arrange: blocked on the left and above, so the corner belongs in the top-left quadrant.
        // The bottom-right quadrant is untouched by either edge line, and a corner drawn into the
        // wrong quadrant would show up here rather than where it belongs.
        globalThis.PIXEL_CollisionManager.initConfig();
        globalThis.PIXEL_CollisionManager.setupCollision();

        // Act
        globalThis.PIXEL_CollisionManager._applyTileCollision(0, 0, true, false, true, false);

        // Assert
        const passable = globalThis.PIXEL_CollisionManager
          .isPositionPassable(0.8, 0.8, globalThis.J.PIXEL.Directions.DOWN);
        expect(passable).toBe(true);
      });
    });

    it('collapses a non-uniform tile to one merged code when using a single subcell per tile', () =>
    {
      // Arrange: at a step count of 1 there is no room to draw edges or corners, so the tile's
      // four passabilities have to merge into a single representative code instead.
      globalThis.J.PIXEL.Metadata.CollisionStepCount = 1;
      globalThis.PIXEL_CollisionManager.initConfig();
      globalThis.PIXEL_CollisionManager.setupCollision();

      // Act: down and up open, left and right blocked -> a horizontal line.
      globalThis.PIXEL_CollisionManager._applyTileCollision(0, 0, true, false, false, true);

      // Assert: horizontal movement is blocked by the merged line.
      const horizontal = globalThis.PIXEL_CollisionManager
        .isPositionPassable(0, 0, globalThis.J.PIXEL.Directions.LEFT);
      expect(horizontal).toBe(false);
    });

    it('leaves vertical movement open through a single-subcell horizontal line', () =>
    {
      // Arrange
      globalThis.J.PIXEL.Metadata.CollisionStepCount = 1;
      globalThis.PIXEL_CollisionManager.initConfig();
      globalThis.PIXEL_CollisionManager.setupCollision();

      // Act
      globalThis.PIXEL_CollisionManager._applyTileCollision(0, 0, true, false, false, true);

      // Assert
      const vertical = globalThis.PIXEL_CollisionManager
        .isPositionPassable(0, 0, globalThis.J.PIXEL.Directions.DOWN);
      expect(vertical).toBe(true);
    });
  });
  //endregion _applyTileCollision

  //region configuration fallbacks
  describe('configuration fallbacks', () =>
  {
    it('defaults the step count to 4 when plugin metadata has not been built yet', () =>
    {
      // Arrange: initConfig runs during boot, potentially before the metadata instance exists,
      // so it carries its own default rather than reading through a half-built namespace.
      const previousMetadata = globalThis.J.PIXEL.Metadata;
      globalThis.J.PIXEL.Metadata = undefined;

      // Act
      globalThis.PIXEL_CollisionManager.initConfig();

      // Assert
      expect(globalThis.PIXEL_CollisionManager.collisionStepCount).toBe(4);

      // restore the bare-global metadata rather than leaking it into later tests in this file.
      globalThis.J.PIXEL.Metadata = previousMetadata;
    });

    it('self-configures on setupCollision when no configuration exists yet', () =>
    {
      // Arrange: a map can be set up before anything called initConfig, so setupCollision
      // has to be able to bootstrap its own configuration.
      delete globalThis.PIXEL_CollisionManager.collisionStepCount;

      // Act
      globalThis.PIXEL_CollisionManager.setupCollision();

      // Assert
      expect(globalThis.PIXEL_CollisionManager.collisionStepCount).toBe(4);
    });

    it('treats an unwritten subcell as open', () =>
    {
      // Arrange: the table is allocated at full size and then painted, so any subcell the
      // build never wrote is a hole. Reads default those to open rather than over-blocking.
      globalThis.PIXEL_CollisionManager.initConfig();
      globalThis.PIXEL_CollisionManager.setupCollision();
      globalThis.PIXEL_CollisionManager._set(0.5, 0.5, undefined);

      // Act
      const passable = globalThis.PIXEL_CollisionManager
        .isPositionPassable(0.5, 0.5, globalThis.J.PIXEL.Directions.DOWN);

      // Assert
      expect(passable).toBe(true);
    });
  });
  //endregion configuration fallbacks
});
//endregion plugins/pixel/core/managers/pixel-collision-manager.test.js