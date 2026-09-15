//region LightingEasing
import LightingEffects from './LightingEffects.js';

/**
 * The small amount of arithmetic lighting needs to make a light behave like something.
 *
 * This deliberately does not reach for J-Motion's easing, even though that plugin solves a
 * superficially similar problem: importing across ship trees bundles a second copy of it into this
 * plugin, and a light needs almost none of what a motion does. There are no channels to claim here
 * and nothing travels to a destination - a light is simply brighter or dimmer this frame than last.
 *
 * Every curve here answers the same question and returns the same thing: a multiplier between
 * `1 - depth` and `1`. None of them ever exceed `1`, because a light that overshot its declared
 * strength would be brighter than the author asked for at exactly the moments it is most noticeable.
 */
class LightingEasing
{
  /**
   * The share of a flicker's movement carried by its slow wave.
   *
   * Two waves at unrelated rates are summed rather than one used alone, because a single sine reads
   * as a pulse - regular, mechanical, obviously a loop. Beating two together gives a period long
   * enough that the eye stops finding it, which is the whole difference between a torch and a
   * blinking light. It is also precisely what separates `flicker` from `pulse`, which *wants* to be
   * heard as a loop.
   * @type {number}
   */
  static SLOW_WAVE_SHARE = 0.6;

  /**
   * How much faster a flicker's second wave runs than its first.
   *
   * Deliberately not a whole number. An integer ratio makes the two waves line up every cycle and
   * hands the regularity straight back.
   * @type {number}
   */
  static FAST_WAVE_RATIO = 2.3;

  /**
   * How far into a glitch window the stutter is allowed to run.
   *
   * A burst that filled its whole window would read as a square wave rather than a fault. Confining
   * it to the opening third leaves the long quiet tail that makes the next one feel unscheduled.
   * @type {number}
   */
  static GLITCH_BURST_SHARE = 0.35;

  /**
   * How many frames one step of a glitch stutter holds for.
   *
   * Two, because one flips faster than a 60hz screen reads as anything but a grey blur, and three
   * starts to look like deliberate blinking rather than a fault.
   * @type {number}
   */
  static GLITCH_STEP_FRAMES = 2;

  /**
   * A starting point somewhere inside a light's own cycle.
   *
   * Every light rolls its own, which is what stops a wall of torches burning in formation. A room
   * of thirty synchronised flames reads as one thing flickering rather than thirty things burning -
   * and two broken lamps stuttering in unison reads as a scripted effect rather than as decay.
   * @returns {number} A phase offset in radians.
   */
  static randomPhase()
  {
    // anywhere within a full cycle is equally good; what matters is that no two agree.
    return Math.random() * Math.PI * 2;
  }

  /**
   * A tempo of a light's own, a little either side of the one its effect was tuned to.
   *
   * A phase offset alone is not enough to keep two lights apart. Offset by half a cycle they are
   * still running at *identical* rates, so they hold that stagger forever and the pair reads as one
   * deliberate two-beat pattern rather than as two independent things. Detuning the rate itself is
   * what makes them drift: they wander in and out of agreement the way two real flames would, and
   * never settle into a relationship the eye can name.
   *
   * The spread is small on purpose. This is meant to be felt and not seen - a ghost breathing
   * obviously faster than the ghost beside it reads as a bug rather than as life.
   * @param {number} variance How far either side of the tuned rate a light may sit, as a fraction.
   * @returns {number} A multiplier to apply to the effect's period.
   */
  static randomRate(variance)
  {
    // somewhere in [1 - variance, 1 + variance], so the tuned rate stays the average of the room.
    return 1 + ((Math.random() * 2) - 1) * variance;
  }

  /**
   * How brightly a light should be burning this frame, for whichever way it animates.
   * @param {string} effect Which behaviour the light was declared with.
   * @param {number} frameCount The engine's running frame count.
   * @param {number} phase This light's own starting offset within its cycle.
   * @param {{depth: number, period: number, chance: number}} tuning How strong and how fast.
   * @param {number} rate This light's own tempo, as a multiplier on the tuned period.
   * @returns {number} A multiplier between `1 - depth` and `1`.
   */
  static strengthFor(effect, frameCount, phase, tuning, rate)
  {
    // the tuned period is what the effect was authored to; the rate is this one light's take on it.
    const period = tuning.period * rate;

    switch (effect)
    {
      case LightingEffects.FLICKER:
        return LightingEasing.flickerStrength(frameCount, phase, tuning.depth, period);
      case LightingEffects.PULSE:
        return LightingEasing.pulseStrength(frameCount, phase, tuning.depth, period);
      case LightingEffects.GLITCH:
        return LightingEasing.glitchStrength(frameCount, phase, tuning.depth, period, tuning.chance);
      default:
        // a steady light is simply at full strength, always.
        return 1;
    }
  }

