//region plugins/omni/ext/monster/__models/monsterpedia-observations.test.js
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

describe('MonsterpediaObservations (omni ext/monster, direct src import)', () =>
{
  /** @type {typeof import('../../../../../../src/plugins/omni/ext/monster/__models/MonsterpediaObservations.js').default} */
  let MonsterpediaObservations;

  beforeAll(async () =>
  {
    // MonsterpediaObservations.js calls SerializableRegistry.register(...) as an import-time side
    // effect (so JsonEx restores keep prototype methods after a save load). Stub it before the
    // dynamic import evaluates the module, since a static import would be hoisted ahead of any setup.
    globalThis.SerializableRegistry = { register: vi.fn() };

    ({ default: MonsterpediaObservations } =
      await import('../../../../../../src/plugins/omni/ext/monster/__models/MonsterpediaObservations.js'));
  });

  afterAll(() =>
  {
    delete globalThis.SerializableRegistry;
  });

  describe('constructor / initMembers', () =>
  {
    it('sets the enemyId and initializes all observation flags/collections to their unlearned defaults', () =>
    {
      const observations = new MonsterpediaObservations(7);

      expect(observations.id).toBe(7);
      expect(observations.numberDefeated).toBe(0);
      expect(observations.knowsName).toBe(false);
      // knowsFamily is the one flag that starts true- the monster's icon/family is visible by default.
      expect(observations.knowsFamily).toBe(true);
      expect(observations.knowsDescription).toBe(false);
      expect(observations.knowsRegions).toBe(false);
      expect(observations.knowsParameters).toBe(false);
      expect(observations.knowsAilmentalistics).toBe(false);
      expect(observations.knownDrops).toEqual([]);
      expect(observations.knownElementalistics).toEqual([]);
    });
  });

  describe('drop tracking', () =>
  {
    it('addKnownDrop records a [type, id] pair', () =>
    {
      const observations = new MonsterpediaObservations(1);

      observations.addKnownDrop('i', 5);

      expect(observations.knownDrops).toEqual([ [ 'i', 5 ] ]);
    });

    it('isDropKnown returns true only for a matching type+id pair', () =>
    {
      const observations = new MonsterpediaObservations(1);
      observations.addKnownDrop('w', 3);

      expect(observations.isDropKnown('w', 3)).toBe(true);
      expect(observations.isDropKnown('a', 3)).toBe(false);
      expect(observations.isDropKnown('w', 4)).toBe(false);
    });

    it('isDropKnown returns false when no drops have been recorded', () =>
    {
      const observations = new MonsterpediaObservations(1);

      expect(observations.isDropKnown('i', 1)).toBe(false);
    });
  });

  describe('elemental tracking', () =>
  {
    it('addKnownElementalistic records the element id', () =>
    {
      const observations = new MonsterpediaObservations(1);

      observations.addKnownElementalistic(4);

      expect(observations.knownElementalistics).toEqual([ 4 ]);
    });

    it('isElementalisticKnown reflects only recorded element ids', () =>
    {
      const observations = new MonsterpediaObservations(1);
      observations.addKnownElementalistic(2);

      expect(observations.isElementalisticKnown(2)).toBe(true);
      expect(observations.isElementalisticKnown(3)).toBe(false);
    });
  });
});
//endregion plugins/omni/ext/monster/__models/monsterpedia-observations.test.js
