//region JABS_AiManager
/**
 * Overwrites {@link #canMoveIdly}.<br/>
 * With pixel-idle wander the timing is managed entirely by the destination/wait
 * state machine on the battler. The external frame-gate and random roll are not needed.
 * @param {JABS_Battler} battler The battler checking idle movement readiness.
 * @returns {boolean} Always true; the battler's own state machine controls pacing.
 */
J.PIXEL.EXT.ABS.Aliased.JABS_AiManager.set('canMoveIdly', JABS_AiManager.canMoveIdly);
// eslint-disable-next-line no-unused-vars
JABS_AiManager.canMoveIdly = function(battler)
{
  return true;
};

/**
 * Overwrites {@link #moveIdly}.<br/>
 * Delegates to the battler's pixel-aware idle wander state machine rather than
 * calling the tile-step moveRandom, which only advances a single distancePerFrame pixel.
 * @param {JABS_Battler} battler The battler moving idly.
 */
J.PIXEL.EXT.ABS.Aliased.JABS_AiManager.set('moveIdly', JABS_AiManager.moveIdly);
JABS_AiManager.moveIdly = function(battler)
{
  battler.updatePixelIdleWander();
};

/**
 * Overwrites {@link #goHome}.<br/>
 * Uses pixel-aware smart movement toward the home coordinates so the battler glides
 * home smoothly instead of shuffling one distancePerFrame pixel at a time via moveStraight.
 * @param {JABS_Battler} battler The battler returning to its home point.
 */
J.PIXEL.EXT.ABS.Aliased.JABS_AiManager.set('goHome', JABS_AiManager.goHome);
JABS_AiManager.goHome = function(battler)
{
  // use pixel-aware movement rather than a tile-step moveStraight.
  battler.smartMoveTowardCoordinates(battler.getHomeX(), battler.getHomeY());

  // once close enough to home, transition to idle state.
  if (battler.isHome())
  {
    battler.setIdle(true);
  }
};

/**
 * Keeps allies within leash range of the leader, even during combat.
 * If beyond leash, snap back and clear movement to avoid drift.
 * @param {JABS_Battler} allyBattler The ally battler.
 */
J.PIXEL.EXT.ABS.Aliased.JABS_AiManager.set("rubberbandAlly", JABS_AiManager.rubberbandAlly);
JABS_AiManager.rubberbandAlly = function(allyBattler)
{
  // Acquire characters and compute fractional distance.
  const allyCharacter = allyBattler.getCharacter();

  allyBattler.lockEngagement();
  allyBattler.disengageTarget();
  allyBattler.resetAllAggro(null, true);
  allyBattler.unlockEngagement();

  // Snap and clear pixel movement state.
  allyCharacter.jumpToPlayer();
  allyCharacter.stopPixelMoving();
};

/**
 * Extends {@link #moveTowardSlotIfNeeded}.<br/>
 * Replaces movement with PIXEL-aware hysteresis and near-target throttling to prevent sliding.
 * This implementation does NOT call the original; it fully handles formation movement.
 * @param {JABS_Battler} allyBattler The ally battler.
 * @param {number} desiredX The desired slot x (fractional center).
 * @param {number} desiredY The desired slot y (fractional center).
 */
J.PIXEL.EXT.ABS.Aliased.JABS_AiManager.set("moveTowardSlotIfNeeded", JABS_AiManager.moveTowardSlotIfNeeded);
JABS_AiManager.moveTowardSlotIfNeeded = function(allyBattler, desiredX, desiredY)
{
  // dodge pipeline owns the ally sprite until endDodge; skip formation pull during forced dodge.
  if (allyBattler.isDodging())
  {
    return;
  }

  if (allyBattler.guarding())
  {
    return;
  }

  // acquire the character once.
  const chr = allyBattler.getCharacter();

  // resolve tolerances.
  // default if ALLYAI not present.
  let tolerance = 0.45;

  // extra ring outside tolerance for gentle throttling near target.
  const hysteresis = 0.25;

  if (J.ABS.EXT.ALLYAI && J.ABS.EXT.ALLYAI.Metadata)
  {
    // use the configured formation tolerance if available.
    tolerance = J.ABS.EXT.ALLYAI.Metadata.FormationTolerance;
  }

  // compute Euclidean distance to the target point using fractional coords.
  const dx = chr.x - desiredX;
  const dy = chr.y - desiredY;
  const dist = Math.sqrt(dx * dx + dy * dy);

  // if within tolerance, do not micro-adjust and ensure we are truly idle.
  if (dist <= tolerance)
  {
    // snap to logical to ensure no residual drift and clear any transient motion.
    chr.stopPixelMoving();

    // do not issue a move when already within tolerance.
    return;
  }

  // determine the near-range threshold for light throttling.
  const nearThreshold = tolerance + hysteresis;

  // if inside the near ring, allow only occasional nudges (every other frame) to prevent micro-drifting.
  if (dist <= nearThreshold)
  {
    // If we recently moved, skip this frame to avoid overshooting.
    if (chr.isPixelOnCooldown())
    {
      // do not move this frame while on cooldown.
      return;
    }

    // if able to move, issue a single smart step and set a short cooldown.
    if (allyBattler.canBattlerMove())
    {
      // execute a smart step toward the target slot.
      allyBattler.smartMoveTowardCoordinates(desiredX, desiredY);

      // set a short, local cooldown (1 frame) to reduce micro-steps and sliding.
      chr.setPixelMoveCooldown(1);
    }

    // done processing near-range.
    return;
  }

  // we are far enough away: move every frame without throttling for responsiveness.
  if (allyBattler.canBattlerMove())
  {
    // execute the smart step toward the target slot.
    allyBattler.smartMoveTowardCoordinates(desiredX, desiredY);
  }
};

/**
 * Overwrites {@link #calculateFormationSlotCoordinates}.<br/>
 * Calculates considering the tile center.
 * @param {number} lx The leader's x coordinate.
 * @param {number} rx The rotated x.
 * @param {number} ly The leader's y coordinate.
 * @param {number} ry The rotated y.
 * @returns {[number, number]}
 */
JABS_AiManager.calculateFormationSlotCoordinates = function(lx, rx, ly, ry)
{
  // compute absolute slot tile by applying the rotated offset and target the tile center.
  const sx = lx + rx + 0.5;
  const sy = ly + ry + 0.5;

  // return slot coords (fractional center).
  return [ sx, sy ];
};

/**
 * Overwrites {@link #isWithinTolerance}.<br/>
 * Checks if a battler is within a Euclidean tolerance of the target point.
 * @param {JABS_Battler} allyBattler The ally battler.
 * @param {number} targetX The target x (fractional center).
 * @param {number} targetY The target y (fractional center).
 * @param {number} tolerance The allowed range before moving.
 * @returns {boolean} True if within tolerance, false otherwise.
 */
JABS_AiManager.isWithinTolerance = function(allyBattler, targetX, targetY, tolerance)
{
  // compute Euclidean distance to the target using fractional coords.
  const chr = allyBattler.getCharacter();
  const dx = chr.x - targetX;
  const dy = chr.y - targetY;
  const dist = Math.sqrt(dx * dx + dy * dy);

  // return whether or not we are close enough.
  return dist <= tolerance;
};
//endregion JABS_AiManager