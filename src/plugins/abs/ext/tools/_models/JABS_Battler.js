//region JABS_Battler
/**
 * Initializes the properties of this battler that are not related to anything in particular.
 */
J.ABS.EXT.TOOLS.Aliased.JABS_Battler.set('initGeneralInfo', JABS_Battler.prototype.initGeneralInfo);
JABS_Battler.prototype.initGeneralInfo = function()
{
  // perform original logic.
  J.ABS.EXT.TOOLS.Aliased.JABS_Battler.get('initGeneralInfo')
    .call(this);

  /**
   * The counter for how long this battler is waiting.
   * @type {boolean}
   */
  this._gapClosing = false;

  /**
   * The destination coordinates of where this battler is gap closing to.
   * @type {[number, number]}
   */
  this._gapCloseDestination = [ 0, 0 ];

  /**
   * The ID of the skill that initiated the current gap close.
   * Used at landing to read <thisOnGapCloseEnd> from that skill.
   * @type {number}
   */
  this._gapCloseSourceSkillId = 0;
};

/**
 * Begins the process of gap closing.
 */
JABS_Battler.prototype.beginGapClosing = function()
{
  this._gapClosing = true;
};

/**
 * Ends the process of gap closing.
 */
JABS_Battler.prototype.endGapClosing = function()
{
  this._gapClosing = false;
};

/**
 * Gets whether or not this battler is currently gap closing.
 * @returns {boolean}
 */
JABS_Battler.prototype.isGapClosing = function()
{
  return this._gapClosing;
};

/**
 * Gets the destination coordinates of where this battler is gap closing to.
 * @returns {[number,number]}
 */
JABS_Battler.prototype.gapCloseDestination = function()
{
  return this._gapCloseDestination;
};

/**
 * Sets the destination coordinates for this battler's gap close.
 * @param {[number, number]} destination The destination x:y coordinates.
 */
JABS_Battler.prototype.setGapCloseDestination = function(destination)
{
  this._gapCloseDestination = destination;
};

/**
 * Determines whether or not we have a valid gap close destination.
 * @returns {boolean} True if we have a valid destination, false otherwise.
 */
JABS_Battler.prototype.hasGapCloseDestination = function()
{
  // destructure the gap close destination.
  const [ goalX, goalY ] = this.gapCloseDestination();

  // if the destination is 0:0, then we don't have a destination.
  if (goalX === 0 && goalY === 0) return false;

  // otherwise we have a destination to gap close to!
  return true;
};

/**
 * Clears the destination coordinates for gap closing.
 */
JABS_Battler.prototype.clearGapCloseDestination = function()
{
  this.setGapCloseDestination([ 0, 0 ]);
};

/**
 * Extends {@link JABS_Battler.update}.<br/>
 * Also updates the gap closing process.
 */
J.ABS.EXT.TOOLS.Aliased.JABS_Battler.set('update', JABS_Battler.prototype.update);
JABS_Battler.prototype.update = function()
{
  // perform original logic.
  J.ABS.EXT.TOOLS.Aliased.JABS_Battler.get('update')
    .call(this);

  // also update gap closing.
  this.updateGapClosing();
};

/**
 * The update flow for managing gap closing.
 */
JABS_Battler.prototype.updateGapClosing = function()
{
  // check if we are currently gap closing.
  if (this.isGapClosing())
  {
    // make sure we have a valid destination.
    if (this.hasGapCloseDestination())
    {
      // check if we reached the destination yet.
      if (this.hasReachedGapCloseDestination())
      {
        this.clearGapCloseDestination();
        this.onGapCloseFinished();
        this.endGapClosing();
      }

      // we haven't reached the destination, keep going.
    }
    // we don't have a valid destination.
    else
    {
      // stop that.
      this.clearGapCloseDestination();
      this.endGapClosing();
    }
  }

  // not gap closing.
};

/**
 * Gets the gap close target key for this battler, or null if it cannot be gap closed to.
 * Checks the underlying battler's notes first, then the character's event comments if applicable.
 * @returns {string|null} The gap close target key, or null if not present.
 */
JABS_Battler.prototype.isGapClosable = function()
{
  // grab the battler.
  const battler = this.getBattler();

  // check the battler's notes for a gap close target key.
  const battlerKey = battler.gapCloseKey();

  // if the battler's notes carry a key, that is the answer.
  if (battlerKey !== null) return battlerKey;

  // check if this battler is an event-based battler.
  if (this.isEvent())
  {
    // grab the character.
    const character = this.getCharacter();

    // check the event's comment commands for a gap close target key.
    return character.gapCloseKey();
  }

  // no gap close target key found anywhere.
  return null;
};

