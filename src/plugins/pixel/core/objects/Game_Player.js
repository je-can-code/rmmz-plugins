//region Game_Player
/**
 * Overwrites {@link Game_Player.checkEventTriggerHere}.<br/>
 * Checks the tile this character's body actually occupies (the collision pivot's tile) rather
 * than the fractional `_x`/`_y` vanilla assumes are already integers.
 * @param {number[]} triggers The numeric triggers for this event.
 */
Game_Player.prototype.checkEventTriggerHere = function(triggers)
{
  // check if we can start an event at the current location.
  if (this.canStartLocalEvents())
  {
    let effectiveTriggers = triggers;
    if (($gameMap._pixelFootTouchTriggerCooldown || 0) > 0)
    {
      effectiveTriggers = triggers.filter(t => t !== 1 && t !== 2);
      if (effectiveTriggers.length === 0)
      {
        return;
      }
    }

    // start the event at the tile this character's body actually occupies.
    this.startMapEvent(this.occupiedTileX(), this.occupiedTileY(), effectiveTriggers, false);
  }
};

/**
 * Extends {@link Game_Player.update}.<br/>
 * Ticks down the foot-touch trigger cooldown after all movement and trigger logic for the frame,
 * then fires underfoot touch triggers exactly once per tile entered.
 */
J.PIXEL.Aliased.Game_Player.set('update', Game_Player.prototype.update);
Game_Player.prototype.update = function(sceneActive)
{
  // perform original logic.
  J.PIXEL.Aliased.Game_Player.get('update')
    .call(this, sceneActive);

  if ($gameMap._pixelFootTouchTriggerCooldown > 0)
  {
    $gameMap._pixelFootTouchTriggerCooldown--;
  }

  // Vanilla's "check underfoot triggers when a step completes onto a tile" cadence doesn't
  // exist under pixel movement: onStep fires on accumulated travel distance (updatePixelStepping),
  // not on tile boundaries, so whether an underfoot check happens while inside a given tile's
  // window is a function of dash speed and where the distance accumulator started. Detecting the
  // occupied tile actually changing is the only cadence that's deterministic regardless of speed.
  const tileX = this.occupiedTileX();
  const tileY = this.occupiedTileY();
  if (this.lastOccupiedTileX() !== tileX || this.lastOccupiedTileY() !== tileY)
  {
    // Track the new tile before checking, so a started event's own updates can't re-trigger this.
    this.setLastOccupiedTileX(tileX);
    this.setLastOccupiedTileY(tileY);
    this.checkEventTriggerHere([ 1, 2 ]);
  }
};

/**
 * Overwrites {@link Game_Player.checkEventTriggerThere}.<br/>
 * Checks the player's own occupied tile before the front tile: under pixel movement a
 * feet-anchored body can legitimately be standing on an event's tile (e.g. a doorstep whose
 * blocking wall is the row behind it) even though the tile "in front" per vanilla's model is
 * something else entirely (the wall). Vanilla's model — only ever check the tile ahead — assumes
 * tile-locked movement where that overlap can't happen. Then computes the front tile from the
 * current facing using the occupied-tile coordinates, and if that tile is a counter, checks one
 * tile beyond — matching vanilla's own guard against double-starting an event across both checks.
 * @param {number[]} triggers The triggers associated with checking the event at the location.
 */
Game_Player.prototype.checkEventTriggerThere = function(triggers)
{
  // Check if we can start an event at the target location.
  if (this.canStartLocalEvents() === false) return;

  // Resolve the tile this character's body actually occupies.
  const baseX = this.occupiedTileX();
  const baseY = this.occupiedTileY();

  // A doorstep-style event can sit on the player's own occupied tile; check it before
  // ever looking ahead, so overlap geometry doesn't hide the event behind a "front tile"
  // that's actually the wall behind it.
  this.startMapEvent(baseX, baseY, triggers, true);

  // Do not double-start an event if the base-tile check above already started one.
  if ($gameMap.isAnyEventStarting()) return;

  // Acquire the current facing direction (expects cardinal).
  const dir = this.direction();

  // Compute the front tile from the occupied-tile coordinates and facing.
  const x1 = $gameMap.roundXWithDirection(baseX, dir);
  const y1 = $gameMap.roundYWithDirection(baseY, dir);

  // Start any qualifying events on the front tile; treat them as "there"/normal.
  this.startMapEvent(x1, y1, triggers, true);

  // Determine if the front tile is a counter; only look beyond it if nothing already started.
  if ($gameMap.isAnyEventStarting() === false && $gameMap.isCounter(x1, y1))
  {
    // Compute the tile one more step beyond the counter tile.
    const x2 = $gameMap.roundXWithDirection(x1, dir);
    const y2 = $gameMap.roundYWithDirection(y1, dir);

    // Start any qualifying events on the tile beyond the counter.
    this.startMapEvent(x2, y2, triggers, true);
  }
};

