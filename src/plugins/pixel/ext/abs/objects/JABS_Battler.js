//region JABS_Battler
/**
 * Extends {@link #initIdleInfo}.<br/>
 * Adds pixel-movement-aware idle destination and wait timer state.
 */
J.PIXEL.EXT.ABS.Aliased.JABS_Battler.set('initIdleInfo', JABS_Battler.prototype.initIdleInfo);
JABS_Battler.prototype.initIdleInfo = function()
{
  // perform original logic.
  J.PIXEL.EXT.ABS.Aliased.JABS_Battler.get('initIdleInfo').call(this);

  // policy step inside init idle info.
  /**
   * The pixel-space destination this battler is currently wandering toward.
   * Null when the battler has no current wander target.
   * @type {{x: number, y: number}|null}
   */
  this._pixelIdleDest ??= null;

  // policy step inside init idle info.
  /**
   * The number of frames remaining before this battler picks a new wander destination.
   * @type {number}
   */
  this._pixelIdleWait ??= 0;

  // policy step inside init idle info.
  /**
   * The number of consecutive frames this battler has been unable to reach its
   * current wander destination. Used to detect and escape stuck states.
   * @type {number}
   */
  this._pixelIdleStuckFrames ??= 0;
};

/**
 * Overwrites {@link #isHome}.<br/>
 * Uses a distance-based check instead of integer tile equality, since pixel
 * movement coordinates are fractional and exact equality is never satisfied.
 * @returns {boolean} True if within half a tile of home, false otherwise.
 */
J.PIXEL.EXT.ABS.Aliased.JABS_Battler.set('isHome', JABS_Battler.prototype.isHome);
JABS_Battler.prototype.isHome = function()
{
  return this.distanceToHome() < 0.5;
};

/**
 * The number of consecutive traveling frames allowed before a destination is
 * abandoned. At 60 fps this is 1.5 seconds, which is enough time to cross the
 * entire wander radius; if the battler hasn't arrived by then it is stuck.
 * @type {number}
 */
JABS_Battler.pixelIdleStuckLimit = 90;

/**
 * Executes the pixel-aware idle wander state machine for one game frame.
 *
 * States:
 *  - Waiting: decrement the wait timer; do not move.
 *  - Traveling: move toward the current destination; on arrival, transition to Waiting.
 *              Abandons the destination and enters Waiting if stuck for too long.
 *  - Choosing: no destination and no wait; roll a new destination or wait if none found.
 */
JABS_Battler.prototype.updatePixelIdleWander = function()
{
  // ensure properties are present (handles pre-plugin saves).
  this._pixelIdleDest ??= null;
  this._pixelIdleWait ??= 0;
  this._pixelIdleStuckFrames ??= 0;

  // waiting — tick down and hold position.
  if (this._pixelIdleWait > 0)
  {
    this._pixelIdleWait--;
    return;
  }

  // traveling — move toward the chosen destination.
  if (this._pixelIdleDest !== null)
  {
    const { x, y } = this._pixelIdleDest;

    // arrived when within a comfortable fraction of a tile.
    const arrived = Math.hypot(this.getX() - x, this.getY() - y) < 0.25;

    // when arrived  equals  false, take this branch.
    if (arrived === false)
    {
      // count consecutive frames spent trying to reach this destination.
      this._pixelIdleStuckFrames++;

      // if stuck too long, abandon the destination rather than twitching forever.
      if (this._pixelIdleStuckFrames >= JABS_Battler.pixelIdleStuckLimit)
      {
        this._pixelIdleDest = null;
        this._pixelIdleStuckFrames = 0;
        this._pixelIdleWait = this._rollIdleWaitDuration();
        return;
      }

      // keep moving toward the destination this frame.
      this.smartMoveTowardCoordinates(x, y);
      return;
    }

    // arrived — clear the destination and start the post-arrival wait.
    this._pixelIdleDest = null;
    this._pixelIdleStuckFrames = 0;
    this._pixelIdleWait = this._rollIdleWaitDuration();
    return;
  }

  // no destination and no wait — try to roll a valid wander point.
  const dest = this._rollIdleDestination();

  // if all candidates were impassable, wait a cycle before trying again.
  if (dest === null)
  {
    this._pixelIdleWait = this._rollIdleWaitDuration();
    return;
  }

  // store  pixel idle dest on the instance for later reads.
  this._pixelIdleDest = dest;
  this._pixelIdleStuckFrames = 0;
};

