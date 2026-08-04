//region JabsBossEncounter
/**
 * The whole of one boss fight, as authored in configuration.
 *
 * An encounter is inert data until something starts it. It knows which map it belongs to, which
 * bodies take part, who is permitted to drive them, and what recurs while it runs- but it holds no
 * runtime state of its own, so the same encounter can be started, lost, and started again without
 * carrying anything forward from the previous attempt.
 */
class JabsBossEncounter
{
  /**
   * The author-facing name for this encounter, and the handle used to start it.
   * @type {string}
   */
  #key = String.empty;

  /**
   * The id of the map this encounter takes place on.
   * @type {number}
   */
  #mapId = 0;

  /**
   * Every body taking part in this encounter.
   * @type {JabsBossParticipant[]}
   */
  #participants = [];

  /**
   * Who is permitted to drive the participants while this encounter is live.
   * @type {string}
   */
  #aiControl = String.empty;

  /**
   * The recurring sequences that run for the duration of this encounter.
   * @type {JabsBossRoutine[]}
   */
  #routines = [];

  /**
   * Constructor.
   * @param {string} key The author-facing name for this encounter.
   * @param {number} mapId The id of the map this encounter takes place on.
   * @param {JabsBossParticipant[]} participants Every body taking part.
   * @param {string} aiControl Who is permitted to drive the participants.
   * @param {JabsBossRoutine[]} routines The recurring sequences for this encounter.
   */
  constructor(key, mapId, participants, aiControl, routines)
  {
    this.#key = key;
    this.#mapId = mapId;
    this.#participants = participants;
    this.#aiControl = aiControl;
    this.#routines = routines;
  }

  /**
   * Gets the author-facing name for this encounter.
   * @returns {string}
   */
  key()
  {
    return this.#key;
  }

  /**
   * Gets the id of the map this encounter takes place on.
   * @returns {number}
   */
  mapId()
  {
    return this.#mapId;
  }

  /**
   * Gets every body taking part in this encounter.
   * @returns {JabsBossParticipant[]}
   */
  participants()
  {
    return this.#participants;
  }

  /**
   * Gets who is permitted to drive the participants while this encounter is live.
   * @returns {string}
   */
  aiControl()
  {
    return this.#aiControl;
  }

  /**
   * Gets the recurring sequences that run for the duration of this encounter.
   * @returns {JabsBossRoutine[]}
   */
  routines()
  {
    return this.#routines;
  }

  /**
   * Gets the participant considered the primary body of this encounter.
   *
   * Single-participant fights are the overwhelming majority, and steps that name no participant
   * mean "the boss". This is that boss.
   * @returns {JabsBossParticipant}
   */
  primaryParticipant()
  {
    const [ primary, ] = this.#participants;

    return primary;
  }
}

export default JabsBossEncounter;
//endregion JabsBossEncounter