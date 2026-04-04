//region J_POPSDP_Engine

//region JABS_Engine aliases
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

  const pop = new TextPopBuilder(sdpPoints)
    .isSdpPoints()
    .build();

  character.addTextPop(pop);
  character.requestTextPop();
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

  character.addTextPop(pop);
  character.requestTextPop();
};
//endregion JABS_Engine aliases

//endregion J_POPSDP_Engine
