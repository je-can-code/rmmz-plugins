//region JABS_Engine
if (J.ABS)
{
  /**
   * Extends the basic rewards from defeating an enemy to also include SDP points.
   * @param {Game_Battler} enemy The target battler that was defeated.
   * @param {JABS_Battler} actor The map battler that defeated the target.
   */
  J.SDP.Aliased.JABS_Engine.set('gainBasicRewards', JABS_Engine.prototype.gainBasicRewards);
  JABS_Engine.prototype.gainBasicRewards = function(enemy, actor)
  {
    // perform original logic.
    J.SDP.Aliased.JABS_Engine.get('gainBasicRewards')
      .call(this, enemy, actor);

    // determine the sdp points gained from the defeated enemy.
    const sdpPoints = this.determineSdpGained(enemy, actor);

    // if we have no points, then no point in continuing.
    if (!sdpPoints) return;

    // gain the value calculated.
    this.gainSdpReward(sdpPoints, actor);

    // generate a log for the SDP gain.
    this.createSdpLog(sdpPoints, actor);
  };

  /**
   * Determines how many SDP points the defeated enemy yielded.
   * @param {Game_Enemy} defeatedEnemy The enemy that was defeated.
   * @param {JABS_Battler} actor The map battler that defeated the target.
   * @returns {number} The SDP points gained.
   */
  JABS_Engine.prototype.determineSdpGained = function(defeatedEnemy, actor)
  {
    // check the reward policy gate; inanimates and any future exclusions bail here.
    if (this.canGainReward(defeatedEnemy, actor.getBattler()) === false) return 0;

    // grab the base sdp points value from the enemy.
    const sdpPoints = defeatedEnemy.sdpPoints();

    // if we have no base points, there is nothing to calculate.
    if (!sdpPoints) return 0;

    // get the scaling multiplier if any exists.
    const levelMultiplier = this.getRewardScalingMultiplier(defeatedEnemy, actor);

    // round up in favor of the player to skip decimals from the multiplier.
    return Math.ceil(sdpPoints * levelMultiplier);
  };

  /**
   * Gains SDP points from battle rewards.
   * @param {number} sdpPoints The SDP points to gain.
   * @param {JABS_Battler} actor The map battler that defeated the target.
   */
  JABS_Engine.prototype.gainSdpReward = function(sdpPoints, actor)
  {
    // don't do anything if the enemy didn't grant any sdp points.
    if (!sdpPoints) return;

    // sdp points are obtained by all members in the party; capture the defeating actor's final amount for the popup.
    const battler = actor.getBattler();
    let multipliedSdpPoints = 0;
    $gameParty.members()
      .forEach(member =>
      {
        // grant points to every party member and track the final scaled amount for the defeating actor.
        const gained = member.modSdpPoints(sdpPoints);
        if (member === battler) multipliedSdpPoints = gained;
      });

    // notify that SDP points were rewarded so optional extensions can respond.
    this.onSdpRewardGranted(multipliedSdpPoints, actor.getCharacter());
  };

  /**
   * Lifecycle event: SDP points were awarded to the party leader's character.
   * Extended by optional plugins (e.g. J-Popups-SDP) to surface map feedback.
   * @param {number} sdpPoints The scaled SDP points granted.
   * @param {Game_Character} character The character who received the reward.
   */
  // eslint-disable-next-line no-unused-vars
  JABS_Engine.prototype.onSdpRewardGranted = function(sdpPoints, character)
  {
  };

  /**
   * Lifecycle event: an SDP panel was unlocked for a character on the map.
   * Extended by optional plugins (e.g. J-Popups-SDP) to surface map feedback.
   * @param {string} sdpKey The key of the SDP panel that was unlocked.
   * @param {Game_Character} character The character who unlocked the panel.
   */
  // eslint-disable-next-line no-unused-vars
  JABS_Engine.prototype.onSdpPanelUnlocked = function(sdpKey, character)
  {
  };

  /**
   * Creates the log entry if using the J-LOG.
   * @param {number} sdpPoints The SDP ponts gained.
   * @param {JABS_Battler} battler The battler gaining the SDP points.
   */
  JABS_Engine.prototype.createSdpLog = function(sdpPoints, battler)
  {
    if (!J.LOG) return;

    // construct sdp log for the next step in this routine.
    const sdpLog = new ActionLogBuilder()
      .setupSdpAcquired(battler.battlerName(), sdpPoints)
      .build();
    $actionLogManager.addLog(sdpLog);
  };

  /**
   * Creates the log entry if using the J-LOG.
   * @param {string} sdpKey The SDP panel key that was unlocked.
   */
  JABS_Engine.prototype.createSdpUnlockLog = function(sdpKey)
  {
    if (!J.LOG) return;

    // construct sdp log for the next step in this routine.
    const sdpLog = new ActionLogBuilder()
      .setupSdpUnlocked(sdpKey)
      .build();
    $actionLogManager.addLog(sdpLog);
  };
}
//endregion JABS_Engine