//region plugins/pixel/ext/abs/_component/pixel-abs-remaining-branches.test.js
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  installPixelAbsExtHostGlobals,
  installPixelCoreHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJPixel,
  setPluginContextToJPixelAbsExt,
} from '../../../_component/fixtures/install-pixel-host-globals.js';

describe('J-ABS-Pixelistics remaining branch coverage (direct src import)', () =>
{
  let aiManager;
  let aliasMap;

  beforeAll(async () =>
  {
    vi.resetModules();

    installPixelCoreHostGlobals();

    setPluginContextToJBase();
    await import('../../../../../../src/plugins/_base/core/_metadata/initialization.js');

    setPluginContextToJPixel();
    await import('../../../../../../src/plugins/pixel/core/_metadata/initialization.js');

    ({ default: globalThis.PIXEL_CollisionManager } = await import('../../../../../../src/plugins/pixel/core/managers/PIXEL_CollisionManager.js'));
    globalThis.PIXEL_CollisionManager.initConfig();
    globalThis.PIXEL_CollisionManager.setupCollision();

    installPixelAbsExtHostGlobals();

    setPluginContextToJPixelAbsExt();
    await import('../../../../../../src/plugins/pixel/ext/abs/_metadata/initialization.js');

    // RPG_Enemy.hitboxSizeDataFromRaw reaches JsonMapper as a bare global, the way the concatenated
    // plugin bundle sees it; a raw src import has to supply it explicitly.
    ({ default: globalThis.JsonMapper } = await import('../../../../../../src/plugins/_base/core/_utilities/JsonMapper.js'));

    await import('../../../../../../src/plugins/pixel/ext/abs/database/RPG_Enemy.js');
    await import('../../../../../../src/plugins/pixel/ext/abs/managers/JABS_AiManager.js');
    await import('../../../../../../src/plugins/pixel/ext/abs/managers/JABS_Engine.js');
    await import('../../../../../../src/plugins/pixel/ext/abs/objects/Game_Player.js');

    aiManager = globalThis.JABS_AiManager;
    aliasMap = globalThis.J.PIXEL.EXT.ABS.Aliased;
  });

  describe('RPG_Enemy.hitboxSizeDataFromRaw', () =>
  {
    it('yields nothing for an absent override', () =>
    {
      // Arrange & Act & Assert- null is what the note reader returns when the tag is missing.
      expect(globalThis.RPG_Enemy.hitboxSizeDataFromRaw(null)).toBe(null);
    });

    it('yields nothing for an undefined override', () =>
    {
      // Arrange & Act & Assert
      expect(globalThis.RPG_Enemy.hitboxSizeDataFromRaw(undefined)).toBe(null);
    });

    it('expands a single number into a square hitbox', () =>
    {
      // Arrange & Act- the shorthand form is the common authoring case for round enemies.
      const result = globalThis.RPG_Enemy.hitboxSizeDataFromRaw('2');

      // Assert
      expect(result).toEqual({ widthTiles: 2, heightTiles: 2 });
    });

    it('rejects a non-positive shorthand size', () =>
    {
      // Arrange & Act- a zero-area hitbox would make the enemy unhittable, so it falls back instead.
      const result = globalThis.RPG_Enemy.hitboxSizeDataFromRaw('0');

      // Assert
      expect(result).toBe(null);
    });

    it('normalizes the rectangle form into width and height', () =>
    {
      // Arrange & Act
      const result = globalThis.RPG_Enemy.hitboxSizeDataFromRaw('[3,2]');

      // Assert
      expect(result).toEqual({ widthTiles: 3, heightTiles: 2 });
    });

    it('rejects a rectangle with a non-positive width', () =>
    {
      // Arrange & Act
      const result = globalThis.RPG_Enemy.hitboxSizeDataFromRaw('[0,2]');

      // Assert
      expect(result).toBe(null);
    });

    it('rejects a rectangle with a non-positive height', () =>
    {
      // Arrange & Act
      const result = globalThis.RPG_Enemy.hitboxSizeDataFromRaw('[3,0]');

      // Assert
      expect(result).toBe(null);
    });

    it('ignores a payload that is neither a number nor a rectangle', () =>
    {
      // Arrange & Act- a typo'd tag must degrade to the default footprint rather than crash.
      const result = globalThis.RPG_Enemy.hitboxSizeDataFromRaw('not-a-size');

      // Assert
      expect(result).toBe(null);
    });
  });

  describe('JABS_Engine.getBattlerAabbModel', () =>
  {
    it('prefers a character-supplied rectangular model', () =>
    {
      // Arrange- when an enemy declares its own rectangle that model is the single source of truth,
      // or combat collision and the drawn outline would disagree.
      const customAabb = { x: 1, y: 2, w: 3, h: 4 };
      const character = { getPixelAbsBattlerAabbModel: () => customAabb };

      // Act
      const result = globalThis.JABS_Engine.getBattlerAabbModel(character);

      // Assert
      expect(result).toBe(customAabb);
    });

    it('falls back to the original model when the character declares none', () =>
    {
      // Arrange
      const original = vi.fn(() => 'original-model');
      const realOriginal = aliasMap.JABS_Engine.get('getBattlerAabbModel');
      aliasMap.JABS_Engine.set('getBattlerAabbModel', original);
      const character = { getPixelAbsBattlerAabbModel: () => null };

      // Act
      const result = globalThis.JABS_Engine.getBattlerAabbModel(character);

      // Assert
      expect(result).toBe('original-model');

      aliasMap.JABS_Engine.set('getBattlerAabbModel', realOriginal);
    });

    it('falls back to the original model when no character was supplied at all', () =>
    {
      // Arrange- callers legitimately pass nothing while a battler is being torn down.
      const original = vi.fn(() => 'original-model');
      const realOriginal = aliasMap.JABS_Engine.get('getBattlerAabbModel');
      aliasMap.JABS_Engine.set('getBattlerAabbModel', original);

      // Act
      const result = globalThis.JABS_Engine.getBattlerAabbModel(null);

      // Assert
      expect(result).toBe('original-model');
      expect(original).toHaveBeenCalledWith(null);

      aliasMap.JABS_Engine.set('getBattlerAabbModel', realOriginal);
    });
  });

  describe('JABS_AiManager idle and homing', () =>
  {
    it('always allows idle movement, leaving pacing to the battler state machine', () =>
    {
      // Arrange & Act- the external frame gate is redundant now that the battler owns wait timing.
      const result = aiManager.canMoveIdly({});

      // Assert
      expect(result).toBe(true);
    });

    it('delegates idle movement to the pixel wander state machine', () =>
    {
      // Arrange- the tile-step moveRandom would advance only a single frame of distance.
      const battler = { updatePixelIdleWander: vi.fn() };

      // Act
      aiManager.moveIdly(battler);

      // Assert
      expect(battler.updatePixelIdleWander).toHaveBeenCalled();
    });

    it('steers a battler toward its home coordinates', () =>
    {
      // Arrange
      const battler = {
        smartMoveTowardCoordinates: vi.fn(),
        getHomeX: () => 4,
        getHomeY: () => 6,
        isHome: () => false,
        setIdle: vi.fn(),
      };

      // Act
      aiManager.goHome(battler);

      // Assert
      expect(battler.smartMoveTowardCoordinates).toHaveBeenCalledWith(4, 6);
      expect(battler.setIdle).not.toHaveBeenCalled();
    });

    it('flips a battler to idle once it has arrived home', () =>
    {
      // Arrange
      const battler = {
        smartMoveTowardCoordinates: vi.fn(),
        getHomeX: () => 4,
        getHomeY: () => 6,
        isHome: () => true,
        setIdle: vi.fn(),
      };

      // Act
      aiManager.goHome(battler);

      // Assert
      expect(battler.setIdle).toHaveBeenCalledWith(true);
    });

    it('snaps a leashed ally back to the player and clears its motion', () =>
    {
      // Arrange- leftover pixel velocity after a snap would make the ally drift away again.
      const character = { jumpToPlayer: vi.fn(), stopPixelMoving: vi.fn() };
      const ally = {
        getCharacter: () => character,
        lockEngagement: vi.fn(),
        disengageTarget: vi.fn(),
        resetAllAggro: vi.fn(),
        unlockEngagement: vi.fn(),
      };

      // Act
      aiManager.rubberbandAlly(ally);

      // Assert- engagement is locked across the reset so the ally cannot immediately re-target.
      expect(ally.lockEngagement).toHaveBeenCalled();
      expect(ally.disengageTarget).toHaveBeenCalled();
      expect(ally.resetAllAggro).toHaveBeenCalledWith(null, true);
      expect(ally.unlockEngagement).toHaveBeenCalled();
      expect(character.jumpToPlayer).toHaveBeenCalled();
      expect(character.stopPixelMoving).toHaveBeenCalled();
    });
  });

  describe('JABS_AiManager.moveTowardSlotIfNeeded', () =>
  {
    /**
     * Builds an ally battler positioned at a given point, able to move and not dodging.
     * @param {number} x The ally's x coordinate.
     * @param {number} y The ally's y coordinate.
     * @param {object} [overrides] Battler-level overrides.
     * @param {object} [characterOverrides] Character-level overrides.
     * @returns {{ally: object, character: object}}
     */
    const buildAlly = (x, y, overrides = {}, characterOverrides = {}) =>
    {
      const character = Object.assign({
        x,
        y,
        stopPixelMoving: vi.fn(),
        isPixelOnCooldown: () => false,
        setPixelMoveCooldown: vi.fn(),
      }, characterOverrides);

      const ally = Object.assign({
        getCharacter: () => character,
        isDodging: () => false,
        guarding: () => false,
        canBattlerMove: () => true,
        smartMoveTowardCoordinates: vi.fn(),
      }, overrides);

      return { ally, character };
    };

    it('yields to the dodge pipeline while dodging', () =>
    {
      // Arrange- the dodge owns the sprite until it ends; pulling toward formation would fight it.
      const { ally } = buildAlly(10, 10, { isDodging: () => true });

      // Act
      aiManager.moveTowardSlotIfNeeded(ally, 0, 0);

      // Assert
      expect(ally.smartMoveTowardCoordinates).not.toHaveBeenCalled();
    });

    it('does not pull a guarding ally out of position', () =>
    {
      // Arrange
      const { ally } = buildAlly(10, 10, { guarding: () => true });

      // Act
      aiManager.moveTowardSlotIfNeeded(ally, 0, 0);

      // Assert
      expect(ally.smartMoveTowardCoordinates).not.toHaveBeenCalled();
    });

    it('stops residual motion instead of micro-adjusting inside tolerance', () =>
    {
      // Arrange- already in the slot; nudging further would read as jitter.
      const { ally, character } = buildAlly(0, 0);

      // Act
      aiManager.moveTowardSlotIfNeeded(ally, 0, 0);

      // Assert
      expect(character.stopPixelMoving).toHaveBeenCalled();
      expect(ally.smartMoveTowardCoordinates).not.toHaveBeenCalled();
    });

    it('skips a nudge inside the near ring while the move cooldown is active', () =>
    {
      // Arrange- 0.6 sits between the 0.45 tolerance and the 0.70 near threshold.
      const { ally } = buildAlly(0.6, 0, {}, { isPixelOnCooldown: () => true });

      // Act
      aiManager.moveTowardSlotIfNeeded(ally, 0, 0);

      // Assert
      expect(ally.smartMoveTowardCoordinates).not.toHaveBeenCalled();
    });

    it('takes a throttled step inside the near ring and arms the cooldown', () =>
    {
      // Arrange
      const { ally, character } = buildAlly(0.6, 0);

      // Act
      aiManager.moveTowardSlotIfNeeded(ally, 0, 0);

      // Assert- the one-frame cooldown is what converts a slide into discrete steps.
      expect(ally.smartMoveTowardCoordinates).toHaveBeenCalledWith(0, 0);
      expect(character.setPixelMoveCooldown).toHaveBeenCalledWith(1);
    });

    it('does not step inside the near ring when the battler cannot move', () =>
    {
      // Arrange- a rooted or stunned ally still runs this path but must not be displaced.
      const { ally, character } = buildAlly(0.6, 0, { canBattlerMove: () => false });

      // Act
      aiManager.moveTowardSlotIfNeeded(ally, 0, 0);

      // Assert
      expect(ally.smartMoveTowardCoordinates).not.toHaveBeenCalled();
      expect(character.setPixelMoveCooldown).not.toHaveBeenCalled();
    });

    it('moves every frame without throttling when well outside the near ring', () =>
    {
      // Arrange- responsiveness matters more than smoothing once the ally is genuinely out of place.
      const { ally, character } = buildAlly(5, 5);

      // Act
      aiManager.moveTowardSlotIfNeeded(ally, 0, 0);

      // Assert
      expect(ally.smartMoveTowardCoordinates).toHaveBeenCalledWith(0, 0);
      expect(character.setPixelMoveCooldown).not.toHaveBeenCalled();
    });

    it('does not move a far-away ally that cannot move', () =>
    {
      // Arrange
      const { ally } = buildAlly(5, 5, { canBattlerMove: () => false });

      // Act
      aiManager.moveTowardSlotIfNeeded(ally, 0, 0);

      // Assert
      expect(ally.smartMoveTowardCoordinates).not.toHaveBeenCalled();
    });

    it('uses the ally AI formation tolerance when that extension is present', () =>
    {
      // Arrange- with a wide configured tolerance, a distance that would normally trigger a step now
      // counts as "in position", which is how the configured value proves it was actually read.
      const previousAllyAi = globalThis.J.ABS.EXT.ALLYAI;
      globalThis.J.ABS.EXT.ALLYAI = { Metadata: { FormationTolerance: 3 } };
      const { ally, character } = buildAlly(2, 0);

      // Act
      aiManager.moveTowardSlotIfNeeded(ally, 0, 0);

      // Assert
      expect(character.stopPixelMoving).toHaveBeenCalled();
      expect(ally.smartMoveTowardCoordinates).not.toHaveBeenCalled();

      globalThis.J.ABS.EXT.ALLYAI = previousAllyAi;
    });
  });

  describe('JABS_AiManager formation geometry', () =>
  {
    it('targets the centre of the slot tile rather than its corner', () =>
    {
      // Arrange & Act- the half-tile offset is what stops allies standing on tile seams.
      const [ sx, sy ] = aiManager.calculateFormationSlotCoordinates(10, 2, 20, -1);

      // Assert
      expect(sx).toBe(12.5);
      expect(sy).toBe(19.5);
    });

    it('reports an ally inside the tolerance ring as in position', () =>
    {
      // Arrange
      const ally = { getCharacter: () => ({ x: 0.3, y: 0.4 }) };

      // Act- the distance here is exactly 0.5.
      const result = aiManager.isWithinTolerance(ally, 0, 0, 0.5);

      // Assert- the comparison is inclusive, so sitting exactly on the ring counts as arrived.
      expect(result).toBe(true);
    });

    it('reports an ally outside the tolerance ring as out of position', () =>
    {
      // Arrange
      const ally = { getCharacter: () => ({ x: 3, y: 4 }) };

      // Act
      const result = aiManager.isWithinTolerance(ally, 0, 0, 0.5);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('Game_Player pivot guard', () =>
  {
    let previousJabsEngine;
    let previousGameTemp;
    let previousInput;

    /**
     * Builds a player stand-in wired for the pivot-guard paths.
     * @param {object} [overrides] Player-level overrides.
     * @returns {object}
     */
    const buildPlayer = (overrides = {}) => Object.assign({
      stopFollowersPixelMoving: vi.fn(),
      setMovePressed: vi.fn(),
      setMovementSuccess: vi.fn(),
      setDirection: vi.fn(),
      checkEventTriggerTouchFront: vi.fn(),
      getVectorInputAngle: () => null,
      angleToNearestDirection: angle => (angle === 90 ? 2 : 6),
      dir8ToAngle: () => 0,
      _dashing: true,

      // the source writes dash state through its setter now, so the double needs to answer for it.
      setDashing(dashing)
      {
        this._dashing = dashing;
      },
    }, overrides);

    /**
     * Installs a JABS engine whose player-1 battler wraps the given character.
     * @param {object} character The leader character.
     * @param {object} [battlerOverrides] Battler-level overrides.
     */
    const installJabsLeader = (character, battlerOverrides = {}) =>
    {
      const battler = Object.assign({
        getCharacter: () => character,
        canBattlerMove: () => true,
        guarding: () => false,
      }, battlerOverrides);

      globalThis.$jabsEngine = { getPlayer1: () => battler };
    };

    beforeEach(() =>
    {
      previousJabsEngine = globalThis.$jabsEngine;
      previousGameTemp = globalThis.$gameTemp;
      previousInput = globalThis.Input;

      globalThis.$gameTemp = { clearDestination: vi.fn() };
      globalThis.Input = { dir8: 0 };
    });

    afterEach(() =>
    {
      globalThis.$jabsEngine = previousJabsEngine;
      globalThis.$gameTemp = previousGameTemp;
      globalThis.Input = previousInput;
    });

    it('performs original movement when there is no JABS engine yet', () =>
    {
      // Arrange- the title screen and boot sequence run before JABS exists.
      const original = vi.fn();
      const realOriginal = aliasMap.Game_Player.get('moveByInput');
      aliasMap.Game_Player.set('moveByInput', original);
      globalThis.$jabsEngine = null;
      const player = buildPlayer();

      // Act
      globalThis.Game_Player.prototype.moveByInput.call(player);

      // Assert
      expect(original).toHaveBeenCalled();

      aliasMap.Game_Player.set('moveByInput', realOriginal);
    });

    it('performs original movement for a character that is not the party leader', () =>
    {
      // Arrange- followers run this same prototype method but must not consult the leader's guard.
      const original = vi.fn();
      const realOriginal = aliasMap.Game_Player.get('moveByInput');
      aliasMap.Game_Player.set('moveByInput', original);
      installJabsLeader({ someOtherCharacter: true }, { guarding: () => true });
      const player = buildPlayer();

      // Act
      globalThis.Game_Player.prototype.moveByInput.call(player);

      // Assert
      expect(original).toHaveBeenCalled();

      aliasMap.Game_Player.set('moveByInput', realOriginal);
    });

    it('performs original movement when the leader is free to move', () =>
    {
      // Arrange
      const original = vi.fn();
      const realOriginal = aliasMap.Game_Player.get('moveByInput');
      aliasMap.Game_Player.set('moveByInput', original);
      const player = buildPlayer();
      installJabsLeader(player);

      // Act
      globalThis.Game_Player.prototype.moveByInput.call(player);

      // Assert
      expect(original).toHaveBeenCalled();

      aliasMap.Game_Player.set('moveByInput', realOriginal);
    });

    it('blocks map motion while the leader is guarding', () =>
    {
      // Arrange- pixel movement applies steps before JABS can veto them, so the block has to happen
      // here rather than downstream.
      const original = vi.fn();
      const realOriginal = aliasMap.Game_Player.get('moveByInput');
      aliasMap.Game_Player.set('moveByInput', original);
      const player = buildPlayer();
      installJabsLeader(player, { guarding: () => true });

      // Act
      globalThis.Game_Player.prototype.moveByInput.call(player);

      // Assert
      expect(original).not.toHaveBeenCalled();
      expect(globalThis.$gameTemp.clearDestination).toHaveBeenCalled();
      expect(player.stopFollowersPixelMoving).toHaveBeenCalled();
      expect(player.setMovePressed).toHaveBeenCalledWith(false);
      expect(player.setMovementSuccess).toHaveBeenCalledWith(false);

      aliasMap.Game_Player.set('moveByInput', realOriginal);
    });

    it('blocks map motion while the leader is unable to move', () =>
    {
      // Arrange
      const original = vi.fn();
      const realOriginal = aliasMap.Game_Player.get('moveByInput');
      aliasMap.Game_Player.set('moveByInput', original);
      const player = buildPlayer();
      installJabsLeader(player, { canBattlerMove: () => false });

      // Act
      globalThis.Game_Player.prototype.moveByInput.call(player);

      // Assert
      expect(original).not.toHaveBeenCalled();

      aliasMap.Game_Player.set('moveByInput', realOriginal);
    });

    it('still pivots to face the analog bearing while blocked', () =>
    {
      // Arrange- pivot guard is one input: motion is locked, but facing must still follow the stick.
      const player = buildPlayer({ getVectorInputAngle: () => 90 });
      installJabsLeader(player, { guarding: () => true });

      // Act
      globalThis.Game_Player.prototype.moveByInput.call(player);

      // Assert
      expect(player.setDirection).toHaveBeenCalledWith(2);
      expect(player.checkEventTriggerTouchFront).toHaveBeenCalledWith(2);
    });

    it('falls back to keyboard direction for facing when there is no analog bearing', () =>
    {
      // Arrange
      globalThis.Input = { dir8: 4 };
      const player = buildPlayer({ dir8ToAngle: () => 90 });
      installJabsLeader(player, { guarding: () => true });

      // Act
      globalThis.Game_Player.prototype.moveByInput.call(player);

      // Assert
      expect(player.setDirection).toHaveBeenCalledWith(2);
    });

    it('does not pivot when no directional input is being held', () =>
    {
      // Arrange- standing still while guarding must not reset facing to an arbitrary direction.
      globalThis.Input = { dir8: 0 };
      const player = buildPlayer();
      installJabsLeader(player, { guarding: () => true });

      // Act
      globalThis.Game_Player.prototype.moveByInput.call(player);

      // Assert
      expect(player.setDirection).not.toHaveBeenCalled();
    });

    it('does not pivot when the resolved facing direction is not valid', () =>
    {
      // Arrange- a zero from the angle resolver means "no direction", not "face right".
      const player = buildPlayer({
        getVectorInputAngle: () => 45,
        angleToNearestDirection: () => 0,
      });
      installJabsLeader(player, { guarding: () => true });

      // Act
      globalThis.Game_Player.prototype.moveByInput.call(player);

      // Assert
      expect(player.setDirection).not.toHaveBeenCalled();
    });

    it('suppresses dashing while the leader is pivot-guarding', () =>
    {
      // Arrange- click-to-move would otherwise re-assert the dash flag every frame.
      const original = vi.fn();
      const realOriginal = aliasMap.Game_Player.get('updateDashing');
      aliasMap.Game_Player.set('updateDashing', original);
      const player = buildPlayer();
      installJabsLeader(player, { guarding: () => true });

      // Act
      globalThis.Game_Player.prototype.updateDashing.call(player);

      // Assert
      expect(player._dashing).toBe(false);
      expect(original).not.toHaveBeenCalled();

      aliasMap.Game_Player.set('updateDashing', realOriginal);
    });

    it('suppresses dashing while the leader is barred from moving at all', () =>
    {
      // Arrange- the movement lock is the other half of the pivot-guard condition and stands on its
      // own; guarding is off here so nothing but the lock can be suppressing the dash.
      const original = vi.fn();
      const realOriginal = aliasMap.Game_Player.get('updateDashing');
      aliasMap.Game_Player.set('updateDashing', original);
      const player = buildPlayer();
      installJabsLeader(player, { canBattlerMove: () => false });

      // Act
      globalThis.Game_Player.prototype.updateDashing.call(player);

      // Assert
      expect(player._dashing).toBe(false);
      expect(original).not.toHaveBeenCalled();

      aliasMap.Game_Player.set('updateDashing', realOriginal);
    });

    it('performs original dash logic when the pivot-guarded leader is some other character', () =>
    {
      // Arrange- a thoroughly pivot-guarded leader that happens to be driving somebody else. the
      // guard belongs to whoever the engine leader actually is, so with both halves of the guard
      // condition on, character identity is the only thing that can stand it down here.
      const original = vi.fn();
      const realOriginal = aliasMap.Game_Player.get('updateDashing');
      aliasMap.Game_Player.set('updateDashing', original);
      const player = buildPlayer();
      installJabsLeader({ someOtherCharacter: true }, {
        canBattlerMove: () => false,
        guarding: () => true,
      });

      // Act
      globalThis.Game_Player.prototype.updateDashing.call(player);

      // Assert
      expect(original).toHaveBeenCalled();

      aliasMap.Game_Player.set('updateDashing', realOriginal);
    });

    it('performs original dash logic when the leader is free', () =>
    {
      // Arrange
      const original = vi.fn();
      const realOriginal = aliasMap.Game_Player.get('updateDashing');
      aliasMap.Game_Player.set('updateDashing', original);
      const player = buildPlayer();
      installJabsLeader(player);

      // Act
      globalThis.Game_Player.prototype.updateDashing.call(player);

      // Assert
      expect(original).toHaveBeenCalled();

      aliasMap.Game_Player.set('updateDashing', realOriginal);
    });

    it('performs original dash logic when there is no JABS engine yet', () =>
    {
      // Arrange
      const original = vi.fn();
      const realOriginal = aliasMap.Game_Player.get('updateDashing');
      aliasMap.Game_Player.set('updateDashing', original);
      globalThis.$jabsEngine = null;
      const player = buildPlayer();

      // Act
      globalThis.Game_Player.prototype.updateDashing.call(player);

      // Assert
      expect(original).toHaveBeenCalled();

      aliasMap.Game_Player.set('updateDashing', realOriginal);
    });
  });
});
//endregion plugins/pixel/ext/abs/_component/pixel-abs-remaining-branches.test.js
