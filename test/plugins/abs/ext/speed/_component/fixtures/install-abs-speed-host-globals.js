//region plugins/abs/ext/speed/_component/fixtures/install-abs-speed-host-globals.js
/**
 * Flips the bare `__PLUGIN_NAME__`/`__PLUGIN_VERSION__` globals to J-ABS-SpeedBoosts's own identity. Call
 * this right before importing abs/ext/speed/_metadata/initialization.js, after the shared fixture's
 * `setPluginContextToJAbs` and the J-ABS initialization.js import it guards (ext/speed requires both
 * J-Base and J-ABS at minimum versions).
 *
 * This is J-ABS-SpeedBoosts's own isolated fixture, not shared with any other extension- each J-ABS
 * extension is its own independent plugin and gets its own fixture file.
 *
 * @param {object} [sandbox] Defaults to `globalThis`.
 */
export function setPluginContextToJabsSpeed(sandbox = globalThis)
{
  sandbox.__PLUGIN_NAME__ = 'J-ABS-SpeedBoosts';
  sandbox.__PLUGIN_VERSION__ = '1.1.0';
}
//endregion plugins/abs/ext/speed/_component/fixtures/install-abs-speed-host-globals.js
