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
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `unknown[]`.<br/>
   * Initialized in: {@link Window_BattleEnemy#initialize}.<br/>
   * Written in: {@link Window_BattleEnemy#initialize}, {@link Window_BattleEnemy#refresh}.<br/>
   * Read in: {@link Window_BattleEnemy#drawItem}, {@link Window_BattleEnemy#enemy}, {@link Window_BattleEnemy#maxItems}, {@link Window_BattleEnemy#processTouch}.<br/>
   *<br/>
   * Consumed by:<br/>
   * - `.length`: {@link Window_BattleEnemy#maxItems}.<br/>
   */
  _enemies: unknown[];
  /**
   * Performs draw item.
   * @param index The index parameter.
   */
  drawItem(index: unknown): void;
  /**
   * Gets enemy.
   * @returns The result.
   */
  enemy(): unknown;
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
  initialize(rect: unknown): void;
  /**
   * Gets max cols.
   * @returns The result.
   */
  maxCols(): number;
  /**
   * Gets max items.
   * @returns The result.
   */
  maxItems(): unknown;
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
  select(index: unknown): void;
  /**
   * Performs show.
   */
  show(): void;
}
