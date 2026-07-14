//region plugins/omni/ext/quest/__models/_component/omni-quest.test.js
import { beforeAll, describe, expect, it } from 'vitest';

import OmniQuest from '../../../../../../../src/plugins/omni/ext/quest/__models/OmniQuest.js';
import OmniQuestBuilder from '../../../../../../../src/plugins/omni/ext/quest/__models/OmniQuestBuilder.js';

describe('OmniQuest (omni ext/quest, direct src import)', () =>
{
  beforeAll(() =>
  {
    // OmniQuest's instance fields default to String.empty/Array.empty, the J-Base sentinel polyfills
    // normally installed by _base/_metadata/initialization.js. Define them directly here rather than
    // pulling in the whole of J-Base's boot sequence for two sentinel constants.
    if (Object.getOwnPropertyDescriptor(String, 'empty') === undefined)
    {
      Object.defineProperty(String, 'empty', { value: '', writable: false });
    }

    if (Object.getOwnPropertyDescriptor(Array, 'empty') === undefined)
    {
      Object.defineProperty(Array, 'empty', { enumerable: true, configurable: false, get: () => Array.of() });
    }
  });

  describe('States', () =>
  {
    it('exposes the five quest state ordinals', () =>
    {
      expect(OmniQuest.States).toEqual({
        Inactive: 0,
        Active: 1,
        Completed: 2,
        Failed: 3,
        Missed: 4,
      });
    });
  });

  describe('FromStringToStateId', () =>
  {
    it.each([
      [ 'inactive', OmniQuest.States.Inactive ],
      [ 'active', OmniQuest.States.Active ],
      [ 'completed', OmniQuest.States.Completed ],
      [ 'failed', OmniQuest.States.Failed ],
      [ 'missed', OmniQuest.States.Missed ],
    ])('translates "%s" to %i', (descriptor, expected) =>
    {
      expect(OmniQuest.FromStringToStateId(descriptor)).toBe(expected);
    });

    it('is case-insensitive', () =>
    {
      expect(OmniQuest.FromStringToStateId('ACTIVE')).toBe(OmniQuest.States.Active);
    });

    it('throws for an unrecognized descriptor', () =>
    {
      expect(() => OmniQuest.FromStringToStateId('bogus'))
        .toThrow('unknown quest state being translated: bogus');
    });
  });

  describe('constructor', () =>
  {
    it('assigns all constructor parameters onto the instance', () =>
    {
      const objectives = [ {} ];
      const quest = new OmniQuest(
        'Slay the Dragon',
        'slay-dragon',
        'main-story',
        [ 'combat' ],
        'A hint before discovery.',
        'An overview after discovery.',
        12,
        objectives);

      expect(quest.name).toBe('Slay the Dragon');
      expect(quest.key).toBe('slay-dragon');
      expect(quest.categoryKey).toBe('main-story');
      expect(quest.tagKeys).toEqual([ 'combat' ]);
      expect(quest.unknownHint).toBe('A hint before discovery.');
      expect(quest.overview).toBe('An overview after discovery.');
      expect(quest.recommendedLevel).toBe(12);
      expect(quest.objectives).toBe(objectives);
    });
  });

  describe('Builder', () =>
  {
    it('returns a new OmniQuestBuilder instance', () =>
    {
      const builder = OmniQuest.Builder();

      expect(builder).toBeInstanceOf(OmniQuestBuilder);
    });

    it('builds an OmniQuest with the fluent values that were set', () =>
    {
      const objectives = [ {} ];
      const quest = OmniQuest.Builder()
        .name('Slay the Dragon')
        .key('slay-dragon')
        .categoryKey('main-story')
        .tagKeys([ 'combat' ])
        .unknownHint('hint')
        .overview('overview')
        .recommendedLevel(12)
        .objectives(objectives)
        .build();

      expect(quest).toBeInstanceOf(OmniQuest);
      expect(quest.name).toBe('Slay the Dragon');
      expect(quest.key).toBe('slay-dragon');
      expect(quest.categoryKey).toBe('main-story');
      expect(quest.tagKeys).toEqual([ 'combat' ]);
      expect(quest.unknownHint).toBe('hint');
      expect(quest.overview).toBe('overview');
      expect(quest.recommendedLevel).toBe(12);
      expect(quest.objectives).toBe(objectives);
    });
  });
});
//endregion plugins/omni/ext/quest/__models/_component/omni-quest.test.js
