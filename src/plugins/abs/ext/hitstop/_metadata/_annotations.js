//region annoations
/*:
 * @target MZ
 * @plugindesc
 * [v@@PLUGIN_VERSION@@ @@PLUGIN_DESC_TAG@@] An extension for JABS that adds hitstop functionality.
 * @author JE
 * @url https://github.com/je-can-code/rmmz-plugins
 * @base J-Base
 * @base J-ABS
 * @orderAfter J-Base
 * @orderAfter J-ABS
 * @help
 * ============================================================================
 * OVERVIEW
 * This plugin adds "hitstop" to JABS: a brief freeze-frame pause applied to
 * the attacker, the target, and the delivering action event the instant a
 * hit connects. It's the classic "impact frame" trick used to make hits
 * feel heavier without touching damage numbers.
 *
 * Integrates with others of mine plugins:
 * - J-Base; to be honest this is just required for all my plugins.
 *
 * ----------------------------------------------------------------------------
 * DETAILS:
 * A skill's hitstop duration (in frames) is resolved from a base amount,
 * then adjusted by whether the hit was a critical, whether it was guarded,
 * and whether it was parried, then scaled by the target's own hitstop
 * sensitivity, then clamped to the configured max. A parried hit always
 * resolves to zero hitstop, regardless of any other tag.
 *
 * ============================================================================
 * HITSTOP DURATION (PER SKILL):
 * Set how many frames of hitstop this skill's hits apply on impact.
 * Without this tag, the plugin's global default base frames are used.
 *
 * TAG USAGE:
 * - Skills
 *
 * TAG FORMAT:
 *  <hitstop:FRAMES>
 *    Where FRAMES is the base number of frames to freeze on impact.
 *
 * TAG EXAMPLES:
 *  <hitstop:8>
 * This skill applies 8 base frames of hitstop on every hit, before crit/
 * guard/target-scale adjustments are layered on.
 *
 * ----------------------------------------------------------------------------
 * DISABLE HITSTOP (PER SKILL):
 * Fully disables hitstop for this skill's hits, ignoring the global default
 * and this skill's own <hitstop:FRAMES> tag if both are somehow present.
 *
 * TAG USAGE:
 * - Skills
 *
 * TAG FORMAT:
 *  <noHitstop>
 *
 * TAG EXAMPLES:
 *  <noHitstop>
 * Hits from this skill never trigger a freeze-frame pause, even if the
 * global default has hitstop enabled for everything else.
 *
 * ----------------------------------------------------------------------------
 * HITSTOP SENSITIVITY (PER BATTLER):
 * Scales how much hitstop a battler experiences when they are the one being
 * hit. This is read from the TARGET's own database data, not the skill.
 *
 * TAG USAGE:
 * - Actors
 * - Enemies
 *
 * TAG FORMAT:
 *  <hitstopScale:P%>
 *    Where P is the percent scale to apply against the resolved duration.
 *
 * TAG EXAMPLES:
 *  <hitstopScale:50%>
 * This battler experiences half the normal hitstop duration whenever they
 * are hit- great for giving small/fast enemies a snappier feel, or heavily
 * armored bosses a duller, less-interruptible one.
 *
 *  <hitstopScale:0%>
 * This battler never experiences hitstop when hit, regardless of the
 * attacking skill's own tags.
 *
 * NOTE: Without this tag, a battler defaults to 100% (no scaling).
 * ============================================================================
 * TUNING:
 * This plugin has no editable plugin parameters. All base tuning (default
 * hitstop frames, crit bonus, guard scale, max frames, flurry decay/window,
 * screen-shake power/speed/cooldown, etc.) is hardcoded in
 * JHitstop_PluginMetadata#initializeMetadata and adjusted by editing that
 * file directly if you need different defaults for your project.
 * ============================================================================
 * CHANGELOG:
 * - 1.0.2
 *    Raised minimum J-ABS version requirement to 4.7.0.
 * - 1.0.1
 *    Raised minimum J-ABS version requirement to 4.6.0.
 * - 1.0.0
 *    The initial release.
 * ============================================================================
 */
//endregion annotations