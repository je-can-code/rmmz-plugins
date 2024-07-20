//region reference helpers
/**
 * Reassigns the character to something else.
 * @param {Game_Event|Game_Player|Game_Follower} newCharacter The new character to assign.
 */
JABS_Battler.prototype.setCharacter = function(newCharacter)
{
  this._event = newCharacter;
};

/**
 * Gets the battler's name.
 * @returns {string}
 */
JABS_Battler.prototype.battlerName = function()
{
  return this.getBattlerDatabaseData().name;
};

/**
 * Events that have no actual conditions associated with them may have a -1 index.
 * Ignore that if that's the case.
 */
JABS_Battler.prototype.hasEventActions = function()
{
  // only events can have event commands.
  if (!this.isEvent()) return false;

  const event = this.getCharacter();
  return event._pageIndex !== -1;
};

/**
 * Destroys this battler by removing it from tracking and erasing the character.
 */
JABS_Battler.prototype.destroy = function()
{
  // set the battler as invincible to prevent further hitting.
  this.setInvincible();

  // remove the battler from tracking.
  JABS_AiManager.removeBattler(this);

  // grab the character.
  const character = this.getCharacter();

  // erase the underlying character.
  character.erase();

  // flag the sprite for removal.
  character.setActionSpriteNeedsRemoving();
};

/**
 * Reveals this battler onto the map.
 */
JABS_Battler.prototype.revealHiddenBattler = function()
{
  this._hidden = false;
};

/**
 * Hides this battler from the current battle map.
 */
JABS_Battler.prototype.hideBattler = function()
{
  this._hidden = true;
};

/**
 * Whether or not this battler is hidden on the current battle map.
 */
JABS_Battler.prototype.isHidden = function()
{
  return this._hidden;
};

/**
 * Whether or not this battler is in a state of dying.
 * @returns {boolean}
 */
JABS_Battler.prototype.isDying = function()
{
  return this._dying;
};

/**
 * Sets whether or not this battler is in a state of dying.
 * @param {boolean} dying The new state of dying.
 */
JABS_Battler.prototype.setDying = function(dying)
{
  this._dying = dying;
};

/**
 * Calculates whether or not this battler should continue fighting it's target.
 * @param {JABS_Battler} target The target we're trying to see.
 * @param {number} distance The distance from this battler to the target.
 * @returns {boolean}
 */
JABS_Battler.prototype.inPursuitRange = function(target, distance)
{
  // grab the current pursuit radius.
  let pursuitRadius = this.getPursuitRadius();

  // apply the modification from the actor, if any.
  const visionMultiplier = target.getBattler()
    .getVisionModifier();

  // apply the multiplier to the base.
  pursuitRadius *= visionMultiplier;

  // return whether or not we're in range.
  return (distance <= pursuitRadius);
};

/**
 * Calculates whether or not this battler should engage the nearest battler.
 * @param {JABS_Battler} target The target we're trying to see.
 * @param {number} distance The distance from this battler to the target.
 * @returns {boolean}
 */
JABS_Battler.prototype.inSightRange = function(target, distance)
{
  // grab the sight for this battler.
  const sightRadius = this.getSightRadius();

  // apply the modification from the actor, if any.
  const modifiedSight = this.applyVisionMultiplier(target, sightRadius);

  // determine whether or not the target is in sight.
  const isInSightRange = (distance <= modifiedSight);

  // return the answer.
  return isInSightRange;
};

/**
 * Determines whether or not this battler is "out of range" of a given target.
 * At or beyond the designated range usually results in dropping cognition of one another.
 * @param {JABS_Battler} target The target to check if within range of.
 * @returns {boolean} True if this battler is out of range of the target, false otherwise.
 */
JABS_Battler.prototype.outOfRange = function(target)
{
  // if the target is invalid, then they are out of range.
  if (!target) return true;

  // if they are actually out of update range, then they are out of range.
  if (this.distanceToDesignatedTarget(target) > JABS_AiManager.maxAiRange) return true;

  // they are not out of range.
  return false;
};

/**
 * Applies the vision multiplier against the base vision radius in question.
 * @param {JABS_Battler} target The target we're trying to see.
 * @param {number} originalRadius The original vision radius.
 */
JABS_Battler.prototype.applyVisionMultiplier = function(target, originalRadius)
{
  // get this battler's vision multiplier factor.
  const visionMultiplier = target.getBattler()
    .getVisionModifier();

  // calculate the new radius.
  const modifiedVisionRadius = (originalRadius * visionMultiplier);

  // return our calculation.
  return modifiedVisionRadius;
};

/**
 * Gets this battler's unique identifier.
 * @returns {string}
 */
JABS_Battler.prototype.getUuid = function()
{
  // if there is problems with the battler, return nothing.
  if (!this.getBattler()) return String.empty;

  return this.getBattler()
    .getUuid();
};

/**
 * Gets whether or not this battler has any pending actions decided
 * by this battler's leader.
 */
JABS_Battler.prototype.hasLeaderDecidedActions = function()
{
  // if you don't have a leader, you don't perform the actions.
  if (!this.hasLeader()) return false;

  return this._leaderDecidedAction;
};

