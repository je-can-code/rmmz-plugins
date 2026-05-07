/**
 * Generated from project/js/rmmz_scenes.js
 * Class: Scene_Status
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Scene_Status
{
  /**
   * Inferred engine backing field.
   *
   * Type: `Window_Help`.
   * Initialized in: none.
   * Written in: {@link Scene_Status#createProfileWindow}.
   * Read in: {@link Scene_Status#createProfileWindow}, {@link Scene_Status#refreshActor}.
   */
  _profileWindow: Window_Help;
  /**
   * Inferred engine backing field.
   *
   * Type: `Window_StatusEquip`.
   * Initialized in: none.
   * Written in: {@link Scene_Status#createStatusEquipWindow}.
   * Read in: {@link Scene_Status#createStatusEquipWindow}, {@link Scene_Status#refreshActor}.
   */
  _statusEquipWindow: Window_StatusEquip;
  /**
   * Inferred engine backing field.
   *
   * Type: `Window_StatusParams`.
   * Initialized in: none.
   * Written in: {@link Scene_Status#createStatusParamsWindow}.
   * Read in: {@link Scene_Status#createStatusParamsWindow}, {@link Scene_Status#refreshActor}.
   */
  _statusParamsWindow: Window_StatusParams;
  /**
   * Inferred engine backing field.
   *
   * Type: `Window_Status`.
   * Initialized in: none.
   * Written in: {@link Scene_Status#createStatusWindow}.
   * Read in: {@link Scene_Status#createStatusWindow}, {@link Scene_Status#onActorChange}, {@link Scene_Status#refreshActor}.
   */
  _statusWindow: Window_Status;
  /**
   * Performs create.
   */
  create(): void;
  /**
   * Creates profile window.
   */
  createProfileWindow(): void;
  /**
   * Creates status equip window.
   */
  createStatusEquipWindow(): void;
  /**
   * Creates status params window.
   */
  createStatusParamsWindow(): void;
  /**
   * Creates status window.
   */
  createStatusWindow(): void;
  /**
   * Gets help area height.
   * @returns The result.
   */
  helpAreaHeight(): number;
  /**
   * Initializes initialize.
   */
  initialize(): void;
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
   * Gets profile height.
   * @returns The result.
   */
  profileHeight(): number;
  /**
   * Gets profile window rect.
   * @returns The result.
   */
  profileWindowRect(): Rectangle;
  /**
   * Performs refresh actor.
   */
  refreshActor(): void;
  /**
   * Performs start.
   */
  start(): void;
  /**
   * Gets status equip window rect.
   * @returns The result.
   */
  statusEquipWindowRect(): Rectangle;
  /**
   * Gets status params height.
   * @returns The result.
   */
  statusParamsHeight(): number;
  /**
   * Gets status params width.
   * @returns The result.
   */
  statusParamsWidth(): number;
  /**
   * Gets status params window rect.
   * @returns The result.
   */
  statusParamsWindowRect(): Rectangle;
  /**
   * Gets status window rect.
   * @returns The result.
   */
  statusWindowRect(): Rectangle;
}
