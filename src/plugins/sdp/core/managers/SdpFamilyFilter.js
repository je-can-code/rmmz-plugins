//region SdpFamilyFilter
/**
 * Family-filter symbols and helpers for the SDP panel list.
 * Cycle order is built per actor: All → Unsorted → families with unlocked panels.
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
   * Families with no unlocked panels for this actor are omitted.
   * @param {Game_Actor} actor The actor driving this step.
   * @returns {string[]}
   */
  static buildCycleForActor(actor)
  {
    const cycle = [
      SdpFamilyFilter.ALL,
      SdpFamilyFilter.UNKNOWN,
    ];
    const familiesWithUnlockedPanels = new Set();

    actor.getAllUnlockedSdps()
      .forEach(panelRanking =>
      {
        const panel = J.SDP.Metadata.panelsMap.get(panelRanking.key);

        if (!panel)
        {
          return;
        }

        const filterKey = SdpFamilyFilter.resolvePanelFamilyFilterKey(panel);

        if (filterKey !== SdpFamilyFilter.UNKNOWN)
        {
          familiesWithUnlockedPanels.add(filterKey);
        }
      });

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