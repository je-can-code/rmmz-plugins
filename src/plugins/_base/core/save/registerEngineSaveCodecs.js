//region registerEngineSaveCodecs
import SaveDecoder from './SaveDecoder.js';
import SaveEncoder from './SaveEncoder.js';
import SerializableRegistry from './../SerializableRegistry.js';

/**
 * Every codec here describes a type J-Base does not own: two native collections, and the eighteen
 * engine classes a savefile is made of.
 *
 * Three rules produced the declarations below, and none of them can be shortcut by reading a save:
 *
 * **A field is typed if the class assigns an instance to it**, not if its name sounds like it does.
 * `Game_Party._actors` holds actor *ids*; `_items` / `_weapons` / `_armors` are id-to-count maps.
 * Declaring any of them typed would have the decoder try to rebuild integers into actors. Every
 * `typed` entry below was read out of `initialize` / `initMembers` in `project/js/rmmz_objects.js`.
 *
 * **A `seed` is required wherever the class sets up state in `initialize`.** The decoder never runs a
 * constructor, so without one, any field an older save predates comes back `undefined` forever.
 * Where the engine already has an idempotent, side-effect-free reset - `clear()` on several of these
 * - that is the seed, so the default follows the engine rather than a copy of it that can drift.
 *
 * **Identity is explicit.** Each type gets a stable kebab-case save id plus its class name as an
 * alias, so renaming an engine wrapper never touches a save, and files written by the engine's own
 * `JsonEx` - which always tags with `constructor.name` - still resolve.
 */

/**
 * Rebuilds a `Map` from the shape the encoder wrote.
 * @param {{entries: Array}} data The encoded map.
 * @param {string} path The JSON path of the node, for error context.
 * @returns {Map}
 */
const decodeMap = (data, path) => new Map(data.entries.map(([ key, value ], index) => [
  SaveDecoder.decode(key, null, `${path}.entries[${index}][0]`),
  SaveDecoder.decode(value, null, `${path}.entries[${index}][1]`),
]));

/**
 * A `Map`'s real entries live in an internal slot that `Object.keys` cannot reach, so the default
 * walk would faithfully encode one as `{}`. Both native collections therefore override the walk
 * outright, in the same wire shape the retiring `JsonEx` override used.
 */
SerializableRegistry.register(Map, {
  id: 'Map',
  encode: (value, path) => ({
    entries: [ ...value.entries() ].map(([ key, entryValue ], index) => [
      SaveEncoder.encode(key, `${path}.entries[${index}][0]`),
      SaveEncoder.encode(entryValue, `${path}.entries[${index}][1]`),
    ]),
  }),
  decode: decodeMap,
});

/**
 * A `Set` has the same internal-slot problem as a `Map`, with one value per entry instead of two.
 */
SerializableRegistry.register(Set, {
  id: 'Set',
  encode: (value, path) => ({
    values: [ ...value ].map((entryValue, index) => SaveEncoder.encode(entryValue, `${path}.values[${index}]`)),
  }),
  decode: (data, path) => new Set(
    data.values.map((value, index) => SaveDecoder.decode(value, null, `${path}.values[${index}]`))),
});

/**
 * The engine's own reference type: it stores a data class and an id and looks the row up, rather
 * than embedding a copy of it. Nothing else in the vanilla graph follows that example, which is the
 * gap Phase 4's lineage work closes for refined equipment.
 */
SerializableRegistry.register(Game_Item, {
  id: 'game-item',
  aliases: [ 'Game_Item' ],
  seed: instance =>
  {
    instance._dataClass = String.empty;
    instance._itemId = 0;
  },
});

/**
 * Battle outcome flags for one action. Wholly transient in spirit but persisted by the engine, and
 * `clear()` is exactly the set of defaults its constructor establishes.
 */
SerializableRegistry.register(Game_ActionResult, {
  id: 'game-action-result',
  aliases: [ 'Game_ActionResult' ],
  seed: instance => instance.clear(),
});

/**
 * Global flags and audio state. Holds no instances at all- the bgm/bgs/me fields are plain audio
 * descriptors, not classes.
 */
SerializableRegistry.register(Game_System, {
  id: 'game-system',
  aliases: [ 'Game_System' ],
  seed: instance =>
  {
    instance._saveEnabled = true;
    instance._menuEnabled = true;
    instance._encounterEnabled = true;
    instance._formationEnabled = true;
    instance._battleCount = 0;
    instance._winCount = 0;
    instance._escapeCount = 0;
    instance._saveCount = 0;
    instance._versionId = 0;
    instance._savefileId = 0;
    instance._framesOnSave = 0;
    instance._bgmOnSave = null;
    instance._bgsOnSave = null;
    instance._windowTone = null;
    instance._battleBgm = null;
    instance._victoryMe = null;
    instance._defeatMe = null;
    instance._savedBgm = null;
    instance._walkingBgm = null;
  },
});

