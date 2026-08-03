//region SaveDocument
/**
 * The single place that answers "where does `$gameScreen` go".
 *
 * A slot is written as several JSON documents rather than one, and something has to own the mapping
 * from a top-level key of the save contents to the file it lands in. That is this. It replaces the
 * flat object `DataManager.makeSaveContents` builds - ten engine keys, plus whatever plugins have
 * aliased their way into it over the years.
 *
 * **Registration is optional and the default is to keep the data.** A key nobody registered lands in
 * the fallback section rather than being dropped, because the failure modes are not symmetrical: an
 * unregistered key in the wrong file is untidy, and an unregistered key in no file is a player's
 * progress quietly evaporating. That is the same fail-open stance the codec layer takes on fields.
 *
 * `systems/<plugin>.json` does not appear here. Those files are produced by {@link SaveSectionRouter}
 * from the `_j.<plugin>` slices it lifts off the hosts, not from a top-level key anyone registered.
 */
class SaveDocument
{
  /**
   * The section a key lands in when nothing has registered it.
   *
   * The world file, rather than a file of its own, because an unregistered key is usually a plugin
   * that added a top-level key the old way and expects it back exactly as it left it.
   * @type {string}
   */
  static fallbackSection = 'world.json';

  /**
   * Which section each registered top-level key belongs to.
   * @type {Map<string, string>}
   */
  static _sectionsByKey = new Map();

  /**
   * Gets which section each registered top-level key belongs to.
   * @returns {Map<string, string>} The sections, keyed by save-contents key.
   */
  static sectionsByKey()
  {
    return this._sectionsByKey;
  }

  /**
   * Declares that a top-level key of the save contents belongs in a particular section file.
   *
   * A plugin that adds a top-level key registers it here instead of aliasing
   * `DataManager.makeSaveContents`, which is how the layout stays describable in one place.
   * @param {string} key The key as it appears on the save contents object, ex: `party`.
   * @param {string} sectionName The file it belongs in, ex: `party.json`.
   */
  static registerKey(key, sectionName)
  {
    this.sectionsByKey()
      .set(key, sectionName);
  }

  /**
   * Determines which section file a top-level key belongs in.
   * @param {string} key The key as it appears on the save contents object.
   * @returns {string} The section's file name.
   */
  static sectionFor(key)
  {
    if (this.sectionsByKey()
      .has(key))
    {
      return this.sectionsByKey()
        .get(key);
    }

    return this.fallbackSection;
  }
}

/**
 * The vanilla ten, split three ways.
 *
 * `world.json` holds the things that describe where the player is and what the world has been told
 * to do; the party and the actor roster get files of their own because they are the two documents a
 * developer actually opens - "how much gold do I have", "what is this actor's level" - and burying
 * them in a file with the switch table would make that worse rather than better.
 *
 * Followers and vehicles have no entry because they are not top-level keys: they live inside
 * `player` and `map` respectively, and travel with them.
 */
SaveDocument.registerKey('system', 'world.json');
SaveDocument.registerKey('screen', 'world.json');
SaveDocument.registerKey('timer', 'world.json');
SaveDocument.registerKey('switches', 'world.json');
SaveDocument.registerKey('variables', 'world.json');
SaveDocument.registerKey('selfSwitches', 'world.json');
SaveDocument.registerKey('map', 'world.json');
SaveDocument.registerKey('player', 'world.json');
SaveDocument.registerKey('party', 'party.json');
SaveDocument.registerKey('actors', 'actors.json');

export default SaveDocument;
//endregion SaveDocument