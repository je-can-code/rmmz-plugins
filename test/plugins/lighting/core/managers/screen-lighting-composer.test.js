//region plugins/lighting/core/managers/screen-lighting-composer.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { installLightingHostGlobals } from '../../fixtures/install-lighting-host-globals.js';

describe('ScreenLightingComposer', () =>
{
  let ScreenLightingComposer;
  let AmbientDeclaration;
  let LightDeclaration;
  let ToneDeclaration;

  const torch = { id: 'torch' };
  const lantern = { id: 'lantern' };

  /**
   * Advances the engine's frame counter, since the composer does its work once per frame.
   */
  const nextFrame = () =>
  {
    Graphics.frameCount += 1;
  };

  beforeAll(async () =>
  {
    vi.resetModules();
    installLightingHostGlobals();
    globalThis.Graphics = { frameCount: 0 };

    ({ default: ScreenLightingComposer } =
      await import('../../../../../src/plugins/lighting/core/managers/ScreenLightingComposer.js'));
    ({ default: AmbientDeclaration } =
      await import('../../../../../src/plugins/lighting/core/models/AmbientDeclaration.js'));
    ({ default: LightDeclaration } =
      await import('../../../../../src/plugins/lighting/core/models/LightDeclaration.js'));
    ({ default: ToneDeclaration } =
      await import('../../../../../src/plugins/lighting/core/models/ToneDeclaration.js'));
  });

  beforeEach(() =>
  {
    ScreenLightingComposer.reset();
    Graphics.frameCount = 100;
  });

  describe('compose', () =>
  {
    it('reports nothing at all when no source has declared anything', () =>
    {
      // Arrange
      // Act
      const result = ScreenLightingComposer.compose();

      // Assert
      expect(result.tone()).toEqual([ 0, 0, 0, 0 ]);
      expect(result.darkness()).toBe(0);
      expect(result.lights()).toEqual([]);
    });

    it('does the work of a frame once, however many consumers ask for it', () =>
    {
      // Arrange
      ScreenLightingComposer.declareTone('command', new ToneDeclaration([ 100, 0, 0, 0 ], 4, 'command'));
      nextFrame();
      const first = ScreenLightingComposer.compose();
      const afterOne = first.tone()
        .at(0);

      // Act
      const second = ScreenLightingComposer.compose();

      // Assert
      // the colour filter and the mask both ask, at different points in the render walk. advancing
      // the fade for whichever asked first would make its speed depend on the plugin list.
      expect(second).toBe(first);
      expect(second.tone()
        .at(0)).toBe(afterOne);
    });

    it('advances the journey again once the frame has moved on', () =>
    {
      // Arrange
      ScreenLightingComposer.declareTone('command', new ToneDeclaration([ 100, 0, 0, 0 ], 4, 'command'));
      nextFrame();
      const afterOne = ScreenLightingComposer.compose()
        .tone()
        .at(0);

      // Act
      nextFrame();
      const afterTwo = ScreenLightingComposer.compose()
        .tone()
        .at(0);

      // Assert
      expect(afterTwo).toBeGreaterThan(afterOne);
    });
  });

  describe('tone', () =>
  {
    it('travels toward a declared colour rather than snapping to it', () =>
    {
      // Arrange
      ScreenLightingComposer.declareTone('command', new ToneDeclaration([ 100, 0, 0, 0 ], 4, 'command'));

      // Act
      nextFrame();
      const result = ScreenLightingComposer.compose();

      // Assert
      expect(result.tone()).toEqual([ 25, 0, 0, 0 ]);
    });

    it('arrives exactly on the final frame of the journey', () =>
    {
      // Arrange
      ScreenLightingComposer.declareTone('command', new ToneDeclaration([ 100, 0, 0, 0 ], 4, 'command'));

      // Act
      for (let step = 0; step < 4; step++)
      {
        nextFrame();
        ScreenLightingComposer.compose();
      }

      // Assert
      expect(ScreenLightingComposer.compose()
        .tone()).toEqual([ 100, 0, 0, 0 ]);
    });

    it('hands the screen to the most assertive source that wants it', () =>
    {
      // Arrange
      ScreenLightingComposer.declareTone('time', new ToneDeclaration([ -100, -100, -30, 100 ], 1, 'time'));
      ScreenLightingComposer.declareTone('command', new ToneDeclaration([ 68, 0, 0, 0 ], 1, 'command'));

      // Act
      nextFrame();
      const result = ScreenLightingComposer.compose();

      // Assert
      // a red cutscene tint at night reads as red, not as red plus blue.
      expect(result.tone()).toEqual([ 68, 0, 0, 0 ]);
    });

    it('gives the screen back to the next source down when the winner withdraws', () =>
    {
      // Arrange
      ScreenLightingComposer.declareTone('time', new ToneDeclaration([ -100, -100, -30, 100 ], 1, 'time'));
      ScreenLightingComposer.declareTone('command', new ToneDeclaration([ 68, 0, 0, 0 ], 1, 'command'));
      nextFrame();
      ScreenLightingComposer.compose();

      // Act
      ScreenLightingComposer.declareTone('command', new ToneDeclaration([ 0, 0, 0, 0 ], 1, 'command'));
      nextFrame();
      const result = ScreenLightingComposer.compose();

      // Assert
      // the cutscene handing the screen back must not wipe the night flat - the clock still wants it.
      expect(result.tone()).toEqual([ -100, -100, -30, 100 ]);
    });

    it('falls all the way back to no colour when the last source withdraws', () =>
    {
      // Arrange
      ScreenLightingComposer.declareTone('command', new ToneDeclaration([ 68, 0, 0, 0 ], 1, 'command'));
      nextFrame();
      ScreenLightingComposer.compose();

      // Act
      ScreenLightingComposer.declareTone('command', new ToneDeclaration([ 0, 0, 0, 0 ], 1, 'command'));
      nextFrame();
      const result = ScreenLightingComposer.compose();

      // Assert
      expect(result.tone()).toEqual([ 0, 0, 0, 0 ]);
    });

    it('changes course when the same source asks for a different colour', () =>
    {
      // Arrange
      ScreenLightingComposer.declareTone('command', new ToneDeclaration([ 100, 0, 0, 0 ], 1, 'command'));
      nextFrame();
      ScreenLightingComposer.compose();

      // Act
      ScreenLightingComposer.declareTone('command', new ToneDeclaration([ 0, 0, 100, 0 ], 1, 'command'));
      nextFrame();
      const result = ScreenLightingComposer.compose();

      // Assert
      // a cutscene changing its mind has to be heard; the same source is not the same request.
      expect(result.tone()).toEqual([ 0, 0, 100, 0 ]);
    });

    it('takes as long to hand the screen back as the withdrawing source asked for', () =>
    {
      // Arrange
      ScreenLightingComposer.declareTone('command', new ToneDeclaration([ 100, 0, 0, 0 ], 1, 'command'));
      nextFrame();
      ScreenLightingComposer.compose();

      // Act
      // the neutral target is the withdrawal, and its duration is how long the handover takes.
      ScreenLightingComposer.declareTone('command', new ToneDeclaration([ 0, 0, 0, 0 ], 4, 'command'));
      nextFrame();
      const result = ScreenLightingComposer.compose();

      // Assert
      // a quarter of the way home rather than all of it, which is what a duration of 1 would give.
      expect(result.tone()).toEqual([ 75, 0, 0, 0 ]);
    });

    it('leaves a running journey alone when the same source asks for the same thing again', () =>
    {
      // Arrange
      ScreenLightingComposer.declareTone('command', new ToneDeclaration([ 100, 0, 0, 0 ], 4, 'command'));
      nextFrame();
      ScreenLightingComposer.compose();

      // Act
      ScreenLightingComposer.declareTone('command', new ToneDeclaration([ 100, 0, 0, 0 ], 4, 'command'));
      nextFrame();
      const result = ScreenLightingComposer.compose();

      // Assert
      // re-tinting to the colour already being travelled toward must not restart the fade.
      expect(result.tone()).toEqual([ 50, 0, 0, 0 ]);
    });
  });

  describe('ambient', () =>
  {
    it('reports the darkness a single source declared', () =>
    {
      // Arrange
      ScreenLightingComposer.declareAmbient('map', new AmbientDeclaration(0.6, [ 0, 0, 0 ], false, 'map'));

      // Act
      nextFrame();
      const result = ScreenLightingComposer.compose();

      // Assert
      expect(result.darkness()).toBeCloseTo(0.6, 10);
    });

    it('compounds darkness across sources rather than summing it', () =>
    {
      // Arrange
      ScreenLightingComposer.declareAmbient('map', new AmbientDeclaration(0.3, [ 0, 0, 0 ], false, 'map'));
      ScreenLightingComposer.declareAmbient('time', new AmbientDeclaration(0.4, [ 0, 0, 0 ], false, 'time'));

      // Act
      nextFrame();
      const result = ScreenLightingComposer.compose();

      // Assert
      // two ordinary evenings must never add up to a total blackout.
      expect(result.darkness()).toBeCloseTo(0.58, 10);
    });

    it('leaves the declaration alone when a source re-declares exactly the same darkness', () =>
    {
      // Arrange
      ScreenLightingComposer.declareAmbient('map', new AmbientDeclaration(0.6, [ 0, 0, 0 ], false, 'map'));
      const held = ScreenLightingComposer.compose;

      // Act
      ScreenLightingComposer.declareAmbient('map', new AmbientDeclaration(0.6, [ 0, 0, 0 ], false, 'map'));
      nextFrame();
      const result = ScreenLightingComposer.compose();

      // Assert
      // arriving on a map re-reads its note on every transfer, save load and return from the menu.
      expect(result.darkness()).toBeCloseTo(0.6, 10);
      expect(ScreenLightingComposer.compose).toBe(held);
    });

    it('takes on a genuinely different darkness from the same source', () =>
    {
      // Arrange
      ScreenLightingComposer.declareAmbient('map', new AmbientDeclaration(0.6, [ 0, 0, 0 ], false, 'map'));

      // Act
      ScreenLightingComposer.declareAmbient('map', new AmbientDeclaration(0.2, [ 0, 0, 0 ], false, 'map'));
      nextFrame();
      const result = ScreenLightingComposer.compose();

      // Assert
      expect(result.darkness()).toBeCloseTo(0.2, 10);
    });

    it('lets a place keep the colour of its own dark against a source that never stated one', () =>
    {
      // Arrange
      ScreenLightingComposer.declareAmbient('map', new AmbientDeclaration(0.85, [ 10, 42, 42 ], true, 'map'));
      ScreenLightingComposer.declareAmbient('time', new AmbientDeclaration(0.4, [ 0, 0, 0 ], false, 'time'));

      // Act
      nextFrame();
      const result = ScreenLightingComposer.compose();

      // Assert
      // the clock outranks the map on how dark it is, and has no business recolouring the cave.
      expect(result.ambientColor()).toEqual([ 10, 42, 42 ]);
    });

    it('hands the colour of the dark to the most assertive source that did state one', () =>
    {
      // Arrange
      ScreenLightingComposer.declareAmbient('map', new AmbientDeclaration(0.5, [ 10, 42, 42 ], true, 'map'));
      ScreenLightingComposer.declareAmbient('command', new AmbientDeclaration(0.2, [ 60, 0, 0 ], true, 'command'));

      // Act
      nextFrame();
      const result = ScreenLightingComposer.compose();

      // Assert
      expect(result.ambientColor()).toEqual([ 60, 0, 0 ]);
    });

    it('leaves the dark plain black when nobody has an opinion about its colour', () =>
    {
      // Arrange
      ScreenLightingComposer.declareAmbient('map', new AmbientDeclaration(0.5, [ 99, 99, 99 ], false, 'map'));

      // Act
      nextFrame();
      const result = ScreenLightingComposer.compose();

      // Assert
      expect(result.ambientColor()).toEqual([ 0, 0, 0 ]);
    });
  });

  describe('lights', () =>
  {
    it('gathers the lights of every source into one list', () =>
    {
      // Arrange
      const pageLight = new LightDeclaration(4, '#ffbb73', 0, 'steady', torch, 'page:1');
      const playerLight = new LightDeclaration(4.5, '#ffdca8', 0, 'flicker', lantern, 'player');
      ScreenLightingComposer.declareLights('page:1', [ pageLight ]);
      ScreenLightingComposer.declareLights('player', [ playerLight ]);

      // Act
      nextFrame();
      const result = ScreenLightingComposer.compose();

      // Assert
      expect(result.lights()).toHaveLength(2);
      expect(result.lights()).toContain(pageLight);
      expect(result.lights()).toContain(playerLight);
    });

    it('keeps the very same declarations when a source re-declares identical lights', () =>
    {
      // Arrange
      const original = [ new LightDeclaration(4, '#ffbb73', 0, 'steady', torch, 'page:1') ];
      ScreenLightingComposer.declareLights('page:1', original);

      // Act
      ScreenLightingComposer.declareLights('page:1', [ new LightDeclaration(4, '#ffbb73', 0, 'steady', torch, 'page:1') ]);
      nextFrame();
      const result = ScreenLightingComposer.compose();

      // Assert
      // page setup re-runs for every event whenever any self-switch flips, so this is the difference
      // between a room of torches standing still and being rebuilt several times a minute.
      expect(result.lights()[0]).toBe(original[0]);
    });

    it('takes on a genuinely different set of lights from the same source', () =>
    {
      // Arrange
      ScreenLightingComposer.declareLights('page:1', [ new LightDeclaration(4, '#ffbb73', 0, 'steady', torch, 'page:1') ]);

      // Act
      ScreenLightingComposer.declareLights('page:1', [ new LightDeclaration(8, '#ffbb73', 0, 'steady', torch, 'page:1') ]);
      nextFrame();
      const result = ScreenLightingComposer.compose();

      // Assert
      expect(result.lights()[0].radius()).toBe(8);
    });

    it('takes on a longer set of lights from a source that had fewer', () =>
    {
      // Arrange
      ScreenLightingComposer.declareLights('page:1', [ new LightDeclaration(4, '#ffbb73', 0, 'steady', torch, 'page:1') ]);

      // Act
      ScreenLightingComposer.declareLights('page:1', [
        new LightDeclaration(4, '#ffbb73', 0, 'steady', torch, 'page:1'),
        new LightDeclaration(2, '#ffffff', 0, 'steady', torch, 'page:1'), ]);
      nextFrame();
      const result = ScreenLightingComposer.compose();

      // Assert
      expect(result.lights()).toHaveLength(2);
    });

    it('replaces only the lights belonging to the declaring source', () =>
    {
      // Arrange
      const firstTorch = new LightDeclaration(4, '#ffbb73', 0, 'steady', torch, 'page:1');
      const playerLight = new LightDeclaration(4.5, '#ffdca8', 0, 'flicker', lantern, 'player');
      ScreenLightingComposer.declareLights('page:1', [ firstTorch ]);
      ScreenLightingComposer.declareLights('player', [ playerLight ]);

      // Act
      ScreenLightingComposer.declareLights('page:1', []);
      nextFrame();
      const result = ScreenLightingComposer.compose();

      // Assert
      // a torch going out must not take the lantern the player is holding with it.
      expect(result.lights()).toEqual([ playerLight ]);
    });
  });

  describe('removeDeclarations', () =>
  {
    it('withdraws everything one source had declared', () =>
    {
      // Arrange
      ScreenLightingComposer.declareAmbient('map', new AmbientDeclaration(0.6, [ 0, 0, 0 ], false, 'map'));
      ScreenLightingComposer.declareLights('map', [ new LightDeclaration(4, '#fff', 0, 'steady', torch, 'map') ]);

      // Act
      ScreenLightingComposer.removeDeclarations('map');
      nextFrame();
      const result = ScreenLightingComposer.compose();

      // Assert
      expect(result.darkness()).toBe(0);
      expect(result.lights()).toEqual([]);
    });

    it('takes as long to hand the screen back as the source it removed asked for', () =>
    {
      // Arrange
      ScreenLightingComposer.declareTone('command', new ToneDeclaration([ 100, 0, 0, 0 ], 4, 'command'));
      nextFrame();
      ScreenLightingComposer.compose();

      // Act
      // removing a source outright is the other way a tone goes away, and the departing declaration
      // is the only thing that still knows how long it wanted the journey home to take.
      ScreenLightingComposer.removeDeclarations('command');
      nextFrame();
      const result = ScreenLightingComposer.compose();

      // Assert
      // a quarter of the way home from 25, rather than the whole way a duration of 1 would give.
      expect(result.tone()
        .at(0)).toBeCloseTo(18.75, 10);
    });

    it('leaves every other source untouched', () =>
    {
      // Arrange
      ScreenLightingComposer.declareAmbient('map', new AmbientDeclaration(0.6, [ 0, 0, 0 ], false, 'map'));
      ScreenLightingComposer.declareAmbient('time', new AmbientDeclaration(0.4, [ 0, 0, 0 ], false, 'time'));

      // Act
      ScreenLightingComposer.removeDeclarations('map');
      nextFrame();
      const result = ScreenLightingComposer.compose();

      // Assert
      // the near-miss is the point: removal by source must not be removal of everything.
      expect(result.darkness()).toBeCloseTo(0.4, 10);
    });
  });

  describe('removeDeclarationKind', () =>
  {
    it('withdraws every source of the named kind', () =>
    {
      // Arrange
      ScreenLightingComposer.declareLights('page:1', [ new LightDeclaration(4, '#fff', 0, 'steady', torch, 'page:1') ]);
      ScreenLightingComposer.declareLights('page:2', [ new LightDeclaration(6, '#fff', 0, 'steady', torch, 'page:2') ]);

      // Act
      ScreenLightingComposer.removeDeclarationKind('page');
      nextFrame();
      const result = ScreenLightingComposer.compose();

      // Assert
      expect(result.lights()).toEqual([]);
    });

    it('leaves sources of other kinds burning', () =>
    {
      // Arrange
      const playerLight = new LightDeclaration(4.5, '#ffdca8', 0, 'flicker', lantern, 'player');
      ScreenLightingComposer.declareLights('page:1', [ new LightDeclaration(4, '#fff', 0, 'steady', torch, 'page:1') ]);
      ScreenLightingComposer.declareLights('player', [ playerLight ]);

      // Act
      ScreenLightingComposer.removeDeclarationKind('page');
      nextFrame();
      const result = ScreenLightingComposer.compose();

      // Assert
      // leaving a map puts its torches out; it does not take the player's lantern away.
      expect(result.lights()).toEqual([ playerLight ]);
    });
  });

  describe('source priority', () =>
  {
    it('ranks an unrecognised source below every known one', () =>
    {
      // Arrange
      ScreenLightingComposer.declareTone('typo', new ToneDeclaration([ 99, 0, 0, 0 ], 1, 'typo'));
      ScreenLightingComposer.declareTone('map', new ToneDeclaration([ 11, 0, 0, 0 ], 1, 'map'));

      // Act
      nextFrame();
      const result = ScreenLightingComposer.compose();

      // Assert
      // a typo composes politely rather than seizing the screen from everything else.
      expect(result.tone()).toEqual([ 11, 0, 0, 0 ]);
    });

    it('still ranks an unrecognised source lowest when it was declared last', () =>
    {
      // Arrange
      // declared in the opposite order on purpose: an unranked source resolves to a value that is
      // not a number, and arithmetic on one leaves a sort comparator unable to decide anything - so
      // the entries simply keep the order they arrived in and the previous case passes by luck.
      ScreenLightingComposer.declareTone('map', new ToneDeclaration([ 11, 0, 0, 0 ], 1, 'map'));
      ScreenLightingComposer.declareTone('typo', new ToneDeclaration([ 99, 0, 0, 0 ], 1, 'typo'));

      // Act
      nextFrame();
      const result = ScreenLightingComposer.compose();

      // Assert
      expect(result.tone()).toEqual([ 11, 0, 0, 0 ]);
    });

    it('ranks a keyed source by the kind in front of its colon', () =>
    {
      // Arrange
      ScreenLightingComposer.declareAmbient('page:9', new AmbientDeclaration(0.5, [ 7, 7, 7 ], true, 'page:9'));
      ScreenLightingComposer.declareAmbient('map', new AmbientDeclaration(0.5, [ 3, 3, 3 ], true, 'map'));

      // Act
      nextFrame();
      const result = ScreenLightingComposer.compose();

      // Assert
      // `page` outranks `map`, and carrying an event id must not change that.
      expect(result.ambientColor()).toEqual([ 7, 7, 7 ]);
    });
  });

  describe('reset', () =>
  {
    it('forgets every declaration it was holding', () =>
    {
      // Arrange
      ScreenLightingComposer.declareAmbient('map', new AmbientDeclaration(0.6, [ 0, 0, 0 ], false, 'map'));
      ScreenLightingComposer.declareTone('command', new ToneDeclaration([ 68, 0, 0, 0 ], 1, 'command'));

      // Act
      ScreenLightingComposer.reset();
      nextFrame();
      const result = ScreenLightingComposer.compose();

      // Assert
      expect(result.darkness()).toBe(0);
      expect(result.tone()).toEqual([ 0, 0, 0, 0 ]);
    });
  });
});
//endregion plugins/lighting/core/managers/screen-lighting-composer.test.js