/**
 * Gets the next skill id from the queue of leader-decided actions.
 * Also removes it from the current queue.
 * @returns {number}
 */
JABS_Battler.prototype.getNextLeaderDecidedAction = function()
{
  const action = this._leaderDecidedAction;
  this.clearLeaderDecidedActionsQueue();
  return action;
};

/**
 * Adds a new action decided by the leader for the follower to perform.
 * @param {number} skillId The skill id decided by the leader.
 */
JABS_Battler.prototype.setLeaderDecidedAction = function(skillId)
{
  this._leaderDecidedAction = skillId;
};

/**
 * Clears all unused leader-decided actions that this follower had pending.
 */
JABS_Battler.prototype.clearLeaderDecidedActionsQueue = function()
{
  this._leaderDecidedAction = null;
};

/**
 * Gets the leader's `uuid` of this battler.
 */
JABS_Battler.prototype.getLeader = function()
{
  return this._leaderUuid;
};

/**
 * Gets the battler for this battler's leader.
 * @returns {JABS_Battler}
 */
JABS_Battler.prototype.getLeaderBattler = function()
{
  if (this._leaderUuid)
  {
    return JABS_AiManager.getBattlerByUuid(this._leaderUuid);
  }

  return null;

};

/**
 * Sets the `uuid` of the leader of this battler.
 * @param {string} newLeader The leader's `uuid`.
 */
JABS_Battler.prototype.setLeader = function(newLeader)
{
  const leader = JABS_AiManager.getBattlerByUuid(newLeader);
  if (leader)
  {
    this._leaderUuid = newLeader;
    leader.addFollower(this.getUuid());
  }
};

/**
 * Gets whether or not this battler has a leader.
 * Only battlers with the ai-trait of `follower` can have leaders.
 * @returns {boolean}
 */
JABS_Battler.prototype.hasLeader = function()
{
  return !!this._leaderUuid;
};

/**
 * Gets all followers associated with this battler.
 * Only leaders can have followers.
 * @return {string[]} The `uuid`s of all followers.
 */
JABS_Battler.prototype.getFollowers = function()
{
  return this._followers;
};

/**
 * Gets the whole battler of the follower matching the `uuid` provided.
 * @param {string} followerUuid The `uuid` of the follower to find.
 * @returns {JABS_Battler}
 */
JABS_Battler.prototype.getFollowerByUuid = function(followerUuid)
{
  // if we don't have followers, just return null.
  if (!this.hasFollowers()) return null;

  // search through the followers to find the matching battler.
  const foundUuid = this._followers.find(uuid => uuid === followerUuid);
  if (foundUuid)
  {
    return JABS_AiManager.getBattlerByUuid(foundUuid);
  }

  return null;

};

/**
 * Adds a follower to the leader's collection.
 * @param {string} newFollowerUuid The new uuid of the follower now being tracked.
 */
JABS_Battler.prototype.addFollower = function(newFollowerUuid)
{
  const found = this.getFollowerByUuid(newFollowerUuid);
  if (found)
  {
    console.error("this follower already existed within the follower list.");
  }
  else
  {
    this._followers.push(newFollowerUuid);
  }
};

/**
 * Removes the follower from
 * @param {string} oldFollowerUuid The `uuid` of the follower to remove from tracking.
 */
JABS_Battler.prototype.removeFollower = function(oldFollowerUuid)
{
  const index = this._followers.indexOf(uuid => uuid === oldFollowerUuid);
  if (index !== -1)
  {
    this._followers.splice(index, 1);
  }
  else
  {
    console.error("could not find follower to remove from the list.", oldFollowerUuid);
  }
};

/**
 * Clears all current followers from this battler.
 */
JABS_Battler.prototype.clearFollowers = function()
{
  // first de-assign leadership from all followers for this leader...
  this._followers.forEach(followerUuid =>
  {
    $gameMap.clearLeaderDataByUuid(followerUuid);
  });

  // ...then empty the collection.
  this._followers.splice(0, this._followers.length);
};

/**
 * Removes this follower's leader.
 */
JABS_Battler.prototype.clearLeader = function()
{
  // get the leader's uuid for searching.
  const leaderUuid = this.getLeader();
  // if found, remove this follower from that leader.
  if (leaderUuid)
  {
    const uuid = this.getUuid();
    // in some instances, "this" may not be alive anymore so handle that.
    if (!uuid) return;

    const leader = JABS_AiManager.getBattlerByUuid(leaderUuid);
    if (!leader) return;

    leader.removeFollowerByUuid(uuid);
  }
};

/**
 * Removes a follower from it's current leader.
 * @param {string} uuid The `uuid` of the follower to remove from the leader.
 */
JABS_Battler.prototype.removeFollowerByUuid = function(uuid)
{
  const index = this._followers.indexOf(uuid);
  if (index !== -1)
  {
    this._followers.splice(index, 1);
  }
};

/**
 * Removes the leader data from this battler.
 */
