//region JABS_FormationStall
/**
 * Tracks how an ally is faring at reaching one formation slot, so that one it cannot reach can be
 * abandoned instead of chased forever.
 *
 * An ally that cannot occupy its slot does not fail quietly. The pathfinder rounds a character's
 * position to a whole tile before searching, so an ally standing near a tile boundary gets a
 * different first step depending on which side of that boundary it is on. It takes the step, lands
 * back on the other side, and is handed the opposite answer next frame. Because a move command
 * faces its character whether or not the move succeeds, the result reads as a character vibrating
 * in place rather than as one that is stuck.
 *
 * **Progress is measured, not time.** Giving up after a fixed number of frames would abandon a long
 * but perfectly good walk around a wall, which is the common case and the one that must not break.
 * What is tracked instead is the closest the ally has ever come to the slot during this attempt, and
 * how long it has been since that improved. A detour that is genuinely working keeps beating its own
 * record and never stalls; the two-step shuffle above never beats it once.
 */
class JABS_FormationStall
{
  /**
   * Whether an attempt on a slot is currently underway.
   *
   * Kept as its own flag rather than inferred from the coordinates below, because `0,0` is a real
   * place on a map and an ally assigned a slot there would otherwise inherit the history of an
   * attempt that never happened.
   * @type {boolean}
   */
  #attempting = false;

  /**
   * The x coordinate of the slot this attempt is aimed at.
   * @type {number}
   */
  #targetX = 0;

  /**
   * The y coordinate of the slot this attempt is aimed at.
   * @type {number}
   */
  #targetY = 0;

  /**
   * The closest this ally has come to the slot during the current attempt.
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
   * A slot that has moved since last frame starts a fresh attempt, because the leader walking or
   * turning relocates every slot behind them and the old attempt's history says nothing about the
   * new one. That also means an ally is never stalled while its leader is on the move, which is the
   * behaviour worth protecting - standing still is only ever the answer to a slot that is genuinely
   * unreachable from where the ally is.
   * @param {number} distance How far this ally currently is from the slot.
   * @param {number} targetX The x coordinate of the slot.
   * @param {number} targetY The y coordinate of the slot.
   * @param {number} epsilon How much closer counts as having made progress.
   */
  observe(distance, targetX, targetY, epsilon)
  {
    // a slot that has moved, or a first look at one, is a new problem entirely.
    const isNewAttempt = this.#attempting === false
      || targetX !== this.#targetX
      || targetY !== this.#targetY;

    if (isNewAttempt)
    {
      this.#beginAttempt(distance, targetX, targetY);

      return;
    }

    // closing on the slot by a margin worth counting means the approach is still working.
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
   * Starts measuring a fresh attempt from wherever the ally happens to be standing.
   * @param {number} distance How far this ally currently is from the slot.
   * @param {number} targetX The x coordinate of the slot.
   * @param {number} targetY The y coordinate of the slot.
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
   * Whether this ally has spent long enough getting no closer to give up on the slot.
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
   * Called when an ally is standing in its slot, which is the one outcome that says everything
   * recorded so far is spent - the next time it is out of position it is a new problem, even if the
   * slot has not moved an inch.
   */
  reset()
  {
    this.#attempting = false;
    this.#framesWithoutProgress = 0;
  }
}

export default JABS_FormationStall;
//endregion JABS_FormationStall