/**
 * Rolls a random wait duration before this battler picks its next wander destination.
 * Returns a random multiple of 30 frames between 30 and 300 (one to ten seconds at 30 fps).
 * @returns {number} The number of frames to wait.
 */
JABS_Battler.prototype._rollIdleWaitDuration = function()
{
  // 4–10 inclusive, each unit = 30 frames; range is 2 to 5 seconds at 60 fps.
  const multiplier = Math.randomInt(7) + 4;

  // hand back multiplier * 30 to the caller.
  return multiplier * 30;
};

/**
 * Rolls a random wander destination within the configured idle wander radius of home.
 * Retries up to five times to find a tile that is passable in at least one cardinal direction.
 * Returns null if every candidate lands on impassable terrain.
 * @returns {{x: number, y: number}|null} The chosen destination, or null if none found.
 */
JABS_Battler.prototype._rollIdleDestination = function()
{
  const homeX = this.getHomeX();
  const homeY = this.getHomeY();
  const range = J.PIXEL.EXT.ABS.Metadata.IdleWanderRadius;

  // iterate the loop counter until the guard exits.
  for (let attempt = 0; attempt < 5; attempt++)
  {
    // random offset along each axis within [-range, range].
    const dx = (Math.random() * range * 2) - range;
    const dy = (Math.random() * range * 2) - range;

    // capture dest x for downstream policy in this routine.
    const destX = homeX + dx;
    const destY = homeY + dy;

    // capture tx for downstream policy in this routine.
    const tx = Math.round(destX);
    const ty = Math.round(destY);

    // accept the tile if it allows passage in any cardinal direction.
    const walkable = $gameMap.isPassable(tx, ty, 2)
      || $gameMap.isPassable(tx, ty, 4)
      || $gameMap.isPassable(tx, ty, 6)
      || $gameMap.isPassable(tx, ty, 8);

    // when walkable, take this branch.
    if (walkable)
    {
      return { x: destX, y: destY };
    }
  }

  // all five candidates were impassable.
  return null;
};

/**
 * Extends {@link #setDodgeSteps}.<br/>
 * Scales the step count by the pixel collision density so dodge distance
 * covers the same visual distance as it would in tile-locked movement.
 * @param {number} stepCount The number of steps to dodge.
 */
J.PIXEL.EXT.ABS.Aliased.JABS_Battler.set('setDodgeSteps', JABS_Battler.prototype.setDodgeSteps);
JABS_Battler.prototype.setDodgeSteps = function(stepCount)
{
  // ensure the collision manager is configured before reading its step count.
  if (PIXEL_CollisionManager.collisionStepCount === undefined)
  {
    // initialize with defaults.
    PIXEL_CollisionManager.initConfig();
  }

  // scale step count by the subcell density so dodge covers the intended tile distance.
  const scaledStepCount = stepCount * PIXEL_CollisionManager.collisionStepCount;

  // perform original logic with the scaled step count.
  J.PIXEL.EXT.ABS.Aliased.JABS_Battler.get('setDodgeSteps')
    .call(this, scaledStepCount);
};

/**
 * Extends {@link #destroy}.<br/>
 * Rebuilds the pixel collision table when an enemy battler is defeated,
 * in case the enemy event occupied passability cells that are now vacated.
 */
J.PIXEL.EXT.ABS.Aliased.JABS_Battler.set('destroy', JABS_Battler.prototype.destroy);
JABS_Battler.prototype.destroy = function()
{
  // record whether the battler being destroyed is an enemy (not an actor).
  const isEnemy = this.getBattler().isActor() === false;

  // perform original logic.
  J.PIXEL.EXT.ABS.Aliased.JABS_Battler.get('destroy')
    .call(this);

  // if an enemy was destroyed, rebuild the collision table to free any blocked cells.
  if (isEnemy)
  {
    // rebuild the subcell collision table for the current map.
    PIXEL_CollisionManager.setupCollision();
  }
};

/**
 * Tries to move this battler away from its current target until leaving the "close" band.
 * Chooses the direction that maximizes separation next frame based on simulated steps.
 * Falls back to a passable direction if none increases separation to get unstuck.
 */
