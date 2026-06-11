//region JABS_SkillExecution
/**
 * A model representing a single skill execution recorded in a battler's skill history log.
 * Entries age up by one second per engine tick and are pruned by the engine when they expire.
 * The log itself lives on {@link JABS_Engine} and survives map transfers.
 *
 * Not serialized into save data — no {@link SerializableRegistry} registration needed.
 */
class JABS_SkillExecution
{
  /**
   * The id of the skill that was executed.
   * @type {number}
   */
  skillId = 0;

  /**
   * The skill type id of the executed skill, cached at push time to avoid live database lookups.
   * A value of 0 means the skill belongs to no type (matches RMMZ's own "None" stypeId convention).
   * @type {number}
   */
  skillTypeId = 0;

  /**
   * How many seconds have elapsed since this skill was executed.
   * Incremented once per second by the engine's skill log update tick.
   * @type {number}
   */
  age = 0;

  /**
   * Constructor.
   * @param {number} skillId The id of the skill executed.
   * @param {number} skillTypeId The skill type id of the executed skill.
   */
  constructor(skillId, skillTypeId)
  {
    this.skillId = skillId;
    this.skillTypeId = skillTypeId;
  }

  /**
   * Increments the age of this entry by one second.
   * Called once per second by the engine's skill log update tick.
   */
  tick()
  {
    this.age++;
  }

  /**
   * Determines whether this entry has aged past the given maximum window.
   * @param {number} maxWindowSeconds The maximum number of seconds to retain this entry.
   * @returns {boolean} True if this entry should be pruned, false if it is still valid.
   */
  isExpired(maxWindowSeconds)
  {
    return this.age > maxWindowSeconds;
  }

  /**
   * Determines whether this entry falls within the given time window.
   * @param {number} windowSeconds The number of seconds to look back.
   * @returns {boolean} True if this entry was executed within the window, false otherwise.
   */
  isWithinWindow(windowSeconds)
  {
    return this.age <= windowSeconds;
  }

  /**
   * Determines whether this entry matches a given skill id filter.
   * A filter value of 0 is the sentinel for "any skill" and always returns true.
   * @param {number} skillId The skill id to match against, or 0 for no filter.
   * @returns {boolean} True if this entry matches the filter, false otherwise.
   */
  matchesSkillId(skillId)
  {
    // 0 is the sentinel meaning "no filter — match any skill".
    if (skillId === 0) return true;

    // check whether this entry's skill matches the requested id.
    return this.skillId === skillId;
  }

  /**
   * Determines whether this entry matches a given skill type id filter.
   * A filter value of 0 matches any type, consistent with RMMZ's own "None" stypeId convention.
   * @param {number} typeId The skill type id to match against, or 0 for no filter.
   * @returns {boolean} True if this entry matches the filter, false otherwise.
   */
  matchesTypeId(typeId)
  {
    // 0 is the sentinel meaning "no type filter — match any skill type",
    // which also aligns with RMMZ's stypeId = 0 meaning "None".
    if (typeId === 0) return true;

    // check whether this entry's skill type matches the requested type.
    return this.skillTypeId === typeId;
  }
}

export default JABS_SkillExecution;
//endregion JABS_SkillExecution