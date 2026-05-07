/**
 * Generated from project/js/rmmz_windows.js
 * Class: Window_StatusBase
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Window_StatusBase
{
  /**
   * Instance fields inferred from `this._*` assignments across vanilla engine sources.
   */
  _additionalSprites: object;
  actorSlotName(actor: Game_Actor, index: number): string;
  createInnerSprite(key: string, spriteClass: new () => Sprite): Sprite;
  drawActorCharacter(actor: Game_Actor, x: number, y: number): void;
  drawActorClass(actor: Game_Actor, x: number, y: number, width: number): void;
  drawActorFace(actor: Game_Actor, x: number, y: number, width: number, height: number): void;
  drawActorIcons(actor: Game_Actor, x: number, y: number, width: number): void;
  drawActorLevel(actor: Game_Actor, x: number, y: number): void;
  drawActorName(actor: Game_Actor, x: number, y: number, width: number): void;
  drawActorNickname(actor: Game_Actor, x: number, y: number, width: number): void;
  drawActorSimpleStatus(actor: Game_Actor, x: number, y: number): void;
  gaugeLineHeight(): number;
  hideAdditionalSprites(): void;
  initialize(rect: Rectangle): void;
  loadFaceImages(): void;
  placeActorName(actor: Game_Actor, x: number, y: number): void;
  placeBasicGauges(actor: Game_Actor, x: number, y: number): void;
  placeGauge(actor: Game_Actor, _type: string, x: number, y: number): void;
  placeStateIcon(actor: Game_Actor, x: number, y: number): void;
  placeTimeGauge(actor: Game_Actor, x: number, y: number): void;
  refresh(): void;
}
