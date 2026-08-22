//region plugins/sdp/core/managers/sdp-mastery-manager.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  installSdpHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJSdp,
} from '../../_component/fixtures/install-sdp-host-globals.js';

/**
 * Mastery is not stored anywhere: it is re-derived from whichever panels an actor has maxed, every
 * time something might have changed. That makes reconciliation idempotent by design, and it means
 * the manager has to tolerate a save whose rankings no longer line up with the current config -
 * a panel that was renamed, a subgroup that was emptied, a mastery row that lost its skill id.
 * These cover those mismatches; the scenario file alongside covers the happy tier contests.
 */
describe('SdpMasteryManager guards (direct src import)', () =>
{
  let SdpMasteryManager;

  beforeAll(async () =>
  {
    vi.resetModules();

    installSdpHostGlobals();

    setPluginContextToJBase();
    await import('../../../../../src/plugins/_base/core/_metadata/initialization.js');

    setPluginContextToJSdp();
    await import('../../../../../src/plugins/sdp/core/_metadata/initialization.js');

    ({ default: SdpMasteryManager } = await import('../../../../../src/plugins/sdp/core/managers/SdpMasteryManager.js'));
  });

  /**
   * Builds an actor that records the wrapper skills it learns and forgets.
   * @param {object[]} rankings The panel rankings this actor holds.
   * @param {number[]} [learned] Skill ids already known.
   * @returns {object}
   */
  function makeActor(rankings, learned = [])
  {
    return {
      learned: new Set(learned),
      getAllSdpRankings()
      {
        return rankings;
      },
      isLearnedSkill(skillId)
      {
        return this.learned.has(skillId);
      },
      learnSkill(skillId)
      {
        this.learned.add(skillId);
      },
      forgetSkill(skillId)
      {
        this.learned.delete(skillId);
      },
    };
  }

  /**
   * Builds a maxed (or unmaxed) ranking for a panel key.
   * @param {string} key The panel key.
   * @param {boolean} [maxed] Whether the panel is maxed.
   * @returns {object}
   */
  function makeRanking(key, maxed = true)
  {
    return {
      key,
      isPanelMaxed()
      {
        return maxed;
      },
    };
  }

  /**
   * Registers a panel with a mastery row, into both lookup maps the manager reads.
   * @param {string} key The panel key.
   * @param {string} subgroupKey The subgroup this panel belongs to.
   * @param {number} subgroupTier The tier within the subgroup.
   * @param {number} masterySkillId The wrapper skill this panel grants.
   * @returns {object} The registered panel.
   */
  function registerPanel(key, subgroupKey, subgroupTier, masterySkillId)
  {
    const panel = {
      key,
      mastery: { subgroupKey, subgroupTier, masterySkillId },
    };

    globalThis.J.SDP.Metadata.panelsMap.set(key, panel);

    if (subgroupKey !== String.empty)
    {
      const existing = globalThis.J.SDP.Metadata.panelsBySubgroupKey.get(subgroupKey) ?? [];
      existing.push(panel);
      existing.sort((a, b) => a.mastery.subgroupTier - b.mastery.subgroupTier);
      globalThis.J.SDP.Metadata.panelsBySubgroupKey.set(subgroupKey, existing);
    }

    return panel;
  }

  beforeEach(() =>
  {
    globalThis.J.SDP.Metadata.panelsMap = new Map();
    globalThis.J.SDP.Metadata.panelsBySubgroupKey = new Map();
  });

  //region reconcileAllForActor
  describe('reconcileAllForActor', () =>
  {
    it('does nothing at all without an actor to reconcile', () =>
    {
      // Arrange: reconciliation is triggered from several lifecycle points, not all of which
      // guarantee an actor is present yet.
      // Act
      const act = () => SdpMasteryManager.reconcileAllForActor(null);

      // Assert
      expect(act).not.toThrow();
    });

    it('ignores a ranking whose panel no longer exists in the config', () =>
    {
      // Arrange: a save can outlive a renamed or deleted panel.
      const actor = makeActor([ makeRanking('panel_deleted') ]);

      // Act
      const act = () => SdpMasteryManager.reconcileAllForActor(actor);

      // Assert
      expect(act).not.toThrow();
    });

    it('ignores a maxed panel that belongs to no subgroup', () =>
    {
      // Arrange: most panels are outside the mastery program entirely.
      registerPanel('panel_plain', String.empty, 0, 0);
      const actor = makeActor([ makeRanking('panel_plain') ], [ 99 ]);

      // Act
      SdpMasteryManager.reconcileAllForActor(actor);

      // Assert: nothing was granted or stripped.
      expect([ ...actor.learned ]).toEqual([ 99 ]);
    });

    it('reconciles the subgroup of a maxed enrolled panel', () =>
    {
      // Arrange
      registerPanel('panel_t1', 'resilience', 1, 501);
      const actor = makeActor([ makeRanking('panel_t1') ]);

      // Act
      SdpMasteryManager.reconcileAllForActor(actor);

      // Assert
      expect(actor.isLearnedSkill(501)).toBe(true);
    });

    it('skips a panel that is enrolled but not yet maxed', () =>
    {
      // Arrange: ranks alone never grant mastery; only maxing the panel does.
      registerPanel('panel_t1', 'resilience', 1, 501);
      const actor = makeActor([ makeRanking('panel_t1', false) ]);

      // Act
      SdpMasteryManager.reconcileAllForActor(actor);

      // Assert
      expect(actor.isLearnedSkill(501)).toBe(false);
    });
  });
  //endregion reconcileAllForActor

  //region reconcileAllForParty
  describe('reconcileAllForParty', () =>
  {
    it('reconciles every member of the party', () =>
    {
      // Arrange
      registerPanel('panel_t1', 'resilience', 1, 501);
      const actors = [ makeActor([ makeRanking('panel_t1') ]), makeActor([ makeRanking('panel_t1') ]) ];
      globalThis.$gameParty = {
        members()
        {
          return actors;
        },
      };

      // Act
      SdpMasteryManager.reconcileAllForParty();

      // Assert
      expect(actors.map(actor => actor.isLearnedSkill(501))).toEqual([ true, true ]);
    });
  });
  //endregion reconcileAllForParty

  //region reconcileSubgroupMastery
  describe('reconcileSubgroupMastery', () =>
  {
    it('does nothing without a subgroup key', () =>
    {
      // Arrange
      const actor = makeActor([]);

      // Act
      const act = () => SdpMasteryManager.reconcileSubgroupMastery(actor, String.empty);

      // Assert
      expect(act).not.toThrow();
    });

    it('does nothing for a subgroup that was never authored', () =>
    {
      // Arrange
      const actor = makeActor([]);

      // Act
      const act = () => SdpMasteryManager.reconcileSubgroupMastery(actor, 'no_such_subgroup');

      // Assert
      expect(act).not.toThrow();
    });

    it('does nothing for a subgroup whose panel list is empty', () =>
    {
      // Arrange: a subgroup emptied by rebalancing still has its key registered.
      globalThis.J.SDP.Metadata.panelsBySubgroupKey.set('hollow', []);
      const actor = makeActor([]);

      // Act
      const act = () => SdpMasteryManager.reconcileSubgroupMastery(actor, 'hollow');

      // Assert
      expect(act).not.toThrow();
    });

    it('grants nothing while the actor has maxed no panel in the subgroup', () =>
    {
      // Arrange
      registerPanel('panel_t1', 'resilience', 1, 501);
      const actor = makeActor([ makeRanking('panel_t1', false) ]);

      // Act
      SdpMasteryManager.reconcileSubgroupMastery(actor, 'resilience');

      // Assert
      expect(actor.learned.size).toBe(0);
    });

    it('strips a wrapper skill the actor no longer qualifies for', () =>
    {
      // Arrange: un-maxing a panel (via rebalance or a dev reset) must take its skill back.
      registerPanel('panel_t1', 'resilience', 1, 501);
      const actor = makeActor([ makeRanking('panel_t1', false) ], [ 501 ]);

      // Act
      SdpMasteryManager.reconcileSubgroupMastery(actor, 'resilience');

      // Assert
      expect(actor.isLearnedSkill(501)).toBe(false);
    });

    it('ignores a subgroup row that carries no mastery skill id', () =>
    {
      // Arrange: the skill-less row sits above the one that grants something, so winning the tier
      // contest on height alone would hand the actor a skill id of zero and strip the real one.
      registerPanel('panel_t1', 'resilience', 1, 501);
      registerPanel('panel_t3', 'resilience', 3, 0);
      const actor = makeActor([ makeRanking('panel_t1'), makeRanking('panel_t3') ]);

      // Act
      SdpMasteryManager.reconcileSubgroupMastery(actor, 'resilience');

      // Assert
      expect([ ...actor.learned ]).toEqual([ 501 ]);
    });

    it('ignores maxed panels belonging to a different subgroup', () =>
    {
      // Arrange
      registerPanel('panel_other', 'agility', 3, 601);
      registerPanel('panel_t1', 'resilience', 1, 501);
      const actor = makeActor([ makeRanking('panel_other'), makeRanking('panel_t1') ]);

      // Act
      SdpMasteryManager.reconcileSubgroupMastery(actor, 'resilience');

      // Assert
      expect(actor.isLearnedSkill(501)).toBe(true);
    });

    it('ignores a maxed ranking whose panel is gone from the config', () =>
    {
      // Arrange
      registerPanel('panel_t1', 'resilience', 1, 501);
      const actor = makeActor([ makeRanking('panel_deleted'), makeRanking('panel_t1') ]);

      // Act
      SdpMasteryManager.reconcileSubgroupMastery(actor, 'resilience');

      // Assert
      expect(actor.isLearnedSkill(501)).toBe(true);
    });

    it('keeps only the highest maxed tier when several are maxed', () =>
    {
      // Arrange: mastery is a ladder, not a collection- the lower rungs are superseded.
      registerPanel('panel_t1', 'resilience', 1, 501);
      registerPanel('panel_t2', 'resilience', 2, 502);
      const actor = makeActor([ makeRanking('panel_t1'), makeRanking('panel_t2') ], [ 501 ]);

      // Act
      SdpMasteryManager.reconcileSubgroupMastery(actor, 'resilience');

      // Assert
      expect([ actor.isLearnedSkill(501), actor.isLearnedSkill(502) ]).toEqual([ false, true ]);
    });

    it('keeps the highest tier even when a lower one is encountered later', () =>
    {
      // Arrange: the tier contest scans the actor's rankings, whose order follows how panels were
      // acquired rather than tier order- so a tier-1 panel maxed after tier-2 must not displace it.
      registerPanel('panel_t1', 'resilience', 1, 501);
      registerPanel('panel_t2', 'resilience', 2, 502);
      const actor = makeActor([ makeRanking('panel_t2'), makeRanking('panel_t1') ]);

      // Act
      SdpMasteryManager.reconcileSubgroupMastery(actor, 'resilience');

      // Assert
      expect([ actor.isLearnedSkill(501), actor.isLearnedSkill(502) ]).toEqual([ false, true ]);
    });

    it('leaves an already-correct actor untouched when run again', () =>
    {
      // Arrange: reconciliation runs on several lifecycle events, so it has to be idempotent.
      registerPanel('panel_t1', 'resilience', 1, 501);
      const actor = makeActor([ makeRanking('panel_t1') ], [ 501 ]);

      // Act
      SdpMasteryManager.reconcileSubgroupMastery(actor, 'resilience');

      // Assert
      expect([ ...actor.learned ]).toEqual([ 501 ]);
    });
  });
  //endregion reconcileSubgroupMastery
});
//endregion plugins/sdp/core/managers/sdp-mastery-manager.test.js