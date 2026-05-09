//region plugin metadata
/**
 * Parses a finite floating-point plugin parameter with fallback semantics.
 * Lives outside {@link JAbsJuice_PluginMetadata} so it is safe while {@link PluginMetadata#initializePlugin}
 * runs {@link JAbsJuice_PluginMetadata#postInitialize} during {@code super()} (subclass private slots are not
 * usable yet).
 *
 * @param {string|number|undefined|null} raw Raw plugin parameter value.
 * @param {number} fallback Used when empty or non-finite.
 * @returns {number}
 */
function jabsJuiceParsePluginFloat(raw, fallback)
{
  if (raw === undefined || raw === null || raw === String.empty)
  {
    return fallback;
  }

  const parsed = Number.parseFloat(String(raw));

  if (Number.isFinite(parsed))
  {
    return parsed;
  }

  return fallback;
}

/**
 * Normalizes a weapon-style multiplier row pulled from JSON configuration.
 *
 * @param {*} row Unknown JSON row content.
 * @returns {{ tiltMul: number, swingMul: number }}
 */
function jabsJuiceNormalizeStyleRow(row)
{
  let tiltMul = 1;
  let swingMul = 1;

  if (row !== undefined && row !== null && typeof row === 'object')
  {
    tiltMul = jabsJuiceParsePluginFloat(row.tiltMul, tiltMul);
    swingMul = jabsJuiceParsePluginFloat(row.swingMul, swingMul);
  }

  return { tiltMul, swingMul };
}

/**
 * Builds the weapon-style multiplier lookup table from defaults plus optional JSON text.
 *
 * @param {string} pluginName Plugin filename stem for log attribution.
 * @param {any} parsedPluginParameters Parsed plugin.json parameters object.
 * @returns {Object<string, { tiltMul: number, swingMul: number }>}
 */
function jabsJuiceParseWeaponStyleMultipliers(pluginName, parsedPluginParameters)
{
  /**
   * Baseline row used when a skill style key is missing from user JSON.
   * @type {Object<string, { tiltMul: number, swingMul: number }>}
   */
  const table = {
    default: { tiltMul: 1, swingMul: 1 },
  };

  const raw = parsedPluginParameters['weapon-style-multipliers'];

  if (raw === undefined || raw === null)
  {
    return table;
  }

  const text = String(raw).trim();

  if (text === String.empty)
  {
    return table;
  }

  let parsed;

  try
  {
    parsed = JSON.parse(text);
  }
  catch (err)
  {
    console.warn(`[${pluginName}] Failed to parse weapon-style-multipliers JSON; using defaults.`, err);
    return table;
  }

  if (parsed === undefined || parsed === null || typeof parsed !== 'object')
  {
    return table;
  }

  const keys = Object.keys(parsed);

  for (let i = 0; i < keys.length; i++)
  {
    const key = keys[i];
    table[key] = jabsJuiceNormalizeStyleRow(parsed[key]);
  }

  if (!table.default)
  {
    table.default = { tiltMul: 1, swingMul: 1 };
  }

  return table;
}

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
   *  Includes translation of plugin parameters.
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
    const p = this.parsedPluginParameters;

    /**
     * Master enable switch for juice when non-zero (0 keeps the system always active).
     * @type {number}
     */
    this.menuSwitchId = J.BASE.Helpers.parsePluginInt(p['menu-switch'], 0);

    /**
     * Target squish intensity scale for physical impacts (dimensionless scale delta).
     * @type {number}
     */
    this.targetPhysicalSquishIntensity = jabsJuiceParsePluginFloat(p['target-physical-squish-intensity'], 0.12);

    /**
     * Target squish intensity scale for magical impacts.
     * @type {number}
     */
    this.targetMagicalSquishIntensity = jabsJuiceParsePluginFloat(p['target-magical-squish-intensity'], 0.08);

    /**
     * Frames to spend easing the target squish envelope.
     * @type {number}
     */
    this.targetSquishFrames = J.BASE.Helpers.parsePluginInt(p['target-squish-frames'], 10);

    /**
     * Scalar applied to recipient squish when the incoming action is healing.
     * @type {number}
     */
    this.healingRecipientSquishScale = jabsJuiceParsePluginFloat(p['healing-recipient-squish-scale'], 0.65);

    /**
     * Percent (0–100) describing how strongly repeated hits decay juice amplitude within the flurry window.
     * @type {number}
     */
    this.flurryDecayPercent = J.BASE.Helpers.parsePluginInt(p['flurry-decay-percent'], 72);

    /**
     * Dodge-only caster squish intensity (cooldown key matches dodge skill).
     * @type {number}
     */
    this.dodgeSquishIntensity = jabsJuiceParsePluginFloat(p['dodge-squish-intensity'], 0.28);

    /**
     * Frames for dodge squish easing.
     * @type {number}
     */
    this.dodgeSquishFrames = J.BASE.Helpers.parsePluginInt(p['dodge-squish-frames'], 12);

    /**
     * Support/healing caster pulse intensity.
     * @type {number}
     */
    this.supportCasterPulseIntensity = jabsJuiceParsePluginFloat(p['support-caster-pulse-intensity'], 0.06);

    /**
     * Frames for support caster easing.
     * @type {number}
     */
    this.supportCasterPulseFrames = J.BASE.Helpers.parsePluginInt(p['support-caster-pulse-frames'], 12);

    /**
     * Peak body tilt (radians) applied to strikers at execution time (before style multipliers).
     * @type {number}
     */
    this.casterStrikeTiltRadians = jabsJuiceParsePluginFloat(p['caster-strike-tilt-radians'], 0.18);

    /**
     * Frames spent tilting the striker.
     * @type {number}
     */
    this.casterStrikeTiltFrames = J.BASE.Helpers.parsePluginInt(p['caster-strike-tilt-frames'], 6);

    /**
     * Peak weapon-overlay swing rotation (radians) before style multipliers.
     * @type {number}
     */
    this.weaponSwingPeakRadians = jabsJuiceParsePluginFloat(p['weapon-swing-peak-radians'], 0.65);

    /**
     * Frames for the weapon swing overlay arc.
     * @type {number}
     */
    this.weaponSwingFrames = J.BASE.Helpers.parsePluginInt(p['weapon-swing-frames'], 10);

    /**
     * Extra downward shift for IconSet juice overlays (pixels; positive moves toward feet).
     * @type {number}
     */
    this.spriteJuiceVerticalOffsetPixels = J.BASE.Helpers.parsePluginInt(
      p['sprite-juice-vertical-offset-pixels'],
      10
    );

    /**
     * Body squish intensity when no weapon icon overlay plays (unarmed / enemies without icons).
     * @type {number}
     */
    this.unarmedStrikeSquishIntensity = jabsJuiceParsePluginFloat(p['unarmed-strike-squish-intensity'], 0.14);

    /**
     * Frames for unarmed strike easing.
     * @type {number}
     */
    this.unarmedStrikeSquishFrames = J.BASE.Helpers.parsePluginInt(p['unarmed-strike-squish-frames'], 9);

    /**
     * Casting pulse amplitude while {@link JABS_Battler.isCasting} remains true.
     * @type {number}
     */
    this.castingPulseAmplitude = jabsJuiceParsePluginFloat(p['casting-pulse-amplitude'], 0.045);

    /**
     * Named multiplier buckets keyed by skill tags or weapon type ids (JSON object).
     * @type {Object<string, { tiltMul: number, swingMul: number }>}
     */
    this.weaponStyleMultipliers = jabsJuiceParseWeaponStyleMultipliers(this.name, p);
  }
}

//endregion plugin metadata