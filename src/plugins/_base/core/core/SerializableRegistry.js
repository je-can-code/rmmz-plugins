//region SerializableRegistry
import SaveCodec from './SaveCodec.js';

/**
 * A central registry of constructors that {@link JsonEx} can use for reliable
 * type restoration when deserializing.
 *
 * It is also where the save pipeline's per-type rules live. A registration answers two different
 * questions with one call: "what constructor does this name mean" - which is all {@link JsonEx} ever
 * needed - and "what does this type persist, regenerate, and hold instances of", which is what
 * {@link SaveEncoder} and {@link SaveDecoder} read. The two are deliberately separate lookups rather
 * than one, because {@link JsonEx} wants a bare constructor and the walkers want a {@link SaveCodec};
 * folding them together would mean whichever caller lost the coin toss unwrapping the other's answer
 * on every node.
 */
class SerializableRegistry
{

  //region properties
  /**
   * Gets the constructors.
   * @returns {*} The constructors.
   */
  static constructors()
  {
    // hand back the constructors.
    return this._constructors;
  }

  /**
   * Gets the codecs, keyed by save id and by every alias.
   * @returns {Map<string, SaveCodec>} The codecs.
   */
  static codecs()
  {
    // hand back the codecs.
    return this._codecs;
  }

  /**
   * Gets the codecs, keyed by the constructor function itself.
   * @returns {Map<Function, SaveCodec>} The codecs by type.
   */
  static codecsByType()
  {
    // hand back the codecs by type.
    return this._codecsByType;
  }

  /**
   * Gets the raw declarations each constructor was registered with.
   * @returns {Map<Function, object>} The registrations.
   */
  static registrations()
  {
    // hand back the registrations.
    return this._registrations;
  }
  //endregion properties

  /**
   * The internal collection of registered constructors.
   * @type {Map<string, Function>}
   */

  static _constructors = new Map();

  /**
   * The internal collection of registered codecs, keyed by save id and by every alias.
   * @type {Map<string, SaveCodec>}
   */
  static _codecs = new Map();

  /**
   * The internal collection of registered codecs, keyed by the constructor function itself.
   *
   * This is the index that lets the encoder answer "what type is this value" with a `Map` lookup on
   * `value.constructor`, rather than a prototype-chain test or a name comparison. It is keyed on the
   * function identity, so two classes that happen to share a name cannot collide here the way they
   * would in the id-keyed map above.
   * @type {Map<Function, SaveCodec>}
   */
  static _codecsByType = new Map();

  /**
   * The options each constructor was registered with, kept so {@link #extend} can merge into them.
   *
   * This exists because a codec for an engine class is authored by more than one plugin. J-Base owns
   * the `Game_Party` registration, but the transients living at `_j._omni` on that same party are
   * J-Omni's to declare - and J-Base must never know they exist, because a core plugin does not
   * reach into an optional extension. Keeping the raw declarations means a later contribution merges
   * rather than clobbers.
   * @type {Map<Function, object>}
   */
  static _registrations = new Map();

  /**
   * Registers a constructor for {@link JsonEx} deserialization and for the save pipeline.
   *
   * This enables modern `class` syntax for serializable models without requiring
   * `window.SomeClass = SomeClass` global exports.
   *
   * Everything past `aliases` describes how the save pipeline should treat this type. All of it is
   * optional, and the defaults are chosen to fail open: a type registered with no options at all
   * persists every own enumerable field, holds no instances, and seeds from `initMembers` if it has
   * one. Forgetting to declare something means it gets saved, which is wasteful and harmless- the
   * opposite mistake loses a player's progress.
   *
   * Both `transients` and `typed` accept **dotted paths** as keys, because the fields worth declaring
   * usually sit inside a plugin namespace rather than directly on the class:
   *
   * ```javascript
   * SerializableRegistry.register(Game_Party, {
   *   id: 'game-party',
   *   aliases: [ 'Game_Party' ],
   *   transients: {
   *     // lazy: every reader is guarded, so the cold value is the whole answer.
   *     '_j._base._cachedAllNotes': () => null,
   *
   *     // eager: nothing rebuilds this on a miss, so the factory owes the rebuild.
   *     '_j._omni._questopediaCache': party => new Map(
   *       party.getSavedQuestopediaEntries().map(entry => [ entry.key, entry ])),
   *   },
   *   typed: {
   *     _lastItem: Game_Item,
   *   },
   * });
   * ```
   *
   * @param {Function} constructor The constructor to register.
   * @param {{
   *   id?: string,
   *   aliases?: string[],
   *   transients?: Object<string, Function>,
   *   typed?: Object<string, Function>,
   *   typedValues?: Object<string, Function>,
   *   seed?: Function,
   *   encode?: Function,
   *   decode?: Function
   * }=} options Options for registration.
   */
  static register(constructor, options = undefined)
  {
    // every option is optional, so normalize the absent-options case into an empty bag once.
    const given = options ?? {};

    // determine the primary id for this constructor.
    const id = given.id
      ? given.id
      : constructor.name;

    // register the primary id.
    this.constructors()
      .set(id, constructor);

    // register any aliases for backwards compatibility.
    const aliases = given.aliases
      ? given.aliases
      : [];

    aliases.forEach(alias =>
    {
      this.constructors()
        .set(alias, constructor);
    });

    // normalize everything the save pipeline cares about into a single record, once, here- so the
    // walkers never have to reason about which options a caller happened to pass.
    const declarations = {
      id,
      aliases,
      transients: given.transients ?? {},
      typed: given.typed ?? {},
      typedValues: given.typedValues ?? {},
      seed: given.seed ?? null,
      encode: given.encode ?? null,
      decode: given.decode ?? null,
    };

    this.installCodec(constructor, declarations);
  }

