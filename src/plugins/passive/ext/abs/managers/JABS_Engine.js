//region JABS_Engine
/**
 * Extends {@link JABS_Engine.prototype.determineExperienceGained}.<br/>
 * Applies reward multipliers from the defeated enemy's note and states.
 * @param {Game_Enemy} defeatedEnemy The enemy that was defeated.
 * @param {Game_Actor} victoriousActor The actor that defeated the enemy.
 * @returns {number} The multiplied experience gained.
 */
J.PASSIVE.EXT.ABS.Aliased.JABS_Engine.set(
  'determineExperienceGained',
  JABS_Engine.prototype.determineExperienceGained);
JABS_Engine.prototype.determineExperienceGained = function(defeatedEnemy, victoriousActor)
{
  // perform original logic.
  const base = J.PASSIVE.EXT.ABS.Aliased.JABS_Engine.get('determineExperienceGained')
    .call(this, defeatedEnemy, victoriousActor);

  // apply any reward multiplier tags for exp.
  const rewardMultiplier = defeatedEnemy.getRewardMultiplierByType('exp');

  return Math.ceil(base * rewardMultiplier);
};

/**
 * Extends {@link JABS_Engine.prototype.determineGoldGained}.<br/>
 * Applies reward multipliers from the defeated enemy's note and states.
 * @param {Game_Enemy} defeatedEnemy The enemy that was defeated.
 * @param {Game_Actor} victoriousActor The actor that defeated the enemy.
 * @returns {number} The multiplied gold gained.
 */
J.PASSIVE.EXT.ABS.Aliased.JABS_Engine.set(
  'determineGoldGained',
  JABS_Engine.prototype.determineGoldGained);
JABS_Engine.prototype.determineGoldGained = function(defeatedEnemy, victoriousActor)
{
  // perform original logic.
  const base = J.PASSIVE.EXT.ABS.Aliased.JABS_Engine.get('determineGoldGained')
    .call(this, defeatedEnemy, victoriousActor);

  // apply any reward multiplier tags for gold.
  const rewardMultiplier = defeatedEnemy.getRewardMultiplierByType('gold');

  return Math.ceil(base * rewardMultiplier);
};

/**
 * Extends {@link JABS_Engine.prototype.determineSdpGained}.<br/>
 * Applies reward multipliers from the defeated enemy's note and states.
 * @param {Game_Enemy} defeatedEnemy The enemy that was defeated.
 * @param {JABS_Battler} actor The map battler that defeated the target.
 * @returns {number} The multiplied SDP points gained.
 */
J.PASSIVE.EXT.ABS.Aliased.JABS_Engine.set(
  'determineSdpGained',
  JABS_Engine.prototype.determineSdpGained);
JABS_Engine.prototype.determineSdpGained = function(defeatedEnemy, actor)
{
  // perform original logic.
  const base = J.PASSIVE.EXT.ABS.Aliased.JABS_Engine.get('determineSdpGained')
    .call(this, defeatedEnemy, actor);

  // apply any reward multiplier tags for sdp.
  const rewardMultiplier = defeatedEnemy.getRewardMultiplierByType('sdp');

  return Math.ceil(base * rewardMultiplier);
};

/**
 * Extends {@link JABS_Engine.prototype.determineApGained}.<br/>
 * Applies reward multipliers from the defeated enemy's note and states.
 * @param {Game_Enemy} defeatedEnemy The enemy that was defeated.
 * @returns {number} The multiplied AP gained.
 */
J.PASSIVE.EXT.ABS.Aliased.JABS_Engine.set(
  'determineApGained',
  JABS_Engine.prototype.determineApGained);
JABS_Engine.prototype.determineApGained = function(defeatedEnemy)
{
  // perform original logic.
  const base = J.PASSIVE.EXT.ABS.Aliased.JABS_Engine.get('determineApGained')
    .call(this, defeatedEnemy);

  // apply any reward multiplier tags for ap.
  const rewardMultiplier = defeatedEnemy.getRewardMultiplierByType('ap');

  return Math.ceil(base * rewardMultiplier);
};
//endregion JABS_Engine