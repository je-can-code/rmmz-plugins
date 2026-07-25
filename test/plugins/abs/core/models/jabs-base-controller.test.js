//region plugins/abs/core/models/jabs-base-controller.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * JABS_BaseController.js imports JABS_InputAdapter (to self-register on construction) and
 * JABS_Battler (JSDoc type only, unused at runtime). Both are mocked per the
 * "unit tier mocks all downstream file-external dependencies" convention.
 */
describe('JABS_BaseController (unit, all downstream dependencies mocked)', () =>
{
  /** @type {typeof import('../../../../../src/plugins/abs/core/models/JABS_BaseController.js').default} */
  let JABS_BaseController;
  let registerSpy;

  beforeAll(async () =>
  {
    vi.resetModules();
    registerSpy = vi.fn();
    vi.doMock('../../../../../src/plugins/abs/core/models/JABS_InputAdapter.js', () => ({
      default: class
      {
        static register(controller)
        {
          registerSpy(controller);
        }
      },
    }));
    vi.doMock('../../../../../src/plugins/abs/core/models/JABS_Battler.js', () => ({ default: class {} }));

    ({ default: JABS_BaseController } =
      await import('../../../../../src/plugins/abs/core/models/JABS_BaseController.js'));
  });

  beforeEach(() =>
  {
    registerSpy.mockReset();
  });

  describe('constructor', () =>
  {
    it('registers itself with the JABS_InputAdapter and defaults battler to null', () =>
    {
      const controller = new JABS_BaseController();

      expect(registerSpy).toHaveBeenCalledWith(controller);
      expect(controller.getBattler()).toBeNull();
    });
  });

  describe('setBattler()/getBattler()', () =>
  {
    it('assigns and retrieves a given battler', () =>
    {
      const controller = new JABS_BaseController();
      const battler = {};
      controller.setBattler(battler);

      expect(controller.getBattler()).toEqual(battler);
    });

    it('allows explicitly clearing the battler with null', () =>
    {
      const controller = new JABS_BaseController();
      controller.setBattler({});
      controller.setBattler(null);

      expect(controller.getBattler()).toBeNull();
    });

    it('throws when attempting to set the battler to undefined', () =>
    {
      const controller = new JABS_BaseController();

      expect(() => controller.setBattler(undefined)).toThrow();
    });
  });
});
//endregion plugins/abs/core/models/jabs-base-controller.test.js
