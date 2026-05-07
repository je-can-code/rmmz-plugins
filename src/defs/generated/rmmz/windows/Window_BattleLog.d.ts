/**
 * Generated from project/js/rmmz_windows.js
 * Class: Window_BattleLog
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Window_BattleLog extends Window_Base
{
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `unknown[]`.<br/>
   * Initialized in: {@link Window_BattleLog#initialize}.<br/>
   * Written in: {@link Window_BattleLog#clear}, {@link Window_BattleLog#initialize}.<br/>
   * Read in: {@link Window_BattleLog#popBaseLine}, {@link Window_BattleLog#pushBaseLine}, {@link Window_BattleLog#waitForNewLine}.<br/>
   *<br/>
   * Consumed by:<br/>
   * - `.length`: {@link Window_BattleLog#waitForNewLine}.<br/>
   * - `pop()`: {@link Window_BattleLog#popBaseLine}.<br/>
   * - `push()`: {@link Window_BattleLog#pushBaseLine}.<br/>
   */
  _baseLineStack: unknown[];
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `unknown[]`.<br/>
   * Initialized in: {@link Window_BattleLog#initialize}.<br/>
   * Written in: {@link Window_BattleLog#clear}, {@link Window_BattleLog#initialize}.<br/>
   * Read in: {@link Window_BattleLog#addText}, {@link Window_BattleLog#drawLineText}, {@link Window_BattleLog#numLines}, {@link Window_BattleLog#popBaseLine}, {@link Window_BattleLog#pushBaseLine}, {@link Window_BattleLog#refresh}, {@link Window_BattleLog#waitForNewLine}.<br/>
   *<br/>
   * Consumed by:<br/>
   * - `.length`: {@link Window_BattleLog#numLines}, {@link Window_BattleLog#popBaseLine}, {@link Window_BattleLog#pushBaseLine}, {@link Window_BattleLog#refresh}, {@link Window_BattleLog#waitForNewLine}.<br/>
   * - `pop()`: {@link Window_BattleLog#popBaseLine}.<br/>
   * - `push()`: {@link Window_BattleLog#addText}.<br/>
   */
  _lines: unknown[];
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `unknown[]`.<br/>
   * Initialized in: {@link Window_BattleLog#initialize}.<br/>
   * Written in: {@link Window_BattleLog#initialize}.<br/>
   * Read in: {@link Window_BattleLog#callNextMethod}, {@link Window_BattleLog#displayAction}, {@link Window_BattleLog#isBusy}, {@link Window_BattleLog#push}.<br/>
   *<br/>
   * Consumed by:<br/>
   * - `.length`: {@link Window_BattleLog#callNextMethod}, {@link Window_BattleLog#displayAction}, {@link Window_BattleLog#isBusy}.<br/>
   * - `push()`: {@link Window_BattleLog#push}.<br/>
   * - `shift()`: {@link Window_BattleLog#callNextMethod}.<br/>
   */
  _methods: unknown[];
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `null`.<br/>
   * Initialized in: {@link Window_BattleLog#initialize}.<br/>
   * Written in: {@link Window_BattleLog#initialize}, {@link Window_BattleLog#setSpriteset}.<br/>
   * Read in: {@link Window_BattleLog#updateWaitMode}.<br/>
   */
  _spriteset: null;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: {@link Window_BattleLog#initialize}.<br/>
   * Written in: {@link Window_BattleLog#initialize}, {@link Window_BattleLog#updateWaitCount}, {@link Window_BattleLog#wait}.<br/>
   * Read in: {@link Window_BattleLog#isBusy}, {@link Window_BattleLog#updateWaitCount}.<br/>
   */
  _waitCount: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `string`.<br/>
   * Initialized in: {@link Window_BattleLog#initialize}.<br/>
   * Written in: {@link Window_BattleLog#initialize}, {@link Window_BattleLog#setWaitMode}, {@link Window_BattleLog#updateWaitMode}.<br/>
   * Read in: {@link Window_BattleLog#isBusy}, {@link Window_BattleLog#updateWaitMode}.<br/>
   */
  _waitMode: string;
  /**
   * Adds text.
   * @param text The text parameter.
   */
  addText(text: unknown): void;
  /**
   * Gets back color.
   * @returns The result.
   */
  backColor(): string;
  /**
   * Gets back paint opacity.
   * @returns The result.
   */
  backPaintOpacity(): number;
  /**
   * Gets back rect.
   * @returns The result.
   */
  backRect(): Rectangle;
  /**
   * Performs call next method.
   */
  callNextMethod(): void;
  /**
   * Performs clear.
   */
  clear(): void;
  /**
   * Performs display action.
   * @param subject The subject parameter.
   * @param item The item parameter.
   */
  displayAction(subject: unknown, item: unknown): void;
  /**
   * Performs display action results.
   * @param subject The subject parameter.
   * @param target The target parameter.
   */
  displayActionResults(subject: unknown, target: unknown): void;
  /**
   * Performs display added states.
   * @param target The target parameter.
   */
  displayAddedStates(target: unknown): void;
  /**
   * Performs display affected status.
   * @param target The target parameter.
   */
  displayAffectedStatus(target: unknown): void;
  /**
   * Performs display auto affected status.
   * @param target The target parameter.
   */
  displayAutoAffectedStatus(target: unknown): void;
  /**
   * Performs display buffs.
   * @param target The target parameter.
   * @param buffs The buffs parameter.
   * @param fmt The fmt parameter.
   */
  displayBuffs(target: unknown, buffs: unknown, fmt: unknown): void;
  /**
   * Performs display changed buffs.
   * @param target The target parameter.
   */
  displayChangedBuffs(target: unknown): void;
  /**
   * Performs display changed states.
   * @param target The target parameter.
   */
  displayChangedStates(target: unknown): void;
  /**
   * Performs display counter.
   * @param target The target parameter.
   */
  displayCounter(target: unknown): void;
  /**
   * Performs display critical.
   * @param target The target parameter.
   */
  displayCritical(target: unknown): void;
  /**
   * Performs display current state.
   * @param subject The subject parameter.
   */
  displayCurrentState(subject: unknown): void;
  /**
   * Performs display damage.
   * @param target The target parameter.
   */
  displayDamage(target: unknown): void;
  /**
   * Performs display evasion.
   * @param target The target parameter.
   */
  displayEvasion(target: unknown): void;
  /**
   * Performs display failure.
   * @param target The target parameter.
   */
  displayFailure(target: unknown): void;
  /**
   * Performs display hp damage.
   * @param target The target parameter.
   */
  displayHpDamage(target: unknown): void;
  /**
   * Performs display item message.
   * @param fmt The fmt parameter.
   * @param subject The subject parameter.
   * @param item The item parameter.
   */
  displayItemMessage(fmt: unknown, subject: unknown, item: unknown): void;
  /**
   * Performs display miss.
   * @param target The target parameter.
   */
  displayMiss(target: unknown): void;
  /**
   * Performs display mp damage.
   * @param target The target parameter.
   */
  displayMpDamage(target: unknown): void;
  /**
   * Performs display reflection.
   * @param target The target parameter.
   */
  displayReflection(target: unknown): void;
  /**
   * Performs display regeneration.
   * @param subject The subject parameter.
   */
  displayRegeneration(subject: unknown): void;
  /**
   * Performs display removed states.
   * @param target The target parameter.
   */
  displayRemovedStates(target: unknown): void;
  /**
   * Performs display substitute.
   * @param substitute The substitute parameter.
   * @param target The target parameter.
   */
  displaySubstitute(substitute: unknown, target: unknown): void;
  /**
   * Performs display tp damage.
   * @param target The target parameter.
   */
  displayTpDamage(target: unknown): void;
  /**
   * Performs draw background.
   */
  drawBackground(): void;
  /**
   * Performs draw line text.
   * @param index The index parameter.
   */
  drawLineText(index: unknown): void;
  /**
   * Performs end action.
   * @param subject The subject parameter.
   */
  endAction(subject: unknown): void;
  /**
   * Initializes initialize.
   * @param rect The rect parameter.
   */
  initialize(rect: unknown): void;
  /**
   * Determines whether busy.
   * @returns True if busy; false otherwise.
   */
  isBusy(): boolean;
  /**
   * Determines whether fast forward.
   * @returns True if fast forward; false otherwise.
   */
  isFastForward(): boolean;
  /**
   * Gets line rect.
   * @param index The index parameter.
   * @returns The result.
   */
  lineRect(index: unknown): Rectangle;
  /**
   * Creates hp damage text.
   * @param target The target parameter.
   * @returns The result.
   */
  makeHpDamageText(target: unknown): unknown;
  /**
   * Creates mp damage text.
   * @param target The target parameter.
   * @returns The result.
   */
  makeMpDamageText(target: unknown): string;
  /**
   * Creates tp damage text.
   * @param target The target parameter.
   * @returns The result.
   */
  makeTpDamageText(target: unknown): string;
  /**
   * Gets max lines.
   * @returns The result.
   */
  maxLines(): number;
  /**
   * Gets message speed.
   * @returns The result.
   */
  messageSpeed(): number;
  /**
   * Gets num lines.
   * @returns The result.
   */
  numLines(): unknown;
  /**
   * Performs perform action.
   * @param subject The subject parameter.
   * @param action The action parameter.
   */
  performAction(subject: unknown, action: unknown): void;
  /**
   * Performs perform action end.
   * @param subject The subject parameter.
   */
  performActionEnd(subject: unknown): void;
  /**
   * Performs perform action start.
   * @param subject The subject parameter.
   * @param action The action parameter.
   */
  performActionStart(subject: unknown, action: unknown): void;
  /**
   * Performs perform collapse.
   * @param target The target parameter.
   */
  performCollapse(target: unknown): void;
  /**
   * Performs perform counter.
   * @param target The target parameter.
   */
  performCounter(target: unknown): void;
  /**
   * Performs perform damage.
   * @param target The target parameter.
   */
  performDamage(target: unknown): void;
  /**
   * Performs perform evasion.
   * @param target The target parameter.
   */
  performEvasion(target: unknown): void;
  /**
   * Performs perform magic evasion.
   * @param target The target parameter.
   */
  performMagicEvasion(target: unknown): void;
  /**
   * Performs perform miss.
   * @param target The target parameter.
   */
  performMiss(target: unknown): void;
  /**
   * Performs perform recovery.
   * @param target The target parameter.
   */
  performRecovery(target: unknown): void;
  /**
   * Performs perform reflection.
   * @param target The target parameter.
   */
  performReflection(target: unknown): void;
  /**
   * Performs perform substitute.
   * @param substitute The substitute parameter.
   * @param target The target parameter.
   */
  performSubstitute(substitute: unknown, target: unknown): void;
  /**
   * Performs pop base line.
   */
  popBaseLine(): void;
  /**
   * Performs popup damage.
   * @param target The target parameter.
   */
  popupDamage(target: unknown): void;
  /**
   * Performs push.
   * @param methodName The methodName parameter.
   */
  push(methodName: unknown): void;
  /**
   * Performs push base line.
   */
  pushBaseLine(): void;
  /**
   * Performs refresh.
   */
  refresh(): void;
  /**
   * Sets spriteset.
   * @param spriteset The spriteset parameter.
   */
  setSpriteset(spriteset: unknown): void;
  /**
   * Sets wait mode.
   * @param waitMode The waitMode parameter.
   */
  setWaitMode(waitMode: unknown): void;
  /**
   * Performs show actor attack animation.
   * @param subject The subject parameter.
   * @param targets The targets parameter.
   */
  showActorAttackAnimation(subject: unknown, targets: unknown): void;
  /**
   * Performs show animation.
   * @param subject The subject parameter.
   * @param targets The targets parameter.
   * @param animationId The animationId parameter.
   */
  showAnimation(subject: unknown, targets: unknown, animationId: unknown): void;
  /**
   * Performs show attack animation.
   * @param subject The subject parameter.
   * @param targets The targets parameter.
   */
  showAttackAnimation(subject: unknown, targets: unknown): void;
  /**
   * Performs show enemy attack animation.
   */
  showEnemyAttackAnimation(): void;
  /**
   * Performs show normal animation.
   * @param targets The targets parameter.
   * @param animationId The animationId parameter.
   * @param mirror The mirror parameter.
   */
  showNormalAnimation(targets: unknown, animationId: unknown, mirror: unknown): void;
  /**
   * Performs start action.
   * @param subject The subject parameter.
   * @param action The action parameter.
   * @param targets The targets parameter.
   */
  startAction(subject: unknown, action: unknown, targets: unknown): void;
  /**
   * Performs start turn.
   */
  startTurn(): void;
  /**
   * Performs update.
   */
  update(): void;
  /**
   * Updates wait.
   * @returns The result.
   */
  updateWait(): unknown;
  /**
   * Updates wait count.
   * @returns The result.
   */
  updateWaitCount(): boolean;
  /**
   * Updates wait mode.
   * @returns The result.
   */
  updateWaitMode(): unknown;
  /**
   * Performs wait.
   */
  wait(): void;
  /**
   * Performs wait for effect.
   */
  waitForEffect(): void;
  /**
   * Performs wait for movement.
   */
  waitForMovement(): void;
  /**
   * Performs wait for new line.
   */
  waitForNewLine(): void;
}
