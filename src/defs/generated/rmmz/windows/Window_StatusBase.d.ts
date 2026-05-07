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
  actorSlotName(actor: unknown, index: unknown): unknown;
  /**
   * Creates inner sprite.
   * @param key The key parameter.
   * @param spriteClass The spriteClass parameter.
   * @returns The result.
   */
  createInnerSprite(key: unknown, spriteClass: unknown): unknown;
  /**
   * Performs draw actor character.
   * @param actor The actor parameter.
   * @param x The x parameter.
   * @param y The y parameter.
   */
  drawActorCharacter(actor: unknown, x: unknown, y: unknown): void;
  /**
   * Performs draw actor class.
   * @param actor The actor parameter.
   * @param x The x parameter.
   * @param y The y parameter.
   * @param width The width parameter.
   */
  drawActorClass(actor: unknown, x: unknown, y: unknown, width: unknown): void;
  /**
   * Performs draw actor face.
   * @param actor The actor parameter.
   * @param x The x parameter.
   * @param y The y parameter.
   * @param width The width parameter.
   * @param height The height parameter.
   */
  drawActorFace(actor: unknown, x: unknown, y: unknown, width: unknown, height: unknown): void;
  /**
   * Performs draw actor icons.
   * @param actor The actor parameter.
   * @param x The x parameter.
   * @param y The y parameter.
   * @param width The width parameter.
   */
  drawActorIcons(actor: unknown, x: unknown, y: unknown, width: unknown): void;
  /**
   * Performs draw actor level.
   * @param actor The actor parameter.
   * @param x The x parameter.
   * @param y The y parameter.
   */
  drawActorLevel(actor: unknown, x: unknown, y: unknown): void;
  /**
   * Performs draw actor name.
   * @param actor The actor parameter.
   * @param x The x parameter.
   * @param y The y parameter.
   * @param width The width parameter.
   */
  drawActorName(actor: unknown, x: unknown, y: unknown, width: unknown): void;
  /**
   * Performs draw actor nickname.
   * @param actor The actor parameter.
   * @param x The x parameter.
   * @param y The y parameter.
   * @param width The width parameter.
   */
  drawActorNickname(actor: unknown, x: unknown, y: unknown, width: unknown): void;
  /**
   * Performs draw actor simple status.
   * @param actor The actor parameter.
   * @param x The x parameter.
   * @param y The y parameter.
   */
  drawActorSimpleStatus(actor: unknown, x: unknown, y: unknown): void;
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
  initialize(rect: unknown): void;
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
  placeActorName(actor: unknown, x: unknown, y: unknown): void;
  /**
   * Performs place basic gauges.
   * @param actor The actor parameter.
   * @param x The x parameter.
   * @param y The y parameter.
   */
  placeBasicGauges(actor: unknown, x: unknown, y: unknown): void;
  /**
   * Performs place gauge.
   * @param actor The actor parameter.
   * @param _type The type parameter.
   * @param x The x parameter.
   * @param y The y parameter.
   */
  placeGauge(actor: unknown, _type: unknown, x: unknown, y: unknown): void;
  /**
   * Performs place state icon.
   * @param actor The actor parameter.
   * @param x The x parameter.
   * @param y The y parameter.
   */
  placeStateIcon(actor: unknown, x: unknown, y: unknown): void;
  /**
   * Performs place time gauge.
   * @param actor The actor parameter.
   * @param x The x parameter.
   * @param y The y parameter.
   */
  placeTimeGauge(actor: unknown, x: unknown, y: unknown): void;
  /**
   * Performs refresh.
   */
  refresh(): void;
}
