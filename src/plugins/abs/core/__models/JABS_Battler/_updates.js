//region updates
import JABS_Battler from './_initialization.js';
import JABS_AiManager from './../../managers/JABS_AiManager.js';
import JABS_Action from './../JABS_Action.js';
/**
 * Things that are battler-respective and should be updated on their own.
 */
JABS_Battler.prototype.update = function()
{
  // don't update map battlers if JABS is disabled.
  if (!$jabsEngine.absEnabled) return;

  this.updateCooldowns();
  this.updateTimers();
  this.updateEngagement();
  this.updateRegen();
  this.updateDodging();
  this.updateDeathHandling();
};

//region queued player actions
/**
 * Process any queued actions and execute them.
 */
JABS_Battler.prototype.processQueuedActions = function()
{
  // if we cannot process actions, then do not.
  if (!this.canProcessQueuedActions()) return;

  // gather the most recent decided action.
  const decidedActions = this.getDecidedAction();

  // grab the primary action for potential option lookups.
  const primaryAction = decidedActions.at(0);

  // initialize target coordinates as null to preserve legacy behavior if not resolved.
  let targetX = null;
  let targetY = null;

  // if we have a primary action, attempt to use decision-time location or resolve live.
  if (primaryAction)
  {
    // grab the action options for this action.
    const options = primaryAction.getActionOptions();

    // try to read a frozen target location from the options.
    const loc = options
      ? options.getTargetLocation()
      : null;

    // if a frozen location exists, extract coordinates from it.
    if (loc)
    {
      // extract the frozen coordinates.
      targetX = loc.getX();
      targetY = loc.getY();
    }

    // if we still don’t have coordinates, perform live resolution (legacy behavior).
    if (targetX === null || targetY === null)
    {
      // resolve the target coordinates for this action if applicable.
      const [ x, y ] = this.resolveDirectActionTargetCoordinates(primaryAction);

      // assign the resolved coordinates, if any.
      targetX = x;
      targetY = y;
    }
  }


  // execute the action.
  $jabsEngine.executeMapActions(this, decidedActions, targetX, targetY);

  // determine the core action associated with the action collection.
  const lastUsedSkill = decidedActions.at(0);

  // set the last skill used to be the skill we just used.
  this.setLastUsedSkillId(lastUsedSkill.getBaseSkill().id);

  // set the last slot used to be the slot of the skill we just used.
  this.setLastUsedSlot(lastUsedSkill.getCooldownType());

  // clear the queued action.
  this.clearDecidedAction();
};

/**
 * Check if we can process any queued actions.
 * @returns {boolean}
 */
JABS_Battler.prototype.canProcessQueuedActions = function()
{
  // check if we have an action decided.
  if (!this.isActionDecided()) return false;

  // check if we're still casting actions.
  if (this.isCasting()) return false;

  // validate that non-players are in-position.
  if (!this.isPlayer() && !this.isInPosition()) return false;

  // we can process all the actions!
  return true;
};

/**
 * Resolves the [x, y] coordinates to spatialize a direct action, if applicable.
 * If resolution is not applicable or not possible, returns [ null, null ].
 * @param {JABS_Action} primaryAction The primary action being executed.
 * @returns {[number|null, number|null]} The resolved [x, y] coordinates or [null, null].
 */
JABS_Battler.prototype.resolveDirectActionTargetCoordinates = function(primaryAction)
{
  // default the coordinates to nulls.
  let x = null;
  let y = null;

  // if there is no action or the action is not direct, do not resolve.
  if (!primaryAction || !primaryAction.isDirectAction()) return [ x, y ];

  // extract the underlying game action for scope checks.
  const gameAction = primaryAction.getAction();

  // if the action targets self, resolve to the caster's location.
  if (gameAction.isForUser())
  {
    // use the caster's current tile.
    x = this.getX();
    y = this.getY();

    // return the resolved coordinates.
    return [ x, y ];
  }

  // if the action targets allies, attempt to resolve using an ally target if available.
  if (gameAction.isForFriend())
  {
    // grab the ally target if supported.
    const allyTarget = this.getAllyTarget();

    // if an ally target exists, use their current tile.
    if (allyTarget)
    {
      x = allyTarget.getX();
      y = allyTarget.getY();

      // return the resolved coordinates.
      return [ x, y ];
    }
  }

  // otherwise, assume opponents (or everyone) and try to use our selected or last target.
  // prioritize the explicitly selected target.
  let opponentTarget = this.getTarget();

  // fallback to the last battler hit if no explicit target exists.
  if (!opponentTarget)
  {
    opponentTarget = this.getBattlerLastHit();
  }

  // if we have an opponent candidate, use their coordinates.
  if (opponentTarget)
  {
    x = opponentTarget.getX();
    y = opponentTarget.getY();
  }

  // return whatever we resolved (or nulls if not resolved).
  return [ x, y ];
};

