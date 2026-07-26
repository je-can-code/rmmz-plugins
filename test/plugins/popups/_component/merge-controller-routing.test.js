//region plugins/popups/_component/merge-controller-routing.test.js
import { describe, expect, it, vi } from 'vitest';

/**
 * Builds a fresh set of minimal host globals and imports a brand new copy of the controller module,
 * so each test gets an isolated WeakMap/Set (module statics persist across imports of the same module
 * instance, but `vi.resetModules()` forces a new instance per call).
 * @returns {Promise<{ JABS_PopupMergeController: object, spriteCharacterFor: (character: object) => object, textPopManagerShow: import('vitest').Mock, convertSpy: import('vitest').Mock, spriteLocatorSpy: import('vitest').Mock }>}
 */
async function importFreshController()
{
  vi.resetModules();

  globalThis.Graphics = { frameCount: 0 };

  const textPopManagerShow = vi.fn();
  globalThis.TextPopManager = { show: textPopManagerShow };

  const convertSpy = vi.fn(() => ({
    releaseAccumulatePhase: vi.fn(),
    destroyed: false,
    refreshDisplayedValue: vi.fn(),
    kickMergeCombinePulse: vi.fn(),
    _j: { _popups: { _sourcePopup: { value: '' } } },
  }));
  globalThis.TextPopSpriteManager = { convert: convertSpy };

  globalThis.PopupLayoutHelper = {
    resolveMotionOffset: vi.fn(() => ({ x: 1, y: 1 })),
    consumeLayoutRingOffset: vi.fn(() => ({ x: 2, y: 2 })),
  };

  // maps a Game_Character to whatever Sprite_Character stand-in the test wired up for it;
  // defaults to "not found on the current map" like the real locator does off-map.
  const spriteCharacterByCharacter = new Map();
  const spriteLocatorSpy = vi.fn(character => spriteCharacterByCharacter.get(character) ?? null);
  globalThis.PopupSpriteLocator = { findSpriteCharacterForGameCharacter: spriteLocatorSpy };

  globalThis.J = {
    POPUPS: {
      Helpers: {
        PopupEmitter: { on: vi.fn() },
      },
      EventNames: {
        MergeFlushAll: 'popups/merge-flush-all',
      },
      EXT: {
        ABS: {
          Metadata: {
            mergeParams: {
              enableCombat: true,
              enableSlip: true,
              enableMitigation: true,
              enableRewards: true,
              idleFlushFrames: 90,
            },
          },
        },
      },
      Layout: {
        Motion: { Enabled: false },
      },
    },
  };

  const { default: Map_TextPop } = await import('../../../../src/plugins/popups/core/_models/Map_TextPop.js');
  globalThis.Map_TextPop = Map_TextPop;

  const { default: JABS_PopupMergeController } =
    await import('../../../../src/plugins/popups/ext/abs/managers/JABS_PopupMergeController.js');

  /**
   * Registers a mock {@link Sprite_Character} as the on-map anchor for a given character.
   * @param {object} character The anchor character.
   * @returns {{ character: () => object, attachConvertedDamagePopupSprite: import('vitest').Mock }}
   */
  function spriteCharacterFor(character)
  {
    const spriteCharacter = {
      character: () => character,
      attachConvertedDamagePopupSprite: vi.fn(),
    };
    spriteCharacterByCharacter.set(character, spriteCharacter);

    return spriteCharacter;
  }

  return { JABS_PopupMergeController, spriteCharacterFor, textPopManagerShow, convertSpy, spriteLocatorSpy };
}

/**
 * @param {object} [overrides]
 * @returns {object}
 */
function buildPop(overrides = {})
{
  return {
    iconIndex: 1,
    textColorIndex: 0,
    popupType: Map_TextPop.Types.HpDamage,
    value: '0',
    critical: false,
    coordinateVariance: 0,
    healing: false,
    textAccent: null,
    layoutRing: 0,
    ...overrides,
  };
}

