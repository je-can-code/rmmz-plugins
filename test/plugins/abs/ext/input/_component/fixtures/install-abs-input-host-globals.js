//region plugins/abs/ext/input/_component/fixtures/install-abs-input-host-globals.js
/**
 * Flips the bare `__PLUGIN_NAME__`/`__PLUGIN_VERSION__` globals to J-ABS-InputManager's own identity. Call
 * this right before importing abs/ext/input/_metadata/initialization.js, after the shared fixture's
 * `setPluginContextToJAbs` and the J-ABS initialization.js import it guards (ext/input requires both
 * J-Base and J-ABS at minimum versions).
 *
 * This is J-ABS-InputManager's own isolated fixture, not shared with any other extension- each J-ABS
 * extension is its own independent plugin and gets its own fixture file.
 *
 * @param {object} [sandbox] Defaults to `globalThis`.
 */
export function setPluginContextToJabsInput(sandbox = globalThis)
{
  sandbox.__PLUGIN_NAME__ = 'J-ABS-InputManager';
  sandbox.__PLUGIN_VERSION__ = '2.3.0';
}
//endregion plugins/abs/ext/input/_component/fixtures/install-abs-input-host-globals.js
