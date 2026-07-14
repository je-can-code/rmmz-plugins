//region install-abs-tools-host-globals
/**
 * Flips the bare `__PLUGIN_NAME__`/`__PLUGIN_VERSION__` globals to J-ABS-Tools's own identity. Call this
 * right before importing abs/ext/tools/_metadata/initialization.js, after the shared fixture's
 * `setPluginContextToJAbs` and the J-ABS initialization.js import it guards (ext/tools requires both
 * J-Base and J-ABS at minimum versions).
 *
 * This is J-ABS-Tools's own isolated fixture, not shared with any other extension- each J-ABS
 * extension is its own independent plugin and gets its own fixture file.
 *
 * @param {object} [sandbox] Defaults to `globalThis`.
 */
export function setPluginContextToJabsTools(sandbox = globalThis)
{
  sandbox.__PLUGIN_NAME__ = 'J-ABS-Tools';
  sandbox.__PLUGIN_VERSION__ = '1.0.3';
}
//endregion install-abs-tools-host-globals
