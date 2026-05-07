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
   * Instance fields inferred from `this._*` assignments across vanilla engine sources.
   */
  _animationQueue: unknown[];
  _balloonQueue: unknown[];
  _commonEventQueue: unknown[];
  _destinationX: null | number;
  _destinationY: null | number;
  _isPlaytest: boolean;
  _lastActionData: number[];
  _needsBattleRefresh: boolean;
  _touchState: string;
  _touchTarget: null | Game_CharacterBase;
  clearBattleRefreshRequest(): void;
  clearCommonEventReservation(): void;
  clearDestination(): void;
  clearTouchState(): void;
  destinationX(): number | null;
  destinationY(): number | null;
  initialize(): void;
  isBattleRefreshRequested(): boolean;
  isCommonEventReserved(): boolean;
  isDestinationValid(): boolean;
  isPlaytest(): boolean;
  lastActionData(_type: number): number;
  requestAnimation(targets: Game_CharacterBase[], animationId: number, mirror?: boolean): void;
  requestBalloon(target: Game_CharacterBase, balloonId: number): void;
  requestBattleRefresh(): void;
  reserveCommonEvent(commonEventId: number): void;
  retrieveAnimation(): object | undefined;
  retrieveBalloon(): object | undefined;
  retrieveCommonEvent(): object | null | undefined;
  setDestination(x: number, y: number): void;
  setLastActionData(_type: number, value: number): void;
  setLastSubjectActorId(actorID: number): void;
  setLastSubjectEnemyIndex(enemyIndex: number): void;
  setLastTargetActorId(actorID: number): void;
  setLastTargetEnemyIndex(enemyIndex: number): void;
  setLastUsedItemId(itemID: number): void;
  setLastUsedSkillId(skillID: number): void;
  setTouchState(target: Game_CharacterBase | null, state: string): void;
  touchState(): string;
  touchTarget(): Game_CharacterBase | null;
}
