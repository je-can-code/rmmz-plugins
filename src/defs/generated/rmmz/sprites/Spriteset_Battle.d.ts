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
   * Inferred engine backing field.
   *
   * Type: `unknown[]`.
   * Initialized in: none.
   * Written in: {@link Spriteset_Battle#createActors}.
   * Read in: {@link Spriteset_Battle#battlerSprites}, {@link Spriteset_Battle#createActors}, {@link Spriteset_Battle#updateActors}.
   *
   * Consumed by:
   * - `.length`: {@link Spriteset_Battle#updateActors}.
   * - `push()`: {@link Spriteset_Battle#createActors}.
   */
  _actorSprites: unknown[];
  /**
   * Inferred engine backing field.
   *
   * Type: `Sprite_Battleback`.
   * Initialized in: none.
   * Written in: {@link Spriteset_Battle#createBattleback}.
   * Read in: {@link Spriteset_Battle#createBattleback}, {@link Spriteset_Battle#updateBattleback}.
   */
  _back1Sprite: Sprite_Battleback;
  /**
   * Inferred engine backing field.
   *
   * Type: `Sprite_Battleback`.
   * Initialized in: none.
   * Written in: {@link Spriteset_Battle#createBattleback}.
   * Read in: {@link Spriteset_Battle#createBattleback}, {@link Spriteset_Battle#updateBattleback}.
   */
  _back2Sprite: Sprite_Battleback;
  /**
   * Inferred engine backing field.
   *
   * Type: `PIXI.filters.BlurFilter`.
   * Initialized in: none.
   * Written in: {@link Spriteset_Battle#createBackground}.
   * Read in: {@link Spriteset_Battle#createBackground}.
   */
  _backgroundFilter: PIXI.filters.BlurFilter;
  /**
   * Inferred engine backing field.
   *
   * Type: `Sprite`.
   * Initialized in: none.
   * Written in: {@link Spriteset_Battle#createBackground}.
   * Read in: {@link Spriteset_Battle#createBackground}.
   */
  _backgroundSprite: Sprite;
  /**
   * Inferred engine backing field.
   *
   * Type: `Sprite`.
   * Initialized in: none.
   * Written in: {@link Spriteset_Battle#createBattleField}.
   * Read in: {@link Spriteset_Battle#createActors}, {@link Spriteset_Battle#createBattleField}, {@link Spriteset_Battle#createEnemies}.
   */
  _battleField: Sprite;
  /**
   * Inferred engine backing field.
   *
   * Type: `boolean`.
   * Initialized in: {@link Spriteset_Battle#initialize}.
   * Written in: {@link Spriteset_Battle#initialize}, {@link Spriteset_Battle#updateBattleback}.
   * Read in: {@link Spriteset_Battle#updateBattleback}.
   */
  _battlebackLocated: boolean;
  /**
   * Inferred engine backing field.
   *
   * Type: `unknown`.
   * Initialized in: none.
   * Written in: {@link Spriteset_Battle#createBattleField}.
   * Read in: none.
   */
  _effectsContainer: unknown;
  /**
   * Inferred engine backing field.
   *
   * Type: `unknown`.
   * Initialized in: none.
   * Written in: {@link Spriteset_Battle#createEnemies}.
   * Read in: {@link Spriteset_Battle#battlerSprites}.
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
  battlerSprites(): Sprite[];
  /**
   * Gets compare enemy sprite.
   * @param a The a parameter.
   * @param b The b parameter.
   * @returns The result.
   */
  compareEnemySprite(a: Sprite_Enemy, b: Sprite_Enemy): number;
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
  findTargetSprite(target: Game_Battler): Sprite | undefined;
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