JABS_Battler.prototype.smartMoveAwayFromTarget = function()
{
  // Acquire the current target.
  const target = this.getTarget();

  // If there is no target, then do nothing.
  if (!target)
  {
    // No retreat needed with no target.
    return;
  }

  // forced dodge owns movement; pixel steering here stacks dodge speed and reads as free sprint.
  if (this.isDodging())
  {
    return;
  }

  // when this.guarding(), take this branch.
  if (this.guarding())
  {
    return;
  }

  // Acquire our character.
  const chr = this.getCharacter();

  // Compute vector (self - target) so we move away from target.
  const dx = chr.x - target.getX();
  const dy = chr.y - target.getY();

  // Compute current Euclidean distance in tiles (fractional coordinates).
  const currentDistance = Math.sqrt(dx * dx + dy * dy);

  // If we are not "close", then no need to step away this frame.
  if (JABS_Battler.isClose(currentDistance) === false)
  {
    // Spacing is safe or far; do nothing.
    return;
  }

  // Define a small hysteresis so we retreat until clearly outside the close band.
  const hysteresis = 0.25;

  // If we already passed closeBand + hysteresis, then stop retreating.
  if (currentDistance >= (JABS_Battler.closeDistance + hysteresis))
  {
    // We are outside the danger band far enough; stop retreating.
    return;
  }

  // If we have an active retreat micro-route and it remains passable, honor it.
  if (chr.isMicroRouting())
  {
    // Acquire the cached retreat direction.
    const cachedDirection = chr.getMicroRouteDirection();

    // Determine if the cached direction remains passable.
    let cachedPassable;

    // Check diagonal passability for diagonal directions.
    if (chr.isDiagonalDirection(cachedDirection))
    {
      // Check diagonal passability.
      cachedPassable = chr.canPassDiagonalByDirection(cachedDirection);
    }
    else
    {
      // Check straight passability.
      cachedPassable = chr.canPassStraight(cachedDirection);
    }

    // If still passable, apply it and decrement remaining frames.
    if (cachedPassable)
    {
      // Execute the step in the cached direction.
      chr.pixelMoveByInput(cachedDirection);

      // Reduce how many frames remain for this micro-route.
      chr.decrementMicroRouteFrames();

      // Continue following the cached direction this frame.
      return;
    }

    // If blocked, drop the micro-route immediately.
    chr.clearMicroRoute();
  }

  // Build a collection of candidate directions to consider for retreat.
  const directions = [
    J.ABS.Directions.LOWERLEFT,
    J.ABS.Directions.DOWN,
    J.ABS.Directions.LOWERRIGHT,
    J.ABS.Directions.LEFT,
    J.ABS.Directions.RIGHT,
    J.ABS.Directions.UPPERLEFT,
    J.ABS.Directions.UP,
    J.ABS.Directions.UPPERRIGHT,
  ];

  // Determine the straight and diagonal step distances for accurate simulation.
  const straightStep = chr.distancePerFrame();
  const diagonalStep = chr.diagonalDistancePerFrame();

  // Initialize a variable to track the best separating candidate.
  let bestDirection = 0;

  // Initialize the best separation found.
  let bestSeparation = currentDistance;

  // Define a small epsilon; new distance must exceed this to be considered an improvement.
  const epsilon = 0.01;

  // Iterate over all candidates to find the best separating direction.
  directions.forEach(dir =>
  {
    // Determine if this direction is diagonal.
    const isDiagonal = chr.isDiagonalDirection(dir);

    // Skip directions that are not passable.
    if (isDiagonal)
    {
      // If we cannot pass diagonally, skip.
      if (chr.canPassDiagonalByDirection(dir) === false) return;
    }
    else
    {
      // If we cannot pass straight, skip.
      if (chr.canPassStraight(dir) === false) return;
    }

    // Simulate the next position if we moved in this direction by the correct step distance.
    let simX = chr.x;
    let simY = chr.y;

    // Simulate displacement based on the direction.
    if (dir === J.ABS.Directions.LOWERLEFT)
    {
      // Down-left.
      simX -= diagonalStep;
      simY += diagonalStep;
    }
    else if (dir === J.ABS.Directions.LOWERRIGHT)
    {
      // Down-right.
      simX += diagonalStep;
      simY += diagonalStep;
    }
    else if (dir === J.ABS.Directions.UPPERLEFT)
    {
      // Up-left.
      simX -= diagonalStep;
      simY -= diagonalStep;
    }
    else if (dir === J.ABS.Directions.UPPERRIGHT)
    {
      // Up-right.
      simX += diagonalStep;
      simY -= diagonalStep;
    }
    else if (dir === J.ABS.Directions.DOWN)
    {
      // Down.
      simY += straightStep;
    }
    else if (dir === J.ABS.Directions.UP)
    {
      // Up.
      simY -= straightStep;
    }
    else if (dir === J.ABS.Directions.RIGHT)
    {
      // Right.
      simX += straightStep;
    }
    else if (dir === J.ABS.Directions.LEFT)
    {
      // Left.
      simX -= straightStep;
    }

    // Compute the simulated separation from target after this step.
    const sdx = simX - target.getX();
    const sdy = simY - target.getY();
    const simulatedDistance = Math.sqrt(sdx * sdx + sdy * sdy);

    // If the simulated distance meaningfully increases, consider it the new best.
    if ((simulatedDistance - bestSeparation) > epsilon)
    {
      // Track this candidate as best so far.
      bestSeparation = simulatedDistance;
      bestDirection = dir;
    }
  });

  // If no candidate increased separation, attempt to move in any passable direction to get unstuck.
  if (bestDirection === 0)
  {
    // First try diagonals to slide out of corners.
    const diagonalFallbacks = [
      J.ABS.Directions.LOWERLEFT,
      J.ABS.Directions.LOWERRIGHT,
      J.ABS.Directions.UPPERLEFT,
      J.ABS.Directions.UPPERRIGHT,
    ];
    let chosen = 0;
    diagonalFallbacks.forEach(dir =>
    {
      // If not yet chosen and passable diagonally, choose it.
      if (chosen === 0 && chr.canPassDiagonalByDirection(dir))
      {
        // Assign this diagonal as chosen.
        chosen = dir;
      }
    });

    // If no diagonal worked, try cardinals.
    if (chosen === 0)
    {
      const cardinalFallbacks = [
        J.ABS.Directions.LEFT,
        J.ABS.Directions.RIGHT,
        J.ABS.Directions.UP,
        J.ABS.Directions.DOWN,
      ];
      cardinalFallbacks.forEach(dir =>
      {
        // If not yet chosen and passable straight, choose it.
        if (chosen === 0 && chr.canPassStraight(dir))
        {
          // Assign this cardinal as chosen.
          chosen = dir;
        }
      });
    }

    // Assign the chosen fallback direction, if any.
    bestDirection = chosen;
  }

  // If still no direction available, wait a bit so neighbors can shuffle.
  if (bestDirection === 0)
  {
    // Apply a small wait to prevent tight-looping.
    this.setWaitCountdown(2);

    // Do not attempt to move this frame.
    return;
  }

  // Execute the pixel step away in the best direction.
  chr.pixelMoveByInput(bestDirection);

  // Seed a very short retreat micro-route to avoid per-frame dithering.
  // Use a slightly longer hold when we are very close.
  const taxi = Math.abs(dx) + Math.abs(dy);
  let frames = 1;

  // If we are extremely close, hold a couple of frames to create space.
  if (taxi < 1.25)
  {
    // Hold two frames when very close.
    frames = 2;
  }

  // Cache the micro-route direction and frame count for retreat.
  chr.setMicroRouteDirection(bestDirection);
  chr.setMicroRouteFrames(frames);
};

