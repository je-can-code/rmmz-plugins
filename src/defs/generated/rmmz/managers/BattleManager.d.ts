/**
 * Generated from project/js/rmmz_managers.js
 * Class: BattleManager
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface BattleManager
{
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `null | Game_Action`.<br/>
   * Initialized in: {@link BattleManager#initMembers}.<br/>
   * Written in: {@link BattleManager#initMembers}, {@link BattleManager#startAction}.<br/>
   * Read in: {@link BattleManager#checkSubstitute}, {@link BattleManager#invokeAction}, {@link BattleManager#invokeMagicReflection}, {@link BattleManager#invokeNormalAction}, {@link BattleManager#startAction}.<br/>
   */
  _action: null | Game_Action;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `unknown[]`.<br/>
   * Initialized in: {@link BattleManager#initMembers}.<br/>
   * Written in: {@link BattleManager#initMembers}, {@link BattleManager#makeActionOrders}.<br/>
   * Read in: {@link BattleManager#forceAction}, {@link BattleManager#getNextSubject}, {@link BattleManager#updateTpbBattler}.<br/>
   *<br/>
   * Consumed by:<br/>
   * - `push()`: {@link BattleManager#updateTpbBattler}.<br/>
   * - `shift()`: {@link BattleManager#getNextSubject}.<br/>
   */
  _actionBattlers: unknown[];
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `null | Game_Battler`.<br/>
   * Initialized in: {@link BattleManager#initMembers}.<br/>
   * Written in: {@link BattleManager#forceAction}, {@link BattleManager#initMembers}, {@link BattleManager#processForcedAction}.<br/>
   * Read in: {@link BattleManager#isActionForced}, {@link BattleManager#processForcedAction}.<br/>
   */
  _actionForcedBattler: null | Game_Battler;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `boolean`.<br/>
   * Initialized in: {@link BattleManager#initMembers}.<br/>
   * Written in: {@link BattleManager#initMembers}, {@link BattleManager#setBattleTest}.<br/>
   * Read in: {@link BattleManager#isBattleTest}.<br/>
   */
  _battleTest: boolean;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `boolean`.<br/>
   * Initialized in: {@link BattleManager#initMembers}.<br/>
   * Written in: {@link BattleManager#initMembers}, {@link BattleManager#setup}.<br/>
   * Read in: {@link BattleManager#canEscape}.<br/>
   */
  _canEscape: boolean;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `boolean`.<br/>
   * Initialized in: {@link BattleManager#initMembers}.<br/>
   * Written in: {@link BattleManager#initMembers}, {@link BattleManager#setup}.<br/>
   * Read in: {@link BattleManager#canLose}, {@link BattleManager#processDefeat}, {@link BattleManager#updateBattleEnd}.<br/>
   */
  _canLose: boolean;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `null`.<br/>
   * Initialized in: {@link BattleManager#initMembers}.<br/>
   * Written in: {@link BattleManager#changeCurrentActor}, {@link BattleManager#checkTpbInputClose}, {@link BattleManager#initMembers}, {@link BattleManager#startInput}.<br/>
   * Read in: {@link BattleManager#actor}, {@link BattleManager#cancelActorInput}, {@link BattleManager#changeCurrentActor}, {@link BattleManager#finishActorInput}, {@link BattleManager#inputtingAction}, {@link BattleManager#needsActorInputCancel}, {@link BattleManager#selectNextActor}, {@link BattleManager#selectNextCommand}, {@link BattleManager#selectPreviousActor}, {@link BattleManager#selectPreviousCommand}, {@link BattleManager#startActorInput}.<br/>
   */
  _currentActor: null;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: {@link BattleManager#initMembers}.<br/>
   * Written in: {@link BattleManager#initMembers}, {@link BattleManager#makeEscapeRatio}, {@link BattleManager#onEscapeFailure}.<br/>
   * Read in: {@link BattleManager#processEscape}.<br/>
   */
  _escapeRatio: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `boolean`.<br/>
   * Initialized in: {@link BattleManager#initMembers}.<br/>
   * Written in: {@link BattleManager#initMembers}, {@link BattleManager#onEscapeSuccess}, {@link BattleManager#processPartyEscape}.<br/>
   * Read in: {@link BattleManager#endBattle}, {@link BattleManager#isEscaped}, {@link BattleManager#updateBattleEnd}.<br/>
   */
  _escaped: boolean;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `null | () => void`.<br/>
   * Initialized in: {@link BattleManager#initMembers}.<br/>
   * Written in: {@link BattleManager#initMembers}, {@link BattleManager#setEventCallback}.<br/>
   * Read in: {@link BattleManager#endBattle}.<br/>
   */
  _eventCallback: null | () => void;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `boolean`.<br/>
   * Initialized in: {@link BattleManager#initMembers}.<br/>
   * Written in: {@link BattleManager#checkTpbInputClose}, {@link BattleManager#checkTpbInputOpen}, {@link BattleManager#endBattle}, {@link BattleManager#initMembers}, {@link BattleManager#selectPreviousActor}, {@link BattleManager#startActorInput}, {@link BattleManager#startInput}, {@link BattleManager#startTurn}.<br/>
   * Read in: {@link BattleManager#isInputting}, {@link BattleManager#updateTpbInput}.<br/>
   */
  _inputting: boolean;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `null | Window_BattleLog`.<br/>
   * Initialized in: {@link BattleManager#initMembers}.<br/>
   * Written in: {@link BattleManager#initMembers}, {@link BattleManager#setLogWindow}.<br/>
   * Read in: {@link BattleManager#applySubstitute}, {@link BattleManager#displayBattlerStatus}, {@link BattleManager#endAction}, {@link BattleManager#invokeAction}, {@link BattleManager#invokeCounterAttack}, {@link BattleManager#invokeMagicReflection}, {@link BattleManager#invokeNormalAction}, {@link BattleManager#isBusy}, {@link BattleManager#processAbort}, {@link BattleManager#startAction}, {@link BattleManager#startTurn}.<br/>
   *<br/>
   * Consumed by:<br/>
   * - `clear()`: {@link BattleManager#processAbort}.<br/>
   * - `push()`: {@link BattleManager#invokeAction}.<br/>
   */
  _logWindow: null | Window_BattleLog;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `null`.<br/>
   * Initialized in: {@link BattleManager#initMembers}.<br/>
   * Written in: {@link BattleManager#initMembers}, {@link BattleManager#saveBgmAndBgs}.<br/>
   * Read in: {@link BattleManager#replayBgmAndBgs}.<br/>
   */
  _mapBgm: null;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `null`.<br/>
   * Initialized in: {@link BattleManager#initMembers}.<br/>
   * Written in: {@link BattleManager#initMembers}, {@link BattleManager#saveBgmAndBgs}.<br/>
   * Read in: {@link BattleManager#replayBgmAndBgs}.<br/>
   */
  _mapBgs: null;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `string`.<br/>
   * Initialized in: {@link BattleManager#initMembers}.<br/>
   * Written in: {@link BattleManager#abort}, {@link BattleManager#endAction}, {@link BattleManager#endBattle}, {@link BattleManager#endTurn}, {@link BattleManager#initMembers}, {@link BattleManager#startAction}, {@link BattleManager#startBattle}, {@link BattleManager#startInput}, {@link BattleManager#startTurn}, {@link BattleManager#updateBattleEnd}, {@link BattleManager#updateStart}, {@link BattleManager#updateTurnEnd}.<br/>
   * Read in: {@link BattleManager#checkBattleEnd}, {@link BattleManager#isAborting}, {@link BattleManager#isBattleEnd}, {@link BattleManager#isInTurn}, {@link BattleManager#isTpbMainPhase}, {@link BattleManager#isTurnEnd}, {@link BattleManager#updateEvent}, {@link BattleManager#updatePhase}.<br/>
   */
  _phase: string;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `boolean`.<br/>
   * Initialized in: {@link BattleManager#initMembers}.<br/>
   * Written in: {@link BattleManager#endTurn}, {@link BattleManager#initMembers}, {@link BattleManager#onEncounter}.<br/>
   * Read in: {@link BattleManager#displayStartMessages}, {@link BattleManager#makeActionOrders}, {@link BattleManager#onEncounter}, {@link BattleManager#processEscape}, {@link BattleManager#startBattle}.<br/>
   */
  _preemptive: boolean;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `object`.<br/>
   * Initialized in: {@link BattleManager#initMembers}.<br/>
   * Written in: {@link BattleManager#initMembers}, {@link BattleManager#makeRewards}.<br/>
   * Read in: {@link BattleManager#displayDropItems}, {@link BattleManager#displayExp}, {@link BattleManager#displayGold}, {@link BattleManager#gainDropItems}, {@link BattleManager#gainExp}, {@link BattleManager#gainGold}.<br/>
   */
  _rewards: object;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `null | Spriteset_Battle`.<br/>
   * Initialized in: {@link BattleManager#initMembers}.<br/>
   * Written in: {@link BattleManager#initMembers}, {@link BattleManager#setSpriteset}.<br/>
   * Read in: {@link BattleManager#isBusy}.<br/>
   */
  _spriteset: null | Spriteset_Battle;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `null`.<br/>
   * Initialized in: {@link BattleManager#initMembers}.<br/>
   * Written in: {@link BattleManager#endAction}, {@link BattleManager#initMembers}, {@link BattleManager#processForcedAction}, {@link BattleManager#processTurn}, {@link BattleManager#updateTurn}.<br/>
   * Read in: {@link BattleManager#endAction}, {@link BattleManager#processForcedAction}, {@link BattleManager#processTurn}, {@link BattleManager#startAction}, {@link BattleManager#updateAction}, {@link BattleManager#updateTurn}.<br/>
   */
  _subject: null;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `boolean`.<br/>
   * Initialized in: {@link BattleManager#initMembers}.<br/>
   * Written in: {@link BattleManager#endTurn}, {@link BattleManager#initMembers}, {@link BattleManager#onEncounter}.<br/>
   * Read in: {@link BattleManager#displayStartMessages}, {@link BattleManager#makeActionOrders}, {@link BattleManager#startBattle}, {@link BattleManager#startInput}.<br/>
   */
  _surprise: boolean;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `unknown[] | Game_Battler[]`.<br/>
   * Initialized in: {@link BattleManager#initMembers}.<br/>
   * Written in: {@link BattleManager#initMembers}, {@link BattleManager#startAction}.<br/>
   * Read in: {@link BattleManager#updateAction}.<br/>
   *<br/>
   * Consumed by:<br/>
   * - `shift()`: {@link BattleManager#updateAction}.<br/>
   */
  _targets: unknown[] | Game_Battler[];
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `boolean`.<br/>
   * Initialized in: {@link BattleManager#initMembers}.<br/>
   * Written in: {@link BattleManager#checkTpbInputOpen}, {@link BattleManager#initMembers}.<br/>
   * Read in: {@link BattleManager#checkTpbInputOpen}.<br/>
   */
  _tpbNeedsPartyCommand: boolean;
}
declare function BattleManager(): never;
declare namespace BattleManager
{
  /**
   * Performs abort.
   */
  function abort(): void;
  /**
   * Gets actor.
   * @returns The result.
   */
  function actor(): Game_Actor | null;
  /**
   * Gets all battle members.
   * @returns The result.
   */
  function allBattleMembers(): Game_Battler[];
  /**
   * Gets apply substitute.
   * @param target The target parameter.
   * @returns The result.
   */
  function applySubstitute(target: Game_Battler): Game_Battler;
  /**
   * Determines whether escape.
   * @returns True if escape; false otherwise.
   */
  function canEscape(): boolean;
  /**
   * Determines whether lose.
   * @returns True if lose; false otherwise.
   */
  function canLose(): boolean;
  /**
   * Performs cancel actor input.
   */
  function cancelActorInput(): void;
  /**
   * Performs change current actor.
   * @param forward The forward parameter.
   */
  function changeCurrentActor(forward: boolean): void;
  /**
   * Gets check abort.
   * @returns The result.
   */
  function checkAbort(): boolean;
  /**
   * Gets check battle end.
   * @returns The result.
   */
  function checkBattleEnd(): boolean;
  /**
   * Gets check substitute.
   * @param target The target parameter.
   * @returns The result.
   */
  function checkSubstitute(target: Game_Battler): boolean;
  /**
   * Performs check tpb input close.
   */
  function checkTpbInputClose(): void;
  /**
   * Performs check tpb input open.
   */
  function checkTpbInputOpen(): void;
  /**
   * Performs check tpb turn end.
   */
  function checkTpbTurnEnd(): void;
  /**
   * Performs display battler status.
   * @param battler The battler parameter.
   * @param current The current parameter.
   */
  function displayBattlerStatus(battler: Game_Battler, current: boolean): void;
  /**
   * Performs display defeat message.
   */
  function displayDefeatMessage(): void;
  /**
   * Performs display drop items.
   */
  function displayDropItems(): void;
  /**
   * Performs display escape failure message.
   */
  function displayEscapeFailureMessage(): void;
  /**
   * Performs display escape success message.
   */
  function displayEscapeSuccessMessage(): void;
  /**
   * Performs display exp.
   */
  function displayExp(): void;
  /**
   * Performs display gold.
   */
  function displayGold(): void;
  /**
   * Performs display rewards.
   */
  function displayRewards(): void;
  /**
   * Performs display start messages.
   */
  function displayStartMessages(): void;
  /**
   * Performs display victory message.
   */
  function displayVictoryMessage(): void;
  /**
   * Performs end action.
   */
  function endAction(): void;
  /**
   * Performs end all battlers turn.
   */
  function endAllBattlersTurn(): void;
  /**
   * Performs end battle.
   * @param result The result parameter.
   */
  function endBattle(result: number): void;
  /**
   * Performs end battler actions.
   * @param battler The battler parameter.
   */
  function endBattlerActions(battler: Game_Battler): void;
  /**
   * Performs end turn.
   */
  function endTurn(): void;
  /**
   * Performs finish actor input.
   */
  function finishActorInput(): void;
  /**
   * Performs force action.
   * @param battler The battler parameter.
   */
  function forceAction(battler: Game_Battler): void;
  /**
   * Performs gain drop items.
   */
  function gainDropItems(): void;
  /**
   * Performs gain exp.
   */
  function gainExp(): void;
  /**
   * Performs gain gold.
   */
  function gainGold(): void;
  /**
   * Performs gain rewards.
   */
  function gainRewards(): void;
  /**
   * Gets next subject.
   * @returns The result.
   */
  function getNextSubject(): null | Game_Battler;
  /**
   * Initializes members.
   */
  function initMembers(): void;
  /**
   * Gets inputting action.
   * @returns The result.
   */
  function inputtingAction(): Game_Action | null;
  /**
   * Performs invoke action.
   * @param subject The subject parameter.
   * @param target The target parameter.
   */
  function invokeAction(subject: Game_Battler, target: Game_Battler): void;
  /**
   * Performs invoke counter attack.
   * @param subject The subject parameter.
   * @param target The target parameter.
   */
  function invokeCounterAttack(subject: Game_Battler, target: Game_Battler): void;
  /**
   * Performs invoke magic reflection.
   * @param subject The subject parameter.
   * @param target The target parameter.
   */
  function invokeMagicReflection(subject: Game_Battler, target: Game_Battler): void;
  /**
   * Performs invoke normal action.
   * @param subject The subject parameter.
   * @param target The target parameter.
   */
  function invokeNormalAction(subject: Game_Battler, target: Game_Battler): void;
  /**
   * Determines whether aborting.
   * @returns True if aborting; false otherwise.
   */
  function isAborting(): boolean;
  /**
   * Determines whether action forced.
   * @returns True if action forced; false otherwise.
   */
  function isActionForced(): boolean;
  /**
   * Determines whether active tpb.
   * @returns True if active tpb; false otherwise.
   */
  function isActiveTpb(): boolean;
  /**
   * Determines whether battle end.
   * @returns True if battle end; false otherwise.
   */
  function isBattleEnd(): boolean;
  /**
   * Determines whether battle test.
   * @returns True if battle test; false otherwise.
   */
  function isBattleTest(): boolean;
  /**
   * Determines whether busy.
   * @returns True if busy; false otherwise.
   */
  function isBusy(): boolean;
  /**
   * Determines whether escaped.
   * @returns True if escaped; false otherwise.
   */
  function isEscaped(): boolean;
  /**
   * Determines whether in turn.
   * @returns True if in turn; false otherwise.
   */
  function isInTurn(): boolean;
  /**
   * Determines whether inputting.
   * @returns True if inputting; false otherwise.
   */
  function isInputting(): boolean;
  /**
   * Determines whether party tpb inputtable.
   * @returns True if party tpb inputtable; false otherwise.
   */
  function isPartyTpbInputtable(): boolean;
  /**
   * Determines whether tpb.
   * @returns True if tpb; false otherwise.
   */
  function isTpb(): boolean;
  /**
   * Determines whether tpb main phase.
   * @returns True if tpb main phase; false otherwise.
   */
  function isTpbMainPhase(): boolean;
  /**
   * Determines whether turn end.
   * @returns True if turn end; false otherwise.
   */
  function isTurnEnd(): boolean;
  /**
   * Creates action orders.
   */
  function makeActionOrders(): void;
  /**
   * Creates escape ratio.
   */
  function makeEscapeRatio(): void;
  /**
   * Creates rewards.
   */
  function makeRewards(): void;
  /**
   * Gets needs actor input cancel.
   * @returns The result.
   */
  function needsActorInputCancel(): boolean;
  /**
   * Performs on encounter.
   */
  function onEncounter(): void;
  /**
   * Performs on escape failure.
   */
  function onEscapeFailure(): void;
  /**
   * Performs on escape success.
   */
  function onEscapeSuccess(): void;
  /**
   * Performs play battle bgm.
   */
  function playBattleBgm(): void;
  /**
   * Performs play defeat me.
   */
  function playDefeatMe(): void;
  /**
   * Performs play victory me.
   */
  function playVictoryMe(): void;
  /**
   * Performs process abort.
   */
  function processAbort(): void;
  /**
   * Performs process defeat.
   */
  function processDefeat(): void;
  /**
   * Gets process escape.
   * @returns The result.
   */
  function processEscape(): boolean;
  /**
   * Performs process forced action.
   */
  function processForcedAction(): void;
  /**
   * Performs process party escape.
   */
  function processPartyEscape(): void;
  /**
   * Performs process turn.
   */
  function processTurn(): void;
  /**
   * Performs process victory.
   */
  function processVictory(): void;
  /**
   * Gets rate preemptive.
   * @returns The result.
   */
  function ratePreemptive(): number;
  /**
   * Gets rate surprise.
   * @returns The result.
   */
  function rateSurprise(): number;
  /**
   * Performs replay bgm and bgs.
   */
  function replayBgmAndBgs(): void;
  /**
   * Performs save bgm and bgs.
   */
  function saveBgmAndBgs(): void;
  /**
   * Performs select next actor.
   */
  function selectNextActor(): void;
  /**
   * Performs select next command.
   */
  function selectNextCommand(): void;
  /**
   * Performs select previous actor.
   */
  function selectPreviousActor(): void;
  /**
   * Performs select previous command.
   */
  function selectPreviousCommand(): void;
  /**
   * Sets battle test.
   * @param battleTest The battleTest parameter.
   */
  function setBattleTest(battleTest: boolean): void;
  /**
   * Sets event callback.
   * @param callback The callback parameter.
   */
  function setEventCallback(callback: () => void): void;
  /**
   * Sets log window.
   * @param logWindow The logWindow parameter.
   */
  function setLogWindow(logWindow: Window_BattleLog): void;
  /**
   * Sets spriteset.
   * @param spriteset The spriteset parameter.
   */
  function setSpriteset(spriteset: Spriteset_Battle): void;
  /**
   * Performs setup.
   * @param troopId The troopId parameter.
   * @param canEscape The canEscape parameter.
   * @param canLose The canLose parameter.
   */
  function setup(troopId: number, canEscape: boolean, canLose: boolean): void;
  /**
   * Performs start action.
   */
  function startAction(): void;
  /**
   * Performs start actor input.
   */
  function startActorInput(): void;
  /**
   * Performs start battle.
   */
  function startBattle(): void;
  /**
   * Performs start input.
   */
  function startInput(): void;
  /**
   * Performs start turn.
   */
  function startTurn(): void;
  /**
   * Performs update.
   * @param timeActive The timeActive parameter.
   */
  function update(timeActive: boolean): void;
  /**
   * Updates action.
   */
  function updateAction(): void;
  /**
   * Updates all tpb battlers.
   */
  function updateAllTpbBattlers(): void;
  /**
   * Updates battle end.
   */
  function updateBattleEnd(): void;
  /**
   * Updates event.
   * @returns The result.
   */
  function updateEvent(): boolean;
  /**
   * Updates event main.
   * @returns The result.
   */
  function updateEventMain(): boolean;
  /**
   * Updates phase.
   * @param timeActive The timeActive parameter.
   */
  function updatePhase(timeActive: boolean): void;
  /**
   * Updates start.
   */
  function updateStart(): void;
  /**
   * Updates tpb.
   */
  function updateTpb(): void;
  /**
   * Updates tpb battler.
   * @param battler The battler parameter.
   */
  function updateTpbBattler(battler: Game_Battler): void;
  /**
   * Updates tpb input.
   */
  function updateTpbInput(): void;
  /**
   * Updates turn.
   * @param timeActive The timeActive parameter.
   */
  function updateTurn(timeActive: boolean): void;
  /**
   * Updates turn end.
   */
  function updateTurnEnd(): void;
}
