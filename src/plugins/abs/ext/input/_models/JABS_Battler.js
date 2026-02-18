//region JABS_Battler
/**
 * Generates a `JABS_Battler` based on the current leader of the party.
 * Also assigns the controller inputs for the player.
 */
J.ABS.EXT.INPUT.Aliased.JABS_Battler.set('createPlayer', JABS_Battler.createPlayer);
JABS_Battler.createPlayer = function()
{
  // intercept return data from original logic.
  const playerJabsBattler = J.ABS.EXT.INPUT.Aliased.JABS_Battler.get('createPlayer')
    .call(this);

  // assign newly players are created to controller 1.
  $jabsController1.setBattler(playerJabsBattler);

  // return original logic data.
  return playerJabsBattler;
};

/**
 * Extends {@link JABS_Battler.canActionConnect}.<br/>
 * While the debug button is pressed, the player cannot be targeted.
 * @returns {boolean} True if actions can potentially connect, false otherwise.
 */
J.ABS.EXT.INPUT.Aliased.JABS_Battler.set('canActionConnect', JABS_Battler.prototype.canActionConnect);
JABS_Battler.prototype.canActionConnect = function()
{
  // the player cannot be targeted while holding the DEBUG button.
  if (this.isPlayer() && Input.isPressed(J.ABS.EXT.INPUT.Symbols.Debug)) return false;

  // perform original logic.
  return J.ABS.EXT.INPUT.Aliased.JABS_Battler.get('canActionConnect')
    .call(this);
};
//endregion JABS_Battler