/**
 * Resolves [x,y] for a direct skill at decision-time using the battler’s current/known target context.
 * Returns [null, null] if this is not applicable.
 * @param {RPG_Skill} skill The skill being decided.
 * @returns {[number|null, number|null]} The resolved coordinates, or [null, null].
 */
JABS_Battler.prototype.resolveDirectActionTargetCoordinatesForSkill = function(skill)
{
  // default to nulls.
  let x = null;
  let y = null;

  // if not a direct skill, do not resolve.
  if (!skill.jabsDirect) return [ x, y ];

  // create a temporary Game_Action to leverage scope helpers.
  const ga = new Game_Action(this.getBattler(), false);
  ga.setSkill(skill.id);

  // self-targeting anchors to caster.
  if (ga.isForUser())
  {
    // spatialize onto the caster.
    x = this.getX();
    y = this.getY();
    return [ x, y ];
  }

  // ally-targeting tries explicit ally target only.
  if (ga.isForFriend())
  {
    // grab any selected ally target.
    const allyTarget = this.getAllyTarget();

    // if found, use ally tile.
    if (allyTarget)
    {
      x = allyTarget.getX();
      y = allyTarget.getY();
      return [ x, y ];
    }

    // no ally target selected; do not guess a random ally.
    return [ x, y ];
  }

  // the proximity limit governs candidate range-gating and the fallback scan radius.
  const proximityLimit = skill.jabsProximity ?? 0;

  // read the optional state-anchor id for this skill.
  const stateTargetId = skill.jabsDirectStateTarget;

  // walk the four-tier priority chain: state-bearing target first, then
  // non-inanimate known target, then proximity scan, then inanimate fallback.
  const opponentTarget = this.resolveDirectTargetByState(stateTargetId, proximityLimit)
    ?? this.resolveDirectTargetNonInanimate(proximityLimit)
    ?? this.resolveDirectTargetViaScan(proximityLimit)
    ?? this.resolveDirectTargetInanimateFallback(proximityLimit);

  // freeze whichever target won the priority contest.
  if (opponentTarget)
  {
    x = opponentTarget.getX();
    y = opponentTarget.getY();
  }

  // return what we got (possibly nulls).
  return [ x, y ];
};

/**
 * Scans all battlers within proximity for the closest opponent currently afflicted
 * with the given state. This is the highest-priority tier for direct skills that
 * carry a <directStateTarget:N> tag, ensuring the skill snaps to the "pinned"
 * target before considering anything else in the chain.
 *
 * Proximity is always respected: a state-bearing target beyond the configured
 * range is never eligible.
 * @param {number|null} stateId The state ID to search for; null skips the scan entirely.
 * @param {number} proximityLimit The max tile distance allowed.
 * @returns {JABS_Battler|null} The closest state-bearing opponent within range, or null.
 */
JABS_Battler.prototype.resolveDirectTargetByState = function(stateId, proximityLimit)
{
  // if no state id is configured, there is nothing to scan for.
  if (!stateId) return null;

  // query the spatial index for all battlers within range.
  const nearby = JABS_AiManager.getBattlersWithinRange(this, proximityLimit);

  // find the closest opponent carrying the target state.
  let closest = null;
  let closestDistance = Infinity;

  for (const candidate of nearby)
  {
    // skip self and same-team battlers.
    if (candidate === this) continue;
    if (candidate.isEnemy() === this.isEnemy()) continue;

    // skip battlers not afflicted with the target state.
    if (!candidate.getBattler().isStateAffected(stateId)) continue;

    // track the closest qualifying candidate.
    const distance = this.distanceToDesignatedTarget(candidate);
    if (distance < closestDistance)
    {
      closestDistance = distance;
      closest = candidate;
    }
  }

  // return the closest found, or null if none qualify.
  return closest;
};

