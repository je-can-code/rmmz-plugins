//region plugins/pixel/ext/abs/game-event-hitbox-size.test.js
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { loadPixelAbsStackPluginVm } from '../../pixel-vm.js';

describe('J-ABS-Pixelistics enemy hitbox size', () =>
{
  let sandbox;

  beforeAll(() =>
  {
    sandbox = { console };
    loadPixelAbsStackPluginVm(sandbox);
  });

  afterAll(() =>
  {
    sandbox = null;
  });

  /**
   * Creates hydrated enemy note data for the given id.
   * @param {number} enemyId The enemy id.
   * @param {string} note The note payload to apply.
   * @returns {RPG_Enemy}
   */
  const seedEnemyData = function(enemyId, note)
  {
    const enemyData = Object.create(sandbox.RPG_Enemy.prototype);
    enemyData.id = enemyId;
    enemyData.note = note;
    sandbox.$dataEnemies[enemyId] = enemyData;
    return enemyData;
  };

  /**
   * Creates a battler event with the provided enemy id and comments.
   * @param {number} enemyId The battler enemy id.
   * @param {string[]} comments The current page comments.
   * @returns {Game_Event}
   */
  const createEnemyEvent = function(enemyId, comments = [])
  {
    const commandList = comments.map((comment, index) => ({
      code: index === 0 ? 108 : 408,
      parameters: [ comment ],
    }));

    const event = new sandbox.Game_Event();
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
  };

  it('prefers event comments over enemy notes and normalizes square shorthand', () =>
  {
    seedEnemyData(1, '<hitboxSize:[1.25, 0.75]>');
    const event = createEnemyEvent(1, [ '<hitboxSize:1.50>' ]);

    expect(event.getPixelAbsHitboxSizeData()).toEqual({
      widthTiles: 1.5,
      heightTiles: 1.5,
    });

    expect(event.getCollisionPivotY()).toBe(1.0);
    expect(event._pixelHitbox(event.getEffectiveRadius())).toEqual({
      w: 1.5,
      h: 1.5,
      hx: -0.75,
      hy: -1.5,
    });

    const tileAabb = event.getPixelAbsHitboxTileAabb();
    expect(tileAabb.left).toBeCloseTo(4.75);
    expect(tileAabb.top).toBeCloseTo(5.5);
    expect(tileAabb.right).toBeCloseTo(6.25);
    expect(tileAabb.bottom).toBeCloseTo(7.0);

    const screenAabb = sandbox.JABS_Engine.getBattlerAabbModel(event);
    expect(screenAabb.x).toBeCloseTo(228);
    expect(screenAabb.y).toBeCloseTo(264);
    expect(screenAabb.w).toBeCloseTo(72);
    expect(screenAabb.h).toBeCloseTo(72);
  });

  it('falls back to enemy notes and preserves explicit rectangles', () =>
  {
    seedEnemyData(2, '<hitboxSize:[1.25, 0.75]>');
    const event = createEnemyEvent(2);

    expect(event.getPixelAbsHitboxSizeData()).toEqual({
      widthTiles: 1.25,
      heightTiles: 0.75,
    });

    const tileAabb = event.getPixelAbsHitboxTileAabb();
    expect(tileAabb.width).toBeCloseTo(1.25);
    expect(tileAabb.height).toBeCloseTo(0.75);

    const screenAabb = sandbox.JABS_Engine.getBattlerAabbModel(event);
    expect(screenAabb.w).toBeCloseTo(60);
    expect(screenAabb.h).toBeCloseTo(36);
  });

  it('falls back to plugin defaults when neither comments nor enemy notes define a size', () =>
  {
    seedEnemyData(3, '');
    const event = createEnemyEvent(3);

    expect(event.getPixelAbsHitboxSizeData()).toEqual({
      widthTiles: 0.8,
      heightTiles: 0.5,
    });

    const screenAabb = sandbox.JABS_Engine.getBattlerAabbModel(event);
    expect(screenAabb.w).toBeCloseTo(38.4);
    expect(screenAabb.h).toBeCloseTo(24);
  });

  it('resolves hitbox reveal range by event override before enemy note and default', () =>
  {
    seedEnemyData(4, '<hitboxReveal:5.50>');
    const event = createEnemyEvent(4, [ '<hitboxReveal:2.25>' ]);

    expect(event.getPixelAbsHitboxRevealRange()).toBe(2.25);

    sandbox.$gamePlayer.x = 6.0;
    sandbox.$gamePlayer.y = 6.0;
    expect(event.canShowPixelAbsHitboxReveal()).toBe(true);

    sandbox.$gamePlayer.x = 8.0;
    sandbox.$gamePlayer.y = 6.0;
    expect(event.canShowPixelAbsHitboxReveal()).toBe(false);
  });

  it('uses the default reveal range and respects always-active override', () =>
  {
    seedEnemyData(5, '');
    const event = createEnemyEvent(5);

    expect(event.getPixelAbsHitboxRevealRange()).toBe(6.0);

    sandbox.$gamePlayer.x = 20.0;
    sandbox.$gamePlayer.y = 20.0;
    expect(event.canShowPixelAbsHitboxReveal()).toBe(false);

    sandbox.J.PIXEL.EXT.ABS.Metadata.DefaultEnemyHitboxRevealRange = 0;
    event.refreshPixelAbsHitboxRevealRange();
    expect(event.canShowPixelAbsHitboxReveal()).toBe(false);

    sandbox.J.PIXEL.EXT.ABS.Metadata.EnemyHitboxOutlineAlwaysActive = true;
    expect(event.canShowPixelAbsHitboxReveal()).toBe(true);

    sandbox.J.PIXEL.EXT.ABS.Metadata.EnemyHitboxOutlineAlwaysActive = false;
    sandbox.J.PIXEL.EXT.ABS.Metadata.DefaultEnemyHitboxRevealRange = 6.0;
    event.refreshPixelAbsHitboxRevealRange();
  });

  it('uses the same pivot-aware body collision space for players and custom enemy hitboxes', () =>
  {
    seedEnemyData(6, '<hitboxSize:1.50>');
    const event = createEnemyEvent(6);
    sandbox.$gameMap.events = function()
    {
      return [ event ];
    };

    const player = sandbox.$gamePlayer;
    const playerRadius = player.getEffectiveRadius();

    // this location used to false-positive because the player body was compared in raw logical space
    // while the enemy used the feet-anchored rectangle.
    player.x = 6.2;
    player.y = 6.8;
    expect(player.isCharacterCollisionAt(player.x, player.y, playerRadius)).toBe(false);

    // this location genuinely overlaps the enemy body and should still block.
    player.x = 5.2;
    player.y = 5.8;
    expect(player.isCharacterCollisionAt(player.x, player.y, playerRadius)).toBe(true);
  });
});
//endregion plugins/pixel/ext/abs/game-event-hitbox-size.test.js