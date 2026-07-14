//region JCache
import RPG_Base from './../database/base/RPG_Base.js';

/**
 * A unified typed-cache primitive. A cache declares an ordered list of "weak dimensions" at
 * construction (e.g. `['battler']`, `['object']`, `['battler', 'object']`), and `get()` requires
 * one weak key per declared dimension before the stable string key. This makes cache *scope* a
 * visible, reviewable choice at construction time instead of an implicit default buried in a
 * generic memoize helper - the exact class of bug this primitive was built to prevent (a
 * battler-context eval result silently cached on an object-scoped structure).
 */
class JCache
{
  /**
   * Every JCache instance that declared a `'battler'` dimension, so a single bus call
   * ({@link JCache.invalidateAllForBattler}) can clear every battler-scoped cache in the game
   * without each caller needing to know the full list of caches that exist.
   * @type {Set<JCache>}
   */
  static _battlerCaches = new Set();

  /**
   * Drops every battler-scoped cache entry for the given battler, across every registered
   * {@link JCache} instance that declared a `'battler'` dimension. Intended to be called once,
   * from {@link Game_Battler#onBattlerDataChange}, so individual managers never need their own
   * bespoke invalidation wiring into that method.
   * @param {Game_Battler} battler The battler whose cached entries should be dropped.
   */
  static invalidateAllForBattler(battler)
  {
    // walk every battler-dimensioned cache that has ever been constructed and drop this battler's subtree from each.
    for (const cache of this._battlerCaches)
    {
      cache.invalidate(battler);
    }
  }

  /**
   * Builds an object-scoped cache: one weak dimension, keyed by the database object being parsed.
   * Use for results that depend only on immutable note text (no runtime battler context).
   * @param {{ name: string, resolveOriginal?: boolean }} o Construction options (see {@link constructor}).
   * @returns {JCache}
   */
  static objectScoped(o)
  {
    // an object-scoped cache has exactly one dimension: the database object itself.
    return new JCache({ ...o, dims: [ 'object' ] });
  }

  /**
   * Builds a battler-scoped cache: one weak dimension, keyed by the battler. Use for results that
   * depend only on the battler's own live state (no distinct database object per entry).
   * @param {{ name: string, resolveOriginal?: boolean }} o Construction options (see {@link constructor}).
   * @returns {JCache}
   */
  static battlerScoped(o)
  {
    // a battler-scoped cache has exactly one dimension: the battler itself.
    return new JCache({ ...o, dims: [ 'battler' ] });
  }

  /**
   * Builds a battler-then-object-scoped cache: two weak dimensions, battler outermost then the
   * database object. Use for eval results that read both a battler's live state ("a" in a
   * formula) and a specific database object's note text.
   * @param {{ name: string, resolveOriginal?: boolean }} o Construction options (see {@link constructor}).
   * @returns {JCache}
   */
  static battlerThenObject(o)
  {
    // a battler-then-object cache nests the database object bucket underneath the battler bucket.
    return new JCache({ ...o, dims: [ 'battler', 'object' ] });
  }

  /**
   * @param {object} options Construction options.
   * @param {string} options.name A human-readable identifier for this cache, used for metrics/debugging.
   * @param {string[]} options.dims The ordered weak dimensions, e.g. `['battler', 'object']`.
   * @param {boolean} [options.resolveOriginal] When true, an `'object'` dimension key that is an
   * {@link RPG_Base} clone resolves to its {@link RPG_Base#_original} so clones share a bucket
   * with their source object.
   */
  constructor({ name, dims, resolveOriginal = false })
  {
    // store the cache's name for metrics/debugging purposes; this is not used for lookups.
    this.name = name;

    // store the ordered list of weak dimensions this cache was declared with.
    this.dims = dims;

    // remember whether the 'object' dimension should resolve RPG_Base clones to their source.
    this.resolveOriginal = resolveOriginal;

    // the outermost weak dimension bucket; nested WeakMaps/Maps are created lazily as entries are written.
    this._root = new WeakMap();

    // track hits/misses per-instance so each cache's effectiveness can be inspected independently.
    this._metrics = { hits: 0, misses: 0 };

    // battler-dimensioned caches self-register so the invalidation bus can reach them without extra wiring.
    if (dims.includes('battler'))
    {
      JCache._battlerCaches.add(this);
    }
  }

