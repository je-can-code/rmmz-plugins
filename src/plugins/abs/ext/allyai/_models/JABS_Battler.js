//region JABS_Battler
import JABS_AllyAI from './JABS_AllyAI.js';
import JABS_StanceFacing from './JABS_StanceFacing.js';
import JABS_StanceStall from './JABS_StanceStall.js';
/**
 * Generates a `JABS_Battler` for an actor ally bound to a follower character.
 * Uses the actor's own core configuration.
 * @param {Game_Follower} follower The follower character representing this ally on the map.
 * @param {Game_Actor} actor The underlying actor battler.
 * @returns {JABS_Battler} The built ally battler.
 */
JABS_Battler.createAlly = function(follower, actor)
{
  // if either input is missing, we cannot build an ally battler.
  if (!follower || !actor) return null;

  // build core data from the actor's own database-driven properties.
  const coreData = JABS_BattlerCoreData.Builder()
    .setBattler(actor)
    .build();

  // create and return the ally battler bound to this follower.
  return new JABS_Battler(follower, actor, coreData);
};

/**
 * Extends the engagement determination so allies decide by the party's stance.
 * @param {JABS_Battler} target The target to see if we should engage with.
 * @param {number} distance The distance from this battler to the target.
 * @returns {boolean}
 */
J.ABS.EXT.ALLYAI.Aliased.JABS_Battler.set('shouldEngage', JABS_Battler.prototype.shouldEngage);
JABS_Battler.prototype.shouldEngage = function(target, distance)
{
  // enemies follow standard behavior.
  if (this.isEnemy())
  {
    // perform original logic.
    return J.ABS.EXT.ALLYAI.Aliased.JABS_Battler.get('shouldEngage')
      .call(this, target, distance);
  }

  // determine if the ally should engage the foe.
  return this.shouldAllyEngage(target, distance);
};

/**
 * Determines whether or not the ally should engage in combat with the target.
 *
 * The party's stance decides whether an ally goes in first, but every stance answers the leader: an ally
 * that was struck, or that the leader's own fight has rallied, joins in whatever its stance, and so does
 * one whose leader is already trading blows. Only a direct order to pull back keeps an ally out of it.
 * @param {JABS_Battler} target The target to potentially engage with.
 * @param {number} distance The distance from this battler to the nearest potential target.
 * @returns {boolean} True if this ally should engage in combat, false otherwise.
 */
JABS_Battler.prototype.shouldAllyEngage = function(target, distance)
{
  // do-nothing allies never engage targets on their own.
  const allyAI = this.getAllyAiMode();
  if (allyAI && allyAI.isDoNothing()) return false;

  // allies cannot engage against inanimate targets.
  if (target.isInanimate()) return false;

  // an ally that was told to pull back stays out of it until the order runs out.
  if (this.isPullingBack()) return false;

  // nothing out of sight is engaged; a rallied ally walks toward the fight until it is in sight.
  if (!this.inSightRange(target, distance)) return false;

  // an ally that was struck, or rallied by the leader's fight, joins in.
  if (this.isAlerted()) return true;

  // the leader is already trading blows with something that fights back.
  if (this.isLeaderFighting()) return true;

  // otherwise it comes down to whether the party's stance goes in first.
  return $gameParty.getPartyStanceType().engagesFirst;
};

/**
 * Determines whether the leader is fighting something right now.
 *
 * The leader's last hit is the record of what they last struck. Smashing a crate is not a fight worth
 * joining, so an inanimate last hit does not count, and neither does one that has since been defeated.
 * @returns {boolean} True if the leader's last hit is something alive that fights back, false otherwise.
 */
JABS_Battler.prototype.isLeaderFighting = function()
{
  // what the leader last struck, if anything; player1 is the leader in JABS.
  const lastHit = $jabsEngine.getPlayer1()
    .lastHit();

  // a leader who has not struck anything is not fighting.
  if (lastHit === null) return false;

  // furniture is not a fight.
  if (lastHit.isInanimate()) return false;

  // a defeated foe is a fight already won.
  return lastHit.isDead() === false;
};

