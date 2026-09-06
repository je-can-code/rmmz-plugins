//region JABS_AiManager

/**
 * Extends {@link #executeAi}.<br/>
 * Enforces a functional leash for keeping ally battlers close in the execute loop.
 * @param {JABS_Battler} battler The battler executing on the AI mode.
 */
J.ABS.EXT.ALLYAI.Aliased.JABS_AiManager.set('executeAi', JABS_AiManager.executeAi);
JABS_AiManager.executeAi = function(battler)
{
  // check if this is an ally.
  if (battler.isActor())
  {
    // resolve the current leader battler; player1 is the leader in JABS.
    const leader = $jabsEngine.getPlayer1();

    // apply leash/rubberband rules relative to the leader; exit on corrective action.
    if (this.maintainLeashAndEngagement(battler, leader)) return;
  }

  // perform original logic.
  J.ABS.EXT.ALLYAI.Aliased.JABS_AiManager.get('executeAi')
    .call(this, battler);
};

/**
 * Extends {@link #aiPhase0}.<br/>
 * Also accommodates the possibility of actors having an idle phase.
 * @param {JABS_Battler} battler The batter to decide for.
 */
J.ABS.EXT.ALLYAI.Aliased.JABS_AiManager.set('aiPhase0', JABS_AiManager.aiPhase0);
JABS_AiManager.aiPhase0 = function(battler)
{
  // check if this is an enemy's ai being managed.
  if (battler.isEnemy())
  {
    // perform original logic for enemies.
    J.ABS.EXT.ALLYAI.Aliased.JABS_AiManager.get('aiPhase0')
      .call(this, battler);
  }
  // it must be an ally.
  else
  {
    // process ally idle phase.
    this.allyAiPhase0(battler);
  }
};

/**
 * Decides what to do for allies in their idle phase.
 * When not alerted/engaged, allies follow the leader in a loose formation.
 * @param {JABS_Battler} allyBattler The ally battler.
 */
JABS_AiManager.allyAiPhase0 = function(allyBattler)
{
  // always enforce follower passability policy while Ally AI controls the follower.
  this.enforceFollowerThroughPolicy(allyBattler);

  // check if we can perform phase 0 logic for allies.
  if (!this.canPerformAllyPhase0(allyBattler)) return;

  // do-nothing allies ignore alert state entirely and stay in formation.
  const allyAI = allyBattler.getAllyAiMode();
  const isDoNothing = allyAI && allyAI.isDoNothing();

  // if alerted (and not in do-nothing mode), seek toward the alerter location first.
  if (!isDoNothing && allyBattler.isAlerted())
  {
    // move toward the alert coordinates.
    this.seekForAlerter(allyBattler);

    // stop processing.
    return;
  }

  // otherwise, perform intelligent follow behavior when idle.
  this.allyFollowLeader(allyBattler);
};

/**
 * Enforces the passability policy for JABS-controlled followers.
 * While gathering, allow through (vanilla regroup). Otherwise, disable through so
 * AI-driven movement respects terrain.
 * @param {JABS_Battler} allyBattler The follower battler.
 */
JABS_AiManager.enforceFollowerThroughPolicy = function(allyBattler)
{
  // acquire the character and sanity-check it is a follower.
  const chr = allyBattler.getCharacter();
  if (!chr || !chr.isFollower()) return;

  // detect gather/regroup state from the followers wrapper.
  const followers = $gamePlayer.followers();
  const isGathering = followers && followers.areGathering();

  // while gathering, allow through for quick regroup.
  if (isGathering)
  {
    chr.setThrough(true);
    return;
  }

  // not gathering: disable through so terrain passability is enforced.
  chr.setThrough(false);
};

/**
 * Determines whether or not the ally can do phase 0 things.
 * @param {JABS_Battler} allyBattler The ally battler.
 * @returns {boolean} True if this ally can do phase 0 things, false otherwise.
 */
