//region plugins/_base/core/core/register-jbase-serializable-models.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

/**
 * The four J-Base types that reach a savefile, and the seeds that restore them.
 *
 * Decode never runs a constructor - it builds the instance with `Object.create` and asks the codec
 * to establish defaults - so every field one of these seeds forgets comes back as `undefined`. Two
 * of them deliberately copy a blank instance rather than restating the defaults, which keeps those
 * defaults following the constructor chain instead of a transcription of it that can drift.
 */
describe('registerJBaseSerializableModels', () =>
{
  /** @type {typeof import('../../../../../src/plugins/_base/core/core/SerializableRegistry.js').default} */
  let SerializableRegistry;

  /**
   * Resolves the codec recorded for a registered type.
   * @param {string} id The registration id.
   * @returns {object} The declaration.
   */
  const declarationFor = id => [ ...SerializableRegistry.registrations()
    .values() ]
    .find(declaration => declaration.id === id);

  /**
   * Builds a bare instance and runs only its seed over it - exactly what a decode does before any
   * field from a file lands.
   * @param {Function} type The constructor to seed.
   * @param {object} declaration The codec describing it.
   * @returns {object} The seeded instance.
   */
  const seeded = (type, declaration) =>
  {
    const instance = Object.create(type.prototype);

    declaration.seed(instance);

    return instance;
  };

  beforeAll(async () =>
  {
    vi.resetModules();

    String.empty = '';

    ({ default: SerializableRegistry } = await import(
      '../../../../../src/plugins/_base/core/core/SerializableRegistry.js'));

    await import('../../../../../src/plugins/_base/core/core/registerJBaseSerializableModels.js');
  });

  describe('RPG_Skill', () =>
  {
    it('declares the two types a skill row holds instances of', () =>
    {
      // Arrange: registering the skill drags in its damage block and one effect object per entry in
      // `effects`; a missed declaration on either throws at save time naming the path.
      // Act
      const declaration = declarationFor('rpg-skill');

      // Assert
      expect(Object.keys(declaration.typed))
        .toEqual([ 'damage', 'effects' ]);
    });

    it('seeds a blank row rather than restating three classes\' worth of defaults', async () =>
    {
      // Arrange
      const { default: RPG_Skill } = await import(
        '../../../../../src/plugins/_base/core/database/implementations/RPG_Skill.js');

      // Act
      const instance = seeded(RPG_Skill, declarationFor('rpg-skill'));

      // Assert
      expect(instance.id)
        .toBe(0);
      expect(instance.damage)
        .toBeDefined();
    });
  });

  describe('RPG_SkillDamage', () =>
  {
    it('seeds off a blank instance, whose constructor tolerates being handed nothing', async () =>
    {
      // Arrange
      const { default: RPG_SkillDamage } = await import(
        '../../../../../src/plugins/_base/core/database/_data/RPG_SkillDamage.js');

      // Act
      const instance = seeded(RPG_SkillDamage, declarationFor('rpg-skill-damage'));

      // Assert
      const undefinedFields = Object.keys(instance)
        .filter(key => instance[key] === undefined);
      expect(undefinedFields)
        .toEqual([]);
    });
  });

  describe('RPG_UsableEffect', () =>
  {
    it('spells its defaults out, because its constructor reads its argument unconditionally', async () =>
    {
      // Arrange
      const { default: RPG_UsableEffect } = await import(
        '../../../../../src/plugins/_base/core/database/_data/RPG_UsableEffect.js');

      // Act
      const instance = seeded(RPG_UsableEffect, declarationFor('rpg-usable-effect'));

      // Assert
      expect(instance)
        .toEqual({
          code: 0,
          dataId: 0,
          value1: 0,
          value2: 0,
        });
    });
  });

  describe('J_Timer', () =>
  {
    it('registers bare, which persists every own field and seeds from initMembers', async () =>
    {
      // Arrange: the defaults fail open, so a bare registration is a complete one.
      // Act
      const { default: J_Timer } = await import('../../../../../src/plugins/_base/core/models/J_Timer.js');

      // Assert
      expect(SerializableRegistry.registrations()
        .has(J_Timer))
        .toBe(true);
    });
  });
});
//endregion plugins/_base/core/core/register-jbase-serializable-models.test.js