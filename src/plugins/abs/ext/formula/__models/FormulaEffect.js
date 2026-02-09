//region FormulaEffect
/**
 * Represents a single multi-formula packet declared on a skill/item.
 */
class FormulaEffect
{
  //region static constants and helpers
  /**
   * A collection of trigger literals that can appear in tags.
   */
  static Trigger = {
    /**
     * Triggers after a successful hit is confirmed.
     */
    HIT: "hit",

    /**
     * Triggers on use (regardless of hit).
     */
    USE: "use",
  };

  /**
   * A collection of affect-scope literals that can appear in tags.
   */
  static Affect = {
    /**
     * Affects the subject (user) of the action.
     */
    SELF: "self",

    /**
     * Affects subject's allies (map-wide unless further filtered by caller).
     */
    ALLIES: "allies",

    /**
     * Affects the primary target.
     */
    TARGET: "target",

    /**
     * Affects subject's enemies (map-wide unless further filtered by caller).
     */
    ENEMIES: "enemies",

    /**
     * Affects all battlers tracked by JABS.
     */
    ALL: "all",
  };

  /**
   * A collection of resource literals that can appear in tags.
   */
  static Resource = {
    /**
     * Applies to HP (positive => damage, negative => heal when using HP semantics).
     */
    HP: "hp",

    /**
     * Applies to MP (positive => mp damage, negative => mp heal when using MP semantics).
     */
    MP: "mp",

    /**
     * Applies to TP (positive => tp damage, negative => tp gain when using TP semantics).
     */
    TP: "tp",
  };

  /**
   * A collection of mode literals that can appear in tags.
   * SKILL => additional authored skill execution
   * FORMULA => inline formula magnitude routed to a resource
   */
  static Mode = {
    SKILL: "skill",
    FORMULA: "formula",
  };

