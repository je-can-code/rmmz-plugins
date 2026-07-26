//region plugins/cms/ext/status/_models/status-stat-list-row.test.js
import { beforeAll, describe, expect, it } from 'vitest';
import StatusStatListRow from '../../../../../../src/plugins/cms/ext/status/_models/StatusStatListRow.js';

describe('StatusStatListRow', () =>
{
  beforeAll(() =>
  {
    // String.empty is a J-Base runtime augmentation, always present by the time this file's
    // production code runs in-game; stub it here since this test doesn't boot J-Base itself.
    String.empty = '';
  });

  describe('constructor', () =>
  {
    it('assigns the section and parameterKey provided', () =>
    {
      // Arrange/Act
      const row = new StatusStatListRow('Core Parameters', 'atk');

      // Assert
      expect(row.section).toEqual('Core Parameters');
      expect(row.parameterKey).toEqual('atk');
    });
  });
});
//endregion plugins/cms/ext/status/_models/status-stat-list-row.test.js
