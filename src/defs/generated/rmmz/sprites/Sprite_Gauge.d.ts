/**
 * Generated from project/js/rmmz_sprites.js
 * Class: Sprite_Gauge
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Sprite_Gauge extends Sprite
{
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `null`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Sprite_Gauge#initMembers}, {@link Sprite_Gauge#setup}.<br/>
   * Read in: {@link Sprite_Gauge#currentMaxValue}, {@link Sprite_Gauge#currentValue}, {@link Sprite_Gauge#isValid}, {@link Sprite_Gauge#updateFlashing}, {@link Sprite_Gauge#valueColor}.<br/>
   */
  _battler: null;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Sprite_Gauge#initMembers}, {@link Sprite_Gauge#updateGaugeAnimation}, {@link Sprite_Gauge#updateTargetValue}.<br/>
   * Read in: {@link Sprite_Gauge#updateGaugeAnimation}.<br/>
   */
  _duration: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Sprite_Gauge#initMembers}, {@link Sprite_Gauge#updateFlashing}.<br/>
   * Read in: {@link Sprite_Gauge#updateFlashing}.<br/>
   */
  _flashingCount: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `unknown`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Sprite_Gauge#initMembers}, {@link Sprite_Gauge#setup}, {@link Sprite_Gauge#updateGaugeAnimation}, {@link Sprite_Gauge#updateTargetValue}.<br/>
   * Read in: {@link Sprite_Gauge#gaugeRate}, {@link Sprite_Gauge#updateGaugeAnimation}.<br/>
   */
  _maxValue: unknown;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `string`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Sprite_Gauge#initMembers}, {@link Sprite_Gauge#setup}.<br/>
   * Read in: {@link Sprite_Gauge#currentMaxValue}, {@link Sprite_Gauge#currentValue}, {@link Sprite_Gauge#gaugeColor1}, {@link Sprite_Gauge#gaugeColor2}, {@link Sprite_Gauge#gaugeX}, {@link Sprite_Gauge#isValid}, {@link Sprite_Gauge#label}, {@link Sprite_Gauge#redraw}, {@link Sprite_Gauge#smoothness}, {@link Sprite_Gauge#updateFlashing}, {@link Sprite_Gauge#valueColor}.<br/>
   */
  _statusType: string;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `unknown`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Sprite_Gauge#initMembers}, {@link Sprite_Gauge#updateTargetValue}.<br/>
   * Read in: {@link Sprite_Gauge#updateBitmap}, {@link Sprite_Gauge#updateGaugeAnimation}.<br/>
   */
  _targetMaxValue: unknown;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `unknown`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Sprite_Gauge#initMembers}, {@link Sprite_Gauge#updateTargetValue}.<br/>
   * Read in: {@link Sprite_Gauge#updateBitmap}, {@link Sprite_Gauge#updateGaugeAnimation}.<br/>
   */
  _targetValue: unknown;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `unknown`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Sprite_Gauge#initMembers}, {@link Sprite_Gauge#setup}, {@link Sprite_Gauge#updateGaugeAnimation}, {@link Sprite_Gauge#updateTargetValue}.<br/>
   * Read in: {@link Sprite_Gauge#gaugeRate}, {@link Sprite_Gauge#updateGaugeAnimation}, {@link Sprite_Gauge#updateTargetValue}.<br/>
   */
  _value: unknown;
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
   * Gets current max value.
   * @returns The result.
   */
  currentMaxValue(): unknown;
  /**
   * Gets current value.
   * @returns The result.
   */
  currentValue(): unknown;
  /**
   * Performs destroy.
   * @param options The options parameter.
   */
  destroy(options: unknown): void;
  /**
   * Performs draw gauge.
   */
  drawGauge(): void;
  /**
   * Performs draw gauge rect.
   * @param x The x parameter.
   * @param y The y parameter.
   * @param width The width parameter.
   * @param height The height parameter.
   */
  drawGaugeRect(x: unknown, y: unknown, width: unknown, height: unknown): void;
  /**
   * Performs draw label.
   */
  drawLabel(): void;
  /**
   * Performs draw value.
   */
  drawValue(): void;
  /**
   * Gets flashing color1.
   * @returns The result.
   */
  flashingColor1(): number[];
  /**
   * Gets flashing color2.
   * @returns The result.
   */
  flashingColor2(): number[];
  /**
   * Gets gauge back color.
   * @returns The result.
   */
  gaugeBackColor(): unknown;
  /**
   * Gets gauge color1.
   * @returns The result.
   */
  gaugeColor1(): unknown;
  /**
   * Gets gauge color2.
   * @returns The result.
   */
  gaugeColor2(): unknown;
  /**
   * Gets gauge height.
   * @returns The result.
   */
  gaugeHeight(): number;
  /**
   * Gets gauge rate.
   * @returns The result.
   */
  gaugeRate(): number;
  /**
   * Gets gauge x.
   * @returns The result.
   */
  gaugeX(): number;
  /**
   * Initializes members.
   */
  initMembers(): void;
  /**
   * Initializes initialize.
   */
  initialize(): void;
  /**
   * Determines whether valid.
   * @returns True if valid; false otherwise.
   */
  isValid(): boolean;
  /**
   * Gets label.
   * @returns The result.
   */
  label(): string;
  /**
   * Gets label color.
   * @returns The result.
   */
  labelColor(): unknown;
  /**
   * Gets label font face.
   * @returns The result.
   */
  labelFontFace(): unknown;
  /**
   * Gets label font size.
   * @returns The result.
   */
  labelFontSize(): unknown;
  /**
   * Gets label opacity.
   * @returns The result.
   */
  labelOpacity(): number;
  /**
   * Gets label outline color.
   * @returns The result.
   */
  labelOutlineColor(): unknown;
  /**
   * Gets label outline width.
   * @returns The result.
   */
  labelOutlineWidth(): number;
  /**
   * Gets label y.
   * @returns The result.
   */
  labelY(): number;
  /**
   * Gets measure label width.
   * @returns The result.
   */
  measureLabelWidth(): unknown;
  /**
   * Performs redraw.
   */
  redraw(): void;
  /**
   * Performs setup.
   * @param battler The battler parameter.
   * @param statusType The statusType parameter.
   */
  setup(battler: unknown, statusType: unknown): void;
  /**
   * Performs setup label font.
   */
  setupLabelFont(): void;
  /**
   * Performs setup value font.
   */
  setupValueFont(): void;
  /**
   * Gets smoothness.
   * @returns The result.
   */
  smoothness(): number;
  /**
   * Gets text height.
   * @returns The result.
   */
  textHeight(): number;
  /**
   * Performs update.
   */
  update(): void;
  /**
   * Updates bitmap.
   */
  updateBitmap(): void;
  /**
   * Updates flashing.
   */
  updateFlashing(): void;
  /**
   * Updates gauge animation.
   */
  updateGaugeAnimation(): void;
  /**
   * Updates target value.
   * @param value The value parameter.
   * @param maxValue The maxValue parameter.
   */
  updateTargetValue(value: unknown, maxValue: unknown): void;
  /**
   * Gets value color.
   * @returns The result.
   */
  valueColor(): unknown;
  /**
   * Gets value font face.
   * @returns The result.
   */
  valueFontFace(): unknown;
  /**
   * Gets value font size.
   * @returns The result.
   */
  valueFontSize(): unknown;
  /**
   * Gets value outline color.
   * @returns The result.
   */
  valueOutlineColor(): string;
  /**
   * Gets value outline width.
   * @returns The result.
   */
  valueOutlineWidth(): number;
}
