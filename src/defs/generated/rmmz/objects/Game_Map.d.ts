/**
 * Generated from project/js/rmmz_objects.js
 * Class: Game_Map
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Game_Map
{
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `null`.<br/>
   * Initialized in: {@link Game_Map#initialize}.<br/>
   * Written in: {@link Game_Map#changeBattleback}, {@link Game_Map#initialize}, {@link Game_Map#setupBattleback}.<br/>
   * Read in: {@link Game_Map#battleback1Name}.<br/>
   */
  _battleback1Name: null;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `null`.<br/>
   * Initialized in: {@link Game_Map#initialize}.<br/>
   * Written in: {@link Game_Map#changeBattleback}, {@link Game_Map#initialize}, {@link Game_Map#setupBattleback}.<br/>
   * Read in: {@link Game_Map#battleback2Name}.<br/>
   */
  _battleback2Name: null;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `unknown[]`.<br/>
   * Initialized in: {@link Game_Map#initialize}.<br/>
   * Written in: {@link Game_Map#initialize}, {@link Game_Map#setupEvents}.<br/>
   * Read in: {@link Game_Map#refresh}, {@link Game_Map#setupEvents}, {@link Game_Map#updateEvents}.<br/>
   *<br/>
   * Consumed by:<br/>
   * - `push()`: {@link Game_Map#setupEvents}.<br/>
   */
  _commonEvents: unknown[];
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: {@link Game_Map#initialize}.<br/>
   * Written in: {@link Game_Map#initialize}, {@link Game_Map#scrollLeft}, {@link Game_Map#scrollRight}, {@link Game_Map#setDisplayPos}, {@link Game_Map#setup}.<br/>
   * Read in: {@link Game_Map#adjustX}, {@link Game_Map#canvasToMapX}, {@link Game_Map#displayX}, {@link Game_Map#scrollLeft}, {@link Game_Map#scrollRight}, {@link Game_Map#setDisplayPos}, {@link Game_Map#updateScroll}.<br/>
   */
  _displayX: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: {@link Game_Map#initialize}.<br/>
   * Written in: {@link Game_Map#initialize}, {@link Game_Map#scrollDown}, {@link Game_Map#scrollUp}, {@link Game_Map#setDisplayPos}, {@link Game_Map#setup}.<br/>
   * Read in: {@link Game_Map#adjustY}, {@link Game_Map#canvasToMapY}, {@link Game_Map#displayY}, {@link Game_Map#scrollDown}, {@link Game_Map#scrollUp}, {@link Game_Map#setDisplayPos}, {@link Game_Map#updateScroll}.<br/>
   */
  _displayY: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `unknown[]`.<br/>
   * Initialized in: {@link Game_Map#initialize}.<br/>
   * Written in: {@link Game_Map#initialize}, {@link Game_Map#setupEvents}.<br/>
   * Read in: {@link Game_Map#eraseEvent}, {@link Game_Map#event}, {@link Game_Map#events}, {@link Game_Map#setupEvents}, {@link Game_Map#unlockEvent}.<br/>
   */
  _events: unknown[];
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `Game_Interpreter`.<br/>
   * Initialized in: {@link Game_Map#initialize}.<br/>
   * Written in: {@link Game_Map#initialize}.<br/>
   * Read in: {@link Game_Map#isEventRunning}, {@link Game_Map#setupAutorunCommonEvent}, {@link Game_Map#setupStartingEvent}, {@link Game_Map#setupStartingMapEvent}, {@link Game_Map#setupTestEvent}, {@link Game_Map#updateInterpreter}.<br/>
   *<br/>
   * Consumed by:<br/>
   * - `clear()`: {@link Game_Map#updateInterpreter}.<br/>
   */
  _interpreter: Game_Interpreter;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: {@link Game_Map#initialize}.<br/>
   * Written in: {@link Game_Map#initialize}, {@link Game_Map#setup}.<br/>
   * Read in: {@link Game_Map#mapId}, {@link Game_Map#setupEvents}.<br/>
   */
  _mapId: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `boolean`.<br/>
   * Initialized in: {@link Game_Map#initialize}.<br/>
   * Written in: {@link Game_Map#disableNameDisplay}, {@link Game_Map#enableNameDisplay}, {@link Game_Map#initialize}.<br/>
   * Read in: {@link Game_Map#isNameDisplayEnabled}.<br/>
   */
  _nameDisplay: boolean;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `boolean`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_Map#refresh}, {@link Game_Map#requestRefresh}, {@link Game_Map#setup}.<br/>
   * Read in: {@link Game_Map#refreshIfNeeded}.<br/>
   */
  _needsRefresh: boolean;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `boolean`.<br/>
   * Initialized in: {@link Game_Map#initialize}.<br/>
   * Written in: {@link Game_Map#changeParallax}, {@link Game_Map#initialize}, {@link Game_Map#setupParallax}.<br/>
   * Read in: {@link Game_Map#changeParallax}, {@link Game_Map#parallaxOx}, {@link Game_Map#scrollLeft}, {@link Game_Map#scrollRight}, {@link Game_Map#updateParallax}.<br/>
   */
  _parallaxLoopX: boolean;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `boolean`.<br/>
   * Initialized in: {@link Game_Map#initialize}.<br/>
   * Written in: {@link Game_Map#changeParallax}, {@link Game_Map#initialize}, {@link Game_Map#setupParallax}.<br/>
   * Read in: {@link Game_Map#changeParallax}, {@link Game_Map#parallaxOy}, {@link Game_Map#scrollDown}, {@link Game_Map#scrollUp}, {@link Game_Map#updateParallax}.<br/>
   */
  _parallaxLoopY: boolean;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `string`.<br/>
   * Initialized in: {@link Game_Map#initialize}.<br/>
   * Written in: {@link Game_Map#changeParallax}, {@link Game_Map#initialize}, {@link Game_Map#setupParallax}.<br/>
   * Read in: {@link Game_Map#changeParallax}, {@link Game_Map#parallaxName}, {@link Game_Map#setupParallax}.<br/>
   */
  _parallaxName: string;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: {@link Game_Map#initialize}.<br/>
   * Written in: {@link Game_Map#changeParallax}, {@link Game_Map#initialize}, {@link Game_Map#setupParallax}.<br/>
   * Read in: {@link Game_Map#updateParallax}.<br/>
   */
  _parallaxSx: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: {@link Game_Map#initialize}.<br/>
   * Written in: {@link Game_Map#changeParallax}, {@link Game_Map#initialize}, {@link Game_Map#setupParallax}.<br/>
   * Read in: {@link Game_Map#updateParallax}.<br/>
   */
  _parallaxSy: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: {@link Game_Map#initialize}.<br/>
   * Written in: {@link Game_Map#changeParallax}, {@link Game_Map#initialize}, {@link Game_Map#scrollLeft}, {@link Game_Map#scrollRight}, {@link Game_Map#setDisplayPos}, {@link Game_Map#setupParallax}, {@link Game_Map#updateParallax}.<br/>
   * Read in: {@link Game_Map#parallaxOx}.<br/>
   */
  _parallaxX: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: {@link Game_Map#initialize}.<br/>
   * Written in: {@link Game_Map#changeParallax}, {@link Game_Map#initialize}, {@link Game_Map#scrollDown}, {@link Game_Map#scrollUp}, {@link Game_Map#setDisplayPos}, {@link Game_Map#setupParallax}, {@link Game_Map#updateParallax}.<br/>
   * Read in: {@link Game_Map#parallaxOy}.<br/>
   */
  _parallaxY: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `boolean`.<br/>
   * Initialized in: {@link Game_Map#initialize}.<br/>
   * Written in: {@link Game_Map#changeParallax}, {@link Game_Map#initialize}, {@link Game_Map#setupParallax}.<br/>
   * Read in: {@link Game_Map#parallaxOx}, {@link Game_Map#parallaxOy}.<br/>
   */
  _parallaxZero: boolean;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: {@link Game_Map#initialize}.<br/>
   * Written in: {@link Game_Map#initialize}, {@link Game_Map#setupScroll}, {@link Game_Map#startScroll}.<br/>
   * Read in: {@link Game_Map#updateScroll}.<br/>
   */
  _scrollDirection: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: {@link Game_Map#initialize}.<br/>
   * Written in: {@link Game_Map#initialize}, {@link Game_Map#setupScroll}, {@link Game_Map#startScroll}, {@link Game_Map#updateScroll}.<br/>
   * Read in: {@link Game_Map#isScrolling}.<br/>
   */
  _scrollRest: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: {@link Game_Map#initialize}.<br/>
   * Written in: {@link Game_Map#initialize}, {@link Game_Map#setupScroll}, {@link Game_Map#startScroll}.<br/>
   * Read in: {@link Game_Map#scrollDistance}.<br/>
   */
  _scrollSpeed: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `unknown`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_Map#refreshTileEvents}.<br/>
   * Read in: {@link Game_Map#tileEventsXy}.<br/>
   */
  _tileEvents: unknown;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: {@link Game_Map#initialize}.<br/>
   * Written in: {@link Game_Map#changeTileset}, {@link Game_Map#initialize}, {@link Game_Map#setup}.<br/>
   * Read in: {@link Game_Map#tileset}, {@link Game_Map#tilesetId}.<br/>
   */
  _tilesetId: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `unknown[]`.<br/>
   * Initialized in: {@link Game_Map#initialize}.<br/>
   * Written in: {@link Game_Map#createVehicles}, {@link Game_Map#initialize}.<br/>
   * Read in: {@link Game_Map#airship}, {@link Game_Map#boat}, {@link Game_Map#createVehicles}, {@link Game_Map#refereshVehicles}, {@link Game_Map#ship}, {@link Game_Map#updateVehicles}, {@link Game_Map#vehicles}.<br/>
   */
  _vehicles: unknown[];
  /**
   * Gets adjust x.
   * @param x The x parameter.
   * @returns The result.
   */
  adjustX(x: unknown): unknown;
  /**
   * Gets adjust y.
   * @param y The y parameter.
   * @returns The result.
   */
  adjustY(y: unknown): unknown;
  /**
   * Gets airship.
   * @returns The result.
   */
  airship(): unknown;
  /**
   * Gets all tiles.
   * @param x The x parameter.
   * @param y The y parameter.
   * @returns The result.
   */
  allTiles(x: unknown, y: unknown): unknown;
  /**
   * Performs autoplay.
   */
  autoplay(): void;
  /**
   * Gets autorun common events.
   * @returns The result.
   */
  autorunCommonEvents(): unknown;
  /**
   * Gets autotile type.
   * @param x The x parameter.
   * @param y The y parameter.
   * @param z The z parameter.
   * @returns The result.
   */
  autotileType(x: unknown, y: unknown, z: unknown): number;
  /**
   * Gets battleback1 name.
   * @returns The result.
   */
  battleback1Name(): unknown;
  /**
   * Gets battleback2 name.
   * @returns The result.
   */
  battleback2Name(): unknown;
  /**
   * Gets boat.
   * @returns The result.
   */
  boat(): unknown;
  /**
   * Gets bush depth.
   * @returns The result.
   */
  bushDepth(): unknown;
  /**
   * Gets canvas to map x.
   * @param x The x parameter.
   * @returns The result.
   */
  canvasToMapX(x: unknown): unknown;
  /**
   * Gets canvas to map y.
   * @param y The y parameter.
   * @returns The result.
   */
  canvasToMapY(y: unknown): unknown;
  /**
   * Performs change battleback.
   * @param battleback1Name The battleback1Name parameter.
   * @param battleback2Name The battleback2Name parameter.
   */
  changeBattleback(battleback1Name: unknown, battleback2Name: unknown): void;
  /**
   * Performs change parallax.
   * @param name The name parameter.
   * @param loopX The loopX parameter.
   * @param loopY The loopY parameter.
   * @param sx The sx parameter.
   * @param sy The sy parameter.
   */
  changeParallax(name: unknown, loopX: unknown, loopY: unknown, sx: unknown, sy: unknown): void;
  /**
   * Performs change tileset.
   * @param tilesetId The tilesetId parameter.
   */
  changeTileset(tilesetId: unknown): void;
  /**
   * Gets check layered tiles flags.
   * @param x The x parameter.
   * @param y The y parameter.
   * @param bit The bit parameter.
   * @returns The result.
   */
  checkLayeredTilesFlags(x: unknown, y: unknown, bit: unknown): unknown;
  /**
   * Gets check passage.
   * @param x The x parameter.
   * @param y The y parameter.
   * @param bit The bit parameter.
   * @returns The result.
   */
  checkPassage(x: unknown, y: unknown, bit: unknown): boolean;
  /**
   * Creates vehicles.
   */
  createVehicles(): void;
  /**
   * Gets data.
   * @returns The result.
   */
  data(): unknown;
  /**
   * Gets delta x.
   * @param x1 The x1 parameter.
   * @param x2 The x2 parameter.
   * @returns The result.
   */
  deltaX(x1: unknown, x2: unknown): unknown;
  /**
   * Gets delta y.
   * @param y1 The y1 parameter.
   * @param y2 The y2 parameter.
   * @returns The result.
   */
  deltaY(y1: unknown, y2: unknown): unknown;
  /**
   * Performs disable name display.
   */
  disableNameDisplay(): void;
  /**
   * Gets display name.
   * @returns The result.
   */
  displayName(): unknown;
  /**
   * Gets display x.
   * @returns The result.
   */
  displayX(): unknown;
  /**
   * Gets display y.
   * @returns The result.
   */
  displayY(): unknown;
  /**
   * Gets distance.
   * @param x1 The x1 parameter.
   * @param y1 The y1 parameter.
   * @param x2 The x2 parameter.
   * @param y2 The y2 parameter.
   * @returns The result.
   */
  distance(x1: unknown, y1: unknown, x2: unknown, y2: unknown): unknown;
  /**
   * Performs do scroll.
   * @param direction The direction parameter.
   * @param distance The distance parameter.
   */
  doScroll(direction: unknown, distance: unknown): void;
  /**
   * Performs enable name display.
   */
  enableNameDisplay(): void;
  /**
   * Gets encounter list.
   * @returns The result.
   */
  encounterList(): unknown;
  /**
   * Gets encounter step.
   * @returns The result.
   */
  encounterStep(): unknown;
  /**
   * Performs erase event.
   * @param eventId The eventId parameter.
   */
  eraseEvent(eventId: unknown): void;
  /**
   * Gets event.
   * @param eventId The eventId parameter.
   * @returns The result.
   */
  event(eventId: unknown): Game_Event | undefined;
  /**
   * Gets event id xy.
   * @param x The x parameter.
   * @param y The y parameter.
   * @returns The result.
   */
  eventIdXy(x: unknown, y: unknown): number;
  /**
   * Gets events.
   * @returns The result.
   */
  events(): unknown;
  /**
   * Gets events xy.
   * @param x The x parameter.
   * @param y The y parameter.
   * @returns The result.
   */
  eventsXy(x: unknown, y: unknown): unknown;
  /**
   * Gets events xy nt.
   * @param x The x parameter.
   * @param y The y parameter.
   * @returns The result.
   */
  eventsXyNt(x: unknown, y: unknown): unknown;
  /**
   * Gets height.
   * @returns The result.
   */
  height(): unknown;
  /**
   * Initializes initialize.
   */
  initialize(): void;
  /**
   * Determines whether airship land ok.
   * @param x The x parameter.
   * @param y The y parameter.
   * @returns True if airship land ok; false otherwise.
   */
  isAirshipLandOk(x: unknown, y: unknown): boolean;
  /**
   * Determines whether any event starting.
   * @returns True if any event starting; false otherwise.
   */
  isAnyEventStarting(): boolean;
  /**
   * Determines whether boat passable.
   * @param x The x parameter.
   * @param y The y parameter.
   * @returns True if boat passable; false otherwise.
   */
  isBoatPassable(x: unknown, y: unknown): boolean;
  /**
   * Determines whether bush.
   * @param x The x parameter.
   * @param y The y parameter.
   * @returns True if bush; false otherwise.
   */
  isBush(x: unknown, y: unknown): boolean;
  /**
   * Determines whether counter.
   * @param x The x parameter.
   * @param y The y parameter.
   * @returns True if counter; false otherwise.
   */
  isCounter(x: unknown, y: unknown): boolean;
  /**
   * Determines whether damage floor.
   * @param x The x parameter.
   * @param y The y parameter.
   * @returns True if damage floor; false otherwise.
   */
  isDamageFloor(x: unknown, y: unknown): boolean;
  /**
   * Determines whether dash disabled.
   * @returns True if dash disabled; false otherwise.
   */
  isDashDisabled(): boolean;
  /**
   * Determines whether event running.
   * @returns True if event running; false otherwise.
   */
  isEventRunning(): boolean;
  /**
   * Determines whether ladder.
   * @param x The x parameter.
   * @param y The y parameter.
   * @returns True if ladder; false otherwise.
   */
  isLadder(x: unknown, y: unknown): boolean;
  /**
   * Determines whether loop horizontal.
   * @returns True if loop horizontal; false otherwise.
   */
  isLoopHorizontal(): boolean;
  /**
   * Determines whether loop vertical.
   * @returns True if loop vertical; false otherwise.
   */
  isLoopVertical(): boolean;
  /**
   * Determines whether name display enabled.
   * @returns True if name display enabled; false otherwise.
   */
  isNameDisplayEnabled(): boolean;
  /**
   * Determines whether overworld.
   * @returns True if overworld; false otherwise.
   */
  isOverworld(): boolean;
  /**
   * Determines whether passable.
   * @param x The x parameter.
   * @param y The y parameter.
   * @param d The d parameter.
   * @returns True if passable; false otherwise.
   */
  isPassable(x: unknown, y: unknown, d: unknown): boolean;
  /**
   * Determines whether scrolling.
   * @returns True if scrolling; false otherwise.
   */
  isScrolling(): boolean;
  /**
   * Determines whether ship passable.
   * @param x The x parameter.
   * @param y The y parameter.
   * @returns True if ship passable; false otherwise.
   */
  isShipPassable(x: unknown, y: unknown): boolean;
  /**
   * Determines whether valid.
   * @param x The x parameter.
   * @param y The y parameter.
   * @returns True if valid; false otherwise.
   */
  isValid(x: unknown, y: unknown): boolean;
  /**
   * Gets layered tiles.
   * @param x The x parameter.
   * @param y The y parameter.
   * @returns The result.
   */
  layeredTiles(x: unknown, y: unknown): unknown;
  /**
   * Gets map id.
   * @returns The result.
   */
  mapId(): unknown;
  /**
   * Gets parallax name.
   * @returns The result.
   */
  parallaxName(): unknown;
  /**
   * Gets parallax ox.
   * @returns The result.
   */
  parallaxOx(): number;
  /**
   * Gets parallax oy.
   * @returns The result.
   */
  parallaxOy(): number;
  /**
   * Gets parallel common events.
   * @returns The result.
   */
  parallelCommonEvents(): unknown;
  /**
   * Performs referesh vehicles.
   */
  refereshVehicles(): void;
  /**
   * Performs refresh.
   */
  refresh(): void;
  /**
   * Performs refresh if needed.
   */
  refreshIfNeeded(): void;
  /**
   * Performs refresh tile events.
   */
  refreshTileEvents(): void;
  /**
   * Gets region id.
   * @param x The x parameter.
   * @param y The y parameter.
   * @returns The result.
   */
  regionId(x: unknown, y: unknown): number;
  /**
   * Performs request refresh.
   */
  requestRefresh(): void;
  /**
   * Gets round x.
   * @param x The x parameter.
   * @returns The result.
   */
  roundX(x: unknown): unknown;
  /**
   * Gets round xwith direction.
   * @param x The x parameter.
   * @param d The d parameter.
   * @returns The result.
   */
  roundXWithDirection(x: unknown, d: unknown): unknown;
  /**
   * Gets round y.
   * @param y The y parameter.
   * @returns The result.
   */
  roundY(y: unknown): unknown;
  /**
   * Gets round ywith direction.
   * @param y The y parameter.
   * @param d The d parameter.
   * @returns The result.
   */
  roundYWithDirection(y: unknown, d: unknown): unknown;
  /**
   * Gets screen tile x.
   * @returns The result.
   */
  screenTileX(): unknown;
  /**
   * Gets screen tile y.
   * @returns The result.
   */
  screenTileY(): unknown;
  /**
   * Gets scroll distance.
   * @returns The result.
   */
  scrollDistance(): unknown;
  /**
   * Performs scroll down.
   * @param distance The distance parameter.
   */
  scrollDown(distance: unknown): void;
  /**
   * Performs scroll left.
   * @param distance The distance parameter.
   */
  scrollLeft(distance: unknown): void;
  /**
   * Performs scroll right.
   * @param distance The distance parameter.
   */
  scrollRight(distance: unknown): void;
  /**
   * Performs scroll up.
   * @param distance The distance parameter.
   */
  scrollUp(distance: unknown): void;
  /**
   * Sets display pos.
   * @param x The x parameter.
   * @param y The y parameter.
   */
  setDisplayPos(x: unknown, y: unknown): void;
  /**
   * Performs setup.
   * @param mapId The mapId parameter.
   */
  setup(mapId: unknown): void;
  /**
   * Gets setup autorun common event.
   * @returns The result.
   */
  setupAutorunCommonEvent(): boolean;
  /**
   * Performs setup battleback.
   */
  setupBattleback(): void;
  /**
   * Performs setup events.
   */
  setupEvents(): void;
  /**
   * Performs setup parallax.
   */
  setupParallax(): void;
  /**
   * Performs setup scroll.
   */
  setupScroll(): void;
  /**
   * Gets setup starting event.
   * @returns The result.
   */
  setupStartingEvent(): boolean;
  /**
   * Gets setup starting map event.
   * @returns The result.
   */
  setupStartingMapEvent(): boolean;
  /**
   * Gets setup test event.
   * @returns The result.
   */
  setupTestEvent(): boolean;
  /**
   * Gets ship.
   * @returns The result.
   */
  ship(): unknown;
  /**
   * Performs start scroll.
   * @param direction The direction parameter.
   * @param distance The distance parameter.
   * @param speed The speed parameter.
   */
  startScroll(direction: unknown, distance: unknown, speed: unknown): void;
  /**
   * Gets terrain tag.
   * @param x The x parameter.
   * @param y The y parameter.
   * @returns The result.
   */
  terrainTag(x: unknown, y: unknown): unknown;
  /**
   * Gets tile events xy.
   * @param x The x parameter.
   * @param y The y parameter.
   * @returns The result.
   */
  tileEventsXy(x: unknown, y: unknown): unknown;
  /**
   * Gets tile height.
   * @returns The result.
   */
  tileHeight(): unknown;
  /**
   * Gets tile id.
   * @param x The x parameter.
   * @param y The y parameter.
   * @param z The z parameter.
   * @returns The result.
   */
  tileId(x: unknown, y: unknown, z: unknown): number;
  /**
   * Gets tile width.
   * @returns The result.
   */
  tileWidth(): number;
  /**
   * Gets tileset.
   * @returns The result.
   */
  tileset(): unknown;
  /**
   * Gets tileset flags.
   * @returns The result.
   */
  tilesetFlags(): unknown[];
  /**
   * Gets tileset id.
   * @returns The result.
   */
  tilesetId(): unknown;
  /**
   * Performs unlock event.
   * @param eventId The eventId parameter.
   */
  unlockEvent(eventId: unknown): void;
  /**
   * Performs update.
   * @param sceneActive The sceneActive parameter.
   */
  update(sceneActive: unknown): void;
  /**
   * Updates events.
   */
  updateEvents(): void;
  /**
   * Updates interpreter.
   */
  updateInterpreter(): void;
  /**
   * Updates parallax.
   */
  updateParallax(): void;
  /**
   * Updates scroll.
   */
  updateScroll(): void;
  /**
   * Updates vehicles.
   */
  updateVehicles(): void;
  /**
   * Gets vehicle.
   * @param _type The type parameter.
   * @returns The result.
   */
  vehicle(_type: unknown): Game_Vehicle | null;
  /**
   * Gets vehicles.
   * @returns The result.
   */
  vehicles(): unknown;
  /**
   * Gets width.
   * @returns The result.
   */
  width(): unknown;
  /**
   * Gets x with direction.
   * @param x The x parameter.
   * @param d The d parameter.
   * @returns The result.
   */
  xWithDirection(x: unknown, d: unknown): unknown;
  /**
   * Gets y with direction.
   * @param y The y parameter.
   * @param d The d parameter.
   * @returns The result.
   */
  yWithDirection(y: unknown, d: unknown): unknown;
}
