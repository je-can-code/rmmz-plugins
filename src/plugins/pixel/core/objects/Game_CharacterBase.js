//region Game_CharacterBase
import PIXEL_CollisionManager from './../managers/PIXEL_CollisionManager.js';
import PixelDebugSampler from './../_models/PixelDebugSampler.js';

//region init
/**
 * Extends {@link Game_CharacterBase.initMembers}.<br/>
 * Includes this plugin's extra properties as well.
 */
J.PIXEL.Aliased.Game_CharacterBase.set('initMembers', Game_CharacterBase.prototype.initMembers);
Game_CharacterBase.prototype.initMembers = function()
{
  // perform original logic.
  J.PIXEL.Aliased.Game_CharacterBase.get('initMembers')
    .call(this);

  // initialize the additional members.
  this.initPixelMovementMembers();
};

/**
 * Initializes the new members related to this plugin.
 * Uses ??= so that pre-existing values on a loaded save are never overwritten,
 * making this method safe to call defensively at any point.
 */
Game_CharacterBase.prototype.initPixelMovementMembers = function()
{
  /**
   * The shared root namespace for all of J's plugin data.
   */
  this._j ||= {};

  /**
   * The pixel movement namespace, scoped under _j to avoid collisions
   * with properties introduced by other plugins.
   */
  this._j._pixel ||= {};

  /**
   * The collection for tracking the {@link Point} coordinates for all members.
   * This is managed in a first-in-first-out (FIFO) style.
   * @type {Point[]}
   */
  this._j._pixel._positionalRecords ??= [];

  /**
   * Whether or not one of the directional inputs are being held down.
   * @type {boolean} True if at least one direction is being held, false otherwise.
   */
  this._j._pixel._movePressing ??= false;

  /**
   * The move distance for tracking steps.
   * @type {number}
   */
  this._j._pixel._moveDistance ??= 0;

  /**
   * The number of steps this character has taken.
   * @type {number}
   */
  this._j._pixel._steps ??= 0;

  /**
   * Cooldown frames after a pixel move before another can be issued.
   * Prevents AllyAI from pushing every single frame.
   * @type {number}
   */
  this._j._pixel._moveCooldown ??= 0;

  /**
   * Whether a pixel-route repeat is currently active for this character.
   * Used to repeat a single move-route command multiple times to cover the intended distance.
   * @type {boolean}
   */
  this._j._pixel._repeatMoveActive ??= false;

  /**
   * How many remaining repeat-ticks are left for the current route command.
   * @type {number}
   */
  this._j._pixel._repeatMoveCount ??= 0;

  /**
   * Flag indicating whether a pixel step occurred this frame.
   * Used to preserve walk animation even when render coords snap each update.
   * @type {boolean}
   */
  this._j._pixel._movedThisFrame ??= false;

  /**
   * The cached direction for the micro-route (if any).
   * @type {number}
   */
  this._j._pixel._mrDir ??= 0;

  /**
   * The remaining frames to apply the cached micro-route direction.
   * @type {number}
   */
  this._j._pixel._mrFrames ??= 0;
};
//endregion init

/**
 * Returns the pixel movement state namespace for this character.
 * If the namespace is absent — for example when loading a save created before
 * this plugin was installed — it is initialized on demand so that no individual
 * getter or setter needs its own defensive guard.
 * @returns {object} The `this._j._pixel` state object.
 */
Game_CharacterBase.prototype._pixelState = function()
{
  if (!this._j || !this._j._pixel)
  {
    this.initPixelMovementMembers();
  }

  return this._j._pixel;
};

//region properties
/**
 * Gets the remaining cooldown frames before another pixel move can be issued.
 * @returns {number} The remaining cooldown frames.
 */
Game_CharacterBase.prototype.getPixelMoveCooldown = function()
{
  // Return the remaining cooldown frames for pixel movement.
  return this._pixelState()._moveCooldown;
};

/**
 * Sets the remaining cooldown frames for pixel movement.
 * @param {number} frames The number of frames to set for cooldown.
 */
Game_CharacterBase.prototype.setPixelMoveCooldown = function(frames)
{
  // Assign the new cooldown frame count for pixel movement.
  this._pixelState()._moveCooldown = frames;
};

/**
 * Gets whether or not a pixel-route command repeat is currently active.
 * @returns {boolean} True if a repeat is ongoing, false otherwise.
 */
Game_CharacterBase.prototype.isRepeatMoveActive = function()
{
  return this._pixelState()._repeatMoveActive === true;
};

/**
 * Begins a pixel-route command repeat cycle.
 */
Game_CharacterBase.prototype.beginRepeatMove = function()
{
  // activate the repeat flag.
  this._pixelState()._repeatMoveActive = true;
};

/**
 * Ends the current pixel-route command repeat cycle.
 */
Game_CharacterBase.prototype.stopRepeatMove = function()
{
  // deactivate the repeat flag.
  this._pixelState()._repeatMoveActive = false;
};

/**
 * Gets how many repeat-ticks remain for the current route command.
 * @returns {number} The remaining repeat count.
 */
Game_CharacterBase.prototype.getRepeatMoveCount = function()
{
  return this._pixelState()._repeatMoveCount;
};

/**
 * Sets the repeat-tick counter to a given number.
 * @param {number} count The number of ticks to hold the current command.
 */
Game_CharacterBase.prototype.setRepeatMoveCount = function(count)
{
  // assign the new repeat count.
  this._pixelState()._repeatMoveCount = count;
};

/**
 * Decrements the repeat-tick counter by one.
 */
Game_CharacterBase.prototype.decrementRepeatMoveCount = function()
{
  // only decrement if there is a remaining count.
  if (this.getRepeatMoveCount() > 0)
  {
    // reduce by one tick.
    this.setRepeatMoveCount(this.getRepeatMoveCount() - 1);
  }
};

/**
 * Gets the default repeat count for a single route command based on collision density.
 * This ensures that scripted movement commands cover the full intended tile distance.
 * @returns {number} The collision step count.
 */
Game_CharacterBase.prototype.pixelRepeatCountForRoute = function()
{
  // repeat enough frames to cover exactly one full tile at this character's speed.
  return Math.ceil(1.0 / this.distancePerFrame());
};

/**
 * Decrements the pixel-move cooldown by one frame if applicable.
 */
Game_CharacterBase.prototype.decrementPixelMoveCooldown = function()
{
  // Only decrement if we actually have a cooldown remaining.
  if (this.getPixelMoveCooldown() > 0)
  {
    // Reduce the cooldown by a single frame.
    this.setPixelMoveCooldown(this.getPixelMoveCooldown() - 1);
  }
};

/**
 * Determines whether or not we are currently on a cooldown for pixel movement.
 * @returns {boolean}
 */
Game_CharacterBase.prototype.isPixelOnCooldown = function()
{
  // if we have any current cooldown value, we are on cooldown.
  return this.getPixelMoveCooldown() > 0;
};

/**
 * Flags whether or not this character performed a pixel step this frame.
 * @param {boolean=} moved Whether or not we moved this frame; defaults to true.
 */
Game_CharacterBase.prototype.setMovedThisFrame = function(moved = true)
{
  // Flag whether or not we moved this frame.
  this._pixelState()._movedThisFrame = moved;
};

/**
 * Gets whether or not this character performed a pixel step this frame.
 * @returns {boolean} True if we moved this frame, false otherwise.
 */
Game_CharacterBase.prototype.didMoveThisFrame = function()
{
  // Return whether or not we moved this frame.
  return this._pixelState()._movedThisFrame === true;
};

/**
 * Clears the per-frame pixel movement flag.
 */
Game_CharacterBase.prototype.clearMovedThisFrame = function()
{
  // Reset the frame-based movement flag.
  this._pixelState()._movedThisFrame = false;
};

/**
 * Gets the cached micro-route direction.
 * @returns {number} The cached 8-dir code, or 0 if unset.
 */
Game_CharacterBase.prototype.getMicroRouteDirection = function()
{
  // Return the cached micro-route direction.
  return this._pixelState()._mrDir;
};

/**
 * Sets the cached micro-route direction.
 * @param {number} newDirection The 8-dir code to cache.
 */
Game_CharacterBase.prototype.setMicroRouteDirection = function(newDirection)
{
  // Assign the new cached micro-route direction.
  this._pixelState()._mrDir = newDirection;
};

/**
 * Gets the remaining micro-route frames.
 * @returns {number} The remaining frames for the cached direction.
 */
Game_CharacterBase.prototype.getMicroRouteFrames = function()
{
  // Return how many frames remain for the cached micro-route.
  return this._pixelState()._mrFrames;
};

/**
 * Sets the remaining micro-route frames to apply the cached direction.
 * @param {number} frames The number of frames to hold the cached direction.
 */
Game_CharacterBase.prototype.setMicroRouteFrames = function(frames)
{
  // Assign the remaining frames to apply the cached micro-route.
  this._pixelState()._mrFrames = frames;
};

/**
 * Decrements the remaining micro-route frames by one if applicable.
 */
Game_CharacterBase.prototype.decrementMicroRouteFrames = function()
{
  // Only decrement if there are frames remaining.
  if (this.getMicroRouteFrames() > 0)
  {
    // Reduce the frames by one.
    this.setMicroRouteFrames(this.getMicroRouteFrames() - 1);
  }
};

/**
 * Clears the cached micro-route direction and remaining frames.
 */
Game_CharacterBase.prototype.clearMicroRoute = function()
{
  // Reset the cached direction to none.
  this.setMicroRouteDirection(0);

  // Reset the remaining frames to zero.
  this.setMicroRouteFrames(0);
};

/**
 * Gets whether or not this character is currently following a cached micro-route.
 * @returns {boolean} True if there are frames remaining, false otherwise.
 */
Game_CharacterBase.prototype.isMicroRouting = function()
{
  // Determine if we are still following a micro-route.
  return this.getMicroRouteFrames() > 0;
};

/**
 * Gets the collection of positional records for this character.
 * @returns {Point[]}
 */
Game_CharacterBase.prototype.positionalRecords = function()
{
  return this._pixelState()._positionalRecords;
};

/**
 * Clears the positional cache for characters on the map.
 */
Game_CharacterBase.prototype.clearPositionalRecords = function()
{
  this._pixelState()._positionalRecords = [];
};

/**
 * Adds a positional record to the collection and maintains the max collection size.
 * @param {Point} positionalRecord A single positional record as a point.
 */
Game_CharacterBase.prototype.addPositionalRecord = function(positionalRecord)
{
  // grab the records.
  const records = this.positionalRecords();

  // add the new record to the collection.
  records.push(positionalRecord);

  // only keep the top ten tracking records for positioning.
  while (records.length > 10)
  {
    records.shift();
  }
};

/**
 * Gets the first-added record from the collection of coordinate tracking.
 * @returns {Point|null} The oldest tracked point, or null if no records exist yet.
 */
Game_CharacterBase.prototype.oldestPositionalRecord = function()
{
  // grab the records.
  const records = this.positionalRecords();

  // make sure we have records.
  if (records.length > 0)
  {
    // return the first record, aka the first one added in there.
    return records.at(0);
  }

  // there are no records to retrieve.
  return null;
};

/**
 * Gets the last-added record from the collection of coordinate tracking.
 * @returns {Point|null} The most recently tracked point, or null if no records exist yet.
 */
