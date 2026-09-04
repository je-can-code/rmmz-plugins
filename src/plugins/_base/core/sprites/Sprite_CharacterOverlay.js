//region Sprite_CharacterOverlay
import TextRasterMetrics from './../core/TextRasterMetrics.js';

/**
 * The layer a character's interface furniture sits on, insulated from what the character is doing.
 *
 * A nameplate, an HP gauge, a floating label - these are captions *about* a character rather than
 * parts of it, and the moment they are added as children of the character's own sprite they inherit
 * everything that sprite does. That is invisible while a character stands still, and wrong the
 * instant one does not: a hit reaction squashes the nameplate along with the body, a spin attack
 * whirls the HP bar around with it, and a character scaled to twice its size gets its name magnified
 * from a raster drawn for half that, which is a blurrier name rather than a bigger one.
 *
 * So this layer cancels the parent's scale and rotation outright, and everything parented to it
 * lives in a space where the character is always its resting size and upright.
 *
 * The tempting refinement is to let *positions* keep inheriting the scale, so a caption drifts
 * outward to clear a body that has grown. Do not: captions are not independent of each other. A
 * nameplate at y 0 and its tier stripe at y 16 are one object drawn in two pieces, and scaling those
 * two offsets separately pulls them apart - at 1.5x the stripe lands eight pixels below where it
 * belongs, which reads as a misaligned badge rather than as anything to do with scale. Relative
 * layout has to survive, and the only way it survives is if nothing about the caption space stretches.
 *
 * **A caption that genuinely needs to clear a resized body measures that body itself.** J-Escriptions
 * does exactly this: it hangs off the character's height and multiplies that height by the
 * character's own scale. That keeps the knowledge where the requirement is, instead of applying a
 * blanket stretch to captions that never asked for one.
 *
 * The cancellation is exact for a uniform scale, and shears very slightly when a non-uniform squash
 * and a rotation animate at the same instant, because those two operations do not commute. That case
 * is a spinning character mid-squish, it lasts a few frames, and the alternative is rebuilding the
 * matrix by hand for a distortion nobody can see.
 *
 * Extending {@link Sprite} rather than a bare container is what keeps the furniture alive: RMMZ's
 * `Sprite.update` walks its children calling theirs, and a gauge that stops being updated stops
 * telling the truth about anyone's health.
 */
class Sprite_CharacterOverlay
  extends Sprite
{
  /**
   * Overrides {@link Sprite.updateTransform}.<br/>
   * Cancels the parent's scale and rotation, then lands the whole layer on a whole device pixel.
   *
   * This runs during the render walk rather than in an update hook, which matters: by the time PIXI
   * asks a node for its transform, everything above it has already settled for the frame. An update
   * hook would be reading whatever the parent's scale was *last* frame, and a caption that lags a
   * squash by a frame is its own kind of wrong.
   *
   * The base class's own composition is spelled out here rather than delegated to, and the reason is
   * ordering. `Container.updateTransform` composes this node against its parent and then immediately
   * walks its children, so a correction applied *after* calling it would arrive a full frame too
   * late for everything hanging off this layer - the children would already have inherited the
   * uncorrected matrix. The snap has to sit between those two steps, which means owning both. The
   * engine reaches for the same pattern in `Tilemap` and `Window` for the same reason.
   */
  updateTransform()
  {
    const parentScale = this.parent.scale;

    // an inverse scale, so a character drawn at double size carries captions at their own size and
    // in their own relative positions.
    this.scale.set(1 / parentScale.x, 1 / parentScale.y);

    // and an inverse rotation, so a spinning character carries captions that stay upright and stay
    // put, rather than swinging around it like signs on ropes.
    this.rotation = -this.parent.rotation;

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