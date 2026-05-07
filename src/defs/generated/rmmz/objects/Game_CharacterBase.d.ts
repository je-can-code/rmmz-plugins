/**
 * Generated from project/js/rmmz_objects.js
 * Class: Game_CharacterBase
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Game_CharacterBase
{
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_CharacterBase#initMembers}, {@link Game_CharacterBase#straighten}, {@link Game_CharacterBase#updateAnimation}, {@link Game_CharacterBase#updateAnimationCount}.<br/>
   * Read in: {@link Game_CharacterBase#updateAnimation}.<br/>
   */
  _animationCount: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_CharacterBase#initMembers}.<br/>
   * Read in: none.<br/>
   */
  _animationId: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `boolean`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_CharacterBase#endAnimation}, {@link Game_CharacterBase#initMembers}, {@link Game_CharacterBase#startAnimation}.<br/>
   * Read in: {@link Game_CharacterBase#isAnimationPlaying}.<br/>
   */
  _animationPlaying: boolean;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_CharacterBase#initMembers}.<br/>
   * Read in: none.<br/>
   */
  _balloonId: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `boolean`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_CharacterBase#endBalloon}, {@link Game_CharacterBase#initMembers}, {@link Game_CharacterBase#startBalloon}.<br/>
   * Read in: {@link Game_CharacterBase#isBalloonPlaying}.<br/>
   */
  _balloonPlaying: boolean;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_CharacterBase#initMembers}, {@link Game_CharacterBase#setBlendMode}.<br/>
   * Read in: {@link Game_CharacterBase#blendMode}.<br/>
   */
  _blendMode: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_CharacterBase#initMembers}, {@link Game_CharacterBase#refreshBushDepth}.<br/>
   * Read in: {@link Game_CharacterBase#bushDepth}.<br/>
   */
  _bushDepth: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_CharacterBase#initMembers}, {@link Game_CharacterBase#setImage}, {@link Game_CharacterBase#setTileImage}.<br/>
   * Read in: {@link Game_CharacterBase#characterIndex}.<br/>
   */
  _characterIndex: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `string`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_CharacterBase#initMembers}, {@link Game_CharacterBase#setImage}, {@link Game_CharacterBase#setTileImage}.<br/>
   * Read in: {@link Game_CharacterBase#characterName}.<br/>
   */
  _characterName: string;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_CharacterBase#copyPosition}, {@link Game_CharacterBase#initMembers}, {@link Game_CharacterBase#setDirection}.<br/>
   * Read in: {@link Game_CharacterBase#direction}, {@link Game_CharacterBase#moveDiagonally}.<br/>
   */
  _direction: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `boolean`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_CharacterBase#initMembers}, {@link Game_CharacterBase#setDirectionFix}.<br/>
   * Read in: {@link Game_CharacterBase#isDirectionFixed}.<br/>
   */
  _directionFix: boolean;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `boolean`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_CharacterBase#initMembers}, {@link Game_CharacterBase#setImage}, {@link Game_CharacterBase#setTileImage}.<br/>
   * Read in: {@link Game_CharacterBase#isObjectCharacter}.<br/>
   */
  _isObjectCharacter: boolean;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_CharacterBase#initMembers}, {@link Game_CharacterBase#jump}, {@link Game_CharacterBase#updateJump}.<br/>
   * Read in: {@link Game_CharacterBase#isJumping}, {@link Game_CharacterBase#jumpHeight}, {@link Game_CharacterBase#updateJump}.<br/>
   */
  _jumpCount: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_CharacterBase#initMembers}, {@link Game_CharacterBase#jump}.<br/>
   * Read in: {@link Game_CharacterBase#jump}, {@link Game_CharacterBase#jumpHeight}.<br/>
   */
  _jumpPeak: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_CharacterBase#initMembers}, {@link Game_CharacterBase#setMoveFrequency}.<br/>
   * Read in: {@link Game_CharacterBase#moveFrequency}.<br/>
   */
  _moveFrequency: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_CharacterBase#initMembers}, {@link Game_CharacterBase#setMoveSpeed}.<br/>
   * Read in: {@link Game_CharacterBase#jump}, {@link Game_CharacterBase#moveSpeed}, {@link Game_CharacterBase#realMoveSpeed}.<br/>
   */
  _moveSpeed: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `boolean`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_CharacterBase#initMembers}, {@link Game_CharacterBase#setMovementSuccess}.<br/>
   * Read in: {@link Game_CharacterBase#isMovementSucceeded}.<br/>
   */
  _movementSuccess: boolean;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_CharacterBase#initMembers}, {@link Game_CharacterBase#setOpacity}.<br/>
   * Read in: {@link Game_CharacterBase#opacity}.<br/>
   */
  _opacity: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_CharacterBase#initMembers}, {@link Game_CharacterBase#setPattern}, {@link Game_CharacterBase#straighten}, {@link Game_CharacterBase#updatePattern}.<br/>
   * Read in: {@link Game_CharacterBase#pattern}, {@link Game_CharacterBase#updatePattern}.<br/>
   */
  _pattern: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_CharacterBase#initMembers}, {@link Game_CharacterBase#setPriorityType}.<br/>
   * Read in: {@link Game_CharacterBase#isNormalPriority}, {@link Game_CharacterBase#isTile}, {@link Game_CharacterBase#screenZ}.<br/>
   */
  _priorityType: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_CharacterBase#copyPosition}, {@link Game_CharacterBase#initMembers}, {@link Game_CharacterBase#moveDiagonally}, {@link Game_CharacterBase#moveStraight}, {@link Game_CharacterBase#setPosition}, {@link Game_CharacterBase#updateJump}, {@link Game_CharacterBase#updateMove}.<br/>
   * Read in: {@link Game_CharacterBase#isMoving}, {@link Game_CharacterBase#scrolledX}, {@link Game_CharacterBase#updateJump}, {@link Game_CharacterBase#updateMove}.<br/>
   */
  _realX: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_CharacterBase#copyPosition}, {@link Game_CharacterBase#initMembers}, {@link Game_CharacterBase#moveDiagonally}, {@link Game_CharacterBase#moveStraight}, {@link Game_CharacterBase#setPosition}, {@link Game_CharacterBase#updateJump}, {@link Game_CharacterBase#updateMove}.<br/>
   * Read in: {@link Game_CharacterBase#isMoving}, {@link Game_CharacterBase#scrolledY}, {@link Game_CharacterBase#updateJump}, {@link Game_CharacterBase#updateMove}.<br/>
   */
  _realY: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `boolean`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_CharacterBase#initMembers}, {@link Game_CharacterBase#setStepAnime}.<br/>
   * Read in: {@link Game_CharacterBase#hasStepAnime}.<br/>
   */
  _stepAnime: boolean;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_CharacterBase#initMembers}, {@link Game_CharacterBase#resetStopCount}, {@link Game_CharacterBase#updateStop}.<br/>
   * Read in: {@link Game_CharacterBase#checkStop}, {@link Game_CharacterBase#updatePattern}.<br/>
   */
  _stopCount: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `boolean`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_CharacterBase#initMembers}, {@link Game_CharacterBase#setThrough}.<br/>
   * Read in: {@link Game_CharacterBase#isThrough}.<br/>
   */
  _through: boolean;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_CharacterBase#initMembers}, {@link Game_CharacterBase#setImage}, {@link Game_CharacterBase#setTileImage}.<br/>
   * Read in: {@link Game_CharacterBase#isTile}, {@link Game_CharacterBase#tileId}.<br/>
   */
  _tileId: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `boolean`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_CharacterBase#initMembers}, {@link Game_CharacterBase#setTransparent}.<br/>
   * Read in: {@link Game_CharacterBase#isTransparent}.<br/>
   */
  _transparent: boolean;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `boolean`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_CharacterBase#initMembers}, {@link Game_CharacterBase#setWalkAnime}.<br/>
   * Read in: {@link Game_CharacterBase#hasWalkAnime}.<br/>
   */
  _walkAnime: boolean;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_CharacterBase#copyPosition}, {@link Game_CharacterBase#initMembers}, {@link Game_CharacterBase#jump}, {@link Game_CharacterBase#moveDiagonally}, {@link Game_CharacterBase#moveStraight}, {@link Game_CharacterBase#setPosition}, {@link Game_CharacterBase#updateJump}.<br/>
   * Read in: {@link Game_CharacterBase#checkEventTriggerTouchFront}, {@link Game_CharacterBase#isMoving}, {@link Game_CharacterBase#isOnBush}, {@link Game_CharacterBase#isOnLadder}, {@link Game_CharacterBase#moveDiagonally}, {@link Game_CharacterBase#moveStraight}, {@link Game_CharacterBase#pos}, {@link Game_CharacterBase#regionId}, {@link Game_CharacterBase#terrainTag}, {@link Game_CharacterBase#updateJump}, {@link Game_CharacterBase#updateMove}.<br/>
   */
  _x: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_CharacterBase#copyPosition}, {@link Game_CharacterBase#initMembers}, {@link Game_CharacterBase#jump}, {@link Game_CharacterBase#moveDiagonally}, {@link Game_CharacterBase#moveStraight}, {@link Game_CharacterBase#setPosition}, {@link Game_CharacterBase#updateJump}.<br/>
   * Read in: {@link Game_CharacterBase#checkEventTriggerTouchFront}, {@link Game_CharacterBase#isMoving}, {@link Game_CharacterBase#isOnBush}, {@link Game_CharacterBase#isOnLadder}, {@link Game_CharacterBase#moveDiagonally}, {@link Game_CharacterBase#moveStraight}, {@link Game_CharacterBase#pos}, {@link Game_CharacterBase#regionId}, {@link Game_CharacterBase#terrainTag}, {@link Game_CharacterBase#updateJump}, {@link Game_CharacterBase#updateMove}.<br/>
   */
  _y: number;
  /**
   * Gets animation wait.
   * @returns The result.
   */
  animationWait(): unknown;
  /**
   * Gets blend mode.
   * @returns The result.
   */
  blendMode(): unknown;
  /**
   * Gets bush depth.
   * @returns The result.
   */
  bushDepth(): unknown;
  /**
   * Determines whether pass.
   * @param x The x parameter.
   * @param y The y parameter.
   * @param d The d parameter.
   * @returns True if pass; false otherwise.
   */
  canPass(x: unknown, y: unknown, d: unknown): boolean;
  /**
   * Determines whether pass diagonally.
   * @param x The x parameter.
   * @param y The y parameter.
   * @param horz The horz parameter.
   * @param vert The vert parameter.
   * @returns True if pass diagonally; false otherwise.
   */
  canPassDiagonally(x: unknown, y: unknown, horz: unknown, vert: unknown): boolean;
  /**
   * Gets character index.
   * @returns The result.
   */
  characterIndex(): unknown;
  /**
   * Gets character name.
   * @returns The result.
   */
  characterName(): unknown;
  /**
   * Gets check event trigger touch.
   * @returns The result.
   */
  checkEventTriggerTouch(): boolean;
  /**
   * Performs check event trigger touch front.
   * @param d The d parameter.
   */
  checkEventTriggerTouchFront(d: unknown): void;
  /**
   * Gets check stop.
   * @param threshold The threshold parameter.
   * @returns The result.
   */
  checkStop(threshold: unknown): boolean;
  /**
   * Performs copy position.
   * @param character The character parameter.
   */
  copyPosition(character: unknown): void;
  /**
   * Gets direction.
   * @returns The result.
   */
  direction(): unknown;
  /**
   * Gets distance per frame.
   * @returns The result.
   */
  distancePerFrame(): unknown;
  /**
   * Performs end animation.
   */
  endAnimation(): void;
  /**
   * Performs end balloon.
   */
  endBalloon(): void;
  /**
   * Determines whether step anime.
   * @returns True if step anime; false otherwise.
   */
  hasStepAnime(): boolean;
  /**
   * Determines whether walk anime.
   * @returns True if walk anime; false otherwise.
   */
  hasWalkAnime(): boolean;
  /**
   * Performs increase steps.
   */
  increaseSteps(): void;
  /**
   * Initializes members.
   */
  initMembers(): void;
  /**
   * Initializes initialize.
   */
  initialize(): void;
  /**
   * Determines whether animation playing.
   * @returns True if animation playing; false otherwise.
   */
  isAnimationPlaying(): boolean;
  /**
   * Determines whether balloon playing.
   * @returns True if balloon playing; false otherwise.
   */
  isBalloonPlaying(): boolean;
  /**
   * Determines whether collided with characters.
   * @param x The x parameter.
   * @param y The y parameter.
   * @returns True if collided with characters; false otherwise.
   */
  isCollidedWithCharacters(x: unknown, y: unknown): boolean;
  /**
   * Determines whether collided with events.
   * @param x The x parameter.
   * @param y The y parameter.
   * @returns True if collided with events; false otherwise.
   */
  isCollidedWithEvents(x: unknown, y: unknown): boolean;
  /**
   * Determines whether collided with vehicles.
   * @param x The x parameter.
   * @param y The y parameter.
   * @returns True if collided with vehicles; false otherwise.
   */
  isCollidedWithVehicles(x: unknown, y: unknown): boolean;
  /**
   * Determines whether dashing.
   * @returns True if dashing; false otherwise.
   */
  isDashing(): boolean;
  /**
   * Determines whether debug through.
   * @returns True if debug through; false otherwise.
   */
  isDebugThrough(): boolean;
  /**
   * Determines whether direction fixed.
   * @returns True if direction fixed; false otherwise.
   */
  isDirectionFixed(): boolean;
  /**
   * Determines whether jumping.
   * @returns True if jumping; false otherwise.
   */
  isJumping(): boolean;
  /**
   * Determines whether map passable.
   * @param x The x parameter.
   * @param y The y parameter.
   * @param d The d parameter.
   * @returns True if map passable; false otherwise.
   */
  isMapPassable(x: unknown, y: unknown, d: unknown): boolean;
  /**
   * Determines whether movement succeeded.
   * @returns True if movement succeeded; false otherwise.
   */
  isMovementSucceeded(): boolean;
  /**
   * Determines whether moving.
   * @returns True if moving; false otherwise.
   */
  isMoving(): boolean;
  /**
   * Determines whether near the screen.
   * @returns True if near the screen; false otherwise.
   */
  isNearTheScreen(): boolean;
  /**
   * Determines whether normal priority.
   * @returns True if normal priority; false otherwise.
   */
  isNormalPriority(): boolean;
  /**
   * Determines whether object character.
   * @returns True if object character; false otherwise.
   */
  isObjectCharacter(): boolean;
  /**
   * Determines whether on bush.
   * @returns True if on bush; false otherwise.
   */
  isOnBush(): boolean;
  /**
   * Determines whether on ladder.
   * @returns True if on ladder; false otherwise.
   */
  isOnLadder(): boolean;
  /**
   * Determines whether original pattern.
   * @returns True if original pattern; false otherwise.
   */
  isOriginalPattern(): boolean;
  /**
   * Determines whether stopping.
   * @returns True if stopping; false otherwise.
   */
  isStopping(): boolean;
  /**
   * Determines whether through.
   * @returns True if through; false otherwise.
   */
  isThrough(): boolean;
  /**
   * Determines whether tile.
   * @returns True if tile; false otherwise.
   */
  isTile(): boolean;
  /**
   * Determines whether transparent.
   * @returns True if transparent; false otherwise.
   */
  isTransparent(): boolean;
  /**
   * Performs jump.
   * @param xPlus The xPlus parameter.
   * @param yPlus The yPlus parameter.
   */
  jump(xPlus: unknown, yPlus: unknown): void;
  /**
   * Gets jump height.
   * @returns The result.
   */
  jumpHeight(): unknown;
  /**
   * Performs locate.
   * @param x The x parameter.
   * @param y The y parameter.
   */
  locate(x: unknown, y: unknown): void;
  /**
   * Gets max pattern.
   * @returns The result.
   */
  maxPattern(): number;
  /**
   * Performs move diagonally.
   * @param horz The horz parameter.
   * @param vert The vert parameter.
   */
  moveDiagonally(horz: unknown, vert: unknown): void;
  /**
   * Gets move frequency.
   * @returns The result.
   */
  moveFrequency(): unknown;
  /**
   * Gets move speed.
   * @returns The result.
   */
  moveSpeed(): unknown;
  /**
   * Performs move straight.
   * @param d The d parameter.
   */
  moveStraight(d: unknown): void;
  /**
   * Gets opacity.
   * @returns The result.
   */
  opacity(): unknown;
  /**
   * Gets pattern.
   * @returns The result.
   */
  pattern(): number;
  /**
   * Gets pos.
   * @param x The x parameter.
   * @param y The y parameter.
   * @returns The result.
   */
  pos(x: unknown, y: unknown): boolean;
  /**
   * Gets pos nt.
   * @param x The x parameter.
   * @param y The y parameter.
   * @returns The result.
   */
  posNt(x: unknown, y: unknown): boolean;
  /**
   * Gets real move speed.
   * @returns The result.
   */
  realMoveSpeed(): unknown;
  /**
   * Performs refresh bush depth.
   */
  refreshBushDepth(): void;
  /**
   * Gets region id.
   * @returns The result.
   */
  regionId(): unknown;
  /**
   * Clears pattern.
   */
  resetPattern(): void;
  /**
   * Clears stop count.
   */
  resetStopCount(): void;
  /**
   * Gets reverse dir.
   * @param d The d parameter.
   * @returns The result.
   */
  reverseDir(d: unknown): unknown;
  /**
   * Gets screen x.
   * @returns The result.
   */
  screenX(): unknown;
  /**
   * Gets screen y.
   * @returns The result.
   */
  screenY(): unknown;
  /**
   * Gets screen z.
   * @returns The result.
   */
  screenZ(): unknown;
  /**
   * Gets scrolled x.
   * @returns The result.
   */
  scrolledX(): unknown;
  /**
   * Gets scrolled y.
   * @returns The result.
   */
  scrolledY(): unknown;
  /**
   * Sets blend mode.
   * @param blendMode The blendMode parameter.
   */
  setBlendMode(blendMode: unknown): void;
  /**
   * Sets direction.
   * @param d The d parameter.
   */
  setDirection(d: unknown): void;
  /**
   * Sets direction fix.
   * @param directionFix The directionFix parameter.
   */
  setDirectionFix(directionFix: unknown): void;
  /**
   * Sets image.
   * @param characterName The characterName parameter.
   * @param characterIndex The characterIndex parameter.
   */
  setImage(characterName: unknown, characterIndex: unknown): void;
  /**
   * Sets move frequency.
   * @param moveFrequency The moveFrequency parameter.
   */
  setMoveFrequency(moveFrequency: unknown): void;
  /**
   * Sets move speed.
   * @param moveSpeed The moveSpeed parameter.
   */
  setMoveSpeed(moveSpeed: unknown): void;
  /**
   * Sets movement success.
   * @param success The success parameter.
   */
  setMovementSuccess(success: unknown): void;
  /**
   * Sets opacity.
   * @param opacity The opacity parameter.
   */
  setOpacity(opacity: unknown): void;
  /**
   * Sets pattern.
   * @param pattern The pattern parameter.
   */
  setPattern(pattern: unknown): void;
  /**
   * Sets position.
   * @param x The x parameter.
   * @param y The y parameter.
   */
  setPosition(x: unknown, y: unknown): void;
  /**
   * Sets priority type.
   * @param priorityType The priorityType parameter.
   */
  setPriorityType(priorityType: unknown): void;
  /**
   * Sets step anime.
   * @param stepAnime The stepAnime parameter.
   */
  setStepAnime(stepAnime: unknown): void;
  /**
   * Sets through.
   * @param through The through parameter.
   */
  setThrough(through: unknown): void;
  /**
   * Sets tile image.
   * @param tileId The tileId parameter.
   */
  setTileImage(tileId: unknown): void;
  /**
   * Sets transparent.
   * @param transparent The transparent parameter.
   */
  setTransparent(transparent: unknown): void;
  /**
   * Sets walk anime.
   * @param walkAnime The walkAnime parameter.
   */
  setWalkAnime(walkAnime: unknown): void;
  /**
   * Gets shift y.
   * @returns The result.
   */
  shiftY(): number;
  /**
   * Performs start animation.
   */
  startAnimation(): void;
  /**
   * Performs start balloon.
   */
  startBalloon(): void;
  /**
   * Performs straighten.
   */
  straighten(): void;
  /**
   * Gets terrain tag.
   * @returns The result.
   */
  terrainTag(): unknown;
  /**
   * Gets tile id.
   * @returns The result.
   */
  tileId(): unknown;
  /**
   * Performs update.
   */
  update(): void;
  /**
   * Updates animation.
   */
  updateAnimation(): void;
  /**
   * Updates animation count.
   */
  updateAnimationCount(): void;
  /**
   * Updates jump.
   */
  updateJump(): void;
  /**
   * Updates move.
   */
  updateMove(): void;
  /**
   * Updates pattern.
   */
  updatePattern(): void;
  /**
   * Updates stop.
   */
  updateStop(): void;
  /**
   * Gets x.
   * @returns The result.
   */
  get x(): unknown;
  /**
   * Gets y.
   * @returns The result.
   */
  get y(): unknown;
}