Game_CharacterBase.prototype.mostRecentPositionalRecord = function()
{
  // grab the records.
  const records = this.positionalRecords();

  // make sure we have records.
  if (records.length > 0)
  {
    // return the last record, aka the most recent one added in there.
    return records.at(-1);
  }

  // there are no records to retrieve.
  return null;
};
//endregion properties

/**
 * Extends {@link Game_CharacterBase.update}.<br/>
 * Ensures render coordinates match logical coordinates and clears per-frame flags.
 */
J.PIXEL.Aliased.Game_CharacterBase.set("update", Game_CharacterBase.prototype.update);
Game_CharacterBase.prototype.update = function()
{
  // Perform original logic.
  // perform original logic.
  J.PIXEL.Aliased.Game_CharacterBase.get("update")
    .call(this);

  // Always synchronize render/smoothing coordinates to the logical coordinates,
  // but not during a jump — updateJump handles _realX/_realY interpolation and
  // snapping here would teleport the character to the destination on frame one.
  if ((this._realX !== this._x || this._realY !== this._y) && !this.isJumping())
  {
    // Snap the render coordinates to the logical coordinates.
    this._realX = this._x;
    this._realY = this._y;
  }

  // Tick down the pixel-move cooldown, if any.
  if (this.isPixelOnCooldown())
  {
    // Reduce the cooldown by one frame.
    this.decrementPixelMoveCooldown();
  }

  // Clear the "moved this frame" flag after all engine logic has run.
  if (this.didMoveThisFrame())
  {
    // Reset the frame-based movement flag.
    this.clearMovedThisFrame();
  }
};

/**
 * Gets the move distance this character has moved.
 * @returns {number}
 */
Game_CharacterBase.prototype.moveDistance = function()
{
  return this._pixelState()._moveDistance;
};

/**
 * Modifies the move distance by a given amount.
 * @param {number} distance The distance in pixels.
 */
Game_CharacterBase.prototype.modMoveDistance = function(distance)
{
  // modify the move distance by the given amount.
  this._pixelState()._moveDistance += distance;
};

/**
 * Gets how many pixel steps this character has taken.
 * @returns {number}
 */
Game_CharacterBase.prototype.pixelSteps = function()
{
  return this._pixelState()._steps;
};

/**
 * Modifies the pixel step counter.
 * @param {number=} steps The number of steps to take; defaults to 1.
 */
Game_CharacterBase.prototype.takePixelSteps = function(steps = 1)
{
  this._pixelState()._steps += steps;
};

/**
 * Clears the number of pixel steps taken by this character.
 */
Game_CharacterBase.prototype.clearPixelSteps = function()
{
  this._pixelState()._steps = 0;
};

/**
 * Checks if this character has moved far enough to be considered a "step".
 */
Game_CharacterBase.prototype.updatePixelStepping = function()
{
  // determine if we have crossed the threshold for moving one step.
  const tookStep = this.moveDistance() >= this.stepDistance();

  // check if we took a step.
  if (tookStep)
  {
    // take a step.
    this.onStep();

    // reset the move distance.
    this.clearMoveDistance();
  }
};

/**
 * Resets the move distance for this character.
 */
Game_CharacterBase.prototype.clearMoveDistance = function()
{
  this._pixelState()._moveDistance = 0;
};

/**
 * Extends {@link Game_CharacterBase.isMoving}.<br/>
 * Includes whether or not a pixel movement occurred this frame.
 * @returns {boolean}
 */
J.PIXEL.Aliased.Game_CharacterBase.set("isMoving", Game_CharacterBase.prototype.isMoving);
Game_CharacterBase.prototype.isMoving = function()
{
  // Determine movement per the original engine behavior.
  // perform original logic.
  const original = J.PIXEL.Aliased.Game_CharacterBase.get("isMoving")
    .call(this);

  // Include pixel-step movement that occurred this frame.
  const movedThisFrame = this.didMoveThisFrame();

  // Return whether we are moving per engine or because of a pixel step.
  return original || movedThisFrame;
};

/**
 * Gets whether or not the move input is being pressed.
 * @returns {boolean}
 */
Game_CharacterBase.prototype.isMovePressed = function()
{
  return this._pixelState()._movePressing;
};

/**
 * Sets whether or not the move input is being held down.
 * @param {boolean} pressed The new value of whether or not the button is being pressed.
 */
Game_CharacterBase.prototype.setMovePressed = function(pressed)
{
  this._pixelState()._movePressing = pressed;
};

/**
 * Adds a hook for performing actions when this character takes a step.
 */
Game_CharacterBase.prototype.onStep = function()
{
  this.takePixelSteps(1);
};

/**
 * Gets the distance that it takes to travel to achieve one step.
 * @returns {number}
 */
Game_CharacterBase.prototype.stepDistance = function()
{
  // Consider one full tile of travel as a single step for step-based effects.
  return 1.0;
};

/**
 * Records this character's current fractional position into the breadcrumb trail.
 * Keeps a rolling window of the last 10 positions for follower-train chasing.
 * Flushes the cache when the player teleports (delta > 2 tiles).
 */
Game_CharacterBase.prototype.recordPixelPosition = function()
{
  // grab the most recently added point from the collection.
  const last = this.mostRecentPositionalRecord();

  // compute distance from the last recorded point to the current position.
  const deltaDistance = (last === null)
    ? 0
    : $gameMap.distance(last.x, last.y, this.x, this.y);

  // check if the character teleported; if so, flush the stale cache.
  if (deltaDistance > 2)
  {
    // clear the cache.
    this.clearPositionalRecords();
  }
  // check if we are missing any records, or have moved enough to warrant a new one.
  else if (last === null || deltaDistance > 0.1)
  {
    // record the current fractional position.
    const point = { x: this.x, y: this.y };

    // add the point to the tracking.
    this.addPositionalRecord(point);
  }
};

/**
 * Forcefully relocates this character to a different set of coordinates.
 * @param {number} x The x coordinate.
 * @param {number} y The y coordinate.
 */
Game_CharacterBase.prototype.relocate = function(x, y)
{
  // Update the logical coordinates of this character.
  this._x = x;
  this._y = y;

  // Synchronize the render/smoothing coordinates to prevent post-teleport sliding.
  this._realX = x;
  this._realY = y;

  // Reset the stop counter so the engine considers us stationary immediately.
  this._stopCount = 0;
};

/**
 * Enables the "pixel moving" state and updates pixel position.
 */
Game_CharacterBase.prototype.startPixelMoving = function()
{
  // this character is moving.
  this.setMovePressed(true);

  // update the position for this character.
  this.recordPixelPosition();
};

/**
 * Disables the "pixel moving" state and updates pixel position.
 */
Game_CharacterBase.prototype.stopPixelMoving = function()
{
  // this character isn't moving.
  this.setMovePressed(false);

  // Synchronize the render/smoothing coordinates to the logical position.
  // This prevents any residual tween drift once we intentionally stop.
  this._realX = this._x;
  this._realY = this._y;

  // update the position for this character.
  this.recordPixelPosition();
};

/**
 * Determine the distance per frame when moving diagonally.
 * It is reduced thanks to the power of math.
 * @returns {number} The distance in pixels to move.
 */
Game_CharacterBase.prototype.diagonalDistancePerFrame = function()
{
  return this.distancePerFrame() * Math.SQRT1_2;
};

/**
 * Moves this character in the given direction a given distance in pixels.
 *
 * This is used in tandem with movement control and not intended to move characters otherwise.
 * @param {1|2|3|4|6|7|8|9} direction The direction to move.
 * @param {number} distance The number of pixels to move.
 */
Game_CharacterBase.prototype.movePixelDistance = function(direction, distance)
{
  // Cache previous logical coordinates before applying movement.
  const prevX = this._x;
  const prevY = this._y;

  // Determine whether the direction is straight or diagonal.
  const isStraight = this.isStraightDirection(direction);
  const isDiagonal = this.isDiagonalDirection(direction);

  // If straight, then move straight.
  if (isStraight)
  {
    // Move straight by the given distance.
    this.moveStraightDistance(direction, distance);
  }
  // If diagonal, then move diagonally.
  else if (isDiagonal)
  {
    // Move diagonally by the given distance.
    this.moveDiagonalDistance(direction, distance);
  }

  // Acquire the collision radius in tile units for AABB evaluation.
  const radius = this.getEffectiveRadius();

  // If we ended up overlapping solid tiles after this step, revert the move.
  // Through or playtest debug-through bypass this check entirely.
  if (this.isThrough() === false && this.isDebugThrough() === false && this.isOverlappingSolidTiles(
    this._x + this.getCollisionPivotX(),
    this._y + this.getCollisionPivotY(),
    radius))
  {
    // Restore the previous logical position.
    this._x = prevX;
    this._y = prevY;

    // Synchronize the display coordinates with the restored logical position.
    this._realX = this._x;
    this._realY = this._y;

    // Mark this movement as unsuccessful so upstream callers don’t keep pushing.
    this.setMovementSuccess(false);

    // Do not proceed with step bookkeeping after a failed move.
    return;
  }

  // Indicate we moved this frame to preserve walk animation.
  this.setMovedThisFrame(true);

  // Synchronize the display coordinates with the logical position to avoid engine tween drift.
  this._realX = this._x;
  this._realY = this._y;

  // Also modify the move distance by how far we've moved.
  this.modMoveDistance(distance);

  // Updates the pixel step counter if applicable.
  this.updatePixelStepping();
};

/**
 * Moves this character one of the four cardinal directions a given distance in pixels.
 * @param {2|4|6|8} direction The straight direction to move.
 * @param {number} pixelDistance The number of pixels to move in that direction.
 */
Game_CharacterBase.prototype.moveStraightDistance = function(direction, pixelDistance)
{
  switch (direction)
  {
    case J.PIXEL.Directions.DOWN:
      this.moveStraight2Down(pixelDistance);
      break;
    case J.PIXEL.Directions.LEFT:
      this.moveStraight4Left(pixelDistance);
      break;
    case J.PIXEL.Directions.RIGHT:
      this.moveStraight6Right(pixelDistance);
      break;
    case J.PIXEL.Directions.UP:
      this.moveStraight8Up(pixelDistance);
      break;
  }
};

/**
 * Moves this character one one of the four cardinal directions.
 * @param {1|3|7|9} direction The straight direction to move.
 * @param {number} pixelDistance The number of pixels to move in that direction.
 */
Game_CharacterBase.prototype.moveDiagonalDistance = function(direction, pixelDistance)
{
  switch (direction)
  {
    case J.PIXEL.Directions.LOWERLEFT:
      this.moveDiagonal1DownLeft(pixelDistance);
      break;
    case J.PIXEL.Directions.LOWERRIGHT:
      this.moveDiagonal3DownRight(pixelDistance);
      break;
    case J.PIXEL.Directions.UPPERLEFT:
      this.moveDiagonal7UpLeft(pixelDistance);
      break;
    case J.PIXEL.Directions.UPPERRIGHT:
      this.moveDiagonal9UpRight(pixelDistance);
      break;
  }
};

/**
 * Move straight down the given distance.
 * @param {number} pixelDistance The distance in pixels.
 */
Game_CharacterBase.prototype.moveStraight2Down = function(pixelDistance)
{
  this._y += pixelDistance;
};

/**
 * Move straight left the given distance.
 * @param {number} pixelDistance The distance in pixels.
 */
Game_CharacterBase.prototype.moveStraight4Left = function(pixelDistance)
{
  this._x -= pixelDistance;
};

/**
 * Move straight right the given distance.
 * @param {number} pixelDistance The distance in pixels.
 */
