//region plugin metadata
/**
 * Plugin metadata for J-Motion-Passive.
 *
 * There is nothing to configure. What this plugin does is add one more place to look for the
 * `<motion:...>` tag, and which passives a battler is carrying is already J-Passive's own answer.
 */
class JMotionPassive_PluginMetadata
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

export default JMotionPassive_PluginMetadata;
//endregion plugin metadata