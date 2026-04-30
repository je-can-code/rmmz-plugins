//region SerializableRegistry
/**
 * A central registry of constructors that {@link JsonEx} can use for reliable
 * type restoration when deserializing.
 */
class SerializableRegistry
{
  /**
   * The internal collection of registered constructors.
   * @type {Map<string, Function>}
   */
  static _constructors = new Map();

  /**
   * Registers a constructor for {@link JsonEx} deserialization.
   *
   * This enables modern `class` syntax for serializable models without requiring
   * `window.SomeClass = SomeClass` global exports.
   *
   * @param {Function} constructor The constructor to register.
   * @param {{id?: string, aliases?: string[]}=} options Options for registration.
   */
  static register(constructor, options = undefined)
  {
    // determine the primary id for this constructor.
    const id = (options && options.id)
      ? options.id
      : constructor.name;

    // register the primary id.
    this._constructors.set(id, constructor);

    // register any aliases for backwards compatibility.
    const aliases = (options && options.aliases)
      ? options.aliases
      : [];

    aliases.forEach(alias =>
    {
      this._constructors.set(alias, constructor);
    });
  }

  /**
   * Resolves a previously-registered constructor by id.
   * @param {string} id The serialization id for the constructor.
   * @returns {Function|null} The resolved constructor, or null when not found.
   */
  static resolve(id)
  {
    if (this._constructors.has(id))
    {
      return this._constructors.get(id);
    }

    return null;
  }
}
//endregion SerializableRegistry