JABS_Battler.prototype.clearLeaderData = function()
{
  this.setLeader("");
  this.clearLeaderDecidedActionsQueue();
};

/**
 * Gets whether or not this battler has followers.
 * Only battlers with the AI trait of "leader" will have followers.
 * @returns {boolean}
 */
JABS_Battler.prototype.hasFollowers = function()
{
  // if you're not a leader, you can't have followers.
  if (!this.getAiMode().leader) return false;

  return this._followers.length > 0;
};

/**
 * Gets the database data for this battler.
 * @returns {RPG_Actor|RPG_Enemy} The battler data.
 */
JABS_Battler.prototype.getBattlerDatabaseData = function()
{
  // if somehow we don't have a battler, return an empty object.
  if (!this.getBattler()) return {};

  //
  return this.getBattler()
    .databaseData();
};

/**
 * Determines if this battler is facing its target.
 * @param {Game_Character} target The target `Game_Character` to check facing for.
 */
JABS_Battler.prototype.isFacingTarget = function(target)
{
  const userDir = this.getCharacter()
    .direction();
  const targetDir = target.direction();

  switch (userDir)
  {
    case J.ABS.Directions.DOWN:
      return targetDir === J.ABS.Directions.UP;
    case J.ABS.Directions.UP:
      return targetDir === J.ABS.Directions.DOWN;
    case J.ABS.Directions.LEFT:
      return targetDir === J.ABS.Directions.RIGHT;
    case J.ABS.Directions.RIGHT:
      return targetDir === J.ABS.Directions.LEFT;
  }

  return false;
};

/**
 * Whether or not this battler is actually the `Game_Player`.
 * @returns {boolean}
 */
JABS_Battler.prototype.isPlayer = function()
{
  return this.getCharacter()
    .isPlayer();
};

/**
 * Whether or not this battler is a `Game_Actor`.
 * The player counts as a `Game_Actor`, too.
 * @returns {boolean}
 */
JABS_Battler.prototype.isActor = function()
{
  return (this.isPlayer() || this.getBattler() instanceof Game_Actor)
};

/**
 * Whether or not this battler is based on a follower.
 * @returns {boolean}
 */
JABS_Battler.prototype.isFollower = function()
{
  return this.getCharacter()
    .isFollower();
};

/**
 * Whether or not this battler is a `Game_Enemy`.
 * @returns {boolean}
 */
JABS_Battler.prototype.isEnemy = function()
{
  return (this.getBattler() instanceof Game_Enemy);
};

/**
 * Whether or not this battler is based on an event.
 * @returns {boolean}
 */
JABS_Battler.prototype.isEvent = function()
{
  return this.getCharacter()
    .isEvent();
};

/**
 * Compares the user with a provided target team to see if they are the same.
 * @param {number} targetTeam The id of the team to check.
 * @returns {boolean} True if the user and target are on the same team, false otherwise.
 */
JABS_Battler.prototype.isSameTeam = function(targetTeam)
{
  return (this.getTeam() === targetTeam);
};

/**
 * Gets whether or not the provided target team is considered "friendly".
 * @param {number} targetTeam The id of the team to check.
 * @returns {boolean}
 */
JABS_Battler.prototype.isFriendlyTeam = function(targetTeam)
{
  // TODO: parameterize in objects what are "opposing" teams.
  return [ this.getTeam() ].includes(targetTeam);
};

/**
 * Gets whether or not the provided target team is considered "opposing".
 * @param {number} targetTeam The id of the team to check.
 * @returns {boolean}
 */
JABS_Battler.prototype.isOpposingTeam = function(targetTeam)
{
  // TODO: parameterize in objects what are "friendly" teams.
  return !(targetTeam === this.getTeam());
  //return [].includes(targetTeam);
};

/**
 * Gets this battler's team id.
 * @returns {number}
 */
JABS_Battler.prototype.getTeam = function()
{
  return this._team;
};

/**
 * Gets the phase of battle this battler is currently in.
 * The player does not have any phases.
 * @returns {number} The phase this `JABS_Battler` is in.
 */
JABS_Battler.prototype.getPhase = function()
{
  return this._phase;
};

/**
 * Gets whether or not this battler is invincible.
 * @returns {boolean}
 */
JABS_Battler.prototype.isInvincible = function()
{
  return this._invincible;
};

/**
 * Gets whether or not this battler is inanimate.
 * @returns {boolean}
 */
JABS_Battler.prototype.isInanimate = function()
{
  return this._inanimate;
};

/**
 * Sets this battler to be invincible, rendering them unable to be collided
 * with by map actions of any kind.
 * @param {boolean} invincible True if uncollidable, false otherwise (default: true).
 */
JABS_Battler.prototype.setInvincible = function(invincible = true)
{
  this._invincible = invincible;
};

/**
 * Sets the phase of battle that this battler should be in.
 * @param {number} newPhase The new phase the battler is entering.
 */
JABS_Battler.prototype.setPhase = function(newPhase)
{
  this._phase = newPhase;
};

/**
 * Resets the phase of this battler back to one and resets all flags.
 */
