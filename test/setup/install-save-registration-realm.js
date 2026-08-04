//region install-save-registration-realm
import { vi } from 'vitest';

/**
 * Boots the smallest realm a `register*SaveRoutes.js` or `register*SaveCodecs.js` module can execute
 * in.
 *
 * Those modules are pure side effect: they have no exports, and importing one *is* the behavior under
 * test. Everything they touch - `SaveSectionRouter`, `SerializableRegistry`, and whichever engine
 * class hosts the plugin's slice - is read as a hoisted global, because a registration module lives in
 * its own plugin's tree and may never import across a ship boundary. So the realm has to exist before
 * the import rather than being handed in as arguments.
 *
 * Both registry classes carry their state on static fields, which means a second import in the same
 * file would observe whatever the first one registered. `vi.resetModules` ahead of the dynamic imports
 * is what makes each call hand back genuinely empty ones, and that is what lets a single test file
 * import the same module twice - once with the save extension present and once without - to reach both
 * arms of the `if (J.BASE.EXT.SAVE)` check every one of these modules ends with.
 * @param {{
 *   saveExtensionInstalled?: boolean,
 *   hosts?: Function[],
 *   globals?: Object<string, *>,
 *   namespaces?: Object<string, *>
 * }=} options How the realm should be shaped.
 * @returns {Promise<{ SaveSectionRouter: Function, SerializableRegistry: Function }>} The fresh
 * registries the module under test will have written to.
 */
export const installSaveRegistrationRealm = async (options = {}) =>
{
  const {
    saveExtensionInstalled = true,
    hosts = [],
    globals = {},
    namespaces = {},
  } = options;

  // the registries keep their state statically, so a fresh module graph is the only real reset.
  vi.resetModules();

  // several of these modules read `String.empty` transitively through the router; RMMZ's core adds it
  // to the String constructor, and nothing in a node realm does.
  Object.defineProperty(String, 'empty', {
    enumerable: true,
    configurable: true,
    get: () => '',
  });

  const { default: SerializableRegistry } = await import(
    '../../src/plugins/_base/core/core/SerializableRegistry.js');

  const { default: SaveSectionRouter } = await import(
    '../../src/plugins/_base/ext/save/core/SaveSectionRouter.js');

  globalThis.SerializableRegistry = SerializableRegistry;
  globalThis.SaveSectionRouter = SaveSectionRouter;

  // the namespace shell always exists; only the SAVE extension is optional, and its absence is the
  // supported configuration where a plugin's state rides inline on its host instead of a section file.
  globalThis.J = { BASE: { EXT: {} } };

  if (saveExtensionInstalled)
  {
    globalThis.J.BASE.EXT.SAVE = { Metadata: { name: 'J-Base-Save' } };
  }

  // a transient factory frequently rebuilds itself from its own plugin's metadata rather than from a
  // remembered number, so the owning namespace has to be on `J` before the module runs.
  Object.assign(globalThis.J, namespaces);

  // a codec module calls `SerializableRegistry.extend`, which throws unless the owning plugin has
  // already registered the host. Registering here reproduces that load order rather than dodging it.
  hosts.forEach(host =>
  {
    globalThis[host.name] = host;

    SerializableRegistry.register(host);
  });

  // anything else the module reaches for by name at import time - a timer class, a helper - goes up
  // verbatim, since a registration module cannot import them either.
  Object.entries(globals)
    .forEach(([ name, value ]) =>
    {
      globalThis[name] = value;
    });

  return {
    SaveSectionRouter,
    SerializableRegistry,
  };
};
//endregion install-save-registration-realm