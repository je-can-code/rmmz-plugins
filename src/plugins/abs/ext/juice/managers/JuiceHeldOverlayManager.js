//region JuiceHeldOverlayManager
import JuiceHeldOverlay from './../models/JuiceHeldOverlay.js';
import JuiceMotionManager from './JuiceMotionManager.js';
import JuiceWeaponSwingOverlay from './JuiceWeaponSwingOverlay.js';

/**
 * Keeps track of every icon a character is holding up, and puts them back on screen.
 *
 * The weapon swing overlay was built for something that happens and is over — a sword comes out,
 * arcs, and destroys itself a quarter of a second later, so nothing ever had to remember it. An
 * icon held up until a cutscene says otherwise is the same drawing with the opposite lifetime, and
 * a lifetime measured in minutes crosses everything that tears a spriteset down.
 *
 * So this class holds requests, not sprites, and sprites come and ask. {@link #materializeFor} runs
 * from `Sprite_Character#update`, which means a rebuilt map scene restores its held icons on the
 * first frame it draws without anybody having to notice the scene changed. The alternative — a
 * teardown hook that saves state and a startup hook that restores it — has to know every route out
 * of a map scene, and there are more of those than anyone remembers.
 *
 * State lives for as long as the characters do and no longer: a `WeakMap` keyed by character means
 * the events of a map the player has left are collected along with their held overlays, while
 * `$gamePlayer` and the followers persist and keep theirs. Nothing here is saved to file, which
 * matches how J-Motion's composer behaves and keeps one rule to remember instead of two.
 */
class JuiceHeldOverlayManager
{
  /**
   * Every held overlay, by character and then by who asked for it.
   *
   * Two sources can hold two different icons up on one character without either knowing about the
   * other, which is the same guarantee a source key buys on the motion composer.
   * @type {WeakMap<Game_Character, Map<string, JuiceHeldOverlay>>}
   */
  static #byCharacter = new WeakMap();

  /**
   * Asks a character to hold an icon up until somebody says otherwise.
   *
   * A source asking twice replaces what it had rather than stacking, because "hold this up" is a
   * statement about what the character is currently doing rather than another thing to add to it.
   * @param {Game_Character} character The character to hold the icon up.
   * @param {string} sourceKey Who is asking, and who may later withdraw it.
   * @param {number} iconIndex The IconSet cell to hold up.
   * @param {string} motionType The overlay preset to pose it in, ex: `present`.
   * @param {number} durationFrames How many frames reaching the pose takes.
   * @param {number} repeatCount How many times the motion repeats on the way there.
   * @param {number} arcSpanDegrees Arc span in degrees, for the presets that orbit.
   */
  static declare(character, sourceKey, iconIndex, motionType, durationFrames, repeatCount, arcSpanDegrees)
  {
    // whatever this source was holding up is coming down first, sprite and all.
    JuiceHeldOverlayManager.withdraw(character, sourceKey);

    const declaration = new JuiceHeldOverlay(
      character,
      sourceKey,
      iconIndex,
      motionType,
      durationFrames,
      repeatCount,
      arcSpanDegrees
    );

    const declarations = JuiceHeldOverlayManager.#declarationsFor(character);
    declarations.set(sourceKey, declaration);
  }

  /**
   * Takes down whatever a source was holding up on a character.
   *
   * Silent when that source is holding nothing, because the honest use of this is "make sure the
   * hero is not still brandishing the amulet", and an author should be able to say that at the end
   * of a cutscene without first working out whether a branch earlier on ever started it.
   * @param {Game_Character} character The character to take the icon from.
   * @param {string} sourceKey Who is withdrawing.
   */
  static withdraw(character, sourceKey)
  {
    const declarations = JuiceHeldOverlayManager.#byCharacter.get(character);

    // this character has never held anything up, so there is nothing to take down.
    if (declarations === undefined) return;

    const declaration = declarations.get(sourceKey);

    // some other source is holding something up here, but this one is not.
    if (declaration === undefined) return;

    JuiceHeldOverlayManager.#detach(declaration);
    declarations.delete(sourceKey);
  }

  /**
   * Puts every icon this sprite's character is holding up back on screen.
   *
   * Runs on every character on the map on every frame, so the first thing it does is establish that
   * the overwhelming majority of them are holding nothing.
   * @param {Sprite_Character} sprite The sprite about to draw.
   */
  static materializeFor(sprite)
  {
    const character = sprite.character();
    const declarations = JuiceHeldOverlayManager.#byCharacter.get(character);

    // ordinary characters walking around a map hold nothing and cost one lookup to say so.
    if (declarations === undefined) return;

    declarations.forEach(declaration => JuiceHeldOverlayManager.#materialize(declaration, sprite));
  }

  /**
   * Builds the sprite work for one held overlay, if it is not already right.
   * @param {JuiceHeldOverlay} declaration The overlay being held up.
   * @param {Sprite_Character} sprite The sprite to draw it on.
   */
  static #materialize(declaration, sprite)
  {
    // already drawn, on this sprite, facing the way the character is. nothing to do.
    if (declaration.isCurrentFor(sprite) === true) return;

    // something was drawing this before, so the icon is already up as far as the player is
    // concerned and this is only the sprite underneath it being replaced.
    const isRebuild = declaration.effect() !== null;

    // anything left over from a previous sprite or a previous facing comes down before the
    // replacement goes up, or the character ends up holding two of everything.
    JuiceHeldOverlayManager.#detach(declaration);

    const facing = declaration.character()
      .direction();

    const effect = JuiceWeaponSwingOverlay.playPreset(
      sprite,
      declaration.iconIndex(),
      declaration.motionType(),
      declaration.durationFrames(),
      declaration.repeatCount(),
      declaration.arcSpanDegrees(),
      facing
    );

    effect.flagHeld();

    // a rebuild starts where the old one left off - parked. Playing the motion again would mean a
    // raised icon visibly dropping and climbing every time the map scene is rebuilt around it, and
    // closing the menu is enough to rebuild it. Only the first raise is meant to be seen.
    if (isRebuild === true)
    {
      effect.setFrame(effect.durationFrames());
    }

    declaration.setEffect(effect);
    declaration.setFacing(facing);
  }

  /**
   * Stops whatever is currently drawing a held overlay, leaving the request itself intact.
   * @param {JuiceHeldOverlay} declaration The overlay to stop drawing.
   */
  static #detach(declaration)
  {
    const effect = declaration.effect();

    // nothing is drawing this one, which is the normal state between two map scenes.
    if (effect === null) return;

    JuiceMotionManager.discardEffect(effect);
    declaration.setEffect(null);
  }

  /**
   * Gets the declaration table for a character, creating it the first time one is needed.
   * @param {Game_Character} character The character to look up.
   * @returns {Map<string, JuiceHeldOverlay>}
   */
  static #declarationsFor(character)
  {
    const existing = JuiceHeldOverlayManager.#byCharacter.get(character);

    // this character has held something up before, so it already has somewhere to keep it.
    if (existing !== undefined) return existing;

    const declarations = new Map();
    JuiceHeldOverlayManager.#byCharacter.set(character, declarations);

    return declarations;
  }
}

export default JuiceHeldOverlayManager;
//endregion JuiceHeldOverlayManager