/**
 * Gets all allies to this battler within a large range.
 * (Not map-wide because that could result in unexpected behavior)
 * @returns {JABS_Battler[]}
 */
JABS_Battler.prototype.getAllNearbyAllies = function()
{
  return JABS_AiManager.getAlliedBattlersWithinRange(this, JABS_Battler.allyRubberbandRange());
};

/**
 * Gets the ally ai associated with this battler.
 * @returns {JABS_AllyAI}
 */
JABS_Battler.prototype.getAllyAiMode = function()
{
  // enemies do not have ally ai.
  if (this.isEnemy()) return null;

  return this.getBattler()
    .getAllyAI();
};

/**
 * Gets the close-distance threshold in tiles for this battler.
 * Enemies use the global default; allies delegate to their spacing axis.
 * @returns {number}
 */
JABS_Battler.prototype.getCloseDistance = function()
{
  if (this.isEnemy()) return JABS_Battler.closeDistance;
  const allyAI = this.getAllyAiMode();
  if (!allyAI) return JABS_Battler.closeDistance;
  return allyAI.getCloseDistance();
};

/**
 * Gets the far-distance threshold in tiles for this battler.
 * Enemies use the global default; allies delegate to their spacing axis.
 * @returns {number}
 */
JABS_Battler.prototype.getFarDistance = function()
{
  if (this.isEnemy()) return JABS_Battler.farDistance;
  const allyAI = this.getAllyAiMode();
  if (!allyAI) return JABS_Battler.farDistance;
  return allyAI.getFarDistance();
};

/**
 * Extends {@link JABS_Battler.initIdleInfo}.<br/>
 * Also prepares this battler to keep its place in the party's stance.
 *
 * Seeded alongside the rest of the idle state because that is exactly when it applies: keeping to a stance
 * is what an ally does when it has nothing to fight, and none of it means anything while it is engaged.
 */
J.ABS.EXT.ALLYAI.Aliased.JABS_Battler.set('initIdleInfo', JABS_Battler.prototype.initIdleInfo);
JABS_Battler.prototype.initIdleInfo = function()
{
  // perform original logic.
  J.ABS.EXT.ALLYAI.Aliased.JABS_Battler.get('initIdleInfo')
    .call(this);

  /**
   * How this battler is faring at reaching its spot in the party's stance.
   * @type {JABS_StanceStall}
   */
  this._stanceStall = new JABS_StanceStall();

  /**
   * Which way this battler's stance is laid out around the leader.
   * @type {JABS_StanceFacing}
   */
  this._stanceFacing = new JABS_StanceFacing();

  /**
   * Whether this battler has strayed far enough from its stance to sprint back into it.
   * @type {boolean}
   */
  this._stanceCatchingUp = false;

  /**
   * The frame this battler last kept to its stance on; see {@link JABS_Battler.isStanceCatchingUp}.
   * @type {number}
   */
  this._stanceFollowFrame = 0;
};

/**
 * Extends {@link JABS_Battler.initBattleInfo}.<br/>
 * Also prepares this battler to obey an order to pull back.
 */
J.ABS.EXT.ALLYAI.Aliased.JABS_Battler.set('initBattleInfo', JABS_Battler.prototype.initBattleInfo);
JABS_Battler.prototype.initBattleInfo = function()
{
  // perform original logic.
  J.ABS.EXT.ALLYAI.Aliased.JABS_Battler.get('initBattleInfo')
    .call(this);

  /**
   * How many more frames this battler stays out of the fight after being told to pull back.
   * @type {number}
   */
  this._pullBackFrames = 0;
};

/**
 * Extends {@link JABS_Battler.updateTimers}.<br/>
 * Also counts down any order to pull back.
 */
