//region plugins/sdp/core/_metadata/plugin-commands.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('J-SDP plugin commands (direct src import)', () =>
{
  let handlers;
  let FakeSceneSDP;

  beforeAll(async () =>
  {
    vi.resetModules();

    // Scene_SDP.js is a 1600+ line UI scene, low test value and irrelevant to this command-wiring
    // test; mock it so importing pluginCommands.js doesn't drag in the whole scene file.
    FakeSceneSDP = { callScene: vi.fn() };
    vi.doMock('../../../../../src/plugins/sdp/core/scenes/Scene_SDP.js', () => ({ default: FakeSceneSDP }));

    globalThis.J = { SDP: { Metadata: { name: 'J-SDP' } } };

    handlers = {};
    globalThis.PluginManager = {
      registerCommand: vi.fn((pluginName, commandName, handler) =>
      {
        handlers[commandName] = handler;
      }),
    };

    await import('../../../../../src/plugins/sdp/core/_metadata/pluginCommands.js');
  });

  beforeEach(() =>
  {
    vi.clearAllMocks();
    globalThis.$gameParty = { unlockSdp: vi.fn(), lockSdp: vi.fn(), members: vi.fn().mockReturnValue([]) };
    globalThis.$gameActors = { actor: vi.fn() };
  });

  it('registers all five commands under the J-SDP plugin name', () =>
  {
    // Arrange/Act (registration happened in beforeAll)

    // Assert
    expect(Object.keys(handlers)).toEqual([
      'Call SDP Menu',
      'Unlock SDP',
      'Lock SDP',
      'Modify SDP points',
      'Modify party SDP points',
    ]);
  });

  describe('Call SDP Menu', () =>
  {
    it('calls the SDP scene', () =>
    {
      // Arrange/Act
      handlers['Call SDP Menu']();

      // Assert
      expect(FakeSceneSDP.callScene).toHaveBeenCalled();
    });
  });

  describe('Unlock SDP', () =>
  {
    it('unlocks every panel key parsed from the args', () =>
    {
      // Arrange
      const args = { keys: JSON.stringify([ 'panel-1', 'panel-2' ]) };

      // Act
      handlers['Unlock SDP'](args);

      // Assert
      expect(globalThis.$gameParty.unlockSdp).toHaveBeenCalledWith('panel-1');
      expect(globalThis.$gameParty.unlockSdp).toHaveBeenCalledWith('panel-2');
    });
  });

  describe('Lock SDP', () =>
  {
    it('locks every panel key parsed from the args', () =>
    {
      // Arrange
      const args = { keys: JSON.stringify([ 'panel-1' ]) };

      // Act
      handlers['Lock SDP'](args);

      // Assert
      expect(globalThis.$gameParty.lockSdp).toHaveBeenCalledWith('panel-1');
    });
  });

  describe('Modify SDP points', () =>
  {
    it('parses the actorId/sdpPoints and modifies that actor\'s points', () =>
    {
      // Arrange
      const actor = { modSdpPoints: vi.fn() };
      globalThis.$gameActors.actor.mockReturnValue(actor);
      const args = { actorId: '3', sdpPoints: '25' };

      // Act
      handlers['Modify SDP points'](args);

      // Assert
      expect(globalThis.$gameActors.actor).toHaveBeenCalledWith(3);
      expect(actor.modSdpPoints).toHaveBeenCalledWith(25);
    });
  });

  describe('Modify party SDP points', () =>
  {
    it('parses sdpPoints and modifies every current party member', () =>
    {
      // Arrange
      const memberA = { modSdpPoints: vi.fn() };
      const memberB = { modSdpPoints: vi.fn() };
      globalThis.$gameParty.members.mockReturnValue([ memberA, memberB ]);
      const args = { sdpPoints: '10' };

      // Act
      handlers['Modify party SDP points'](args);

      // Assert
      expect(memberA.modSdpPoints).toHaveBeenCalledWith(10);
      expect(memberB.modSdpPoints).toHaveBeenCalledWith(10);
    });
  });
});
//endregion plugins/sdp/core/_metadata/plugin-commands.test.js
