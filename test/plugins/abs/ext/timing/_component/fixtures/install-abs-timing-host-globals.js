//region plugins/abs/ext/timing/_component/fixtures/install-abs-timing-host-globals.js
/**
 * Flips the bare `__PLUGIN_NAME__`/`__PLUGIN_VERSION__` globals to J-ABS-Timing's own identity. Call
 * this right before importing abs/ext/timing/_metadata/initialization.js, after the shared fixture's
 * `setPluginContextToJAbs` and the J-ABS initialization.js import it guards (ext/timing requires both
 * J-Base and J-ABS at minimum versions).
 *
 * This is J-ABS-Timing's own isolated fixture, not shared with any other extension- each J-ABS
 * extension is its own independent plugin and gets its own fixture file.
 *
 * @param {object} [sandbox] Defaults to `globalThis`.
 */
export function setPluginContextToJabsTiming(sandbox = globalThis)
{
  sandbox.__PLUGIN_NAME__ = 'J-ABS-Timing';
  sandbox.__PLUGIN_VERSION__ = '1.0.2';
}
//endregion plugins/abs/ext/timing/_component/fixtures/install-abs-timing-host-globals.js
