/**
 * Generated from project/js/rmmz_scenes.js
 * Class: Scene_ItemBase
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Scene_ItemBase
{
  /**
   * Instance fields inferred from `this._*` assignments across vanilla engine sources.
   */
  _actorWindow: Window_MenuActor;
  activateItemWindow(): void;
  actorWindowRect(): Rectangle;
  applyItem(): void;
  canUse(): boolean;
  checkCommonEvent(): void;
  create(): void;
  createActorWindow(): void;
  determineItem(): void;
  hideActorWindow(): void;
  initialize(): void;
  isActorWindowActive(): boolean;
  isCursorLeft(): boolean;
  isItemEffectsValid(): boolean;
  item(): RPG_Item | RPG_Skill | RPG_Weapon | RPG_Armor | null;
  itemTargetActors(): Game_Actor[];
  onActorCancel(): void;
  onActorOk(): void;
  showActorWindow(): void;
  useItem(): void;
  user(): null;
}
