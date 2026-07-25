//region Plugin Command Registration
/**
 * Plugin command for activating content level sync at a specified level.
 */
PluginManager.registerCommand(J.LEVEL.EXT.SYNC.Metadata.name, 'setContentSync', args =>
{
  // parse the sync level from the command arguments.
  const level = parseInt(args.level);

  // parse the uplevel flag from the command arguments.
  const uplevel = args.uplevel === 'true';

  // activate the content sync session.
  $gameSystem.setContentSyncSession(level, uplevel);

  // refresh all party members so stats and HUD reflect the change immediately.
  $gameParty.members().forEach(actor =>
  {
    // refresh parameter buffs if J-Natural is loaded.
    if (J.NATURAL) actor.refreshAllParameterBuffs();

    // notify the actor that battler data has changed.
    actor.onBattlerDataChange();
  });
});

/**
 * Plugin command for deactivating the active content sync session.
 */
PluginManager.registerCommand(J.LEVEL.EXT.SYNC.Metadata.name, 'clearContentSync', () =>
{
  // deactivate the content sync session.
  $gameSystem.clearContentSyncSession();

  // refresh all party members so stats and HUD restore to real levels immediately.
  $gameParty.members().forEach(actor =>
  {
    // refresh parameter buffs if J-Natural is loaded.
    if (J.NATURAL) actor.refreshAllParameterBuffs();

    // notify the actor that battler data has changed.
    actor.onBattlerDataChange();
  });
});
//endregion Plugin Command Registration
