/**
 * Generated from project/js/rmmz_sprites.js
 * Class: Sprite_Enemy
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Sprite_Enemy
{
  /**
   * Instance fields inferred from `this._*` assignments across vanilla engine sources.
   */
  _appeared: boolean;
  _battlerHue: number;
  _battlerName: null | string;
  _effectDuration: number;
  _effectType: null | number;
  _enemy: null | Game_Battler;
  _shake: number;
  _stateIconSprite: Sprite_StateIcon;
  createStateIconSprite(): void;
  damageOffsetX(): number;
  damageOffsetY(): number;
  initMembers(): void;
  initVisibility(): void;
  initialize(battler: Game_Battler): void;
  isEffecting(): boolean;
  loadBitmap(name: string): void;
  revertToNormal(): void;
  setBattler(battler: Game_Battler): void;
  setHue(hue: number): void;
  setupEffect(): void;
  startAppear(): void;
  startBlink(): void;
  startBossCollapse(): void;
  startCollapse(): void;
  startDisappear(): void;
  startEffect(effectType: number): void;
  startInstantCollapse(): void;
  startWhiten(): void;
  update(): void;
  updateAppear(): void;
  updateBitmap(): void;
  updateBlink(): void;
  updateBossCollapse(): void;
  updateCollapse(): void;
  updateDisappear(): void;
  updateEffect(): void;
  updateFrame(): void;
  updateInstantCollapse(): void;
  updatePosition(): void;
  updateStateSprite(): void;
  updateWhiten(): void;
}
