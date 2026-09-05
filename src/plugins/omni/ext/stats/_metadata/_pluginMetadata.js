//region plugin metadata
/**
 * Plugin metadata for J-OMNI-Stats.
 *
 * The Statistopedia has no tunable behavior- it reports numbers other systems already record. What
 * it does need is the same two things every Omnipedia entry needs: how its row presents itself in
 * the root list, and the switch deciding whether that row is there at all.
 */
class J_OmniStats_PluginMetadata
  extends PluginMetadata
{
  /**
   * Constructor.
   * @param {string} name The plugin name.
   * @param {string} version The plugin version.
   */
  constructor(name, version)
  {
    super(name, version);
  }

  /**
   * Extends {@link #postInitialize}.<br/>
   * Maps the static command and switch metadata used by the statistopedia entry.
   */
  postInitialize()
  {
    // perform original logic.
    super.postInitialize();

    this.initializeMetadata();
  }

  /**
   * Initializes the metadata associated with this plugin.
   */
  initializeMetadata()
  {
    /**
     * The various data points that define the command for the Statistopedia.
     *
     * The icon is a figure beside two graph traces, chosen out of the same green system-plate family
     * the Questopedia takes its checklist from- the pedias reading as one set in the root list matters
     * more than any one of them having the most literal icon available.
     */
    this.Command = {
      Name: 'Statistopedia',
      Symbol: 'stats-pedia',
      IconIndex: 2563,
    };

    /**
     * The id of the switch representing whether or not the command should be visible in the
     * Omnipedia menu.
     *
     * A player who has not fought anything yet would open the Statistopedia to a wall of zeroes,
     * which reads as a broken menu rather than an empty one- so the row is gated the same way every
     * other pedia is, and the game turns it on when there is something in it worth reading.
     * @type {number}
     */
    this.EnabledSwitch = 111;
  }
}

export default J_OmniStats_PluginMetadata;
//endregion plugin metadata