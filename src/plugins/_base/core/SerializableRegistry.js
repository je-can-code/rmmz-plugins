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
  //endregion properties

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
    this.constructors().set(id, constructor);

    // register any aliases for backwards compatibility.
    const aliases = (options && options.aliases)
      ? options.aliases
      : [];

    aliases.forEach(alias =>
    {
      this.constructors().set(alias, constructor);
    });
  }

  /**
   * Resolves a previously-registered constructor by id.
   * @param {string} id The serialization id for the constructor.
   * @returns {Function|null} The resolved constructor, or null when not found.
   */
  static resolve(id)
  {
    if (this.constructors().has(id))
    {
      return this.constructors().get(id);
    }

    return null;
  }
}

export default SerializableRegistry;
//endregion SerializableRegistry