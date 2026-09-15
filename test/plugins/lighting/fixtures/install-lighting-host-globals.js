//region install-lighting-host-globals
import JsonMapper from '../../../../src/plugins/_base/core/_utilities/JsonMapper.js';

/**
 * Installs everything J-Lighting's source expects the realm to already hold.
 *
 * In a shipped game the engine and J-Base are both loaded long before this plugin evaluates, so
 * `String.empty`, `Number.prototype.clamp`, `JsonMapper` and `Diagnostics` are simply there. A
 * direct-import test evaluates one source file against a realm holding only what its fixture
 * installed, so anything ambient has to be put back deliberately or an untouched code path throws
 * `ReferenceError` for reasons that have nothing to do with the behavior being examined.
 *
 * The real `JsonMapper` goes in rather than a stub, because tag parsing depends on exactly how it
 * coerces `250` into a number and leaves `#ffbb73` a string. A stub would let the parser tests agree
 * with an implementation that does not exist.
 */
export const installLightingHostGlobals = () =>
{
  // engine extensions to the built-in prototypes. `Array.empty` matters more than it looks: J-Base's
  // note readers hand it back for anything with an empty note, which is most of what a battler
  // carries, and without it here they return undefined and the caller throws on `.length`.
  String.empty ??= '';
  Array.empty ??= Object.freeze([]);
  Number.prototype.clamp ??= function(min, max)
  {
    return Math.min(Math.max(this, min), max);
  };

  // a J-Base global the tag parser reaches for by name.
  globalThis.JsonMapper ??= JsonMapper;

  // a light measured in tiles asks the map how wide one is, so there has to be a map to ask.
  globalThis.$gameMap ??= { tileWidth: () => 48 };

  // the build-time identifier Vite substitutes per ship; every diagnostic names its ship with it.
  globalThis.__PLUGIN_NAME__ ??= 'J-Lighting';

  // the namespace shell, holding the expressions the parser matches against. This mirrors what
  // `_metadata/initialization.js` writes, and is duplicated here rather than imported because that
  // file also constructs plugin metadata, which would demand a whole PluginManager.
  globalThis.J ??= {};
  globalThis.J.LIGHTING ??= {};
  globalThis.J.LIGHTING.RegExp ??= {};
  globalThis.J.LIGHTING.RegExp.Ambient ??= /<ambient:[ ]?(\[[\d.]+(?:,[ ]?[#\w.-]+)*])>/i;
  globalThis.J.LIGHTING.RegExp.Light ??= /<light:[ ]?(\[[\d.]+(?:,[ ]?[#\w.-]+)*])>/i;
};

/**
 * Installs a stand-in for the plugin metadata the parser reads its fallback values from.
 *
 * Tests that exercise defaults want to control them, and the real metadata would insist on loading
 * an external config file off disk.
 * @param {Object=} overrides Any default values this test wants to differ.
 */
export const installLightingMetadata = (overrides = {}) =>
{
  const lightDefaults = {
    radius: 5,
    color: '#FFFFFF',
    intensity: 0,
    effects: {
      flicker: { depth: 0.2, period: 40, chance: 0, variance: 0.18 },
      pulse: { depth: 0.45, period: 165, chance: 0, variance: 0.22 },
      glitch: { depth: 0.85, period: 55, chance: 0.28, variance: 0.12 },
    },
    ...overrides.lightDefaults,
  };

  const ambientDefaults = {
    color: '#000000',
    ...overrides.ambientDefaults,
  };

  globalThis.J.LIGHTING.Metadata = {
    name: 'J-Lighting',
    lightDefaults,
    ambientDefaults,
    tuningFor: effect => lightDefaults.effects[effect] ?? { depth: 0, period: 1, chance: 0 },
  };
};

/**
 * Installs a `Diagnostics` that records rather than prints.
 *
 * The parser reports malformed tags through it, and a test asserting that a bad tag was *rejected*
 * should also be able to see that somebody was told why.
 * @returns {{warn: Array, error: Array}} The recorded calls.
 */
export const installRecordingDiagnostics = () =>
{
  const recorded = { warn: [], error: [] };

  globalThis.Diagnostics = {
    warn: (plugin, message, details) => recorded.warn.push({ plugin, message, details }),
    error: (plugin, message, details) => recorded.error.push({ plugin, message, details }),
  };

  return recorded;
};