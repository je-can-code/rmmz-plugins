//region HudInterferenceResolver
/**
 * Resolves how much a HUD frame should dim while the player is standing on top of it.
 *
 * The geometry belongs to the family rather than to any one frame: a single axis-aligned overlap
 * between a frame's box and the player's, shared by every frame and correct wherever a frame sits.
 * A frame that measures interference with its own inequality against {@link Game_Player#screenX}
 * and {@link Game_Player#screenY} encodes its current corner into that test, and is silently wrong
 * from the moment somebody moves it- which is exactly the sort of change a layout invites.
 */
class HudInterferenceResolver
{
  /**
   * Pixels of slack added around a frame before the player counts as interfering.
   *
   * The player's box is approximated from tile size, but character sprites are routinely taller
   * and wider than one tile, so an exact overlap would begin dimming only once the sprite was
   * already well into the frame. The margin buys back that difference and starts the fade a beat
   * before the collision reads as one.
   * @type {number}
   */
  static Margin = 24;

  /**
   * The alpha a frame settles at while the player is interfering with it.
   *
   * Low enough to read the map through, high enough that the frame is still legible- the player
   * is not being asked to give up the information, only to stop having it painted over them.
   * @type {number}
   */
  static DimmedAlpha = 0.25;

  /**
   * The alpha a frame settles at when nothing is in the way of it.
   * @type {number}
   */
  static FullAlpha = 1.0;

  /**
   * How much alpha a frame travels per update toward whichever of the two settled values applies.
   *
   * Roughly a quarter-second from clear to dimmed at 60fps, which is slow enough to read as a
   * deliberate fade rather than a flicker when the player skirts the edge of a frame.
   * @type {number}
   */
  static AlphaStep = 0.06;

  /**
   * The player's approximate screen-space box.
   *
   * {@link Game_CharacterBase#screenX} reports the horizontal center of the character and
   * {@link Game_CharacterBase#screenY} reports its feet, so the box is built outward from the
   * center and upward from the bottom rather than down-right from an origin.
   * @returns {{left: number, top: number, right: number, bottom: number}}
   */
  static playerBounds()
  {
    // the engine's own screen coordinates are derived from tile size, so measure the body in kind.
    const tileWidth = $gameMap.tileWidth();
    const tileHeight = $gameMap.tileHeight();

    // center-x and feet-y, straight from the engine.
    const centerX = $gamePlayer.screenX();
    const feetY = $gamePlayer.screenY();

    // the body straddles the center horizontally.
    const halfWidth = tileWidth / 2;

    // build the box outward from the center and upward from the feet.
    return {
      left: centerX - halfWidth,
      top: feetY - tileHeight,
      right: centerX + halfWidth,
      bottom: feetY,
    };
  }

  /**
   * A frame's screen-space box, inflated by {@link HudInterferenceResolver.Margin}.
   * @param {Window_Base} frame The HUD frame being measured.
   * @returns {{left: number, top: number, right: number, bottom: number}}
   */
  static frameBounds(frame)
  {
    // one knob for every frame; a frame does not get to be more forgiving than its neighbors.
    const margin = HudInterferenceResolver.Margin;

    // windows are placed from their top-left, so the box grows down-right from the origin.
    return {
      left: frame.x - margin,
      top: frame.y - margin,
      right: frame.x + frame.width + margin,
      bottom: frame.y + frame.height + margin,
    };
  }

  /**
   * Whether two axis-aligned boxes share any area.
   *
   * Edges that merely touch do not count as overlapping- a frame whose border grazes the player's
   * bounding box is not actually obscuring anything, and treating that as interference makes a
   * frame flicker as the player walks alongside it.
   * @param {{left: number, top: number, right: number, bottom: number}} first The first box.
   * @param {{left: number, top: number, right: number, bottom: number}} second The second box.
   * @returns {boolean}
   */
  static overlaps(first, second)
  {
    // the first box sits entirely left of the second.
    if (first.right <= second.left) return false;

    // the first box sits entirely right of the second.
    if (first.left >= second.right) return false;

    // the first box sits entirely above the second.
    if (first.bottom <= second.top) return false;

    // the first box sits entirely below the second.
    if (first.top >= second.bottom) return false;

    // neither separating axis held, so the two boxes share area.
    return true;
  }

  /**
   * Whether the player is currently standing within the given frame bounds.
   * @param {{left: number, top: number, right: number, bottom: number}} bounds The inflated frame box.
   * @returns {boolean}
   */
  static isPlayerInterfering(bounds)
  {
    // measure where the player is right now.
    const player = HudInterferenceResolver.playerBounds();

    // interference is simply the two boxes sharing area.
    return HudInterferenceResolver.overlaps(bounds, player);
  }

  /**
   * The next alpha along the path from where a frame is to where it should settle.
   *
   * Snapping once the remaining distance is within a single step is what keeps a frame from
   * oscillating around its destination forever.
   * @param {number} currentAlpha The frame's alpha as of this update.
   * @param {number} targetAlpha The alpha the frame is traveling toward.
   * @returns {number}
   */
  static steppedAlpha(currentAlpha, targetAlpha)
  {
    // how far is left to travel, and in which direction.
    const distance = targetAlpha - currentAlpha;

    // close enough that another full step would overshoot, so land exactly on target.
    if (Math.abs(distance) <= HudInterferenceResolver.AlphaStep) return targetAlpha;

    // travel one step along the sign of the remaining distance.
    const direction = distance > 0
      ? 1
      : -1;

    // advance by exactly one step.
    return currentAlpha + (HudInterferenceResolver.AlphaStep * direction);
  }

  /**
   * The alpha a HUD frame should be rendered at on this update.
   *
   * This is deliberately a multiplier applied to the whole window rather than a write to the
   * opacity of its contents or sprites. Several frames animate their own opacity already- the
   * target frame fades on an inactivity timer, the boss frame on a reveal- and an absolute write
   * would spend every update fighting them. A multiplier layers cleanly on top of whatever a
   * frame is already doing to itself, and it leaves a deliberately hidden sprite hidden.
   * @param {Window_Base} frame The HUD frame being resolved.
   * @returns {number}
   */
  static nextFrameAlpha(frame)
  {
    // measure the frame, with its slack.
    const bounds = HudInterferenceResolver.frameBounds(frame);

    // decide whether the player is in the way of it.
    const interfering = HudInterferenceResolver.isPlayerInterfering(bounds);

    // pick the value this frame should be settling toward.
    const targetAlpha = interfering
      ? HudInterferenceResolver.DimmedAlpha
      : HudInterferenceResolver.FullAlpha;

    // and take a single step toward it.
    return HudInterferenceResolver.steppedAlpha(frame.alpha, targetAlpha);
  }
}

export default HudInterferenceResolver;
//endregion HudInterferenceResolver