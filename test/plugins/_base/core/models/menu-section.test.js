//region plugins/_base/models/menu-section.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

describe('J-Base MenuSection (unit, no dependencies)', () =>
{
  /** @type {typeof import('../../../../../src/plugins/_base/core/models/MenuSection.js').default} */
  let MenuSection;

  beforeAll(async () =>
  {
    vi.resetModules();

    MenuSection = (await import('../../../../../src/plugins/_base/core/models/MenuSection.js')).default;
  });

  describe('constants', () =>
  {
    it('names the actor-scoped section', () =>
    {
      // Act & Assert: this string is what a command declares to land in the left column, so it is a
      // published value rather than an internal one- changing it silently re-columns the whole menu.
      expect(MenuSection.Actor)
        .toBe('actor');
    });

    it('names the party-scoped section', () =>
    {
      // Act & Assert: likewise the right column, and the value any untagged command falls back to.
      expect(MenuSection.Party)
        .toBe('party');
    });
  });

  describe('sections', () =>
  {
    it('reports both sections in column order', () =>
    {
      // Act.
      const result = MenuSection.sections();

      // Assert: order matters- this is the left-to-right reading of the menu, not an unordered set.
      expect(result)
        .toEqual([ 'actor', 'party' ]);
    });
  });

  describe('isValid', () =>
  {
    it('accepts the actor section', () =>
    {
      // Act & Assert.
      expect(MenuSection.isValid(MenuSection.Actor))
        .toBe(true);
    });

    it('accepts the party section', () =>
    {
      // Act & Assert.
      expect(MenuSection.isValid(MenuSection.Party))
        .toBe(true);
    });

    it('rejects a section it does not know', () =>
    {
      // Act: a plausible-looking typo is the realistic failure- a command tagged for a third column
      // that does not exist would otherwise be placed silently rather than caught.
      const result = MenuSection.isValid('inventory');

      // Assert.
      expect(result)
        .toBe(false);
    });
  });
});
//endregion plugins/_base/models/menu-section.test.js
