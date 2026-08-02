//region plugins/_base/database/rpg-skill-damage.test.js
import { beforeAll, describe, expect, it } from 'vitest';

describe('RPG_SkillDamage (direct src import)', () =>
{
  let RPG_SkillDamage;

  beforeAll(async () =>
  {
    String.empty = '';

    ({ default: RPG_SkillDamage } =
      await import('../../../../../src/plugins/_base/core/database/_data/RPG_SkillDamage.js'));
  });

  describe('constructor', () =>
  {
    it('maps every damage property from the source object', () =>
    {
      // Arrange
      const source = {
        critical: true,
        elementId: 3,
        formula: 'a.atk * 4 - b.def * 2',
        type: 1,
        variance: 20,
      };

      // Act
      const damage = new RPG_SkillDamage(source);

      // Assert
      expect(damage.critical).toBe(true);
      expect(damage.elementId).toBe(3);
      expect(damage.formula).toBe('a.atk * 4 - b.def * 2');
      expect(damage.type).toBe(1);
      expect(damage.variance).toBe(20);
    });

    it('falls back to the harmless defaults when given no damage at all', () =>
    {
      // Arrange
      // Act
      const damage = new RPG_SkillDamage();

      // Assert
      // a skill with no damage block still needs a well-formed damage object, so the defaults have
      // to describe "does nothing" rather than being left undefined for a formula to trip over.
      expect(damage.critical).toBe(false);
      expect(damage.elementId).toBe(-1);
      expect(damage.formula).toBe(String.empty);
      expect(damage.type).toBe(0);
      expect(damage.variance).toBe(0);
    });
  });
});
//endregion plugins/_base/database/rpg-skill-damage.test.js
