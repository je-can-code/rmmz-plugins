//region plugins/class/core/windows/window-class-parameters.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { clearDrawnText, drawnText } from '../../../../setup/rmmz-view-harness.js';
import { installClassCoreRealm } from '../_component/fixtures/install-class-core-realm.js';

/**
 * The Parameters page, drawn for real through J-CMS's catalog.
 *
 * What matters most here is the seam between three objects: the renderer asking this window what to note
 * beside a row, this window asking the service, and the preview the comparison is drawn against. A `×1.15`
 * beside `126 (+16)` is only possible when all three are wired together, so that is the assertion.
 */
describe('Window_ClassParameters', () =>
{
  let Window_ClassParameters;

  /**
   * Builds the page at the size the scene gives it.
   * @returns {Window_ClassParameters} The built window.
   */
  const buildPage = () => new Window_ClassParameters(new globalThis.Rectangle(0, 0, 1400, 900));

  /**
   * Everything the page draws for Brawler, compared against the starting class at level one: all fifteen rows,
   * each across its four columns, every value padded one digit at a time. A parameter Brawler moves reads its
   * multiplier, value and change; one it leaves alone reads ×1.00 and its standing value, with nothing beside
   * it. Max Tech and the last six have no multiplier here, since this realm has nothing that measures them.
   * @type {string[]}
   */
  const BRAWLER_COMPARED = [
    'Parameters',
    'Max HP', '×1.05', '0', '0', '0', '1', '1', '6', '(+6)',
    'Max MP', '×1.00', '0', '0', '0', '1', '1', '0',
    'Max Tech', '', '0', '0', '0', '0',
    'Attack', '×1.15', '0', '1', '2', '6', '(+16)',
    'M.Attack', '×0.90', '0', '0', '9', '9', '(-11)',
    'Defense', '×1.05', '0', '1', '1', '6', '(+6)',
    'M.Defense', '×0.90', '0', '0', '9', '9', '(-11)',
    'Agility', '×1.00', '0', '1', '1', '0',
    'Luck', '×1.00', '0', '1', '1', '0',
    'Accuracy', '', '0', '0', '0', '0',
    'Parry', '', '0', '0', '0', '0',
    'Crit Rate', '', '0', '0', '0', '0',
    'Crit Dodge', '', '0', '0', '0', '0',
    'Phys Evade', '', '0', '0', '0', '0',
    'Magic Evade', '', '0', '0', '0', '0',
  ];

  beforeAll(async () =>
  {
    await installClassCoreRealm();

    ({ default: Window_ClassParameters } = await import(
      '../../../../../src/plugins/class/core/windows/Window_ClassParameters.js'));
  });

  beforeEach(() =>
  {
    // actor 1 wears the starting class at level one, and nothing else.
    const actor = globalThis.$gameActors.actor(1);
    actor.initClassMembers();
    actor.changeClass(1, true);
    actor.changeLevel(1, false);
    actor.forceChangeEquip(0, null);
    clearDrawnText();
  });

  describe('accessors', () =>
  {
    it('starts with nobody shown, no class, no baseline and no preview', () =>
    {
      // Arrange
      // Act
      const page = buildPage();

      // Assert
      expect(page.actor())
        .toBeNull();
      expect(page.classId())
        .toBe(0);
      expect(page.baselineActor())
        .toBeNull();
      expect(page.previewActor())
        .toBeNull();
    });

    it('holds the actor, the class, the baseline and the preview it is handed', () =>
    {
      // Arrange
      const page = buildPage();
      const actor = globalThis.$gameActors.actor(1);
      const baseline = new globalThis.Game_Actor(1);
      const preview = globalThis.$gameActors.actor(2);

      // Act
      page.setActor(actor);
      page.setClassId(3);
      page.setBaselineActor(baseline);
      page.setPreviewActor(preview);

      // Assert
      expect(page.actor())
        .toBe(actor);
      expect(page.classId())
        .toBe(3);
      expect(page.baselineActor())
        .toBe(baseline);
      expect(page.previewActor())
        .toBe(preview);
    });
  });

  describe('showClass()', () =>
  {
    it('reads the actor raw, in the class they wear, with their gear left out', () =>
    {
      // Arrange- the sword adds 20 attack to the actor, and none to the baseline.
      const page = buildPage();
      const actor = globalThis.$gameActors.actor(1);
      actor.forceChangeEquip(0, globalThis.$dataWeapons[1]);

      // Act
      page.showClass(actor, 2);

      // Assert
      const baseline = page.baselineActor();
      expect(baseline)
        .not.toBe(actor);
      expect(baseline.currentClass().id)
        .toBe(1);
      expect(baseline.param(2))
        .toBe(110);
    });

    it('builds a preview of the actor standing in any other class', () =>
    {
      // Arrange
      const page = buildPage();
      const actor = globalThis.$gameActors.actor(1);

      // Act
      page.showClass(actor, 2);

      // Assert
      expect(page.previewActor()
        .currentClass().id)
        .toBe(2);
      expect(actor.currentClass().id)
        .toBe(1);
    });

    it('builds no preview for the class already worn, which is shown as it stands', () =>
    {
      // Arrange
      const page = buildPage();

      // Act
      page.showClass(globalThis.$gameActors.actor(1), 1);

      // Assert
      expect(page.previewActor())
        .toBeNull();
    });
  });

  describe('drawContent()', () =>
  {
    it('draws nothing until the scene points the page at a class', () =>
    {
      // Arrange
      const page = buildPage();
      clearDrawnText();

      // Act
      page.refresh();

      // Assert
      expect(drawnText)
        .toEqual([]);
    });

    it('lists every parameter for another class, with a change beside only the values it would move', () =>
    {
      // Arrange
      const page = buildPage();

      // Act
      page.showClass(globalThis.$gameActors.actor(1), 2);

      // Assert- the whole window, so a row going missing, a "(+0)" beside an unmoved value, or two figures fusing
      // into one, cannot pass.
      expect(drawnText)
        .toEqual(BRAWLER_COMPARED);
    });

    it('leaves the actor\'s gear out of every figure, on both sides of the comparison', () =>
    {
      // Arrange- wearing the sword, which would read as 130 (-4) against the actor, or 146 (+36) in the preview.
      const page = buildPage();
      const actor = globalThis.$gameActors.actor(1);
      actor.forceChangeEquip(0, globalThis.$dataWeapons[1]);

      // Act
      page.showClass(actor, 2);

      // Assert- exactly the rows the actor would draw wearing nothing.
      expect(drawnText)
        .toEqual(BRAWLER_COMPARED);
    });

    it('draws the class already worn raw, with the actor\'s gear left out', () =>
    {
      // Arrange- standing in Brawler and wearing the sword, whose 20 attack must not reach the row.
      const page = buildPage();
      const actor = globalThis.$gameActors.actor(1);
      actor.changeClass(2, true);
      actor.forceChangeEquip(0, globalThis.$dataWeapons[1]);

      // Act
      page.showClass(actor, 2);

      // Assert- the digits between Attack's multiplier and the next row are Attack's padded value: Brawler's raw
      // 126, where the sword would have made it 146.
      const attackStart = drawnText.indexOf('×1.15') + 1;
      const attackEnd = drawnText.indexOf('M.Attack');
      expect(drawnText.slice(attackStart, attackEnd))
        .toEqual([ '0', '1', '2', '6' ]);
    });

    it('lists every parameter of the class already worn as it stands', () =>
    {
      // Arrange- standing in Brawler, which would change nothing, so its values draw padded, one digit at a time.
      const page = buildPage();
      const actor = globalThis.$gameActors.actor(1);
      actor.changeClass(2, true);

      // Act
      page.showClass(actor, 2);

      // Assert- everything but the single digits and the empty multipliers: the title, the rows' names, and every
      // multiplier this realm measures, ×1.00 included.
      expect(drawnText.filter(text => text.length > 1))
        .toEqual([
          'Parameters',
          'Max HP', '×1.05',
          'Max MP', '×1.00',
          'Max Tech',
          'Attack', '×1.15',
          'M.Attack', '×0.90',
          'Defense', '×1.05',
          'M.Defense', '×0.90',
          'Agility', '×1.00',
          'Luck', '×1.00',
          'Accuracy',
          'Parry',
          'Crit Rate',
          'Crit Dodge',
          'Phys Evade',
          'Magic Evade',
        ]);
    });

    it('hands anything listed beneath the parameters the y just below their last row', () =>
    {
      // Arrange
      const page = buildPage();
      const drawAfter = vi.spyOn(page, 'drawAfterParameters');

      // Act
      page.showClass(globalThis.$gameActors.actor(1), 2);

      // Assert- the title, then all fifteen rows, at 32 apiece.
      expect(drawAfter)
        .toHaveBeenCalledWith(512);
    });
  });

  describe('drawEmptySectionRow()', () =>
  {
    it('draws the line standing in for a section with nothing in it', () =>
    {
      // Arrange- the line an extension's section draws when a class contributes nothing to it.
      const page = buildPage();
      clearDrawnText();

      // Act
      page.drawEmptySectionRow('Nothing', 10);

      // Assert
      expect(drawnText)
        .toEqual([ 'Nothing' ]);
    });
  });

  describe('drawAfterParameters()', () =>
  {
    it('lists nothing more on its own, handing back the y it was given', () =>
    {
      // Arrange
      const page = buildPage();
      clearDrawnText();

      // Act
      const y = page.drawAfterParameters(123);

      // Assert
      expect(y)
        .toBe(123);
      expect(drawnText)
        .toEqual([]);
    });
  });

  describe('layout', () =>
  {
    it('insets every row by the scene\'s shared inset, from either edge', () =>
    {
      // Arrange
      const page = buildPage();

      // Act
      const left = page.contentLeft();
      const right = page.contentRight();

      // Assert- 1400 wide leaves 1376 inside, and a tenth of that in from each side.
      expect([ left, right ])
        .toEqual([ 137, 1239 ]);
    });

    it('stacks the three figure columns in from the right edge, one gap apart, the name taking what is left', () =>
    {
      // Arrange- measured in the rows' own type, as a row draws them.
      const page = buildPage();
      page.resetFontSettings();
      page.makeFontSmaller();

      // Act
      const columns = page.parameterColumns();

      // Assert- the change ends at the right inset, each column 16 left of the next, and the name starts past
      // its icon and runs up to the multiplier.
      expect(columns)
        .toEqual({
          nameX: 173,
          nameWidth: 838,
          multiplierX: 1027,
          multiplierWidth: 50,
          valueX: 1093,
          valueWidth: 60,
          changeX: 1169,
          changeWidth: 70,
        });
    });
  });

  describe('font and spacing', () =>
  {
    it('spaces rows the way the equip scene\'s catalog does', () =>
    {
      // Arrange
      const page = buildPage();

      // Act
      const lineHeight = page.lineHeight();

      // Assert
      expect(lineHeight)
        .toBe(32);
    });

    it('shrinks text by two while it is still comfortably large', () =>
    {
      // Arrange
      const page = buildPage();
      page.contents.fontSize = 20;

      // Act
      page.makeFontSmaller();

      // Assert
      expect(page.contents.fontSize)
        .toBe(18);
    });

    it('stops shrinking text once it would stop being comfortable to read', () =>
    {
      // Arrange
      const page = buildPage();
      page.contents.fontSize = 19;

      // Act
      page.makeFontSmaller();

      // Assert
      expect(page.contents.fontSize)
        .toBe(19);
    });
  });
});
//endregion plugins/class/core/windows/window-class-parameters.test.js