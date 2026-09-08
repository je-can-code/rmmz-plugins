//region plugins/sdp/core/models/panel-mastery-prose.test.js
import { beforeAll, describe, expect, it } from 'vitest';

/**
 * Mastery prose is authored per act rather than per tier, so the interesting behavior is the
 * fallback: a subgroup whose mechanic never changes writes one template and expects the other nine
 * tiers to resolve to it. The tests below pin each act boundary and each fallback hop, because a
 * silently-blank description is indistinguishable from a subgroup nobody has written yet.
 */
describe('PanelMasteryProse (direct src import)', () =>
{
  let PanelMasteryProse;

  beforeAll(async () =>
  {
    if (String.empty === undefined)
    {
      Object.defineProperty(String, 'empty', {
        value: '',
        configurable: true,
      });
    }

    ({ default: PanelMasteryProse } = await import(
      '../../../../../src/plugins/sdp/core/models/PanelMasteryProse.js'));
  });

  //region hasProse
  describe('hasProse', () =>
  {
    it('reports true when only the beginning act is authored', () =>
    {
      // Arrange
      const prose = new PanelMasteryProse('a beginning', String.empty, String.empty);

      // Act
      const result = prose.hasProse();

      // Assert
      expect(result).toBe(true);
    });

    it('reports true when only the middle act is authored', () =>
    {
      // Arrange
      const prose = new PanelMasteryProse(String.empty, 'a middle', String.empty);

      // Act
      const result = prose.hasProse();

      // Assert
      expect(result).toBe(true);
    });

    it('reports true when only the end act is authored', () =>
    {
      // Arrange
      const prose = new PanelMasteryProse(String.empty, String.empty, 'an end');

      // Act
      const result = prose.hasProse();

      // Assert
      expect(result).toBe(true);
    });

    it('reports false when no act is authored, which is how the sin subgroups sit today', () =>
    {
      // Arrange
      const prose = PanelMasteryProse.none();

      // Act
      const result = prose.hasProse();

      // Assert
      expect(result).toBe(false);
    });
  });
  //endregion hasProse

  //region forTier
  describe('forTier', () =>
  {
    it('serves the beginning act on the first tier', () =>
    {
      // Arrange
      const prose = new PanelMasteryProse('beginning copy', 'middle copy', 'end copy');

      // Act
      const result = prose.forTier(1);

      // Assert
      expect(result).toBe('beginning copy');
    });

    it('serves the beginning act on the last tier of that act', () =>
    {
      // Arrange
      const prose = new PanelMasteryProse('beginning copy', 'middle copy', 'end copy');

      // Act
      const result = prose.forTier(3);

      // Assert
      expect(result).toBe('beginning copy');
    });

    it('serves the middle act on the first tier past the beginning boundary', () =>
    {
      // Arrange
      const prose = new PanelMasteryProse('beginning copy', 'middle copy', 'end copy');

      // Act
      const result = prose.forTier(4);

      // Assert
      expect(result).toBe('middle copy');
    });

    it('serves the middle act on the last tier before the capstone', () =>
    {
      // Arrange
      const prose = new PanelMasteryProse('beginning copy', 'middle copy', 'end copy');

      // Act
      const result = prose.forTier(9);

      // Assert
      expect(result).toBe('middle copy');
    });

    it('serves the end act on the capstone tier', () =>
    {
      // Arrange
      const prose = new PanelMasteryProse('beginning copy', 'middle copy', 'end copy');

      // Act
      const result = prose.forTier(10);

      // Assert
      expect(result).toBe('end copy');
    });

    it('borrows the middle act for a beginning tier when the beginning is blank', () =>
    {
      // Arrange
      const prose = new PanelMasteryProse(String.empty, 'middle copy', 'end copy');

      // Act
      const result = prose.forTier(2);

      // Assert
      expect(result).toBe('middle copy');
    });

    it('borrows the end act for a beginning tier when both earlier acts are blank', () =>
    {
      // Arrange
      const prose = new PanelMasteryProse(String.empty, String.empty, 'end copy');

      // Act
      const result = prose.forTier(2);

      // Assert
      expect(result).toBe('end copy');
    });

    it('borrows the beginning act for a middle tier, which is how a one-template strip resolves', () =>
    {
      // Arrange
      const prose = new PanelMasteryProse('beginning copy', String.empty, String.empty);

      // Act
      const result = prose.forTier(6);

      // Assert
      expect(result).toBe('beginning copy');
    });

    it('borrows the end act for a middle tier when both preferred acts are blank', () =>
    {
      // Arrange
      const prose = new PanelMasteryProse(String.empty, String.empty, 'end copy');

      // Act
      const result = prose.forTier(6);

      // Assert
      expect(result).toBe('end copy');
    });

    it('borrows the middle act for the capstone when the end is blank', () =>
    {
      // Arrange
      const prose = new PanelMasteryProse('beginning copy', 'middle copy', String.empty);

      // Act
      const result = prose.forTier(10);

      // Assert
      expect(result).toBe('middle copy');
    });

    it('borrows the beginning act for the capstone when both later acts are blank', () =>
    {
      // Arrange
      const prose = new PanelMasteryProse('beginning copy', String.empty, String.empty);

      // Act
      const result = prose.forTier(10);

      // Assert
      expect(result).toBe('beginning copy');
    });

    it('yields the empty string for a tier when nothing at all is authored', () =>
    {
      // Arrange
      const prose = PanelMasteryProse.none();

      // Act
      const result = prose.forTier(5);

      // Assert
      expect(result).toBe(String.empty);
    });
  });
  //endregion forTier

  //region none
  describe('none', () =>
  {
    it('builds a row with every act blank', () =>
    {
      // Arrange & Act
      const prose = PanelMasteryProse.none();

      // Assert
      expect(prose.beginning).toBe(String.empty);
      expect(prose.middle).toBe(String.empty);
      expect(prose.end).toBe(String.empty);
    });
  });
  //endregion none

  //region fromConfigSubgroup
  describe('fromConfigSubgroup', () =>
  {
    it('hydrates all three acts from a fully authored row', () =>
    {
      // Arrange
      const parsedSubgroup = {
        key: 'undead-armor',
        prose: {
          beginning: 'plates over what it cannot heal',
          middle: 'a brittle bastion still turns a blade',
          end: 'a paper fortress',
        },
      };

      // Act
      const prose = PanelMasteryProse.fromConfigSubgroup(parsedSubgroup);

      // Assert
      expect(prose.beginning).toBe('plates over what it cannot heal');
      expect(prose.middle).toBe('a brittle bastion still turns a blade');
      expect(prose.end).toBe('a paper fortress');
    });

    it('yields the blank row for a subgroup written before the field existed', () =>
    {
      // Arrange
      const parsedSubgroup = { key: 'undead-armor' };

      // Act
      const prose = PanelMasteryProse.fromConfigSubgroup(parsedSubgroup);

      // Assert
      expect(prose.hasProse()).toBe(false);
    });

    it('leaves the beginning blank when the row authors only a later act', () =>
    {
      // Arrange
      const parsedSubgroup = {
        key: 'deity-devil',
        prose: { end: 'the debt compounds in your favor' },
      };

      // Act
      const prose = PanelMasteryProse.fromConfigSubgroup(parsedSubgroup);

      // Assert
      expect(prose.beginning).toBe(String.empty);
      expect(prose.middle).toBe(String.empty);

      // the authored act proves the hydration actually ran, rather than the blanks above being
      // whatever a do-nothing implementation would also have produced.
      expect(prose.end).toBe('the debt compounds in your favor');
    });

    it('fills only the acts the row actually carries', () =>
    {
      // Arrange
      const parsedSubgroup = {
        key: 'humanoid-orc',
        prose: { beginning: 'a warchief does not wait' },
      };

      // Act
      const prose = PanelMasteryProse.fromConfigSubgroup(parsedSubgroup);

      // Assert
      expect(prose.beginning).toBe('a warchief does not wait');
      expect(prose.middle).toBe(String.empty);
      expect(prose.end).toBe(String.empty);
    });
  });
  //endregion fromConfigSubgroup

  //region toConfigJson
  describe('toConfigJson', () =>
  {
    it('serializes every act back onto a plain object', () =>
    {
      // Arrange
      const prose = new PanelMasteryProse('one', 'two', 'three');

      // Act
      const result = prose.toConfigJson();

      // Assert
      expect(result).toEqual({
        beginning: 'one',
        middle: 'two',
        end: 'three',
      });
    });
  });
  //endregion toConfigJson
});
//endregion plugins/sdp/core/models/panel-mastery-prose.test.js