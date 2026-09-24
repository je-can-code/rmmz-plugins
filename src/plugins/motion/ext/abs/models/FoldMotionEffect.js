//region FoldMotionEffect
/**
 * How a battler arrives on the map and leaves it when nobody killed it.
 *
 * A battler whose page appears or disappears used to do so on a single frame, which reads as a
 * rendering fault rather than as something happening. This gives both moments a shape: the sprite
 * turns on its vertical axis like a paper cutout, edge-on when it is not there and facing the player
 * when it is. Folding turns it away; unfolding turns it back.
 *
 * The shape was chosen against J-Motion-ABS's own collapses rather than on its own merits. Every
 * death squashes, topples, or sinks, and all of those move a body vertically or tip it over. A fold
 * is the one thing none of them do — the height never changes — so a battler leaving at the end of
 * its hours can never be mistaken for one that was just killed with no loot to show for it.
 *
 * The two directions are one effect because each is exactly the other played backwards, and keeping
 * them together is what guarantees they stay that way when either one is retuned.
 *
 * `MotionEffect`, `MotionChannels` and `MotionEasing` are reached as globals rather than imports:
 * they ship inside J-Motion's bundle and are hoisted by the time this one loads.
 */
class FoldMotionEffect
  extends MotionEffect
{
  /**
   * The motion type that turns a sprite away until it is edge-on and gone.
   * @type {string}
   */
  static FOLD = 'fold';

  /**
   * The motion type that turns a sprite from edge-on to facing the player.
   * @type {string}
   */
  static UNFOLD = 'unfold';

  /**
   * The channels a fold takes exclusive ownership of while it runs.
   *
   * Width and opacity are the whole of the fold, so nothing ambient may fight it for them: a
   * ghosting enemy would otherwise pulse back into view halfway through leaving. Everything else is
   * left to compose, so a floating enemy still bobs as it turns and a large one is still large.
   * @returns {string[]}
   */
  claims()
  {
    return [
      MotionChannels.SCALE_X,
      MotionChannels.OPACITY,
    ];
  }

  /**
   * How far through the fold this frame is, from 0 to 1.
   * @returns {number}
   */
  progress()
  {
    const { duration } = this.parameters();

    return MotionEasing.normalize(this.elapsedFrames() / duration);
  }

  /**
   * How far the sprite is turned away from the player this frame, from 0 (facing) to 1 (edge-on).
   *
   * Folding turns away as it progresses; unfolding starts turned away and comes back. Answering the
   * question in these terms is what lets one drawing serve both directions.
   * @returns {number}
   */
  turnedAway()
  {
    const progress = this.progress();
    const motionType = this.declaration()
      .type();

    // unfolding is the fold run backwards.
    if (motionType === FoldMotionEffect.UNFOLD) return 1 - progress;

    return progress;
  }

  /**
   * Writes this frame of the fold into the composition.
   *
   * The width is the cosine of the turn, which is exactly how wide a flat card looks at that angle —
   * so a turn at a steady pace starts slowly and hurries as it goes edge-on, and unfolding does the
   * reverse. The opacity falls away with the square of the turn, so the sprite stays solid while it
   * is still recognisably turning and is gone by the time it is edge-on.
   * @param {MotionComposition} composition The composition being built for this character.
   */
  applyTo(composition)
  {
    const turnedAway = this.turnedAway();
    const quarterTurn = Math.PI / 2;
    const width = Math.cos(turnedAway * quarterTurn);
    const opacity = 1 - (turnedAway * turnedAway);

    composition.contribute(this, MotionChannels.SCALE_X, width);
    composition.contribute(this, MotionChannels.OPACITY, opacity);
  }
}

export default FoldMotionEffect;
//endregion FoldMotionEffect