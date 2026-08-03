//region Game_System
import JABS_StandardController from './../_models/JABS_StandardController.js';
/**
 * Extends {@link #initMembers}.<br/>
 * Initializes members used for storing JABS input mappings per controller.
 */
J.ABS.EXT.INPUT.Aliased.Game_System.set('initMembers', Game_System.prototype.initMembers);
Game_System.prototype.initMembers = function()
{
  // perform original logic.
  J.ABS.EXT.INPUT.Aliased.Game_System.get('initMembers')
    .call(this);

  // initialize extension members for JABS input configurations.
  this.initJabsInputConfigMembers();
};

/**
 * Ensures the installation-scoped stores backing every accessor below exist.
 *
 * **Keybinds belong to the person, not to the playthrough.** They live on {@link ConfigManager},
 * beside volume and touch UI, so rebinding a key in one save is visible in every other one and
 * deleting every savefile does not cost the player their controls. The methods here stay on
 * `Game_System` because that is where every caller already reaches for them; only the storage moved.
 */
Game_System.prototype.initJabsInputConfigMembers = function()
{
  // the fields are registered with defaults by the extension's own config registration, so these
  // are here for the case where a controller is remapped before anything has read the config file.
  ConfigManager.jabsInputMappings ||= {};

  ConfigManager.jabsInputBindings ||= {};
};

/**
 * Gets the stored mapping dictionary of controllerKey -> mapping object.
 * @returns {Object<string, Object<string,string>>}
 */
Game_System.prototype.getJabsInputMappings = function()
{
  // return the full mappings dictionary.
  return ConfigManager.jabsInputMappings;
};

/**
 * Overwrites the stored mapping dictionary of controllerKey -> mapping object.
 *
 * The config document is written immediately rather than at the next save, because installation
 * scope has no save to wait for- the player rebinding a key expects it to still be bound after they
 * quit without saving.
 * @param {Object<string, Object<string,string>>} mappings The new mappings dictionary.
 */
Game_System.prototype.setJabsInputMappings = function(mappings)
{
  // assign the provided mappings dictionary.
  ConfigManager.jabsInputMappings = mappings;

  ConfigManager.save();
};

/**
 * Stores a full mapping for the given controller key.
 * @param {string} controllerKey The key representing which controller this mapping belongs to.
 * @param {Object<string,string>} mapping The mapping object to store.
 */
Game_System.prototype.setJabsInputConfig = function(controllerKey, mapping)
{
  // create a shallow copy to avoid external mutation.
  const copy = {};

  // copy each mapping entry by key.
  Object.keys(mapping)
    .forEach(key => copy[key] = mapping[key]);

  // set the new value into the mappings dictionary via the setter.
  const mappings = this.getJabsInputMappings();
  mappings[controllerKey] = copy;
  this.setJabsInputMappings(mappings);
};

/**
 * Gets the stored mapping for the given controller key.
 * @param {string} controllerKey The key representing which controller’s mapping to retrieve.
 * @returns {Object<string,string>|null} The stored mapping, or null if none found.
 */
Game_System.prototype.getJabsInputConfig = function(controllerKey)
{
  // read the mappings dictionary.
  const mappings = this.getJabsInputMappings();

  // grab the mapping bucket for this key.
  const found = mappings[controllerKey];

  // return null if not found.
  if (!found) return null;

  // return a shallow copy for safety.
  const copy = {};
  Object.keys(found)
    .forEach(key => copy[key] = found[key]);
  return copy;
};

/**
 * Gets the persisted snapshot of the Input registry bindings.
 * Shape: { [ns: string]: { [key: string]: string[] } }
 * @returns {Object<string, Object<string, string[]>>}
 */
Game_System.prototype.getInputBindingsSnapshot = function()
{
  // return the stored snapshot bag of input bindings.
  return ConfigManager.jabsInputBindings;
};

