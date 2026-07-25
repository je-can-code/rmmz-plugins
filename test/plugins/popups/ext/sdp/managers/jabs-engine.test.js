//region plugins/popups/ext/sdp/managers/jabs-engine.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('JABS_Engine ext/sdp augments (direct src import)', () =>
{
  let JABS_Engine;

  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = { POPUPS: { EXT: { SDP: { Aliased: { JABS_Engine: new Map() } } } }, SDP: { Metadata: { panelsMap: new Map() } } };

    function StubJABSEngine()
    {
    }

    StubJABSEngine.prototype.onSdpRewardGranted = vi.fn();
    StubJABSEngine.prototype.onSdpPanelUnlocked = vi.fn();
    globalThis.JABS_Engine = StubJABSEngine;

    globalThis.Map_TextPop = { Types: { Sdp: 'sdp' } };
    globalThis.JABS_PopupMergeController = { routeRewardPop: vi.fn() };
    globalThis.TextPopManager = { show: vi.fn() };

    function FakeTextPopBuilder(value)
    {
      this.value = value;
      this.calls = [];
    }
    FakeTextPopBuilder.prototype.isSdpPoints = function()
    {
      this.calls.push([ 'isSdpPoints' ]);
      return this;
    };
    FakeTextPopBuilder.prototype.build = function()
    {
      return { value: this.value, calls: this.calls };
    };
    globalThis.TextPopBuilder = FakeTextPopBuilder;

    await import('../../../../../../src/plugins/popups/ext/sdp/managers/JABS_Engine.js');
    ({ JABS_Engine } = globalThis);
  });

  beforeEach(() =>
  {
    vi.clearAllMocks();
    globalThis.J.SDP.Metadata.panelsMap.clear();
  });

  describe('onSdpRewardGranted', () =>
  {
    it('always calls through to the original aliased implementation', () =>
    {
      // Arrange
      const engine = new JABS_Engine();
      const character = {};

      // Act
      engine.onSdpRewardGranted(10, character);

      // Assert
      expect(globalThis.J.POPUPS.EXT.SDP.Aliased.JABS_Engine.get('onSdpRewardGranted')).toHaveBeenCalledWith(10, character);
    });

    it('routes a reward pop with the sdp points', () =>
    {
      // Arrange
      const engine = new JABS_Engine();
      const character = {};

      // Act
      engine.onSdpRewardGranted(10, character);

      // Assert
      expect(globalThis.JABS_PopupMergeController.routeRewardPop).toHaveBeenCalledWith(
        expect.objectContaining({ value: 10 }),
        character,
        { rewardType: 'sdp', amount: 10 },
      );
    });
  });

  describe('onSdpPanelUnlocked', () =>
  {
    it('always calls through to the original aliased implementation', () =>
    {
      // Arrange
      const engine = new JABS_Engine();
      globalThis.J.SDP.Metadata.panelsMap.set('panel-1', { name: 'Panel' });
      const character = {};

      // Act
      engine.onSdpPanelUnlocked('panel-1', character);

      // Assert
      expect(globalThis.J.POPUPS.EXT.SDP.Aliased.JABS_Engine.get('onSdpPanelUnlocked')).toHaveBeenCalledWith('panel-1', character);
    });

    it('shows a popup with the unlocked panel name', () =>
    {
      // Arrange
      const engine = new JABS_Engine();
      globalThis.J.SDP.Metadata.panelsMap.set('panel-1', { name: 'Panel' });
      const character = {};

      // Act
      engine.onSdpPanelUnlocked('panel-1', character);

      // Assert
      const [ [ pop, shownCharacter ] ] = globalThis.TextPopManager.show.mock.calls;
      expect(pop.value).toEqual('Panel');
      expect(shownCharacter).toBe(character);
    });
  });
});
//endregion plugins/popups/ext/sdp/managers/jabs-engine.test.js
