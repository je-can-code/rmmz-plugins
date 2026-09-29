//region plugins/class/core/scenes/scene-classes.test.js
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { installClassCoreRealm } from '../_component/fixtures/install-class-core-realm.js';

/**
 * The class scene, against the real engine, J-Base's facet skeleton, and real actors.
 *
 * Nearly everything here is a seam: which window holds the cursor after a handler runs, where each window
 * beside the list sits, whether those windows and the list agree about the highlighted class. None of that can
 * be extracted to a service, because every one of those is a statement about real objects and the engine
 * between them.
 */
describe('Scene_Classes', () =>
{
  let Scene_Classes;
  let restoreSideWindowDefinitions = null;

  /**
   * A window that only records what it was asked to show, standing in for an extension's window.
   */
  let RecordingWindow;

  /**
   * Builds and creates the scene the way an entry point does, already told whether it may change classes.
   * @param {boolean=} isChangingAllowed Whether confirming changes classes; defaults to true.
   * @returns {Scene_Classes} The created scene.
   */
  const buildScene = (isChangingAllowed = true) =>
  {
    const scene = new Scene_Classes();
    scene.prepare(isChangingAllowed);
    scene.create();

    return scene;
  };

  /**
   * Places recording windows beside the parameters, the way an extension would.
   * @param {number} count How many windows to place.
   */
  const addSideWindows = count =>
  {
    const original = Scene_Classes.prototype.sideWindowDefinitions;
    Scene_Classes.prototype.sideWindowDefinitions = function()
    {
      const definitions = original.call(this);
      const added = Array.from({ length: count }, () => ({
        createWindow: rectangle => new RecordingWindow(rectangle),
      }));
      definitions.push(...added);

      return definitions;
    };

    restoreSideWindowDefinitions = () =>
    {
      Scene_Classes.prototype.sideWindowDefinitions = original;
    };
  };

  /**
   * Reads a window's placement as one comparable array.
   * @param {Window_Base} window The window to read.
   * @returns {number[]} Its x, y, width and height.
   */
  const placementOf = window => [ window.x, window.y, window.width, window.height ];

  /**
   * Names the classes the scene's list is showing, in order.
   * @param {Scene_Classes} scene The scene to read.
   * @returns {string[]} The class names.
   */
  const listedNamesOf = scene => scene.classListWindow()
    .commandList()
    .map(command => command.name);

  beforeAll(async () =>
  {
    await installClassCoreRealm();

    ({ default: Scene_Classes } = await import('../../../../../src/plugins/class/core/scenes/Scene_Classes.js'));

    RecordingWindow = class extends globalThis.Window_Base
    {
      shown = [];

      showClass(actor, classId)
      {
        this.shown.push([ actor.actorId(), classId ]);
      }
    };
  });

  beforeEach(() =>
  {
    // actor 1 wears Brawler, with the starting class and Scholar unlocked beside it.
    const first = globalThis.$gameActors.actor(1);
    first.initClassMembers();
    first.changeClass(2, true);
    first.unlockClass(1);
    first.unlockClass(3);

    // actor 2 wears Void, with Brawler unlocked.
    const second = globalThis.$gameActors.actor(2);
    second.initClassMembers();
    second.changeClass(5, true);
    second.unlockClass(2);

    // the menu starts on actor 1.
    globalThis.$gameParty.setMenuActor(first);
  });

  afterEach(() =>
  {
    // every test that placed windows beside the parameters takes them away again.
    if (restoreSideWindowDefinitions !== null)
    {
      restoreSideWindowDefinitions();
      restoreSideWindowDefinitions = null;
    }
  });

  //region entry points
  describe('prepare()', () =>
  {
    it('receives whether the scene may change classes', () =>
    {
      // Arrange
      const scene = new Scene_Classes();

      // Act
      scene.prepare(true);

      // Assert
      expect(scene.isChangingAllowed())
        .toBe(true);
    });
  });
  //endregion entry points

  //region init
  describe('initMembers()', () =>
  {
    it('starts with no windows and changing not allowed', () =>
    {
      // Arrange
      // Act
      const scene = new Scene_Classes();

      // Assert
      expect(scene.classListWindow())
        .toBeNull();
      expect(scene.descriptionWindow())
        .toBeNull();
      expect(scene.parametersWindow())
        .toBeNull();
      expect(scene.sideWindows())
        .toEqual([]);
      expect(scene.isChangingAllowed())
        .toBe(false);
    });

    it('reaches Scene_Base through the whole initMembers chain', () =>
    {
      // Arrange
      // Act
      const scene = new Scene_Classes();

      // Assert- undefined here means a class in the chain overrode initMembers without calling super.
      expect(scene._j._modalDimmerWindow)
        .toBeNull();
    });
  });
  //endregion init

  //region create
  describe('create() on its own', () =>
  {
    it('lists the actor\'s classes', () =>
    {
      // Arrange
      // Act
      const scene = buildScene();

      // Assert- Pathfinder, set aside for actor 1 and still to unlock, last and unnamed.
      expect(listedNamesOf(scene))
        .toEqual([ 'Harness', 'Brawler', 'Scholar', '???' ]);
    });

    it('lands on the class being worn, and shows it beside the list', () =>
    {
      // Arrange
      // Act
      const scene = buildScene();

      // Assert- Brawler is the second row, so landing on the first row cannot pass.
      expect(scene.classListWindow()
        .index())
        .toBe(1);
      expect(scene.parametersWindow()
        .classId())
        .toBe(2);
    });

    it('lays the description across the top beside the list, showing the class being worn', () =>
    {
      // Arrange
      // Act
      const scene = buildScene();

      // Assert- two lines tall, across everything beside the command column.
      expect(placementOf(scene.descriptionWindow()))
        .toEqual([ 422, 60, 1498, 96 ]);
      expect(scene.descriptionWindow()
        .getText())
        .toBe('Hits first.\nAsks later.');
    });

    it('gives the parameters everything beneath the description, with nothing placed beside them', () =>
    {
      // Arrange
      // Act
      const scene = buildScene();

      // Assert- the full width beside the list, from the description's bottom edge down.
      expect(placementOf(scene.parametersWindow()))
        .toEqual([ 422, 156, 1498, 864 ]);
      expect(scene.sideWindows())
        .toEqual([]);
    });

    it('hands the list whether it may change classes, and its input', () =>
    {
      // Arrange
      // Act
      const scene = buildScene(true);

      // Assert
      const list = scene.classListWindow();
      expect(list.isChangingAllowed())
        .toBe(true);
      expect(list.active)
        .toBe(true);
      expect(list.isHandled('ok'))
        .toBe(true);
      expect(list.isHandled('actor-next'))
        .toBe(true);
    });
  });

  describe('create() with windows placed beside the parameters', () =>
  {
    it('splits the space beside the list, the parameters on the left and the placed window on the right', () =>
    {
      // Arrange
      addSideWindows(1);

      // Act
      const scene = buildScene();

      // Assert
      const [ sideWindow ] = scene.sideWindows();
      expect(placementOf(scene.parametersWindow()))
        .toEqual([ 422, 156, 749, 864 ]);
      expect(placementOf(sideWindow))
        .toEqual([ 1171, 156, 749, 864 ]);
    });

    it('shares the right half between every placed window, top to bottom', () =>
    {
      // Arrange
      addSideWindows(2);

      // Act
      const scene = buildScene();

      // Assert
      const [ upper, lower ] = scene.sideWindows();
      expect(placementOf(upper))
        .toEqual([ 1171, 156, 749, 432 ]);
      expect(placementOf(lower))
        .toEqual([ 1171, 588, 749, 432 ]);
    });

    it('shows the class being worn in every window beside the list', () =>
    {
      // Arrange
      addSideWindows(1);

      // Act
      const scene = buildScene();

      // Assert- actor 1, standing in Brawler.
      const [ sideWindow ] = scene.sideWindows();
      expect(sideWindow.shown.at(-1))
        .toEqual([ 1, 2 ]);
      expect(scene.parametersWindow()
        .classId())
        .toBe(2);
    });
  });

  describe('classListWindowRect()', () =>
  {
    it('runs the list down the command column, the full height of the region', () =>
    {
      // Arrange
      const scene = new Scene_Classes();

      // Act
      const rect = scene.classListWindowRect();

      // Assert
      const contentArea = scene.contentAreaRect();
      expect(rect.width)
        .toBe(scene.commandColumnWidth());
      expect(rect.height)
        .toBe(contentArea.height);
    });
  });

  describe('hasHelpWindow()', () =>
  {
    it('declines the help strip, since the windows beside the list describe everything', () =>
    {
      // Arrange
      const scene = new Scene_Classes();

      // Act
      const hasHelpWindow = scene.hasHelpWindow();

      // Assert
      expect(hasHelpWindow)
        .toBe(false);
    });
  });

  describe('controlLegendEntries()', () =>
  {
    /**
     * Lists the labels a scene's legend would show.
     * @param {Scene_Classes} scene The scene to read.
     * @returns {string[]} The labels.
     */
    const labelsOf = scene => scene.controlLegendEntries()
      .map(entry => entry.label);

    it('teaches confirming when the scene can change classes', () =>
    {
      // Arrange
      const scene = new Scene_Classes();
      scene.prepare(true);

      // Act
      const labels = labelsOf(scene);

      // Assert
      expect(labels)
        .toEqual([ 'change class', 'switch character', 'back' ]);
    });

    it('leaves confirming out when the scene only looks', () =>
    {
      // Arrange
      const scene = new Scene_Classes();
      scene.prepare(false);

      // Act
      const labels = labelsOf(scene);

      // Assert
      expect(labels)
        .toEqual([ 'switch character', 'back' ]);
    });
  });
  //endregion create

  //region actions
  describe('onClassHighlighted()', () =>
  {
    it('shows whichever class the cursor moves to, in every window beside the list', () =>
    {
      // Arrange
      addSideWindows(1);
      const scene = buildScene();

      // Act- moving the cursor fires the list's index hook, which is what the scene wired.
      scene.classListWindow()
        .select(2);

      // Assert
      const [ sideWindow ] = scene.sideWindows();
      expect(scene.parametersWindow()
        .classId())
        .toBe(3);
      expect(sideWindow.shown.at(-1))
        .toEqual([ 1, 3 ]);
    });

    it('puts every window beside the list away while a class still to unlock is highlighted', () =>
    {
      // Arrange
      addSideWindows(1);
      const scene = buildScene();

      // Act- the last row is Pathfinder, which actor 1 has yet to unlock.
      scene.classListWindow()
        .select(3);

      // Assert- hidden, and nothing about Pathfinder drawn: every window still holds Brawler, from before.
      const [ sideWindow ] = scene.sideWindows();
      const visibility = scene.detailWindows()
        .map(window => window.visible);
      expect(visibility)
        .toEqual([ false, false, false ]);
      expect(sideWindow.shown.at(-1))
        .toEqual([ 1, 2 ]);
      expect(scene.parametersWindow()
        .classId())
        .toBe(2);
    });

    it('brings every window back once the cursor moves on to a class it can show', () =>
    {
      // Arrange
      addSideWindows(1);
      const scene = buildScene();
      const list = scene.classListWindow();
      list.select(3);

      // Act
      list.select(2);

      // Assert
      const [ sideWindow ] = scene.sideWindows();
      const visibility = scene.detailWindows()
        .map(window => window.visible);
      expect(visibility)
        .toEqual([ true, true, true ]);
      expect(sideWindow.shown.at(-1))
        .toEqual([ 1, 3 ]);
    });
  });

  describe('onClassOk()', () =>
  {
    it('changes into the highlighted class and marks it as worn', () =>
    {
      // Arrange
      const scene = buildScene();
      scene.classListWindow()
        .select(2);

      // Act
      scene.onClassOk();

      // Assert
      const actor = globalThis.$gameActors.actor(1);
      expect(actor.currentClass().id)
        .toBe(3);
      expect(scene.classListWindow()
        .classColorIndex(globalThis.$dataClasses[3]))
        .toBe(6);
    });

    it('stays on the class just changed into when the class left behind drops out of the list', () =>
    {
      // Arrange- actor 1 now wears the starting class, which was never unlocked, so leaving it removes a
      // row above the cursor and would slide the cursor onto the wrong class.
      const actor = globalThis.$gameActors.actor(1);
      actor.initClassMembers();
      actor.changeClass(1, true);
      actor.unlockClass(2);
      actor.unlockClass(3);
      const scene = buildScene();
      scene.classListWindow()
        .select(2);

      // Act
      scene.onClassOk();

      // Assert
      expect(listedNamesOf(scene))
        .toEqual([ 'Brawler', 'Scholar', '???' ]);
      expect(scene.highlightedClass().id)
        .toBe(3);
      expect(scene.parametersWindow()
        .classId())
        .toBe(3);
    });

    it('hands the list back its input, which the confirm took away', () =>
    {
      // Arrange
      const scene = buildScene();
      const list = scene.classListWindow();
      list.select(2);
      list.deactivate();

      // Act
      scene.onClassOk();

      // Assert
      expect(list.active)
        .toBe(true);
    });
  });

  describe('onActorChange()', () =>
  {
    it('lists the next actor\'s classes and lands on the one they wear', () =>
    {
      // Arrange
      const scene = buildScene();

      // Act
      scene.onCycleActorRight();

      // Assert- Void is the second row, so staying on the first row cannot pass. Warden is set aside for actor 2.
      expect(listedNamesOf(scene))
        .toEqual([ 'Brawler', 'Void', '???' ]);
      expect(scene.highlightedClass().id)
        .toBe(5);
      expect(scene.parametersWindow()
        .actor()
        .actorId())
        .toBe(2);
    });

    it('hands the list back its input, which the cycle took away', () =>
    {
      // Arrange
      const scene = buildScene();
      scene.classListWindow()
        .deactivate();

      // Act
      scene.onCycleActorRight();

      // Assert
      expect(scene.classListWindow().active)
        .toBe(true);
    });
  });
  //endregion actions
});
//endregion plugins/class/core/scenes/scene-classes.test.js