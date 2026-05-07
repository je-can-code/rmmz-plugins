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
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: none.
   * Written in: {@link Game_Picture#initRotation}, {@link Game_Picture#updateRotation}.
   * Read in: {@link Game_Picture#angle}.
   */
  _angle: number;
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: none.
   * Written in: {@link Game_Picture#initBasic}, {@link Game_Picture#move}, {@link Game_Picture#show}.
   * Read in: {@link Game_Picture#blendMode}.
   */
  _blendMode: number;
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: none.
   * Written in: {@link Game_Picture#initTarget}, {@link Game_Picture#move}, {@link Game_Picture#updateMove}.
   * Read in: {@link Game_Picture#applyEasing}, {@link Game_Picture#updateMove}.
   */
  _duration: number;
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: none.
   * Written in: {@link Game_Picture#initTarget}, {@link Game_Picture#move}.
   * Read in: {@link Game_Picture#calcEasing}.
   */
  _easingExponent: number;
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: none.
   * Written in: {@link Game_Picture#initTarget}, {@link Game_Picture#move}.
   * Read in: {@link Game_Picture#calcEasing}.
   */
  _easingType: number;
  /**
   * Inferred engine backing field.
   *
   * Type: `string`.
   * Initialized in: none.
   * Written in: {@link Game_Picture#initBasic}, {@link Game_Picture#show}.
   * Read in: {@link Game_Picture#name}.
   */
  _name: string;
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: none.
   * Written in: {@link Game_Picture#initBasic}, {@link Game_Picture#show}, {@link Game_Picture#updateMove}.
   * Read in: {@link Game_Picture#initTarget}, {@link Game_Picture#opacity}, {@link Game_Picture#updateMove}.
   */
  _opacity: number;
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: none.
   * Written in: {@link Game_Picture#initBasic}, {@link Game_Picture#move}, {@link Game_Picture#show}.
   * Read in: {@link Game_Picture#origin}.
   */
  _origin: number;
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: none.
   * Written in: {@link Game_Picture#initRotation}, {@link Game_Picture#rotate}.
   * Read in: {@link Game_Picture#updateRotation}.
   */
  _rotationSpeed: number;
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: none.
   * Written in: {@link Game_Picture#initBasic}, {@link Game_Picture#show}, {@link Game_Picture#updateMove}.
   * Read in: {@link Game_Picture#initTarget}, {@link Game_Picture#scaleX}, {@link Game_Picture#updateMove}.
   */
  _scaleX: number;
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: none.
   * Written in: {@link Game_Picture#initBasic}, {@link Game_Picture#show}, {@link Game_Picture#updateMove}.
   * Read in: {@link Game_Picture#initTarget}, {@link Game_Picture#scaleY}, {@link Game_Picture#updateMove}.
   */
  _scaleY: number;
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: none.
   * Written in: {@link Game_Picture#initTarget}, {@link Game_Picture#move}.
   * Read in: {@link Game_Picture#updateMove}.
   */
  _targetOpacity: number;
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: none.
   * Written in: {@link Game_Picture#initTarget}, {@link Game_Picture#move}.
   * Read in: {@link Game_Picture#updateMove}.
   */
  _targetScaleX: number;
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: none.
   * Written in: {@link Game_Picture#initTarget}, {@link Game_Picture#move}.
   * Read in: {@link Game_Picture#updateMove}.
   */
  _targetScaleY: number;
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: none.
   * Written in: {@link Game_Picture#initTarget}, {@link Game_Picture#move}.
   * Read in: {@link Game_Picture#updateMove}.
   */
  _targetX: number;
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: none.
   * Written in: {@link Game_Picture#initTarget}, {@link Game_Picture#move}.
   * Read in: {@link Game_Picture#updateMove}.
   */
  _targetY: number;
  /**
   * Inferred engine backing field.
   *
   * Type: `null | number[]`.
   * Initialized in: none.
   * Written in: {@link Game_Picture#initTone}, {@link Game_Picture#tint}.
   * Read in: {@link Game_Picture#tint}, {@link Game_Picture#tone}, {@link Game_Picture#updateTone}.
   */
  _tone: null | number[];
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: none.
   * Written in: {@link Game_Picture#initTone}, {@link Game_Picture#tint}, {@link Game_Picture#updateTone}.
   * Read in: {@link Game_Picture#tint}, {@link Game_Picture#updateTone}.
   */
  _toneDuration: number;
  /**
   * Inferred engine backing field.
   *
   * Type: `null`.
   * Initialized in: none.
   * Written in: {@link Game_Picture#initTone}, {@link Game_Picture#tint}.
   * Read in: {@link Game_Picture#tint}, {@link Game_Picture#updateTone}.
   */
  _toneTarget: null;
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: none.
   * Written in: {@link Game_Picture#initTarget}, {@link Game_Picture#move}.
   * Read in: {@link Game_Picture#applyEasing}.
   */
  _wholeDuration: number;
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: none.
   * Written in: {@link Game_Picture#initBasic}, {@link Game_Picture#show}, {@link Game_Picture#updateMove}.
   * Read in: {@link Game_Picture#initTarget}, {@link Game_Picture#updateMove}, {@link Game_Picture#x}.
   */
  _x: number;
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: none.
   * Written in: {@link Game_Picture#initBasic}, {@link Game_Picture#show}, {@link Game_Picture#updateMove}.
   * Read in: {@link Game_Picture#initTarget}, {@link Game_Picture#updateMove}, {@link Game_Picture#y}.
   */
  _y: number;
  /**
   * Gets angle.
   * @returns The result.
   */
  angle(): number;
  /**
   * Gets apply easing.
   * @param current The current parameter.
   * @param target The target parameter.
   * @returns The result.
   */
  applyEasing(current: number, target: number): number;
  /**
   * Gets blend mode.
   * @returns The result.
   */
  blendMode(): number;
  /**
   * Gets calc easing.
   * @param t The t parameter.
   * @returns The result.
   */
  calcEasing(t: number): number;
  /**
   * Gets ease in.
   * @param t The t parameter.
   * @param exponent The exponent parameter.
   * @returns The result.
   */
  easeIn(t: number, exponent: number): number;
  /**
   * Gets ease in out.
   * @param t The t parameter.
   * @param exponent The exponent parameter.
   * @returns The result.
   */
  easeInOut(t: number, exponent: number): number;
  /**
   * Gets ease out.
   * @param t The t parameter.
   * @param exponent The exponent parameter.
   * @returns The result.
   */
  easeOut(t: number, exponent: number): number;
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
  move(origin: number, x: number, y: number, scaleX: number, scaleY: number, opacity: number, blendMode: number, duration: number, easingType: number): void;
  /**
   * Gets name.
   * @returns The result.
   */
  name(): string;
  /**
   * Gets opacity.
   * @returns The result.
   */
  opacity(): number;
  /**
   * Gets origin.
   * @returns The result.
   */
  origin(): number;
  /**
   * Performs rotate.
   * @param speed The speed parameter.
   */
  rotate(speed: number): void;
  /**
   * Gets scale x.
   * @returns The result.
   */
  scaleX(): number;
  /**
   * Gets scale y.
   * @returns The result.
   */
  scaleY(): number;
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
  show(name: string, origin: number, x: number, y: number, scaleX: number, scaleY: number, opacity: number, blendMode: number): void;
  /**
   * Performs tint.
   * @param tone The tone parameter.
   * @param duration The duration parameter.
   */
  tint(tone: [number, number, number, number], duration: number): void;
  /**
   * Gets tone.
   * @returns The result.
   */
  tone(): [number, number, number, number] | null;
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
  x(): number;
  /**
   * Gets y.
   * @returns The result.
   */
  y(): number;
}
