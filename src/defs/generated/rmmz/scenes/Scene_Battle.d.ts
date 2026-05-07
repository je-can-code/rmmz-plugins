/**
 * Generated from project/js/rmmz_scenes.js
 * Class: Scene_Battle
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Scene_Battle
{
  /**
   * Instance fields inferred from `this._*` assignments across vanilla engine sources.
   */
  _actorCommandWindow: unknown;
  _actorWindow: Window_BattleActor;
  _cancelButton: Sprite_Button;
  _enemyWindow: Window_BattleEnemy;
  _helpWindow: Window_Help;
  _itemWindow: Window_BattleItem;
  _logWindow: Window_BattleLog;
  _partyCommandWindow: unknown;
  _skillWindow: Window_BattleSkill;
  _spriteset: Spriteset_Battle;
  _statusWindow: unknown;
  actorCommandWindowRect(): Rectangle;
  actorWindowRect(): Rectangle;
  buttonAreaTop(): number;
  changeInputWindow(): void;
  closeCommandWindows(): void;
  commandAttack(): void;
  commandCancel(): void;
  commandEscape(): void;
  commandFight(): void;
  commandGuard(): void;
  commandItem(): void;
  commandSkill(): void;
  create(): void;
  createActorCommandWindow(): void;
  createActorWindow(): void;
  createAllWindows(): void;
  createButtons(): void;
  createCancelButton(): void;
  createDisplayObjects(): void;
  createEnemyWindow(): void;
  createHelpWindow(): void;
  createItemWindow(): void;
  createLogWindow(): void;
  createPartyCommandWindow(): void;
  createSkillWindow(): void;
  createSpriteset(): void;
  createStatusWindow(): void;
  endCommandSelection(): void;
  enemyWindowRect(): Rectangle;
  helpAreaBottom(): number;
  helpAreaHeight(): number;
  helpAreaTop(): number;
  helpWindowRect(): Rectangle;
  hideSubInputWindows(): void;
  initialize(): void;
  isAnyInputWindowActive(): boolean;
  isTimeActive(): boolean;
  itemWindowRect(): Rectangle;
  logWindowRect(): Rectangle;
  needsInputWindowChange(): boolean;
  needsSlowFadeOut(): boolean;
  onActorCancel(): void;
  onActorOk(): void;
  onEnemyCancel(): void;
  onEnemyOk(): void;
  onItemCancel(): void;
  onItemOk(): void;
  onSelectAction(): void;
  onSkillCancel(): void;
  onSkillOk(): void;
  partyCommandWindowRect(): Rectangle;
  selectNextCommand(): void;
  selectPreviousCommand(): void;
  shouldAutosave(): boolean;
  shouldOpenStatusWindow(): boolean;
  skillWindowRect(): Rectangle;
  start(): void;
  startActorCommandSelection(): void;
  startActorSelection(): void;
  startEnemySelection(): void;
  startPartyCommandSelection(): void;
  statusWindowRect(): Rectangle;
  statusWindowX(): number;
  stop(): void;
  terminate(): void;
  update(): void;
  updateBattleProcess(): void;
  updateCancelButton(): void;
  updateInputWindowVisibility(): void;
  updateLogWindowVisibility(): void;
  updateStatusWindowPosition(): void;
  updateStatusWindowVisibility(): void;
  updateVisibility(): void;
  windowAreaHeight(): number;
}