/**
 * Extends {@link checkEventTriggerTouch}.<br/>
 * Handles the triggering of events by using a threshold-type formula to determine if actually touched.
 */
J.PIXEL.Aliased.Game_Player.set('checkEventTriggerTouch', Game_Player.prototype.checkEventTriggerTouch);
Game_Player.prototype.checkEventTriggerTouch = function(x, y)
{
  // round the x,y coordinates.
  const roundX = Math.round(x);
  const roundY = Math.round(y);

  // rmmz touch events operate at integer tile coordinates, so rounding is required.
  // trigger only when within 0.3 tiles of the tile center to prevent early/spurious fires.
  const didTrigger = Math.abs(roundX - x) < 0.3 && Math.abs(roundY - y) < 0.3;

  // check if the event was triggered with the threshold coordinates.
  if (didTrigger)
  {
    // return the original logic's result.
    // perform original logic.
    return J.PIXEL.Aliased.Game_Player.get('checkEventTriggerTouch')
      .call(this, roundX, roundY);
  }

  // no triggering the event.
  return false;
};

/**
 * Overwrites {@link Game_Player.checkEventTriggerTouchFront}.<br/>
 * Checks the player's own occupied tile first — a blocked player can be overlapping an event's
 * tile (doorstep geometry) and should still fire its touch trigger, not just the tile ahead. Then
 * computes the front tile from the current facing using the occupied-tile coordinates, checks for
 * touch triggers there via PIXEL threshold logic, and if the front tile is a counter, also checks
 * the tile beyond.
 * @param {number} direction The attempted move direction (ignored; uses current facing).
 * @returns {boolean} True if a touch trigger fired, false otherwise.
 */
// eslint-disable-next-line no-unused-vars
Game_Player.prototype.checkEventTriggerTouchFront = function(direction)
{
  // Resolve the tile this character's body actually occupies.
  const baseX = this.occupiedTileX();
  const baseY = this.occupiedTileY();

  // A blocked player overlapping an event's tile (doorstep geometry) should still
  // fire that event's touch trigger, before ever looking ahead.
  if (this.checkEventTriggerTouch(baseX, baseY))
  {
    // The base-tile touch trigger fired.
    return true;
  }

  // Always use the player's current facing for front-touch checks.
  const dir = this.direction();

  // Compute the front tile from the occupied-tile coordinates and facing.
  const x1 = $gameMap.roundXWithDirection(baseX, dir);
  const y1 = $gameMap.roundYWithDirection(baseY, dir);

  // Attempt to touch-trigger events on the front tile using PIXEL's threshold logic.
  if (this.checkEventTriggerTouch(x1, y1))
  {
    // A front-touch trigger was fired.
    return true;
  }

  // Determine if the front tile is a counter.
  const isCounter = $gameMap.isCounter(x1, y1);

  // If the front tile is a counter, also check one tile beyond.
  if (isCounter)
  {
    // Compute the tile one more step beyond the counter tile.
    const x2 = $gameMap.roundXWithDirection(x1, dir);
    const y2 = $gameMap.roundYWithDirection(y1, dir);

    // Attempt to touch-trigger events on the beyond tile using PIXEL's threshold logic.
    if (this.checkEventTriggerTouch(x2, y2))
    {
      // A beyond-counter touch trigger was fired.
      return true;
    }
  }

  // No touch triggers fired for front or beyond.
  return false;
};

/**
 * Updates whether or not the player is dashing.
 */
Game_Player.prototype.updateDashing = function()
{
  // if we are moving by means other than pressing the button, don't process.
  if (this.isMoving() && !this.isMovePressed()) return;

  // check if we can move, are out of a vehicle, and dashing is enabled.
  if (this.canMove() && !this.isInVehicle() && !$gameMap.isDashDisabled())
  {
    // we're dashing then if the we clicked to go somewhere, or we're holding dash.
    this._dashing = this.isDashButtonPressed() || $gameTemp.isDestinationValid();

    // stop processing.
    return;
  }

  // we are not dashing.
  this._dashing = false;
};

