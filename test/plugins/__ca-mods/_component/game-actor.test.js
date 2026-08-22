//region plugins/__ca-mods/_component/game-actor.test.js
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { installCaModsHostGlobals } from './fixtures/install-ca-mods-host-globals.js';

describe('CAMods Game_Actor (real engine direct import)', () =>
{
  beforeAll(async () =>
  {
    installCaModsHostGlobals();

    // J-Base first- __ca-mods's own initialization.js and patch files assume J.BASE already exists.
    await import('../../../../src/plugins/_base/core/_metadata/initialization.js');

    await import('../../../../src/plugins/__ca-mods/core/_metadata/initialization.js');

    // the file under test- patches the real, engine-provided Game_Actor.prototype.
    await import('../../../../src/plugins/__ca-mods/core/objects/Game_Actor.js');
  });

  afterAll(() =>
  {
    delete globalThis.PluginManager;
    delete globalThis.PluginMetadata;
    delete globalThis.__PLUGIN_NAME__;
    delete globalThis.__PLUGIN_VERSION__;
    delete globalThis.J;
  });

  /**
   * Builds a bare Game_Actor without running the real `initialize()`/`setup()` chain (which
   * requires a populated `$dataActors` database entry)- tests assign only the state each method
   * under test actually reads.
   * @returns {Game_Actor}
   */
  function buildActor()
  {
    return Object.create(globalThis.Game_Actor.prototype);
  }

  describe('equipSlots', () =>
  {
    beforeEach(() =>
    {
      globalThis.$dataSystem = { equipTypes: [ String.empty, 'weapon', 'shield', 'head', 'body', 'accessory' ] };
    });

    afterEach(() =>
    {
      delete globalThis.$dataSystem;
    });

    it('appends a duplicate of the 5th equip type (accessory) to the base slots', () =>
    {
      const actor = buildActor();
      actor.isDualWield = () => false;

      // base engine slots for 5 equip types (index 1-5, excluding the blank 0th type) are [1,2,3,4,5];
      // __ca-mods appends a second 5 so actors get two accessory slots.
      expect(actor.equipSlots()).toEqual([ 1, 2, 3, 4, 5, 5 ]);
    });
  });

  describe('refreshAutoEquippedSkills', () =>
  {
    it('auto-equips every learned skill not already present in an equipped slot', () =>
    {
      const actor = buildActor();
      const jabsProcessLearnedSkill = vi.fn();

      actor.skills = () => [ { id: 10 }, { id: 20 } ];
      actor.getAllEquippedSkills = () => [ { id: 10 } ];
      actor.jabsProcessLearnedSkill = jabsProcessLearnedSkill;

      actor.refreshAutoEquippedSkills();

      // skill 10 is already in a slot, so only skill 20 should be auto-processed.
      expect(jabsProcessLearnedSkill).toHaveBeenCalledTimes(1);
      expect(jabsProcessLearnedSkill).toHaveBeenCalledWith(20);
    });
  });
});
//endregion plugins/__ca-mods/_component/game-actor.test.js
