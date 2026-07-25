//region plugins/pixel/ext/abs/_component/game-event-hitbox-size.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import {
  installPixelAbsExtHostGlobals,
  installPixelCoreHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJPixel,
  setPluginContextToJPixelAbsExt,
} from '../../../_component/fixtures/install-pixel-host-globals.js';

/**
 * Creates hydrated enemy note data for the given id.
 * @param {number} enemyId The enemy id.
 * @param {string} note The note payload to apply.
 * @returns {object}
 */
function seedEnemyData(enemyId, note)
{
  const enemyData = Object.create(globalThis.RPG_Enemy.prototype);
  enemyData.id = enemyId;
  enemyData.note = note;
  globalThis.$dataEnemies[enemyId] = enemyData;
  return enemyData;
}

/**
 * Creates a battler event with the provided enemy id and comments.
 * @param {number} enemyId The battler enemy id.
 * @param {string[]} comments The current page comments.
 * @returns {object}
 */
function createEnemyEvent(enemyId, comments = [])
{
  const commandList = comments.map((comment, index) => ({
    code: index === 0 ? 108 : 408,
    parameters: [ comment ],
  }));

  const event = new globalThis.Game_Event();
  event.initMembers();
  event.x = 5;
  event.y = 6;
  event._jabsBattler = true;
  event._battlerId = enemyId;
  event.getJabsBattler = function()
  {
    return {
      isInvincible()
      {
        return false;
      },
    };
  };
  event.page = function()
  {
    return { list: commandList };
  };
  event.list = function()
  {
    return commandList;
  };
  event.setupPageSettings();
  return event;
}

