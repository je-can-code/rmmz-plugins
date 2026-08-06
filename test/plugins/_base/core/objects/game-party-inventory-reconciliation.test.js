//region plugins/_base/core/objects/game-party-inventory-reconciliation.test.js
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

import { repoRoot } from '../../../../setup/repo-root.js';
import { installMinimalDatabase, installRmmzViewLayer } from '../../../../setup/rmmz-view-harness.js';

/**
 * A savefile outlives the database it was written against, and deleting a row mid-development is ordinary. What is
 * not ordinary is the consequence: the containers store quantities against keys, so a deleted row leaves a key
 * pointing at nothing, and `Game_Party.weapons` resolves it to `undefined`. Vanilla skates past that because its
 * predicates read `item && …` first; plugin code that asks the row a question dies somewhere unrelated to the
 * deletion that caused it.
 *
 * The rule these cover is narrow and worth stating exactly: **a key is dropped only when the datastore genuinely has
 * nothing at it.** A row that exists but is blank stays, and - the case that dictated where this runs at all - a row
 * created at runtime and written back into `$data*` during load is a legitimate holding, not a hole.
 */
describe('Game_Party inventory reconciliation (real engine)', () =>
{
  beforeAll(() =>
  {
    // the engine and J-Base go in exactly once per realm: the bundle installs accessor-only globals, so evaluating
    // it a second time throws while redefining them.
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

    const bundle = path.join(repoRoot, 'project/js/plugins/base/J-Base.js');

    vm.runInThisContext(fs.readFileSync(bundle, 'utf-8'), { filename: bundle });
  });

  beforeEach(() =>
  {
    // a party with nothing in it, and item tables built through the real constructors so the containers key the way
    // the live game keys them.
    globalThis.DataManager.createGameObjects();
    globalThis.$dataItems = [ null, globalThis.RPG_Item.createEmpty(1) ];
    globalThis.$dataWeapons = [ null, globalThis.RPG_Weapon.createEmpty(1) ];
    globalThis.$dataArmors = [ null, globalThis.RPG_Armor.createEmpty(1) ];
  });

  afterEach(() =>
  {
    vi.restoreAllMocks();
  });

  /**
   * Silences and records the reconciliation report.
   * @returns {import('vitest').MockInstance}
   */
  function captureWarnings()
  {
    return vi.spyOn(console, 'warn')
      .mockImplementation(() => {});
  }

  it('drops a weapon key whose row has been deleted from the database', () =>
  {
    // Arrange: exactly the shape a save carries after a family of weapons is cut - the key survives the deletion.
    const warn = captureWarnings();
    globalThis.$gameParty.rawWeapons()[200] = 1;

    // Act
    globalThis.$gameParty.pruneMissingInventoryEntries();

    // Assert
    expect(globalThis.$gameParty.rawWeapons()[200]).toBeUndefined();
    warn.mockRestore();
  });

  it('drops a deleted item key', () =>
  {
    // Arrange
    const warn = captureWarnings();
    globalThis.$gameParty.rawItems()[900] = 3;

    // Act
    globalThis.$gameParty.pruneMissingInventoryEntries();

    // Assert
    expect(globalThis.$gameParty.rawItems()[900]).toBeUndefined();
    warn.mockRestore();
  });

  it('drops a deleted armor key', () =>
  {
    // Arrange
    const warn = captureWarnings();
    globalThis.$gameParty.rawArmors()[777] = 2;

    // Act
    globalThis.$gameParty.pruneMissingInventoryEntries();

    // Assert
    expect(globalThis.$gameParty.rawArmors()[777]).toBeUndefined();
    warn.mockRestore();
  });

  it('keeps a key whose row still exists', () =>
  {
    // Arrange
    globalThis.$gameParty.rawWeapons()[1] = 4;

    // Act
    globalThis.$gameParty.pruneMissingInventoryEntries();

    // Assert
    expect(globalThis.$gameParty.rawWeapons()[1]).toBe(4);
  });

  it('keeps a row created at runtime and written back into the datastore', () =>
  {
    // Arrange: this is the case that decided where the reconciliation runs. Refinement mints rows into the dynamic
    // range and restores them from `Game_System.onAfterLoad`, so anything asking this question earlier in the load
    // would read a legitimately restored weapon as a deleted one and take it off the player.
    globalThis.$dataWeapons[2001] = globalThis.RPG_Weapon.createEmpty(2001);
    globalThis.$gameParty.rawWeapons()[2001] = 1;

    // Act
    globalThis.$gameParty.pruneMissingInventoryEntries();

    // Assert
    expect(globalThis.$gameParty.rawWeapons()[2001]).toBe(1);
  });

  it('keeps a row that exists but is blank', () =>
  {
    // Arrange: a reclaimed dynamic slot is a hydrated blank rather than a hole, and the player may still hold one.
    globalThis.$dataWeapons[2002] = globalThis.RPG_Weapon.createEmpty(2002);
    globalThis.$gameParty.rawWeapons()[2002] = 1;

    // Act
    globalThis.$gameParty.pruneMissingInventoryEntries();

    // Assert
    expect(globalThis.$gameParty.rawWeapons()[2002]).toBe(1);
  });

  it('says nothing at all when every key resolves', () =>
  {
    // Arrange: the overwhelmingly common case. A report on every map entry would train the reader to ignore the one
    // that matters.
    const warn = captureWarnings();
    globalThis.$gameParty.rawItems()[1] = 1;

    // Act
    globalThis.$gameParty.pruneMissingInventoryEntries();

    // Assert
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  it('names the kind, the key and the quantity it dropped', () =>
  {
    // Arrange: the failure this replaced was a TypeError several systems from its cause, so the report has to carry
    // enough to judge whether the deletion was intended without opening a save file.
    const warn = captureWarnings();
    globalThis.$gameParty.rawWeapons()[200] = 7;

    // Act
    globalThis.$gameParty.pruneMissingInventoryEntries();

    // Assert
    const said = warn.mock.calls.flat()
      .join('\n');

    expect(said).toContain('weapon #200');
    expect(said).toContain('x7');
    warn.mockRestore();
  });

  it('reconciles every container in one pass', () =>
  {
    // Arrange
    const warn = captureWarnings();
    globalThis.$gameParty.rawItems()[900] = 1;
    globalThis.$gameParty.rawWeapons()[200] = 1;
    globalThis.$gameParty.rawArmors()[777] = 1;

    // Act
    globalThis.$gameParty.pruneMissingInventoryEntries();

    // Assert
    const said = warn.mock.calls.flat()
      .join('\n');

    expect(said).toContain('dropped 3 entries');
    warn.mockRestore();
  });

  it('runs from the map, which is the point where the answer is trustworthy', () =>
  {
    // Arrange: every load path - vanilla's or J-Base-Save's own scene - ends up here, and by now anything that
    // intends to populate a datastore has done so.
    const warn = captureWarnings();
    globalThis.$gameParty.rawWeapons()[200] = 1;

    // Act
    new globalThis.Scene_Map().start();

    // Assert
    expect(globalThis.$gameParty.rawWeapons()[200]).toBeUndefined();
    warn.mockRestore();
  });

  it('still performs the engine\'s own map start logic', () =>
  {
    // Arrange & Act: the alias has to call through, not replace.
    const scene = new globalThis.Scene_Map();
    scene.start();

    // Assert
    expect(scene._active).toBe(true);
  });
});
//endregion plugins/_base/core/objects/game-party-inventory-reconciliation.test.js