JABS_AiManager.canPerformAllyPhase0 = function(allyBattler)
{
  // we do not idle while casting.
  if (allyBattler.isCastingOrChanneling()) return false;

  // we do not idle while engaged in combat.
  if (allyBattler.isEngaged()) return false;

  // perform!
  return true;
};

/**
 * Causes an ally to follow their leader (player1) intelligently while idle.
 * Uses a small formation offset per follower index, a leash, and keeps spacing.
 * @param {JABS_Battler} allyBattler The ally battler to reposition.
 */
JABS_AiManager.allyFollowLeader = function(allyBattler)
{
  // resolve the current leader battler; player1 is the leader in JABS.
  const leader = $jabsEngine.getPlayer1();

  // if we lack a leader or cannot move, do not attempt to follow.
  if (!leader) return;

  // apply leash/rubberband rules relative to the leader; exit on corrective action.
  if (this.maintainLeashAndEngagement(allyBattler, leader)) return;

  // if the ally cannot move, do not follow.
  if (!allyBattler.canBattlerMove()) return;

  // determine follower index to choose a formation slot.
  const followerIndex = this.getFollowerIndexFromBattler(allyBattler);

  // resolve the current formation type.
  // TODO: resolve this from persisted game_system or maybe game_party?
  const formationType = $gameParty.getPartyFormation();

  // compute the desired slot tile for this follower based on formation.
  const coords = this.computeFormationTarget(leader, followerIndex, formationType);
  const [ desiredX, desiredY ] = coords;

  // attempt to move toward the desired formation slot if needed.
  this.moveTowardSlotIfNeeded(allyBattler, desiredX, desiredY);
};

/**
 * Applies leash rules to keep allies reasonably near the leader.
 * Returns true if a corrective action (like jump) occurred this frame.
 * @param {JABS_Battler} allyBattler The ally battler.
 * @param {JABS_Battler} leaderBattler The leader battler.
 * @returns {boolean} True if a corrective action occurred, false otherwise.
 */
JABS_AiManager.maintainLeashAndEngagement = function(allyBattler, leaderBattler)
{
  // compute distance from ally to leader.
  //
  // this is euclidean because everything else that measures a battler against the world- sight,
  // pursuit, spacing, the AI management sweep- is euclidean. $gameMap.distance is manhattan, and
  // mixing the two put the leash on a scale of its own: it over-reports a diagonal by up to 41%,
  // so an ally walking a diagonal was hauled back from a distance a straight-line walk was allowed
  // to keep. with diagonal movement being the common case, the leash read as far shorter than the
  // number configuring it.
  const distanceToLeader = allyBattler.distanceToDesignatedTarget(leaderBattler);

  // determine leash threshold (spacing-axis-scaled per ally).
  const leash = allyBattler.getAllyLeashRange();

  // if the ally is too far, disengage and rubberband back to the leader.
  if (distanceToLeader > leash)
  {
    // Jump to the leader instantly and disengage
    this.rubberbandAlly(allyBattler);

    // signal we executed a corrective action.
    return true;
  }

  // if back within half the leash, allow normal engagement again.
  if (distanceToLeader <= Math.round(leash / 2))
  {
    // re-enable engaging.
    allyBattler.unlockEngagement();
  }

  // no corrective action occurred.
  return false;
};

/**
 * Rubber bands the ally back to the leader/player.
 * @param {JABS_Battler} allyBattler The ally battler to rubber band.
 */
JABS_AiManager.rubberbandAlly = function(allyBattler)
{
  // prevent accidental far-away engagements.
  allyBattler.lockEngagement();
  allyBattler.disengageTarget();
  allyBattler.resetAllAggro(null, true);

  // Jump to the leader instantly.
  const allyCharacter = allyBattler.getCharacter();
  const leader = $jabsEngine.getPlayer1();
  const lx = Math.floor(leader.getX());
  const ly = Math.floor(leader.getY());

  // relocate directly to the leader's tile to guarantee a successful rubberband.
  allyCharacter.locate(lx, ly);
};

