//region JABS_Engine
/**
 * Extends {@link #onSdpRewardGranted}.<br/>
 * Also shows an SDP-points popup on the character.
 */
J.POPUPS.EXT.SDP.Aliased.JABS_Engine.set('onSdpRewardGranted', JABS_Engine.prototype.onSdpRewardGranted);
JABS_Engine.prototype.onSdpRewardGranted = function(sdpPoints, character)
{
  // perform original logic.
  J.POPUPS.EXT.SDP.Aliased.JABS_Engine.get('onSdpRewardGranted')
    .call(this, sdpPoints, character);

  // construct pop for the next step in this routine.
  const pop = new TextPopBuilder(sdpPoints)
    .isSdpPoints()
    .build();

  JABS_PopupMergeController.routeRewardPop(pop, character, {
    rewardType: Map_TextPop.Types.Sdp,
    amount: sdpPoints,
  });
};

/**
 * Extends {@link #onSdpPanelUnlocked}.<br/>
 * Also shows an SDP-unlock popup on the character.
 */
J.POPUPS.EXT.SDP.Aliased.JABS_Engine.set('onSdpPanelUnlocked', JABS_Engine.prototype.onSdpPanelUnlocked);
JABS_Engine.prototype.onSdpPanelUnlocked = function(sdpKey, character)
{
  // perform original logic.
  J.POPUPS.EXT.SDP.Aliased.JABS_Engine.get('onSdpPanelUnlocked')
    .call(this, sdpKey, character);

  const sdp = J.SDP.Metadata.panelsMap.get(sdpKey);
  const pop = new TextPopBuilder(sdp.name)
    .isSdpPoints()
    .build();

  TextPopManager.show(pop, character);
};
//endregion JABS_Engine