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
   * Type: `null | Game_Battler`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Sprite_Gauge#initMembers}, {@link Sprite_Gauge#setup}.<br/>
   * Read in: {@link Sprite_Gauge#currentMaxValue}, {@link Sprite_Gauge#currentValue}, {@link Sprite_Gauge#isValid}, {@link Sprite_Gauge#updateFlashing}, {@link Sprite_Gauge#valueColor}.<br/>
   */
  _battler: null | Game_Battler;
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
   * Type: `number`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Sprite_Gauge#initMembers}, {@link Sprite_Gauge#setup}, {@link Sprite_Gauge#updateGaugeAnimation}, {@link Sprite_Gauge#updateTargetValue}.<br/>
   * Read in: {@link Sprite_Gauge#gaugeRate}, {@link Sprite_Gauge#updateGaugeAnimation}.<br/>
   */
  _maxValue: number;
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
   * Type: `number`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Sprite_Gauge#initMembers}, {@link Sprite_Gauge#updateTargetValue}.<br/>
   * Read in: {@link Sprite_Gauge#updateBitmap}, {@link Sprite_Gauge#updateGaugeAnimation}.<br/>
   */
  _targetMaxValue: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Sprite_Gauge#initMembers}, {@link Sprite_Gauge#updateTargetValue}.<br/>
   * Read in: {@link Sprite_Gauge#updateBitmap}, {@link Sprite_Gauge#updateGaugeAnimation}.<br/>
   */
  _targetValue: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Sprite_Gauge#initMembers}, {@link Sprite_Gauge#setup}, {@link Sprite_Gauge#updateGaugeAnimation}, {@link Sprite_Gauge#updateTargetValue}.<br/>
   * Read in: {@link Sprite_Gauge#gaugeRate}, {@link Sprite_Gauge#updateGaugeAnimation}, {@link Sprite_Gauge#updateTargetValue}.<br/>
   */
  _value: number;
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
  currentValue(): number;
  /**
   * Performs destroy.
   * @param options The options parameter.
   */
  destroy(options: object): void;
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
  drawGaugeRect(x: number, y: number, width: number, height: number): void;
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
  gaugeBackColor(): number;
  /**
   * Gets gauge color1.
   * @returns The result.
   */
  gaugeColor1(): number;
  /**
   * Gets gauge color2.
   * @returns The result.
   */
  gaugeColor2(): number;
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
  labelColor(): string;
  /**
   * Gets label font face.
   * @returns The result.
   */
  labelFontFace(): string;
  /**
   * Gets label font size.
   * @returns The result.
   */
  labelFontSize(): number;
  /**
   * Gets label opacity.
   * @returns The result.
   */
  labelOpacity(): number;
  /**
   * Gets label outline color.
   * @returns The result.
   */
  labelOutlineColor(): number;
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
  measureLabelWidth(): number;
  /**
   * Performs redraw.
   */
  redraw(): void;
  /**
   * Performs setup.
   * @param battler The battler parameter.
   * @param statusType The statusType parameter.
   */
  setup(battler: Game_Battler, statusType: string): void;
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
  updateTargetValue(value: number, maxValue: number): void;
  /**
   * Gets value color.
   * @returns The result.
   */
  valueColor(): number;
  /**
   * Gets value font face.
   * @returns The result.
   */
  valueFontFace(): string;
  /**
   * Gets value font size.
   * @returns The result.
   */
  valueFontSize(): number;
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