/**
 * Tries to move this battler toward a set of coordinates.
 * Chooses a direction based on angle, prefers diagonals, and holds that
 * direction for a few frames (a "micro-route") before re-deciding.
 * @param {number} targetX The x coordinate to reach.
 * @param {number} targetY The y coordinate to reach.
 */
JABS_Battler.prototype.smartMoveTowardCoordinates = function(targetX, targetY)
{
  // ally ai + formations issue this every frame; while dodging it fights executeDodgeMovement and stacks dodge speed.
  if (this.isDodging())
  {
    return;
  }

  // when this.guarding(), take this branch.
  if (this.guarding())
  {
    return;
  }

  // Acquire the character for this battler.
  const chr = this.getCharacter();

  // Compute vector from self to target.
  const deltaX = targetX - chr.x;
  const deltaY = targetY - chr.y;

  // If we have practically arrived (within small tolerance), do nothing.
  const arrived = Math.abs(deltaX) + Math.abs(deltaY) < 0.1;
  if (arrived)
  {
    // Do not force movement when already close enough.
    return;
  }

  // Continue an active micro-route if it remains passable; returns true if handled.
  const continueMicroRouteIfValid = () =>
  {
    // If there are no micro-route frames left, do nothing.
    if (chr.getMicroRouteFrames() <= 0) return false;

    // Acquire the cached direction.
    const cachedDir = chr.getMicroRouteDirection();

    // Determine if the cached direction remains passable.
    const cachedOk = chr.isDiagonalDirection(cachedDir)
      ? chr.canPassDiagonalByDirection(cachedDir)
      : chr.canPassStraight(cachedDir);

    // If not passable, clear the micro-route and fall through to choosing a new direction.
    if (cachedOk === false)
    {
      // Reset the micro-route.
      chr.clearMicroRoute();

      // Indicate we did not handle movement this frame.
      return false;
    }

    // Execute the step in the cached direction.
    chr.pixelMoveByInput(cachedDir);

    // Reduce how many frames remain for this micro-route.
    chr.decrementMicroRouteFrames();

    // Indicate we handled movement this frame.
    return true;
  };

  // If the micro-route handled movement, do not select a new direction.
  if (continueMicroRouteIfValid()) return;

  // Choose a direction based on the angle to the target.
  const angleDegrees = this.calculateAngle(targetX, targetY);

  // Convert angle to an 8-direction code.
  const primaryDirection = this.angleToDirection(angleDegrees);

  // Probe helpers for passability.
  const canGoStraight = (dir) => chr.canPassStraight(dir);
  const canGoDiagonal = (dir) => chr.canPassDiagonalByDirection(dir);

  // Prefer the primary direction from the angle if it is passable.
  const choosePrimaryIfPossible = () =>
  {
    // If the primary is diagonal and passable, choose it.
    if (chr.isDiagonalDirection(primaryDirection) && canGoDiagonal(primaryDirection))
    {
      // Return the chosen primary diagonal.
      return primaryDirection;
    }

    // If the primary is straight and passable, choose it.
    if (chr.isStraightDirection(primaryDirection) && canGoStraight(primaryDirection))
    {
      // Return the chosen primary cardinal.
      return primaryDirection;
    }

    // Could not choose the primary direction.
    return 0;
  };

  // Build one diagonal candidate pointing toward the target based on the vector.
  const buildDiagonalCandidate = () =>
  {
    // Determine coarse wants along axes.
    const wantLeft = deltaX < 0;
    const wantRight = deltaX > 0;
    const wantUp = deltaY < 0;
    const wantDown = deltaY > 0;

    // Down-left candidate.
    if (wantDown && wantLeft) return J.ABS.Directions.LOWERLEFT;

    // Down-right candidate.
    if (wantDown && wantRight) return J.ABS.Directions.LOWERRIGHT;

    // Up-left candidate.
    if (wantUp && wantLeft) return J.ABS.Directions.UPPERLEFT;

    // Up-right candidate.
    if (wantUp && wantRight) return J.ABS.Directions.UPPERRIGHT;

    // No diagonal intent.
    return 0;
  };

  // Builds an ordered list of cardinal candidates toward the target.
  const buildCardinalCandidates = () =>
  {
    // Determine coarse wants.
    const wantLeft = deltaX < 0;
    const wantRight = deltaX > 0;
    const wantUp = deltaY < 0;
    const wantDown = deltaY > 0;

    // Prefer the axis with larger magnitude first.
    const preferHorizontal = Math.abs(deltaX) >= Math.abs(deltaY);

    // Create the ordered list.
    const candidates = [];

    // If horizontal contributes most, list horizontal first.
    if (preferHorizontal)
    {
      if (wantRight) candidates.push(J.ABS.Directions.RIGHT);
      if (wantLeft) candidates.push(J.ABS.Directions.LEFT);
      if (wantDown) candidates.push(J.ABS.Directions.DOWN);
      if (wantUp) candidates.push(J.ABS.Directions.UP);
    }
    else
    {
      // Otherwise, list vertical first.
      if (wantDown) candidates.push(J.ABS.Directions.DOWN);
      if (wantUp) candidates.push(J.ABS.Directions.UP);
      if (wantRight) candidates.push(J.ABS.Directions.RIGHT);
      if (wantLeft) candidates.push(J.ABS.Directions.LEFT);
    }

    // Return the ordered list of cardinals.
    return candidates;
  };

  // Attempts to pick a passable direction using the primary, then diagonal, then cardinals.
  const decideDirection = () =>
  {
    // Try the primary from the angle.
    const primary = choosePrimaryIfPossible();
    if (primary !== 0) return primary;

    // Try the single diagonal implied by the vector.
    const diagonalCandidate = buildDiagonalCandidate();
    if (diagonalCandidate !== 0 && canGoDiagonal(diagonalCandidate)) return diagonalCandidate;

    // Try cardinals in priority order.
    const cards = buildCardinalCandidates();
    let chosen = 0;
    cards.forEach(dir =>
    {
      // Choose the first passable cardinal.
      if (chosen === 0 && canGoStraight(dir)) chosen = dir;
    });

    // Return the chosen cardinal (or 0).
    return chosen;
  };

  // Direction decided so far (0 if none).
  let decidedDirection = decideDirection();

  // If no pixel-aware choice worked, fall back to tile A* as a hint.
  if (decidedDirection === 0)
  {
    // Acquire an A* direction based on tile centers.
    const aStarDir = chr.findDirectionTo(Math.round(targetX), Math.round(targetY));

    // If A* found something, adopt it.
    if (aStarDir > 0) decidedDirection = aStarDir;
  }

  // If we still do not have a direction, wait briefly and try again next frame.
  if (decidedDirection === 0)
  {
    // Small wait to let surrounding battlers shuffle; not a long stall.
    this.setWaitCountdown(2);

    // Do not attempt to move this frame.
    return;
  }

  // Execute the step toward the target.
  chr.pixelMoveByInput(decidedDirection);

  // Seed a short micro-route to reduce dithering; scale by taxi distance.
  const taxiDistance = Math.abs(deltaX) + Math.abs(deltaY);
  let framesToHold = 1;
  if (taxiDistance > 3)
  {
    // Hold a bit longer when far away.
    framesToHold = 16;
  }
  else if (taxiDistance > 1.5)
  {
    // Hold a short time when moderately far.
    framesToHold = 8;
  }

  // Cache the micro-route direction and frame count.
  chr.setMicroRouteDirection(decidedDirection);
  chr.setMicroRouteFrames(framesToHold);
};

