//region plugins/diff/core/__models/difficulty-config.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

/**
 * The per-difficulty flags a savefile actually carries, and the seed that restores them.
 *
 * The seed matters more than the class does. Decode never runs a constructor - it builds the
 * instance with `Object.create` and then asks the codec to establish defaults - so a config coming
 * back off disk gets its fields from here and nowhere else. A field this seed forgets arrives as
 * `undefined`, and an `undefined` "unlocked" reads as locked, quietly taking a difficulty away from
 * a player who had earned it.
 */
describe('DifficultyConfig', () =>
{
  /** @type {typeof import('../../../../../src/plugins/diff/core/__models/DifficultyConfig.js').default} */
  let DifficultyConfig;

  /**
   * The codec the registry recorded for this type.
   * @type {object}
   */
  let codec;

  beforeAll(async () =>
  {
    vi.resetModules();

    // the J-Base sentinel the class fields default to, normally installed by _base's initialization.
    if (Object.getOwnPropertyDescriptor(String, 'empty') === undefined)
    {
      Object.defineProperty(String, 'empty', { value: '' });
    }

    ({ default: globalThis.SerializableRegistry } = await import(
      '../../../../../src/plugins/_base/core/core/SerializableRegistry.js'));

    ({ default: DifficultyConfig } = await import(
      '../../../../../src/plugins/diff/core/__models/DifficultyConfig.js'));

    codec = globalThis.SerializableRegistry.registrations()
      .get(DifficultyConfig);
  });

  describe('registration', () =>
  {
    it('registers itself, because it rides along inside the party\'s difficulty namespace', () =>
    {
      // Arrange
      // Act
      // Assert
      expect(codec)
        .toBeDefined();
    });
  });

  describe('seed', () =>
  {
    /**
     * Builds a bare instance and runs only its seed over it - exactly what a decode does before any
     * field from a file lands.
     * @returns {DifficultyConfig} The seeded instance.
     */
    const seeded = () =>
    {
      const instance = Object.create(DifficultyConfig.prototype);

      codec.seed(instance);

      return instance;
    };

    it('leaves no field undefined, which is what a decode would otherwise hand back', () =>
    {
      // Arrange
      // Act
      const instance = seeded();

      // Assert
      const undefinedFields = Object.keys(instance)
        .filter(key => instance[key] === undefined);
      expect(undefinedFields)
        .toEqual([]);
    });

    it('establishes the same defaults a constructed config would carry', () =>
    {
      // Arrange: the seed copies them off a freshly built instance rather than restating them, so
      // this is the check that the copy actually happened.
      const constructed = new DifficultyConfig();

      // Act
      const instance = seeded();

      // Assert
      expect({ ...instance })
        .toEqual({ ...constructed });
    });

    it('hands each decoded config its own objects rather than a shared one', () =>
    {
      // Arrange: a shared object would have every difficulty in the savefile mutating one another.
      // Act
      const first = seeded();
      const second = seeded();

      // Assert
      expect(first)
        .not.toBe(second);
      expect({ ...first })
        .toEqual({ ...second });
    });
  });
});
//endregion plugins/diff/core/__models/difficulty-config.test.js