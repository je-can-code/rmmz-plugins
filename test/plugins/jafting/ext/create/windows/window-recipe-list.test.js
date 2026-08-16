//region plugins/jafting/ext/create/windows/window-recipe-list.test.js
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { repoRoot } from '../../../../../setup/repo-root.js';
import { installMinimalDatabase, installRmmzViewLayer } from '../../../../../setup/rmmz-view-harness.js';

/**
 * The recipe column, against the real `Window_Command` rather than a stand-in.
 *
 * This list is what the player walks with L2/R2 now that the category drill-down is gone, so both of its
 * filters have to hold at once: the tab decides which lane is on screen, and the craftable-only toggle
 * decides whether the lane shows what you cannot yet cook. Neither is observable except through the built
 * command list, and the list is only rebuilt on refresh.
 */
describe('Window_RecipeList', () =>
{
  let Window_RecipeList;

  /**
   * Builds a recipe of the shape the column reads.
   * @param {string} key The recipe's key.
   * @param {string[]} categoryKeys The lanes the recipe is filed under.
   * @param {boolean} craftable Whether the party holds everything it asks for.
   * @returns {object} A recipe stand-in.
   */
  const recipeFor = (key, categoryKeys, craftable) => ({
    key,
    categoryKeys,
    canCraft: () => craftable,
    getRecipeName: () => `${key} name`,
    getRecipeDescription: () => `${key} description`,
    getRecipeIcon: () => 7,
    needsMasking: () => false,
  });

  /**
   * Stands up a party that has learned the given recipes.
   * @param {object[]} recipes What the party knows.
   */
  const useKnownRecipes = recipes =>
  {
    globalThis.$gameParty = {
      getUnlockedRecipes: () => recipes,
    };
  };

  /**
   * Names the rows the column is currently showing, in order.
   * @param {Window_RecipeList} window The window to read.
   * @returns {string[]} The command symbols.
   */
  const symbolsOf = window => window._list.map(command => command.symbol);

  beforeAll(async () =>
  {
    installRmmzViewLayer();
    installMinimalDatabase();

    globalThis.$plugins = [];

    // J-Base owns `WindowCommandBuilder`, `Window_FilterableList` and `Window_Command.addBuiltCommand`.
    // Loading the shipped bundle is how a J-Base global reaches a test, since a plugin source file may
    // never import across a ship boundary.
    const bundle = path.join(repoRoot, 'project/js/plugins/base/J-Base.js');
    vm.runInThisContext(fs.readFileSync(bundle, 'utf-8'), { filename: bundle });

    ({ default: Window_RecipeList } = await import(
      '../../../../../../src/plugins/jafting/ext/create/windows/Window_RecipeList.js'));
  });

  beforeEach(() =>
  {
    useKnownRecipes([]);
  });

  describe('initialFilterKey()', () =>
  {
    it('opens on no lane rather than the everything-sentinel, which no recipe is filed under', () =>
    {
      // Arrange & Act
      const window = new Window_RecipeList(new Rectangle(0, 0, 330, 400));

      // Assert
      expect(window.getCurrentCategory())
        .toBe(String.empty);
    });
  });

  describe('setCurrentCategory()', () =>
  {
    it('shows only the recipes filed under the chosen lane', () =>
    {
      // Arrange- a near-miss sibling in another lane that has to be excluded, so "matches this lane" and
      // "matches everything" cannot both satisfy the assertion.
      useKnownRecipes([
        recipeFor('scrambies', [ 'cook-protein' ], true),
        recipeFor('porridge', [ 'cook-carb' ], true),
      ]);
      const window = new Window_RecipeList(new Rectangle(0, 0, 330, 400));

      // Act
      window.setCurrentCategory('cook-protein');

      // Assert
      expect(symbolsOf(window))
        .toEqual([ 'scrambies' ]);
    });

    it('keeps a recipe filed under more than one lane', () =>
    {
      // Arrange
      useKnownRecipes([ recipeFor('shared', [ 'cook-carb', 'cook-protein' ], true) ]);
      const window = new Window_RecipeList(new Rectangle(0, 0, 330, 400));

      // Act
      window.setCurrentCategory('cook-protein');

      // Assert
      expect(symbolsOf(window))
        .toEqual([ 'shared' ]);
    });
  });

  describe('toggleActionableOnly()', () =>
  {
    it('drops rows the party cannot cook once the filter is on', () =>
    {
      // Arrange- a craftable recipe beside an uncraftable one in the same lane.
      useKnownRecipes([
        recipeFor('affordable', [ 'cook-protein' ], true),
        recipeFor('missing-parts', [ 'cook-protein' ], false),
      ]);
      const window = new Window_RecipeList(new Rectangle(0, 0, 330, 400));
      window.setCurrentCategory('cook-protein');

      // Act
      window.toggleActionableOnly();

      // Assert
      expect(symbolsOf(window))
        .toEqual([ 'affordable' ]);
    });

    it('restores the uncookable rows when toggled back off', () =>
    {
      // Arrange
      useKnownRecipes([
        recipeFor('affordable', [ 'cook-protein' ], true),
        recipeFor('missing-parts', [ 'cook-protein' ], false),
      ]);
      const window = new Window_RecipeList(new Rectangle(0, 0, 330, 400));
      window.setCurrentCategory('cook-protein');
      window.toggleActionableOnly();

      // Act
      window.toggleActionableOnly();

      // Assert
      expect(symbolsOf(window))
        .toEqual([ 'affordable', 'missing-parts' ]);
    });

    it('stays inside the active lane while hiding what cannot be cooked', () =>
    {
      // Arrange- the other lane holds a craftable recipe, which the lane filter must still exclude.
      useKnownRecipes([
        recipeFor('affordable', [ 'cook-protein' ], true),
        recipeFor('missing-parts', [ 'cook-protein' ], false),
        recipeFor('other-lane', [ 'cook-carb' ], true),
      ]);
      const window = new Window_RecipeList(new Rectangle(0, 0, 330, 400));
      window.setCurrentCategory('cook-protein');

      // Act
      window.toggleActionableOnly();

      // Assert
      expect(symbolsOf(window))
        .toEqual([ 'affordable' ]);
    });
  });
});

//endregion plugins/jafting/ext/create/windows/window-recipe-list.test.js
