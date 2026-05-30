//region initialization
import JPassiveConditional_PluginMetadata from './_pluginMetadata.js';

/**
 * The core where all of my extensions live: in the `J` object.
 */
globalThis.J ||= {};

/**
 * The plugin umbrella that governs conditional passive states on the map.
 */
J.PASSIVE.EXT.CONDITIONAL = {};

/**
 * The metadata associated with this plugin.
 */
J.PASSIVE.EXT.CONDITIONAL.Metadata = new JPassiveConditional_PluginMetadata(__PLUGIN_NAME__, __PLUGIN_VERSION__);

/**
 * A collection of all aliased methods for this plugin.
 */
J.PASSIVE.EXT.CONDITIONAL.Aliased = {};
J.PASSIVE.EXT.CONDITIONAL.Aliased.Game_Battler = new Map();
J.PASSIVE.EXT.CONDITIONAL.Aliased.JABS_Battler = new Map();

/**
 * All regular expressions used by this plugin.
 */
J.PASSIVE.EXT.CONDITIONAL.RegExp = {};

/**
 * Captures {@code passiveSourceRule} bracket tuples from database notes.<br/>
 * Parsed by {@link RPGManager.getArraysFromNotesByRegex} (Path 1: outer tag + inner bracket capture).<br/>
 * Each match contributes one tuple that gates <strong>every</strong> passive state id declared on the same row.
 * <p>
 * Author shape: {@code <passiveSourceRule:[kind]>}, or {@code <passiveSourceRule:[kind, param]>}.<br/>
 * After parsing, tuples look like:
 * </p>
 * <ul>
 *   <li>{@code ['allOffCooldown']}</li>
 *   <li>{@code ['alliesNearby', 2]}</li>
 *   <li>{@code ['hpBelow', 25]}</li>
 * </ul>
 * <p>
 * Multiple source rules on one row are AND-ed: every tuple must pass for any passive from that source to count.
 * </p>
 * @type {RegExp}
 */
J.PASSIVE.EXT.CONDITIONAL.RegExp.PassiveSourceRule = /<passiveSourceRule:[ ]?(\[[^]]+])>/gi;

/**
 * Captures {@code passiveStateRule} bracket tuples from database notes.<br/>
 * Parsed by {@link RPGManager.getArraysFromNotesByRegex} (Path 1: outer tag + inner bracket capture).<br/>
 * Each match gates one passive state id declared on the same row; other passives on that row are unaffected.
 * <p>
 * Author shape: {@code <passiveStateRule:[stateId, kind]>}, or {@code <passiveStateRule:[stateId, kind, param]>}.<br/>
 * After parsing, tuples look like:
 * </p>
 * <ul>
 *   <li>{@code [12, 'hpBelow', 25]}</li>
 *   <li>{@code [5, 'hasState', 14]}</li>
 *   <li>{@code [6, 'slotOffCooldown', 'mainhand']}</li>
 * </ul>
 * <p>
 * Source-wide rules still apply first; state rules AND with any {@link PassiveSourceRule} tuples on the row.
 * </p>
 * @type {RegExp}
 */
J.PASSIVE.EXT.CONDITIONAL.RegExp.PassiveStateRule = /<passiveStateRule:[ ]?(\[[^]]+])>/gi;

/**
 * Captures {@code passiveStateCount} bracket tuples from database notes.<br/>
 * Parsed by {@link RPGManager.getArraysFromNotesByRegex} (Path 1: outer tag + inner bracket capture).<br/>
 * Each match scales how many stacks one source contributes for one passive state id (0 stacks is valid).
 * <p>
 * Author shape: {@code <passiveStateCount:[stateId, kind, param]>}.<br/>
 * After parsing, tuples look like:
 * </p>
 * <ul>
 *   <li>{@code [77, 'moreIsMoreHp', 25]} — floor(current hp% / 25) stacks</li>
 *   <li>{@code [12, 'per-cri', 3]} — floor(crit rate / 3) stacks (hundred-scale params use tag integers)</li>
 *   <li>{@code [8, 'alliesNearby', 2]} — floor(nearby allies excluding self / 2) stacks</li>
 * </ul>
 * <p>
 * When no count tuple targets a state, {@link Game_Battler#getPassiveStackContributionFromSource} falls back to 1.
 * </p>
 * @type {RegExp}
 */
J.PASSIVE.EXT.CONDITIONAL.RegExp.PassiveStateCount = /<passiveStateCount:[ ]?(\[[^]]+])>/gi;
//endregion initialization