J.ABS.EXT.ALLYAI.Aliased.JABS_Battler.set('updateTimers', JABS_Battler.prototype.updateTimers);
JABS_Battler.prototype.updateTimers = function()
{
  // perform original logic.
  J.ABS.EXT.ALLYAI.Aliased.JABS_Battler.get('updateTimers')
    .call(this);

  // count down the pull back, if there is one.
  this.processPullBackTimer();
};

//region stance
/**
 * Gets how this battler is faring at reaching its spot in the party's stance.
 * @returns {JABS_StanceStall} The tracker for this battler's current attempt.
 */
JABS_Battler.prototype.getStanceStall = function()
{
  // hand back this battler's own tracker.
  return this._stanceStall;
};

/**
 * Records how this frame's approach toward a stance spot went.
 *
 * Exposed on the battler rather than left inside the AI manager because more than one manager steers an
 * ally into its stance - the pixel movement bridge replaces the tile-based mover outright - and a give-up
 * implemented in only one of them is a give-up that never happens. Ally AI owns the knobs, so it owns the
 * seam; whoever is doing the moving calls it.
 * @param {number} distance How far this battler currently is from the spot.
 * @param {number} spotX The x coordinate of the spot.
 * @param {number} spotY The y coordinate of the spot.
 */
JABS_Battler.prototype.observeStanceApproach = function(distance, spotX, spotY)
{
  const { StanceProgressEpsilon, StanceSpotDrift } = J.ABS.EXT.ALLYAI.Metadata;

  this.getStanceStall()
    .observe(distance, spotX, spotY, StanceProgressEpsilon, StanceSpotDrift);
};

/**
 * Whether this battler has spent long enough getting no closer to abandon its stance spot.
 * @returns {boolean} True if the battler should stop trying to reach the spot, false otherwise.
 */
JABS_Battler.prototype.hasGivenUpOnStanceSpot = function()
{
  const stallFrames = J.ABS.EXT.ALLYAI.Metadata.StanceStallFrames;

  return this.getStanceStall()
    .isStalled(stallFrames);
};

/**
 * Abandons this battler's current attempt at a stance spot.
 *
 * Called on arrival, which is the one outcome that spends an attempt outright - the next time this
 * battler is out of position it is a new problem, even against the very same spot.
 */
JABS_Battler.prototype.clearStanceApproach = function()
{
  this.getStanceStall()
    .reset();
};

/**
 * Gets which way this battler's stance is laid out around the leader.
 * @returns {JABS_StanceFacing} The tracker for this battler's stance facing.
 */
JABS_Battler.prototype.stanceFacing = function()
{
  // hand back this battler's own tracker.
  return this._stanceFacing;
};

/**
 * Records which way the leader faces this frame, turning this battler's stance once they have settled.
 * @param {number} direction The direction the leader currently faces.
 */
JABS_Battler.prototype.observeLeaderFacing = function(direction)
{
  const settleFrames = J.ABS.EXT.ALLYAI.Metadata.StanceFacingSettleFrames;

  this.stanceFacing()
    .observe(direction, settleFrames);
};

/**
 * Gets the facing this battler's stance is currently laid out from.
 * @returns {number} The direction the stance is laid out from.
 */
JABS_Battler.prototype.getStanceFacing = function()
{
  return this.stanceFacing()
    .direction();
};

/**
 * Gets whether this battler has strayed far enough from its stance to sprint back into it.
 * @returns {boolean}
 */
JABS_Battler.prototype.stanceCatchingUp = function()
{
  return this._stanceCatchingUp;
};

/**
 * Sets whether this battler has strayed far enough from its stance to sprint back into it.
 * @param {boolean} catchingUp Whether the battler is catching up.
 */
JABS_Battler.prototype.setStanceCatchingUp = function(catchingUp)
{
  this._stanceCatchingUp = catchingUp;
};

/**
 * Gets the frame this battler last kept to its stance on.
 * @returns {number}
 */
JABS_Battler.prototype.stanceFollowFrame = function()
{
  return this._stanceFollowFrame;
};

/**
 * Sets the frame this battler last kept to its stance on.
 * @param {number} frame The frame count it kept to its stance on.
 */
