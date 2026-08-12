//region plugins/jafting/ext/create/windows/window-study-recipe-list.test.js
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { repoRoot } from '../../../../../setup/repo-root.js';
import { installMinimalDatabase, installRmmzViewLayer } from '../../../../../setup/rmmz-view-harness.js';

/**
 * The shelf, against the real `Window_Command` rather than a stand-in.
 *
 * Three seams live here and none survives a stubbed base class. The current category has to be seeded
 * in `initMembers`, because `initialize` refreshes and refreshing builds the list from it- a class
 * field would be assigned too late and the first draw would ask the party for recipes of `undefined`.
 * The known-last ordering only exists in `buildCommands`, so nothing else can prove it happens. And the
 * enabled flag is what greys a row, which is the only thing telling a player why a row will not respond.
 */
describe('Window_StudyRecipeList', () =>
{
  let Window_StudyRecipeList;

  /**
   * Builds a recipe of the shape the shelf reads.
   * @param {string} key The recipe's key.
   * @param {boolean} affordable Whether the party can pay for it.
   * @returns {object} A recipe stand-in.
   */
  const recipeFor = (key, affordable) => ({
    key,
    cost: [],
    canAffordStudy: () => affordable,
    getUnmaskedRecipeName: () => `${key} name`,
    getUnmaskedRecipeIcon: () => 7,
  });

  /**
   * Stands up a party offering a given shelf, with a given set of recipes already learned.
   * @param {object[]} recipes What the shelf holds.
   * @param {string[]} knownKeys Which of them the party already knows.
   */
  const useShelf = (recipes, knownKeys) =>
  {
    globalThis.$gameParty = {
      getPurchasableRecipesByCategory: () => recipes,
      getRecipeTrackingByKey: key => ({ isUnlocked: () => knownKeys.includes(key) }),
    };
  };

  /**
   * Names the rows the shelf is currently offering, in order.
   * @param {Window_StudyRecipeList} window The window to read.
   * @returns {string[]} The command symbols.
   */
  const symbolsOf = window => window._list.map(command => command.symbol);

  beforeAll(async () =>
  {
    installRmmzViewLayer();
    installMinimalDatabase();

    globalThis.$plugins = [];

    // J-Base owns `WindowCommandBuilder` and `Window_Command.addBuiltCommand`, both of which this
    // window builds through. Loading the shipped bundle is how a J-Base global reaches a test, since a
    // plugin source file may never import across a ship boundary.
    const bundle = path.join(repoRoot, 'project/js/plugins/base/J-Base.js');
    vm.runInThisContext(fs.readFileSync(bundle, 'utf-8'), { filename: bundle });

    ({ default: Window_StudyRecipeList } = await import(
      '../../../../../../src/plugins/jafting/ext/create/windows/Window_StudyRecipeList.js'));
  });

  beforeEach(() =>
  {
    useShelf([], []);
  });

  describe('initMembers()', () =>
  {
    it('seeds the category before the first refresh can ask the party for one', () =>
    {
      // Arrange- a class field would be assigned after initialize has already refreshed.

      // Act
      const window = new Window_StudyRecipeList(new Rectangle(0, 0, 330, 400));

      // Assert
      expect(window.getCurrentCategory())
        .toBe(String.empty);
    });
  });

  describe('makeCommandList()', () =>
  {
    it('builds a row for every recipe the shelf holds', () =>
    {
      // Arrange
      useShelf([ recipeFor('alpha', true), recipeFor('beta', true) ], []);
      const window = new Window_StudyRecipeList(new Rectangle(0, 0, 330, 400));

      // Act
      window.setCurrentCategory('blades');

      // Assert
      expect(symbolsOf(window))
        .toEqual([ 'alpha', 'beta' ]);
    });

    it('sorts what is already known beneath what is not', () =>
    {
      // Arrange- the known one is authored first, so passing requires actually reordering.
      useShelf([ recipeFor('known', true), recipeFor('unknown', true) ], [ 'known' ]);
      const window = new Window_StudyRecipeList(new Rectangle(0, 0, 330, 400));

      // Act
      window.setCurrentCategory('blades');

      // Assert
      expect(symbolsOf(window))
        .toEqual([ 'unknown', 'known' ]);
    });

    it('greys a row the party can no longer buy, and enables one it can', () =>
    {
      // Arrange- both are affordable, so only the knowing of one can explain the difference.
      useShelf([ recipeFor('unknown', true), recipeFor('known', true) ], [ 'known' ]);
      const window = new Window_StudyRecipeList(new Rectangle(0, 0, 330, 400));

      // Act
      window.setCurrentCategory('blades');

      // Assert
      expect(window.isCommandEnabled(0))
        .toBe(true);
      expect(window.isCommandEnabled(1))
        .toBe(false);
    });

    it('greys a row the party cannot pay for', () =>
    {
      // Arrange- neither is known, so only the affording of one can explain the difference.
      useShelf([ recipeFor('rich', true), recipeFor('broke', false) ], []);
      const window = new Window_StudyRecipeList(new Rectangle(0, 0, 330, 400));

      // Act
      window.setCurrentCategory('blades');

      // Assert
      expect(window.isCommandEnabled(0))
        .toBe(true);
      expect(window.isCommandEnabled(1))
        .toBe(false);
    });

    it('reads names unmasked, since everything for sale is by definition uncrafted', () =>
    {
      // Arrange
      useShelf([ recipeFor('alpha', true) ], []);
      const window = new Window_StudyRecipeList(new Rectangle(0, 0, 330, 400));

      // Act
      window.setCurrentCategory('blades');

      // Assert
      expect(window._list[ 0 ].name)
        .toBe('alpha name');
    });
  });

  describe('setCurrentCategory()', () =>
  {
    it('rebuilds the shelf when the category changes', () =>
    {
      // Arrange
      useShelf([ recipeFor('alpha', true) ], []);
      const window = new Window_StudyRecipeList(new Rectangle(0, 0, 330, 400));
      window.setCurrentCategory('blades');

      // Act
      useShelf([ recipeFor('beta', true) ], []);
      window.setCurrentCategory('spears');

      // Assert
      expect(symbolsOf(window))
        .toEqual([ 'beta' ]);
    });

    it('leaves the shelf alone when handed the category it already shows', () =>
    {
      // Arrange- the shelf contents are swapped underneath, so a needless rebuild would be visible.
      useShelf([ recipeFor('alpha', true) ], []);
      const window = new Window_StudyRecipeList(new Rectangle(0, 0, 330, 400));
      window.setCurrentCategory('blades');

      // Act
      useShelf([ recipeFor('beta', true) ], []);
      window.setCurrentCategory('blades');

      // Assert
      expect(symbolsOf(window))
        .toEqual([ 'alpha' ]);
    });
  });
});
//endregion plugins/jafting/ext/create/windows/window-study-recipe-list.test.js