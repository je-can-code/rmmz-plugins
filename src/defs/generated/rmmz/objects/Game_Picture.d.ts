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
   * Instance fields inferred from `this._*` assignments across vanilla engine sources.
   */
  _angle: number;
  _blendMode: number;
  _duration: number;
  _easingExponent: number;
  _easingType: number;
  _name: string;
  _opacity: number;
  _origin: number;
  _rotationSpeed: number;
  _scaleX: number;
  _scaleY: number;
  _targetOpacity: number;
  _targetScaleX: number;
  _targetScaleY: number;
  _targetX: number;
  _targetY: number;
  _tone: null | number[];
  _toneDuration: number;
  _toneTarget: null;
  _wholeDuration: number;
  _x: number;
  _y: number;
  angle(): number;
  applyEasing(current: number, target: number): number;
  blendMode(): number;
  calcEasing(t: number): number;
  easeIn(t: number, exponent: number): number;
  easeInOut(t: number, exponent: number): number;
  easeOut(t: number, exponent: number): number;
  initBasic(): void;
  initRotation(): void;
  initTarget(): void;
  initTone(): void;
  initialize(): void;
  move(origin: number, x: number, y: number, scaleX: number, scaleY: number, opacity: number, blendMode: number, duration: number, easingType: number): void;
  name(): string;
  opacity(): number;
  origin(): number;
  rotate(speed: number): void;
  scaleX(): number;
  scaleY(): number;
  show(name: string, origin: number, x: number, y: number, scaleX: number, scaleY: number, opacity: number, blendMode: number): void;
  tint(tone: [number, number, number, number], duration: number): void;
  tone(): [number, number, number, number] | null;
  update(): void;
  updateMove(): void;
  updateRotation(): void;
  updateTone(): void;
  x(): number;
  y(): number;
}
