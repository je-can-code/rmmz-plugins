//region juice config validation
/**
 * Validates external juice config leaves for {@link JAbsJuice_PluginMetadata}.
 * Lives outside the metadata class so it is safe while {@link PluginMetadata#initializePlugin}
 * runs {@link JAbsJuice_PluginMetadata#postInitialize} during {@code super()} (subclass private slots are not
 * usable yet).
 */
class JabsJuiceConfigValidation
{
  /**
   * Regex used to validate weapon-style profile keys. Matches the plugin's note tag capture: letters, digits,
   * underscore, and hyphen. Kept here so the data editor can mirror it without duplicating constants.
   * @type {RegExp}
   */
  static profileKeyPattern = /^[a-zA-Z0-9_-]+$/;

  /**
   * Validates a finite float value loaded from the external juice config, throwing on absence / non-finite values.
   *
   * @param {*} raw Raw config value read at a leaf path.
   * @param {string} path Dotted path used in the thrown error (e.g. {@code juice.target.physicalSquishIntensity}).
   * @returns {number}
   */
  static requireFloat(raw, path)
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

    // when Number.isFinite(parsed)  equals  false, take this branch.
    if (Number.isFinite(parsed) === false)
    {
      throw new Error(`[J-ABS-Juice] non-finite number at config.jabs.json -> ${path} (got: ${String(raw)})`);
    }

    // hand back parsed to the caller.
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
  static requireInt(raw, path)
  {
    // share the float path so authors writing "10" (string) vs 10 (number) both work; reject anything non-finite.
    const f = JabsJuiceConfigValidation.requireFloat(raw, path);

    // hand back Math.trunc(f) to the caller.
    return Math.trunc(f);
  }

  /**
   * Validates a single weapon-style multiplier row loaded from the external juice config.
   *
   * @param {*} row Unknown JSON row content.
   * @param {string} path Dotted path used in the thrown error (e.g. {@code juice.profiles.default}).
   * @returns {{ tiltMul: number, swingMul: number }}
   */
  static requireStyleRow(row, path)
  {
    // we never accept "row was forgotten"; the multiplier table is supposed to be authored on purpose.
    if (row === undefined || row === null || typeof row !== 'object')
    {
      throw new Error(`[J-ABS-Juice] missing or invalid profile row at config.jabs.json -> ${path}`);
    }

    // both multipliers are required leaves — partial rows would silently change feel without an obvious failure.
    const tiltMul = JabsJuiceConfigValidation.requireFloat(row.tiltMul, `${path}.tiltMul`);
    const swingMul = JabsJuiceConfigValidation.requireFloat(row.swingMul, `${path}.swingMul`);

    // hand back { tiltMul, swingMul } to the caller.
    return { tiltMul, swingMul };
  }

  /**
   * Validates the `juice.profiles` map, normalizes its rows, and guarantees a `default` row is present.
   *
   * @param {*} profiles Raw `juice.profiles` blob from the external config.
   * @returns {Object<string, { tiltMul: number, swingMul: number }>}
   */
  static requireProfiles(profiles)
  {
    // multiplier table = per-skill / per-weapon "feel" knob; missing it is misconfig, not no-op.
    if (profiles === undefined || profiles === null || typeof profiles !== 'object')
    {
      throw new Error('[J-ABS-Juice] missing required map at config.jabs.json -> juice.profiles');
    }

    // build the runtime lookup table; we keep authoring order via Object.keys for deterministic iteration if ever needed.
    const table = {};
    const keys = Object.keys(profiles);

    // iterate the loop counter until the guard exits.
    for (let i = 0; i < keys.length; i++)
    {
      const key = keys[i];

      // enforce the same charset the note tag accepts so an authored key always matches a notetag lookup.
      if (JabsJuiceConfigValidation.profileKeyPattern.test(key) === false)
      {
        throw new Error(
          `[J-ABS-Juice] invalid profile key "${key}" at config.jabs.json -> juice.profiles `
            + `(allowed: ${JabsJuiceConfigValidation.profileKeyPattern.source})`,
        );
      }

      // policy step inside require profiles.
      table[key] = JabsJuiceConfigValidation.requireStyleRow(profiles[key], `juice.profiles.${key}`);
    }

    // `default` is the fallback when a skill's resolved style key has no matching row; it must always exist.
    if (Object.prototype.hasOwnProperty.call(table, 'default') === false)
    {
      throw new Error('[J-ABS-Juice] missing required row at config.jabs.json -> juice.profiles.default');
    }

    // hand back table to the caller.
    return table;
  }

  /**
   * Validates the entire `juice` block from the external JABS config, throwing on absence or shape problems.
   * Returns the raw block so the caller can extract sub-sections by name without re-walking.
   *
   * @param {*} root The parsed `config.jabs.json` root blob (already loaded by J-ABS).
   * @returns {object}
   */
  static requireBlock(root)
  {
    // the juice block is strictly required: dropping the plugin should be the way to disable juice, not a missing block.
    if (root === undefined || root === null || typeof root !== 'object')
    {
      throw new Error('[J-ABS-Juice] config.jabs.json is missing or unreadable; the juice block cannot be loaded.');
    }

    // policy step inside require block.
    const { juice } = root;

    // when juice  equals  undefined  or  juice  equals  null  or  typeof juice  ..., take this branch.
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

    // when typeof juice.caster  differs from  'object'  or  juice.caster  equals..., take this branch.
    if (typeof juice.caster !== 'object' || juice.caster === null)
    {
      throw new Error('[J-ABS-Juice] config.jabs.json -> juice is missing the required "caster" section.');
    }

    // when typeof juice.casting  differs from  'object'  or  juice.casting  equa..., take this branch.
    if (typeof juice.casting !== 'object' || juice.casting === null)
    {
      throw new Error('[J-ABS-Juice] config.jabs.json -> juice is missing the required "casting" section.');
    }

    // hand back juice to the caller.
    return juice;
  }
}

export default JabsJuiceConfigValidation;
//endregion juice config validation