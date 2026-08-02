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
 * NOTE ABOUT SAVE COMPATIBILITY:
 * Savefiles written by vanilla RPG Maker MZ cannot be read by this plugin, and
 * savefiles written by this plugin cannot be read without it. There is no
 * converter. Install it before a project has saves worth keeping.
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
