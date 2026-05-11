//region plugin metadata
/**
 * Validates a finite float value loaded from the external juice config, throwing on absence / non-finite values.
 * Lives outside {@link JAbsJuice_PluginMetadata} so it is safe while {@link PluginMetadata#initializePlugin}
 * runs {@link JAbsJuice_PluginMetadata#postInitialize} during {@code super()} (subclass private slots are not
 * usable yet).
 *
 * @param {*} raw Raw config value read at a leaf path.
 * @param {string} path Dotted path used in the thrown error (e.g. {@code juice.target.physicalSquishIntensity}).
 * @returns {number}
 */
function jabsJuiceRequireFloat(raw, path)
{
  // an explicit "the key is not there" is treated identically to "the key is junk" — both surface as a misconfig.
  if (raw === undefined || raw === null)
  {
    throw new Error(`[J-ABS-Juice] missing required number at config.jabs.json -> ${path}`);
  }

  // accept JSON numbers as well as numeric strings (config files are author-friendly).
  const parsed = typeof raw === 'number'
    ? raw
    : Number.parseFloat(String(raw));

  if (Number.isFinite(parsed) === false)
  {
    throw new Error(`[J-ABS-Juice] non-finite number at config.jabs.json -> ${path} (got: ${String(raw)})`);
  }

  return parsed;
}

/**
 * Validates a finite integer value loaded from the external juice config, throwing on absence / non-finite values.
 * Truncates any fractional component the same way RMMZ frame counts do.
 *
 * @param {*} raw Raw config value read at a leaf path.
 * @param {string} path Dotted path used in the thrown error (e.g. {@code juice.target.squishFrames}).
 * @returns {number}
 */
function jabsJuiceRequireInt(raw, path)
{
  // share the float path so authors writing "10" (string) vs 10 (number) both work; reject anything non-finite.
  const f = jabsJuiceRequireFloat(raw, path);

  return Math.trunc(f);
}

/**
 * Validates a single weapon-style multiplier row loaded from the external juice config.
 *
 * @param {*} row Unknown JSON row content.
 * @param {string} path Dotted path used in the thrown error (e.g. {@code juice.profiles.default}).
 * @returns {{ tiltMul: number, swingMul: number }}
 */
function jabsJuiceRequireStyleRow(row, path)
{
  // we never accept "row was forgotten"; the multiplier table is supposed to be authored on purpose.
  if (row === undefined || row === null || typeof row !== 'object')
  {
    throw new Error(`[J-ABS-Juice] missing or invalid profile row at config.jabs.json -> ${path}`);
  }

  // both multipliers are required leaves — partial rows would silently change feel without an obvious failure.
  const tiltMul = jabsJuiceRequireFloat(row.tiltMul, `${path}.tiltMul`);
  const swingMul = jabsJuiceRequireFloat(row.swingMul, `${path}.swingMul`);

  return { tiltMul, swingMul };
}

/**
 * Regex used to validate weapon-style profile keys. Matches the plugin's note tag capture: letters, digits,
 * underscore, and hyphen. Kept here so the data editor can mirror it without duplicating constants.
 * @type {RegExp}
 */
const jabsJuiceProfileKeyPattern = /^[a-zA-Z0-9_-]+$/;

/**
 * Validates the `juice.profiles` map, normalizes its rows, and guarantees a `default` row is present.
 *
 * @param {*} profiles Raw `juice.profiles` blob from the external config.
 * @returns {Object<string, { tiltMul: number, swingMul: number }>}
 */
function jabsJuiceRequireProfiles(profiles)
{
  // multiplier table = per-skill / per-weapon "feel" knob; missing it is misconfig, not no-op.
  if (profiles === undefined || profiles === null || typeof profiles !== 'object')
  {
    throw new Error('[J-ABS-Juice] missing required map at config.jabs.json -> juice.profiles');
  }

  // build the runtime lookup table; we keep authoring order via Object.keys for deterministic iteration if ever needed.
  const table = {};
  const keys = Object.keys(profiles);

  for (let i = 0; i < keys.length; i++)
  {
    const key = keys[i];

    // enforce the same charset the note tag accepts so an authored key always matches a notetag lookup.
    if (jabsJuiceProfileKeyPattern.test(key) === false)
    {
      throw new Error(
        `[J-ABS-Juice] invalid profile key "${key}" at config.jabs.json -> juice.profiles `
          + `(allowed: ${jabsJuiceProfileKeyPattern.source})`,
      );
    }

    table[key] = jabsJuiceRequireStyleRow(profiles[key], `juice.profiles.${key}`);
  }

  // `default` is the fallback when a skill's resolved style key has no matching row; it must always exist.
  if (Object.prototype.hasOwnProperty.call(table, 'default') === false)
  {
    throw new Error('[J-ABS-Juice] missing required row at config.jabs.json -> juice.profiles.default');
  }

  return table;
}

/**
 * Validates the entire `juice` block from the external JABS config, throwing on absence or shape problems.
 * Returns the raw block so the caller can extract sub-sections by name without re-walking.
 *
 * @param {*} root The parsed `config.jabs.json` root blob (already loaded by J-ABS).
 * @returns {object}
 */
function jabsJuiceRequireBlock(root)
{
  // the juice block is strictly required: dropping the plugin should be the way to disable juice, not a missing block.
  if (root === undefined || root === null || typeof root !== 'object')
  {
    throw new Error('[J-ABS-Juice] config.jabs.json is missing or unreadable; the juice block cannot be loaded.');
  }

  const { juice } = root;

  if (juice === undefined || juice === null || typeof juice !== 'object')
  {
    throw new Error(
      '[J-ABS-Juice] config.jabs.json is missing the required "juice" block '
        + '(see plugin help for the expected shape).',
    );
  }

  // sub-section presence checks happen here so the per-key errors below can assume their parent object exists.
  if (typeof juice.target !== 'object' || juice.target === null)
  {
    throw new Error('[J-ABS-Juice] config.jabs.json -> juice is missing the required "target" section.');
  }

  if (typeof juice.caster !== 'object' || juice.caster === null)
  {
    throw new Error('[J-ABS-Juice] config.jabs.json -> juice is missing the required "caster" section.');
  }

  if (typeof juice.casting !== 'object' || juice.casting === null)
  {
    throw new Error('[J-ABS-Juice] config.jabs.json -> juice is missing the required "casting" section.');
  }

  return juice;
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

//endregion plugin metadata