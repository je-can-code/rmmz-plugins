//region JabsBossParticipant
/**
 * A single body that belongs to a boss encounter.
 *
 * Most fights have exactly one participant, but the concept is deliberately plural: a boss with
 * destructible parts, a pair of twins, and a swarm sharing one health pool are all the same
 * structure wearing different win conditions. Keeping participants a list from day one means none
 * of those require a new shape later.
 */
class JabsBossParticipant
{
  /**
   * The author-facing name for this participant, used to reference it from elsewhere in the config.
   * @type {string}
   */
  #key = String.empty;

  /**
   * The id of the event on the encounter's map that hosts this participant's battler.
   * @type {number}
   */
  #eventId = 0;

  /**
   * The id of the enemy in the database that this participant is expected to be.
   * @type {number}
   */
  #enemyId = 0;

  /**
   * The name this participant's enemy had when the encounter was authored.
   *
   * This is the drift tripwire. Database ids move when the database is rebalanced, and a stale id
   * fails silently- the fight simply runs against the wrong enemy and nothing reports a problem.
   * Storing the name alongside the id lets validation fail loudly instead.
   * @type {string}
   */
  #expect = String.empty;

  /**
   * Constructor.
   * @param {string} key The author-facing name for this participant.
   * @param {number} eventId The id of the event hosting this participant's battler.
   * @param {number} enemyId The id of the enemy this participant should be.
   * @param {string} expect The enemy name recorded when this encounter was authored.
   */
  constructor(key, eventId, enemyId, expect)
  {
    this.#key = key;
    this.#eventId = eventId;
    this.#enemyId = enemyId;
    this.#expect = expect;
  }

  /**
   * Gets the author-facing name for this participant.
   * @returns {string}
   */
  key()
  {
    return this.#key;
  }

  /**
   * Gets the id of the event hosting this participant's battler.
   * @returns {number}
   */
  eventId()
  {
    return this.#eventId;
  }

  /**
   * Gets the id of the enemy this participant should be.
   * @returns {number}
   */
  enemyId()
  {
    return this.#enemyId;
  }

  /**
   * Gets the enemy name recorded when this encounter was authored.
   * @returns {string}
   */
  expect()
  {
    return this.#expect;
  }
}

export default JabsBossParticipant;
//endregion JabsBossParticipant