/**
 * Resolves the follower index for a battler bound to a Game_Follower.
 * @param {JABS_Battler} allyBattler The ally battler to resolve index for.
 * @returns {number} The zero-based follower index; -1 if not found.
 */
JABS_AiManager.getFollowerIndexFromBattler = function(allyBattler)
{
  // grab the character for this battler.
  const character = allyBattler.getCharacter();

  // if this is not a follower, there is no index.
  if (!character || !character.isFollower()) return -1;

  // gather the current followers list.
  const followers = $gamePlayer.followers()
    .data();

  // return the index (may be -1 if unexpected).
  return followers.indexOf(character);
};

/**
 * Computes the absolute map tile for a follower’s formation slot.
 * Offsets are defined assuming the leader faces DOWN (2); they will be rotated to match current facing.
 * @param {JABS_Battler} leaderBattler The leader battler.
 * @param {number} followerIndex The index of the follower (0-based).
 * @param {string} formationType The formation type key.
 * @returns {[number, number]} The [x, y] tile target for this follower.
 */
JABS_AiManager.computeFormationTarget = function(leaderBattler, followerIndex, formationType)
{
  // cycle index through available slots.
  const idx = Math.max(0, followerIndex);

  // get offsets for the selected formation type (baseline: leader facing DOWN).
  const offsets = this.getFormationOffsets(formationType);

  // choose offset for this follower.
  const chosen = offsets[idx % offsets.length];
  const [ ox, oy ] = chosen;

  // derive the leader's current facing.
  const dir = leaderBattler.getCharacter()
    .direction();

  // rotate the baseline offset to the leader's current facing.
  const rotated = this.rotateOffsetForFacing(ox, oy, dir);
  const [ rx, ry ] = rotated;

  // leader tile coords.
  const lx = Math.floor(leaderBattler.getX());
  const ly = Math.floor(leaderBattler.getY());

  // return slot coords.
  return this.calculateFormationSlotCoordinates(lx, rx, ly, ry);
};

/**
 * Gets the array of [x,y] tile offsets for the requested formation type.
 * Offsets are relative to the leader's current tile.
 * @param {string} formationKey The formation type key.
 * @returns {number[][]} The list of offsets.
 */
JABS_AiManager.getFormationOffsets = function(formationKey)
{
  // identify the formation in question.
  const foundFormation = J.ABS.EXT.ALLYAI.Metadata.FormationTypes
    .find(formation => formation.key === formationKey) ?? J.ABS.EXT.ALLYAI.Metadata.FormationTypes[0];

  // resolve and return offsets.
  return foundFormation.formation;
};

/**
 * Calculates the formation slot's coordinates based on the given parameters.
 * @param {number} lx The leader's x coordinate.
 * @param {number} rx The rotated x.
 * @param {number} ly The leader's y coordinate.
 * @param {number} ry The rotated y.
 * @returns {[number, number]}
 */
JABS_AiManager.calculateFormationSlotCoordinates = function(lx, rx, ly, ry)
{
  // compute absolute slot tile by applying the rotated offset.
  const sx = lx + rx;
  const sy = ly + ry;

  // return slot coords.
  return [ sx, sy ];
};

/**
 * Rotates a baseline offset [ox, oy] (assumed for leader facing DOWN) into the space of the given facing.
 * Directions follow RMMZ standard: 2=down, 4=left, 6=right, 8=up.
 * @param {number} ox The baseline x-offset (facing DOWN).
 * @param {number} oy The baseline y-offset (facing DOWN).
 * @param {2|4|6|8} dir The leader's current facing direction.
 * @returns {[number, number]} The rotated offset [x, y].
 */
