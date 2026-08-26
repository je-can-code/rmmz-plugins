//region Diagnostics
/**
 * The single channel every plugin in this ecosystem reports developer-facing anomalies through.
 *
 * This is not {@link MapLogManager} and has nothing to do with the J-Log ship. J-Log writes to
 * windows the *player* reads during play. This writes to the devtools console that only the
 * developer ever opens, and it exists because a console full of bare `console.warn` lines cannot
 * be triaged: nothing in the message says which of eighty-odd plugins emitted it, so the first
 * step in chasing any warning was grepping the whole tree for its wording.
 *
 * Every method takes the emitting plugin's name as its first argument and stamps it on the front
 * of the message. Callers pass `__PLUGIN_NAME__` - the build-time identifier Vite substitutes from
 * that ship's own `_metadata/meta.js`, the same one `initialization.js` builds its metadata from.
 * So the name has exactly one source of truth per ship, renaming a ship updates every diagnostic it
 * writes, and no file repeats a name that could drift out of step with the one it ships under.
 *
 * Deliberately the build-time identifier rather than `J.SOMETHING.Metadata.name`: substitution
 * bakes a literal into the bundle, so the message still identifies its ship in exactly the
 * situation where the runtime namespace is what broke.
 *
 * These are deliberately thin wrappers over the real `console` methods rather than a buffer or a
 * reformatter. Devtools' own grouping, filtering and object inspection are the reason anyone opens
 * the console at all, and anything that captures output first takes those away.
 *
 * Supporting values arrive as one optional `details` argument rather than a variadic tail, because
 * a rest parameter states no contract - and a caller with several values to show is better served
 * passing `{ target, attacker, error }` than three bare positional blobs, since devtools prints the
 * keys alongside the values.
 *
 * This is for anomalies only - a state that should not have been reachable, an input that failed
 * to parse, a contract a caller broke. Narrating normal operation is what this codebase means when
 * it says never ship logging.
 */
class Diagnostics
{
  /**
   * Reports something wrong that the game can carry on through, usually by falling back to a
   * sentinel or skipping the work. The caller keeps running after this returns.
   * @param {string} pluginName The emitting plugin's name; callers pass `__PLUGIN_NAME__`.
   * @param {string} message What is wrong, stated so a reader who has never seen this code knows.
   * @param {*} [details] One value worth inspecting, or an object naming several.
   */
  static warn(pluginName, message, details = null)
  {
    const stamped = Diagnostics.format(pluginName, message);

    // a caller with nothing to show must not print a trailing null next to every message.
    if (details === null)
    {
      console.warn(stamped);
      return;
    }

    // hand off to the real console so devtools keeps its own formatting and object inspection.
    console.warn(stamped, details);
  }

  /**
   * Reports something that went *right* and is worth confirming - a config file that loaded, a
   * save section that migrated. This is the one method here that is not about an anomaly, and it
   * exists for the small number of places where a developer deliberately asked to be told.
   *
   * It is not a licence to narrate normal operation. The bar is that somebody opted in: a plugin
   * passing a `logSummary` builder wants the confirmation, and a scene rendering a menu does not.
   * @param {string} pluginName The emitting plugin's name; callers pass `__PLUGIN_NAME__`.
   * @param {string} message What happened, stated so it is useful without the surrounding code.
   * @param {*} [details] One value worth inspecting, or an object naming several.
   */
  static info(pluginName, message, details = null)
  {
    const stamped = Diagnostics.format(pluginName, message);

    // a caller with nothing to show must not print a trailing null next to every message.
    if (details === null)
    {
      console.info(stamped);
      return;
    }

    // hand off to the real console so devtools keeps its own formatting and object inspection.
    console.info(stamped, details);
  }

  /**
   * Reports something wrong that the game cannot carry on through correctly, whether or not it is
   * about to throw. Use this when the result is going to be incorrect rather than merely absent.
   * @param {string} pluginName The emitting plugin's name; callers pass `__PLUGIN_NAME__`.
   * @param {string} message What is wrong, stated so a reader who has never seen this code knows.
   * @param {*} [details] One value worth inspecting, or an object naming several.
   */
  static error(pluginName, message, details = null)
  {
    const stamped = Diagnostics.format(pluginName, message);

    // a caller with nothing to show must not print a trailing null next to every message.
    if (details === null)
    {
      console.error(stamped);
      return;
    }

    // hand off to the real console so devtools keeps its own formatting and object inspection.
    console.error(stamped, details);
  }

  /**
   * Reports an anomaly whose *call path* is the diagnostic rather than its values - a method
   * reached from somewhere it should never have been reached from, a static class someone tried
   * to instantiate. The message alone cannot answer "who did this", so the stack comes with it.
   * @param {string} pluginName The emitting plugin's name; callers pass `__PLUGIN_NAME__`.
   * @param {string} message What is wrong, stated so a reader who has never seen this code knows.
   * @param {*} [details] One value worth inspecting, or an object naming several.
   */
  static trace(pluginName, message, details = null)
  {
    // the message carries the same shape as any other warning, so it reads the same in the list.
    Diagnostics.warn(pluginName, message, details);

    // the stack is the actual payload here; console.trace prints it against the current frame.
    console.trace();
  }

  /**
   * Stamps the emitting plugin's name onto a message.
   *
   * Bracketed rather than colon-suffixed so the prefix survives being read next to a message that
   * contains its own colons, which most of them do.
   * @param {string} pluginName The emitting plugin's name; callers pass `__PLUGIN_NAME__`.
   * @param {string} message The message to stamp.
   * @returns {string}
   */
  static format(pluginName, message)
  {
    // one shape, everywhere, so a console filter on "[J-ABS]" catches every line that ship wrote.
    return `[${pluginName}] ${message}`;
  }
}

export default Diagnostics;
//endregion Diagnostics