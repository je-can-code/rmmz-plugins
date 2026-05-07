/**
 * Generated from project/js/rmmz_sprites.js
 * Class: Sprite_Actor
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Sprite_Actor extends Sprite_Battler
{
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `Game_Battler`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Sprite_Actor#setBattler}.<br/>
   * Read in: {@link Sprite_Actor#refreshMotion}, {@link Sprite_Actor#setBattler}, {@link Sprite_Actor#setupMotion}, {@link Sprite_Actor#setupWeaponAnimation}, {@link Sprite_Actor#shouldStepForward}, {@link Sprite_Actor#startEntryMotion}, {@link Sprite_Actor#update}, {@link Sprite_Actor#updateBitmap}, {@link Sprite_Actor#updateMain}, {@link Sprite_Actor#updateMotion}, {@link Sprite_Actor#updateShadow}, {@link Sprite_Actor#updateTargetPosition}.<br/>
   */
  _actor: Game_Battler;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `string`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Sprite_Actor#initMembers}, {@link Sprite_Actor#setBattler}, {@link Sprite_Actor#updateBitmap}.<br/>
   * Read in: {@link Sprite_Actor#updateBitmap}.<br/>
   */
  _battlerName: string;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `Sprite`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Sprite_Actor#createMainSprite}.<br/>
   * Read in: {@link Sprite_Actor#createMainSprite}, {@link Sprite_Actor#mainSprite}, {@link Sprite_Actor#setBattler}, {@link Sprite_Actor#updateBitmap}, {@link Sprite_Actor#updateFrame}, {@link Sprite_Actor#updateMove}.<br/>
   */
  _mainSprite: Sprite;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `null`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Sprite_Actor#initMembers}, {@link Sprite_Actor#startMotion}.<br/>
   * Read in: {@link Sprite_Actor#startMotion}, {@link Sprite_Actor#updateFrame}, {@link Sprite_Actor#updateMotionCount}.<br/>
   */
  _motion: null;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Sprite_Actor#initMembers}, {@link Sprite_Actor#startMotion}, {@link Sprite_Actor#updateMotionCount}.<br/>
   * Read in: none.<br/>
   */
  _motionCount: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Sprite_Actor#initMembers}, {@link Sprite_Actor#startMotion}, {@link Sprite_Actor#updateMotionCount}.<br/>
   * Read in: {@link Sprite_Actor#updateFrame}, {@link Sprite_Actor#updateMotionCount}.<br/>
   */
  _pattern: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `Sprite`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Sprite_Actor#createShadowSprite}.<br/>
   * Read in: {@link Sprite_Actor#createShadowSprite}, {@link Sprite_Actor#updateShadow}.<br/>
   */
  _shadowSprite: Sprite;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `Sprite_StateOverlay`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Sprite_Actor#createStateSprite}.<br/>
   * Read in: {@link Sprite_Actor#createStateSprite}, {@link Sprite_Actor#setBattler}.<br/>
   */
  _stateSprite: Sprite_StateOverlay;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `Sprite_Weapon`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Sprite_Actor#createWeaponSprite}.<br/>
   * Read in: {@link Sprite_Actor#createWeaponSprite}, {@link Sprite_Actor#setupWeaponAnimation}.<br/>
   */
  _weaponSprite: Sprite_Weapon;
  /**
   * Creates main sprite.
   */
  createMainSprite(): void;
  /**
   * Creates shadow sprite.
   */
  createShadowSprite(): void;
  /**
   * Creates state sprite.
   */
  createStateSprite(): void;
  /**
   * Creates weapon sprite.
   */
  createWeaponSprite(): void;
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
   * Initializes initialize.
   * @param battler The battler parameter.
   */
  initialize(battler: Game_Battler): void;
  /**
   * Gets main sprite.
   * @returns The result.
   */
  mainSprite(): Sprite;
  /**
   * Gets motion speed.
   * @returns The result.
   */
  motionSpeed(): number;
  /**
   * Performs move to start position.
   */
  moveToStartPosition(): void;
  /**
   * Performs on move end.
   */
  onMoveEnd(): void;
  /**
   * Performs refresh motion.
   */
  refreshMotion(): void;
  /**
   * Performs retreat.
   */
  retreat(): void;
  /**
   * Sets actor home.
   * @param index The index parameter.
   */
  setActorHome(index: number): void;
  /**
   * Sets battler.
   * @param battler The battler parameter.
   */
  setBattler(battler: Game_Battler): void;
  /**
   * Performs setup motion.
   */
  setupMotion(): void;
  /**
   * Performs setup weapon animation.
   */
  setupWeaponAnimation(): void;
  /**
   * Gets should step forward.
   * @returns The result.
   */
  shouldStepForward(): boolean;
  /**
   * Performs start entry motion.
   */
  startEntryMotion(): void;
  /**
   * Performs start motion.
   * @param motionType The motionType parameter.
   */
  startMotion(motionType: number): void;
  /**
   * Performs step back.
   */
  stepBack(): void;
  /**
   * Performs step forward.
   */
  stepForward(): void;
  /**
   * Performs update.
   */
  update(): void;
  /**
   * Updates bitmap.
   */
  updateBitmap(): void;
  /**
   * Updates frame.
   */
  updateFrame(): void;
  /**
   * Updates main.
   */
  updateMain(): void;
  /**
   * Updates motion.
   */
  updateMotion(): void;
  /**
   * Updates motion count.
   */
  updateMotionCount(): void;
  /**
   * Updates move.
   */
  updateMove(): void;
  /**
   * Updates shadow.
   */
  updateShadow(): void;
  /**
   * Updates target position.
   */
  updateTargetPosition(): void;
}
