//region plugins/_base/_component/jcache.test.js
import { describe, expect, it, vi } from 'vitest';

import JCache from '../../../../../src/plugins/_base/core/core/JCache.js';
import RPG_Base from '../../../../../src/plugins/_base/core/database/base/RPG_Base.js';

describe('JCache', () =>
{
  describe('objectScoped', () =>
  {
    it('caches a falsy computed value (0) without recomputing on the next read', () =>
    {
      // Arrange
      const cache = JCache.objectScoped({ name: 'test:falsy-zero' });
      const target = { note: '<k:0>' };
      const computeFn = vi.fn(() => 0);

      // Act
      const first = cache.get(target, 'k', computeFn);
      const second = cache.get(target, 'k', computeFn);

      // Assert
      expect(first).toBe(0);
      expect(second).toBe(0);
      expect(computeFn).toHaveBeenCalledOnce();
    });

    it('caches a falsy computed value (null) without recomputing on the next read', () =>
    {
      // Arrange
      const cache = JCache.objectScoped({ name: 'test:falsy-null' });
      const target = {};
      const computeFn = vi.fn(() => null);

      // Act
      cache.get(target, 'k', computeFn);
      cache.get(target, 'k', computeFn);

      // Assert
      expect(computeFn).toHaveBeenCalledOnce();
    });

    it('caches a falsy computed value (false) without recomputing on the next read', () =>
    {
      // Arrange
      const cache = JCache.objectScoped({ name: 'test:falsy-false' });
      const target = {};
      const computeFn = vi.fn(() => false);

      // Act
      cache.get(target, 'k', computeFn);
      cache.get(target, 'k', computeFn);

      // Assert
      expect(computeFn).toHaveBeenCalledOnce();
    });

    it('shares a bucket between two different clones of the same RPG_Base source when resolveOriginal is true', () =>
    {
      // Arrange: two clones of one root each resolve one level up to that shared root, colliding
      // into a single bucket - this is what lets OverlayManager's per-caster extended-skill clones
      // (each built fresh from the same $dataSkills[id] root) share one RPGManager note-cache entry.
      const cache = JCache.objectScoped({ name: 'test:resolve-original', resolveOriginal: true });
      const root = new RPG_Base({ id: 1, meta: {}, name: 'root', note: '<x>' }, 0);
      const cloneA = root._clone();
      const cloneB = root._clone();
      const computeFn = vi.fn(() => 'shared-value');

      // Act
      const fromCloneA = cache.get(cloneA, 'k', computeFn);
      const fromCloneB = cache.get(cloneB, 'k', computeFn);

      // Assert
      expect(fromCloneA).toBe('shared-value');
      expect(fromCloneB).toBe('shared-value');
      expect(computeFn).toHaveBeenCalledOnce();
    });

    it('is not registered in the battler-invalidation bus', () =>
    {
      // Arrange
      JCache._battlerCaches.clear();
      const cache = JCache.objectScoped({ name: 'test:not-battler-bus' });

      // Act
      const isRegistered = JCache._battlerCaches.has(cache);

      // Assert
      expect(isRegistered).toBe(false);
    });
  });

  describe('battlerThenObject', () =>
  {
    it('keeps two different battlers on the same object independent of each other', () =>
    {
      // Arrange
      const cache = JCache.battlerThenObject({ name: 'test:battler-then-object' });
      const battlerA = {};
      const battlerB = {};
      const sharedObject = {};

      // Act
      const resultA = cache.get(battlerA, sharedObject, 'k', () => 'a-value');
      const resultB = cache.get(battlerB, sharedObject, 'k', () => 'b-value');

      // Assert
      expect(resultA).toBe('a-value');
      expect(resultB).toBe('b-value');
    });

    it('drops only the invalidated battler\'s subtree, leaving other battlers cached', () =>
    {
      // Arrange
      const cache = JCache.battlerThenObject({ name: 'test:battler-invalidate' });
      const battlerA = {};
      const battlerB = {};
      const sharedObject = {};
      cache.get(battlerA, sharedObject, 'k', () => 'a-stale');
      cache.get(battlerB, sharedObject, 'k', () => 'b-stale');

      // Act
      cache.invalidate(battlerA);

      // Assert
      expect(cache.get(battlerA, sharedObject, 'k', () => 'a-fresh')).toBe('a-fresh');
      expect(cache.get(battlerB, sharedObject, 'k', () => 'b-fresh')).toBe('b-stale');
    });
  });

  describe('battler-invalidation bus', () =>
  {
    it('registers a battlerScoped instance for the invalidation bus', () =>
    {
      // Arrange
      JCache._battlerCaches.clear();

      // Act
      const cache = JCache.battlerScoped({ name: 'test:battler-scoped-registers' });

      // Assert
      expect(JCache._battlerCaches.has(cache)).toBe(true);
    });

    it('registers a battlerThenObject instance for the invalidation bus', () =>
    {
      // Arrange
      JCache._battlerCaches.clear();

      // Act
      const cache = JCache.battlerThenObject({ name: 'test:battler-then-object-registers' });

      // Assert
      expect(JCache._battlerCaches.has(cache)).toBe(true);
    });

    it('invalidateAllForBattler() clears the given battler out of every registered cache', () =>
    {
      // Arrange
      JCache._battlerCaches.clear();
      const cacheOne = JCache.battlerScoped({ name: 'test:bus-one' });
      const cacheTwo = JCache.battlerThenObject({ name: 'test:bus-two' });
      const battler = {};
      const sharedObject = {};
      cacheOne.get(battler, 'k', () => 'stale-one');
      cacheTwo.get(battler, sharedObject, 'k', () => 'stale-two');

      // Act
      JCache.invalidateAllForBattler(battler);

      // Assert
      expect(cacheOne.get(battler, 'k', () => 'fresh-one')).toBe('fresh-one');
      expect(cacheTwo.get(battler, sharedObject, 'k', () => 'fresh-two')).toBe('fresh-two');
    });
  });

  describe('invalidate', () =>
  {
    it('returns false when the prefix does not exist in the cache', () =>
    {
      // Arrange
      const cache = JCache.objectScoped({ name: 'test:invalidate-miss' });

      // Act
      const result = cache.invalidate({});

      // Assert
      expect(result).toBe(false);
    });

    it('clears the entire cache when called with no arguments', () =>
    {
      // Arrange
      const cache = JCache.objectScoped({ name: 'test:invalidate-clear-all' });
      const target = {};
      cache.get(target, 'k', () => 'stale');

      // Act
      cache.invalidate();

      // Assert
      expect(cache.get(target, 'k', () => 'fresh')).toBe('fresh');
    });

    it('returns false on a multi-dimension cache when an intermediate bucket in the prefix is missing', () =>
    {
      // Arrange- a battlerThenObject cache has 2 dimensions, so invalidate(battler, obj) walks
      // through the first dimension before deleting out of the second; this battler was never
      // populated, so the very first .get() in that walk comes back empty.
      const cache = JCache.battlerThenObject({ name: 'test:invalidate-missing-intermediate' });
      const neverCachedBattler = {};
      const someObject = {};

      // Act
      const result = cache.invalidate(neverCachedBattler, someObject);

      // Assert
      expect(result).toBe(false);
    });

    it('walks through an existing intermediate bucket before deleting the final prefix element', () =>
    {
      // Arrange- a 3-dimension cache (no named factory exists for this, so constructed directly)
      // forces the invalidate() walk loop to run more than once, exercising the "bucket exists,
      // keep descending" branch as well as the "bucket missing, bail out" branch already covered above.
      const cache = new JCache({ name: 'test:invalidate-multi-dim', dims: [ 'battler', 'object', 'object' ] });
      const battler = {};
      const objectOne = {};
      const objectTwo = {};
      cache.get(battler, objectOne, objectTwo, 'k', () => 'stale');

      // Act
      const result = cache.invalidate(battler, objectOne, objectTwo);

      // Assert
      expect(result).toBe(true);
      expect(cache.get(battler, objectOne, objectTwo, 'k', () => 'fresh')).toBe('fresh');
    });
  });

  describe('metrics', () =>
  {
    it('returns a copy that does not let callers mutate the internal counters', () =>
    {
      // Arrange
      const cache = JCache.objectScoped({ name: 'test:metrics-copy' });
      cache.get({}, 'k', () => 'value');

      // Act
      const { metrics } = cache;
      metrics.hits = 999;

      // Assert
      expect(cache.metrics.hits).not.toBe(999);
    });
  });
});
//endregion plugins/_base/_component/jcache.test.js
