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
//endregion install-diagnostics-global