/**
 * Sets the persisted Input bindings snapshot on the system object.
 * @param {Object<string, Object<string, string[]>>} bindings The snapshot to persist.
 */
Game_System.prototype.setInputBindings = function(bindings)
{
  ConfigManager.jabsInputBindings = bindings;

  ConfigManager.save();
};

/**
 * Overwrites the persisted Input bindings snapshot on the system object.
 * The provided object should follow the shape: { [ns]: { [key]: string[] } }.
 * @param {Object<string, Object<string, string[]>>} snapshot The snapshot to store.
 */
Game_System.prototype.setInputBindingsSnapshot = function(snapshot)
{
  // assign a defensive deep clone to avoid mutation via shared references.
  const out = {};
  const namespaces = Object.keys(snapshot || {});
  for (let i = 0; i < namespaces.length; i++)
  {
    const ns = namespaces[i];
    const map = snapshot[ns] || {};
    const copy = {};
    const keys = Object.keys(map);
    for (let k = 0; k < keys.length; k++)
    {
      const key = keys[k];
      const arr = map[key];
      copy[key] = Array.isArray(arr)
        ? arr.slice(0)
        : [];
    }
    out[ns] = copy;
  }
  this.setInputBindings(out);
};

/**
 * Applies a stored mapping (if present) to the given controller.
 * @param {string} controllerKey The key used to look up the mapping.
 * @param {JABS_StandardController} controller The input controller to apply to.
 */
Game_System.prototype.applyJabsInputConfigToController = function(controllerKey, controller)
{
  // fetch any stored mapping for this key.
  const mapping = this.getJabsInputConfig(controllerKey);

  // if nothing was found, there is nothing to apply.
  if (!mapping) return;

  // push the full mapping to the controller in one call.
  controller.setAllInputs(mapping);
};

/**
 * Captures current mappings from all known controllers into system storage.
 * This should be called before save, or explicitly by the remap scene’s Save.
 */
Game_System.prototype.saveAllJabsInputConfigs = function()
{
  // get all currently registered controllers from the adapter.
  const controllers = JABS_InputAdapter.getAllControllers();

  // iterate each controller and snapshot its mapping.
  controllers.forEach((controller, index) =>
  {
    // resolve a key for this controller.
    const key = this.resolveJabsControllerKey(controller, index);

    // export and store the controller’s mapping.
    this.setJabsInputConfig(key, controller.exportAllInputs());
  });
};

/**
 * Applies stored mappings to all currently registered controllers.
 * Intended to be called after a save file loads.
 */
Game_System.prototype.applyAllJabsInputConfigs = function()
{
  // get all currently registered controllers from the adapter.
  const controllers = JABS_InputAdapter.getAllControllers();

  // apply per resolved key.
  controllers.forEach((controller, index) =>
  {
    const key = this.resolveJabsControllerKey(controller, index);
    this.applyJabsInputConfigToController(key, controller);
  });
};

/**
 * Resets a controller to defaults and persists the mapping.
 * @param {number} index The adapter index of the controller to reset.
 */
Game_System.prototype.resetJabsInputConfigToDefaults = function(index)
{
  // get controllers from adapter.
  const list = JABS_InputAdapter.getAllControllers();

  // get the controller and its key.
  const controller = list[index];
  const key = this.resolveJabsControllerKey(controller, index);

  // build and apply defaults.
  const defaults = controller.buildDefaultMapping();
  controller.setAllInputs(defaults);

  // persist the defaults for future loads.
  this.setJabsInputConfig(key, defaults);
};

/**
 * Snapshots all live Input namespace bindings into system storage for persistence.
 */
Game_System.prototype.saveAllInputBindingsFromInput = function()
{
  // delegate to the Input manager to export all namespaces.
  const snapshot = Input.exportAllBindingsForSave();

  // persist the snapshot on the system object.
  this.setInputBindingsSnapshot(snapshot);
};

/**
 * Applies the persisted Input bindings snapshot back into the live Input registry.
 * Ensures Input defaults are bootstrapped before applying.
 */
