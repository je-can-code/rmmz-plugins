//region plugin metadata
import {
  jabsJuiceRequireBlock,
  jabsJuiceRequireFloat,
  jabsJuiceRequireInt,
  jabsJuiceRequireProfiles,
} from './juiceConfigValidation.js';

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
   *  Extends {@link #postInitialize}.<br>
   *  Loads the juice block from the external JABS config.
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
   * Throws if the block (or any required sub-key) is missing — this is intentional and documented in the plugin
   * help. Disabling juice is "remove the plugin from the manifest", not "leave the block out".
   */
  initializeMetadata()
  {
    // J-ABS guarantees the parsed root is on its metadata by the time extensions postInitialize() (orderAfter).
    const juice = jabsJuiceRequireBlock(J.ABS.Metadata.ExternalConfig);

    const { target, caster, casting } = juice;

    /**
     * Target squish intensity scale for physical impacts (dimensionless scale delta).
     * @type {number}
     */
    this.targetPhysicalSquishIntensity = jabsJuiceRequireFloat(
      target.physicalSquishIntensity,
      'juice.target.physicalSquishIntensity'
    );

    /**
     * Target squish intensity scale for magical impacts.
     * @type {number}
     */
    this.targetMagicalSquishIntensity = jabsJuiceRequireFloat(
      target.magicalSquishIntensity,
      'juice.target.magicalSquishIntensity'
    );

    /**
     * Frames to spend easing the target squish envelope.
     * @type {number}
     */
    this.targetSquishFrames = jabsJuiceRequireInt(target.squishFrames, 'juice.target.squishFrames');

    /**
     * Scalar applied to recipient squish when the incoming action is healing.
     * @type {number}
     */
    this.healingRecipientSquishScale = jabsJuiceRequireFloat(
      target.healingRecipientScale,
      'juice.target.healingRecipientScale'
    );

    /**
     * Percent (0–100) describing how strongly repeated hits decay juice amplitude within the flurry window.
     * @type {number}
     */
    this.flurryDecayPercent = jabsJuiceRequireInt(target.flurryDecayPercent, 'juice.target.flurryDecayPercent');

    /**
     * Dodge-only caster squish intensity (cooldown key matches dodge skill).
     * @type {number}
     */
    this.dodgeSquishIntensity = jabsJuiceRequireFloat(caster.dodgeSquishIntensity, 'juice.caster.dodgeSquishIntensity');

    /**
     * Frames for dodge squish easing.
     * @type {number}
     */
    this.dodgeSquishFrames = jabsJuiceRequireInt(caster.dodgeSquishFrames, 'juice.caster.dodgeSquishFrames');

    /**
     * Support/healing caster pulse intensity.
     * @type {number}
     */
    this.supportCasterPulseIntensity = jabsJuiceRequireFloat(
      caster.supportPulseIntensity,
      'juice.caster.supportPulseIntensity'
    );

    /**
     * Frames for support caster easing.
     * @type {number}
     */
    this.supportCasterPulseFrames = jabsJuiceRequireInt(
      caster.supportPulseFrames,
      'juice.caster.supportPulseFrames'
    );

    /**
     * Peak body tilt (radians) applied to strikers at execution time (before style multipliers).
     * @type {number}
     */
    this.casterStrikeTiltRadians = jabsJuiceRequireFloat(caster.strikeTiltRadians, 'juice.caster.strikeTiltRadians');

    /**
     * Frames spent tilting the striker.
     * @type {number}
     */
    this.casterStrikeTiltFrames = jabsJuiceRequireInt(caster.strikeTiltFrames, 'juice.caster.strikeTiltFrames');

    /**
     * Peak weapon-overlay swing rotation (radians) before style multipliers.
     * @type {number}
     */
    this.weaponSwingPeakRadians = jabsJuiceRequireFloat(
      caster.weaponSwingPeakRadians,
      'juice.caster.weaponSwingPeakRadians'
    );

    /**
     * Frames for the weapon swing overlay arc.
     * @type {number}
     */
    this.weaponSwingFrames = jabsJuiceRequireInt(caster.weaponSwingFrames, 'juice.caster.weaponSwingFrames');

    /**
     * Extra downward shift for IconSet juice overlays (pixels; positive moves toward feet).
     * @type {number}
     */
    this.spriteJuiceVerticalOffsetPixels = jabsJuiceRequireInt(
      caster.spriteVerticalOffsetPixels,
      'juice.caster.spriteVerticalOffsetPixels'
    );

    /**
     * Body squish intensity when no weapon icon overlay plays (unarmed / enemies without icons).
     * @type {number}
     */
    this.unarmedStrikeSquishIntensity = jabsJuiceRequireFloat(
      caster.unarmedStrikeSquishIntensity,
      'juice.caster.unarmedStrikeSquishIntensity'
    );

    /**
     * Frames for unarmed strike easing.
     * @type {number}
     */
    this.unarmedStrikeSquishFrames = jabsJuiceRequireInt(
      caster.unarmedStrikeSquishFrames,
      'juice.caster.unarmedStrikeSquishFrames'
    );

    /**
     * Casting pulse amplitude while {@link JABS_Battler.isCasting} remains true.
     * @type {number}
     */
    this.castingPulseAmplitude = jabsJuiceRequireFloat(casting.pulseAmplitude, 'juice.casting.pulseAmplitude');

    /**
     * Named multiplier buckets keyed by skill tags or weapon type ids (parsed `juice.profiles` map).
     * `default` is guaranteed to exist (validator throws if not).
     * @type {Object<string, { tiltMul: number, swingMul: number }>}
     */
    this.weaponStyleMultipliers = jabsJuiceRequireProfiles(juice.profiles);
  }
}

export default JAbsJuice_PluginMetadata;
//endregion plugin metadata