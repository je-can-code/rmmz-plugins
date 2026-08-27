//region PanelMastery
/**
 * Subgroup enrollment and optional mastery-skill metadata for a single {@link StatDistributionPanel}.
 * Serialized on each panel row in config.sdp.json as a nested `mastery` object.
 *
 * Hierarchy (family → subgroup → panel) uses {@link #enrolledInSubgroup}.
 * Max-rank wrapper skills use {@link #grantsMasterySkill} only.
 */
class PanelMastery
{
  /**
   * @param {string} subgroupKey The subgroup key driving this step.
   * @param {number} subgroupTier The subgroup tier driving this step.
   * @param {number} masterySkillId The mastery skill id driving this step.
   */
  constructor(subgroupKey, subgroupTier, masterySkillId)
  {
    /**
     * Subgroup key from the SDP configuration registry (empty when not enrolled).
     * @type {string}
     */
    this.subgroupKey = subgroupKey;

    /**
     * Tier within the subgroup used for intra-subgroup mastery replacement.
     * @type {number}
     */
    this.subgroupTier = subgroupTier;

    /**
     * Wrapper skill id granted when this panel is maxed; J-Passive owns passive state(s).
     * Zero means the panel is organized under the subgroup but grants no mastery skill.
     * @type {number}
     */
    this.masterySkillId = masterySkillId;
  }

  /**
   * Whether this panel is placed in the subgroup hierarchy (family filtering, tier slots).
   * @returns {boolean}
   */
  enrolledInSubgroup()
  {
    return this.subgroupKey !== String.empty && this.subgroupTier > 0;
  }

  /**
   * Whether maxing this panel grants a subgroup mastery wrapper skill.
   * @returns {boolean}
   */
  grantsMasterySkill()
  {
    return this.masterySkillId > 0;
  }

  /**
   * Whether this panel grants a mastery wrapper skill on max rank.
   * Alias for {@link #grantsMasterySkill} — kept for call sites that mean "mastery program" narrowly.
   * @returns {boolean}
   */
  participates()
  {
    return this.grantsMasterySkill();
  }

  /**
   * Whether some mastery fields are set but the row is not valid.
   * @returns {boolean}
   */
  hasPartialEnrollment()
  {
    const hasSubgroupKey = this.subgroupKey !== String.empty;
    const hasSubgroupTier = this.subgroupTier > 0;
    const hasMasterySkill = this.masterySkillId > 0;

    // completely blank is valid — trainer headers, legacy rows, etc.
    if (hasSubgroupKey === false && hasSubgroupTier === false && hasMasterySkill === false)
    {
      return false;
    }

    // subgroup key and tier must always appear together.
    if (hasSubgroupKey !== hasSubgroupTier)
    {
      return true;
    }

    // mastery skill requires full subgroup enrollment.
    if (hasMasterySkill && this.enrolledInSubgroup() === false)
    {
      return true;
    }

    return false;
  }

  /**
   * Empty mastery row — panel is outside the subgroup hierarchy.
   * @returns {PanelMastery}
   */
  static none()
  {
    return new PanelMastery(String.empty, 0, 0);
  }

  /**
   * Builds mastery metadata from flat configuration json fields.
   * @param {string} subgroupKey The subgroup key driving this step.
   * @param {number} subgroupTier The subgroup tier driving this step.
   * @param {number} masterySkillId The mastery skill id driving this step.
   * @returns {PanelMastery}
   */
  static fromFlat(subgroupKey, subgroupTier, masterySkillId)
  {
    return new PanelMastery(subgroupKey, subgroupTier, masterySkillId);
  }

  /**
   * Hydrates mastery metadata from a parsed config.sdp.json panel row.
   * Accepts nested `mastery` (canonical) or legacy flat root fields during migration.
   * @param {object} parsedPanel The parsed panel driving this step.
   * @returns {PanelMastery}
   */
  static fromConfigPanel(parsedPanel)
  {
    const nested = parsedPanel.mastery;

    if (nested)
    {
      return PanelMastery.fromFlat(
        nested.subgroupKey ?? String.empty,
        PanelMastery.#parseIntField(nested.subgroupTier, 0),
        PanelMastery.#parseIntField(nested.masterySkillId, 0)
      );
    }

    // legacy flat root fields — removed from config after migrate:sdp-mastery.
    return PanelMastery.fromFlat(
      parsedPanel.subgroupKey ?? String.empty,
      PanelMastery.#parseIntField(parsedPanel.subgroupTier, 0),
      PanelMastery.#parseIntField(parsedPanel.masterySkillId, 0)
    );
  }

  /**
   * @param {string|number|null|undefined} value The value driving this step.
   * @param {number} defaultValue The default value driving this step.
   * @returns {number}
   */
  static #parseIntField(value, defaultValue)
  {
    const parsed = Number.parseInt(String(value), 10);

    if (Number.isNaN(parsed))
    {
      return defaultValue;
    }

    return parsed;
  }

  /**
   * Serializes this mastery row for config.sdp.json.
   * @returns {{ subgroupKey: string, subgroupTier: number, masterySkillId: number }}
   */
  toConfigJson()
  {
    return {
      subgroupKey: this.subgroupKey,
      subgroupTier: this.subgroupTier,
      masterySkillId: this.masterySkillId,
    };
  }
}

export default PanelMastery;
//endregion PanelMastery