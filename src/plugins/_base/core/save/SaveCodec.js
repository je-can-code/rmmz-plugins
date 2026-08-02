//region SaveCodec
/**
 * The normalized per-type record the registry stores: everything the encoder and decoder need to
 * know about one class, resolved once at registration time rather than re-derived per node.
 *
 * A codec is built from the loose options object a caller hands
 * {@link SerializableRegistry.register}, and its job is to turn every convenience that object allows
 * into exactly one shape the walkers can rely on. Notably:
 *
 * - `transients` and `typed` accept **dotted paths**, because almost every transient in this project
 *   lives inside a plugin namespace (`_j._base._cachedAllNotes`) rather than directly on the class.
 *   A flat key list could not express a single row of the real inventory.
 * - `seed` is resolved here, not at decode time, so the question "does this class have an
 *   `initMembers` to default from" is asked once per class instead of once per decoded object.
 *
 * The trees this builds are read on every node of a save, so they are plain nested `Map`s rather
 * than anything cleverer- a `Map.get` per path segment is the whole cost.
 */
class SaveCodec
{
  /**
   * The constructor this codec describes.
   * @type {Function}
   */
  #type = null;

  /**
   * The stable string this type is written to disk as.
   * @type {string}
   */
  #id = String.empty;

  /**
   * Older save ids that still resolve to this type, so a rename ships without a migration.
   * @type {string[]}
   */
  #aliases = [];

  /**
   * Transient declarations as given: dotted path to a factory producing the cold value.
   * @type {Map<string, Function>}
   */
  #transients = new Map();

  /**
   * The same transient declarations arranged as a tree, for the encoder to skip by while walking.
   * @type {{value: Function|null, children: Map<string, object>}}
   */
  #transientTree = null;

  /**
   * Type declarations arranged as a tree: which fields hold instances, and of what.
   * @type {{value: Function|null, children: Map<string, object>}}
   */
  #typedTree = null;

  /**
   * Dictionary-valued type declarations arranged as a tree: which fields are plain objects whose
   * *values* are instances.
   * @type {{value: Function|null, children: Map<string, object>}}
   */
  #typedValuesTree = null;

  /**
   * Establishes every field's default on a bare instance, before decoded fields land on it.
   * @type {Function}
   */
  #seed = null;

  /**
   * A full replacement for the default encode walk, or null to use the default.
   * @type {Function|null}
   */
  #encode = null;

  /**
   * A full replacement for the default decode walk, or null to use the default.
   * @type {Function|null}
   */
  #decode = null;

  /**
   * Builds an empty node for the path trees below.
   * @returns {{value: Function|null, children: Map<string, object>}}
   */
  static emptyNode()
  {
    return {
      value: null,
      children: new Map(),
    };
  }

  /**
   * Arranges a flat map of dotted paths into a tree, so a walker descending an object graph can
   * carry its position in the declarations alongside its position in the data.
   *
   * A path may be a plain field name, in which case its node hangs directly off the root.
   * @param {Object<string, Function>} declarations Dotted path to whatever the path declares.
   * @returns {{value: Function|null, children: Map<string, object>}} The root of the tree.
   */
  static buildPathTree(declarations)
  {
    const root = SaveCodec.emptyNode();

    Object.keys(declarations)
      .forEach(path =>
      {
        // descend the tree one path segment at a time, creating waypoints that were not needed yet.
        let node = root;
        path.split('.')
          .forEach(segment =>
          {
            if (node.children.has(segment) === false)
            {
              node.children.set(segment, SaveCodec.emptyNode());
            }

            node = node.children.get(segment);
          });

        // the node the last segment landed on is the one the declaration belongs to.
        node.value = declarations[path];
      });

    return root;
  }

