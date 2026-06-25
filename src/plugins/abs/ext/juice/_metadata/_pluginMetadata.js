//region plugin metadata
class JAbsJuice_PluginMetadata
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
   * Loads the juice block from the external JABS config.
   */
  postInitialize()
  {
    // execute original logic.
    super.postInitialize();

    // initialize this plugin from external configuration.
    this.initializeMetadata();
  }

  /**
   * Initializes the metadata associated with this plugin by reading the `juice` block from `config.jabs.json`.
   * The JMZ data editor guarantees all fields are present and numeric; no shape validation is needed here.
   */
  initializeMetadata()
  {
    // J-ABS guarantees the parsed root is on its metadata by the time extensions postInitialize() (orderAfter).
    const { target, caster, casting, profiles } = J.ABS.Metadata.ExternalConfig.juice;

    /**
     * Target squish intensity scale for physical impacts (dimensionless scale delta).
     * @type {number}
     */
    this.targetPhysicalSquishIntensity = target.physicalSquishIntensity;

    /**
     * Target squish intensity scale for magical impacts.
     * @type {number}
     */
    this.targetMagicalSquishIntensity = target.magicalSquishIntensity;

    /**
     * Frames to spend easing the target squish envelope.
     * @type {number}
     */
    this.targetSquishFrames = Math.trunc(target.squishFrames);

    /**
     * Scalar applied to recipient squish when the incoming action is healing.
     * @type {number}
     */
    this.healingRecipientSquishScale = target.healingRecipientScale;

    /**
     * Percent (0–100) describing how strongly repeated hits decay juice amplitude within the flurry window.
     * @type {number}
     */
    this.flurryDecayPercent = Math.trunc(target.flurryDecayPercent);

    /**
     * Dodge-only caster squish intensity (cooldown key matches dodge skill).
     * @type {number}
     */
    this.dodgeSquishIntensity = caster.dodgeSquishIntensity;

    /**
     * Frames for dodge squish easing.
     * @type {number}
     */
    this.dodgeSquishFrames = Math.trunc(caster.dodgeSquishFrames);

    /**
     * Support/healing caster pulse intensity.
     * @type {number}
     */
    this.supportCasterPulseIntensity = caster.supportPulseIntensity;

    /**
     * Frames for support caster easing.
     * @type {number}
     */
    this.supportCasterPulseFrames = Math.trunc(caster.supportPulseFrames);

    /**
     * Peak body tilt (radians) applied to strikers at execution time (before style multipliers).
     * @type {number}
     */
    this.casterStrikeTiltRadians = caster.strikeTiltRadians;

    /**
     * Frames spent tilting the striker.
     * @type {number}
     */
    this.casterStrikeTiltFrames = Math.trunc(caster.strikeTiltFrames);

    /**
     * Peak weapon-overlay swing rotation (radians) before style multipliers.
     * @type {number}
     */
    this.weaponSwingPeakRadians = caster.weaponSwingPeakRadians;

    /**
     * Frames for the weapon swing overlay arc.
     * @type {number}
     */
    this.weaponSwingFrames = Math.trunc(caster.weaponSwingFrames);

    /**
     * Extra downward shift for IconSet juice overlays (pixels; positive moves toward feet).
     * @type {number}
     */
    this.spriteJuiceVerticalOffsetPixels = Math.trunc(caster.spriteVerticalOffsetPixels);

    /**
     * Body squish intensity when no weapon icon overlay plays (unarmed / enemies without icons).
     * @type {number}
     */
    this.unarmedStrikeSquishIntensity = caster.unarmedStrikeSquishIntensity;

    /**
     * Frames for unarmed strike easing.
     * @type {number}
     */
    this.unarmedStrikeSquishFrames = Math.trunc(caster.unarmedStrikeSquishFrames);

    /**
     * Casting pulse amplitude while {@link JABS_Battler.isCasting} remains true.
     * @type {number}
     */
    this.castingPulseAmplitude = casting.pulseAmplitude;

    /**
     * Named multiplier buckets keyed by weapon style tag (parsed `juice.profiles` map).
     * `default` is guaranteed to exist by the editor.
     * @type {Object<string, { tiltMul: number, swingMul: number }>}
     */
    this.weaponStyleMultipliers = Object.fromEntries(
      Object.keys(profiles).map(key => [ key, { tiltMul: profiles[key].tiltMul, swingMul: profiles[key].swingMul } ])
    );
  }
}

export default JAbsJuice_PluginMetadata;
//endregion plugin metadata