  /**
   * Adds declarations to a type another plugin already registered.
   *
   * This is how a plugin claims the part of a shared host that belongs to it. `Game_Party` is
   * registered by J-Base, but the caches at `$gameParty._j._omni` are J-Omni's - and the dependency
   * only runs one way, so J-Base cannot name them. J-Omni calls this instead, and the two sets of
   * declarations merge into the one codec that describes the class.
   *
   * Merging is per-declaration and last-wins on a collision, which is the same shape as the alias
   * map pattern: two plugins declaring the same path would be a genuine conflict worth noticing, and
   * two plugins declaring different paths - the normal case - simply add up.
   *
   * The `id`, `aliases`, and `seed` of an existing registration are left alone. Identity belongs to
   * whoever registered the type, and an extension redefining it would silently repoint every save.
   * @param {Function} constructor The already-registered constructor to add declarations to.
   * @param {{
   *   transients?: Object<string, Function>,
   *   typed?: Object<string, Function>,
   *   typedValues?: Object<string, Function>
   * }} options The declarations to merge in.
   */
  static extend(constructor, options)
  {
    const existing = this.registrations()
      .get(constructor);

    // extending something nothing has registered is a load-order bug: the owning plugin's
    // registration file did not run first. say so rather than quietly inventing a codec.
    if (!existing)
    {
      throw new Error(
        `cannot extend the save codec for '${constructor.name}' because nothing has registered it. `
        + 'The plugin that owns the type must load before the one extending it.');
    }

    this.installCodec(constructor, {
      ...existing,
      transients: { ...existing.transients, ...(options.transients ?? {}) },
      typed: { ...existing.typed, ...(options.typed ?? {}) },
      typedValues: { ...existing.typedValues, ...(options.typedValues ?? {}) },
    });
  }

  /**
   * Builds a codec from a complete set of declarations and files it under every key it answers to.
   * @param {Function} constructor The constructor being described.
   * @param {object} declarations The complete, normalized declarations.
   */
  static installCodec(constructor, declarations)
  {
    // remember the declarations verbatim so a later extend() has something to merge into.
    this.registrations()
      .set(constructor, declarations);

    const codec = new SaveCodec(constructor, declarations);

    // the codec answers to its id, to every alias, and to the constructor itself.
    this.codecs()
      .set(declarations.id, codec);

    declarations.aliases.forEach(alias =>
    {
      this.codecs()
        .set(alias, codec);
    });

    this.codecsByType()
      .set(constructor, codec);
  }

  /**
   * Resolves a previously-registered constructor by id.
   *
   * This is {@link JsonEx}'s lookup and returns a bare constructor for that reason; anything working
   * with the save pipeline wants {@link #codecById} instead.
   * @param {string} id The serialization id for the constructor.
   * @returns {Function|null} The resolved constructor, or null when not found.
   */
  static resolve(id)
  {
    if (this.constructors()
      .has(id))
    {
      return this.constructors()
        .get(id);
    }

    return null;
  }

  /**
   * Resolves a previously-registered codec by the save id written into a file.
   *
   * Aliases resolve here too, which is the whole mechanism by which a class rename ships without a
   * migration: the old id keeps pointing at the codec that replaced it.
   * @param {string} id The save id read from a type tag.
   * @returns {SaveCodec|null} The resolved codec, or null when nothing is registered under that id.
   */
  static codecById(id)
  {
    if (this.codecs()
      .has(id))
    {
      return this.codecs()
        .get(id);
    }

    return null;
  }

  /**
   * Resolves a previously-registered codec by its constructor function.
   * @param {Function} constructor The constructor to look up.
   * @returns {SaveCodec|null} The resolved codec, or null when the type is not registered.
   */
  static codecForConstructor(constructor)
  {
    if (this.codecsByType()
      .has(constructor))
    {
      return this.codecsByType()
        .get(constructor);
    }

    return null;
  }

  /**
   * Resolves the codec describing a live value's type.
   *
   * This is how the encoder identifies what it is looking at, and it is keyed on `value.constructor`
   * rather than on a name or a prototype-chain test- a `Map` lookup on function identity, which is
   * both faster and immune to two unrelated classes sharing a name.
   * @param {object} value The live instance to identify.
   * @returns {SaveCodec|null} The resolved codec, or null when the type is not registered.
   */
  static codecForInstance(value)
  {
    return this.codecForConstructor(value.constructor);
  }
}

export default SerializableRegistry;
//endregion SerializableRegistry