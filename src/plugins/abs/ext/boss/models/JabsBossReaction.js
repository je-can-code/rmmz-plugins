//region JabsBossReaction
/**
 * Something a boss fight does once, the moment a thing happens in it.
 *
 * Routines are what a fight keeps doing; reactions are what it does in answer. The boss seals itself
 * away as the fight opens, the rocks come faster each time one of its guardians falls, the seal breaks
 * once they all have, and a boss worn down past a third of its health flares up and changes the room.
 * Each reaction fires at most once per fight, on the first frame its trigger holds, and a fight started
 * again starts with every reaction unfired.
 */
class JabsBossReaction
{
  /**
   * The moments a reaction can answer.
   */
  static Triggers = {
    /**
     * The fight begins: every body has just arrived, before a single frame of the fight has played.
     */
    Start: 'start',

    /**
     * Every one of the named participants has fallen and finished its death scene.
     */
    Fallen: 'fallen',

    /**
     * Every one of the named participants- or the boss, when none are named- is still standing at or below a
     * percent of its health. A fight's turning points: the boss flaring up as it is worn down.
     */
    Health: 'health',
  };

  /**
   * The author-facing name for this reaction.
   * @type {string}
   */
  #key = String.empty;

  /**
   * The moment this reaction answers, one of {@link JabsBossReaction.Triggers}.
   * @type {string}
   */
  #trigger = String.empty;

  /**
   * The author-facing names of the participants a fallen or health trigger waits on.
   *
   * All of them, not any one: a reaction to one body falling names that one body, and a reaction to a
   * whole group falling names the group. A health trigger naming nobody watches the boss.
   * @type {string[]}
   */
  #participantKeys = [];

  /**
   * The steps performed when this reaction fires, in order.
   * @type {JabsBossStep[]}
   */
  #steps = [];

  /**
   * The percent of its health a health trigger waits for its participants to be worn down to, inclusive.
   * Zero for every other trigger, which waits on no health at all.
   * @type {number}
   */
  #belowPercent = 0;

  /**
   * Constructor.
   * @param {string} key The author-facing name for this reaction.
   * @param {string} trigger The moment this reaction answers.
   * @param {string[]} participantKeys The participants a fallen or health trigger waits on.
   * @param {JabsBossStep[]} steps The steps performed when this reaction fires.
   * @param {number} belowPercent The health percent a health trigger waits for, or zero for any other trigger.
   */
  constructor(key, trigger, participantKeys, steps, belowPercent = 0)
  {
    this.#key = key;
    this.#trigger = trigger;
    this.#participantKeys = participantKeys;
    this.#steps = steps;
    this.#belowPercent = belowPercent;
  }

  /**
   * Gets the author-facing name for this reaction.
   * @returns {string}
   */
  key()
  {
    return this.#key;
  }

  /**
   * Gets the moment this reaction answers.
   * @returns {string}
   */
  trigger()
  {
    return this.#trigger;
  }

  /**
   * Gets the author-facing names of the participants a fallen or health trigger waits on.
   * @returns {string[]}
   */
  participantKeys()
  {
    return this.#participantKeys;
  }

  /**
   * Gets the steps performed when this reaction fires.
   * @returns {JabsBossStep[]}
   */
  steps()
  {
    return this.#steps;
  }

  /**
   * Gets the percent of its health a health trigger waits for its participants to be worn down to, which is
   * zero for every other trigger.
   * @returns {number}
   */
  belowPercent()
  {
    return this.#belowPercent;
  }
}

export default JabsBossReaction;
//endregion JabsBossReaction