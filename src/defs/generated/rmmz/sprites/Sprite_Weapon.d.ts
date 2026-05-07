/**
 * Generated from project/js/rmmz_sprites.js
 * Class: Sprite_Weapon
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Sprite_Weapon extends Sprite
{
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Sprite_Weapon#initMembers}, {@link Sprite_Weapon#setup}, {@link Sprite_Weapon#update}.<br/>
   * Read in: {@link Sprite_Weapon#update}.<br/>
   */
  _animationCount: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Sprite_Weapon#initMembers}, {@link Sprite_Weapon#setup}, {@link Sprite_Weapon#updatePattern}.<br/>
   * Read in: {@link Sprite_Weapon#updateFrame}, {@link Sprite_Weapon#updatePattern}.<br/>
   */
  _pattern: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Sprite_Weapon#initMembers}, {@link Sprite_Weapon#setup}, {@link Sprite_Weapon#updatePattern}.<br/>
   * Read in: {@link Sprite_Weapon#isPlaying}, {@link Sprite_Weapon#loadBitmap}, {@link Sprite_Weapon#updateFrame}.<br/>
   */
  _weaponImageId: number;
  /**
   * Gets animation wait.
   * @returns The result.
   */
  animationWait(): number;
  /**
   * Initializes members.
   */
  initMembers(): void;
  /**
   * Initializes initialize.
   */
  initialize(): void;
  /**
   * Determines whether playing.
   * @returns True if playing; false otherwise.
   */
  isPlaying(): boolean;
  /**
   * Performs load bitmap.
   */
  loadBitmap(): void;
  /**
   * Performs setup.
   * @param weaponImageId The weaponImageId parameter.
   */
  setup(weaponImageId: number): void;
  /**
   * Performs update.
   */
  update(): void;
  /**
   * Updates frame.
   */
  updateFrame(): void;
  /**
   * Updates pattern.
   */
  updatePattern(): void;
}
