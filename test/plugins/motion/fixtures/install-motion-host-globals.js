//region install-motion-host-globals
import JsonMapper from '../../../../src/plugins/_base/core/_utilities/JsonMapper.js';

/**
 * Installs everything J-Motion's source expects the realm to already hold.
 *
 * In a shipped game the engine and J-Base are both loaded long before this plugin evaluates, so
 * `String.empty`, `Number.prototype.clamp` and `JsonMapper` are simply there. A direct-import test
 * evaluates one source file against a realm holding only what its fixture installed, so anything
 * ambient has to be put back deliberately or an untouched code path throws `ReferenceError` for
 * reasons that have nothing to do with the behavior being examined.
 *
 * The real `JsonMapper` goes in rather than a stub, because tag parsing depends on exactly how it
 * coerces `0.08` into a number and leaves `#ffa0a0` a string. A stub would let the parser tests
 * agree with an implementation that does not exist.
 */
export const installMotionHostGlobals = () =>
{
  // engine extensions to the built-in prototypes.
  String.empty ??= '';
  Array.empty ??= Object.freeze([]);
  Number.prototype.clamp ??= function(min, max)
  {
    return Math.min(Math.max(this, min), max);
  };
  Math.randomInt ??= max => Math.floor(max * Math.random());

  // a J-Base global the tag parser reaches for by name.
  globalThis.JsonMapper ??= JsonMapper;

  // the namespace shell, holding the one expression the parser matches against. This mirrors what
  // `_metadata/initialization.js` writes, and is duplicated here rather than imported because that
  // file also constructs plugin metadata, which would demand a whole PluginManager.
  globalThis.J ??= {};
  globalThis.J.MOTION ??= {};
  globalThis.J.MOTION.RegExp ??= {};
  globalThis.J.MOTION.RegExp.Motion ??= /<motion:[ ]?(\[\w+(?:,[ ]?[#\w.-]+)*])>/i;
};

/**
 * Installs a stand-in for the plugin metadata that the composer reads default parameters from.
 *
 * Tests that exercise defaults want to control them, and the real metadata would insist on loading
 * an external config file off disk.
 * @param {Object<string, Object>} defaultsByType The defaults each motion type should report.
 */
export const installMotionMetadata = (defaultsByType = {}) =>
{
  globalThis.J.MOTION.Metadata = {
    name: 'J-Motion',
    defaultsForMotionType: motionType => defaultsByType[motionType] ?? {},
  };
};
//endregion install-motion-host-globals