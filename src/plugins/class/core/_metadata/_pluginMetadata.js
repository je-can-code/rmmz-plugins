//region plugin metadata
/**
 * The metadata for J-Classes: the main menu command, and the one switch that can open class changing
 * up to the menu.
 */
class J_ClassPluginMetadata
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

  /**
   * Extends {@link #postInitialize}.<br>
   * Includes translation of plugin parameters.
   */
  postInitialize()
  {
    // perform original logic.
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
     * The id of a switch that represents whether or not the class command is visible in the menu.
     * An id of zero means the command is always available.
     * @type {number}
     */
    this.menuSwitchId = J.BASE.Helpers.parsePluginInt(this.parsedPluginParameters['menu-switch'], 0);

    /**
     * The id of a switch that lets the menu command change classes, not only view them.
     * An id of zero means the menu only ever views, and changing classes is left entirely to events.
     * @type {number}
     */
    this.menuChangeSwitchId = J.BASE.Helpers.parsePluginInt(this.parsedPluginParameters['menu-change-switch'], 0);

    /**
     * The name the class command carries in the menu.
     * @type {string}
     */
    this.commandName = this.parsedPluginParameters['command-name'] ?? 'Classes';

    /**
     * The icon the class command carries in the menu.
     * @type {number}
     */
    this.commandIconIndex = J.BASE.Helpers.parsePluginInt(this.parsedPluginParameters['command-icon'], 0);

    /**
     * The icon drawn beside every class in the class list.
     * Classes carry no icon of their own in the database, so one is shared by all of them.
     * @type {number}
     */
    this.classIconIndex = J.BASE.Helpers.parsePluginInt(this.parsedPluginParameters['class-icon'], 0);
  }
}

export default J_ClassPluginMetadata;
//endregion plugin metadata