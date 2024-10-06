//region BattleManager
/**
 * Extends {@link #makeRewards}.<br>
 * Also includes the SDP points earned.
 */
J.SDP.Aliased.BattleManager.set('makeRewards', BattleManager.makeRewards);
BattleManager.makeRewards = function()
{
  // perform original logic.
  J.SDP.Aliased.BattleManager.get('makeRewards')
    .call(this);

  // extend the rewards to include SDP points.
  this._rewards = {
    ...this._rewards, sdp: $gameTroop.sdpTotal(),
  };
};

/**
 * Extends {@link #gainRewards}.<br>
 * Also gain the SDP points earned.
 */
J.SDP.Aliased.BattleManager.set('gainRewards', BattleManager.gainRewards);
BattleManager.gainRewards = function()
{
  // perform original logic.
  J.SDP.Aliased.BattleManager.get('gainRewards')
    .call(this);

  // also gain the SDP rewards.
  this.gainSdpPoints();
};

/**
 * Performs a gain of the SDP points for all members of the party after battle.
 */
BattleManager.gainSdpPoints = function()
{
  // extract the SDP points earned.
  const { sdp } = this._rewards;

  // iterate over each member and add the points.
  $gameParty.members()
    .forEach(member => member.modSdpPoints(sdp));
};

/**
 * Extends {@link #displayRewards}.<br>
 * Also displays the SDP victory text.
 */
J.SDP.Aliased.BattleManager.set('displayRewards', BattleManager.displayRewards);
BattleManager.displayRewards = function()
{
  // also display SDP rewards.
  this.displaySdp();

  // perform original logic.
  J.SDP.Aliased.BattleManager.get('displayRewards')
    .call(this);
};

/**
 * Displays the SDP victory text in the victory log.
 */
BattleManager.displaySdp = function()
{
  // extract the SDP points earned.
  const { sdp } = this._rewards;

  // if there were no SDP rewards, don't display anything.
  if (sdp <= 0) return;

  // define the message to add.
  const text = `\\. ${sdp} ${J.SDP.Metadata.victoryText}`;

  // and add it to the log.
  $gameMessage.add(text);
};
//endregion BattleManager