//region plugins/jafting/ext/create/windows/window-craft-confirmation.test.js
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { repoRoot } from '../../../../../setup/repo-root.js';
import {
  clearDrawnText,
  drawnText,
  installMinimalDatabase,
  installRmmzViewLayer,
} from '../../../../../setup/rmmz-view-harness.js';

/**
 * The craft confirmation prompt, against the real `Window_Command` rather than a stand-in.
 *
 * Three seams live here and none survives a stubbed base class. The count has to be seeded in
 * `initMembers`, because `initialize` refreshes and refreshing builds the command list from it. The four
 * cursor overrides only mean anything because vanilla's versions are no-ops in a one-column,
 * single-page list - if a future engine changes either guard, these inputs quietly stop adjusting the
 * count and start moving the cursor instead. And the readout is drawn into space below the list, which
 * only fits while the window's arithmetic and the height the scene reserves agree.
 */
describe('Window_CraftConfirmation', () =>
{
  let Window_CraftConfirmation;

  /**
   * Builds the window at exactly the rectangle the scene gives it.
   *
   * The height matters: the readout is drawn into the space left over below the two answers, so a
   * generously-sized test rectangle would hide the very overflow these tests exist to catch.
   * @returns {Window_CraftConfirmation} The freshly constructed window.
   */
  const buildWindow = () =>
  {
    // mirrors `Scene_JaftingCreate.getCraftConfirmationRectangle` exactly: two selectable answer rows, then the
    // single quantity line. Measuring the readout in selectable rows instead would hand the window eight pixels of
    // slack per row, and the overflow these tests exist to catch would hide inside it.
    const answerRows = Window_Selectable.prototype.fittingHeight(2);
    const readoutLines = Window_Base.prototype.lineHeight();
    const height = answerRows + readoutLines + Window_CraftConfirmation.DividerGap;

    return new Window_CraftConfirmation(new Rectangle(0, 0, 620, height));
  };

  /**
   * Names the answers the window is currently offering, in order.
   * @param {Window_CraftConfirmation} window The window to read.
   * @returns {string[]} The command symbols.
   */
  const symbolsOf = window => window._list.map(command => command.symbol);

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

    // J-Base owns `WindowCommandBuilder`, `Window_Command.addBuiltCommand`, `drawHorizontalLine` and
    // `modFontSize`, all four of which this window draws through. Loading the shipped bundle is how a
    // J-Base global reaches a test, since a plugin source file may never import across a ship boundary.
    const bundle = path.join(repoRoot, 'project/js/plugins/base/J-Base.js');
    vm.runInThisContext(fs.readFileSync(bundle, 'utf-8'), { filename: bundle });

    ({ default: Window_CraftConfirmation } = await import(
      '../../../../../../src/plugins/jafting/ext/create/windows/Window_CraftConfirmation.js'));
  });

  beforeEach(() =>
  {
    clearDrawnText();

    // the real `SoundManager` reaches for audio buffers that do not exist here, and every adjustment
    // asks it for a cursor blip.
    vi.spyOn(SoundManager, 'playCursor')
      .mockImplementation(() => {});
  });

  //region state seeded early enough to be seen
  describe('initMembers()', () =>
  {
    it('seeds the count at one, so the first draw offers a single craft rather than nothing', () =>
    {
      // Arrange
      // Act
      const window = buildWindow();

      // Assert
      expect(window.count())
        .toBe(1);
    });

    it('seeds the ceiling at one, so the list can be built before any recipe has been named', () =>
    {
      // Arrange
      // Act
      const window = buildWindow();

      // Assert
      expect(window.maximum())
        .toBe(1);
    });
  });
  //endregion state seeded early enough to be seen

  //region the two answers
  describe('makeCommandList()', () =>
  {
    it('offers exactly the two answers, with the craft ahead of the retreat', () =>
    {
      // Arrange
      // Act
      const window = buildWindow();

      // Assert
      expect(symbolsOf(window))
        .toEqual([ 'craft-confirm', 'craft-cancel' ]);
    });
  });

  describe('buildConfirmCommand()', () =>
  {
    it('says it plainly at a count of one, rather than naming a quantity of one', () =>
    {
      // Arrange
      const window = buildWindow();

      // Act
      const command = window.buildConfirmCommand();

      // Assert
      expect(command.name)
        .toBe('Craft it');
    });

    it('names the quantity above one, so the label states what confirming will spend', () =>
    {
      // Arrange
      const window = buildWindow();
      window.setMaximum(26);

      // Act
      window.setCount(4);

      // Assert
      expect(window.buildConfirmCommand().name)
        .toBe('Craft all 4');
    });
  });
  //endregion the two answers

  //region the ceiling and the count
  describe('setMaximum()', () =>
  {
    it('takes the ceiling at face value, since both routes in have already proven one is affordable', () =>
    {
      // Arrange
      const window = buildWindow();

      // Act
      window.setMaximum(26);

      // Assert
      expect(window.maximum())
        .toBe(26);
    });

    it('starts the count back at one, so a mistimed confirm costs a single craft', () =>
    {
      // Arrange
      const window = buildWindow();
      window.setMaximum(26);
      window.setCount(20);

      // Act
      window.setMaximum(30);

      // Assert
      expect(window.count())
        .toBe(1);
    });
  });

  describe('setCount()', () =>
  {
    it('clamps down to the ceiling, so no craft can be asked for that the stock cannot pay', () =>
    {
      // Arrange
      const window = buildWindow();
      window.setMaximum(26);

      // Act
      window.setCount(999);

      // Assert
      expect(window.count())
        .toBe(26);
    });

    it('clamps up to one, so the prompt can never offer a craft of nothing', () =>
    {
      // Arrange
      const window = buildWindow();
      window.setMaximum(26);

      // Act
      window.setCount(-5);

      // Assert
      expect(window.count())
        .toBe(1);
    });
  });

  describe('adjustCount()', () =>
  {
    it('blips the cursor when the count actually moved', () =>
    {
      // Arrange
      const window = buildWindow();
      window.setMaximum(26);

      // Act
      window.adjustCount(1);

      // Assert
      expect(SoundManager.playCursor)
        .toHaveBeenCalledTimes(1);
    });

    it('stays silent when the clamp swallowed the whole adjustment', () =>
    {
      // Arrange
      const window = buildWindow();
      window.setMaximum(26);
      window.setCount(26);
      SoundManager.playCursor.mockClear();

      // Act
      window.adjustCount(1);

      // Assert
      expect(SoundManager.playCursor)
        .not
        .toHaveBeenCalled();
    });
  });
  //endregion the ceiling and the count

  //region inputs vanilla leaves free
  describe('cursorRight()', () =>
  {
    it('adds one to the count, in place of a column move a one-column list cannot make', () =>
    {
      // Arrange
      const window = buildWindow();
      window.setMaximum(26);

      // Act
      window.cursorRight(false);

      // Assert
      expect(window.count())
        .toBe(2);
    });
  });

  describe('cursorLeft()', () =>
  {
    it('removes one from the count', () =>
    {
      // Arrange
      const window = buildWindow();
      window.setMaximum(26);
      window.setCount(5);

      // Act
      window.cursorLeft(false);

      // Assert
      expect(window.count())
        .toBe(4);
    });
  });

  describe('cursorPagedown()', () =>
  {
    it('adds the coarse step, in place of a page scroll a two-row list cannot make', () =>
    {
      // Arrange
      const window = buildWindow();
      window.setMaximum(26);

      // Act
      window.cursorPagedown();

      // Assert
      expect(window.count())
        .toBe(1 + Window_CraftConfirmation.CoarseStep);
    });
  });

  describe('cursorPageup()', () =>
  {
    it('removes the coarse step, flooring at one rather than falling through to nothing', () =>
    {
      // Arrange
      const window = buildWindow();
      window.setMaximum(26);
      window.setCount(5);

      // Act
      window.cursorPageup();

      // Assert
      expect(window.count())
        .toBe(1);
    });
  });

  describe('vanilla cursor behavior these replace', () =>
  {
    it('leaves the cursor where it was, since adjusting the count is not a selection change', () =>
    {
      // Arrange
      const window = buildWindow();
      window.setMaximum(26);
      window.select(0);

      // Act
      window.cursorRight(false);

      // Assert
      expect(window.index())
        .toBe(0);
    });
  });
  //endregion inputs vanilla leaves free

  //region the readout at the base
  describe('paint()', () =>
  {
    it('draws the readout as well as the answers, which vanilla paint would have omitted', () =>
    {
      // Arrange
      const window = buildWindow();
      window.setMaximum(26);
      clearDrawnText();

      // Act
      window.paint();

      // Assert- the heading, specifically. the ceiling is drawn by the answer row above it, so asserting on that
      // would survive this whole block being deleted.
      expect(drawnPhrase())
        .toContain('Ingredients used');
    });

    it('puts the ceiling on the answer, where it reads as crafts rather than as ingredients', () =>
    {
      // Arrange
      const window = buildWindow();
      window.setMaximum(26);

      // Act
      const command = window.buildConfirmCommand();

      // Assert
      expect(command.rightText)
        .toBe('1 / 26');
    });

    it('rules off beneath the last answer rather than through it', () =>
    {
      // Arrange
      const window = buildWindow();
      window.setMaximum(26);
      let ruleY = -1;
      vi.spyOn(window, 'drawHorizontalLine')
        .mockImplementation((x, y) =>
        {
          ruleY = y;
        });

      // Act
      window.paint();

      // Assert
      const lastAnswer = window.itemRect(1);
      expect(ruleY)
        .toBeGreaterThanOrEqual(lastAnswer.y + lastAnswer.height);
    });

    it('keeps every drawn line inside the contents at the height the scene reserves', () =>
    {
      // Arrange
      const window = buildWindow();
      window.setMaximum(26);
      const drawnRows = [];
      vi.spyOn(window, 'drawText')
        .mockImplementation((text, x, y) =>
        {
          drawnRows.push(y);
        });

      // Act
      window.paint();

      // Assert
      const lowestRow = Math.max(...drawnRows);
      expect(lowestRow + window.lineHeight())
        .toBeLessThanOrEqual(window.innerHeight);
    });
  });
  //endregion the readout at the base

  //region the bill, and the shape it forces
  describe('setSpendLines()', () =>
  {
    /**
     * A resolved cost line, shaped as `RecipeSpendResolver` hands them over.
     * @param {string} name What the entry is called.
     * @param {number} perCraft How many one craft takes.
     * @param {number} held How many the party holds.
     * @returns {object} The stand-in line.
     */
    const spendLine = (name, perCraft, held) => ({
      name,
      iconIndex: 1,
      perCraft,
      held,
    });

    it('grows the window by one line for each thing being spent', () =>
    {
      // Arrange
      const window = buildWindow();
      const before = window.requiredHeight();

      // Act
      window.setSpendLines([ spendLine('Big Gelatin', 1, 26), spendLine('Flank Steak', 1, 16) ]);

      // Assert
      expect(window.requiredHeight() - before)
        .toBe(window.lineHeight() * 2);
    });

    it('re-centers vertically after resizing, so the prompt does not drift down the screen', () =>
    {
      // Arrange
      const window = buildWindow();

      // Act
      window.setSpendLines([ spendLine('Big Gelatin', 1, 26) ]);

      // Assert
      const expectedY = Math.floor((Graphics.boxHeight - window.height) / 2);
      expect(window.y)
        .toBe(expectedY);
    });

    it('keeps the legend inside the contents once the bill has made the window taller', () =>
    {
      // Arrange
      const window = buildWindow();
      window.setMaximum(26);
      window.setSpendLines([ spendLine('Big Gelatin', 1, 26), spendLine('Flank Steak', 2, 16) ]);
      const drawnRows = [];
      vi.spyOn(window, 'drawText')
        .mockImplementation((text, x, y) =>
        {
          drawnRows.push(y);
        });

      // Act
      window.paint();

      // Assert
      const lowestRow = Math.max(...drawnRows);
      expect(lowestRow + window.lineHeight())
        .toBeLessThanOrEqual(window.innerHeight);
    });
  });

  describe('drawSpending()', () =>
  {
    /**
     * A resolved cost line, shaped as `RecipeSpendResolver` hands them over.
     * @param {string} name What the entry is called.
     * @param {number} perCraft How many one craft takes.
     * @param {number} held How many the party holds.
     * @returns {object} The stand-in line.
     */
    const spendLine = (name, perCraft, held) => ({
      name,
      iconIndex: 1,
      perCraft,
      held,
    });

    it('multiplies each cost by the batch size, so the bill moves with the count', () =>
    {
      // Arrange
      const window = buildWindow();
      window.setMaximum(26);
      window.setSpendLines([ spendLine('Big Gelatin', 2, 26) ]);
      window.setCount(4);
      clearDrawnText();

      // Act
      window.paint();

      // Assert
      expect(drawnPhrase())
        .toContain('x8');
    });

    it('names the entry being spent, which is the whole reason the block exists', () =>
    {
      // Arrange
      const window = buildWindow();
      window.setMaximum(26);
      window.setSpendLines([ spendLine('Big Gelatin', 1, 26) ]);
      clearDrawnText();

      // Act
      window.paint();

      // Assert
      expect(drawnPhrase())
        .toContain('Big Gelatin');
    });

    it('reports a cost that outruns the shelf, rather than drawing it as ordinary', () =>
    {
      // Arrange
      const window = buildWindow();
      window.setMaximum(26);
      window.setSpendLines([ spendLine('Big Gelatin', 1, 3) ]);
      window.setCount(10);
      const colors = [];
      vi.spyOn(window, 'changeTextColor')
        .mockImplementation(color =>
        {
          colors.push(color);
        });

      // Act
      window.paint();

      // Assert
      expect(colors)
        .toContain(ColorManager.textColor(18));
    });

    it('draws an affordable cost in the ordinary color', () =>
    {
      // Arrange
      const window = buildWindow();
      window.setMaximum(26);
      window.setSpendLines([ spendLine('Big Gelatin', 1, 26) ]);
      const colors = [];
      vi.spyOn(window, 'changeTextColor')
        .mockImplementation(color =>
        {
          colors.push(color);
        });

      // Act
      window.paint();

      // Assert
      expect(colors)
        .toContain(ColorManager.textColor(24));
    });
  });
  //endregion the bill, and the shape it forces
});
//endregion plugins/jafting/ext/create/windows/window-craft-confirmation.test.js