JABS_AiManager.rotateOffsetForFacing = function(ox, oy, dir)
{
  // switch on the current facing to rotate the baseline-down offset.
  switch (dir)
  {
    // facing DOWN: identity transform.
    case 2:
      return [ ox, oy ];

    // facing LEFT: rotate +90 degrees (CCW): (x, y) -> (-y, x).
    case 4:
      return [ -oy, ox ];

    // facing RIGHT: rotate -90 degrees (CW): (x, y) -> (y, -x).
    case 6:
      return [ oy, -ox ];

    // facing UP: rotate 180 degrees: (x, y) -> (-x, -y).
    case 8:
      return [ -ox, -oy ];

    // unsupported/unknown direction: default to identity.
    default:
      return [ ox, oy ];
  }
};

/**
 * Issues a smart move toward the designated slot if outside tolerance and able to move.
 * @param {JABS_Battler} allyBattler The ally battler.
 * @param {number} desiredX The desired slot x.
 * @param {number} desiredY The desired slot y.
 */
JABS_AiManager.moveTowardSlotIfNeeded = function(allyBattler, desiredX, desiredY)
{
  // forced dodge must win over slot chasing or dodge speed stacks with formation steering.
  if (allyBattler.isDodging())
  {
    return;
  }

  if (allyBattler.guarding())
  {
    return;
  }

  // define a small tolerance to avoid jitter.
  const tolerance = J.ABS.EXT.ALLYAI.Metadata.FormationTolerance;

  // if within tolerance, do not micro-adjust.
  if (this.isWithinTolerance(allyBattler, desiredX, desiredY, tolerance)) return;

  // acquire the character once.
  const character = allyBattler.getCharacter();

  // don't re-issue move commands if already moving.
  if (character.isMoving()) return;

  // only issue a new move if able to move.
  if (allyBattler.canBattlerMove())
  {
    // move intelligently toward the desired formation slot point (centered).
    allyBattler.smartMoveTowardCoordinates(desiredX, desiredY);
  }
};

/**
 * Checks if a battler is within a Manhattan tolerance of the target tile.
 * @param {JABS_Battler} allyBattler The ally battler.
 * @param {number} targetX The target x tile.
 * @param {number} targetY The target y tile.
 * @param {number} tolerance The allowed range before moving.
 * @returns {boolean} True if within tolerance, false otherwise.
 */
JABS_AiManager.isWithinTolerance = function(allyBattler, targetX, targetY, tolerance)
{
  // compute Euclidean distance to the target point using fractional coords.
  const chr = allyBattler.getCharacter();
  const dx = chr.x - targetX;
  const dy = chr.y - targetY;
  const dist = Math.sqrt(dx * dx + dy * dy);

  // return whether or not we are close enough.
  return dist <= tolerance;
};

/**
 * Extends {@link #maintainSafeDistance}.<br/>
 * Allies use spacing-axis-driven close/far thresholds instead of the global constants.
 * @param {JABS_Battler} battler The battler to reposition.
 */
J.ABS.EXT.ALLYAI.Aliased.JABS_AiManager.set('maintainSafeDistance', JABS_AiManager.maintainSafeDistance);
JABS_AiManager.maintainSafeDistance = function(battler)
{
  // enemies use the original global-constant logic unchanged.
  if (battler.isEnemy())
  {
    // perform original logic.
    J.ABS.EXT.ALLYAI.Aliased.JABS_AiManager.get('maintainSafeDistance')
      .call(this, battler);
    return;
  }

  // allies use spacing-axis distances.
  const distance = battler.distanceToCurrentTarget();
  const closeDistance = battler.getCloseDistance();
  const farDistance = battler.getFarDistance();

  if (distance <= closeDistance)
  {
    this.repositionAllyToStandoff(battler);
  }
  else if (distance > farDistance)
  {
    battler.smartMoveTowardTarget();
  }
  else
  {
    // within the safe band: hold position.
  }
};

