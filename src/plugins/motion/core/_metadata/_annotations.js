//region annotations
/*:
 * @target MZ
 * @plugindesc
 * [v@@PLUGIN_VERSION@@ @@PLUGIN_DESC_TAG@@] Ambient and reactive motion for character sprites.
 * @author JE
 * @url https://github.com/je-can-code/rmmz-plugins
 * @base J-Base
 * @orderAfter J-Base
 * @help
 * ============================================================================
 * OVERVIEW
 * A character on the map is a static sprite that slides between tiles. This
 * plugin makes it move on its own: breathing, floating, swaying, spinning,
 * flickering, flashing, tinting, and travelling to a new size or angle and
 * staying there.
 *
 * Integrates with others of mine plugins:
 * - J-Base; to be honest this is just required for all my plugins.
 *
 * ----------------------------------------------------------------------------
 * DETAILS:
 * A motion is DECLARED on the thing that should have it, and runs for exactly
 * as long as that declaration exists. An event page declares motions with a
 * comment tag, and they stop when the page changes. Nothing expires on its own
 * and nothing fires once- if you want a motion to last three seconds, the
 * plugin command that applies it says so.
 *
 * Several motions compose on one character. A breathing, swaying, ghosting
 * enemy is three declarations, and each of them can be withdrawn without
 * disturbing the other two.
 *
 * Two characters declaring the same motion will not animate in lockstep; each
 * one starts somewhere random within its own cycle. A room of thirty breathing
 * enemies reads as alive rather than choreographed. Add the `sync` keyword to
 * a motion when you actually want them in formation.
 *
 * ============================================================================
 * DECLARING A MOTION:
 * Add a comment to an event page:
 *
 * TAG FORMAT:
 *  <motion:[TYPE]>
 *  <motion:[TYPE, PARAM, PARAM, ...]>
 *    Where TYPE is one of the motions listed below.
 *    Where PARAM are that motion's parameters, in order.
 *
 * Every motion works with no parameters at all. Parameters are positional and
 * optional, filling in from left to right, so you can specify only the first
 * one and leave the rest at their defaults.
 *
 * THE CYCLING MOTIONS:
 *  <motion:[breathe, AMOUNT, PERIOD]>
 *    Swells and narrows, the way a chest does.
 *  <motion:[stretch, AMOUNT, PERIOD]>
 *    Grows and shrinks in height only.
 *  <motion:[pulse, AMOUNT, PERIOD]>
 *    Grows and shrinks evenly, like a heartbeat.
 *  <motion:[float, DISTANCE, PERIOD]>
 *    Hovers above the ground and settles back to it.
 *  <motion:[sway, DISTANCE, PERIOD]>
 *    Drifts side to side.
 *  <motion:[swing, ANGLE, PERIOD]>
 *    Rocks back and forth about its feet, like a hanging sign.
 *  <motion:[spin, PERIOD, DIRECTION]>
 *    Turns in place. DIRECTION is `cw` or `ccw`.
 *  <motion:[ghost, MIN, MAX, PERIOD]>
 *    Fades in and out between two opacities.
 *  <motion:[flicker, MIN, MAX, INTERVAL]>
 *    Jumps between opacities, like a failing lamp.
 *  <motion:[shake, STRENGTH, AXIS, INTERVAL]>
 *    Vibrates. AXIS is `x`, `y`, or `both`.
 *  <motion:[hop, HEIGHT, DURATION, REST]>
 *    Leaps, lands, waits, and leaps again.
 *  <motion:[throb, RED, GREEN, BLUE, GRAY, PERIOD]>
 *    Pulses a colour tone in and out.
 *  <motion:[flash, COLOR, PERIOD]>
 *    Strobes a colour. COLOR is written as #rrggbb.
 *
 * THE TRAVELLING MOTIONS:
 * These ease to somewhere and stay there for as long as they are declared,
 * then ease back when they are removed.
 *
 *  <motion:[scale, PERCENT, DURATION]>
 *    Becomes larger or smaller. 150 is half again as big.
 *  <motion:[angle, DEGREES, DURATION]>
 *    Turns to face an angle and holds it.
 *  <motion:[fade, PERCENT, DURATION]>
 *    Becomes more or less transparent.
 *  <motion:[hue, DEGREES, DURATION]>
 *    Rotates the sprite's hue.
 *  <motion:[tint, COLOR, DURATION]>
 *    Tints the sprite toward a colour. COLOR is written as #rrggbb.
 *
 * ALL PERIODS AND DURATIONS ARE IN FRAMES.
 * The game runs at 60 frames per second, so a period of 150 is two and a half
 * seconds for one full cycle.
 *
 * TAG EXAMPLES:
 *  <motion:[breathe]>
 * This character breathes at the default depth and rate.
 *
 *  <motion:[swing, 15, 200]>
 * This character rocks 15 degrees to either side, over a 200 frame cycle.
 *
 *  <motion:[float]>
 *  <motion:[ghost]>
 * This character hovers AND fades. Motions compose; declare as many as you
 * like.
 *
 *  <motion:[breathe, 0.08, 90, sync]>
 * A deeper, quicker breath, deliberately in step with every other character
 * declaring the same thing.
 *
 * ============================================================================
 * A NOTE ON COLOUR:
 * The hue, tint, tone and flash motions are more expensive than the others.
 * Colouring a sprite gives it its own render pass for the rest of its life,
 * and the engine never takes that back. On a map holding a dozen coloured
 * characters this is nothing; on one holding a hundred it is worth knowing.
 *
 * The plain motions- anything moving, scaling or rotating- cost nothing at
 * all beyond the arithmetic.
 * ============================================================================
 * CHANGELOG:
 * - 1.2.0
 *    Adds `passive` to the source ranking, between an event page and an applied
 *    state, for the motions J-Motion-Passive declares.
 * - 1.1.0
 *    Centred rotation now lifts the sprite instead of dropping it, and scales that
 *    lift by the sprite's own scale, so a character that spins while changing size
 *    stays where it was standing. The anchor is also restored once the rotation
 *    ends rather than being left at the middle for the rest of the sprite's life.
 *    A source that withdraws a transition and immediately re-declares it now
 *    resumes the one already travelling home rather than starting a second on the
 *    same channel, where the two combined into a value nobody asked for. Asking a
 *    second time for a removal already underway no longer restarts the journey
 *    from further out than the sprite had reached.
 *    Compositions can be asked whether a contribution would actually land, so an
 *    effect that lost a channel no longer acts as though it had won it. Adds
 *    removeDeclarationKind for withdrawing every source of one kind at once.
 * - 1.0.0
 *    The initial release.
 * ============================================================================
 *
 * @command applyMotion
 * @text Apply Motion
 * @desc Applies a motion to a character, optionally for a limited time.
 *
 * @arg target
 * @type select
 * @option Player
 * @option Follower
 * @option Event
 * @option This Event
 * @default This Event
 * @text Target
 * @desc Which character the motion is applied to.
 *
 * @arg targetId
 * @type number
 * @min 1
 * @default 1
 * @text Target ID
 * @desc The follower's party slot or the event's id. Ignored for the player and this event.
 *
 * @arg motion
 * @type string
 * @default breathe
 * @text Motion
 * @desc The motion and its parameters, written as they would be inside a tag. Ex: breathe, 0.08, 90
 *
 * @arg sourceKey
 * @type string
 * @default command
 * @text Source
 * @desc Who owns this motion. Removing a source only removes what that source applied.
 *
 * @arg duration
 * @type number
 * @min 0
 * @default 0
 * @text Duration
 * @desc How many frames the motion lasts before it removes itself. 0 lasts until removed.
 *
 *
 * @command removeMotion
 * @text Remove Motion
 * @desc Withdraws whatever a source had applied to a character.
 *
 * @arg target
 * @type select
 * @option Player
 * @option Follower
 * @option Event
 * @option This Event
 * @default This Event
 * @text Target
 * @desc Which character to stop moving.
 *
 * @arg targetId
 * @type number
 * @min 1
 * @default 1
 * @text Target ID
 * @desc The follower's party slot or the event's id. Ignored for the player and this event.
 *
 * @arg sourceKey
 * @type string
 * @default command
 * @text Source
 * @desc Who is withdrawing. Only motions applied under this same source are removed.
 */
//endregion annotations