//region plugin metadata
/**
 * Plugin metadata for J-Message-Chatter.
 *
 * Deliberately empty of parameters. Every knob chatter has - how far an NPC is heard, how long they
 * wait, how long they are on screen - is something a single excitable child and a single bored
 * merchant need different answers to, and the plugin manager holds exactly one answer per project.
 * The defaults live in the `chatter` section of `data/config.message.json`, where they can be
 * overridden per event by a comment tag on the page.
 */
class J_MessageChatterPluginMetadata
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

export default J_MessageChatterPluginMetadata;
//endregion plugin metadata