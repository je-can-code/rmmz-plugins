//region plugin metadata
/**
 * Plugin metadata for J-Message-Bubbles.
 *
 * Deliberately empty of parameters. Everything an author would want to tune about a bubble - its
 * shape, its colours, how far above a speaker's head it floats - varies per speaker rather than per
 * game, so it belongs in the same `data/config.message.json` the speaker profiles already come from
 * rather than in the plugin manager, where there is exactly one of each value for the whole project.
 */
class J_MessageBubblesPluginMetadata
  extends PluginMetadata
{
  /**
   * Constructor.
   * @param {string} name The name of this plugin.
   * @param {string} version The version of this plugin.
   */
  constructor(name, version)
  {
    super(name, version);
  }
}

export default J_MessageBubblesPluginMetadata;
//endregion plugin metadata