Game_CharacterBase.prototype.moveStraight6Right = function(pixelDistance)
{
  this._x += pixelDistance;
};

/**
 * Move straight up the given distance.
 * @param {number} pixelDistance The distance in pixels.
 */
Game_CharacterBase.prototype.moveStraight8Up = function(pixelDistance)
{
  this._y -= pixelDistance;
};

/**
 * Move diagonally down-left the given distance.
 * @param {number} pixelDistance The distance in pixels.
 */
Game_CharacterBase.prototype.moveDiagonal1DownLeft = function(pixelDistance)
{
  this._x -= pixelDistance;
  this._y += pixelDistance;
};

/**
 * Move diagonally down-right the given distance.
 * @param {number} pixelDistance The distance in pixels.
 */
Game_CharacterBase.prototype.moveDiagonal3DownRight = function(pixelDistance)
{
  this._x += pixelDistance;
  this._y += pixelDistance;
};

/**
 * Move diagonally up-left the given distance.
 * @param {number} pixelDistance The distance in pixels.
 */
Game_CharacterBase.prototype.moveDiagonal7UpLeft = function(pixelDistance)
{
  this._x -= pixelDistance;
  this._y -= pixelDistance;
};

/**
 * Move diagonally up-right the given distance.
 * @param {number} pixelDistance The distance in pixels.
 */
Game_CharacterBase.prototype.moveDiagonal9UpRight = function(pixelDistance)
{
  this._x += pixelDistance;
  this._y -= pixelDistance;
};

/**
 * Determines whether or not this character can pass in the given straight direction.
 * Substeps the probe at collision subgrid resolution to avoid skipping edges, then
 * uses your edge-subgrid checks per substep. Character AABB collisions are checked
 * only at the final landing point.
 *
 * @param {2|4|6|8} direction The cardinal direction being moved.
 * @param {number} distance The distance to move (in tiles, fractional).
 * @returns {boolean} True if movement is permitted this frame, false otherwise.
 */
// eslint-disable-next-line complexity
Game_CharacterBase.prototype.canPassStraight = function(direction, distance = this.distancePerFrame())
{
  // TODO: reduce complexity (collision kernel); extract pure helpers without changing semantics.
  // Acquire the current fractional center.
  const x0 = this._x;

  // Acquire the current fractional center.
  const y0 = this._y;

  // Approve immediately if we are pass-through (debug or through).
  if (this.isThrough() || this.isDebugThrough())
  {
    // Always allow movement when through.
    return true;
  }

  // Determine the collision subgrid resolution; avoid skipping edges at high speeds.
  const subCount = this._pixelCollisionSubCount();

  // Update cached radius-based hitbox.
  const radius = this.getEffectiveRadius();

  // Compute hitbox metrics relative to center.
  const hitbox = this._pixelHitbox(radius);

  // Compute the subcell size for substepping.
  const subStepSize = 1 / subCount;

  // Determine the signed unit direction components.
  let dx = 0;
  let dy = 0;
  if (direction === J.PIXEL.Directions.RIGHT)
  {
    // Moving to the right.
    dx = 1;
  }
  else if (direction === J.PIXEL.Directions.LEFT)
  {
    // Moving to the left.
    dx = -1;
  }
  else if (direction === J.PIXEL.Directions.DOWN)
  {
    // Moving downward.
    dy = 1;
  }
  else if (direction === J.PIXEL.Directions.UP)
  {
    // Moving upward.
    dy = -1;
  }
  else
  {
    // Unsupported direction; reject.
    return false;
  }

  // Compute the maximum substep size that won’t skip a subcell edge.
  const maxStep = subStepSize;

  // Compute how many substeps are required for this distance (at least one).
  const steps = Math.max(1, Math.ceil(distance / maxStep));

  // Compute the per-substep distance.
  const stepSize = distance / steps;

  // Initialize the rolling probe position.
  let probeX = x0;
  let probeY = y0;

  // Process each substep sequentially.
  for (let i = 0; i < steps; i++)
  {
    // Compute the proposed landing center for this substep.
    const x1 = probeX + dx * stepSize;

    // Compute the proposed landing center for this substep.
    const y1 = probeY + dy * stepSize;

    // Horizontal movement edge checks.
    if (dx !== 0)
    {
      // If moving left, validate left edge; if moving right, validate right edge.
      if (dx < 0)
      {
        // Validate origin out-direction on the current left edge columns.
        if (this._pixelCheckLeftPassage(probeX, probeY, x1, hitbox, subCount) === false) return false;

        // Validate destination in-direction on the new left edge columns.
        if (this._pixelCheckRightPassage(x1, probeY, probeX, hitbox, subCount) === false) return false;

        // Validate vertical lanes at the new entered LEFT column.
        if (this._pixelCheckVerticalAtNewXColumn(probeX, x1, probeY, hitbox, subCount) === false) return false;
      }
      else
      {
        // Validate origin out-direction on the current right edge columns.
        if (this._pixelCheckRightPassage(probeX, probeY, x1, hitbox, subCount) === false) return false;

        // Validate destination in-direction on the new right edge columns.
        if (this._pixelCheckLeftPassage(x1, probeY, probeX, hitbox, subCount) === false) return false;

        // Validate vertical lanes at the new entered RIGHT column.
        if (this._pixelCheckVerticalAtNewXColumn(probeX, x1, probeY, hitbox, subCount) === false) return false;
      }
    }

    // Vertical movement edge checks.
    if (dy !== 0)
    {
      // If moving up, validate top edge; if moving down, validate bottom edge.
      if (dy < 0)
      {
        // Validate origin out-direction on the current top edge rows.
        if (this._pixelCheckUpPassage(probeX, probeY, y1, hitbox, subCount) === false) return false;

        // Validate destination in-direction on the new top edge rows.
        if (this._pixelCheckDownPassage(probeX, y1, probeY, hitbox, subCount) === false) return false;

        // Validate horizontal lanes at the new entered TOP row.
        if (this._pixelCheckHorizontalAtNewYRow(probeY, y1, probeX, hitbox, subCount) === false) return false;
      }
      else
      {
        // Validate origin out-direction on the current bottom edge rows.
        if (this._pixelCheckDownPassage(probeX, probeY, y1, hitbox, subCount) === false) return false;

        // Validate destination in-direction on the new bottom edge rows.
        if (this._pixelCheckUpPassage(probeX, y1, probeY, hitbox, subCount) === false) return false;

        // Validate horizontal lanes at the new entered BOTTOM row.
        if (this._pixelCheckHorizontalAtNewYRow(probeY, y1, probeX, hitbox, subCount) === false) return false;
      }
    }

    // Advance the probe to the approved substep landing.
    probeX = x1;
    probeY = y1;
  }

  // AABB consistency guard: even when no subcell seam was crossed (player is very close
  // to a wall), ensure the final probe AABB does not overlap a solid tile. This matches
  // the post-move check in movePixelDistance and prevents canPassStraight from returning
  // true when the step destination physically overlaps impassable terrain.
  if (this.isThrough() === false && this.isDebugThrough() === false && this.isOverlappingSolidTiles(
    probeX + this.getCollisionPivotX(),
    probeY + this.getCollisionPivotY(),
    radius))
  {
    return false;
  }

  // Finally, apply character-vs-character collision at the final landing point.
  const characterBlocked = this.isCharacterCollisionAt(probeX, probeY, radius);

  // Approve only if no character collision would occur.
  return characterBlocked === false;
};

/**
 * Checks if the character's AABB at the given position would overlap any "solid wall" tiles.
 * A "solid wall" tile is defined here as out-of-bounds or a tile that is not passable in
 * any cardinal direction (2/4/6/8). This prevents slipping into impassable terrain corners
 * while allowing wall sliding that the edge-lane rule enables.
 * @param {number} px The proposed x center in tile units (fractional).
 * @param {number} py The proposed y center in tile units (fractional).
 * @param {number} radius The half-size of the square AABB in tiles.
 * @returns {boolean} True if any overlapped tile is solid, false otherwise.
 */
Game_CharacterBase.prototype.isOverlappingSolidTiles = function(px, py, radius)
{
  // Define tiny epsilon to bias away from seams when flooring.
  const eps = 1e-6;

  // Compute the inclusive bounds of tiles overlapped by the AABB at (px, py).
  const minCol = Math.floor(px - radius + eps);
  const maxCol = Math.floor(px + radius - eps);
  const minRow = Math.floor(py - radius + eps);
  const maxRow = Math.floor(py + radius - eps);

  // Iterate all overlapped tiles.
  for (let ty = minRow; ty <= maxRow; ty++)
  {
    for (let tx = minCol; tx <= maxCol; tx++)
    {
      // Treat out-of-bounds as solid.
      if ($gameMap.isValid(tx, ty) === false)
      {
        // Out-of-bounds overlaps are never allowed.
        return true;
      }

      // Determine if this tile has any passable cardinal direction at all.
      const anyPass =
        $gameMap.isPassable(tx, ty, J.PIXEL.Directions.DOWN) ||
        $gameMap.isPassable(tx, ty, J.PIXEL.Directions.LEFT) ||
        $gameMap.isPassable(tx, ty, J.PIXEL.Directions.RIGHT) ||
        $gameMap.isPassable(tx, ty, J.PIXEL.Directions.UP);

      // If a tile is not passable in any cardinal direction, it's a solid wall tile.
      if (anyPass === false)
      {
        // Overlapping a solid wall tile is not allowed.
        return true;
      }
    }
  }

  // No overlapped tiles were solid; overlap is acceptable.
  return false;
};

/**
 * Extends {@link Game_CharacterBase.canPass}.<br/>
 * Rounds fractional pixel coordinates to the nearest tile integer before delegating
 * to the tile-based passability check. With pixel movement, `_x`/`_y` are fractional;
 * the base RMMZ method uses them as array indices, so non-integer inputs produce
 * incorrect results without this normalization.
 * @param {number} x The x tile coordinate (may be fractional with pixel movement).
 * @param {number} y The y tile coordinate (may be fractional with pixel movement).
 * @param {2|4|6|8} d The direction to check passage toward.
 * @returns {boolean} Whether passage is allowed from the nearest tile in direction d.
 */
J.PIXEL.Aliased.Game_CharacterBase.set('canPass', Game_CharacterBase.prototype.canPass);
Game_CharacterBase.prototype.canPass = function(x, y, d)
{
  // perform original logic.
  return J.PIXEL.Aliased.Game_CharacterBase.get('canPass').call(this, Math.round(x), Math.round(y), d);
};

/**
 * Extends {@link Game_CharacterBase#regionId}.<br/>
 * Samples the map region at the character's collision pivot tile. With pixel movement,
 * `_x`/`_y` are fractional; vanilla forwards them into {@link Game_Map#tileId}, which
 * indexes `$dataMap.data` and returns wrong regions when coordinates are not integers.
 * @returns {number} The region id at the pivot tile.
 */
J.PIXEL.Aliased.Game_CharacterBase.set('regionId', Game_CharacterBase.prototype.regionId);
Game_CharacterBase.prototype.regionId = function()
{
  // resolve the tile under the body, not the fractional anchor corner.
  const tileX = Math.floor(this._x + this.getCollisionPivotX());
  const tileY = Math.floor(this._y + this.getCollisionPivotY());

  return $gameMap.regionId(tileX, tileY);
};

/**
 * Moves straight in a given direction.
 * If there is an underlying diagonal direction, then move diagonally.
 * @param {number} direction The direction being moved.
 */
