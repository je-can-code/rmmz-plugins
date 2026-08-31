//region CollapseMotionEffect
/**
 * How a battler leaves the world.
 *
 * Without this an enemy simply stops existing on the frame it dies, which is the one moment in a
 * fight the player is most likely to be looking directly at it. A collapse gives that moment a
 * shape, and gives the game somewhere to say how much this particular death mattered.
 *
 * Three styles, and they are speeds as much as they are shapes. A trash mob should be gone before
 * the player has finished swinging at the next one; a boss has earned a few seconds of dying.
 *
 * This is the only motion in the ecosystem that claims its channels outright. Everything else
 * composes, because a breathing enemy that also sways is two true things at once — but a corpse is
 * not still breathing, and an ambient float would otherwise carry it gently upward as it melts.
 *
 * `MotionEffect`, `MotionChannels` and `MotionEasing` are reached as globals rather than imports:
 * they ship inside J-Motion's bundle and are hoisted by the time this one loads.
 */
class CollapseMotionEffect
  extends MotionEffect
{
  /**
   * A quick vertical squash. For anything whose death is punctuation rather than an event.
   * @type {string}
   */
  static SWIFT = 'swift';

  /**
   * A squash that topples over as it goes. For something that was worth fighting.
   * @type {string}
   */
  static MODERATE = 'moderate';

  /**
   * A long sink with a shimmer through it. For something whose death the player should watch.
   * @type {string}
   */
  static SLOW = 'slow';

  /**
   * The channels a collapse takes exclusive ownership of.
   *
   * Everything that could otherwise keep animating a corpse: its size, its angle, how solid it is,
   * and how far off the ground it sits. A dying thing does not also hover.
   * @returns {string[]}
   */
  claims()
  {
    return [
      MotionChannels.SCALE_X,
      MotionChannels.SCALE_Y,
      MotionChannels.OPACITY,
      MotionChannels.ROTATION,
      MotionChannels.OFFSET_Y,
    ];
  }

  /**
   * Determines whether the composer may forget about this effect.
   *
   * Never, of its own accord. A collapse ends when the battler it belongs to is removed from the
   * map, and until that happens the corpse has to keep being drawn in whatever state it reached —
   * a collapse that retired itself at the end of its duration would pop the sprite back to full
   * size and full opacity for the frame or two before the engine got around to deleting it.
   * @returns {boolean}
   */
  isDiscardable()
  {
    return this.hasRemovalRequested();
  }

  /**
   * How far through the collapse this frame is, from 0 to 1.
   * @returns {number}
   */
  progress()
  {
    const { duration } = this.parameters();

    return MotionEasing.normalize(this.elapsedFrames() / duration);
  }

  /**
   * Writes this frame of the collapse into the composition.
   * @param {MotionComposition} composition The composition being built for this character.
   */
  applyTo(composition)
  {
    const { style } = this.parameters();
    const progress = this.progress();

    switch (style)
    {
      case CollapseMotionEffect.MODERATE:
        this.applyTopple(composition, progress);
        break;
      case CollapseMotionEffect.SLOW:
        this.applyDissolve(composition, progress);
        break;
      default:
        this.applySquash(composition, progress);
        break;
    }
  }

  /**
   * The swift death: the body drops straight down into the ground and is gone.
   *
   * Width grows a little as height collapses, which is what sells it as something being crushed
   * rather than something being scaled down.
   * @param {MotionComposition} composition The composition being built.
   * @param {number} progress How far through the collapse, 0 to 1.
   */
  applySquash(composition, progress)
  {
    const eased = MotionEasing.easeInQuad(progress);

    composition.contribute(this, MotionChannels.SCALE_Y, 1 - eased);
    composition.contribute(this, MotionChannels.SCALE_X, 1 + (eased * 0.35));
    composition.contribute(this, MotionChannels.OPACITY, 1 - progress);
    composition.contribute(this, MotionChannels.ROTATION, 0);
    composition.contribute(this, MotionChannels.OFFSET_Y, 0);
  }

  /**
   * The moderate death: the body tips over and settles, fading as it falls.
   *
   * The fall accelerates while the fade does not, so the body has visibly hit the ground before it
   * finishes disappearing — it reads as a thing that fell over and then stopped being there,
   * rather than a thing that faded out mid-topple.
   * @param {MotionComposition} composition The composition being built.
   * @param {number} progress How far through the collapse, 0 to 1.
   */
  applyTopple(composition, progress)
  {
    const falling = MotionEasing.easeInQuad(progress);
    const quarterTurn = Math.PI / 2;

    // most of the fade rides the fall so the body is largely gone by the time it lands, with a
    // linear remainder that finishes it off after it has settled.
    const fadeWhileFalling = falling * 0.9;
    const fadeAfterLanding = progress * 0.1;
    const opacity = 1 - fadeWhileFalling - fadeAfterLanding;

    composition.contribute(this, MotionChannels.ROTATION, quarterTurn * falling);
    composition.contribute(this, MotionChannels.SCALE_Y, 1 - (falling * 0.25));
    composition.contribute(this, MotionChannels.SCALE_X, 1);
    composition.contribute(this, MotionChannels.OPACITY, opacity);
    composition.contribute(this, MotionChannels.OFFSET_Y, 0);
  }

  /**
   * The slow death: the body sinks, shrinking and shimmering, and takes its time about it.
   *
   * The shimmer is a sine rather than a random roll, which is both cheaper and steadier — a random
   * flicker at this duration reads as a rendering fault, while a regular pulse reads as something
   * losing its grip on being solid.
   * @param {MotionComposition} composition The composition being built.
   * @param {number} progress How far through the collapse, 0 to 1.
   */
  applyDissolve(composition, progress)
  {
    const shimmerCycles = 6;
    const shimmer = 0.85 + (0.15 * Math.sin(shimmerCycles * 2 * Math.PI * progress));
    const shrinking = MotionEasing.easeInQuad(progress);

    composition.contribute(this, MotionChannels.SCALE_X, 1 - (shrinking * 0.4));
    composition.contribute(this, MotionChannels.SCALE_Y, 1 - (shrinking * 0.4));
    composition.contribute(this, MotionChannels.OPACITY, (1 - progress) * shimmer);
    composition.contribute(this, MotionChannels.ROTATION, 0);
    composition.contribute(this, MotionChannels.OFFSET_Y, this.sinkDistance() * shrinking);
  }

  /**
   * How far into the ground a dissolving body settles, in pixels.
   *
   * Positive is downward in screen space. Kept small: a body that sinks far enough to notice looks
   * like it fell through the floor rather than like it came apart.
   * @returns {number}
   */
  sinkDistance()
  {
    return 8;
  }
}

export default CollapseMotionEffect;
//endregion CollapseMotionEffect