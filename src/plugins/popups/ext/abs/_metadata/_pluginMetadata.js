//region plugin metadata
/**
 * Plugin metadata for J-Popups-ABS.
 */
class J_PopupsAbs_PluginMetadata
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
   * Maps merge toggles and skill-used popup policy from plugin parameters.
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
    const params = this.parsedPluginParameters;

    // policy step inside initialize metadata.
    /**
     * When true, {@link JABS_PopupManager.showSkillUsedPop} returns early.
     * @type {boolean}
     // policy step inside initialize metadata.
     */
    this.disableSkillUsedPopups = params['disableSkillUsedPopups'] === 'true';

    // policy step inside initialize metadata.
    /**
     * Parsed merge toggles and idle flush tuning for {@link JABS_PopupMergeController}.
     * @type {{
     // policy step inside initialize metadata.
     *   enableCombat: boolean,
     *   enableSlip: boolean,
     *   enableRewards: boolean,
     // policy step inside initialize metadata.
     *   enableMitigation: boolean,
     *   idleFlushFrames: number,
     * }}
     */
    this.mergeParams = {
      enableCombat: params['enableMergeCombat'] !== 'false',
      enableSlip: params['enableMergeSlip'] !== 'false',
      enableRewards: params['enableMergeRewards'] !== 'false',
      enableMitigation: params['enableMergeMitigation'] !== 'false',
      idleFlushFrames: Number(params['mergeIdleFlushFrames'] ?? 90),
    };
  }
}

export default J_PopupsAbs_PluginMetadata;
//endregion plugin metadata