/**
 * Generated from project/js/rmmz_scenes.js
 * Class: Scene_Debug
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Scene_Debug
{
  /**
   * Inferred engine backing field.
   *
   * Type: `Window_Base`.
   * Initialized in: none.
   * Written in: {@link Scene_Debug#createDebugHelpWindow}.
   * Read in: {@link Scene_Debug#createDebugHelpWindow}, {@link Scene_Debug#refreshHelpWindow}.
   */
  _debugHelpWindow: Window_Base;
  /**
   * Inferred engine backing field.
   *
   * Type: `Window_DebugEdit`.
   * Initialized in: none.
   * Written in: {@link Scene_Debug#createEditWindow}.
   * Read in: {@link Scene_Debug#createEditWindow}, {@link Scene_Debug#debugHelpWindowRect}, {@link Scene_Debug#onEditCancel}, {@link Scene_Debug#onRangeOk}, {@link Scene_Debug#refreshHelpWindow}.
   */
  _editWindow: Window_DebugEdit;
  /**
   * Inferred engine backing field.
   *
   * Type: `Window_DebugRange`.
   * Initialized in: none.
   * Written in: {@link Scene_Debug#createRangeWindow}.
   * Read in: {@link Scene_Debug#createEditWindow}, {@link Scene_Debug#createRangeWindow}, {@link Scene_Debug#editWindowRect}, {@link Scene_Debug#helpText}, {@link Scene_Debug#onEditCancel}.
   */
  _rangeWindow: Window_DebugRange;
  /**
   * Performs create.
   */
  create(): void;
  /**
   * Creates debug help window.
   */
  createDebugHelpWindow(): void;
  /**
   * Creates edit window.
   */
  createEditWindow(): void;
  /**
   * Creates range window.
   */
  createRangeWindow(): void;
  /**
   * Gets debug help window rect.
   * @returns The result.
   */
  debugHelpWindowRect(): Rectangle;
  /**
   * Gets edit window rect.
   * @returns The result.
   */
  editWindowRect(): Rectangle;
  /**
   * Gets help text.
   * @returns The result.
   */
  helpText(): string;
  /**
   * Initializes initialize.
   */
  initialize(): void;
  /**
   * Gets needs cancel button.
   * @returns The result.
   */
  needsCancelButton(): boolean;
  /**
   * Performs on edit cancel.
   */
  onEditCancel(): void;
  /**
   * Performs on range ok.
   */
  onRangeOk(): void;
  /**
   * Gets range window rect.
   * @returns The result.
   */
  rangeWindowRect(): Rectangle;
  /**
   * Performs refresh help window.
   */
  refreshHelpWindow(): void;
}
