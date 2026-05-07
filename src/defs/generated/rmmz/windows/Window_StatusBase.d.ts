/**
 * Generated from project/js/rmmz_windows.js
 * Class: Window_StatusBase
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Window_StatusBase extends Window_Selectable
{
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `object`.<br/>
   * Initialized in: {@link Window_StatusBase#initialize}.<br/>
   * Written in: {@link Window_StatusBase#initialize}.<br/>
   * Read in: {@link Window_StatusBase#createInnerSprite}, {@link Window_StatusBase#hideAdditionalSprites}.<br/>
   */
  _additionalSprites: object;
  /**
   * Gets actor slot name.
   * @param actor The actor parameter.
   * @param index The index parameter.
   * @returns The result.
   */
  actorSlotName(actor: Game_Actor, index: number): string;
  /**
   * Creates inner sprite.
   * @param key The key parameter.
   * @param spriteClass The spriteClass parameter.
   * @returns The result.
   */
  createInnerSprite(key: string, spriteClass: new () => Sprite): Sprite;
  /**
   * Performs draw actor character.
   * @param actor The actor parameter.
   * @param x The x parameter.
   * @param y The y parameter.
   */
  drawActorCharacter(actor: Game_Actor, x: number, y: number): void;
  /**
   * Performs draw actor class.
   * @param actor The actor parameter.
   * @param x The x parameter.
   * @param y The y parameter.
   * @param width The width parameter.
   */
  drawActorClass(actor: Game_Actor, x: number, y: number, width: number): void;
  /**
   * Performs draw actor face.
   * @param actor The actor parameter.
   * @param x The x parameter.
   * @param y The y parameter.
   * @param width The width parameter.
   * @param height The height parameter.
   */
  drawActorFace(actor: Game_Actor, x: number, y: number, width: number, height: number): void;
  /**
   * Performs draw actor icons.
   * @param actor The actor parameter.
   * @param x The x parameter.
   * @param y The y parameter.
   * @param width The width parameter.
   */
  drawActorIcons(actor: Game_Actor, x: number, y: number, width: number): void;
  /**
   * Performs draw actor level.
   * @param actor The actor parameter.
   * @param x The x parameter.
   * @param y The y parameter.
   */
  drawActorLevel(actor: Game_Actor, x: number, y: number): void;
  /**
   * Performs draw actor name.
   * @param actor The actor parameter.
   * @param x The x parameter.
   * @param y The y parameter.
   * @param width The width parameter.
   */
  drawActorName(actor: Game_Actor, x: number, y: number, width: number): void;
  /**
   * Performs draw actor nickname.
   * @param actor The actor parameter.
   * @param x The x parameter.
   * @param y The y parameter.
   * @param width The width parameter.
   */
  drawActorNickname(actor: Game_Actor, x: number, y: number, width: number): void;
  /**
   * Performs draw actor simple status.
   * @param actor The actor parameter.
   * @param x The x parameter.
   * @param y The y parameter.
   */
  drawActorSimpleStatus(actor: Game_Actor, x: number, y: number): void;
  /**
   * Gets gauge line height.
   * @returns The result.
   */
  gaugeLineHeight(): number;
  /**
   * Performs hide additional sprites.
   */
  hideAdditionalSprites(): void;
  /**
   * Initializes initialize.
   * @param rect The rect parameter.
   */
  initialize(rect: Rectangle): void;
  /**
   * Performs load face images.
   */
  loadFaceImages(): void;
  /**
   * Performs place actor name.
   * @param actor The actor parameter.
   * @param x The x parameter.
   * @param y The y parameter.
   */
  placeActorName(actor: Game_Actor, x: number, y: number): void;
  /**
   * Performs place basic gauges.
   * @param actor The actor parameter.
   * @param x The x parameter.
   * @param y The y parameter.
   */
  placeBasicGauges(actor: Game_Actor, x: number, y: number): void;
  /**
   * Performs place gauge.
   * @param actor The actor parameter.
   * @param _type The type parameter.
   * @param x The x parameter.
   * @param y The y parameter.
   */
  placeGauge(actor: Game_Actor, _type: string, x: number, y: number): void;
  /**
   * Performs place state icon.
   * @param actor The actor parameter.
   * @param x The x parameter.
   * @param y The y parameter.
   */
  placeStateIcon(actor: Game_Actor, x: number, y: number): void;
  /**
   * Performs place time gauge.
   * @param actor The actor parameter.
   * @param x The x parameter.
   * @param y The y parameter.
   */
  placeTimeGauge(actor: Game_Actor, x: number, y: number): void;
  /**
   * Performs refresh.
   */
  refresh(): void;
}