/**
 * Gets the analog input angle for the player in degrees, if vector movement is active.
 * Reads raw gamepad axis data directly from the Gamepad API to preserve sub-45° precision.
 * Falls back to keyboard/d-pad dir8-to-angle conversion when no analog stick is active.
 * Returns null if vector movement is disabled or there is no directional input at all.
 * @returns {number|null} Angle in degrees (0=right, 90=down), or null if not applicable.
 */
Game_Player.prototype.getVectorInputAngle = function()
{
  // do not use vector movement if the parameter is disabled.
  if (J.PIXEL.Metadata.VectorMovementEnabled === false)
  {
    return null;
  }

  // try the raw analog stick first; it returns null when no gamepad is active or
  // the stick is inside the dead zone.
  const analogAngle = this._readGamepadAnalogAngle();

  if (analogAngle !== null)
  {
    return analogAngle;
  }

  // fall back to keyboard / d-pad: convert the 8-direction code to a fixed angle.
  const rawDir8 = Input.dir8;

  if (rawDir8 === 0)
  {
    return null;
  }

  return this.dir8ToAngle(rawDir8);
};

/**
 * Reads the left analog stick from the first connected gamepad and returns the angle
 * in degrees, or null if no gamepad is present or the stick is inside the dead zone.
 *
 * RMMZ's Input system discards raw axis floats before they reach Input.dir8, converting
 * them to digital button states with a 0.5 threshold. To get true arbitrary angles we
 * must bypass RMMZ and read navigator.getGamepads() directly.
 *
 * Dead zone of 0.15 (smaller than RMMZ's 0.5 threshold) filters joystick drift while
 * still detecting gentle pushes before RMMZ's digital conversion fires.
 *
 * @returns {number|null} Angle in degrees (0=right, 90=down in RMMZ Y-down space), or null.
 */
Game_Player.prototype._readGamepadAnalogAngle = function()
{
  // Gamepad API is not available in all environments.
  if (!navigator.getGamepads)
  {
    return null;
  }

  const gamepads = navigator.getGamepads();

  if (!gamepads)
  {
    return null;
  }

  for (const gamepad of gamepads)
  {
    if (!gamepad || gamepad.connected === false)
    {
      continue;
    }

    const [axisX, axisY] = gamepad.axes;

    // compute magnitude to apply a circular dead zone.
    const magnitude = Math.sqrt(axisX * axisX + axisY * axisY);

    if (magnitude < 0.15)
    {
      // stick is inside the dead zone; try the next gamepad.
      continue;
    }

    // atan2 returns radians in [-π, π]; convert to degrees.
    return Math.atan2(axisY, axisX) * 180 / Math.PI;
  }

  return null;
};

/**
 * Converts an 8-direction input code to an angle in degrees.
 * @param {1|2|3|4|6|7|8|9} dir8 The 8-direction code.
 * @returns {number} The angle in degrees (0=right, 90=down).
 */
Game_Player.prototype.dir8ToAngle = function(dir8)
{
  // map 8-dir codes to angles in the RMMZ Y-down space (0=right, 90=down, 180=left, 270=up).
  switch (dir8)
  {
    case J.PIXEL.Directions.RIGHT:
      return 0;
    case J.PIXEL.Directions.LOWERRIGHT:
      return 45;
    case J.PIXEL.Directions.DOWN:
      return 90;
    case J.PIXEL.Directions.LOWERLEFT:
      return 135;
    case J.PIXEL.Directions.LEFT:
      return 180;
    case J.PIXEL.Directions.UPPERLEFT:
      return 225;
    case J.PIXEL.Directions.UP:
      return 270;
    case J.PIXEL.Directions.UPPERRIGHT:
      return 315;
    default:
      return 0;
  }
};

/**
 * Overwrites {@link Game_Player.moveByInput}.<br/>
 * The meat and potatoes for pixel movement of the player.
 * Handles keyboard/gamepad directional input and click-to-move via destination coordinates.
 */
