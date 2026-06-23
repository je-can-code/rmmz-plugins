//region plugin metadata
class JHudInput_PluginMetadata extends PluginMetadata
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
   * Extends {@link PluginMetadata.postInitialize}.<br/>
   * Reads plugin parameters and stores them as typed metadata properties.
   */
  postInitialize()
  {
    // read the cooldown overlay icon index; default to 90 if unset.
    this.CooldownOverlayIconIndex = Number(this.parsedPluginParameters['cooldownOverlayIconIndex']) || 90;
  }
}

export default JHudInput_PluginMetadata;
//endregion plugin metadata