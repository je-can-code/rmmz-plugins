//region annotations
/*:
 * @target MZ
 * @plugindesc
 * [v@@PLUGIN_VERSION@@ @@PLUGIN_DESC_TAG@@] Measures how much damage each party member is dealing, and how fast.
 * @author JE
 * @url https://github.com/je-can-code/rmmz-plugins
 * @base J-Base
 * @base J-ABS
 * @orderAfter J-Base
 * @orderAfter J-ABS
 * @help
 * ============================================================================
 * OVERVIEW
 * J-ABS-Dps measures damage output. It watches the same moment J-ABS already
 * announces- a skill effect landing on a target- and files each landed hit
 * against the fight it happened in.
 *
 * Nothing in this plugin changes gameplay. It only observes. It also draws
 * nothing; J-HUD-Dps is the readout built on top of these numbers.
 *
 * ----------------------------------------------------------------------------
 * DETAILS:
 * THE CLOCK ONLY RUNS IN COMBAT.
 * A rate measured against wall time is mostly measuring the walk between
 * fights. The clock here advances only while the party is engaged, so out of
 * combat every figure freezes and holds its last reading rather than decaying
 * toward zero on the way to the next encounter.
 *
 * TWO RATES, AND THE GAP BETWEEN THEM IS THE POINT.
 * The rolling rate covers the last few seconds and answers "how hard is this
 * hitting right now". The encounter rate covers a whole fight, dodging and
 * repositioning and cooldown idling included. A slow heavy weapon and a fast
 * light one can tie on one and be nowhere near each other on the other.
 *
 * AN ENCOUNTER ENDS AT ITS LAST HIT, NOT WHEN COMBAT IS DECLARED OVER.
 * JABS keeps its in-combat countdown alive for between two and ten seconds
 * after the fighting stops. That countdown falling is the signal that a fight
 * finished, but the fight is measured only as far as the last hit that landed-
 * on a six second encounter, letting the tail into the span would roughly
 * halve every number it produced.
 *
 * EVERY MEMBER SHARES ONE CLOCK.
 * Damage is recorded per battler, but all of them are measured against the
 * same encounter span. An ally who spent the fight dead, stuck on terrain, or
 * idling somewhere divides their small damage by the whole fight and reads
 * low, which is the entire signal. Giving each battler their own active-time
 * denominator would make everyone look fine over whatever slice of the fight
 * they bothered to show up for.
 *
 * ----------------------------------------------------------------------------
 * WHAT COUNTS:
 * A hit is recorded when all of the following hold.
 *
 * - The caster is an actor. This measures what the party puts out, and with
 *   teams in play an enemy striking another enemy would otherwise land here.
 * - The target is an enemy, and is not inanimate. Inanimate forces the neutral
 *   team, and JABS only declares combat between opposed teams, so nothing
 *   struck this way ever raises the in-combat flag. The clock would never
 *   start and the encounter would never close.
 *
 * ----------------------------------------------------------------------------
 * BUILDING A TRAINING DUMMY:
 * Do NOT tag a dummy as inanimate. It reads like the right tag- a dummy should
 * not wander off- but inanimate puts the target on the neutral team, and a
 * neutral target is never opposed to the party, so hitting it is never combat.
 * The clock stays frozen, every hit lands on the same frame, and no rate can be
 * measured at all.
 *
 * Build it as an ordinary enemy instead:
 * - Fixed autonomous movement on the event, which is what actually keeps it
 *   still. Inanimate was never the thing stopping it from moving.
 * - Sight and pursuit of zero, so it never chases. As a bonus this lets JABS
 *   compress its own combat tail to two seconds, so the encounter closes
 *   promptly once the swinging stops.
 * - A large hp pool rather than the invincible flag. Invincible makes a battler
 *   untargetable outright, so nothing would ever connect with it.
 * - The action did not come from the tool or usable item slot. A thrown bomb
 *   is a statement about the bomb, not about the weapon being measured.
 * - The attack was not evaded.
 * - The hit dealt more than zero hp damage. A pure state application deals
 *   nothing, and a heal arrives as negative damage that would walk the figure
 *   backwards.
 *
 * ============================================================================
 * CHANGELOG:
 * - 1.0.0
 *    Initial release.
 * ============================================================================
 * PLUGIN PARAMETERS:
 * @param rollingWindowSeconds
 * @type number
 * @min 1
 * @max 60
 * @text Rolling Window (seconds)
 * @desc How far back the rolling rate looks, in seconds of combat time. Keep it shorter than a typical fight, or the rate becomes a smoothing filter instead.
 * @default 5
 */
//=================================================================================================
//endregion annotations