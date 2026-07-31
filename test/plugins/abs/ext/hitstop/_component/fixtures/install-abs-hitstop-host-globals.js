//region plugins/abs/ext/hitstop/_component/fixtures/install-abs-hitstop-host-globals.js
/**
 * Flips the bare `__PLUGIN_NAME__`/`__PLUGIN_VERSION__` globals to J-ABS-Hitstop's own identity. Call
 * this right before importing abs/ext/hitstop/_metadata/initialization.js, after the shared fixture's
 * `setPluginContextToJAbs` and the J-ABS initialization.js import it guards (ext/hitstop requires both
 * J-Base and J-ABS at minimum versions).
 *
 * This is J-ABS-Hitstop's own isolated fixture, not shared with any other extension- each J-ABS
 * extension is its own independent plugin and gets its own fixture file.
 *
 * @param {object} [sandbox] Defaults to `globalThis`.
 */
export function setPluginContextToJabsHitstop(sandbox = globalThis)
{
  sandbox.__PLUGIN_NAME__ = 'J-ABS-Hitstop';
  sandbox.__PLUGIN_VERSION__ = '1.0.3';
}
//endregion plugins/abs/ext/hitstop/_component/fixtures/install-abs-hitstop-host-globals.js
