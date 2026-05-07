/**
 * Generated from project/js/rmmz_objects.js
 * Class: Game_Picture
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Game_Picture
{
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_Picture#initRotation}, {@link Game_Picture#updateRotation}.<br/>
   * Read in: {@link Game_Picture#angle}.<br/>
   */
  _angle: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_Picture#initBasic}, {@link Game_Picture#move}, {@link Game_Picture#show}.<br/>
   * Read in: {@link Game_Picture#blendMode}.<br/>
   */
  _blendMode: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_Picture#initTarget}, {@link Game_Picture#move}, {@link Game_Picture#updateMove}.<br/>
   * Read in: {@link Game_Picture#applyEasing}, {@link Game_Picture#updateMove}.<br/>
   */
  _duration: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_Picture#initTarget}, {@link Game_Picture#move}.<br/>
   * Read in: {@link Game_Picture#calcEasing}.<br/>
   */
  _easingExponent: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_Picture#initTarget}, {@link Game_Picture#move}.<br/>
   * Read in: {@link Game_Picture#calcEasing}.<br/>
   */
  _easingType: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `string`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_Picture#initBasic}, {@link Game_Picture#show}.<br/>
   * Read in: {@link Game_Picture#name}.<br/>
   */
  _name: string;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_Picture#initBasic}, {@link Game_Picture#show}, {@link Game_Picture#updateMove}.<br/>
   * Read in: {@link Game_Picture#initTarget}, {@link Game_Picture#opacity}, {@link Game_Picture#updateMove}.<br/>
   */
  _opacity: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_Picture#initBasic}, {@link Game_Picture#move}, {@link Game_Picture#show}.<br/>
   * Read in: {@link Game_Picture#origin}.<br/>
   */
  _origin: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_Picture#initRotation}, {@link Game_Picture#rotate}.<br/>
   * Read in: {@link Game_Picture#updateRotation}.<br/>
   */
  _rotationSpeed: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_Picture#initBasic}, {@link Game_Picture#show}, {@link Game_Picture#updateMove}.<br/>
   * Read in: {@link Game_Picture#initTarget}, {@link Game_Picture#scaleX}, {@link Game_Picture#updateMove}.<br/>
   */
  _scaleX: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_Picture#initBasic}, {@link Game_Picture#show}, {@link Game_Picture#updateMove}.<br/>
   * Read in: {@link Game_Picture#initTarget}, {@link Game_Picture#scaleY}, {@link Game_Picture#updateMove}.<br/>
   */
  _scaleY: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `unknown`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_Picture#initTarget}, {@link Game_Picture#move}.<br/>
   * Read in: {@link Game_Picture#updateMove}.<br/>
   */
  _targetOpacity: unknown;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `unknown`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_Picture#initTarget}, {@link Game_Picture#move}.<br/>
   * Read in: {@link Game_Picture#updateMove}.<br/>
   */
  _targetScaleX: unknown;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `unknown`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_Picture#initTarget}, {@link Game_Picture#move}.<br/>
   * Read in: {@link Game_Picture#updateMove}.<br/>
   */
  _targetScaleY: unknown;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `unknown`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_Picture#initTarget}, {@link Game_Picture#move}.<br/>
   * Read in: {@link Game_Picture#updateMove}.<br/>
   */
  _targetX: unknown;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `unknown`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_Picture#initTarget}, {@link Game_Picture#move}.<br/>
   * Read in: {@link Game_Picture#updateMove}.<br/>
   */
  _targetY: unknown;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `null | number[]`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_Picture#initTone}, {@link Game_Picture#tint}.<br/>
   * Read in: {@link Game_Picture#tint}, {@link Game_Picture#tone}, {@link Game_Picture#updateTone}.<br/>
   */
  _tone: null | number[];
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_Picture#initTone}, {@link Game_Picture#tint}, {@link Game_Picture#updateTone}.<br/>
   * Read in: {@link Game_Picture#tint}, {@link Game_Picture#updateTone}.<br/>
   */
  _toneDuration: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `null`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_Picture#initTone}, {@link Game_Picture#tint}.<br/>
   * Read in: {@link Game_Picture#tint}, {@link Game_Picture#updateTone}.<br/>
   */
  _toneTarget: null;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_Picture#initTarget}, {@link Game_Picture#move}.<br/>
   * Read in: {@link Game_Picture#applyEasing}.<br/>
   */
  _wholeDuration: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_Picture#initBasic}, {@link Game_Picture#show}, {@link Game_Picture#updateMove}.<br/>
   * Read in: {@link Game_Picture#initTarget}, {@link Game_Picture#updateMove}, {@link Game_Picture#x}.<br/>
   */
  _x: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_Picture#initBasic}, {@link Game_Picture#show}, {@link Game_Picture#updateMove}.<br/>
   * Read in: {@link Game_Picture#initTarget}, {@link Game_Picture#updateMove}, {@link Game_Picture#y}.<br/>
   */
  _y: number;
  /**
   * Gets angle.
   * @returns The result.
   */
  angle(): unknown;
  /**
   * Gets apply easing.
   * @param current The current parameter.
   * @param target The target parameter.
   * @returns The result.
   */
  applyEasing(current: unknown, target: unknown): unknown;
  /**
   * Gets blend mode.
   * @returns The result.
   */
  blendMode(): unknown;
  /**
   * Gets calc easing.
   * @param t The t parameter.
   * @returns The result.
   */
  calcEasing(t: unknown): unknown;
  /**
   * Gets ease in.
   * @param t The t parameter.
   * @param exponent The exponent parameter.
   * @returns The result.
   */
  easeIn(t: unknown, exponent: unknown): unknown;
  /**
   * Gets ease in out.
   * @param t The t parameter.
   * @param exponent The exponent parameter.
   * @returns The result.
   */
  easeInOut(t: unknown, exponent: unknown): unknown;
  /**
   * Gets ease out.
   * @param t The t parameter.
   * @param exponent The exponent parameter.
   * @returns The result.
   */
  easeOut(t: unknown, exponent: unknown): unknown;
  /**
   * Initializes basic.
   */
  initBasic(): void;
  /**
   * Initializes rotation.
   */
  initRotation(): void;
  /**
   * Initializes target.
   */
  initTarget(): void;
  /**
   * Initializes tone.
   */
  initTone(): void;
  /**
   * Initializes initialize.
   */
  initialize(): void;
  /**
   * Performs move.
   * @param origin The origin parameter.
   * @param x The x parameter.
   * @param y The y parameter.
   * @param scaleX The scaleX parameter.
   * @param scaleY The scaleY parameter.
   * @param opacity The opacity parameter.
   * @param blendMode The blendMode parameter.
   * @param duration The duration parameter.
   * @param easingType The easingType parameter.
   */
  move(origin: unknown, x: unknown, y: unknown, scaleX: unknown, scaleY: unknown, opacity: unknown, blendMode: unknown, duration: unknown, easingType: unknown): void;
  /**
   * Gets name.
   * @returns The result.
   */
  name(): unknown;
  /**
   * Gets opacity.
   * @returns The result.
   */
  opacity(): unknown;
  /**
   * Gets origin.
   * @returns The result.
   */
  origin(): unknown;
  /**
   * Performs rotate.
   * @param speed The speed parameter.
   */
  rotate(speed: unknown): void;
  /**
   * Gets scale x.
   * @returns The result.
   */
  scaleX(): unknown;
  /**
   * Gets scale y.
   * @returns The result.
   */
  scaleY(): unknown;
  /**
   * Performs show.
   * @param name The name parameter.
   * @param origin The origin parameter.
   * @param x The x parameter.
   * @param y The y parameter.
   * @param scaleX The scaleX parameter.
   * @param scaleY The scaleY parameter.
   * @param opacity The opacity parameter.
   * @param blendMode The blendMode parameter.
   */
  show(name: unknown, origin: unknown, x: unknown, y: unknown, scaleX: unknown, scaleY: unknown, opacity: unknown, blendMode: unknown): void;
  /**
   * Performs tint.
   * @param tone The tone parameter.
   * @param duration The duration parameter.
   */
  tint(tone: unknown, duration: unknown): void;
  /**
   * Gets tone.
   * @returns The result.
   */
  tone(): unknown;
  /**
   * Performs update.
   */
  update(): void;
  /**
   * Updates move.
   */
  updateMove(): void;
  /**
   * Updates rotation.
   */
  updateRotation(): void;
  /**
   * Updates tone.
   */
  updateTone(): void;
  /**
   * Gets x.
   * @returns The result.
   */
  x(): unknown;
  /**
   * Gets y.
   * @returns The result.
   */
  y(): unknown;
}
