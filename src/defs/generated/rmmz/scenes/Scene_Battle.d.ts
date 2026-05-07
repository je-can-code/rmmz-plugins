/**
 * Generated from project/js/rmmz_scenes.js
 * Class: Scene_Battle
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Scene_Battle extends Scene_Message
{
  /**
   * Inferred engine backing field.
   *
   * Type: `unknown`.
   * Initialized in: none.
   * Written in: {@link Scene_Battle#createActorCommandWindow}.
   * Read in: {@link Scene_Battle#closeCommandWindows}, {@link Scene_Battle#commandItem}, {@link Scene_Battle#commandSkill}, {@link Scene_Battle#isAnyInputWindowActive}, {@link Scene_Battle#needsInputWindowChange}, {@link Scene_Battle#onActorCancel}, {@link Scene_Battle#onEnemyCancel}, {@link Scene_Battle#onItemCancel}, {@link Scene_Battle#onSkillCancel}, {@link Scene_Battle#startActorCommandSelection}, {@link Scene_Battle#startPartyCommandSelection}, {@link Scene_Battle#stop}.
   */
  _actorCommandWindow: unknown;
  /**
   * Inferred engine backing field.
   *
   * Type: `Window_BattleActor`.
   * Initialized in: none.
   * Written in: {@link Scene_Battle#createActorWindow}.
   * Read in: {@link Scene_Battle#createActorWindow}, {@link Scene_Battle#hideSubInputWindows}, {@link Scene_Battle#isAnyInputWindowActive}, {@link Scene_Battle#onActorCancel}, {@link Scene_Battle#onActorOk}, {@link Scene_Battle#startActorSelection}.
   */
  _actorWindow: Window_BattleActor;
  /**
   * Inferred engine backing field.
   *
   * Type: `Sprite_Button`.
   * Initialized in: none.
   * Written in: {@link Scene_Battle#createCancelButton}.
   * Read in: {@link Scene_Battle#createCancelButton}, {@link Scene_Battle#updateCancelButton}.
   */
  _cancelButton: Sprite_Button;
  /**
   * Inferred engine backing field.
   *
   * Type: `Window_BattleEnemy`.
   * Initialized in: none.
   * Written in: {@link Scene_Battle#createEnemyWindow}.
   * Read in: {@link Scene_Battle#createEnemyWindow}, {@link Scene_Battle#hideSubInputWindows}, {@link Scene_Battle#isAnyInputWindowActive}, {@link Scene_Battle#onEnemyCancel}, {@link Scene_Battle#onEnemyOk}, {@link Scene_Battle#startEnemySelection}.
   */
  _enemyWindow: Window_BattleEnemy;
  /**
   * Inferred engine backing field.
   *
   * Type: `Window_Help`.
   * Initialized in: none.
   * Written in: {@link Scene_Battle#createHelpWindow}.
   * Read in: {@link Scene_Battle#createHelpWindow}, {@link Scene_Battle#createItemWindow}, {@link Scene_Battle#createSkillWindow}, {@link Scene_Battle#updateLogWindowVisibility}.
   */
  _helpWindow: Window_Help;
  /**
   * Inferred engine backing field.
   *
   * Type: `Window_BattleItem`.
   * Initialized in: none.
   * Written in: {@link Scene_Battle#createItemWindow}.
   * Read in: {@link Scene_Battle#commandItem}, {@link Scene_Battle#createItemWindow}, {@link Scene_Battle#hideSubInputWindows}, {@link Scene_Battle#isAnyInputWindowActive}, {@link Scene_Battle#isTimeActive}, {@link Scene_Battle#onActorCancel}, {@link Scene_Battle#onEnemyCancel}, {@link Scene_Battle#onItemCancel}, {@link Scene_Battle#onItemOk}.
   */
  _itemWindow: Window_BattleItem;
  /**
   * Inferred engine backing field.
   *
   * Type: `Window_BattleLog`.
   * Initialized in: none.
   * Written in: {@link Scene_Battle#createLogWindow}.
   * Read in: {@link Scene_Battle#createDisplayObjects}, {@link Scene_Battle#createLogWindow}, {@link Scene_Battle#updateLogWindowVisibility}.
   */
  _logWindow: Window_BattleLog;
  /**
   * Inferred engine backing field.
   *
   * Type: `unknown`.
   * Initialized in: none.
   * Written in: {@link Scene_Battle#createPartyCommandWindow}.
   * Read in: {@link Scene_Battle#closeCommandWindows}, {@link Scene_Battle#isAnyInputWindowActive}, {@link Scene_Battle#startActorCommandSelection}, {@link Scene_Battle#startPartyCommandSelection}, {@link Scene_Battle#statusWindowX}, {@link Scene_Battle#stop}, {@link Scene_Battle#updateCancelButton}.
   */
  _partyCommandWindow: unknown;
  /**
   * Inferred engine backing field.
   *
   * Type: `Window_BattleSkill`.
   * Initialized in: none.
   * Written in: {@link Scene_Battle#createSkillWindow}.
   * Read in: {@link Scene_Battle#commandSkill}, {@link Scene_Battle#createSkillWindow}, {@link Scene_Battle#hideSubInputWindows}, {@link Scene_Battle#isAnyInputWindowActive}, {@link Scene_Battle#isTimeActive}, {@link Scene_Battle#onActorCancel}, {@link Scene_Battle#onEnemyCancel}, {@link Scene_Battle#onSkillCancel}, {@link Scene_Battle#onSkillOk}.
   */
  _skillWindow: Window_BattleSkill;
  /**
   * Inferred engine backing field.
   *
   * Type: `Spriteset_Battle`.
   * Initialized in: none.
   * Written in: {@link Scene_Battle#createSpriteset}.
   * Read in: {@link Scene_Battle#createDisplayObjects}, {@link Scene_Battle#createSpriteset}.
   */
  _spriteset: Spriteset_Battle;
  /**
   * Inferred engine backing field.
   *
   * Type: `unknown`.
   * Initialized in: none.
   * Written in: {@link Scene_Battle#createStatusWindow}.
   * Read in: {@link Scene_Battle#commandItem}, {@link Scene_Battle#commandSkill}, {@link Scene_Battle#endCommandSelection}, {@link Scene_Battle#enemyWindowRect}, {@link Scene_Battle#onEnemyCancel}, {@link Scene_Battle#onItemCancel}, {@link Scene_Battle#onSkillCancel}, {@link Scene_Battle#start}, {@link Scene_Battle#startActorCommandSelection}, {@link Scene_Battle#startEnemySelection}, {@link Scene_Battle#startPartyCommandSelection}, {@link Scene_Battle#stop}, {@link Scene_Battle#updateStatusWindowPosition}, {@link Scene_Battle#updateStatusWindowVisibility}.
   */
  _statusWindow: unknown;
  /**
   * Gets actor command window rect.
   * @returns The result.
   */
  actorCommandWindowRect(): Rectangle;
  /**
   * Gets actor window rect.
   * @returns The result.
   */
  actorWindowRect(): Rectangle;
  /**
   * Gets button area top.
   * @returns The result.
   */
  buttonAreaTop(): number;
  /**
   * Performs change input window.
   */
  changeInputWindow(): void;
  /**
   * Performs close command windows.
   */
  closeCommandWindows(): void;
  /**
   * Performs command attack.
   */
  commandAttack(): void;
  /**
   * Performs command cancel.
   */
  commandCancel(): void;
  /**
   * Performs command escape.
   */
  commandEscape(): void;
  /**
   * Performs command fight.
   */
  commandFight(): void;
  /**
   * Performs command guard.
   */
  commandGuard(): void;
  /**
   * Performs command item.
   */
  commandItem(): void;
  /**
   * Performs command skill.
   */
  commandSkill(): void;
  /**
   * Performs create.
   */
  create(): void;
  /**
   * Creates actor command window.
   */
  createActorCommandWindow(): void;
  /**
   * Creates actor window.
   */
  createActorWindow(): void;
  /**
   * Creates all windows.
   */
  createAllWindows(): void;
  /**
   * Creates buttons.
   */
  createButtons(): void;
  /**
   * Creates cancel button.
   */
  createCancelButton(): void;
  /**
   * Creates display objects.
   */
  createDisplayObjects(): void;
  /**
   * Creates enemy window.
   */
  createEnemyWindow(): void;
  /**
   * Creates help window.
   */
  createHelpWindow(): void;
  /**
   * Creates item window.
   */
  createItemWindow(): void;
  /**
   * Creates log window.
   */
  createLogWindow(): void;
  /**
   * Creates party command window.
   */
  createPartyCommandWindow(): void;
  /**
   * Creates skill window.
   */
  createSkillWindow(): void;
  /**
   * Creates spriteset.
   */
  createSpriteset(): void;
  /**
   * Creates status window.
   */
  createStatusWindow(): void;
  /**
   * Performs end command selection.
   */
  endCommandSelection(): void;
  /**
   * Gets enemy window rect.
   * @returns The result.
   */
  enemyWindowRect(): Rectangle;
  /**
   * Gets help area bottom.
   * @returns The result.
   */
  helpAreaBottom(): number;
  /**
   * Gets help area height.
   * @returns The result.
   */
  helpAreaHeight(): number;
  /**
   * Gets help area top.
   * @returns The result.
   */
  helpAreaTop(): number;
  /**
   * Gets help window rect.
   * @returns The result.
   */
  helpWindowRect(): Rectangle;
  /**
   * Performs hide sub input windows.
   */
  hideSubInputWindows(): void;
  /**
   * Initializes initialize.
   */
  initialize(): void;
  /**
   * Determines whether any input window active.
   * @returns True if any input window active; false otherwise.
   */
  isAnyInputWindowActive(): boolean;
  /**
   * Determines whether time active.
   * @returns True if time active; false otherwise.
   */
  isTimeActive(): boolean;
  /**
   * Gets item window rect.
   * @returns The result.
   */
  itemWindowRect(): Rectangle;
  /**
   * Gets log window rect.
   * @returns The result.
   */
  logWindowRect(): Rectangle;
  /**
   * Gets needs input window change.
   * @returns The result.
   */
  needsInputWindowChange(): boolean;
  /**
   * Gets needs slow fade out.
   * @returns The result.
   */
  needsSlowFadeOut(): boolean;
  /**
   * Performs on actor cancel.
   */
  onActorCancel(): void;
  /**
   * Performs on actor ok.
   */
  onActorOk(): void;
  /**
   * Performs on enemy cancel.
   */
  onEnemyCancel(): void;
  /**
   * Performs on enemy ok.
   */
  onEnemyOk(): void;
  /**
   * Performs on item cancel.
   */
  onItemCancel(): void;
  /**
   * Performs on item ok.
   */
  onItemOk(): void;
  /**
   * Performs on select action.
   */
  onSelectAction(): void;
  /**
   * Performs on skill cancel.
   */
  onSkillCancel(): void;
  /**
   * Performs on skill ok.
   */
  onSkillOk(): void;
  /**
   * Gets party command window rect.
   * @returns The result.
   */
  partyCommandWindowRect(): Rectangle;
  /**
   * Performs select next command.
   */
  selectNextCommand(): void;
  /**
   * Performs select previous command.
   */
  selectPreviousCommand(): void;
  /**
   * Gets should autosave.
   * @returns The result.
   */
  shouldAutosave(): boolean;
  /**
   * Gets should open status window.
   * @returns The result.
   */
  shouldOpenStatusWindow(): boolean;
  /**
   * Gets skill window rect.
   * @returns The result.
   */
  skillWindowRect(): Rectangle;
  /**
   * Performs start.
   */
  start(): void;
  /**
   * Performs start actor command selection.
   */
  startActorCommandSelection(): void;
  /**
   * Performs start actor selection.
   */
  startActorSelection(): void;
  /**
   * Performs start enemy selection.
   */
  startEnemySelection(): void;
  /**
   * Performs start party command selection.
   */
  startPartyCommandSelection(): void;
  /**
   * Gets status window rect.
   * @returns The result.
   */
  statusWindowRect(): Rectangle;
  /**
   * Gets status window x.
   * @returns The result.
   */
  statusWindowX(): number;
  /**
   * Performs stop.
   */
  stop(): void;
  /**
   * Performs terminate.
   */
  terminate(): void;
  /**
   * Performs update.
   */
  update(): void;
  /**
   * Updates battle process.
   */
  updateBattleProcess(): void;
  /**
   * Updates cancel button.
   */
  updateCancelButton(): void;
  /**
   * Updates input window visibility.
   */
  updateInputWindowVisibility(): void;
  /**
   * Updates log window visibility.
   */
  updateLogWindowVisibility(): void;
  /**
   * Updates status window position.
   */
  updateStatusWindowPosition(): void;
  /**
   * Updates status window visibility.
   */
  updateStatusWindowVisibility(): void;
  /**
   * Updates visibility.
   */
  updateVisibility(): void;
  /**
   * Gets window area height.
   * @returns The result.
   */
  windowAreaHeight(): number;
}
