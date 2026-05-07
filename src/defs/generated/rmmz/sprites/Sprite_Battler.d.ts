/**
 * Generated from project/js/rmmz_sprites.js
 * Class: Sprite_Battler
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Sprite_Battler
{
  /**
   * Instance fields inferred from `this._*` assignments across vanilla engine sources.
   */
  _battler: null | Game_Battler;
  _damages: unknown[];
  _homeX: number;
  _homeY: number;
  _movementDuration: number;
  _offsetX: number;
  _offsetY: number;
  _selectionEffectCount: number;
  _targetOffsetX: number;
  _targetOffsetY: number;
  checkBattler(battler: Game_Battler): boolean;
  createDamageSprite(): void;
  damageOffsetX(): number;
  damageOffsetY(): number;
  destroyDamageSprite(sprite: Sprite): void;
  inHomePosition(): boolean;
  initMembers(): void;
  initialize(battler: Game_Battler): void;
  isEffecting(): boolean;
  isMoving(): boolean;
  mainSprite(): Sprite_Battler;
  onClick(): void;
  onMouseEnter(): void;
  onMoveEnd(): void;
  onPress(): void;
  setBattler(battler: Game_Battler): void;
  setHome(x: number, y: number): void;
  setupDamagePopup(): void;
  startMove(x: number, y: number, duration: number): void;
  update(): void;
  updateBitmap(): void;
  updateDamagePopup(): void;
  updateFrame(): void;
  updateMain(): void;
  updateMove(): void;
  updatePosition(): void;
  updateSelectionEffect(): void;
  updateVisibility(): void;
}
