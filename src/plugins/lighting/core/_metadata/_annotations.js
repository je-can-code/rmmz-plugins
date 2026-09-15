//region annotations
/*:
 * @target MZ
 * @plugindesc
 * [v@@PLUGIN_VERSION@@ @@PLUGIN_DESC_TAG@@] Declarative darkness and light sources for the map.
 * @author JE
 * @url https://github.com/je-can-code/rmmz-plugins
 * @base J-Base
 * @orderAfter J-Base
 * @help
 * ============================================================================
 * OVERVIEW
 * This plugin lets a place be dark, and lets things in it give off light.
 *
 * The engine has always been able to tint the screen, but a tint is uniform-
 * it colours everything equally and cannot have holes punched in it. That is
 * why night in most games is "everything goes blue" rather than "you cannot
 * see". This plugin adds the other half: a mask that takes light away, which
 * torches, lanterns and glowing things cut back out of.
 *
 * Integrates with others of mine plugins:
 * - J-Base; to be honest this is just required for all my plugins.
 *
 * ----------------------------------------------------------------------------
 * DETAILS:
 * Darkness is DECLARED on the thing that has it, and lasts exactly as long as
 * that declaration does. A map says how dark it is in its own note box. An
 * event page says what light it gives off in a comment. The party leader's
 * equipment and states say what light they carry.
 *
 * Everything that reaches the screen is composed rather than overwritten. A
 * cave that is dark, at an hour that is dark, during a cutscene that has
 * tinted everything red, resolves into one coherent picture- and when the
 * cutscene lets go, the cave is still dark, because nobody ever overwrote it.
 *
 * A map that says nothing is not dark. Every map authored before this plugin
 * existed is untouched by it, renders exactly as it always has, and costs
 * nothing at all.
 *
 * ============================================================================
 * DECLARING DARKNESS:
 * Put a tag in a MAP's note box (Map Properties -> Note):
 *
 * TAG FORMAT:
 *  <ambient:[DARKNESS]>
 *  <ambient:[DARKNESS, COLOR]>
 *    Where DARKNESS is how much light is gone, from 0 to 100.
 *    Where COLOR is a hex colour for the dark itself (OPTIONAL).
 *
 * EXAMPLE USAGES:
 *  <ambient:[60]>
 * This map has lost 60% of its light. Dim, but navigable.
 *
 *  <ambient:[100]>
 * This map is pitch black. Only declared lights are visible.
 *
 *  <ambient:[85, #0a2a2a]>
 * This map has lost 85% of its light, and what is left reads teal rather
 * than grey. Useful when the dark should belong to the place.
 *
 * A map's note is the right home for this because a map has no pages, so
 * there is no page comment for it to live in instead.
 *
 * ----------------------------------------------------------------------------
 * WHEN THE LIGHTS COME ON:
 * A map's tag says what somewhere is like ORDINARILY. For a room whose lights
 * can be switched on, use the Lights On plugin command- it withdraws the map's
 * own darkness rather than arguing with it.
 *
 * Declaring "no darkness" over the top would do nothing at all, because
 * darkness compounds: none of it, compounded with what is already there, is
 * exactly what is already there.
 *
 * Lights On lasts until the player next arrives on the map. Anything that
 * should outlive a transfer is a switch and a page, the same as any other
 * lasting change to a room.
 *
 * ============================================================================
 * DECLARING A LIGHT:
 * Add a comment to an EVENT PAGE:
 *
 * TAG FORMAT:
 *  <light:[RADIUS]>
 *  <light:[RADIUS, COLOR]>
 *  <light:[RADIUS, COLOR, INTENSITY]>
 *  <light:[RADIUS, COLOR, INTENSITY, EFFECT]>
 *    Where RADIUS is how far the light reaches, in TILES. Fractions are
 *    fine- 2.5 is two and a half tiles.
 *    Where COLOR is a hex colour for the light (OPTIONAL).
 *    Where INTENSITY is how evenly the circle is filled, 0 to 100 (OPTIONAL).
 *    Where EFFECT is `flicker`, `pulse` or `glitch` (OPTIONAL).
 *
 * ONLY THE RADIUS HAS A FIXED PLACE. Colour, intensity and effect are told
 * apart by what they look like- a `#` leads a colour, a bare number is an
 * intensity, a word is an effect- so they may be written in any order, and any
 * of them may be left out.
 *
 * ----------------------------------------------------------------------------
 * INTENSITY- HOW EVENLY THE CIRCLE IS FILLED:
 * This is the SHAPE of the light, not its brightness. At 0 the light is
 * brightest at its heart and fades away to nothing, the way a flame in the
 * open does. At 100 the whole circle burns evenly and stops dead at the rim,
 * the way a spotlight does. Everything between is how hard the edge is.
 *
 * A light with no intensity given is a soft pool, which is what a light has
 * always looked like here.
 *
 * ----------------------------------------------------------------------------
 * EFFECTS- WHAT THE LIGHT DOES OVER TIME:
 * A light with no effect named simply burns steadily.
 *
 *  flicker   Erratic and organic, like a torch or a bonfire. Two waves at
 *            odds with each other, so it never repeats and two torches in a
 *            room never gutter in time.
 *  pulse     Steady and rhythmic, like something breathing or a crystal
 *            humming. One clean wave, the same every cycle.
 *  glitch    Mostly perfectly steady, then a short burst of stuttering, then
 *            steady again. A dying fluorescent tube or failing machinery. The
 *            waiting is what sells it.
 *
 * An effect costs nothing extra to draw. Two torches of the same size and
 * colour share one picture between them whether they flicker or not- the
 * effect changes how brightly that picture is shown, never the picture.
 *
 * EXAMPLE USAGES:
 *  <light:[5]>
 * A plain white light reaching five tiles.
 *
 *  <light:[4, #ffbb73]>
 * A warm light, the colour of an incandescent bulb, reaching four tiles.
 *
 *  <light:[6, #ffbb73, flicker]>
 * The same warm light, reaching six tiles, guttering like a torch.
 *
 *  <light:[5, #ffffff, 90, flicker]>
 * A sharp-edged beam that is not quite holding steady- an unsteady spotlight.
 *
 *  <light:[4, #ffeebb, 10]>
 * A soft, even, unwavering pool- a street lamp.
 *
 *  <light:[3, #88ffcc, 70, pulse]>
 * A crisp teal circle breathing in and out- a crystal.
 *
 *  <light:[2, #aaddff, 100, glitch]>
 * A hard little disc that holds, stutters, and holds again- failing machinery.
 *
 * ----------------------------------------------------------------------------
 * WHY A COMMENT AND NOT A NOTE:
 * A light on a page can stop. An unlit torch is page one with no tag; page
 * two, behind a self switch, has the lit graphic AND the light tag. Setting
 * the torch alight is a self switch, and the light arrives with the page that
 * describes a burning torch.
 *
 * Nothing has to register the event as ignitable, and nothing has to remember
 * to put it out.
 *
 * ----------------------------------------------------------------------------
 * LIGHTS THE PLAYER CARRIES:
 * The same `<light:...>` tag works on anything the party leader has: a weapon,
 * an armor, a state, a skill, a class, or the actor themselves.
 *
 * EXAMPLE USAGES:
 *  <light:[4.5, #ffdca8, flicker]>   (on a Lantern armor)
 * The party gives off light while that lantern is equipped, and stops the
 * moment it comes off.
 *
 *  <light:[3, #88ffcc]>              (on a "Glowing" state)
 * The party gives off light for as long as the state lasts.
 *
 * THE PLAYER HAS NO LIGHT OF THEIR OWN. This is deliberate. A globe that
 * follows the party everywhere makes darkness unreachable, because the one
 * place the player can always see is exactly where they are standing.
 *
 * ============================================================================
 * HOW THINGS COMBINE:
 * DARKNESS COMPOUNDS. A map that is 30% dark, at an hour that is 40% dark, is
 * 58% dark- not 70%. Each one takes away a share of whatever light reached it,
 * so two ordinary evenings never add up to a blackout.
 *
 * THE COLOUR OF THE DARK belongs to whoever actually stated one. A map saying
 * `<ambient:[85, #0a2a2a]>` keeps its teal even when something that only knows
 * how dark it is disagrees.
 *
 * LIGHTS ADD TOGETHER. Two torches overlapping are brighter where they meet,
 * the way two real ones would be.
 *
 * ============================================================================
 * WHAT GOES DARK AND WHAT DOES NOT:
 * The mask sits directly above the weather. Everything painted below it goes
 * dark with the world: the tilemap, characters, their nameplates and gauges,
 * and damage popups.
 *
 * Everything a plugin adds to the spriteset sits above it and stays lit. That
 * is where J-ABS puts its cast previews and debug hitboxes, so attack
 * telegraphs stay readable in a pitch-black room.
 *
 * ADDING YOURSELF TO THE SPRITESET IS HOW YOU OPT OUT OF THE DARK.
 *
 * Anything that should glow within the world's own rules does not need to opt
 * out at all- give it a `<light:...>` tag and it lights the room it is in.
 *
 * ============================================================================
 * CONFIGURATION:
 * Defaults live in `data/config.lighting.json` rather than in plugin
 * parameters, so retuning what a torch looks like across the whole game is a
 * data edit instead of a rebuild.
 *
 *  light.radius         how far a light with no radius given reaches, in tiles
 *  light.color          the colour a light with no colour given is
 *  light.intensity      how evenly a light with no intensity given is filled
 *  light.effects        one block per effect, tuning how it behaves
 *  ambient.color        the colour of dark when a map does not say
 *
 * CONFIG NUMBERS ARE FRACTIONS, NOT PERCENTAGES. A tag is written by hand and
 * so takes an intensity of 0 to 100; this file is read by the game and takes
 * the same thing as 0 to 1, matching `depth` beside it. `light.intensity: 0.5`
 * is what `<light:[5, 50]>` asks for.
 *
 * Every effect is tuned by the same three numbers, so retuning one is the same
 * job as retuning another:
 *
 *  depth    how much brightness the effect may take away at its worst, 0 to 1
 *  period   how many frames one cycle of it takes
 *  chance   how likely a cycle is to fault at all- `glitch` alone reads this,
 *           and it is what decides how long the steady stretches are
 *  variance how far either side of that period an individual light may sit
 *
 * VARIANCE IS WHAT KEEPS A ROOM FROM BEATING AS ONE. Every light already
 * starts somewhere different in its cycle, but two lights running the exact
 * same period hold that stagger forever, and a fixed relationship reads as
 * choreography. A little variance lets them drift in and out of agreement
 * instead, the way two real flames do. Set it to 0 where you want a bank of
 * machines to fault together.
 *
 * ============================================================================
 * CHANGELOG:
 * - 1.0.0
 *    The initial release.
 * ============================================================================
 *
 * @command applyAmbient
 * @text Apply Darkness
 * @desc Darkens the scene until removed. Compounds with the map's own darkness rather than replacing it.
 *
 * @arg darkness
 * @type number
 * @min 0
 * @max 100
 * @default 50
 * @text Darkness
 * @desc How much light to take away, from 0 to 100.
 *
 * @arg color
 * @type string
 * @default
 * @text Color
 * @desc A hex colour for the dark itself, ex: #0a2a2a. Leave blank for ordinary black.
 *
 *
 * @command removeAmbient
 * @text Remove Darkness
 * @desc Withdraws darkness applied by plugin command. The map's own darkness is untouched.
 *
 *
 * @command lightsOn
 * @text Lights On
 * @desc Turns the lights on somewhere the map itself calls dark. Lasts until the player next arrives here.
 *
 *
 * @command lightsOff
 * @text Lights Off
 * @desc Gives a place its own darkness back after Lights On.
 */
//endregion annotations