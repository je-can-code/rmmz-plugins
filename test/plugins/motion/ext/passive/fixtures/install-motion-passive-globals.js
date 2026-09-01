//region install-motion-passive-globals
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
import BattlerMotionCoordinator from '../../../../../../src/plugins/motion/ext/abs/managers/BattlerMotionCoordinator.js';

/**
 * Installs everything J-Motion-Passive expects a loaded game to already hold.
 *
 * The real J-Motion and J-Motion-ABS classes go in rather than stubs. Both are other ships, so in a
 * running game they arrive as hoisted globals from their own bundles and this extension reaches them
 * by bare name — which is what is reproduced here. It matters more than usual for this pack: the
 * whole plugin is a reconcile loop over the composer's declare-and-withdraw contract, and against a
 * stubbed composer the tests would agree with a contract that does not exist.
 */
export const installMotionPassiveGlobals = () =>
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

  // J-Motion-ABS's hoisted bundle global; this pack reaches a battler's character through it.
  globalThis.BattlerMotionCoordinator ??= BattlerMotionCoordinator;

  // this extension's own namespace, mirroring what its initialization.js writes. Duplicated here
  // rather than imported because that file also constructs plugin metadata, which would demand a
  // whole PluginManager and a version check against three other ships.
  globalThis.J.MOTION.EXT ??= {};
  globalThis.J.MOTION.EXT.PASSIVE ??= {};
  globalThis.J.MOTION.EXT.PASSIVE.Aliased ??= {};
  globalThis.J.MOTION.EXT.PASSIVE.Aliased.Game_Battler ??= new Map();
  globalThis.J.MOTION.EXT.PASSIVE.Aliased.JABS_AiManager ??= new Map();

  installJabsStubs();
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
    addOrUpdateBattler()
    {
      // the real one writes to a tracking map. tests that care register through the helper below,
      // so this exists only to be the original an alias wraps.
    },
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

/**
 * Builds a battler that carries passive states, shaped the way the coordinator reads one.
 * @param {string} uuid The battler's uuid.
 * @param {number[]} passiveStateIds The passive state ids it is carrying, stacks included.
 * @param {Object<number, Object>} statesById The state rows those ids resolve to.
 * @returns {Object} The stand-in battler.
 */
export const aBattler = (uuid, passiveStateIds, statesById) =>
{
  return {
    getUuid: () => uuid,
    getPassiveStateIds: () => passiveStateIds,
    state: stateId => statesById[stateId],
  };
};

/**
 * Builds a state row carrying whatever note text a test wants read.
 * @param {number} id The state's id.
 * @param {string} note The note to parse motions out of.
 * @returns {Object} The stand-in state row.
 */
export const aState = (id, note) =>
{
  return {
    id,
    note,
  };
};
//endregion install-motion-passive-globals