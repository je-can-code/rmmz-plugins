//region plugins/sdp/core/models/panel-tracking.test.js
import { beforeAll, describe, expect, it } from 'vitest';

describe('PanelTracking (direct src import)', () =>
{
  let PanelTracking;

  beforeAll(async () =>
  {
    ({ default: PanelTracking } = await import('../../../../../src/plugins/sdp/core/models/PanelTracking.js'));
  });

  describe('constructor/isUnlocked', () =>
  {
    it('starts unlocked when constructed with unlockedByDefault true', () =>
    {
      // Arrange
      const tracking = new PanelTracking('panel-1', true);

      // Act
      const result = tracking.isUnlocked();

      // Assert
      expect(result).toEqual(true);
      expect(tracking.key).toEqual('panel-1');
    });

    it('starts locked when constructed with unlockedByDefault false', () =>
    {
      // Arrange
      const tracking = new PanelTracking('panel-1', false);

      // Act
      const result = tracking.isUnlocked();

      // Assert
      expect(result).toEqual(false);
    });
  });

  describe('unlock', () =>
  {
    it('marks the panel as unlocked', () =>
    {
      // Arrange
      const tracking = new PanelTracking('panel-1', false);

      // Act
      tracking.unlock();

      // Assert
      expect(tracking.isUnlocked()).toEqual(true);
    });
  });

  describe('lock', () =>
  {
    it('marks the panel as locked', () =>
    {
      // Arrange
      const tracking = new PanelTracking('panel-1', true);

      // Act
      tracking.lock();

      // Assert
      expect(tracking.isUnlocked()).toEqual(false);
    });
  });
});
//endregion plugins/sdp/core/models/panel-tracking.test.js