  /**
   * The restless brightness of a flame, from two waves beating against one another.
   * @param {number} frameCount The engine's running frame count.
   * @param {number} phase This light's own starting offset within the cycle.
   * @param {number} depth How much brightness the flicker may take away, 0 through 1.
   * @param {number} periodFrames How many frames the slow wave takes to come back around.
   * @returns {number}
   */
  static flickerStrength(frameCount, phase, depth, periodFrames)
  {
    // where in the slow wave this frame sits.
    const slowAngle = ((frameCount / periodFrames) * Math.PI * 2) + phase;

    // the two waves, beating against each other so the pattern never quite repeats.
    const slowWave = Math.sin(slowAngle) * LightingEasing.SLOW_WAVE_SHARE;
    const fastWave = Math.sin(slowAngle * LightingEasing.FAST_WAVE_RATIO) * (1 - LightingEasing.SLOW_WAVE_SHARE);

    return LightingEasing.#asMultiplier(slowWave + fastWave, depth);
  }

  /**
   * The even swell and fade of something charged rather than burning.
   *
   * One clean sine, which is exactly what {@link flickerStrength} goes to trouble to avoid. The
   * regularity is the point: a crystal that breathed unpredictably would read as broken.
   * @param {number} frameCount The engine's running frame count.
   * @param {number} phase This light's own starting offset within the cycle.
   * @param {number} depth How much brightness the pulse may take away, 0 through 1.
   * @param {number} periodFrames How many frames one full breath takes.
   * @returns {number}
   */
  static pulseStrength(frameCount, phase, depth, periodFrames)
  {
    const angle = ((frameCount / periodFrames) * Math.PI * 2) + phase;

    return LightingEasing.#asMultiplier(Math.sin(angle), depth);
  }

  /**
   * The behaviour of something failing: long stretches of nothing, then a stutter.
   *
   * Unlike the other two this is not a wave at all, and it deliberately spends most of its time at
   * full strength. What sells a dying tube is the *waiting* - a light that stuttered continuously
   * would read as a flicker with a harsher curve rather than as a fault.
   *
   * The schedule is a hash of the current window rather than remembered state, which keeps this
   * pure and means two failing lamps in one room never stutter together.
   * @param {number} frameCount The engine's running frame count.
   * @param {number} phase This light's own offset, which shifts its windows away from its neighbours.
   * @param {number} depth How far the light drops during a stutter, 0 through 1.
   * @param {number} periodFrames How many frames one window lasts.
   * @param {number} chance How likely any given window is to fault, 0 through 1.
   * @returns {number}
   */
  static glitchStrength(frameCount, phase, depth, periodFrames, chance)
  {
    // the light's own clock, shifted by its phase. everything below reads this rather than the raw
    // frame count, so that the phase moves *when* a light bursts as well as *which* windows it
    // bursts in. reading the raw count for the position would leave every glitch of the same period
    // stuttering on the same absolute frames, which is the lockstep this is here to avoid.
    const ownClock = (frameCount / periodFrames) + phase;
    const window = Math.floor(ownClock);

    // most windows are uneventful, which is what makes the eventful ones land.
    if (LightingEasing.#noiseAt(window) > chance) return 1;

    // how far into its own window this light is, as a fraction of one.
    const throughWindow = ownClock - window;

    // the burst occupies only the opening of its window; the rest is the quiet that sells it.
    if (throughWindow > LightingEasing.GLITCH_BURST_SHARE) return 1;

    const framesIntoWindow = throughWindow * periodFrames;
    const step = Math.floor(framesIntoWindow / LightingEasing.GLITCH_STEP_FRAMES);

    return step % 2 === 0
      ? 1 - depth
      : 1;
  }

  /**
   * Walks a value a single frame's worth of the way toward where it is going.
   *
   * The step is recomputed from what remains rather than from where the journey started, which is
   * the same arithmetic the engine's own tone fade uses. It means a destination that changes
   * mid-journey is simply travelled toward from wherever the value happens to be, with no need to
   * restart or to remember an origin.
   * @param {number} current Where the value is now.
   * @param {number} destination Where it is headed.
   * @param {number} framesRemaining How many frames are left to get there.
   * @returns {number} The value one frame later.
   */
  static stepToward(current, destination, framesRemaining)
  {
    // the last frame of a journey arrives exactly, rather than asymptotically close.
    if (framesRemaining <= 1) return destination;

    // close the gap by one frame's share of whatever distance is left.
    return ((current * (framesRemaining - 1)) + destination) / framesRemaining;
  }

  /**
   * Folds a wave in the range -1..1 into a brightness multiplier that never exceeds full strength.
   * @param {number} wave Where the curve sits this frame, -1 through 1.
   * @param {number} depth How much brightness may be taken away, 0 through 1.
   * @returns {number}
   */
  static #asMultiplier(wave, depth)
  {
    const dip = 0.5 - (wave * 0.5);

    return 1 - (depth * dip);
  }

  /**
   * A stable pseudo-random value for a given window.
   *
   * Deterministic so a window keeps its verdict for as long as it lasts - re-rolling every frame
   * would turn the occasional fault into permanent noise.
   * @param {number} window Which window is being judged.
   * @returns {number} A value between 0 and 1.
   */
  static #noiseAt(window)
  {
    const scrambled = Math.sin(window * 12.9898) * 43758.5453;

    return scrambled - Math.floor(scrambled);
  }
}

export default LightingEasing;
//endregion LightingEasing