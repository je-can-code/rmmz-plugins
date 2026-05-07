/**
 * Generated from project/js/rmmz_windows.js
 * Class: Window_BattleLog
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Window_BattleLog
{
  /**
   * Instance fields inferred from `this._*` assignments across vanilla engine sources.
   */
  _baseLineStack: unknown[];
  _lines: unknown[];
  _methods: unknown[];
  _spriteset: null | Spriteset_Battle;
  _waitCount: number;
  _waitMode: string;
  addText(text: string): void;
  backColor(): string;
  backPaintOpacity(): number;
  backRect(): Rectangle;
  callNextMethod(): void;
  clear(): void;
  displayAction(subject: Game_Battler, item: RPG_Item | RPG_Skill | RPG_Weapon | RPG_Armor | null): void;
  displayActionResults(subject: Game_Battler, target: Game_Battler): void;
  displayAddedStates(target: Game_Battler): void;
  displayAffectedStatus(target: Game_Battler): void;
  displayAutoAffectedStatus(target: Game_Battler): void;
  displayBuffs(target: Game_Battler, buffs: object[], fmt: string): void;
  displayChangedBuffs(target: Game_Battler): void;
  displayChangedStates(target: Game_Battler): void;
  displayCounter(target: Game_Battler): void;
  displayCritical(target: Game_Battler): void;
  displayCurrentState(subject: Game_Battler): void;
  displayDamage(target: Game_Battler): void;
  displayEvasion(target: Game_Battler): void;
  displayFailure(target: Game_Battler): void;
  displayHpDamage(target: Game_Battler): void;
  displayItemMessage(fmt: string, subject: Game_Battler, item: RPG_Item | RPG_Skill | RPG_Weapon | RPG_Armor | null): void;
  displayMiss(target: Game_Battler): void;
  displayMpDamage(target: Game_Battler): void;
  displayReflection(target: Game_Battler): void;
  displayRegeneration(subject: Game_Battler): void;
  displayRemovedStates(target: Game_Battler): void;
  displaySubstitute(substitute: Game_Battler, target: Game_Battler): void;
  displayTpDamage(target: Game_Battler): void;
  drawBackground(): void;
  drawLineText(index: number): void;
  endAction(subject: Game_Battler): void;
  initialize(rect: Rectangle): void;
  isBusy(): boolean;
  isFastForward(): boolean;
  lineRect(index: number): Rectangle;
  makeHpDamageText(target: Game_Battler): string;
  makeMpDamageText(target: Game_Battler): string;
  makeTpDamageText(target: Game_Battler): string;
  maxLines(): number;
  messageSpeed(): number;
  numLines(): number;
  performAction(subject: Game_Battler, action: Game_Action): void;
  performActionEnd(subject: Game_Battler): void;
  performActionStart(subject: Game_Battler, action: Game_Action): void;
  performCollapse(target: Game_Battler): void;
  performCounter(target: Game_Battler): void;
  performDamage(target: Game_Battler): void;
  performEvasion(target: Game_Battler): void;
  performMagicEvasion(target: Game_Battler): void;
  performMiss(target: Game_Battler): void;
  performRecovery(target: Game_Battler): void;
  performReflection(target: Game_Battler): void;
  performSubstitute(substitute: Game_Battler, target: Game_Battler): void;
  popBaseLine(): void;
  popupDamage(target: Game_Battler): void;
  push(methodName: string): void;
  pushBaseLine(): void;
  refresh(): void;
  setSpriteset(spriteset: Spriteset_Battle): void;
  setWaitMode(waitMode: string): void;
  showActorAttackAnimation(subject: Game_Battler, targets: Game_Battler[]): void;
  showAnimation(subject: Game_Battler, targets: Game_Battler[], animationId: number): void;
  showAttackAnimation(subject: Game_Battler, targets: Game_Battler[]): void;
  showEnemyAttackAnimation(): void;
  showNormalAnimation(targets: Game_Battler[], animationId: number, mirror: boolean): void;
  startAction(subject: Game_Battler, action: Game_Action, targets: Game_Battler[]): void;
  startTurn(): void;
  update(): void;
  updateWait(): boolean;
  updateWaitCount(): boolean;
  updateWaitMode(): boolean;
  wait(): void;
  waitForEffect(): void;
  waitForMovement(): void;
  waitForNewLine(): void;
}
