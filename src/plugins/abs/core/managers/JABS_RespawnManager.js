//region JABS_RespawnManager
import JABS_RespawnRecord from '../models/JABS_RespawnRecord.js';

/**
 * This static class governs how defeated battlers schedule their return to the map.
 *
 * It is a registry of "respawn methods". A method owns one way of measuring the wait- core ships
 * `seconds`, which counts playtime frames- and extensions may register richer methods (calendar
 * appointments, and so on) without core ever knowing they exist. A method is two functions:
 *
 * - `schedule(param)` runs once at death and converts the tag parameter into a `due` scalar,
 *   or null when the parameter is nonsense.
 * - `isDue(due)` runs during sweeps and answers whether that scheduled moment has passed.
 *
 * The `due` scalar's unit is entirely the method's own business; nothing outside the method that
 * produced it may interpret it.
 */
class JABS_RespawnManager
{
  /**
   * The registry of all known respawn methods, keyed by the method name used in tags.
   * @type {Map<string, {schedule: Function, isDue: Function}>}
   */
  static #methods = new Map();

  /**
   * The method names already complained about, so a save full of records pointing at an
   * uninstalled extension's method warns once instead of once per sweep.
   * @type {Set<string>}
   */
  static #warnedMethods = new Set();

  /**
   * Registers a respawn method under the given name.
   * Registering over an existing name is allowed but announced, because it usually means two
   * plugins believe they own the same method.
   * @param {string} name The method name as it appears in `<respawn:[METHOD, PARAM]>` tags.
   * @param {{schedule: Function, isDue: Function}} handler The scheduling pair for this method.
   */
  static registerMethod(name, handler)
  {
    // announce a collision; the newest registration wins either way.
    if (this.#methods.has(name))
    {
      Diagnostics.warn(__PLUGIN_NAME__, `respawn method [ ${name} ] was registered more than once.`);
    }

    // record the method for use by tags everywhere.
    this.#methods.set(name, handler);
  }

  /**
   * Gets the handler registered under the given method name.
   * @param {string} name The method name to look up.
   * @returns {{schedule: Function, isDue: Function}|null} The handler, or null if unregistered.
   */
  static method(name)
  {
    // fall back to a null for unknown methods; callers treat that as "do not track".
    return this.#methods.get(name) ?? null;
  }

  /**
   * Builds the respawn record for a freshly-defeated battler, if it should have one.
   *
   * Resolution order is `global default < enemy note < event comment`- the same laddering every
   * other per-battler JABS tag follows. `<noRespawn>` outranks any `<respawn:...>` declaration,
   * because permanence is the stronger statement.
   * @param {Game_Event} event The event whose battler was just defeated.
   * @param {Game_Enemy} enemy The underlying enemy battler that was defeated.
   * @returns {JABS_RespawnRecord|null} The record to register, or null when nothing tracks.
   */
  static createRecord(event, enemy)
  {
    // permanence wins over any scheduled return.
    const noRespawn = event.getNoRespawnOverrides() ?? enemy.isNoRespawn();
    if (noRespawn === true)
    {
      // a permanent record has no schedule to consult; its mere existence blocks conversion.
      return new JABS_RespawnRecord(JABS_RespawnRecord.PERMANENT_METHOD, String.empty, 0);
    }

    // resolve the declared respawn pair, if anyone declared one.
    const respawnData = event.getRespawnOverrides() ?? enemy.respawnData();

    // no declaration anywhere means no tracking- the battler returns on map re-entry as always.
    if (respawnData === null) return null;

    // the tag parses as a pair of method name and method parameter.
    const [ methodName, rawParam ] = respawnData;

    // parameters may arrive as parsed numbers; methods are owed a string.
    const param = String(rawParam);

    // find the method that owns this declaration.
    const handler = this.method(methodName);

    // an unknown method is a misconfiguration- likely a typo, or an uninstalled extension.
    if (handler === null)
    {
      Diagnostics.warn(__PLUGIN_NAME__, `unknown respawn method: [ ${methodName} ]; no respawn will be tracked.`);
      return null;
    }

    // let the method translate the parameter into its due moment.
    const due = handler.schedule(param);

    // a null due means the parameter was nonsense for that method.
    if (due === null)
    {
      Diagnostics.warn(
        __PLUGIN_NAME__,
        `invalid respawn param: [ ${param} ] for method: [ ${methodName} ]; no respawn will be tracked.`);
      return null;
    }

    // build the record for the registry.
    return new JABS_RespawnRecord(methodName, param, due);
  }

  /**
   * Determines whether the given record's scheduled moment has passed.
   * Permanent records are never due- that is what permanent means.
   * @param {JABS_RespawnRecord} record The record to evaluate.
   * @returns {boolean} True if the battler may return now, false otherwise.
   */
  static isDue(record)
  {
    // permanence never comes due.
    if (record.isPermanent()) return false;

    // find the method that scheduled this record.
    const handler = this.method(record.method);

    // a record pointing at a missing method usually means an extension was uninstalled mid-save;
    // the battler stays down rather than silently popping back early.
    if (handler === null)
    {
      // complain only once per method name, not once per sweep.
      if (!this.#warnedMethods.has(record.method))
      {
        this.#warnedMethods.add(record.method);
        Diagnostics.warn(
          __PLUGIN_NAME__,
          `respawn method [ ${record.method} ] is not registered; its records will never come due.`);
      }

      return false;
    }

    // ask the owning method whether the moment has passed.
    return handler.isDue(record.due);
  }
}

/**
 * The one respawn method core owns: a flat count of seconds, measured in playtime frames.
 *
 * Playtime frames are the right clock for a single-player game- they pause when the game does,
 * and `Graphics.frameCount` is restored from `_framesOnSave` on load, so a pending timer crosses
 * a save/load cycle without losing its place.
 */
JABS_RespawnManager.registerMethod('seconds', {
  /**
   * Converts a count of seconds into the absolute playtime frame at which the battler returns.
   * @param {string} param The tag parameter- a positive whole number of seconds.
   * @returns {number|null} The due frame, or null for a non-positive or non-numeric parameter.
   */
  schedule: param =>
  {
    // translate the raw parameter into a number of seconds.
    const seconds = parseInt(param);

    // zero or garbage seconds is a declaration that means nothing.
    if (!Number.isFinite(seconds) || seconds <= 0) return null;

    // the timer starts at death, immediately; waiting around is the player's time to spend.
    return Graphics.frameCount + (seconds * 60);
  },

  /**
   * Determines whether the scheduled playtime frame has been reached.
   * @param {number} due The absolute playtime frame at which the battler returns.
   * @returns {boolean}
   */
  isDue: due => Graphics.frameCount >= due,
});

export default JABS_RespawnManager;
//endregion JABS_RespawnManager