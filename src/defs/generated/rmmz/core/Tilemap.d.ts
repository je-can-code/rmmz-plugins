/**
 * Generated from project/js/rmmz_core.js
 * Class: Tilemap
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Tilemap extends PIXI.Container
{
  /**
   * Inferred engine backing field.
   *
   * Type: `unknown[] | Array<Bitmap | null>`.
   * Initialized in: {@link Tilemap#initialize}.
   * Written in: {@link Tilemap#initialize}, {@link Tilemap#setBitmaps}.
   * Read in: {@link Tilemap#_updateBitmaps}, {@link Tilemap#isReady}, {@link Tilemap#setBitmaps}.
   */
  _bitmaps: unknown[] | Array<Bitmap | null>;
  /**
   * Inferred engine backing field.
   *
   * Type: `unknown`.
   * Initialized in: {@link Tilemap#initialize}.
   * Written in: {@link Tilemap#initialize}.
   * Read in: none.
   */
  _height: unknown;
  /**
   * Inferred engine backing field.
   *
   * Type: `unknown`.
   * Initialized in: none.
   * Written in: {@link Tilemap#updateTransform}.
   * Read in: {@link Tilemap#updateTransform}.
   */
  _lastAnimationFrame: unknown;
  /**
   * Inferred engine backing field.
   *
   * Type: `unknown`.
   * Initialized in: none.
   * Written in: {@link Tilemap#updateTransform}.
   * Read in: {@link Tilemap#updateTransform}.
   */
  _lastStartX: unknown;
  /**
   * Inferred engine backing field.
   *
   * Type: `unknown`.
   * Initialized in: none.
   * Written in: {@link Tilemap#updateTransform}.
   * Read in: {@link Tilemap#updateTransform}.
   */
  _lastStartY: unknown;
  /**
   * Inferred engine backing field.
   *
   * Type: `Tilemap.CombinedLayer`.
   * Initialized in: none.
   * Written in: {@link Tilemap#_createLayers}.
   * Read in: {@link Tilemap#_addAllSpots}, {@link Tilemap#_addSpot}, {@link Tilemap#_addSpotTile}, {@link Tilemap#_createLayers}, {@link Tilemap#_updateBitmaps}, {@link Tilemap#updateTransform}.
   *
   * Consumed by:
   * - `clear()`: {@link Tilemap#_addAllSpots}.
   */
  _lowerLayer: Tilemap.CombinedLayer;
  /**
   * Inferred engine backing field.
   *
   * Type: `null | number[]`.
   * Initialized in: {@link Tilemap#initialize}.
   * Written in: {@link Tilemap#initialize}, {@link Tilemap#setData}.
   * Read in: {@link Tilemap#_readMapData}.
   */
  _mapData: null | number[];
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: {@link Tilemap#initialize}.
   * Written in: {@link Tilemap#initialize}, {@link Tilemap#setData}.
   * Read in: {@link Tilemap#_readMapData}.
   */
  _mapHeight: number;
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: {@link Tilemap#initialize}.
   * Written in: {@link Tilemap#initialize}, {@link Tilemap#setData}.
   * Read in: {@link Tilemap#_readMapData}.
   */
  _mapWidth: number;
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: {@link Tilemap#initialize}.
   * Written in: {@link Tilemap#initialize}.
   * Read in: {@link Tilemap#_addAllSpots}, {@link Tilemap#updateTransform}.
   */
  _margin: number;
  /**
   * Inferred engine backing field.
   *
   * Type: `boolean`.
   * Initialized in: none.
   * Written in: {@link Tilemap#_updateBitmaps}, {@link Tilemap#setBitmaps}.
   * Read in: {@link Tilemap#_updateBitmaps}.
   */
  _needsBitmapsUpdate: boolean;
  /**
   * Inferred engine backing field.
   *
   * Type: `boolean`.
   * Initialized in: none.
   * Written in: {@link Tilemap#_createLayers}, {@link Tilemap#_updateBitmaps}, {@link Tilemap#refresh}, {@link Tilemap#updateTransform}.
   * Read in: {@link Tilemap#updateTransform}.
   */
  _needsRepaint: boolean;
  /**
   * Inferred engine backing field.
   *
   * Type: `Tilemap.CombinedLayer`.
   * Initialized in: none.
   * Written in: {@link Tilemap#_createLayers}.
   * Read in: {@link Tilemap#_addAllSpots}, {@link Tilemap#_addSpot}, {@link Tilemap#_addSpotTile}, {@link Tilemap#_createLayers}, {@link Tilemap#updateTransform}.
   *
   * Consumed by:
   * - `clear()`: {@link Tilemap#_addAllSpots}.
   */
  _upperLayer: Tilemap.CombinedLayer;
  /**
   * Inferred engine backing field.
   *
   * Type: `unknown`.
   * Initialized in: {@link Tilemap#initialize}.
   * Written in: {@link Tilemap#initialize}.
   * Read in: none.
   */
  _width: unknown;
  /**
   * Performs add all spots.
   * @param startX The startX parameter.
   * @param startY The startY parameter.
   */
  _addAllSpots(startX: number, startY: number): void;
  /**
   * Performs add autotile.
   * @param layer The layer parameter.
   * @param tileId The tileId parameter.
   * @param dx The dx parameter.
   * @param dy The dy parameter.
   */
  _addAutotile(layer: number, tileId: number, dx: number, dy: number): void;
  /**
   * Performs add normal tile.
   * @param layer The layer parameter.
   * @param tileId The tileId parameter.
   * @param dx The dx parameter.
   * @param dy The dy parameter.
   */
  _addNormalTile(layer: number, tileId: number, dx: number, dy: number): void;
  /**
   * Performs add shadow.
   * @param layer The layer parameter.
   * @param shadowBits The shadowBits parameter.
   * @param dx The dx parameter.
   * @param dy The dy parameter.
   */
  _addShadow(layer: number, shadowBits: number, dx: number, dy: number): void;
  /**
   * Performs add spot.
   * @param startX The startX parameter.
   * @param startY The startY parameter.
   * @param x The x parameter.
   * @param y The y parameter.
   */
  _addSpot(startX: number, startY: number, x: number, y: number): void;
  /**
   * Performs add spot tile.
   * @param tileId The tileId parameter.
   * @param dx The dx parameter.
   * @param dy The dy parameter.
   */
  _addSpotTile(tileId: number, dx: number, dy: number): void;
  /**
   * Performs add table edge.
   * @param layer The layer parameter.
   * @param tileId The tileId parameter.
   * @param dx The dx parameter.
   * @param dy The dy parameter.
   */
  _addTableEdge(layer: number, tileId: number, dx: number, dy: number): void;
  /**
   * Performs add tile.
   * @param layer The layer parameter.
   * @param tileId The tileId parameter.
   * @param dx The dx parameter.
   * @param dy The dy parameter.
   */
  _addTile(layer: number, tileId: number, dx: number, dy: number): void;
  /**
   * Gets compare child order.
   * @param a The a parameter.
   * @param b The b parameter.
   * @returns The result.
   */
  _compareChildOrder(a: object, b: object): number;
  /**
   * Performs create layers.
   */
  _createLayers(): void;
  /**
   * Gets is higher tile.
   * @param tileId The tileId parameter.
   * @returns The result.
   */
  _isHigherTile(tileId: number): number;
  /**
   * Gets is overpass position.
   * @returns The result.
   */
  _isOverpassPosition(): boolean;
  /**
   * Gets is table tile.
   * @param tileId The tileId parameter.
   * @returns The result.
   */
  _isTableTile(tileId: number): number;
  /**
   * Gets read map data.
   * @param x The x parameter.
   * @param y The y parameter.
   * @param z The z parameter.
   * @returns The result.
   */
  _readMapData(x: number, y: number, z: number): number;
  /**
   * Performs sort children.
   */
  _sortChildren(): void;
  /**
   * Performs update bitmaps.
   */
  _updateBitmaps(): void;
  /**
   * Destroys the tilemap.
   */
  destroy(): void;
  /**
   * The height of the tilemap.
   * @returns The result.
   */
  get height(): number;
  /**
   * The tilemap which displays 2D tile-based game map.
   */
  initialize(): void;
  /**
   * Checks whether the tileset is ready to render.
   * @returns True if ready; false otherwise.
   */
  isReady(): boolean;
  /**
   * Forces to repaint the entire tilemap.
   */
  refresh(): void;
  /**
   * Sets the bitmaps used as a tileset.
   * @param bitmaps The array of the tileset bitmaps.
   */
  setBitmaps(bitmaps: Array<Bitmap | null>): void;
  /**
   * Sets the tilemap data.
   * @param width The width of the map in number of tiles.
   * @param height The height of the map in number of tiles.
   * @param data The one dimensional array for the map data.
   */
  setData(width: number, height: number, data: number[]): void;
  /**
   * Updates the tilemap for each frame.
   */
  update(): void;
  /**
   * Updates the transform on all children of this container for rendering.
   */
  updateTransform(): void;
  /**
   * The width of the tilemap.
   * @returns The result.
   */
  get width(): number;
}
declare namespace Tilemap
{
  /**
   * Gets autotile kind.
   * @param tileId The tileId parameter.
   * @returns The result.
   */
  function getAutotileKind(tileId: number): number;
  /**
   * Gets autotile shape.
   * @param tileId The tileId parameter.
   * @returns The result.
   */
  function getAutotileShape(tileId: number): number;
  /**
   * Determines whether autotile.
   * @param tileId The tileId parameter.
   * @returns True if autotile; false otherwise.
   */
  function isAutotile(tileId: number): boolean;
  /**
   * Determines whether floor type autotile.
   * @param tileId The tileId parameter.
   * @returns True if floor type autotile; false otherwise.
   */
  function isFloorTypeAutotile(tileId: number): boolean;
  /**
   * Determines whether ground tile.
   * @param tileId The tileId parameter.
   * @returns True if ground tile; false otherwise.
   */
  function isGroundTile(tileId: number): boolean;
  /**
   * Determines whether roof tile.
   * @param tileId The tileId parameter.
   * @returns True if roof tile; false otherwise.
   */
  function isRoofTile(tileId: number): boolean;
  /**
   * Determines whether same kind tile.
   * @param tileID1 The tileID1 parameter.
   * @param tileID2 The tileID2 parameter.
   * @returns True if same kind tile; false otherwise.
   */
  function isSameKindTile(tileID1: number, tileID2: number): boolean;
  /**
   * Determines whether shadowing tile.
   * @param tileId The tileId parameter.
   * @returns True if shadowing tile; false otherwise.
   */
  function isShadowingTile(tileId: number): boolean;
  /**
   * Determines whether tile a1.
   * @param tileId The tileId parameter.
   * @returns True if tile a1; false otherwise.
   */
  function isTileA1(tileId: number): boolean;
  /**
   * Determines whether tile a2.
   * @param tileId The tileId parameter.
   * @returns True if tile a2; false otherwise.
   */
  function isTileA2(tileId: number): boolean;
  /**
   * Determines whether tile a3.
   * @param tileId The tileId parameter.
   * @returns True if tile a3; false otherwise.
   */
  function isTileA3(tileId: number): boolean;
  /**
   * Determines whether tile a4.
   * @param tileId The tileId parameter.
   * @returns True if tile a4; false otherwise.
   */
  function isTileA4(tileId: number): boolean;
  /**
   * Determines whether tile a5.
   * @param tileId The tileId parameter.
   * @returns True if tile a5; false otherwise.
   */
  function isTileA5(tileId: number): boolean;
  /**
   * Determines whether visible tile.
   * @param tileId The tileId parameter.
   * @returns True if visible tile; false otherwise.
   */
  function isVisibleTile(tileId: number): boolean;
  /**
   * Determines whether wall side tile.
   * @param tileId The tileId parameter.
   * @returns True if wall side tile; false otherwise.
   */
  function isWallSideTile(tileId: number): boolean;
  /**
   * Determines whether wall tile.
   * @param tileId The tileId parameter.
   * @returns True if wall tile; false otherwise.
   */
  function isWallTile(tileId: number): boolean;
  /**
   * Determines whether wall top tile.
   * @param tileId The tileId parameter.
   * @returns True if wall top tile; false otherwise.
   */
  function isWallTopTile(tileId: number): boolean;
  /**
   * Determines whether wall type autotile.
   * @param tileId The tileId parameter.
   * @returns True if wall type autotile; false otherwise.
   */
  function isWallTypeAutotile(tileId: number): boolean;
  /**
   * Determines whether water tile.
   * @param tileId The tileId parameter.
   * @returns True if water tile; false otherwise.
   */
  function isWaterTile(tileId: number): boolean;
  /**
   * Determines whether waterfall tile.
   * @param tileId The tileId parameter.
   * @returns True if waterfall tile; false otherwise.
   */
  function isWaterfallTile(tileId: number): boolean;
  /**
   * Determines whether waterfall type autotile.
   * @param tileId The tileId parameter.
   * @returns True if waterfall type autotile; false otherwise.
   */
  function isWaterfallTypeAutotile(tileId: number): boolean;
  /**
   * Creates autotile id.
   * @param kind The kind parameter.
   * @param shape The shape parameter.
   * @returns The result.
   */
  function makeAutotileId(kind: number, shape: number): number;
  /**
   * Engine static constant.
   */
  const TILE_ID_A1: 2048;
  /**
   * Engine static constant.
   */
  const TILE_ID_A2: 2816;
  /**
   * Engine static constant.
   */
  const TILE_ID_A3: 4352;
  /**
   * Engine static constant.
   */
  const TILE_ID_A4: 5888;
  /**
   * Engine static constant.
   */
  const TILE_ID_A5: 1536;
  /**
   * Engine static constant.
   */
  const TILE_ID_B: 0;
  /**
   * Engine static constant.
   */
  const TILE_ID_C: 256;
  /**
   * Engine static constant.
   */
  const TILE_ID_D: 512;
  /**
   * Engine static constant.
   */
  const TILE_ID_E: 768;
  /**
   * Engine static constant.
   */
  const TILE_ID_MAX: 8192;
}
