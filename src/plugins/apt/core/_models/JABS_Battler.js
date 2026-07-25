//region JABS_Battler
import ApManager from './../managers/ApManager.js';

if (J.ABS)
{
  /**
   * Extends {@link #gainBasicRewards}.<br/>
   * Also includes AP when defeating an enemy.
   * @param {Game_Battler} enemy The target battler that was defeated.
   * @param {JABS_Battler} actor The map battler that defeated the target.
   */
  J.APT.Aliased.JABS_Engine.set('gainBasicRewards', JABS_Engine.prototype.gainBasicRewards);
  JABS_Engine.prototype.gainBasicRewards = function(enemy, actor)
  {
    // perform original logic.
    J.APT.Aliased.JABS_Engine.get('gainBasicRewards')
      .call(this, enemy, actor);

    // determine the base AP from the defeated enemy.
    const ap = this.determineApGained(enemy);

    // gain the AP.
    this.gainAptitudeReward(ap, actor, enemy);
  };

  /**
   * Determines how many AP the defeated enemy yielded before per-member level scaling.
   * @param {Game_Enemy} defeatedEnemy The enemy that was defeated.
   * @returns {number} The base AP gained.
   */
  JABS_Engine.prototype.determineApGained = function(defeatedEnemy)
  {
    // check the reward policy gate; no actor is available at this call site so pass null.
    if (this.canGainReward(defeatedEnemy, null) === false) return 0;

    return defeatedEnemy.apPoints();
  };

  /**
   * Gains AP from battle rewards.
   * @param {number} ap The AP to gain.
   * @param {JABS_Battler} actor The map battler that defeated the target.
   * @param {Game_Enemy} enemy The map battler that was defeated.
   */
  JABS_Engine.prototype.gainAptitudeReward = function(ap, actor, enemy)
  {
    // don't do anything if the enemy didn't grant any AP.
    if (ap === 0) return;

    // award AP to the full party; per-actor distribution happens in ApManager.
    $gameParty.members()
      .filter(member => this.canGainAptitudeReward(member, enemy))
      .forEach(member =>
      {
        // identify the JABS battler that owns this member.
        const jabsBattler = JABS_AiManager.getBattlerByUuid(member.getUuid());

        // if somehow we have no battler here, then do nothing.
        if (!jabsBattler) return;

        // apply level scaling multiplier if applicable.
        const levelMultiplier = this.getRewardScalingMultiplier(enemy, jabsBattler);

        // round in favor of the player.
        const actualAp = Math.ceil(ap * levelMultiplier);

        // gain the applicable points.
        ApManager.gainAp(member, actualAp, 'on-kill');

        // create the log entry.
        this.createLogAp(actualAp, jabsBattler);
      });
  };

  /**
   * Determines whether or not the actor can gain AP from the enemy.
   * @param {Game_Actor} actor The map battler that defeated the target.
   * @param {Game_Enemy} enemy The map battler that was defeated.
   * @returns {boolean} True if the actor can gain AP, false otherwise.
   */
  JABS_Engine.prototype.canGainAptitudeReward = function(actor, enemy)
  {
    // check if we are using the level plugin.
    if (J.LEVEL && $gameSystem.isLevelScalingEnabled() && J.APT.Metadata.usingLevelThresholdLimit === true)
    {
      // identify the level difference between the battlers.
      const levelDifference = actor.level - enemy.level;

      // if the level difference was too great, then no AP is gained.
      if (levelDifference > J.APT.Metadata.maxLevelThreshold) return false;
    }

    // gain that AP!
    return true;
  };

  /**
   * Creates the log entry.
   * @param {number} apPoints The AP gained.
   * @param {JABS_Battler} battler The battler gaining the AP.
   */
  JABS_Engine.prototype.createLogAp = function(apPoints, battler)
  {
    // if we are not logging, then don't do this.
    if (!J.LOG) return;

    // build the log entry.
    const apLog = new ActionLogBuilder()
      .setMessage(`\\C[16]${battler.battlerName()}\\C[0] gained \\C[29]\\*${apPoints}\\*\\C[0] AP.`)
      .build();

    // add the log to the action log manager.
    $actionLogManager.addLog(apLog);
  };
}
//endregion JABS_Battler