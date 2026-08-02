//region plugins/cms/core/_models/menu-command-broadcaster.test.js
import { describe, expect, it, vi } from 'vitest';

import MenuCommandBroadcaster from '../../../../../src/plugins/cms/core/_models/MenuCommandBroadcaster.js';

describe('MenuCommandBroadcaster (cms core, direct src import)', () =>
{
  /**
   * Builds a stand-in command window that records the handlers and refreshes it receives.
   */
  const buildWindow = () => ({
    handlers: new Map(),
    refreshCount: 0,
    setHandler(symbol, method)
    {
      this.handlers.set(symbol, method);
    },
    refresh()
    {
      this.refreshCount += 1;
    },
  });

  describe('setHandler', () =>
  {
    it('gives the handler to every column it fronts', () =>
    {
      // Arrange- the whole point of this class is that six plugins register once and both columns
      // hear about it, so neither column may be skipped.
      const left = buildWindow();
      const right = buildWindow();
      const broadcaster = new MenuCommandBroadcaster([ left, right ]);
      const handler = vi.fn();

      // Act
      broadcaster.setHandler('sdp', handler);

      // Assert
      expect(left.handlers.get('sdp')).toBe(handler);
      expect(right.handlers.get('sdp')).toBe(handler);
    });

    it('registers each symbol independently when several are handled', () =>
    {
      // Arrange
      const left = buildWindow();
      const broadcaster = new MenuCommandBroadcaster([ left ]);

      // Act
      broadcaster.setHandler('sdp', vi.fn());
      broadcaster.setHandler('quest', vi.fn());

      // Assert
      expect([ ...left.handlers.keys() ]).toEqual([ 'sdp', 'quest' ]);
    });

    it('does nothing when it fronts no columns at all', () =>
    {
      // Arrange- a menu configured down to zero command windows is survivable; registering a
      // handler against nothing must not throw.
      const broadcaster = new MenuCommandBroadcaster([]);

      // Act & Assert
      expect(() => broadcaster.setHandler('sdp', vi.fn())).not.toThrow();
    });
  });

  describe('refresh', () =>
  {
    it('refreshes every column it fronts', () =>
    {
      // Arrange
      const left = buildWindow();
      const right = buildWindow();
      const broadcaster = new MenuCommandBroadcaster([ left, right ]);

      // Act
      broadcaster.refresh();

      // Assert
      expect(left.refreshCount).toBe(1);
      expect(right.refreshCount).toBe(1);
    });
  });

  describe('windows', () =>
  {
    it('reports the columns it was built around', () =>
    {
      // Arrange
      const left = buildWindow();
      const right = buildWindow();
      const broadcaster = new MenuCommandBroadcaster([ left, right ]);

      // Act & Assert
      expect(broadcaster.windows()).toEqual([ left, right ]);
    });
  });
});
//endregion plugins/cms/core/_models/menu-command-broadcaster.test.js
