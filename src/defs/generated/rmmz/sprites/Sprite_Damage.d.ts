/**
 * Generated from project/js/rmmz_sprites.js
 * Class: Sprite_Damage
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Sprite_Damage extends Sprite
{
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: {@link Sprite_Damage#initialize}.<br/>
   * Written in: {@link Sprite_Damage#initialize}, {@link Sprite_Damage#setup}.<br/>
   * Read in: {@link Sprite_Damage#damageColor}.<br/>
   */
  _colorType: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: {@link Sprite_Damage#initialize}.<br/>
   * Written in: {@link Sprite_Damage#initialize}, {@link Sprite_Damage#update}.<br/>
   * Read in: {@link Sprite_Damage#isPlaying}, {@link Sprite_Damage#update}, {@link Sprite_Damage#updateOpacity}.<br/>
   */
  _duration: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number[]`.<br/>
   * Initialized in: {@link Sprite_Damage#initialize}.<br/>
   * Written in: {@link Sprite_Damage#initialize}, {@link Sprite_Damage#setupCriticalEffect}.<br/>
   * Read in: {@link Sprite_Damage#updateChild}, {@link Sprite_Damage#updateFlash}.<br/>
   */
  _flashColor: number[];
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: {@link Sprite_Damage#initialize}.<br/>
   * Written in: {@link Sprite_Damage#initialize}, {@link Sprite_Damage#setupCriticalEffect}, {@link Sprite_Damage#updateFlash}.<br/>
   * Read in: {@link Sprite_Damage#updateFlash}.<br/>
   */
  _flashDuration: number;
  /**
   * Creates bitmap.
   * @param width The width parameter.
   * @param height The height parameter.
   * @returns The result.
   */
  createBitmap(width: unknown, height: unknown): unknown;
  /**
   * Creates child sprite.
   * @param width The width parameter.
   * @param height The height parameter.
   * @returns The result.
   */
  createChildSprite(width: unknown, height: unknown): unknown;
  /**
   * Creates digits.
   * @param value The value parameter.
   */
  createDigits(value: unknown): void;
  /**
   * Creates miss.
   */
  createMiss(): void;
  /**
   * Gets damage color.
   * @returns The result.
   */
  damageColor(): unknown;
  /**
   * Performs destroy.
   * @param options The options parameter.
   */
  destroy(options: unknown): void;
  /**
   * Gets font face.
   * @returns The result.
   */
  fontFace(): unknown;
  /**
   * Gets font size.
   * @returns The result.
   */
  fontSize(): unknown;
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
   * Performs setup.
   * @param target The target parameter.
   */
  setup(target: unknown): void;
  /**
   * Performs setup critical effect.
   */
  setupCriticalEffect(): void;
  /**
   * Performs update.
   */
  update(): void;
  /**
   * Updates child.
   * @param sprite The sprite parameter.
   */
  updateChild(sprite: unknown): void;
  /**
   * Updates flash.
   */
  updateFlash(): void;
  /**
   * Updates opacity.
   */
  updateOpacity(): void;
}