/**
 * Moves an ally that is too close to its target back out to its standoff ring, arcing around the
 * target toward the leader rather than retreating straight back.
 *
 * The vanilla retreat this replaces walks directly away from the target, and it does so on one
 * cardinal axis at a time, choosing whichever axis currently dominates. That choice reinforces
 * itself- a step that grows the horizontal gap makes horizontal dominate harder next frame- so an
 * ally being pursued locks onto an axis and marches in a dead straight line for as long as the
 * chase lasts. Nothing in it knows the party exists, so the line leads out of the fight.
 *
 * Steering toward a fixed point instead of a direction is what ends the march: a point is arrived
 * at, and {@link JABS_Battler.smartMoveTowardCoordinates} stops on arrival. Biasing that point
 * toward the leader is what keeps the ally in the fight while it backs off.
 * @param {JABS_Battler} allyBattler The ally battler repositioning.
 */
JABS_AiManager.repositionAllyToStandoff = function(allyBattler)
{
  // the leader is what the standoff point is biased toward; player1 is the leader in JABS.
  const leader = $jabsEngine.getPlayer1();
  const target = allyBattler.getTarget();

  // compute where the ally would rather be standing.
  const standoffPoint = this.calculateAllyStandoffPoint(allyBattler, target, leader);
  const [ standoffX, standoffY ] = standoffPoint;

  // steer there using the ordinary pathing, so passability and pixel micro-routes still apply.
  allyBattler.smartMoveTowardCoordinates(standoffX, standoffY);
};

/**
 * Calculates the point an ally should back off to: on its own standoff ring around the target, on
 * whichever side of that ring sits nearest the leader.
 *
 * The bearing is built from two pieces. The first is the ally's own bearing away from the target,
 * which is what stops it cutting through the target to reach the other side. The second is the
 * portion of the leader's bearing that runs perpendicular to it- the sideways pull, with the
 * away-or-toward part removed. Adding a perpendicular vector to a unit vector can never cancel it
 * out, so the result always points somewhere sane no matter where the leader is standing, which
 * is the reason for taking only the perpendicular part rather than blending the two bearings.
 * @param {JABS_Battler} allyBattler The ally battler repositioning.
 * @param {JABS_Battler} target The battler being backed away from.
 * @param {JABS_Battler} leader The battler the standoff point is biased toward.
 * @returns {[number, number]} The [x, y] coordinates to back off to.
 */
JABS_AiManager.calculateAllyStandoffPoint = function(allyBattler, target, leader)
{
  const targetX = target.getX();
  const targetY = target.getY();

  // hold the middle of the spacing band rather than either edge, so arriving does not immediately
  // trip the too-close or too-far test again and start the ally shuffling.
  const closeDistance = allyBattler.getCloseDistance();
  const farDistance = allyBattler.getFarDistance();
  const standoffRadius = (closeDistance + farDistance) / 2;

  // the ally's own bearing away from the target.
  const awayBearing = this.normalizeVector(allyBattler.getX() - targetX, allyBattler.getY() - targetY);
  const [ awayX, awayY ] = awayBearing;

  // the leader's bearing from the target, reduced to only its sideways component.
  const leaderBearing = this.normalizeVector(leader.getX() - targetX, leader.getY() - targetY);
  const [ leaderX, leaderY ] = leaderBearing;
  const alongAway = (leaderX * awayX) + (leaderY * awayY);
  const sidewaysPull = this.normalizeVector(leaderX - (alongAway * awayX), leaderY - (alongAway * awayY));
  const [ sidewaysX, sidewaysY ] = sidewaysPull;

  // an equal blend of the two puts the ally a quarter-turn around the ring per decision, which
  // reads as circling the target rather than either fleeing it or orbiting it.
  const bearing = this.normalizeVector(awayX + sidewaysX, awayY + sidewaysY);
  const [ bearingX, bearingY ] = bearing;

  return [ targetX + (bearingX * standoffRadius), targetY + (bearingY * standoffRadius) ];
};

