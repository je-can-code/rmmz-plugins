//region plugins/jafting/creation-workflow.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { installJBaseHostGlobals } from '../_base/fixtures/install-j-base-host-globals.js';
import { installMinimalMenuUiStubs } from '../../setup/install-minimal-menu-ui-stubs.js';
import PluginMetadata from '../../../src/plugins/_base/models/PluginMetadata.js';
import ExternalJsonConfigLoader from '../../../src/plugins/_base/managers/ExternalJsonConfigLoader.js';
import ExternalJsonConfigLoaderOptions from '../../../src/plugins/_base/models/ExternalJsonConfigLoaderOptions.js';
import PluginVersion from '../../../src/plugins/_base/models/PluginVersion.js';
import CraftingCreationSession from '../../../src/plugins/jafting/ext/create/__models/CraftingCreationSession.js';

/**
 * CraftingCreationSession's own branch coverage is pure ESM with no bare-global dependency- it doesn't
 * need any boot. CraftingRecipe/CraftingComponent branch coverage already lives in
 * create-crafting-recipe-direct.test.js/create-crafting-component-direct.test.js via hand-built fakes, so
 * this file only re-exercises them here for the parts unique to a real recipesMap wired through a real
 * plugin boot (tool-gating, masking/name reveal against the real config). Window_RecipeDetails' layout
 * helpers are pure math needing only a placeholder Window_Base to construct against.
 */
const VITEST_MINIMAL_CRAFTING_JSON = JSON.stringify({
  recipes: [
    {
      name: 'Vitest Recipe',
      key: 'vitest_recipe',
      categoryKeys: [ 'vitest_cat' ],
      iconIndex: 1,
      description: 'vitest recipe description',
      unlockedByDefault: true,
      maskedUntilCrafted: false,
      tools: [],
      ingredients: [ { id: 1, type: 'i', count: 1 } ],
      outputs: [ { id: 2, type: 'i', count: 1 } ],
    },
  ],
  categories: [
    {
      name: 'Vitest Category',
      key: 'vitest_cat',
      iconIndex: 0,
      description: 'vitest category description',
      unlockedByDefault: true,
    },
  ],
});

