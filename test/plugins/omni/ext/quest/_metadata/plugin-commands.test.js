//region plugins/omni/ext/quest/_metadata/plugin-commands.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('J-OMNI-Quests plugin commands (direct src import)', () =>
{
  let handlers;
  let FakeQuestManager;
  let fakeQuest;

  beforeAll(async () =>
  {
    vi.resetModules();

    fakeQuest = {
      flagAsCompleted: vi.fn(),
      flagAsFailed: vi.fn(),
      flagAsMissed: vi.fn(),
    };

    FakeQuestManager = {
      unlockQuestByKey: vi.fn(),
      progressQuest: vi.fn(),
      quest: vi.fn(() => fakeQuest),
      setQuestTrackingByKey: vi.fn(),
    };
    vi.doMock(
      '../../../../../../src/plugins/omni/ext/quest/managers/QuestManager.js',
      () => ({ default: FakeQuestManager }));

    globalThis.J = { OMNI: { EXT: { QUEST: { Metadata: { name: 'J-OMNI-Quests' } } } } };

    handlers = {};
    globalThis.PluginManager = {
      registerCommand: vi.fn((pluginName, commandName, handler) =>
      {
        handlers[commandName] = handler;
      }),
    };

    await import('../../../../../../src/plugins/omni/ext/quest/_metadata/pluginCommands.js');
  });

  beforeEach(() =>
  {
    // the handlers are registered once for the whole file, so the call history is what has to be
    // reset between branches rather than the registration itself.
    Object.values(FakeQuestManager)
      .forEach(mocked => mocked.mockClear());
    Object.values(fakeQuest)
      .forEach(mocked => mocked.mockClear());
  });

  it('registers every command under the questopedia plugin name', () =>
  {
    // Arrange & Act (registration happened in beforeAll)

    // Assert
    expect(Object.keys(handlers))
      .toEqual([ 'unlock-quests', 'progress-quest', 'finalize-quest', 'set-quest-tracking' ]);
  });

  describe('unlock-quests', () =>
  {
    it('unlocks every key in the serialized list the editor provides', () =>
    {
      // Arrange & Act
      handlers['unlock-quests']({ keys: '["side-001","side-002"]' });

      // Assert
      expect(FakeQuestManager.unlockQuestByKey).toHaveBeenCalledTimes(2);
      expect(FakeQuestManager.unlockQuestByKey).toHaveBeenCalledWith('side-001');
      expect(FakeQuestManager.unlockQuestByKey).toHaveBeenCalledWith('side-002');
    });
  });

  describe('progress-quest', () =>
  {
    it('progresses the quest matching the given key', () =>
    {
      // Arrange & Act
      handlers['progress-quest']({ key: 'side-003' });

      // Assert
      expect(FakeQuestManager.progressQuest).toHaveBeenCalledWith('side-003');
    });
  });

  describe('finalize-quest', () =>
  {
    // every one of these passes the state as a string, because that is what the editor actually
    // writes into the event command- a number here would not exercise the real path.
    it('flags the quest as completed for the completed state', () =>
    {
      // Arrange & Act
      handlers['finalize-quest']({ key: 'side-003', state: '0' });

      // Assert
      expect(fakeQuest.flagAsCompleted).toHaveBeenCalled();
    });

    it('flags the quest as failed for the failed state', () =>
    {
      // Arrange & Act
      handlers['finalize-quest']({ key: 'side-003', state: '1' });

      // Assert
      expect(fakeQuest.flagAsFailed).toHaveBeenCalled();
    });

    it('flags the quest as missed for the missed state', () =>
    {
      // Arrange & Act
      handlers['finalize-quest']({ key: 'side-003', state: '2' });

      // Assert
      expect(fakeQuest.flagAsMissed).toHaveBeenCalled();
    });

    it('leaves the quest untouched when the state is not one of the finalized states', () =>
    {
      // Arrange & Act
      handlers['finalize-quest']({ key: 'side-003', state: 'abandoned' });

      // Assert
      expect(fakeQuest.flagAsCompleted).not.toHaveBeenCalled();
      expect(fakeQuest.flagAsFailed).not.toHaveBeenCalled();
      expect(fakeQuest.flagAsMissed).not.toHaveBeenCalled();
    });
  });

  describe('set-quest-tracking', () =>
  {
    it('tracks the quest when the editor asks for tracking', () =>
    {
      // Arrange & Act
      handlers['set-quest-tracking']({ key: 'side-003', trackingState: 'true' });

      // Assert
      expect(FakeQuestManager.setQuestTrackingByKey).toHaveBeenCalledWith('side-003', true);
    });

    it('untracks the quest when the editor asks to stop tracking', () =>
    {
      // Arrange & Act
      handlers['set-quest-tracking']({ key: 'side-003', trackingState: 'false' });

      // Assert: a stringy "false" is truthy, so this has to arrive as a real boolean.
      expect(FakeQuestManager.setQuestTrackingByKey).toHaveBeenCalledWith('side-003', false);
    });
  });
});
//endregion plugins/omni/ext/quest/_metadata/plugin-commands.test.js