/**
 * Executes a gap close to the target based on the provided action.
 * @param {JABS_Action} action The JABS action containing the action data.
 * @param {JABS_Battler} target The target having the action applied against.
 */
JABS_Battler.prototype.gapCloseToTarget = function(action, target)
{
  // do not try to gap close if we are already gap closing.
  if (this.isGapClosing()) return;

  // extract the gap close details from the skill.
  let {
    jabsGapCloseMode,
    jabsGapClosePosition,
  } = action.getBaseSkill();
  const { jabsRespectTerrain } = action.getBaseSkill();

  // if the position is not identified, then default to "same".
  jabsGapClosePosition ??= J.ABS.EXT.TOOLS.GapClosePositions.Same;

  // determine the destination delta coordinates based on the position mode.
  const [ x, y ] = this.determineGapCloseCoordinates(target, jabsGapClosePosition);

  // grab the underlying character for access to movement.
  const casterCharacter = this.getCharacter();

  // gap close normally bypasses terrain entirely- <respectTerrain> opts into validating the
  // full tile-by-tile path first. this is all-or-nothing by design: a target that's reachable
  // gets a clean, unobstructed jump straight to it, while a target that isn't reachable doesn't
  // gap close at all- no partial slide toward it along whichever axis happened to be clearer.
  if (jabsRespectTerrain && !casterCharacter.canReachTileDelta(x, y)) return;

  // begin the gap closing procedure.
  this.beginGapClosing();

  // store the initiating skill ID so the landing hook can read its <thisOnGapCloseEnd> tag.
  this.setGapCloseSourceSkillId(action.getBaseSkill().id);

  // store the actual landing coordinates (not the raw target tile) so the arrival check resolves correctly.
  this.setGapCloseDestination([ this.getX() + x, this.getY() + y ]);

  // if the mode is not identified, then default to "jump".
  jabsGapCloseMode ??= J.ABS.EXT.TOOLS.GapCloseModes.Jump;

  // pivot on the mode.
  switch (jabsGapCloseMode)
  {
    case J.ABS.EXT.TOOLS.GapCloseModes.Jump:
      casterCharacter.jump(x, y)
      break;
    case J.ABS.EXT.TOOLS.GapCloseModes.Blink:
      // TODO: update player locate to be less visually jarring? (see: parallax background)
      // uses the same computed delta as jump/travel so <gapClosePosition> is honored here too-
      // an instant teleport straight onto the target's own tile would otherwise land the caster
      // directly inside the target's collision volume regardless of the requested position.
      casterCharacter.locate(casterCharacter.x + x, casterCharacter.y + y);
      break;
    case J.ABS.EXT.TOOLS.GapCloseModes.Travel:
      // a flat ground-level glide- same destination math as jump, no parabolic hop.
      casterCharacter.glideTo(x, y);
      break;
  }
};

/**
 * Fires when this battler has arrived at its gap close destination.
 * Executes all skills collected by {@link resolveGapCloseEndSkillIds} as forced map actions.
 */
JABS_Battler.prototype.onGapCloseFinished = function()
{
  // collect all skill IDs to fire on landing from both tag sources.
  const skillIds = this.resolveGapCloseEndSkillIds();

  // if nothing was registered, there is nothing to do.
  if (skillIds.length === 0) return;

  // force-execute each registered skill from this battler's position at no cost.
  skillIds.forEach(id => $jabsEngine.forceMapAction(this, id));
};

//region pullForward
/**
 * Pulls this battler toward the caster- the inverse of gap close (the caster travels to the
 * target) and the inverse of knockback (the target is shoved away from the caster). Called on
 * the afflicted target, not the caster, since this battler is the one being displaced.
 * @param {JABS_Action} action The JABS action containing the action data.
 * @param {JABS_Battler} caster The battler being pulled toward.
 */
