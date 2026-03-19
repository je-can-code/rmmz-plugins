//region plugin commands
/**
 * Plugin command for modifying typed AP for all actors.
 */
PluginManager.registerCommand(
  J.APT.EXT.TYPED.Metadata.name,
  'mod-ap-all',
  ({
    points,
    domain,
    id,
  }) =>
  {
    // iterate over all members and gain the AP.
    $gameParty.members()
      .forEach(actor => ApManager.gainTypedAp(
        actor,
        parseInt(points),
        domain.toLowerCase(),
        parseInt(id),
        'plugin-command'));
  }
);

/**
 * Plugin command for modifying typed AP for a specific actor.
 */
PluginManager.registerCommand(
  J.APT.EXT.TYPED.Metadata.name,
  'mod-ap',
  ({
    actorId,
    points,
    domain,
    id,
  }) =>
  {
    // grab the chosen actor.
    const actor = $gameActors.actor(parseInt(actorId));

    // gain the AP.
    ApManager.gainTypedAp(
      actor,
      parseInt(points),
      domain.toLowerCase(),
      parseInt(id),
      'plugin-command');
  }
);
//endregion plugin commands