/**
 * Reduces a vector to length one, or to the zero vector when it has no length to speak of.
 *
 * The zero case is real rather than defensive: two battlers standing on the same tile genuinely
 * have no bearing between them, and a leader directly behind the ally genuinely has no sideways
 * component. Both answer zero here, and the caller's addition then simply leaves the other term
 * standing, which is the correct behavior in each case.
 * @param {number} x The x component of the vector.
 * @param {number} y The y component of the vector.
 * @returns {[number, number]} The [x, y] components of the unit vector.
 */
JABS_AiManager.normalizeVector = function(x, y)
{
  const length = Math.hypot(x, y);

  // below this the direction is numerical noise rather than a bearing anyone chose.
  if (length < 0.01) return [ 0, 0 ];

  return [ x / length, y / length ];
};

/**
 * Extends {@link #decideAiPhase2Action}.<br/>
 * Includes handling ally AI as well as enemy.
 * @param {JABS_Battler} battler The battler deciding the action.
 */
J.ABS.EXT.ALLYAI.Aliased.JABS_AiManager.set('decideAiPhase2Action', JABS_AiManager.decideAiPhase2Action);
JABS_AiManager.decideAiPhase2Action = function(battler)
{
  // check if the battler is literally an Game_Enemy battler.
  if (battler.isEnemy())
  {
    // perform original logic for enemies.
    J.ABS.EXT.ALLYAI.Aliased.JABS_AiManager.get('decideAiPhase2Action')
      .call(this, battler);
  }
  // it is a Game_Actor battler, so it gets different treatment.
  else
  {
    // perform ally AI instead.
    this.decideAllyAiPhase2Action(battler);
  }
};

/**
 * The ally battler decides what action to take.
 * Based on it's AI traits, it will make a decision on an action to take.
 * @param {JABS_Battler} jabsBattler The ally battler deciding the action.
 */
JABS_AiManager.decideAllyAiPhase2Action = function(jabsBattler)
{
  // grab the underlying battler deciding the action.
  const battler = jabsBattler.getBattler();

  // get all slots that have skills in them.
  const validSkillSlots = battler.getValidSkillSlotsForAlly();

  // strip guard skills from random picks: roll-time guard still poisons slot bookkeeping; ally guard is driven by
  // {@link JABS_AiManager.tryRaiseAllyCombatGuard} on the same threat footprint as defensive dodge.
  const currentlyEquippedSkillIds = validSkillSlots
    .map(skillSlot => skillSlot.id)
    .filter(skillId => !JABS_Battler.isGuardSkillById(skillId));

  // decide the action based on the ally ai mode currently assigned.
  const decidedPicks = jabsBattler
    .getAllyAiMode()
    .decideAction(jabsBattler, jabsBattler.getTarget(), currentlyEquippedSkillIds);

  // validate the skill chosen.
  if (decidedPicks.length === 0 || !this.isSkillIdValid(decidedPicks[0]))
  {
    // cancel the setup.
    this.cancelActionSetup(jabsBattler);

    // stop processing.
    return;
  }

  const [decidedSkillId] = decidedPicks;

  // TODO: allow allies to use dodge skills, but code the AI to use it intelligently.
  // check if the skill id is actually a mobility skill.
  if (JABS_Battler.isDodgeSkillById(decidedSkillId))
  {
    // cancel the setup.
    this.cancelActionSetup(jabsBattler);

    // stop processing.
    return;
  }

  // do not execute guard skills from phase roulette (held guard is ally-ai-driven separately).
  if (JABS_Battler.isGuardSkillById(decidedSkillId))
  {
    // cancel the setup.
    this.cancelActionSetup(jabsBattler);

    // stop processing.
    return;
  }

  // determine the slot to apply the cooldown to.
  const decidedSkillSlot = battler.findSlotForSkillId(decidedSkillId);

  // build the cooldown from the skill.
  const cooldownKey = decidedSkillSlot.key;

  // setup the action for use!
  this.setupActionForNextPhase(jabsBattler, decidedSkillId, cooldownKey);
};
//endregion JABS_AiManager