//region plugins/motion/_component/initialization-version-gate.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  installMotionComponentGlobals,
  setMotionConfig,
  setPluginContextToJBase,
  setPluginContextToJMotion,
} from './fixtures/install-motion-component-globals.js';

/**
 * The J umbrella as J-Base built it, captured once and handed back before every test.
 *
 * J-Base's bootstrap can only run once per realm: it finishes with
 * `Object.defineProperty(Array, 'empty', { configurable: false })`, and evaluating it a second time
 * dies on "Cannot redefine property". So it is built a single time, and any test that lowers the
 * recorded version or deletes the umbrella outright has to undo that here rather than by
 * re-importing.
 * @type {Object}
 */
let realJ;

describe('J-Motion initialization version gate (direct src import)', () =>
{
  beforeAll(async () =>
  {
    installMotionComponentGlobals();
    setMotionConfig({});

    setPluginContextToJBase();
    await import('../../../../src/plugins/_base/core/_metadata/initialization.js');

    realJ = globalThis.J;
  });

  beforeEach(async () =>
  {
    // drop only the motion half of the module graph; J-Base's evaluated modules stay put.
    vi.resetModules();

    // undo whatever the previous case did to the shared umbrella.
    globalThis.J = realJ;
    globalThis.J.BASE.Metadata.Version = '3.5.0';
    delete globalThis.J.MOTION;

    // PluginMetadata refuses a duplicate plugin name on a private static registry, so a fresh copy
    // of the class is what lets this ship's metadata be constructed more than once in one file.
    const { default: FreshPluginMetadata } =
      await import('../../../../src/plugins/_base/core/models/PluginMetadata.js');
    globalThis.PluginMetadata = FreshPluginMetadata;

    setPluginContextToJMotion();
  });

  it('loads when J-Base is exactly the required version', async () =>
  {
    // Arrange
    globalThis.J.BASE.Metadata.Version = '3.5.0';

    // Act
    await import('../../../../src/plugins/motion/core/_metadata/initialization.js');

    // Assert
    expect(globalThis.J.MOTION.Metadata.name).toBe('J-Motion');
  });

  it('loads when J-Base is newer than required', async () =>
  {
    // Arrange
    globalThis.J.BASE.Metadata.Version = '9.9.9';

    // Act
    await import('../../../../src/plugins/motion/core/_metadata/initialization.js');

    // Assert
    expect(globalThis.J.MOTION.Metadata.name).toBe('J-Motion');
  });

  it('refuses to load against a J-Base too old to have what it needs', async () =>
  {
    // Arrange- lowering the version is indistinguishable from a player running an out-of-date
    // J-Base, which is the situation this gate exists to report.
    globalThis.J.BASE.Metadata.Version = '1.0.0';

    // Act & Assert
    const importing = import('../../../../src/plugins/motion/core/_metadata/initialization.js');
    await expect(importing).rejects.toThrow('Either missing J-Base or has a lower version than the required: 3.5.0');
  });

  it('refuses to load when J-Base is not there at all', async () =>
  {
    // Arrange- a wrong plugin order in the editor looks exactly like this: this plugin creates the
    // umbrella fresh and empty, so there is no BASE on it to read a version from.
    delete globalThis.J;

    // Act & Assert
    const importing = import('../../../../src/plugins/motion/core/_metadata/initialization.js');
    await expect(importing).rejects.toThrow(TypeError);
  });

  it('reuses the umbrella J-Base already installed rather than replacing it', async () =>
  {
    // Arrange
    const umbrellaBeforeImport = globalThis.J;

    // Act
    await import('../../../../src/plugins/motion/core/_metadata/initialization.js');

    // Assert
    expect(globalThis.J).toBe(umbrellaBeforeImport);
    expect(globalThis.J.BASE).toBeDefined();
  });
});
//endregion plugins/motion/_component/initialization-version-gate.test.js