/**
 * Checks the explicit target and last-hit battler, returning the first one that is
 * non-inanimate and within the given proximity limit.
 * @param {number} proximityLimit The max tile distance allowed; 0 means uncapped.
 * @returns {JABS_Battler|null} The first qualifying non-inanimate known target, or null.
 */
JABS_Battler.prototype.resolveDirectTargetNonInanimate = function(proximityLimit)
{
  // evaluate getTarget() then getBattlerLastHit() in priority order.
  const known = [ this.getTarget(), this.getBattlerLastHit() ];

  for (const candidate of known)
  {
    // skip null slots and inanimate targets.
    if (!candidate || candidate.isInanimate()) continue;

    // skip candidates that fall outside the configured proximity cap.
    const distance = this.distanceToDesignatedTarget(candidate);
    if (proximityLimit !== 0 && distance > proximityLimit) continue;

    // first qualifying candidate wins.
    return candidate;
  }

  // no non-inanimate known target found within range.
  return null;
};

/**
 * Scans all battlers within {@link proximityLimit} tiles for the closest non-inanimate
 * opponent. Used when known targets are inanimate or out of range, so a direct skill
 * cannot accidentally lock onto a barrel while real enemies are nearby.
 * @param {number} proximityLimit The scan radius in tiles; returns null immediately when 0.
 * @returns {JABS_Battler|null} The closest qualifying opponent, or null.
 */
JABS_Battler.prototype.resolveDirectTargetViaScan = function(proximityLimit)
{
  // a limit of 0 means uncapped, which makes an exhaustive scan unsafe; skip it.
  if (proximityLimit === 0) return null;

  // query the spatial index for all battlers within range.
  const nearby = JABS_AiManager.getBattlersWithinRange(this, proximityLimit);

  // find the closest non-inanimate opponent among the candidates.
  let closest = null;
  let closestDistance = Infinity;

  for (const candidate of nearby)
  {
    // skip self, inanimate targets, and same-team battlers.
    if (candidate === this) continue;
    if (candidate.isInanimate()) continue;
    if (candidate.isEnemy() === this.isEnemy()) continue;

    // track the closest qualifying candidate.
    const distance = this.distanceToDesignatedTarget(candidate);
    if (distance < closestDistance)
    {
      closestDistance = distance;
      closest = candidate;
    }
  }

  // return the closest found, or null if the area is clear.
  return closest;
};

/**
 * Last-resort fallback: returns the explicit target or last-hit battler even if they are
 * inanimate, as long as they are within the proximity limit. This preserves intentional
 * use of direct skills on inanimate objects when no live opponents are present.
 * @param {number} proximityLimit The max tile distance allowed; 0 means uncapped.
 * @returns {JABS_Battler|null} The first known target within range, regardless of
 *   inanimate status, or null if none qualify.
 */
JABS_Battler.prototype.resolveDirectTargetInanimateFallback = function(proximityLimit)
{
  // prefer explicit target, then last-hit.
  const candidate = this.getTarget() ?? this.getBattlerLastHit();

  // no known candidate exists.
  if (!candidate) return null;

  // check the candidate falls within range.
  const distance = this.distanceToDesignatedTarget(candidate);
  if (proximityLimit !== 0 && distance > proximityLimit) return null;

  // return the inanimate candidate as the last resort.
  return candidate;
};
//endregion queued player actions

//region update cooldowns
/**
 * Updates all cooldowns for this battler.
 */
JABS_Battler.prototype.updateCooldowns = function()
{
  this.getBattler()
    .getSkillSlotManager()
    .updateCooldowns();
};
//endregion update cooldowns

