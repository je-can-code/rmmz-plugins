//region MapLogRegistry
import MapLogManager from './MapLogManager.js';

/**
 * The owner of every log channel shown on {@link Scene_Map}.
 *
 * J-Log has always run three separate {@link MapLogManager} instances, because the three feeds
 * genuinely are separate things: combat scrolls fast and matters briefly, dialog is read
 * deliberately, and loot is a long tail worth scrolling back through. Each therefore keeps its own
 * capacity and its own window. That part is instancing done right and is unchanged here.
 *
 * What this class replaces is the bootstrap shape around them. Three top-level `$` globals for one
 * conceptual service meant three `globalThis` writes and three entries in the verify allowlist, and
 * it gave a reader three names to learn where there is only one idea. One owner constructs all
 * three, so `$mapLogs` is the single name to know and the channel is a word in the call rather than
 * a prefix fused onto a manager: `$mapLogs.action.addLog(log)`.
 *
 * The channels are deliberately plain fields rather than accessors. This object owns no state of
 * its own — it is a fixed set of three collaborators, closer to a namespace than to storage — and
 * every caller wants the manager itself in order to talk to it.
 */
class MapLogRegistry
{
  /**
   * The combat feed: damage, healing, states applied, skills used.
   *
   * Capped low and tightest of the three, because combat lines arrive in bursts during a fight and
   * lose their meaning almost immediately after it.
   * @type {MapLogManager}
   */
  action = new MapLogManager();

  /**
   * The conversational feed: chat messages, quest updates, narration.
   *
   * The smallest cap of the three. These lines are meant to be read as they arrive rather than
   * scrolled back through, and a short window keeps the most recent one from being pushed off by
   * combat chatter it has to share screen space with.
   * @type {MapLogManager}
   */
  dialog = new MapLogManager();

  /**
   * The acquisition feed: items picked up, gold gained, drops collected.
   *
   * Capped highest by a wide margin, because this is the one feed a player scrolls back through to
   * answer "did that actually drop?" long after the fight that produced it ended.
   * @type {MapLogManager}
   */
  loot = new MapLogManager();

  /**
   * Initializes the three channels with the capacities that distinguish them.
   */
  constructor()
  {
    // combat lines arrive in bursts and go stale as soon as the fight ends.
    this.action.setMaxLogCount(30);

    // dialog is read as it arrives, so only the most recent handful needs to survive.
    this.dialog.setMaxLogCount(10);

    // loot is the one feed worth scrolling back through, so it keeps a long tail.
    this.loot.setMaxLogCount(100);
  }
}

export default MapLogRegistry;
//endregion MapLogRegistry