JABS_Battler.prototype.resetPhases = function()
{
  this.setPhase(1);
  this._prepareReady = false;
  this._prepareCounter = 0;
  this._postActionCooldownComplete = false;
  this.setDecidedAction(null);
  this.setAllyTarget(null);
  this.setInPosition(false);
};

/**
 * Gets whether or not this battler is in position for a given skill.
 * @returns {boolean}
 */
JABS_Battler.prototype.isInPosition = function()
{
  return this._inPosition;
};

/**
 * Sets this battler to be identified as "in position" to execute their
 * decided skill.
 * @param {boolean} inPosition
 */
JABS_Battler.prototype.setInPosition = function(inPosition = true)
{
  this._inPosition = inPosition;
};

/**
 * Gets whether or not this battler has decided an action.
 * @returns {boolean}
 */
JABS_Battler.prototype.isActionDecided = function()
{
  return this._decidedAction !== null;
};

/**
 * Gets the battler's decided action.
 * @returns {JABS_Action[]|null}
 */
JABS_Battler.prototype.getDecidedAction = function()
{
  return this._decidedAction;
};

/**
 * Sets this battler's decided action to this action.
 * @param {JABS_Action[]} action The action this battler has decided on.
 */
JABS_Battler.prototype.setDecidedAction = function(action)
{
  this._decidedAction = action;
};

/**
 * Clears this battler's decided action.
 */
JABS_Battler.prototype.clearDecidedAction = function()
{
  this._decidedAction = null;
};

/**
 * Resets the idle action back to a not-ready state.
 */
JABS_Battler.prototype.resetIdleAction = function()
{
  this._idleActionReady = false;
};

/**
 * Returns the `Game_Character` that this `JABS_Battler` is bound to.
 * For the player, it'll return a subclass instead: `Game_Player`.
 * @returns {Game_Event|Game_Player|Game_Follower} The event this `JABS_Battler` is bound to.
 */
JABS_Battler.prototype.getCharacter = function()
{
  return this._event;
};

/**
 * Returns the `Game_Battler` that this `JABS_Battler` represents.
 *
 * This may be either a `Game_Actor`, or `Game_Enemy`.
 * @returns {Game_Actor|Game_Enemy} The `Game_Battler` this battler represents.
 */
JABS_Battler.prototype.getBattler = function()
{
  return this._battler;
};

/**
 * Gets whether or not the underlying battler is dead.
 * @returns {boolean} True if they are dead, false otherwise.
 */
JABS_Battler.prototype.isDead = function()
{
  return this.getBattler()
    .isDead();
};

/**
 * Whether or not the event is actually loaded and valid.
 * @returns {boolean} True if the event is valid (non-player) and loaded, false otherwise.
 */
JABS_Battler.prototype.isEventReady = function()
{
  const character = this.getCharacter();
  if (character instanceof Game_Player)
  {
    return false;
  }

  return !!character.event();

};

/**
 * The radius a battler of a different team must enter to cause this unit to engage.
 * @returns {number} The sight radius for this `JABS_Battler`.
 */
JABS_Battler.prototype.getSightRadius = function()
{
  let sight = this._sightRadius;
  if (this.isAlerted())
  {
    sight += this._alertedSightBoost;
  }

  return sight;
};

/**
 * The maximum distance a battler of a different team may reach before this unit disengages.
 * @returns {number} The pursuit radius for this `JABS_Battler`.
 */
JABS_Battler.prototype.getPursuitRadius = function()
{
  let pursuit = this._pursuitRadius;
  if (this.isAlerted())
  {
    pursuit += this._alertedPursuitBoost;
  }

  return pursuit;
};

/**
 * Sets whether or not this battler is engaged.
 * @param {boolean} isEngaged Whether or not this battler is engaged.
 */
JABS_Battler.prototype.setEngaged = function(isEngaged)
{
  this._engaged = isEngaged;
};

/**
 * Whether or not this `JABS_Battler` is currently engaged in battle with a target.
 * @returns {boolean} Whether or not this battler is engaged.
 */
JABS_Battler.prototype.isEngaged = function()
{
  return this._engaged;
};

/**
 * Engage battle with the target battler.
 * @param {JABS_Battler} target The target this battler is engaged with.
 */
JABS_Battler.prototype.engageTarget = function(target)
{
  // this battler cannot engage with targets right now.
  if (this.isEngagementLocked()) return;

  // enable engagement.
  this.setIdle(false);
  this.setEngaged(true);

  // setup the target and their aggro.
  this.setTarget(target);
  this.addUpdateAggro(target.getUuid(), 0);

  // check if this is an actor-based character.
  if (this.isActor())
  {
    // disable walking through walls while the follower is engaged.
    this.getCharacter()
      .setThrough(false);
  }

  // if we're alerted, also clear the alert state.
  this.clearAlert();

  // TODO: abstract this.
  this.showBalloon(J.ABS.Balloons.Exclamation);
};

/**
 * Disengage from the target.
 */
