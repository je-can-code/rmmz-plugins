/**
 * Generated from project/js/rmmz_scenes.js
 * Class: Scene_MenuBase
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Scene_MenuBase
{
  /**
   * Instance fields inferred from `this._*` assignments across vanilla engine sources.
   */
  _actor: unknown;
  _backgroundFilter: PIXI.filters.BlurFilter;
  _backgroundSprite: Sprite;
  _cancelButton: Sprite_Button;
  _helpWindow: Window_Help;
  _pagedownButton: Sprite_Button;
  _pageupButton: Sprite_Button;
  actor(): Game_Actor;
  arePageButtonsEnabled(): boolean;
  create(): void;
  createBackground(): void;
  createButtons(): void;
  createCancelButton(): void;
  createHelpWindow(): void;
  createPageButtons(): void;
  helpAreaBottom(): number;
  helpAreaHeight(): number;
  helpAreaTop(): number;
  helpWindowRect(): Rectangle;
  initialize(): void;
  mainAreaBottom(): number;
  mainAreaHeight(): number;
  mainAreaTop(): number;
  needsCancelButton(): boolean;
  needsPageButtons(): boolean;
  nextActor(): void;
  onActorChange(): void;
  previousActor(): void;
  setBackgroundOpacity(opacity: number): void;
  update(): void;
  updateActor(): void;
  updatePageButtons(): void;
}
