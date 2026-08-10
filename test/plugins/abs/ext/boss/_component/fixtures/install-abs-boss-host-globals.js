//region plugins/abs/ext/boss/_component/fixtures/install-abs-boss-host-globals.js
/**
 * Flips the bare `__PLUGIN_NAME__`/`__PLUGIN_VERSION__` globals to J-ABS-Boss's own identity. Call this
 * right before importing abs/ext/boss/_metadata/initialization.js, after the shared fixture's
 * `setPluginContextToJAbs` and the J-ABS initialization.js import it guards (ext/boss requires both
 * J-Base and J-ABS at minimum versions).
 *
 * This is J-ABS-Boss's own isolated fixture, not shared with any other extension- each J-ABS extension
 * is its own independent plugin and gets its own fixture file.
 *
 * @param {object} [sandbox] Defaults to `globalThis`.
 */
export function setPluginContextToJabsBoss(sandbox = globalThis)
{
  sandbox.__PLUGIN_NAME__ = 'J-ABS-Boss';
  sandbox.__PLUGIN_VERSION__ = '1.0.0';
}
//endregion plugins/abs/ext/boss/_component/fixtures/install-abs-boss-host-globals.js