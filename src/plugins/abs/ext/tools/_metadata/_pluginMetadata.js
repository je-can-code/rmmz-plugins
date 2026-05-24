//region plugin metadata
class J_ToolsPluginMetadata
  extends PluginMetadata
{
  /**
   * Constructor.
   */
  constructor(name, version)
  {
    super(name, version);
  }

  /**
   * Extends {@link #postInitialize}.<br>
   * Maps gap-close and grab/throw defaults from plugin parameters.
   */
  postInitialize()
  {
    super.postInitialize();

    this.initializeMetadata();
  }

  /**
   * Initializes the metadata associated with this plugin.
   */
  initializeMetadata()
  {
    /**
     * The behavior for whether or not the player can gap close to anything they hit, or if they
     * can only gap close to targets bearing the "gap close target" tag.
     */
    this.CanGapCloseByDefault = this.parsedPluginParameters['canGapCloseByDefault'] === 'true';

    /**
     * Whether or not grab and throw functionality is enabled globally by default.
     * @type {boolean}
     */
    this.GrabThrowEnabled = this.parsedPluginParameters['grabThrowEnabled'] !== 'false';

    /**
     * Whether or not the throw direction is always fixed regardless of input.
     * @type {boolean}
     */
    this.DirectionFixAlways = this.parsedPluginParameters['directionFixAlways'] === 'true';
  }
}

export default J_ToolsPluginMetadata;
//endregion plugin metadata