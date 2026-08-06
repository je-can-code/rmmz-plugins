//region plugins/_base/core/objects/game-party-inventory-reconciliation.test.js
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

import { repoRoot } from '../../../../setup/repo-root.js';
import { installMinimalDatabase, installRmmzViewLayer } from '../../../../setup/rmmz-view-harness.js';

/**
 * Wiring only. The reconciliation rules themselves are covered against the source module in
 * `_component/game-party-inventory-reconciliation.test.js`; what cannot be checked there is *when* they run, and
 * that turned out to be the hard half of the problem.
 *
 * Every earlier candidate for the hook is wrong, and wrong in a way that costs the player their belongings. Rows
 * created at runtime are written back into `$data*` from `Game_System.onAfterLoad`, which does not fire until
 * `Scene_Load.terminate` - so reconciling during `DataManager.extractSaveContents` would read a legitimately
 * restored row as a deleted one and drop it. Aliasing `onAfterLoad` fails the same way, because J-Base loads first
 * and its body therefore runs ahead of every extension's replay in that chain. `Scene_Load` cannot be the hook
 * either, since J-Base-Save loads through a scene of its own and never touches it.
 *
 * Every one of those paths ends up on the map. This proves the reconciliation actually happens there, and that the
 * alias still calls through - a `Scene_Map.start` that stopped starting the map would be a black screen.
 */
describe('Game_Party inventory reconciliation wiring (real view layer)', () =>
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

  it('reconciles from the map, which is the one point where the answer can be trusted', () =>
  {
    // Arrange
    const warn = vi.spyOn(console, 'warn')
      .mockImplementation(() => {});
    globalThis.$gameParty.rawWeapons()[200] = 1;

    // Act
    new globalThis.Scene_Map().start();

    // Assert
    expect(globalThis.$gameParty.rawWeapons()[200]).toBeUndefined();
    warn.mockRestore();
  });

  it('leaves a row that exists alone, so a load cannot cost the player anything', () =>
  {
    // Arrange - the guard against the whole family of "reconciled too early" mistakes.
    globalThis.$dataWeapons[2001] = globalThis.RPG_Weapon.createEmpty(2001);
    globalThis.$gameParty.rawWeapons()[2001] = 1;

    // Act
    new globalThis.Scene_Map().start();

    // Assert
    expect(globalThis.$gameParty.rawWeapons()[2001]).toBe(1);
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