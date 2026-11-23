//region JABS_Engine
/**
 * Whether or not there is a request issued for rendering refreshed allies.
 * @type {boolean}
 */
Object.defineProperty(JABS_Engine.prototype, "requestAlliesRefresh", {
  value: false,
  writeable: true,
});

/**
 * Extends {@link JABS_Engine.prePartyCycling}.<br/>
 * Jumps all followers to the player upon party cycling.
 */
J.ABS.EXT.ALLYAI.Aliased.JABS_Engine.set('prePartyCycling', JABS_Engine.prototype.prePartyCycling);
JABS_Engine.prototype.prePartyCycling = function()
{
  // perform original logic.
  J.ABS.EXT.ALLYAI.Aliased.JABS_Engine.get('prePartyCycling')
    .call(this);

  // when cycling, jump all followers to the player.
  $gamePlayer.jumpFollowersToMe();
};

/**
 * Overwrites {@link JABS_Engine.handlePartyCycleMemberChanges}.<br/>
 * Jumps all followers to the player upon party cycling.
 */
J.ABS.EXT.ALLYAI.Aliased.JABS_Engine.set(
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
  J.ABS.EXT.ALLYAI.Aliased.JABS_Engine.get('handlePartyCycleMemberChanges')
    .call(this);

  // Defer ally rebuild to after sprite rebind; let the sprite layer trigger it.
  $jabsEngine.requestAlliesRefresh = true;
};

/**
 * Extends {@link JABS_Engine.continuedPrimaryBattleEffects}.<br/>
 * Also applies battle memories as-necessary.
 */
J.ABS.EXT.ALLYAI.Aliased.JABS_Engine.set(
  'continuedPrimaryBattleEffects',
  JABS_Engine.prototype.continuedPrimaryBattleEffects);