JABS_Battler.prototype.disengageTarget = function()
{
  // clear any targeting.
  this.setTarget(null);
  this.setAllyTarget(null);

  // disable being engaged.
  this.setEngaged(false);

  // disable the alert when disengaging.
  this.clearAlert();

  // remove leader/follower data.
  this.clearFollowers();
  this.clearLeaderData();

  // forget decided action.
  this.clearDecidedAction();

  // reset all the phases back to default.
  this.resetPhases();

  // TODO: abstract this.
  //this.showBalloon(J.ABS.Balloons.Frustration);
};

/**
 * Gets whether or not this battler is currently barred from engagement.
 * @returns {boolean}
 */
JABS_Battler.prototype.isEngagementLocked = function()
{
  return this._engagementLock;
};

/**
 * Locks engagement.
 * Disables the ability for this battler to acquire a target and do battle.
 */
JABS_Battler.prototype.lockEngagement = function()
{
  this._engagementLock = true;
};

/**
 * Unlocks engagement.
 * Allows this battler to engage with targets and do battle.
 */
JABS_Battler.prototype.unlockEngagement = function()
{
  this._engagementLock = false;
};

/**
 * Gets the current target of this battler.
 * @returns {JABS_Battler|null}
 */
JABS_Battler.prototype.getTarget = function()
{
  return this._target;
};

/**
 * Sets the target of this battler.
 * @param {JABS_Battler} newTarget The new target.
 */
JABS_Battler.prototype.setTarget = function(newTarget)
{
  this._target = newTarget;
};

/**
 * Gets the last battler struck by this battler.
 * @returns {JABS_Battler}
 */
JABS_Battler.prototype.getBattlerLastHit = function()
{
  if (this._lastHit && this._lastHit.isDead())
  {
    // if the last hit battler was defeated or something, remove it.
    this.setBattlerLastHit(null);
  }

  return this._lastHit;
};

/**
 * Sets the last battler struck by this battler.
 * @param {JABS_Battler} battlerLastHit The battler that is being set as last struck.
 */
JABS_Battler.prototype.setBattlerLastHit = function(battlerLastHit)
{
  this._lastHit = battlerLastHit;

  // the player-controlled character cannot have a target by normal means due
  // to them not being controlled by AI. However, their "last hit" is basically
  // the same thing, so assign their target as well.
  if (this.isPlayer())
  {
    this.setTarget(this._lastHit);
  }
};

/**
 * Gets whether or not this has a last battler hit currently stored.
 * @returns {boolean}
 */
JABS_Battler.prototype.hasBattlerLastHit = function()
{
  return !!this.getBattlerLastHit();
};

/**
 * Clears the last battler hit tracker from this battler.
 */
JABS_Battler.prototype.clearBattlerLastHit = function()
{
  this.setBattlerLastHit(null);
  this.setLastBattlerHitCountdown(0);

  // when clearing the last battler hit, also remove the player's target that
  // was likely added via the above function of "setBattlerLastHit".
  if (this.isPlayer())
  {
    this.setTarget(null);
  }
};

/**
 * Sets the last battler hit countdown.
 * @param {number} duration The duration in frames (60/s).
 */
JABS_Battler.prototype.setLastBattlerHitCountdown = function(duration = 900)
{
  this._lastHitCountdown = duration;
};

/**
 * Counts down the last hit counter.
 * @returns {boolean}
 */
JABS_Battler.prototype.countdownLastHit = function()
{
  if (this._lastHitCountdown <= 0)
  {
    this._lastHitCountdown = 0;
    if (this.hasBattlerLastHit())
    {
      this.clearBattlerLastHit();
    }
  }

  if (this._lastHitCountdown > 0)
  {
    this._lastHitCountdown--;
  }
};

/**
 * Gets whether or not this battler is dead inside.
 * @returns {boolean}
 */
JABS_Battler.prototype.isDead = function()
{
  const battler = this.getBattler();

  if (!battler)
  { // has no battler.
    return true;
  }
  else if (!JABS_AiManager.getBattlerByUuid(battler.getUuid()))
  { // battler isn't on the map.
    return true;
  }
  else if (battler.isDead() || this.isDying())
  { // battler is actually dead.
    return true;
  }
  // battler is OK!
  return false;

};

/**
 * Gets the current allied target of this battler.
 * @returns {JABS_Battler}
 */
JABS_Battler.prototype.getAllyTarget = function()
{
  return this._allyTarget;
};

/**
 * Sets the allied target of this battler.
 * @param {JABS_Battler} newAlliedTarget The new target.
 */
JABS_Battler.prototype.setAllyTarget = function(newAlliedTarget)
{
  this._allyTarget = newAlliedTarget;
};

/**
 * Determines the distance from this battler and the point.
 * @param {number|null} x2 The x coordinate to check.
 * @param {number|null} y2 The y coordinate to check.
 * @returns {number|null} The distance from the battler to the point.
 */
JABS_Battler.prototype.distanceToPoint = function(x2, y2)
{
  if ((x2 ?? y2) === null) return null;
  const x1 = this.getX();
  const y1 = this.getY();
  const distance = Math.hypot(x2 - x1, y2 - y1)
    .toFixed(2);
  return parseFloat(distance);
};

