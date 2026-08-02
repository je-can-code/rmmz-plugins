//region scene-menu-facet-base.test
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

import { repoRoot } from '../../../../setup/repo-root.js';
import {
  clearDrawnText,
  drawnText,
  installMinimalDatabase,
  installRmmzViewLayer,
} from '../../../../setup/rmmz-view-harness.js';

/**
 * These tests run against the real view layer rather than stubs, which is what makes them worth
 * writing: the defects they guard are seams between objects, and a seam only exists once both
 * objects are genuine. Stubbing `Scene_Base` to a no-op would make every assertion here circular.
 */
describe('Scene_MenuFacetBase', () =>
{
  beforeAll(() =>
  {
    // Arrange: boot the real engine view layer, then J-Base's patches on top of it.
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

    const bundle = path.join(repoRoot, 'project/js/plugins/J-Base.js');

    vm.runInThisContext(fs.readFileSync(bundle, 'utf-8'), { filename: bundle });
  });

  beforeEach(() =>
  {
    clearDrawnText();
  });

  it('seeds the modal dimmer field, proving the initMembers chain reaches Scene_Base', () =>
  {
    // Arrange & Act: construct the scene, which runs the whole initMembers cascade.
    const scene = new globalThis.Scene_MenuFacetBase();

    // Assert: null means Scene_Base's initMembers ran. undefined means a subclass in the chain
    // overrode initMembers without calling super, and every modal in every facet scene will throw.
    expect(scene._j._modalDimmerWindow).toBeNull();
  });

  it('builds the shared chrome when created', () =>
  {
    // Arrange
    const scene = new globalThis.Scene_MenuFacetBase();

    // Act
    scene.create();

    // Assert: the facet skeleton owns the control legend, so the layer is never empty.
    expect(scene._windowLayer.children.length).toBeGreaterThan(0);
  });

  it('shows a modal dimmer without throwing once the chain is intact', () =>
  {
    // Arrange
    const scene = new globalThis.Scene_MenuFacetBase();
    scene.create();
    const [ anchor ] = scene._windowLayer.children;

    // Act
    scene.showModalDimmer(200, anchor);

    // Assert: the dimmer parents itself directly beneath the anchor window.
    const dimmer = scene.getModalDimmerWindow();
    expect(dimmer.visible).toBe(true);
    expect(scene._windowLayer.getChildIndex(dimmer))
      .toBeLessThan(scene._windowLayer.getChildIndex(anchor));
  });

  it('hides the dimmer without rebuilding it', () =>
  {
    // Arrange
    const scene = new globalThis.Scene_MenuFacetBase();
    scene.create();
    scene.showModalDimmer(200, scene._windowLayer.children[0]);
    const dimmer = scene.getModalDimmerWindow();

    // Act
    scene.hideModalDimmer();

    // Assert: the same instance survives, so the next modal reuses it.
    expect(dimmer.visible).toBe(false);
    expect(scene.getModalDimmerWindow()).toBe(dimmer);
  });

  it('skips teardown entirely when no dimmer was ever summoned', () =>
  {
    // Arrange: a scene that never opened a modal has a null field, not a window.
    const scene = new globalThis.Scene_MenuFacetBase();

    // Act
    scene.hideModalDimmer();

    // Assert: asking to hide must not lazily build one purely to switch it off.
    expect(scene.hasModalDimmerWindow()).toBe(false);
  });
});

describe('the view harness itself', () =>
{
  beforeAll(() =>
  {
    installRmmzViewLayer();
    installMinimalDatabase();
  });

  beforeEach(() =>
  {
    clearDrawnText();
  });

  it('records what a window chose to draw', () =>
  {
    // Arrange
    const window = new globalThis.Window_Base(new globalThis.Rectangle(0, 0, 400, 200));

    // Act
    window.drawText('Rupert', 0, 0, 200);

    // Assert
    expect(drawnText).toContain('Rupert');
  });

  it('computes real inner geometry from the engine padding', () =>
  {
    // Arrange & Act
    const window = new globalThis.Window_Base(new globalThis.Rectangle(0, 0, 400, 200));

    // Assert: 400 less twice the 12px padding the engine actually applies.
    expect(window.innerWidth).toBe(376);
  });

  it('deactivates a command window when a handler is dispatched', () =>
  {
    // Arrange: vanilla processOk deactivates before calling the handler, which is why every
    // apply-in-place handler has to hand the cursor back deliberately. A real subclass is needed
    // because Window_Command rebuilds its list on every refresh from makeCommandList.
    class Window_HarnessProbe
      extends globalThis.Window_Command
    {
      makeCommandList()
      {
        this.addCommand('Alpha', 'alpha');
      }
    }

    const window = new Window_HarnessProbe(new globalThis.Rectangle(0, 0, 400, 200));
    window.setHandler('alpha', () => {});
    window.select(0);
    window.activate();

    // Act
    window.processOk();

    // Assert
    expect(window.active).toBe(false);
  });
});
//endregion scene-menu-facet-base.test
