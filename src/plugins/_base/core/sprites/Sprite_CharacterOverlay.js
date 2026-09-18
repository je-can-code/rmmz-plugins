//region Sprite_CharacterOverlay
import TextRasterMetrics from './../core/TextRasterMetrics.js';

/**
 * The layer a character's interface furniture sits on, insulated from what the character is doing.
 *
 * A nameplate, an HP gauge, a floating label - these are captions *about* a character rather than
 * parts of it, and for a long time they were added as children of the character's own sprite, which
 * meant they inherited everything that sprite did. That was invisible while a character stood still
 * and wrong the instant one did not: a hit reaction squashed the nameplate along with the body, a
 * spin attack whirled the HP bar around with it, and a character scaled to twice its size got its
 * name magnified from a raster drawn for half that, which is a blurrier name rather than a bigger
 * one.
 *
 * It also meant a caption was painted by whatever painted the world. The screen tone is a filter on
 * `_baseSprite` and a PIXI filter owns its whole subtree, so at midnight an enemy's nameplate went
 * blue along with the rock behind it.
 *
 * So this layer no longer hangs off the character at all. It lives on {@link Sprite_CaptionPlane},
 * above the world and outside the tone, and follows its character by copying what matters -
 * position, opacity, visibility - rather than by inheriting a transform. Nothing about the
 * character's own scale or rotation is in that list, which is what makes the squash and the spin
 * simply not arrive, instead of arriving and being cancelled out afterward.
 *
 * The tempting refinement is to let *positions* scale with a character that has grown, so a caption
 * drifts outward to clear a bigger body. Do not: captions are not independent of each other. A
 * nameplate at y 0 and its tier stripe at y 16 are one object drawn in two pieces, and scaling
 * those two offsets separately pulls them apart - at 1.5x the stripe lands eight pixels below where
 * it belongs, which reads as a misaligned badge rather than as anything to do with scale. Relative
 * layout has to survive, and the only way it survives is if nothing about the caption space
 * stretches.
 *
 * **A caption that genuinely needs to clear a resized body measures that body itself.**
 * J-Escriptions does exactly this: it hangs off the character's height and multiplies that height
 * by the character's own scale. That keeps the knowledge where the requirement is, instead of
 * applying a blanket stretch to captions that never asked for one.
 *
 * Extending {@link Sprite} rather than a bare container is what keeps the furniture alive: RMMZ's
 * `Sprite.update` walks its children calling theirs, and a gauge that stops being updated stops
 * telling the truth about anyone's health. That walk now reaches here by way of the caption plane
 * rather than the character sprite, and it is the reason the plane is a `Sprite` too.
 */