/**
 * Determines distance from this battler and the target.
 * @param {JABS_Battler} target The target that this battler is checking distance against.
 * @returns {number|null} The distance from this battler to the provided target.
 */
JABS_Battler.prototype.distanceToDesignatedTarget = function(target)
{
  if (!target) return null;

  return this.distanceToPoint(target.getX(), target.getY());
};

/**
 * Determines distance from this battler and the current target.
 * @returns {number|null} The distance.
 */
JABS_Battler.prototype.distanceToCurrentTarget = function()
{
  const target = this.getTarget();
  if (!target) return null;

  return this.distanceToPoint(target.getX(), target.getY());
};

/**
 * Determines distance from this battler and the current ally target.
 * @returns {number|null} The distance.
 */
JABS_Battler.prototype.distanceToAllyTarget = function()
{
  const target = this.getAllyTarget();
  if (!target) return null;

  return this.distanceToPoint(target.getX(), target.getY());
};

/**
 * A shorthand reference to the distance this battler is from it's home.
 * @returns {number} The distance.
 */
JABS_Battler.prototype.distanceToHome = function()
{
  return this.distanceToPoint(this._homeX, this._homeY);
};

/**
 * Gets whether or not this battler will move around while idle.
 * @returns {boolean}
 */
JABS_Battler.prototype.canIdle = function()
{
  return this._canIdle;
};

/**
 * Gets whether or not this battler should show its hp bar.
 * @returns {boolean}
 */
JABS_Battler.prototype.showHpBar = function()
{
  return this._showHpBar;
};

/**
 * Gets whether or not this battler should show its name.
 * @returns {boolean}
 */
JABS_Battler.prototype.showBattlerName = function()
{
  return this._showBattlerName;
};

/**
 * Gets whether or not this battler is in an `alerted` state.
 * @returns {boolean} True if this battler is alerted, false otherwise.
 */
JABS_Battler.prototype.isAlerted = function()
{
  return this._alerted;
};

/**
 * Sets the alerted state for this battler.
 * @param {boolean} alerted The new alerted state (default = true).
 */
JABS_Battler.prototype.setAlerted = function(alerted = true)
{
  this._alerted = alerted;
};

/**
 * Gets whether or not this battler is in an `alerted` state.
 * @returns {number} The duration remaining for this alert state.
 */
JABS_Battler.prototype.getAlertDuration = function()
{
  return this._alertDuration;
};

/**
 * Sets the alerted counter to this number of frames.
 * @param {number} alertedFrames The duration in frames for how long to be alerted.
 */
JABS_Battler.prototype.setAlertedCounter = function(alertedFrames)
{
  this._alertedCounter = alertedFrames;
  if (this._alertedCounter > 0)
  {
    this.setIdle(false);
    this.setAlerted();
  }
  else if (this._alertedCounter <= 0)
  {
    this.setAlerted(false);
  }
};

/**
 * Gets the alerted coordinates.
 * @returns {[number, number]} The `[x, y]` of the alerter.
 */
JABS_Battler.prototype.getAlertedCoordinates = function()
{
  return this._alertedCoordinates;
};

/**
 * Sets the alerted coordinates.
 * @param {number} x The `x` of the alerter.
 * @param {number} y The `y` of the alerter.
 */
JABS_Battler.prototype.setAlertedCoordinates = function(x, y)
{
  this._alertedCoordinates = [ x, y ];
};

/**
 * Whether or not this battler is at it's home coordinates.
 * @returns {boolean} True if the battler is home, false otherwise.
 */
JABS_Battler.prototype.isHome = function()
{
  return (this._event.x === this._homeX && this._event.y === this._homeY);
};

/**
 * Returns the X coordinate of the event portion's initial placement.
 * @returns {number} The X coordinate of this event's home.
 */
JABS_Battler.prototype.getHomeX = function()
{
  return this._homeX;
};

/**
 * Returns the Y coordinate of the event portion's initial placement.
 * @returns {number} The Y coordinate of this event's home.
 */
JABS_Battler.prototype.getHomeY = function()
{
  return this._homeY;
};

/**
 * Returns the X coordinate of the event.
 * @returns {number} The X coordinate of this event.
 */
JABS_Battler.prototype.getX = function()
{
  return this.getCharacter()._realX;
};

/**
 * Returns the Y coordinate of the event.
 * @returns {number} The Y coordinate of this event.
 */
JABS_Battler.prototype.getY = function()
{
  return this.getCharacter()._realY;
};

/**
 * Retrieves the AI associated with this battler.
 * @returns {JABS_EnemyAI} This battler's AI.
 */
JABS_Battler.prototype.getAiMode = function()
{
  return this._aiMode;
};

/**
 * Gets this follower's leader's AI.
 * @returns {JABS_EnemyAI} This battler's leader's AI.
 */
JABS_Battler.prototype.getLeaderAiMode = function()
{
  // if we don't have a leader, don't.
  if (!this.hasLeader()) return null;

  const leader = JABS_AiManager.getBattlerByUuid(this.getLeader());
  if (!leader) return null;

  return leader.getAiMode();
};

