//region plugins/popups/apt/_component/jabs-engine.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('JABS_Engine ext/apt augments (direct src import)', () =>
{
  let JABS_Engine;

  beforeAll(async () =>
  {
    vi.resetModules();

    // the aliasing map the augment reads from/writes to; mirrors what
    // ext/apt/_metadata/initialization.js sets up in the real boot sequence.
    globalThis.J = {
      POPUPS: {
        EXT: {
          APT: {
            Aliased: {
              JABS_Engine: new Map(),
            },
          },
        },
      },
    };

    // bare JABS_Engine stand-in; the original methods are spies so we can assert
    // the augment still calls through to the pre-existing behavior.
    function StubJABS_Engine()
    {
    }

    StubJABS_Engine.prototype.gainAptitudeReward = vi.fn();
    StubJABS_Engine.prototype.onTypedApGained = vi.fn();
    globalThis.JABS_Engine = StubJABS_Engine;

    globalThis.Map_TextPop = { Types: { Ap: 'ap' } };

    // TextPopBuilder is used fluently (isAptitude().setIconIndex().build()), so the stub
    // must return itself from every chained setter and hand back a plain object from build().
    function StubTextPopBuilder(value)
    {
      this.value = value;
      this.iconIndex = undefined;
    }

    StubTextPopBuilder.prototype.isAptitude = vi.fn(function()
    {
      return this;
    });
    StubTextPopBuilder.prototype.setIconIndex = vi.fn(function(iconIndex)
    {
      this.iconIndex = iconIndex;
      return this;
    });
    StubTextPopBuilder.prototype.build = vi.fn(function()
    {
      return { value: this.value, iconIndex: this.iconIndex };
    });
    globalThis.TextPopBuilder = StubTextPopBuilder;

    globalThis.JABS_PopupMergeController = { routeRewardPop: vi.fn() };
    globalThis.TextPopManager = { show: vi.fn() };
    globalThis.ApManager = { apTypeDisplay: vi.fn() };
    globalThis.JABS_AiManager = { getBattlerByUuid: vi.fn() };
    globalThis.$gameParty = { members: vi.fn() };

    // apply the ext/apt augment onto the bare JABS_Engine stand-in.
    await import('../../../../../src/plugins/popups/ext/apt/managers/JABS_Engine.js');
    ({ JABS_Engine } = globalThis);
  });

  beforeEach(() =>
  {
    vi.clearAllMocks();
  });

  describe('gainAptitudeReward', () =>
  {
    it('always calls through to the original aliased implementation', () =>
    {
      // Arrange
      const engine = new JABS_Engine();
      engine.canGainAptitudeReward = vi.fn()
        .mockReturnValue(false);
      globalThis.$gameParty.members.mockReturnValue([]);
      const actor = {};
      const enemy = {};

      // Act
      engine.gainAptitudeReward(0, actor, enemy);

      // Assert
      expect(globalThis.J.POPUPS.EXT.APT.Aliased.JABS_Engine.get('gainAptitudeReward')).toHaveBeenCalledWith(0, actor, enemy);
    });

    it('does not build any popups when the reward amount is zero', () =>
    {
      // Arrange
      const engine = new JABS_Engine();
      engine.canGainAptitudeReward = vi.fn()
        .mockReturnValue(true);
      globalThis.$gameParty.members.mockReturnValue([ {} ]);

      // Act
      engine.gainAptitudeReward(0, {}, {});

      // Assert
      expect(globalThis.$gameParty.members).not.toHaveBeenCalled();
      expect(globalThis.JABS_PopupMergeController.routeRewardPop).not.toHaveBeenCalled();
    });

    it('skips a member that fails the canGainAptitudeReward check', () =>
    {
      // Arrange
      const engine = new JABS_Engine();
      const member = {};
      engine.canGainAptitudeReward = vi.fn()
        .mockReturnValue(false);
      globalThis.$gameParty.members.mockReturnValue([ member ]);

      // Act
      engine.gainAptitudeReward(10, {}, {});

      // Assert
      expect(globalThis.JABS_AiManager.getBattlerByUuid).not.toHaveBeenCalled();
      expect(globalThis.JABS_PopupMergeController.routeRewardPop).not.toHaveBeenCalled();
    });

    it('skips a qualifying member with no associated JABS battler', () =>
    {
      // Arrange
      const engine = new JABS_Engine();
      const member = { getUuid: () => 'uuid-1' };
      engine.canGainAptitudeReward = vi.fn()
        .mockReturnValue(true);
      globalThis.$gameParty.members.mockReturnValue([ member ]);
      globalThis.JABS_AiManager.getBattlerByUuid.mockReturnValue(null);

      // Act
      engine.gainAptitudeReward(10, {}, {});

      // Assert
      expect(globalThis.JABS_PopupMergeController.routeRewardPop).not.toHaveBeenCalled();
    });

    it('routes a scaled Ap popup for each qualifying member with a JABS battler', () =>
    {
      // Arrange
      const character = {};
      const member = { getUuid: () => 'uuid-1' };
      const jabsBattler = {
        getCharacter: () => character,
      };
      const engine = new JABS_Engine();
      engine.canGainAptitudeReward = vi.fn()
        .mockReturnValue(true);
      engine.getRewardScalingMultiplier = vi.fn()
        .mockReturnValue(1.5);
      globalThis.$gameParty.members.mockReturnValue([ member ]);
      globalThis.JABS_AiManager.getBattlerByUuid.mockReturnValue(jabsBattler);

      // Act
      engine.gainAptitudeReward(10, {}, {});

      // Assert
      // 10 * 1.5 = 15, rounded up via Math.ceil (already whole here, but confirms the ceil path).
      expect(globalThis.JABS_PopupMergeController.routeRewardPop).toHaveBeenCalledWith(
        expect.objectContaining({ value: 15 }),
        character,
        expect.objectContaining({ rewardType: 'ap', amount: 15 }),
      );
    });

    it('rounds a fractional scaled reward up via Math.ceil', () =>
    {
      // Arrange
      const member = { getUuid: () => 'uuid-1' };
      const jabsBattler = { getCharacter: () => ({}) };
      const engine = new JABS_Engine();
      engine.canGainAptitudeReward = vi.fn()
        .mockReturnValue(true);
      engine.getRewardScalingMultiplier = vi.fn()
        .mockReturnValue(1.1);
      globalThis.$gameParty.members.mockReturnValue([ member ]);
      globalThis.JABS_AiManager.getBattlerByUuid.mockReturnValue(jabsBattler);

      // Act
      engine.gainAptitudeReward(10, {}, {});

      // Assert
      expect(globalThis.JABS_PopupMergeController.routeRewardPop).toHaveBeenCalledWith(
        expect.objectContaining({ value: 11 }),
        expect.anything(),
        expect.objectContaining({ amount: 11 }),
      );
    });
  });

  describe('onTypedApGained', () =>
  {
    it('always calls through to the original aliased implementation', () =>
    {
      // Arrange
      const engine = new JABS_Engine();
      globalThis.ApManager.apTypeDisplay.mockReturnValue({ name: 'Vigor', icon: 42 });
      const character = {};

      // Act
      engine.onTypedApGained(5, character, 'vigor');

      // Assert
      expect(globalThis.J.POPUPS.EXT.APT.Aliased.JABS_Engine.get('onTypedApGained')).toHaveBeenCalledWith(5, character, 'vigor');
    });

    it('shows a typed-Ap popup carrying the resolved icon and amount/name text', () =>
    {
      // Arrange
      const engine = new JABS_Engine();
      globalThis.ApManager.apTypeDisplay.mockReturnValue({ name: 'Vigor', icon: 42 });
      const character = {};

      // Act
      engine.onTypedApGained(5, character, 'vigor');

      // Assert
      expect(globalThis.ApManager.apTypeDisplay).toHaveBeenCalledWith('vigor');
      expect(globalThis.TextPopManager.show).toHaveBeenCalledWith(
        expect.objectContaining({ value: '5 [Vigor]', iconIndex: 42 }),
        character,
      );
    });
  });
});
//endregion plugins/popups/apt/_component/jabs-engine.test.js
