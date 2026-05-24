//region annotations
/*:
 * @target MZ
 * @plugindesc [v@@PLUGIN_VERSION@@ @@PLUGIN_DESC_TAG@@] Enables execution of skills via region ids.
 * @author JE
 * @url https://github.com/je-can-code/rmmz-plugins
 * @base J-Base
 * @base J-ABS
 * @base J-RegionEffects
 * @orderAfter J-Base
 * @orderAfter J-ABS
 * @orderAfter J-RegionEffects
 * @help
 * ============================================================================
 * OVERVIEW
 * This plugin enables the ability to attempt to auto-execute skills
 * based on the region that a given character is standing upon while on
 * the map.
 *
 * ----------------------------------------------------------------------------
 * DETAILS:
 * At set intervals while any character on the map stands upon a given
 * regionId, the plugin will attempt to repeatedly execute a given skill
 * or skills against that character's JABS battler (player, follower, or
 * any map character that has a JABS battler attached).
 *
 * Executions use J-ABS forced map actions. A temporary "dummy" enemy
 * battler is created from an enemy id you specify in the tag; that
 * dummy's stats power the skill. The skill is resolved at the standing
 * character's map coordinates.
 *
 * This plugin probably could've been developed to work without JABS to
 * some extent, but this was designed FOR JABS, so it is a required
 * dependency. J-RegionEffects is also required (map note parsing shares
 * its refresh gate).
 * ============================================================================
 * PLUGIN PARAMETERS:
 *  - Execute Skill Delay:
 *      The number of frames between skill execution attempts.
 *      The lower this number, the more frequently skills will fire
 *        while standing on a tile with a region that executes skills.
 *      Defaults to 60, aka roughly once per second at 60 FPS.
 * ============================================================================
 * REGION SKILL IDS:
 * Have you ever wanted tiles that periodically cast a skill on whoever
 * is standing there (environmental damage, healing zones, traps)? Map
 * note tags define which region ids trigger which skills.
 *
 * NOTE ABOUT DUPLICATE TAGS:
 * Duplicate tags are allowed. They stack in the sense of execution
 * attempts, not merged into one roll. Multiple tags for the same region
 * (even the same skill id) mean the plugin will attempt to execute the
 * skill once per tag each time the timer fires (subject to each tag's
 * chance).
 *
 * NOTE ABOUT CHANCE:
 * CHANCE is a 1-100 integer percent chance per tag, per timer tick. It
 * does not account for target resistances or skill formulas beyond that
 * roll; use skill design and caster enemy stats for finer control.
 *
 * NOTE ABOUT THE CASTER ENEMY ID:
 * CASTER_ENEMY_ID is a row in the Enemies database. J-ABS builds a dummy
 * map battler from that enemy so the skill has valid stats, elements,
 * and actions. The dummy is not placed on the map as a visible event;
 * it exists only to cast. Change the id when you need different power
 * scaling or attack elements.
 *
 * NOTE ABOUT IS_FRIENDLY:
 * IS_FRIENDLY is the literal `true` or `false` (lowercase).
 *  - `false`: the dummy is treated as hostile to the target's team
 *    (typical damage tiles, traps, poison clouds).
 *  - `true`: the dummy is treated as friendly to the target's team
 *    (typical healing or buff zones for allies).
 * The plugin reuses one shared dummy instance and swaps it when region
 * tags on the same map disagree about caster id or friendly flag.
 *
 * NOTE ABOUT WHICH CHARACTERS ARE AFFECTED:
 * Any map character that can handle region skills is eligible: not
 * vehicles, and must have a JABS battler (same gate as other J-ABS map
 * characters). Hidden party followers still run region skills if they
 * have battlers.
 *
 * NOTE ABOUT SKILLS AND PERFORMANCE:
 * Skills run as real J-ABS map actions (projectiles, AoE, animations,
 * etc.). Very short execution delays plus high proc rates on busy maps
 * can spike load. Prefer modest chances or longer delays for hazard
 * regions that fire often. Skills must be valid for forced map execution
 * in J-ABS (same constraints as other map-damage / terrain skill paths).
 *
 * TAG USAGE:
 * - Map [Properties] note box (same place as region state tags).
 *
 * TAG FORMAT:
 *  <regionSkill:[REGION_ID, SKILL_ID, CHANCE, CASTER_ENEMY_ID,
 *    IS_FRIENDLY]>
 * Where REGION_ID is the map region id on the tile.
 * Where SKILL_ID is the skill database id to execute.
 * Where CHANCE is a 1-100 integer chance of executing this tick.
 * Where CASTER_ENEMY_ID is the enemy database id powering the dummy
 *   caster.
 * Where IS_FRIENDLY is `true` or `false` (hostile vs friendly dummy).
 *
 * All five values are required; the parser does not accept omitted
 * fields.
 *
 * TAG EXAMPLES:
 *  <regionSkill:[1, 12, 100, 3, false]>
 * Region 1: always (100%) tries to execute skill 12 using enemy 3's
 * stats as a hostile dummy, on each timer tick, against whoever stands
 * on region 1.
 *
 *  <regionSkill:[2, 45, 25, 8, false]>
 *  <regionSkill:[2, 45, 50, 8, false]>
 * Region 2: two entries for the same skill. Each tick can roll 25% and
 * 50% separately (two execution attempts, not one combined chance).
 *
 *  <regionSkill:[10, 78, 100, 1, true]>
 * Region 10: skill 78 from enemy 1 as a friendly dummy (ally healing
 * shrine).
 *
 * ============================================================================
 * CHANGELOG:
 * - 1.0.0
 *    Initial release.
 * ============================================================================
 * @param execution-delay
 * @type number
 * @text Execute Skill Delay
 * @desc The number of frames between skill executions.
 * Adjust this to make skills execute more or less frequently.
 * @default 60
 */
//endregion annotations