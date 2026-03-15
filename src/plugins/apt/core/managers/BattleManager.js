//region BattleManager
/**
 * Extends {@link #makeRewards}.<br/>
 * Also includes the aptitude AP earned.
 */
J.APT.Aliased.BattleManager.set('makeRewards', BattleManager.makeRewards);
BattleManager.makeRewards = function()
{
  // Perform original logic.
  J.APT.Aliased.BattleManager.get('makeRewards')
    .call(this);

  // Extend the rewards to include AP.
  this._rewards = {
    ...this._rewards,
    aptitudeAp: $gameTroop.aptitudeApTotal(),
  };
};

/**
 * Extends {@link #gainRewards}.<br/>
 * Also awards the aptitude AP to party members via ApManager.
 */
J.APT.Aliased.BattleManager.set('gainRewards', BattleManager.gainRewards);
BattleManager.gainRewards = function()
{
  // Perform original logic.
  J.APT.Aliased.BattleManager.get('gainRewards')
    .call(this);

  // Also gain the APT AP rewards.
  this.gainAptitudeApRewards();
};

/**
 * Performs the AP award for all members of the party after battle.
 */
BattleManager.gainAptitudeApRewards = function()
{
  // Extract the AP that was earned.
  const { aptitudeAp } = this._rewards;

  // If there was no AP, then there is nothing to do.
  if (!aptitudeAp) return;

  // Iterate over each current party member and award AP.
  $gameParty.members()
    .forEach(actor => ApManager.gainAp(actor, aptitudeAp, 'victory'));
};

/**
 * Extends {@link #displayRewards}.<br/>
 * Also displays the AP victory text.
 */
J.APT.Aliased.BattleManager.set('displayRewards', BattleManager.displayRewards);
BattleManager.displayRewards = function()
{
  // Also display AP rewards first.
  this.displayAptitudeAp();

  // Perform original logic.
  J.APT.Aliased.BattleManager.get('displayRewards')
    .call(this);
};

/**
 * Displays the AP victory text in the victory log.
 */
BattleManager.displayAptitudeAp = function()
{
  // Extract the AP that was earned.
  const { aptitudeAp } = this._rewards;

  // If no AP was earned, do not display anything.
  if (!aptitudeAp) return;

  // Define the message to add (tune to taste or i18n).
  const text = `\\. ${aptitudeAp} AP gained`;

  // Add it to the victory log.
  $gameMessage.add(text);
};
//endregion BattleManager