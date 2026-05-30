// #region AptitudeSkillAggregate
import AptitudeSkillSourceProgress from './AptitudeSkillSourceProgress.js';

/**
 * Represents one skill learned via aptitudes across all sources on an actor.
 * Holds per‑source progress and exposes convenience accessors for list/details UIs.
 */
class AptitudeSkillAggregate
{
  /**
   * The skill id.
   * @type {number}
   */
  #skillId = 0;

  /**
   * The database skill.
   * @type {RPG_Skill}
   */
  #skill = null;

  /**
   * The sources that this skill reside in.
   * @type {AptitudeSkillSourceProgress[]}
   */
  #sources = [];

  /**
   * @param {number} skillId The skill id.
   * @param {RPG_Skill} skillData The database skill for name/icon/desc.
   */
  constructor(skillId, skillData)
  {
    // store the skill id.
    this.#skillId = skillId;

    // store the database skill reference.
    this.#skill = skillData;

    // initialize the per‑source rows.
    this.#sources = [];
  }

  /**
   * Adds one per‑source progress row to this aggregate.
   * @param {AptitudeSkillSourceProgress} src The per‑source row.
   */
  addSource(src)
  {
    // push the source row into this aggregate.
    this.sources()
      .push(src);
  }

  /**
   * The skill id for this aggregate.
   * @returns {number}
   */
  skillId()
  {
    return this.#skillId;
  }

  /**
   * The database object for the skill.
   * @returns {RPG_Skill}
   */
  skill()
  {
    return this.#skill;
  }

  /**
   * The name of the skill.
   * @returns {string}
   */
  name()
  {
    return this.#skill.name;
  }

  /**
   * The icon index of the skill.
   * @returns {number}
   */
  iconIndex()
  {
    return this.#skill.iconIndex;
  }

  /**
   * The sources that this skill resides in.
   * @returns {AptitudeSkillSourceProgress[]}
   */
  sources()
  {
    return this.#sources;
  }

  /**
   * Whether or not this skill has been learned in any source.
   * @returns {boolean}
   */
  learnedAny()
  {
    return this.sources()
      .some(source => source.learned() === true);
  }

  /**
   * Finds the source with the minimum remaining AP among not‑yet‑learned sources.
   * If all sources are learned, returns the first source for display context.
   * @returns {AptitudeSkillSourceProgress|null}
   */
  cheapestSource()
  {
    // start with no cheapest found.
    let cheapest = null;

    // capture sources for downstream policy in this routine.
    const sources = this.sources();

    // iterate all sources.
    sources.forEach(s =>
    {
      // skip learned sources when searching cheapest remaining.
      if (s.learned() === true)
      {
        return;
      }

      // compute the remaining AP for this source.
      const remaining = s.remainingAp();

      // select if first or cheaper than previous.
      if (cheapest === null || remaining < cheapest.remainingAp())
      {
        cheapest = s;
      }
    });

    // if all sources were learned but we have sources, return the first.
    if (cheapest === null && sources.length > 0)
    {
      return sources[0];
    }

    // return the cheapest or null.
    return cheapest;
  }

  /**
   * Convenience: current AP of the cheapest path for list UI.
   * @returns {number}
   */
  currentAp()
  {
    // find the cheapest source.
    const cheapest = this.cheapestSource();

    // return its current AP, or 0 if none.
    return cheapest
      ? cheapest.currentAp()
      : 0;
  }

  /**
   * Convenience: required AP of the cheapest path for list UI.
   * @returns {number}
   */
  requiredAp()
  {
    // find the cheapest source.
    const cheapest = this.cheapestSource();

    // return its required AP, or 1 if none to prevent div‑by‑zero gauges.
    return cheapest
      ? cheapest.requiredAp()
      : 1;
  }
}

export default AptitudeSkillAggregate;
// #endregion AptitudeSkillAggregate