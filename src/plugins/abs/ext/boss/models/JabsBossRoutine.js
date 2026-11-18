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
   * Whether this routine waits, not running at all, until a step starts it.
   *
   * Most of what a fight keeps doing, it does from the first frame. Some of it only begins once the fight turns a
   * corner- a summoner from two thirds of the boss's health on- and a reaction to that moment is what starts it.
   * @type {boolean}
   */
  #dormant = false;

  /**
   * Constructor.
   * @param {string} key The author-facing name for this routine.
   * @param {number} cadenceFrames How many frames elapse between executions.
   * @param {JabsBossStep[]} steps The steps performed each time this routine comes due.
   * @param {boolean} dormant Whether this routine waits for a step to start it.
   */
  constructor(key, cadenceFrames, steps, dormant = false)
  {
    this.#key = key;
    this.#cadenceFrames = cadenceFrames;
    this.#steps = steps;
    this.#dormant = dormant;
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

  /**
   * Gets whether this routine waits, not running at all, until a step starts it.
   * @returns {boolean}
   */
  isDormant()
  {
    return this.#dormant;
  }
}

export default JabsBossRoutine;
//endregion JabsBossRoutine