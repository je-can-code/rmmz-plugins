//region plugins/abs/ext/danger/_models/jabs-battler-core-data.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('J-ABS-Danger JABS_BattlerCoreData (unit, all downstream dependencies mocked)', () =>
{
  /** @type {import('vitest').Mock} the "original" (aliased) initMembers. */
  let originalInitMembers;

  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = {
      ABS: {
        EXT: {
          DANGER: {
            Aliased: { JABS_BattlerCoreData: new Map() },
            Metadata: { DefaultEnemyShowDangerIndicator: true },
          },
        },
      },
    };

    function JABS_BattlerCoreData()
    {
    }

    originalInitMembers = vi.fn();
    JABS_BattlerCoreData.prototype.initMembers = originalInitMembers;
    globalThis.JABS_BattlerCoreData = JABS_BattlerCoreData;

    await import('../../../../../../src/plugins/abs/ext/danger/_models/JABS_BattlerCoreData.js');
  });

  beforeEach(() =>
  {
    originalInitMembers.mockReset();
  });

  function buildCoreData(overrides = {})
  {
    const data = Object.create(globalThis.JABS_BattlerCoreData.prototype);
    data.isInanimate = () => false;
    data.initMembers();
    return Object.assign(data, overrides);
  }

  describe('initMembers', () =>
  {
    it('calls the original initMembers then defaults the danger indicator flag from metadata', () =>
    {
      // Arrange
      const data = Object.create(globalThis.JABS_BattlerCoreData.prototype);

      // Act
      data.initMembers();

      // Assert
      expect(originalInitMembers).toHaveBeenCalledTimes(1);
      expect(data._showDangerIndicator).toBe(true);
    });
  });

  describe('setDangerIndicator / showDangerIndicator', () =>
  {
    it('reflects the value set via setDangerIndicator', () =>
    {
      // Arrange
      const data = buildCoreData();

      // Act
      data.setDangerIndicator(false);

      // Assert
      expect(data.showDangerIndicator()).toBe(false);

      // Act- flip it back so the animate path has to return something other than the "hidden"
      // sentinel; a getter that always hid the indicator would satisfy the false case alone.
      data.setDangerIndicator(true);

      // Assert
      expect(data.showDangerIndicator()).toBe(true);
    });

    it('never shows the indicator on inanimate battlers, regardless of the flag', () =>
    {
      // Arrange
      const data = buildCoreData({ isInanimate: () => true });
      data.setDangerIndicator(true);

      // Act / Assert
      expect(data.showDangerIndicator()).toBe(false);
    });
  });
});
//endregion plugins/abs/ext/danger/_models/jabs-battler-core-data.test.js