/**
 * Calculates the angle to the target coordinates.
 * @param {number} targetX The targetX coordinate of the target point.
 * @param {number} targetY The targetY coordinate of the target point.
 * @returns {number} The angle in degrees.
 */
JABS_Battler.prototype.calculateAngle = function(targetX, targetY)
{
  // Acquire start coordinates.
  const selfX = this.getX();
  const selfY = this.getY();

  // Compute deltas from self to target (target - self).
  const dx = targetX - selfX;
  const dy = targetY - selfY;

  // Convert to degrees using atan2 and return the angle.
  const angle = Math.atan2(dy, dx) * 180 / Math.PI;

  // Return the computed angle in degrees.
  return angle;
};

/**
 * Calculates the 8-directional direction based on the angle.
 * RMMZ map coords are Y-down, so:
 *  0°  = RIGHT(6)
 * +90° = DOWN(2)
 * ±180°= LEFT(4)
 * -90° = UP(8)
 * Sectors are 45° wide with boundaries at ±22.5°, ±67.5°, ±112.5°, ±157.5°.
 *
 * {@link Game_Player.prototype.dir8ToAngle} uses 0..360 (UP=270°), while analog sticks use atan2
 * in [-180,180] (UP=-90°). Normalize first so keyboard north never lands in the LEFT bucket.
 *
 * @param {number} angle The angle in degrees (atan2 or dir8ToAngle).
 * @returns {1|2|3|4|6|7|8|9}
 */
