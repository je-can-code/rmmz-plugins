//region plugins/class/ext/natural/managers/class-manager.test.js
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { installClassNaturalRealm } from '../_component/fixtures/install-class-natural-realm.js';

/**
 * J-Classes-Natural's measure for J-Classes' multipliers: a parameter J-Classes has no curve for is measured
 * by what a class buffs it by while worn, so a class authored as its starting class's buff times some number
 * shows that number, the same way a curve does.
 */
describe('ClassManager (J-Classes-Natural)', () =>
{
  beforeAll(async () =>
  {
    await installClassNaturalRealm();
  });

  beforeEach(() =>
  {
    // actor 1 wears the starting class, which buffs accuracy by one per level, at level one.
    const actor = globalThis.$gameActors.actor(1);
    actor.changeClass(1, true);
    actor.changeLevel(1, false);
  });

  describe('referenceValue()', () =>
  {
    it('measures a parameter with no curve by what the class buffs it by, at level 99', () =>
    {
      // Arrange- Brawler buffs three accuracy per level.
      const actor = globalThis.$gameActors.actor(1);

      // Act
      const measured = globalThis.ClassManager.referenceValue(actor, 2, 'hit');

      // Assert
      expect(measured)
        .toBe(297);
    });

    it('keeps the curve J-Classes measures a base parameter by', () =>
    {
      // Arrange- Brawler has an attack curve, and no attack buff for the curve to be mistaken for.
      const actor = globalThis.$gameActors.actor(1);

      // Act
      const measured = globalThis.ClassManager.referenceValue(actor, 2, 'atk');

      // Assert- the harness curve's 1090 at 99, times Brawler's 1.15.
      expect(measured)
        .toBe(1254);
    });
  });

  describe('multiplierText()', () =>
  {
    it('reads a buff authored as the starting class\'s times three as ×3.00', () =>
    {
      // Arrange
      const actor = globalThis.$gameActors.actor(1);

      // Act
      const text = globalThis.ClassManager.multiplierText(actor, 2, 'hit');

      // Assert
      expect(text)
        .toBe('×3.00');
    });

    it('reads a buff equal to the starting class\'s as ×1.00', () =>
    {
      // Arrange- Brawler buffs max tech by the same flat 50 the starting class does.
      const actor = globalThis.$gameActors.actor(1);

      // Act
      const text = globalThis.ClassManager.multiplierText(actor, 2, 'mtp');

      // Assert
      expect(text)
        .toBe('×1.00');
    });
  });
});
//endregion plugins/class/ext/natural/managers/class-manager.test.js