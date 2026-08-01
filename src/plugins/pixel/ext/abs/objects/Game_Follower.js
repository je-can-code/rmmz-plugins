//region Game_Follower
/**
 * Overwrites {@link Game_Follower.isPixelTrainSuspended}.<br/>
 * An ally with a JABS battler is steered by formation movement, which this same plugin implements
 * over in its {@link JABS_AiManager} augments. The player's breadcrumb train must therefore keep
 * its hands off: two systems writing a position to the same sprite every frame make it stutter
 * between the trail and the formation slot instead of settling on either.
 * @returns {boolean} True if formation movement owns this follower, false otherwise.
 */
Game_Follower.prototype.isPixelTrainSuspended = function()
{
  // `getJabsBattler` resolves through a Map lookup, so a follower with no battler registered
  // against its uuid answers undefined rather than a sentinel.
  return this.getJabsBattler() !== undefined;
};

/**
 * Extends {@link Game_Follower.chaseCharacter}.<br/>
 * Suppresses vanilla chasing for an AI-controlled ally, so formation movement owns where it goes.
 * @param {Game_Character} character The character to chase (usually the preceding character).
 */
J.PIXEL.EXT.ABS.Aliased.Game_Follower.set("chaseCharacter", Game_Follower.prototype.chaseCharacter);
Game_Follower.prototype.chaseCharacter = function(character)
{
  // formation movement already decides where this ally belongs.
  if (this.isPixelTrainSuspended()) return;

  // perform original logic.
  J.PIXEL.EXT.ABS.Aliased.Game_Follower.get("chaseCharacter")
    .call(this, character);
};

/**
 * Extends {@link Game_Follower.update}.<br/>
 * Clamps residual movement state on an idle AI-controlled ally. Formation movement issues its
 * steps deliberately rather than continuously, so an ally that took no pixel step this frame must
 * be told it is stationary- otherwise the engine keeps interpolating toward a destination nothing
 * intends to reach, and the ally drifts away from its slot.
 */
J.PIXEL.EXT.ABS.Aliased.Game_Follower.set("update", Game_Follower.prototype.update);
Game_Follower.prototype.update = function()
{
  // perform original logic.
  J.PIXEL.EXT.ABS.Aliased.Game_Follower.get("update")
    .call(this);

  // ordinary followers are driven by the train and need no clamping.
  if (this.isPixelTrainSuspended() === false) return;

  // an ally that moved under its own power this frame is mid-step and must not be interrupted.
  if (this.isMovePressed()) return;

  // reset the stop counter so the engine considers this ally stationary immediately.
  this.setStopCount(0);

  // pin the render coordinates to the logical ones so no interpolation remains.
  this.setRealX(this.x);
  this.setRealY(this.y);
};

/**
 * Determines whether generic movement should be blocked for an idle AI-controlled ally.
 * While an ally is neither engaged nor alerted it is in its formation phase, where the only
 * legitimate movement is the pixel step formation itself issued this frame. Anything else
 * reaching this point is a stray vanilla-cadence move that would fight the formation pull.
 * @returns {boolean} True if the movement should be blocked, false otherwise.
 */
Game_Follower.prototype.isIdleFormationMoveBlocked = function()
{
  // ordinary followers move freely.
  if (this.isPixelTrainSuspended() === false) return false;

  // acquire the battler carrying the engagement and alert state.
  const jabsBattler = this.getJabsBattler();

  // an ally in combat moves on its combat AI's terms, not formation's.
  if (jabsBattler.isEngaged() || jabsBattler.isAlerted()) return false;

  // during formation phase, only a step issued this frame is legitimate.
  return this.isMovePressed() === false;
};

/**
 * Extends {@link Game_Follower.moveStraight}.<br/>
 * Blocks stray straight movement for an idle AI-controlled ally.
 * @param {2|4|6|8} direction The cardinal direction to move.
 */
J.PIXEL.EXT.ABS.Aliased.Game_Follower.set("moveStraight", Game_Follower.prototype.moveStraight);
Game_Follower.prototype.moveStraight = function(direction)
{
  // do not let a stray move fight the formation pull.
  if (this.isIdleFormationMoveBlocked()) return;

  // perform original logic.
  J.PIXEL.EXT.ABS.Aliased.Game_Follower.get("moveStraight")
    .call(this, direction);
};

/**
 * Extends {@link Game_Follower.moveDiagonally}.<br/>
 * Blocks stray diagonal movement for an idle AI-controlled ally.
 * @param {4|6} horz The horizontal component direction (4=left, 6=right).
 * @param {2|8} vert The vertical component direction (2=down, 8=up).
 */
J.PIXEL.EXT.ABS.Aliased.Game_Follower.set("moveDiagonally", Game_Follower.prototype.moveDiagonally);
Game_Follower.prototype.moveDiagonally = function(horz, vert)
{
  // do not let a stray move fight the formation pull.
  if (this.isIdleFormationMoveBlocked()) return;

  // perform original logic.
  J.PIXEL.EXT.ABS.Aliased.Game_Follower.get("moveDiagonally")
    .call(this, horz, vert);
};
//endregion Game_Follower