/**
 * Tries to move this battler away from its current target.
 * This may fail if the battler is pinned in a corner or something.
 */
JABS_Battler.prototype.moveAwayFromTarget = function()
{
  const battler = this.getCharacter();
  const target = this.getTarget();
  if (!target) return;
  const character = target.getCharacter();

  battler.moveAwayFromCharacter(character);
};

/**
 * Tries to move this battler away from its current target.
 *
 * There is no pathfinding away, but if its not able to move directly
 * away, it will try a different direction to wiggle out of corners.
 */
JABS_Battler.prototype.smartMoveAwayFromTarget = function()
{
  const battler = this.getCharacter();
  const target = this.getTarget();
  if (!target) return;

  battler.moveAwayFromCharacter(target.getCharacter());
  if (!battler.isMovementSucceeded())
  {
    const threatDir = battler.reverseDir(battler.direction());
    let newDir = (Math.randomInt(4) + 1) * 2;
    while (newDir === threatDir)
    {
      newDir = (Math.randomInt(4) + 1) * 2;
    }
    battler.moveStraight(newDir);
  }
};

/**
 * Tries to move this battler towards its current target.
 */
JABS_Battler.prototype.smartMoveTowardTarget = function()
{
  const target = this.getTarget();
  if (!target) return;

  this.smartMoveTowardCoordinates(target.getX(), target.getY());
};

/**
 * Tries to move this battler towards its ally target.
 */
JABS_Battler.prototype.smartMoveTowardAllyTarget = function()
{
  const target = this.getAllyTarget();
  if (!target) return;

  this.smartMoveTowardCoordinates(target.getX(), target.getY());
};

/**
 * Tries to move this battler toward a set of coordinates.
 * @param {number} x The `x` coordinate to reach.
 * @param {number} y The `y` coordinate to reach.
 */
JABS_Battler.prototype.smartMoveTowardCoordinates = function(x, y)
{
  const character = this.getCharacter();
  const nextDir = CycloneMovement
    ? character.findDirectionTo(x, y)
    : character.findDiagonalDirectionTo(x, y);

  if (character.isDiagonalDirection(nextDir))
  {
    const horzvert = character.getDiagonalDirections(nextDir);
    character.moveDiagonally(horzvert[0], horzvert[1]);
  }
  else
  {
    character.moveStraight(nextDir);
  }
};

/**
 * Turns this battler towards it's current target.
 */
JABS_Battler.prototype.turnTowardTarget = function()
{
  const character = this.getCharacter();
  const target = this.getTarget();
  if (!target) return;

  character.turnTowardCharacter(target.getCharacter());
};

/**
 * Whether or not the battler is able to use attacks based on states.
 * @returns {boolean} True if the battler can attack, false otherwise.
 */
JABS_Battler.prototype.canBattlerUseAttacks = function()
{
  const states = this.getBattler()
    .states();
  if (!states.length)
  {
    return true;
  }

  const disabled = states.find(state => (state.jabsDisarmed || state.jabsParalyzed));
  return !disabled;

};

/**
 * Whether or not the battler is able to use skills based on states.
 * @returns {boolean} True if the battler can use skills, false otherwise.
 */
JABS_Battler.prototype.canBattlerUseSkills = function()
{
  const states = this.getBattler()
    .states();
  if (!states.length)
  {
    return true;
  }

  const muted = states.find(state => (state.jabsMuted || state.jabsParalyzed));
  return !muted;

};

/**
 * Gets the skill id of the last skill that this battler executed.
 * @returns {number}
 */
JABS_Battler.prototype.getLastUsedSkillId = function()
{
  return this._lastUsedSkillId;
};

/**
 * Sets the skill id of the last skill that this battler executed.
 * @param {number} skillId The skill id of the last skill used.
 */
JABS_Battler.prototype.setLastUsedSkillId = function(skillId)
{
  this._lastUsedSkillId = skillId;
};

/**
 * Gets the key of the last used slot.
 * @returns {string}
 */
JABS_Battler.prototype.getLastUsedSlot = function()
{
  return this._lastUsedSlot;
};

/**
 * Sets the last used slot to the given slot key.
 * @param {string} slotKey The key of the last slot used.
 */
JABS_Battler.prototype.setLastUsedSlot = function(slotKey)
{
  this._lastUsedSlot = slotKey;
};

/**
 * Gets the id of the battler associated with this battler
 * that has been assigned via the battler core data.
 * @returns {number}
 */
JABS_Battler.prototype.getBattlerId = function()
{
  return this._battlerId;
};

/**
 * Gets the skill id of the next combo action in the sequence.
 * @returns {number} The skill id of the next combo action.
 */
JABS_Battler.prototype.getComboNextActionId = function(cooldownKey)
{
  const nextComboId = this.getBattler()
    .getSkillSlotManager()
    .getSlotComboId(cooldownKey);

  return nextComboId;
};

/**
 * Sets the skill id for the next combo action in the sequence.
 * @param {string} cooldownKey The cooldown key to check readiness for.
 * @param {number} nextComboId The skill id for the next combo action.
 */
