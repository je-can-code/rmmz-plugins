//region plugins/omni/ext/quest/managers/_component/jabs-input-adapter.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('JABS_InputAdapter ext/quest augments (direct src import)', () =>
{
  let FakeSceneQuestopedia;

  beforeAll(async () =>
  {
    vi.resetModules();

    // Scene_Questopedia.js is a UI scene, low test value and irrelevant to this input-wiring test;
    // mock it so importing the adapter doesn't drag in the whole scene file.
    FakeSceneQuestopedia = { callScene: vi.fn() };
    vi.doMock('../../../../../../../src/plugins/omni/ext/quest/scenes/Scene_Questopedia.js', () => ({ default: FakeSceneQuestopedia }));

    // the whole source file is gated behind `if (J.ABS)` at module-load time.
    globalThis.J = { ABS: true };
    globalThis.JABS_InputAdapter = {};

    await import('../../../../../../../src/plugins/omni/ext/quest/managers/JABS_InputAdapter.js');
  });

  beforeEach(() =>
  {
    vi.clearAllMocks();
    globalThis.SceneManager = { _scene: { isMapScene: vi.fn().mockReturnValue(true) } };
    globalThis.$gameMessage = { isBusy: vi.fn().mockReturnValue(false) };
    globalThis.$gamePlayer = { isTransferring: vi.fn().mockReturnValue(false) };
  });

  describe('performQuestopediaAction', () =>
  {
    it('calls the questopedia scene when allowed', () =>
    {
      // Arrange/Act
      globalThis.JABS_InputAdapter.performQuestopediaAction();

      // Assert
      expect(FakeSceneQuestopedia.callScene).toHaveBeenCalled();
    });

    it('does not call the scene when not on the map scene', () =>
    {
      // Arrange
      globalThis.SceneManager._scene.isMapScene.mockReturnValue(false);

      // Act
      globalThis.JABS_InputAdapter.performQuestopediaAction();

      // Assert
      expect(FakeSceneQuestopedia.callScene).not.toHaveBeenCalled();
    });

    it('does not call the scene while a message is busy', () =>
    {
      // Arrange
      globalThis.$gameMessage.isBusy.mockReturnValue(true);

      // Act
      globalThis.JABS_InputAdapter.performQuestopediaAction();

      // Assert
      expect(FakeSceneQuestopedia.callScene).not.toHaveBeenCalled();
    });

    it('does not call the scene while the player is transferring', () =>
    {
      // Arrange
      globalThis.$gamePlayer.isTransferring.mockReturnValue(true);

      // Act
      globalThis.JABS_InputAdapter.performQuestopediaAction();

      // Assert
      expect(FakeSceneQuestopedia.callScene).not.toHaveBeenCalled();
    });
  });
});
//endregion plugins/omni/ext/quest/managers/_component/jabs-input-adapter.test.js
