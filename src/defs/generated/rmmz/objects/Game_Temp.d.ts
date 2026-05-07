/**
 * Generated from project/js/rmmz_objects.js
 * Class: Game_Temp
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Game_Temp
{
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `unknown[]`.<br/>
   * Initialized in: {@link Game_Temp#initialize}.<br/>
   * Written in: {@link Game_Temp#initialize}.<br/>
   * Read in: {@link Game_Temp#requestAnimation}, {@link Game_Temp#retrieveAnimation}.<br/>
   *<br/>
   * Consumed by:<br/>
   * - `push()`: {@link Game_Temp#requestAnimation}.<br/>
   * - `shift()`: {@link Game_Temp#retrieveAnimation}.<br/>
   */
  _animationQueue: unknown[];
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `unknown[]`.<br/>
   * Initialized in: {@link Game_Temp#initialize}.<br/>
   * Written in: {@link Game_Temp#initialize}.<br/>
   * Read in: {@link Game_Temp#requestBalloon}, {@link Game_Temp#retrieveBalloon}.<br/>
   *<br/>
   * Consumed by:<br/>
   * - `push()`: {@link Game_Temp#requestBalloon}.<br/>
   * - `shift()`: {@link Game_Temp#retrieveBalloon}.<br/>
   */
  _balloonQueue: unknown[];
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `unknown[]`.<br/>
   * Initialized in: {@link Game_Temp#initialize}.<br/>
   * Written in: {@link Game_Temp#initialize}.<br/>
   * Read in: {@link Game_Temp#clearCommonEventReservation}, {@link Game_Temp#isCommonEventReserved}, {@link Game_Temp#reserveCommonEvent}, {@link Game_Temp#retrieveCommonEvent}.<br/>
   *<br/>
   * Consumed by:<br/>
   * - `.length`: {@link Game_Temp#clearCommonEventReservation}, {@link Game_Temp#isCommonEventReserved}.<br/>
   * - `push()`: {@link Game_Temp#reserveCommonEvent}.<br/>
   * - `shift()`: {@link Game_Temp#retrieveCommonEvent}.<br/>
   */
  _commonEventQueue: unknown[];
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `null`.<br/>
   * Initialized in: {@link Game_Temp#initialize}.<br/>
   * Written in: {@link Game_Temp#clearDestination}, {@link Game_Temp#initialize}, {@link Game_Temp#setDestination}.<br/>
   * Read in: {@link Game_Temp#destinationX}, {@link Game_Temp#isDestinationValid}.<br/>
   */
  _destinationX: null;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `null`.<br/>
   * Initialized in: {@link Game_Temp#initialize}.<br/>
   * Written in: {@link Game_Temp#clearDestination}, {@link Game_Temp#initialize}, {@link Game_Temp#setDestination}.<br/>
   * Read in: {@link Game_Temp#destinationY}.<br/>
   */
  _destinationY: null;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `boolean`.<br/>
   * Initialized in: {@link Game_Temp#initialize}.<br/>
   * Written in: {@link Game_Temp#initialize}.<br/>
   * Read in: {@link Game_Temp#isPlaytest}.<br/>
   */
  _isPlaytest: boolean;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number[]`.<br/>
   * Initialized in: {@link Game_Temp#initialize}.<br/>
   * Written in: {@link Game_Temp#initialize}.<br/>
   * Read in: {@link Game_Temp#lastActionData}, {@link Game_Temp#setLastActionData}.<br/>
   */
  _lastActionData: number[];
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `boolean`.<br/>
   * Initialized in: {@link Game_Temp#initialize}.<br/>
   * Written in: {@link Game_Temp#clearBattleRefreshRequest}, {@link Game_Temp#initialize}, {@link Game_Temp#requestBattleRefresh}.<br/>
   * Read in: {@link Game_Temp#isBattleRefreshRequested}.<br/>
   */
  _needsBattleRefresh: boolean;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `string`.<br/>
   * Initialized in: {@link Game_Temp#initialize}.<br/>
   * Written in: {@link Game_Temp#clearTouchState}, {@link Game_Temp#initialize}, {@link Game_Temp#setTouchState}.<br/>
   * Read in: {@link Game_Temp#touchState}.<br/>
   */
  _touchState: string;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `null`.<br/>
   * Initialized in: {@link Game_Temp#initialize}.<br/>
   * Written in: {@link Game_Temp#clearTouchState}, {@link Game_Temp#initialize}, {@link Game_Temp#setTouchState}.<br/>
   * Read in: {@link Game_Temp#touchTarget}.<br/>
   */
  _touchTarget: null;
  /**
   * Clears battle refresh request.
   */
  clearBattleRefreshRequest(): void;
  /**
   * Clears common event reservation.
   */
  clearCommonEventReservation(): void;
  /**
   * Clears destination.
   */
  clearDestination(): void;
  /**
   * Clears touch state.
   */
  clearTouchState(): void;
  /**
   * Gets destination x.
   * @returns The result.
   */
  destinationX(): unknown;
  /**
   * Gets destination y.
   * @returns The result.
   */
  destinationY(): unknown;
  /**
   * Initializes initialize.
   */
  initialize(): void;
  /**
   * Determines whether battle refresh requested.
   * @returns True if battle refresh requested; false otherwise.
   */
  isBattleRefreshRequested(): boolean;
  /**
   * Determines whether common event reserved.
   * @returns True if common event reserved; false otherwise.
   */
  isCommonEventReserved(): boolean;
  /**
   * Determines whether destination valid.
   * @returns True if destination valid; false otherwise.
   */
  isDestinationValid(): boolean;
  /**
   * Determines whether playtest.
   * @returns True if playtest; false otherwise.
   */
  isPlaytest(): boolean;
  /**
   * Gets last action data.
   * @param _type The type parameter.
   * @returns The result.
   */
  lastActionData(_type: unknown): number;
  /**
   * Performs request animation.
   * @param targets The targets parameter.
   * @param animationId The animationId parameter.
   * @param mirror The mirror parameter.
   */
  requestAnimation(targets: unknown, animationId: unknown, mirror?: unknown): void;
  /**
   * Performs request balloon.
   * @param target The target parameter.
   * @param balloonId The balloonId parameter.
   */
  requestBalloon(target: unknown, balloonId: unknown): void;
  /**
   * Performs request battle refresh.
   */
  requestBattleRefresh(): void;
  /**
   * Performs reserve common event.
   * @param commonEventId The commonEventId parameter.
   */
  reserveCommonEvent(commonEventId: unknown): void;
  /**
   * Gets retrieve animation.
   * @returns The result.
   */
  retrieveAnimation(): unknown;
  /**
   * Gets retrieve balloon.
   * @returns The result.
   */
  retrieveBalloon(): unknown;
  /**
   * Gets retrieve common event.
   * @returns The result.
   */
  retrieveCommonEvent(): unknown;
  /**
   * Sets destination.
   * @param x The x parameter.
   * @param y The y parameter.
   */
  setDestination(x: unknown, y: unknown): void;
  /**
   * Sets last action data.
   * @param _type The type parameter.
   * @param value The value parameter.
   */
  setLastActionData(_type: unknown, value: unknown): void;
  /**
   * Sets last subject actor id.
   * @param actorID The actorID parameter.
   */
  setLastSubjectActorId(actorID: unknown): void;
  /**
   * Sets last subject enemy index.
   * @param enemyIndex The enemyIndex parameter.
   */
  setLastSubjectEnemyIndex(enemyIndex: unknown): void;
  /**
   * Sets last target actor id.
   * @param actorID The actorID parameter.
   */
  setLastTargetActorId(actorID: unknown): void;
  /**
   * Sets last target enemy index.
   * @param enemyIndex The enemyIndex parameter.
   */
  setLastTargetEnemyIndex(enemyIndex: unknown): void;
  /**
   * Sets last used item id.
   * @param itemID The itemID parameter.
   */
  setLastUsedItemId(itemID: unknown): void;
  /**
   * Sets last used skill id.
   * @param skillID The skillID parameter.
   */
  setLastUsedSkillId(skillID: unknown): void;
  /**
   * Sets touch state.
   * @param target The target parameter.
   * @param state The state parameter.
   */
  setTouchState(target: unknown, state: unknown): void;
  /**
   * Gets touch state.
   * @returns The result.
   */
  touchState(): unknown;
  /**
   * Gets touch target.
   * @returns The result.
   */
  touchTarget(): unknown;
}