//region update timers
/**
 * Updates all timers for this battler.
 */
JABS_Battler.prototype.updateTimers = function()
{
  this.processWaitTimer();
  this.processAlertTimer();
  this.processParryTimer();
  this.processLastHitTimer();
  this.processCombatTimer();
  this.processCastingTimer();
  this.processEngagementTimer();
};

/**
 * Updates the timer for "waiting".
 */
JABS_Battler.prototype.processWaitTimer = function()
{
  this._waitTimer.update();
};

/**
 * Updates the timer for "alerted".
 */
JABS_Battler.prototype.processAlertTimer = function()
{
  // if alerted, update the alert timer.
  if (this.isAlerted())
  {
    this.countdownAlert();
  }
};

/**
 * Updates the timer for "parrying".
 */
JABS_Battler.prototype.processParryTimer = function()
{
  // if parrying, update the parry timer.
  if (this.parrying())
  {
    this.getCharacter()
      .requestAnimation(131);
    this.countdownParryWindow();
  }
};

/**
 * Updates the timer for "last hit".
 */
JABS_Battler.prototype.processLastHitTimer = function()
{
  // if this battler has a last hit, update the last hit timer.
  if (this.hasBattlerLastHit())
  {
    this.countdownLastHit();
  }
};

/**
 * Updates the timer for "in combat".
 */
JABS_Battler.prototype.processCombatTimer = function()
{
  // if in combat, update the combat timer.
  if (this.isInCombat())
  {
    this.countdownCombat();
  }
};

/**
 * Updates the timer for "casting".
 */
JABS_Battler.prototype.processCastingTimer = function()
{
  // if casting, update the cast timer.
  if (this.isCasting())
  {
    // process the cast countdown.
    this.countdownCastTime();

    // check if we are no longer casting because we completed the cast timer.
    if (!this.isCasting())
    {
      this.onCastComplete();
    }
  }
};

/**
 * Hook triggered when an action's cast was completed.
 */
JABS_Battler.prototype.onCastComplete = function()
{
  // grab the primary decided action.
  const decidedActions = this.getDecidedAction();

  // if we somehow don't have an action, do not proceed.
  if (!decidedActions) return;

  // extract the primary action.
  const [ decidedAction, ] = decidedActions;

  // flag the action as having completed its cast time.
  decidedAction.completeCast();
};

/**
 * Updates the timer for "engagement".
 *
 * This is an important timer that prevents recalculating distances for all
 * battlers on the map every frame.
 */
JABS_Battler.prototype.processEngagementTimer = function()
{
  this._engagementTimer.update();
};
//endregion update timers

//region update engagement
/**
 * Monitors all other battlers and determines if they are engaged or not.
 */
JABS_Battler.prototype.updateEngagement = function()
{
  // ai engagement is blocked for players and while the game is paused.
  if (!this.canUpdateEngagement()) return;

  // grab the nearest target to this battler.
  const target = JABS_AiManager.getClosestOpposingBattler(this);

  // if we're unable to engage the target, do not engage.
  if (!this.canEngageTarget(target)) return;

  // determine the distance to the target from this battler.
  const distance = this.distanceToDesignatedTarget(target);

  // process engagement handling.
  this.handleEngagement(target, distance);

  // reset the engagement timer.
  this._engagementTimer.reset();
};

/**
 * If this battler is the player, a hidden battler, an inanimate battler, or the abs is paused, then
 * prevent engagement updates.
 * @returns {boolean}
 */
JABS_Battler.prototype.canUpdateEngagement = function()
{
  // if JABS is paused, we do not update engagement.
  if ($jabsEngine.absPause) return false;

  // the player cannot engage.
  if (this.isPlayer()) return false;

  // inanimate battlers cannot engage.
  if (this.isInanimate()) return false;

  // if the engagement timer is not ready, we cannot update.
  if (!this._engagementTimer.isTimerComplete()) return false;

  // if we're already engaged, no need to further update engagement- its confusing.
  if (this.isEngaged()) return false;

  // if we are unable to alter engagement, don't update engagement.
  if (this.isEngagementLocked()) return false;

  // engage!
  return true;
};

