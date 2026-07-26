//region SdpFamilyFilter
/**
 * Family-filter symbols and helpers for the SDP panel list.
 * Cycle order is built per actor: All → Unsorted (when non-empty) → families with unlocked panels.
 */
class SdpFamilyFilter
{
  /**
   * Shows every unlocked panel regardless of subgroup/family enrollment.
   * @type {string}
   */
  static ALL = '__all__';

  /**
   * Panels with no subgroup enrollment, or whose subgroup is not assigned to a family.
   * @type {string}
   */
  static UNKNOWN = '__unknown__';

  /**
   * Resolves which family-filter bucket a panel belongs in.
   * @param {StatDistributionPanel} panel The panel driving this step.
   * @returns {string} {@link SdpFamilyFilter.ALL} is never returned here — only UNKNOWN or a family key.
   */
  static resolvePanelFamilyFilterKey(panel)
  {
    if (panel.mastery.enrolledInSubgroup() === false)
    {
      return SdpFamilyFilter.UNKNOWN;
    }

    const familyKey = J.SDP.Metadata.familyKeyBySubgroupKey.get(panel.mastery.subgroupKey);

    if (!familyKey)
    {
      return SdpFamilyFilter.UNKNOWN;
    }

    return familyKey;
  }

  /**
   * Whether a panel should appear under the active family filter.
   * @param {StatDistributionPanel} panel The panel driving this step.
   * @param {string} filterKey The filter key driving this step.
   * @returns {boolean}
   */
  static panelMatchesFilter(panel, filterKey)
  {
    if (filterKey === SdpFamilyFilter.ALL)
    {
      return true;
    }

    return SdpFamilyFilter.resolvePanelFamilyFilterKey(panel) === filterKey;
  }

  /**
   * Builds the L2/R2 cycle for the current actor.
   * Unsorted and family tabs with no unlocked panels for this actor are omitted.
   * @param {Game_Actor} actor The actor driving this step.
   * @returns {string[]}
   */
  static buildCycleForActor(actor)
  {
    const cycle = [
      SdpFamilyFilter.ALL,
    ];
    const familiesWithUnlockedPanels = new Set();
    let hasUnknownPanels = false;

    actor.getAllUnlockedSdps()
      .forEach(panelRanking =>
      {
        const panel = J.SDP.Metadata.panelsMap.get(panelRanking.key);

        if (!panel)
        {
          return;
        }

        const filterKey = SdpFamilyFilter.resolvePanelFamilyFilterKey(panel);

        if (filterKey === SdpFamilyFilter.UNKNOWN)
        {
          hasUnknownPanels = true;
          return;
        }

        familiesWithUnlockedPanels.add(filterKey);
      });

    if (hasUnknownPanels)
    {
      cycle.push(SdpFamilyFilter.UNKNOWN);
    }

    J.SDP.Metadata.families.forEach(family =>
    {
      if (familiesWithUnlockedPanels.has(family.key))
      {
        cycle.push(family.key);
      }
    });

    return cycle;
  }

  /**
   * Ordinal position of a family within the authored family list.
   * Unresolved/unknown families sort after every known family.
   * @param {string} familyKey The family key driving this step.
   * @returns {number}
   */
  static familyOrderIndex(familyKey)
  {
    const index = J.SDP.Metadata.families.findIndex(family => family.key === familyKey);

    return index === -1
      ? Number.MAX_SAFE_INTEGER
      : index;
  }

  /**
   * Ordinal position of a subgroup within its owning family's authored subgroup list.
   * Unresolved/unknown subgroups sort after every known subgroup.
   * @param {string} familyKey The family key driving this step.
   * @param {string} subgroupKey The subgroup key driving this step.
   * @returns {number}
   */
  static subgroupOrderIndex(familyKey, subgroupKey)
  {
    const family = J.SDP.Metadata.familiesMap.get(familyKey);

    if (!family)
    {
      return Number.MAX_SAFE_INTEGER;
    }

    const index = family.subgroupKeys.indexOf(subgroupKey);

    return index === -1
      ? Number.MAX_SAFE_INTEGER
      : index;
  }

  /**
   * Orders two panels by family, then subgroup, then subgroup tier.
   * Falls back to alphabetical-by-key when the hierarchy can't fully disambiguate
   * (e.g. panels sitting entirely outside the family/subgroup hierarchy).
   * @param {StatDistributionPanel} panelA The first panel driving this step.
   * @param {StatDistributionPanel} panelB The second panel driving this step.
   * @returns {number}
   */
  static comparePanels(panelA, panelB)
  {
    const familyKeyA = SdpFamilyFilter.resolvePanelFamilyFilterKey(panelA);
    const familyKeyB = SdpFamilyFilter.resolvePanelFamilyFilterKey(panelB);

    const familyIndexA = SdpFamilyFilter.familyOrderIndex(familyKeyA);
    const familyIndexB = SdpFamilyFilter.familyOrderIndex(familyKeyB);

    if (familyIndexA !== familyIndexB)
    {
      return familyIndexA - familyIndexB;
    }

    const subgroupIndexA = SdpFamilyFilter.subgroupOrderIndex(familyKeyA, panelA.mastery.subgroupKey);
    const subgroupIndexB = SdpFamilyFilter.subgroupOrderIndex(familyKeyB, panelB.mastery.subgroupKey);

    if (subgroupIndexA !== subgroupIndexB)
    {
      return subgroupIndexA - subgroupIndexB;
    }

    if (panelA.mastery.subgroupTier !== panelB.mastery.subgroupTier)
    {
      return panelA.mastery.subgroupTier - panelB.mastery.subgroupTier;
    }

    // hierarchy fully ties (e.g. both panels sit entirely outside it) — fall back to key.
    return panelA.key.localeCompare(panelB.key);
  }

  /**
   * Display label for a family-filter key in the menu strip.
   * @param {string} filterKey The filter key driving this step.
   * @returns {string}
   */
  static displayNameForFilterKey(filterKey)
  {
    if (filterKey === SdpFamilyFilter.ALL)
    {
      return 'All families';
    }

    if (filterKey === SdpFamilyFilter.UNKNOWN)
    {
      return 'Unsorted';
    }

    const family = J.SDP.Metadata.familiesMap.get(filterKey);

    return family
      ? family.name
      : filterKey;
  }

  /**
   * Icon index for a family-filter key in the menu strip.
   * @param {string} filterKey The filter key driving this step.
   * @returns {number}
   */
  static iconIndexForFilterKey(filterKey)
  {
    if (filterKey === SdpFamilyFilter.ALL)
    {
      return J.SDP.Metadata.sdpIconIndex;
    }

    if (filterKey === SdpFamilyFilter.UNKNOWN)
    {
      return 8;
    }

    const family = J.SDP.Metadata.familiesMap.get(filterKey);

    if (family && family.iconIndex >= 0)
    {
      return family.iconIndex;
    }

    return J.SDP.Metadata.sdpIconIndex;
  }
}

export default SdpFamilyFilter;
//endregion SdpFamilyFilter