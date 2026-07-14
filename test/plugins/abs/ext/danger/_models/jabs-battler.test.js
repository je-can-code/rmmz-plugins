//region plugins/abs/ext/danger/_models/jabs-battler.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('J-ABS-Danger JABS_Battler (unit, all downstream dependencies mocked)', () =>
{
  /** @type {import('vitest').Mock} the "original" (aliased) initCoreData. */
  let originalInitCoreData;

  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = {
      ABS: {
        EXT: {
          DANGER: {
            Aliased: { JABS_Battler: new Map() },
          },
        },
      },
    };

    function JABS_Battler()
    {
    }

    originalInitCoreData = vi.fn();
    JABS_Battler.prototype.initCoreData = originalInitCoreData;
    globalThis.JABS_Battler = JABS_Battler;

    await import('../../../../../../src/plugins/abs/ext/danger/_models/JABS_Battler.js');
  });

  beforeEach(() =>
  {
    originalInitCoreData.mockReset();
  });

  function buildBattler()
  {
    return Object.create(globalThis.JABS_Battler.prototype);
  }

  describe('initCoreData', () =>
  {
    it('forces the flag false for inanimate battlers, regardless of the core data value', () =>
    {
      // Arrange
      const battler = buildBattler();
      const coreData = { isInanimate: () => true, showDangerIndicator: () => true };

      // Act
      battler.initCoreData(coreData);

      // Assert
      expect(battler.showDangerIndicator()).toBe(false);
      expect(originalInitCoreData).toHaveBeenCalledWith(coreData);
    });

    it('takes the flag from the core data for animate battlers', () =>
    {
      // Arrange
      const battler = buildBattler();
      const coreData = { isInanimate: () => false, showDangerIndicator: () => true };

      // Act
      battler.initCoreData(coreData);

      // Assert
      expect(battler.showDangerIndicator()).toBe(true);
    });
  });
});
//endregion plugins/abs/ext/danger/_models/jabs-battler.test.js
