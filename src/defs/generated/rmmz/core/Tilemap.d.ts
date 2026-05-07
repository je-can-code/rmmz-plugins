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
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `unknown[]`.<br/>
   * Initialized in: {@link Tilemap#initialize}.<br/>
   * Written in: {@link Tilemap#initialize}, {@link Tilemap#setBitmaps}.<br/>
   * Read in: {@link Tilemap#_updateBitmaps}, {@link Tilemap#isReady}, {@link Tilemap#setBitmaps}.<br/>
   */
  _bitmaps: unknown[];
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `unknown`.<br/>
   * Initialized in: {@link Tilemap#initialize}.<br/>
   * Written in: {@link Tilemap#initialize}.<br/>
   * Read in: none.<br/>
   */
  _height: unknown;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `unknown`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Tilemap#updateTransform}.<br/>
   * Read in: {@link Tilemap#updateTransform}.<br/>
   */
  _lastAnimationFrame: unknown;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `unknown`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Tilemap#updateTransform}.<br/>
   * Read in: {@link Tilemap#updateTransform}.<br/>
   */
  _lastStartX: unknown;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `unknown`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Tilemap#updateTransform}.<br/>
   * Read in: {@link Tilemap#updateTransform}.<br/>
   */
  _lastStartY: unknown;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `Tilemap.CombinedLayer`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Tilemap#_createLayers}.<br/>
   * Read in: {@link Tilemap#_addAllSpots}, {@link Tilemap#_addSpot}, {@link Tilemap#_addSpotTile}, {@link Tilemap#_createLayers}, {@link Tilemap#_updateBitmaps}, {@link Tilemap#updateTransform}.<br/>
   *<br/>
   * Consumed by:<br/>
   * - `clear()`: {@link Tilemap#_addAllSpots}.<br/>
   */
  _lowerLayer: Tilemap.CombinedLayer;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `null`.<br/>
   * Initialized in: {@link Tilemap#initialize}.<br/>
   * Written in: {@link Tilemap#initialize}, {@link Tilemap#setData}.<br/>
   * Read in: {@link Tilemap#_readMapData}.<br/>
   */
  _mapData: null;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: {@link Tilemap#initialize}.<br/>
   * Written in: {@link Tilemap#initialize}, {@link Tilemap#setData}.<br/>
   * Read in: {@link Tilemap#_readMapData}.<br/>
   */
  _mapHeight: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: {@link Tilemap#initialize}.<br/>
   * Written in: {@link Tilemap#initialize}, {@link Tilemap#setData}.<br/>
   * Read in: {@link Tilemap#_readMapData}.<br/>
   */
  _mapWidth: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: {@link Tilemap#initialize}.<br/>
   * Written in: {@link Tilemap#initialize}.<br/>
   * Read in: {@link Tilemap#_addAllSpots}, {@link Tilemap#updateTransform}.<br/>
   */
  _margin: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `boolean`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Tilemap#_updateBitmaps}, {@link Tilemap#setBitmaps}.<br/>
   * Read in: {@link Tilemap#_updateBitmaps}.<br/>
   */
  _needsBitmapsUpdate: boolean;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `boolean`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Tilemap#_createLayers}, {@link Tilemap#_updateBitmaps}, {@link Tilemap#refresh}, {@link Tilemap#updateTransform}.<br/>
   * Read in: {@link Tilemap#updateTransform}.<br/>
   */
  _needsRepaint: boolean;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `Tilemap.CombinedLayer`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Tilemap#_createLayers}.<br/>
   * Read in: {@link Tilemap#_addAllSpots}, {@link Tilemap#_addSpot}, {@link Tilemap#_addSpotTile}, {@link Tilemap#_createLayers}, {@link Tilemap#updateTransform}.<br/>
   *<br/>
   * Consumed by:<br/>
   * - `clear()`: {@link Tilemap#_addAllSpots}.<br/>
   */
  _upperLayer: Tilemap.CombinedLayer;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `unknown`.<br/>
   * Initialized in: {@link Tilemap#initialize}.<br/>
   * Written in: {@link Tilemap#initialize}.<br/>
   * Read in: none.<br/>
   */
  _width: unknown;
  /**
   * Performs add all spots.
   * @param startX The startX parameter.
   * @param startY The startY parameter.
   */
  _addAllSpots(startX: unknown, startY: unknown): void;
  /**
   * Performs add autotile.
   * @param layer The layer parameter.
   * @param tileId The tileId parameter.
   * @param dx The dx parameter.
   * @param dy The dy parameter.
   */
  _addAutotile(layer: unknown, tileId: unknown, dx: unknown, dy: unknown): void;
  /**
   * Performs add normal tile.
   * @param layer The layer parameter.
   * @param tileId The tileId parameter.
   * @param dx The dx parameter.
   * @param dy The dy parameter.
   */
  _addNormalTile(layer: unknown, tileId: unknown, dx: unknown, dy: unknown): void;
  /**
   * Performs add shadow.
   * @param layer The layer parameter.
   * @param shadowBits The shadowBits parameter.
   * @param dx The dx parameter.
   * @param dy The dy parameter.
   */
  _addShadow(layer: unknown, shadowBits: unknown, dx: unknown, dy: unknown): void;
  /**
   * Performs add spot.
   * @param startX The startX parameter.
   * @param startY The startY parameter.
   * @param x The x parameter.
   * @param y The y parameter.
   */
  _addSpot(startX: unknown, startY: unknown, x: unknown, y: unknown): void;
  /**
   * Performs add spot tile.
   * @param tileId The tileId parameter.
   * @param dx The dx parameter.
   * @param dy The dy parameter.
   */
  _addSpotTile(tileId: unknown, dx: unknown, dy: unknown): void;
  /**
   * Performs add table edge.
   * @param layer The layer parameter.
   * @param tileId The tileId parameter.
   * @param dx The dx parameter.
   * @param dy The dy parameter.
   */
  _addTableEdge(layer: unknown, tileId: unknown, dx: unknown, dy: unknown): void;
  /**
   * Performs add tile.
   * @param layer The layer parameter.
   * @param tileId The tileId parameter.
   * @param dx The dx parameter.
   * @param dy The dy parameter.
   */
  _addTile(layer: unknown, tileId: unknown, dx: unknown, dy: unknown): void;
  /**
   * Gets compare child order.
   * @param a The a parameter.
   * @param b The b parameter.
   * @returns The result.
   */
  _compareChildOrder(a: unknown, b: unknown): unknown;
  /**
   * Performs create layers.
   */
  _createLayers(): void;
  /**
   * Gets is higher tile.
   * @param tileId The tileId parameter.
   * @returns The result.
   */
  _isHigherTile(tileId: unknown): unknown;
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
  _isTableTile(tileId: unknown): unknown;
  /**
   * Gets read map data.
   * @param x The x parameter.
   * @param y The y parameter.
   * @param z The z parameter.
   * @returns The result.
   */
  _readMapData(x: unknown, y: unknown, z: unknown): number;
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
  get height(): unknown;
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
  setBitmaps(bitmaps: unknown[]): void;
  /**
   * Sets the tilemap data.
   * @param width The width of the map in number of tiles.
   * @param height The height of the map in number of tiles.
   * @param data The one dimensional array for the map data.
   */
  setData(width: number, height: number, data: unknown[]): void;
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
  get width(): unknown;
}
declare namespace Tilemap
{
  /**
   * Gets autotile kind.
   * @param tileId The tileId parameter.
   * @returns The result.
   */
  function getAutotileKind(tileId: unknown): unknown;
  /**
   * Gets autotile shape.
   * @param tileId The tileId parameter.
   * @returns The result.
   */
  function getAutotileShape(tileId: unknown): unknown;
  /**
   * Determines whether autotile.
   * @param tileId The tileId parameter.
   * @returns True if autotile; false otherwise.
   */
  function isAutotile(tileId: unknown): boolean;
  /**
   * Determines whether floor type autotile.
   * @param tileId The tileId parameter.
   * @returns True if floor type autotile; false otherwise.
   */
  function isFloorTypeAutotile(tileId: unknown): boolean;
  /**
   * Determines whether ground tile.
   * @param tileId The tileId parameter.
   * @returns True if ground tile; false otherwise.
   */
  function isGroundTile(tileId: unknown): boolean;
  /**
   * Determines whether roof tile.
   * @param tileId The tileId parameter.
   * @returns True if roof tile; false otherwise.
   */
  function isRoofTile(tileId: unknown): boolean;
  /**
   * Determines whether same kind tile.
   * @param tileID1 The tileID1 parameter.
   * @param tileID2 The tileID2 parameter.
   * @returns True if same kind tile; false otherwise.
   */
  function isSameKindTile(tileID1: unknown, tileID2: unknown): boolean;
  /**
   * Determines whether shadowing tile.
   * @param tileId The tileId parameter.
   * @returns True if shadowing tile; false otherwise.
   */
  function isShadowingTile(tileId: unknown): boolean;
  /**
   * Determines whether tile a1.
   * @param tileId The tileId parameter.
   * @returns True if tile a1; false otherwise.
   */
  function isTileA1(tileId: unknown): boolean;
  /**
   * Determines whether tile a2.
   * @param tileId The tileId parameter.
   * @returns True if tile a2; false otherwise.
   */
  function isTileA2(tileId: unknown): boolean;
  /**
   * Determines whether tile a3.
   * @param tileId The tileId parameter.
   * @returns True if tile a3; false otherwise.
   */
  function isTileA3(tileId: unknown): boolean;
  /**
   * Determines whether tile a4.
   * @param tileId The tileId parameter.
   * @returns True if tile a4; false otherwise.
   */
  function isTileA4(tileId: unknown): boolean;
  /**
   * Determines whether tile a5.
   * @param tileId The tileId parameter.
   * @returns True if tile a5; false otherwise.
   */
  function isTileA5(tileId: unknown): boolean;
  /**
   * Determines whether visible tile.
   * @param tileId The tileId parameter.
   * @returns True if visible tile; false otherwise.
   */
  function isVisibleTile(tileId: unknown): boolean;
  /**
   * Determines whether wall side tile.
   * @param tileId The tileId parameter.
   * @returns True if wall side tile; false otherwise.
   */
  function isWallSideTile(tileId: unknown): boolean;
  /**
   * Determines whether wall tile.
   * @param tileId The tileId parameter.
   * @returns True if wall tile; false otherwise.
   */
  function isWallTile(tileId: unknown): boolean;
  /**
   * Determines whether wall top tile.
   * @param tileId The tileId parameter.
   * @returns True if wall top tile; false otherwise.
   */
  function isWallTopTile(tileId: unknown): boolean;
  /**
   * Determines whether wall type autotile.
   * @param tileId The tileId parameter.
   * @returns True if wall type autotile; false otherwise.
   */
  function isWallTypeAutotile(tileId: unknown): boolean;
  /**
   * Determines whether water tile.
   * @param tileId The tileId parameter.
   * @returns True if water tile; false otherwise.
   */
  function isWaterTile(tileId: unknown): boolean;
  /**
   * Determines whether waterfall tile.
   * @param tileId The tileId parameter.
   * @returns True if waterfall tile; false otherwise.
   */
  function isWaterfallTile(tileId: unknown): boolean;
  /**
   * Determines whether waterfall type autotile.
   * @param tileId The tileId parameter.
   * @returns True if waterfall type autotile; false otherwise.
   */
  function isWaterfallTypeAutotile(tileId: unknown): boolean;
  /**
   * Creates autotile id.
   * @param kind The kind parameter.
   * @param shape The shape parameter.
   * @returns The result.
   */
  function makeAutotileId(kind: unknown, shape: unknown): unknown;
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
