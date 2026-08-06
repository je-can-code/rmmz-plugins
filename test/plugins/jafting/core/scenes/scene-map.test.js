//region scene-map.test
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

import { repoRoot } from '../../../../setup/repo-root.js';
import { installMinimalDatabase, installRmmzViewLayer } from '../../../../setup/rmmz-view-harness.js';

/**
 * The per-copy salvage ledgers are trimmed from `Scene_Map.start`, and that choice is the whole design: a copy
 * leaving the inventory might have been sold or might have been equipped, and at the moment of the removal those
 * are indistinguishable, so the trim waits for a settled state instead of guessing.
 *
 * That makes this alias load-bearing in a way no service test can reach. If the chain fails to call through, or the
 * sweep is never invoked, every ledger simply grows forever and nothing anywhere reports a problem - which is
 * exactly the class of defect that only exists once both objects are real.
 */
describe('Scene_Map salvage sweep (real view layer)', () =>
{
  beforeAll(() =>
  {
    // Arrange: the real engine, then J-Base's patches, then JAFTING core on top of those.
    installRmmzViewLayer();
    installMinimalDatabase();

    globalThis.$plugins = [];

    const realParameters = globalThis.PluginManager.parameters.bind(globalThis.PluginManager);

    globalThis.PluginManager.parameters = name =>
    {
      const found = globalThis.$plugins.find(plugin => plugin.name === name);

      return found
        ? found.parameters
        : realParameters(name);
    };

    [
      'project/js/plugins/base/J-Base.js',
      'project/js/plugins/jafting/J-JAFTING.js',
    ].forEach(relative =>
    {
      const bundle = path.join(repoRoot, relative);

      vm.runInThisContext(fs.readFileSync(bundle, 'utf-8'), { filename: bundle });
    });

    // the harness seeds actors, classes and the map, but not the item tables. these have to be hydrated `RPG_*`
    // models rather than raw rows, because J-Base's inventory keys every container on `_key()` - and they are built
    // after the bundles rather than before, since the constructor doing the hydrating arrives with J-Base.
    globalThis.$dataItems = [
      null,
      globalThis.RPG_Item.createEmpty(1),
      globalThis.RPG_Item.createEmpty(2),
    ];
    globalThis.$dataItems[1].name = 'Tasty Stew';
    globalThis.$dataItems[2].name = 'Bearcat Flank';
  });

  beforeEach(() =>
  {
    // a whole fresh party per test rather than just a fresh ledger store: inventory is half of what the sweep
    // reads, so a stack surviving from the previous test changes the answer without changing the arrangement.
    //
    // the starting members are deliberately not re-seeded. J-Base patches `Game_Actor.setup` to expect hydrated
    // equip tables, and building an actor now - after the bundle has loaded - walks into that patch with equip
    // tables this harness never filled. Nothing here needs a party roster; the sweep reads the actor store to find
    // worn copies, and an empty store honestly means nobody is wearing anything.
    globalThis.DataManager.createGameObjects();
    globalThis.JaftingSalvageManager.initPartySalvageStorage();
  });

  /**
   * Stamps a party stack with one ledger per copy, the way a completed craft does.
   * @param {RPG_Item} datum The template row being stamped.
   * @param {number} copies How many copies to hold and stamp.
   */
  function craftCopies(datum, copies)
  {
    globalThis.$gameParty.gainItem(datum, copies);

    const snapshot = new globalThis.JaftingSalvageLedgerSnapshot([
      new globalThis.JaftingSalvageLedgerRow('i', 2, 4),
    ]);

    globalThis.JaftingSalvageManager.appendStampedUnitsToPartyStack(datum, snapshot, copies);
  }

  it('trims a ledger left longer than the copies still held', () =>
  {
    // Arrange: three copies crafted, two of them since sold. the sale dropped the count without touching the
    // per-copy array, which is what defers the decision to here.
    const [ , datum ] = globalThis.$dataItems;
    craftCopies(datum, 3);
    globalThis.$gameParty.loseItem(datum, 2);
    const key = globalThis.JaftingSalvageManager.containerKeyFromDatum(datum);

    // Act: the scene the player lands back on after the shop closes.
    new globalThis.Scene_Map().start();

    // Assert
    expect(globalThis.$gameParty._j._jafting._salvageLedgers[key].unitLedgers.length).toBe(1);
  });

  it('drops a bag whose last copy is gone', () =>
  {
    // Arrange
    const [ , datum ] = globalThis.$dataItems;
    craftCopies(datum, 1);
    globalThis.$gameParty.loseItem(datum, 1);
    const key = globalThis.JaftingSalvageManager.containerKeyFromDatum(datum);

    // Act
    new globalThis.Scene_Map().start();

    // Assert
    expect(globalThis.$gameParty._j._jafting._salvageLedgers[key]).toBeUndefined();
  });

  it('leaves a ledger matching its stack alone', () =>
  {
    // Arrange: the no-op case, which is what actually happens on almost every map entry.
    const [ , datum ] = globalThis.$dataItems;
    craftCopies(datum, 2);
    const key = globalThis.JaftingSalvageManager.containerKeyFromDatum(datum);

    // Act
    new globalThis.Scene_Map().start();

    // Assert
    expect(globalThis.$gameParty._j._jafting._salvageLedgers[key].unitLedgers.length).toBe(2);
  });

  it('still performs the engine\'s own start logic', () =>
  {
    // Arrange & Act: the alias has to call through, not replace. a scene that never starts is a black screen.
    const scene = new globalThis.Scene_Map();
    scene.start();

    // Assert
    expect(scene._active).toBe(true);
  });
});
//endregion scene-map.test