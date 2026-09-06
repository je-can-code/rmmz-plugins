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
 *
 * <h3>Why this one class catches, when the rest of the codebase must not</h3>
 *
 * Everywhere else, the correct response to a broken contract is a loud bug rather than a silent
 * filter. Here the loud bug *is* the product, and the catching exists so that reporting one anomaly
 * can never manufacture a second, larger one. A diagnostic runs only on a path that has already
 * gone wrong, which is the path least likely to have been played and most expensive to break: a
 * defect inside a warning sits invisible for as long as nothing goes wrong, then converts a handled
 * problem into a crashed game at the exact moment a developer most needed the warning.
 *
 * So `message` and `details` may each be handed over as a **thunk** - a function returning the
 * value - and anything that throws while being built is reported instead of propagating. The catch
 * wraps thunk invocation and nothing else. `console` itself is never guarded; guarding engine
 * globals is a thing this codebase does not do, and a `console` that fails is a broken runtime
 * rather than a case to carry on through.
 *
 * <h3>What this cannot protect, and why no version of it could</h3>
 *
 * An argument written out in full is evaluated by JavaScript at the **call site**, before this class
 * is ever entered. `Diagnostics.warn(name, `x: ${event.x()}`, { id: event.id() })` throws in the
 * caller's own frame, and nothing inside this file runs to intercept it. That is a property of the
 * language rather than a gap in this design, and the thunk form is the only shape that closes it:
 *
 * <pre>
 * Unprotected - the object is built before the call happens:
 *   Diagnostics.warn(__PLUGIN_NAME__, 'the thing broke.', { at: this.somethingRisky() });
 *
 * Protected - the object is built inside this class, behind the catch:
 *   Diagnostics.warn(__PLUGIN_NAME__, 'the thing broke.', () => ({ at: this.somethingRisky() }));
 * </pre>
 *
 * The cheapest safe payload is usually neither: hand over the object itself and let devtools do the
 * inspecting, as in `{ event: this }`. Nothing is evaluated, so nothing can throw.
 */
class Diagnostics
{
  /**
   * The text substituted for a message whose thunk threw while building it. The caller's real
   * message is unavailable by definition, so this states what happened in its place and the error
   * itself travels alongside it in the payload.
   * @type {string}
   */
  static MESSAGE_BUILD_FAILURE = 'a diagnostic message threw while being built; see the payload.';

  /**
   * Reports something wrong that the game can carry on through, usually by falling back to a
   * sentinel or skipping the work. The caller keeps running after this returns.
   * @param {string} pluginName The emitting plugin's name; callers pass `__PLUGIN_NAME__`.
   * @param {string|Function} message What is wrong, stated so a reader who has never seen this code
   * knows. A function is invoked here to build it, which is the safe form when building it can throw.
   * @param {*} [details] One value worth inspecting, or an object naming several. A function is
   * invoked here to build it, which is the safe form when building it can throw.
   */
  static warn(pluginName, message, details = null)
  {
    Diagnostics.emit(console.warn, pluginName, message, details);
  }

  /**
   * Reports something that went *right* and is worth confirming - a config file that loaded, a
   * save section that migrated. This is the one method here that is not about an anomaly, and it
   * exists for the small number of places where a developer deliberately asked to be told.
   *
   * It is not a licence to narrate normal operation. The bar is that somebody opted in: a plugin
   * passing a `logSummary` builder wants the confirmation, and a scene rendering a menu does not.
   * @param {string} pluginName The emitting plugin's name; callers pass `__PLUGIN_NAME__`.
   * @param {string|Function} message What happened, stated so it is useful without the surrounding
   * code. A function is invoked here to build it, which is the safe form when building it can throw.
   * @param {*} [details] One value worth inspecting, or an object naming several. A function is
   * invoked here to build it, which is the safe form when building it can throw.
   */
  static info(pluginName, message, details = null)
  {
    Diagnostics.emit(console.info, pluginName, message, details);
  }

  /**
   * Reports something wrong that the game cannot carry on through correctly, whether or not it is
   * about to throw. Use this when the result is going to be incorrect rather than merely absent.
   * @param {string} pluginName The emitting plugin's name; callers pass `__PLUGIN_NAME__`.
   * @param {string|Function} message What is wrong, stated so a reader who has never seen this code
   * knows. A function is invoked here to build it, which is the safe form when building it can throw.
   * @param {*} [details] One value worth inspecting, or an object naming several. A function is
   * invoked here to build it, which is the safe form when building it can throw.
   */
  static error(pluginName, message, details = null)
  {
    Diagnostics.emit(console.error, pluginName, message, details);
  }