JABS_Battler.prototype.setStanceFollowFrame = function(frame)
{
  this._stanceFollowFrame = frame;
};

/**
 * Decides whether this battler sprints back into its stance, from how far outside the stance it stands.
 *
 * The decision has a memory on purpose. An ally starts sprinting once it is well out of position, and
 * keeps sprinting until it is back in it. Deciding afresh every frame would stop the sprint the moment the
 * ally was merely close - and an ally kept in front of a walking leader, sent behind them by a turn, would
 * then trail them at a walk forever, never quite getting back in front.
 *
 * Between those two points it changes nothing, which is what keeps an ally trailing a walking leader at
 * the edge of its zone walking with them rather than lurching after them.
 * @param {number} distance How far the battler stands from its stance spot.
 */
JABS_Battler.prototype.updateStanceCatchUp = function(distance)
{
  const { StanceCatchUpDistance, StanceTolerance } = J.ABS.EXT.ALLYAI.Metadata;

  // note that this battler kept to its stance this frame.
  this.setStanceFollowFrame(Graphics.frameCount);

  // well out of position: sprint.
  if (distance > StanceCatchUpDistance)
  {
    this.setStanceCatchingUp(true);
    return;
  }

  // back in position: walk.
  if (distance <= StanceTolerance)
  {
    this.setStanceCatchingUp(false);
  }
};

/**
 * Whether this battler is sprinting back into its stance right now.
 *
 * A sprint only holds while the battler is actually keeping to its stance. The moment it does anything else
 * - fights, chases an alert, or stands frozen through a cutscene that stopped the AI - it stops being
 * steered by its stance, and a sprint left over from before would carry into whatever it does next. So a
 * sprint also requires the stance to have steered the battler this frame or the one before; either order
 * of the AI and the character update within a frame then sees it.
 * @returns {boolean} True if the battler should be moving faster than its leader, false otherwise.
 */
JABS_Battler.prototype.isStanceCatchingUp = function()
{
  // a battler that is not sprinting is not sprinting.
  if (!this.stanceCatchingUp()) return false;

  // a sprint left over from before the stance last steered this battler does not count.
  return this.stanceFollowFrame() >= Graphics.frameCount - 1;
};
//endregion stance

//region commands
/**
 * Gets how many more frames this battler stays out of the fight after being told to pull back.
 * @returns {number}
 */
JABS_Battler.prototype.pullBackFrames = function()
{
  return this._pullBackFrames;
};

/**
 * Sets how many more frames this battler stays out of the fight after being told to pull back.
 * @param {number} frames The number of frames.
 */
JABS_Battler.prototype.setPullBackFrames = function(frames)
{
  this._pullBackFrames = frames;
};

/**
 * Whether this battler is staying out of the fight because it was told to pull back.
 * @returns {boolean} True if it is pulling back, false otherwise.
 */
JABS_Battler.prototype.isPullingBack = function()
{
  return this.pullBackFrames() > 0;
};

/**
 * Counts down an order to pull back by one frame.
 */
JABS_Battler.prototype.processPullBackTimer = function()
{
  // nothing to count down when no order is in effect.
  if (!this.isPullingBack()) return;

  // one frame closer to rejoining the fight.
  this.setPullBackFrames(this.pullBackFrames() - 1);
};

/**
 * Obeys an order to charge: goes after something to fight right now, whatever the party's stance says.
 *
 * An ally already fighting is already charging, and one told to do nothing goes on doing nothing. A
 * charge also overrides any pull back still in effect, since the newer order is the one that stands.
 */
JABS_Battler.prototype.chargeOnCommand = function()
{
  // an ally told to do nothing keeps doing nothing.
  if (this.getAllyAiMode()
    .isDoNothing()) return;

  // an ally already in a fight is already charging.
  if (this.isEngaged()) return;

  // the newer order stands; any pull back is over.
  this.setPullBackFrames(0);

  // find something worth charging at.
  const target = this.findChargeTarget();

  // with nothing in reach, there is nothing to charge.
  if (target === null) return;

  // make the charge visible, then go.
  this.showBalloon(J.ABS.Balloons.Exclamation);
  this.engageTarget(target);
};

