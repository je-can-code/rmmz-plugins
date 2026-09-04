//region JabsDpsHit
/**
 * One landed hit, recorded at the moment its result was applied to the target.
 *
 * The tracker stores these rather than running counters, because a counter answers exactly one
 * question and a hit answers all of them. Rolling damage is a filter on {@link combatFrame},
 * per-battler damage is a group on {@link casterUuid}, and per-skill attribution is a group on
 * {@link skillId} - none of which require the recording side to know they were wanted.
 */
class JabsDpsHit
{
  /**
   * The combat-time frame this hit landed on.
   *
   * Combat time, not real time- the tracker's clock only advances while the party is engaged, so
   * two hits five frames apart across a ten minute walk are still five frames apart here.
   * @type {number}
   */
  #combatFrame = 0;

  /**
   * The uuid of the battler that dealt this hit.
   * @type {string}
   */
  #casterUuid = String.empty;

  /**
   * The id of the skill that dealt this hit.
   * @type {number}
   */
  #skillId = 0;

  /**
   * The hp damage this hit inflicted.
   * @type {number}
   */
  #hpDamage = 0;

  /**
   * Whether or not this hit was a critical.
   * @type {boolean}
   */
  #critical = false;

  /**
   * Constructor.
   * @param {number} combatFrame The combat-time frame this hit landed on.
   * @param {string} casterUuid The uuid of the battler that dealt this hit.
   * @param {number} skillId The id of the skill that dealt this hit.
   * @param {number} hpDamage The hp damage this hit inflicted.
   * @param {boolean} critical Whether or not this hit was a critical.
   */
  constructor(combatFrame, casterUuid, skillId, hpDamage, critical)
  {
    this.#combatFrame = combatFrame;
    this.#casterUuid = casterUuid;
    this.#skillId = skillId;
    this.#hpDamage = hpDamage;
    this.#critical = critical;
  }

  /**
   * Gets the combat-time frame this hit landed on.
   * @returns {number}
   */
  combatFrame()
  {
    return this.#combatFrame;
  }

  /**
   * Gets the uuid of the battler that dealt this hit.
   * @returns {string}
   */
  casterUuid()
  {
    return this.#casterUuid;
  }

  /**
   * Gets the id of the skill that dealt this hit.
   * @returns {number}
   */
  skillId()
  {
    return this.#skillId;
  }

  /**
   * Gets the hp damage this hit inflicted.
   * @returns {number}
   */
  hpDamage()
  {
    return this.#hpDamage;
  }

  /**
   * Gets whether or not this hit was a critical.
   * @returns {boolean}
   */
  isCritical()
  {
    return this.#critical;
  }
}

export default JabsDpsHit;
//endregion JabsDpsHit