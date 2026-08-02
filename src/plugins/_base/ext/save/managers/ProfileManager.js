//region ProfileManager
import SaveFileSystem from './SaveFileSystem.js';
import SaveEncoder from './../core/SaveEncoder.js';
import SaveDecoder from './../core/SaveDecoder.js';

/**
 * Profile scope: anything that outlives a single playthrough without being a machine setting.
 *
 * Three lifetimes exist, and until now the engine only had two of them. Installation scope is
 * {@link ConfigManager} - volume, keybinds, window preferences, the things that belong to this copy
 * of the game. Slot scope is a playthrough. Profile scope is the gap between them: a record of what
 * this player has done across every playthrough, which survives deleting all their saves.
 *
 * **Nothing populates it yet, on purpose.** What belongs at this scope - a bestiary that remembers
 * across runs, a new-game-plus unlock, a "you have finished this once" flag - is content design, not
 * plumbing, and inventing entries here would be guessing at decisions nobody has made. This is the
 * seam, ready for the first thing that needs it.
 *
 * The shape deliberately mirrors {@link ConfigManager}: register a field with a default factory, and
 * the document takes care of itself. A plugin that understands one understands the other.
 */
class ProfileManager
{
  /**
   * The file the profile document is written as.
   * @type {string}
   */
  static fileName = 'profile.json';

  /**
   * Every registered field, mapped to the factory producing its default.
   * @type {Map<string, Function>}
   */
  static _registeredFields = new Map();

  /**
   * The live value of every registered field.
   * @type {Map<string, *>}
   */
  static _values = new Map();

  /**
   * Whether the profile document has been read yet this session.
   * @type {boolean}
   */
  static _loaded = false;

  /**
   * Gets every registered field and the factory producing its default.
   * @returns {Map<string, Function>} The fields, keyed by name.
   */
  static registeredFields()
  {
    return this._registeredFields;
  }

  /**
   * Gets the live value of every registered field.
   * @returns {Map<string, *>} The values, keyed by field name.
   */
  static values()
  {
    return this._values;
  }

  /**
   * Declares a value that belongs to the player's profile rather than to one playthrough.
   *
   * The default is a factory for the same reason it is on {@link ConfigManager.registerField}: a
   * shared mutable default is a bug waiting for its first writer.
   * @param {string} key The field name, which is also the key it is written under.
   * @param {Function} defaultValueFactory Produces the value the field holds on a fresh install.
   */
  static registerField(key, defaultValueFactory)
  {
    this.registeredFields()
      .set(key, defaultValueFactory);

    // seed immediately so a read between registration and the document being loaded is answerable.
    this.values()
      .set(key, defaultValueFactory());
  }

  /**
   * Gets the current value of a registered field.
   * @param {string} key The field name.
   * @returns {*} The value.
   */
  static get(key)
  {
    return this.values()
      .get(key);
  }

  /**
   * Sets the value of a registered field. Writing the document is the caller's decision.
   * @param {string} key The field name.
   * @param {*} value The value to hold.
   */
  static set(key, value)
  {
    this.values()
      .set(key, value);
  }

  /**
   * Determines whether the profile document has been read this session.
   * @returns {boolean}
   */
  static isLoaded()
  {
    return this._loaded;
  }

  /**
   * Builds the plain data the profile document is written from.
   * @returns {object}
   */
  static makeData()
  {
    const data = {};

    this.values()
      .forEach((value, key) =>
      {
        data[key] = value;
      });

    return data;
  }

  /**
   * Applies a read profile document, defaulting anything it does not carry.
   * @param {object} data The profile data read from disk.
   */
  static applyData(data)
  {
    this.registeredFields()
      .forEach((defaultValueFactory, key) =>
      {
        this.values()
          .set(key, key in data
            ? data[key]
            : defaultValueFactory());
      });
  }

  /**
   * Reads the profile document.
   *
   * A fresh install has no document, which is a value rather than a failure: every field is already
   * sitting at the default its registration seeded.
   */
  static load()
  {
    SaveFileSystem.readDocument(this.fileName)
      .then(data =>
      {
        if (data !== null)
        {
          this.applyData(SaveDecoder.decode(data, null, '$.profile'));
        }

        this._loaded = true;

        return 0;
      })
      .catch(() =>
      {
        // a profile that will not read must not stop the game from booting: the fields are already
        // at their defaults, and the next write replaces whatever is on disk.
        this._loaded = true;

        return 0;
      });
  }

  /**
   * Writes the profile document.
   * @returns {Promise<void>}
   */
  static save()
  {
    return SaveFileSystem.writeDocument(this.fileName, SaveEncoder.encode(this.makeData(), '$.profile'));
  }
}

export default ProfileManager;
//endregion ProfileManager