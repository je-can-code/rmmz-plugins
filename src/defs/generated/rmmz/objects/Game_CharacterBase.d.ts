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
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: none.
   * Written in: {@link Game_CharacterBase#initMembers}, {@link Game_CharacterBase#straighten}, {@link Game_CharacterBase#updateAnimation}, {@link Game_CharacterBase#updateAnimationCount}.
   * Read in: {@link Game_CharacterBase#updateAnimation}.
   */
  _animationCount: number;
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: none.
   * Written in: {@link Game_CharacterBase#initMembers}.
   * Read in: none.
   */
  _animationId: number;
  /**
   * Inferred engine backing field.
   *
   * Type: `boolean`.
   * Initialized in: none.
   * Written in: {@link Game_CharacterBase#endAnimation}, {@link Game_CharacterBase#initMembers}, {@link Game_CharacterBase#startAnimation}.
   * Read in: {@link Game_CharacterBase#isAnimationPlaying}.
   */
  _animationPlaying: boolean;
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: none.
   * Written in: {@link Game_CharacterBase#initMembers}.
   * Read in: none.
   */
  _balloonId: number;
  /**
   * Inferred engine backing field.
   *
   * Type: `boolean`.
   * Initialized in: none.
   * Written in: {@link Game_CharacterBase#endBalloon}, {@link Game_CharacterBase#initMembers}, {@link Game_CharacterBase#startBalloon}.
   * Read in: {@link Game_CharacterBase#isBalloonPlaying}.
   */
  _balloonPlaying: boolean;
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: none.
   * Written in: {@link Game_CharacterBase#initMembers}, {@link Game_CharacterBase#setBlendMode}.
   * Read in: {@link Game_CharacterBase#blendMode}.
   */
  _blendMode: number;
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: none.
   * Written in: {@link Game_CharacterBase#initMembers}, {@link Game_CharacterBase#refreshBushDepth}.
   * Read in: {@link Game_CharacterBase#bushDepth}.
   */
  _bushDepth: number;
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: none.
   * Written in: {@link Game_CharacterBase#initMembers}, {@link Game_CharacterBase#setImage}, {@link Game_CharacterBase#setTileImage}.
   * Read in: {@link Game_CharacterBase#characterIndex}.
   */
  _characterIndex: number;
  /**
   * Inferred engine backing field.
   *
   * Type: `string`.
   * Initialized in: none.
   * Written in: {@link Game_CharacterBase#initMembers}, {@link Game_CharacterBase#setImage}, {@link Game_CharacterBase#setTileImage}.
   * Read in: {@link Game_CharacterBase#characterName}.
   */
  _characterName: string;
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: none.
   * Written in: {@link Game_CharacterBase#copyPosition}, {@link Game_CharacterBase#initMembers}, {@link Game_CharacterBase#setDirection}.
   * Read in: {@link Game_CharacterBase#direction}, {@link Game_CharacterBase#moveDiagonally}.
   */
  _direction: number;
  /**
   * Inferred engine backing field.
   *
   * Type: `boolean`.
   * Initialized in: none.
   * Written in: {@link Game_CharacterBase#initMembers}, {@link Game_CharacterBase#setDirectionFix}.
   * Read in: {@link Game_CharacterBase#isDirectionFixed}.
   */
  _directionFix: boolean;
  /**
   * Inferred engine backing field.
   *
   * Type: `boolean`.
   * Initialized in: none.
   * Written in: {@link Game_CharacterBase#initMembers}, {@link Game_CharacterBase#setImage}, {@link Game_CharacterBase#setTileImage}.
   * Read in: {@link Game_CharacterBase#isObjectCharacter}.
   */
  _isObjectCharacter: boolean;
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: none.
   * Written in: {@link Game_CharacterBase#initMembers}, {@link Game_CharacterBase#jump}, {@link Game_CharacterBase#updateJump}.
   * Read in: {@link Game_CharacterBase#isJumping}, {@link Game_CharacterBase#jumpHeight}, {@link Game_CharacterBase#updateJump}.
   */
  _jumpCount: number;
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: none.
   * Written in: {@link Game_CharacterBase#initMembers}, {@link Game_CharacterBase#jump}.
   * Read in: {@link Game_CharacterBase#jump}, {@link Game_CharacterBase#jumpHeight}.
   */
  _jumpPeak: number;
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: none.
   * Written in: {@link Game_CharacterBase#initMembers}, {@link Game_CharacterBase#setMoveFrequency}.
   * Read in: {@link Game_CharacterBase#moveFrequency}.
   */
  _moveFrequency: number;
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: none.
   * Written in: {@link Game_CharacterBase#initMembers}, {@link Game_CharacterBase#setMoveSpeed}.
   * Read in: {@link Game_CharacterBase#jump}, {@link Game_CharacterBase#moveSpeed}, {@link Game_CharacterBase#realMoveSpeed}.
   */
  _moveSpeed: number;
  /**
   * Inferred engine backing field.
   *
   * Type: `boolean`.
   * Initialized in: none.
   * Written in: {@link Game_CharacterBase#initMembers}, {@link Game_CharacterBase#setMovementSuccess}.
   * Read in: {@link Game_CharacterBase#isMovementSucceeded}.
   */
  _movementSuccess: boolean;
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: none.
   * Written in: {@link Game_CharacterBase#initMembers}, {@link Game_CharacterBase#setOpacity}.
   * Read in: {@link Game_CharacterBase#opacity}.
   */
  _opacity: number;
  /**
   * Inferred engine backing field.
   *
   * Type: `number | string`.
   * Initialized in: none.
   * Written in: {@link Game_CharacterBase#initMembers}, {@link Game_CharacterBase#setPattern}, {@link Game_CharacterBase#straighten}, {@link Game_CharacterBase#updatePattern}.
   * Read in: {@link Game_CharacterBase#pattern}, {@link Game_CharacterBase#updatePattern}.
   */
  _pattern: number | string;
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: none.
   * Written in: {@link Game_CharacterBase#initMembers}, {@link Game_CharacterBase#setPriorityType}.
   * Read in: {@link Game_CharacterBase#isNormalPriority}, {@link Game_CharacterBase#isTile}, {@link Game_CharacterBase#screenZ}.
   */
  _priorityType: number;
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: none.
   * Written in: {@link Game_CharacterBase#copyPosition}, {@link Game_CharacterBase#initMembers}, {@link Game_CharacterBase#moveDiagonally}, {@link Game_CharacterBase#moveStraight}, {@link Game_CharacterBase#setPosition}, {@link Game_CharacterBase#updateJump}, {@link Game_CharacterBase#updateMove}.
   * Read in: {@link Game_CharacterBase#isMoving}, {@link Game_CharacterBase#scrolledX}, {@link Game_CharacterBase#updateJump}, {@link Game_CharacterBase#updateMove}.
   */
  _realX: number;
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: none.
   * Written in: {@link Game_CharacterBase#copyPosition}, {@link Game_CharacterBase#initMembers}, {@link Game_CharacterBase#moveDiagonally}, {@link Game_CharacterBase#moveStraight}, {@link Game_CharacterBase#setPosition}, {@link Game_CharacterBase#updateJump}, {@link Game_CharacterBase#updateMove}.
   * Read in: {@link Game_CharacterBase#isMoving}, {@link Game_CharacterBase#scrolledY}, {@link Game_CharacterBase#updateJump}, {@link Game_CharacterBase#updateMove}.
   */
  _realY: number;
  /**
   * Inferred engine backing field.
   *
   * Type: `boolean`.
   * Initialized in: none.
   * Written in: {@link Game_CharacterBase#initMembers}, {@link Game_CharacterBase#setStepAnime}.
   * Read in: {@link Game_CharacterBase#hasStepAnime}.
   */
  _stepAnime: boolean;
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: none.
   * Written in: {@link Game_CharacterBase#initMembers}, {@link Game_CharacterBase#resetStopCount}, {@link Game_CharacterBase#updateStop}.
   * Read in: {@link Game_CharacterBase#checkStop}, {@link Game_CharacterBase#updatePattern}.
   */
  _stopCount: number;
  /**
   * Inferred engine backing field.
   *
   * Type: `boolean`.
   * Initialized in: none.
   * Written in: {@link Game_CharacterBase#initMembers}, {@link Game_CharacterBase#setThrough}.
   * Read in: {@link Game_CharacterBase#isThrough}.
   */
  _through: boolean;
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: none.
   * Written in: {@link Game_CharacterBase#initMembers}, {@link Game_CharacterBase#setImage}, {@link Game_CharacterBase#setTileImage}.
   * Read in: {@link Game_CharacterBase#isTile}, {@link Game_CharacterBase#tileId}.
   */
  _tileId: number;
  /**
   * Inferred engine backing field.
   *
   * Type: `boolean`.
   * Initialized in: none.
   * Written in: {@link Game_CharacterBase#initMembers}, {@link Game_CharacterBase#setTransparent}.
   * Read in: {@link Game_CharacterBase#isTransparent}.
   */
  _transparent: boolean;
  /**
   * Inferred engine backing field.
   *
   * Type: `boolean`.
   * Initialized in: none.
   * Written in: {@link Game_CharacterBase#initMembers}, {@link Game_CharacterBase#setWalkAnime}.
   * Read in: {@link Game_CharacterBase#hasWalkAnime}.
   */
  _walkAnime: boolean;
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: none.
   * Written in: {@link Game_CharacterBase#copyPosition}, {@link Game_CharacterBase#initMembers}, {@link Game_CharacterBase#jump}, {@link Game_CharacterBase#moveDiagonally}, {@link Game_CharacterBase#moveStraight}, {@link Game_CharacterBase#setPosition}, {@link Game_CharacterBase#updateJump}.
   * Read in: {@link Game_CharacterBase#checkEventTriggerTouchFront}, {@link Game_CharacterBase#isMoving}, {@link Game_CharacterBase#isOnBush}, {@link Game_CharacterBase#isOnLadder}, {@link Game_CharacterBase#moveDiagonally}, {@link Game_CharacterBase#moveStraight}, {@link Game_CharacterBase#pos}, {@link Game_CharacterBase#regionId}, {@link Game_CharacterBase#terrainTag}, {@link Game_CharacterBase#updateJump}, {@link Game_CharacterBase#updateMove}.
   */
  _x: number;
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: none.
   * Written in: {@link Game_CharacterBase#copyPosition}, {@link Game_CharacterBase#initMembers}, {@link Game_CharacterBase#jump}, {@link Game_CharacterBase#moveDiagonally}, {@link Game_CharacterBase#moveStraight}, {@link Game_CharacterBase#setPosition}, {@link Game_CharacterBase#updateJump}.
   * Read in: {@link Game_CharacterBase#checkEventTriggerTouchFront}, {@link Game_CharacterBase#isMoving}, {@link Game_CharacterBase#isOnBush}, {@link Game_CharacterBase#isOnLadder}, {@link Game_CharacterBase#moveDiagonally}, {@link Game_CharacterBase#moveStraight}, {@link Game_CharacterBase#pos}, {@link Game_CharacterBase#regionId}, {@link Game_CharacterBase#terrainTag}, {@link Game_CharacterBase#updateJump}, {@link Game_CharacterBase#updateMove}.
   */
  _y: number;
  /**
   * Gets animation wait.
   * @returns The result.
   */
  animationWait(): number;
  /**
   * Gets blend mode.
   * @returns The result.
   */
  blendMode(): number;
  /**
   * Gets bush depth.
   * @returns The result.
   */
  bushDepth(): number;
  /**
   * Determines whether pass.
   * @param x The x parameter.
   * @param y The y parameter.
   * @param d The d parameter.
   * @returns True if pass; false otherwise.
   */
  canPass(x: number, y: number, d: number): boolean;
  /**
   * Determines whether pass diagonally.
   * @param x The x parameter.
   * @param y The y parameter.
   * @param horz The horz parameter.
   * @param vert The vert parameter.
   * @returns True if pass diagonally; false otherwise.
   */
  canPassDiagonally(x: number, y: number, horz: number, vert: number): boolean;
  /**
   * Gets character index.
   * @returns The result.
   */
  characterIndex(): number;
  /**
   * Gets character name.
   * @returns The result.
   */
  characterName(): string;
  /**
   * Gets check event trigger touch.
   * @returns The result.
   */
  checkEventTriggerTouch(): boolean;
  /**
   * Performs check event trigger touch front.
   * @param d The d parameter.
   */
  checkEventTriggerTouchFront(d: number): void;
  /**
   * Gets check stop.
   * @param threshold The threshold parameter.
   * @returns The result.
   */
  checkStop(threshold: number): boolean;
  /**
   * Performs copy position.
   * @param character The character parameter.
   */
  copyPosition(character: Game_Character): void;
  /**
   * Gets direction.
   * @returns The result.
   */
  direction(): number;
  /**
   * Gets distance per frame.
   * @returns The result.
   */
  distancePerFrame(): number;
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
  isCollidedWithCharacters(x: number, y: number): boolean;
  /**
   * Determines whether collided with events.
   * @param x The x parameter.
   * @param y The y parameter.
   * @returns True if collided with events; false otherwise.
   */
  isCollidedWithEvents(x: number, y: number): boolean;
  /**
   * Determines whether collided with vehicles.
   * @param x The x parameter.
   * @param y The y parameter.
   * @returns True if collided with vehicles; false otherwise.
   */
  isCollidedWithVehicles(x: number, y: number): boolean;
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
  isMapPassable(x: number, y: number, d: number): boolean;
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
  jump(xPlus: number, yPlus: number): void;
  /**
   * Gets jump height.
   * @returns The result.
   */
  jumpHeight(): number;
  /**
   * Performs locate.
   * @param x The x parameter.
   * @param y The y parameter.
   */
  locate(x: number, y: number): void;
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
  moveDiagonally(horz: number, vert: number): void;
  /**
   * Gets move frequency.
   * @returns The result.
   */
  moveFrequency(): number;
  /**
   * Gets move speed.
   * @returns The result.
   */
  moveSpeed(): number;
  /**
   * Performs move straight.
   * @param d The d parameter.
   */
  moveStraight(d: number): void;
  /**
   * Gets opacity.
   * @returns The result.
   */
  opacity(): number;
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
  pos(x: number, y: number): boolean;
  /**
   * Gets pos nt.
   * @param x The x parameter.
   * @param y The y parameter.
   * @returns The result.
   */
  posNt(x: number, y: number): boolean;
  /**
   * Gets real move speed.
   * @returns The result.
   */
  realMoveSpeed(): number;
  /**
   * Performs refresh bush depth.
   */
  refreshBushDepth(): void;
  /**
   * Gets region id.
   * @returns The result.
   */
  regionId(): number;
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
  reverseDir(d: number): number;
  /**
   * Gets screen x.
   * @returns The result.
   */
  screenX(): number;
  /**
   * Gets screen y.
   * @returns The result.
   */
  screenY(): number;
  /**
   * Gets screen z.
   * @returns The result.
   */
  screenZ(): number;
  /**
   * Gets scrolled x.
   * @returns The result.
   */
  scrolledX(): number;
  /**
   * Gets scrolled y.
   * @returns The result.
   */
  scrolledY(): number;
  /**
   * Sets blend mode.
   * @param blendMode The blendMode parameter.
   */
  setBlendMode(blendMode: number): void;
  /**
   * Sets direction.
   * @param d The d parameter.
   */
  setDirection(d: number): void;
  /**
   * Sets direction fix.
   * @param directionFix The directionFix parameter.
   */
  setDirectionFix(directionFix: boolean): void;
  /**
   * Sets image.
   * @param characterName The characterName parameter.
   * @param characterIndex The characterIndex parameter.
   */
  setImage(characterName: string, characterIndex: number): void;
  /**
   * Sets move frequency.
   * @param moveFrequency The moveFrequency parameter.
   */
  setMoveFrequency(moveFrequency: number): void;
  /**
   * Sets move speed.
   * @param moveSpeed The moveSpeed parameter.
   */
  setMoveSpeed(moveSpeed: number): void;
  /**
   * Sets movement success.
   * @param success The success parameter.
   */
  setMovementSuccess(success: boolean): void;
  /**
   * Sets opacity.
   * @param opacity The opacity parameter.
   */
  setOpacity(opacity: number): void;
  /**
   * Sets pattern.
   * @param pattern The pattern parameter.
   */
  setPattern(pattern: string): void;
  /**
   * Sets position.
   * @param x The x parameter.
   * @param y The y parameter.
   */
  setPosition(x: number, y: number): void;
  /**
   * Sets priority type.
   * @param priorityType The priorityType parameter.
   */
  setPriorityType(priorityType: number): void;
  /**
   * Sets step anime.
   * @param stepAnime The stepAnime parameter.
   */
  setStepAnime(stepAnime: boolean): void;
  /**
   * Sets through.
   * @param through The through parameter.
   */
  setThrough(through: boolean): void;
  /**
   * Sets tile image.
   * @param tileId The tileId parameter.
   */
  setTileImage(tileId: number): void;
  /**
   * Sets transparent.
   * @param transparent The transparent parameter.
   */
  setTransparent(transparent: boolean): void;
  /**
   * Sets walk anime.
   * @param walkAnime The walkAnime parameter.
   */
  setWalkAnime(walkAnime: boolean): void;
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
  terrainTag(): number;
  /**
   * Gets tile id.
   * @returns The result.
   */
  tileId(): number;
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
  get x(): number;
  /**
   * Gets y.
   * @returns The result.
   */
  get y(): number;
}
