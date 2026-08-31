//region plugins/abs/ext/time/_component/fixtures/install-abs-time-host-globals.js
/**
 * Flips the bare `__PLUGIN_NAME__`/`__PLUGIN_VERSION__` globals to J-ABS-Time's own identity. Call
 * this right before importing abs/ext/time/_metadata/initialization.js, after the shared fixture's
 * `setPluginContextToJAbs` and the J-ABS initialization.js import it guards (ext/time requires
 * J-Base, J-ABS, and J-TIME at minimum versions).
 *
 * This is J-ABS-Time's own isolated fixture, not shared with any other extension- each J-ABS
 * extension is its own independent plugin and gets its own fixture file.
 *
 * @param {object} [sandbox] Defaults to `globalThis`.
 */
export function setPluginContextToJabsTime(sandbox = globalThis)
{
  sandbox.__PLUGIN_NAME__ = 'J-ABS-Time';
  sandbox.__PLUGIN_VERSION__ = '1.0.0';
}

/**
 * Installs a stand-in for the J-TIME namespace at a version that satisfies J-ABS-Time's floor,
 * without booting the whole J-TIME plugin. Only the version accessor is consulted at init time.
 *
 * @param {object} [sandbox] Defaults to `globalThis`.
 */
export function installJTimeVersionStub(sandbox = globalThis)
{
  sandbox.J.TIME = {
    Metadata: {
      version: {
        version: () => '1.2.0',
      },
    },
  };
}
//endregion plugins/abs/ext/time/_component/fixtures/install-abs-time-host-globals.js