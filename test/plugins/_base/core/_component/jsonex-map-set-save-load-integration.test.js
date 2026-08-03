//region plugins/_base/_component/jsonex-map-set-save-load-integration.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { installRealRmmzEngine } from '../../../../setup/rmmz-engine-loader.js';

/**
 * Proves the Map/Set fix survives the *actual* save/load path, not just JsonEx.makeDeepCopy in
 * isolation. Confirmed by reading project/js/rmmz_managers.js directly:
 *   - StorageManager.saveObject()  -> objectToJson() -> `JsonEx.stringify(object)`, then zip+file I/O.
 *   - StorageManager.loadObject()  -> file I/O+unzip -> jsonToObject() -> `JsonEx.parse(json)`.
 * So the zip/file-I/O steps are pure text (de)compression around a JsonEx.stringify() string- they
 * never see or alter object shape, which means a JsonEx.stringify()/parse() round-trip on a real
 * DataManager.makeSaveContents()-shaped envelope IS the real save/load path for data-shape purposes,
 * without needing a fake NW.js filesystem or zip library in the test environment.
 *
 * rmmz_managers.js itself can't be loaded wholesale by the engine loader- ImageManager sets
 * `_emptyBitmap = new Bitmap(1, 1)` as a module-level side effect, which needs a real `document` for
 * canvas creation (confirmed by trying to load it and getting `ReferenceError: document is not
 * defined` from inside Bitmap's constructor). So DataManager.makeSaveContents/extractSaveContents are
 * reproduced verbatim below (they're pure key-assignment, copied directly from rmmz_managers.js) rather
 * than imported, while JsonEx.stringify/parse- the actual mechanism under test- are the real, engine-
 * loaded functions, not a reimplementation.
 */
describe('J-Base JsonEx Map/Set fix survives a real save/load envelope round-trip', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installRealRmmzEngine();

    // JsonEx's default decode fallback resolves classes via `window[constructorName]`- emulate the
    // browser global object the same way the rest of this repo's fixtures do.
    globalThis.window = globalThis;

    globalThis.PluginManager = { parameters: () => ({ actorBaseTp: '0', enemyBaseTp: '100' }) };
    globalThis.ColorManager = { textColor: () => 0, itemBackColor1: () => 0, itemBackColor2: () => 0 };
    globalThis.PanelRarity = { fromRarityToColor: () => 0 };
    globalThis.DataManager = {
      isDatabaseLoaded: () => true,
      setupNewGame: () => {},
      extractSaveContents: () => {},
      setupBattleTest: () => {},
    };
    globalThis.ImageManager = {};
    globalThis.SoundManager = {};
    globalThis.StorageManager = {};
    globalThis.TextManager = {};
    globalThis.IconManager = {};
    globalThis.__PLUGIN_NAME__ = 'J-Base';
    globalThis.__PLUGIN_VERSION__ = '0.0.0-test';

    await import('../../../../../src/plugins/_base/core/_metadata/initialization.js');

    // the fix under test- patches the real, engine-provided JsonEx._encode/_decode.
    await import('../../../../../src/plugins/_base/core/core/JsonEx.js');
  });

  /**
   * Verbatim from DataManager.makeSaveContents() in project/js/rmmz_managers.js (see file banner).
   */
  function makeSaveContents()
  {
    const contents = {};
    contents.system = globalThis.$gameSystem;
    contents.screen = globalThis.$gameScreen;
    contents.timer = globalThis.$gameTimer;
    contents.switches = globalThis.$gameSwitches;
    contents.variables = globalThis.$gameVariables;
    contents.selfSwitches = globalThis.$gameSelfSwitches;
    contents.actors = globalThis.$gameActors;
    contents.party = globalThis.$gameParty;
    contents.map = globalThis.$gameMap;
    contents.player = globalThis.$gamePlayer;
    return contents;
  }

  /**
   * Verbatim from DataManager.extractSaveContents() in project/js/rmmz_managers.js (see file banner).
   */
  function extractSaveContents(contents)
  {
    globalThis.$gameSystem = contents.system;
    globalThis.$gameScreen = contents.screen;
    globalThis.$gameTimer = contents.timer;
    globalThis.$gameSwitches = contents.switches;
    globalThis.$gameVariables = contents.variables;
    globalThis.$gameSelfSwitches = contents.selfSwitches;
    globalThis.$gameActors = contents.actors;
    globalThis.$gameParty = contents.party;
    globalThis.$gameMap = contents.map;
    globalThis.$gamePlayer = contents.player;
  }

  /**
   * Seeds the real $game* singletons the same way DataManager.setupNewGame() does- these are the
   * actual engine classes (Game_Party, Game_System, etc.), not stand-ins. $gameMap/$gamePlayer are
   * left null- constructing a real Game_Map drags in vehicle/sprite setup that reaches into
   * ImageManager, which is UI territory unrelated to what this test proves, and neither field is
   * where either test's Map/Set lives.
   */
  function seedGameGlobals()
  {
    globalThis.$gameSystem = new globalThis.Game_System();
    globalThis.$gameScreen = new globalThis.Game_Screen();
    globalThis.$gameTimer = new globalThis.Game_Timer();
    globalThis.$gameSwitches = new globalThis.Game_Switches();
    globalThis.$gameVariables = new globalThis.Game_Variables();
    globalThis.$gameSelfSwitches = new globalThis.Game_SelfSwitches();
    globalThis.$gameActors = new globalThis.Game_Actors();
    globalThis.$gameParty = new globalThis.Game_Party();
    globalThis.$gameMap = null;
    globalThis.$gamePlayer = null;
  }

  it('restores a Map field on $gameParty through the real save-envelope round-trip', () =>
  {
    seedGameGlobals();

    // simulate what sks/omni-style plugins do: a plugin-owned Map living directly on a real,
    // persisted Game_Party instance, with no plugin-side save/load reinit logic of its own.
    globalThis.$gameParty._j = { _sks: { _slotMap: new Map([ [ 0, 101 ], [ 1, 205 ] ]) } };

    // this is the actual save path for data-shape purposes (see file banner)- build the envelope,
    // serialize it, and parse it back, exactly as StorageManager.saveObject/loadObject do internally.
    const savedJson = globalThis.JsonEx.stringify(makeSaveContents());
    const restoredContents = globalThis.JsonEx.parse(savedJson);

    // simulate DataManager.loadGame() dropping the restored envelope back onto the $game* globals.
    extractSaveContents(restoredContents);

    expect(globalThis.$gameParty).toBeInstanceOf(globalThis.Game_Party);
    expect(globalThis.$gameParty._j._sks._slotMap).toBeInstanceOf(Map);
    expect(globalThis.$gameParty._j._sks._slotMap.get(0)).toBe(101);
    expect(globalThis.$gameParty._j._sks._slotMap.get(1)).toBe(205);
  });

  it('restores a Set field nested inside $gameSystem through the same envelope round-trip', () =>
  {
    seedGameGlobals();

    globalThis.$gameSystem._j = { _passive: { _uniquePassiveStateIds: new Set([ 12, 34, 56 ]) } };

    const savedJson = globalThis.JsonEx.stringify(makeSaveContents());
    const restoredContents = globalThis.JsonEx.parse(savedJson);
    extractSaveContents(restoredContents);

    expect(globalThis.$gameSystem._j._passive._uniquePassiveStateIds).toBeInstanceOf(Set);
    expect([ ...globalThis.$gameSystem._j._passive._uniquePassiveStateIds ]).toEqual([ 12, 34, 56 ]);
  });
});
//endregion plugins/_base/_component/jsonex-map-set-save-load-integration.test.js