J.PIXEL.Aliased.Game_CharacterBase.set('moveStraight', Game_CharacterBase.prototype.moveStraight);
Game_CharacterBase.prototype.moveStraight = function(direction)
{
  // Evaluate pixel-aware straight passability including character collision.
  this.setMovementSuccess(this.canPassStraight(direction));

  // Always face the attempted direction, matching rmmz default behavior.
  // Enemies that are blocked must still update their facing so the projectile
  // direction baked at decision-time reflects where they were trying to go.
  this.setDirection(direction);

  // If passable, perform a pixel-distance straight move.
  if (this.isMovementSucceeded())
  {
    this.movePixelDistance(direction, this.distancePerFrame());
  }
  else
  {
    // notify any adjacent event triggers, matching rmmz default behavior.
    this.checkEventTriggerTouchFront(direction);
  }
};

/**
 * Extends {@link Game_CharacterBase.moveDiagonally}.<br/>
 * Evaluates pixel-aware diagonal passability and executes pixel-distance movement.
 * Direction is updated unconditionally (matching rmmz default behavior) so that
 * a blocked diagonal step still rotates the character away from a wall.
 * @param {4|6} horz The horizontal component direction (4=left, 6=right).
 * @param {2|8} vert The vertical component direction (2=down, 8=up).
 */
J.PIXEL.Aliased.Game_CharacterBase.set('moveDiagonally', Game_CharacterBase.prototype.moveDiagonally);
Game_CharacterBase.prototype.moveDiagonally = function(horz, vert)
{
  this.setMovementSuccess(this.canPassDiagonally(this._x, this._y, horz, vert));

  if (this.isMovementSucceeded())
  {
    const direction = this.directionFromHorzVert(horz, vert);
    this.movePixelDistance(direction, this.diagonalDistancePerFrame());
    this.setDirection(direction);
  }

  // rmmz updates direction unconditionally for diagonal moves: if the character
  // is facing the reverse of a component direction, rotate toward that component.
  if (this._direction === this.reverseDir(horz))
  {
    this.setDirection(horz);
  }
  if (this._direction === this.reverseDir(vert))
  {
    this.setDirection(vert);
  }
};

/**
 * Executes pixel movement in the given direction if possible.
 * This also returns the cardinal-normalized direction that should be faced.
 *
 * Notes:
 * - This version removes all “offset lane” probes. canPassStraight no longer
 *   accepts a perpendicular offset, so legacy offset-driven logic has been
 *   eliminated to prevent biased early/late decisions that felt like “+0.5”.
 * - Snapping is now epsilon-based around the orthogonal axis after a straight
 *   move to avoid jitter without over-snapping.
 * @param {2|4|6|8|1|3|7|9} direction The desired direction to be moved.
 * @returns {number} The cardinal-normalized direction to face while moving.
 */
Game_CharacterBase.prototype.pixelMoveByInput = function(direction)
{
  // Establish a local variable for the direction.
  let innerDirection = direction;

  // Calculate distance to move.
  const straightDistance = this.distancePerFrame();
  const diagonalDistance = this.diagonalDistancePerFrame();

  // Local probe helpers using the unified straight passability (no offset lanes).
  const canDown = () => this.canPassStraight(J.PIXEL.Directions.DOWN, straightDistance);
  const canUp = () => this.canPassStraight(J.PIXEL.Directions.UP, straightDistance);
  const canLeft = () => this.canPassStraight(J.PIXEL.Directions.LEFT, straightDistance);
  const canRight = () => this.canPassStraight(J.PIXEL.Directions.RIGHT, straightDistance);

  // Precompute rounded axes for light orthogonal re-centering after straight moves.
  const roundX = Math.round(this._x);
  const roundY = Math.round(this._y);

  // A small snap tolerance to gently re-center on the orthogonal axis after straight motion.
  const SNAP_EPSILON = 0.1;

  // Attempts a diagonal step if valid; returns a cardinal facing if moved, or 0 if not.
  const tryDiagonal = (diagDir) =>
  {
    // Validate diagonal acceptance including character collision.
    if (this.canPassDiagonalByDirection(diagDir) === false)
    {
      // Not a valid diagonal.
      return 0;
    }

    // Execute the movement.
    this.setMovementSuccess(true);
    this.movePixelDistance(diagDir, diagonalDistance);

    // When moving diagonally, face a cardinal; prefer vertical for down/up vs up/down.
    switch (diagDir)
    {
      case J.PIXEL.Directions.LOWERLEFT:
      case J.PIXEL.Directions.LOWERRIGHT:
      {
        // Face down when going to a lower row.
        this.setDirection(J.PIXEL.Directions.DOWN);
        return J.PIXEL.Directions.DOWN;
      }
      case J.PIXEL.Directions.UPPERLEFT:
      case J.PIXEL.Directions.UPPERRIGHT:
      {
        // Face up when going to an upper row.
        this.setDirection(J.PIXEL.Directions.UP);
        return J.PIXEL.Directions.UP;
      }
    }
  };

  // Chooses a fallback between two cardinals by comparing residuals to the rounded axes.
  const diagonalFallback = (preferHorzDir, preferVertDir, chooseHorizontalPredicate) =>
  {
    // If residual X is smaller than residual Y, prefer horizontal; else prefer vertical.
    if (chooseHorizontalPredicate())
    {
      // Prefer the horizontal.
      return this.pixelMoveByInput(preferHorzDir);
    }
    else
    {
      // Prefer the vertical.
      return this.pixelMoveByInput(preferVertDir);
    }
  };

  // Lightly re-center X after a vertical move.
  const recenterXAfterVertical = () =>
  {
    // If we are close enough to tile center, snap to eliminate drift.
    if (Math.abs(this._x - roundX) <= SNAP_EPSILON)
    {
      // Assign the rounded X.
      this._x = roundX;
    }
  };

  // Lightly re-center Y after a horizontal move.
  const recenterYAfterHorizontal = () =>
  {
    // If we are close enough to tile center, snap to eliminate drift.
    if (Math.abs(this._y - roundY) <= SNAP_EPSILON)
    {
      // Assign the rounded Y.
      this._y = roundY;
    }
  };

  // Performs the straight move and gently re-centers the orthogonal axis if close enough.
  const doStraightMove = (cardinalDir) =>
  {
    // Flag success and perform the movement.
    this.setMovementSuccess(true);
    this.movePixelDistance(cardinalDir, straightDistance);

    // Re-center the orthogonal axis with a small tolerance to avoid jitter.
    switch (cardinalDir)
    {
      case J.PIXEL.Directions.DOWN:
      case J.PIXEL.Directions.UP:
      {
        // Re-center X after vertical motion.
        recenterXAfterVertical();
        break;
      }
      case J.PIXEL.Directions.LEFT:
      case J.PIXEL.Directions.RIGHT:
      {
        // Re-center Y after horizontal motion.
        recenterYAfterHorizontal();
        break;
      }
    }

    // Face the direction of travel.
    this.setDirection(cardinalDir);

    // Return the cardinal direction we are facing.
    return cardinalDir;
  };

  // Handles diagonal inputs collectively with a single switch.
  // eslint-disable-next-line complexity
  const handleDiagonal = (diagDir) =>
  {
    // Handle each diagonal independently using a switch.
    switch (diagDir)
    {
      case J.PIXEL.Directions.LOWERLEFT:
      {
        // If both component legs are passable, try the diagonal.
        if (canLeft() && canDown())
        {
          // Attempt diagonal; return cardinal-facing or 0.
          const faced = tryDiagonal(J.PIXEL.Directions.LOWERLEFT);
          if (faced > 0) return faced;

          // If diagonal landing blocked, split by residuals.
          return diagonalFallback(
            J.PIXEL.Directions.LEFT,
            J.PIXEL.Directions.DOWN,
            () => (this.x - roundX) < (roundY - this.y));
        }

        // If only one leg is passable, recurse to that cardinal.
        if (canLeft()) return this.pixelMoveByInput(J.PIXEL.Directions.LEFT);
        if (canDown()) return this.pixelMoveByInput(J.PIXEL.Directions.DOWN);

        // Otherwise, bias facing to down for consistency.
        innerDirection = J.PIXEL.Directions.DOWN;
        return innerDirection;
      }
      case J.PIXEL.Directions.LOWERRIGHT:
      {
        // If both component legs are passable, try the diagonal.
        if (canRight() && canDown())
        {
          // Attempt diagonal; return cardinal-facing or 0.
          const faced = tryDiagonal(J.PIXEL.Directions.LOWERRIGHT);
          if (faced > 0) return faced;

          // If diagonal landing blocked, split by residuals.
          return diagonalFallback(
            J.PIXEL.Directions.RIGHT,
            J.PIXEL.Directions.DOWN,
            () => (roundX - this.x) < (roundY - this.y));
        }

        // If only one leg is passable, recurse to that cardinal.
        if (canRight()) return this.pixelMoveByInput(J.PIXEL.Directions.RIGHT);
        if (canDown()) return this.pixelMoveByInput(J.PIXEL.Directions.DOWN);

        // Otherwise, bias facing to down for consistency.
        innerDirection = J.PIXEL.Directions.DOWN;
        return innerDirection;
      }
      case J.PIXEL.Directions.UPPERLEFT:
      {
        // If both component legs are passable, try the diagonal.
        if (canLeft() && canUp())
        {
          // Attempt diagonal; return cardinal-facing or 0.
          const faced = tryDiagonal(J.PIXEL.Directions.UPPERLEFT);
          if (faced > 0) return faced;

          // If diagonal landing blocked, split by residuals.
          return diagonalFallback(
            J.PIXEL.Directions.LEFT,
            J.PIXEL.Directions.UP,
            () => (this.x - roundX) < (this.y - roundY));
        }

        // If only one leg is passable, recurse to that cardinal.
        if (canLeft()) return this.pixelMoveByInput(J.PIXEL.Directions.LEFT);
        if (canUp()) return this.pixelMoveByInput(J.PIXEL.Directions.UP);

        // Otherwise, bias facing to up for consistency.
        innerDirection = J.PIXEL.Directions.UP;
        return innerDirection;
      }
      case J.PIXEL.Directions.UPPERRIGHT:
      {
        // If both component legs are passable, try the diagonal.
        if (canRight() && canUp())
        {
          // Attempt diagonal; return cardinal-facing or 0.
          const faced = tryDiagonal(J.PIXEL.Directions.UPPERRIGHT);
          if (faced > 0) return faced;

          // If diagonal landing blocked, split by residuals.
          return diagonalFallback(
            J.PIXEL.Directions.RIGHT,
            J.PIXEL.Directions.UP,
            () => (roundX - this.x) < (this.y - roundY));
        }

        // If only one leg is passable, recurse to that cardinal.
        if (canRight()) return this.pixelMoveByInput(J.PIXEL.Directions.RIGHT);
        if (canUp()) return this.pixelMoveByInput(J.PIXEL.Directions.UP);

        // Otherwise, bias facing to up for consistency.
        innerDirection = J.PIXEL.Directions.UP;
        return innerDirection;
      }
    }
  };

  // When pressing a cardinal into a blocked wall while slightly off the tile grid,
  // nudge the perpendicular axis toward the nearest tile center by up to one frame's
  // distance and always commit the nudge. Over multiple frames the character drifts
  // into alignment with the nearest passable corridor ("wall-slide"). The horizontal
  // or vertical move in the blocked direction is only attempted once the nudged
  // position actually passes the straight-passability check.
  const tryWallSlide = (blockedDir) =>
  {
    const isHorizontal = (
      blockedDir === J.PIXEL.Directions.LEFT ||
      blockedDir === J.PIXEL.Directions.RIGHT
    );

    const radius = this.getEffectiveRadius();

    if (isHorizontal)
    {
      // Nudge Y toward the nearest tile-center row.
      const targetY = Math.round(this._y);
      const residual = targetY - this._y;

      // Already centered; nothing to nudge.
      if (Math.abs(residual) < 0.001) return 0;

      const nudge = Math.sign(residual) * Math.min(Math.abs(residual), straightDistance);
      const nudgedY = this._y + nudge;

      // Reject the nudge if the new Y position would overlap a solid tile.
      if (this.isOverlappingSolidTiles(
        this._x + this.getCollisionPivotX(),
        nudgedY + this.getCollisionPivotY(),
        radius))
      {
        return 0;
      }

      // Commit the nudge so it accumulates across frames.
      this._y = nudgedY;
      this._realY = this._y;

      // Re-check horizontal passability from the nudged position.
      if (this.canPassStraight(blockedDir, straightDistance))
      {
        // Nudge opened a corridor; execute the horizontal move.
        return doStraightMove(blockedDir);
      }

      // Corridor still blocked; nudge was kept for next frame's drift.
      // Signal that we moved (the Y drift) so the walk animation plays.
      this.setMovedThisFrame(true);
      return 0;
    }
    else
    {
      // Nudge X toward the nearest tile-center column.
      const targetX = Math.round(this._x);
      const residual = targetX - this._x;

      if (Math.abs(residual) < 0.001) return 0;

      const nudge = Math.sign(residual) * Math.min(Math.abs(residual), straightDistance);
      const nudgedX = this._x + nudge;

      // Reject the nudge if the new X position would overlap a solid tile.
      if (this.isOverlappingSolidTiles(
        nudgedX + this.getCollisionPivotX(),
        this._y + this.getCollisionPivotY(),
        radius))
      {
        return 0;
      }

      // Commit the nudge.
      this._x = nudgedX;
      this._realX = this._x;

      if (this.canPassStraight(blockedDir, straightDistance))
      {
        return doStraightMove(blockedDir);
      }

      this.setMovedThisFrame(true);
      return 0;
    }
  };

  // Handles straight inputs using a switch with shared execution and gentle re-centering.
  const handleStraight = (cardinalDir) =>
  {
    // Handle the straight direction selection with a switch.
    switch (cardinalDir)
    {
      case J.PIXEL.Directions.DOWN:
      {
        if (canDown()) return doStraightMove(J.PIXEL.Directions.DOWN);
        return tryWallSlide(J.PIXEL.Directions.DOWN);
      }
      case J.PIXEL.Directions.UP:
      {
        if (canUp()) return doStraightMove(J.PIXEL.Directions.UP);
        return tryWallSlide(J.PIXEL.Directions.UP);
      }
      case J.PIXEL.Directions.LEFT:
      {
        if (canLeft()) return doStraightMove(J.PIXEL.Directions.LEFT);
        return tryWallSlide(J.PIXEL.Directions.LEFT);
      }
      case J.PIXEL.Directions.RIGHT:
      {
        if (canRight()) return doStraightMove(J.PIXEL.Directions.RIGHT);
        return tryWallSlide(J.PIXEL.Directions.RIGHT);
      }
    }
  };

  // If diagonal, try the diagonal handler first.
  if (this.isDiagonalDirection(direction))
  {
    // Attempt a diagonal execution path.
    const faced = handleDiagonal(direction);
    if (faced > 0) return faced;
  }

  // If straight, try the straight handler.
  if (this.isStraightDirection(direction))
  {
    // Attempt a straight execution path.
    const faced = handleStraight(direction);
    if (faced > 0) return faced;
  }

  // Fall back to returning the inner direction unchanged.
  return innerDirection;
};