JABS_Battler.prototype.angleToDirection = function(angle)
{
  // Fold into (-180, 180] so sector math matches both angle producers.
  let a = angle;

  // when a > 180, take this branch.
  if (a > 180)
  {
    a -= 360;
  }
  else if (a <= -180)
  {
    a += 360;
  }

  // Define half-sector width (45° / 2).
  const half = 22.5;

  // RIGHT: -22.5 .. 22.5
  // 6.
  const isRight = a > -half && a <= half;

  // DOWN-RIGHT: 22.5 .. 67.5
  // 3.
  const isDownRight = a > half && a <= (half + 45);

  // DOWN: 67.5 .. 112.5
  // 2.
  const isDown = a > (half + 45) && a <= (half + 90);

  // DOWN-LEFT: 112.5 .. 157.5
  // 1.
  const isDownLeft = a > (half + 90) && a <= (half + 135);

  // LEFT: >157.5 or <= -157.5
  // 4.
  const isLeft = a > (half + 135) || a <= -(half + 135);

  // UP-LEFT: -157.5 .. -112.5
  // 7.
  const isUpLeft = a > -(half + 135) && a <= -(half + 90);

  // UP: -112.5 .. -67.5
  // 8.
  const isUp = a > -(half + 90) && a <= -(half + 45);

  // UP-RIGHT: -67.5 .. -22.5
  // 9.
  const isUpRight = a > -(half + 45) && a <= -half;

  // Map the sector to the direction numbers.
  if (isRight)
  {
    // 6.
    return J.ABS.Directions.RIGHT;
  }
  else if (isDownRight)
  {
    // 3.
    return J.ABS.Directions.LOWERRIGHT;
  }
  else if (isDown)
  {
    // 2.
    return J.ABS.Directions.DOWN;
  }
  else if (isDownLeft)
  {
    // 1.
    return J.ABS.Directions.LOWERLEFT;
  }
  else if (isLeft)
  {
    // 4.
    return J.ABS.Directions.LEFT;
  }
  else if (isUpLeft)
  {
    // 7.
    return J.ABS.Directions.UPPERLEFT;
  }
  else if (isUp)
  {
    // 8.
    return J.ABS.Directions.UP;
  }
  else if (isUpRight)
  {
    // 9.
    return J.ABS.Directions.UPPERRIGHT;
  }

  // Unknown sector; return 0.
  return 0;
};

