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

    // grab the sdp points value.
    let sdpPoints = enemy.sdpPoints();

    // if we have no points, then no point in continuing.
    if (!sdpPoints) return;

    // get the scaling multiplier if any exists.
    const levelMultiplier = this.getRewardScalingMultiplier(enemy, actor);

    // round up in favor of the player to skip decimals from the multiplier.
    sdpPoints = Math.ceil(sdpPoints * levelMultiplier);

    // gain the value calculated.
    this.gainSdpReward(sdpPoints, actor);

    // generate a log for the SDP gain.
    this.createSdpLog(sdpPoints, actor);
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

    // sdp points are obtained by all members in the party.
    $gameParty.members()
      .forEach(member => member.modSdpPoints(sdpPoints));

    // get the true amount obtained after multipliers for the leader.
    const sdpMultiplier = actor.getBattler()
      .sdpMultiplier();
    const multipliedSdpPoints = Math.round(sdpMultiplier * sdpPoints);

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

    const sdpLog = new ActionLogBuilder()
      .setupSdpUnlocked(sdpKey)
      .build();
    $actionLogManager.addLog(sdpLog);
  };
}
//endregion JABS_Engine