JABS_Battler.prototype.setComboNextActionId = function(cooldownKey, nextComboId)
{
  this.getBattler()
    .getSkillSlotManager()
    .setSlotComboId(cooldownKey, nextComboId);
};

/**
 * Determines whether or not at least one slot has a combo skill id pending.
 * @returns {boolean} True if at least one slot's combo skill id is pending, false otherwise.
 */
JABS_Battler.prototype.hasComboReady = function()
{
  return this.getBattler()
    .getSkillSlotManager()
    .getAllSlots()
    .some(slot => slot.comboId !== 0);
};

/**
 * Gets all skills that are available to this enemy battler.
 * These skills disclude "extend" skills and non-combo-starter skills.
 * @returns {number[]} The skill ids available to this enemy.
 */
JABS_Battler.prototype.getSkillIdsFromEnemy = function()
{
  // grab the database data for this enemy.
  const battlerActions = this.getBattler()
    .enemy().actions;

  // a filter function for building the skill to check if it should be filtered.
  const filtering = action =>
  {
    // determine the skill of this action.
    const skill = this.getBattler()
      .skill(action.skillId);

    // determine if we're keeping it.
    const keep = this.aiSkillFilter(skill);

    // return what we found out.
    return keep;
  };

  // determine the valid actions available for this enemy.
  const validActions = battlerActions.filter(filtering, this);

  // extract all the skill ids of the actions.
  const validSkillIds = validActions.map(action => action.skillId);

  // return the list of filtered skill ids this battler can use.
  return validSkillIds;
};

/**
 * Determine whether or not this skill is a valid skill for selection by the {@link JABS_AiManager}.<br>
 * @param {RPG_Skill} skill The skill being verified.
 * @returns {boolean} True if the skill is chooseable by the AI "at random", false otherwise.
 */
JABS_Battler.prototype.aiSkillFilter = function(skill)
{
  // extract the combo data points.
  const { jabsComboAction, jabsComboStarter, jabsAiSkillExclusion, isSkillExtender } = skill;

  // this skill is explicitly excluded from the skill pool.
  if (jabsAiSkillExclusion) return false;

  // skill extender skills are excluded from the skill pool.
  if (isSkillExtender) return false;

  // determine if this skill is a combo action.
  const isCombo = !!jabsComboAction;

  // determine if this skill is a combo starter.
  const isComboStarter = !!jabsComboStarter;

  // we can only include combo starter combo skills.
  const isNonComboStarterSkill = (isCombo && !isComboStarter);

  // combo skills that are not combo starters are excluded from the skill pool.
  if (isNonComboStarterSkill) return false;

  // valid skill!
  return true;
};

/**
 * Retrieves the skillId of the basic attack for this enemy.
 * @returns {number} The skillId of the basic attack.
 */
JABS_Battler.prototype.getEnemyBasicAttack = function()
{
  return this.getBattler()
    .basicAttackSkillId();
};

/**
 * Gets all skill ids that this battler has access to, including the basic attack.
 * @returns {number[]}
 */
JABS_Battler.prototype.getAllSkillIdsFromEnemy = function()
{
  // grab all the added skills.
  const skills = this.getSkillIdsFromEnemy();

  // grab this enemy's basic attack.
  const basicAttackSkillId = this.getEnemyBasicAttack();

  // add the basic attack to the list of skills.
  skills.push(basicAttackSkillId);

  // return the built list.
  return skills;
};

/**
 * Gets the number of additional/bonus hits per basic attack.
 * Skills (such as magic) do not receive bonus hits at this time.
 * @param {RPG_Skill} skill The skill to consider regarding bonus hits.
 * @param {boolean} isBasicAttack True if this is a basic attack, false otherwise.
 * @returns {number} The number of bonus hits per attack.
 */
JABS_Battler.prototype.getAdditionalHits = function(skill, isBasicAttack)
{
  let bonusHits = 0;
  const battler = this.getBattler();
  if (isBasicAttack)
  {
    // TODO: split "basic attack" bonus hits from "skill" and "all" bonus hits.
    bonusHits += battler.getBonusHits();
    if (skill.repeats > 1)
    {
      bonusHits += skill.repeats - 1;
    }
  }
  else
  {
    // check for skills that may have non-pierce-related bonus hits?
  }

  return bonusHits;
};

/**
 * Forces a display of a emoji balloon above this battler's head.
 * @param {number} balloonId The id of the balloon to display on this character.
 */
JABS_Battler.prototype.showBalloon = function(balloonId)
{
  $gameTemp.requestBalloon(this._event, balloonId);
};

/**
 * Displays an animation on the battler.
 * @param {number} animationId The id of the animation to play on the battler.
 */
JABS_Battler.prototype.showAnimation = function(animationId)
{
  this.getCharacter()
    .requestAnimation(animationId);
};

/**
 * Checks if there is currently an animation playing on this character.
 * @returns {boolean} True if there is an animation playing, false otherwise.
 */
JABS_Battler.prototype.isShowingAnimation = function()
{
  return this.getCharacter()
    .isAnimationPlaying();
};
//endregion reference helpers
