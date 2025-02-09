//region JABS_Engine
/**
 * Extends {@link JABS_Engine.prePartyCycling}.<br>
 * Jumps all followers to the player upon party cycling.
 */
J.ABS.EXT.ALLYAI.Aliased.Game_BattleMap.set('prePartyCycling', JABS_Engine.prototype.prePartyCycling);
JABS_Engine.prototype.prePartyCycling = function()
{
  // perform original logic.
  J.ABS.EXT.ALLYAI.Aliased.Game_BattleMap.get('prePartyCycling')
    .call(this);

  // when cycling, jump all followers to the player.
  $gamePlayer.jumpFollowersToMe();
};

/**
 * Overrides {@link JABS_Engine.handlePartyCycleMemberChanges}.<br>
 * Jumps all followers to the player upon party cycling.
 */
J.ABS.EXT.ALLYAI.Aliased.Game_BattleMap.set(
  'handlePartyCycleMemberChanges',
  JABS_Engine.prototype.handlePartyCycleMemberChanges);
JABS_Engine.prototype.handlePartyCycleMemberChanges = function()
{
  // grab the current data for removing after to prevent duplicate players.
  const formerLeader = $gameParty.leaderJabsBattler();

  // check to make sure we have a leader.
  if (formerLeader)
  {
    // remove the former leader to make room for them as a follower!
    JABS_AiManager.removeBattler(formerLeader);
  }

  // perform original logic, updating the player to the latest.
  J.ABS.EXT.ALLYAI.Aliased.Game_BattleMap.get('handlePartyCycleMemberChanges')
    .call(this);

  // rebuild all allies.
  $gameMap.updateAllies();
};

/**
 * Extends {@link JABS_Engine.continuedPrimaryBattleEffects}.<br>
 * Also applies battle memories as-necessary.
 */
J.ABS.EXT.ALLYAI.Aliased.Game_BattleMap.set(
  'continuedPrimaryBattleEffects',
  JABS_Engine.prototype.continuedPrimaryBattleEffects);
JABS_Engine.prototype.continuedPrimaryBattleEffects = function(action, target)
{
  // perform original logic.
  J.ABS.EXT.ALLYAI.Aliased.Game_BattleMap.get('continuedPrimaryBattleEffects')
    .call(this, action, target);

  // apply the battle memories to the target.
  const result = target.getBattler()
    .result();
  this.applyBattleMemories(result, action, target);
};

/**
 * Applies battle memories against the target based on the action being impacted.
 * @param result
 * @param action
 * @param target
 */
JABS_Engine.prototype.applyBattleMemories = function(result, action, target)
{
  // only apply if allowed.
  if (this.canApplyBattleMemories(target)) return;

  // generate the new battle memory of the action and its result for the target.
  const newMemory = new JABS_BattleMemory(
    target.getBattlerId(),
    action.getBaseSkill().id,
    action.getAction()
      .calculateRawElementRate(target.getBattler()),
    result.hpDamage);

  // determine the one who who executed the action.
  const attacker = action.getCaster();

  // save the memory of the action execution to the caster.
  attacker.applyBattleMemories(newMemory);
};

/**
 * Determines whether or not battle memories should be applied to the target.
 * @param {JABS_Battler} target The target battler to potentially apply abttle memories to.
 * @returns {boolean}
 */
JABS_Engine.prototype.canApplyBattleMemories = function(target)
{
  // enemies do not use battle memories like ally AI does.
  if (target.isEnemy()) return false;

  // apply the memories!
  return true;
};
//endregion JABS_Engine