  /**
   * Resolves a single dimension's key to its actual cache-bucket identity.
   * @param {string} dim The dimension name being resolved ('battler' or 'object').
   * @param {object} key The raw key passed in for this dimension.
   * @returns {object} The key to actually use as the WeakMap/Map key for this dimension.
   */
  #resolve(dim, key)
  {
    // only the 'object' dimension ever resolves clones to their source, and only when opted-in.
    return (dim === 'object' && this.resolveOriginal && key instanceof RPG_Base)
      ? key._original()
      : key;
  }

  /**
   * Reads the cached value for the given dimension keys + string key, computing and storing it on
   * a miss. Call shape is `get(...weakKeys, stringKey, computeFn)`, where `weakKeys.length` must
   * equal `this.dims.length`.
   * @param {...*} args The weak dimension keys, followed by the string key, followed by the compute function.
   * @returns {any} The cached or freshly computed value.
   */
  get(...args)
  {
    // the compute function is always the last argument; pull it off first.
    const computeFn = args.pop();

    // the stable string key is always the argument just before the compute function.
    const stringKey = args.pop();

    // start walking from the root weak dimension bucket.
    let node = this._root;

    // descend through every declared dimension in order, creating buckets lazily as we go.
    for (let i = 0; i < this.dims.length; i++)
    {
      // resolve this dimension's raw key to its actual bucket identity (handles clone resolution).
      const k = this.#resolve(this.dims[i], args[i]);

      // look for an existing bucket at this key.
      let next = node.get(k);

      // if no bucket exists yet, create one: a terminal Map on the last dimension, a WeakMap otherwise.
      if (!next)
      {
        next = (i === this.dims.length - 1)
          ? new Map()
          : new WeakMap();
        node.set(k, next);
      }

      // descend into the bucket we just found or created.
      node = next;
    }

    // use .has() rather than truthiness so a cached 0 / null / false / '' does not recompute forever.
    if (node.has(stringKey) === false)
    {
      // record the miss, then compute and store the value.
      this._metrics.misses++;
      node.set(stringKey, computeFn());
    }
    else
    {
      // record the hit; the existing value is returned below.
      this._metrics.hits++;
    }

    // return whatever now lives at this string key, whether just computed or previously cached.
    return node.get(stringKey);
  }

  /**
   * Drops the cached subtree at the given dimension-key prefix. `invalidate(battler)` (a
   * one-element prefix) is the common case: it drops every entry nested under that battler,
   * regardless of how many further dimensions this cache declares. Calling with zero arguments
   * clears the entire cache.
   * @param {...object} prefix The dimension keys identifying the subtree to drop, outermost first.
   * @returns {boolean} True if something was found and removed at that prefix, false otherwise.
   */
  invalidate(...prefix)
  {
    // no prefix means "drop everything"; delegate to clear() for that case.
    if (prefix.length === 0)
    {
      this.clear();
      return true;
    }

    // start walking from the root weak dimension bucket.
    let node = this._root;

    // descend through every dimension except the last one, bailing out early if a bucket is missing.
    for (let i = 0; i < prefix.length - 1; i++)
    {
      node = node.get(this.#resolve(this.dims[i], prefix[i]));

      // if any intermediate bucket doesn't exist, there is nothing to invalidate.
      if (!node) return false;
    }

    // the final prefix element is the one to actually delete out of its parent bucket.
    const last = prefix.length - 1;
    return node.delete(this.#resolve(this.dims[last], prefix[last]));
  }

  /**
   * Drops every entry in this cache by discarding the root weak dimension bucket outright.
   */
  clear()
  {
    // a fresh WeakMap has no entries and no path back to any previously cached value.
    this._root = new WeakMap();
  }

  /**
   * @returns {{ hits: number, misses: number }} A shallow copy of this cache's hit/miss counters.
   */
  get metrics()
  {
    // return a copy so callers cannot mutate our internal counters.
    return { ...this._metrics };
  }
}

export default JCache;
//endregion JCache
