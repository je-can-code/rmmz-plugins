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
   * Inferred engine backing field.
   *
   * Type: `unknown[]`.
   * Initialized in: {@link Window_BattleLog#initialize}.
   * Written in: {@link Window_BattleLog#clear}, {@link Window_BattleLog#initialize}.
   * Read in: {@link Window_BattleLog#popBaseLine}, {@link Window_BattleLog#pushBaseLine}, {@link Window_BattleLog#waitForNewLine}.
   *
   * Consumed by:
   * - `.length`: {@link Window_BattleLog#waitForNewLine}.
   * - `pop()`: {@link Window_BattleLog#popBaseLine}.
   * - `push()`: {@link Window_BattleLog#pushBaseLine}.
   */
  _baseLineStack: unknown[];
  /**
   * Inferred engine backing field.
   *
   * Type: `unknown[]`.
   * Initialized in: {@link Window_BattleLog#initialize}.
   * Written in: {@link Window_BattleLog#clear}, {@link Window_BattleLog#initialize}.
   * Read in: {@link Window_BattleLog#addText}, {@link Window_BattleLog#drawLineText}, {@link Window_BattleLog#numLines}, {@link Window_BattleLog#popBaseLine}, {@link Window_BattleLog#pushBaseLine}, {@link Window_BattleLog#refresh}, {@link Window_BattleLog#waitForNewLine}.
   *
   * Consumed by:
   * - `.length`: {@link Window_BattleLog#numLines}, {@link Window_BattleLog#popBaseLine}, {@link Window_BattleLog#pushBaseLine}, {@link Window_BattleLog#refresh}, {@link Window_BattleLog#waitForNewLine}.
   * - `pop()`: {@link Window_BattleLog#popBaseLine}.
   * - `push()`: {@link Window_BattleLog#addText}.
   */
  _lines: unknown[];
  /**
   * Inferred engine backing field.
   *
   * Type: `unknown[]`.
   * Initialized in: {@link Window_BattleLog#initialize}.
   * Written in: {@link Window_BattleLog#initialize}.
   * Read in: {@link Window_BattleLog#callNextMethod}, {@link Window_BattleLog#displayAction}, {@link Window_BattleLog#isBusy}, {@link Window_BattleLog#push}.
   *
   * Consumed by:
   * - `.length`: {@link Window_BattleLog#callNextMethod}, {@link Window_BattleLog#displayAction}, {@link Window_BattleLog#isBusy}.
   * - `push()`: {@link Window_BattleLog#push}.
   * - `shift()`: {@link Window_BattleLog#callNextMethod}.
   */
  _methods: unknown[];
  /**
   * Inferred engine backing field.
   *
   * Type: `null | Spriteset_Battle`.
   * Initialized in: {@link Window_BattleLog#initialize}.
   * Written in: {@link Window_BattleLog#initialize}, {@link Window_BattleLog#setSpriteset}.
   * Read in: {@link Window_BattleLog#updateWaitMode}.
   */
  _spriteset: null | Spriteset_Battle;
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: {@link Window_BattleLog#initialize}.
   * Written in: {@link Window_BattleLog#initialize}, {@link Window_BattleLog#updateWaitCount}, {@link Window_BattleLog#wait}.
   * Read in: {@link Window_BattleLog#isBusy}, {@link Window_BattleLog#updateWaitCount}.
   */
  _waitCount: number;
  /**
   * Inferred engine backing field.
   *
   * Type: `string`.
   * Initialized in: {@link Window_BattleLog#initialize}.
   * Written in: {@link Window_BattleLog#initialize}, {@link Window_BattleLog#setWaitMode}, {@link Window_BattleLog#updateWaitMode}.
   * Read in: {@link Window_BattleLog#isBusy}, {@link Window_BattleLog#updateWaitMode}.
   */
  _waitMode: string;
  /**
   * Adds text.
   * @param text The text parameter.
   */
  addText(text: string): void;
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
  displayAction(subject: Game_Battler, item: RPG_Item | RPG_Skill | RPG_Weapon | RPG_Armor | null): void;
  /**
   * Performs display action results.
   * @param subject The subject parameter.
   * @param target The target parameter.
   */
  displayActionResults(subject: Game_Battler, target: Game_Battler): void;
  /**
   * Performs display added states.
   * @param target The target parameter.
   */
  displayAddedStates(target: Game_Battler): void;
  /**
   * Performs display affected status.
   * @param target The target parameter.
   */
  displayAffectedStatus(target: Game_Battler): void;
  /**
   * Performs display auto affected status.
   * @param target The target parameter.
   */
  displayAutoAffectedStatus(target: Game_Battler): void;
  /**
   * Performs display buffs.
   * @param target The target parameter.
   * @param buffs The buffs parameter.
   * @param fmt The fmt parameter.
   */
  displayBuffs(target: Game_Battler, buffs: object[], fmt: string): void;
  /**
   * Performs display changed buffs.
   * @param target The target parameter.
   */
  displayChangedBuffs(target: Game_Battler): void;
  /**
   * Performs display changed states.
   * @param target The target parameter.
   */
  displayChangedStates(target: Game_Battler): void;
  /**
   * Performs display counter.
   * @param target The target parameter.
   */
  displayCounter(target: Game_Battler): void;
  /**
   * Performs display critical.
   * @param target The target parameter.
   */
  displayCritical(target: Game_Battler): void;
  /**
   * Performs display current state.
   * @param subject The subject parameter.
   */
  displayCurrentState(subject: Game_Battler): void;
  /**
   * Performs display damage.
   * @param target The target parameter.
   */
  displayDamage(target: Game_Battler): void;
  /**
   * Performs display evasion.
   * @param target The target parameter.
   */
  displayEvasion(target: Game_Battler): void;
  /**
   * Performs display failure.
   * @param target The target parameter.
   */
  displayFailure(target: Game_Battler): void;
  /**
   * Performs display hp damage.
   * @param target The target parameter.
   */
  displayHpDamage(target: Game_Battler): void;
  /**
   * Performs display item message.
   * @param fmt The fmt parameter.
   * @param subject The subject parameter.
   * @param item The item parameter.
   */
  displayItemMessage(fmt: string, subject: Game_Battler, item: RPG_Item | RPG_Skill | RPG_Weapon | RPG_Armor | null): void;
  /**
   * Performs display miss.
   * @param target The target parameter.
   */
  displayMiss(target: Game_Battler): void;
  /**
   * Performs display mp damage.
   * @param target The target parameter.
   */
  displayMpDamage(target: Game_Battler): void;
  /**
   * Performs display reflection.
   * @param target The target parameter.
   */
  displayReflection(target: Game_Battler): void;
  /**
   * Performs display regeneration.
   * @param subject The subject parameter.
   */
  displayRegeneration(subject: Game_Battler): void;
  /**
   * Performs display removed states.
   * @param target The target parameter.
   */
  displayRemovedStates(target: Game_Battler): void;
  /**
   * Performs display substitute.
   * @param substitute The substitute parameter.
   * @param target The target parameter.
   */
  displaySubstitute(substitute: Game_Battler, target: Game_Battler): void;
  /**
   * Performs display tp damage.
   * @param target The target parameter.
   */
  displayTpDamage(target: Game_Battler): void;
  /**
   * Performs draw background.
   */
  drawBackground(): void;
  /**
   * Performs draw line text.
   * @param index The index parameter.
   */
  drawLineText(index: number): void;
  /**
   * Performs end action.
   * @param subject The subject parameter.
   */
  endAction(subject: Game_Battler): void;
  /**
   * Initializes initialize.
   * @param rect The rect parameter.
   */
  initialize(rect: Rectangle): void;
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
  lineRect(index: number): Rectangle;
  /**
   * Creates hp damage text.
   * @param target The target parameter.
   * @returns The result.
   */
  makeHpDamageText(target: Game_Battler): string;
  /**
   * Creates mp damage text.
   * @param target The target parameter.
   * @returns The result.
   */
  makeMpDamageText(target: Game_Battler): string;
  /**
   * Creates tp damage text.
   * @param target The target parameter.
   * @returns The result.
   */
  makeTpDamageText(target: Game_Battler): string;
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
  numLines(): number;
  /**
   * Performs perform action.
   * @param subject The subject parameter.
   * @param action The action parameter.
   */
  performAction(subject: Game_Battler, action: Game_Action): void;
  /**
   * Performs perform action end.
   * @param subject The subject parameter.
   */
  performActionEnd(subject: Game_Battler): void;
  /**
   * Performs perform action start.
   * @param subject The subject parameter.
   * @param action The action parameter.
   */
  performActionStart(subject: Game_Battler, action: Game_Action): void;
  /**
   * Performs perform collapse.
   * @param target The target parameter.
   */
  performCollapse(target: Game_Battler): void;
  /**
   * Performs perform counter.
   * @param target The target parameter.
   */
  performCounter(target: Game_Battler): void;
  /**
   * Performs perform damage.
   * @param target The target parameter.
   */
  performDamage(target: Game_Battler): void;
  /**
   * Performs perform evasion.
   * @param target The target parameter.
   */
  performEvasion(target: Game_Battler): void;
  /**
   * Performs perform magic evasion.
   * @param target The target parameter.
   */
  performMagicEvasion(target: Game_Battler): void;
  /**
   * Performs perform miss.
   * @param target The target parameter.
   */
  performMiss(target: Game_Battler): void;
  /**
   * Performs perform recovery.
   * @param target The target parameter.
   */
  performRecovery(target: Game_Battler): void;
  /**
   * Performs perform reflection.
   * @param target The target parameter.
   */
  performReflection(target: Game_Battler): void;
  /**
   * Performs perform substitute.
   * @param substitute The substitute parameter.
   * @param target The target parameter.
   */
  performSubstitute(substitute: Game_Battler, target: Game_Battler): void;
  /**
   * Performs pop base line.
   */
  popBaseLine(): void;
  /**
   * Performs popup damage.
   * @param target The target parameter.
   */
  popupDamage(target: Game_Battler): void;
  /**
   * Performs push.
   * @param methodName The methodName parameter.
   */
  push(methodName: string): void;
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
  setSpriteset(spriteset: Spriteset_Battle): void;
  /**
   * Sets wait mode.
   * @param waitMode The waitMode parameter.
   */
  setWaitMode(waitMode: string): void;
  /**
   * Performs show actor attack animation.
   * @param subject The subject parameter.
   * @param targets The targets parameter.
   */
  showActorAttackAnimation(subject: Game_Battler, targets: Game_Battler[]): void;
  /**
   * Performs show animation.
   * @param subject The subject parameter.
   * @param targets The targets parameter.
   * @param animationId The animationId parameter.
   */
  showAnimation(subject: Game_Battler, targets: Game_Battler[], animationId: number): void;
  /**
   * Performs show attack animation.
   * @param subject The subject parameter.
   * @param targets The targets parameter.
   */
  showAttackAnimation(subject: Game_Battler, targets: Game_Battler[]): void;
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
  showNormalAnimation(targets: Game_Battler[], animationId: number, mirror: boolean): void;
  /**
   * Performs start action.
   * @param subject The subject parameter.
   * @param action The action parameter.
   * @param targets The targets parameter.
   */
  startAction(subject: Game_Battler, action: Game_Action, targets: Game_Battler[]): void;
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
  updateWait(): boolean;
  /**
   * Updates wait count.
   * @returns The result.
   */
  updateWaitCount(): boolean;
  /**
   * Updates wait mode.
   * @returns The result.
   */
  updateWaitMode(): boolean;
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