/**
 * Overwrites {@link Game_CharacterBase.canPassDiagonally} with Cyclone-like semantics.
 * Requires both legs at current, re-validates at new X and at new Y, validates reverse
 * at destination, and rejects if a character occupies the diagonal landing point.
 * @param {number} x The current x.
 * @param {number} y The current y.
 * @param {4|6} horz The horizontal leg.
 * @param {2|8} vert The vertical leg.
 * @returns {boolean} True if diagonal is permitted.
 */
// eslint-disable-next-line complexity
Game_CharacterBase.prototype.canPassDiagonally = function(x, y, horz, vert)
{
  // TODO: reduce complexity (collision kernel); extract pure helpers without changing semantics.
  // Snapshot current to restore after checks.
  const oldX = this._x;

  // Snapshot current to restore after checks.
  const oldY = this._y;

  // Align to provided coordinates for symmetry.
  this._x = x;
  this._y = y;

  // If through/debug-through, approve.
  if (this.isThrough() || this.isDebugThrough())
  {
    // Restore and approve.
    this._x = oldX;
    this._y = oldY;
    return true;
  }

  // Compute step lengths.
  const straightStep = this.distancePerFrame();

  // Compute the diagonal step length.
  const diagStep = this.diagonalDistancePerFrame();

  // Update radius and hitbox metrics.
  const radius = this.getEffectiveRadius();

  // Build the hitbox for collision sampling.
  const hitbox = this._pixelHitbox(radius);

  // Determine the subgrid resolution.
  const subCount = this._pixelCollisionSubCount();

  // Initialize destination center X with current X.
  let nx = this._x;

  // Initialize destination center Y with current Y.
  let ny = this._y;

  // If the horizontal leg is right, add the diagonal step to X.
  if (horz === J.PIXEL.Directions.RIGHT)
  {
    nx = this._x + diagStep;
  }
  // Else if the horizontal leg is left, subtract the diagonal step from X.
  else if (horz === J.PIXEL.Directions.LEFT)
  {
    nx = this._x - diagStep;
  }

  // If the vertical leg is down, add the diagonal step to Y.
  if (vert === J.PIXEL.Directions.DOWN)
  {
    ny = this._y + diagStep;
  }
  // Else if the vertical leg is up, subtract the diagonal step from Y.
  else if (vert === J.PIXEL.Directions.UP)
  {
    ny = this._y - diagStep;
  }

  // Bounds check destination.
  if ($gameMap.isValid(nx, ny) === false)
  {
    // Restore original coordinates.
    this._x = oldX;
    this._y = oldY;

    // Destination is invalid.
    return false;
  }

  // Leg 1 at current center for horizontal movement.
  if (horz === J.PIXEL.Directions.LEFT)
  {
    // Validate leftward passage from the current center.
    if (this._pixelCheckLeftPassage(this._x, this._y, this._x - straightStep, hitbox, subCount) === false)
    {
      // Restore original coordinates and reject.
      this._x = oldX;
      this._y = oldY;
      return false;
    }
  }
  else
  {
    // Validate rightward passage from the current center.
    if (this._pixelCheckRightPassage(this._x, this._y, this._x + straightStep, hitbox, subCount) === false)
    {
      // Restore original coordinates and reject.
      this._x = oldX;
      this._y = oldY;
      return false;
    }
  }

  // Leg 2 at current center for vertical movement.
  if (vert === J.PIXEL.Directions.UP)
  {
    // Validate upward passage from the current center.
    if (this._pixelCheckUpPassage(this._x, this._y, this._y - straightStep, hitbox, subCount) === false)
    {
      // Restore original coordinates and reject.
      this._x = oldX;
      this._y = oldY;
      return false;
    }
  }
  else
  {
    // Validate downward passage from the current center.
    if (this._pixelCheckDownPassage(this._x, this._y, this._y + straightStep, hitbox, subCount) === false)
    {
      // Restore original coordinates and reject.
      this._x = oldX;
      this._y = oldY;
      return false;
    }
  }

  // Revalidate at new Y (horizontal at y2).
  let y2 = this._y;

  // If moving down on the vertical leg, add straight step to y2.
  if (vert === J.PIXEL.Directions.DOWN)
  {
    y2 = this._y + straightStep;
  }
  // Else if moving up, subtract straight step from y2.
  else if (vert === J.PIXEL.Directions.UP)
  {
    y2 = this._y - straightStep;
  }

  // Validate the horizontal leg at the displaced Y.
  if (horz === J.PIXEL.Directions.LEFT)
  {
    // Validate leftward passage at y2.
    if (this._pixelCheckLeftPassage(this._x, y2, this._x - straightStep, hitbox, subCount) === false)
    {
      // Restore original coordinates and reject.
      this._x = oldX;
      this._y = oldY;
      return false;
    }
  }
  else
  {
    // Validate rightward passage at y2.
    if (this._pixelCheckRightPassage(this._x, y2, this._x + straightStep, hitbox, subCount) === false)
    {
      // Restore original coordinates and reject.
      this._x = oldX;
      this._y = oldY;
      return false;
    }
  }

  // Revalidate at new X (vertical at x2).
  let x2 = this._x;

  // If moving right on the horizontal leg, add straight step to x2.
  if (horz === J.PIXEL.Directions.RIGHT)
  {
    x2 = this._x + straightStep;
  }
  // Else if moving left, subtract straight step from x2.
  else if (horz === J.PIXEL.Directions.LEFT)
  {
    x2 = this._x - straightStep;
  }

  // Validate the vertical leg at the displaced X.
  if (vert === J.PIXEL.Directions.UP)
  {
    // Validate upward passage at x2.
    if (this._pixelCheckUpPassage(x2, this._y, this._y - straightStep, hitbox, subCount) === false)
    {
      // Restore original coordinates and reject.
      this._x = oldX;
      this._y = oldY;
      return false;
    }
  }
  else
  {
    // Validate downward passage at x2.
    if (this._pixelCheckDownPassage(x2, this._y, this._y + straightStep, hitbox, subCount) === false)
    {
      // Restore original coordinates and reject.
      this._x = oldX;
      this._y = oldY;
      return false;
    }
  }

  // Validate horizontal reverse at destination center.
  if (horz === J.PIXEL.Directions.LEFT)
  {
    // Check the reverse (rightward) at the final destination.
    if (this._pixelCheckRightPassage(nx, ny, nx + straightStep, hitbox, subCount) === false)
    {
      // Restore original coordinates and reject.
      this._x = oldX;
      this._y = oldY;
      return false;
    }
  }
  else
  {
    // Check the reverse (leftward) at the final destination.
    if (this._pixelCheckLeftPassage(nx, ny, nx - straightStep, hitbox, subCount) === false)
    {
      // Restore original coordinates and reject.
      this._x = oldX;
      this._y = oldY;
      return false;
    }
  }

  // Validate vertical reverse at destination center.
  if (vert === J.PIXEL.Directions.UP)
  {
    // Check the reverse (downward) at the final destination.
    if (this._pixelCheckDownPassage(nx, ny, ny + straightStep, hitbox, subCount) === false)
    {
      // Restore original coordinates and reject.
      this._x = oldX;
      this._y = oldY;
      return false;
    }
  }
  else
  {
    // Check the reverse (upward) at the final destination.
    if (this._pixelCheckUpPassage(nx, ny, ny - straightStep, hitbox, subCount) === false)
    {
      // Restore original coordinates and reject.
      this._x = oldX;
      this._y = oldY;
      return false;
    }
  }

  // Character-vs-character check at diagonal landing.
  const blocked = this.isCharacterCollisionAt(nx, ny, radius);

  // Restore original coordinates.
  this._x = oldX;
  this._y = oldY;

  // Approve if no character is colliding at destination.
  return blocked === false;
};

