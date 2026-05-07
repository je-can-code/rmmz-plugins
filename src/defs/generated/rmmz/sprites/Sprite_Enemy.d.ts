/**
 * Generated from project/js/rmmz_sprites.js
 * Class: Sprite_Enemy
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Sprite_Enemy extends Sprite_Battler
{
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `boolean`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Sprite_Enemy#initMembers}, {@link Sprite_Enemy#initVisibility}, {@link Sprite_Enemy#startAppear}, {@link Sprite_Enemy#startBossCollapse}, {@link Sprite_Enemy#startCollapse}, {@link Sprite_Enemy#startDisappear}, {@link Sprite_Enemy#startInstantCollapse}.<br/>
   * Read in: {@link Sprite_Enemy#initVisibility}, {@link Sprite_Enemy#setupEffect}.<br/>
   */
  _appeared: boolean;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Sprite_Enemy#initMembers}, {@link Sprite_Enemy#updateBitmap}.<br/>
   * Read in: {@link Sprite_Enemy#updateBitmap}.<br/>
   */
  _battlerHue: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `null`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Sprite_Enemy#initMembers}, {@link Sprite_Enemy#updateBitmap}.<br/>
   * Read in: {@link Sprite_Enemy#updateBitmap}.<br/>
   */
  _battlerName: null;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Sprite_Enemy#initMembers}, {@link Sprite_Enemy#startAppear}, {@link Sprite_Enemy#startBlink}, {@link Sprite_Enemy#startBossCollapse}, {@link Sprite_Enemy#startCollapse}, {@link Sprite_Enemy#startDisappear}, {@link Sprite_Enemy#startInstantCollapse}, {@link Sprite_Enemy#startWhiten}, {@link Sprite_Enemy#updateEffect}.<br/>
   * Read in: {@link Sprite_Enemy#updateAppear}, {@link Sprite_Enemy#updateBlink}, {@link Sprite_Enemy#updateBossCollapse}, {@link Sprite_Enemy#updateCollapse}, {@link Sprite_Enemy#updateDisappear}, {@link Sprite_Enemy#updateEffect}, {@link Sprite_Enemy#updateFrame}, {@link Sprite_Enemy#updateWhiten}.<br/>
   */
  _effectDuration: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `null`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Sprite_Enemy#initMembers}, {@link Sprite_Enemy#startEffect}, {@link Sprite_Enemy#updateEffect}.<br/>
   * Read in: {@link Sprite_Enemy#isEffecting}, {@link Sprite_Enemy#startEffect}, {@link Sprite_Enemy#updateEffect}, {@link Sprite_Enemy#updateFrame}.<br/>
   */
  _effectType: null;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `null`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Sprite_Enemy#initMembers}, {@link Sprite_Enemy#setBattler}.<br/>
   * Read in: {@link Sprite_Enemy#initVisibility}, {@link Sprite_Enemy#setupEffect}, {@link Sprite_Enemy#update}, {@link Sprite_Enemy#updateBitmap}.<br/>
   */
  _enemy: null;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Sprite_Enemy#initMembers}, {@link Sprite_Enemy#revertToNormal}, {@link Sprite_Enemy#updateBossCollapse}.<br/>
   * Read in: {@link Sprite_Enemy#updatePosition}.<br/>
   */
  _shake: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `Sprite_StateIcon`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Sprite_Enemy#createStateIconSprite}.<br/>
   * Read in: {@link Sprite_Enemy#createStateIconSprite}, {@link Sprite_Enemy#setBattler}, {@link Sprite_Enemy#updateStateSprite}.<br/>
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
  damageOffsetX(): unknown;
  /**
   * Gets damage offset y.
   * @returns The result.
   */
  damageOffsetY(): unknown;
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
  initialize(battler: unknown): void;
  /**
   * Determines whether effecting.
   * @returns True if effecting; false otherwise.
   */
  isEffecting(): boolean;
  /**
   * Performs load bitmap.
   * @param name The name parameter.
   */
  loadBitmap(name: unknown): void;
  /**
   * Performs revert to normal.
   */
  revertToNormal(): void;
  /**
   * Sets battler.
   * @param battler The battler parameter.
   */
  setBattler(battler: unknown): void;
  /**
   * Sets hue.
   * @param hue The hue parameter.
   */
  setHue(hue: unknown): void;
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
  startEffect(effectType: unknown): void;
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
