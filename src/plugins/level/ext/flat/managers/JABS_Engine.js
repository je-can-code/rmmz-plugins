//region JABS_Engine
if (J.ABS)
{
  /**
   * Overrides {@link #determineExperienceGained}.<br/>
   * Replaces with the flat-experience logic.
   * @param {Game_Enemy} defeatedEnemy The enemy that was defeated.
   * @param {Game_Actor} victoriousActor The actor that defeated the enemy.
   */
  JABS_Engine.prototype.determineExperienceGained = function(defeatedEnemy, victoriousActor)
  {
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