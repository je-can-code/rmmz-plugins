/**
 * Generated from project/js/rmmz_sprites.js
 * Class: Spriteset_Battle
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Spriteset_Battle extends Spriteset_Base
{
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `unknown[]`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Spriteset_Battle#createActors}.<br/>
   * Read in: {@link Spriteset_Battle#battlerSprites}, {@link Spriteset_Battle#createActors}, {@link Spriteset_Battle#updateActors}.<br/>
   *<br/>
   * Consumed by:<br/>
   * - `.length`: {@link Spriteset_Battle#updateActors}.<br/>
   * - `push()`: {@link Spriteset_Battle#createActors}.<br/>
   */
  _actorSprites: unknown[];
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `Sprite_Battleback`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Spriteset_Battle#createBattleback}.<br/>
   * Read in: {@link Spriteset_Battle#createBattleback}, {@link Spriteset_Battle#updateBattleback}.<br/>
   */
  _back1Sprite: Sprite_Battleback;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `Sprite_Battleback`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Spriteset_Battle#createBattleback}.<br/>
   * Read in: {@link Spriteset_Battle#createBattleback}, {@link Spriteset_Battle#updateBattleback}.<br/>
   */
  _back2Sprite: Sprite_Battleback;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `PIXI.filters.BlurFilter`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Spriteset_Battle#createBackground}.<br/>
   * Read in: {@link Spriteset_Battle#createBackground}.<br/>
   */
  _backgroundFilter: PIXI.filters.BlurFilter;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `Sprite`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Spriteset_Battle#createBackground}.<br/>
   * Read in: {@link Spriteset_Battle#createBackground}.<br/>
   */
  _backgroundSprite: Sprite;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `Sprite`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Spriteset_Battle#createBattleField}.<br/>
   * Read in: {@link Spriteset_Battle#createActors}, {@link Spriteset_Battle#createBattleField}, {@link Spriteset_Battle#createEnemies}.<br/>
   */
  _battleField: Sprite;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `boolean`.<br/>
   * Initialized in: {@link Spriteset_Battle#initialize}.<br/>
   * Written in: {@link Spriteset_Battle#initialize}, {@link Spriteset_Battle#updateBattleback}.<br/>
   * Read in: {@link Spriteset_Battle#updateBattleback}.<br/>
   */
  _battlebackLocated: boolean;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `unknown`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Spriteset_Battle#createBattleField}.<br/>
   * Read in: none.<br/>
   */
  _effectsContainer: unknown;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `unknown`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Spriteset_Battle#createEnemies}.<br/>
   * Read in: {@link Spriteset_Battle#battlerSprites}.<br/>
   */
  _enemySprites: unknown;
  /**
   * Gets battle field offset y.
   * @returns The result.
   */
  battleFieldOffsetY(): number;
  /**
   * Gets battler sprites.
   * @returns The result.
   */
  battlerSprites(): unknown;
  /**
   * Gets compare enemy sprite.
   * @param a The a parameter.
   * @param b The b parameter.
   * @returns The result.
   */
  compareEnemySprite(a: unknown, b: unknown): unknown;
  /**
   * Creates actors.
   */
  createActors(): void;
  /**
   * Creates background.
   */
  createBackground(): void;
  /**
   * Creates battle field.
   */
  createBattleField(): void;
  /**
   * Creates battleback.
   */
  createBattleback(): void;
  /**
   * Creates enemies.
   */
  createEnemies(): void;
  /**
   * Creates lower layer.
   */
  createLowerLayer(): void;
  /**
   * Gets find target sprite.
   * @param target The target parameter.
   * @returns The result.
   */
  findTargetSprite(target: unknown): unknown;
  /**
   * Initializes initialize.
   */
  initialize(): void;
  /**
   * Determines whether anyone moving.
   * @returns True if anyone moving; false otherwise.
   */
  isAnyoneMoving(): boolean;
  /**
   * Determines whether busy.
   * @returns True if busy; false otherwise.
   */
  isBusy(): boolean;
  /**
   * Determines whether effecting.
   * @returns True if effecting; false otherwise.
   */
  isEffecting(): boolean;
  /**
   * Performs load system images.
   */
  loadSystemImages(): void;
  /**
   * Performs update.
   */
  update(): void;
  /**
   * Updates actors.
   */
  updateActors(): void;
  /**
   * Updates battleback.
   */
  updateBattleback(): void;
}
