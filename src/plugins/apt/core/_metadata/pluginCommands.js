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

/**
 * Plugin command for re-syncing persisted aptitude requiredAp values against
 * current notetags, for all party members.
 */
PluginManager.registerCommand(
  J.APT.Metadata.name,
  'refresh-required-ap-all',
  () =>
  {
    // iterate over all members and refresh their persisted requirements.
    $gameParty.members()
      .forEach(actor => ApManager.refreshRequiredAp(actor));
  }
);

/**
 * Plugin command for re-syncing persisted aptitude requiredAp values against
 * current notetags, for a specific actor.
 */
PluginManager.registerCommand(
  J.APT.Metadata.name,
  'refresh-required-ap',
  ({ actorId }) =>
  {
    // grab the chosen actor.
    const actor = $gameActors.actor(parseInt(actorId));

    // refresh their persisted requirements.
    ApManager.refreshRequiredAp(actor);
  }
);
//endregion plugin commands