/**
 * Determines if this battler can engage the given target.
 * @param {JABS_Battler} target The potential target to engage.
 * @returns {boolean} True if we can engage this target, false otherwise.
 */
JABS_Battler.prototype.canEngageTarget = function(target)
{
  // you cannot engage with nothing.
  if (!target) return false;

  // you cannot engage with yourself.
  if (target.getUuid() === this.getUuid()) return false;

  // engage!
  return true;
};

/**
 * Process the engagement with the given target and distance.
 * @param {JABS_Battler} target The target in question for engagement.
 * @param {number} distance The distance between this battler and the target.
 */
JABS_Battler.prototype.handleEngagement = function(target, distance)
{
  // check if we're already engaged.
  if (this.isEngaged())
  {
    // if engaged already, check if maybe we should now disengage.
    if (this.shouldDisengage(target, distance))
    {
      // disengage combat with the target.
      this.disengageTarget();
    }
  }
  // we aren't engaged yet.
  else
  {
    // check if we should now engage this target based on the given distance.
    if (this.shouldEngage(target, distance))
    {
      // engage in combat with the target.
      this.engageTarget(target);
    }
  }
};

/**
 * Determines whether or not this battler should disengage from it's target.
 * @param {JABS_Battler} target The target to potentially disengage from.
 * @param {number} distance The distance in number of tiles.
 * @returns {boolean}
 */
JABS_Battler.prototype.shouldDisengage = function(target, distance)
{
  // check if we're out of pursuit range with this target.
  const isOutOfRange = !this.inPursuitRange(target, distance);

  // return the findings.
  return isOutOfRange;
};

/**
 * Determines whether or not this battler should engage to the nearest target.
 * @param {JABS_Battler} target The target to potentially engage.
 * @param {number} distance The distance in number of tiles.
 * @returns {boolean}
 */
JABS_Battler.prototype.shouldEngage = function(target, distance)
{
  // check if we're in range of sight with the target.
  const isInSightRange = this.inSightRange(target, distance);
  if (isInSightRange === false) return false;

  // sentinels only pick up targets within their home territory; this mirrors the
  // leash check in hasSentinelTargetExceededHomeRange so engage and leash use the
  // same reference point and never produce an immediate engage-then-disengage cycle.
  if (this.getBattlerRole().sentinel)
  {
    const distanceFromHome = target.distanceToPoint(this.getHomeX(), this.getHomeY());
    if (distanceFromHome > this.getSightRadius()) return false;
  }

  return true;
};
//endregion update engagement

//region update dodging
/**
 * Updates the dodge skill.
 */
JABS_Battler.prototype.updateDodging = function()
{
  // if we cannot update dodge, do not.
  if (!this.canUpdateDodge()) return;

  // cancel the dodge if we got locked down.
  this.handleDodgeCancel();

  // force dodge move while dodging.
  this.handleDodgeMovement();

  // if the dodge is over, end the dodging.
  this.handleDodgeEnd();
};

/**
 * Determine whether or not this battler can update its dodging.
 * @returns {boolean}
 */
JABS_Battler.prototype.canUpdateDodge = function()
{
  // followers/enemies run the same dodge step + endDodge cleanup as the leader once executeDodgeSkill fires.
  // gating on isPlayer() prevented endDodge from ever running for allies, leaving dodge speed stuck on forever.
  return this.isDodging();
};

/**
 * Handles the ending of dodging if the battler is interrupted.
 */
JABS_Battler.prototype.handleDodgeCancel = function()
{
  // check if we really should cancel dodging.
  if (!this.shouldCancelDodge()) return;

  // end the dodging.
  this.endDodge();
};

/**
 * Checks if we should cancel the dodge.
 * @returns {boolean}
 */
JABS_Battler.prototype.shouldCancelDodge = function()
{
  // if the battler cannot move, then we should cancel dodging.
  if (!this.canBattlerMove()) return true;

  // nothing is canceling the dodge.
  return false;
};

/**
 * Handles the forced movement while dodging.
 */