Game_Player.prototype.moveByInput = function()
{
  // determine if we should be moving when we are not.
  const notMovingButShouldBe = (!this.isMoving() || this.isMovePressed());

  // check if we should be moving when we're not, and actually can.
  if (notMovingButShouldBe && this.canMove())
  {
    // check the direction the player is pressing.
    let direction = Input.dir8;

    // make sure we are not just sitting there.
    if (direction > 0)
    {
      // clear the point-click destination.
      $gameTemp.clearDestination();

      // check if vector movement is active and we have a valid angle.
      const vectorAngle = this.getVectorInputAngle();

      if (vectorAngle !== null)
      {
        // use vector movement for smooth angle-based displacement.
        const moved = this.vectorMoveByAngle(vectorAngle);

        if (moved)
        {
          // keep followers in sync with vector movement.
          this.processFollowersPixelMoving();

          // flag that we're moving.
          this.setMovePressed(true);
        }
        else
        {
          // stop followers and release flag on block.
          this.stopFollowersPixelMoving();
          this.setMovePressed(false);
          this.checkEventTriggerTouchFront(direction);
        }

        // stop processing.
        return;
      }

      // check if the input is NOT being pressed.
      if (!this.isMovePressed())
      {
        // clear the collection of points.
        this.clearPositionalRecords();

        // grab the collection of followers.
        const followers = this.followers()._data;

        // also reset their positions.
        followers.forEach(follower => follower.clearPositionalRecords());
      }

      // flag that movement was not successful.
      this.setMovementSuccess(false);

      // determine the actual direction.
      direction = this.pixelMoveByInput(direction);

      // if we have a direction, assign it to ourselves.
      if (direction > 0)
      {
        // set the new direction.
        this.setDirection(direction);
      }

      // check if we've succeeded in moving somehow.
      if (this.isMovementSucceeded())
      {
        // move the followers with the player.
        this.processFollowersPixelMoving();

        // flag that we're holding the button.
        this.setMovePressed(true);
      }
      // we haven't succeeded in moving.
      else
      {
        // halt the followers pixel movement.
        this.stopFollowersPixelMoving();

        // toggle the input to false since we're not pushing the button.
        this.setMovePressed(false);

        // check if we triggered an event infront of the player.
        this.checkEventTriggerTouchFront(direction);
      }

      // stop processing.
      return;
    }

    // handle a pending click-to-move destination if no key is pressed.
    if ($gameTemp.isDestinationValid())
    {
      // attempt to move toward the destination via pixel-aware pathing.
      this.pixelMoveTowardDestination();

      // stop processing regardless of whether we moved.
      return;
    }
  }

  // don't actually move the followers.
  this.stopFollowersPixelMoving();

  // toggle the input to false since we're not pushing the button.
  this.setMovePressed(false);
};

/**
 * Moves the player one pixel step toward the current click-to-move destination.
 * Clears the destination when the player arrives at the target tile.
 */
Game_Player.prototype.pixelMoveTowardDestination = function()
{
  // acquire the destination tile coordinates.
  const destX = $gameTemp.destinationX();
  const destY = $gameTemp.destinationY();

  // compute the rounded player position for arrival check.
  const roundX = Math.round(this.x);
  const roundY = Math.round(this.y);

  // if we have arrived at the destination tile, clear it.
  if (roundX === destX && roundY === destY)
  {
    // destination reached; clear it so we stop pathing.
    $gameTemp.clearDestination();

    // stop followers from moving since we have arrived.
    this.stopFollowersPixelMoving();

    // release the move-pressed flag.
    this.setMovePressed(false);

    // stop processing.
    return;
  }

  // use tile A* to derive the next cardinal direction toward the destination.
  const dir = this.findDirectionTo(destX, destY);

  // if no path was found, give up and clear the destination.
  if (dir === 0)
  {
    // unreachable destination; clear it.
    $gameTemp.clearDestination();

    // stop followers.
    this.stopFollowersPixelMoving();

    // release the move-pressed flag.
    this.setMovePressed(false);

    // stop processing.
    return;
  }

  // reset movement success before attempting the step.
  this.setMovementSuccess(false);

  // execute the pixel step in the A*-derived direction.
  const facedDirection = this.pixelMoveByInput(dir);

  // update facing if a direction was returned.
  if (facedDirection > 0)
  {
    // face the direction of travel.
    this.setDirection(facedDirection);
  }

  // if the step succeeded, keep followers in sync.
  if (this.isMovementSucceeded())
  {
    // move the followers with the player.
    this.processFollowersPixelMoving();

    // flag that we're moving toward a destination.
    this.setMovePressed(true);
  }
  else
  {
    // step failed; stop followers and release move flag.
    this.stopFollowersPixelMoving();
    this.setMovePressed(false);
  }
};

