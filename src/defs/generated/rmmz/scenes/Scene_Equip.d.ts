/**
 * Generated from project/js/rmmz_scenes.js
 * Class: Scene_Equip
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Scene_Equip extends Scene_MenuBase
{
  /**
   * Inferred engine backing field.
   *
   * Type: `Window_EquipCommand`.
   * Initialized in: none.
   * Written in: {@link Scene_Equip#createCommandWindow}.
   * Read in: {@link Scene_Equip#commandClear}, {@link Scene_Equip#commandOptimize}, {@link Scene_Equip#createCommandWindow}, {@link Scene_Equip#onActorChange}, {@link Scene_Equip#onSlotCancel}.
   */
  _commandWindow: Window_EquipCommand;
  /**
   * Inferred engine backing field.
   *
   * Type: `Window_EquipItem`.
   * Initialized in: none.
   * Written in: {@link Scene_Equip#createItemWindow}.
   * Read in: {@link Scene_Equip#arePageButtonsEnabled}, {@link Scene_Equip#createItemWindow}, {@link Scene_Equip#executeEquipChange}, {@link Scene_Equip#hideItemWindow}, {@link Scene_Equip#onItemOk}, {@link Scene_Equip#onSlotOk}, {@link Scene_Equip#refreshActor}.
   */
  _itemWindow: Window_EquipItem;
  /**
   * Inferred engine backing field.
   *
   * Type: `Window_EquipSlot`.
   * Initialized in: none.
   * Written in: {@link Scene_Equip#createSlotWindow}.
   * Read in: {@link Scene_Equip#commandClear}, {@link Scene_Equip#commandEquip}, {@link Scene_Equip#commandOptimize}, {@link Scene_Equip#createItemWindow}, {@link Scene_Equip#createSlotWindow}, {@link Scene_Equip#executeEquipChange}, {@link Scene_Equip#hideItemWindow}, {@link Scene_Equip#onActorChange}, {@link Scene_Equip#onItemOk}, {@link Scene_Equip#onSlotCancel}, {@link Scene_Equip#onSlotOk}, {@link Scene_Equip#refreshActor}.
   */
  _slotWindow: Window_EquipSlot;
  /**
   * Inferred engine backing field.
   *
   * Type: `Window_EquipStatus`.
   * Initialized in: none.
   * Written in: {@link Scene_Equip#createStatusWindow}.
   * Read in: {@link Scene_Equip#commandClear}, {@link Scene_Equip#commandOptimize}, {@link Scene_Equip#createItemWindow}, {@link Scene_Equip#createSlotWindow}, {@link Scene_Equip#createStatusWindow}, {@link Scene_Equip#onItemOk}, {@link Scene_Equip#refreshActor}.
   */
  _statusWindow: Window_EquipStatus;
  /**
   * Gets are page buttons enabled.
   * @returns The result.
   */
  arePageButtonsEnabled(): boolean;
  /**
   * Performs command clear.
   */
  commandClear(): void;
  /**
   * Performs command equip.
   */
  commandEquip(): void;
  /**
   * Performs command optimize.
   */
  commandOptimize(): void;
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
   * Creates item window.
   */
  createItemWindow(): void;
  /**
   * Creates slot window.
   */
  createSlotWindow(): void;
  /**
   * Creates status window.
   */
  createStatusWindow(): void;
  /**
   * Performs execute equip change.
   */
  executeEquipChange(): void;
  /**
   * Performs hide item window.
   */
  hideItemWindow(): void;
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
   * Performs on slot cancel.
   */
  onSlotCancel(): void;
  /**
   * Performs on slot ok.
   */
  onSlotOk(): void;
  /**
   * Performs refresh actor.
   */
  refreshActor(): void;
  /**
   * Gets slot window rect.
   * @returns The result.
   */
  slotWindowRect(): Rectangle;
  /**
   * Gets status width.
   * @returns The result.
   */
  statusWidth(): number;
  /**
   * Gets status window rect.
   * @returns The result.
   */
  statusWindowRect(): Rectangle;
}