  /**
   * @param {Function} type The constructor this codec describes.
   * @param {object} options The normalization inputs; see {@link SerializableRegistry.register}.
   * @param {string} options.id The stable save id.
   * @param {string[]} options.aliases Older save ids that still resolve here.
   * @param {Object<string, Function>} options.transients Dotted path to a cold-value factory.
   * @param {Object<string, Function>} options.typed Dotted path to the constructor that field holds.
   * @param {Object<string, Function>} options.typedValues Dotted path to the constructor that
   * field's dictionary *values* hold.
   * @param {Function|null} options.seed An explicit default-establishing step, or null to derive one.
   * @param {Function|null} options.encode A full encode override, or null.
   * @param {Function|null} options.decode A full decode override, or null.
   */
  constructor(type, { id, aliases, transients, typed, typedValues, seed, encode, decode })
  {
    this.#type = type;

    this.#id = id;

    this.#aliases = aliases;

    this.#transients = new Map(Object.entries(transients));

    this.#transientTree = SaveCodec.buildPathTree(transients);

    this.#typedTree = SaveCodec.buildPathTree(typed);

    this.#typedValuesTree = SaveCodec.buildPathTree(typedValues);

    // a class that establishes its state in initMembers gets that as its seed for free. classes that
    // set up in `initialize` instead must say so, because `initialize` is never safe to re-run- it
    // takes arguments, and the engine's versions do real work like Game_Actor's setup().
    this.#seed = seed ?? this.#deriveSeed(type);

    this.#encode = encode;

    this.#decode = decode;
  }

  /**
   * Picks the default seed step for a type that did not supply one.
   * @param {Function} type The constructor being registered.
   * @returns {Function} The seed step.
   */
  #deriveSeed(type)
  {
    // a class with no initMembers and no explicit seed defaults every field to nothing at all. that
    // is a deliberate no-op rather than an error: plenty of small models are fully described by the
    // fields they persist, and forcing each one to declare an empty seed would be noise.
    if (!type.prototype.initMembers) return () => {};

    return instance => instance.initMembers();
  }

  /**
   * Gets the constructor this codec describes.
   * @returns {Function}
   */
  type()
  {
    return this.#type;
  }

  /**
   * Gets the stable string this type is written to disk as.
   * @returns {string}
   */
  id()
  {
    return this.#id;
  }

  /**
   * Gets the older save ids that still resolve to this type.
   * @returns {string[]}
   */
  aliases()
  {
    return this.#aliases;
  }

  /**
   * Gets the transient declarations, keyed by dotted path.
   * @returns {Map<string, Function>}
   */
  transients()
  {
    return this.#transients;
  }

  /**
   * Gets the root of the transient path tree, for the encoder to walk alongside the data.
   * @returns {{value: Function|null, children: Map<string, object>}}
   */
  transientTree()
  {
    return this.#transientTree;
  }

  /**
   * Gets the root of the type path tree, for the decoder to walk alongside the data.
   * @returns {{value: Function|null, children: Map<string, object>}}
   */
  typedTree()
  {
    return this.#typedTree;
  }

  /**
   * Gets the root of the dictionary-value type path tree.
   * @returns {{value: Function|null, children: Map<string, object>}}
   */
  typedValuesTree()
  {
    return this.#typedValuesTree;
  }

  /**
   * Establishes every field's default on a bare instance, ahead of any decoded field landing on it.
   * @param {object} instance The freshly prototyped, unpopulated instance.
   */
  seed(instance)
  {
    this.#seed(instance);
  }

  /**
   * Determines whether this codec replaces the default encode walk entirely.
   * @returns {boolean}
   */
  hasEncodeOverride()
  {
    return this.#encode !== null;
  }

  /**
   * Runs this codec's encode override against an instance.
   * @param {object} instance The live instance being encoded.
   * @param {string} path The JSON path of the instance, for error context.
   * @returns {object} The plain data form.
   */
  runEncode(instance, path)
  {
    return this.#encode(instance, path);
  }

  /**
   * Determines whether this codec replaces the default decode walk entirely.
   * @returns {boolean}
   */
  hasDecodeOverride()
  {
    return this.#decode !== null;
  }

  /**
   * Runs this codec's decode override against plain data.
   * @param {object} data The plain data form read from the file.
   * @param {string} path The JSON path of the node, for error context.
   * @returns {object} The rebuilt instance.
   */
  runDecode(data, path)
  {
    return this.#decode(data, path);
  }
}

export default SaveCodec;
//endregion SaveCodec