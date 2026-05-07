/**
 * Generated from project/js/rmmz_scenes.js
 * Class: Scene_Menu
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Scene_Menu
{
  /**
   * Inferred engine backing field.
   *
   * Type: `unknown`.
   * Initialized in: none.
   * Written in: {@link Scene_Menu#createCommandWindow}.
   * Read in: {@link Scene_Menu#onFormationCancel}, {@link Scene_Menu#onPersonalCancel}, {@link Scene_Menu#onPersonalOk}.
   */
  _commandWindow: unknown;
  /**
   * Inferred engine backing field.
   *
   * Type: `Window_Gold`.
   * Initialized in: none.
   * Written in: {@link Scene_Menu#createGoldWindow}.
   * Read in: {@link Scene_Menu#createGoldWindow}.
   */
  _goldWindow: Window_Gold;
  /**
   * Inferred engine backing field.
   *
   * Type: `Window_MenuStatus`.
   * Initialized in: none.
   * Written in: {@link Scene_Menu#createStatusWindow}.
   * Read in: {@link Scene_Menu#commandFormation}, {@link Scene_Menu#commandPersonal}, {@link Scene_Menu#createStatusWindow}, {@link Scene_Menu#onFormationCancel}, {@link Scene_Menu#onFormationOk}, {@link Scene_Menu#onPersonalCancel}, {@link Scene_Menu#start}.
   */
  _statusWindow: Window_MenuStatus;
  /**
   * Performs command formation.
   */
  commandFormation(): void;
  /**
   * Performs command game end.
   */
  commandGameEnd(): void;
  /**
   * Performs command item.
   */
  commandItem(): void;
  /**
   * Performs command options.
   */
  commandOptions(): void;
  /**
   * Performs command personal.
   */
  commandPersonal(): void;
  /**
   * Performs command save.
   */
  commandSave(): void;
  /**
   * Gets command window rect.
   * @returns The result.
   */
  commandWindowRect(): Rectangle;
  /**
   * Performs create.
   */
  create(): void;
  /**
   * Creates command window.
   */
  createCommandWindow(): void;
  /**
   * Creates gold window.
   */
  createGoldWindow(): void;
  /**
   * Creates status window.
   */
  createStatusWindow(): void;
  /**
   * Gets gold window rect.
   * @returns The result.
   */
  goldWindowRect(): Rectangle;
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
   * Performs on formation cancel.
   */
  onFormationCancel(): void;
  /**
   * Performs on formation ok.
   */
  onFormationOk(): void;
  /**
   * Performs on personal cancel.
   */
  onPersonalCancel(): void;
  /**
   * Performs on personal ok.
   */
  onPersonalOk(): void;
  /**
   * Performs start.
   */
  start(): void;
  /**
   * Gets status window rect.
   * @returns The result.
   */
  statusWindowRect(): Rectangle;
}