  /**
   * All allowed trigger values in a Set for quick membership checks.
   * @type {Set<string>}
   */
  static #TRIGGERS = new Set([
    FormulaEffect.Trigger.HIT, FormulaEffect.Trigger.USE, ]);

  /**
   * All allowed affect values in a Set for quick membership checks.
   * @type {Set<string>}
   */
  static #AFFECTS = new Set([
    FormulaEffect.Affect.SELF,
    FormulaEffect.Affect.ALLIES,
    FormulaEffect.Affect.TARGET,
    FormulaEffect.Affect.ENEMIES,
    FormulaEffect.Affect.ALL, ]);

  /**
   * All allowed resource values in a Set for quick membership checks.
   * @type {Set<string>}
   */
  static #RESOURCES = new Set([
    FormulaEffect.Resource.HP, FormulaEffect.Resource.MP, FormulaEffect.Resource.TP, ]);

  /**
   * All allowed mode values in a Set for quick membership checks.
   * @type {Set<string>}
   */
  static #MODES = new Set([
    FormulaEffect.Mode.SKILL, FormulaEffect.Mode.FORMULA, ]);

  /**
   * Determines if a string is a valid trigger literal.
   * @param {string} trigger The trigger string to test.
   * @returns {boolean} True if valid, false otherwise.
   */
  static isValidTrigger(trigger)
  {
    // Check membership in the triggers set.
    return this.#TRIGGERS.has(String(trigger ?? "")
      .toLowerCase());
  }

  /**
   * Determines if a string is a valid affect literal.
   * @param {string} affect The affect string to test.
   * @returns {boolean} True if valid, false otherwise.
   */
  static isValidAffect(affect)
  {
    // Check membership in the affects set.
    return this.#AFFECTS.has(String(affect ?? "")
      .toLowerCase());
  }

  /**
   * Determines if a string is a valid resource literal.
   * @param {string} resource The resource string to test.
   * @returns {boolean} True if valid, false otherwise.
   */
  static isValidResource(resource)
  {
    // Check membership in the resources set.
    return this.#RESOURCES.has(String(resource ?? "")
      .toLowerCase());
  }

  /**
   * Determines if a string is a valid mode literal.
   * @param {string} mode The mode string to test.
   * @returns {boolean} True if valid, false otherwise.
   */
  static isValidMode(mode)
  {
    // Check membership in the modes set.
    return this.#MODES.has(String(mode ?? "")
      .toLowerCase());
  }

  /**
   * Normalizes a candidate trigger string to a valid constant (lowercased), or returns null.
   * @param {string} trigger The candidate trigger string.
   * @returns {string|null} The normalized trigger, or null if invalid.
   */
  static normalizeTrigger(trigger)
  {
    // Coerce to lowercase string for matching.
    const t = String(trigger ?? "")
      .toLowerCase();

    // Delegate validity check to avoid duplication.
    return this.isValidTrigger(t)
      ? t
      : null;
  }

  /**
   * Normalizes a candidate affect string to a valid constant (lowercased), or returns null.
   * @param {string} affect The candidate affect string.
   * @returns {string|null} The normalized affect, or null if invalid.
   */
  static normalizeAffect(affect)
  {
    // Coerce to lowercase string for matching.
    const a = String(affect ?? "")
      .toLowerCase();

    // Delegate validity check to avoid duplication.
    return this.isValidAffect(a)
      ? a
      : null;
  }

  /**
   * Normalizes a candidate resource string to a valid constant (lowercased), or returns null.
   * @param {string} resource The candidate resource string.
   * @returns {string|null} The normalized resource, or null if invalid.
   */
  static normalizeResource(resource)
  {
    // Coerce to lowercase string for matching.
    const r = String(resource ?? "")
      .toLowerCase();

    // Delegate validity check to avoid duplication.
    return this.isValidResource(r)
      ? r
      : null;
  }

  /**
   * Normalizes a candidate mode string to a valid constant (lowercased), or returns null.
   * @param {string} mode The candidate mode string.
   * @returns {string|null} The normalized mode, or null if invalid.
   */
  static normalizeMode(mode)
  {
    // Coerce to lowercase string for matching.
    const m = String(mode ?? "")
      .toLowerCase();

    // Delegate validity check to avoid duplication.
    return this.isValidMode(m)
      ? m
      : null;
  }

  /**
   * Creates a {@link FormulaEffect} from a capture-tuple like
   * [trigger, affect, resource, formula] for by-formula tags.
   * @param {string[]} tuple The [trigger, affect, resource, formula] tuple.
   * @returns {FormulaEffect} A new effect instance.
   */
  static fromFormulaTuple(tuple)
  {
    // destructure the expected values from the tuple.
    const [ trigger, affect, resource, formula ] = tuple;

    // build an effect using the constructor for normalization.
    return new FormulaEffect({
      trigger,
      affect,
      mode: FormulaEffect.Mode.FORMULA,
      resource,
      formula,
    });
  }

  /**
   * Creates a {@link FormulaEffect} from a capture-tuple like
   * [trigger, affect, skillIdString] for by-skill tags.
   * @param {string[]} tuple The [trigger, affect, skillIdString] tuple.
   * @returns {FormulaEffect} A new effect instance.
   */
  static fromSkillTuple(tuple)
  {
    // destructure the expected values from the tuple.
    const [ trigger, affect, skillIdString ] = tuple;

    // parse the id defensively.
    const skillId = parseInt(skillIdString);

    // build an effect using the constructor for normalization.
    return new FormulaEffect({
      trigger,
      affect,
      mode: FormulaEffect.Mode.SKILL,
      skillId,
    });
  }

  //endregion static constants and helpers

  /**
   * The trigger of this formula effect.
   * @type {string}
   */
  trigger = FormulaEffect.Trigger.HIT;

  /**
   * The target being affected by this formula effect.
   * @type {string}
   */
  affect = FormulaEffect.Affect.TARGET;

  /**
   * The mode for this effect packet: "skill" | "formula".
   * @type {string}
   */
  mode = FormulaEffect.Mode.FORMULA;

  /**
   * The resource this effect applies to (hp/mp/tp); null for by-skill.
   * @type {string|null}
   */
  resource = null;

  /**
   * The inline formula to execute when this packet triggers (by-formula only).
   * @type {string}
   */
  formula = String.empty;

  /**
   * The database id of the child skill to execute (by-skill only).
   * @type {number}
   */
  skillId = 0;

  /**
   * Constructor.
   * @param {{
   *  trigger: string,
   *  affect: string,
   *  mode: string,
   *  resource?: string|null,
   *  formula?: string,
   *  skillId?: number,
   * }} init Initialization bag.
   */
  constructor(init)
  {
    // normalize and assign trigger or default to HIT.
    this.trigger = FormulaEffect.normalizeTrigger(init.trigger) ?? FormulaEffect.Trigger.HIT;

    // normalize and assign affect or default to TARGET.
    this.affect = FormulaEffect.normalizeAffect(init.affect) ?? FormulaEffect.Affect.TARGET;

    // normalize and assign mode or default to FORMULA.
    this.mode = FormulaEffect.normalizeMode(init.mode) ?? FormulaEffect.Mode.FORMULA;

    // determine if a resource value was actually provided (strict presence check).
    const hasResource = (init.resource !== null) && (init.resource !== undefined);

    // only normalize resource when provided; resource is meaningful only for by-formula.
    const normalizedResource = hasResource
      ? FormulaEffect.normalizeResource(init.resource)
      : null;

    // assign the resource for formula mode; default to HP if provided value was invalid.
    this.resource = (this.mode === FormulaEffect.Mode.FORMULA)
      ? (normalizedResource ?? FormulaEffect.Resource.HP)
      : null;

    // store the formula for by-formula, or empty string.
    this.formula = (this.mode === FormulaEffect.Mode.FORMULA)
      ? String(init.formula ?? String.empty)
      : String.empty;

    // store the skill id for by-skill, or 0.
    this.skillId = (this.mode === FormulaEffect.Mode.SKILL)
      ? (parseInt(init.skillId ?? 0) || 0)
      : 0;
  }
}

//endregion FormulaEffect