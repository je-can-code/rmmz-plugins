//region plugin commands
/**
 * Plugin command for calling the SDP scene/menu.
 */
PluginManager.registerCommand(J.SDP.Metadata.name, "Call SDP Menu", () =>
{
  Scene_SDP.callScene();
});

/**
 * Plugin command for unlocking a SDP to be leveled.
 */
PluginManager.registerCommand(J.SDP.Metadata.name, "Unlock SDP", args =>
{
  const { keys } = args;
  const panelKeys = JSON.parse(keys);
  panelKeys.forEach(key => $gameParty.unlockSdp(key));
});

/**
 * Plugin command for locking a SDP to no longer be available for the player.
 */
PluginManager.registerCommand(J.SDP.Metadata.name, "Lock SDP", args =>
{
  const { keys } = args;
  const panelKeys = JSON.parse(keys);
  panelKeys.forEach(key => $gameParty.lockSdp(key));
});

/**
 * Plugin command for modifying an actor's SDP points.
 */
PluginManager.registerCommand(J.SDP.Metadata.name, "Modify SDP points", args =>
{
  const { actorId, sdpPoints } = args;
  const parsedActorId = parseInt(actorId);
  const parsedSdpPoints = parseInt(sdpPoints);
  $gameActors
    .actor(parsedActorId)
    .modSdpPoints(parsedSdpPoints);
});

/**
 * Plugin command for modifying all current party members' SDP points.
 */
PluginManager.registerCommand(J.SDP.Metadata.name, "Modify party SDP points", args =>
{
  const { sdpPoints } = args;
  const parsedSdpPoints = parseInt(sdpPoints);
  $gameParty.members()
    .forEach(member => member.modSdpPoints(parsedSdpPoints));
});
//endregion plugin commands