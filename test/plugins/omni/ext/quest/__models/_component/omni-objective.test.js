//region plugins/omni/ext/quest/__models/_component/omni-objective.test.js
import { beforeAll, describe, expect, it } from 'vitest';

import OmniObjective from '../../../../../../../src/plugins/omni/ext/quest/__models/OmniObjective.js';

describe('OmniObjective (omni ext/quest, direct src import)', () =>
{
  beforeAll(() =>
  {
    // OmniObjective's `description` field defaults to String.empty, the J-Base sentinel polyfill
    // normally installed by _base/_metadata/initialization.js. Define it directly here rather than
    // pulling in the whole of J-Base's boot sequence for one sentinel constant.
    if (Object.getOwnPropertyDescriptor(String, 'empty') === undefined)
    {
      Object.defineProperty(String, 'empty', { value: '', writable: false });
    }
  });

  describe('Types / States / FetchTypes', () =>
  {
    it('exposes the expected objective type descriptors', () =>
    {
      expect(OmniObjective.Types).toEqual({
        Indiscriminate: 'Indiscriminate',
        Destination: 'Destination',
        Fetch: 'Fetch',
        Slay: 'Slay',
        Quest: 'Quest',
      });
    });

    it('exposes the five objective state ordinals', () =>
    {
      expect(OmniObjective.States).toEqual({
        Inactive: 0,
        Active: 1,
        Completed: 2,
        Failed: 3,
        Missed: 4,
      });
    });

    it('exposes the fetch type ordinals', () =>
    {
      expect(OmniObjective.FetchTypes).toEqual({
        Unset: -1,
        Item: 0,
        Weapon: 1,
        Armor: 2,
      });
    });
  });

  describe('constructor', () =>
  {
    it('assigns all constructor parameters onto the instance, defaulting hiddenByDefault/isOptional', () =>
    {
      const logs = {};
      const fulfillment = {};
      const objective = new OmniObjective(0, OmniObjective.Types.Slay, 'desc', logs, fulfillment);

      expect(objective.id).toBe(0);
      expect(objective.type).toBe(OmniObjective.Types.Slay);
      expect(objective.description).toBe('desc');
      expect(objective.logs).toBe(logs);
      expect(objective.fulfillment).toBe(fulfillment);
      expect(objective.hiddenByDefault).toBe(true);
      expect(objective.isOptional).toBe(false);
    });

    it('honors explicit hiddenByDefault/isOptional overrides', () =>
    {
      const objective = new OmniObjective(1, OmniObjective.Types.Fetch, 'desc', {}, {}, false, true);

      expect(objective.hiddenByDefault).toBe(false);
      expect(objective.isOptional).toBe(true);
    });
  });

  describe('FulfillmentTemplate', () =>
  {
    it('renders the indiscriminate template as the raw hint text', () =>
    {
      const text = OmniObjective.FulfillmentTemplate(OmniObjective.Types.Indiscriminate, [ 'go find the thing' ]);

      expect(text).toBe('go find the thing');
    });

    it('renders the destination template with the map name and both coordinates', () =>
    {
      const text = OmniObjective.FulfillmentTemplate(OmniObjective.Types.Destination, [ 'Town', 1, 2 ]);

      expect(text).toBe('Navigate to Town at [1, 2].');
    });

    it('renders the fetch template with quantity and item text', () =>
    {
      const text = OmniObjective.FulfillmentTemplate(OmniObjective.Types.Fetch, [ '3 / 5', '\\Item[7]' ]);

      expect(text).toBe('Acquire \\*3 / 5\\* \\Item[7].');
    });

    it('renders the slay template with quantity and enemy id', () =>
    {
      const text = OmniObjective.FulfillmentTemplate(OmniObjective.Types.Slay, [ '1 / 2', 12 ]);

      expect(text).toBe('Defeat \\*1 / 2\\* \\Enemy[12].');
    });

    it('renders the quest template with the joined quest names', () =>
    {
      const text = OmniObjective.FulfillmentTemplate(OmniObjective.Types.Quest, [ "'a', 'b'" ]);

      expect(text).toBe("Complete the other quest(s): 'a', 'b'.");
    });

    it('falls back to a not-defined message for an unrecognized type', () =>
    {
      const text = OmniObjective.FulfillmentTemplate('SomeUnknownType');

      expect(text).toBe('This objective is not defined.');
    });
  });
});
//endregion plugins/omni/ext/quest/__models/_component/omni-objective.test.js