/**
 * The event-driven countdown, distinct from every `JABS_Timer` in the project.
 */
SerializableRegistry.register(Game_Timer, {
  id: 'game-timer',
  aliases: [ 'Game_Timer' ],
  seed: instance =>
  {
    instance._frames = 0;
    instance._working = false;
  },
});

/**
 * Switch values, as a sparse array indexed by switch id.
 */
SerializableRegistry.register(Game_Switches, {
  id: 'game-switches',
  aliases: [ 'Game_Switches' ],
  seed: instance => instance.clear(),
});

/**
 * Variable values, as a sparse array indexed by variable id.
 */
SerializableRegistry.register(Game_Variables, {
  id: 'game-variables',
  aliases: [ 'Game_Variables' ],
  seed: instance => instance.clear(),
});

/**
 * Self-switch values, keyed by a `mapId,eventId,letter` tuple rendered as a string.
 */
SerializableRegistry.register(Game_SelfSwitches, {
  id: 'game-self-switches',
  aliases: [ 'Game_SelfSwitches' ],
  seed: instance => instance.clear(),
});

/**
 * Screen effects. `_pictures` is a sparse array of `Game_Picture`, which is the only instance-valued
 * field on the class- everything else is a tone array or a scalar.
 */
SerializableRegistry.register(Game_Screen, {
  id: 'game-screen',
  aliases: [ 'Game_Screen' ],
  typed: {
    _pictures: Game_Picture,
  },
  seed: instance => instance.clear(),
});

/**
 * One picture on the screen. Held only through {@link Game_Screen}.
 */
SerializableRegistry.register(Game_Picture, {
  id: 'game-picture',
  aliases: [ 'Game_Picture' ],
  seed: instance =>
  {
    instance.initBasic();
    instance.initTarget();
    instance.initTone();
    instance.initRotation();
  },
});

/**
 * The actor roster. `_data` is sparse and indexed by actor id, and every entry is a live actor.
 */
SerializableRegistry.register(Game_Actors, {
  id: 'game-actors',
  aliases: [ 'Game_Actors' ],
  typed: {
    _data: Game_Actor,
  },
  seed: instance =>
  {
    instance._data = [];
  },
});

/**
 * One actor.
 *
 * The five transients are J-Base's own derived caches, and every one of them is *lazy* - each reader
 * is guarded by a strict `!== null` test that rebuilds on a miss. That is why the cold value is the
 * whole answer here, and why it must be `null` rather than absent: a field that decodes as
 * `undefined` passes that guard and hands the caller `undefined` instead of rebuilding.
 *
 * `_equips` holds `Game_Item`s and `_skills` holds skill *ids*; `_exp` is an id-to-number map. The
 * two `_last*Skill` fields are `Game_Item`s, both assigned in `initMembers`.
 */
SerializableRegistry.register(Game_Actor, {
  id: 'game-actor',
  aliases: [ 'Game_Actor' ],
  typed: {
    _equips: Game_Item,
    _lastMenuSkill: Game_Item,
    _lastBattleSkill: Game_Item,
    _actions: Game_Action,
    _result: Game_ActionResult,
  },
  transients: {
    '_j._base._cachedTraitObjects': () => null,
    '_j._base._cachedAllTraits': () => null,
    '_j._base._cachedAllNotes': () => null,
    '_j._base._cachedMaxTpBonuses': () => null,
    '_j._base._cachedHarFactor': () => null,
  },
});

/**
 * One queued action for a battler. Not present in a map save, but reachable from `_actions`.
 */
SerializableRegistry.register(Game_Action, {
  id: 'game-action',
  aliases: [ 'Game_Action' ],
  typed: {
    _item: Game_Item,
  },
  seed: instance => instance.clear(),
});

/**
 * The party.
 *
 * Read the type map against the temptation to add to it: `_actors` is an array of actor **ids**, and
 * `_items` / `_weapons` / `_armors` are plain id-to-count maps. `_lastItem` is the only field on the
 * class that genuinely holds an instance.
 */
