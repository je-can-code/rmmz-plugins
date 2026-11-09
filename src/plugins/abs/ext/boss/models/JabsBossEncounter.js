//region JabsBossEncounter
/**
 * The whole of one boss fight, as authored in configuration.
 *
 * An encounter is inert data until something starts it. It knows which map it belongs to, which
 * bodies take part, who is permitted to drive them, what recurs while it runs, what it does in answer
 * to what happens in it, and which switch tells the story it was won- but it holds no runtime state of
 * its own, so the same encounter can be started, lost, and started again without carrying anything
 * forward from the previous attempt.
 */
class JabsBossEncounter
{
  /**
   * The author-facing name for this encounter, and the handle used to start it.
   * @type {string}
   */
  #key = String.empty;

  /**
   * The id of the map holding this encounter's arena in the game itself.
   *
   * Starting the encounter never consults it. The fight runs on whichever map starts it, which is what
   * lets a test hall built in the arena's shape stage the very same fight. Winning does consult it: only
   * a fight won here turns on the defeat switch, so a hall can be won over and over without the story
   * ever hearing of it. Tooling also checks the participants' tiles against the arena it names.
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
   * The switch turned on once every body in this encounter has fallen, or zero for none.
   *
   * This is how the story learns a boss is dead without the boss's own event having to know anything
   * about the story. The body that falls is only ever the boss: its death scene says its last words,
   * and whatever the world does about it afterward waits on this switch.
   * @type {number}
   */
  #defeatSwitchId = 0;

  /**
   * What this encounter does, once each, in answer to the moments of the fight.
   * @type {JabsBossReaction[]}
   */
  #reactions = [];

  /**
   * Constructor.
   * @param {string} key The author-facing name for this encounter.
   * @param {number} mapId The id of the map holding this encounter's arena.
   * @param {JabsBossParticipant[]} participants Every body taking part.
   * @param {string} aiControl Who is permitted to drive the participants.
   * @param {JabsBossRoutine[]} routines The recurring sequences for this encounter.
   * @param {number} defeatSwitchId The switch turned on once every body has fallen, or zero for none.
   * @param {JabsBossReaction[]} reactions What this encounter does in answer to the moments of the fight.
   */
  constructor(key, mapId, participants, aiControl, routines, defeatSwitchId, reactions)
  {
    this.#key = key;
    this.#mapId = mapId;
    this.#participants = participants;
    this.#aiControl = aiControl;
    this.#routines = routines;
    this.#defeatSwitchId = defeatSwitchId;
    this.#reactions = reactions;
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
   * Gets the id of the map holding this encounter's arena.
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
   * Gets the switch turned on once every body in this encounter has fallen, which is zero when the
   * encounter turns no switch on at all.
   * @returns {number}
   */
  defeatSwitchId()
  {
    return this.#defeatSwitchId;
  }

  /**
   * Gets what this encounter does, once each, in answer to the moments of the fight.
   * @returns {JabsBossReaction[]}
   */
  reactions()
  {
    return this.#reactions;
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