  /**
   * Reports an anomaly whose *call path* is the diagnostic rather than its values - a method
   * reached from somewhere it should never have been reached from, a static class someone tried
   * to instantiate. The message alone cannot answer "who did this", so the stack comes with it.
   * @param {string} pluginName The emitting plugin's name; callers pass `__PLUGIN_NAME__`.
   * @param {string|Function} message What is wrong, stated so a reader who has never seen this code
   * knows. A function is invoked here to build it, which is the safe form when building it can throw.
   * @param {*} [details] One value worth inspecting, or an object naming several. A function is
   * invoked here to build it, which is the safe form when building it can throw.
   */
  static trace(pluginName, message, details = null)
  {
    // the message carries the same shape as any other warning, so it reads the same in the list.
    Diagnostics.warn(pluginName, message, details);

    // the stack is the actual payload here; console.trace prints it against the current frame.
    console.trace();
  }

  /**
   * Builds the finished line and hands it to the requested console method.
   *
   * Every public method funnels through here so the thunk contract, the failure reporting and the
   * "no trailing null" rule each exist once rather than four times.
   * @param {Function} channel The `console` method to write with, called against `console` itself.
   * @param {string} pluginName The emitting plugin's name; callers pass `__PLUGIN_NAME__`.
   * @param {string|Function} message The message, or a thunk building it.
   * @param {*} details The details, or a thunk building them.
   */
  static emit(channel, pluginName, message, details)
  {
    const resolvedMessage = Diagnostics.resolve(message);
    const resolvedDetails = Diagnostics.resolve(details);

    // a message that could not be built still has to say something, and what it says is that it
    // could not be built- the error that explains it rides along in the payload below.
    const text = resolvedMessage.error === null
      ? resolvedMessage.value
      : Diagnostics.MESSAGE_BUILD_FAILURE;
    const stamped = Diagnostics.format(pluginName, text);
    const payload = Diagnostics.payload(resolvedMessage, resolvedDetails);

    // a caller with nothing to show must not print a trailing null next to every message.
    if (payload === null)
    {
      channel.call(console, stamped);
      return;
    }

    // hand off to the real console so devtools keeps its own formatting and object inspection.
    channel.call(console, stamped, payload);
  }

  /**
   * Produces the value a caller asked to report, invoking it first when it arrived as a thunk.
   *
   * This is the only place in the ecosystem that catches on purpose. A value written out in full
   * was already evaluated in the caller's frame, so by the time it arrives here nothing about it
   * can throw and it passes straight through. A thunk is the opposite: it arrives unevaluated,
   * which is exactly what lets a payload that would have crashed the game be contained instead.
   * @param {*} candidate The value to report, or a function returning it.
   * @returns {{value: *, error: (Error|null)}} The built value, or the error that prevented it.
   */
  static resolve(candidate)
  {
    // not a thunk, so the caller already evaluated it and there is nothing left here to fail.
    if (Function.prototype.isPrototypeOf(candidate) === false)
    {
      return {
        value: candidate,
        error: null,
      };
    }

    try
    {
      return {
        value: candidate(),
        error: null,
      };
    }
    catch (error)
    {
      // a payload that throws while being built is itself an anomaly, and a more interesting one
      // than whatever was being reported. it travels back to be printed rather than discarded-
      // swallowing it here would trade a crash for a lie, which is the worse of the two.
      return {
        value: null,
        error,
      };
    }
  }

  /**
   * Decides what gets printed beside the stamped message.
   *
   * The ordinary answer is whatever the caller passed. When either half failed to build, the answer
   * becomes a report of that failure instead, so the console shows the original warning, which half
   * of it is missing, and the error that explains why.
   * @param {{value: *, error: (Error|null)}} resolvedMessage The outcome of building the message.
   * @param {{value: *, error: (Error|null)}} resolvedDetails The outcome of building the details.
   * @returns {*} The details to print, or a description of what stopped them being built.
   */
  static payload(resolvedMessage, resolvedDetails)
  {
    const messageError = resolvedMessage.error;
    const detailsError = resolvedDetails.error;

    // nothing threw, so the caller's own details are what belongs next to the message.
    if (messageError === null && detailsError === null) return resolvedDetails.value;

    // something threw. name both halves rather than only the broken one, because "the details are
    // absent" and "the details were never asked for" look identical otherwise.
    return {
      diagnosticsPayloadFailed: true,
      messageError,
      detailsError,
      details: resolvedDetails.value,
    };
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