/**
 * Extends {@link #onStep}.<br/>
 * Also processes on-step effects for the player.
 */
J.PIXEL.Aliased.Game_Player.set('onStep', Game_Player.prototype.onStep);
Game_Player.prototype.onStep = function()
{
  // perform original logic.
  J.PIXEL.Aliased.Game_Player.get('onStep')
    .call(this);

  // also process a step.
  this.handleOnStepEffects();
};

/**
 * Handles the various things to do on-step.
 */
Game_Player.prototype.handleOnStepEffects = function()
{
  // increases the step counter.
  this.increaseSteps();

  // checks if there is an event to trigger at this location.
  this.checkEventTriggerHere([ 1, 2 ]);
};

/**
 * Processes the pixel movement for followers.
 */
Game_Player.prototype.processFollowersPixelMoving = function()
{
  // Update the position for the player.
  this.recordPixelPosition();

  // Grab all the followers the player has.
  const followers = this.followers()._data;

  // Iterate over all the followers to do movement things.
  followers.forEach((follower, index) =>
  {
    // If Ally AI is present and this follower is AI-controlled, do not relocate via follower-train.
    if (J.ABS.EXT.ALLYAI && follower.getJabsBattler()) return;

    // Determine who the previous character was in the sequence.
    const precedingCharacter = index > 0
      ? followers.at(index - 1)
      : $gamePlayer;

    // Update the follower's direction.
    follower.pixelFaceCharacter(precedingCharacter);

    // Move the follower along the player's breadcrumb trail (vanilla-style train).
    const last = precedingCharacter.oldestPositionalRecord();
    if (last)
    {
      // Move the follower to the new location.
      follower.relocate(last.x, last.y);
    }

    // Flag the follower as holding the button.
    follower.startPixelMoving();
  });
};

/**
 * Stops the pixel movement for followers.
 */
Game_Player.prototype.stopFollowersPixelMoving = function()
{
  // Iterate over the followers and halt their pixel movement.
  this.followers()._data.forEach(follower =>
  {
    // If Ally AI is present and this follower is AI-controlled, do not interfere.
    if (J.ABS.EXT.ALLYAI && follower.getJabsBattler()) return;

    // Otherwise, stop pixel moving to prevent residual drift.
    follower.stopPixelMoving();
  });
};

/**
 * Overwrites {@link Game_CharacterBase.getCollisionPivotY}.<br/>
 * Anchors the player's collision center near their feet rather than the tile center.
 * This gives the implied top-down perspective its natural depth feel: the player can
 * slide closer to objects from below (approaching northward) and is gently blocked
 * sooner from above (approaching southward), matching visual depth expectations.
 * @returns {number} The Y pivot offset in tile units.
 */
Game_Player.prototype.getCollisionPivotY = function()
{
  return 0.70;
};

//region properties
/**
 * Gets the last occupied tile x.
 * @returns {number} The lastOccupiedTileX.
 */
Game_Player.prototype.lastOccupiedTileX = function()
{
  // hand back the last occupied tile x.
  return this._lastOccupiedTileX;
};

/**
 * Sets the last occupied tile x.
 * @param {number} newLastOccupiedTileX The new lastOccupiedTileX.
 */
Game_Player.prototype.setLastOccupiedTileX = function(newLastOccupiedTileX)
{
  // assign the last occupied tile x.
  this._lastOccupiedTileX = newLastOccupiedTileX;
};

/**
 * Gets the last occupied tile y.
 * @returns {number} The lastOccupiedTileY.
 */
Game_Player.prototype.lastOccupiedTileY = function()
{
  // hand back the last occupied tile y.
  return this._lastOccupiedTileY;
};

/**
 * Sets the last occupied tile y.
 * @param {number} newLastOccupiedTileY The new lastOccupiedTileY.
 */
Game_Player.prototype.setLastOccupiedTileY = function(newLastOccupiedTileY)
{
  // assign the last occupied tile y.
  this._lastOccupiedTileY = newLastOccupiedTileY;
};
//endregion properties
//endregion Game_Player