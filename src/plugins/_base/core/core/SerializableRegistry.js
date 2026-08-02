//region SerializableRegistry
/**
 * A central registry of constructors that {@link JsonEx} can use for reliable
 * type restoration when deserializing.
 *
 * It is also where each type's save declarations are kept - but only kept. This class stores what a
 * registration said and answers "what constructor does this name mean"; it does not know what a
 * transient or a typed field *means*, because that is the save format's business and the save
 * format is an optional extension. J-Base-Save reads these declarations and builds its own codecs
 * from them.
 *
 * That division is what lets the extension be uninstalled: without it, every registration here is
 * inert metadata that nothing interprets, and the engine's own save path carries on unchanged.
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
   * Gets the raw declarations each constructor was registered with.
   * @returns {Map<Function, object>} The registrations.
   */
  static registrations()
  {
    // hand back the registrations.
    return this._registrations;
  }

  /**
   * Gets how many times a registration has been filed or amended.
   *
   * Anything caching a view of this registry compares against this rather than against the map's
   * size, because size does not move when a registration is replaced - and a test that clears the
   * registry and re-registers the same count would otherwise keep a stale cache silently.
   * @returns {number} The revision.
   */
  static revision()
  {
    // hand back the revision.
    return this._revision;
  }

  /**
   * Sets the revision.
   * @param {number} value The new revision.
   */
  static setRevision(value)
  {
    this._revision = value;
  }
  //endregion properties

  /**
   * The internal collection of registered constructors.
   * @type {Map<string, Function>}
   */

  static _constructors = new Map();

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
   * How many times a registration has been filed or amended, so a cache can tell it has gone stale.
   * @type {number}
   */
  static _revision = 0;

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

    this.installDeclarations(constructor, declarations);
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

    this.installDeclarations(constructor, {
      ...existing,
      transients: { ...existing.transients, ...(options.transients ?? {}) },
      typed: { ...existing.typed, ...(options.typed ?? {}) },
      typedValues: { ...existing.typedValues, ...(options.typedValues ?? {}) },
    });
  }

  /**
   * Empties the registry entirely.
   *
   * This exists so nothing has to reach into the two maps to reset them. Clearing them from outside
   * would leave the revision where it was, and any cached view comparing against that revision would
   * decide it was still current while holding codecs for types that are no longer registered.
   */
  static clear()
  {
    this.constructors()
      .clear();

    this.registrations()
      .clear();

    // an emptying is a change like any other, and anything caching a view has to hear about it.
    this.setRevision(this.revision() + 1);
  }

  /**
   * Files a complete set of declarations against the constructor they describe.
   * @param {Function} constructor The constructor being described.
   * @param {object} declarations The complete, normalized declarations.
   */
  static installDeclarations(constructor, declarations)
  {
    // remember the declarations verbatim, both so a later extend() has something to merge into and
    // so the save extension has something to build a codec out of.
    this.registrations()
      .set(constructor, declarations);

    // moving the revision is what tells any cached view of this registry that it is out of date.
    this.setRevision(this.revision() + 1);
  }

  /**
   * Resolves a previously-registered constructor by id.
   *
   * This is {@link JsonEx}'s lookup, and it hands back a bare constructor because that is all
   * {@link JsonEx} has ever wanted. Anything reading save declarations goes through the index the
   * save extension builds instead.
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
   * Resolves the declarations a live value's type was registered with.
   *
   * Keyed on `value.constructor` rather than on a name or a prototype-chain test, which is both a
   * plain `Map` lookup and immune to two unrelated classes sharing a name.
   * @param {object} value The live instance to identify.
   * @returns {object|null} The declarations, or null when the type is not registered.
   */
  static registrationForInstance(value)
  {
    if (this.registrations()
      .has(value.constructor))
    {
      return this.registrations()
        .get(value.constructor);
    }

    return null;
  }
}

export default SerializableRegistry;
//endregion SerializableRegistry