/**
 * Generated from project/js/rmmz_sprites.js
 * Class: Spriteset_Battle
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Spriteset_Battle
{
  /**
   * Instance fields inferred from `this._*` assignments across vanilla engine sources.
   */
  _actorSprites: unknown[];
  _back1Sprite: Sprite_Battleback;
  _back2Sprite: Sprite_Battleback;
  _backgroundFilter: PIXI.filters.BlurFilter;
  _backgroundSprite: Sprite;
  _battleField: Sprite;
  _battlebackLocated: boolean;
  _effectsContainer: unknown;
  _enemySprites: unknown;
  battleFieldOffsetY(): number;
  battlerSprites(): Sprite[];
  compareEnemySprite(a: Sprite_Enemy, b: Sprite_Enemy): number;
  createActors(): void;
  createBackground(): void;
  createBattleField(): void;
  createBattleback(): void;
  createEnemies(): void;
  createLowerLayer(): void;
  findTargetSprite(target: Game_Battler): Sprite | undefined;
  initialize(): void;
  isAnyoneMoving(): boolean;
  isBusy(): boolean;
  isEffecting(): boolean;
  loadSystemImages(): void;
  update(): void;
  updateActors(): void;
  updateBattleback(): void;
}