JABS_Battler.prototype.handleDodgeMovement = function()
{
  // update the iframes for the dodge.
  this.updateDodgeIFrames()

  // if we cannot dodge move, do not.
  if (!this.canDodgeMove()) return;

  // perform the movement.
  this.executeDodgeMovement();
};

/**
 * Updates the dodge iframes, and applies windowed invincibility.
 */
JABS_Battler.prototype.updateDodgeIFrames = function()
{
  // only process i‑frames while actively dodging.
  if (!this.isDodging()) return;

  // advance the dodge frames.
  this.incrementDodgeFrame();

  // grab the iframes window.
  const iframesWindow = this.getDodgeIFrames();

  // if there isn't an iframe window, then don't update them.
  if (iframesWindow === null) return;

  // destructure the iframe window into its start and end frames.
  const [ startF, endF ] = iframesWindow;

  // grab the current frame.
  const currentFrame = this.getDodgeFrame();

  // apply windowed invincibility.
  const inWindow = (currentFrame >= startF && currentFrame <= endF);
  this.setInvincible(inWindow);
};

/**
 * Determines whether or not this character can be forced to dodge move.
 * @returns {boolean}
 */
JABS_Battler.prototype.canDodgeMove = function()
{
  // if the character is currently moving, don't dodge move.
  if (this.getCharacter()
    .isMoving())
  {
    return false;
  }

  // if the battler cannot move, don't dodge move.
  if (!this.canBattlerMove()) return false;

  // if we are out of dodge steps, don't dodge move.
  if (this.getDodgeSteps() <= 0) return false;

  // if we are not dodging, don't dodge move.
  if (!this.isDodging()) return false;

  // we can dodge move!
  return true;
};

/**
 * Performs the forced dodge movement in the direction of the dodge.
 */
JABS_Battler.prototype.executeDodgeMovement = function()
{
  const character = this.getCharacter();
  const direction = this.getDodgeDirection();

  // move the character based on their direction.
  if (character.isDiagonalDirection(direction))
  {
    character.moveDiagonally(direction);
  }
  else if (character.isStraightDirection(direction))
  {
    character.moveStraight(direction);
  }


  // reduce the dodge steps.
  this.decrementDodgeSteps();
};

/**
 * Handles the conclusion of the dodging if necessary.
 */
JABS_Battler.prototype.handleDodgeEnd = function()
{
  // keep i‑frames evaluated every tick even if we didn’t step this frame.
  this.updateDodgeIFrames();

  // check if we even should end the dodge.
  if (!this.shouldEndDodge()) return;

  // conclude the dodge.
  this.endDodge();
};

/**
 * Determines wehether or not to end the dodging.
 * @returns {boolean}
 */
JABS_Battler.prototype.shouldEndDodge = function()
{
  // if we are out of dodge steps and we're done moving, end the dodge.
  if (this.getDodgeSteps() <= 0 && !this.getCharacter()
    .isMoving())
  {
    return true;
  }

  // KEEP DODGING.
  return false;
};

/**
 * Stops the dodge and resets the values to default.
 */
JABS_Battler.prototype.endDodge = function()
{
  // stop the dodge.
  this.setDodging(false);

  // set dodge steps to 0 regardless of what they are.
  this.setDodgeSteps(0);

  // disable the invincibility from dodging.
  this.setInvincible(false);

  // explicitly clear the dodge speed modifier to avoid residual boosts.
  this.getCharacter().setDodgeModifier(0);

  // reset the dodge frames.
  this.setDodgeFrame(0);

  // reset the dodge Iframes.
  this.setDodgeIFrames(0);
};
//endregion update dodging

//region update death handling
/**
 * Handles when this enemy battler is dying.
 */
JABS_Battler.prototype.updateDeathHandling = function()
{
  // don't do this for actors/players.
  if (this.isActor()) return;

  // do nothing if we are waiting.
  if (this.isWaiting()) return;

  // if the event is erased officially, ignore it.
  if (this.getCharacter()
    .isErased())
  {
    return;
  }

  // if we are dying, self-destruct.
  if (this.isDying() && !$gameMap.isEventRunning())
  {
    this.destroy();
  }
};
//endregion update death handling
//endregion updates