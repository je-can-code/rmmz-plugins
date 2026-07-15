//region plugins/sks/core/_metadata/plugin-commands.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('J-SkillSlots plugin commands (direct src import)', () =>
{
  let handler;

  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = { SKS: { Metadata: { name: 'J-SkillSlots' } } };
    globalThis.PluginManager = {
      registerCommand: vi.fn((pluginName, commandName, callback) =>
      {
        handler = callback;
      }),
    };

    await import('../../../../../src/plugins/sks/core/_metadata/pluginCommands.js');
  });

  beforeEach(() =>
  {
    globalThis.$gameParty = { members: vi.fn().mockReturnValue([]) };
  });

  it('registers the mod-slot-points-party command under the J-SkillSlots plugin name', () =>
  {
    // Arrange/Act (registration happened in beforeAll)

    // Assert
    expect(globalThis.PluginManager.registerCommand).toHaveBeenCalledWith(
      'J-SkillSlots',
      'mod-slot-points-party',
      expect.any(Function),
    );
  });

  it('applies the parsed points modification to every current party member', () =>
  {
    // Arrange
    const memberA = { modifyMaxSlotPoints: vi.fn() };
    const memberB = { modifyMaxSlotPoints: vi.fn() };
    globalThis.$gameParty.members.mockReturnValue([ memberA, memberB ]);

    // Act
    handler({ points: '5' });

    // Assert
    expect(memberA.modifyMaxSlotPoints).toHaveBeenCalledWith(5);
    expect(memberB.modifyMaxSlotPoints).toHaveBeenCalledWith(5);
  });
});
//endregion plugins/sks/core/_metadata/plugin-commands.test.js
