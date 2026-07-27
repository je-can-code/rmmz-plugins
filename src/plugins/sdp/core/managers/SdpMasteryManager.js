//region SdpMasteryManager
/**
 * Applies subgroup mastery skills when panels are maxed.
 * Mastery is inferred from maxed {@link PanelRanking}s — no separate actor ledger.
 */
class SdpMasteryManager
{
  /**
   * Reconciles mastery wrapper skills for every subgroup this actor has maxed.
   * Idempotent — safe when content or plugin wiring changes mid dev save.
   * @param {Game_Actor} actor The actor whose mastery skills are being reconciled.
   */
  static reconcileAllForActor(actor)
  {
    if (!actor) return;

    const subgroupKeys = new Set();

    // collect subgroup keys from maxed rankings only — rank alone does not grant mastery.
    actor.getAllSdpRankings()
      .filter(panelRanking => panelRanking.isPanelMaxed())
      .forEach(panelRanking =>
      {
        const panel = J.SDP.Metadata.panelsMap.get(panelRanking.key);

        if (!panel) return;
        if (panel.mastery.subgroupKey === String.empty) return;

        subgroupKeys.add(panel.mastery.subgroupKey);
      });

    subgroupKeys.forEach(subgroupKey =>
    {
      SdpMasteryManager.reconcileSubgroupMastery(actor, subgroupKey);
    });
  }

  /**
   * Reconciles mastery wrapper skills for every party member.
   */
  static reconcileAllForParty()
  {
    $gameParty.members()
      .forEach(actor => SdpMasteryManager.reconcileAllForActor(actor));
  }

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

    // remembers the highest-tier mastery actually stripped during this pass. the panels arrive sorted
    // by tier, so the last one forgotten is the tier the actor was sitting on immediately before now-
    // which is exactly what makes an upgrade announcement able to say what it grew out of.
    let supersededPanel = null;

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

        // record what was displaced so the announcement can frame this as growth rather than a gain.
        supersededPanel = panel;
      }
    });

    // if the actor hasn't maxed any mastery panel in this subgroup yet, we are done forgetting.
    if (winningPanel === null) return;

    const winningMastery = winningPanel.mastery;

    // grant the winning wrapper skill if the actor doesn't already have it from a prior reconcile.
    if (actor.isLearnedSkill(winningMastery.masterySkillId) === false)
    {
      actor.learnSkill(winningMastery.masterySkillId);

      // announce the new mastery while both the winning and displaced panels are still in scope.
      SdpMasteryManager.#handleMasteryLearnedLog(actor, winningPanel, supersededPanel);
    }
  }

  /**
   * Generates a dia log announcing that an actor gained a subgroup mastery.
   * Masteries supersede one another within a subgroup, so this distinguishes a first mastery from an
   * upgrade over a lower tier- the latter being the more common and more satisfying of the two, and
   * otherwise entirely invisible to the player. Reconciles that change nothing never reach this.
   * @param {Game_Actor} actor The actor who gained the mastery.
   * @param {StatDistributionPanel} winningPanel The panel whose mastery is now active.
   * @param {StatDistributionPanel|null} supersededPanel The panel this mastery grew out of, if any.
   */
  static #handleMasteryLearnedLog(actor, winningPanel, supersededPanel)
  {
    // the dia log is optional- when J-Log is absent there is simply nowhere to announce this.
    if (!J.LOG) return;

    // grab the wrapper skill so its name and message overrides can be read.
    const skill = actor.skill(winningPanel.mastery.masterySkillId);

    // an upgrade gets to name what it replaced; a first mastery has nothing to grow out of.
    const headline = skill.message1 || (supersededPanel !== null
      ? `\\C[1]${actor.name()}\\C[0] deepened their mastery: \\C[1]${skill.name}\\C[0] supersedes ${actor.skill(supersededPanel.mastery.masterySkillId).name}!`
      : `\\C[1]${actor.name()}\\C[0] achieved mastery of \\C[1]${skill.name}\\C[0]!`);

    // the skill's own message2 wins when authored; otherwise remind the player it must be equipped.
    const instruction = skill.message2 || 'Equip it from the skills menu to use it.';

    // build the two-line log wearing the master's face so the player knows who grew.
    const log = new DiaLogBuilder().addLine(headline)
      .addLine(instruction)
      .setFaceName(actor.faceName())
      .setFaceIndex(actor.faceIndex())
      .build();

    // push it into the dia log for display.
    $diaLogManager.addLog(log);
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