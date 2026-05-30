//region SdpMasteryManager
/**
 * Applies subgroup mastery skills when panels are maxed.
 * Mastery is inferred from maxed {@link PanelRanking}s — no separate actor ledger.
 */
class SdpMasteryManager
{
  /**
   * Reconciles which mastery skill should be active for a subgroup on an actor.
   * Forgets every lower-tier mastery skill in the subgroup, then learns the winner.
   * @param {Game_Actor} actor The actor whose mastery skills are being reconciled.
   * @param {string} subgroupKey The subgroup key to reconcile.
   */
  static reconcileSubgroupMastery(actor, subgroupKey)
  {
    // panels with no subgroup key are outside the mastery program entirely.
    if (!subgroupKey) return;

    // grab every panel registered to this subgroup at boot (sorted by tier).
    const panelsInSubgroup = J.SDP.Metadata.panelsBySubgroupKey.get(subgroupKey);

    // if nothing was authored for this subgroup, there is nothing to reconcile.
    if (!panelsInSubgroup || panelsInSubgroup.length === 0) return;

    // scan the actor's maxed rankings and pick the highest tier in this subgroup.
    const winningPanel = SdpMasteryManager.#resolveWinningMasteryPanel(actor, subgroupKey);

    // walk every mastery panel in the subgroup and strip skills that lost the tier contest.
    panelsInSubgroup.forEach(panel =>
    {
      const { mastery } = panel;

      // some rows may exist in the grouping map but lack a mastery skill id (shouldn't happen post-validation).
      if (mastery.masterySkillId <= 0) return;

      // only the winning panel's wrapper skill may remain learned on this actor.
      const shouldKeepSkill = winningPanel !== null && panel.key === winningPanel.key;

      if (shouldKeepSkill === false && actor.isLearnedSkill(mastery.masterySkillId))
      {
        // drop the superseded wrapper skill; J-Passive will refresh states on forget.
        actor.forgetSkill(mastery.masterySkillId);
      }
    });

    // if the actor hasn't maxed any mastery panel in this subgroup yet, we are done forgetting.
    if (winningPanel === null) return;

    const winningMastery = winningPanel.mastery;

    // grant the winning wrapper skill if the actor doesn't already have it from a prior reconcile.
    if (actor.isLearnedSkill(winningMastery.masterySkillId) === false)
    {
      actor.learnSkill(winningMastery.masterySkillId);
    }
  }

  /**
   * Finds the highest-tier maxed mastery panel for a subgroup on an actor.
   * @param {Game_Actor} actor The actor driving this step.
   * @param {string} subgroupKey The subgroup key driving this step.
   * @returns {StatDistributionPanel|null}
   */
  static #resolveWinningMasteryPanel(actor, subgroupKey)
  {
    let winningPanel = null;

    // only maxed rankings can contribute a mastery — rank alone is not enough.
    actor.getAllSdpRankings()
      .filter(panelRanking => panelRanking.isPanelMaxed())
      .forEach(panelRanking =>
      {
        const panel = J.SDP.Metadata.panelsMap.get(panelRanking.key);

        if (!panel) return;

        // continue the routine with the next policy step.
        const { mastery } = panel;

        if (mastery.subgroupKey !== subgroupKey) return;
        if (mastery.masterySkillId <= 0) return;

        // higher subgroup tier wins; ties cannot exist because boot validation rejects duplicate tiers.
        if (winningPanel === null || mastery.subgroupTier > winningPanel.mastery.subgroupTier)
        {
          winningPanel = panel;
        }
      });

    return winningPanel;
  }
}

export default SdpMasteryManager;
//endregion SdpMasteryManager