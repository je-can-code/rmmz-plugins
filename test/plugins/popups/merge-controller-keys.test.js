//region plugins/popups/merge-controller-keys.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

describe('JABS_PopupMergeController (direct src import)', () =>
{
  let JABS_PopupMergeController;

  beforeAll(async () =>
  {
    vi.resetModules();

    // minimal host surface so this file evaluates in isolation (merge key helpers + start() wiring),
    // matching this file's pre-existing convention of not booting the whole J-Base/J-Popups stack.
    globalThis.Graphics = { frameCount: 0 };
    globalThis.TextPopManager = { show() {} };
    globalThis.TextPopSpriteManager = {
      convert()
      {
        return {
          releaseAccumulatePhase: null,
          destroyed: false,
          refreshDisplayedValue: null,
          _j: { _popups: { _sourcePopup: { value: '' } } },
        };
      },
    };
    globalThis.J = {
      POPUPS: {
        Helpers: {
          PopupEmitter: { on() {} },
        },
        EventNames: {
          MergeFlushAll: 'popups/merge-flush-all',
          ComboChainCleared: 'popups/combo-chain-cleared',
        },
        EXT: {
          ABS: {
            Metadata: {
              mergeParams: { idleFlushFrames: 90 },
            },
          },
        },
        Layout: {
          Motion: { Enabled: false },
        },
        resolveMotionOffset: () => ({ x: 0, y: 0 }),
        consumeLayoutRingOffset: () => ({ x: 0, y: 0 }),
        findSpriteCharacterForGameCharacter: () => null,
      },
    };

    ({ default: JABS_PopupMergeController } = await import('../../../src/plugins/popups/ext/abs/managers/JABS_PopupMergeController.js'));
  });

  describe('buildStrikeMergeKey', () =>
  {
    it('groups a harm hp-damage popup into its own aggregate lane', () =>
    {
      // Arrange & Act
      const result = JABS_PopupMergeController.buildStrikeMergeKey({ popupType: 'hp-damage', healing: false });

      // Assert
      expect(result).toBe('strike|hp-damage|harm');
    });

    it('splits a heal hp-damage popup into a distinct lane from harm', () =>
    {
      // Arrange & Act
      const result = JABS_PopupMergeController.buildStrikeMergeKey({ popupType: 'hp-damage', healing: true });

      // Assert
      expect(result).toBe('strike|hp-damage|heal');
    });

    it('groups a harm mp-damage popup into its own aggregate lane', () =>
    {
      // Arrange & Act
      const result = JABS_PopupMergeController.buildStrikeMergeKey({ popupType: 'mp-damage', healing: false });

      // Assert
      expect(result).toBe('strike|mp-damage|harm');
    });
  });

  describe('buildSlipMergeKey', () =>
  {
    it('mirrors the strike harm/heal polarity split for a harm slip', () =>
    {
      // Arrange & Act
      const result = JABS_PopupMergeController.buildSlipMergeKey({ popupType: 'slip', healing: false });

      // Assert
      expect(result).toBe('slip|slip|harm');
    });

    it('mirrors the strike harm/heal polarity split for a heal slip', () =>
    {
      // Arrange & Act
      const result = JABS_PopupMergeController.buildSlipMergeKey({ popupType: 'slip', healing: true });

      // Assert
      expect(result).toBe('slip|slip|heal');
    });
  });

  describe('buildMitigationMergeKey / buildRewardMergeKey', () =>
  {
    it('builds a stable mitigation stream id', () =>
    {
      // Arrange & Act
      const result = JABS_PopupMergeController.buildMitigationMergeKey('parry');

      // Assert
      expect(result).toBe('mitigation|parry');
    });

    it('builds a stable reward stream id', () =>
    {
      // Arrange & Act
      const result = JABS_PopupMergeController.buildRewardMergeKey('sdp');

      // Assert
      expect(result).toBe('reward|sdp');
    });
  });
});
//endregion plugins/popups/merge-controller-keys.test.js
