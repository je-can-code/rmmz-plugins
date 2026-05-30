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
 * Initializes members used for storing JABS input mappings and controller references.
 */
Game_System.prototype.initJabsInputConfigMembers = function()
{
  /**
   * Root namespace for J-related data stored on the system object.
   */
  this._j ||= {};

  /**
   * ABS (JABS) namespace stored under the J-root on the system object.
   */
  this._j._abs ||= {};

  /**
   * Input extension namespace stored under the ABS namespace on the system object.
   */
  this._j._abs._input ||= {};

  /**
   * Dictionary of controllerKey -> mapping object `{ [button]: symbol }`.
   * @type {Object<string, Object<string, string>>}
   */
  this._j._abs._input._mappings ||= {};

  /**
   * Snapshot of the full Input registry bindings across all namespaces.
   * @type {Object<string, Object<string, string[]>>}
   */
  this._j._abs._input._bindings ||= {};
};

/**
 * Gets the stored mapping dictionary of controllerKey -> mapping object.
 * @returns {Object<string, Object<string,string>>}
 */
Game_System.prototype.getJabsInputMappings = function()
{
  // return the full mappings dictionary.
  return this._j._abs._input._mappings;
};

/**
 * Overwrites the stored mapping dictionary of controllerKey -> mapping object.
 * @param {Object<string, Object<string,string>>} mappings The new mappings dictionary.
 */
Game_System.prototype.setJabsInputMappings = function(mappings)
{
  // assign the provided mappings dictionary.
  this._j._abs._input._mappings = mappings;
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
  // in case this save file was created ahead of the remap update, handle it.
  if (!this._j || !this._j._abs || !this._j._abs._input || !this._j._abs._input._bindings)
  {
    return {};
  }

  // return the stored snapshot bag (may be empty object).
  return this._j._abs._input._bindings || {};
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
  this._j._abs._input._bindings = out;
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
 * Initializes JABS input data for legacy saves that predate persistence.
 * If both the stored controller mappings and Input bindings snapshot are missing,
 * this seeds defaults one time so subsequent saves/loads work normally.
 */
Game_System.prototype.initializeJabsInputForLegacySaveIfMissing = function()
{
  // Ensure the JABS input scaffolding exists on loaded saves.
  this.initJabsInputConfigMembers();

  // Read the mappings dictionary if available, otherwise null.
  const mappingsDict = (this._j && this._j._abs && this._j._abs._input)
    ? this._j._abs._input._mappings
    : null;

  // Read the bindings dictionary if available, otherwise null.
  const bindingsDict = (this._j && this._j._abs && this._j._abs._input)
    ? this._j._abs._input._bindings
    : null;

  // Determine if any mappings exist in the save.
  const hasMappings = mappingsDict
    ? Object.keys(mappingsDict).length > 0
    : false;

  // Determine if any bindings exist in the save.
  const hasBindings = bindingsDict
    ? Object.keys(bindingsDict).length > 0
    : false;

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
 * Extends {@link #onAfterLoad}.<br/>
 * Applies stored mappings after loading.
 */
J.ABS.EXT.INPUT.Aliased.Game_System.set('onAfterLoad', Game_System.prototype.onAfterLoad);
Game_System.prototype.onAfterLoad = function()
{
  // perform original logic.
  J.ABS.EXT.INPUT.Aliased.Game_System.get('onAfterLoad')
    .call(this);

  // Perform one-time initialization for legacy saves if required.
  this.initializeJabsInputForLegacySaveIfMissing();

  // apply the persisted Input bindings back into the live registry.
  this.applyAllInputBindingsToInput();

  // attempt to apply stored configs to any currently registered controllers.
  this.applyAllJabsInputConfigs();
};

//endregion Game_System