describe('J-JAFTING-Creation workflow & layout (direct src import)', () =>
{
  describe('CraftingCreationSession', () =>
  {
    it('starts in category browsing with no category key', () =>
    {
      // Arrange & Act
      const session = new CraftingCreationSession();

      // Assert
      expect(session.getPhase()).toBe(CraftingCreationSession.Phase.BrowsingCategories);
    });

    it('starts with a null category key', () =>
    {
      // Arrange & Act
      const session = new CraftingCreationSession();

      // Assert
      expect(session.getCategoryKey()).toBe(null);
    });

    it('starts with a null last craft outcome', () =>
    {
      // Arrange & Act
      const session = new CraftingCreationSession();

      // Assert
      expect(session.getLastCraftOutcome()).toBe(null);
    });

    it('reset clears phase, category, and last craft outcome back to their initial values', () =>
    {
      // Arrange
      const session = new CraftingCreationSession();
      session.enterRecipeBrowsing('vitest_cat');
      session.tryCraftRecipe(null);

      // Act
      session.reset();

      // Assert
      expect(session.getPhase()).toBe(CraftingCreationSession.Phase.BrowsingCategories);
      expect(session.getCategoryKey()).toBe(null);
      expect(session.getLastCraftOutcome()).toBe(null);
    });

    it('enterRecipeBrowsing locks the phase to browsing recipes', () =>
    {
      // Arrange
      const session = new CraftingCreationSession();

      // Act
      session.enterRecipeBrowsing('vitest_cat');

      // Assert
      expect(session.getPhase()).toBe(CraftingCreationSession.Phase.BrowsingRecipes);
    });

    it('enterRecipeBrowsing locks the category key', () =>
    {
      // Arrange
      const session = new CraftingCreationSession();

      // Act
      session.enterRecipeBrowsing('vitest_cat');

      // Assert
      expect(session.getCategoryKey()).toBe('vitest_cat');
    });

    it('returnToCategoryBrowsing returns to category browsing phase', () =>
    {
      // Arrange
      const session = new CraftingCreationSession();
      session.enterRecipeBrowsing('vitest_cat');

      // Act
      session.returnToCategoryBrowsing();

      // Assert
      expect(session.getPhase()).toBe(CraftingCreationSession.Phase.BrowsingCategories);
    });

    it('returnToCategoryBrowsing clears the category key', () =>
    {
      // Arrange
      const session = new CraftingCreationSession();
      session.enterRecipeBrowsing('vitest_cat');

      // Act
      session.returnToCategoryBrowsing();

      // Assert
      expect(session.getCategoryKey()).toBe(null);
    });

    it('tryCraftRecipe records no_recipe when recipe is null', () =>
    {
      // Arrange
      const session = new CraftingCreationSession();

      // Act
      const out = session.tryCraftRecipe(null);

      // Assert
      expect(out).toEqual({ crafted: false, playedSuccessSound: false, reason: 'no_recipe' });
    });

    it('tryCraftRecipe stores the no_recipe outcome as the last craft outcome', () =>
    {
      // Arrange
      const session = new CraftingCreationSession();

      // Act
      const out = session.tryCraftRecipe(null);

      // Assert
      expect(session.getLastCraftOutcome()).toBe(out);
    });

    it('tryCraftRecipe records requirements_not_met when canCraft is false', () =>
    {
      // Arrange
      const session = new CraftingCreationSession();
      const recipe = { canCraft: () => false };

      // Act
      const out = session.tryCraftRecipe(recipe);

      // Assert
      expect(out).toEqual({ crafted: false, playedSuccessSound: false, reason: 'requirements_not_met' });
    });

    it('tryCraftRecipe crafts and records a successful outcome when canCraft is true', () =>
    {
      // Arrange
      const session = new CraftingCreationSession();
      const craft = vi.fn();
      const recipe = { canCraft: () => true, craft };

      // Act
      const out = session.tryCraftRecipe(recipe);

      // Assert
      expect(craft).toHaveBeenCalledTimes(1);
      expect(out).toEqual({ crafted: true, playedSuccessSound: true, reason: null });
    });

    it('snapshot reflects the current phase, category, and last outcome', () =>
    {
      // Arrange
      const session = new CraftingCreationSession();
      session.enterRecipeBrowsing('vitest_cat');
      session.tryCraftRecipe(null);

      // Act
      const snap = session.snapshot();

      // Assert
      expect(snap.phase).toBe(CraftingCreationSession.Phase.BrowsingRecipes);
      expect(snap.categoryKey).toBe('vitest_cat');
      expect(snap.lastCraftOutcome.reason).toBe('no_recipe');
    });
  });

  describe('CraftingRecipe wired against a real plugin boot', () =>
  {
    let Game_Party;
    let recipesMap;

    beforeAll(async () =>
    {
      vi.resetModules();

      installJBaseHostGlobals();
      globalThis.PluginMetadata = PluginMetadata;
      globalThis.ExternalJsonConfigLoader = ExternalJsonConfigLoader;
      globalThis.ExternalJsonConfigLoaderOptions = ExternalJsonConfigLoaderOptions;
      globalThis.PluginVersion = PluginVersion;
      globalThis.StorageManager.fsReadFile = () => VITEST_MINIMAL_CRAFTING_JSON;
      globalThis.PluginManager = {
        parameters: name => (name === 'J-JAFTING-Creation' ? {} : {}),
        registerCommand()
        {
        },
      };
      globalThis.JaftingSalvageManager = { applyCraftRecipeOutputs: vi.fn() };

      globalThis.__PLUGIN_NAME__ = 'J-Base';
      globalThis.__PLUGIN_VERSION__ = '3.0.0';
      await import('../../../src/plugins/_base/_metadata/initialization.js');

      globalThis.__PLUGIN_NAME__ = 'J-JAFTING';
      globalThis.__PLUGIN_VERSION__ = '2.1.0';
      await import('../../../src/plugins/jafting/core/_metadata/initialization.js');

      globalThis.__PLUGIN_NAME__ = 'J-JAFTING-Creation';
      globalThis.__PLUGIN_VERSION__ = '2.1.0';
      await import('../../../src/plugins/jafting/ext/create/_metadata/initialization.js');

      recipesMap = globalThis.J.JAFTING.EXT.CREATE.Metadata.recipesMap;

      // $dataItems: id 1 = ingredient, id 2 = output, id 3 = tool (real RPGManager-note-free rows);
      // a real array so CraftingComponent's $dataItems.at(id) lookup works like the vanilla engine's.
      globalThis.$dataItems = [];
      globalThis.$dataItems[1] = { id: 1, name: 'Vitest Ingredient' };
      globalThis.$dataItems[2] = { id: 2, name: 'Vitest Output' };
      globalThis.$dataItems[3] = { id: 3, name: 'Vitest Tool' };

      function Game_PartyCtor()
      {
      }

      Game_PartyCtor.prototype.initialize = function()
      {
        this._counts = {};
      };

      Game_PartyCtor.prototype.numItems = function(item)
      {
        return this._counts[item.id] ?? 0;
      };

      Game_PartyCtor.prototype.gainItem = function(item, amount)
      {
        this._counts[item.id] = (this._counts[item.id] ?? 0) + amount;
      };

      Game_PartyCtor.prototype.loseItem = function(item, amount)
      {
        this._counts[item.id] = (this._counts[item.id] ?? 0) - amount;
      };

      globalThis.Game_Party = Game_PartyCtor;
      Game_Party = Game_PartyCtor;
    });

    it('canCraft is false without the required tool even when ingredients are held', () =>
    {
      // Arrange
      const wideJson = JSON.stringify({
        recipes: [
          {
            name: 'Needs Tool',
            key: 'needs_tool',
            categoryKeys: [ 'vitest_cat' ],
            iconIndex: 1,
            description: 'x',
            unlockedByDefault: true,
            maskedUntilCrafted: false,
            tools: [ { id: 3, type: 'i', count: 1 } ],
            ingredients: [ { id: 1, type: 'i', count: 1 } ],
            outputs: [ { id: 2, type: 'i', count: 1 } ],
          },
        ],
        categories: JSON.parse(VITEST_MINIMAL_CRAFTING_JSON).categories,
      });
      globalThis.J.JAFTING.EXT.CREATE.Metadata.recipesMap = new Map(
        globalThis.J.JAFTING.EXT.CREATE.Metadata.constructor.classify(JSON.parse(wideJson)).recipes()
          .map(recipe => [ recipe.key, recipe ]),
      );
      const party = new Game_Party();
      party.initialize();
      globalThis.$gameParty = party;
      party.gainItem($dataItems[1], 1);

      const recipe = globalThis.J.JAFTING.EXT.CREATE.Metadata.recipesMap.get('needs_tool');

      // Act & Assert
      expect(recipe.canCraft()).toBe(false);
    });

    it('canCraft becomes true once the required tool is also held', () =>
    {
      // Arrange
      const wideJson = JSON.stringify({
        recipes: [
          {
            name: 'Needs Tool',
            key: 'needs_tool',
            categoryKeys: [ 'vitest_cat' ],
            iconIndex: 1,
            description: 'x',
            unlockedByDefault: true,
            maskedUntilCrafted: false,
            tools: [ { id: 3, type: 'i', count: 1 } ],
            ingredients: [ { id: 1, type: 'i', count: 1 } ],
            outputs: [ { id: 2, type: 'i', count: 1 } ],
          },
        ],
        categories: JSON.parse(VITEST_MINIMAL_CRAFTING_JSON).categories,
      });
      globalThis.J.JAFTING.EXT.CREATE.Metadata.recipesMap = new Map(
        globalThis.J.JAFTING.EXT.CREATE.Metadata.constructor.classify(JSON.parse(wideJson)).recipes()
          .map(recipe => [ recipe.key, recipe ]),
      );
      const party = new Game_Party();
      party.initialize();
      globalThis.$gameParty = party;
      party.gainItem($dataItems[1], 1);
      party.gainItem($dataItems[3], 1);

      const recipe = globalThis.J.JAFTING.EXT.CREATE.Metadata.recipesMap.get('needs_tool');

      // Act & Assert
      expect(recipe.canCraft()).toBe(true);
    });

    it('needsMasking is true before the recipe has ever been crafted', () =>
    {
      // Arrange
      const party = new Game_Party();
      party.initialize();
      party.getRecipeTrackingByKey = () => ({ hasBeenCrafted: () => false, craftingProficiency: () => 0 });
      globalThis.$gameParty = party;

      const recipe = recipesMap.get('vitest_recipe');
      recipe.maskedUntilCrafted = true;

      // Act & Assert
      expect(recipe.needsMasking()).toBe(true);
    });

    it('getRecipeName masks the name with question marks while masking is needed', () =>
    {
      // Arrange
      const party = new Game_Party();
      party.initialize();
      party.getRecipeTrackingByKey = () => ({ hasBeenCrafted: () => false, craftingProficiency: () => 0 });
      globalThis.$gameParty = party;

      const recipe = recipesMap.get('vitest_recipe');
      recipe.maskedUntilCrafted = true;

      // Act & Assert
      expect(recipe.getRecipeName()).toMatch(/\?/);
    });

    it('reveals the real name once craft() records a first-time craft', () =>
    {
      // Arrange
      const party = new Game_Party();
      party.initialize();
      const tracking = { crafted: false, hasBeenCrafted() { return this.crafted; }, improveProficiency() { this.crafted = true; } };
      party.getRecipeTrackingByKey = () => tracking;
      globalThis.$gameParty = party;

      const recipe = recipesMap.get('vitest_recipe');
      recipe.maskedUntilCrafted = true;

      // Act
      recipe.craft();

      // Assert
      expect(recipe.getRecipeName()).toBe('Vitest Recipe');
    });
  });

  describe('Window_RecipeDetails layout helpers', () =>
  {
    let Window_RecipeDetails;

    beforeAll(async () =>
    {
      vi.resetModules();

      installJBaseHostGlobals();
      installMinimalMenuUiStubs(globalThis);

      ({ default: Window_RecipeDetails } = await import(
        '../../../src/plugins/jafting/ext/create/windows/Window_RecipeDetails.js'
      ));
    });

    describe('quarterWidthsFromInner', () =>
    {
      it('floors width into four bands with remainder on the last', () =>
      {
        // Arrange & Act
        const { cw, remainder } = Window_RecipeDetails.quarterWidthsFromInner(350);

        // Assert
        expect(cw).toBe(87);
        expect(remainder).toBe(350 - cw * 4);
      });

      it('accounts for every pixel of the inner width across the four bands plus remainder', () =>
      {
        // Arrange & Act
        const { cw, remainder } = Window_RecipeDetails.quarterWidthsFromInner(350);

        // Assert
        expect(cw * 4 + remainder).toBe(350);
      });

      it('clamps each band to at least 80px for a narrow inner width', () =>
      {
        // Arrange & Act
        const { cw } = Window_RecipeDetails.quarterWidthsFromInner(100);

        // Assert
        expect(cw).toBe(80);
      });
    });

    describe('componentListRowsInnerStartY', () =>
    {
      it('starts below the tallest of the three header stacks', () =>
      {
        // Arrange
        const details = new Window_RecipeDetails(new globalThis.Rectangle(0, 0, 520, 300));
        details.innerWidth = 480;
        details.lineHeight = () => 24;
        details.textWidth = text => text.length * 6;
        details.resetFontSettings = () => {};
        details.modFontSize = () => {};
        details.toggleBold = () => {};
        details.toggleItalics = () => {};

        // Act
        const y = details.componentListRowsInnerStartY();

        // Assert
        expect(y).toBeGreaterThan(24 * 2);
      });
    });
  });
});
//endregion plugins/jafting/creation-workflow.test.js
