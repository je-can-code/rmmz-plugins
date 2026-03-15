//region JABS_Battler
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

    // grab the AP amount from the enemy.
    const ap = enemy.apPoints();

    // if there is no AP, do nothing.
    if (ap === 0) return;

    // gain the AP.
    this.gainAptitudeReward(ap, actor, enemy);
  };

  /**
   * Gains AP from battle rewards.
   * @param {number} ap The AP to gain.
   * @param {JABS_Battler} actor The map battler that defeated the target.
   * @param {JABS_Battler} enemy The map battler that was defeated.
   */
  JABS_Engine.prototype.gainAptitudeReward = function(ap, actor, enemy)
  {
    // don't do anything if the enemy didn't grant any sdp points.
    if (ap === 0) return;

    // Award AP to the full party; per-actor distribution happens in ApManager.
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

        // generate the popup.
        this.generatePopAp(actualAp, jabsBattler.getCharacter());

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
    if (J.LEVEL && J.LEVEL.Metadata.enabled && J.APT.Metadata.usingLevelThresholdLimit === true)
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
   * Generates a popup.
   * @param {number} apPoints The amount to display.
   * @param {Game_Character} character The character to show the popup on.
   */
  JABS_Engine.prototype.generatePopAp = function(apPoints, character)
  {
    // if we are not using popups, then don't do this.
    if (!J.POPUPS) return;

    // generate the textpop.
    const apPop = new TextPopBuilder(apPoints)
      .isAptitude()
      .build();

    // add the pop to the caster's tracking.
    character.addTextPop(apPop);
    character.requestTextPop();
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