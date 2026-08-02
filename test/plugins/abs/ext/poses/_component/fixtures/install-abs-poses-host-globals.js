//region plugins/abs/ext/poses/_component/fixtures/install-abs-poses-host-globals.js
/**
 * Flips the bare `__PLUGIN_NAME__`/`__PLUGIN_VERSION__` globals to J-ABS-Poses's own identity. Call
 * this right before importing abs/ext/poses/_metadata/initialization.js, after the shared fixture's
 * `setPluginContextToJAbs` and the J-ABS initialization.js import it guards (ext/poses requires both
 * J-Base and J-ABS at minimum versions).
 *
 * This is J-ABS-Poses's own isolated fixture, not shared with any other extension- each J-ABS
 * extension is its own independent plugin and gets its own fixture file.
 *
 * @param {object} [sandbox] Defaults to `globalThis`.
 */
export function setPluginContextToJabsPoses(sandbox = globalThis)
{
  sandbox.__PLUGIN_NAME__ = 'J-ABS-Poses';
  sandbox.__PLUGIN_VERSION__ = '1.0.5';
}
//endregion plugins/abs/ext/poses/_component/fixtures/install-abs-poses-host-globals.js