JABS_Battler.prototype.pullToCaster = function(action, caster)
{
  // don't stack a pull on top of any other forced displacement already in progress.
  if (this.getCharacter().isJumping()) return;

  // grab the pull-forward magnitude from the skill; skills without the tag don't pull at all.
  const pullMagnitude = action.getBaseSkill().jabsPullForward;
  if (pullMagnitude === null) return;

  // pull-forward is dampened by the exact same resistance stat that dampens push knockback-
  // resistance to being forcibly displaced is one stat, regardless of which direction it goes.
  const notes = this.getBattler()
    .getAllNotes();

  const resist = RPGManager.getSumFromAllNotesByRegex(notes, J.ABS.RegExp.KnockbackResist);
  if (resist >= 100) return;
  const effectiveMagnitude = pullMagnitude * ((100 - resist) / 100);

  // determine the raw vector and the maximum distance we could possibly travel without
  // colliding with the caster's own hitbox.
  const { unitX, unitY, maxPullDistance } = this.resolvePullVector(caster);

  // clamp the resisted magnitude to whatever's actually available before reaching the caster-
  // this is what stops <pullForward:50> from launching a nearby target past the caster entirely.
  const distance = Math.min(effectiveMagnitude, maxPullDistance);
  if (distance <= 0) return;

  // project the clamped distance along the unit vector toward the caster.
  const rawX = unitX * distance;
  const rawY = unitY * distance;

  // a skill tagged with <ignoreTerrain> sails straight to the computed destination, same as
  // knockback's own bypass- otherwise walk tile-by-tile and stop at the last passable tile.
  const targetCharacter = this.getCharacter();
  let finalX = rawX;
  let finalY = rawY;
  if (!action.getBaseSkill().jabsIgnoreTerrain)
  {
    const horizontalDominant = Math.abs(rawX) >= Math.abs(rawY);

    let direction;
    if (horizontalDominant)
    {
      direction = rawX >= 0 ? J.ABS.Directions.RIGHT : J.ABS.Directions.LEFT;
    }
    else
    {
      direction = rawY >= 0 ? J.ABS.Directions.DOWN : J.ABS.Directions.UP;
    }

    const roundedDistance = Math.max(Math.abs(rawX), Math.abs(rawY));

    [ finalX, finalY ] = targetCharacter.walkInDirectionClamped(direction, roundedDistance);
  }

  // execute the jump- this battler (the target) moves, not the caster.
  targetCharacter.jump(finalX, finalY);
};

/**
 * Resolves the unit vector and maximum safe travel distance for pulling this battler toward
 * the caster. Mirrors the vector math in {@link determineGapCloseCoordinates}, but the roles
 * are reversed- this battler is the mover, and the caster is the fixed goal point.
 * @param {JABS_Battler} caster The battler being pulled toward.
 * @returns {{unitX: number, unitY: number, maxPullDistance: number}}
 */
JABS_Battler.prototype.resolvePullVector = function(caster)
{
  // grab the caster's underlying character for position access.
  const casterCharacter = caster.getCharacter();

  // grab this battler's own current tile coordinates.
  const [ x, y ] = [ this.getX(), this.getY() ];

  // compute the delta vector from this battler toward the caster (+X right, +Y down).
  const goalX = casterCharacter.deltaXFrom(x);
  const goalY = casterCharacter.deltaYFrom(y);

  // compute the straight-line distance between this battler and the caster.
  const magnitude = Math.sqrt(goalX * goalX + goalY * goalY);

  // derive the unit vector pointing from this battler toward the caster.
  const unitX = magnitude > 0 ? goalX / magnitude : 0;
  const unitY = magnitude > 0 ? goalY / magnitude : 0;

  // compute how far short of the caster's center to stop: both hitbox radii plus a thin buffer,
  // so the target lands flush against the caster's edge instead of overlapping or passing through.
  const edgeOffset = casterCharacter.getEffectiveRadius() + this.getCharacter().getEffectiveRadius() + 0.05;
  const maxPullDistance = Math.max(0, magnitude - edgeOffset);

  return { unitX, unitY, maxPullDistance };
};
//endregion pullForward

/**
 * Collects all skill IDs that should fire when this battler's gap close lands.
 * Merges IDs from <thisOnGapCloseEnd> on the initiating skill with IDs from
 * <onGapCloseEnd> across all of the caster's note sources.
 * @returns {number[]} The merged list of skill IDs to execute on landing.
 */
JABS_Battler.prototype.resolveGapCloseEndSkillIds = function()
{
  // grab the skill that started the gap close.
  const sourceSkill = $dataSkills[this.gapCloseSourceSkillId()];

  // collect IDs from <thisOnGapCloseEnd> on the initiating skill itself.
  const thisIds = sourceSkill
    ? sourceSkill.jabsThisOnGapCloseEnd
    : [];

  // collect IDs from <onGapCloseEnd> across all of the caster's note sources.
  const battlerIds = this.getBattler().gapCloseEndSkillIds();

  // merge both sources into a single flat list.
  return [ ...thisIds, ...battlerIds ];
};

/**
 * Determines the jump delta coordinates for the gap close based on the desired landing position.
 * Returns a delta (not absolute coordinates) suitable for passing to {@link Game_Character.jump}.
 * Axis convention: +X = right, -X = left, +Y = down, -Y = up.
 * @param {JABS_Battler} target The target being gap closed to.
 * @param {J.ABS.EXT.TOOLS.GapClosePositions} position The desired landing position relative to the target.
 * @returns {[number, number]} The [dx, dy] delta to jump.
 */
