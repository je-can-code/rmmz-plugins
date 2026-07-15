//region plugins/popups/ext/abs/objects/jabs-battler.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('JABS_Battler ext/abs augments (direct src import)', () =>
{
  let JABS_Battler;
  let FakeJABSPopupManager;

  beforeAll(async () =>
  {
    vi.resetModules();

    FakeJABSPopupManager = { showSlipPop: vi.fn(), showItemAppliedPop: vi.fn() };
    vi.doMock('../../../../../../src/plugins/popups/ext/abs/managers/JABS_PopupManager.js', () => ({ default: FakeJABSPopupManager }));

    globalThis.J = { POPUPS: { EXT: { ABS: { Aliased: { JABS_Battler: new Map() } } } } };
    String.empty = '';

    function StubJABSBattler()
    {
    }

    StubJABSBattler.prototype.onSlipRegenTick = vi.fn();
    StubJABSBattler.prototype.onItemApplied = vi.fn();
    globalThis.JABS_Battler = StubJABSBattler;

    await import('../../../../../../src/plugins/popups/ext/abs/objects/JABS_Battler.js');
    ({ JABS_Battler } = globalThis);
  });

  beforeEach(() =>
  {
    vi.clearAllMocks();
    globalThis.$jabsEngine = { onItemPickedUp: vi.fn() };
  });

  function makeBattlerWithState(stateFlags = {})
  {
    const battler = new JABS_Battler();
    const state = { popupsNoAnySlip: false, popupsNoHpSlip: false, popupsNoMpSlip: false, popupsNoTpSlip: false, ...stateFlags };
    battler.getBattler = vi.fn().mockReturnValue({ state: () => state });
    return battler;
  }

  describe('onSlipRegenTick/canShowSlipPop', () =>
  {
    it('always calls through to the original aliased implementation', () =>
    {
      // Arrange
      const battler = makeBattlerWithState();

      // Act
      battler.onSlipRegenTick(5, 0, 1);

      // Assert
      expect(globalThis.J.POPUPS.EXT.ABS.Aliased.JABS_Battler.get('onSlipRegenTick')).toHaveBeenCalledWith(5, 0, 1);
    });

    it('shows the slip pop when nothing suppresses it', () =>
    {
      // Arrange
      const battler = makeBattlerWithState();

      // Act
      battler.onSlipRegenTick(5, 0, 1);

      // Assert
      expect(FakeJABSPopupManager.showSlipPop).toHaveBeenCalledWith(5, 0, battler, 1);
    });

    it('suppresses the popup when the state blocks all slip popups', () =>
    {
      // Arrange
      const battler = makeBattlerWithState({ popupsNoAnySlip: true });

      // Act
      battler.onSlipRegenTick(5, 0, 1);

      // Assert
      expect(FakeJABSPopupManager.showSlipPop).not.toHaveBeenCalled();
    });

    it('suppresses an hp popup when the state blocks hp slip popups', () =>
    {
      // Arrange
      const battler = makeBattlerWithState({ popupsNoHpSlip: true });

      // Act
      battler.onSlipRegenTick(5, 0, 1);

      // Assert
      expect(FakeJABSPopupManager.showSlipPop).not.toHaveBeenCalled();
    });

    it('suppresses an mp popup when the state blocks mp slip popups', () =>
    {
      // Arrange
      const battler = makeBattlerWithState({ popupsNoMpSlip: true });

      // Act
      battler.onSlipRegenTick(5, 1, 1);

      // Assert
      expect(FakeJABSPopupManager.showSlipPop).not.toHaveBeenCalled();
    });

    it('suppresses a tp popup when the state blocks tp slip popups', () =>
    {
      // Arrange
      const battler = makeBattlerWithState({ popupsNoTpSlip: true });

      // Act
      battler.onSlipRegenTick(5, 2, 1);

      // Assert
      expect(FakeJABSPopupManager.showSlipPop).not.toHaveBeenCalled();
    });

    it('does not suppress an mp popup due to an hp-only suppression', () =>
    {
      // Arrange
      const battler = makeBattlerWithState({ popupsNoHpSlip: true });

      // Act
      battler.onSlipRegenTick(5, 1, 1);

      // Assert
      expect(FakeJABSPopupManager.showSlipPop).toHaveBeenCalled();
    });
  });

  describe('onItemApplied', () =>
  {
    it('always calls through to the original aliased implementation', () =>
    {
      // Arrange
      const battler = new JABS_Battler();
      globalThis.$dataItems = { at: () => ({ sdpKey: String.empty }) };

      // Act
      battler.onItemApplied({}, 1);

      // Assert
      expect(globalThis.J.POPUPS.EXT.ABS.Aliased.JABS_Battler.get('onItemApplied')).toHaveBeenCalledWith({}, 1, battler);
    });

    it('shows the item-picked-up popup instead of a damage pop when the tool has an sdp key', () =>
    {
      // Arrange
      const battler = new JABS_Battler();
      const character = {};
      battler.getCharacter = vi.fn().mockReturnValue(character);
      const toolData = { sdpKey: 'panel-1' };
      globalThis.$dataItems = { at: () => toolData };

      // Act
      battler.onItemApplied({}, 1);

      // Assert
      expect(globalThis.$jabsEngine.onItemPickedUp).toHaveBeenCalledWith([ toolData ], character);
      expect(FakeJABSPopupManager.showItemAppliedPop).not.toHaveBeenCalled();
    });

    it('shows the item-applied damage popup when the tool has no sdp key', () =>
    {
      // Arrange
      const battler = new JABS_Battler();
      const gameAction = {};
      const toolData = { sdpKey: String.empty };
      globalThis.$dataItems = { at: () => toolData };
      const target = {};

      // Act
      battler.onItemApplied(gameAction, 1, target);

      // Assert
      expect(FakeJABSPopupManager.showItemAppliedPop).toHaveBeenCalledWith(gameAction, toolData, battler, target);
      expect(globalThis.$jabsEngine.onItemPickedUp).not.toHaveBeenCalled();
    });
  });
});
//endregion plugins/popups/ext/abs/objects/jabs-battler.test.js
