//region plugins/abs/ext/juice/objects/jabs-battler.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('J-ABS-Juice JABS_Battler (unit, all downstream dependencies mocked)', () =>
{
  let originalProcessCastingTimer;
  let originalOnCastComplete;

  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = { ABS: { EXT: { JUICE: { Aliased: { JABS_Battler: new Map() } } } } };

    vi.doMock('../../../../../../src/plugins/abs/ext/juice/managers/JuiceHookManager.js', () => ({
      default: { tickCastingJuice: vi.fn(), endCastingJuice: vi.fn() },
    }));

    function JABS_Battler()
    {
    }

    originalProcessCastingTimer = vi.fn();
    originalOnCastComplete = vi.fn();
    JABS_Battler.prototype.processCastingTimer = originalProcessCastingTimer;
    JABS_Battler.prototype.onCastComplete = originalOnCastComplete;
    globalThis.JABS_Battler = JABS_Battler;

    await import('../../../../../../src/plugins/abs/ext/juice/objects/JABS_Battler.js');
  });

  beforeEach(() =>
  {
    originalProcessCastingTimer.mockReset();
    originalOnCastComplete.mockReset();
  });

  function buildBattler(overrides = {})
  {
    const battler = Object.create(globalThis.JABS_Battler.prototype);

    // alive and not casting unless a test says otherwise, so that every "does not tick" case has to
    // name the one guard it is actually exercising rather than riding on the other.
    return Object.assign(battler, { isCasting: () => false, isDead: () => false }, overrides);
  }

  describe('processCastingTimer', () =>
  {
    it('performs the original logic then ticks casting juice while still casting', async () =>
    {
      const { default: JuiceHookManager } =
        await import('../../../../../../src/plugins/abs/ext/juice/managers/JuiceHookManager.js');
      const battler = buildBattler({ isCasting: () => true });

      battler.processCastingTimer();

      expect(originalProcessCastingTimer).toHaveBeenCalledTimes(1);
      expect(JuiceHookManager.tickCastingJuice).toHaveBeenCalledWith(battler);
    });

    it('does not tick casting juice once no longer casting', async () =>
    {
      const { default: JuiceHookManager } =
        await import('../../../../../../src/plugins/abs/ext/juice/managers/JuiceHookManager.js');
      JuiceHookManager.tickCastingJuice.mockClear();
      const battler = buildBattler({ isCasting: () => false });

      battler.processCastingTimer();

      expect(JuiceHookManager.tickCastingJuice).not.toHaveBeenCalled();
    });

    it('does not tick casting juice for a battler that died mid-cast', async () =>
    {
      // Arrange- still casting, which is the point: J-ABS keeps advancing a defeated battler's
      // timers while its corpse plays out, and nothing clears the casting flag on the way out. The
      // battler is deliberately left casting so death is the only guard that can stop this.
      const { default: JuiceHookManager } =
        await import('../../../../../../src/plugins/abs/ext/juice/managers/JuiceHookManager.js');
      JuiceHookManager.tickCastingJuice.mockClear();
      const battler = buildBattler({ isCasting: () => true, isDead: () => true });

      // Act
      battler.processCastingTimer();

      // Assert
      expect(originalProcessCastingTimer).toHaveBeenCalledTimes(1);
      expect(JuiceHookManager.tickCastingJuice).not.toHaveBeenCalled();
    });
  });

  describe('onCastComplete', () =>
  {
    it('ends casting juice before performing the original cast-completion logic', async () =>
    {
      const { default: JuiceHookManager } =
        await import('../../../../../../src/plugins/abs/ext/juice/managers/JuiceHookManager.js');
      JuiceHookManager.endCastingJuice.mockClear();
      const callOrder = [];
      JuiceHookManager.endCastingJuice.mockImplementation(() => callOrder.push('end-juice'));
      originalOnCastComplete.mockImplementation(() => callOrder.push('original'));
      const battler = buildBattler();

      battler.onCastComplete();

      expect(callOrder).toEqual([ 'end-juice', 'original' ]);
      expect(JuiceHookManager.endCastingJuice).toHaveBeenCalledWith(battler);
    });
  });
});
//endregion plugins/abs/ext/juice/objects/jabs-battler.test.js
