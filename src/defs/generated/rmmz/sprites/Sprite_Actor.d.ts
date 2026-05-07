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
   * Inferred engine backing field.
   *
   * Type: `Game_Battler`.
   * Initialized in: none.
   * Written in: {@link Sprite_Actor#setBattler}.
   * Read in: {@link Sprite_Actor#refreshMotion}, {@link Sprite_Actor#setBattler}, {@link Sprite_Actor#setupMotion}, {@link Sprite_Actor#setupWeaponAnimation}, {@link Sprite_Actor#shouldStepForward}, {@link Sprite_Actor#startEntryMotion}, {@link Sprite_Actor#update}, {@link Sprite_Actor#updateBitmap}, {@link Sprite_Actor#updateMain}, {@link Sprite_Actor#updateMotion}, {@link Sprite_Actor#updateShadow}, {@link Sprite_Actor#updateTargetPosition}.
   */
  _actor: Game_Battler;
  /**
   * Inferred engine backing field.
   *
   * Type: `string`.
   * Initialized in: none.
   * Written in: {@link Sprite_Actor#initMembers}, {@link Sprite_Actor#setBattler}, {@link Sprite_Actor#updateBitmap}.
   * Read in: {@link Sprite_Actor#updateBitmap}.
   */
  _battlerName: string;
  /**
   * Inferred engine backing field.
   *
   * Type: `Sprite`.
   * Initialized in: none.
   * Written in: {@link Sprite_Actor#createMainSprite}.
   * Read in: {@link Sprite_Actor#createMainSprite}, {@link Sprite_Actor#mainSprite}, {@link Sprite_Actor#setBattler}, {@link Sprite_Actor#updateBitmap}, {@link Sprite_Actor#updateFrame}, {@link Sprite_Actor#updateMove}.
   */
  _mainSprite: Sprite;
  /**
   * Inferred engine backing field.
   *
   * Type: `null`.
   * Initialized in: none.
   * Written in: {@link Sprite_Actor#initMembers}, {@link Sprite_Actor#startMotion}.
   * Read in: {@link Sprite_Actor#startMotion}, {@link Sprite_Actor#updateFrame}, {@link Sprite_Actor#updateMotionCount}.
   */
  _motion: null;
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: none.
   * Written in: {@link Sprite_Actor#initMembers}, {@link Sprite_Actor#startMotion}, {@link Sprite_Actor#updateMotionCount}.
   * Read in: none.
   */
  _motionCount: number;
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: none.
   * Written in: {@link Sprite_Actor#initMembers}, {@link Sprite_Actor#startMotion}, {@link Sprite_Actor#updateMotionCount}.
   * Read in: {@link Sprite_Actor#updateFrame}, {@link Sprite_Actor#updateMotionCount}.
   */
  _pattern: number;
  /**
   * Inferred engine backing field.
   *
   * Type: `Sprite`.
   * Initialized in: none.
   * Written in: {@link Sprite_Actor#createShadowSprite}.
   * Read in: {@link Sprite_Actor#createShadowSprite}, {@link Sprite_Actor#updateShadow}.
   */
  _shadowSprite: Sprite;
  /**
   * Inferred engine backing field.
   *
   * Type: `Sprite_StateOverlay`.
   * Initialized in: none.
   * Written in: {@link Sprite_Actor#createStateSprite}.
   * Read in: {@link Sprite_Actor#createStateSprite}, {@link Sprite_Actor#setBattler}.
   */
  _stateSprite: Sprite_StateOverlay;
  /**
   * Inferred engine backing field.
   *
   * Type: `Sprite_Weapon`.
   * Initialized in: none.
   * Written in: {@link Sprite_Actor#createWeaponSprite}.
   * Read in: {@link Sprite_Actor#createWeaponSprite}, {@link Sprite_Actor#setupWeaponAnimation}.
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
