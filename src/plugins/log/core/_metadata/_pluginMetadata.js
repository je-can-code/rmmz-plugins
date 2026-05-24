//region plugin metadata
class J_LogPluginMetadata extends PluginMetadata
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
   * Maps plugin parameters into instance fields used by map log windows.
   */
  postInitialize()
  {
    super.postInitialize();

    /**
     * Frames of inactivity before the log window fades.
     * @type {number}
     */
    this.InactivityTimerDuration = Number(this.parsedPluginParameters['defaultInactivityTime']);
  }
}

export default J_LogPluginMetadata;
//endregion plugin metadata