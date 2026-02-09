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

  // if alerted, seek toward the alerter location first.
  if (allyBattler.isAlerted())
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
  if (allyBattler.isCasting()) return false;

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
  // compute distance from ally to leader using real coords.
  const distanceToLeader = $gameMap.distance(
    allyBattler.getCharacter()._realX,
    allyBattler.getCharacter()._realY,
    leaderBattler.getCharacter()._realX,
    leaderBattler.getCharacter()._realY);

  // determine leash threshold.
  const leash = JABS_Battler.allyRubberbandRange();

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
 * Extends {@link #decideAiPhase2Action}.<br>
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

  // convert the slots into their respective skill ids.
  const currentlyEquippedSkillIds = validSkillSlots.map(skillSlot => skillSlot.id);

  // decide the action based on the ally ai mode currently assigned.
  const decidedSkillId = jabsBattler
    .getAllyAiMode()
    .decideAction(jabsBattler, jabsBattler.getTarget(), currentlyEquippedSkillIds);

  // validate the skill chosen.
  if (!this.isSkillIdValid(decidedSkillId))
  {
    // cancel the setup.
    this.cancelActionSetup(jabsBattler);

    // stop processing.
    return;
  }

  // TODO: allow allies to use dodge skills, but code the AI to use it intelligently.
  // check if the skill id is actually a mobility skill.
  if (JABS_Battler.isDodgeSkillById(decidedSkillId))
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