/**
 * Generated from project/js/rmmz_sprites.js
 * Class: Sprite_Button
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Sprite_Button
{
  /**
   * Instance fields inferred from `this._*` assignments across vanilla engine sources.
   */
  _buttonType: number;
  _clickHandler: null | () => void;
  _coldFrame: null | Rectangle;
  _hotFrame: null | Rectangle;
  blockHeight(): number;
  blockWidth(): number;
  buttonData(): object;
  checkBitmap(): void;
  initialize(buttonType: number): void;
  loadButtonImage(): void;
  onClick(): void;
  setClickHandler(method: () => void): void;
  setColdFrame(x: number, y: number, width: number, height: number): void;
  setHotFrame(x: number, y: number, width: number, height: number): void;
  setupFrames(): void;
  update(): void;
  updateFrame(): void;
  updateOpacity(): void;
}
