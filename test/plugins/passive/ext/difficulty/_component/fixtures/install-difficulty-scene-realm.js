//region plugins/passive/ext/difficulty/_component/fixtures/install-difficulty-scene-realm.js
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

import { repoRoot } from '../../../../../../setup/repo-root.js';
import { installMinimalDatabase, installRmmzViewLayer } from '../../../../../../setup/rmmz-view-harness.js';

/**
 * The layers the scene tests open on: the default layer, one drive switched on, and one switched off.
 *
 * Crimson hands both sides ATK x2, and its enemy state also carries {@link SCENE_DRIVE_TAG}. Saffron hands the
 * party ATK x0.5 and MCR x0.5, and the enemies a state with no traits at all, so turning it on overlaps Crimson on
 * ATK (the merge case) and leaves one side with nothing to list (the empty case).
 * @type {object[]}
 */
export const SCENE_DIFFICULTY_LAYERS = [
  {
    key: '000_default',
    name: 'Default',
    iconIndex: 0,
    description: 'The default difficulty.',
    cost: 0,
    actorStateId: 0,
    enemyStateId: 0,
    enabled: true,
    unlocked: true,
    hidden: false,
  },
  {
    key: '001_crimson',
    name: 'Crimson',
    iconIndex: 0,
    description: 'The crimson drive.',
    cost: 3,
    actorStateId: 1,
    enemyStateId: 2,
    enabled: true,
    unlocked: true,
    hidden: false,
  },
  {
    key: '002_saffron',
    name: 'Saffron',
    iconIndex: 0,
    description: 'The saffron drive.',
    cost: 2,
    actorStateId: 3,
    enemyStateId: 4,
    enabled: false,
    unlocked: true,
    hidden: false,
  },
];

/**
 * A tag only this realm declares, carried by Crimson's enemy state. Nothing describes it unless a test registers
 * a describer for it, so it stands for both a described tag and one still waiting for its words.
 *
 * <pre>
 * Structure:
 *  <sceneDriveTag:AMOUNT>
 *
 * Example:
 *  <sceneDriveTag:5>
 * </pre>
 * @type {RegExp}
 */
export const SCENE_DRIVE_TAG = /<sceneDriveTag:(\d+)>/i;

/**
 * A raw state row in the shape RPG Maker writes it, carrying the given traits.
 * @param {number} id The state id.
 * @param {string} name The state name.
 * @param {object[]} traits The raw traits.
 * @param {string} [note] The note; every drive state hides itself from the passive list.
 * @returns {object}
 */
const stateRow = (id, name, traits, note = '<hideFromPassiveList>') => ({
  id,
  name,
  iconIndex: 0,
  description: '',
  note,
  traits,
  autoRemovalTiming: 0,
  chanceByDamage: 100,
  maxTurns: 1,
  minTurns: 1,
  message1: '',
  message2: '',
  message3: '',
  message4: '',
  messageType: 1,
  motion: 0,
  overlay: 0,
  priority: 50,
  releaseByDamage: false,
  removeAtBattleEnd: false,
  removeByDamage: false,
  removeByRestriction: false,
  removeByWalking: false,
  restriction: 0,
  stepsToRemove: 100,
});

/**
 * Adds the drive states the layers name. Everything goes in before J-Base loads, because J-Base rewrites the
 * state table into its own models and a row added afterwards would stay raw.
 */
const seedDriveStates = () =>
{
  globalThis.$dataStates.push(
    stateRow(1, 'Crimson (Actors)', [ { code: 21, dataId: 2, value: 2 } ]),
    stateRow(2, 'Crimson (Enemies)', [ { code: 21, dataId: 2, value: 2 } ], '<hideFromPassiveList>\n<sceneDriveTag:5>'),
    stateRow(3, 'Saffron (Actors)', [ { code: 21, dataId: 2, value: 0.5 }, { code: 23, dataId: 4, value: 0.5 } ]),
    stateRow(4, 'Saffron (Enemies)', []));
};

/**
 * Runs a shipped bundle in this realm, the way the game's plugin loader would.
 * @param {string} relativePath The bundle's path under `out/`.
 */
const loadBundle = relativePath =>
{
  // read from `out/`, which `hotfix` and `bun run test` both rebuild before the suite runs.
  const bundle = path.join(repoRoot, 'out', relativePath);
  vm.runInThisContext(fs.readFileSync(bundle, 'utf-8'), { filename: bundle });
};

