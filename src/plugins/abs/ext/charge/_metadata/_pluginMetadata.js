//region plugin metadata
class J_ChargePluginMetadata
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
   * Extends {@link #postInitialize}.<br/>
   * Maps charging animation and sound defaults from plugin parameters.
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
   * The default charging animation id.
   * 0 will yield no default animation.
   * @type {number}
   */
    this.DefaultChargingAnimationId = parseInt(this.parsedPluginParameters['defaultChargingAnimId']);

    /**
     * The default tier complete animation id.
     * 0 will yield no default animation.
     * @type {number}
     */
    this.DefaultTierCompleteAnimationId = parseInt(this.parsedPluginParameters['defaultTierCompleteAnimId']);

    /**
     * The default fully charged animation id.
     * 0 will yield no default animation.
     * @type {number}
     */
    this.DefaultFullyChargedAnimationId = parseInt(this.parsedPluginParameters['defaultFullyChargedAnimId']);

    /**
     * The sound effect to play when the a charging tier has completed.
     * @type {RPG_SoundEffect}
     */
    this.TierCompleteSE = this.parsedPluginParameters['tierCompleteSE'];

    /**
     * The sound effect to play when the final charge tier has completed charging.
     * @type {RPG_SoundEffect}
     */
    this.ChargeReadySE = this.parsedPluginParameters['chargeReadySE'];

    /**
     * Whether or not to use the charging tier complete sound effect.
     * @type {boolean}
     */
    this.UseTierCompleteSE = this.parsedPluginParameters['useDefaultChargingSE'] === "true";

    /**
     * Whether or not to use the charging tier complete sound effect when there is an animation present.
     * @type {boolean}
     */
    this.AllowTierCompleteSEandAnimation = this.parsedPluginParameters['allowTierCompleteSEandAnim'] === "true";
  }
}

export default J_ChargePluginMetadata;
//endregion plugin metadata