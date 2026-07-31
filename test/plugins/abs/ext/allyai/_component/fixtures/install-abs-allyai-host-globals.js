//region plugins/abs/ext/allyai/_component/fixtures/install-abs-allyai-host-globals.js
/**
 * Flips the bare `__PLUGIN_NAME__`/`__PLUGIN_VERSION__` globals to J-ABS-AllyAI's own identity. Call
 * this right before importing abs/ext/allyai/_metadata/initialization.js, after the shared fixture's
 * `setPluginContextToJAbs` and the J-ABS initialization.js import it guards (ext/allyai requires both
 * J-Base and J-ABS at minimum versions).
 *
 * This is J-ABS-AllyAI's own isolated fixture, not shared with any other extension- each J-ABS
 * extension is its own independent plugin and gets its own fixture file.
 *
 * @param {object} [sandbox] Defaults to `globalThis`.
 */
export function setPluginContextToJabsAllyAi(sandbox = globalThis)
{
  sandbox.__PLUGIN_NAME__ = 'J-ABS-AllyAI';
  sandbox.__PLUGIN_VERSION__ = '3.0.1';
}
//endregion plugins/abs/ext/allyai/_component/fixtures/install-abs-allyai-host-globals.js
