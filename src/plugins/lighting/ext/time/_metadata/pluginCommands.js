//region plugin commands
import TimeLightingCoordinator from '../managers/TimeLightingCoordinator.js';

/**
 * Lets the sky resume following the clock.
 */
PluginManager.registerCommand(J.LIGHTING.EXT.TIME.Metadata.name, 'unlockTone', () =>
{
  TimeLightingCoordinator.unlock($gameTime);
});

/**
 * Freezes the sky wherever it currently is.
 */
PluginManager.registerCommand(J.LIGHTING.EXT.TIME.Metadata.name, 'lockTone', () =>
{
  TimeLightingCoordinator.lock($gameTime);
});
//endregion plugin commands