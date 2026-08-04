//region plugin commands
import JabsBossManager from '../managers/JabsBossManager.js';

/**
 * Begins a boss encounter by name.
 *
 * This is the seam a story event uses when its cutscene ends and the fight begins.
 */
PluginManager.registerCommand(
  J.ABS.EXT.BOSS.Metadata.name,
  'start-encounter',
  args =>
  {
    const { encounterKey } = args;

    JabsBossManager.startEncounter(encounterKey);
  });

/**
 * Ends the active boss encounter.
 *
 * Ending is explicit rather than automatic on defeat, because the fight is not over when the boss
 * reaches zero health- it is over when its death scene finishes.
 */
PluginManager.registerCommand(
  J.ABS.EXT.BOSS.Metadata.name,
  'end-encounter',
  () =>
  {
    JabsBossManager.endEncounter();
  });
//endregion plugin commands