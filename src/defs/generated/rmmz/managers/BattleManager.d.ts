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
   * Instance fields inferred from `this._*` assignments across vanilla engine sources.
   */
  _action: null | Game_Action;
  _actionBattlers: unknown[];
  _actionForcedBattler: null | Game_Battler;
  _battleTest: boolean;
  _canEscape: boolean;
  _canLose: boolean;
  _currentActor: null;
  _escapeRatio: number;
  _escaped: boolean;
  _eventCallback: null | () => void;
  _inputting: boolean;
  _logWindow: null | Window_BattleLog;
  _mapBgm: null;
  _mapBgs: null;
  _phase: string;
  _preemptive: boolean;
  _rewards: object;
  _spriteset: null | Spriteset_Battle;
  _subject: null;
  _surprise: boolean;
  _targets: unknown[] | Game_Battler[];
  _tpbNeedsPartyCommand: boolean;
}
declare function BattleManager(): never;
declare namespace BattleManager
{
  function abort(): void;
  function actor(): Game_Actor | null;
  function allBattleMembers(): Game_Battler[];
  function applySubstitute(target: Game_Battler): Game_Battler;
  function canEscape(): boolean;
  function canLose(): boolean;
  function cancelActorInput(): void;
  function changeCurrentActor(forward: boolean): void;
  function checkAbort(): boolean;
  function checkBattleEnd(): boolean;
  function checkSubstitute(target: Game_Battler): boolean;
  function checkTpbInputClose(): void;
  function checkTpbInputOpen(): void;
  function checkTpbTurnEnd(): void;
  function displayBattlerStatus(battler: Game_Battler, current: boolean): void;
  function displayDefeatMessage(): void;
  function displayDropItems(): void;
  function displayEscapeFailureMessage(): void;
  function displayEscapeSuccessMessage(): void;
  function displayExp(): void;
  function displayGold(): void;
  function displayRewards(): void;
  function displayStartMessages(): void;
  function displayVictoryMessage(): void;
  function endAction(): void;
  function endAllBattlersTurn(): void;
  function endBattle(result: number): void;
  function endBattlerActions(battler: Game_Battler): void;
  function endTurn(): void;
  function finishActorInput(): void;
  function forceAction(battler: Game_Battler): void;
  function gainDropItems(): void;
  function gainExp(): void;
  function gainGold(): void;
  function gainRewards(): void;
  function getNextSubject(): null | Game_Battler;
  function initMembers(): void;
  function inputtingAction(): Game_Action | null;
  function invokeAction(subject: Game_Battler, target: Game_Battler): void;
  function invokeCounterAttack(subject: Game_Battler, target: Game_Battler): void;
  function invokeMagicReflection(subject: Game_Battler, target: Game_Battler): void;
  function invokeNormalAction(subject: Game_Battler, target: Game_Battler): void;
  function isAborting(): boolean;
  function isActionForced(): boolean;
  function isActiveTpb(): boolean;
  function isBattleEnd(): boolean;
  function isBattleTest(): boolean;
  function isBusy(): boolean;
  function isEscaped(): boolean;
  function isInTurn(): boolean;
  function isInputting(): boolean;
  function isPartyTpbInputtable(): boolean;
  function isTpb(): boolean;
  function isTpbMainPhase(): boolean;
  function isTurnEnd(): boolean;
  function makeActionOrders(): void;
  function makeEscapeRatio(): void;
  function makeRewards(): void;
  function needsActorInputCancel(): boolean;
  function onEncounter(): void;
  function onEscapeFailure(): void;
  function onEscapeSuccess(): void;
  function playBattleBgm(): void;
  function playDefeatMe(): void;
  function playVictoryMe(): void;
  function processAbort(): void;
  function processDefeat(): void;
  function processEscape(): boolean;
  function processForcedAction(): void;
  function processPartyEscape(): void;
  function processTurn(): void;
  function processVictory(): void;
  function ratePreemptive(): number;
  function rateSurprise(): number;
  function replayBgmAndBgs(): void;
  function saveBgmAndBgs(): void;
  function selectNextActor(): void;
  function selectNextCommand(): void;
  function selectPreviousActor(): void;
  function selectPreviousCommand(): void;
  function setBattleTest(battleTest: boolean): void;
  function setEventCallback(callback: () => void): void;
  function setLogWindow(logWindow: Window_BattleLog): void;
  function setSpriteset(spriteset: Spriteset_Battle): void;
  function setup(troopId: number, canEscape: boolean, canLose: boolean): void;
  function startAction(): void;
  function startActorInput(): void;
  function startBattle(): void;
  function startInput(): void;
  function startTurn(): void;
  function update(timeActive: boolean): void;
  function updateAction(): void;
  function updateAllTpbBattlers(): void;
  function updateBattleEnd(): void;
  function updateEvent(): boolean;
  function updateEventMain(): boolean;
  function updatePhase(timeActive: boolean): void;
  function updateStart(): void;
  function updateTpb(): void;
  function updateTpbBattler(battler: Game_Battler): void;
  function updateTpbInput(): void;
  function updateTurn(timeActive: boolean): void;
  function updateTurnEnd(): void;
}
