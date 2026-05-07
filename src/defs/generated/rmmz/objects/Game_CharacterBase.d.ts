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
   * Instance fields inferred from `this._*` assignments across vanilla engine sources.
   */
  _animationCount: number;
  _animationId: number;
  _animationPlaying: boolean;
  _balloonId: number;
  _balloonPlaying: boolean;
  _blendMode: number;
  _bushDepth: number;
  _characterIndex: number;
  _characterName: string;
  _direction: number;
  _directionFix: boolean;
  _isObjectCharacter: boolean;
  _jumpCount: number;
  _jumpPeak: number;
  _moveFrequency: number;
  _moveSpeed: number;
  _movementSuccess: boolean;
  _opacity: number;
  _pattern: number | string;
  _priorityType: number;
  _realX: number;
  _realY: number;
  _stepAnime: boolean;
  _stopCount: number;
  _through: boolean;
  _tileId: number;
  _transparent: boolean;
  _walkAnime: boolean;
  _x: number;
  _y: number;
  animationWait(): number;
  blendMode(): number;
  bushDepth(): number;
  canPass(x: number, y: number, d: number): boolean;
  canPassDiagonally(x: number, y: number, horz: number, vert: number): boolean;
  characterIndex(): number;
  characterName(): string;
  checkEventTriggerTouch(): boolean;
  checkEventTriggerTouchFront(d: number): void;
  checkStop(threshold: number): boolean;
  copyPosition(character: Game_Character): void;
  direction(): number;
  distancePerFrame(): number;
  endAnimation(): void;
  endBalloon(): void;
  hasStepAnime(): boolean;
  hasWalkAnime(): boolean;
  increaseSteps(): void;
  initMembers(): void;
  initialize(): void;
  isAnimationPlaying(): boolean;
  isBalloonPlaying(): boolean;
  isCollidedWithCharacters(x: number, y: number): boolean;
  isCollidedWithEvents(x: number, y: number): boolean;
  isCollidedWithVehicles(x: number, y: number): boolean;
  isDashing(): boolean;
  isDebugThrough(): boolean;
  isDirectionFixed(): boolean;
  isJumping(): boolean;
  isMapPassable(x: number, y: number, d: number): boolean;
  isMovementSucceeded(): boolean;
  isMoving(): boolean;
  isNearTheScreen(): boolean;
  isNormalPriority(): boolean;
  isObjectCharacter(): boolean;
  isOnBush(): boolean;
  isOnLadder(): boolean;
  isOriginalPattern(): boolean;
  isStopping(): boolean;
  isThrough(): boolean;
  isTile(): boolean;
  isTransparent(): boolean;
  jump(xPlus: number, yPlus: number): void;
  jumpHeight(): number;
  locate(x: number, y: number): void;
  maxPattern(): number;
  moveDiagonally(horz: number, vert: number): void;
  moveFrequency(): number;
  moveSpeed(): number;
  moveStraight(d: number): void;
  opacity(): number;
  pattern(): number;
  pos(x: number, y: number): boolean;
  posNt(x: number, y: number): boolean;
  realMoveSpeed(): number;
  refreshBushDepth(): void;
  regionId(): number;
  resetPattern(): void;
  resetStopCount(): void;
  reverseDir(d: number): number;
  screenX(): number;
  screenY(): number;
  screenZ(): number;
  scrolledX(): number;
  scrolledY(): number;
  setBlendMode(blendMode: number): void;
  setDirection(d: number): void;
  setDirectionFix(directionFix: boolean): void;
  setImage(characterName: string, characterIndex: number): void;
  setMoveFrequency(moveFrequency: number): void;
  setMoveSpeed(moveSpeed: number): void;
  setMovementSuccess(success: boolean): void;
  setOpacity(opacity: number): void;
  setPattern(pattern: string): void;
  setPosition(x: number, y: number): void;
  setPriorityType(priorityType: number): void;
  setStepAnime(stepAnime: boolean): void;
  setThrough(through: boolean): void;
  setTileImage(tileId: number): void;
  setTransparent(transparent: boolean): void;
  setWalkAnime(walkAnime: boolean): void;
  shiftY(): number;
  startAnimation(): void;
  startBalloon(): void;
  straighten(): void;
  terrainTag(): number;
  tileId(): number;
  update(): void;
  updateAnimation(): void;
  updateAnimationCount(): void;
  updateJump(): void;
  updateMove(): void;
  updatePattern(): void;
  updateStop(): void;
}
