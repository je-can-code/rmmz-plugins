//region JABS_AiManager
/**
 * Keeps allies within leash range of the leader, even during combat.
 * If beyond leash, snap back and clear movement to avoid drift.
 * @param {JABS_Battler} allyBattler The ally battler.
 */
J.ABS.EXT.PIXEL.Aliased.JABS_AiManager.set("rubberbandAlly", JABS_AiManager.rubberbandAlly);
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
J.ABS.EXT.PIXEL.Aliased.JABS_AiManager.set("moveTowardSlotIfNeeded", JABS_AiManager.moveTowardSlotIfNeeded);
JABS_AiManager.moveTowardSlotIfNeeded = function(allyBattler, desiredX, desiredY)
{
  // acquire the character once.
  const chr = allyBattler.getCharacter();

  // resolve tolerances.
  // default if ALLYAI not present.
  let tolerance = 0.45;
  // extra ring outside tolerance for gentle throttling near target.
  let hysteresis = 0.25;
  if (J.ABS.EXT.ALLYAI && J.ABS.EXT.ALLYAI.Metadata)
  {
    // use the configured formation tolerance if available.
    tolerance = J.ABS.EXT.ALLYAI.Metadata.FormationTolerance;

    // use the configured hysteresis if available.
    hysteresis = 0.25;
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
 * Overrides {@link #calculateFormationSlotCoordinates}.<br/>
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
 * Overrides {@link #isWithinTolerance}.<br/>
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

/**
 * Extends {@link #moveTowardSlotIfNeeded}.<br/>
 * Replaces movement with PIXEL-aware hysteresis and near-target throttling to prevent sliding.
 * This implementation does NOT call the original; it fully handles formation movement.
 * @param {JABS_Battler} allyBattler The ally battler.
 * @param {number} desiredX The desired slot x (fractional center).
 * @param {number} desiredY The desired slot y (fractional center).
 */
J.ABS.EXT.PIXEL.Aliased.JABS_AiManager.set("moveTowardSlotIfNeeded", JABS_AiManager.moveTowardSlotIfNeeded);
JABS_AiManager.moveTowardSlotIfNeeded = function(allyBattler, desiredX, desiredY)
{
  // acquire the character once.
  const chr = allyBattler.getCharacter();

  // resolve tolerances.
  // default if ALLYAI not present.
  let tolerance = 0.45;
  // extra ring outside tolerance for gentle throttling near target.
  let hysteresis = 0.25;
  if (J.ABS.EXT.ALLYAI && J.ABS.EXT.ALLYAI.Metadata)
  {
    tolerance = J.ABS.EXT.ALLYAI.Metadata.FormationTolerance;
    hysteresis = 0.25;
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
    if (chr.isPixelOnCooldown && chr.isPixelOnCooldown())
    {
      // do not move this frame while on cooldown.
      return;
    }

    // if able to move, issue a single smart step and set a short cooldown.
    if (allyBattler.canBattlerMove())
    {
      allyBattler.smartMoveTowardCoordinates(desiredX, desiredY);

      // set a short, local cooldown (1 frame) to reduce micro-steps and sliding.
      if (!chr._j) chr._j = {};
      chr._j._pixelMoveCooldown = 1;
    }

    // done processing near-range.
    return;
  }

  // we are far enough away: move every frame without throttling for responsiveness.
  if (allyBattler.canBattlerMove())
  {
    allyBattler.smartMoveTowardCoordinates(desiredX, desiredY);
  }
};
//endregion JABS_AiManager