/**
 * Determines whether or not a diagonal by its 8-dir code is passable for the next frame.
 * Requires both component straight legs to be passable using the tile-centered straight check,
 * then rejects if a character-vs-character AABB would collide at the diagonal landing point.
 * No lateral offset columns or lane sampling.
 * @param {1|3|7|9} diagonalDir The diagonal direction (1,3,7,9).
 * @param {number=} straightDistance Optional straight distance per frame to probe with.
 * @returns {boolean} True if the diagonal can be taken this frame, false otherwise.
 */
Game_CharacterBase.prototype.canPassDiagonalByDirection = function(
  diagonalDir,
  straightDistance = this.distancePerFrame())
{
  // Leg testers using the simplified, tile-centered straight acceptance.
  const canDown = () => this.canPassStraight(J.PIXEL.Directions.DOWN, straightDistance);
  const canUp = () => this.canPassStraight(J.PIXEL.Directions.UP, straightDistance);
  const canLeft = () => this.canPassStraight(J.PIXEL.Directions.LEFT, straightDistance);
  const canRight = () => this.canPassStraight(J.PIXEL.Directions.RIGHT, straightDistance);

  // Require both legs of the diagonal to be passable.
  let legsOk = false;
  if (diagonalDir === J.PIXEL.Directions.LOWERLEFT) legsOk = (canLeft() && canDown());
  if (diagonalDir === J.PIXEL.Directions.LOWERRIGHT) legsOk = (canRight() && canDown());
  if (diagonalDir === J.PIXEL.Directions.UPPERLEFT) legsOk = (canLeft() && canUp());
  if (diagonalDir === J.PIXEL.Directions.UPPERRIGHT) legsOk = (canRight() && canUp());
  if (legsOk === false) return false;

  // Simulate the diagonal landing point (same step length you execute with).
  const step = this.diagonalDistancePerFrame();
  let nx = this._x;
  let ny = this._y;
  if (diagonalDir === J.PIXEL.Directions.LOWERLEFT)
  {
    nx -= step;
    ny += step;
  }
  if (diagonalDir === J.PIXEL.Directions.LOWERRIGHT)
  {
    nx += step;
    ny += step;
  }
  if (diagonalDir === J.PIXEL.Directions.UPPERLEFT)
  {
    nx -= step;
    ny -= step;
  }
  if (diagonalDir === J.PIXEL.Directions.UPPERRIGHT)
  {
    nx += step;
    ny -= step;
  }

  // Reject if a character occupies the diagonal landing point.
  const radius = this.getEffectiveRadius();
  return this.isCharacterCollisionAt(nx, ny, radius) === false;
};

/**
 * Checks for a collision against other solid characters at a fractional point.
 * Uses simple AABB (square) overlap in tile space for stable, flat boundaries.
 * Party members (player and followers) never block each other.
 * Only events with normal priority ("Same as characters") are considered blockers.
 * @param {number} px Proposed x (fractional tiles).
 * @param {number} py Proposed y (fractional tiles).
 * @param {number=} radius Optional collision half-size in tiles (default 0.35).
 * @returns {boolean} True if any solid character would collide at (px, py).
 */
Game_CharacterBase.prototype.isCharacterCollisionAt = function(px, py, radius = 0.35)
{
  // Acquire the player reference.
  const player = $gamePlayer;

  // Acquire follower references.
  const followers = player._followers._data;

  // Build the party list (player + followers).
  const party = [ player ].concat(followers);

  // Determine if this character is part of the party.
  const selfIsParty = party.includes(this);

  // Gather all map events as initial candidates.
  const events = $gameMap.events();

  // Initialize candidate collection.
  const candidates = [];

  // Add events that can collide.
  events.forEach(ev =>
  {
    // Exclude self.
    if (ev === this) return;

    // Exclude erased events.
    if (ev.isErased()) return;

    // Exclude events flagged as through.
    if (ev.isThrough()) return;

    // Exclude events that are NOT normal priority (below/above characters don’t block movement).
    if (ev.isNormalPriority() === false) return;

    // Exclude JABS action sprites so they do not block physical movement.
    if (J.ABS && ev.isJabsAction()) return;

    // Include this event as a candidate.
    candidates.push(ev);
  });

  // Only add the player/followers if self is NOT a party member.
  if (selfIsParty === false)
  {
    // Add the player as a candidate when not through.
    if (player !== this && player.isThrough() === false)
    {
      // Include the player as a candidate.
      candidates.push(player);
    }

    // Add followers that can collide.
    followers.forEach(f =>
    {
      // Exclude self.
      if (f === this) return;

      // Exclude through followers.
      if (f.isThrough()) return;

      // Include this follower as a candidate.
      candidates.push(f);
    });
  }

  // Define a small helper for AABB overlap test in tile-space.
  const aabbOverlap = function(ax, ay, ahw, ahh, bx, by, bhw, bhh)
  {
    // Compute deltas along each axis.
    const dx = Math.abs(ax - bx);

    // Compute deltas along each axis.
    const dy = Math.abs(ay - by);

    // Overlap if deltas are within summed half-extents along both axes.
    return dx < (ahw + bhw) && dy < (ahh + bhh);
  };

  // Probe the AABB for each candidate.
  for (let i = 0; i < candidates.length; i++)
  {
    // Grab the candidate.
    const ch = candidates[i];

    // Extra defense: skip JABS action sprites even if accidentally included above.
    if (J.ABS && ch.isJabsAction())
    {
      // Do not collide with JABS actions here.
      continue;
    }

    // Acquire candidate center in true fractional tile space.
    const cx = ch.x;

    // Acquire candidate center in true fractional tile space.
    const cy = ch.y;

    // Candidate half-extents in tiles; use the character's effective (clamped) radius.
    const cr = ch.getEffectiveRadius();

    // Test AABB overlap.
    if (aabbOverlap(px, py, radius, radius, cx, cy, cr, cr))
    {
      // Overlap found; movement would collide.
      return true;
    }
  }

  // No overlaps found; movement is clear.
  return false;
};

/**
 * Gets the collision radius for this character in tile units.
 * This radius is used for pixel-accurate character-vs-character collision checks.
 * @returns {number} The collision radius in tiles.
 */
Game_CharacterBase.prototype.getCollisionRadius = function()
{
  // Return a sensible default radius in tile units for this character.
  return 0.3;
};

/**
 * Gets the effective collision radius, clamped so the hitbox never extends past the
 * tile boundary below the character. Enforces the invariant:
 *   pivotY + effectiveRadius < 1.0
 * This prevents the hitbox from bleeding into the tile below, which would cause false
 * solid-overlap detections against deny-region tiles and similar boundary conditions.
 * @returns {number} The clamped collision radius in tile units.
 */
Game_CharacterBase.prototype.getEffectiveRadius = function()
{
  // The maximum downward extent before bleeding into the tile below.
  const maxRadius = 1.0 - this.getCollisionPivotY() - 1e-6;

  // Return the smaller of the configured radius and the safe maximum.
  return Math.min(this.getCollisionRadius(), maxRadius);
};

/**
 * Gets the collision pivot X in tile units for this character.
 * The pivot offsets the hitbox center from the character's logical `_x` coordinate.
 * A value of 0.5 places the hitbox at the horizontal center of the sprite tile.
 * @returns {number} The X pivot offset in tile units.
 */
Game_CharacterBase.prototype.getCollisionPivotX = function()
{
  // Place the hitbox at the horizontal center of the character sprite tile.
  return 0.5;
};

/**
 * Gets the collision pivot Y in tile units for this character.
 * The pivot offsets the hitbox center from the character's logical `_y` coordinate.
 * A value of 0.5 centers the hitbox on the character's tile, giving symmetric collision
 * margins on all four sides and eliminating the half-tile early-block from below/right.
 * @returns {number} The Y pivot offset in tile units.
 */
Game_CharacterBase.prototype.getCollisionPivotY = function()
{
  // Center the hitbox on the tile vertically, matching the horizontal pivot.
  return 0.5;
};

//region pixel helpers
/**
 * Computes a square hitbox derived from the configured collision radius.
 * The hitbox is centered on the collision pivot on both axes, matching the player’s
 * visual center to eliminate perceived half-tile skew.
 * @param {number} radius The collision half-size in tiles.
 * @returns {{w:number,h:number,hx:number,hy:number}}
 */
Game_CharacterBase.prototype._pixelHitbox = function(radius)
{
  // Half-width equals the radius.
  const half = radius;

  // Compute full width/height of the hitbox.
  const width = half * 2;
  const height = half * 2;

  // Place the box centered on the pivot in both axes.
  return {
    // Hitbox width.
    w: width,
    // Hitbox height.
    h: height,
    // Hitbox left offset from pivot X (centered on X pivot).
    hx: -half,
    // Hitbox top offset from pivot Y (centered on Y pivot).
    hy: -half,
  };
};

/**
 * Returns the collision subgrid resolution from the plugin metadata.
 * @returns {number} The collision subgrid count.
 */
Game_CharacterBase.prototype._pixelCollisionSubCount = function()
{
  if (PIXEL_CollisionManager.collisionStepCount === undefined)
  {
    // Initialize defaults if the manager has not been configured yet.
    PIXEL_CollisionManager.initConfig();
  }

  return PIXEL_CollisionManager.collisionStepCount;
};

/**
 * Determines passability at a fractional subcell against the PIXEL collision table.
 * Expects coordinates already in the collision-table’s integer-aligned space
 * (seam-aligned), which are produced by the first/last collision helpers.
 * @param {number} px The fractional x at the sampled subcell (tile units).
 * @param {number} py The fractional y at the sampled subcell (tile units).
 * @param {2|4|6|8} d The direction to test (entering direction).
 * @returns {boolean} True if passable, false otherwise.
 */
Game_CharacterBase.prototype._pixelIsPositionPassable = function(px, py, d)
{
  // Coordinates are already seam-aligned; delegate directly.
  return PIXEL_CollisionManager.isPositionPassable(px, py, d);
};

/**
 * Returns 180-degree reverse of a 4-dir direction.
 * @param {2|4|6|8} d The direction.
 * @returns {2|4|6|8} The reverse direction.
 */
Game_CharacterBase.prototype._pixelReverseDir = function(d)
{
  if (d === 2) return 8;
  if (d === 8) return 2;
  if (d === 4) return 6;
  if (d === 6) return 4;
  return d;
};

/**
 * First collision X for hitbox at center x with subgrid count.
 * Uses an inward-biased floor to pick the first overlapped subcolumn.
 * Applies the per-character pivot for alignment.
 * @param {number} x The character’s tile x.
 * @param {{hx:number,w:number}} hb Hitbox.
 * @param {number} count Subgrid count.
 * @returns {number} First subcell x.
 */
Game_CharacterBase.prototype._pixelFirstCollisionXAt = function(x, hb, count)
{
  // Translate into pivot-space for X.
  const px = x + this.getCollisionPivotX();

  // Compute the left edge of the hitbox in subgrid units.
  const raw = (px + hb.hx) * count;

  // Define a tiny inward epsilon to resolve exact-seam ties into the current subcell.
  const eps = 1e-7;

  // Compute the first overlapped subcolumn using inward-biased floor.
  return Math.floor(raw + eps) / count;
};

