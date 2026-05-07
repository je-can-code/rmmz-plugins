/**
 * Generated from project/js/rmmz_sprites.js
 * Class: Sprite_Gauge
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Sprite_Gauge
{
  /**
   * Instance fields inferred from `this._*` assignments across vanilla engine sources.
   */
  _battler: null | Game_Battler;
  _duration: number;
  _flashingCount: number;
  _maxValue: number;
  _statusType: string;
  _targetMaxValue: number;
  _targetValue: number;
  _value: number;
  bitmapHeight(): number;
  bitmapWidth(): number;
  createBitmap(): void;
  currentMaxValue(): unknown;
  currentValue(): number;
  destroy(options: object): void;
  drawGauge(): void;
  drawGaugeRect(x: number, y: number, width: number, height: number): void;
  drawLabel(): void;
  drawValue(): void;
  flashingColor1(): number[];
  flashingColor2(): number[];
  gaugeBackColor(): number;
  gaugeColor1(): number;
  gaugeColor2(): number;
  gaugeHeight(): number;
  gaugeRate(): number;
  gaugeX(): number;
  initMembers(): void;
  initialize(): void;
  isValid(): boolean;
  label(): string;
  labelColor(): string;
  labelFontFace(): string;
  labelFontSize(): number;
  labelOpacity(): number;
  labelOutlineColor(): number;
  labelOutlineWidth(): number;
  labelY(): number;
  measureLabelWidth(): number;
  redraw(): void;
  setup(battler: Game_Battler, statusType: string): void;
  setupLabelFont(): void;
  setupValueFont(): void;
  smoothness(): number;
  textHeight(): number;
  update(): void;
  updateBitmap(): void;
  updateFlashing(): void;
  updateGaugeAnimation(): void;
  updateTargetValue(value: number, maxValue: number): void;
  valueColor(): number;
  valueFontFace(): string;
  valueFontSize(): number;
  valueOutlineColor(): string;
  valueOutlineWidth(): number;
}
