//region ExperienceManager
/**
 * A manager class for calculating experience gained.
 */
class ExperienceManager
{
  /**
   * The base experience gained when there is no difference in level between the attacker and defender.
   */
  static #parityExperience = 25;

  /**
   * The absolute minimum experience gained when the attacker's level is too far below the defender's.
   * @type {number}
   */
  static #minimumExperience = 0;

  /**
   * The absolute maximum experience gained when the attacker's level is too far above the defender's.
   * @type {number}
   */
  static #maximumExperience = 1000;

  /**
   * The map of level differences to experience gained.
   * @type {Map<number, number>}
   */
  static #experienceMap = new Map([
    // TODO: figure out a way to parameterize this.
    {
      diff: -15,
      exp: this.#minimumExperience
    }, {
      diff: -14,
      exp: 1
    }, {
      diff: -13,
      exp: 1
    }, {
      diff: -12,
      exp: 1
    }, {
      diff: -11,
      exp: 1
    },  // ...
    {
      diff: -10,
      exp: 1
    },  // 1000
    {
      diff: -9,
      exp: 3
    },  // 334
    {
      diff: -8,
      exp: 6
    },  // 166
    {
      diff: -7,
      exp: 10
    },  // 100
    {
      diff: -6,
      exp: 12
    },  // 83
    {
      diff: -5,
      exp: 14
    },  // 72
    {
      diff: -4,
      exp: 16
    },  // 63
    {
      diff: -3,
      exp: 18
    },  // 56
    {
      diff: -2,
      exp: 20
    },  // 50
    {
      diff: -1,
      exp: 22
    },  // 45
    {
      diff: 0,
      exp: this.#parityExperience
    },  // 40 - baseline
    {
      diff: 1,
      exp: 30
    },  // 33
    {
      diff: 2,
      exp: 35
    },  // 29
    {
      diff: 3,
      exp: 40
    },  // 25
    {
      diff: 4,
      exp: 50
    },  // 20
    {
      diff: 5,
      exp: 65
    },  // 16
    {
      diff: 6,
      exp: 80
    },  // 12
    {
      diff: 7,
      exp: 100
    },  // 10
    {
      diff: 8,
      exp: 150
    },  // 7
    {
      diff: 9,
      exp: 200
    },  // 5
    {
      diff: 10,
      exp: 250
    },  // 4
    {
      diff: 11,
      exp: 334
    },  // 3
    {
      diff: 12,
      exp: 500
    },  // 2
    {
      diff: 13,
      exp: 666
    },  // 2
    {
      diff: 14,
      exp: 750
    },  // 2
    {
      diff: 15,
      exp: this.#maximumExperience
    },  // 1
  ].map(({
    diff,
    exp
  }) => [ diff, exp ]));

  /**
   * Calculates the experience gained based on the level difference between two battlers.
   * @param {number} levelA The level of the rewardee.
   * @param {number} levelB The level of the defeated target.
   * @returns {number} The experience gained.
   */
  static calculateRewardFromLevelDifference(levelA, levelB)
  {
    // determine the base policy experience to gain.
    const baseExp = this.#experienceByLevelDifference(levelA, levelB);

    // return the normalized experience.
    return this.#applyExpModifications(baseExp);
  }

  /**
   * Calculates the experience reward based on the level difference between two battlers.
   * @param {number} levelA The level of the rewardee.
   * @param {number} levelB The level of the defeated target.
   * @returns {number} The experience gained.
   */
  static #experienceByLevelDifference(levelA, levelB)
  {
    // if either of the levels are not defined or zero, then return parity experience.
    if (!levelA || !levelB) return this.#parityExperience;

    // perception of difference from target to rewardee.
    const levelDifference = levelB - levelA;

    // if there is no difference, then just return parity experience.
    if (levelDifference === 0) return this.#parityExperience;

    // if the difference is too large in favor of the attacker, then return the minimum experience.
    if (levelDifference < -15) return this.#minimumExperience;

    // if the difference is too large in favor of the defender, then return the maximum experience.
    if (levelDifference > 15) return this.#maximumExperience;

    // return the experience based on the level difference. the guards above have already handled
    // every difference outside -15 to 15, and the map holds an entry for every value inside that
    // span, so this lookup always finds one- no fallback is reachable here.
    return this.#experienceMap.get(levelDifference);
  }

  /**
   * Applies the experience modifications based on the policy multiplier.
   * @param {number} baseExp The base experience gained.
   * @returns {number} The experience gained.
   */
  static #applyExpModifications(baseExp)
  {
    // scale the experience based on the policy multiplier.
    const scaledExp = Math.round(baseExp * J.LEVEL.EXT.FLAT.Metadata.policyMultiplier);

    // normalize the experience to the minimum experience.
    const normalizedExp = Math.max(scaledExp, this.#minimumExperience);

    // return the normalized experience.
    return normalizedExp;
  }
}

export default ExperienceManager;
//endregion ExperienceManager