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

    /**
     * When true, {@link JABS_PopupManager.showSkillUsedPop} returns early.
     * @type {boolean}
     */
    this.disableSkillUsedPopups = params['disableSkillUsedPopups'] === 'true';

    /**
     * Parsed merge toggles and idle flush tuning for {@link JABS_PopupMergeController}.
     * @type {{
     *   enableCombat: boolean,
     *   enableSlip: boolean,
     *   enableRewards: boolean,
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

    const damageOutlineWidth = Number(params['damageOutlineWidth'] ?? 2);
    const healingOutlineWidth = Number(params['healingOutlineWidth'] ?? 4);

    /**
     * Outline width for harm HP/MP/TP combat map pops.
     * @type {number}
     */
    this.damageOutlineWidth = Number.isFinite(damageOutlineWidth) && damageOutlineWidth >= 0
      ? damageOutlineWidth
      : 2;

    /**
     * Outline width for heal HP/MP/TP combat map pops.
     * @type {number}
     */
    this.healingOutlineWidth = Number.isFinite(healingOutlineWidth) && healingOutlineWidth >= 0
      ? healingOutlineWidth
      : 4;
  }
}

export default J_PopupsAbs_PluginMetadata;
//endregion plugin metadata