Game_System.prototype.applyAllInputBindingsToInput = function()
{
  // ensure live registries have defaults before overlaying saved data.
  Input.ensureRemapBootstrapped();

  // import from the system-stored snapshot across all namespaces.
  const saved = this.getInputBindingsSnapshot();
  Input.importAllBindingsFromSave(saved);
};

/**
 * Resolves a stable key for the given controller for config storage.
 * Default strategy: "player" + (index+1).
 * @param {JABS_StandardController} controller The controller to resolve a key for.
 * @param {number} index The index of this controller in the adapter list.
 * @returns {string} The resolved key.
 */
Game_System.prototype.resolveJabsControllerKey = function(controller, index)
{
  // basic, stable default: player1, player2, ...
  return `player${index + 1}`;
};

/**
 * Seeds the stored input configuration from the controllers' own defaults when nothing is stored.
 *
 * This is the first-run path: a fresh installation has an empty config document, so the defaults
 * every controller can build for itself become the stored configuration once, and everything after
 * that is the player's own.
 */
Game_System.prototype.initializeJabsInputIfMissing = function()
{
  // ensure both stores exist before they are read, however early this runs.
  this.initJabsInputConfigMembers();

  // Determine if any mappings are stored.
  const hasMappings = Object.keys(this.getJabsInputMappings()).length > 0;

  // Determine if any bindings are stored.
  const hasBindings = Object.keys(this.getInputBindingsSnapshot()).length > 0;

  // If neither mappings nor bindings exist, initialize defaults for old saves.
  if (hasMappings === false && hasBindings === false)
  {
    // Ensure the live Input registry is bootstrapped with defaults.
    Input.ensureRemapBootstrapped();

    // For any currently-registered controllers, apply and persist defaults.
    const controllers = JABS_InputAdapter.getAllControllers();
    controllers.forEach((controller, index) =>
    {
      // Resolve a stable key for this controller.
      const key = this.resolveJabsControllerKey(controller, index);

      // Build defaults and apply to the live controller.
      const defaults = controller.buildDefaultMapping();
      controller.setAllInputs(defaults);

      // Persist defaults into the system store so it exists next save.
      this.setJabsInputConfig(key, defaults);
    });

    // Snapshot the default Input registry across all namespaces for persistence.
    const snapshot = Input.exportAllBindingsForSave();
    this.setInputBindingsSnapshot(snapshot);
  }
};

/**
 * Extends {@link #onBeforeSave}.<br/>
 * Snapshots controller mappings before saving.
 */
J.ABS.EXT.INPUT.Aliased.Game_System.set('onBeforeSave', Game_System.prototype.onBeforeSave);
Game_System.prototype.onBeforeSave = function()
{
  // perform original logic.
  const original = J.ABS.EXT.INPUT.Aliased.Game_System.get('onBeforeSave');
  original.call(this);

  // snapshot all current controller mappings into system storage.
  this.saveAllJabsInputConfigs();

  // snapshot the full Input registry (all namespaces) into system storage.
  this.saveAllInputBindingsFromInput();
};

/**
 * Pushes the stored keybind configuration into the live input registry and every controller.
 *
 * This runs whenever a game world comes up, not when a savefile is read. Keybinds are installation
 * scope- they are read from {@link ConfigManager}, and a new game has exactly as much claim on them
 * as a loaded one does. Hanging this off the load hook instead would leave a fresh playthrough
 * running the built-in defaults while the player's own bindings sat in the config file, unread.
 */
Game_System.prototype.applyJabsInputConfiguration = function()
{
  // seed the stored configuration from defaults if this installation has none yet.
  this.initializeJabsInputIfMissing();

  // apply the persisted Input bindings back into the live registry.
  this.applyAllInputBindingsToInput();

  // attempt to apply stored configs to any currently registered controllers.
  this.applyAllJabsInputConfigs();
};

//endregion Game_System