JABS_Engine.prototype.continuedPrimaryBattleEffects = function(action, target)
{
  // perform original logic.
  J.ABS.EXT.ALLYAI.Aliased.JABS_Engine.get('continuedPrimaryBattleEffects')
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
  if (!this.canApplyBattleMemories(target)) return;

  // generate the new battle memory of the action and its result for the target.
  const elementRate = action.getAction()
    .calculateRawElementRate(target.getBattler());

  const newMemory = new JABS_BattleMemory(
    target.getBattlerId(),
    action.getBaseSkill().id,
    elementRate,
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

/**
 * Rebuilds all actor allies bound to followers after party cycling.
 * Ensures ex-leaders (now followers) regain proper ally core (sight/pursuit) and
 * are bound to their follower characters for correct isPlayer/isFollower state.
 */
JABS_Engine.prototype.rebuildActorAllies = function()
{
  // grab all followers in order; follower index aligns to party members beyond leader.
  const followers = $gamePlayer.followers()
    .data();

  // convert the followers into JABS battlers using the canonical helper.
  const allyBattlers = JABS_AiManager.convertFollowersToBattlers(followers);

  // register or update all ally battlers in the AI manager.
  JABS_AiManager.addOrUpdateBattlers(allyBattlers);
};

/**
 * Extends {@link #postPartyCycling}.<br/>
 * Also rebuilds allies so they can be correctly aligned with the proper battler data.
 */
J.ABS.EXT.ALLYAI.Aliased.JABS_Engine.set('postPartyCycling', JABS_Engine.prototype.postPartyCycling);
JABS_Engine.prototype.postPartyCycling = function()
{
  // perform original logic.
  J.ABS.EXT.ALLYAI.Aliased.JABS_Engine.get('postPartyCycling').call(this);

  // rebuild all actor allies (followers) so they have proper ally core and character binding.
  this.rebuildActorAllies();
};
/**
 * Extends {@link JABS_Engine#canBeAlerted}.<br/>
 * Do-nothing allies cannot be alerted; they ignore attacks passively. Neither can allies pulling back, who
 * would otherwise be dragged straight back toward the fight they were just told to leave.
 */
J.ABS.EXT.ALLYAI.Aliased.JABS_Engine.set('canBeAlerted', JABS_Engine.prototype.canBeAlerted);
JABS_Engine.prototype.canBeAlerted = function(attacker, battler)
{
  // perform original logic.
  if (!J.ABS.EXT.ALLYAI.Aliased.JABS_Engine.get('canBeAlerted').call(this, attacker, battler)) return false;

  // do-nothing allies should not be alerted.
  if (battler.isActor())
  {
    const allyAI = battler.getAllyAiMode();
    if (allyAI && allyAI.isDoNothing()) return false;

    // allies pulling back stay out of it until the order runs out.
    if (battler.isPullingBack()) return false;
  }

  return true;
};

/**
 * Extends {@link JABS_Engine#processOnHitEffects}.<br/>
 * Also rallies the leader's allies whenever the leader lands a hit or takes one.
 */
J.ABS.EXT.ALLYAI.Aliased.JABS_Engine.set('processOnHitEffects', JABS_Engine.prototype.processOnHitEffects);
JABS_Engine.prototype.processOnHitEffects = function(action, target)
{
  // perform original logic.
  J.ABS.EXT.ALLYAI.Aliased.JABS_Engine.get('processOnHitEffects')
    .call(this, action, target);

  // a hit involving the leader calls the party to it.
  const caster = action.getCaster();
  this.rallyAlliesForLeaderHit(caster, target);
};

/**
 * Rallies the leader's allies toward the other side of a hit the leader was part of.
 *
 * Every stance answers the leader: whatever an ally would otherwise wait for, the leader striking
 * something or being struck sends it toward the fight. A hit that did not involve the leader rallies
 * nobody; an ally that was struck itself is alerted by the hit as usual.
 * @param {JABS_Battler} caster The battler who landed the hit.
 * @param {JABS_Battler} target The battler who took the hit.
 */
JABS_Engine.prototype.rallyAlliesForLeaderHit = function(caster, target)
{
  // player1 is the leader in JABS.
  const leader = this.getPlayer1();

  // the leader landing a blow rallies the party toward whatever it hit.
  if (caster === leader)
  {
    this.rallyAlliesToward(target);
    return;
  }

  // the leader taking a blow rallies the party toward whoever threw it.
  if (target === leader)
  {
    this.rallyAlliesToward(caster);
  }
};

/**
 * Rallies every ally on the field toward a foe.
 * @param {JABS_Battler} foe The battler the allies are rallied toward.
 */
JABS_Engine.prototype.rallyAlliesToward = function(foe)
{
  // each ally on the field answers on its own.
  $gameMap.getFollowerBattlers()
    .forEach(ally => this.rallyAllyToward(ally, foe));
};

/**
 * Rallies a single ally toward a foe, by alerting it to where that foe stands.
 *
 * Being rallied is being alerted: the ally heads toward the foe until something is in sight, then fights
 * it, exactly as it would after being struck. Whatever an ally cannot be alerted by, it is not rallied by
 * either, which is how a healed friend or a smashed crate rallies nobody, and how an ally already fighting
 * keeps to its own fight. The alert is raised quietly, with neither the balloon nor the startled pause a
 * hit brings, because the ally is answering its leader rather than being caught off guard.
 * @param {JABS_Battler} ally The ally being rallied.
 * @param {JABS_Battler} foe The battler the ally is rallied toward.
 */
JABS_Engine.prototype.rallyAllyToward = function(ally, foe)
{
  // only an ally this foe could alert is rallied by it.
  if (!this.canBeAlerted(foe, ally)) return;

  // point the ally at where the foe stands, for as long as an alert lasts.
  ally.setAlertedCoordinates(foe.getX(), foe.getY());
  ally.setAlertedCounter(ally.getAlertDuration());
};
//endregion JABS_Engine