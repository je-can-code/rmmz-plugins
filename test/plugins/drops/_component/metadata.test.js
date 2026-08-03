//region plugins/drops/_component/metadata.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { installDropsHostGlobals, setPluginContextToJBase, setPluginContextToJDrops } from './fixtures/install-drops-host-globals.js';

describe('J-DropsControl metadata (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installDropsHostGlobals();

    setPluginContextToJBase();
    await import('../../../../src/plugins/_base/core/_metadata/initialization.js');

    setPluginContextToJDrops();
    await import('../../../../src/plugins/drops/core/_metadata/initialization.js');
  });

  describe('extra drop notetag', () =>
  {
    it('captures the type, id, and chance from the abbreviated item form', () =>
    {
      // Arrange
      const { ExtraDrop } = globalThis.J.DROPS.RegExp;

      // Act
      const match = '<drops:[i,12,25]>'.match(ExtraDrop);

      // Assert
      expect(match[2]).toBe('i');
      expect(match[3]).toBe('12');
      expect(match[4]).toBe('25');
    });

    it('captures the spelled-out item form', () =>
    {
      // Arrange
      const { ExtraDrop } = globalThis.J.DROPS.RegExp;

      // Act
      const match = '<drops:[item,12,25]>'.match(ExtraDrop);

      // Assert
      expect(match[2]).toBe('item');
    });

    it('captures the weapon forms', () =>
    {
      // Arrange
      const { ExtraDrop } = globalThis.J.DROPS.RegExp;

      // Act & Assert
      expect('<drops:[w,3,10]>'.match(ExtraDrop)[2]).toBe('w');
      expect('<drops:[weapon,3,10]>'.match(ExtraDrop)[2]).toBe('weapon');
    });

    it('captures the armor forms', () =>
    {
      // Arrange
      const { ExtraDrop } = globalThis.J.DROPS.RegExp;

      // Act & Assert
      expect('<drops:[a,4,50]>'.match(ExtraDrop)[2]).toBe('a');
      expect('<drops:[armor,4,50]>'.match(ExtraDrop)[2]).toBe('armor');
    });

    it('tolerates the single optional space the tag format allows after the colon', () =>
    {
      // Arrange
      const { ExtraDrop } = globalThis.J.DROPS.RegExp;

      // Act & Assert
      expect('<drops: [i,12,25]>'.match(ExtraDrop)[3]).toBe('12');
    });

    it('refuses a drop type outside the recognized set', () =>
    {
      // Arrange
      const { ExtraDrop } = globalThis.J.DROPS.RegExp;

      // Act
      const match = '<drops:[gold,12,25]>'.match(ExtraDrop);

      // Assert: an unmatched tag is simply an invalid tag, and gets ignored.
      expect(match).toBeNull();
    });
  });

  describe('multiplier notetags', () =>
  {
    it('captures a positive drop multiplier', () =>
    {
      // Arrange
      const { DropMultiplier } = globalThis.J.DROPS.RegExp;

      // Act & Assert
      expect('<dropMultiplier:25>'.match(DropMultiplier)[1]).toBe('25');
    });

    it('captures a negative drop multiplier', () =>
    {
      // Arrange
      const { DropMultiplier } = globalThis.J.DROPS.RegExp;

      // Act & Assert: penalties are expressed as negatives, so the sign has to survive.
      expect('<dropMultiplier:-30>'.match(DropMultiplier)[1]).toBe('-30');
    });

    it('captures a negative gold multiplier', () =>
    {
      // Arrange
      const { GoldMultiplier } = globalThis.J.DROPS.RegExp;

      // Act & Assert
      expect('<goldMultiplier:-15>'.match(GoldMultiplier)[1]).toBe('-15');
    });
  });

  describe('drop rate growth notetags', () =>
  {
    it('captures a formula expression from a temporary buff tag', () =>
    {
      // Arrange
      const { DropRateBuffPlus } = globalThis.J.DROPS.RegExp;

      // Act
      const [ first ] = [ ...'<dorBuffPlus:[(a.level * 2) + 5]>'.matchAll(DropRateBuffPlus) ];

      // Assert
      expect(first[1]).toBe('(a.level * 2) + 5');
    });

    it('captures every occurrence when a note carries more than one growth tag', () =>
    {
      // Arrange: these tags are global precisely because one note may stack several of them.
      const { DropRateGrowthPlus } = globalThis.J.DROPS.RegExp;
      const note = '<dorGrowthPlus:[1]>\n<dorGrowthPlus:[a.level]>';

      // Act
      const matches = [ ...note.matchAll(DropRateGrowthPlus) ];

      // Assert
      expect(matches).toHaveLength(2);
      expect(matches[0][1]).toBe('1');
      expect(matches[1][1]).toBe('a.level');
    });

    it('captures a rate-flavored growth expression', () =>
    {
      // Arrange
      const { DropRateGrowthRate } = globalThis.J.DROPS.RegExp;

      // Act
      const [ first ] = [ ...'<dorGrowthRate:[b.level / 4]>'.matchAll(DropRateGrowthRate) ];

      // Assert
      expect(first[1]).toBe('b.level / 4');
    });

    it('captures a rate-flavored buff expression', () =>
    {
      // Arrange
      const { DropRateBuffRate } = globalThis.J.DROPS.RegExp;

      // Act
      const [ first ] = [ ...'<dorBuffRate:[10]>'.matchAll(DropRateBuffRate) ];

      // Assert
      expect(first[1]).toBe('10');
    });
  });
});
//endregion plugins/drops/_component/metadata.test.js