describe('JABS_PopupMergeController routing/lifecycle (direct src import)', () =>
{
  describe('routeStrikePop', () =>
  {
    it('dispatches immediately without opening a session when combat merging is disabled', async () =>
    {
      // Arrange
      const { JABS_PopupMergeController, textPopManagerShow, convertSpy } = await importFreshController();
      globalThis.J.POPUPS.EXT.ABS.Metadata.mergeParams.enableCombat = false;
      const character = {};

      // Act
      JABS_PopupMergeController.routeStrikePop(buildPop(), character, { amount: 10 });

      // Assert
      expect(textPopManagerShow).toHaveBeenCalledTimes(1);
      expect(convertSpy).not.toHaveBeenCalled();
    });

    it('dispatches immediately when the character has no on-map sprite', async () =>
    {
      // Arrange
      const { JABS_PopupMergeController, textPopManagerShow } = await importFreshController();
      const character = {};

      // Act
      JABS_PopupMergeController.routeStrikePop(buildPop(), character, { amount: 10 });

      // Assert
      expect(textPopManagerShow).toHaveBeenCalledTimes(1);
    });

    it('opens a new merge session and attaches the converted sprite on the first hit', async () =>
    {
      // Arrange
      const { JABS_PopupMergeController, spriteCharacterFor, convertSpy } = await importFreshController();
      const character = {};
      const spriteCharacter = spriteCharacterFor(character);

      // Act
      JABS_PopupMergeController.routeStrikePop(buildPop({ value: '5' }), character, { amount: 5 });

      // Assert
      expect(convertSpy).toHaveBeenCalledTimes(1);
      expect(spriteCharacter.attachConvertedDamagePopupSprite).toHaveBeenCalledTimes(1);
    });

    it('strips critical styling from the session template even when the opening hit crit', async () =>
    {
      // Arrange
      const { JABS_PopupMergeController, spriteCharacterFor, convertSpy } = await importFreshController();
      const character = {};
      spriteCharacterFor(character);

      // Act
      JABS_PopupMergeController.routeStrikePop(buildPop({ critical: true }), character, { amount: 5 });

      // Assert
      const [ [ template ] ] = convertSpy.mock.calls;
      expect(template.critical).toBe(false);
    });

    it('kicks the combine pulse when the opening hit of a stream is critical', async () =>
    {
      // Arrange
      const { JABS_PopupMergeController, spriteCharacterFor, convertSpy } = await importFreshController();
      const character = {};
      spriteCharacterFor(character);
      const sprite = { kickMergeCombinePulse: vi.fn(), _j: { _popups: { _sourcePopup: { value: '' } } } };
      convertSpy.mockReturnValueOnce(sprite);

      // Act
      JABS_PopupMergeController.routeStrikePop(buildPop({ critical: true }), character, { amount: 5 });

      // Assert
      expect(sprite.kickMergeCombinePulse).toHaveBeenCalledWith(true);
    });

    it('does not kick the combine pulse when the sprite has no pulse hook', async () =>
    {
      // Arrange
      const { JABS_PopupMergeController, spriteCharacterFor, convertSpy } = await importFreshController();
      const character = {};
      spriteCharacterFor(character);
      convertSpy.mockReturnValueOnce({ _j: { _popups: { _sourcePopup: { value: '' } } } });

      // Act & Assert (no throw despite the sprite lacking kickMergeCombinePulse)
      expect(() => JABS_PopupMergeController.routeStrikePop(buildPop({ critical: true }), character, { amount: 5 }))
        .not.toThrow();
    });

    it('accumulates a second hit into the same stream instead of opening another session', async () =>
    {
      // Arrange
      const { JABS_PopupMergeController, spriteCharacterFor, convertSpy } = await importFreshController();
      const character = {};
      spriteCharacterFor(character);
      JABS_PopupMergeController.routeStrikePop(buildPop({ value: '5' }), character, { amount: 5 });

      // Act
      const secondPop = buildPop({ value: '3' });
      JABS_PopupMergeController.routeStrikePop(secondPop, character, { amount: 3 });

      // Assert
      expect(convertSpy).toHaveBeenCalledTimes(1);
      expect(secondPop.value).toBe('8');
    });

    it('refreshes the displayed value and source popup on the session sprite for a repeat hit', async () =>
    {
      // Arrange
      const { JABS_PopupMergeController, spriteCharacterFor, convertSpy } = await importFreshController();
      const character = {};
      spriteCharacterFor(character);
      const sprite = {
        refreshDisplayedValue: vi.fn(),
        _j: { _popups: { _sourcePopup: { value: '' } } },
      };
      convertSpy.mockReturnValueOnce(sprite);
      JABS_PopupMergeController.routeStrikePop(buildPop({ value: '5' }), character, { amount: 5 });

      // Act
      JABS_PopupMergeController.routeStrikePop(buildPop({ value: '3' }), character, { amount: 3 });

      // Assert
      expect(sprite.refreshDisplayedValue).toHaveBeenCalledWith('8', false);
      expect(sprite._j._popups._sourcePopup.value).toBe('8');
    });

    it('tolerates a repeat hit landing on a session whose sprite lacks refreshDisplayedValue', async () =>
    {
      // Arrange
      const { JABS_PopupMergeController, spriteCharacterFor, convertSpy } = await importFreshController();
      const character = {};
      spriteCharacterFor(character);
      convertSpy.mockReturnValueOnce({ _j: { _popups: { _sourcePopup: { value: '' } } } });
      JABS_PopupMergeController.routeStrikePop(buildPop({ value: '5' }), character, { amount: 5 });

      // Act & Assert
      expect(() => JABS_PopupMergeController.routeStrikePop(buildPop({ value: '3' }), character, { amount: 3 }))
        .not.toThrow();
    });

    it('resolves a motion offset instead of a ring offset when motion popups are enabled for a damage type', async () =>
    {
      // Arrange
      const { JABS_PopupMergeController, spriteCharacterFor } = await importFreshController();
      globalThis.J.POPUPS.Layout.Motion.Enabled = true;
      const character = {};
      spriteCharacterFor(character);

      // Act
      JABS_PopupMergeController.routeStrikePop(buildPop({ popupType: Map_TextPop.Types.HpDamage }), character, { amount: 5 });

      // Assert
      expect(globalThis.PopupLayoutHelper.resolveMotionOffset).toHaveBeenCalledTimes(1);
      expect(globalThis.PopupLayoutHelper.consumeLayoutRingOffset).not.toHaveBeenCalled();
    });

    it('treats tp-damage as a motion-eligible popup type', async () =>
    {
      // Arrange
      const { JABS_PopupMergeController, spriteCharacterFor } = await importFreshController();
      globalThis.J.POPUPS.Layout.Motion.Enabled = true;
      const character = {};
      spriteCharacterFor(character);

      // Act
      JABS_PopupMergeController.routeStrikePop(buildPop({ popupType: Map_TextPop.Types.TpDamage }), character, { amount: 5 });

      // Assert
      expect(globalThis.PopupLayoutHelper.resolveMotionOffset).toHaveBeenCalledTimes(1);
    });

    it('treats a healing popup of a non-damage type as motion-eligible', async () =>
    {
      // Arrange
      const { JABS_PopupMergeController, spriteCharacterFor } = await importFreshController();
      globalThis.J.POPUPS.Layout.Motion.Enabled = true;
      const character = {};
      spriteCharacterFor(character);

      // Act
      JABS_PopupMergeController.routeStrikePop(
        buildPop({ popupType: Map_TextPop.Types.Experience, healing: true }),
        character,
        { amount: 5 }
      );

      // Assert
      expect(globalThis.PopupLayoutHelper.resolveMotionOffset).toHaveBeenCalledTimes(1);
    });

    it('falls back to a ring offset for a non-damage, non-healing popup even with motion enabled', async () =>
    {
      // Arrange
      const { JABS_PopupMergeController, spriteCharacterFor } = await importFreshController();
      globalThis.J.POPUPS.Layout.Motion.Enabled = true;
      const character = {};
      spriteCharacterFor(character);

      // Act
      JABS_PopupMergeController.routeStrikePop(
        buildPop({ popupType: Map_TextPop.Types.Experience, healing: false }),
        character,
        { amount: 5 }
      );

      // Assert
      expect(globalThis.PopupLayoutHelper.consumeLayoutRingOffset).toHaveBeenCalledTimes(1);
      expect(globalThis.PopupLayoutHelper.resolveMotionOffset).not.toHaveBeenCalled();
    });

    it('keeps two hit streams isolated per merge key on the same character', async () =>
    {
      // Arrange
      const { JABS_PopupMergeController, spriteCharacterFor, convertSpy } = await importFreshController();
      const character = {};
      spriteCharacterFor(character);

      // Act: two different popup types on the same character open two independent sessions.
      JABS_PopupMergeController.routeStrikePop(buildPop({ popupType: Map_TextPop.Types.HpDamage }), character, { amount: 5 });
      JABS_PopupMergeController.routeStrikePop(buildPop({ popupType: Map_TextPop.Types.MpDamage }), character, { amount: 5 });

      // Assert
      expect(convertSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe('routeSlipPop', () =>
  {
    it('dispatches immediately without opening a session when slip merging is disabled', async () =>
    {
      // Arrange
      const { JABS_PopupMergeController, textPopManagerShow } = await importFreshController();
      globalThis.J.POPUPS.EXT.ABS.Metadata.mergeParams.enableSlip = false;
      const character = {};

      // Act
      JABS_PopupMergeController.routeSlipPop(buildPop(), character, { amount: 4 });

      // Assert
      expect(textPopManagerShow).toHaveBeenCalledTimes(1);
    });

    it('dispatches immediately when the character has no on-map sprite', async () =>
    {
      // Arrange
      const { JABS_PopupMergeController, textPopManagerShow } = await importFreshController();
      const character = {};

      // Act
      JABS_PopupMergeController.routeSlipPop(buildPop(), character, { amount: 4 });

      // Assert
      expect(textPopManagerShow).toHaveBeenCalledTimes(1);
    });

    it('opens a new merge session on the first slip tick', async () =>
    {
      // Arrange
      const { JABS_PopupMergeController, spriteCharacterFor, convertSpy } = await importFreshController();
      const character = {};
      spriteCharacterFor(character);

      // Act
      JABS_PopupMergeController.routeSlipPop(buildPop({ value: '4' }), character, { amount: 4 });

      // Assert
      expect(convertSpy).toHaveBeenCalledTimes(1);
    });

    it('accumulates a repeat slip tick into the running total without a critical flag', async () =>
    {
      // Arrange
      const { JABS_PopupMergeController, spriteCharacterFor, convertSpy } = await importFreshController();
      const character = {};
      spriteCharacterFor(character);
      const sprite = { refreshDisplayedValue: vi.fn(), _j: { _popups: { _sourcePopup: { value: '' } } } };
      convertSpy.mockReturnValueOnce(sprite);
      JABS_PopupMergeController.routeSlipPop(buildPop({ value: '4' }), character, { amount: 4 });

      // Act
      const secondPop = buildPop({ value: '6' });
      JABS_PopupMergeController.routeSlipPop(secondPop, character, { amount: 6 });

      // Assert
      expect(secondPop.value).toBe('10');
      expect(sprite.refreshDisplayedValue).toHaveBeenCalledWith('10');
    });

    it('tolerates a repeat slip tick landing on a session whose sprite lacks refreshDisplayedValue', async () =>
    {
      // Arrange
      const { JABS_PopupMergeController, spriteCharacterFor, convertSpy } = await importFreshController();
      const character = {};
      spriteCharacterFor(character);
      convertSpy.mockReturnValueOnce({ _j: { _popups: { _sourcePopup: { value: '' } } } });
      JABS_PopupMergeController.routeSlipPop(buildPop({ value: '4' }), character, { amount: 4 });

      // Act & Assert
      expect(() => JABS_PopupMergeController.routeSlipPop(buildPop({ value: '6' }), character, { amount: 6 }))
        .not.toThrow();
    });
  });

  describe('routeMitigationPop', () =>
  {
    it('dispatches immediately without opening a session when mitigation merging is disabled', async () =>
    {
      // Arrange
      const { JABS_PopupMergeController, textPopManagerShow } = await importFreshController();
      globalThis.J.POPUPS.EXT.ABS.Metadata.mergeParams.enableMitigation = false;
      const character = {};

      // Act
      JABS_PopupMergeController.routeMitigationPop(buildPop(), character, { mitigationType: 'parry', labelPrefix: 'Parry' });

      // Assert
      expect(textPopManagerShow).toHaveBeenCalledTimes(1);
    });

    it('dispatches immediately when the character has no on-map sprite', async () =>
    {
      // Arrange
      const { JABS_PopupMergeController, textPopManagerShow } = await importFreshController();
      const character = {};

      // Act
      JABS_PopupMergeController.routeMitigationPop(buildPop(), character, { mitigationType: 'parry', labelPrefix: 'Parry' });

      // Assert
      expect(textPopManagerShow).toHaveBeenCalledTimes(1);
    });

    it('labels the opening mitigation hit as a single count', async () =>
    {
      // Arrange
      const { JABS_PopupMergeController, spriteCharacterFor, convertSpy } = await importFreshController();
      const character = {};
      spriteCharacterFor(character);
      const pop = buildPop();

      // Act
      JABS_PopupMergeController.routeMitigationPop(pop, character, { mitigationType: 'parry', labelPrefix: 'Parry' });

      // Assert
      expect(convertSpy).toHaveBeenCalledTimes(1);
      const [ [ template ] ] = convertSpy.mock.calls;
      expect(template.value).toBe('Parry x1');
    });

    it('increments the count label on a repeat mitigation hit', async () =>
    {
      // Arrange
      const { JABS_PopupMergeController, spriteCharacterFor, convertSpy } = await importFreshController();
      const character = {};
      spriteCharacterFor(character);
      const sprite = { refreshDisplayedValue: vi.fn(), _j: { _popups: { _sourcePopup: { value: '' } } } };
      convertSpy.mockReturnValueOnce(sprite);
      JABS_PopupMergeController.routeMitigationPop(buildPop(), character, { mitigationType: 'parry', labelPrefix: 'Parry' });

      // Act
      const secondPop = buildPop();
      JABS_PopupMergeController.routeMitigationPop(secondPop, character, { mitigationType: 'parry', labelPrefix: 'Parry' });

      // Assert
      expect(secondPop.value).toBe('Parry x2');
      expect(sprite.refreshDisplayedValue).toHaveBeenCalledWith('Parry x2');
    });

    it('tolerates a repeat mitigation hit landing on a session whose sprite lacks refreshDisplayedValue', async () =>
    {
      // Arrange
      const { JABS_PopupMergeController, spriteCharacterFor, convertSpy } = await importFreshController();
      const character = {};
      spriteCharacterFor(character);
      convertSpy.mockReturnValueOnce({ _j: { _popups: { _sourcePopup: { value: '' } } } });
      JABS_PopupMergeController.routeMitigationPop(buildPop(), character, { mitigationType: 'parry', labelPrefix: 'Parry' });

      // Act & Assert
      expect(() => JABS_PopupMergeController.routeMitigationPop(buildPop(), character, { mitigationType: 'parry', labelPrefix: 'Parry' }))
        .not.toThrow();
    });
  });

  describe('routeRewardPop', () =>
  {
    it('dispatches immediately without opening a session when reward merging is disabled', async () =>
    {
      // Arrange
      const { JABS_PopupMergeController, textPopManagerShow } = await importFreshController();
      globalThis.J.POPUPS.EXT.ABS.Metadata.mergeParams.enableRewards = false;
      const character = {};

      // Act
      JABS_PopupMergeController.routeRewardPop(buildPop(), character, { rewardType: 'gold', amount: 10 });

      // Assert
      expect(textPopManagerShow).toHaveBeenCalledTimes(1);
    });

    it('dispatches immediately when the character has no on-map sprite', async () =>
    {
      // Arrange
      const { JABS_PopupMergeController, textPopManagerShow } = await importFreshController();
      const character = {};

      // Act
      JABS_PopupMergeController.routeRewardPop(buildPop(), character, { rewardType: 'gold', amount: 10 });

      // Assert
      expect(textPopManagerShow).toHaveBeenCalledTimes(1);
    });

    it('opens a new merge session on the first reward tick', async () =>
    {
      // Arrange
      const { JABS_PopupMergeController, spriteCharacterFor, convertSpy } = await importFreshController();
      const character = {};
      spriteCharacterFor(character);

      // Act
      JABS_PopupMergeController.routeRewardPop(buildPop({ value: '10' }), character, { rewardType: 'gold', amount: 10 });

      // Assert
      expect(convertSpy).toHaveBeenCalledTimes(1);
    });

    it('sums a repeat reward tick into the running total', async () =>
    {
      // Arrange
      const { JABS_PopupMergeController, spriteCharacterFor, convertSpy } = await importFreshController();
      const character = {};
      spriteCharacterFor(character);
      const sprite = { refreshDisplayedValue: vi.fn(), _j: { _popups: { _sourcePopup: { value: '' } } } };
      convertSpy.mockReturnValueOnce(sprite);
      JABS_PopupMergeController.routeRewardPop(buildPop({ value: '10' }), character, { rewardType: 'gold', amount: 10 });

      // Act
      const secondPop = buildPop({ value: '15' });
      JABS_PopupMergeController.routeRewardPop(secondPop, character, { rewardType: 'gold', amount: 15 });

      // Assert
      expect(secondPop.value).toBe('25');
      expect(sprite.refreshDisplayedValue).toHaveBeenCalledWith('25');
    });

    it('tolerates a repeat reward tick landing on a session whose sprite lacks refreshDisplayedValue', async () =>
    {
      // Arrange
      const { JABS_PopupMergeController, spriteCharacterFor, convertSpy } = await importFreshController();
      const character = {};
      spriteCharacterFor(character);
      convertSpy.mockReturnValueOnce({ _j: { _popups: { _sourcePopup: { value: '' } } } });
      JABS_PopupMergeController.routeRewardPop(buildPop({ value: '10' }), character, { rewardType: 'gold', amount: 10 });

      // Act & Assert
      expect(() => JABS_PopupMergeController.routeRewardPop(buildPop({ value: '15' }), character, { rewardType: 'gold', amount: 15 }))
        .not.toThrow();
    });
  });

  describe('flushCharacter', () =>
  {
    it('does nothing for a character that never opened a session', async () =>
    {
      // Arrange
      const { JABS_PopupMergeController } = await importFreshController();
      const character = {};

      // Act & Assert
      expect(() => JABS_PopupMergeController.flushCharacter(character)).not.toThrow();
    });

    it('clears sessions without releasing sprites when the character has left the map', async () =>
    {
      // Arrange
      const { JABS_PopupMergeController, spriteCharacterFor, convertSpy } = await importFreshController();
      const character = {};
      spriteCharacterFor(character);
      const sprite = { releaseAccumulatePhase: vi.fn(), destroyed: false, _j: { _popups: { _sourcePopup: { value: '' } } } };
      convertSpy.mockReturnValueOnce(sprite);
      JABS_PopupMergeController.routeRewardPop(buildPop(), character, { rewardType: 'gold', amount: 10 });

      // simulate the character leaving the current map: the locator can no longer find its sprite.
      globalThis.PopupSpriteLocator.findSpriteCharacterForGameCharacter.mockReturnValueOnce(null);

      // Act
      JABS_PopupMergeController.flushCharacter(character);

      // Assert
      expect(sprite.releaseAccumulatePhase).not.toHaveBeenCalled();
    });

    it('releases every open session sprite into bounce motion', async () =>
    {
      // Arrange
      const { JABS_PopupMergeController, spriteCharacterFor, convertSpy } = await importFreshController();
      const character = {};
      spriteCharacterFor(character);
      const sprite = { releaseAccumulatePhase: vi.fn(), destroyed: false, _j: { _popups: { _sourcePopup: { value: '' } } } };
      convertSpy.mockReturnValueOnce(sprite);
      JABS_PopupMergeController.routeRewardPop(buildPop(), character, { rewardType: 'gold', amount: 10 });

      // Act
      JABS_PopupMergeController.flushCharacter(character);

      // Assert
      expect(sprite.releaseAccumulatePhase).toHaveBeenCalledTimes(1);
    });

    it('lets a session flush cleanly when its sprite has already been destroyed', async () =>
    {
      // Arrange
      const { JABS_PopupMergeController, spriteCharacterFor, convertSpy } = await importFreshController();
      const character = {};
      spriteCharacterFor(character);
      const sprite = { releaseAccumulatePhase: vi.fn(), destroyed: true, _j: { _popups: { _sourcePopup: { value: '' } } } };
      convertSpy.mockReturnValueOnce(sprite);
      JABS_PopupMergeController.routeRewardPop(buildPop(), character, { rewardType: 'gold', amount: 10 });

      // Act
      JABS_PopupMergeController.flushCharacter(character);

      // Assert
      expect(sprite.releaseAccumulatePhase).not.toHaveBeenCalled();
    });

    it('tolerates a sprite with no release hook', async () =>
    {
      // Arrange
      const { JABS_PopupMergeController, spriteCharacterFor, convertSpy } = await importFreshController();
      const character = {};
      spriteCharacterFor(character);
      convertSpy.mockReturnValueOnce({ destroyed: false, _j: { _popups: { _sourcePopup: { value: '' } } } });
      JABS_PopupMergeController.routeRewardPop(buildPop(), character, { rewardType: 'gold', amount: 10 });

      // Act & Assert
      expect(() => JABS_PopupMergeController.flushCharacter(character)).not.toThrow();
    });

    it('allows a flushed character to open a brand new session afterward', async () =>
    {
      // Arrange
      const { JABS_PopupMergeController, spriteCharacterFor, convertSpy } = await importFreshController();
      const character = {};
      spriteCharacterFor(character);
      JABS_PopupMergeController.routeRewardPop(buildPop(), character, { rewardType: 'gold', amount: 10 });
      JABS_PopupMergeController.flushCharacter(character);

      // Act
      JABS_PopupMergeController.routeRewardPop(buildPop(), character, { rewardType: 'gold', amount: 5 });

      // Assert: a second, brand new session was opened rather than reusing the flushed one.
      expect(convertSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe('tickIdleFlush', () =>
  {
    it('does nothing when no character currently owns an open session', async () =>
    {
      // Arrange
      const { JABS_PopupMergeController } = await importFreshController();

      // Act & Assert
      expect(() => JABS_PopupMergeController.tickIdleFlush()).not.toThrow();
    });

    it('leaves a session open while it is still within the idle window', async () =>
    {
      // Arrange
      const { JABS_PopupMergeController, spriteCharacterFor, convertSpy } = await importFreshController();
      const character = {};
      spriteCharacterFor(character);
      const sprite = { releaseAccumulatePhase: vi.fn(), destroyed: false, _j: { _popups: { _sourcePopup: { value: '' } } } };
      convertSpy.mockReturnValueOnce(sprite);
      JABS_PopupMergeController.routeRewardPop(buildPop(), character, { rewardType: 'gold', amount: 10 });
      globalThis.Graphics.frameCount = 10;

      // Act
      JABS_PopupMergeController.tickIdleFlush();

      // Assert
      expect(sprite.releaseAccumulatePhase).not.toHaveBeenCalled();
    });

    it('releases and drops a session once it has been idle past the configured window', async () =>
    {
      // Arrange
      const { JABS_PopupMergeController, spriteCharacterFor, convertSpy } = await importFreshController();
      const character = {};
      spriteCharacterFor(character);
      const sprite = { releaseAccumulatePhase: vi.fn(), destroyed: false, _j: { _popups: { _sourcePopup: { value: '' } } } };
      convertSpy.mockReturnValueOnce(sprite);
      JABS_PopupMergeController.routeRewardPop(buildPop(), character, { rewardType: 'gold', amount: 10 });
      globalThis.Graphics.frameCount = 200;

      // Act
      JABS_PopupMergeController.tickIdleFlush();

      // Assert
      expect(sprite.releaseAccumulatePhase).toHaveBeenCalledTimes(1);
    });

    it('drops sessions outright when the character has left the map', async () =>
    {
      // Arrange
      const { JABS_PopupMergeController, spriteCharacterFor, convertSpy } = await importFreshController();
      const character = {};
      spriteCharacterFor(character);
      const sprite = { releaseAccumulatePhase: vi.fn(), destroyed: false, _j: { _popups: { _sourcePopup: { value: '' } } } };
      convertSpy.mockReturnValueOnce(sprite);
      JABS_PopupMergeController.routeRewardPop(buildPop(), character, { rewardType: 'gold', amount: 10 });
      globalThis.PopupSpriteLocator.findSpriteCharacterForGameCharacter.mockReturnValue(null);

      // Act
      JABS_PopupMergeController.tickIdleFlush();

      // Assert: dropped without a release call (no sprite anchor left to animate).
      expect(sprite.releaseAccumulatePhase).not.toHaveBeenCalled();

      // and the session is gone — a fresh idle tick has nothing left to do.
      expect(() => JABS_PopupMergeController.tickIdleFlush()).not.toThrow();
    });

    it('lets each session on the same character expire on its own independent timeline', async () =>
    {
      // Arrange
      const { JABS_PopupMergeController, spriteCharacterFor, convertSpy } = await importFreshController();
      const character = {};
      spriteCharacterFor(character);
      const goldSprite = { releaseAccumulatePhase: vi.fn(), destroyed: false, _j: { _popups: { _sourcePopup: { value: '' } } } };
      convertSpy.mockReturnValueOnce(goldSprite);
      JABS_PopupMergeController.routeRewardPop(buildPop(), character, { rewardType: 'gold', amount: 10 });

      globalThis.Graphics.frameCount = 100;
      const expSprite = { releaseAccumulatePhase: vi.fn(), destroyed: false, _j: { _popups: { _sourcePopup: { value: '' } } } };
      convertSpy.mockReturnValueOnce(expSprite);
      JABS_PopupMergeController.routeRewardPop(buildPop(), character, { rewardType: 'exp', amount: 5 });

      // Act: gold's window (started at frame 0) has expired by frame 100, exp's (started at frame 100) has not.
      JABS_PopupMergeController.tickIdleFlush();

      // Assert
      expect(goldSprite.releaseAccumulatePhase).toHaveBeenCalledTimes(1);
      expect(expSprite.releaseAccumulatePhase).not.toHaveBeenCalled();
    });
  });

  describe('flushAllCharacters', () =>
  {
    it('releases sessions for every currently tracked character', async () =>
    {
      // Arrange
      const { JABS_PopupMergeController, spriteCharacterFor, convertSpy } = await importFreshController();
      const characterA = {};
      const characterB = {};
      spriteCharacterFor(characterA);
      spriteCharacterFor(characterB);
      const spriteA = { releaseAccumulatePhase: vi.fn(), destroyed: false, _j: { _popups: { _sourcePopup: { value: '' } } } };
      const spriteB = { releaseAccumulatePhase: vi.fn(), destroyed: false, _j: { _popups: { _sourcePopup: { value: '' } } } };
      convertSpy.mockReturnValueOnce(spriteA).mockReturnValueOnce(spriteB);
      JABS_PopupMergeController.routeRewardPop(buildPop(), characterA, { rewardType: 'gold', amount: 10 });
      JABS_PopupMergeController.routeRewardPop(buildPop(), characterB, { rewardType: 'gold', amount: 20 });

      // Act
      JABS_PopupMergeController.flushAllCharacters();

      // Assert
      expect(spriteA.releaseAccumulatePhase).toHaveBeenCalledTimes(1);
      expect(spriteB.releaseAccumulatePhase).toHaveBeenCalledTimes(1);
    });

    it('does nothing when no character currently owns an open session', async () =>
    {
      // Arrange
      const { JABS_PopupMergeController } = await importFreshController();

      // Act & Assert
      expect(() => JABS_PopupMergeController.flushAllCharacters()).not.toThrow();
    });
  });

  describe('start', () =>
  {
    it('subscribes exactly once to the merge-flush-all event, even across repeat calls', async () =>
    {
      // Arrange: importing the module already invokes start() once at module load time (see the
      // bottom of JABS_PopupMergeController.js), so the emitter should already be subscribed here.
      const { JABS_PopupMergeController } = await importFreshController();
      const onSpy = globalThis.J.POPUPS.Helpers.PopupEmitter.on;
      expect(onSpy).toHaveBeenCalledTimes(1);

      // Act: calling start() again should be a no-op guarded by the started flag.
      JABS_PopupMergeController.start();

      // Assert
      expect(onSpy).toHaveBeenCalledTimes(1);
    });

    it('flushes every tracked character when the merge-flush-all event fires', async () =>
    {
      // Arrange
      const { JABS_PopupMergeController, spriteCharacterFor, convertSpy } = await importFreshController();
      const character = {};
      spriteCharacterFor(character);
      const sprite = { releaseAccumulatePhase: vi.fn(), destroyed: false, _j: { _popups: { _sourcePopup: { value: '' } } } };
      convertSpy.mockReturnValueOnce(sprite);
      JABS_PopupMergeController.routeRewardPop(buildPop(), character, { rewardType: 'gold', amount: 10 });
      const [ [ , handler ] ] = globalThis.J.POPUPS.Helpers.PopupEmitter.on.mock.calls;

      // Act
      handler();

      // Assert
      expect(sprite.releaseAccumulatePhase).toHaveBeenCalledTimes(1);
    });
  });
});
//endregion plugins/popups/_component/merge-controller-routing.test.js
