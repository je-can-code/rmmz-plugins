/**
 * Generated from project/js/rmmz_windows.js
 * Class: Window_BattleEnemy
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Window_BattleEnemy
{
  /**
   * Instance fields inferred from `this._*` assignments across vanilla engine sources.
   */
  _enemies: unknown[];
  drawItem(index: number): void;
  enemy(): Game_Enemy;
  enemyIndex(): number;
  hide(): void;
  initialize(rect: Rectangle): void;
  maxCols(): number;
  maxItems(): number;
  processTouch(): void;
  refresh(): void;
  select(index: number): void;
  show(): void;
}
