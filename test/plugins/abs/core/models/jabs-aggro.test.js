//region plugins/abs/core/models/jabs-aggro.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * JABS_Aggro.js imports JABS_AiManager only to resolve the owning battler by uuid in
 * `isForLivingActor()`. Mocked per the "unit tier mocks all downstream file-external dependencies"
 * convention rather than pulling in the real (heavier) manager module.
 */
describe('JABS_Aggro (unit, all downstream dependencies mocked)', () =>
{
  /** @type {typeof import('../../../../../src/plugins/abs/core/models/JABS_Aggro.js').default} */
  let JABS_Aggro;
  let getBattlerByUuidMock;

  beforeAll(async () =>
  {
    vi.resetModules();
    getBattlerByUuidMock = vi.fn();
    vi.doMock('../../../../../src/plugins/abs/core/managers/JABS_AiManager.js', () => ({
      default: class
      {
        static getBattlerByUuid(uuid)
        {
          return getBattlerByUuidMock(uuid);
        }
      },
    }));

    ({ default: JABS_Aggro } = await import('../../../../../src/plugins/abs/core/models/JABS_Aggro.js'));
  });

  beforeEach(() =>
  {
    getBattlerByUuidMock.mockReset();
  });

  describe('constructor/initialize()', () =>
  {
    it('assigns the battler uuid and defaults aggro to 0, unlocked', () =>
    {
      const aggro = new JABS_Aggro('the-uuid');

      expect(aggro.uuid()).toEqual('the-uuid');
      expect(aggro.aggro).toEqual(0);
      expect(aggro.locked).toEqual(false);
    });
  });

  describe('lock()/unlock()', () =>
  {
    it('locks and unlocks the aggro', () =>
    {
      const aggro = new JABS_Aggro('uuid');
      aggro.lock();
      expect(aggro.locked).toEqual(true);

      aggro.unlock();
      expect(aggro.locked).toEqual(false);
    });
  });

  describe('resetAggro()', () =>
  {
    it('resets aggro back to 0', () =>
    {
      const aggro = new JABS_Aggro('uuid');
      aggro.setAggro(50);
      aggro.resetAggro();

      expect(aggro.aggro).toEqual(0);
    });

    it('does nothing while locked unless forced', () =>
    {
      const aggro = new JABS_Aggro('uuid');
      aggro.setAggro(50);
      aggro.lock();
      aggro.resetAggro();

      expect(aggro.aggro).toEqual(50);
    });

    it('resets even while locked when forced', () =>
    {
      const aggro = new JABS_Aggro('uuid');
      aggro.setAggro(50, true);
      aggro.lock();
      aggro.resetAggro(true);

      expect(aggro.aggro).toEqual(0);
    });
  });

  describe('setAggro()', () =>
  {
    it('sets the aggro to the given value', () =>
    {
      const aggro = new JABS_Aggro('uuid');
      aggro.setAggro(30);

      expect(aggro.aggro).toEqual(30);
    });

    it('does nothing while locked unless forced', () =>
    {
      const aggro = new JABS_Aggro('uuid');
      aggro.lock();
      aggro.setAggro(30);

      expect(aggro.aggro).toEqual(0);
    });
  });

  describe('modAggro()', () =>
  {
    it('modifies the aggro by the given amount', () =>
    {
      const aggro = new JABS_Aggro('uuid');
      aggro.modAggro(10);
      aggro.modAggro(5);

      expect(aggro.aggro).toEqual(15);
    });

    it('clamps aggro at a floor of 0', () =>
    {
      const aggro = new JABS_Aggro('uuid');
      aggro.modAggro(-10);

      expect(aggro.aggro).toEqual(0);
    });

    it('does nothing while locked unless forced', () =>
    {
      const aggro = new JABS_Aggro('uuid');
      aggro.lock();
      aggro.modAggro(10);

      expect(aggro.aggro).toEqual(0);
    });
  });

  describe('isForLivingActor()', () =>
  {
    it('returns false when no battler is found for the uuid', () =>
    {
      getBattlerByUuidMock.mockReturnValue(undefined);
      const aggro = new JABS_Aggro('missing');
      aggro.setAggro(10);

      expect(aggro.isForLivingActor()).toEqual(false);
    });

    it('returns false when the resolved battler is not an actor', () =>
    {
      getBattlerByUuidMock.mockReturnValue({ isActor: () => false, isDead: () => false });
      const aggro = new JABS_Aggro('uuid');
      aggro.setAggro(10);

      expect(aggro.isForLivingActor()).toEqual(false);
    });

    it('returns false when the resolved actor is dead', () =>
    {
      getBattlerByUuidMock.mockReturnValue({ isActor: () => true, isDead: () => true });
      const aggro = new JABS_Aggro('uuid');
      aggro.setAggro(10);

      expect(aggro.isForLivingActor()).toEqual(false);
    });

    it('returns false when aggro is not above 0', () =>
    {
      getBattlerByUuidMock.mockReturnValue({ isActor: () => true, isDead: () => false });
      const aggro = new JABS_Aggro('uuid');

      expect(aggro.isForLivingActor()).toEqual(false);
    });

    it('returns true for a living actor with positive aggro', () =>
    {
      getBattlerByUuidMock.mockReturnValue({ isActor: () => true, isDead: () => false });
      const aggro = new JABS_Aggro('uuid');
      aggro.setAggro(10);

      expect(aggro.isForLivingActor()).toEqual(true);
    });
  });
});
//endregion plugins/abs/core/models/jabs-aggro.test.js
