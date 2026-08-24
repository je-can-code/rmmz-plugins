//region annotations
/*:
 * @target MZ
 * @plugindesc [v@@PLUGIN_VERSION@@ @@PLUGIN_DESC_TAG@@] Content level sync for dungeons and trials.
 * @author JE
 * @url https://github.com/je-can-code/rmmz-plugins
 * @base J-Base
 * @base J-LevelMaster
 * @orderAfter J-Base
 * @orderAfter J-ABS
 * @orderAfter J-LevelMaster
 * @orderAfter J-Level-Flat
 * @orderAfter J-Base-Save
 * @orderAfter J-HUD
 * @orderAfter J-HUD-PartyFrame
 * @orderAfter J-HUD-TargetFrame
 * @help
 * ============================================================================
 * OVERVIEW
 * This extension adds content level sync for dungeons and trials. When active,
 * all party actors fight at a declared effective level for the duration of the
 * encapsulation. Real levels, EXP, and save data are never modified.
 *
 * Integrates with:
 * - J-Base; required foundation for all J plugins.
 * - J-LevelMaster; this extension hooks into getLevel() — required base.
 * - J-Level-Flat; EXP policy interaction controlled by the Sync Affects EXP
 *   parameter (default off — real level governs EXP rewards).
 * - J-Natural; parameter buff refresh is triggered on sync toggle when loaded.
 * - J-ABS; no core changes needed; getLevel() hook propagates automatically.
 * - J-HUD (Party/Target); sync indicator shown beside level text when active.
 *
 * ----------------------------------------------------------------------------
 * ACTIVATION
 * Content sync is activated in one of two ways:
 *
 * 1. PLUGIN COMMAND (recommended — session-scoped):
 *    Use "Set Content Sync" at a dungeon entrance event. The session persists
 *    across map transfers until "Clear Content Sync" is called explicitly.
 *    Session always takes priority over map notes.
 *
 * 2. MAP NOTE TAG (convenience — map-scoped):
 *    Add <levelSync:N> to a map's note field. Sync activates on map setup and
 *    clears automatically when leaving a map without the tag (provided no
 *    session is active). Map notes are ignored when a session is running.
 *
 * ----------------------------------------------------------------------------
 * TAG REFERENCE
 *
 *   <levelSync:N>
 *     Activate content sync at level N on this map (N must be > 0).
 *     Default mode is cap-only: overleveled actors clamp down to N,
 *     underleveled actors are unaffected.
 *
 *   <levelSyncUp>
 *     Paired with <levelSync:N>. Enables uplevel (exact sync) mode:
 *     all actors fight at exactly level N, including underleveled ones.
 *
 * Example map notes:
 *   <levelSync:50>                  <- cap-only at 50
 *
 *   <levelSync:50>
 *   <levelSyncUp>                   <- exact sync at 50
 *
 * ----------------------------------------------------------------------------
 * SYNC MODES
 *
 *   Cap-only (default):
 *     Real level 90 in a level-50 zone → fights as 50.
 *     Real level 30 in a level-50 zone → fights as 30 (unchanged).
 *
 *   Uplevel (exact sync, opt-in):
 *     Real level 90 in a level-50 zone → fights as 50.
 *     Real level 30 in a level-50 zone → fights as 50 (boosted).
 *
 * ----------------------------------------------------------------------------
 * WHAT SYNC AFFECTS
 *
 *   YES (uses effective/synced level):
 *     - getLevel() / actor.level / actor.lvl while encapsulated
 *     - Class paramBase curve (already reads getLevel())
 *     - LevelScaling combat and reward multipliers
 *     - Formula evaluation using a.level
 *     - HUD level display (with sync icon)
 *     - J-APT level-difference gate (actor side)
 *
 *   NO (explicitly unchanged):
 *     - Saved _level and EXP (never mutated)
 *     - Equipment flat stats (paramPlus)
 *     - Learned skill list
 *     - Permanent J-Natural growth from real level-ups
 *     - SDP panel investment
 *     - EXP rewards (by default — see Sync Affects EXP parameter)
 *
 * ----------------------------------------------------------------------------
 * EXP BEHAVIOR
 *
 *   By default (Sync Affects EXP = false), EXP rewards use the actor's real
 *   level. This preserves J-Level-Flat's "too high = no EXP" design: a
 *   real level-90 actor synced to 50 still earns zero EXP from level-50
 *   enemies because the EXP calculation sees level 90, not 50.
 *
 *   Set Sync Affects EXP = true to use effective level for EXP. Actors synced
 *   down to 50 would then earn EXP as if they are level 50.
 *
 * ----------------------------------------------------------------------------
 * SESSION PRIORITY
 *
 *   An active session (set by plugin command) is never overridden or cancelled
 *   by a map note — even if the map has no sync tag, or has a different level.
 *   Only the "Clear Content Sync" plugin command ends a session.
 *
 *   Typical pattern for a multi-map dungeon:
 *     - Entrance NPC event: call "Set Content Sync" (level=50, uplevel=false)
 *     - Exit crystal event: call "Clear Content Sync"
 *     - Inner maps do not need any tags
 *
 * ============================================================================
 * CHANGELOG:
 * - 1.1.0
 *    Routed the _levelSync namespace into its own save section, so an active
 *    sync session lands in systems/level-sync.json rather than in the system
 *    blob.
 *    Moved the _levelSync namespace seeding from the initialize aliases to
 *    initMembers, so a decoded save can establish it without a constructor.
 * - 1.0.0
 *    The initial release.
 * ============================================================================
 *
 * @command setContentSync
 * @text Set Content Sync
 * @desc Activates content level sync at the specified level for all party members.
 *
 * @arg level
 * @type number
 * @min 1
 * @text Sync Level
 * @desc The level all party actors will fight at (or be capped to).
 * @default 50
 *
 * @arg uplevel
 * @type boolean
 * @text Uplevel
 * @desc If true, underleveled actors are boosted to the sync level (exact sync). Default false = cap-only.
 * @default false
 *
 * @command clearContentSync
 * @text Clear Content Sync
 * @desc Deactivates the active content sync session and restores real effective levels.
 *
 * ============================================================================
 *
 * @param sync-indicator-icon
 * @type number
 * @text Sync Indicator Icon
 * @desc Icon index shown beside level text while content sync is active. Set to 0 to suppress the icon.
 * @default 75
 *
 * @param sync-affects-exp
 * @type boolean
 * @text Sync Affects EXP
 * @desc If true, EXP rewards use the synced level. If false (default), real level governs EXP — preserving J-Level-Flat's design.
 * @default false
 *
 */
//endregion annotations
