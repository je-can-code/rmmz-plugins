//region plugins/abs/core/models/state-affliction-collection.test.js
import { beforeAll, describe, expect, it } from 'vitest';

describe('StateAfflictionCollection (direct src import)', () =>
{
  let StateAfflictionCollection;

  beforeAll(async () =>
  {
    ({ default: StateAfflictionCollection } = await import(
      '../../../../../src/plugins/abs/core/models/StateAfflictionCollection.js'
    ));
  });

  describe('defaults', () =>
  {
    it('starts with empty negative and positive arrays', () =>
    {
      const collection = new StateAfflictionCollection();
      expect(collection.negative).toEqual([]);
      expect(collection.positive).toEqual([]);
    });
  });

  describe('allActive', () =>
  {
    it('concatenates negative rows before positive rows', () =>
    {
      const collection = new StateAfflictionCollection();
      collection.negative = [ 'n1' ];
      collection.positive = [ 'p1' ];

      expect(collection.allActive()).toEqual([ 'n1', 'p1' ]);
    });
  });

  describe('isEmpty', () =>
  {
    it('is true when both negative and positive are empty', () =>
    {
      expect(new StateAfflictionCollection().isEmpty()).toBe(true);
    });

    it('is false when negative has rows', () =>
    {
      const collection = new StateAfflictionCollection();
      collection.negative = [ 'n1' ];
      expect(collection.isEmpty()).toBe(false);
    });

    it('is false when positive has rows', () =>
    {
      const collection = new StateAfflictionCollection();
      collection.positive = [ 'p1' ];
      expect(collection.isEmpty()).toBe(false);
    });
  });
});
//endregion plugins/abs/core/models/state-affliction-collection.test.js
