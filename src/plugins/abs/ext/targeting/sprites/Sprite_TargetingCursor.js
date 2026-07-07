//region Sprite_TargetingCursor
import JABS_TargetingManager from './../managers/JABS_TargetingManager.js';

/**
 * The reticle sprite tracking the current aim point/selected battler while a targeting session
 * is active. Defaults to the stock RMMZ window-scroll arrow (light-blue gradient triangle,
 * points down) via the `reticleImage` plugin parameter.<br/>
 * Purely decorative: in cycle mode it hovers above the targeted battler (there's a body to
 * hover over); in free-roam mode there's no battler at the origin, just an aim point, so it
 * points exactly at that point instead — the AoE preview shape is the primary "where am I
 * aiming" signal there. Either way it does NOT track the corrected origin the AoE preview/
 * containment test use (see {@link JABS_TargetingSentinelAction#screenY}) — that correction
 * exists to make the *hitbox math* symmetric, not to say where a hover indicator should sit.
 */
class Sprite_TargetingCursor
  extends Sprite
{
  /**
   * How many pixels above the target's ground position the reticle hovers, before bobbing.
   * @type {number}
   */
  static HoverHeightPx = 48;

  /**
   * The amplitude, in pixels, of the idle bobbing animation.
   * @type {number}
   */
  static BobAmplitudePx = 3;

  /**
   * How fast the idle bobbing animation cycles, in radians per frame.
   * @type {number}
   */
  static BobSpeed = 0.05;

  /**
   * Constructor.
   */
  constructor()
  {
    // perform original logic.
    super();

    // initialize the bitmap/anchor for this reticle.
    this.initMembers();
  }

  /**
   * Initializes this sprite's bitmap and anchor.
   */
  initMembers()
  {
    // load the configured reticle image (defaults to the stock RMMZ window-scroll arrow).
    const filename = J.ABS.EXT.TARGETING.Metadata.reticleImage;
    this.bitmap = ImageManager.loadSystem(filename);

    // anchor at the bottom-center so the tip of the (downward-pointing) arrow lands where this
    // sprite's x/y are positioned, with the body of the arrow extending upward from there.
    this.anchor.x = 0.5;
    this.anchor.y = 1;
  }

  /**
   * Extends {@link Sprite#update}.<br/>
   * Hovers above the ground position currently being aimed at, with a gentle bob.
   */
  update()
  {
    // perform original logic.
    super.update();

    // if nobody is aiming, then there is nothing to hover above.
    if (!JABS_TargetingManager.isActive())
    {
      this.visible = false;
      return;
    }

    // cycle mode hovers above the targeted battler (there's a body to hover over); free-roam
    // has no battler at the origin, just an aim point, so the tip points exactly at it — the
    // AoE preview shape is the primary "where am I aiming" signal there, not this reticle.
    const hoverHeight = JABS_TargetingManager.getCursor()
      .isCycleMode()
      ? Sprite_TargetingCursor.HoverHeightPx
      : 0;

    // hover the resolved gap above the raw ground position, plus a gentle idle bob.
    this.visible = true;
    const sentinel = JABS_TargetingManager.getSentinel();
    const ground = sentinel.groundScreenPosition();
    const bob = Math.sin(Graphics.frameCount * Sprite_TargetingCursor.BobSpeed) * Sprite_TargetingCursor.BobAmplitudePx;
    this.x = ground.x;
    this.y = ground.y - hoverHeight + bob;
  }
}

export default Sprite_TargetingCursor;
//endregion Sprite_TargetingCursor
