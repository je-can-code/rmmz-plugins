//region plugins/map/core/objects/jabs-input-controller.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('JABS_StandardController ext/map augments (direct src import)', () =>
{
  let JABS_StandardController;

  beforeAll(async () =>
  {
    vi.resetModules();

    // the whole source file is gated behind `if (J.ABS)` at module-load time.
    globalThis.J = { ABS: true, MAP: { Aliased: { JABS_StandardController: new Map() } } };

    function StubJABS_StandardController()
    {
    }

    StubJABS_StandardController.prototype.initMembers = vi.fn();
    StubJABS_StandardController.prototype.update = vi.fn();
    globalThis.JABS_StandardController = StubJABS_StandardController;

    globalThis.JABS_InputAdapter = {
      performMinimapWindowAction: vi.fn(),
      performMinimapFocusStart: vi.fn(),
      performMinimapFocusEnd: vi.fn(),
    };

    globalThis.Input = { isActionTriggered: vi.fn(), isActionPressed: vi.fn() };

    await import('../../../../../src/plugins/map/core/objects/JABS_InputController.js');
    ({ JABS_StandardController } = globalThis);
  });

  beforeEach(() =>
  {
    vi.clearAllMocks();
    globalThis.$gameMap = { isMinimapBlocked: vi.fn().mockReturnValue(false) };
  });

  describe('initMembers', () =>
  {
    it('always calls through to the original aliased implementation', () =>
    {
      // Arrange
      const controller = new JABS_StandardController();

      // Act
      controller.initMembers();

      // Assert
      expect(globalThis.J.MAP.Aliased.JABS_StandardController.get('initMembers')).toHaveBeenCalled();
    });

    it('initializes the prior-frame minimap focus press state to false', () =>
    {
      // Arrange
      const controller = new JABS_StandardController();

      // Act
      controller.initMembers();

      // Assert
      expect(controller.getMinimapFocusPressedPrev()).toEqual(false);
    });
  });

  describe('getMinimapFocusPressedPrev/setMinimapFocusPressedPrev', () =>
  {
    it('stores a literal true value as pressed', () =>
    {
      // Arrange
      const controller = new JABS_StandardController();

      // Act
      controller.setMinimapFocusPressedPrev(true);

      // Assert
      expect(controller.getMinimapFocusPressedPrev()).toEqual(true);
    });

    it('coerces a merely truthy (non-boolean-true) value to false, via strict equality', () =>
    {
      // Arrange
      const controller = new JABS_StandardController();

      // Act
      controller.setMinimapFocusPressedPrev(1);

      // Assert
      expect(controller.getMinimapFocusPressedPrev()).toEqual(false);
    });

    it('coerces a falsy set value to strictly false', () =>
    {
      // Arrange
      const controller = new JABS_StandardController();
      controller.setMinimapFocusPressedPrev(true);

      // Act
      controller.setMinimapFocusPressedPrev(0);

      // Assert
      expect(controller.getMinimapFocusPressedPrev()).toEqual(false);
    });
  });

  describe('update', () =>
  {
    it('always calls through to the original aliased implementation', () =>
    {
      // Arrange
      const controller = new JABS_StandardController();
      controller.initMembers();
      globalThis.Input.isActionTriggered.mockReturnValue(false);
      globalThis.Input.isActionPressed.mockReturnValue(false);

      // Act
      controller.update();

      // Assert
      expect(globalThis.J.MAP.Aliased.JABS_StandardController.get('update')).toHaveBeenCalled();
    });

    it('dispatches to both the minimap window action and the focus-peek action', () =>
    {
      // Arrange
      const controller = new JABS_StandardController();
      controller.initMembers();
      globalThis.Input.isActionTriggered.mockReturnValue(true);
      globalThis.Input.isActionPressed.mockReturnValue(false);

      // Act
      controller.update();

      // Assert
      expect(globalThis.JABS_InputAdapter.performMinimapWindowAction).toHaveBeenCalled();
    });
  });

  describe('isMiniMapWindowActionTriggered/performMiniMapWindowAction', () =>
  {
    it('performs the window action when the toggle input is triggered', () =>
    {
      // Arrange
      const controller = new JABS_StandardController();
      globalThis.Input.isActionTriggered.mockReturnValue(true);

      // Act
      controller.updateMiniMapWindowAction();

      // Assert
      expect(globalThis.Input.isActionTriggered).toHaveBeenCalledWith('J.MAP', 'minimap-toggle');
      expect(globalThis.JABS_InputAdapter.performMinimapWindowAction).toHaveBeenCalled();
    });

    it('does not perform the window action when the toggle input is not triggered', () =>
    {
      // Arrange
      const controller = new JABS_StandardController();
      globalThis.Input.isActionTriggered.mockReturnValue(false);

      // Act
      controller.updateMiniMapWindowAction();

      // Assert
      expect(globalThis.JABS_InputAdapter.performMinimapWindowAction).not.toHaveBeenCalled();
    });
  });

  describe('updateMinimapFocusPeekAction', () =>
  {
    it('does nothing when the current map blocks the minimap', () =>
    {
      // Arrange- the press edge is deliberately armed: pressed now, unpressed last frame is exactly
      // the state that starts focus mode. Left unarmed, nothing would have started focus anyway and
      // this test would pass whether the block was honoured or not.
      const controller = new JABS_StandardController();
      controller.initMembers();
      controller.setMinimapFocusPressedPrev(false);
      globalThis.Input.isActionPressed.mockReturnValue(true);
      globalThis.$gameMap.isMinimapBlocked.mockReturnValue(true);

      // Act
      controller.updateMinimapFocusPeekAction();

      // Assert- the untouched prior-frame state is the second half of the claim: a blocked map
      // returns before the press even gets recorded, so a later unblocked frame still sees an edge.
      expect(globalThis.JABS_InputAdapter.performMinimapFocusStart).not.toHaveBeenCalled();
      expect(globalThis.JABS_InputAdapter.performMinimapFocusEnd).not.toHaveBeenCalled();
      expect(controller.getMinimapFocusPressedPrev()).toEqual(false);
    });

    it('does neither start nor end on an idle frame with the input untouched', () =>
    {
      // Arrange- by far the most common frame: the expand input is not pressed now and was not
      // pressed last frame either. Without the prior-frame half of the release test, every one of
      // those frames would read as a release and re-run the focus-end.
      const controller = new JABS_StandardController();
      controller.initMembers();
      controller.setMinimapFocusPressedPrev(false);
      globalThis.Input.isActionPressed.mockReturnValue(false);

      // Act
      controller.updateMinimapFocusPeekAction();

      // Assert- the input read anchors that the method ran past the blocked-map guard at all.
      expect(globalThis.Input.isActionPressed).toHaveBeenCalledWith('J.MAP', 'expand-minimap');
      expect(globalThis.JABS_InputAdapter.performMinimapFocusEnd).not.toHaveBeenCalled();
      expect(globalThis.JABS_InputAdapter.performMinimapFocusStart).not.toHaveBeenCalled();
    });

    it('starts focus mode on the newly-pressed edge', () =>
    {
      // Arrange
      const controller = new JABS_StandardController();
      controller.initMembers();
      controller.setMinimapFocusPressedPrev(false);
      globalThis.Input.isActionPressed.mockReturnValue(true);

      // Act
      controller.updateMinimapFocusPeekAction();

      // Assert
      expect(globalThis.JABS_InputAdapter.performMinimapFocusStart).toHaveBeenCalled();
      expect(controller.getMinimapFocusPressedPrev()).toEqual(true);
    });

    it('ends focus mode on the just-released edge', () =>
    {
      // Arrange
      const controller = new JABS_StandardController();
      controller.initMembers();
      controller.setMinimapFocusPressedPrev(true);
      globalThis.Input.isActionPressed.mockReturnValue(false);

      // Act
      controller.updateMinimapFocusPeekAction();

      // Assert
      expect(globalThis.JABS_InputAdapter.performMinimapFocusEnd).toHaveBeenCalled();
      expect(controller.getMinimapFocusPressedPrev()).toEqual(false);
    });

    it('does neither start nor end when held continuously across frames', () =>
    {
      // Arrange
      const controller = new JABS_StandardController();
      controller.initMembers();
      controller.setMinimapFocusPressedPrev(true);
      globalThis.Input.isActionPressed.mockReturnValue(true);

      // Act
      controller.updateMinimapFocusPeekAction();

      // Assert
      expect(globalThis.JABS_InputAdapter.performMinimapFocusStart).not.toHaveBeenCalled();
      expect(globalThis.JABS_InputAdapter.performMinimapFocusEnd).not.toHaveBeenCalled();
    });
  });

  describe('performMinimapFocusStart/performMinimapFocusEnd', () =>
  {
    it('delegates start to JABS_InputAdapter', () =>
    {
      // Arrange
      const controller = new JABS_StandardController();

      // Act
      controller.performMinimapFocusStart();

      // Assert
      expect(globalThis.JABS_InputAdapter.performMinimapFocusStart).toHaveBeenCalled();
    });

    it('delegates end to JABS_InputAdapter', () =>
    {
      // Arrange
      const controller = new JABS_StandardController();

      // Act
      controller.performMinimapFocusEnd();

      // Assert
      expect(globalThis.JABS_InputAdapter.performMinimapFocusEnd).toHaveBeenCalled();
    });
  });
});
//endregion plugins/map/core/objects/jabs-input-controller.test.js
