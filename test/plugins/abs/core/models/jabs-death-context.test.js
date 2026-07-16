//region plugins/abs/core/models/jabs-death-context.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * JABS_DeathContext.js imports JABS_AiManager only to resolve the killer battler by uuid in
 * `killer()`. Mocked per the "unit tier mocks all downstream file-external dependencies" convention.
 */
describe('JABS_DeathContext (unit, all downstream dependencies mocked)', () =>
{
  /** @type {typeof import('../../../../../src/plugins/abs/core/models/JABS_DeathContext.js').default} */
  let JABS_DeathContext;
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

    ({ default: JABS_DeathContext } = await import('../../../../../src/plugins/abs/core/models/JABS_DeathContext.js'));
  });

  beforeEach(() =>
  {
    getBattlerByUuidMock.mockReset();
  });

  describe('constructor/initMembers()', () =>
  {
    it('assigns all four constructor arguments', () =>
    {
      const context = new JABS_DeathContext([ 1, 2 ], 'physical', 3, 'killer-uuid');

      expect(context.elementIds).toEqual([ 1, 2 ]);
      expect(context.hitType).toEqual('physical');
      expect(context.stypeId).toEqual(3);
      expect(context.killerUuid).toEqual('killer-uuid');
    });
  });

  describe('isPhysical()/isMagical()/isCertain()', () =>
  {
    it('reports physical for a physical hit type', () =>
    {
      const context = new JABS_DeathContext([], 'physical', 0, 'uuid');

      expect(context.isPhysical()).toEqual(true);
      expect(context.isMagical()).toEqual(false);
      expect(context.isCertain()).toEqual(false);
    });

    it('reports magical for a magical hit type', () =>
    {
      const context = new JABS_DeathContext([], 'magical', 0, 'uuid');

      expect(context.isMagical()).toEqual(true);
    });

    it('reports certain for a certain hit type', () =>
    {
      const context = new JABS_DeathContext([], 'certain', 0, 'uuid');

      expect(context.isCertain()).toEqual(true);
    });
  });

  describe('hasElement()', () =>
  {
    it('returns true when the element id is present', () =>
    {
      const context = new JABS_DeathContext([ 1, 2, 3 ], 'physical', 0, 'uuid');

      expect(context.hasElement(2)).toEqual(true);
    });

    it('returns false when the element id is absent', () =>
    {
      const context = new JABS_DeathContext([ 1, 2, 3 ], 'physical', 0, 'uuid');

      expect(context.hasElement(99)).toEqual(false);
    });
  });

  describe('killer()', () =>
  {
    it('resolves the killer battler via the ai manager by uuid', () =>
    {
      const killerBattler = { uuid: 'killer-uuid' };
      getBattlerByUuidMock.mockReturnValue(killerBattler);
      const context = new JABS_DeathContext([], 'physical', 0, 'killer-uuid');

      expect(context.killer()).toEqual(killerBattler);
      expect(getBattlerByUuidMock).toHaveBeenCalledWith('killer-uuid');
    });
  });
});
//endregion plugins/abs/core/models/jabs-death-context.test.js
