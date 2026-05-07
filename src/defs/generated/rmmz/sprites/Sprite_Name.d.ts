/**
 * Generated from project/js/rmmz_sprites.js
 * Class: Sprite_Name
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Sprite_Name extends Sprite
{
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `null | Game_Battler`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Sprite_Name#initMembers}, {@link Sprite_Name#setup}.<br/>
   * Read in: {@link Sprite_Name#name}, {@link Sprite_Name#textColor}.<br/>
   */
  _battler: null | Game_Battler;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `string`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Sprite_Name#initMembers}, {@link Sprite_Name#updateBitmap}.<br/>
   * Read in: {@link Sprite_Name#updateBitmap}.<br/>
   */
  _name: string;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `string`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Sprite_Name#initMembers}, {@link Sprite_Name#updateBitmap}.<br/>
   * Read in: {@link Sprite_Name#updateBitmap}.<br/>
   */
  _textColor: string;
  /**
   * Gets bitmap height.
   * @returns The result.
   */
  bitmapHeight(): number;
  /**
   * Gets bitmap width.
   * @returns The result.
   */
  bitmapWidth(): number;
  /**
   * Creates bitmap.
   */
  createBitmap(): void;
  /**
   * Performs destroy.
   * @param options The options parameter.
   */
  destroy(options: object): void;
  /**
   * Gets font face.
   * @returns The result.
   */
  fontFace(): string;
  /**
   * Gets font size.
   * @returns The result.
   */
  fontSize(): number;
  /**
   * Initializes members.
   */
  initMembers(): void;
  /**
   * Initializes initialize.
   */
  initialize(): void;
  /**
   * Gets name.
   * @returns The result.
   */
  name(): string;
  /**
   * Gets outline color.
   * @returns The result.
   */
  outlineColor(): string;
  /**
   * Gets outline width.
   * @returns The result.
   */
  outlineWidth(): number;
  /**
   * Performs redraw.
   */
  redraw(): void;
  /**
   * Performs setup.
   * @param battler The battler parameter.
   */
  setup(battler: Game_Battler): void;
  /**
   * Performs setup font.
   */
  setupFont(): void;
  /**
   * Gets text color.
   * @returns The result.
   */
  textColor(): string;
  /**
   * Performs update.
   */
  update(): void;
  /**
   * Updates bitmap.
   */
  updateBitmap(): void;
}
