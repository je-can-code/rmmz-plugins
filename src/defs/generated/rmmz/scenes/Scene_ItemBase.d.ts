/**
 * Generated from project/js/rmmz_scenes.js
 * Class: Scene_ItemBase
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Scene_ItemBase extends Scene_MenuBase
{
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `Window_MenuActor`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Scene_ItemBase#createActorWindow}.<br/>
   * Read in: {@link Scene_ItemBase#createActorWindow}, {@link Scene_ItemBase#determineItem}, {@link Scene_ItemBase#hideActorWindow}, {@link Scene_ItemBase#isActorWindowActive}, {@link Scene_ItemBase#itemTargetActors}, {@link Scene_ItemBase#showActorWindow}, {@link Scene_ItemBase#useItem}.<br/>
   */
  _actorWindow: Window_MenuActor;
  /**
   * Performs activate item window.
   */
  activateItemWindow(): void;
  /**
   * Gets actor window rect.
   * @returns The result.
   */
  actorWindowRect(): Rectangle;
  /**
   * Performs apply item.
   */
  applyItem(): void;
  /**
   * Determines whether use.
   * @returns The result.
   */
  canUse(): unknown;
  /**
   * Performs check common event.
   */
  checkCommonEvent(): void;
  /**
   * Performs create.
   */
  create(): void;
  /**
   * Creates actor window.
   */
  createActorWindow(): void;
  /**
   * Performs determine item.
   */
  determineItem(): void;
  /**
   * Performs hide actor window.
   */
  hideActorWindow(): void;
  /**
   * Initializes initialize.
   */
  initialize(): void;
  /**
   * Determines whether actor window active.
   * @returns True if actor window active; false otherwise.
   */
  isActorWindowActive(): boolean;
  /**
   * Determines whether cursor left.
   * @returns True if cursor left; false otherwise.
   */
  isCursorLeft(): boolean;
  /**
   * Determines whether item effects valid.
   * @returns True if item effects valid; false otherwise.
   */
  isItemEffectsValid(): boolean;
  /**
   * Gets item.
   * @returns The result.
   */
  item(): unknown;
  /**
   * Gets item target actors.
   * @returns The result.
   */
  itemTargetActors(): unknown[];
  /**
   * Performs on actor cancel.
   */
  onActorCancel(): void;
  /**
   * Performs on actor ok.
   */
  onActorOk(): void;
  /**
   * Performs show actor window.
   */
  showActorWindow(): void;
  /**
   * Performs use item.
   */
  useItem(): void;
  /**
   * Gets user.
   * @returns The result.
   */
  user(): null;
}
