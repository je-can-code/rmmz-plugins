//region plugins/sdp/core/windows/window-sdp-list.test.js
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { repoRoot } from '../../../../setup/repo-root.js';
import { installMinimalDatabase, installRmmzViewLayer } from '../../../../setup/rmmz-view-harness.js';

/**
 * The panel list, against the real `Window_Command` rather than a stand-in.
 *
 * Both of this window's filters are only observable through the built command list, and the list is only
 * rebuilt by a refresh. That makes the pairing of "setter changed something" with "the list was rebuilt"
 * the actual contract here- a setter that mutates its flag and returns leaves the player looking at rows
 * that no longer answer the filter they just asked for.
 */
describe('Window_SdpList', () =>
{
  let Window_SdpList;

  /**
   * Builds a panel of the shape the list and its family filter both read.
   * @param {string} key The panel's key.
   * @param {number} maxRank The rank at which the panel is finished.
   * @param {string} subgroupKey The subgroup the panel is enrolled in.
   * @returns {object} A panel stand-in.
   */
  const panelFor = (key, maxRank, subgroupKey) => ({
    key,
    name: `${key} name`,
    iconIndex: 7,
    maxRank,
    mastery: {
      enrolledInSubgroup: () => true,
      subgroupKey,
      subgroupTier: 1,
    },
    getPanelRarityColorIndex: () => 0,
  });

  /**
   * Stands up an actor holding the given panels at the given ranks, and registers them with SDP metadata.
   * @param {Array<{panel: object, currentRank: number}>} holdings What the actor has unlocked.
   */
  const useHoldings = holdings =>
  {
    const panelsMap = new Map(holdings.map(({ panel }) => [ panel.key, panel ]));
    const ranksByKey = new Map(holdings.map(({ panel, currentRank }) => [ panel.key, { currentRank } ]));

    globalThis.J.SDP.Metadata.panelsMap = panelsMap;
    globalThis.J.SDP.Metadata.familyKeyBySubgroupKey = new Map([ [ 'striking', 'offense' ] ]);
    globalThis.J.SDP.Metadata.families = [ { key: 'offense' } ];
    globalThis.J.SDP.Metadata.familiesMap = new Map([ [ 'offense', { subgroupKeys: [ 'striking' ] } ] ]);

    return {
      getAllUnlockedSdps: () => holdings.map(({ panel }) => ({ key: panel.key })),
      getSdpByKey: key => ranksByKey.get(key),
    };
  };

  /**
   * Names the rows the list is currently showing, in order.
   * @param {Window_SdpList} window The window to read.
   * @returns {string[]} The command symbols.
   */
  const symbolsOf = window => window._list.map(command => command.symbol);

  beforeAll(async () =>
  {
    installRmmzViewLayer();
    installMinimalDatabase();

    globalThis.$plugins = [];

    // J-Base owns `WindowCommandBuilder` and `Window_Command.addBuiltCommand`, both of which this window
    // builds through. Loading the shipped bundle is how a J-Base global reaches a test, since a plugin
    // source file may never import across a ship boundary.
    const bundle = path.join(repoRoot, 'project/js/plugins/base/J-Base.js');
    vm.runInThisContext(fs.readFileSync(bundle, 'utf-8'), { filename: bundle });

    globalThis.J.SDP = { Metadata: {} };

    ({ default: Window_SdpList } = await import(
      '../../../../../src/plugins/sdp/core/windows/Window_SdpList.js'));
  });

  beforeEach(() =>
  {
    globalThis.J.SDP.Metadata = {};
  });

  describe('toggleActionableOnly()', () =>
  {
    it('drops maxed rows from the list once the filter is on', () =>
    {
      // Arrange- a maxed panel beside an unmaxed one, so "hides maxed rows" and "hides every row" cannot
      // both satisfy the assertion.
      const finished = panelFor('finished', 5, 'striking');
      const ongoing = panelFor('ongoing', 5, 'striking');
      const actor = useHoldings([
        {
          panel: finished,
          currentRank: 5,
        },
        {
          panel: ongoing,
          currentRank: 2,
        },
      ]);
      const window = new Window_SdpList(new Rectangle(0, 0, 400, 400));
      window.setActor(actor);

      // Act
      window.toggleActionableOnly();

      // Assert
      expect(symbolsOf(window))
        .toEqual([ 'ongoing' ]);
    });

    it('restores maxed rows when toggled back off', () =>
    {
      // Arrange
      const finished = panelFor('finished', 5, 'striking');
      const ongoing = panelFor('ongoing', 5, 'striking');
      const actor = useHoldings([
        {
          panel: finished,
          currentRank: 5,
        },
        {
          panel: ongoing,
          currentRank: 2,
        },
      ]);
      const window = new Window_SdpList(new Rectangle(0, 0, 400, 400));
      window.setActor(actor);
      window.toggleActionableOnly();

      // Act
      window.toggleActionableOnly();

      // Assert
      expect(symbolsOf(window))
        .toEqual([ 'finished', 'ongoing' ]);
    });
  });
});

//endregion plugins/sdp/core/windows/window-sdp-list.test.js
