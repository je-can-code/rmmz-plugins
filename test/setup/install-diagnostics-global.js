//region install-diagnostics-global
import Diagnostics from '../../src/plugins/_base/core/core/Diagnostics.js';

/**
 * Installs {@link Diagnostics} onto the realm before any test file evaluates.
 *
 * Every ship in this repo reports anomalies through this class, so it is reachable from roughly
 * forty source files spread across every plugin family. In a real game that is fine - J-Base loads
 * first and hoists it - but a direct-import test evaluates one source file against a realm that
 * only holds what its fixture chose to install, and a warning path that has nothing to do with the
 * behavior under test would throw `ReferenceError` instead.
 *
 * Installing it here rather than in each family's `install-*-host-globals.js` is deliberate. This
 * is not a collaborator any test is examining - it is the same kind of ambient infrastructure as
 * `console` itself, and asking sixty fixtures to each remember it would guarantee that the next new
 * one forgets.
 *
 * The **real** class goes in rather than a stub, because it is a thin pass-through: a test that
 * spies on `console.warn` still sees its call, and sees the same prefixed string the shipped build
 * would have written. A stub would silently decouple those assertions from the real format.
 */
globalThis.Diagnostics ??= Diagnostics;

/**
 * Seeds the ship-name identifier every `Diagnostics` call passes.
 *
 * `__PLUGIN_NAME__` is not a runtime value in a shipped plugin - Vite's `define` substitutes it for
 * a string literal at build time, per ship, out of that ship's own `meta.js`. A direct-import test
 * has no build step, so the identifier is a bare global that has to exist before any source file
 * runs, or a warning path throws `ReferenceError` on an identifier that never survives to runtime.
 *
 * A family fixture that sets its own ship still wins, because they assign rather than default. The
 * fallback is `J-Base` because the files reached without any family fixture are J-Base's own.
 */
globalThis.__PLUGIN_NAME__ ??= 'J-Base';
//endregion install-diagnostics-global