JABS_Battler.prototype.determineGapCloseCoordinates = function(target, position)
{
  // grab the target's underlying character for position access.
  const targetCharacter = target.getCharacter();

  // grab the caster's current tile coordinates.
  const [ x, y ] = [ this.getX(), this.getY() ];

  // compute the delta vector from caster to target (+X right, +Y down).
  const goalX = targetCharacter.deltaXFrom(x);
  const goalY = targetCharacter.deltaYFrom(y);

  // compute the straight-line distance between caster and target.
  const magnitude = Math.sqrt(goalX * goalX + goalY * goalY);

  // derive the unit vector pointing from caster toward the target.
  const unitX = magnitude > 0 ? goalX / magnitude : 0;
  const unitY = magnitude > 0 ? goalY / magnitude : 0;

  // hitboxes are square AABBs, not circles- true separation is measured along whichever
  // single axis is dominant (Chebyshev distance), not the diagonal's Euclidean hypotenuse.
  // dividing the target radii sum by that dominant axis's unit component guarantees the
  // offset actually applied along X or Y (whichever is larger) equals exactly radii + buffer
  // at any approach angle- a pure diagonal no longer under-separates by spreading a
  // Euclidean-sized offset across both axes at once.
  const casterCharacter = this.getCharacter();
  const radiiSum = targetCharacter.getEffectiveRadius() + casterCharacter.getEffectiveRadius() + 0.05;
  const dominantAxisComponent = Math.max(Math.abs(unitX), Math.abs(unitY));
  const edgeOffset = dominantAxisComponent > 0 ? radiiSum / dominantAxisComponent : 0;

  if (position === J.ABS.EXT.TOOLS.GapClosePositions.Infront)
  {
    // land at the target's hitbox edge on the caster's side.
    return [ goalX - unitX * edgeOffset, goalY - unitY * edgeOffset ];
  }

  if (position === J.ABS.EXT.TOOLS.GapClosePositions.Behind)
  {
    // land at the target's hitbox edge on the far side.
    return [ goalX + unitX * edgeOffset, goalY + unitY * edgeOffset ];
  }

  // position is "same" — land directly on the target's tile.
  return [ goalX, goalY ];
};

/**
 * Determines if this battler has reached its gap close destination coordinates yet.
 * @returns {boolean} True if it has reached the destination, false otherwise.
 */
JABS_Battler.prototype.hasReachedGapCloseDestination = function()
{
  // check if somehow we are processing this without a destination.
  if (!this.hasGapCloseDestination())
  {
    // stop gap closing.
    this.endGapClosing();

    // we are where we need to be.
    return true;
  }

  // destructure the destination out.
  const [ goalX, goalY ] = this.gapCloseDestination();

  // check where we're currently at.
  const [ actualX, actualY ] = [ this.getX(), this.getY() ];

  // the amount of wiggle room for gap closing- perfect gap closing is not viable.
  const fuzzy = JABS_Battler.gapCloseWiggleRoom();

  // check if we are generally at the target destination.
  const xOk = (actualX >= goalX - fuzzy) && (actualX <= goalX + fuzzy);
  const yOk = (actualY >= goalY - fuzzy) && (actualY <= goalY + fuzzy);
  const doneMoving = !(this.getCharacter()
    .isMoving());

  // if we have reached the destination, then we're done.
  if (xOk && yOk && doneMoving) return true;

  // keep going!
  return false;
};

/**
 * A static value representing some degree of variance allowed for gap closing
 * to a target destination.
 * @returns {number} The amount of x:y coordinate wiggle room to identify as "close enough".
 */
JABS_Battler.gapCloseWiggleRoom = function()
{
  return 0.5;
};

//region properties
/**
 * Gets the gap close source skill id.
 * @returns {number} The gapCloseSourceSkillId.
 */
JABS_Battler.prototype.gapCloseSourceSkillId = function()
{
  // hand back the gap close source skill id.
  return this._gapCloseSourceSkillId;
};

/**
 * Sets the gap close source skill id.
 * @param {number} newGapCloseSourceSkillId The new gapCloseSourceSkillId.
 */
JABS_Battler.prototype.setGapCloseSourceSkillId = function(newGapCloseSourceSkillId)
{
  // assign the gap close source skill id.
  this._gapCloseSourceSkillId = newGapCloseSourceSkillId;
};
//endregion properties
//endregion JABS_Battler