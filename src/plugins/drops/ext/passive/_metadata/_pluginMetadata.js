//region plugin metadata
/**
 * Plugin metadata for J-Drops-Passive.
 *
 * This plugin has nothing to configure: what it does is add two more places to look for the
 * `<drops:[...]>` tag, and which states are on a battler is already the game's own answer.
 */
class JDropsPassive_PluginMetadata
  extends PluginMetadata
{
  /**
   * Constructor.
   * @param {string} name The name of this plugin.
   * @param {string} version The semver-formatted version of this plugin.
   */
  constructor(name, version)
  {
    super(name, version);
  }
}

export default JDropsPassive_PluginMetadata;
//endregion plugin metadata