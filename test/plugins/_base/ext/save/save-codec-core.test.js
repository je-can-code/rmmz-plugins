//region plugins/_base/core/save/save-codec-core.test.js
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

describe('save codec core (direct src import)', () =>
{
  let SerializableRegistry;
  let SaveCodec;
  let SaveCodecIndex;
  let SaveEncoder;
  let SaveDecoder;

  beforeAll(async () =>
  {
    // vanilla RMMZ core prototype extensions the codec files read at module scope.
    Object.defineProperty(String, 'empty', {
      enumerable: true,
      configurable: true,
      get: () => '',
    });

    ({ default: SerializableRegistry } = await import('../../../../../src/plugins/_base/core/core/SerializableRegistry.js'));

    // the walkers live in J-Base-Save and read the registry as a hoisted global, because it belongs
    // to J-Base and a ship may never import across into another. This reproduces that at test time.
    globalThis.SerializableRegistry = SerializableRegistry;
    ({ default: SaveCodec } = await import('../../../../../src/plugins/_base/ext/save/core/SaveCodec.js'));
    ({ default: SaveCodecIndex } = await import('../../../../../src/plugins/_base/ext/save/core/SaveCodecIndex.js'));
    ({ default: SaveEncoder } = await import('../../../../../src/plugins/_base/ext/save/core/SaveEncoder.js'));
    ({ default: SaveDecoder } = await import('../../../../../src/plugins/_base/ext/save/core/SaveDecoder.js'));
  });

  beforeEach(() =>
  {
    // the registry is realm-global static state; wipe it so each test registers into a clean slate.
    // the codec index is not reset here on purpose - clearing moves the registry's revision, which
    // is what tells the index to rebuild, the same path a plugin registering late takes at runtime.
    SerializableRegistry.clear();
  });

  /**
   * A model that establishes its state in initMembers, so it exercises the default seed.
   */
  class Seeded
  {
    constructor()
    {
      this.initMembers();
    }

    initMembers()
    {
      this.alpha = 'default-alpha';
      this.beta = 0;
      this.nested = { deep: 'default-deep' };
    }
  }

  /**
   * A model with no initMembers at all, for the no-op seed branch.
   */
  class Bare
  {
    constructor()
    {
      this.value = 1;
    }
  }

  /**
   * A leaf model used as a typed field's contents.
   */
  class Leaf
  {
    constructor(id = 0)
    {
      this.id = id;
    }
  }

  /**
   * Registers Map and Set the same way the shipped registration file does.
   */
  const registerNatives = () =>
  {
    SerializableRegistry.register(Map, {
      id: 'Map',
      encode: (value, path) => ({
        entries: [ ...value.entries() ].map(([ key, entryValue ], index) => [
          SaveEncoder.encode(key, `${path}.entries[${index}][0]`),
          SaveEncoder.encode(entryValue, `${path}.entries[${index}][1]`),
        ]),
      }),
      decode: (data, path) => new Map(data.entries.map(([ key, value ], index) => [
        SaveDecoder.decode(key, null, `${path}.entries[${index}][0]`),
        SaveDecoder.decode(value, null, `${path}.entries[${index}][1]`),
      ])),
    });

    SerializableRegistry.register(Set, {
      id: 'Set',
      encode: (value, path) => ({
        values: [ ...value ].map((entryValue, index) => SaveEncoder.encode(entryValue, `${path}.values[${index}]`)),
      }),
      decode: (data, path) => new Set(
        data.values.map((value, index) => SaveDecoder.decode(value, null, `${path}.values[${index}]`))),
    });
  };

  describe('SerializableRegistry.register', () =>
  {
    it('defaults the save id to the constructor name when none is given', () =>
    {
      // Arrange & Act
      SerializableRegistry.register(Leaf);

      // Assert
      expect(SerializableRegistry.resolve('Leaf')).toBe(Leaf);
      expect(SaveCodecIndex.forId('Leaf')
        .id()).toBe('Leaf');
    });

    it('uses an explicit save id over the constructor name', () =>
    {
      // Arrange & Act
      SerializableRegistry.register(Leaf, { id: 'leaf-model' });

      // Assert
      expect(SerializableRegistry.resolve('leaf-model')).toBe(Leaf);
      expect(SerializableRegistry.resolve('Leaf')).toBeNull();
    });

    it('resolves every alias to the same constructor and codec', () =>
    {
      // Arrange & Act
      SerializableRegistry.register(Leaf, { id: 'leaf-model', aliases: [ 'Leaf', 'OldLeaf' ] });

      // Assert
      expect(SerializableRegistry.resolve('OldLeaf')).toBe(Leaf);
      expect(SaveCodecIndex.forId('Leaf')).toBe(SaveCodecIndex.forId('leaf-model'));
    });

    it('keeps resolve() returning a bare constructor, which is what JsonEx reads', () =>
    {
      // Arrange & Act
      SerializableRegistry.register(Leaf);

      // Assert- a codec here would have JsonEx call setPrototypeOf with the wrong thing.
      expect(SerializableRegistry.resolve('Leaf')).toBe(Leaf);
    });

    it('returns null from resolve() for an unregistered id', () =>
    {
      // Arrange & Act & Assert
      expect(SerializableRegistry.resolve('NeverRegistered')).toBeNull();
    });

    it('returns null from codecById() for an unregistered id', () =>
    {
      // Arrange & Act & Assert
      expect(SaveCodecIndex.forId('NeverRegistered')).toBeNull();
    });

    it('returns null from codecForConstructor() for an unregistered type', () =>
    {
      // Arrange & Act & Assert
      expect(SaveCodecIndex.forConstructor(Leaf)).toBeNull();
    });

    it('identifies a live instance by its constructor', () =>
    {
      // Arrange
      SerializableRegistry.register(Leaf, { id: 'leaf-model' });

      // Act
      const codec = SaveCodecIndex.forInstance(new Leaf(1));

      // Assert
      expect(codec.id()).toBe('leaf-model');
    });
  });

  describe('SerializableRegistry.extend', () =>
  {
    it('merges new declarations into an existing codec', () =>
    {
      // Arrange
      SerializableRegistry.register(Seeded, { id: 'seeded', transients: { alpha: () => 'cold-alpha' } });

      // Act
      SerializableRegistry.extend(Seeded, { transients: { beta: () => 99 } });

      // Assert
      const codec = SaveCodecIndex.forId('seeded');
      expect([ ...codec.transients()
        .keys() ]).toEqual([ 'alpha', 'beta' ]);
    });

    it('leaves the save id and aliases of the original registration alone', () =>
    {
      // Arrange
      SerializableRegistry.register(Seeded, { id: 'seeded', aliases: [ 'Seeded' ] });

      // Act
      SerializableRegistry.extend(Seeded, { typed: { nested: Leaf } });

      // Assert
      expect(SaveCodecIndex.forId('Seeded')
        .id()).toBe('seeded');
    });

    it('throws when nothing has registered the type yet', () =>
    {
      // Arrange & Act & Assert- this is a load-order bug and stays loud.
      expect(() => SerializableRegistry.extend(Seeded, { transients: {} }))
        .toThrow(/must load before/);
    });
  });

  describe('SaveCodec.buildPathTree', () =>
  {
    it('hangs a single-segment path directly off the root', () =>
    {
      // Arrange
      const factory = () => null;

      // Act
      const tree = SaveCodec.buildPathTree({ alpha: factory });

      // Assert
      expect(tree.children.get('alpha').value).toBe(factory);
    });

    it('creates waypoints for every intermediate segment of a dotted path', () =>
    {
      // Arrange
      const factory = () => null;

      // Act
      const tree = SaveCodec.buildPathTree({ '_j._base._cache': factory });

      // Assert- the intermediates carry no declaration of their own.
      expect(tree.children.get('_j').value).toBeNull();
      expect(tree.children.get('_j').children.get('_base').value).toBeNull();
      expect(tree.children.get('_j').children.get('_base').children.get('_cache').value).toBe(factory);
    });

    it('shares waypoints between two paths with a common prefix', () =>
    {
      // Arrange & Act
      const tree = SaveCodec.buildPathTree({ '_j._base.one': () => 1, '_j._base.two': () => 2 });

      // Assert
      expect(tree.children.get('_j').children.get('_base').children.size).toBe(2);
    });
  });

  describe('SaveCodec seed derivation', () =>
  {
    it('derives a seed from initMembers when the class defines one', () =>
    {
      // Arrange
      SerializableRegistry.register(Seeded, { id: 'seeded' });
      const instance = Object.create(Seeded.prototype);

      // Act
      SaveCodecIndex.forId('seeded')
        .seed(instance);

      // Assert
      expect(instance.alpha).toBe('default-alpha');
    });

    it('falls back to a no-op when the class has neither initMembers nor an explicit seed', () =>
    {
      // Arrange
      SerializableRegistry.register(Bare, { id: 'bare' });
      const instance = Object.create(Bare.prototype);

      // Act
      SaveCodecIndex.forId('bare')
        .seed(instance);

      // Assert
      expect(Object.keys(instance)).toEqual([]);
    });

    it('prefers an explicit seed over the derived one', () =>
    {
      // Arrange
      SerializableRegistry.register(Seeded, {
        id: 'seeded',
        seed: target =>
        {
          target.alpha = 'explicit';
        },
      });
      const instance = Object.create(Seeded.prototype);

      // Act
      SaveCodecIndex.forId('seeded')
        .seed(instance);

      // Assert
      expect(instance.alpha).toBe('explicit');
      expect(instance.beta).toBeUndefined();
    });
  });

  describe('SaveEncoder', () =>
  {
    it('passes null through as itself rather than dropping it', () =>
    {
      // Arrange & Act & Assert- null is a real persisted value, distinct from an absent field.
      expect(SaveEncoder.encode(null)).toBeNull();
    });

    it('passes a primitive through untouched', () =>
    {
      // Arrange & Act & Assert
      expect(SaveEncoder.encode(42)).toBe(42);
    });

    it('maps an array element-wise', () =>
    {
      // Arrange & Act
      const encoded = SaveEncoder.encode([ 1, 'two', null ]);

      // Assert
      expect(encoded).toEqual([ 1, 'two', null ]);
    });

    it('keeps the shape of a plain object', () =>
    {
      // Arrange & Act
      const encoded = SaveEncoder.encode({ alpha: 1, nested: { beta: 2 } });

      // Assert
      expect(encoded).toEqual({ alpha: 1, nested: { beta: 2 } });
    });

    it('tags a registered instance with its save id', () =>
    {
      // Arrange
      SerializableRegistry.register(Leaf, { id: 'leaf-model' });

      // Act
      const encoded = SaveEncoder.encode(new Leaf(7));

      // Assert
      expect(encoded).toEqual({ id: 7, '@': 'leaf-model' });
    });

    it('never mutates the instance it encodes', () =>
    {
      // Arrange
      SerializableRegistry.register(Leaf, { id: 'leaf-model' });
      const leaf = new Leaf(7);

      // Act
      SaveEncoder.encode(leaf);

      // Assert- the engine's own encoder writes its tag back onto the live object; this one does not.
      expect(Object.keys(leaf)).toEqual([ 'id' ]);
    });

    it('throws on an instance no codec is registered for', () =>
    {
      // Arrange & Act & Assert
      expect(() => SaveEncoder.encode(new Leaf(1)))
        .toThrow(/no codec is registered for 'Leaf'/);
    });

    it('names the offending path when it throws', () =>
    {
      // Arrange & Act & Assert
      expect(() => SaveEncoder.encode({ outer: [ new Leaf(1) ] }))
        .toThrow(/\$\.outer\[0\]/);
    });

    it('throws when a registered class holds an instance its type map never declared', () =>
    {
      // Arrange
      SerializableRegistry.register(Leaf, { id: 'leaf-model' });
      SerializableRegistry.register(Seeded, { id: 'seeded' });
      const instance = new Seeded();
      instance.alpha = new Leaf(1);

      // Act & Assert
      expect(() => SaveEncoder.encode(instance))
        .toThrow(/'alpha' holds a Leaf, which the codec for 'seeded' does not declare/);
    });

    it('accepts a typed field the type map does declare', () =>
    {
      // Arrange
      SerializableRegistry.register(Leaf, { id: 'leaf-model' });
      SerializableRegistry.register(Seeded, { id: 'seeded', typed: { alpha: Leaf } });
      const instance = new Seeded();
      instance.alpha = new Leaf(3);

      // Act
      const encoded = SaveEncoder.encode(instance);

      // Assert
      expect(encoded.alpha).toEqual({ id: 3, '@': 'leaf-model' });
    });

    it('does not police a class instance nested inside a plain namespace object', () =>
    {
      // Arrange- declarations describe an instance's own keys, not everything beneath them.
      SerializableRegistry.register(Leaf, { id: 'leaf-model' });
      SerializableRegistry.register(Seeded, { id: 'seeded' });
      const instance = new Seeded();
      instance.nested = { deep: new Leaf(4) };

      // Act
      const encoded = SaveEncoder.encode(instance);

      // Assert
      expect(encoded.nested.deep).toEqual({ id: 4, '@': 'leaf-model' });
    });

    it('omits a transient declared as a direct field', () =>
    {
      // Arrange
      SerializableRegistry.register(Seeded, { id: 'seeded', transients: { alpha: () => null } });

      // Act
      const encoded = SaveEncoder.encode(new Seeded());

      // Assert
      expect(Object.keys(encoded)).toEqual([ 'beta', 'nested', '@' ]);
    });

    it('omits a transient declared at a nested dotted path', () =>
    {
      // Arrange
      SerializableRegistry.register(Seeded, { id: 'seeded', transients: { 'nested.deep': () => null } });

      // Act
      const encoded = SaveEncoder.encode(new Seeded());

      // Assert- the namespace survives, the declared field inside it does not.
      expect(encoded.nested).toEqual({});
    });

    it('skips a nested transient without also skipping its siblings', () =>
    {
      // Arrange
      SerializableRegistry.register(Seeded, { id: 'seeded', transients: { 'nested.deep': () => null } });
      const instance = new Seeded();
      instance.nested.kept = 'kept';

      // Act
      const encoded = SaveEncoder.encode(instance);

      // Assert
      expect(encoded.nested).toEqual({ kept: 'kept' });
    });

    it('does not descend a transient path into a value that is not a plain object', () =>
    {
      // Arrange
      SerializableRegistry.register(Seeded, { id: 'seeded', transients: { 'nested.deep': () => null } });
      const instance = new Seeded();
      instance.nested = 'not-an-object';

      // Act
      const encoded = SaveEncoder.encode(instance);

      // Assert
      expect(encoded.nested).toBe('not-an-object');
    });

    it('drops a stray engine-written tag rather than carrying it forward', () =>
    {
      // Arrange- a value that round-tripped through JsonEx carries an '@' the codec should re-derive.
      SerializableRegistry.register(Leaf, { id: 'leaf-model' });
      const leaf = new Leaf(9);
      leaf['@'] = 'StaleTag';

      // Act
      const encoded = SaveEncoder.encode(leaf);

      // Assert
      expect(encoded['@']).toBe('leaf-model');
    });

    it('encodes a Map through its registered override', () =>
    {
      // Arrange
      registerNatives();

      // Act
      const encoded = SaveEncoder.encode(new Map([ [ 'a', 1 ] ]));

      // Assert- Object.keys cannot reach a Map's entries, so the default walk would emit {}.
      expect(encoded).toEqual({ entries: [ [ 'a', 1 ] ], '@': 'Map' });
    });

    it('encodes a Set through its registered override', () =>
    {
      // Arrange
      registerNatives();

      // Act
      const encoded = SaveEncoder.encode(new Set([ 'a', 'b' ]));

      // Assert
      expect(encoded).toEqual({ values: [ 'a', 'b' ], '@': 'Set' });
    });

    it('throws with the path when the graph runs deeper than the ceiling', () =>
    {
      // Arrange- a cycle, which is the only realistic way to exceed it.
      const cyclic = {};
      cyclic.self = cyclic;

      // Act & Assert
      expect(() => SaveEncoder.encode(cyclic))
        .toThrow(/deeper than 100 levels/);
    });
  });

  describe('SaveDecoder', () =>
  {
    it('passes null through as itself', () =>
    {
      // Arrange & Act & Assert
      expect(SaveDecoder.decode(null)).toBeNull();
    });

    it('passes a primitive through untouched', () =>
    {
      // Arrange & Act & Assert
      expect(SaveDecoder.decode('text')).toBe('text');
    });

    it('keeps the shape of an untagged, undeclared plain object', () =>
    {
      // Arrange & Act
      const decoded = SaveDecoder.decode({ alpha: 1 });

      // Assert
      expect(decoded).toEqual({ alpha: 1 });
      expect(decoded.constructor).toBe(Object);
    });

    it('rebuilds a tagged node with the right prototype', () =>
    {
      // Arrange
      SerializableRegistry.register(Leaf, { id: 'leaf-model' });

      // Act
      const decoded = SaveDecoder.decode({ id: 5, '@': 'leaf-model' });

      // Assert
      expect(Object.getPrototypeOf(decoded)).toBe(Leaf.prototype);
      expect(decoded.id).toBe(5);
    });

    it('does not carry the type tag onto the rebuilt instance', () =>
    {
      // Arrange
      SerializableRegistry.register(Leaf, { id: 'leaf-model' });

      // Act
      const decoded = SaveDecoder.decode({ id: 5, '@': 'leaf-model' });

      // Assert
      expect(Object.keys(decoded)).toEqual([ 'id' ]);
    });

    it('throws when a tag names a codec that is not registered', () =>
    {
      // Arrange & Act & Assert
      expect(() => SaveDecoder.decode({ '@': 'ghost-model' }))
        .toThrow(/no codec is registered under the save id 'ghost-model'/);
    });

    it('throws when a tag contradicts the type map that expected it', () =>
    {
      // Arrange
      SerializableRegistry.register(Leaf, { id: 'leaf-model' });
      SerializableRegistry.register(Bare, { id: 'bare' });

      // Act & Assert
      expect(() => SaveDecoder.decode({ '@': 'bare' }, Leaf))
        .toThrow(/expects 'leaf-model' here but the file says 'bare'/);
    });

    it('names the declared constructor when the expected type has no codec of its own', () =>
    {
      // Arrange
      SerializableRegistry.register(Bare, { id: 'bare' });

      // Act & Assert
      expect(() => SaveDecoder.decode({ '@': 'bare' }, Leaf))
        .toThrow(/expects 'Leaf' here/);
    });

    it('rebuilds an untagged node from the type map alone', () =>
    {
      // Arrange- this is the branch that makes a hand-edited file work.
      SerializableRegistry.register(Leaf, { id: 'leaf-model' });

      // Act
      const decoded = SaveDecoder.decode({ id: 6 }, Leaf);

      // Assert
      expect(Object.getPrototypeOf(decoded)).toBe(Leaf.prototype);
      expect(decoded.id).toBe(6);
    });

    it('throws when an untagged node names a declared type with no codec', () =>
    {
      // Arrange & Act & Assert
      expect(() => SaveDecoder.decode({ id: 6 }, Leaf))
        .toThrow(/the type map declares 'Leaf' here, but no codec is registered/);
    });

    it('forwards a declared element type through an array', () =>
    {
      // Arrange
      SerializableRegistry.register(Leaf, { id: 'leaf-model' });

      // Act
      const decoded = SaveDecoder.decode([ { id: 1 }, { id: 2 } ], Leaf);

      // Assert
      expect(decoded.map(leaf => Object.getPrototypeOf(leaf))).toEqual([ Leaf.prototype, Leaf.prototype ]);
    });

    it('decodes the values of a field declared as a dictionary of instances', () =>
    {
      // Arrange- an untagged dictionary is otherwise indistinguishable from one instance's data.
      SerializableRegistry.register(Leaf, { id: 'leaf-model' });
      SerializableRegistry.register(Seeded, { id: 'seeded', typedValues: { alpha: Leaf } });

      // Act
      const decoded = SaveDecoder.decode({ alpha: { '421': { id: 1 }, '422': { id: 2 } } }, Seeded);

      // Assert
      expect(Object.getPrototypeOf(decoded.alpha['421'])).toBe(Leaf.prototype);
      expect(decoded.alpha.constructor).toBe(Object);
    });

    it('follows a dotted type declaration through a namespace object', () =>
    {
      // Arrange
      SerializableRegistry.register(Leaf, { id: 'leaf-model' });
      SerializableRegistry.register(Seeded, { id: 'seeded', typed: { 'nested.deep': Leaf } });

      // Act
      const decoded = SaveDecoder.decode({ nested: { deep: { id: 8 } } }, Seeded);

      // Assert
      expect(Object.getPrototypeOf(decoded.nested.deep)).toBe(Leaf.prototype);
    });

    it('re-seeds a transient to its cold value even when the file omitted it', () =>
    {
      // Arrange
      SerializableRegistry.register(Seeded, { id: 'seeded', transients: { alpha: () => null } });

      // Act
      const decoded = SaveDecoder.decode({ beta: 5, '@': 'seeded' });

      // Assert- omission alone would leave `undefined`, which passes every `!== null` cache guard.
      expect(decoded.alpha).toBeNull();
    });

    it('lets a transient factory rebuild an eager cache from the fields that just decoded', () =>
    {
      // Arrange
      SerializableRegistry.register(Seeded, {
        id: 'seeded',
        transients: { alpha: instance => `rebuilt-from-${instance.beta}` },
      });

      // Act
      const decoded = SaveDecoder.decode({ beta: 5, '@': 'seeded' });

      // Assert
      expect(decoded.alpha).toBe('rebuilt-from-5');
    });

    it('lets a transient win over a value the file happened to carry', () =>
    {
      // Arrange
      SerializableRegistry.register(Seeded, { id: 'seeded', transients: { alpha: () => null } });

      // Act
      const decoded = SaveDecoder.decode({ alpha: 'stale', '@': 'seeded' });

      // Assert
      expect(decoded.alpha).toBeNull();
    });

    it('re-seeds a transient declared at a nested dotted path', () =>
    {
      // Arrange
      SerializableRegistry.register(Seeded, { id: 'seeded', transients: { 'nested.deep': () => null } });

      // Act
      const decoded = SaveDecoder.decode({ '@': 'seeded' });

      // Assert
      expect(decoded.nested.deep).toBeNull();
    });

    it('creates the namespace objects along a transient path the file never wrote', () =>
    {
      // Arrange- a plugin namespace that only exists to hold one cache.
      SerializableRegistry.register(Bare, { id: 'bare', transients: { '_j._plugin._cache': () => null } });

      // Act
      const decoded = SaveDecoder.decode({ '@': 'bare' });

      // Assert
      expect(decoded._j._plugin._cache).toBeNull();
    });

    it('runs a decode override in place of the default walk', () =>
    {
      // Arrange
      registerNatives();

      // Act
      const decoded = SaveDecoder.decode({ entries: [ [ 'a', 1 ] ], '@': 'Map' });

      // Assert
      expect(decoded.get('a')).toBe(1);
    });

    it('rebuilds a Set through its registered override', () =>
    {
      // Arrange
      registerNatives();

      // Act
      const decoded = SaveDecoder.decode({ values: [ 'a', 'b' ], '@': 'Set' });

      // Assert
      expect([ ...decoded ]).toEqual([ 'a', 'b' ]);
    });
  });

  describe('seed against fields a save predates', () =>
  {
    it('restores a constructor-assigned field the file never held', () =>
    {
      // Arrange- this is the property seed exists for: adding a field must not strand old saves.
      SerializableRegistry.register(Seeded, { id: 'seeded' });

      // Act
      const decoded = SaveDecoder.decode({ beta: 5, '@': 'seeded' });

      // Assert
      expect(decoded.alpha).toBe('default-alpha');
    });

    it('lets a decoded value win over the seeded default', () =>
    {
      // Arrange
      SerializableRegistry.register(Seeded, { id: 'seeded' });

      // Act
      const decoded = SaveDecoder.decode({ alpha: 'from-file', '@': 'seeded' });

      // Assert
      expect(decoded.alpha).toBe('from-file');
    });

    it('matches a freshly constructed instance for every field the file omitted', () =>
    {
      // Arrange
      SerializableRegistry.register(Seeded, { id: 'seeded' });
      const fresh = new Seeded();

      // Act
      const decoded = SaveDecoder.decode({ '@': 'seeded' });

      // Assert
      expect({ ...decoded }).toEqual({ ...fresh });
    });

    it('keeps a seeded key inside a namespace the file only partly describes', () =>
    {
      // Arrange- the `_j` case: a file written before a plugin existed still carries `_j`, and a
      // plain assignment would replace the whole seeded namespace with the older partial one.
      SerializableRegistry.register(Seeded, { id: 'seeded' });

      // Act
      const decoded = SaveDecoder.decode({ nested: { other: 'from-file' }, '@': 'seeded' });

      // Assert
      expect(decoded.nested).toEqual({ deep: 'default-deep', other: 'from-file' });
    });

    it('lets the file win over the seed for a key both of them hold', () =>
    {
      // Arrange
      SerializableRegistry.register(Seeded, { id: 'seeded' });

      // Act
      const decoded = SaveDecoder.decode({ nested: { deep: 'from-file' }, '@': 'seeded' });

      // Assert
      expect(decoded.nested.deep).toBe('from-file');
    });

    it('replaces rather than merges when the decoded value is an instance', () =>
    {
      // Arrange
      SerializableRegistry.register(Seeded, { id: 'seeded' });
      SerializableRegistry.register(Leaf, { id: 'leaf' });

      // Act
      const decoded = SaveDecoder.decode({ nested: { id: 7, '@': 'leaf' }, '@': 'seeded' });

      // Assert
      expect(decoded.nested.constructor).toBe(Leaf);
      expect(decoded.nested.deep).toBe(undefined);
    });

    it('replaces rather than merges when the decoded value is an array', () =>
    {
      // Arrange
      SerializableRegistry.register(Seeded, { id: 'seeded' });

      // Act
      const decoded = SaveDecoder.decode({ nested: [ 1, 2 ], '@': 'seeded' });

      // Assert
      expect(decoded.nested).toEqual([ 1, 2 ]);
    });
  });

  describe('round trip', () =>
  {
    it('rebuilds a deep-equal instance carrying the right prototype', () =>
    {
      // Arrange
      registerNatives();
      SerializableRegistry.register(Leaf, { id: 'leaf-model' });
      SerializableRegistry.register(Seeded, { id: 'seeded', typed: { alpha: Leaf } });
      const original = new Seeded();
      original.alpha = new Leaf(11);
      original.beta = new Map([ [ 'k', new Leaf(12) ] ]);

      // Act
      const decoded = SaveDecoder.decode(JSON.parse(JSON.stringify(SaveEncoder.encode(original))));

      // Assert
      expect(decoded).toEqual(original);
      expect(Object.getPrototypeOf(decoded)).toBe(Seeded.prototype);
      expect(Object.getPrototypeOf(decoded.beta.get('k'))).toBe(Leaf.prototype);
    });

    it('rebuilds correctly from type maps alone when every tag is stripped', () =>
    {
      // Arrange- hand-editing a section down to bare JSON must still load.
      SerializableRegistry.register(Leaf, { id: 'leaf-model' });
      SerializableRegistry.register(Seeded, { id: 'seeded', typed: { alpha: Leaf } });
      const original = new Seeded();
      original.alpha = new Leaf(13);

      const stripTags = value =>
      {
        if (value === null || Object.prototype.toString.call(value) !== '[object Object]') return value;

        const stripped = {};
        Object.keys(value)
          .forEach(key =>
          {
            if (key !== '@') stripped[key] = stripTags(value[key]);
          });

        return stripped;
      };

      // Act
      const decoded = SaveDecoder.decode(stripTags(SaveEncoder.encode(original)), Seeded);

      // Assert
      expect(decoded).toEqual(original);
      expect(Object.getPrototypeOf(decoded.alpha)).toBe(Leaf.prototype);
    });
  });
});
//endregion plugins/_base/core/save/save-codec-core.test.js
