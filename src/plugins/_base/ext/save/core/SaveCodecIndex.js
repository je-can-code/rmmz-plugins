//region SaveCodecIndex
import SaveCodec from './SaveCodec.js';

/**
 * The lookup the walkers use to go from a value, or from a tag in a file, to the codec describing it.
 *
 * {@link SerializableRegistry} keeps what each registration *said* - the raw declarations - and
 * deliberately does not know what any of it means, because it lives in J-Base and the save format is
 * an optional extension of it. Interpreting a declaration is this ship's job, so building codecs out
 * of those declarations happens here.
 *
 * **The index is built lazily, on first lookup, rather than at load.** Plugins register their models
 * at module scope, and several of them load *after* this one - so an index built while this file is
 * being evaluated would be missing everything registered later. The first save or load happens long
 * after every plugin has finished loading, which makes first-lookup the earliest moment the answer
 * is complete.
 *
 * It rebuilds whenever the registry has grown or shrunk since the last build. That covers the two
 * cases that matter: a plugin registering after the first build, and a test clearing the registry
 * between cases.
 *
 * Note that the three lookups below refresh the index and the three accessors do not. That split is
 * deliberate: an accessor that rebuilt on read would have to read its own field to decide whether to,
 * which is the recursion the accessor rules exist to prevent.
 */
class SaveCodecIndex
{
  /**
   * Codecs keyed by save id and by every alias they answer to.
   * @type {Map<string, SaveCodec>}
   */
  static _byId = new Map();

  /**
   * Codecs keyed by the constructor function itself.
   * @type {Map<Function, SaveCodec>}
   */
  static _byType = new Map();

  /**
   * The registry revision this index was built from, used to notice a stale one.
   *
   * Deliberately the revision rather than the registration count: a registration being *replaced*
   * leaves the count where it was, so a size check would hold a stale codec for a type someone had
   * just re-declared.
   * @type {number}
   */
  static _builtFrom = -1;

  /**
   * Gets the codecs, keyed by save id and by every alias.
   * @returns {Map<string, SaveCodec>} The codecs by id.
   */
  static byId()
  {
    return this._byId;
  }

  /**
   * Sets the codecs keyed by save id.
   * @param {Map<string, SaveCodec>} value The rebuilt index.
   */
  static setById(value)
  {
    this._byId = value;
  }

  /**
   * Gets the codecs, keyed by the constructor function itself.
   * @returns {Map<Function, SaveCodec>} The codecs by type.
   */
  static byType()
  {
    return this._byType;
  }

  /**
   * Sets the codecs keyed by constructor.
   * @param {Map<Function, SaveCodec>} value The rebuilt index.
   */
  static setByType(value)
  {
    this._byType = value;
  }

  /**
   * Gets the registry revision the current index was built from.
   * @returns {number} The revision at build time.
   */
  static builtFrom()
  {
    return this._builtFrom;
  }

  /**
   * Sets the registry revision the current index was built from.
   * @param {number} value The revision.
   */
  static setBuiltFrom(value)
  {
    this._builtFrom = value;
  }

  /**
   * Rebuilds both indices when the registry no longer matches what they were built from.
   */
  static rebuildIfStale()
  {
    const revision = SerializableRegistry.revision();

    if (this.builtFrom() === revision) return;

    const registrations = SerializableRegistry.registrations();

    const byId = new Map();
    const byType = new Map();

    registrations.forEach((declarations, constructor) =>
    {
      const codec = new SaveCodec(constructor, declarations);

      // a codec answers to its id, to every alias it kept for backwards compatibility, and to the
      // constructor itself.
      byId.set(declarations.id, codec);

      declarations.aliases.forEach(alias => byId.set(alias, codec));

      byType.set(constructor, codec);
    });

    this.setById(byId);
    this.setByType(byType);
    this.setBuiltFrom(revision);
  }

  /**
   * Gets every registered codec, keyed by constructor, with the index refreshed first.
   *
   * This is the enumeration entry point, and it exists separately from {@link #byType} because that
   * one is the bare accessor the field rules require and must not rebuild on read. Anything walking
   * the whole registry - a sweep asserting every type declares what it holds, for instance - wants
   * this, so that a type registered after the last lookup is included.
   * @returns {Map<Function, SaveCodec>} Every codec, by constructor.
   */
  static all()
  {
    this.rebuildIfStale();

    return this.byType();
  }

  /**
   * Resolves a codec by the save id written into a file.
   *
   * Aliases resolve here too, which is the whole mechanism by which a class rename ships without a
   * migration: the old id keeps pointing at the codec that replaced it.
   * @param {string} id The save id read from a type tag.
   * @returns {SaveCodec|null} The resolved codec, or null when nothing is registered under that id.
   */
  static forId(id)
  {
    this.rebuildIfStale();

    if (this.byId()
      .has(id))
    {
      return this.byId()
        .get(id);
    }

    return null;
  }

  /**
   * Resolves a codec by its constructor function.
   * @param {Function} constructor The constructor to look up.
   * @returns {SaveCodec|null} The resolved codec, or null when the type is not registered.
   */
  static forConstructor(constructor)
  {
    this.rebuildIfStale();

    if (this.byType()
      .has(constructor))
    {
      return this.byType()
        .get(constructor);
    }

    return null;
  }

  /**
   * Resolves the codec describing a live value's type.
   * @param {object} value The live instance to identify.
   * @returns {SaveCodec|null} The resolved codec, or null when the type is not registered.
   */
  static forInstance(value)
  {
    return this.forConstructor(value.constructor);
  }
}

export default SaveCodecIndex;
//endregion SaveCodecIndex
