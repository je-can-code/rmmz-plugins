//region plugins/jafting/creation-workflow.test.js
import vm from 'node:vm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import {
  installJaftingVmGamePartyBootstrap,
  seedJaftingCreationDatabaseItems,
  VITEST_MINIMAL_CRAFTING_JSON,
} from './fixtures/engine-stubs.js';
import { loadJaftingCreationPluginVm } from './jafting-creation-vm.js';

describe('J-JAFTING-Creation workflow & layout (built plugins)', () =>
{
  let sandbox;
  let VM;

  beforeAll(() =>
  {
    sandbox = { console };
    loadJaftingCreationPluginVm(sandbox);
    VM = sandbox.__JAFT_VM;
    installJaftingVmGamePartyBootstrap(sandbox);
    seedJaftingCreationDatabaseItems(sandbox);

    vm.runInContext(`
      const party = new Game_Party();
      party.initialize();
      party.__testItemContainer = {};
      $gameParty = party;
      JaftingSalvageManager.initPartySalvageStorage();
    `, sandbox);
  });

  afterAll(() =>
  {
    sandbox = null;
  });

  describe('CraftingCreationSession', () =>
  {
    it('starts in category browsing with no category key', () =>
    {
      const session = new VM.CraftingCreationSession();

      expect(session.getPhase()).toBe(VM.CraftingCreationSession.Phase.BrowsingCategories);
      expect(session.getCategoryKey()).toBe(null);
      expect(session.getLastCraftOutcome()).toBe(null);
    });

    it('reset clears phase, category, and last craft outcome', () =>
    {
      const session = new VM.CraftingCreationSession();

      session.enterRecipeBrowsing('vitest_cat');
      session.tryCraftRecipe(null);
      session.reset();

      expect(session.getPhase()).toBe(VM.CraftingCreationSession.Phase.BrowsingCategories);
      expect(session.getCategoryKey()).toBe(null);
      expect(session.getLastCraftOutcome()).toBe(null);
    });

    it('enterRecipeBrowsing locks phase and category key', () =>
    {
      const session = new VM.CraftingCreationSession();

      session.enterRecipeBrowsing('vitest_cat');

      expect(session.getPhase()).toBe(VM.CraftingCreationSession.Phase.BrowsingRecipes);
      expect(session.getCategoryKey()).toBe('vitest_cat');
    });

    it('returnToCategoryBrowsing clears the category key', () =>
    {
      const session = new VM.CraftingCreationSession();

      session.enterRecipeBrowsing('vitest_cat');
      session.returnToCategoryBrowsing();

      expect(session.getPhase()).toBe(VM.CraftingCreationSession.Phase.BrowsingCategories);
      expect(session.getCategoryKey()).toBe(null);
    });

    it('tryCraftRecipe records no_recipe when recipe is null', () =>
    {
      const session = new VM.CraftingCreationSession();
      const out = session.tryCraftRecipe(null);

      expect(out.crafted).toBe(false);
      expect(out.playedSuccessSound).toBe(false);
      expect(out.reason).toBe('no_recipe');
      expect(session.getLastCraftOutcome()).toBe(out);
    });

    it('tryCraftRecipe records requirements_not_met when canCraft is false', () =>
    {
      const session = new VM.CraftingCreationSession();
      const recipe = sandbox.J.JAFTING.EXT.CREATE.Metadata.recipesMap.get('vitest_recipe');

      const out = session.tryCraftRecipe(recipe);

      expect(out.crafted).toBe(false);
      expect(out.reason).toBe('requirements_not_met');
    });

    it('tryCraftRecipe consumes ingredients, grants outputs, and bumps proficiency when requirements are met', () =>
    {
      const session = new VM.CraftingCreationSession();
      const recipe = sandbox.J.JAFTING.EXT.CREATE.Metadata.recipesMap.get('vitest_recipe');

      vm.runInContext(`
        const ing = $dataItems[1];
        const outItem = $dataItems[2];
        $gameParty.gainItem(ing, 1);
        const beforeOut = $gameParty.numItems(outItem);
        const track = $gameParty.getRecipeTrackingByKey('vitest_recipe');
        const beforeProf = track.craftingProficiency();
      `, sandbox);

      const out = session.tryCraftRecipe(recipe);

      expect(out.crafted).toBe(true);
      expect(out.playedSuccessSound).toBe(true);
      expect(out.reason).toBe(null);

      vm.runInContext(`
        globalThis.__vitestAfterIng = $gameParty.numItems($dataItems[1]);
        globalThis.__vitestAfterOut = $gameParty.numItems($dataItems[2]);
        globalThis.__vitestAfterProf = $gameParty.getRecipeTrackingByKey('vitest_recipe').craftingProficiency();
      `, sandbox);

      expect(sandbox.__vitestAfterIng).toBe(0);
      expect(sandbox.__vitestAfterOut).toBe(1);
      expect(sandbox.__vitestAfterProf).toBe(1);
    });

    it('snapshot reflects phase, category, and last outcome', () =>
    {
      const session = new VM.CraftingCreationSession();

      session.enterRecipeBrowsing('vitest_cat');
      session.tryCraftRecipe(null);
      const snap = session.snapshot();

      expect(snap.phase).toBe(VM.CraftingCreationSession.Phase.BrowsingRecipes);
      expect(snap.categoryKey).toBe('vitest_cat');
      expect(snap.lastCraftOutcome.reason).toBe('no_recipe');
    });
  });

  describe('CraftingRecipe with party + database', () =>
  {
    it('canCraft requires tools as well as ingredients', () =>
    {
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

      const s2 = { console };
      loadJaftingCreationPluginVm(s2, { craftingJson: wideJson });
      installJaftingVmGamePartyBootstrap(s2);
      seedJaftingCreationDatabaseItems(s2);

      vm.runInContext(`
        const party = new Game_Party();
        party.initialize();
        party.__testItemContainer = {};
        $gameParty = party;
        JaftingSalvageManager.initPartySalvageStorage();
        const ing = $dataItems[1];
        $gameParty.gainItem(ing, 1);
        const recipe = J.JAFTING.EXT.CREATE.Metadata.recipesMap.get('needs_tool');
        globalThis.__vitestCanWithoutTool = recipe.canCraft();
        const tool = $dataItems[3];
        $gameParty.gainItem(tool, 1);
        globalThis.__vitestCanWithTool = recipe.canCraft();
      `, s2);

      expect(s2.__vitestCanWithoutTool).toBe(false);
      expect(s2.__vitestCanWithTool).toBe(true);
    });

    it('needsMasking and naming follow maskedUntilCrafted and craft history', () =>
    {
      const s3 = { console };
      loadJaftingCreationPluginVm(s3, { craftingJson: VITEST_MINIMAL_CRAFTING_JSON });
      installJaftingVmGamePartyBootstrap(s3);
      seedJaftingCreationDatabaseItems(s3);

      vm.runInContext(`
        const party = new Game_Party();
        party.initialize();
        party.__testItemContainer = {};
        $gameParty = party;
        JaftingSalvageManager.initPartySalvageStorage();
        const recipe = J.JAFTING.EXT.CREATE.Metadata.recipesMap.get('vitest_recipe');
        recipe.maskedUntilCrafted = true;
        globalThis.__vitestMaskedBefore = recipe.needsMasking();
        globalThis.__vitestNameBefore = recipe.getRecipeName();
        const ing = $dataItems[1];
        $gameParty.gainItem(ing, 1);
        recipe.craft();
        globalThis.__vitestMaskedAfter = recipe.needsMasking();
        globalThis.__vitestNameAfter = recipe.getRecipeName();
      `, s3);

      expect(s3.__vitestMaskedBefore).toBe(true);
      expect(s3.__vitestNameBefore).toMatch(/\?/);
      expect(s3.__vitestMaskedAfter).toBe(false);
      expect(s3.__vitestNameAfter).toBe('Vitest Recipe');
    });
  });

  describe('J.JAFTING.EXT.CREATE.Metadata', () =>
  {
    it('reports the shipped Creation plugin version', () =>
    {
      const md = sandbox.J.JAFTING.EXT.CREATE.Metadata;

      expect(md.name).toBe('J-JAFTING-Creation');
    });
  });

  describe('Window_RecipeDetails layout helpers', () =>
  {
    it('quarterWidthsFromInner floors width into four bands with remainder on the last', () =>
    {
      const { cw, remainder } = VM.Window_RecipeDetails.quarterWidthsFromInner(350);

      expect(cw).toBe(87);
      expect(remainder).toBe(350 - cw * 4);
      expect(cw * 4 + remainder).toBe(350);
    });

    it('quarterWidthsFromInner clamps each band to at least 80px', () =>
    {
      const { cw } = VM.Window_RecipeDetails.quarterWidthsFromInner(100);

      expect(cw).toBe(80);
    });

    it('componentListRowsInnerStartY matches the tallest of the three header stacks', () =>
    {
      const details = new VM.Window_RecipeDetails(new sandbox.Rectangle(0, 0, 520, 300));

      details.innerWidth = 480;
      details.lineHeight = function()
      {
        return 24;
      };
      details.textWidth = function(text)
      {
        return text.length * 6;
      };
      details.resetFontSettings = function()
      {
      };
      details.modFontSize = function()
      {
      };
      details.toggleBold = function()
      {
      };
      details.toggleItalics = function()
      {
      };

      const y = details.componentListRowsInnerStartY();

      expect(typeof y).toBe('number');
      expect(y).toBeGreaterThan(24 * 2);
    });
  });
});
//endregion plugins/jafting/creation-workflow.test.js
