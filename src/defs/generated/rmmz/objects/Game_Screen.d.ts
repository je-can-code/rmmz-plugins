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
   * Instance fields inferred from `this._*` assignments across vanilla engine sources.
   */
  _brightness: number;
  _fadeInDuration: number;
  _fadeOutDuration: number;
  _flashColor: number[];
  _flashDuration: number;
  _pictures: unknown[];
  _shake: number;
  _shakeDirection: number;
  _shakeDuration: number;
  _shakePower: number;
  _shakeSpeed: number;
  _tone: number[];
  _toneDuration: number;
  _toneTarget: number[];
  _weatherDuration: number;
  _weatherPower: number;
  _weatherPowerTarget: number;
  _weatherType: string;
  _zoomDuration: number;
  _zoomScale: number;
  _zoomScaleTarget: number;
  _zoomX: number;
  _zoomY: number;
  brightness(): number;
  changeWeather(_type: string, power: number, duration: number): void;
  clear(): void;
  clearFade(): void;
  clearFlash(): void;
  clearPictures(): void;
  clearShake(): void;
  clearTone(): void;
  clearWeather(): void;
  clearZoom(): void;
  eraseBattlePictures(): void;
  erasePicture(pictureId: number): void;
  flashColor(): [number, number, number, number];
  initialize(): void;
  maxPictures(): number;
  movePicture(pictureId: number, origin: number, x: number, y: number, scaleX: number, scaleY: number, opacity: number, blendMode: number, duration: number, easingType: number): void;
  onBattleStart(): void;
  picture(pictureId: number): Game_Picture | null | undefined;
  realPictureId(pictureId: number): number;
  rotatePicture(pictureId: number, speed: number): void;
  setZoom(x: number, y: number, scale: number): void;
  shake(): number;
  showPicture(pictureId: number, name: string, origin: number, x: number, y: number, scaleX: number, scaleY: number, opacity: number, blendMode: number): void;
  startFadeIn(duration: number): void;
  startFadeOut(duration: number): void;
  startFlash(color: [number, number, number, number], duration: number): void;
  startFlashForDamage(): void;
  startShake(power: number, speed: number, duration: number): void;
  startTint(tone: [number, number, number, number], duration: number): void;
  startZoom(x: number, y: number, scale: number, duration: number): void;
  tintPicture(pictureId: number, tone: [number, number, number, number], duration: number): void;
  tone(): [number, number, number, number];
  update(): void;
  updateFadeIn(): void;
  updateFadeOut(): void;
  updateFlash(): void;
  updatePictures(): void;
  updateShake(): void;
  updateTone(): void;
  updateWeather(): void;
  updateZoom(): void;
  weatherPower(): number;
  weatherType(): string;
  zoomScale(): number;
  zoomX(): number;
  zoomY(): number;
}
