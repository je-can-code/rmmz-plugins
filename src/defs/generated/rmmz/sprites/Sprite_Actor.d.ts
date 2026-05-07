/**
 * Generated from project/js/rmmz_sprites.js
 * Class: Sprite_Actor
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Sprite_Actor
{
  /**
   * Instance fields inferred from `this._*` assignments across vanilla engine sources.
   */
  _actor: Game_Battler;
  _battlerName: string;
  _mainSprite: Sprite;
  _motion: null;
  _motionCount: number;
  _pattern: number;
  _shadowSprite: Sprite;
  _stateSprite: Sprite_StateOverlay;
  _weaponSprite: Sprite_Weapon;
  createMainSprite(): void;
  createShadowSprite(): void;
  createStateSprite(): void;
  createWeaponSprite(): void;
  damageOffsetX(): number;
  damageOffsetY(): number;
  initMembers(): void;
  initialize(battler: Game_Battler): void;
  mainSprite(): Sprite;
  motionSpeed(): number;
  moveToStartPosition(): void;
  onMoveEnd(): void;
  refreshMotion(): void;
  retreat(): void;
  setActorHome(index: number): void;
  setBattler(battler: Game_Battler): void;
  setupMotion(): void;
  setupWeaponAnimation(): void;
  shouldStepForward(): boolean;
  startEntryMotion(): void;
  startMotion(motionType: number): void;
  stepBack(): void;
  stepForward(): void;
  update(): void;
  updateBitmap(): void;
  updateFrame(): void;
  updateMain(): void;
  updateMotion(): void;
  updateMotionCount(): void;
  updateMove(): void;
  updateShadow(): void;
  updateTargetPosition(): void;
}
