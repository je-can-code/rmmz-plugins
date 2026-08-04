//region annotations
/*:
 * @target MZ
 * @plugindesc
 * [v@@PLUGIN_VERSION@@ @@PLUGIN_DESC_TAG@@] Data-driven boss encounters for J-ABS.
 * @author JE
 * @url https://github.com/je-can-code/rmmz-plugins
 * @base J-Base
 * @base J-ABS
 * @orderAfter J-Base
 * @orderAfter J-ABS
 * @help
 * ============================================================================
 * OVERVIEW
 * This plugin allows boss fights to be authored as data instead of as long
 * chains of event commands.
 *
 * A boss encounter describes who is fighting, who is allowed to drive them,
 * and what recurs while the fight runs. That description lives in an external
 * configuration file, which means a fight can be revised, retimed, or rebuilt
 * without opening a single event page.
 *
 * Integrates with others of mine plugins:
 * - J-Base; to be honest this is just required for all my plugins.
 * - J-ABS; the battle system the encounters take place in.
 *
 * ----------------------------------------------------------------------------
 * DETAILS:
 * Encounters are defined in the "bosses" block of "data/config.jabs.json",
 * alongside "teams" and "juice". Each encounter names a map, one or more
 * participants, and any number of recurring routines.
 *
 * Participants are a list rather than a single boss on purpose. A lone boss, a
 * boss with destructible parts, a pair of twins, and a swarm sharing a single
 * health pool are all the same structure with a different win condition, so
 * none of them require a new shape later.
 *
 * Nothing in this plugin draws anything. What a boss is - a battler, a health
 * pool, a set of behaviors - is combat knowledge, and a frame drawn around a
 * health bar is a view of that knowledge. Anything wanting to display a boss
 * asks this plugin for it.
 *
 * ============================================================================
 * AUTHORING AN ENCOUNTER:
 * A minimal encounter looks like this:
 *
 *  {
 *    "teams": [ ... ],
 *    "juice": { ... },
 *    "bosses": [
 *      {
 *        "key": "gluttonwolf",
 *        "map": 75,
 *        "participants": [
 *          {
 *            "key": "mayor",
 *            "eventId": 4,
 *            "enemyId": 581,
 *            "expect": "Gluttonwolf Mayor"
 *          }
 *        ],
 *        "aiControl": "shared",
 *        "routines": [
 *          {
 *            "key": "devour",
 *            "cadence": 20,
 *            "steps": [
 *              {
 *                "verb": "forceSkill",
 *                "skill": 2584,
 *                "expect": "Devour",
 *                "cast": true
 *              }
 *            ]
 *          }
 *        ]
 *      }
 *    ]
 *  }
 *
 * ----------------------------------------------------------------------------
 * AI CONTROL:
 * "shared" means the encounter layers behavior on top of a boss that its normal
 * AI continues to drive. This is the default and it is what most fights want.
 *
 * "scripted" means the encounter drives the boss outright for the duration of a
 * routine, and the routine is expected to suppress the normal AI itself.
 *
 * ----------------------------------------------------------------------------
 * CADENCE:
 * A routine's cadence is measured in seconds, counted from the moment the
 * encounter starts, so a routine's first execution is a full interval away
 * rather than landing on the first frame of the fight.
 *
 * When a routine comes due while the boss cannot act - stunned, or already
 * casting - that execution is skipped rather than queued. Queueing would mean
 * a stun releases into every missed execution firing back to back.
 *
 * ----------------------------------------------------------------------------
 * CAST TIME:
 * A step's "cast" property decides whether the skill observes its own cast
 * time. This is not cosmetic. A cast time is the telegraph - the window in
 * which a player reads an attack and moves out of it - so a skill executed
 * without its cast time is a skill that cannot be dodged.
 *
 * It defaults to true. Set it to false only for scripted set-pieces that are
 * not meant to be reacted to.
 *
 * ----------------------------------------------------------------------------
 * THE "expect" PROPERTY:
 * Every database reference carries the name that row had when the encounter
 * was authored. Before a fight runs, those names are checked against the
 * database as it stands now.
 *
 * This exists because a stale id fails silently. When a database is rebalanced
 * and ids move, a fight that references the old numbers keeps running - it just
 * summons the wrong enemy or casts the wrong skill, forever, without complaint.
 * Recording the name turns that silence into a crash at the one moment an
 * author can act on it.
 *
 * ============================================================================
 * CHANGELOG:
 * - 1.0.0
 *    The initial release.
 * ============================================================================
 *
 * @command start-encounter
 * @text Start Boss Encounter
 * @desc Begins a boss fight. Use this when the scene in front of the fight ends.
 * @arg encounterKey
 * @type string
 * @text Encounter
 * @desc The name of the encounter to begin, as written in the configuration.
 *
 * @command end-encounter
 * @text End Boss Encounter
 * @desc Ends the running boss fight. Use this after the boss's death scene finishes.
 */
//endregion annotations