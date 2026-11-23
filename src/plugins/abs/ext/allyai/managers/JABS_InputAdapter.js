//region JABS_InputAdapter
/**
 * Orders every ally on the field to charge: each one goes after something to fight right now, whatever
 * the party's stance would have it wait for.
 *
 * Added to the core adapter so that whatever reads the player's input can issue the order without knowing
 * how allies carry it out; see {@link JABS_Battler.chargeOnCommand} for that.
 */
JABS_InputAdapter.performAllyCharge = function()
{
  // each ally on the field answers the order on its own.
  $gameMap.getFollowerBattlers()
    .forEach(ally => ally.chargeOnCommand());
};

/**
 * Orders every ally on the field to pull back: each one drops out of whatever it is fighting and stays
 * out of every fight for a while.
 *
 * Added to the core adapter so that whatever reads the player's input can issue the order without knowing
 * how allies carry it out; see {@link JABS_Battler.pullBackOnCommand} for that.
 */
JABS_InputAdapter.performAllyPullBack = function()
{
  // each ally on the field answers the order on its own.
  $gameMap.getFollowerBattlers()
    .forEach(ally => ally.pullBackOnCommand());
};

/**
 * Steps the party's stance one rung safer, toward hanging back behind the leader.
 */
JABS_InputAdapter.performAllyStanceSafer = function()
{
  this.stepAllyStance(-1);
};

/**
 * Steps the party's stance one rung bolder, toward leading the charge ahead of the leader.
 */
JABS_InputAdapter.performAllyStanceBolder = function()
{
  this.stepAllyStance(1);
};

/**
 * Steps the party's stance along the ladder of stances, and lets the player know how it went.
 *
 * A player stepping the stance mid-fight is not looking at a menu, so the change has to be heard and read
 * without one: a cursor sound and a line in the map's action log when it changes, and a buzzer when the
 * stance is already at the end of the ladder and there is nowhere further to step.
 * @param {number} step How many rungs to move; positive is bolder, negative is safer.
 */
JABS_InputAdapter.stepAllyStance = function(step)
{
  // the stance one rung along, or the same one at either end of the ladder.
  const nextStanceKey = $gameParty.stanceKeyAlongLadder(step);

  // already at the end of the ladder: say so, and change nothing.
  if (nextStanceKey === $gameParty.getPartyStance())
  {
    SoundManager.playBuzzer();
    return;
  }

  // take up the new stance.
  $gameParty.setPartyStance(nextStanceKey);

  // let the player hear and read that it changed.
  SoundManager.playCursor();
  this.logAllyStance();
};

/**
 * Writes the party's current stance into the map's action log.
 *
 * The log belongs to J-Log, which this plugin does not require; without it, the sound is the whole of the
 * feedback.
 */
JABS_InputAdapter.logAllyStance = function()
{
  // without J-Log there is no log to write to.
  if (!J.LOG) return;

  // name the stance, coloured the way the menu colours the stance command.
  const stance = $gameParty.getPartyStanceType();
  const stanceLog = new ActionLogBuilder()
    .setMessage(`Stance set to \\C[23]${stance.name}\\C[0].`)
    .build();

  // post it to the action log.
  $mapLogs.action.addLog(stanceLog);
};
//endregion JABS_InputAdapter