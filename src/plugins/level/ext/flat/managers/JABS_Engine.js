//region JABS_Engine
import ExperienceManager from './ExperienceManager.js';

if (J.ABS)
{
  /**
   * Overwrites {@link #determineExperienceGained}.<br/>
   * Replaces with the flat-experience logic.
   * @param {Game_Enemy} defeatedEnemy The enemy that was defeated.
   * @param {Game_Actor} victoriousActor The actor that defeated the enemy.
   */
  JABS_Engine.prototype.determineExperienceGained = function(defeatedEnemy, victoriousActor)
  {
    // check the reward policy gate; inanimates and any future exclusions bail here.
    if (this.canGainReward(defeatedEnemy, victoriousActor) === false) return 0;

    // determine the flat experience gained based on the rewardee and defeated target.
    const baseExperience = ExperienceManager.calculateRewardFromLevelDifference(
      victoriousActor.level,
      defeatedEnemy.level
    );

    // add on the bonus experience.
    const withBonusExperience = defeatedEnemy.exp() + baseExperience;

    // return the experience gained.
    return withBonusExperience;
  };
}
//endregion JABS_Engine