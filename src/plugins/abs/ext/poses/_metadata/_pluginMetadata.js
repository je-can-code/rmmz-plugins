//region plugin metadata
class J_PosesPluginMetadata
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
   *  Extends {@link #postInitialize}.<br>
   *  Includes translation of plugin parameters.
   */
  postInitialize()
  {
    // execute original logic.
    super.postInitialize();

    // ensure the user has the required dependencies.
    // TODO: re-add this after JABS uses plugin metadata as well.
    // this.validateHasJabsAtCorrectVersion();

    // initialize this plugin from configuration.
    this.initializeMetadata();
  }

  /**
   * Initializes the metadata associated with this plugin.
   */
  initializeMetadata()
  {
    /**
     * The id of a switch that represents whether or not this system is accessible in the menu.
     * @type {number}
     */
    this.menuSwitchId = parseInt(this.parsedPluginParameters['menu-switch']);
  }

  /**
   * Determine if JABS is available and the proper version to utilize this poses extension.
   * @return {boolean}
   */
  // validateHasJabsAtCorrectVersion()
  // {
  //   // if we're not connected, then do not.
  //   if (!this.hasJabsConnection())
  //   {
  //     throw new Error('JABS was not found to be registered above this plugin');
  //   }
  //
  //   // if we're not high enough version, then do not.
  //   if (!this.hasMinimumJabsVersion())
  //   {
  //     throw new Error('JABS was found to be registered, but not high enough version for this extension.');
  //   }
  //
  //   // lets do it!
  // }
  //
  // /**
  //  * Checks if the plugin metadata is detected for JABS.
  //  * @return {boolean}
  //  */
  // hasJabsConnection()
  // {
  //   // both plugins are not registered.
  //   if (!PluginMetadata.hasPlugin('J-ABS')) return false;
  //
  //   // both plugins are registered, nice!
  //   return true;
  // }
  //
  // /**
  //  * Checks if the JABS system meets the minimum version requirement for connecting with this crafting system.
  //  * @return {boolean}
  //  */
  // hasMinimumJabsVersion()
  // {
  //   // grab the minimum verison.
  //   const minimumVersion = this.minimumJabsVersion();
  //
  //   // check if we meet the minimum version threshold.
  //   const meetsThreshold = J.SDP.Metadata.version
  //     .satisfiesPluginVersion(minimumVersion);
  //
  //   // if the plugin exists but doesn't meet the threshold, then we're not connecting.
  //   if (!meetsThreshold) return false;
  //
  //   // we're good!
  //   return true;
  // }
  //
  // /**
  //  * Gets the current minimum version of the JABS system that supports this plugin.
  //  * @return {PluginVersion}
  //  */
  // minimumJabsVersion()
  // {
  //   return PluginVersion.builder
  //     .major('2')
  //     .minor('4') // TODO: update JABS to 2.5.0 when this plugin is complete.
  //     .patch('0')
  //     .build();
  // }
}

//endregion plugin metadata