/**
 * Extends {@link JABS_Battler#getProjectileSpawnBaseDirection}.<br/>
 * Uses analog / keyboard vector input for the party leader so projectile spokes
 * match actual travel intent: {@link Game_CharacterBase#vectorMoveByAngle} keeps
 * {@link Game_Character#direction} cardinal for 4-dir sprites, which would
 * otherwise mis-aim line and formation projectiles.
 * When {@link Game_CharacterBase#isDirectionFixed} is true (JABS strafe / hold facing),
 * movement can disagree with sprite facing — fall back to map facing so shots do not
 * emit opposite the way the character is drawn.
 */
J.PIXEL.EXT.ABS.Aliased.JABS_Battler.set(
  'getProjectileSpawnBaseDirection',
  JABS_Battler.prototype.getProjectileSpawnBaseDirection,
);
JABS_Battler.prototype.getProjectileSpawnBaseDirection = function()
{
  const chr = this.getCharacter();

  // party leader: prefer the true bearing while vector movement is active.
  if (chr === $gamePlayer && typeof chr.getVectorInputAngle === 'function')
  {
    // strafe locks facing via direction fix — vector aim would track movement and look like backward fire.
    if (typeof chr.isDirectionFixed === 'function' && chr.isDirectionFixed())
    {
      // perform original logic.
      return J.PIXEL.EXT.ABS.Aliased.JABS_Battler.get('getProjectileSpawnBaseDirection').call(this);
    }

    // capture vector angle for downstream policy in this routine.
    const vectorAngle = chr.getVectorInputAngle();

    // when vectorAngle  differs from  null, take this branch.
    if (vectorAngle !== null)
    {
      return this.angleToDirection(vectorAngle);
    }
  }

  // perform original logic.
  return J.PIXEL.EXT.ABS.Aliased.JABS_Battler.get('getProjectileSpawnBaseDirection').call(this);
};
//endregion JABS_Battler