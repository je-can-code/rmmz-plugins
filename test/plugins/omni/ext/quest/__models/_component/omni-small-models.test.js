//region plugins/omni/ext/quest/__models/_component/omni-small-models.test.js
import { beforeAll, describe, expect, it } from 'vitest';

import OmniCategory from '../../../../../../../src/plugins/omni/ext/quest/__models/OmniCategory.js';
import OmniConditional from '../../../../../../../src/plugins/omni/ext/quest/__models/OmniConditional.js';
import OmniObjectiveLogs from '../../../../../../../src/plugins/omni/ext/quest/__models/OmniObjectiveLogs.js';
import OmniQuest from '../../../../../../../src/plugins/omni/ext/quest/__models/OmniQuest.js';
import OmniTag from '../../../../../../../src/plugins/omni/ext/quest/__models/OmniTag.js';

/**
 * Covers the small quest data-shape classes that are otherwise too trivial to warrant their own file:
 * plain constructor assignment with no derived behavior beyond OmniConditional's default parameter.
 */
describe('Omni quest small data-shape models (direct src import)', () =>
{
  beforeAll(() =>
  {
    // OmniCategory/OmniTag field defaults reference String.empty, the J-Base sentinel polyfill
    // normally installed by _base/_metadata/initialization.js.
    if (Object.getOwnPropertyDescriptor(String, 'empty') === undefined)
    {
      Object.defineProperty(String, 'empty', { value: '', writable: false });
    }
  });

  describe('OmniCategory', () =>
  {
    it('assigns key/name/iconIndex from the constructor', () =>
    {
      const category = new OmniCategory('main', 'Main Story', 87);

      expect(category.key).toBe('main');
      expect(category.name).toBe('Main Story');
      expect(category.iconIndex).toBe(87);
    });
  });

  describe('OmniTag', () =>
  {
    it('assigns key/name/iconIndex from the constructor', () =>
    {
      const tag = new OmniTag('combat', 'Combat', 12);

      expect(tag.key).toBe('combat');
      expect(tag.name).toBe('Combat');
      expect(tag.iconIndex).toBe(12);
    });
  });

  describe('OmniObjectiveLogs', () =>
  {
    it('assigns each state-specific log line from the constructor', () =>
    {
      const logs = new OmniObjectiveLogs('unknown', 'active', 'done', 'fail', 'missed');

      expect(logs.inactive).toBe('unknown');
      expect(logs.active).toBe('active');
      expect(logs.completed).toBe('done');
      expect(logs.failed).toBe('fail');
      expect(logs.missed).toBe('missed');
    });
  });

  describe('OmniConditional', () =>
  {
    it('defaults objectiveId to null and state to OmniQuest.States.Active when omitted', () =>
    {
      const conditional = new OmniConditional('some-quest');

      expect(conditional.questKey).toBe('some-quest');
      expect(conditional.objectiveId).toBeNull();
      expect(conditional.state).toBe(OmniQuest.States.Active);
    });

    it('honors explicit objectiveId/state overrides', () =>
    {
      const conditional = new OmniConditional('some-quest', 2, OmniQuest.States.Completed);

      expect(conditional.objectiveId).toBe(2);
      expect(conditional.state).toBe(OmniQuest.States.Completed);
    });
  });
});
//endregion plugins/omni/ext/quest/__models/_component/omni-small-models.test.js
