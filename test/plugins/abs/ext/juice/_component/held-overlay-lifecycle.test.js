//region plugins/abs/ext/juice/_component/held-overlay-lifecycle.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  installAbsHostGlobals,
  setPluginContextToJAbs,
  setPluginContextToJBase,
} from '../../../_component/fixtures/install-abs-host-globals.js';
import {
  installJMotionVersion,
  installJuiceExternalConfig,
  setPluginContextToJabsJuice,
} from './fixtures/install-abs-juice-host-globals.js';
import { installPluginManagerWithParams } from '../../../../../setup/install-plugin-manager-with-params.js';

/**
 * The whole held-overlay chain, with nothing between the plugin command and the sprite mocked out.
 *
 * The unit tests each prove one link. What none of them can prove is that the links join up: that a
 * command's string arguments survive parsing, reach a real `JuiceWeaponSwingOverlay`, produce a real
 * effect on a real `Sprite_Character` alias, and come back after the sprite under them is replaced.
 * That last part is the entire feature, and it only happens across four files at once.
 *
 * The arguments in these tests are copied verbatim from the Juice Oasis test map, so this fails if
 * that map would have failed.
 *
 * Only the engine's own drawing primitives are stood in for — `Sprite`, `ImageManager`, and a
 * `Sprite_Character` host to alias onto. Every J-* class here is the real one.
 */
