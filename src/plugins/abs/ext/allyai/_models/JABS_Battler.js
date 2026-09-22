//region JABS_Battler
import JABS_AllyAI from './JABS_AllyAI.js';
import JABS_FormationStall from './JABS_FormationStall.js';
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
 * Extends the engagement determination to handle aggro/passive party toggling.
 * @param {JABS_Battler} target The target to see if we should engage with.
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

  // aggro allies against non-inanimate targets also follow standard behavior.
  if ($gameParty.isAggro() && !target.isInanimate())
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

  // check if the target is visible to this ally.
  if (!this.inSightRange(target, distance)) return false;

  // check if this ally is alerted.
  const isAlerted = this.isAlerted();

  // check if the player has a "last hit" target.
  const playerHitSomething = $jabsEngine.getPlayer1()
    .hasBattlerLastHit();

  // if we are alerted or the player is attacking something, lets fight.
  const shouldEngage = (isAlerted || playerHitSomething);

  // return the determination.
  return shouldEngage;
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
 * Also prepares this battler to keep track of how it is faring at reaching a formation slot.
 *
 * Seeded alongside the rest of the idle state because that is exactly when it applies: formation
 * keeping is what an ally does when it has nothing to fight, and the measurement is meaningless
 * while it is engaged.
 */
J.ABS.EXT.ALLYAI.Aliased.JABS_Battler.set('initIdleInfo', JABS_Battler.prototype.initIdleInfo);
JABS_Battler.prototype.initIdleInfo = function()
{
  // perform original logic.
  J.ABS.EXT.ALLYAI.Aliased.JABS_Battler.get('initIdleInfo')
    .call(this);

  /**
   * How this battler is faring at reaching its formation slot.
   * @type {JABS_FormationStall}
   */
  this._formationStall = new JABS_FormationStall();
};

/**
 * Gets how this battler is faring at reaching its formation slot.
 * @returns {JABS_FormationStall} The tracker for this battler's current attempt.
 */
JABS_Battler.prototype.getFormationStall = function()
{
  // hand back this battler's own tracker.
  return this._formationStall;
};

/**
 * Records how this frame's approach toward a formation slot went.
 *
 * Exposed on the battler rather than left inside the AI manager because more than one manager
 * steers an ally into formation - the pixel movement bridge replaces the tile-based mover outright
 * - and a give-up implemented in only one of them is a give-up that never happens. Ally AI owns the
 * knobs, so it owns the seam; whoever is doing the moving calls it.
 * @param {number} distance How far this battler currently is from the slot.
 * @param {number} slotX The x coordinate of the slot.
 * @param {number} slotY The y coordinate of the slot.
 */
JABS_Battler.prototype.observeFormationApproach = function(distance, slotX, slotY)
{
  const epsilon = J.ABS.EXT.ALLYAI.Metadata.FormationProgressEpsilon;

  this.getFormationStall()
    .observe(distance, slotX, slotY, epsilon);
};

/**
 * Whether this battler has spent long enough getting no closer to abandon its formation slot.
 * @returns {boolean} True if the battler should stop trying to reach the slot, false otherwise.
 */
JABS_Battler.prototype.hasGivenUpOnFormationSlot = function()
{
  const stallFrames = J.ABS.EXT.ALLYAI.Metadata.FormationStallFrames;

  return this.getFormationStall()
    .isStalled(stallFrames);
};

/**
 * Abandons this battler's current attempt at a formation slot.
 *
 * Called on arrival, which is the one outcome that spends an attempt outright - the next time this
 * battler is out of position it is a new problem, even against the very same slot.
 */
JABS_Battler.prototype.clearFormationApproach = function()
{
  this.getFormationStall()
    .reset();
};

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