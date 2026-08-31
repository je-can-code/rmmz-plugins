//region annotations
/*:
 * @target MZ
 * @plugindesc
 * [v@@PLUGIN_VERSION@@ @@PLUGIN_DESC_TAG@@] Combat-driven motion: state effects and death animations.
 * @author JE
 * @url https://github.com/je-can-code/rmmz-plugins
 * @base J-Base
 * @base J-ABS
 * @base J-Motion
 * @orderAfter J-Base
 * @orderAfter J-ABS
 * @orderAfter J-Motion
 * @help
 * ============================================================================
 * OVERVIEW
 * J-Motion gives map characters motion. This extension lets combat drive it.
 *
 * Two things live here, and both exist because a battler and a character are
 * different objects that only J-ABS holds together at the same time:
 *
 * - STATES can declare motions. A bleeding creature pulses, an elite swells.
 * - DEATHS are animated. Enemies collapse instead of vanishing mid-frame.
 *
 * Integrates with others of mine plugins:
 * - J-Base; to be honest this is just required for all my plugins.
 * - J-ABS; this extension is meaningless without combat on the map.
 * - J-Motion; this extension is meaningless without motion.
 *
 * ----------------------------------------------------------------------------
 * DETAILS:
 * MOTIONS ON STATES
 * Any state can carry J-Motion's ordinary <motion:...> tag, and whatever it
 * declares runs for exactly as long as the state is on the battler. It is the
 * same tag, read by the same parser, as the one an event page uses- so nothing
 * new has to be learned to use it.
 *
 * A state's motions are filed separately from an event page's, so a state
 * expiring never disturbs the ambient motion a creature was authored with.
 * A breathing enemy that catches fire is breathing AND flickering, and stops
 * flickering alone when the fire goes out.
 *
 * DEATH ANIMATIONS
 * Every enemy gets one, without being asked. Before this plugin an enemy simply
 * stopped rendering on the frame it died; now it collapses, and the corpse is
 * held on the map for exactly as long as that takes.
 *
 * Rewards and loot still drop the moment the enemy is defeated, so gold and
 * items appear while the body is still coming apart.
 *
 * ============================================================================
 * DEATH MOTION:
 * There are three styles, and they are speeds as much as shapes:
 *
 *   swift     a quick vertical squash. Trash mobs, gone in half a second.
 *   moderate  a topple, falling and fading. Something worth having fought.
 *   slow      a long shimmering sink. Something whose death is a moment.
 *
 * TAG FORMAT:
 *  <deathMotion:STYLE>
 *    Where STYLE is one of the three above.
 *
 *  <noDeathMotion>
 *    Suppresses the animation entirely, and the delay that comes with it.
 *
 * TAG USAGE:
 * - Enemies
 * - States
 *
 * WHICH ONE WINS:
 * A battler's states are consulted first, and among several the one with the
 * highest state PRIORITY as set in the editor wins. Failing that, the enemy's
 * own note. Failing that, the configured default.
 *
 * That order is what makes affixes work without authoring anything twice-
 * affixes are states, so an elite version of an ordinary creature dies harder
 * purely because of what is stuck to it.
 *
 * <noDeathMotion> outranks all of it, from either a state or the enemy. A boss
 * that runs its own scripted collapse does not want a generic one underneath,
 * and definitely does not want its corpse held open for the extra frames.
 *
 * TAG EXAMPLES:
 *  <deathMotion:slow>
 * This enemy takes its time dying.
 *
 *  <noDeathMotion>
 * This enemy leaves the map the instant it is defeated, as it always did.
 *
 * ============================================================================
 * CONFIGURATION:
 * Death pacing lives in `data/config.motion.json`, under `death`:
 *
 *   "death": {
 *     "defaultStyle": "swift",
 *     "durations": { "swift": 30, "moderate": 60, "slow": 120 }
 *   }
 *
 * Durations are in frames, at 60 frames per second. Changing them retunes how
 * every death in the game feels, without rebuilding anything.
 * ============================================================================
 * CHANGELOG:
 * - 1.0.0
 *    The initial release.
 * ============================================================================
 */
//endregion annotations