describe('J-ABS-Juice held overlay lifecycle (real chain, engine primitives stubbed)', () =>
{
  /** @type {Map<string, Function>} */
  const registeredCommands = new Map();

  /** @type {Object} */
  let JuiceMotionManager;

  /** @type {Object} */
  let interpreter;

  /**
   * A stand-in for the engine's `Sprite`, holding just enough of Pixi's surface for an overlay.
   */
  class FakeSprite
  {
    constructor()
    {
      this.anchor = { x: 0, y: 0 };
      this.scale = { x: 1, y: 1 };
      this.children = [];
      this.transform = {};
      this.bitmap = null;
      this.opacity = 255;
      this.blendMode = 0;
      this.rotation = 0;
      this.x = 0;
      this.y = 0;
      this._frame = { x: 0, y: 0, width: 32, height: 32 };
      this.destroyed = false;
    }

    setFrame(x, y, width, height)
    {
      this._frame = { x, y, width, height };
    }

    addChild(child)
    {
      this.children.push(child);

      return child;
    }

    removeChild(child)
    {
      this.children = this.children.filter(existing => existing !== child);

      return child;
    }

    destroy()
    {
      this.destroyed = true;
      this.transform = null;
    }
  }

  /**
   * Builds a fresh character sprite for a character, the way a rebuilt spriteset would.
   * @param {object} character The character this sprite draws.
   * @returns {object} The sprite.
   */
  function buildCharacterSprite(character)
  {
    const sprite = new globalThis.Sprite_Character();

    sprite._character = character;

    return sprite;
  }

  /**
   * Runs a registered plugin command handler against the fake interpreter.
   * @param {string} commandName The command to run.
   * @param {object} args The command arguments, as strings.
   */
  function runCommand(commandName, args)
  {
    registeredCommands.get(commandName)
      .call(interpreter, args);
  }

  /**
   * The overlay children currently parented to a sprite.
   * @param {object} sprite The sprite to inspect.
   * @returns {object[]} Its children.
   */
  function overlaysOn(sprite)
  {
    return sprite.children;
  }

  beforeAll(async () =>
  {
    vi.resetModules();

    installAbsHostGlobals();

    setPluginContextToJBase();
    await import('../../../../../../src/plugins/_base/core/_metadata/initialization.js');

    setPluginContextToJAbs();
    await import('../../../../../../src/plugins/abs/core/_metadata/initialization.js');

    installPluginManagerWithParams(globalThis, 'J-ABS-Juice', {});
    installJuiceExternalConfig();
    installJMotionVersion();

    setPluginContextToJabsJuice();
    await import('../../../../../../src/plugins/abs/ext/juice/_metadata/initialization.js');

    // the engine's drawing primitives, and a Sprite_Character for this ship to alias onto.
    globalThis.Sprite = FakeSprite;
    globalThis.ImageManager = {
      iconWidth: 32,
      iconHeight: 32,
      loadSystem: () => ({ tag: 'IconSet' }),
    };

    class Sprite_Character extends FakeSprite
    {
      character()
      {
        return this._character;
      }

      patternHeight()
      {
        return 48;
      }

      update()
      {
      }
    }

    globalThis.Sprite_Character = Sprite_Character;

    // MotionTargetResolver arrives as a hoisted global from J-Motion's bundle in a real game, and
    // the real one goes in here for the same reason: it is what decides who `Player` means.
    const { default: MotionTargetResolver } =
      await import('../../../../../../src/plugins/motion/core/core/MotionTargetResolver.js');
    globalThis.MotionTargetResolver = MotionTargetResolver;

    // capture the handlers as they register, which is the only way a command is reachable.
    globalThis.PluginManager.registerCommand = (pluginName, commandName, handler) =>
    {
      registeredCommands.set(commandName, handler);
    };

    await import('../../../../../../src/plugins/abs/ext/juice/sprites/Sprite_Character.js');
    await import('../../../../../../src/plugins/abs/ext/juice/_metadata/pluginCommands.js');

    ({ default: JuiceMotionManager } =
      await import('../../../../../../src/plugins/abs/ext/juice/managers/JuiceMotionManager.js'));
  });

  beforeEach(() =>
  {
    interpreter = { eventId: () => 1 };

    // the Glowing Relic, which is what the Juice Oasis map raises.
    globalThis.$dataArmors = [ null, null, null, null, { id: 4, name: 'Glowing Relic', iconIndex: 315 } ];
    globalThis.$gamePlayer = {
      name: 'player',
      direction: () => 2,
    };

    JuiceMotionManager.clearAll();
  });

  /**
   * The exact arguments the Juice Oasis map's "raise the relic" choice hands over.
   * @type {object}
   */
  const RAISE_ARGS = {
    target: 'Player',
    targetId: '1',
    iconSource: 'Armor',
    iconId: '4',
    motion: 'present',
    duration: '30',
    repeats: '1',
    spanDegrees: '120',
    hold: 'true',
    sourceKey: 'cutscene',
  };

  /**
   * The exact arguments the map's "lower it" choice hands over.
   * @type {object}
   */
  const LOWER_ARGS = { target: 'Player', targetId: '1', sourceKey: 'cutscene' };

  describe('raising a held icon', () =>
  {
    it('puts the icon on the player sprite on its next frame', () =>
    {
      // Arrange
      const sprite = buildCharacterSprite(globalThis.$gamePlayer);

      // Act
      runCommand('applyOverlay', RAISE_ARGS);
      sprite.update();

      // Assert
      expect(overlaysOn(sprite)).toHaveLength(1);
    });

    it('slices the icon the named armor row points at', () =>
    {
      // Arrange: the Glowing Relic is icon 315, which on a 16-wide IconSet of 32px cells is
      // column 11 (315 % 16) and row 19 (315 / 16) - so 352 across and 608 down.
      const sprite = buildCharacterSprite(globalThis.$gamePlayer);

      // Act
      runCommand('applyOverlay', RAISE_ARGS);
      sprite.update();

      // Assert
      const [ overlay ] = overlaysOn(sprite);
      expect(overlay._frame.x).toEqual(352);
      expect(overlay._frame.y).toEqual(608);
    });

    it('does not stack a second icon on later frames', () =>
    {
      // Arrange
      const sprite = buildCharacterSprite(globalThis.$gamePlayer);
      runCommand('applyOverlay', RAISE_ARGS);

      // Act
      sprite.update();
      sprite.update();
      sprite.update();

      // Assert
      expect(overlaysOn(sprite)).toHaveLength(1);
    });

    it('lifts the icon over the head as the motion plays', () =>
    {
      // Arrange
      const sprite = buildCharacterSprite(globalThis.$gamePlayer);
      runCommand('applyOverlay', RAISE_ARGS);
      sprite.update();
      const [ overlay ] = overlaysOn(sprite);
      const restingY = overlay.y;

      // Act
      for (let frame = 0; frame < 30; frame++)
      {
        JuiceMotionManager.frameTick();
      }

      // Assert
      expect(overlay.y).toBeLessThan(restingY);
    });

    it('stays up long past the duration it took to get there', () =>
    {
      // Arrange
      const sprite = buildCharacterSprite(globalThis.$gamePlayer);
      runCommand('applyOverlay', RAISE_ARGS);
      sprite.update();

      // Act: ten times the 30-frame raise.
      for (let frame = 0; frame < 300; frame++)
      {
        JuiceMotionManager.frameTick();
        sprite.update();
      }

      // Assert
      expect(overlaysOn(sprite)).toHaveLength(1);
      expect(overlaysOn(sprite).at(0).destroyed).toEqual(false);
    });
  });

  describe('surviving a rebuilt map scene', () =>
  {
    it('puts the icon back on the replacement sprite', () =>
    {
      // Arrange: what closing the menu does - the old spriteset is torn down and a new one built.
      const oldSprite = buildCharacterSprite(globalThis.$gamePlayer);
      runCommand('applyOverlay', RAISE_ARGS);
      oldSprite.update();
      JuiceMotionManager.clearAll();
      oldSprite.destroy();

      const newSprite = buildCharacterSprite(globalThis.$gamePlayer);

      // Act
      newSprite.update();

      // Assert
      expect(overlaysOn(newSprite)).toHaveLength(1);
    });

    it('brings it back already raised rather than replaying the lift', () =>
    {
      // Arrange: raise it fully on the first sprite and remember where it ended up.
      const oldSprite = buildCharacterSprite(globalThis.$gamePlayer);
      runCommand('applyOverlay', RAISE_ARGS);
      oldSprite.update();
      for (let frame = 0; frame < 30; frame++)
      {
        JuiceMotionManager.frameTick();
      }
      const raisedY = overlaysOn(oldSprite).at(0).y;
      JuiceMotionManager.clearAll();
      oldSprite.destroy();

      // Act
      const newSprite = buildCharacterSprite(globalThis.$gamePlayer);
      newSprite.update();
      JuiceMotionManager.frameTick();

      // Assert
      expect(overlaysOn(newSprite).at(0).y).toBeCloseTo(raisedY, 6);
    });

    it('leaves a character holding nothing alone', () =>
    {
      // Arrange: every other character on the map goes through this same pull every frame.
      const bystander = buildCharacterSprite({ name: 'an-event', direction: () => 2 });

      // Act
      bystander.update();
      bystander.update();

      // Assert
      expect(overlaysOn(bystander)).toHaveLength(0);
    });
  });

  describe('lowering a held icon', () =>
  {
    it('takes the icon off the sprite', () =>
    {
      // Arrange
      const sprite = buildCharacterSprite(globalThis.$gamePlayer);
      runCommand('applyOverlay', RAISE_ARGS);
      sprite.update();

      // Act
      runCommand('removeOverlay', LOWER_ARGS);

      // Assert
      expect(overlaysOn(sprite)).toHaveLength(0);
    });

    it('does not let it come back on later frames', () =>
    {
      // Arrange: the pull runs every frame, so forgetting the request is the only thing that ends it.
      const sprite = buildCharacterSprite(globalThis.$gamePlayer);
      runCommand('applyOverlay', RAISE_ARGS);
      sprite.update();

      // Act
      runCommand('removeOverlay', LOWER_ARGS);
      sprite.update();
      JuiceMotionManager.frameTick();
      sprite.update();

      // Assert
      expect(overlaysOn(sprite)).toHaveLength(0);
    });

    it('does not let it come back on a rebuilt sprite either', () =>
    {
      // Arrange
      const oldSprite = buildCharacterSprite(globalThis.$gamePlayer);
      runCommand('applyOverlay', RAISE_ARGS);
      oldSprite.update();

      // Act
      runCommand('removeOverlay', LOWER_ARGS);
      JuiceMotionManager.clearAll();
      oldSprite.destroy();
      const newSprite = buildCharacterSprite(globalThis.$gamePlayer);
      newSprite.update();

      // Assert
      expect(overlaysOn(newSprite)).toHaveLength(0);
    });

    it('leaves another source still holding its own icon', () =>
    {
      // Arrange: the map's "two sources" event is exactly this.
      const sprite = buildCharacterSprite(globalThis.$gamePlayer);
      runCommand('applyOverlay', RAISE_ARGS);
      runCommand('applyOverlay', { ...RAISE_ARGS, sourceKey: 'alpha', iconSource: 'Icon Index', iconId: '87' });
      sprite.update();

      // Act
      runCommand('removeOverlay', LOWER_ARGS);
      sprite.update();

      // Assert
      expect(overlaysOn(sprite)).toHaveLength(1);
    });
  });

  describe('a one-shot overlay', () =>
  {
    it('tears itself down once its motion is over', () =>
    {
      // Arrange: the map's preset row uses exactly this shape.
      const sprite = buildCharacterSprite(globalThis.$gamePlayer);
      globalThis.SceneManager = { _scene: { isMapScene: () => true, _spriteset: { findTargetSprite: () => sprite } } };

      // Act
      runCommand('applyOverlay', { ...RAISE_ARGS, hold: 'false' });
      for (let frame = 0; frame <= 30; frame++)
      {
        JuiceMotionManager.frameTick();
      }

      // Assert
      expect(overlaysOn(sprite)).toHaveLength(0);
    });

    it('is not restored by the pull, because nothing recorded it', () =>
    {
      // Arrange
      const sprite = buildCharacterSprite(globalThis.$gamePlayer);
      globalThis.SceneManager = { _scene: { isMapScene: () => true, _spriteset: { findTargetSprite: () => sprite } } };
      runCommand('applyOverlay', { ...RAISE_ARGS, hold: 'false' });
      for (let frame = 0; frame <= 30; frame++)
      {
        JuiceMotionManager.frameTick();
      }

      // Act
      sprite.update();

      // Assert
      expect(overlaysOn(sprite)).toHaveLength(0);
    });
  });
});
//endregion plugins/abs/ext/juice/_component/held-overlay-lifecycle.test.js