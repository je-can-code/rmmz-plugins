//region plugins/omni/ext/quest/objects/_component/jabs-standard-controller.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('JABS_StandardController ext/quest augments (direct src import)', () =>
{
  let JABS_StandardController;

  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = { OMNI: { EXT: { QUEST: { Aliased: { JABS_StandardController: new Map() } } } } };

    function StubController()
    {
    }

    StubController.prototype.update = vi.fn();
    globalThis.JABS_StandardController = StubController;
    globalThis.JABS_InputAdapter = { performQuestopediaAction: vi.fn() };
    globalThis.Input = { isActionTriggered: vi.fn() };

    await import('../../../../../../../src/plugins/omni/ext/quest/objects/JABS_StandardController.js');
    ({ JABS_StandardController } = globalThis);
  });

  beforeEach(() =>
  {
    vi.clearAllMocks();
  });

  describe('update/updateQuestopediaAction', () =>
  {
    it('always calls through to the original aliased implementation', () =>
    {
      // Arrange
      const controller = new JABS_StandardController();
      globalThis.Input.isActionTriggered.mockReturnValue(false);

      // Act
      controller.update();

      // Assert
      expect(globalThis.J.OMNI.EXT.QUEST.Aliased.JABS_StandardController.get('update')).toHaveBeenCalled();
    });

    it('performs the questopedia action when the shortcut is triggered', () =>
    {
      // Arrange
      const controller = new JABS_StandardController();
      globalThis.Input.isActionTriggered.mockReturnValue(true);

      // Act
      controller.update();

      // Assert
      expect(globalThis.Input.isActionTriggered).toHaveBeenCalledWith('J.OMNI.QUEST', 'open-quest-log');
      expect(globalThis.JABS_InputAdapter.performQuestopediaAction).toHaveBeenCalled();
    });

    it('does not perform the action when the shortcut is not triggered', () =>
    {
      // Arrange
      const controller = new JABS_StandardController();
      globalThis.Input.isActionTriggered.mockReturnValue(false);

      // Act
      controller.update();

      // Assert
      expect(globalThis.JABS_InputAdapter.performQuestopediaAction).not.toHaveBeenCalled();
    });
  });
});
//endregion plugins/omni/ext/quest/objects/_component/jabs-standard-controller.test.js