describe('J-ABS-Pixelistics enemy hitbox size (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installPixelCoreHostGlobals();

    setPluginContextToJBase();
    await import('../../../../../../src/plugins/_base/_metadata/initialization.js');

    ({ default: globalThis.RPGManager } = await import('../../../../../../src/plugins/_base/managers/RPGManager.js'));
    ({ default: globalThis.JsonMapper } = await import('../../../../../../src/plugins/_base/_utilities/JsonMapper.js'));

    setPluginContextToJPixel();
    await import('../../../../../../src/plugins/pixel/core/_metadata/initialization.js');

    // patches globalThis.Game_Character.prototype with distanceFromPlayer(), which ext/abs's own
    // Game_Event.js relies on for hitbox-reveal-range gating.
    await import('../../../../../../src/plugins/_base/objects/Game_Character.js');

    // patches globalThis.Game_Event.prototype with the real getValidCommentCommands()/
    // extractValueByRegex()- the shared pixel fixture's placeholders are dead stand-ins that never
    // actually get exercised once this real implementation is loaded, same as the shipped runtime.
    await import('../../../../../../src/plugins/_base/objects/Game_Event.js');

    // patches the core pixel prototype chain directly, no vm involved.
    await import('../../../../../../src/plugins/pixel/core/objects/Game_CharacterBase.js');
    await import('../../../../../../src/plugins/pixel/core/objects/Game_Character.js');
    await import('../../../../../../src/plugins/pixel/core/objects/Game_Event.js');
    await import('../../../../../../src/plugins/pixel/core/objects/Game_Player.js');

    installPixelAbsExtHostGlobals();

    setPluginContextToJPixelAbsExt();
    await import('../../../../../../src/plugins/pixel/ext/abs/_metadata/initialization.js');

    // patches the ext/abs prototype chain directly, no vm involved.
    await import('../../../../../../src/plugins/pixel/ext/abs/database/RPG_Enemy.js');
    await import('../../../../../../src/plugins/pixel/ext/abs/objects/Game_CharacterBase.js');
    await import('../../../../../../src/plugins/pixel/ext/abs/objects/Game_Event.js');
    await import('../../../../../../src/plugins/pixel/ext/abs/objects/Game_Player.js');

    // extends the fake JABS_Engine.getBattlerAabbModel stub with the real hitbox-aware override-
    // custom PIXEL hitbox data becomes the single source of truth for a character's AABB.
    await import('../../../../../../src/plugins/pixel/ext/abs/managers/JABS_Engine.js');

    globalThis.$gamePlayer = new globalThis.Game_Player();
    globalThis.$gamePlayer.initMembers();
    globalThis.$gamePlayer._followers = { _data: [] };
  });

  it('prefers event comments over enemy notes and normalizes square shorthand', () =>
  {
    // Arrange
    seedEnemyData(1, '<hitboxSize:[1.25, 0.75]>');
    const event = createEnemyEvent(1, [ '<hitboxSize:1.50>' ]);

    // Act
    const sizeData = event.getPixelAbsHitboxSizeData();

    // Assert
    expect(sizeData).toEqual({ widthTiles: 1.5, heightTiles: 1.5 });
  });

  it('positions the collision pivot at the feet for a normalized square hitbox', () =>
  {
    // Arrange
    seedEnemyData(1, '<hitboxSize:[1.25, 0.75]>');
    const event = createEnemyEvent(1, [ '<hitboxSize:1.50>' ]);

    // Act
    const pivotY = event.getCollisionPivotY();

    // Assert
    expect(pivotY).toBe(1.0);
  });

  it('builds the feet-anchored pixel hitbox rectangle for a normalized square hitbox', () =>
  {
    // Arrange
    seedEnemyData(1, '<hitboxSize:[1.25, 0.75]>');
    const event = createEnemyEvent(1, [ '<hitboxSize:1.50>' ]);

    // Act
    const hitbox = event._pixelHitbox(event.getEffectiveRadius());

    // Assert
    expect(hitbox).toEqual({ w: 1.5, h: 1.5, hx: -0.75, hy: -1.5 });
  });

  it('builds the tile-space AABB for a normalized square hitbox', () =>
  {
    // Arrange
    seedEnemyData(1, '<hitboxSize:[1.25, 0.75]>');
    const event = createEnemyEvent(1, [ '<hitboxSize:1.50>' ]);

    // Act
    const tileAabb = event.getPixelAbsHitboxTileAabb();

    // Assert
    expect(tileAabb.left).toBeCloseTo(4.75);
    expect(tileAabb.top).toBeCloseTo(5.5);
    expect(tileAabb.right).toBeCloseTo(6.25);
    expect(tileAabb.bottom).toBeCloseTo(7.0);
  });

  it('builds the screen-space AABB for a normalized square hitbox', () =>
  {
    // Arrange
    seedEnemyData(1, '<hitboxSize:[1.25, 0.75]>');
    const event = createEnemyEvent(1, [ '<hitboxSize:1.50>' ]);

    // Act
    const screenAabb = globalThis.JABS_Engine.getBattlerAabbModel(event);

    // Assert
    expect(screenAabb.x).toBeCloseTo(228);
    expect(screenAabb.y).toBeCloseTo(264);
    expect(screenAabb.w).toBeCloseTo(72);
    expect(screenAabb.h).toBeCloseTo(72);
  });

  it('falls back to the enemy note rectangle when the event has no comment override', () =>
  {
    // Arrange
    seedEnemyData(2, '<hitboxSize:[1.25, 0.75]>');
    const event = createEnemyEvent(2);

    // Act
    const sizeData = event.getPixelAbsHitboxSizeData();

    // Assert
    expect(sizeData).toEqual({ widthTiles: 1.25, heightTiles: 0.75 });
  });

  it('preserves the explicit rectangle dimensions in the tile AABB', () =>
  {
    // Arrange
    seedEnemyData(2, '<hitboxSize:[1.25, 0.75]>');
    const event = createEnemyEvent(2);

    // Act
    const tileAabb = event.getPixelAbsHitboxTileAabb();

    // Assert
    expect(tileAabb.width).toBeCloseTo(1.25);
    expect(tileAabb.height).toBeCloseTo(0.75);
  });

  it('preserves the explicit rectangle dimensions in the screen AABB', () =>
  {
    // Arrange
    seedEnemyData(2, '<hitboxSize:[1.25, 0.75]>');
    const event = createEnemyEvent(2);

    // Act
    const screenAabb = globalThis.JABS_Engine.getBattlerAabbModel(event);

    // Assert
    expect(screenAabb.w).toBeCloseTo(60);
    expect(screenAabb.h).toBeCloseTo(36);
  });

  it('falls back to plugin defaults when neither comments nor enemy notes define a size', () =>
  {
    // Arrange
    seedEnemyData(3, '');
    const event = createEnemyEvent(3);

    // Act
    const sizeData = event.getPixelAbsHitboxSizeData();

    // Assert
    expect(sizeData).toEqual({ widthTiles: 0.8, heightTiles: 0.5 });
  });

  it('uses the plugin default dimensions in the screen AABB when untagged', () =>
  {
    // Arrange
    seedEnemyData(3, '');
    const event = createEnemyEvent(3);

    // Act
    const screenAabb = globalThis.JABS_Engine.getBattlerAabbModel(event);

    // Assert
    expect(screenAabb.w).toBeCloseTo(38.4);
    expect(screenAabb.h).toBeCloseTo(24);
  });

  describe('hitbox reveal range resolution', () =>
  {
    it('prefers the event comment override over the enemy note and default', () =>
    {
      // Arrange
      seedEnemyData(4, '<hitboxReveal:5.50>');
      const event = createEnemyEvent(4, [ '<hitboxReveal:2.25>' ]);

      // Act
      const revealRange = event.getPixelAbsHitboxRevealRange();

      // Assert
      expect(revealRange).toBe(2.25);
    });

    it('shows the reveal outline when the player is within the resolved range', () =>
    {
      // Arrange
      seedEnemyData(4, '<hitboxReveal:5.50>');
      const event = createEnemyEvent(4, [ '<hitboxReveal:2.25>' ]);
      globalThis.$gamePlayer.x = 6.0;
      globalThis.$gamePlayer.y = 6.0;

      // Act
      const result = event.canShowPixelAbsHitboxReveal();

      // Assert
      expect(result).toBe(true);
    });

    it('hides the reveal outline when the player is outside the resolved range', () =>
    {
      // Arrange
      seedEnemyData(4, '<hitboxReveal:5.50>');
      const event = createEnemyEvent(4, [ '<hitboxReveal:2.25>' ]);
      globalThis.$gamePlayer.x = 8.0;
      globalThis.$gamePlayer.y = 6.0;

      // Act
      const result = event.canShowPixelAbsHitboxReveal();

      // Assert
      expect(result).toBe(false);
    });

    it('uses the plugin default reveal range when untagged', () =>
    {
      // Arrange
      seedEnemyData(5, '');
      const event = createEnemyEvent(5);

      // Act
      const revealRange = event.getPixelAbsHitboxRevealRange();

      // Assert
      expect(revealRange).toBe(6.0);
    });

    it('hides the reveal outline when the player is beyond the default range', () =>
    {
      // Arrange
      seedEnemyData(5, '');
      const event = createEnemyEvent(5);
      globalThis.$gamePlayer.x = 20.0;
      globalThis.$gamePlayer.y = 20.0;

      // Act
      const result = event.canShowPixelAbsHitboxReveal();

      // Assert
      expect(result).toBe(false);
    });

    it('always shows the reveal outline when EnemyHitboxOutlineAlwaysActive is set, even at 0 range', () =>
    {
      // Arrange
      seedEnemyData(5, '');
      const event = createEnemyEvent(5);
      globalThis.$gamePlayer.x = 20.0;
      globalThis.$gamePlayer.y = 20.0;
      globalThis.J.PIXEL.EXT.ABS.Metadata.DefaultEnemyHitboxRevealRange = 0;
      event.refreshPixelAbsHitboxRevealRange();
      globalThis.J.PIXEL.EXT.ABS.Metadata.EnemyHitboxOutlineAlwaysActive = true;

      // Act
      const result = event.canShowPixelAbsHitboxReveal();

      // Assert
      expect(result).toBe(true);
      globalThis.J.PIXEL.EXT.ABS.Metadata.EnemyHitboxOutlineAlwaysActive = false;
      globalThis.J.PIXEL.EXT.ABS.Metadata.DefaultEnemyHitboxRevealRange = 6.0;
    });
  });

  it('uses the same pivot-aware body collision space for players and custom enemy hitboxes', () =>
  {
    // Arrange- this location used to false-positive because the player body was compared in raw
    // logical space while the enemy used the feet-anchored rectangle.
    seedEnemyData(6, '<hitboxSize:1.50>');
    const event = createEnemyEvent(6);
    globalThis.$gameMap.events = function()
    {
      return [ event ];
    };
    const player = globalThis.$gamePlayer;
    const playerRadius = player.getEffectiveRadius();
    player.x = 6.2;
    player.y = 6.8;

    // Act
    const result = player.isCharacterCollisionAt(player.x, player.y, playerRadius);

    // Assert
    expect(result).toBe(false);
  });

  it('blocks movement at a location that genuinely overlaps the enemy body', () =>
  {
    // Arrange
    seedEnemyData(6, '<hitboxSize:1.50>');
    const event = createEnemyEvent(6);
    globalThis.$gameMap.events = function()
    {
      return [ event ];
    };
    const player = globalThis.$gamePlayer;
    const playerRadius = player.getEffectiveRadius();
    player.x = 5.2;
    player.y = 5.8;

    // Act
    const result = player.isCharacterCollisionAt(player.x, player.y, playerRadius);

    // Assert
    expect(result).toBe(true);
  });
});
//endregion plugins/pixel/ext/abs/_component/game-event-hitbox-size.test.js
