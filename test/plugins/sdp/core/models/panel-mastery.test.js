//region plugins/sdp/core/models/panel-mastery.test.js
import { beforeAll, describe, expect, it } from 'vitest';

/**
 * Mastery enrollment is all-or-nothing: a panel either sits fully inside the subgroup hierarchy
 * or entirely outside it. Half-filled rows are the interesting case, because they load without
 * complaint and then quietly fail to award anything, so the model reports them as partial rather
 * than letting them masquerade as valid.
 */
describe('PanelMastery (direct src import)', () =>
{
  let PanelMastery;

  beforeAll(async () =>
  {
    if (String.empty === undefined)
    {
      Object.defineProperty(String, 'empty', {
        value: '',
        configurable: true,
      });
    }

    ({ default: PanelMastery } = await import('../../../../../src/plugins/sdp/core/models/PanelMastery.js'));
  });

  //region hasPartialEnrollment
  describe('hasPartialEnrollment', () =>
  {
    it('accepts a completely blank row, which is how trainer headers are authored', () =>
    {
      // Arrange
      const mastery = PanelMastery.fromFlat(String.empty, 0, 0);

      // Act
      const result = mastery.hasPartialEnrollment();

      // Assert
      expect(result).toBe(false);
    });

    it('accepts a fully enrolled row carrying a mastery skill', () =>
    {
      // Arrange
      const mastery = PanelMastery.fromFlat('resilience', 2, 480);

      // Act
      const result = mastery.hasPartialEnrollment();

      // Assert
      expect(result).toBe(false);
    });

    it('rejects a subgroup key with no tier beside it', () =>
    {
      // Arrange: key and tier address a single slot together; one without the other addresses
      // nothing at all.
      const mastery = PanelMastery.fromFlat('resilience', 0, 0);

      // Act
      const result = mastery.hasPartialEnrollment();

      // Assert
      expect(result).toBe(true);
    });

    it('rejects a tier with no subgroup key beside it', () =>
    {
      // Arrange
      const mastery = PanelMastery.fromFlat(String.empty, 2, 0);

      // Act
      const result = mastery.hasPartialEnrollment();

      // Assert
      expect(result).toBe(true);
    });

    it('rejects a mastery skill on a panel enrolled in no subgroup at all', () =>
    {
      // Arrange: the reward has nothing to be awarded for- there is no subgroup to complete-
      // so the skill would simply never fire.
      const mastery = PanelMastery.fromFlat(String.empty, 0, 480);

      // Act
      const result = mastery.hasPartialEnrollment();

      // Assert
      expect(result).toBe(true);
    });
  });
  //endregion hasPartialEnrollment

  //region subgroup tier coercion
  describe('subgroup tier coercion', () =>
  {
    it('defaults the tier to zero when it cannot be parsed', () =>
    {
      // Arrange: an unparseable tier leaves the panel outside the hierarchy rather than
      // enrolled at a nonsense slot.
      const parsed = { mastery: { subgroupKey: 'resilience', subgroupTier: 'second' } };

      // Act
      const mastery = PanelMastery.fromConfigPanel(parsed);

      // Assert
      expect(mastery.subgroupTier).toBe(0);
    });

    it('accepts a tier written as a string', () =>
    {
      // Arrange
      const parsed = { mastery: { subgroupKey: 'resilience', subgroupTier: '3' } };

      // Act
      const mastery = PanelMastery.fromConfigPanel(parsed);

      // Assert
      expect(mastery.subgroupTier).toBe(3);
    });
  });
  //endregion subgroup tier coercion
});
//endregion plugins/sdp/core/models/panel-mastery.test.js