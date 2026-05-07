/**
 * Generated from project/js/rmmz_windows.js
 * Class: Window_BattleEnemy
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Window_BattleEnemy extends Window_Selectable
{
  /**
   * Inferred engine backing field.
   *
   * Type: `unknown[]`.
   * Initialized in: {@link Window_BattleEnemy#initialize}.
   * Written in: {@link Window_BattleEnemy#initialize}, {@link Window_BattleEnemy#refresh}.
   * Read in: {@link Window_BattleEnemy#drawItem}, {@link Window_BattleEnemy#enemy}, {@link Window_BattleEnemy#maxItems}, {@link Window_BattleEnemy#processTouch}.
   *
   * Consumed by:
   * - `.length`: {@link Window_BattleEnemy#maxItems}.
   */
  _enemies: unknown[];
  /**
   * Performs draw item.
   * @param index The index parameter.
   */
  drawItem(index: number): void;
  /**
   * Gets enemy.
   * @returns The result.
   */
  enemy(): Game_Enemy;
  /**
   * Gets enemy index.
   * @returns The result.
   */
  enemyIndex(): number;
  /**
   * Performs hide.
   */
  hide(): void;
  /**
   * Initializes initialize.
   * @param rect The rect parameter.
   */
  initialize(rect: Rectangle): void;
  /**
   * Gets max cols.
   * @returns The result.
   */
  maxCols(): number;
  /**
   * Gets max items.
   * @returns The result.
   */
  maxItems(): number;
  /**
   * Performs process touch.
   */
  processTouch(): void;
  /**
   * Performs refresh.
   */
  refresh(): void;
  /**
   * Performs select.
   * @param index The index parameter.
   */
  select(index: number): void;
  /**
   * Performs show.
   */
  show(): void;
}
