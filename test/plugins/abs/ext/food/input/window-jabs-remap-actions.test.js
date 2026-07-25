//region plugins/abs/ext/food/input/window-jabs-remap-actions.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('J-ABS-Food Window_JabsRemapActions (unit, all downstream dependencies mocked)', () =>
{
  let originalBuildPostExtensionGroups;
  let originalHumanizeButton;
  let originalDescribeButton;

  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = { ABS: { EXT: { FOOD: { Aliased: { Window_JabsRemapActions: new Map() } } } } };
    globalThis.JABS_Button = { UsableItem: 'usableItem' };

    function Window_JabsRemapActions()
    {
    }

    originalBuildPostExtensionGroups = vi.fn();
    originalHumanizeButton = vi.fn((button) => `original:${button}`);
    originalDescribeButton = vi.fn((button) => `original-desc:${button}`);
    Window_JabsRemapActions.prototype.buildPostExtensionGroups = originalBuildPostExtensionGroups;
    Window_JabsRemapActions.prototype.humanizeButton = originalHumanizeButton;
    Window_JabsRemapActions.prototype.describeButton = originalDescribeButton;
    globalThis.Window_JabsRemapActions = Window_JabsRemapActions;

    await import('../../../../../../src/plugins/abs/ext/food/input/Window_JabsRemapActions.js');
  });

  beforeEach(() =>
  {
    originalBuildPostExtensionGroups.mockReset();
    originalHumanizeButton.mockReset().mockImplementation((button) => `original:${button}`);
    originalDescribeButton.mockReset().mockImplementation((button) => `original-desc:${button}`);
  });

  function buildWindow()
  {
    const window = Object.create(globalThis.Window_JabsRemapActions.prototype);
    window.buildHeaderCommand = vi.fn((label) => ({ header: label }));
    window._addIf = vi.fn();
    return window;
  }

  describe('buildPostExtensionGroups', () =>
  {
    it('performs the original logic then appends the usable-item section', () =>
    {
      // Arrange
      const window = buildWindow();
      const rows = [];
      const can = new Set();

      // Act
      window.buildPostExtensionGroups(rows, can);

      // Assert
      expect(originalBuildPostExtensionGroups).toHaveBeenCalledWith(rows, can);
      expect(rows).toEqual([ { header: 'Usable Item Actions' } ]);
      expect(window._addIf).toHaveBeenCalledWith(rows, can, 'usableItem');
    });
  });

  describe('humanizeButton', () =>
  {
    it('returns a friendly label for the usable-item button', () =>
    {
      const window = buildWindow();
      expect(window.humanizeButton('usableItem')).toBe('Usable Item');
      expect(originalHumanizeButton).not.toHaveBeenCalled();
    });

    it('defers to the original logic for any other button', () =>
    {
      const window = buildWindow();
      expect(window.humanizeButton('mainhand')).toBe('original:mainhand');
    });
  });

  describe('describeButton', () =>
  {
    it('returns help text for the usable-item button', () =>
    {
      const window = buildWindow();
      expect(window.describeButton('usableItem')).toContain('Use the equipped item.');
      expect(originalDescribeButton).not.toHaveBeenCalled();
    });

    it('defers to the original logic for any other button', () =>
    {
      const window = buildWindow();
      expect(window.describeButton('mainhand')).toBe('original-desc:mainhand');
    });
  });
});
//endregion plugins/abs/ext/food/input/window-jabs-remap-actions.test.js
