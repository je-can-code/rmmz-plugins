//region plugin commands
import ApManager from '../managers/ApManager.js';

/**
 * Plugin command for modifying AP for all actors.
 */
PluginManager.registerCommand(
  J.APT.Metadata.name,
  'mod-ap-all',
  ({ points }) =>
  {
    // iterate over all members and gain the AP.
    $gameParty.members()
      .forEach(actor => ApManager.gainAp(actor, parseInt(points), 'plugin-command'));
  }
);

/**
 * Plugin command for modifying AP for a specific actor.
 */
PluginManager.registerCommand(
  J.APT.Metadata.name,
  'mod-ap',
  ({
    actorId,
    points
  }) =>
  {
    // grab the chosen actor.
    const actor = $gameActors.actor(parseInt(actorId));

    // gain the AP.
    ApManager.gainAp(actor, parseInt(points), 'plugin-command');
  }
);
//endregion plugin commands