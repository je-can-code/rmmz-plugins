//region JuiceHeldOverlay
import JuiceWeaponSwingMotionEffect from './JuiceWeaponSwingMotionEffect.js';

/**
 * One icon a character is holding up, and everything needed to put it back.
 *
 * A held overlay outlives the sprite showing it. `Sprite_Character` objects are built and destroyed
 * every time the map scene is rebuilt — opening the menu is enough — while the character they draw
 * lives in the save data and persists. So what is stored here is the *request* rather than the
 * sprite work: who is holding something up, which icon, in what pose. The effect doing the actual
 * drawing is attached and detached as sprites come and go, which is what lets a held icon survive a
 * trip through the menu and reappear on the other side.
 *
 * This is the same split J-Motion draws between a `MotionDeclaration` and a `MotionEffect`, for the
 * same reason, and the pull in {@link Sprite_Character#updateHeldJuiceOverlays} mirrors the one
 * that composer does.
 */
class JuiceHeldOverlay
{
  /**
   * The character holding the icon up.
   * @type {Game_Character}
   */
  #character = null;

  /**
   * Who asked for this, and therefore who is allowed to withdraw it.
   * @type {string}
   */
  #sourceKey = String.empty;

  /**
   * The IconSet cell being held up.
   * @type {number}
   */
  #iconIndex = 0;

  /**
   * The overlay preset the icon is posed in, ex: `present`.
   * @type {string}
   */
  #motionType = String.empty;

  /**
   * How many frames the pose takes to reach, before it parks there.
   * @type {number}
   */
  #durationFrames = 0;

  /**
   * How many times the motion repeats on its way to the final pose.
   * @type {number}
   */
  #repeatCount = 1;

  /**
   * Arc span in degrees, for the presets that orbit.
   * @type {number}
   */
  #arcSpanDegrees = 120;

  /**
   * The effect currently drawing this, or null when no sprite is showing it.
   * @type {JuiceWeaponSwingMotionEffect|null}
   */
  #effect = null;

  /**
   * The facing the live effect was built against.
   *
   * Overlay geometry is resolved once at spawn and never re-read, because a swing that changed
   * direction halfway through would tear rather than swing. A held pose has the opposite problem:
   * it lasts long enough for the character to turn under it, and a spear left pointing at where
   * north used to be reads as a bug. Remembering the facing is what lets the pull notice.
   * @type {number}
   */
  #facing = 0;

  /**
   * Constructor.
   * @param {Game_Character} character The character holding the icon up.
   * @param {string} sourceKey Who asked for this.
   * @param {number} iconIndex The IconSet cell to hold up.
   * @param {string} motionType The overlay preset to pose it in.
   * @param {number} durationFrames How many frames reaching the pose takes.
   * @param {number} repeatCount How many times the motion repeats on the way there.
   * @param {number} arcSpanDegrees Arc span in degrees, for the presets that orbit.
   */
  constructor(character, sourceKey, iconIndex, motionType, durationFrames, repeatCount, arcSpanDegrees)
  {
    this.#character = character;
    this.#sourceKey = sourceKey;
    this.#iconIndex = iconIndex;
    this.#motionType = motionType;
    this.#durationFrames = durationFrames;
    this.#repeatCount = repeatCount;
    this.#arcSpanDegrees = arcSpanDegrees;
  }

  //region properties
  /**
   * Gets the character holding the icon up.
   * @returns {Game_Character} The character.
   */
  character()
  {
    // hand back the character.
    return this.#character;
  }

  /**
   * Gets who asked for this overlay.
   * @returns {string} The sourceKey.
   */
  sourceKey()
  {
    // hand back the source key.
    return this.#sourceKey;
  }

  /**
   * Gets the IconSet cell being held up.
   * @returns {number} The iconIndex.
   */
  iconIndex()
  {
    // hand back the icon index.
    return this.#iconIndex;
  }

  /**
   * Gets the overlay preset the icon is posed in.
   * @returns {string} The motionType.
   */
  motionType()
  {
    // hand back the motion type.
    return this.#motionType;
  }

  /**
   * Gets how many frames reaching the pose takes.
   * @returns {number} The durationFrames.
   */
  durationFrames()
  {
    // hand back the duration in frames.
    return this.#durationFrames;
  }

  /**
   * Gets how many times the motion repeats on the way to the pose.
   * @returns {number} The repeatCount.
   */
  repeatCount()
  {
    // hand back the repeat count.
    return this.#repeatCount;
  }

  /**
   * Gets the arc span in degrees.
   * @returns {number} The arcSpanDegrees.
   */
  arcSpanDegrees()
  {
    // hand back the arc span.
    return this.#arcSpanDegrees;
  }

  /**
   * Gets the effect currently drawing this overlay.
   * @returns {JuiceWeaponSwingMotionEffect|null} The effect, or null when nothing is drawing it.
   */
  effect()
  {
    // hand back the live effect.
    return this.#effect;
  }

  /**
   * Sets the effect currently drawing this overlay.
   * @param {JuiceWeaponSwingMotionEffect|null} newEffect The new effect, or null to detach.
   */
  setEffect(newEffect)
  {
    // assign the live effect.
    this.#effect = newEffect;
  }

  /**
   * Gets the facing the live effect was built against.
   * @returns {number} The facing.
   */
  facing()
  {
    // hand back the facing.
    return this.#facing;
  }

  /**
   * Sets the facing the live effect was built against.
   * @param {number} newFacing The new facing.
   */
  setFacing(newFacing)
  {
    // assign the facing.
    this.#facing = newFacing;
  }
  //endregion properties

  /**
   * Determines whether a sprite is already showing this overlay as currently requested.
   *
   * Three things have to agree for the answer to be yes, and each false answer is a different way a
   * held icon goes stale: nothing is drawing it at all, something is drawing it on a sprite that
   * has since been replaced, or it is drawn correctly for a direction the character is no longer
   * facing.
   * @param {Sprite_Character} sprite The sprite asking whether it has work to do.
   * @returns {boolean}
   */
  isCurrentFor(sprite)
  {
    const effect = this.effect();

    // nothing is drawing this yet, which is where every held overlay starts.
    if (effect === null) return false;

    // something is drawing it, but onto a sprite from a scene that has since been torn down.
    if (effect.parentSprite() !== sprite) return false;

    // a preset built against a fixed direction has nothing to go stale, and rebuilding one on every
    // turn would restart its ease - a raised icon dropping and climbing again for no reason.
    if (JuiceWeaponSwingMotionEffect.isFacingAgnostic(this.motionType()) === true) return true;

    // the character turned under a pose that was aimed when it was built.
    return this.character()
      .direction() === this.facing();
  }
}

export default JuiceHeldOverlay;
//endregion JuiceHeldOverlay