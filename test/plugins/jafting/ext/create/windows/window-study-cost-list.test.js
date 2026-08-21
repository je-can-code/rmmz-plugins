//region plugins/jafting/ext/create/windows/window-study-cost-list.test.js
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { repoRoot } from '../../../../../setup/repo-root.js';
import {
  clearDrawnText,
  drawnText,
  installMinimalDatabase,
  installRmmzViewLayer,
} from '../../../../../setup/rmmz-view-harness.js';

/**
 * The price tag, against the real `Window_Command` rather than a stand-in.
 *
 * Two seams live here. The components have to be seeded in `initMembers`, because `initialize`
 * refreshes and refreshing maps over them- an unseeded list would throw before the window ever drew.
 * And the empty state is a branch of `drawAllItems` rather than a row, so a shelf with nothing
 * highlighted would otherwise render as a silently blank panel that looks like a failure to draw.
 */
describe('Window_StudyCostList', () =>
{
  let Window_StudyCostList;

  /**
   * Builds a cost component of the shape the price tag reads.
   * @param {string} name What the component is called.
   * @param {number} need How many the price asks for.
   * @param {number} have How many the party is carrying.
   * @returns {object} A component stand-in.
   */
  const componentFor = (name, need, have) => ({
    quantity: () => need,
    getHandledQuantity: () => have,
    getName: () => name,
    getIconIndex: () => 3,
  });

  /**
   * Reassembles everything the window drew into one string.
   * @returns {string} Every glyph drawn, in order.
   */
  const drawnPhrase = () => drawnText.join('');

  beforeAll(async () =>
  {
    installRmmzViewLayer();
    installMinimalDatabase();

    globalThis.$plugins = [];

    // J-Base owns `WindowCommandBuilder` and `Window_Command.addBuiltCommand`, both of which this
    // window builds through, and a plugin source file may never import across a ship boundary.
    const bundle = path.join(repoRoot, 'project/js/plugins/base/J-Base.js');
    vm.runInThisContext(fs.readFileSync(bundle, 'utf-8'), { filename: bundle });

    ({ default: Window_StudyCostList } = await import(
      '../../../../../../src/plugins/jafting/ext/create/windows/Window_StudyCostList.js'));
  });

  beforeEach(() =>
  {
    clearDrawnText();
  });

  it('seeds its components before the first refresh can map over them', () =>
  {
    // Arrange- a class field would be assigned after initialize has already refreshed.

    // Act
    const window = new Window_StudyCostList(new Rectangle(0, 0, 400, 300));

    // Assert
    expect(window.components())
      .toEqual([]);
  });

  it('says so plainly when nothing is highlighted, rather than drawing a blank panel', () =>
  {
    // Arrange
    const window = new Window_StudyCostList(new Rectangle(0, 0, 400, 300));
    clearDrawnText();

    // Act
    window.refresh();

    // Assert
    expect(drawnPhrase())
      .toContain('Nothing selected');
  });

  it('builds a row for every part of the price', () =>
  {
    // Arrange
    const window = new Window_StudyCostList(new Rectangle(0, 0, 400, 300));

    // Act
    window.setComponents([ componentFor('Scrap', 3, 5), componentFor('Ingot', 1, 0) ]);

    // Assert
    expect(window._list.length)
      .toBe(2);
  });

  it('colours a part the party can cover differently from one it cannot', () =>
  {
    // Arrange- both ask for the same amount, so only what is held can explain the difference.
    const window = new Window_StudyCostList(new Rectangle(0, 0, 400, 300));

    // Act
    window.setComponents([ componentFor('Covered', 3, 3), componentFor('Short', 3, 2) ]);

    // Assert- 24 is the enough-of-it colour, 18 the short-of-it one.
    expect(window._list[ 0 ].rightColor)
      .toBe(24);
    expect(window._list[ 1 ].rightColor)
      .toBe(18);
  });

  it('reports how many are missing when the party is short', () =>
  {
    // Arrange
    const window = new Window_StudyCostList(new Rectangle(0, 0, 400, 300));
    clearDrawnText();

    // Act
    window.setComponents([ componentFor('Short', 5, 2) ]);

    // Assert
    expect(drawnPhrase())
      .toContain('missing: 3');
  });

  it('says nothing about missing any when the party is covered', () =>
  {
    // Arrange- the near-miss to the above; only the amount held differs.
    const window = new Window_StudyCostList(new Rectangle(0, 0, 400, 300));
    clearDrawnText();

    // Act
    window.setComponents([ componentFor('Covered', 5, 5) ]);

    // Assert
    expect(drawnPhrase())
      .not
      .toContain('missing');
  });
});
//endregion plugins/jafting/ext/create/windows/window-study-cost-list.test.js