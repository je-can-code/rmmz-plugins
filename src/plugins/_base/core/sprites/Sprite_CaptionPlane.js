//region Sprite_CaptionPlane
import CaptionPlaneRoster from './../core/CaptionPlaneRoster.js';

/**
 * The plane every character's captions are drawn on, above the world but still inside the dark.
 *
 * A caption - a nameplate, an HP gauge, a shield bar, a danger rating - is information *about* the
 * world rather than a thing in it, and the engine had no place to put that. Everything the map
 * draws goes inside `_baseSprite`, `_baseColorFilter` is attached to `_baseSprite`, and a PIXI
 * filter repaints its own subtree and nothing else. So a nameplate parented to its character
 * inherited the screen tone: at midnight an enemy's name went blue and its health bar desaturated
 * along with the rock it was standing next to. Nothing about the hour should change how legible a
 * number is.
 *
 * **The tone is not the only thing that darkens a map, and this plane deliberately escapes only
 * the one.** J-Lighting's ambient mask is not a colour grade - it multiplies the scene against a
 * sheet of darkness with holes punched in it for every light, which makes it a statement about what
 * can be *seen* rather than about what colour things are. So the plane is slotted underneath that
 * mask while sitting above the tone, and the split is the whole design: a caption ignores the hour
 * and obeys the dark. An enemy standing in torchlight is named. The one in the unlit corner is not,
 * and finding it is the player's problem, which is the point of an unlit corner.
 *
 * Damage popups deliberately do **not** live here, and J-Popups parents them to a plane of its own
 * above the mask. Being hit is felt rather than seen: you can tell how hard you connected with
 * something in the dark without being able to make out what you connected with.
 */
class Sprite_CaptionPlane
  extends Sprite
{
  /**
   * Brings the plane's contents into line with the character sprites currently on the map.
   *
   * The live character sprites are the authority because every route that puts a character on a map
   * or takes one off goes through that array, and the plane's own children are the roster because
   * a caption is here if and only if the plane put it here. Two lists, one of them maintained by
   * somebody else, and the difference between them is the work.
   *
   * **This is deliberately not driven from this sprite's own update.** RMMZ walks a spriteset's
   * children before anything else happens in a frame, so by the time this plane updated itself the
   * captions hanging off it would already have run - including one whose character sprite was
   * destroyed since the last frame, which throws the moment it reads a position off it. The
   * spriteset calls this before that walk begins instead, which is the only point in a frame where
   * the roster can be corrected while every caption on it is still safe to touch.
   * @param {Sprite_Character[]} characterSprites Every character sprite currently on the map.
   */
  reconcileCaptions(characterSprites)
  {
    const { additions, evictions } = CaptionPlaneRoster.reconcile(characterSprites, this.children);

    // departures first, so an arrival never has to be compared against something already gone.
    evictions.forEach(this.evictCaption, this);
    additions.forEach(this.admitCaption, this);
  }

  /**
   * Takes responsibility for a caption and draws it from now on.
   * @param {Sprite_CharacterOverlay} caption The caption arriving on the map.
   */
  admitCaption(caption)
  {
    this.addChild(caption);
  }

  /**
   * Gives up responsibility for a caption whose character has left the map.
   *
   * Detached and forgotten rather than destroyed, which is exactly what used to happen to it: a
   * caption was a child of its character sprite, and J-ABS destroys those without destroying their
   * children, so the whole caption went unreachable and was collected. Destroying it here would
   * instead be a new behavior, and it would reach into gauges and nameplates that other plugins
   * built and still consider theirs.
   * @param {Sprite_CharacterOverlay} caption The caption leaving the map.
   */
  evictCaption(caption)
  {
    this.removeChild(caption);
  }

  /**
   * Overrides {@link Sprite.updateTransform}.<br/>
   * Sorts the captions into depth order before any of them compose their transforms.
   *
   * The sort sits here rather than in an update hook because it reads positions that captions set
   * for themselves, and an update hook would be ordering them by where they were a frame ago. By
   * the time PIXI asks this plane for its transform every caption has already followed its
   * character for the frame, so the values being sorted are the ones about to be drawn.
   *
   * It runs every frame unconditionally, exactly as `Tilemap` does for the characters themselves,
   * and costs about what that costs: the same number of elements, over an array that is already in
   * order almost every frame because characters move a pixel at a time.
   */
  updateTransform()
  {
    this.children.sort(CaptionPlaneRoster.compareCaptionOrder);

    // perform original logic.
    super.updateTransform();
  }
}

export default Sprite_CaptionPlane;
//endregion Sprite_CaptionPlane