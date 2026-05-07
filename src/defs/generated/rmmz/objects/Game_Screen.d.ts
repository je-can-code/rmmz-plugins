/**
 * Generated from project/js/rmmz_objects.js
 * Class: Game_Screen
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Game_Screen
{
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_Screen#clearFade}, {@link Game_Screen#updateFadeIn}, {@link Game_Screen#updateFadeOut}.<br/>
   * Read in: {@link Game_Screen#brightness}, {@link Game_Screen#updateFadeIn}, {@link Game_Screen#updateFadeOut}.<br/>
   */
  _brightness: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_Screen#clearFade}, {@link Game_Screen#startFadeIn}, {@link Game_Screen#startFadeOut}, {@link Game_Screen#updateFadeIn}.<br/>
   * Read in: {@link Game_Screen#updateFadeIn}.<br/>
   */
  _fadeInDuration: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_Screen#clearFade}, {@link Game_Screen#startFadeIn}, {@link Game_Screen#startFadeOut}, {@link Game_Screen#updateFadeOut}.<br/>
   * Read in: {@link Game_Screen#updateFadeOut}.<br/>
   */
  _fadeOutDuration: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number[]`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_Screen#clearFlash}, {@link Game_Screen#startFlash}.<br/>
   * Read in: {@link Game_Screen#flashColor}, {@link Game_Screen#updateFlash}.<br/>
   */
  _flashColor: number[];
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_Screen#clearFlash}, {@link Game_Screen#startFlash}, {@link Game_Screen#updateFlash}.<br/>
   * Read in: {@link Game_Screen#updateFlash}.<br/>
   */
  _flashDuration: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `unknown[]`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_Screen#clearPictures}, {@link Game_Screen#eraseBattlePictures}.<br/>
   * Read in: {@link Game_Screen#eraseBattlePictures}, {@link Game_Screen#erasePicture}, {@link Game_Screen#picture}, {@link Game_Screen#showPicture}, {@link Game_Screen#updatePictures}.<br/>
   */
  _pictures: unknown[];
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_Screen#clearShake}, {@link Game_Screen#updateShake}.<br/>
   * Read in: {@link Game_Screen#shake}, {@link Game_Screen#updateShake}.<br/>
   */
  _shake: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_Screen#clearShake}, {@link Game_Screen#updateShake}.<br/>
   * Read in: {@link Game_Screen#updateShake}.<br/>
   */
  _shakeDirection: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_Screen#clearShake}, {@link Game_Screen#startShake}, {@link Game_Screen#updateShake}.<br/>
   * Read in: {@link Game_Screen#updateShake}.<br/>
   */
  _shakeDuration: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_Screen#clearShake}, {@link Game_Screen#startShake}.<br/>
   * Read in: {@link Game_Screen#updateShake}.<br/>
   */
  _shakePower: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_Screen#clearShake}, {@link Game_Screen#startShake}.<br/>
   * Read in: {@link Game_Screen#updateShake}.<br/>
   */
  _shakeSpeed: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number[]`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_Screen#clearTone}, {@link Game_Screen#startTint}.<br/>
   * Read in: {@link Game_Screen#tone}, {@link Game_Screen#updateTone}.<br/>
   */
  _tone: number[];
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_Screen#clearTone}, {@link Game_Screen#startTint}, {@link Game_Screen#updateTone}.<br/>
   * Read in: {@link Game_Screen#startTint}, {@link Game_Screen#updateTone}.<br/>
   */
  _toneDuration: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number[]`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_Screen#clearTone}, {@link Game_Screen#startTint}.<br/>
   * Read in: {@link Game_Screen#startTint}, {@link Game_Screen#updateTone}.<br/>
   */
  _toneTarget: number[];
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_Screen#changeWeather}, {@link Game_Screen#clearWeather}, {@link Game_Screen#updateWeather}.<br/>
   * Read in: {@link Game_Screen#updateWeather}.<br/>
   */
  _weatherDuration: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_Screen#changeWeather}, {@link Game_Screen#clearWeather}, {@link Game_Screen#updateWeather}.<br/>
   * Read in: {@link Game_Screen#updateWeather}, {@link Game_Screen#weatherPower}.<br/>
   */
  _weatherPower: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_Screen#changeWeather}, {@link Game_Screen#clearWeather}.<br/>
   * Read in: {@link Game_Screen#changeWeather}, {@link Game_Screen#updateWeather}.<br/>
   */
  _weatherPowerTarget: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `string`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_Screen#changeWeather}, {@link Game_Screen#clearWeather}, {@link Game_Screen#updateWeather}.<br/>
   * Read in: {@link Game_Screen#weatherType}.<br/>
   */
  _weatherType: string;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_Screen#clearZoom}, {@link Game_Screen#startZoom}, {@link Game_Screen#updateZoom}.<br/>
   * Read in: {@link Game_Screen#updateZoom}.<br/>
   */
  _zoomDuration: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_Screen#clearZoom}, {@link Game_Screen#setZoom}, {@link Game_Screen#updateZoom}.<br/>
   * Read in: {@link Game_Screen#updateZoom}, {@link Game_Screen#zoomScale}.<br/>
   */
  _zoomScale: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_Screen#clearZoom}, {@link Game_Screen#startZoom}.<br/>
   * Read in: {@link Game_Screen#updateZoom}.<br/>
   */
  _zoomScaleTarget: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_Screen#clearZoom}, {@link Game_Screen#setZoom}, {@link Game_Screen#startZoom}.<br/>
   * Read in: {@link Game_Screen#zoomX}.<br/>
   */
  _zoomX: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_Screen#clearZoom}, {@link Game_Screen#setZoom}, {@link Game_Screen#startZoom}.<br/>
   * Read in: {@link Game_Screen#zoomY}.<br/>
   */
  _zoomY: number;
  /**
   * Gets brightness.
   * @returns The result.
   */
  brightness(): unknown;
  /**
   * Performs change weather.
   * @param _type The type parameter.
   * @param power The power parameter.
   * @param duration The duration parameter.
   */
  changeWeather(_type: unknown, power: unknown, duration: unknown): void;
  /**
   * Performs clear.
   */
  clear(): void;
  /**
   * Clears fade.
   */
  clearFade(): void;
  /**
   * Clears flash.
   */
  clearFlash(): void;
  /**
   * Clears pictures.
   */
  clearPictures(): void;
  /**
   * Clears shake.
   */
  clearShake(): void;
  /**
   * Clears tone.
   */
  clearTone(): void;
  /**
   * Clears weather.
   */
  clearWeather(): void;
  /**
   * Clears zoom.
   */
  clearZoom(): void;
  /**
   * Performs erase battle pictures.
   */
  eraseBattlePictures(): void;
  /**
   * Performs erase picture.
   * @param pictureId The pictureId parameter.
   */
  erasePicture(pictureId: unknown): void;
  /**
   * Gets flash color.
   * @returns The result.
   */
  flashColor(): unknown;
  /**
   * Initializes initialize.
   */
  initialize(): void;
  /**
   * Gets max pictures.
   * @returns The result.
   */
  maxPictures(): number;
  /**
   * Performs move picture.
   * @param pictureId The pictureId parameter.
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
  movePicture(pictureId: unknown, origin: unknown, x: unknown, y: unknown, scaleX: unknown, scaleY: unknown, opacity: unknown, blendMode: unknown, duration: unknown, easingType: unknown): void;
  /**
   * Performs on battle start.
   */
  onBattleStart(): void;
  /**
   * Gets picture.
   * @param pictureId The pictureId parameter.
   * @returns The result.
   */
  picture(pictureId: unknown): unknown;
  /**
   * Gets real picture id.
   * @param pictureId The pictureId parameter.
   * @returns The result.
   */
  realPictureId(pictureId: unknown): unknown;
  /**
   * Performs rotate picture.
   * @param pictureId The pictureId parameter.
   * @param speed The speed parameter.
   */
  rotatePicture(pictureId: unknown, speed: unknown): void;
  /**
   * Sets zoom.
   * @param x The x parameter.
   * @param y The y parameter.
   * @param scale The scale parameter.
   */
  setZoom(x: unknown, y: unknown, scale: unknown): void;
  /**
   * Gets shake.
   * @returns The result.
   */
  shake(): unknown;
  /**
   * Performs show picture.
   * @param pictureId The pictureId parameter.
   * @param name The name parameter.
   * @param origin The origin parameter.
   * @param x The x parameter.
   * @param y The y parameter.
   * @param scaleX The scaleX parameter.
   * @param scaleY The scaleY parameter.
   * @param opacity The opacity parameter.
   * @param blendMode The blendMode parameter.
   */
  showPicture(pictureId: unknown, name: unknown, origin: unknown, x: unknown, y: unknown, scaleX: unknown, scaleY: unknown, opacity: unknown, blendMode: unknown): void;
  /**
   * Performs start fade in.
   * @param duration The duration parameter.
   */
  startFadeIn(duration: unknown): void;
  /**
   * Performs start fade out.
   * @param duration The duration parameter.
   */
  startFadeOut(duration: unknown): void;
  /**
   * Performs start flash.
   * @param color The color parameter.
   * @param duration The duration parameter.
   */
  startFlash(color: unknown, duration: unknown): void;
  /**
   * Performs start flash for damage.
   */
  startFlashForDamage(): void;
  /**
   * Performs start shake.
   * @param power The power parameter.
   * @param speed The speed parameter.
   * @param duration The duration parameter.
   */
  startShake(power: unknown, speed: unknown, duration: unknown): void;
  /**
   * Performs start tint.
   * @param tone The tone parameter.
   * @param duration The duration parameter.
   */
  startTint(tone: unknown, duration: unknown): void;
  /**
   * Performs start zoom.
   * @param x The x parameter.
   * @param y The y parameter.
   * @param scale The scale parameter.
   * @param duration The duration parameter.
   */
  startZoom(x: unknown, y: unknown, scale: unknown, duration: unknown): void;
  /**
   * Performs tint picture.
   * @param pictureId The pictureId parameter.
   * @param tone The tone parameter.
   * @param duration The duration parameter.
   */
  tintPicture(pictureId: unknown, tone: unknown, duration: unknown): void;
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
   * Updates fade in.
   */
  updateFadeIn(): void;
  /**
   * Updates fade out.
   */
  updateFadeOut(): void;
  /**
   * Updates flash.
   */
  updateFlash(): void;
  /**
   * Updates pictures.
   */
  updatePictures(): void;
  /**
   * Updates shake.
   */
  updateShake(): void;
  /**
   * Updates tone.
   */
  updateTone(): void;
  /**
   * Updates weather.
   */
  updateWeather(): void;
  /**
   * Updates zoom.
   */
  updateZoom(): void;
  /**
   * Gets weather power.
   * @returns The result.
   */
  weatherPower(): unknown;
  /**
   * Gets weather type.
   * @returns The result.
   */
  weatherType(): unknown;
  /**
   * Gets zoom scale.
   * @returns The result.
   */
  zoomScale(): unknown;
  /**
   * Gets zoom x.
   * @returns The result.
   */
  zoomX(): unknown;
  /**
   * Gets zoom y.
   * @returns The result.
   */
  zoomY(): unknown;
}
