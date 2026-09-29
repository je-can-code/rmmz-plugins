//region ClassAptitudeManager
/**
 * Answers what the class scene asks about a class's aptitude learnings: how many an actor has learned, and
 * whether they have learned them all.
 *
 * Progress is read per skill rather than per source, the same way J-Aptitude grants it. A skill learned
 * from one class counts for every other class that teaches it too, which is also why a class stops handing
 * out AP for a skill the moment it is learned anywhere.
 */
class ClassAptitudeManager
{
  /**
   * The color a mastered class's progress is drawn in: the same green the aptitude ladder marks a learned
   * skill DONE in.
   * @type {number}
   */
  static MASTERED_COLOR_INDEX = 11;

  /**
   * The constructor is not designed to be called.
   * This is a static class.
   */
  constructor()
  {
    throw new Error('This is a static class.');
  }

  /**
   * Counts how many of a class's teachables an actor has learned.
   * @param {Game_Actor} actor The actor whose learnings are counted.
   * @param {number} classId The id of the class whose teachables are counted.
   * @returns {number}
   */
  static learnedCount(actor, classId)
  {
    // everything the class teaches.
    const teachables = $dataClasses[classId].aptitudeTeachings;

    // only the ones this actor has already learned, from this class or any other.
    const learned = teachables.filter(teachable => actor.hasLearnedAptitudeSkill(teachable.skillId));

    return learned.length;
  }

  /**
   * Determines whether an actor has learned everything a class teaches.
   *
   * A class that teaches nothing is never mastered: there is nothing to have finished, and answering yes
   * would let a trainer hand out a reward for a class nobody has worked at.
   * @param {Game_Actor} actor The actor being asked about.
   * @param {number} classId The id of the class being asked about.
   * @returns {boolean}
   */
  static isMastered(actor, classId)
  {
    // a class with nothing to learn has nothing to master.
    const total = $dataClasses[classId].aptitudeTeachings.length;
    if (total === 0) return false;

    // mastered means every last teachable has been learned.
    return this.learnedCount(actor, classId) === total;
  }

  /**
   * The progress drawn at the right edge of a class's row: learned over total while there is still something
   * to learn, MASTERED once there is not, and nothing at all for a class that teaches nothing or one the actor
   * has yet to unlock.
   * @param {Game_Actor} actor The actor whose progress is shown.
   * @param {number} classId The id of the class whose progress is shown.
   * @returns {string}
   */
  static progressText(actor, classId)
  {
    // a class still to unlock gives nothing about itself away.
    if (ClassManager.isClassRevealed(actor, classId) === false) return String.empty;

    // a class that teaches nothing has no progress worth drawing.
    const total = $dataClasses[classId].aptitudeTeachings.length;
    if (total === 0) return String.empty;

    // everything learned reads as the achievement it is.
    const learned = this.learnedCount(actor, classId);
    if (learned === total) return 'MASTERED';

    // otherwise, how far along the actor is.
    return `${learned}/${total}`;
  }

  /**
   * The skills a class keeps known and active for as long as it is worn: its `<unslottedSkills>`, each skill
   * once, in database order.
   *
   * The tag belongs to J-SkillSlots, which frees the skills it lists from needing a slot for whoever carries
   * it. On a class, that is everything the class hands out for free- in Chef Adventure, the weapon and armor
   * types it can equip. Without J-SkillSlots there is no such thing as an unslotted skill, so nothing is.
   * @param {number} classId The id of the class being read.
   * @returns {number[]}
   */
  static alwaysKnownSkillIds(classId)
  {
    // only J-SkillSlots knows what an unslotted skill is.
    if (!J.SKS) return [];

    // every tag on the class, merged, with each skill listed once.
    const skillIdArrays = RPGManager.getArraysFromNotesByRegex($dataClasses[classId], J.SKS.RegExp.UnslottedSkills);
    const skillIds = new Set(skillIdArrays.flat());

    // in database order, the way every other list of skills reads.
    return [ ...skillIds ].sort((left, right) => left - right);
  }
}

export default ClassAptitudeManager;
//endregion ClassAptitudeManager