/**
 * Finds something this battler can charge at.
 *
 * Whatever the leader is fighting comes first, since a charge is the leader asking for help with their
 * fight. Failing that, the nearest foe in sight will do.
 * @returns {JABS_Battler|null} The battler to charge at, or null when nothing worth charging is in reach.
 */
JABS_Battler.prototype.findChargeTarget = function()
{
  // whatever the leader is fighting, if they are fighting anything.
  if (this.isLeaderFighting())
  {
    // player1 is the leader in JABS.
    const leaderTarget = $jabsEngine.getPlayer1()
      .lastHit();

    // only a fight this battler can actually reach is worth charging into.
    if (this.canChargeAt(leaderTarget)) return leaderTarget;
  }

  // otherwise, the nearest foe in sight.
  const nearestFoe = JABS_AiManager.getClosestOpposingBattler(this);

  // nothing in sight at all.
  if (nearestFoe === null) return null;

  // the nearest thing in sight is only worth charging if it fights back.
  if (nearestFoe.isInanimate()) return null;

  // and only if it is within reach.
  if (!this.canChargeAt(nearestFoe)) return null;

  // charge!
  return nearestFoe;
};

/**
 * Whether a target is within reach for a charge.
 *
 * A charge is a chase, so the target must sit within this battler's pursuit range, or the chase would be
 * abandoned on its first step. It must also sit within this battler's leash of the leader, or the chase
 * would carry the battler far enough from the leader to be snapped straight back to them.
 * @param {JABS_Battler} target The battler to charge at.
 * @returns {boolean} True if the target is within reach, false otherwise.
 */
JABS_Battler.prototype.canChargeAt = function(target)
{
  // close enough to chase.
  const distance = this.distanceToDesignatedTarget(target);
  if (!this.inPursuitRange(target, distance)) return false;

  // close enough to the leader that chasing it will not trip the leash; player1 is the leader in JABS.
  const leader = $jabsEngine.getPlayer1();
  return target.distanceToDesignatedTarget(leader) <= this.getAllyLeashRange();
};

/**
 * Obeys an order to pull back: drops out of any fight, and stays out of every fight for a while.
 *
 * The ally forgets why it was fighting as well as what, so it does not turn straight back around the
 * moment the order runs out. Disengaging also clears any alert, so it does not walk back toward one
 * either, and while the order holds it cannot be alerted again.
 */
JABS_Battler.prototype.pullBackOnCommand = function()
{
  // drop whatever this battler is fighting, along with any alert, and every grudge it was holding.
  this.disengageTarget();
  this.resetAllAggro(null, true);

  // stay out of every fight for a while.
  this.setPullBackFrames(J.ABS.EXT.ALLYAI.Metadata.PullBackFrames);

  // make the retreat visible.
  this.showBalloon(J.ABS.Balloons.Sweat);
};
//endregion commands

/**
 * Gets the leash range for this ally battler.
 * Applies the spacing-axis leash multiplier to the base rubber-band range.
 * @returns {number}
 */
JABS_Battler.prototype.getAllyLeashRange = function()
{
  const allyAI = this.getAllyAiMode();
  if (!allyAI) return JABS_Battler.allyRubberbandRange();
  return JABS_Battler.allyRubberbandRange() * allyAI.getLeashMultiplier();
};

/**
 * Applies the battle memory to the battler.
 * Only applicable to allies (for now).
 * @param {JABS_BattleMemory} newMemory The new memory to apply to this battler.
 */
JABS_Battler.prototype.applyBattleMemories = function(newMemory)
{
  // enemies do not (yet) track battle memories.
  if (this.isEnemy()) return;

  return this.getBattler()
    .getAllyAI()
    .applyMemory(newMemory);
};
//endregion JABS_Battler