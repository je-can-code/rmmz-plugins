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
  brightness(): number;
  /**
   * Performs change weather.
   * @param _type The type parameter.
   * @param power The power parameter.
   * @param duration The duration parameter.
   */
  changeWeather(_type: string, power: number, duration: number): void;
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
  erasePicture(pictureId: number): void;
  /**
   * Gets flash color.
   * @returns The result.
   */
  flashColor(): [number, number, number, number];
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
  movePicture(pictureId: number, origin: number, x: number, y: number, scaleX: number, scaleY: number, opacity: number, blendMode: number, duration: number, easingType: number): void;
  /**
   * Performs on battle start.
   */
  onBattleStart(): void;
  /**
   * Gets picture.
   * @param pictureId The pictureId parameter.
   * @returns The result.
   */
  picture(pictureId: number): Game_Picture | null | undefined;
  /**
   * Gets real picture id.
   * @param pictureId The pictureId parameter.
   * @returns The result.
   */
  realPictureId(pictureId: number): number;
  /**
   * Performs rotate picture.
   * @param pictureId The pictureId parameter.
   * @param speed The speed parameter.
   */
  rotatePicture(pictureId: number, speed: number): void;
  /**
   * Sets zoom.
   * @param x The x parameter.
   * @param y The y parameter.
   * @param scale The scale parameter.
   */
  setZoom(x: number, y: number, scale: number): void;
  /**
   * Gets shake.
   * @returns The result.
   */
  shake(): number;
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
  showPicture(pictureId: number, name: string, origin: number, x: number, y: number, scaleX: number, scaleY: number, opacity: number, blendMode: number): void;
  /**
   * Performs start fade in.
   * @param duration The duration parameter.
   */
  startFadeIn(duration: number): void;
  /**
   * Performs start fade out.
   * @param duration The duration parameter.
   */
  startFadeOut(duration: number): void;
  /**
   * Performs start flash.
   * @param color The color parameter.
   * @param duration The duration parameter.
   */
  startFlash(color: [number, number, number, number], duration: number): void;
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
  startShake(power: number, speed: number, duration: number): void;
  /**
   * Performs start tint.
   * @param tone The tone parameter.
   * @param duration The duration parameter.
   */
  startTint(tone: [number, number, number, number], duration: number): void;
  /**
   * Performs start zoom.
   * @param x The x parameter.
   * @param y The y parameter.
   * @param scale The scale parameter.
   * @param duration The duration parameter.
   */
  startZoom(x: number, y: number, scale: number, duration: number): void;
  /**
   * Performs tint picture.
   * @param pictureId The pictureId parameter.
   * @param tone The tone parameter.
   * @param duration The duration parameter.
   */
  tintPicture(pictureId: number, tone: [number, number, number, number], duration: number): void;
  /**
   * Gets tone.
   * @returns The result.
   */
  tone(): [number, number, number, number];
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
  weatherPower(): number;
  /**
   * Gets weather type.
   * @returns The result.
   */
  weatherType(): string;
  /**
   * Gets zoom scale.
   * @returns The result.
   */
  zoomScale(): number;
  /**
   * Gets zoom x.
   * @returns The result.
   */
  zoomX(): number;
  /**
   * Gets zoom y.
   * @returns The result.
   */
  zoomY(): number;
}
