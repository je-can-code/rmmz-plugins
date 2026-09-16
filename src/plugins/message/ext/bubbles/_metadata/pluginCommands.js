//region plugin commands
import SpentBubbleManager from '../managers/SpentBubbleManager.js';

/**
 * Ends the current conversation, clearing every bubble left behind by it.
 *
 * Authored rather than timed on purpose. Only the person writing the scene knows when it is over,
 * and a timeout would have to guess - which would also mean characters could not pace around
 * between their lines without their own dialogue evaporating behind them.
 */
PluginManager.registerCommand(
  J.MESSAGE.EXT.BUBBLES.Metadata.name,
  'end-conversation',
  () =>
  {
    SpentBubbleManager.clear();
  });
//endregion plugin commands