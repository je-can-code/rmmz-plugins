//region plugins/jafting/_component/ext-objects-prototype-patches-direct.test.js
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Direct-import coverage for the remaining JAFTING extension prototype patches not already exercised by
 * creation-workflow.test.js's VM-bundle harness: ext/create/objects/{Game_Party,Game_System}.js and
 * ext/refine/objects/{Game_Item,Game_Party,Game_System}.js. Each aliases a real engine method via
 * J.<EXT>.Aliased.<Class>.set/get, matching the pattern already proven in
 * core-data-manager-game-party-direct.test.js. RecipeTracking/CategoryTracking/JaftingManager are all
 * real ES imports from other files under test, so their own logic (not re-tested here) backs these
 * thin aliasing wrappers.
 */
describe('JAFTING extension object prototype patches (direct src import)', () =>
{
  describe('ext/create/objects/Game_Party.js', () =>
  {
    let aliasedCalls;

    beforeAll(async () =>
    {
      aliasedCalls = [];

      // RecipeTracking/CategoryTracking (imported transitively by this file) call
      // SerializableRegistry.register(this) at module top level- see
      // create-crafting-support-models-direct.test.js for the equivalent isolated coverage of that.
      globalThis.SerializableRegistry = { register: () => {} };

      globalThis.J = {
        JAFTING: {
          EXT: {
            CREATE: {
              Aliased: { Game_Party: new Map() },
              Metadata: {
                recipes: [ { key: 'r1', unlockedByDefault: true }, { key: 'r2', unlockedByDefault: false } ],
                categories: [ { key: 'c1', unlockedByDefault: true } ],
                recipesMap: new Map([ [ 'r1', { key: 'r1', categoryKeys: [ 'c1' ] } ] ]),
                categoriesMap: new Map([ [ 'c1', { key: 'c1' } ] ]),
              },
            },
          },
        },
      };

      function Game_Party()
      {
      }

      Game_Party.prototype.initialize = vi.fn(() =>
      {
        aliasedCalls.push('initialize');
      });

      globalThis.Game_Party = Game_Party;

      await import('../../../../src/plugins/jafting/ext/create/objects/Game_Party.js');
    });

    beforeEach(() =>
    {
      aliasedCalls = [];
    });

    afterAll(() =>
    {
      delete globalThis.SerializableRegistry;
      delete globalThis.J;
      delete globalThis.Game_Party;
    });

    it('initialize chains the original then seeds jafting members and trackings from metadata', () =>
    {
      const party = new Game_Party();
      party.initialize();

      expect(aliasedCalls).toEqual([ 'initialize' ]);
      expect(party.getAllRecipeTrackings().map(t => t.key)).toEqual([ 'r1', 'r2' ]);
      expect(party.getAllCategoryTrackings().map(t => t.key)).toEqual([ 'c1' ]);
      expect(party.getUnlockedRecipeTrackings().map(t => t.key)).toEqual([ 'r1' ]);
    });

    it('lockRecipe/unlockRecipe toggle the matching tracking, and warn without throwing for an unknown key', () =>
    {
      const party = new Game_Party();
      party.initialize();

      party.lockRecipe('r1');
      expect(party.getRecipeTrackingByKey('r1').isUnlocked()).toBe(false);

      party.unlockRecipe('r1');
      expect(party.getRecipeTrackingByKey('r1').isUnlocked()).toBe(true);

      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      expect(() => party.lockRecipe('missing')).not.toThrow();
      errorSpy.mockRestore();
    });

    it('getUnlockedRecipes resolves tracking keys back to full recipe objects via the metadata map', () =>
    {
      const party = new Game_Party();
      party.initialize();
      party.unlockAllRecipes();

      const unlocked = party.getUnlockedRecipes();

      expect(unlocked.map(r => r.key)).toEqual([ 'r1' ]);
    });

    it('canGainEntry rejects null, blank, underscore-prefixed, "=="-prefixed, and placeholder names', () =>
    {
      const party = new Game_Party();

      expect(party.canGainEntry(null)).toBe(false);
      expect(party.canGainEntry('   ')).toBe(false);
      expect(party.canGainEntry('_hidden')).toBe(false);
      expect(party.canGainEntry('==Header==')).toBe(false);
      expect(party.canGainEntry('-- empty --')).toBe(false);
      expect(party.canGainEntry('Valid Name')).toBe(true);
    });

    it('unlockEverythingCompletely unlocks all recipes/categories and reveals proficiency', () =>
    {
      const party = new Game_Party();
      party.initialize();

      party.unlockEverythingCompletely();

      expect(party.getUnlockedRecipeTrackings().map(t => t.key)).toEqual([ 'r1', 'r2' ]);
      expect(party.getUnlockedCategoryTrackings().map(t => t.key)).toEqual([ 'c1' ]);
      expect(party.getRecipeTrackingByKey('r1').craftingProficiency()).toBe(1);
    });

    it('updateVariableWithCraftedCountByCategories sums crafted counts across categories into a game variable', () =>
    {
      const party = new Game_Party();
      party.initialize();
      party.getRecipeTrackingByKey('r1').improveProficiency();

      globalThis.$gameVariables = { setValue: vi.fn() };

      party.updateVariableWithCraftedCountByCategories(5, 'c1');

      expect($gameVariables.setValue).toHaveBeenCalledWith(5, 1);

      delete globalThis.$gameVariables;
    });
  });

  describe('ext/create/objects/Game_System.js', () =>
  {
    beforeAll(async () =>
    {
      globalThis.J = { JAFTING: { EXT: { CREATE: { Aliased: { Game_System: new Map() } } } } };

      function Game_System()
      {
      }

      Game_System.prototype.onAfterLoad = vi.fn();
      globalThis.Game_System = Game_System;

      await import('../../../../src/plugins/jafting/ext/create/objects/Game_System.js');
    });

    afterAll(() =>
    {
      delete globalThis.J;
      delete globalThis.Game_System;
    });

    afterEach(() =>
    {
      delete globalThis.$gameParty;
    });

    it('onAfterLoad chains the original then refreshes recipe/category trackings from config', () =>
    {
      globalThis.$gameParty = {
        updateRecipesFromConfig: vi.fn(),
        updateCategoriesFromConfig: vi.fn(),
      };

      const system = new Game_System();
      system.onAfterLoad();

      expect($gameParty.updateRecipesFromConfig).toHaveBeenCalledTimes(1);
      expect($gameParty.updateCategoriesFromConfig).toHaveBeenCalledTimes(1);
    });
  });

  describe('ext/refine/objects/Game_Item.js', () =>
  {
    beforeAll(async () =>
    {
      globalThis.J = { JAFTING: { EXT: { REFINE: { Aliased: { Game_Item: new Map() } } } } };

      function Game_Item()
      {
      }

      Game_Item.prototype.setObject = vi.fn(() =>
      {
      });

      globalThis.Game_Item = Game_Item;

      await import('../../../../src/plugins/jafting/ext/refine/objects/Game_Item.js');
    });

    afterAll(() =>
    {
      delete globalThis.J;
      delete globalThis.Game_Item;
    });

    it('setObject stores the item _key() as _itemId instead of its id', () =>
    {
      const gameItem = new Game_Item();
      const item = { _key: () => 2001 };

      gameItem.setObject(item);

      expect(gameItem._itemId).toBe(2001);
    });

    it('setObject falls back to 0 for a falsy item', () =>
    {
      const gameItem = new Game_Item();

      gameItem.setObject(null);

      expect(gameItem._itemId).toBe(0);
    });
  });

  describe('ext/refine/objects/Game_Party.js', () =>
  {
    let aliasedCalls;

    beforeAll(async () =>
    {
      aliasedCalls = [];
      globalThis.J = { JAFTING: { EXT: { REFINE: { Aliased: { Game_Party: new Map() } } } } };

      function Game_Party()
      {
      }

      Game_Party.prototype.initialize = vi.fn(() =>
      {
        aliasedCalls.push('initialize');
      });

      globalThis.Game_Party = Game_Party;
      globalThis.RPG_Weapon = function RPG_Weapon(weapon, index)
      {
        this.index = index;
        this.source = weapon;
        this._key = () => index;
      };
      globalThis.RPG_Armor = function RPG_Armor(armor, index)
      {
        this.index = index;
        this.source = armor;
        this._key = () => index;
      };

      await import('../../../../src/plugins/jafting/ext/refine/objects/Game_Party.js');
    });

    beforeEach(() =>
    {
      aliasedCalls = [];
    });

    afterEach(() =>
    {
      delete globalThis.$dataWeapons;
      delete globalThis.$dataArmors;
    });

    afterAll(() =>
    {
      delete globalThis.J;
      delete globalThis.Game_Party;
      delete globalThis.RPG_Weapon;
      delete globalThis.RPG_Armor;
    });

    it('initialize chains the original then seeds refinement counters at JaftingManager.StartingIndex', async () =>
    {
      const { default: JaftingManager } = await import(
        '../../../../src/plugins/jafting/ext/refine/managers/JaftingManager.js'
      );

      const party = new Game_Party();
      party.initialize();

      expect(aliasedCalls).toEqual([ 'initialize' ]);
      expect(party.getRefinementCounter(JaftingManager.RefinementTypes.Weapon)).toBe(JaftingManager.StartingIndex);
      expect(party.getRefinementCounter(JaftingManager.RefinementTypes.Armor)).toBe(JaftingManager.StartingIndex);
      expect(party.getRefinedWeapons()).toEqual([]);
      expect(party.getRefinedArmors()).toEqual([]);
    });

    it('addRefinedWeapon/addRefinedArmor track new entries; incrementRefinementCounter advances the index', async () =>
    {
      const { default: JaftingManager } = await import(
        '../../../../src/plugins/jafting/ext/refine/managers/JaftingManager.js'
      );

      const party = new Game_Party();
      party.initialize();

      const weapon = { name: 'Sword' };
      party.addRefinedWeapon(weapon);
      expect(party.getRefinedWeapons()).toEqual([ weapon ]);

      party.incrementRefinementCounter(JaftingManager.RefinementTypes.Weapon);
      expect(party.getRefinementCounter(JaftingManager.RefinementTypes.Weapon)).toBe(JaftingManager.StartingIndex + 1);
    });

    it('refreshDatabaseWeapons/refreshDatabaseArmors rebuild $data* entries from tracked refined equips', () =>
    {
      globalThis.$dataWeapons = {};
      globalThis.$dataArmors = {};

      const party = new Game_Party();
      party.initialize();
      party.addRefinedWeapon({ index: 2001, name: 'Sword +1' });
      party.addRefinedArmor({ index: 2001, name: 'Shield +1' });

      party.refreshDatabaseWeapons();
      party.refreshDatabaseArmors();

      expect($dataWeapons[2001]).toBeInstanceOf(RPG_Weapon);
      expect($dataArmors[2001]).toBeInstanceOf(RPG_Armor);
    });
  });

  describe('ext/refine/objects/Game_System.js', () =>
  {
    beforeAll(async () =>
    {
      globalThis.J = { JAFTING: { EXT: { REFINE: { Aliased: { Game_System: new Map() } } } } };

      function Game_System()
      {
      }

      Game_System.prototype.onAfterLoad = vi.fn();
      globalThis.Game_System = Game_System;

      await import('../../../../src/plugins/jafting/ext/refine/objects/Game_System.js');
    });

    afterAll(() =>
    {
      delete globalThis.J;
      delete globalThis.Game_System;
      delete globalThis.$gameParty;
    });

    it('onAfterLoad chains the original then refreshes both refined-equip databases', () =>
    {
      globalThis.$gameParty = {
        refreshDatabaseWeapons: vi.fn(),
        refreshDatabaseArmors: vi.fn(),
      };

      const system = new Game_System();
      system.onAfterLoad();

      expect($gameParty.refreshDatabaseWeapons).toHaveBeenCalledTimes(1);
      expect($gameParty.refreshDatabaseArmors).toHaveBeenCalledTimes(1);
    });
  });
});
//endregion plugins/jafting/_component/ext-objects-prototype-patches-direct.test.js