class Sprite_CharacterOverlay
  extends Sprite
{
  /**
   * Extends {@link Sprite.initialize}.<br/>
   * Also prepares the link back to the character this layer captions.
   */
  initialize()
  {
    // perform original logic.
    super.initialize();

    // initialize our properties.
    this.initMembers();
  }

  /**
   * Initialize all properties of this class.
   */
  initMembers()
  {
    /**
     * The shared root namespace for all of J's plugin data.
     */
    this._j ||= {};

    /**
     * The character sprite this layer draws captions for.
     *
     * Held as a reference because this layer is no longer parented to it, and everything this
     * layer does each frame is a question about where that sprite currently is.
     * @type {Sprite_Character}
     */
    this._j._characterSprite = null;
  }

  /**
   * Gets the character sprite this layer draws captions for.
   * @returns {Sprite_Character} The characterSprite.
   */
  characterSprite()
  {
    // hand back the sprite this layer captions.
    return this._j._characterSprite;
  }

  /**
   * Sets the character sprite this layer draws captions for.
   * @param {Sprite_Character} newCharacterSprite The new characterSprite.
   */
  setCharacterSprite(newCharacterSprite)
  {
    // assign the sprite this layer captions.
    this._j._characterSprite = newCharacterSprite;
  }

  /**
   * Extends {@link Sprite.update}.<br/>
   * Also follows the character this layer captions.
   */
  update()
  {
    // perform original logic.
    super.update();

    // then catch up to wherever the character got to this frame.
    this.updateFromCharacterSprite();
  }

  /**
   * Copies across everything this layer used to inherit by being a child of its character.
   *
   * Four properties, and each one is a thing that would otherwise have quietly stopped working.
   * Position is the obvious one. Opacity and visibility are the ones that are easy to forget and
   * loud when missed: a transparent event or a character fading out used to take its nameplate with
   * it, and a caption that ignores them is a name floating over nothing.
   *
   * Depth is copied rather than used directly, because the plane sorts captions among themselves
   * and has to sort them by the same rule the tilemap sorts their characters by.
   *
   * Conspicuously absent: scale and rotation. Those are what this layer exists to *not* inherit.
   */
  updateFromCharacterSprite()
  {
    const characterSprite = this.characterSprite();

    // the character's position is already in screen space, so this is a copy rather than a sum.
    this.x = characterSprite.x;
    this.y = characterSprite.y;

    // priority tier, which decides depth against other captions before their y does.
    this.z = characterSprite.z;

    // and the two ways a character stops being drawn, both of which its captions must honour.
    this.visible = characterSprite.visible;
    this.opacity = characterSprite.opacity;
  }

  /**
   * Overrides {@link Sprite.updateTransform}.<br/>
   * Lands the whole layer on a whole device pixel before anything hanging off it composes.
   *
   * The base class's own composition is spelled out here rather than delegated to, and the reason
   * is ordering. `Container.updateTransform` composes this node against its parent and then
   * immediately walks its children, so a correction applied *after* calling it would arrive a full
   * frame too late for everything hanging off this layer - the children would already have
   * inherited the uncorrected matrix. The snap has to sit between those two steps, which means
   * owning both. The engine reaches for the same pattern in `Tilemap` and `Window` for the same
   * reason.
   */
  updateTransform()
  {
    // compose against the parent, exactly as the base class would.
    this.setBoundsID();
    this.transform.updateTransform(this.parent.transform);

    // then correct the result before anything inherits it.
    this.snapToDevicePixels();

    this.worldAlpha = this.alpha * this.parent.worldAlpha;

    // and only now let the captions compose against a matrix that lands on real pixels.
    this.children.forEach(child =>
    {
      if (child.visible)
      {
        child.updateTransform();
      }
    });
  }

  /**
   * Marks this layer's cached bounds as stale.
   *
   * `_boundsID` is PIXI's own bookkeeping rather than ours, and normally nothing here would touch
   * it - the base class bumps it at the top of every transform composition so that anything asking
   * for this node's bounds later recomputes them instead of trusting a cached rectangle. Composing
   * the transform by hand means taking on that responsibility too, and dropping it would leave a
   * stale rectangle behind for whatever eventually asks.
   */
  setBoundsID()
  {
    this._boundsID++;
  }

  /**
   * Moves this layer's origin onto the nearest whole pixel of the player's display.
   *
   * A character's screen position is a whole *logical* pixel, which on a scaled display is not a
   * whole real one: at 1.5x, every odd coordinate lands exactly halfway between two of them, and a
   * glyph sampled across two columns is a grey ramp instead of an edge. Roughly half the characters
   * on screen are on an odd coordinate at any moment, so this is not an edge case - it is the
   * difference between captions that are reliably sharp and captions that are sharp about half the
   * time, which reads as some enemies' names being mysteriously softer than their neighbours'.
   *
   * Only this layer's origin moves, by at most half a real pixel. Everything hanging off it keeps
   * its exact relative layout, because they all compose against this one corrected matrix.
   */
  snapToDevicePixels()
  {
    const scale = Graphics.deviceScale;
    const { worldTransform } = this.transform;

    worldTransform.tx = TextRasterMetrics.snap(worldTransform.tx, scale);
    worldTransform.ty = TextRasterMetrics.snap(worldTransform.ty, scale);
  }
}

export default Sprite_CharacterOverlay;
//endregion Sprite_CharacterOverlay