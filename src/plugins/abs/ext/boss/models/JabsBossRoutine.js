//region JabsBossRoutine
/**
 * A repeating sequence of steps that runs while its encounter is live.
 *
 * Routines are the recurring half of a boss fight- the summon that arrives every fifteen seconds,
 * the circuit of attacks the boss walks. They are additive and they do not stop on their own: a
 * fight that gets harder the longer it runs is a design position, not an oversight, so nothing
 * here quietly retires a routine that was started.
 */
class JabsBossRoutine
{
  /**
   * The author-facing name for this routine.
   * @type {string}
   */
  #key = String.empty;

  /**
   * How many frames elapse between executions of this routine.
   * @type {number}
   */
  #cadenceFrames = 0;

  /**
   * The steps performed each time this routine comes due, in order.
   * @type {JabsBossStep[]}
   */
  #steps = [];

  /**
   * Constructor.
   * @param {string} key The author-facing name for this routine.
   * @param {number} cadenceFrames How many frames elapse between executions.
   * @param {JabsBossStep[]} steps The steps performed each time this routine comes due.
   */
  constructor(key, cadenceFrames, steps)
  {
    this.#key = key;
    this.#cadenceFrames = cadenceFrames;
    this.#steps = steps;
  }

  /**
   * Gets the author-facing name for this routine.
   * @returns {string}
   */
  key()
  {
    return this.#key;
  }

  /**
   * Gets how many frames elapse between executions of this routine.
   * @returns {number}
   */
  cadenceFrames()
  {
    return this.#cadenceFrames;
  }

  /**
   * Gets the steps performed each time this routine comes due.
   * @returns {JabsBossStep[]}
   */
  steps()
  {
    return this.#steps;
  }
}

export default JabsBossRoutine;
//endregion JabsBossRoutine