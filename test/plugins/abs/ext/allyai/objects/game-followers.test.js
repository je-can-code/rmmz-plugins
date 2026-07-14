//region plugins/abs/ext/allyai/objects/game-followers.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('J-ABS-AllyAI Game_Followers (unit, all downstream dependencies mocked)', () =>
{
  let originalShow;
  let originalHide;

  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = { ABS: { EXT: { ALLYAI: { Aliased: { Game_Followers: new Map() } } } } };

    function Game_Followers()
    {
    }

    originalShow = vi.fn();
    originalHide = vi.fn();
    Game_Followers.prototype.show = originalShow;
    Game_Followers.prototype.hide = originalHide;
    globalThis.Game_Followers = Game_Followers;

    await import('../../../../../../src/plugins/abs/ext/allyai/objects/Game_Followers.js');
  });

  beforeEach(() =>
  {
    originalShow.mockReset();
    originalHide.mockReset();
    globalThis.$gameMap = { updateAllies: vi.fn(), _interpreter: { isRunning: () => true } };
    globalThis.$jabsEngine = { requestJabsMenuRefresh: false };
    globalThis.$gamePlayer = { isJumping: () => true, getJabsBattler: () => ({}), deltaXFrom: vi.fn(() => 1), deltaYFrom: vi.fn(() => 2) };
  });

  function buildFollowers()
  {
    return Object.create(globalThis.Game_Followers.prototype);
  }

  describe('show', () =>
  {
    it('performs the original logic then updates allies and requests a menu refresh', () =>
    {
      const followers = buildFollowers();
      followers.show();
      expect(originalShow).toHaveBeenCalledTimes(1);
      expect(globalThis.$gameMap.updateAllies).toHaveBeenCalledTimes(1);
      expect(globalThis.$jabsEngine.requestJabsMenuRefresh).toBe(true);
    });
  });

  describe('hide', () =>
  {
    it('performs the original logic then updates allies and requests a menu refresh', () =>
    {
      const followers = buildFollowers();
      followers.hide();
      expect(originalHide).toHaveBeenCalledTimes(1);
      expect(globalThis.$gameMap.updateAllies).toHaveBeenCalledTimes(1);
      expect(globalThis.$jabsEngine.requestJabsMenuRefresh).toBe(true);
    });
  });

  describe('jumpAll', () =>
  {
    function buildFollower(overrides = {})
    {
      return Object.assign({
        x: 0,
        y: 0,
        isVisible: () => true,
        getJabsBattler: () => ({ isEngaged: () => false }),
        jump: vi.fn(),
      }, overrides);
    }

    it('does nothing when the player is not jumping', () =>
    {
      globalThis.$gamePlayer.isJumping = () => false;
      const follower = buildFollower();
      const followers = buildFollowers();
      followers._data = [ follower ];

      followers.jumpAll();

      expect(follower.jump).not.toHaveBeenCalled();
    });

    it('jumps every eligible follower', () =>
    {
      const follower1 = buildFollower();
      const follower2 = buildFollower();
      const followers = buildFollowers();
      followers._data = [ follower1, follower2 ];

      followers.jumpAll();

      expect(follower1.jump).toHaveBeenCalledWith(1, 2);
      expect(follower2.jump).toHaveBeenCalledWith(1, 2);
    });

    it('KNOWN BUG: an invisible/missing follower aborts the ENTIRE jumpAll pass, not just that one follower- the skip checks use `return` instead of `continue` inside the for-of loop', () =>
    {
      const invisibleFollower = buildFollower({ isVisible: () => false });
      const eligibleFollower = buildFollower();
      const followers = buildFollowers();
      followers._data = [ invisibleFollower, eligibleFollower ];

      followers.jumpAll();

      expect(eligibleFollower.jump).not.toHaveBeenCalled();
    });

    it('KNOWN BUG: an engaged follower earlier in the list also aborts jumps for every follower after it', () =>
    {
      const engagedFollower = buildFollower({ getJabsBattler: () => ({ isEngaged: () => true }) });
      const eligibleFollower = buildFollower();
      const followers = buildFollowers();
      followers._data = [ engagedFollower, eligibleFollower ];

      followers.jumpAll();

      expect(eligibleFollower.jump).not.toHaveBeenCalled();
    });
  });

  describe('setDirectionFixAll', () =>
  {
    function buildFollower(overrides = {})
    {
      return Object.assign({
        getJabsBattler: () => ({ isEngaged: () => false }),
        setDirection: vi.fn(),
      }, overrides);
    }

    it('skips (via continue, correctly) a null follower entry without aborting the rest', () =>
    {
      const eligibleFollower = buildFollower();
      const followers = buildFollowers();
      followers._data = [ null, eligibleFollower ];

      expect(() => followers.setDirectionFixAll(true)).not.toThrow();
      expect(eligibleFollower.setDirection).toHaveBeenCalledWith(true);
    });

    it('correctly uses forEach (not a bug here) so an engaged follower only skips itself, not the rest', () =>
    {
      const engagedFollower = buildFollower({ getJabsBattler: () => ({ isEngaged: () => true }) });
      const eligibleFollower = buildFollower();
      const followers = buildFollowers();
      followers._data = [ engagedFollower, eligibleFollower ];

      followers.setDirectionFixAll(true);

      expect(engagedFollower.setDirection).not.toHaveBeenCalled();
      expect(eligibleFollower.setDirection).toHaveBeenCalledWith(true);
    });

    it('skips followers without a jabs battler', () =>
    {
      const follower = buildFollower({ getJabsBattler: () => null });
      const followers = buildFollowers();
      followers._data = [ follower ];

      followers.setDirectionFixAll(true);

      expect(follower.setDirection).not.toHaveBeenCalled();
    });

    it('does not set direction while no map interpreter event is running', () =>
    {
      globalThis.$gameMap._interpreter.isRunning = () => false;
      const follower = buildFollower();
      const followers = buildFollowers();
      followers._data = [ follower ];

      followers.setDirectionFixAll(true);

      expect(follower.setDirection).not.toHaveBeenCalled();
    });
  });
});
//endregion plugins/abs/ext/allyai/objects/game-followers.test.js
