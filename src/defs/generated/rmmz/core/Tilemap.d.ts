/**
 * Generated from project/js/rmmz_core.js
 * Class: Tilemap
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Tilemap
{
  /**
   * Instance fields inferred from `this._*` assignments across vanilla engine sources.
   */
  _bitmaps: unknown[] | Array<Bitmap | null>;
  _height: unknown;
  _lastAnimationFrame: unknown;
  _lastStartX: unknown;
  _lastStartY: unknown;
  _lowerLayer: Tilemap.CombinedLayer;
  _mapData: null | number[];
  _mapHeight: number;
  _mapWidth: number;
  _margin: number;
  _needsBitmapsUpdate: boolean;
  _needsRepaint: boolean;
  _upperLayer: Tilemap.CombinedLayer;
  _width: unknown;
  _addAllSpots(startX: number, startY: number): void;
  _addAutotile(layer: number, tileId: number, dx: number, dy: number): void;
  _addNormalTile(layer: number, tileId: number, dx: number, dy: number): void;
  _addShadow(layer: number, shadowBits: number, dx: number, dy: number): void;
  _addSpot(startX: number, startY: number, x: number, y: number): void;
  _addSpotTile(tileId: number, dx: number, dy: number): void;
  _addTableEdge(layer: number, tileId: number, dx: number, dy: number): void;
  _addTile(layer: number, tileId: number, dx: number, dy: number): void;
  _compareChildOrder(a: object, b: object): number;
  _createLayers(): void;
  _isHigherTile(tileId: number): number;
  _isOverpassPosition(): boolean;
  _isTableTile(tileId: number): number;
  _readMapData(x: number, y: number, z: number): number;
  _sortChildren(): void;
  _updateBitmaps(): void;
  /**
   * Destroys the tilemap.
   */
  destroy(): void;
  /**
   * The tilemap which displays 2D tile-based game map.
   */
  initialize(): void;
  /**
   * Checks whether the tileset is ready to render.
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
}
declare namespace Tilemap
{
  function getAutotileKind(tileId: number): number;
  function getAutotileShape(tileId: number): number;
  function isAutotile(tileId: number): boolean;
  function isFloorTypeAutotile(tileId: number): boolean;
  function isGroundTile(tileId: number): boolean;
  function isRoofTile(tileId: number): boolean;
  function isSameKindTile(tileID1: number, tileID2: number): boolean;
  function isShadowingTile(tileId: number): boolean;
  function isTileA1(tileId: number): boolean;
  function isTileA2(tileId: number): boolean;
  function isTileA3(tileId: number): boolean;
  function isTileA4(tileId: number): boolean;
  function isTileA5(tileId: number): boolean;
  function isVisibleTile(tileId: number): boolean;
  function isWallSideTile(tileId: number): boolean;
  function isWallTile(tileId: number): boolean;
  function isWallTopTile(tileId: number): boolean;
  function isWallTypeAutotile(tileId: number): boolean;
  function isWaterTile(tileId: number): boolean;
  function isWaterfallTile(tileId: number): boolean;
  function isWaterfallTypeAutotile(tileId: number): boolean;
  function makeAutotileId(kind: number, shape: number): number;
  const TILE_ID_A1: 2048;
  const TILE_ID_A2: 2816;
  const TILE_ID_A3: 4352;
  const TILE_ID_A4: 5888;
  const TILE_ID_A5: 1536;
  const TILE_ID_B: 0;
  const TILE_ID_C: 256;
  const TILE_ID_D: 512;
  const TILE_ID_E: 768;
  const TILE_ID_MAX: 8192;
}
