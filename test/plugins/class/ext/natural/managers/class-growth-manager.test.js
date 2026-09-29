//region plugins/class/ext/natural/managers/class-growth-manager.test.js
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { installClassNaturalRealm } from '../_component/fixtures/install-class-natural-realm.js';

/**
 * What a class contributes through J-NaturalGrowth's tags, read against real actors and J-NaturalGrowth's
 * own bindings.
 */
describe('ClassGrowthManager', () =>
{
  let ClassGrowthManager;

  beforeAll(async () =>
  {
    await installClassNaturalRealm();

    ({ default: ClassGrowthManager } = await import(
      '../../../../../../src/plugins/class/ext/natural/managers/ClassGrowthManager.js'));
  });

  beforeEach(() =>
  {
    // actor 1 wears the starting class, which buffs accuracy and max tech and grows nothing, at level one.
    const actor = globalThis.$gameActors.actor(1);
    actor.changeClass(1, true);
    actor.changeLevel(1, false);
  });

  it('refuses to be constructed, since everything it knows is static', () =>
  {
    // Arrange
    // Act
    const construct = () => new ClassGrowthManager();

    // Assert
    expect(construct)
      .toThrow('This is a static class.');
  });

  describe('readGrowths()', () =>
  {
    it('lists every parameter the class grows per level, in the order the scene lists parameters', () =>
    {
      // Arrange- Brawler's note grows crit before attack and agility.
      const actor = globalThis.$gameActors.actor(1);

      // Act
      const growths = ClassGrowthManager.readGrowths(actor, 2);

      // Assert- attack and agility among the core stats, then crit among the six after them; none of Brawler's
      // buffs, which are growths of no kind.
      expect(growths)
        .toEqual([
          {
            parameterKey: 'atk',
            isRate: false,
            amount: 1.2,
          },
          {
            parameterKey: 'agi',
            isRate: false,
            amount: 1,
          },
          {
            parameterKey: 'cri',
            isRate: false,
            amount: 1.5,
          },
        ]);
    });

    it('reads a percent tag as a rate', () =>
    {
      // Arrange
      const actor = globalThis.$gameActors.actor(1);

      // Act
      const growths = ClassGrowthManager.readGrowths(actor, 3);

      // Assert
      expect(growths)
        .toEqual([
          {
            parameterKey: 'def',
            isRate: true,
            amount: 10,
          },
        ]);
    });

    it('lists nothing for a class that carries no tags', () =>
    {
      // Arrange
      const actor = globalThis.$gameActors.actor(1);

      // Act
      const growths = ClassGrowthManager.readGrowths(actor, 4);

      // Assert
      expect(growths)
        .toEqual([]);
    });

    it('works each formula out for the actor as they are now', () =>
    {
      // Arrange- one agility for every level the actor has reads five at level five.
      const actor = globalThis.$gameActors.actor(1);
      actor.changeLevel(5, false);

      // Act
      const growths = ClassGrowthManager.readGrowths(actor, 2);

      // Assert- the flat attack and crit beside it read the same at any level.
      const agility = growths.find(row => row.parameterKey === 'agi');
      expect(agility.amount)
        .toBe(5);
    });
  });

  describe('buffAtReferenceLevel()', () =>
  {
    it('works a class\'s buff out at the level multipliers are measured at, whatever level the actor is', () =>
    {
      // Arrange- actor 1 is level one; Brawler buffs three accuracy per level, the starting class one.
      const actor = globalThis.$gameActors.actor(1);

      // Act
      const brawler = ClassGrowthManager.buffAtReferenceLevel(actor, 2, 'hit');
      const startingClass = ClassGrowthManager.buffAtReferenceLevel(actor, 1, 'hit');

      // Assert- both at level 99, three to one.
      expect(brawler)
        .toBe(297);
      expect(startingClass)
        .toBe(99);
    });

    it('measures nothing for a parameter natural growth is not bound to', () =>
    {
      // Arrange- cooldown reduction, which J-ABS registers and natural growth never binds.
      const actor = globalThis.$gameActors.actor(1);

      // Act
      const measured = ClassGrowthManager.buffAtReferenceLevel(actor, 2, 'cdr');

      // Assert
      expect(measured)
        .toBe(0);
    });
  });

  describe('describe()', () =>
  {
    it('names the parameter and formats a flat amount in its own units', () =>
    {
      // Arrange
      const row = {
        parameterKey: 'atk',
        isRate: false,
        amount: 1.2,
      };

      // Act
      const described = ClassGrowthManager.describe(row);

      // Assert
      expect(described)
        .toEqual({
          iconIndex: globalThis.IconManager.param(2),
          label: 'Attack',
          value: '+1.2',
        });
    });

    it('formats a flat amount on a percent parameter as a percent', () =>
    {
      // Arrange- magic reflect reads as a percent everywhere it is shown.
      const row = {
        parameterKey: 'mrf',
        isRate: false,
        amount: 1.5,
      };

      // Act
      const described = ClassGrowthManager.describe(row);

      // Assert
      expect(described.value)
        .toBe('+1.5%');
    });

    it('formats a rate as a signed percent, whatever units the parameter uses', () =>
    {
      // Arrange
      const row = {
        parameterKey: 'def',
        isRate: true,
        amount: 10,
      };

      // Act
      const described = ClassGrowthManager.describe(row);

      // Assert
      expect(described.value)
        .toBe('+10%');
    });

    it('keeps the minus sign a negative rate already carries', () =>
    {
      // Arrange
      const row = {
        parameterKey: 'def',
        isRate: true,
        amount: -5,
      };

      // Act
      const described = ClassGrowthManager.describe(row);

      // Assert
      expect(described.value)
        .toBe('-5%');
    });

    it('trims floating point noise from a rate a formula worked out', () =>
    {
      // Arrange
      const row = {
        parameterKey: 'def',
        isRate: true,
        amount: 0.1 + 0.2,
      };

      // Act
      const described = ClassGrowthManager.describe(row);

      // Assert
      expect(described.value)
        .toBe('+0.3%');
    });
  });
});
//endregion plugins/class/ext/natural/managers/class-growth-manager.test.js