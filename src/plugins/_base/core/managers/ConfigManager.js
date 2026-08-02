//region ConfigManager
/**
 * Installation scope: the settings that belong to the person playing rather than to a playthrough.
 *
 * Vanilla `ConfigManager` has seven fields, no way for a plugin to add an eighth, and writes them to
 * `config.rmmzsave`. The second of those is why keybinds ended up at
 * `$gameSystem._j._abs._input._mappings` - installation data trapped in slot scope, where rebinding
 * a key in one save leaves every other save on the old bindings and deleting a save loses them.
 *
 * The registration seam below is the eighth field, generalized: a plugin declares what it wants kept
 * at installation scope and what that setting defaults to, and the two halves of the config document
 * pick it up automatically. The file itself moved to `config.json` with everything else, which
 * {@link StorageManager} handles by name - nothing here knows what a file is.
 */

/**
 * The over-arching object containing all of my added parameters.
 */
ConfigManager._j ||= {};

/**
 * Every plugin-registered field, mapped to the factory producing its default.
 * @type {Map<string, Function>}
 */
ConfigManager._j._registeredFields = new Map();

/**
 * Gets every plugin-registered field and the factory producing its default.
 * @returns {Map<string, Function>} The fields, keyed by name.
 */
ConfigManager.registeredFields = function()
{
  return this._j._registeredFields;
};

/**
 * Declares a setting that belongs to the installation rather than to a save.
 *
 * The default is a factory rather than a value because a setting is frequently an object or an
 * array, and one shared instance handed out as "the default" would be mutated by the first thing
 * that touched it.
 *
 * The field is seeded immediately, so it reads correctly between the plugin loading and the config
 * document being read off disk.
 * @param {string} key The field name, which is also the key it is written under.
 * @param {Function} defaultValueFactory Produces the value the field holds on a fresh install.
 */
ConfigManager.registerField = function(key, defaultValueFactory)
{
  this.registeredFields()
    .set(key, defaultValueFactory);

  this[key] = defaultValueFactory();
};

/**
 * Extends {@link #makeData}.<br/>
 * Also writes every plugin-registered field into the config document.
 * @returns {object} The config data, extended.
 */
J.BASE.Aliased.ConfigManager.set('makeData', ConfigManager.makeData);
ConfigManager.makeData = function()
{
  // perform original logic.
  const config = J.BASE.Aliased.ConfigManager.get('makeData')
    .call(this);

  this.registeredFields()
    .forEach((defaultValueFactory, key) =>
    {
      config[key] = this[key];
    });

  return config;
};

/**
 * Extends {@link #applyData}.<br/>
 * Also reads every plugin-registered field back out of the config document.
 *
 * A field the document does not carry is reset to its default rather than left as whatever the last
 * session put there. That is the same re-seed rule the save codecs follow, and for the same reason:
 * a setting that is absent from the file has no value, and "no value" has to mean the default rather
 * than a leftover.
 * @param {object} config The config data read from disk.
 */
J.BASE.Aliased.ConfigManager.set('applyData', ConfigManager.applyData);
ConfigManager.applyData = function(config)
{
  // perform original logic.
  J.BASE.Aliased.ConfigManager.get('applyData')
    .call(this, config);

  this.registeredFields()
    .forEach((defaultValueFactory, key) =>
    {
      this[key] = key in config
        ? config[key]
        : defaultValueFactory();
    });
};
//endregion ConfigManager