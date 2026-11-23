//region JABS_StanceFacing
/**
 * Tracks which way an ally's stance is laid out around its leader, turning it only once the leader has
 * settled on a new facing.
 *
 * Laying a stance out from the leader's facing directly would swing it the instant they turned, and a
 * stance kept in front of the leader swings all the way round to behind them. An ally in front, watching
 * its leader turn to read a sign, would sprint a lap around them and then sprint back. So a new facing has
 * to be held for a moment before the stance follows it, and a glance one way and back moves nobody.
 */
class JABS_StanceFacing
{
  /**
   * The facing the stance is currently laid out from, or zero before any facing has been seen.
   * @type {number}
   */
  #direction = 0;

  /**
   * The facing the leader has most recently turned to and held; zero before any has been counted.
   * @type {number}
   */
  #candidate = 0;

  /**
   * How many consecutive observations the leader has held {@link #candidate} for.
   * @type {number}
   */
  #candidateFrames = 0;

  /**
   * Gets the facing the stance is currently laid out from.
   * @returns {number} The direction, or zero before any facing has been seen.
   */
  direction()
  {
    // hand back the settled facing.
    return this.#direction;
  }

  /**
   * Records which way the leader faces this frame, and turns the stance if they have held a new facing
   * for long enough.
   * @param {number} direction The direction the leader currently faces.
   * @param {number} settleFrames How many frames a new facing must be held before the stance follows it.
   */
  observe(direction, settleFrames)
  {
    // the very first facing seen has nothing to settle against, so the stance takes it outright.
    if (this.#direction === 0)
    {
      this.#direction = direction;
      return;
    }

    // a facing that differs from the one being counted starts a count of its own. that includes facing
    // back the way the stance is already laid out, which is how a glance away and back cancels a turn.
    if (direction !== this.#candidate)
    {
      this.#candidate = direction;
      this.#candidateFrames = 0;
    }

    // one more frame of holding this facing.
    this.#candidateFrames += 1;

    // not held long enough yet to move anybody.
    if (this.#candidateFrames < settleFrames) return;

    // the leader has settled; the stance turns to match. holding the facing the stance already has
    // settles on that same facing again, which changes nothing.
    this.#direction = direction;
  }
}

export default JABS_StanceFacing;
//endregion JABS_StanceFacing