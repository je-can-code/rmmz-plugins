//region JabsBossParticipant
/**
 * A single body that belongs to a boss encounter.
 *
 * Most fights have exactly one participant, but the concept is deliberately plural: a boss with
 * destructible parts, a pair of twins, and a swarm sharing one health pool are all the same
 * structure wearing different win conditions. Keeping participants a list from day one means none
 * of those require a new shape later.
 *
 * A participant is not an event on any particular map. It names an enemy and the tile that enemy
 * appears on, and the encounter spawns it from the enemy clone map onto whichever map the fight
 * starts on. That is what lets one encounter run unchanged in its real arena and in a test hall built
 * in the same shape: neither map holds the boss, so neither map's event numbering has to agree with
 * anything, and no editor ever has to be talked into assigning an event a particular id.
 *
 * Usually the template it spawns from is the one in the slot matching its enemy id. A participant can
 * name a different template instead, for a body that is that same enemy but dressed for this one fight:
 * a prefix it always wears, a role it plays, a level it fights at. The enemy's own template stays exactly
 * as it is for every other place that enemy turns up.
 *
 * Most participants are bodies the fight is won by felling. A bystander is the exception: it stands in the
 * fight from its first frame without being part of winning it, the way an elemental might watch from the
 * edge of the room and cheer its champion on.
 */
class JabsBossParticipant
{
  /**
   * The author-facing name for this participant, used to reference it from elsewhere in the config.
   * @type {string}
   */
  #key = String.empty;

  /**
   * The id of the enemy in the database that this participant is.
   *
   * The body spawned for it has to turn out to be this enemy, whichever template it came from.
   * @type {number}
   */
  #enemyId = 0;

  /**
   * The id of the event on the enemy clone map this participant spawns from.
   *
   * The clone map keeps each enemy's own template in the slot matching its enemy id, so that slot is
   * what a participant spawns from unless it names another. A template of its own sits past the last
   * enemy id, where no enemy added later can ever claim the slot.
   * @type {number}
   */
  #templateId = 0;

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
   * The x coordinate of the tile this participant appears on when the encounter starts.
   * @type {number}
   */
  #x = 0;

  /**
   * The y coordinate of the tile this participant appears on when the encounter starts.
   * @type {number}
   */
  #y = 0;

  /**
   * Whether this participant is part of the fight without being part of winning it.
   *
   * A bystander is spawned with the rest and can be named by any step, so it can say its lines from where it
   * stands. The fight is won once every other participant has fallen, and a bystander still standing then
   * leaves the map with the fight, the way anything the fight spawned for itself does.
   * @type {boolean}
   */
  #bystander = false;

  /**
   * Constructor.
   * @param {string} key The author-facing name for this participant.
   * @param {number} enemyId The id of the enemy this participant is.
   * @param {string} expect The enemy name recorded when this encounter was authored.
   * @param {number} x The x coordinate of the tile this participant appears on.
   * @param {number} y The y coordinate of the tile this participant appears on.
   * @param {number} templateId The id of the clone map event this participant spawns from.
   * @param {boolean} bystander Whether this participant is part of the fight without being part of winning it.
   */
  constructor(key, enemyId, expect, x, y, templateId, bystander = false)
  {
    this.#key = key;
    this.#enemyId = enemyId;
    this.#expect = expect;
    this.#x = x;
    this.#y = y;
    this.#templateId = templateId;
    this.#bystander = bystander;
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
   * Gets the id of the enemy this participant is.
   * @returns {number}
   */
  enemyId()
  {
    return this.#enemyId;
  }

  /**
   * Gets the id of the clone map event this participant spawns from.
   * @returns {number}
   */
  templateId()
  {
    return this.#templateId;
  }

  /**
   * Gets the enemy name recorded when this encounter was authored.
   * @returns {string}
   */
  expect()
  {
    return this.#expect;
  }

  /**
   * Gets the x coordinate of the tile this participant appears on when the encounter starts.
   * @returns {number}
   */
  x()
  {
    return this.#x;
  }

  /**
   * Gets the y coordinate of the tile this participant appears on when the encounter starts.
   * @returns {number}
   */
  y()
  {
    return this.#y;
  }

  /**
   * Gets whether this participant is part of the fight without being part of winning it.
   * @returns {boolean}
   */
  isBystander()
  {
    return this.#bystander;
  }
}

export default JabsBossParticipant;
//endregion JabsBossParticipant