//region JABS_StanceStall
/**
 * Tracks how an ally is faring at reaching its spot in the party's stance, so that a spot it cannot reach
 * can be abandoned instead of chased forever.
 *
 * An ally that cannot reach its spot does not fail quietly. The pathfinder rounds a character's position
 * to a whole tile before searching, so an ally standing near a tile boundary gets a different first step
 * depending on which side of that boundary it is on. It takes the step, lands back on the other side, and
 * is handed the opposite answer next frame. Because a move command faces its character whether or not the
 * move succeeds, the result reads as a character vibrating in place rather than as one that is stuck.
 *
 * **Progress is measured, not time.** Giving up after a fixed number of frames would abandon a long but
 * perfectly good walk around a wall, which is the common case and the one that must not break. What is
 * tracked instead is the closest the ally has ever come to the spot during this attempt, and how long it
 * has been since that improved. A detour that is genuinely working keeps beating its own record and never
 * stalls; the two-step shuffle above never beats it once.
 */
class JABS_StanceStall
{
  /**
   * Whether an attempt on a spot is currently underway.
   *
   * Kept as its own flag rather than inferred from the coordinates below, because `0,0` is a real place on
   * a map and an ally assigned a spot there would otherwise inherit the history of an attempt that never
   * happened.
   * @type {boolean}
   */
  #attempting = false;

  /**
   * The x coordinate of the spot this attempt is aimed at.
   * @type {number}
   */
  #targetX = 0;

  /**
   * The y coordinate of the spot this attempt is aimed at.
   * @type {number}
   */
  #targetY = 0;

  /**
   * The closest this ally has come to the spot during the current attempt.
   * @type {number}
   */
  #bestDistance = 0;

  /**
   * How many consecutive frames have passed without improving on {@link #bestDistance}.
   * @type {number}
   */
  #framesWithoutProgress = 0;

  /**
   * Records how this frame's approach went.
   *
   * A spot that has moved since the attempt began starts a fresh attempt, because the leader walking or
   * turning relocates it and the old attempt's history says nothing about the new one. That also means an
   * ally is never stalled while its leader is on the move, which is the behaviour worth protecting -
   * standing still is only ever the answer to a spot that is genuinely unreachable from where the ally is.
   *
   * A spot is also the nearest point of a zone to wherever the ally happens to be, so an ally shuffling on
   * the spot drags its spot around with it by a hair each frame. Those hairs are not a moved spot - they
   * are exactly the shuffle this tracker exists to catch - so a spot only counts as moved once it has
   * drifted further than the given tolerance from where the attempt began.
   * @param {number} distance How far this ally currently is from the spot.
   * @param {number} targetX The x coordinate of the spot.
   * @param {number} targetY The y coordinate of the spot.
   * @param {number} epsilon How much closer counts as having made progress.
   * @param {number} driftTolerance How far the spot may drift before it counts as a different spot.
   */
  observe(distance, targetX, targetY, epsilon, driftTolerance)
  {
    // a spot that has moved, or a first look at one, is a new problem entirely.
    const isNewAttempt = this.#attempting === false
      || this.#hasSpotMoved(targetX, targetY, driftTolerance);

    if (isNewAttempt)
    {
      this.#beginAttempt(distance, targetX, targetY);

      return;
    }

    // closing on the spot by a margin worth counting means the approach is still working.
    if (distance < this.#bestDistance - epsilon)
    {
      this.#bestDistance = distance;
      this.#framesWithoutProgress = 0;

      return;
    }

    // otherwise this frame bought nothing.
    this.#framesWithoutProgress += 1;
  }

  /**
   * Whether the spot has drifted far enough from where this attempt began to count as a different spot.
   * @param {number} targetX The x coordinate of the spot now.
   * @param {number} targetY The y coordinate of the spot now.
   * @param {number} driftTolerance How far the spot may drift before it counts as a different spot.
   * @returns {boolean} True if this is a different spot, false if it is still the same one.
   */
  #hasSpotMoved(targetX, targetY, driftTolerance)
  {
    // measure the drift in a straight line, the same way the approach itself is measured.
    const drift = Math.hypot(targetX - this.#targetX, targetY - this.#targetY);

    // anything past the tolerance is somewhere else.
    return drift > driftTolerance;
  }

  /**
   * Starts measuring a fresh attempt from wherever the ally happens to be standing.
   * @param {number} distance How far this ally currently is from the spot.
   * @param {number} targetX The x coordinate of the spot.
   * @param {number} targetY The y coordinate of the spot.
   */
  #beginAttempt(distance, targetX, targetY)
  {
    this.#attempting = true;
    this.#targetX = targetX;
    this.#targetY = targetY;
    this.#bestDistance = distance;
    this.#framesWithoutProgress = 0;
  }

  /**
   * Whether this ally has spent long enough getting no closer to give up on the spot.
   * @param {number} stallFrames How many frames without progress are tolerated.
   * @returns {boolean} True if the ally should stop trying, false otherwise.
   */
  isStalled(stallFrames)
  {
    // give up only once the patience has actually run out.
    return this.#framesWithoutProgress >= stallFrames;
  }

  /**
   * Abandons the current attempt, so the next one is measured from scratch.
   *
   * Called when an ally is standing in its spot, which is the one outcome that says everything recorded so
   * far is spent - the next time it is out of position it is a new problem, even if the spot has not moved
   * an inch.
   */
  reset()
  {
    this.#attempting = false;
    this.#framesWithoutProgress = 0;
  }
}

export default JABS_StanceStall;
//endregion JABS_StanceStall