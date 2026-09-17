//region plugin commands
import SpentBubbleManager from '../managers/SpentBubbleManager.js';

/**
 * Ends the current conversation early, clearing every bubble left behind by it.
 *
 * A conversation already ends on its own the moment the player has control back, which covers every
 * ordinary scene without anything being written into it. This is for the ones where the talking
 * finishes well before the event does - a long cutscene that keeps moving people around afterwards,
 * where leaving the last line hanging over somebody's head for another minute would read as stuck.
 */
PluginManager.registerCommand(
  J.MESSAGE.EXT.BUBBLES.Metadata.name,
  'end-conversation',
  () =>
  {
    SpentBubbleManager.clear();
  });
//endregion plugin commands