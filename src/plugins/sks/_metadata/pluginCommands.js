//region plugin commands
/**
 * Plugin command for modifying slot points for all current party members.
 */
PluginManager.registerCommand(
  J.SKS.Metadata.name,
  'mod-slot-points-party',
  args =>
  {
    // parse the number of slot points to modify from the command args.
    const parsedPoints = parseInt(args.points);

    // apply the modification to every current party member.
    $gameParty.members().forEach(member =>
    {
      // modify this member's maximum slot points by the parsed amount.
      member.modifyMaxSlotPoints(parsedPoints);
    });
  });
//endregion plugin commands