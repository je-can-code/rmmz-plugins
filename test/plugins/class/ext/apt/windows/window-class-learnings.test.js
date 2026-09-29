//region plugins/class/ext/apt/windows/window-class-learnings.test.js
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { clearDrawnText, drawnText } from '../../../../../setup/rmmz-view-harness.js';
import { BRAWLER_ICON_INDEX } from '../../../core/_component/fixtures/install-class-core-realm.js';
import { installClassAptRealm, loadSkillSlotsNamespace } from '../_component/fixtures/install-class-apt-realm.js';

/**
 * The window beside the class's parameters: J-Aptitude's own source-details window, pointed at a class.
 */
describe('Window_ClassLearnings', () =>
{
  let Window_ClassLearnings;
  let skillSlotsNamespace;

  /**
   * Builds the window at the size the scene gives it beside the parameters.
   * @returns {Window_ClassLearnings} The built window.
   */
  const buildPage = () => new Window_ClassLearnings(new globalThis.Rectangle(0, 0, 749, 960));

  beforeAll(async () =>
  {
    await installClassAptRealm();
    skillSlotsNamespace = await loadSkillSlotsNamespace();

    ({ default: Window_ClassLearnings } = await import(
      '../../../../../../src/plugins/class/ext/apt/windows/Window_ClassLearnings.js'));
  });

  beforeEach(() =>
  {
    globalThis.$gameActors.actor(1)
      .initAptitudeMembers();
    clearDrawnText();
  });

  afterEach(() =>
  {
    // every test that installed J-SkillSlots takes it away again.
    delete globalThis.J.SKS;
  });

  describe('showClass()', () =>
  {
    it('lists every skill the class teaches', () =>
    {
      // Arrange
      const page = buildPage();

      // Act
      page.showClass(globalThis.$gameActors.actor(1), 2);

      // Assert- Brawler's two skills, and not Scholar's.
      const drawn = drawnText.join('\n');
      expect(drawn)
        .toContain('Wide Swing');
      expect(drawn)
        .toContain('Stomp');
      expect(drawn)
        .not.toContain('Ponder');
    });

    it('points the page at the class and the actor', () =>
    {
      // Arrange
      const page = buildPage();
      const actor = globalThis.$gameActors.actor(1);

      // Act
      page.showClass(actor, 3);

      // Assert
      expect(page.source())
        .toBe(globalThis.$dataClasses[3]);
      expect(page.actor())
        .toBe(actor);
    });

    it('shows how far along a skill is that the worn class only lends, rather than marking it KNOWN', () =>
    {
      // Arrange- the starting class lends Wide Swing, so the actor can use it without having learned it.
      const page = buildPage();
      const actor = globalThis.$gameActors.actor(1);
      clearDrawnText();

      // Act
      page.showClass(actor, 2);

      // Assert- the lend is real, and Wide Swing's row still reads its progress.
      expect(actor.hasSkill(1))
        .toBe(true);
      const wideSwingIndex = drawnText.indexOf('Wide Swing', drawnText.indexOf('Skills'));
      expect(drawnText[wideSwingIndex + 1])
        .toBe('0/50');
    });

    it('marks a skill the actor has learned for good some other way as KNOWN', () =>
    {
      // Arrange- Stomp learned outright, the way a level-up or an event would teach it.
      const page = buildPage();
      const actor = globalThis.$gameActors.actor(1);
      actor.learnSkill(2);
      clearDrawnText();

      // Act
      page.showClass(actor, 2);
      actor.forgetSkill(2);

      // Assert- Wide Swing, lent rather than learned, keeps its progress beside it.
      const wideSwingIndex = drawnText.indexOf('Wide Swing', drawnText.indexOf('Skills'));
      const stompIndex = drawnText.indexOf('Stomp');
      expect(drawnText[stompIndex + 1])
        .toBe('KNOWN');
      expect(drawnText[wideSwingIndex + 1])
        .toBe('0/50');
    });

    it('redraws the same class for a different actor, which the window would not do on its own', () =>
    {
      // Arrange
      const page = buildPage();
      page.showClass(globalThis.$gameActors.actor(1), 3);
      clearDrawnText();

      // Act
      page.showClass(globalThis.$gameActors.actor(2), 3);

      // Assert
      expect(page.actor())
        .toBe(globalThis.$gameActors.actor(2));
      expect(drawnText.join('\n'))
        .toContain('Ponder');
    });
  });

  describe('drawHeader()', () =>
  {
    it('starts straight on the ladder for a class keeping nothing known, with no header of the source\'s own', () =>
    {
      // Arrange- without J-SkillSlots there is no such thing as an unslotted skill, whatever Brawler carries.
      const page = buildPage();
      clearDrawnText();

      // Act
      page.showClass(globalThis.$gameActors.actor(1), 2);

      // Assert- neither the class's name nor J-Aptitude's description of the worn class, and the ladder's
      // title is the first thing drawn. The empty entries are the text between escape codes.
      const drawn = drawnText.join('\n');
      expect(drawn)
        .not.toContain('Brawler');
      expect(drawn)
        .not.toContain('The class applied to the current actor.');
      expect(drawnText)
        .toEqual([ '', '', 'Skills', '', '', 'Wide Swing', '0/50', '', 'Stomp', '0/750' ]);
    });

    it('lists what the class keeps known above the skills it teaches', () =>
    {
      // Arrange
      globalThis.J.SKS = skillSlotsNamespace;
      const page = buildPage();
      clearDrawnText();

      // Act
      page.showClass(globalThis.$gameActors.actor(1), 2);

      // Assert- Brawler keeps Wide Swing and Ponder known across two tags that share Wide Swing, listed once
      // each and in database order, before its own ladder. The empty entries are the text between escape codes.
      expect(drawnText)
        .toEqual([
          '', '', 'Always known',
          '', '', 'Wide Swing',
          '', 'Ponder',
          '', '', 'Skills',
          '', '', 'Wide Swing', '0/50',
          '', 'Stomp', '0/750',
        ]);
    });

    it('titles what the class keeps known under the class\'s own icon', () =>
    {
      // Arrange- Brawler has an icon of its own, where the configured class icon would stand in for one.
      globalThis.J.SKS = skillSlotsNamespace;
      const page = buildPage();
      const drawIcon = vi.spyOn(page, 'drawIcon');

      // Act
      page.showClass(globalThis.$gameActors.actor(1), 2);

      // Assert- the title's icon is the first one drawn.
      const [ [ titleIconIndex ] ] = drawIcon.mock.calls;
      expect(titleIconIndex)
        .toBe(BRAWLER_ICON_INDEX);
    });

    it('starts the ladder beneath what the class keeps known, after half a line of air', () =>
    {
      // Arrange- the same class, first without anything kept known and then with it.
      const page = buildPage();
      page.showClass(globalThis.$gameActors.actor(1), 2);
      const withoutSection = page.nextY();
      globalThis.J.SKS = skillSlotsNamespace;

      // Act
      page.refresh();

      // Assert- the difference is a title, two rows, and half a line, at 32 a line.
      expect(page.nextY() - withoutSection)
        .toBe(112);
    });
  });

  describe('the ladder\'s spacing', () =>
  {
    it('starts every row the class scene\'s shared inset in from the left edge', () =>
    {
      // Arrange
      const page = buildPage();

      // Act
      const left = page.contentLeft();

      // Assert- 749 wide leaves 725 inside, and a tenth of that is the inset.
      expect(left)
        .toBe(72);
    });

    it('anchors each shortened gauge against the right side, the same inset in from the edge', () =>
    {
      // Arrange
      const page = buildPage();

      // Act
      const gaugeX = page.teachableGaugeX();

      // Assert- the 120-wide gauge ends 72 short of the 725-wide contents' right edge.
      expect(gaugeX)
        .toBe(533);
    });

    it('ends each status just short of its gauge', () =>
    {
      // Arrange
      const page = buildPage();

      // Act
      const statusRight = page.teachableStatusRight();

      // Assert- the window's own item padding short of the gauge.
      expect(statusRight)
        .toBe(525);
    });

    it('spaces rows the way the parameters beside it are spaced', () =>
    {
      // Arrange
      const page = buildPage();

      // Act
      const lineHeight = page.lineHeight();

      // Assert- the class scene's shared row height, shorter than the menus' standard 36.
      expect(lineHeight)
        .toBe(32);
    });

    it('draws everything a step smaller than the menus\' own type', () =>
    {
      // Arrange- the menus' own type at 26.
      const page = buildPage();
      const mainFontSize = vi.spyOn(globalThis.$gameSystem, 'mainFontSize')
        .mockReturnValue(26);

      // Act
      page.resetFontSettings();
      mainFontSize.mockRestore();

      // Assert
      expect(page.contents.fontSize)
        .toBe(24);
    });
  });
});
//endregion plugins/class/ext/apt/windows/window-class-learnings.test.js