//region plugin metadata
class J_CmsMain_PluginMetadata extends PluginMetadata
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
   * Includes translation of plugin parameters.
   */
  postInitialize()
  {
    // execute original logic.
    super.postInitialize();

    // initialize this plugin from configuration.
    this.initializeMetadata();
  }

  /**
   * Initializes the metadata associated with this plugin.
   */
  initializeMetadata()
  {
    /**
     * A map of the engine's own menu command symbols to their configured descriptions.
     *
     * Only the engine's commands live here. Commands contributed by other plugins carry their own
     * descriptions, supplied wherever that plugin builds its command- this plugin has no business
     * knowing they exist, let alone what they do.
     * @type {Map<string, string>}
     */
    this.commandHelpText = new Map([
      [ 'item', this.parsedPluginParameters['help-item'] ?? String.empty ],
      [ 'skill', this.parsedPluginParameters['help-skill'] ?? String.empty ],
      [ 'equip', this.parsedPluginParameters['help-equip'] ?? String.empty ],
      [ 'status', this.parsedPluginParameters['help-status'] ?? String.empty ],
      [ 'options', this.parsedPluginParameters['help-options'] ?? String.empty ],
      [ 'save', this.parsedPluginParameters['help-save'] ?? String.empty ],
      [ 'gameEnd', this.parsedPluginParameters['help-gameEnd'] ?? String.empty ],
      [ 'formation', this.parsedPluginParameters['help-formation'] ?? String.empty ],
    ]);
  }

  /**
   * Gets the configured description for one of the engine's menu commands.
   * @param {string} symbol The symbol of the command being described.
   * @returns {string} The description, or {@link String.empty} if this is not an engine command.
   */
  helpTextFor(symbol)
  {
    return this.commandHelpText.get(symbol) ?? String.empty;
  }
}

export default J_CmsMain_PluginMetadata;
//endregion plugin metadata
