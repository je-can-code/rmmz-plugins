//region annotations
/*:
 * @target MZ
 * @plugindesc [v@@PLUGIN_VERSION@@ @@PLUGIN_DESC_TAG@@] Saves as readable JSON instead of a compressed heap dump.
 * @author JE
 * @url https://github.com/je-can-code/rmmz-plugins
 * @base J-Base
 * @orderAfter J-Base
 * @help
 * ============================================================================
 * OVERVIEW
 * This plugin replaces how RPG Maker MZ writes and reads savefiles.
 *
 * Vanilla treats a save as a dump of the live game objects: it is compressed,
 * it is one file per slot, and every value in it is whatever the engine
 * happened to be holding at the moment you pressed save. That makes a save
 * unreadable, impossible to hand-edit, and quietly full of data the game
 * already knows how to rebuild.
 *
 * With this plugin a slot becomes a directory of pretty-printed JSON, written
 * through per-type codecs that decide what is worth keeping.
 *
 * ----------------------------------------------------------------------------
 * DETAILS:
 * A slot looks like this on disk:
 *
 *    save/
 *      config.json                 settings that outlive every save
 *      profile.json                anything that outlives one playthrough
 *      file1/
 *        current                   names the live generation
 *        gen-0007/
 *          manifest.json           what the load menu reads
 *          world.json
 *          party.json
 *          actors.json
 *          systems/
 *
 * Three things follow from that shape.
 *
 * A save is READABLE. Open it in any text editor and the state of the game is
 * right there, in named fields, in indented JSON.
 *
 * A save is RECOVERABLE. Each save writes a new generation and then swaps a
 * one-line pointer, which is the only filesystem operation that is genuinely
 * atomic. A crash mid-write leaves the previous generation live and untouched,
 * so the worst case is losing the newest save rather than losing the file.
 *
 * A save is HONEST. Derived data - caches, timers, anything the game rebuilds
 * on its own - is declared as such and never written, so what is in the file is
 * only what actually had to be remembered.
 *
 * ----------------------------------------------------------------------------
 * THE FILES SCENE:
 * This plugin also replaces Scene_Save and Scene_Load with a single scene that
 * saves, loads, deletes, and rewinds. What it offers depends entirely on where
 * it was opened from:
 *
 *    save platform     Save, Load, Rewind
 *    main menu         Load, Rewind
 *    title screen      Load, Delete
 *
 * Commands an origin does not offer are omitted rather than greyed out. The
 * player should never learn that these are the same screen.
 *
 * REWINDING is loading an older generation of the slot being played, listed
 * newest first and labelled by how long ago each one was written. It is NOT a
 * delete: the pointer stays where it is and the next save writes a new
 * generation on top, so the state rewound away from remains on disk until
 * retention retires it normally. Rewinding is itself undoable.
 *
 * DELETING is the only irreversible thing in the scene, which is why it exists
 * only at the title screen. It takes the whole slot, pointer first.
 *
 * Every save also writes a snapshot.jpg into its generation - the map, cropped
 * around where the player was standing - which the list draws beside each row.
 * It is deliberately not named in the manifest, so a lost picture can never
 * cost anybody a save.
 *
 * ----------------------------------------------------------------------------
 * NOTE ABOUT SAVE COMPATIBILITY:
 * Savefiles written by vanilla RPG Maker MZ cannot be read by this plugin, and
 * savefiles written by this plugin cannot be read without it. There is no
 * converter. Install it before a project has saves worth keeping.
 * ============================================================================
 * CHANGELOG:
 * - 1.0.3
 *    Routed the generation-fallback and dropped-slice warnings through J-Base's
 *    new Diagnostics, replacing the hand-written "[save]" prefix so these read
 *    the same as every other plugin's console output.
 * - 1.0.2
 *    Declared the equipment-contribution cache J-Base added to Game_Actor as
 *    transient. It holds a Map, which is a registered type, so left undeclared
 *    it would have persisted into every savefile and come back stale after a
 *    load rather than being rebuilt from what is currently equipped.
 * - 1.0.1
 *    The retainedSaveGenerations parameter is now read as a number rather than
 *    as the string RMMZ hands over, so a configured value survives arithmetic
 *    and not only comparisons that happen to coerce.
 * - 1.0.0
 *    The initial release.
 *    Added Scene_Files, one scene for saving, loading, deleting and rewinding,
 *    replacing Scene_Save and Scene_Load. What it offers is decided by where it
 *    was opened from and never by $gameSystem, since save access persists into
 *    savefiles and would leak.
 *    Added Rewind, which loads one named generation of the slot being played
 *    with no fallback to a newer one, and deletes nothing doing it.
 *    Added Delete, offered only from the title screen.
 *    Saving now writes a snapshot.jpg beside the sections, cropped from the map
 *    capture the menu backdrop already takes. It is absent from the manifest's
 *    section list on purpose, so losing it cannot fail a generation.
 *    maxSavefiles now answers with the number of slots the scene renders, so
 *    New Game can no longer claim a slot the scene never draws.
 *    The menu's save command became a Files command, ungated by save access.
 * ============================================================================
 *
 * @param retainedSaveGenerations
 * @type number
 * @min 1
 * @text Retained Save Generations
 * @desc How many past versions of a save slot are kept on disk for rollback.
 * @default 3
 */
//endregion annotations
