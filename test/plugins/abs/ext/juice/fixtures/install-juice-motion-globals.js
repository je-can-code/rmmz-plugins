//region install-juice-motion-globals
import MotionChannels from '../../../../../../src/plugins/motion/core/core/MotionChannels.js';
import MotionEasing from '../../../../../../src/plugins/motion/core/core/MotionEasing.js';
import MotionTypeRegistry from '../../../../../../src/plugins/motion/core/core/MotionTypeRegistry.js';
import MotionEffect from '../../../../../../src/plugins/motion/core/models/MotionEffect.js';
import MotionDeclaration from '../../../../../../src/plugins/motion/core/models/MotionDeclaration.js';
import MotionComposition from '../../../../../../src/plugins/motion/core/models/MotionComposition.js';
import CharacterMotionComposer from '../../../../../../src/plugins/motion/core/managers/CharacterMotionComposer.js';

/**
 * Installs everything J-ABS-Juice's motion reactions expect a loaded game to already hold.
 *
 * The real J-Motion classes go in rather than stubs. They ship in a different bundle, so in a
 * running game they arrive as hoisted globals and juice reaches them by bare name — which is exactly
 * what is reproduced here. Stubbing the composer would mean testing juice against something that
 * behaves however the fixture felt like, when the entire point of the rewiring is that juice hands
 * the animating to the real one.
 *
 * This is J-ABS-Juice's own fixture and is deliberately not shared with any other pack, including
 * J-Motion-ABS, which installs a near-identical set for its own reasons. Two packs sharing one
 * fixture is how a change made for one of them silently retunes the other's tests.
 */
export const installJuiceMotionGlobals = () =>
{
  // engine extensions to the built-in prototypes, which a shipped game has long before this loads.
  String.empty ??= '';
  Array.empty ??= Object.freeze([]);
  Number.prototype.clamp ??= function(min, max)
  {
    return Math.min(Math.max(this, min), max);
  };
  Math.randomInt ??= max => Math.floor(max * Math.random());

  // J-Motion's hoisted bundle globals.
  globalThis.MotionChannels ??= MotionChannels;
  globalThis.MotionEasing ??= MotionEasing;
  globalThis.MotionTypeRegistry ??= MotionTypeRegistry;
  globalThis.MotionEffect ??= MotionEffect;
  globalThis.MotionDeclaration ??= MotionDeclaration;
  globalThis.MotionComposition ??= MotionComposition;
  globalThis.CharacterMotionComposer ??= CharacterMotionComposer;

  // the composer asks J-Motion's metadata for a type's configured defaults on every build. Nothing
  // in juice is configured that way — combat passes every parameter explicitly — so an empty answer
  // is both the honest stand-in and what a real game would return.
  globalThis.J ??= {};
  globalThis.J.MOTION ??= {};
  globalThis.J.MOTION.Metadata ??= {
    name: 'J-Motion',
    defaultsForMotionType: () => ({}),
  };
};

/**
 * Installs a stand-in for this plugin's own metadata, holding the tunables juice reads while
 * deciding how hard a reaction should be.
 *
 * The real one parses J-ABS's external configuration off the game's disk, which a unit test has no
 * business needing.
 * @param {Object=} overrides Anything a particular test wants to differ.
 */
export const installJuiceMetadata = (overrides = {}) =>
{
  globalThis.J ??= {};
  globalThis.J.ABS ??= {};
  globalThis.J.ABS.EXT ??= {};
  globalThis.J.ABS.EXT.JUICE ??= {};
  globalThis.J.ABS.EXT.JUICE.Metadata = {
    name: 'J-ABS-Juice',
    targetPhysicalSquishIntensity: 0.25,
    targetMagicalSquishIntensity: 0.15,
    targetSquishFrames: 8,
    healingRecipientSquishScale: 1.1,
    flurryDecayPercent: 50,
    dodgeSquishIntensity: 0.2,
    dodgeSquishFrames: 6,
    casterStrikeTiltFrames: 5,
    casterStrikeTiltRadians: 0.3,
    supportCasterPulseIntensity: 0.4,
    supportCasterPulseFrames: 12,
    unarmedStrikeSquishIntensity: 0.18,
    unarmedStrikeSquishFrames: 8,
    weaponSwingFrames: 10,
    weaponSwingPeakRadians: 0.9,
    castingPulseAmplitude: 0.35,
    ...overrides,
  };
};

/**
 * Registers the four juice motion types on the real registry.
 *
 * Importing the registration module is what a running game does — it is a side-effecting file the
 * ship's entry point pulls in — so a test that needs the composer to build a juice effect has to
 * pull it in the same way.
 */
export const installJuiceMotionTypes = async () =>
{
  await import('../../../../../../src/plugins/abs/ext/juice/core/registerJuiceMotionTypes.js');
};
//endregion install-juice-motion-globals