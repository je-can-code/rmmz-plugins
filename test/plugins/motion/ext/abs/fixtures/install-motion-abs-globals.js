//region install-motion-abs-globals
import {
  installMotionHostGlobals,
  installMotionMetadata,
} from '../../../fixtures/install-motion-host-globals.js';
import MotionChannels from '../../../../../../src/plugins/motion/core/core/MotionChannels.js';
import MotionEasing from '../../../../../../src/plugins/motion/core/core/MotionEasing.js';
import MotionTypeRegistry from '../../../../../../src/plugins/motion/core/core/MotionTypeRegistry.js';
import MotionTagParser from '../../../../../../src/plugins/motion/core/core/MotionTagParser.js';
import MotionEffect from '../../../../../../src/plugins/motion/core/models/MotionEffect.js';
import MotionDeclaration from '../../../../../../src/plugins/motion/core/models/MotionDeclaration.js';
import MotionComposition from '../../../../../../src/plugins/motion/core/models/MotionComposition.js';
import CharacterMotionComposer from '../../../../../../src/plugins/motion/core/managers/CharacterMotionComposer.js';
import RPGManager from '../../../../../../src/plugins/_base/core/managers/RPGManager.js';

/**
 * Installs everything J-Motion-ABS expects a loaded game to already hold.
 *
 * The real J-Motion classes go in rather than stubs. They are a different ship, so in a running
 * game they arrive as hoisted globals from J-Motion's own bundle and this extension reaches them by
 * bare name — which is exactly what is reproduced here. Stubbing them would mean testing this
 * extension against a composer that behaves however the fixture felt like, and the whole point of
 * the extension is that it hands work to the real one.
 */
export const installMotionAbsGlobals = () =>
{
  installMotionHostGlobals();
  installMotionMetadata();

  // J-Motion's hoisted bundle globals.
  globalThis.MotionChannels ??= MotionChannels;
  globalThis.MotionEasing ??= MotionEasing;
  globalThis.MotionTypeRegistry ??= MotionTypeRegistry;
  globalThis.MotionTagParser ??= MotionTagParser;
  globalThis.MotionEffect ??= MotionEffect;
  globalThis.MotionDeclaration ??= MotionDeclaration;
  globalThis.MotionComposition ??= MotionComposition;
  globalThis.CharacterMotionComposer ??= CharacterMotionComposer;

  // a J-Base hoisted global, used to read the death notetags.
  globalThis.RPGManager ??= RPGManager;

  // this extension's own namespace, mirroring what its initialization.js writes. Duplicated here
  // rather than imported because that file also constructs plugin metadata, which would demand a
  // whole PluginManager and an external config file on disk.
  globalThis.J.MOTION.EXT ??= {};
  globalThis.J.MOTION.EXT.ABS ??= {};
  globalThis.J.MOTION.EXT.ABS.RegExp ??= {
    DeathMotion: /<deathMotion:[ ]?(\w+)>/i,
    NoDeathMotion: /<noDeathMotion>/i,
  };

  installDeathMetadata();
  installJabsStubs();
};

/**
 * Installs a stand-in for this extension's plugin metadata.
 *
 * The real one loads an external config off the game's disk, which a test has no business needing.
 * @param {Object=} overrides Anything a particular test wants to differ.
 */
export const installDeathMetadata = (overrides = {}) =>
{
  const durations = { swift: 30, moderate: 60, slow: 120, ...overrides.durations };

  globalThis.J.MOTION.EXT.ABS.Metadata = {
    name: 'J-Motion-ABS',
    defaultDeathStyle: overrides.defaultStyle ?? 'swift',
    deathDurations: durations,
    deathDurationFor(style)
    {
      const configured = durations[style];

      return configured === undefined
        ? durations[this.defaultDeathStyle]
        : configured;
    },
    isKnownDeathStyle: style => durations[style] !== undefined,
    lootExpiryWarnFrames: overrides.lootExpiryWarnFrames ?? 300,
    lootExpiryFadeFrames: overrides.lootExpiryFadeFrames ?? 120,
    lootExpiryFlicker: {
      min: 0.2,
      max: 1.0,
      interval: 8,
      ...overrides.lootExpiryFlicker,
    },
  };
};

/**
 * The battlers the stubbed AI manager can find, keyed by uuid.
 * @type {Map<string, Object>}
 */
const battlersByUuid = new Map();

/**
 * Installs the J-ABS surfaces this extension reaches for.
 */
const installJabsStubs = () =>
{
  globalThis.JABS_AiManager ??= {
    getBattlerByUuid: uuid => battlersByUuid.get(uuid),
  };
};

/**
 * Registers a battler so the stubbed AI manager can find it, the way a battler on the map would be.
 * @param {string} uuid The battler's uuid.
 * @param {Object} jabsBattler The JABS battler to hand back.
 */
export const registerMapBattler = (uuid, jabsBattler) =>
{
  battlersByUuid.set(uuid, jabsBattler);
};

/**
 * Forgets every registered battler, so one test's map does not leak into the next.
 */
export const clearMapBattlers = () =>
{
  battlersByUuid.clear();
};
//endregion install-motion-abs-globals