/**
 * Last collision X for hitbox at center x with subgrid count.
 * Uses an inward-biased floor on the right edge minus epsilon to include the last overlapped subcolumn.
 * Applies the per-character pivot for alignment.
 * @param {number} x The character’s tile x.
 * @param {{hx:number,w:number}} hb Hitbox.
 * @param {number} count Subgrid count.
 * @returns {number} Last subcell x.
 */
Game_CharacterBase.prototype._pixelLastCollisionXAt = function(x, hb, count)
{
  // Translate into pivot-space for X.
  const px = x + this.getCollisionPivotX();

  // Compute the right edge of the hitbox in subgrid units.
  const raw = (px + hb.hx + hb.w) * count;

  // Define a tiny inward epsilon to resolve exact-seam ties into the current subcell.
  const eps = 1e-7;

  // Compute the last overlapped subcolumn using inward-biased floor of (edge - eps).
  return Math.floor(raw - eps) / count;
};

/**
 * First collision Y for hitbox at center y with subgrid count.
 * Uses an inward-biased floor to pick the first overlapped subrow.
 * Applies the per-character pivot for alignment.
 * @param {number} y The character’s tile y.
 * @param {{hy:number,h:number}} hb Hitbox.
 * @param {number} count Subgrid count.
 * @returns {number} First subcell y.
 */
Game_CharacterBase.prototype._pixelFirstCollisionYAt = function(y, hb, count)
{
  // Translate into pivot-space for Y.
  const py = y + this.getCollisionPivotY();

  // Compute the top edge of the hitbox in subgrid units.
  const raw = (py + hb.hy) * count;

  // Define a tiny inward epsilon to resolve exact-seam ties into the current subcell.
  const eps = 1e-7;

  // Compute the first overlapped subrow using inward-biased floor.
  return Math.floor(raw + eps) / count;
};

/**
 * Last collision Y for hitbox at center y with subgrid count.
 * Uses an inward-biased floor on the bottom edge minus epsilon to include the last overlapped subrow.
 * Applies the per-character pivot for alignment.
 * @param {number} y The character’s tile y.
 * @param {{hy:number,h:number}} hb Hitbox.
 * @param {number} count Subgrid count.
 * @returns {number} Last subcell y.
 */
Game_CharacterBase.prototype._pixelLastCollisionYAt = function(y, hb, count)
{
  // Translate into pivot-space for Y.
  const py = y + this.getCollisionPivotY();

  // Compute the bottom edge of the hitbox in subgrid units.
  const raw = (py + hb.hy + hb.h) * count;

  // Define a tiny inward epsilon to resolve exact-seam ties into the current subcell.
  const eps = 1e-7;

  // Compute the last overlapped subrow using inward-biased floor of (edge - eps).
  return Math.floor(raw - eps) / count;
};

/**
 * Checks leftward passage from current center at y across edge subcells.
 * Uses integer subcell indices to detect true seam crossings and sample spans.
 * @param {number} x Current center x.
 * @param {number} y Current center y.
 * @param {number} xDest Destination center x.
 * @param {{hx:number,hy:number,w:number,h:number}} hb Hitbox.
 * @param {number} count Subgrid count.
 * @returns {boolean} True if passage allowed.
 */
Game_CharacterBase.prototype._pixelCheckLeftPassage = function(x, y, xDest, hb, count)
{
  // Acquire the feet-pivoted coordinates.
  const px0 = x + this.getCollisionPivotX();
  const px1 = xDest + this.getCollisionPivotX();
  const py = y + this.getCollisionPivotY();

  // Tiny epsilon for seam bias into box interior.
  const eps = 1e-7;

  // Current and destination left integer column indices (the leading edge when moving left).
  const curLeftIdx  = Math.floor((px0 + hb.hx) * count + eps);
  const destLeftIdx = Math.floor((px1 + hb.hx) * count + eps);

  // True leftward crossing: destination left edge exactly one column left of current left edge.
  const crossed = (destLeftIdx === curLeftIdx - 1);
  if (crossed === false)
  {
    // No seam entry; nothing to validate.
    return true;
  }

  // Compute vertical span in integer row indices at current y.
  const firstRowIdx = Math.floor((py + hb.hy) * count + eps);
  const lastRowIdx  = Math.floor((py + hb.hy + hb.h) * count - eps);

  // Convert seam columns back to fractional for sampling.
  const curColX  = curLeftIdx / count;
  const destColX = destLeftIdx / count;

  // Iterate all overlapped rows on that column transition.
  for (let row = firstRowIdx; row <= lastRowIdx; row++)
  {
    // Convert the current row index into a fractional y for sampling.
    const ny = row / count;

    // DEBUG markers.
    // yellow current.
    PixelDebugSampler.push(curColX,  ny, "rgba(255, 255, 0, 0.6)");
    // cyan dest.
    PixelDebugSampler.push(destColX, ny, "rgba(0, 255, 255, 0.6)");

    // Current left-most subcell must allow moving LEFT (exiting left).
    if (this._pixelIsPositionPassable(curColX, ny, J.PIXEL.Directions.LEFT) === false) return false;

    // Destination right-most subcell must allow moving RIGHT (entering from left).
    if (this._pixelIsPositionPassable(destColX, ny, J.PIXEL.Directions.RIGHT) === false) return false;
  }

  // All sampled rows permit left passage.
  return true;
};

/**
 * Checks rightward passage across edge subcells using integer indices.
 * Validates current-right vs destination-left along all overlapped rows.
 * @param {number} x Current center x.
 * @param {number} y Current center y.
 * @param {number} xDest Destination center x.
 * @param {{hx:number,hy:number,w:number,h:number}} hb Hitbox.
 * @param {number} count Subgrid count.
 * @returns {boolean} True if passage allowed.
 */
Game_CharacterBase.prototype._pixelCheckRightPassage = function(x, y, xDest, hb, count)
{
  // Pivoted positions.
  const px0 = x + this.getCollisionPivotX();
  const px1 = xDest + this.getCollisionPivotX();
  const py = y + this.getCollisionPivotY();

  // Epsilon for inward bias.
  const eps = 1e-7;

  // Current and destination right integer column indices (the leading edge when moving right).
  const curRightIdx  = Math.floor((px0 + hb.hx + hb.w) * count - eps);
  const destRightIdx = Math.floor((px1 + hb.hx + hb.w) * count + eps);

  // True rightward crossing: destination right edge exactly one column right of current right edge.
  const crossed = (destRightIdx === curRightIdx + 1);
  if (crossed === false)
  {
    // Did not enter a new subcolumn; nothing to validate.
    return true;
  }

  // Vertical span in integer rows.
  const firstRowIdx = Math.floor((py + hb.hy) * count + eps);
  const lastRowIdx  = Math.floor((py + hb.hy + hb.h) * count - eps);

  // Convert to fractional for sampling.
  const curColX  = curRightIdx / count;
  const destColX = destRightIdx / count;

  // Iterate all overlapped rows on that column transition.
  for (let row = firstRowIdx; row <= lastRowIdx; row++)
  {
    // Convert the row index into a fractional y for sampling.
    const ny = row / count;

    // DEBUG markers.
    // yellow current.
    PixelDebugSampler.push(curColX,  ny, "rgba(255, 255, 0, 0.6)");
    // cyan dest.
    PixelDebugSampler.push(destColX, ny, "rgba(0, 255, 255, 0.6)");

    // Current right-most must allow RIGHT (exiting right).
    if (this._pixelIsPositionPassable(curColX, ny, J.PIXEL.Directions.RIGHT) === false) return false;

    // Destination left-most must allow LEFT (entering from right).
    if (this._pixelIsPositionPassable(destColX, ny, J.PIXEL.Directions.LEFT) === false) return false;
  }

  // All sampled rows permit right passage.
  return true;
};

/**
 * Checks upward passage across edge subcells using integer indices.
 * Validates current-top vs destination-bottom along all overlapped columns.
 * @param {number} x Current center x.
 * @param {number} y Current center y.
 * @param {number} yDest Destination center y.
 * @param {{hx:number,hy:number,w:number,h:number}} hb Hitbox.
 * @param {number} count Subgrid count.
 * @returns {boolean} True if passage allowed.
 */
Game_CharacterBase.prototype._pixelCheckUpPassage = function(x, y, yDest, hb, count)
{
  // Pivoted positions.
  const py0 = y + this.getCollisionPivotY();
  const py1 = yDest + this.getCollisionPivotY();
  const px  = x + this.getCollisionPivotX();

  // Epsilon for inward bias.
  const eps = 1e-7;

  // Current and destination top integer row indices (the leading edge when moving up).
  const curTopIdx  = Math.floor((py0 + hb.hy) * count + eps);
  const destTopIdx = Math.floor((py1 + hb.hy) * count + eps);

  // True upward crossing: destination top edge exactly one row above current top edge.
  const crossed = (destTopIdx === curTopIdx - 1);
  if (crossed === false)
  {
    // No seam entry; nothing to validate.
    return true;
  }

  // Horizontal span in integer columns.
  const firstColIdx = Math.floor((px + hb.hx) * count + eps);
  const lastColIdx  = Math.floor((px + hb.hx + hb.w) * count - eps);

  // Convert seam rows to fractional for sampling.
  const curRowY  = curTopIdx / count;
  const destRowY = destTopIdx / count;

  // Iterate all overlapped columns on that row transition.
  for (let col = firstColIdx; col <= lastColIdx; col++)
  {
    // Convert the column index into a fractional x for sampling.
    const nx = col / count;

    // DEBUG markers.
    // yellow current.
    PixelDebugSampler.push(nx, curRowY,  "rgba(255, 255, 0, 0.6)");
    // cyan dest.
    PixelDebugSampler.push(nx, destRowY, "rgba(0, 255, 255, 0.6)");

    // Current top must allow UP (exiting upward).
    if (this._pixelIsPositionPassable(nx, curRowY,  J.PIXEL.Directions.UP)   === false) return false;

    // Destination bottom must allow DOWN (entering from below).
    if (this._pixelIsPositionPassable(nx, destRowY, J.PIXEL.Directions.DOWN) === false) return false;
  }

  // All sampled columns permit up passage.
  return true;
};

/**
 * Checks downward passage across edge subcells using integer indices.
 * Validates current-bottom vs destination-top along all overlapped columns.
 * @param {number} x Current center x.
 * @param {number} y Current center y.
 * @param {number} yDest Destination center y.
 * @param {{hx:number,hy:number,w:number,h:number}} hb Hitbox.
 * @param {number} count Subgrid count.
 * @returns {boolean} True if passage allowed.
 */
