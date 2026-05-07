/**
 * Generated from project/js/rmmz_scenes.js
 * Class: Scene_Skill
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Scene_Skill
{
  /**
   * Inferred engine backing field.
   *
   * Type: `Window_SkillList`.
   * Initialized in: none.
   * Written in: {@link Scene_Skill#createItemWindow}.
   * Read in: {@link Scene_Skill#commandSkill}, {@link Scene_Skill#createItemWindow}, {@link Scene_Skill#onActorChange}, {@link Scene_Skill#onItemCancel}, {@link Scene_Skill#refreshActor}, {@link Scene_Skill#useItem}.
   */
  _itemWindow: Window_SkillList;
  /**
   * Inferred engine backing field.
   *
   * Type: `Window_SkillType`.
   * Initialized in: none.
   * Written in: {@link Scene_Skill#createSkillTypeWindow}.
   * Read in: {@link Scene_Skill#createItemWindow}, {@link Scene_Skill#createSkillTypeWindow}, {@link Scene_Skill#onActorChange}, {@link Scene_Skill#onItemCancel}, {@link Scene_Skill#refreshActor}, {@link Scene_Skill#statusWindowRect}.
   */
  _skillTypeWindow: Window_SkillType;
  /**
   * Inferred engine backing field.
   *
   * Type: `Window_SkillStatus`.
   * Initialized in: none.
   * Written in: {@link Scene_Skill#createStatusWindow}.
   * Read in: {@link Scene_Skill#createStatusWindow}, {@link Scene_Skill#itemWindowRect}, {@link Scene_Skill#refreshActor}, {@link Scene_Skill#useItem}.
   */
  _statusWindow: Window_SkillStatus;
  /**
   * Gets are page buttons enabled.
   * @returns The result.
   */
  arePageButtonsEnabled(): boolean;
  /**
   * Performs command skill.
   */
  commandSkill(): void;
  /**
   * Performs create.
   */
  create(): void;
  /**
   * Creates item window.
   */
  createItemWindow(): void;
  /**
   * Creates skill type window.
   */
  createSkillTypeWindow(): void;
  /**
   * Creates status window.
   */
  createStatusWindow(): void;
  /**
   * Initializes initialize.
   */
  initialize(): void;
  /**
   * Gets item window rect.
   * @returns The result.
   */
  itemWindowRect(): Rectangle;
  /**
   * Gets needs page buttons.
   * @returns The result.
   */
  needsPageButtons(): boolean;
  /**
   * Performs on actor change.
   */
  onActorChange(): void;
  /**
   * Performs on item cancel.
   */
  onItemCancel(): void;
  /**
   * Performs on item ok.
   */
  onItemOk(): void;
  /**
   * Performs play se for item.
   */
  playSeForItem(): void;
  /**
   * Performs refresh actor.
   */
  refreshActor(): void;
  /**
   * Gets skill type window rect.
   * @returns The result.
   */
  skillTypeWindowRect(): Rectangle;
  /**
   * Performs start.
   */
  start(): void;
  /**
   * Gets status window rect.
   * @returns The result.
   */
  statusWindowRect(): Rectangle;
  /**
   * Performs use item.
   */
  useItem(): void;
  /**
   * Gets user.
   * @returns The result.
   */
  user(): Game_Actor | undefined;
}