/**
 * Stands up the real engine with J-Base as shipped, and J-Passive-Difficulty's bootstrap and battler hooks
 * from source, then a world whose difficulty system is set up from {@link SCENE_DIFFICULTY_LAYERS} the way a
 * new game sets it up.
 *
 * J-Base arrives as its bundle, because a plugin source file may never import across a ship boundary and its
 * globals are what this plugin is written against. J-Passive is reduced to the two battler methods a difficulty
 * refresh calls: turning a layer on refreshes every actor's passive states, and the actor hook captures the
 * passive source list when it loads. Which states then reach each battler is J-Passive's business, and none of
 * the scene's.
 * @returns {Promise<void>}
 */
export async function installDifficultySceneRealm()
{
  installRmmzViewLayer();
  installMinimalDatabase();
  seedDriveStates();

  // every plugin reads its parameters by name. These are the editor's values for the three.
  globalThis.$plugins = [
    {
      name: 'J-Base',
      status: true,
      parameters: {
        actorBaseTp: '0',
        enemyBaseTp: '100',
        newGameCommonEventId: '0',
      },
    },
    {
      name: 'J-Passive',
      status: true,
      parameters: {
        menuSettings: '',
        menuSwitch: '0',
        menuCommandName: 'Passives',
        menuCommandIcon: '191',
      },
    },
    {
      name: 'J-Passive-Difficulty',
      status: true,
      parameters: {
        difficultyConfigs: '',
        initialPoints: '10',
        defaultDifficulty: '000_default',
      },
    },
  ];
  const realParameters = globalThis.PluginManager.parameters.bind(globalThis.PluginManager);
  globalThis.PluginManager.parameters = name =>
  {
    const found = globalThis.$plugins.find(plugin => plugin.name === name);

    return found
      ? found.parameters
      : realParameters(name);
  };

  // the difficulty configuration is read from disk at boot; this realm answers with the layers above.
  const realFsReadFile = globalThis.StorageManager.fsReadFile.bind(globalThis.StorageManager);
  globalThis.StorageManager.fsReadFile = filePath => (filePath === 'data/config.difficulty.json'
    ? JSON.stringify(SCENE_DIFFICULTY_LAYERS)
    : realFsReadFile(filePath));

  loadBundle('base/J-Base.js');

  // normally Scene_Boot's job: the parameter catalog the effect rows read to decide what is easier.
  globalThis.VanillaParameterRegistration.registerAll();

  // J-Passive's bundle cannot load here: as it loads, it extends J-CMS-Equip's equipment window and
  // J-Base-Save's actor save codec, and neither ship is in this realm. What the scene needs from J-Passive is
  // the namespace this plugin extends and the two battler methods a difficulty refresh calls, so those stand in.
  globalThis.J.PASSIVE = {};
  globalThis.Game_Battler.prototype.getPassiveStateSources = function()
  {
    return [];
  };
  globalThis.Game_Battler.prototype.refreshPassiveStates = function()
  {
  };

  // the build-time defines `initialization.js` reads, which only exist inside a bundle.
  globalThis.__PLUGIN_NAME__ = 'J-Passive-Difficulty';
  globalThis.__PLUGIN_VERSION__ = '2.2.2';
  await import('../../../../../../../src/plugins/passive/ext/difficulty/_metadata/initialization.js');
  await import('../../../../../../../src/plugins/passive/ext/difficulty/objects/Game_System.js');
  await import('../../../../../../../src/plugins/passive/ext/difficulty/objects/Game_Temp.js');
  await import('../../../../../../../src/plugins/passive/ext/difficulty/objects/Game_Actor.js');
  await import('../../../../../../../src/plugins/passive/ext/difficulty/objects/Game_Enemy.js');

  // rebuild the world now that every plugin is in place, then set up difficulty the way a new game does.
  globalThis.DataManager.rewriteDatabaseData();
  globalThis.DataManager.createGameObjects();
  globalThis.$gameParty.setupStartingMembers();
  globalThis.$gameTemp.setupDifficultySystem();
}
//endregion plugins/passive/ext/difficulty/_component/fixtures/install-difficulty-scene-realm.js
