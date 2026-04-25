//region Game_Player
/**
 * Pivot guard is one input: movement lock in place, with guard layered when the offhand is guard-ready.
 * Pixel {@link #pixelMoveByInput} applies steps before JABS can reject them, so skip map motion while pivoting.
 */
J.PIXEL.EXT.ABS.Aliased.Game_Player.set('moveByInput', Game_Player.prototype.moveByInput);
Game_Player.prototype.moveByInput = function()
{
  const jabsPlayer = $jabsEngine && $jabsEngine.getPlayer1();
  const leaderCharacterMatches = jabsPlayer && jabsPlayer.getCharacter() === this;
  const pivotGuardBlocksMotion = leaderCharacterMatches
    && (jabsPlayer.canBattlerMove() === false || jabsPlayer.guarding());

  if (pivotGuardBlocksMotion)
  {
    $gameTemp.clearDestination();
    this.stopFollowersPixelMoving();
    this.setMovePressed(false);
    this.setMovementSuccess(false);

    let faceDir = 0;
    const vAngle = this.getVectorInputAngle();

    if (vAngle !== null)
    {
      faceDir = this.angleToNearestDirection(vAngle);
    }
    else
    {
      const d8 = Input.dir8;

      if (d8 > 0)
      {
        faceDir = this.angleToNearestDirection(this.dir8ToAngle(d8));
      }
    }

    if (faceDir > 0)
    {
      this.setDirection(faceDir);
      this.checkEventTriggerTouchFront(faceDir);
    }

    return;
  }

  J.PIXEL.EXT.ABS.Aliased.Game_Player.get('moveByInput')
    .call(this);
};

/**
 * Dash cannot reassert during pivot guard (pixel {@link #updateDashing} vs click-to-move).
 */
J.PIXEL.EXT.ABS.Aliased.Game_Player.set('updateDashing', Game_Player.prototype.updateDashing);
Game_Player.prototype.updateDashing = function()
{
  const jabsPlayer = $jabsEngine && $jabsEngine.getPlayer1();
  const leaderCharacterMatches = jabsPlayer && jabsPlayer.getCharacter() === this;
  const pivotGuardBlocksMotion = leaderCharacterMatches
    && (jabsPlayer.canBattlerMove() === false || jabsPlayer.guarding());

  if (pivotGuardBlocksMotion)
  {
    this._dashing = false;
    return;
  }

  J.PIXEL.EXT.ABS.Aliased.Game_Player.get('updateDashing')
    .call(this);
};
//endregion Game_Player