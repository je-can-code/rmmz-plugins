/**
 * Generated from project/js/rmmz_sprites.js
 * Class: Sprite_Battler
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Sprite_Battler extends Sprite_Clickable
{
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `null | Game_Battler`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Sprite_Battler#initMembers}, {@link Sprite_Battler#setBattler}.<br/>
   * Read in: {@link Sprite_Battler#checkBattler}, {@link Sprite_Battler#createDamageSprite}, {@link Sprite_Battler#onClick}, {@link Sprite_Battler#onMouseEnter}, {@link Sprite_Battler#onPress}, {@link Sprite_Battler#setupDamagePopup}, {@link Sprite_Battler#update}, {@link Sprite_Battler#updateMain}, {@link Sprite_Battler#updateSelectionEffect}, {@link Sprite_Battler#updateVisibility}.<br/>
   */
  _battler: null | Game_Battler;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `unknown[]`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Sprite_Battler#initMembers}.<br/>
   * Read in: {@link Sprite_Battler#createDamageSprite}, {@link Sprite_Battler#destroyDamageSprite}, {@link Sprite_Battler#updateDamagePopup}.<br/>
   *<br/>
   * Consumed by:<br/>
   * - `.length`: {@link Sprite_Battler#createDamageSprite}, {@link Sprite_Battler#updateDamagePopup}.<br/>
   * - `push()`: {@link Sprite_Battler#createDamageSprite}.<br/>
   */
  _damages: unknown[];
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Sprite_Battler#initMembers}, {@link Sprite_Battler#setHome}.<br/>
   * Read in: {@link Sprite_Battler#updatePosition}.<br/>
   */
  _homeX: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Sprite_Battler#initMembers}, {@link Sprite_Battler#setHome}.<br/>
   * Read in: {@link Sprite_Battler#updatePosition}.<br/>
   */
  _homeY: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Sprite_Battler#initMembers}, {@link Sprite_Battler#startMove}, {@link Sprite_Battler#updateMove}.<br/>
   * Read in: {@link Sprite_Battler#isMoving}, {@link Sprite_Battler#updateMove}.<br/>
   */
  _movementDuration: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Sprite_Battler#initMembers}, {@link Sprite_Battler#startMove}, {@link Sprite_Battler#updateMove}.<br/>
   * Read in: {@link Sprite_Battler#inHomePosition}, {@link Sprite_Battler#updateMove}, {@link Sprite_Battler#updatePosition}.<br/>
   */
  _offsetX: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Sprite_Battler#initMembers}, {@link Sprite_Battler#startMove}, {@link Sprite_Battler#updateMove}.<br/>
   * Read in: {@link Sprite_Battler#inHomePosition}, {@link Sprite_Battler#updateMove}, {@link Sprite_Battler#updatePosition}.<br/>
   */
  _offsetY: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Sprite_Battler#initMembers}, {@link Sprite_Battler#updateSelectionEffect}.<br/>
   * Read in: {@link Sprite_Battler#updateSelectionEffect}.<br/>
   */
  _selectionEffectCount: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Sprite_Battler#initMembers}, {@link Sprite_Battler#startMove}.<br/>
   * Read in: {@link Sprite_Battler#startMove}, {@link Sprite_Battler#updateMove}.<br/>
   */
  _targetOffsetX: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Sprite_Battler#initMembers}, {@link Sprite_Battler#startMove}.<br/>
   * Read in: {@link Sprite_Battler#startMove}, {@link Sprite_Battler#updateMove}.<br/>
   */
  _targetOffsetY: number;
  /**
   * Gets check battler.
   * @param battler The battler parameter.
   * @returns The result.
   */
  checkBattler(battler: Game_Battler): boolean;
  /**
   * Creates damage sprite.
   */
  createDamageSprite(): void;
  /**
   * Gets damage offset x.
   * @returns The result.
   */
  damageOffsetX(): number;
  /**
   * Gets damage offset y.
   * @returns The result.
   */
  damageOffsetY(): number;
  /**
   * Performs destroy damage sprite.
   * @param sprite The sprite parameter.
   */
  destroyDamageSprite(sprite: Sprite): void;
  /**
   * Gets in home position.
   * @returns The result.
   */
  inHomePosition(): boolean;
  /**
   * Initializes members.
   */
  initMembers(): void;
  /**
   * Initializes initialize.
   * @param battler The battler parameter.
   */
  initialize(battler: Game_Battler): void;
  /**
   * Determines whether effecting.
   * @returns True if effecting; false otherwise.
   */
  isEffecting(): boolean;
  /**
   * Determines whether moving.
   * @returns True if moving; false otherwise.
   */
  isMoving(): boolean;
  /**
   * Gets main sprite.
   * @returns The result.
   */
  mainSprite(): Sprite_Battler;
  /**
   * Performs on click.
   */
  onClick(): void;
  /**
   * Performs on mouse enter.
   */
  onMouseEnter(): void;
  /**
   * Performs on move end.
   */
  onMoveEnd(): void;
  /**
   * Performs on press.
   */
  onPress(): void;
  /**
   * Sets battler.
   * @param battler The battler parameter.
   */
  setBattler(battler: Game_Battler): void;
  /**
   * Sets home.
   * @param x The x parameter.
   * @param y The y parameter.
   */
  setHome(x: number, y: number): void;
  /**
   * Performs setup damage popup.
   */
  setupDamagePopup(): void;
  /**
   * Performs start move.
   * @param x The x parameter.
   * @param y The y parameter.
   * @param duration The duration parameter.
   */
  startMove(x: number, y: number, duration: number): void;
  /**
   * Performs update.
   */
  update(): void;
  /**
   * Updates bitmap.
   */
  updateBitmap(): void;
  /**
   * Updates damage popup.
   */
  updateDamagePopup(): void;
  /**
   * Updates frame.
   */
  updateFrame(): void;
  /**
   * Updates main.
   */
  updateMain(): void;
  /**
   * Updates move.
   */
  updateMove(): void;
  /**
   * Updates position.
   */
  updatePosition(): void;
  /**
   * Updates selection effect.
   */
  updateSelectionEffect(): void;
  /**
   * Updates visibility.
   */
  updateVisibility(): void;
}
