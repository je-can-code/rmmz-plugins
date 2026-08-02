//region plugins/sdp/core/models/panel-ranking.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  installSdpHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJSdp,
} from '../../_component/fixtures/install-sdp-host-globals.js';

/**
 * A panel ranking is one actor's progress through one panel. Ranking up fires reward scripts
 * authored as raw JavaScript in the config, which is the risky part: a single malformed reward
 * must not take down the rank-up that triggered it, or a typo in one panel would strand the
 * player mid-investment with points already spent.
 */
describe('PanelRanking (direct src import)', () =>
{
  let PanelRanking;
  let PanelRankupReward;

  beforeAll(async () =>
  {
    vi.resetModules();

    installSdpHostGlobals();

    setPluginContextToJBase();
    await import('../../../../../src/plugins/_base/core/_metadata/initialization.js');

    setPluginContextToJSdp();
    await import('../../../../../src/plugins/sdp/core/_metadata/initialization.js');

    ({ default: PanelRanking } = await import('../../../../../src/plugins/sdp/core/models/PanelRanking.js'));
    ({ default: PanelRankupReward } = await import('../../../../../src/plugins/sdp/core/models/PanelRankupReward.js'));
  });

  /**
   * Registers a panel stand-in under a key and returns a ranking pointed at it. Only the fields
   * the ranking actually reads are supplied- the rank cap, the reward list, and enough mastery
   * shape to answer whether the panel takes part in the subgroup program.
   * @param {object} [options] The panel shape to register.
   * @returns {PanelRanking}
   */
  function makeRanking(options = {})
  {
    const { maxRank = 3, panelRewards = [], participates = false } = options;

    globalThis.J.SDP.Metadata.panelsMap.set('vitest_panel', {
      key: 'vitest_panel',
      maxRank,
      panelRewards,
      getPanelRewardsByRank(rank)
      {
        return panelRewards.filter(reward => reward.rankRequired === rank);
      },
      mastery: {
        subgroupKey: 'vitest_subgroup',
        participates()
        {
          return participates;
        },
      },
    });

    return new PanelRanking('vitest_panel', 1);
  }

  beforeEach(() =>
  {
    globalThis.J.SDP.Metadata.panelsMap = new Map();

    // reward scripts run with `a` bound to the owning actor, so they need a real one to touch.
    globalThis.$gameActors = {
      actor()
      {
        return { learnedSkills: [], learnSkill(id) { this.learnedSkills.push(id); } };
      },
    };
  });

  //region rankUp
  describe('rankUp', () =>
  {
    it('advances the rank while below the cap', () =>
    {
      // Arrange
      const ranking = makeRanking({ maxRank: 3 });

      // Act
      ranking.rankUp();

      // Assert
      expect(ranking.currentRank).toBe(1);
    });

    it('maxes the panel out upon reaching the cap', () =>
    {
      // Arrange
      const ranking = makeRanking({ maxRank: 1 });

      // Act
      ranking.rankUp();

      // Assert
      expect(ranking.isPanelMaxed()).toBe(true);
    });

    it('does not advance past the cap once already there', () =>
    {
      // Arrange: a maxed panel that somehow receives another rank-up must not overshoot its cap.
      const ranking = makeRanking({ maxRank: 2 });
      ranking.currentRank = 2;

      // Act
      ranking.rankUp();

      // Assert
      expect(ranking.currentRank).toBe(2);
    });
  });
  //endregion rankUp

  //region normalizeRank
  describe('normalizeRank', () =>
  {
    it('clamps a rank that now exceeds a lowered cap', () =>
    {
      // Arrange: rebalancing a panel downward leaves existing saves holding ranks the panel no
      // longer offers, so the stored rank is reconciled against the current config on load.
      const ranking = makeRanking({ maxRank: 3 });
      ranking.currentRank = 7;

      // Act
      ranking.normalizeRank();

      // Assert
      expect(ranking.currentRank).toBe(3);
    });

    it('leaves a rank within the cap untouched', () =>
    {
      // Arrange
      const ranking = makeRanking({ maxRank: 5 });
      ranking.currentRank = 2;

      // Act
      ranking.normalizeRank();

      // Assert
      expect(ranking.currentRank).toBe(2);
    });
  });
  //endregion normalizeRank

  //region performRankupEffects
  describe('performRankupEffects', () =>
  {
    it('does nothing for a rank carrying no rewards', () =>
    {
      // Arrange
      const ranking = makeRanking({ panelRewards: [] });

      // Act
      const act = () => ranking.performRankupEffects(1);

      // Assert
      expect(act).not.toThrow();
    });

    it('executes a reward script against the owning actor', () =>
    {
      // Arrange: rewards are raw JavaScript strings from config, evaluated with `a` bound to
      // the actor who ranked the panel.
      const reward = new PanelRankupReward('Learn Guard', 1, 'a.learnSkill(42);');
      const ranking = makeRanking({ panelRewards: [ reward ] });
      const actor = globalThis.$gameActors.actor();
      globalThis.$gameActors.actor = () => actor;

      // Act
      ranking.performRankupEffects(1);

      // Assert
      expect(actor.learnedSkills).toEqual([ 42 ]);
    });

    it('only runs the rewards matching the requested rank', () =>
    {
      // Arrange
      const rewards = [
        new PanelRankupReward('Rank one', 1, 'a.learnSkill(1);'),
        new PanelRankupReward('Rank two', 2, 'a.learnSkill(2);'),
      ];
      const ranking = makeRanking({ panelRewards: rewards });
      const actor = globalThis.$gameActors.actor();
      globalThis.$gameActors.actor = () => actor;

      // Act
      ranking.performRankupEffects(2);

      // Assert
      expect(actor.learnedSkills).toEqual([ 2 ]);
    });

    it('survives a reward script that throws', () =>
    {
      // Arrange: one malformed reward must not abort the rank-up that already spent the points.
      const error = vi.spyOn(console, 'error')
        .mockImplementation(() => {});
      const reward = new PanelRankupReward('Broken', 1, 'a.thisMethodDoesNotExist();');
      const ranking = makeRanking({ panelRewards: [ reward ] });

      // Act
      const act = () => ranking.performRankupEffects(1);

      // Assert
      expect(act).not.toThrow();

      // restore manually so the spy cannot leak into whichever test runs next in this file.
      error.mockRestore();
    });

    it('reports a reward script that throws rather than swallowing it', () =>
    {
      // Arrange
      const error = vi.spyOn(console, 'error')
        .mockImplementation(() => {});
      const reward = new PanelRankupReward('Broken', 1, 'a.thisMethodDoesNotExist();');
      const ranking = makeRanking({ panelRewards: [ reward ] });

      // Act
      ranking.performRankupEffects(1);

      // Assert
      expect(error).toHaveBeenCalled();

      error.mockRestore();
    });

    it('keeps running later rewards after an earlier one throws', () =>
    {
      // Arrange
      const error = vi.spyOn(console, 'error')
        .mockImplementation(() => {});
      const rewards = [
        new PanelRankupReward('Broken', 1, 'a.thisMethodDoesNotExist();'),
        new PanelRankupReward('Fine', 1, 'a.learnSkill(7);'),
      ];
      const ranking = makeRanking({ panelRewards: rewards });
      const actor = globalThis.$gameActors.actor();
      globalThis.$gameActors.actor = () => actor;

      // Act
      ranking.performRankupEffects(1);

      // Assert
      expect(actor.learnedSkills).toEqual([ 7 ]);

      error.mockRestore();
    });
  });
  //endregion performRankupEffects
});
//endregion plugins/sdp/core/models/panel-ranking.test.js