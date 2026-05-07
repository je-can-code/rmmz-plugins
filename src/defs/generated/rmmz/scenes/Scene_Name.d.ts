/**
 * Generated from project/js/rmmz_scenes.js
 * Class: Scene_Name
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Scene_Name
{
  /**
   * Inferred engine backing field.
   *
   * Type: `unknown`.
   * Initialized in: none.
   * Written in: {@link Scene_Name#create}.
   * Read in: {@link Scene_Name#createEditWindow}, {@link Scene_Name#onInputOk}.
   */
  _actor: unknown;
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: none.
   * Written in: {@link Scene_Name#prepare}.
   * Read in: {@link Scene_Name#create}.
   */
  _actorId: number;
  /**
   * Inferred engine backing field.
   *
   * Type: `Window_NameEdit`.
   * Initialized in: none.
   * Written in: {@link Scene_Name#createEditWindow}.
   * Read in: {@link Scene_Name#createEditWindow}, {@link Scene_Name#createInputWindow}, {@link Scene_Name#inputWindowRect}, {@link Scene_Name#onInputOk}, {@link Scene_Name#start}.
   */
  _editWindow: Window_NameEdit;
  /**
   * Inferred engine backing field.
   *
   * Type: `Window_NameInput`.
   * Initialized in: none.
   * Written in: {@link Scene_Name#createInputWindow}.
   * Read in: {@link Scene_Name#createInputWindow}.
   */
  _inputWindow: Window_NameInput;
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: none.
   * Written in: {@link Scene_Name#prepare}.
   * Read in: {@link Scene_Name#createEditWindow}.
   */
  _maxLength: number;
  /**
   * Performs create.
   */
  create(): void;
  /**
   * Creates edit window.
   */
  createEditWindow(): void;
  /**
   * Creates input window.
   */
  createInputWindow(): void;
  /**
   * Gets edit window rect.
   * @returns The result.
   */
  editWindowRect(): Rectangle;
  /**
   * Initializes initialize.
   */
  initialize(): void;
  /**
   * Gets input window rect.
   * @returns The result.
   */
  inputWindowRect(): Rectangle;
  /**
   * Performs on input ok.
   */
  onInputOk(): void;
  /**
   * Performs prepare.
   * @param actorId The actorId parameter.
   * @param maxLength The maxLength parameter.
   */
  prepare(actorId: number, maxLength: number): void;
  /**
   * Performs start.
   */
  start(): void;
}