Game_CharacterBase.prototype._pixelCheckDownPassage = function(x, y, yDest, hb, count)
{
  // Pivoted positions.
  const py0 = y + this.getCollisionPivotY();
  const py1 = yDest + this.getCollisionPivotY();
  const px  = x + this.getCollisionPivotX();

  // Epsilon for inward bias.
  const eps = 1e-7;

  // Current and destination bottom integer row indices (the leading edge when moving down).
  const curBottomIdx  = Math.floor((py0 + hb.hy + hb.h) * count - eps);
  const destBottomIdx = Math.floor((py1 + hb.hy + hb.h) * count + eps);

  // True downward crossing: destination bottom edge exactly one row below current bottom edge.
  const crossed = (destBottomIdx === curBottomIdx + 1);
  if (crossed === false)
  {
    // No seam entry; nothing to validate.
    return true;
  }

  // Horizontal span in integer columns.
  const firstColIdx = Math.floor((px + hb.hx) * count + eps);
  const lastColIdx  = Math.floor((px + hb.hx + hb.w) * count - eps);

  // Convert seam rows to fractional for sampling.
  const curRowY  = curBottomIdx  / count;
  const destRowY = destBottomIdx / count;

  // Iterate all overlapped columns on that row transition.
  for (let col = firstColIdx; col <= lastColIdx; col++)
  {
    // Convert the column index into a fractional x for sampling.
    const nx = col / count;

    // DEBUG markers.
    // yellow current.
    PixelDebugSampler.push(nx, curRowY,  "rgba(255, 255, 0, 0.6)");
    // cyan dest.
    PixelDebugSampler.push(nx, destRowY, "rgba(0, 255, 255, 0.6)");

    // Current bottom must allow DOWN (exiting downward).
    if (this._pixelIsPositionPassable(nx, curRowY,  J.PIXEL.Directions.DOWN) === false) return false;

    // Destination top must allow UP (entering from above).
    if (this._pixelIsPositionPassable(nx, destRowY, J.PIXEL.Directions.UP)   === false) return false;
  }

  // All sampled columns permit down passage.
  return true;
};

/**
 * Validates vertical lanes (up/down) at the specific new X-edge column we are entering.
 * Now uses integer column indices and runs only when a seam was truly crossed.
 * @param {number} xCurrent The current center x before the step.
 * @param {number} xDest The destination center x after the step.
 * @param {number} y The current center y (for edge sampling across vertical lanes).
 * @param {{hx:number,hy:number,w:number,h:number}} hb The hitbox metrics.
 * @param {number} count The collision subgrid count.
 * @returns {boolean} True if lanes ok.
 */
Game_CharacterBase.prototype._pixelCheckVerticalAtNewXColumn = function(xCurrent, xDest, y, hb, count)
{
  // If no horizontal motion, nothing to do.
  if (xDest === xCurrent) return true;

  // Pivoted positions.
  const px0 = xCurrent + this.getCollisionPivotX();
  const px1 = xDest    + this.getCollisionPivotX();
  const py  = y        + this.getCollisionPivotY();

  // Epsilon for inward bias.
  const eps = 1e-7;

  // Current and destination seam columns as integer indices.
  const curRightIdx  = Math.floor((px0 + hb.hx + hb.w) * count - eps);
  const curLeftIdx   = Math.floor((px0 + hb.hx) * count + eps);
  const destLeftIdx  = Math.floor((px1 + hb.hx) * count + eps);
  const destRightIdx = Math.floor((px1 + hb.hx + hb.w) * count - eps);

  // Determine motion direction.
  const movingRight = xDest > xCurrent;

  // True seam entry test.
  const crossed = movingRight
    ? (destLeftIdx === curRightIdx + 1)
    : (destRightIdx === curLeftIdx - 1);

  // If no seam crossed, do not lane-check.
  if (crossed === false) return true;

  // Choose the destination seam column index.
  const columnIdx = movingRight ? destLeftIdx : destRightIdx;

  // Convert to fractional x for sampling.
  const columnX = columnIdx / count;

  // Vertical span.
  const firstRowIdx = Math.floor((py + hb.hy) * count + eps);
  const lastRowIdx  = Math.floor((py + hb.hy + hb.h) * count - eps);

  // Iterate the overlapped vertical subcells on that column.
  for (let row = firstRowIdx; row <= lastRowIdx; row++)
  {
    // Convert the row index into a fractional y for sampling.
    const ny = row / count;

    // DEBUG lane markers (blue).
    PixelDebugSampler.push(columnX, ny, "rgba(0, 128, 255, 0.6)");

    // Compute lane permissions.
    const upOk   = this._pixelIsPositionPassable(columnX, ny, J.PIXEL.Directions.UP);
    const downOk = this._pixelIsPositionPassable(columnX, ny, J.PIXEL.Directions.DOWN);

    // Require at least one lane open for sliding.
    if (upOk === false && downOk === false) return false;
  }

  // Lanes are open enough to permit passage.
  return true;
};

/**
 * Validates horizontal lanes (left/right) at the specific new Y-edge row we are entering.
 * Now uses integer row indices and runs only when a seam was truly crossed.
 * @param {number} yCurrent The current center y before the step.
 * @param {number} yDest The destination center y after the step.
 * @param {number} x The current center x (for edge sampling across horizontal lanes).
 * @param {{hx:number,hy:number,w:number,h:number}} hb The hitbox metrics.
 * @param {number} count The collision subgrid count.
 * @returns {boolean} True if lanes ok.
 */
Game_CharacterBase.prototype._pixelCheckHorizontalAtNewYRow = function(yCurrent, yDest, x, hb, count)
{
  // If no vertical motion, nothing to do.
  if (yDest === yCurrent) return true;

  // Pivoted positions.
  const py0 = yCurrent + this.getCollisionPivotY();
  const py1 = yDest    + this.getCollisionPivotY();
  const px  = x        + this.getCollisionPivotX();

  // Epsilon for inward bias.
  const eps = 1e-7;

  // Current and destination seam rows as integer indices.
  const curBottomIdx  = Math.floor((py0 + hb.hy + hb.h) * count - eps);
  const curTopIdx     = Math.floor((py0 + hb.hy) * count + eps);
  const destTopIdx    = Math.floor((py1 + hb.hy) * count + eps);
  const destBottomIdx = Math.floor((py1 + hb.hy + hb.h) * count - eps);

  // Determine motion direction.
  const movingDown = yDest > yCurrent;

  // True seam entry test.
  const crossed = movingDown
    ? (destTopIdx === curBottomIdx + 1)
    : (destBottomIdx === curTopIdx - 1);

  // If no seam crossed, do not lane-check.
  if (crossed === false) return true;

  // Choose the destination seam row index.
  const rowIdx = movingDown ? destTopIdx : destBottomIdx;

  // Convert to fractional y for sampling.
  const rowY = rowIdx / count;

  // Horizontal span.
  const firstColIdx = Math.floor((px + hb.hx) * count + eps);
  const lastColIdx  = Math.floor((px + hb.hx + hb.w) * count - eps);

  // Iterate the overlapped horizontal subcells on that row.
  for (let col = firstColIdx; col <= lastColIdx; col++)
  {
    // Convert the column index into a fractional x for sampling.
    const nx = col / count;

    // DEBUG lane markers (blue).
    PixelDebugSampler.push(nx, rowY, "rgba(0, 128, 255, 0.6)");

    // Compute lane permissions.
    const leftOk  = this._pixelIsPositionPassable(nx, rowY, J.PIXEL.Directions.LEFT);
    const rightOk = this._pixelIsPositionPassable(nx, rowY, J.PIXEL.Directions.RIGHT);

    // Require at least one lane open for sliding.
    if (leftOk === false && rightOk === false) return false;
  }

  // Lanes are open enough to permit passage.
  return true;
};
//endregion pixel helpers
//region vector movement
/**
 * Moves this character at an arbitrary angle in degrees.
 * The angle follows the RMMZ map convention: 0° = right, 90° = down, 180° = left, 270° = up.
 * Movement is blocked if pixel collision prevents passage in the chosen direction.
 * @param {number} angleDegrees The angle in degrees (0–360, clockwise from right).
 * @param {number=} speed The movement speed in tile units; defaults to distancePerFrame.
 * @returns {boolean} True if the character moved, false if blocked.
 */
Game_CharacterBase.prototype.vectorMoveByAngle = function(angleDegrees, speed = this.distancePerFrame())
{
  // convert angle from degrees to radians.
  const radians = (angleDegrees * Math.PI) / 180;

  // compute the signed unit vector components in tile space.
  const dx = Math.cos(radians) * speed;
  const dy = Math.sin(radians) * speed;

  // cache the pre-move position for rollback on collision.
  const prevX = this._x;
  const prevY = this._y;

  // acquire the collision radius for AABB evaluation.
  const radius = this.getEffectiveRadius();

  // determine the nearest 8-direction for per-axis collision probing.
  let horzDir = 0;
  if (dx > 0)
  {
    horzDir = J.PIXEL.Directions.RIGHT;
  }
  else if (dx < 0)
  {
    horzDir = J.PIXEL.Directions.LEFT;
  }
  let vertDir = 0;
  if (dy > 0)
  {
    vertDir = J.PIXEL.Directions.DOWN;
  }
  else if (dy < 0)
  {
    vertDir = J.PIXEL.Directions.UP;
  }

  // probe horizontal component if non-zero.
  let canMoveX = (dx === 0);
  if (dx !== 0)
  {
    // check straight horizontal passage at the proposed X offset.
    canMoveX = this.canPassStraight(horzDir, Math.abs(dx));
  }

  // probe vertical component if non-zero.
  let canMoveY = (dy === 0);
  if (dy !== 0)
  {
    // check straight vertical passage at the proposed Y offset.
    canMoveY = this.canPassStraight(vertDir, Math.abs(dy));
  }

  // determine final displacement with wall-sliding: if one axis is blocked, zero it.
  const finalDx = canMoveX ? dx : 0;
  const finalDy = canMoveY ? dy : 0;

  // if neither axis allows movement, the character is fully blocked.
  if (finalDx === 0 && finalDy === 0)
  {
    // no movement occurred.
    return false;
  }

  // apply displacement.
  this._x += finalDx;
  this._y += finalDy;

  // post-overlap guard: if we ended up inside a solid tile, roll back.
  if (this.isThrough() === false && this.isDebugThrough() === false && this.isOverlappingSolidTiles(
    this._x + this.getCollisionPivotX(),
    this._y + this.getCollisionPivotY(),
    radius))
  {
    // restore the previous position.
    this._x = prevX;
    this._y = prevY;

    // synchronize render coordinates.
    this._realX = this._x;
    this._realY = this._y;

    // no movement occurred.
    return false;
  }

  // flag that movement occurred this frame.
  this.setMovedThisFrame(true);

  // synchronize render/smoothing coordinates.
  this._realX = this._x;
  this._realY = this._y;

  // update move distance for step tracking.
  this.modMoveDistance(speed);

  // check for step threshold crossing.
  this.updatePixelStepping();

  // face the nearest 8-direction toward the angle for sprite orientation.
  const facingDirection = this.angleToNearestDirection(angleDegrees);
  if (facingDirection > 0)
  {
    // update the sprite facing direction.
    this.setDirection(facingDirection);
  }

  // movement succeeded.
  return true;
};

/**
 * Converts an angle in degrees to the nearest 4-direction code for sprite facing.
 * Uses cardinal-only snapping since RMMZ sprites only have 4 facing directions.
 * @param {number} angleDegrees The angle in degrees (0° = right, 90° = down).
 * @returns {2|4|6|8} The nearest cardinal direction code.
 */
Game_CharacterBase.prototype.angleToNearestDirection = function(angleDegrees)
{
  // normalize angle to 0–360 range.
  const normalized = ((angleDegrees % 360) + 360) % 360;

  // snap to the closest 90° quadrant.
  if (normalized >= 315 || normalized < 45)
  {
    // right: 315–360 and 0–45.
    return J.PIXEL.Directions.RIGHT;
  }

  if (normalized >= 45 && normalized < 135)
  {
    // down: 45–135.
    return J.PIXEL.Directions.DOWN;
  }

  if (normalized >= 135 && normalized < 225)
  {
    // left: 135–225.
    return J.PIXEL.Directions.LEFT;
  }

  // up: 225–315.
  return J.PIXEL.Directions.UP;
};
//endregion vector movement
//endregion Game_CharacterBase