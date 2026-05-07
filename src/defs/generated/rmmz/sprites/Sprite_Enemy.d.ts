/**
 * Generated from project/js/rmmz_sprites.js
 * Class: Sprite_Enemy
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Sprite_Enemy
{
  /**
   * Inferred engine backing field.
   *
   * Type: `boolean`.
   * Initialized in: none.
   * Written in: {@link Sprite_Enemy#initMembers}, {@link Sprite_Enemy#initVisibility}, {@link Sprite_Enemy#startAppear}, {@link Sprite_Enemy#startBossCollapse}, {@link Sprite_Enemy#startCollapse}, {@link Sprite_Enemy#startDisappear}, {@link Sprite_Enemy#startInstantCollapse}.
   * Read in: {@link Sprite_Enemy#initVisibility}, {@link Sprite_Enemy#setupEffect}.
   */
  _appeared: boolean;
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: none.
   * Written in: {@link Sprite_Enemy#initMembers}, {@link Sprite_Enemy#updateBitmap}.
   * Read in: {@link Sprite_Enemy#updateBitmap}.
   */
  _battlerHue: number;
  /**
   * Inferred engine backing field.
   *
   * Type: `null | string`.
   * Initialized in: none.
   * Written in: {@link Sprite_Enemy#initMembers}, {@link Sprite_Enemy#updateBitmap}.
   * Read in: {@link Sprite_Enemy#updateBitmap}.
   */
  _battlerName: null | string;
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: none.
   * Written in: {@link Sprite_Enemy#initMembers}, {@link Sprite_Enemy#startAppear}, {@link Sprite_Enemy#startBlink}, {@link Sprite_Enemy#startBossCollapse}, {@link Sprite_Enemy#startCollapse}, {@link Sprite_Enemy#startDisappear}, {@link Sprite_Enemy#startInstantCollapse}, {@link Sprite_Enemy#startWhiten}, {@link Sprite_Enemy#updateEffect}.
   * Read in: {@link Sprite_Enemy#updateAppear}, {@link Sprite_Enemy#updateBlink}, {@link Sprite_Enemy#updateBossCollapse}, {@link Sprite_Enemy#updateCollapse}, {@link Sprite_Enemy#updateDisappear}, {@link Sprite_Enemy#updateEffect}, {@link Sprite_Enemy#updateFrame}, {@link Sprite_Enemy#updateWhiten}.
   */
  _effectDuration: number;
  /**
   * Inferred engine backing field.
   *
   * Type: `null | number`.
   * Initialized in: none.
   * Written in: {@link Sprite_Enemy#initMembers}, {@link Sprite_Enemy#startEffect}, {@link Sprite_Enemy#updateEffect}.
   * Read in: {@link Sprite_Enemy#isEffecting}, {@link Sprite_Enemy#startEffect}, {@link Sprite_Enemy#updateEffect}, {@link Sprite_Enemy#updateFrame}.
   */
  _effectType: null | number;
  /**
   * Inferred engine backing field.
   *
   * Type: `null | Game_Battler`.
   * Initialized in: none.
   * Written in: {@link Sprite_Enemy#initMembers}, {@link Sprite_Enemy#setBattler}.
   * Read in: {@link Sprite_Enemy#initVisibility}, {@link Sprite_Enemy#setupEffect}, {@link Sprite_Enemy#update}, {@link Sprite_Enemy#updateBitmap}.
   */
  _enemy: null | Game_Battler;
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: none.
   * Written in: {@link Sprite_Enemy#initMembers}, {@link Sprite_Enemy#revertToNormal}, {@link Sprite_Enemy#updateBossCollapse}.
   * Read in: {@link Sprite_Enemy#updatePosition}.
   */
  _shake: number;
  /**
   * Inferred engine backing field.
   *
   * Type: `Sprite_StateIcon`.
   * Initialized in: none.
   * Written in: {@link Sprite_Enemy#createStateIconSprite}.
   * Read in: {@link Sprite_Enemy#createStateIconSprite}, {@link Sprite_Enemy#setBattler}, {@link Sprite_Enemy#updateStateSprite}.
   */
  _stateIconSprite: Sprite_StateIcon;
  /**
   * Creates state icon sprite.
   */
  createStateIconSprite(): void;
  /**
   * Gets damage offset x.
   * @returns The result.
   */
  damageOffsetX(): number;
  /**
   * Gets damage offset y.
   * @returns The result.
   */
  damageOffsetY(): number;
  /**
   * Initializes members.
   */
  initMembers(): void;
  /**
   * Initializes visibility.
   */
  initVisibility(): void;
  /**
   * Initializes initialize.
   * @param battler The battler parameter.
   */
  initialize(battler: Game_Battler): void;
  /**
   * Determines whether effecting.
   * @returns True if effecting; false otherwise.
   */
  isEffecting(): boolean;
  /**
   * Performs load bitmap.
   * @param name The name parameter.
   */
  loadBitmap(name: string): void;
  /**
   * Performs revert to normal.
   */
  revertToNormal(): void;
  /**
   * Sets battler.
   * @param battler The battler parameter.
   */
  setBattler(battler: Game_Battler): void;
  /**
   * Sets hue.
   * @param hue The hue parameter.
   */
  setHue(hue: number): void;
  /**
   * Performs setup effect.
   */
  setupEffect(): void;
  /**
   * Performs start appear.
   */
  startAppear(): void;
  /**
   * Performs start blink.
   */
  startBlink(): void;
  /**
   * Performs start boss collapse.
   */
  startBossCollapse(): void;
  /**
   * Performs start collapse.
   */
  startCollapse(): void;
  /**
   * Performs start disappear.
   */
  startDisappear(): void;
  /**
   * Performs start effect.
   * @param effectType The effectType parameter.
   */
  startEffect(effectType: number): void;
  /**
   * Performs start instant collapse.
   */
  startInstantCollapse(): void;
  /**
   * Performs start whiten.
   */
  startWhiten(): void;
  /**
   * Performs update.
   */
  update(): void;
  /**
   * Updates appear.
   */
  updateAppear(): void;
  /**
   * Updates bitmap.
   */
  updateBitmap(): void;
  /**
   * Updates blink.
   */
  updateBlink(): void;
  /**
   * Updates boss collapse.
   */
  updateBossCollapse(): void;
  /**
   * Updates collapse.
   */
  updateCollapse(): void;
  /**
   * Updates disappear.
   */
  updateDisappear(): void;
  /**
   * Updates effect.
   */
  updateEffect(): void;
  /**
   * Updates frame.
   */
  updateFrame(): void;
  /**
   * Updates instant collapse.
   */
  updateInstantCollapse(): void;
  /**
   * Updates position.
   */
  updatePosition(): void;
  /**
   * Updates state sprite.
   */
  updateStateSprite(): void;
  /**
   * Updates whiten.
   */
  updateWhiten(): void;
}
