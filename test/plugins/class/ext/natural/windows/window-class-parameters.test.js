//region plugins/class/ext/natural/windows/window-class-parameters.test.js
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { clearDrawnText, drawnText } from '../../../../../setup/rmmz-view-harness.js';
import { installClassNaturalRealm } from '../_component/fixtures/install-class-natural-realm.js';

/**
 * The growth section J-Classes-Natural lists beneath a class's parameters, drawn for real against
 * J-NaturalGrowth's bindings.
 */
describe('Window_ClassParameters (J-Classes-Natural)', () =>
{
  /**
   * Builds the parameters window at the size the scene gives it beside a side window.
   * @returns {Window_ClassParameters} The built window.
   */
  const buildWindow = () => new globalThis.Window_ClassParameters(new globalThis.Rectangle(0, 0, 749, 960));

  /**
   * The rows the growth section drew, from its title on.
   * @returns {string[]} The drawn text, without the parameters above it.
   */
  const growthText = () => drawnText.slice(drawnText.indexOf('Growth per level'));

  beforeAll(async () =>
  {
    await installClassNaturalRealm();

    await import('../../../../../../src/plugins/class/ext/natural/windows/Window_ClassParameters.js');
  });

  beforeEach(() =>
  {
    const actor = globalThis.$gameActors.actor(1);
    actor.changeClass(1, true);
    actor.changeLevel(1, false);
    clearDrawnText();
  });

  describe('drawAfterParameters()', () =>
  {
    it('lists what the class grants per level beneath the parameters, and nothing else', () =>
    {
      // Arrange
      const window = buildWindow();

      // Act
      window.showClass(globalThis.$gameActors.actor(1), 2);

      // Assert- every amount formatted by its parameter's own definition, the same as the status screen, and
      // none of Brawler's buffs listed after them.
      expect(drawnText.indexOf('Growth per level'))
        .toBeGreaterThan(drawnText.indexOf('Parameters'));
      expect(growthText())
        .toEqual([
          'Growth per level',
          'Attack',
          '+1.2',
          'Agility',
          '+1',
          'Crit Rate',
          '+1.5',
        ]);
    });

    it('shows the class\'s buffs among the parameters, in their values and their multipliers', () =>
    {
      // Arrange- Brawler buffs accuracy by three per level against the starting class's one, and max tech by
      // the same flat 50.
      const window = buildWindow();

      // Act
      window.showClass(globalThis.$gameActors.actor(1), 2);

      // Assert- accuracy reads ×3.00 and three, up two; max tech reads ×1.00 and its standing 50, since Brawler
      // would leave it where it is. Both padded, one digit at a time.
      const parameterText = drawnText.slice(0, drawnText.indexOf('Growth per level'));
      const accuracyAt = parameterText.indexOf('Accuracy');
      const maxTechAt = parameterText.indexOf('Max Tech');
      expect(parameterText.slice(accuracyAt, accuracyAt + 7))
        .toEqual([ 'Accuracy', '×3.00', '0', '0', '0', '3', '(+2)' ]);
      expect(parameterText.slice(maxTechAt, maxTechAt + 6))
        .toEqual([ 'Max Tech', '×1.00', '0', '0', '5', '0' ]);
    });

    it('hands back the y just below the section, for anything listed after it', () =>
    {
      // Arrange- Brawler has three growths.
      const window = buildWindow();
      window.showClass(globalThis.$gameActors.actor(1), 2);

      // Act
      const bottom = window.drawAfterParameters(100);

      // Assert- half a line of air, then a title and three rows.
      expect(bottom)
        .toBe(244);
    });
  });

  describe('drawGrowthSection()', () =>
  {
    it('says so for a section the class contributes nothing to', () =>
    {
      // Arrange
      const window = buildWindow();

      // Act- Hermit carries no growth tags at all.
      window.showClass(globalThis.$gameActors.actor(1), 4);

      // Assert
      expect(growthText())
        .toEqual([ 'Growth per level', 'Nothing' ]);
    });

    it('reports where it ended, a line for its title and a line per row', () =>
    {
      // Arrange
      const window = buildWindow();
      window.showClass(globalThis.$gameActors.actor(1), 2);
      const rows = [
        {
          parameterKey: 'atk',
          isRate: false,
          amount: 1,
        },
        {
          parameterKey: 'def',
          isRate: true,
          amount: 5,
        },
      ];

      // Act
      const bottom = window.drawGrowthSection('Title', rows, 10);

      // Assert- the title and two rows, at 32 apiece.
      expect(bottom)
        .toBe(106);
    });

    it('reports where it ended when it only had room to say it was empty', () =>
    {
      // Arrange
      const window = buildWindow();
      window.showClass(globalThis.$gameActors.actor(1), 2);

      // Act
      const bottom = window.drawGrowthSection('Title', [], 10);

      // Assert- the title and the single line.
      expect(bottom)
        .toBe(74);
    });
  });
});
//endregion plugins/class/ext/natural/windows/window-class-parameters.test.js