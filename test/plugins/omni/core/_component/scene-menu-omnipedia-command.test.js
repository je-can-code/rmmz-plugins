//region scene-menu-omnipedia-command.test
import { beforeAll, describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

import { repoRoot } from '../../../../setup/repo-root.js';
import { installMinimalDatabase, installRmmzViewLayer } from '../../../../setup/rmmz-view-harness.js';

/**
 * The Omnipedia's main-menu entry is a seam between two plugins that disagree about how to patch the
 * same two methods, and the disagreement is silent.
 *
 * J-CMS **overwrites** `Scene_Menu#createCommandWindow`, because it replaces the single command window
 * with two columns. J-Omnipedia **aliases** the same method to register its handler. Whichever loads
 * second wins: with J-Omnipedia first, J-CMS's overwrite discards the alias and the command still
 * renders but does nothing when pressed- which is the worst shape a defect can take, because the menu
 * looks correct.
 *
 * No service test can reach that. The command list, the column filter and the handler registration are
 * three different objects, and the bug only exists when all three are real. So this boots the actual
 * view layer and loads the actual bundles in the order the shipped game loads them.
 */
describe('Omnipedia main menu command under J-CMS (real view layer)', () =>
{
  /**
   * The switch J-Omnipedia gates its main menu command behind.
   * @type {number}
   */
  const IN_MAIN_MENU_SWITCH = 102;

  /**
   * A switch that is never the one the gate should consult.
   * @type {number}
   */
  const DECOY_SWITCH = 103;

  beforeAll(() =>
  {
    // Arrange: the real engine first, then the bundles on top of it.
    installRmmzViewLayer();
    installMinimalDatabase();

    globalThis.$plugins = [];

    const realParameters = globalThis.PluginManager.parameters.bind(globalThis.PluginManager);

    globalThis.PluginManager.parameters = name =>
    {
      const found = globalThis.$plugins.find(plugin => plugin.name === name);

      return found
        ? found.parameters
        : realParameters(name);
    };

    // the pedia extensions alias J-ABS globals that ship in another bundle entirely. Only their
    // existence matters here- nothing in this test executes a combat hook, and loading the whole ABS
    // bundle to satisfy a prototype read would drag in its own world of dependencies.
    globalThis.JABS_Engine = function JABS_Engine() {};
    globalThis.JABS_Battler = function JABS_Battler() {};
    globalThis.JABS_MetricsManager = { isItemSlot: () => false };
    globalThis.Game_Enemy = globalThis.Game_Enemy ?? function Game_Enemy() {};

    // the order here is the whole point of the test: it mirrors chef-adventure's plugins.js, where
    // J-CMS sits at line 7 and J-Omnipedia at 108.
    [
      'project/js/plugins/base/J-Base.js',
      'project/js/plugins/base/ext/J-Base-Save.js',
      'project/js/plugins/cms/core/J-CMS.js',
      'project/js/plugins/omni/J-Omnipedia.js',
      'project/js/plugins/omni/ext/J-OMNI-Monsters.js',
      'project/js/plugins/omni/ext/J-OMNI-Stats.js',
    ].forEach(relative =>
    {
      const bundle = path.join(repoRoot, relative);

      vm.runInThisContext(fs.readFileSync(bundle, 'utf-8'), { filename: bundle });
    });

    // Game_Switches silently ignores any id past the end of the database's switch table, and the
    // harness seeds a single entry. Without this the gate switch never turns on and the command
    // simply never appears- which reads exactly like the wiring being broken.
    while (globalThis.$dataSystem.switches.length <= 120)
    {
      globalThis.$dataSystem.switches.push('');
    }
  });

  /**
   * Builds one of the two real command columns.
   *
   * The columns are built directly rather than through `Scene_Menu#create`, because creating the whole
   * scene also builds the menu status window- which draws actor sprites and parameters, and so drags
   * in a whole equipment-hydration problem that has nothing to do with whether a menu command exists.
   * @param {Function} windowClass The column class to build.
   * @returns {object} The built column.
   */
  const buildColumn = windowClass => new windowClass(new globalThis.Rectangle(0, 0, 400, 400));

  /**
   * Finds the omnipedia command within a command window.
   * @param {object} window The command window to search.
   * @returns {object|undefined} The command, if the window rendered it.
   */
  const omnipediaCommandIn = window => window.commandList()
    .find(command => command.symbol === globalThis.J.OMNI.Metadata.Command.Symbol);

  describe('the command itself', () =>
  {
    it('renders in the party column when the switch is on', () =>
    {
      // Arrange: only the gate switch is on, so a gate reading its neighbour would find nothing.
      globalThis.$gameSwitches.setValue(IN_MAIN_MENU_SWITCH, true);
      globalThis.$gameSwitches.setValue(DECOY_SWITCH, false);

      // Act
      const partyColumn = buildColumn(globalThis.Window_MenuPartyCommand);

      // Assert
      const command = omnipediaCommandIn(partyColumn);
      expect(command).toBeDefined();
      expect(command.name).toBe('The Omnipedia');
    });

    it('stays out of the actor column', () =>
    {
      // Arrange: an untagged command defaults to the party section, so the actor column must reject it.
      globalThis.$gameSwitches.setValue(IN_MAIN_MENU_SWITCH, true);

      // Act
      const actorColumn = buildColumn(globalThis.Window_MenuActorCommand);

      // Assert: that column is not empty, so this is a rejection rather than an empty window.
      expect(actorColumn.commandList().length).toBeGreaterThan(0);
      expect(omnipediaCommandIn(actorColumn)).toBeUndefined();
    });

    it('is omitted entirely while the switch is off', () =>
    {
      // Arrange: the story has not granted the Omnipedia yet.
      globalThis.$gameSwitches.setValue(IN_MAIN_MENU_SWITCH, false);

      // Act
      const partyColumn = buildColumn(globalThis.Window_MenuPartyCommand);

      // Assert: the column still holds its vanilla commands, so this is the gate and not a dead menu.
      expect(partyColumn.commandList().length).toBeGreaterThan(0);
      expect(omnipediaCommandIn(partyColumn)).toBeUndefined();
    });
  });

  describe('the handler behind it', () =>
  {
    /**
     * Runs the real `Scene_Menu#createCommandWindow` chain against a scene stubbed down to only the
     * collaborators that method touches.
     *
     * The method under test is the genuine prototype chain- J-CMS's overwrite with J-Omnipedia's alias
     * wrapped around it- which is the only part that can break. Everything stubbed here is scene state
     * the chain merely passes through.
     * @returns {object} The stubbed scene, after the chain has run.
     */
    const runCreateCommandWindow = () =>
    {
      const scene = Object.create(globalThis.Scene_Menu.prototype);
      const actorColumn = buildColumn(globalThis.Window_MenuActorCommand);
      const partyColumn = buildColumn(globalThis.Window_MenuPartyCommand);

      scene.actorCommandWindow = () => actorColumn;
      scene.partyCommandWindow = () => partyColumn;
      scene.createActorCommandWindow = () => {};
      scene.createPartyCommandWindow = () => {};

      // J-CMS's own wiring of the vanilla commands, which is not what is under test here.
      scene.bindMenuCommandHandlers = () => {};

      // both columns describe their highlighted command into it; nothing here reads it back, but it
      // has to accept the description or setHelpWindow throws while wiring the columns up.
      const helpWindow = {
        setText() {},
        clear() {},
      };
      scene.helpWindow = () => helpWindow;

      scene.createCommandWindow();

      return scene;
    };

    it('binds the omnipedia handler onto the column that renders the command', () =>
    {
      // Arrange: this is the assertion the load-order hazard breaks. J-CMS overwrites
      // createCommandWindow while J-Omnipedia aliases it, so loading them the other way round leaves
      // the command rendered and inert- and every assertion above would still pass.
      globalThis.$gameSwitches.setValue(IN_MAIN_MENU_SWITCH, true);

      // Act
      const scene = runCreateCommandWindow();

      // Assert
      const symbol = globalThis.J.OMNI.Metadata.Command.Symbol;
      expect(scene.partyCommandWindow()
        .isHandled(symbol)).toBe(true);
    });

    it('opens the omnipedia scene when that handler fires', () =>
    {
      // Arrange: proving the handler exists says nothing about what it does.
      globalThis.$gameSwitches.setValue(IN_MAIN_MENU_SWITCH, true);
      const scene = runCreateCommandWindow();

      const realPush = globalThis.SceneManager.push;
      const pushed = [];
      globalThis.SceneManager.push = sceneClass => pushed.push(sceneClass);

      // Act
      try
      {
        scene.partyCommandWindow()
          .callHandler(globalThis.J.OMNI.Metadata.Command.Symbol);
      }
      finally
      {
        // spies on a bare global leak into later tests in this file, so this is restored by hand.
        globalThis.SceneManager.push = realPush;
      }

      // Assert
      expect(pushed).toEqual([ globalThis.Scene_Omnipedia ]);
    });
  });

  describe('the statistopedia inside it', () =>
  {
    /**
     * The switch J-OMNI-Monsters gates its omnipedia row behind.
     * @type {number}
     */
    const MONSTERPEDIA_SWITCH = 103;

    /**
     * The switch J-OMNI-Stats gates its omnipedia row behind.
     * @type {number}
     */
    const STATISTOPEDIA_SWITCH = 111;

    /**
     * Finds a pedia row in the omnipedia's root list.
     * @param {object} window The root list window.
     * @param {string} symbol The symbol to look for.
     * @returns {object|undefined} The row, if it was rendered.
     */
    const rowFor = (window, symbol) => window.commandList()
      .find(command => command.symbol === symbol);

    /**
     * Builds the omnipedia's root list.
     * @returns {object} The built window.
     */
    const buildRootList = () => new globalThis.Window_OmnipediaList(new globalThis.Rectangle(0, 0, 800, 400));

    /**
     * Runs the real `Scene_Omnipedia#onRootPediaSelection` chain with one row highlighted.
     *
     * Each pedia extension aliases this method and checks for its own symbol, falling through to the
     * previous one otherwise. That makes the chain the thing under test: an extension that returned
     * instead of calling through would strand every pedia loaded before it.
     * @param {string} symbol The symbol standing highlighted when the player confirms.
     * @returns {Function[]} The scene classes that got pushed.
     */
    const selectRootRow = symbol =>
    {
      const scene = Object.create(globalThis.Scene_Omnipedia.prototype);
      scene.getRootOmnipediaKey = () => symbol;
      scene.closeRootPediaWindows = () => {};

      const realPush = globalThis.SceneManager.push;
      const pushed = [];
      globalThis.SceneManager.push = sceneClass => pushed.push(sceneClass);

      try
      {
        scene.onRootPediaSelection();
      }
      finally
      {
        // spies on a bare global leak into later tests in this file, so this is restored by hand.
        globalThis.SceneManager.push = realPush;
      }

      return pushed;
    };

    it('renders a statistopedia row beside the monsterpedia', () =>
    {
      // Arrange: the sibling has to survive, or "renders every row" and "renders only mine" look alike.
      globalThis.$gameSwitches.setValue(MONSTERPEDIA_SWITCH, true);
      globalThis.$gameSwitches.setValue(STATISTOPEDIA_SWITCH, true);

      // Act
      const rootList = buildRootList();

      // Assert
      expect(rowFor(rootList, 'stats-pedia').name).toBe('Statistopedia');
      expect(rowFor(rootList, 'monster-pedia').name).toBe('Monsterpedia');
    });

    it('omits the statistopedia row while its own switch is off', () =>
    {
      // Arrange: the monsterpedia stays on, so an empty list cannot be what passes this.
      globalThis.$gameSwitches.setValue(MONSTERPEDIA_SWITCH, true);
      globalThis.$gameSwitches.setValue(STATISTOPEDIA_SWITCH, false);

      // Act
      const rootList = buildRootList();

      // Assert
      expect(rowFor(rootList, 'stats-pedia')).toBeUndefined();
      expect(rowFor(rootList, 'monster-pedia')).toBeDefined();
    });

    it('opens the statistopedia when its row is confirmed', () =>
    {
      // Arrange & Act
      const pushed = selectRootRow('stats-pedia');

      // Assert
      expect(pushed).toEqual([ globalThis.Scene_Statistopedia ]);
    });

    it('still opens the monsterpedia, which loaded before it', () =>
    {
      // Arrange: J-OMNI-Stats aliases the same selection method the monsterpedia already aliased. If
      // it answered for symbols that are not its own, this is the row that would stop working.
      const pushed = selectRootRow('monster-pedia');

      // Assert
      expect(pushed).toEqual([ globalThis.Scene_Monsterpedia ]);
    });
  });
});
//endregion scene-menu-omnipedia-command.test