SerializableRegistry.register(Game_Party, {
  id: 'game-party',
  aliases: [ 'Game_Party' ],
  typed: {
    _lastItem: Game_Item,
  },
  seed: instance =>
  {
    instance._inBattle = false;
    instance._gold = 0;
    instance._steps = 0;
    instance._lastItem = new Game_Item();
    instance._menuActorId = 0;
    instance._targetActorId = 0;
    instance._actors = [];
    instance.initAllItems();
  },
});

/**
 * The map.
 *
 * `_events` is typed even though the router never lifts `_j.*` slices off events: the events
 * themselves are still persisted by the engine, and it is only the plugin state hanging from them
 * that has a map-session lifetime.
 */
SerializableRegistry.register(Game_Map, {
  id: 'game-map',
  aliases: [ 'Game_Map' ],
  typed: {
    _interpreter: Game_Interpreter,
    _vehicles: Game_Vehicle,
    _events: Game_Event,
    _commonEvents: Game_CommonEvent,
  },
  seed: instance =>
  {
    instance._interpreter = new Game_Interpreter();
    instance._mapId = 0;
    instance._tilesetId = 0;
    instance._events = [];
    instance._commonEvents = [];
    instance._vehicles = [];
    instance._displayX = 0;
    instance._displayY = 0;
    instance._nameDisplay = true;
    instance._scrollDirection = 2;
    instance._scrollRest = 0;
    instance._scrollSpeed = 4;
    instance._parallaxName = String.empty;
    instance._parallaxZero = false;
    instance._parallaxLoopX = false;
    instance._parallaxLoopY = false;
    instance._parallaxSx = 0;
    instance._parallaxSy = 0;
    instance._parallaxX = 0;
    instance._parallaxY = 0;
    instance._battleback1Name = null;
    instance._battleback2Name = null;
    instance.createVehicles();
  },
});

/**
 * One map event. Reconstructed wholesale by `Game_Map.setupEvents` on the next map setup, which is
 * why every `_j.*` slice on one is transient- but the engine still persists the event itself.
 */
SerializableRegistry.register(Game_Event, {
  id: 'game-event',
  aliases: [ 'Game_Event' ],
});

/**
 * One parallel or autorun common event. Holds an interpreter while running.
 */
SerializableRegistry.register(Game_CommonEvent, {
  id: 'game-common-event',
  aliases: [ 'Game_CommonEvent' ],
  typed: {
    _interpreter: Game_Interpreter,
  },
  seed: instance =>
  {
    // `initialize` follows this with refresh(), which reads $dataCommonEvents and may build an
    // interpreter- real work, and therefore not a seed's business.
    instance._commonEventId = 0;
    instance._interpreter = null;
  },
});

/**
 * An event command interpreter. Nests: a `Show Choices` inside a called common event runs on a child.
 */
SerializableRegistry.register(Game_Interpreter, {
  id: 'game-interpreter',
  aliases: [ 'Game_Interpreter' ],
  typed: {
    _childInterpreter: Game_Interpreter,
  },
  seed: instance =>
  {
    instance._depth = 0;
    instance._branch = {};
    instance._indent = 0;
    instance._frameCount = 0;
    instance._freezeChecker = 0;
    instance.clear();
  },
});

/**
 * The player character. Owns the follower collection.
 */
SerializableRegistry.register(Game_Player, {
  id: 'game-player',
  aliases: [ 'Game_Player' ],
  typed: {
    _followers: Game_Followers,
  },
});

/**
 * The follower collection.
 *
 * Its `setup()` sizes `_data` from `$gameParty.maxBattleMembers()`, which at decode time would be
 * asking the throwaway party built by `createGameObjects`. The seed therefore stops short of it and
 * leaves the collection empty for the file to fill.
 */
SerializableRegistry.register(Game_Followers, {
  id: 'game-followers',
  aliases: [ 'Game_Followers' ],
  typed: {
    _data: Game_Follower,
  },
  seed: instance =>
  {
    instance._visible = $dataSystem.optFollowers;
    instance._gathering = false;
    instance._data = [];
  },
});

/**
 * One follower trailing the player.
 */
SerializableRegistry.register(Game_Follower, {
  id: 'game-follower',
  aliases: [ 'Game_Follower' ],
});

/**
 * One of the three vehicles. Persisted individually because a boarded vehicle carries the player's
 * position, and `refereshVehicles` only calls `refresh()` rather than rebuilding them.
 */
SerializableRegistry.register(Game_Vehicle, {
  id: 'game-vehicle',
  aliases: [ 'Game_Vehicle' ],
});
//endregion registerEngineSaveCodecs