//region annotations
/*:
 * @target MZ
 * @plugindesc
 * [v@@PLUGIN_VERSION@@ @@PLUGIN_DESC_TAG@@] Combat-driven motion: state effects, deaths, arrivals and departures.
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
 * Three things live here, and all of them exist because a battler and a
 * character are different objects that only J-ABS holds together at once:
 *
 * - STATES can declare motions. A bleeding creature pulses, an elite swells.
 * - DEATHS are animated. Enemies collapse instead of vanishing mid-frame.
 * - ARRIVALS and DEPARTURES are animated. An enemy whose event page brings it
 *   onto the map or takes it off again turns into view or away from it.
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
 * ARRIVALS AND DEPARTURES
 * Every enemy gets these too, without being asked. An enemy event whose page
 * stops applying - a <timeRangePage> closing, a switch turning off, an Erase
 * Event command - used to vanish on the spot, and one whose page started
 * applying used to pop into existence. Now both are animated.
 *
 * The shape is a fold: the sprite turns on its vertical axis like a paper
 * cutout, edge-on when it is absent and facing the player when it is present.
 * A departing enemy turns away and is gone; an arriving one turns to face you.
 * No death looks like this, so an enemy leaving at the end of its hours is
 * never mistaken for one that was just killed with no loot to show for it.
 *
 * While it folds away, an enemy cannot be hit and does not act, and its page is
 * held back until the fold has finished. While it unfolds, it can be hit but
 * does not act until it is fully facing you.
 *
 * Both begin with the enemy's respawn animation, the very one it plays when it
 * returns after being defeated, chosen the same way: <respawnAnimation:ID> on
 * the event, then the enemy's note, then J-ABS's default. An id of 0 turns it
 * off here too, and the fold still plays without it.
 *
 * Any page change on a living enemy counts, including one that swaps it for a
 * different enemy on the event's next page: J-ABS builds that as a brand new
 * battler at full health anyway, so it folds out and the new one folds in.
 *
 * Enemies that respawn after being defeated, and enemies brought in by the
 * Spawn Enemy command, unfold into view too, beneath whatever animation they
 * already play - so every way an enemy appears looks the same.
 *
 * Enemies already on a map when you arrive there do not unfold; that is a map
 * loading, not an entrance. Enemies that are dying leave through their death
 * animation instead.
 *
 * Both motions are also ordinary J-Motion types, `fold` and `unfold`, taking a
 * single DURATION parameter, and can be declared anywhere a motion can.
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
 *
 * ----------------------------------------------------------------------------
 * Loot expiry pacing lives in the same file, under `loot`:
 *
 *   "loot": {
 *     "expiryWarnFrames": 300,
 *     "expiryFadeFrames": 120,
 *     "flicker": { "min": 0.2, "max": 1.0, "interval": 8 }
 *   }
 *
 * A loot drop that is about to time out blinks for its last `expiryWarnFrames`,
 * then additionally dissolves over its last `expiryFadeFrames`, reaching
 * invisible on the frame it would have vanished anyway. The fade window sits
 * inside the warning one, so the closing stretch both blinks and dims.
 *
 * The blink comes first on purpose. A slow dim is something the eye adapts to
 * rather than notices, and it makes the drop hardest to see during exactly the
 * window it most needs finding. A blink returns to full opacity between beats
 * while being impossible to miss.
 *
 * `flicker` is the shape of that blink: the opacity range it swings between and
 * how many frames pass between re-rolls. A lower `min` reads as a harder blink.
 *
 * Loot being drawn toward somebody is exempt: it has been claimed, it has
 * stopped expiring, and anything already fading on it is put back.
 *
 * Collection is deliberately not animated. A collected drop arrives at the
 * player and goes there, which is already a moment with a visible cause.
 *
 * ----------------------------------------------------------------------------
 * Arrival and departure pacing lives in the same file, under `presence`:
 *
 *   "presence": {
 *     "arrivalDuration": 30,
 *     "departureDuration": 30
 *   }
 *
 * Both are in frames. A duration of 0 turns that half off, and the enemy
 * appears or vanishes on the frame its page changes, as it used to.
 * ============================================================================
 * CHANGELOG:
 * - 1.2.0
 *    Enemies now fold into view when their page brings them onto the map, and fold
 *    away when it takes them off, instead of popping in and out. A folding enemy
 *    can't be hit on the way out, and doesn't act until it is facing you.
 * - 1.1.0
 *    A loot drop about to expire now blinks, then dissolves over its closing frames,
 *    so it stops vanishing without warning. Loot being drawn toward somebody is
 *    exempt, and the pacing is configured in data/config.motion.json.
 * - 1.0.0
 *    The initial release.
 * ============================================================================
 */
//endregion annotations